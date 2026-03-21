import { useState, useEffect, useMemo, type FunctionComponent } from "react";
import { useSearchParams } from "react-router-dom";
import { format, parseISO, addMinutes, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale/es";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { showAlert } from "@/lib/alerts";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

import type {
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  Service,
  Session,
  SessionStatus,
  Staff,
  UpdateSessionDTO,
} from "@/services/types";
import {
  SessionStatusCodes,
  AppointmentStatusCodes,
  type SessionStatusCode,
} from "@/services/catalogCodes";
import Autocomplete from "@mui/material/Autocomplete";
import Alert from "@mui/material/Alert";
import Swal from "sweetalert2";
import Tooltip from "@mui/material/Tooltip";
import { generateReservationPDF } from "@/utils/reservationsExport";
import { formatRut } from "@/utils/rut";

const fmtDate = (dt: string) => {
  try {
    const utcDateStr =
      dt.includes("T") && dt.endsWith("Z") ? dt : `${dt.replace(" ", "T")}Z`;

    return format(parseISO(utcDateStr), "dd MMM yyyy, HH:mm", { locale: es });
  } catch {
    return dt;
  }
};

const getStatusColor = (
  statusName: string,
): "info" | "success" | "error" | "default" => {
  switch (statusName) {
    case "En tratamiento":
      return "info";
    case "Finalizada":
      return "success";
    case "Cancelada":
      return "error";
    default:
      return "default";
  }
};

const getSessionStatusColor = (
  status: string,
): "info" | "primary" | "success" | "error" | "warning" | "default" => {
  switch (status) {
    case "Agendada":
      return "info";
    case "Confirmada":
      return "primary";
    case "Realizada":
      return "success";
    case "Cancelada por paciente":
      return "error";
    case "Cancelada por profesional":
      return "warning";
    case "Finalizada":
      return "success";
    default:
      return "default";
  }
};

interface SessionModalProps {
  session: Session | null;
  staffList: Staff[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const SessionModal: FunctionComponent<SessionModalProps> = ({
  session,
  staffList,
  open,
  onClose,
  onSaved,
}) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "reschedule" | "close">("view");

  const [startDT, setStartDT] = useState("");
  const [endDT, setEndDT] = useState("");
  const [staff, setStaff] = useState<Staff | null>(null);

  const [closeStatus, setCloseStatus] = useState<SessionStatusCode | "">("");
  const [closeNotes, setCloseNotes] = useState("");

  const availableRescheduleStaff = useMemo(() => {
    return staffList.filter((st) => {
      if (!st.is_active) return false;
      return st.specialties?.some((sp) => sp.id === session?.specialty_id);
    });
  }, [staffList, session]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSessionDTO) =>
      api.updateSession(session!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["laser-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["laser-patients"] });
      onSaved();
      onClose();
    },
    onError: (err: any) => showAlert.error("Error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["laser-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["laser-patients"] });
      onSaved();
      onClose();
    },
    onError: (err: any) => showAlert.error("Error", err.message),
  });

  useEffect(() => {
    if (session && open) {
      setMode("view");
      setStartDT(
        format(parseISO(session.start_date_time), "yyyy-MM-dd'T'HH:mm"),
      );
      setEndDT(format(parseISO(session.end_date_time), "yyyy-MM-dd'T'HH:mm"));
      setStaff(
        availableRescheduleStaff.find((st) => st.id === session.staff_id) ||
          null,
      );
      setCloseNotes("");
      setCloseStatus("");
    }
  }, [availableRescheduleStaff, session, open]);

  const saveReschedule = () => {
    updateMutation.mutate({
      staff_id: staff?.id,
      start_date_time: new Date(startDT).toISOString(),
      end_date_time: new Date(endDT).toISOString(),
    });
  };

  const { data: sessionStatuses = [] } = useQuery<SessionStatus[]>({
    queryKey: ["sessionStatuses"],
    queryFn: api.getSessionStatuses,
  });

  const saveClose = () => {
    const statusId = sessionStatuses.find((s) => s.code === closeStatus)?.id;
    if (!statusId)
      return showAlert.error("Error", "Estado de sesión no encontrado");

    updateMutation.mutate({
      status_id: statusId,
      close_notes: closeNotes || undefined,
    });
  };

  if (!session) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} disableEnforceFocus>
      <Box
        sx={{
          width: { xs: "100vw", sm: 400 },
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Sesión #{session.session_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {session.service_name} — {session.patient_name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {mode === "view" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Estado
              </Typography>
              <Box>
                <Chip
                  size="small"
                  label={session.session_status}
                  color={getSessionStatusColor(session.session_status)}
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Especialista
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {session.staff_name}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Inicio
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {fmtDate(session.start_date_time)}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Fin
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {fmtDate(session.end_date_time)}
              </Typography>

              {session.estimated_duration_minutes && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Duración est.
                  </Typography>
                  <Typography variant="body2">
                    {session.estimated_duration_minutes} min
                  </Typography>
                </>
              )}
            </Box>

            {session.notes && (
              <Box sx={{ bgcolor: "grey.50", p: 1.5, borderRadius: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  Notas
                </Typography>
                <Typography variant="body2">{session.notes}</Typography>
              </Box>
            )}

            {session.close_notes && (
              <Box sx={{ bgcolor: "warning.50", p: 1.5, borderRadius: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  Nota de cierre
                </Typography>
                <Typography variant="body2">{session.close_notes}</Typography>
              </Box>
            )}

            {![
              "Realizada",
              "Finalizada",
              "Cancelada por paciente",
              "Cancelada por profesional",
            ].includes(session.session_status) && (
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setMode("reschedule")}
                >
                  📅 Reagendar sesión
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => {
                    setCloseStatus(SessionStatusCodes.FINALIZED);
                    setMode("close");
                  }}
                >
                  ✅ Finalizar sesión
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={deleteMutation.isPending}
                  onClick={async () => {
                    if (
                      await showAlert.confirm(
                        "Eliminar sesión",
                        "¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer.",
                        "Eliminar",
                      )
                    ) {
                      deleteMutation.mutate(session.id);
                    }
                  }}
                >
                  🗑️ Eliminar sesión
                </Button>
              </Box>
            )}
          </Box>
        )}

        {mode === "reschedule" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Reagendar sesión
            </Typography>

            <Autocomplete
              value={staff}
              options={availableRescheduleStaff}
              onChange={(_, newValue: Staff | null) => {
                setStaff(newValue);
              }}
              getOptionLabel={(option) => option.full_name}
              renderInput={(params) => (
                <TextField {...params} label="Especialista" />
              )}
            />

            <DateTimePicker
              label="Inicio *"
              ampm
              value={startDT ? new Date(startDT) : null}
              disablePast
              onChange={(newValue) => {
                if (newValue) {
                  const startStr = format(newValue, "yyyy-MM-dd'T'HH:mm");
                  setStartDT(startStr);

                  const currentEnd = endDT ? new Date(endDT) : null;
                  if (!currentEnd || newValue >= currentEnd) {
                    const duration = 30;
                    const newEnd = addMinutes(newValue, duration);

                    setEndDT(format(newEnd, "yyyy-MM-dd'T'HH:mm"));
                  }
                } else {
                  setStartDT("");
                }
              }}
              slotProps={{
                textField: { fullWidth: true },
              }}
            />

            <DateTimePicker
              label="Fin *"
              ampm
              value={endDT ? new Date(endDT) : null}
              onChange={(newValue) => {
                setEndDT(
                  newValue ? format(newValue, "yyyy-MM-dd'T'HH:mm") : "",
                );
              }}
              disabled={!startDT}
              minDateTime={
                startDT ? addMinutes(new Date(startDT), 5) : undefined
              }
              slotProps={{
                textField: { fullWidth: true },
              }}
            />

            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Button variant="outlined" onClick={() => setMode("view")}>
                Volver
              </Button>
              <Button
                variant="contained"
                disabled={updateMutation.isPending}
                onClick={saveReschedule}
                sx={{ flex: 1 }}
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar horario"}
              </Button>
            </Box>
          </Box>
        )}

        {mode === "close" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {closeStatus === SessionStatusCodes.FINALIZED
                ? "Finalizar sesión"
                : "Cancelar sesión"}
            </Typography>
            <TextField
              multiline
              rows={3}
              label={
                closeStatus === SessionStatusCodes.FINALIZED
                  ? "Comentarios de finalización"
                  : "Comentarios de cancelación"
              }
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              fullWidth
            />
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Button variant="outlined" onClick={() => setMode("view")}>
                Volver
              </Button>
              <Button
                variant="contained"
                color={
                  closeStatus === SessionStatusCodes.FINALIZED
                    ? "success"
                    : "error"
                }
                disabled={updateMutation.isPending}
                onClick={saveClose}
                sx={{ flex: 1 }}
              >
                {updateMutation.isPending
                  ? "Guardando..."
                  : closeStatus === SessionStatusCodes.FINALIZED
                    ? "Confirmar finalización"
                    : "Confirmar cancelación"}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

interface AddSessionModalProps {
  appointment: Appointment | null;
  staffList: Staff[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const AddSessionModal: FunctionComponent<AddSessionModalProps> = ({
  appointment,
  staffList,
  open,
  onClose,
  onSaved,
}) => {
  const queryClient = useQueryClient();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [startDT, setStartDT] = useState("");
  const [endDT, setEndDT] = useState("");
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState("");

  const availableRescheduleStaff = useMemo(() => {
    return staffList.filter((st) => {
      if (!st.is_active) return false;
      return st.specialties?.some((sp) => sp.id === appointment?.specialty_id);
    });
  }, [staffList, appointment]);

  useEffect(() => {
    if (startDT && endDT) {
      const duration = differenceInMinutes(new Date(endDT), new Date(startDT));
      setDuration(duration);
    }
  }, [startDT, endDT]);

  const checkConflict = (staff: Staff | null, start: string, end: string) => {
    if (!staff || !start || !end || !appointment?.sessions) return false;
    const newStart = new Date(start);
    const newEnd = new Date(end);
    return appointment.sessions.some((s) => {
      if (String(s.staff_id) !== String(staff.id)) return false;
      const eStart = new Date(s.start_date_time);
      const eEnd = new Date(s.end_date_time);
      return newStart < eEnd && newEnd > eStart;
    });
  };

  const addMutation = useMutation({
    mutationFn: () =>
      api.addSession(appointment!.id, {
        staff_id: staff?.id ?? "",
        start_date_time: new Date(startDT).toISOString(),
        end_date_time: new Date(endDT).toISOString(),
        estimated_duration_minutes: duration,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["laser-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["laser-patients"] });
      onSaved();
      onClose();
    },
    onError: (err: any) => showAlert.error("Error", err.message),
  });

  const onSubmitAddSession = () => {
    const hasConflict = checkConflict(staff, startDT, endDT);

    if (hasConflict) {
      Swal.fire({
        title: "¿Estás seguro?",
        text: "Uno o más especialistas ya tienen sesiones en esos horarios. ¿Deseas agendar de todas formas?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, agendar",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          addMutation.mutate();
        }
      });
      return;
    }

    addMutation.mutate();
  };

  if (!appointment) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} disableEnforceFocus>
      <Box
        sx={{
          width: { xs: "100vw", sm: 400 },
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Nueva Sesión
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {appointment.service_name} — {appointment.patient_name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Autocomplete
            value={staff}
            options={availableRescheduleStaff}
            onChange={(_, newValue: Staff | null) => {
              setStaff(newValue);
            }}
            getOptionLabel={(option) => option.full_name}
            renderInput={(params) => (
              <TextField {...params} label="Especialista *" />
            )}
          />

          <DateTimePicker
            label="Inicio *"
            ampm
            value={startDT ? new Date(startDT) : null}
            onChange={(newValue) => {
              if (newValue) {
                const startStr = format(newValue, "yyyy-MM-dd'T'HH:mm");
                setStartDT(startStr);
                if (endDT && newValue >= new Date(endDT)) {
                  const newEnd = addMinutes(newValue, 30);
                  setEndDT(format(newEnd, "yyyy-MM-dd'T'HH:mm"));
                }
              } else {
                setStartDT("");
              }
            }}
            slotProps={{
              textField: { fullWidth: true },
            }}
          />

          <DateTimePicker
            label="Fin *"
            ampm
            value={endDT ? new Date(endDT) : null}
            onChange={(newValue) => {
              if (newValue) {
                const endStr = format(newValue, "yyyy-MM-dd'T'HH:mm");
                setEndDT(endStr);
              } else {
                setEndDT("");
              }
            }}
            disabled={!startDT}
            minDateTime={startDT ? new Date(startDT) : undefined}
            slotProps={{
              textField: { fullWidth: true },
            }}
          />

          <TextField
            label="Duración estimada"
            value={`${duration} minutos`}
            fullWidth
            disabled
          />

          <TextField
            multiline
            rows={3}
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
          />

          {/* Alerta de conflicto de horario de staff */}
          {staff &&
            startDT &&
            endDT &&
            checkConflict(staff, startDT, endDT) && (
              <Alert
                severity="warning"
                sx={{ py: 0, "& .MuiAlert-message": { py: 1 } }}
              >
                Este especialista tiene otra sesión en ese horario.
              </Alert>
            )}

          {/* Alerta de orden cronológico */}
          {startDT &&
            appointment.sessions &&
            appointment.sessions.some(
              (s) => new Date(startDT) < new Date(s.start_date_time),
            ) && (
              <Alert
                severity="error"
                sx={{ py: 0, "& .MuiAlert-message": { py: 1 } }}
              >
                Esta sesión no puede comenzar antes que la sesión{" "}
                {appointment.sessions.findIndex(
                  (s) => new Date(startDT) < new Date(s.start_date_time),
                ) + 1}
                .
              </Alert>
            )}

          <Button
            variant="contained"
            disabled={addMutation.isPending || !staff || !startDT || !endDT}
            onClick={onSubmitAddSession}
            fullWidth
          >
            {addMutation.isPending ? "Guardando..." : "Agendar sesión"}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

const ReservationsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initAppointmentId = searchParams.get("appointment_id");
  const initSessionId = searchParams.get("session_id");

  const [filters, setFilters] = useState<AppointmentFilters>({});
  const [filterPatient, setFilterPatient] = useState("");
  const [filterService, setFilterService] = useState<Service | null>(null);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | null>(
    null,
  );
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", filters],
    queryFn: () => api.getAppointments(filters),
  });

  const { data: appointmentDetail, refetch: refetchDetail } = useQuery({
    queryKey: ["appointment", selectedAppointment?.id],
    queryFn: () => api.getAppointmentById(selectedAppointment!.id),
    enabled: !!selectedAppointment && isDetailOpen,
  });

  useEffect(() => {
    if (initAppointmentId && appointments.length > 0 && !selectedAppointment) {
      const apt = appointments.find(
        (a) => a.id.toString() === initAppointmentId,
      );
      if (apt) {
        setSelectedAppointment(apt);
        setIsDetailOpen(true);
      }
    }
  }, [initAppointmentId, appointments, selectedAppointment]);

  useEffect(() => {
    if (appointmentDetail && isDetailOpen) {
      const sess = appointmentDetail.sessions?.find(
        (s) => s.id.toString() === initSessionId,
      );

      if (sess && !selectedSession) {
        setSelectedSession({
          ...sess,
          patient_name: appointmentDetail.patient_name,
          service_name: appointmentDetail.service_name,
        });
        setIsSessionModalOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [
    initSessionId,
    appointmentDetail,
    isDetailOpen,
    selectedSession,
    setSearchParams,
  ]);

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: api.getStaff,
  });
  const { data: servicesList = [] } = useQuery({
    queryKey: ["services"],
    queryFn: api.getServices,
  });
  const { data: appointmentStatuses = [] } = useQuery({
    queryKey: ["appointmentStatuses"],
    queryFn: api.getAppointmentStatuses,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string | number; notes: string }) =>
      api.cancelAppointment(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
      queryClient.invalidateQueries({ queryKey: ["laser-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["laser-patients"] });
      setIsDetailOpen(false);
    },
    onError: (err: any) => showAlert.error("Error", err.message),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string | number) => api.completeAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
      queryClient.invalidateQueries({ queryKey: ["laser-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["laser-patients"] });
      setIsDetailOpen(false);
    },
    onError: (err: any) => showAlert.error("Error", err.message),
  });

  const applyFilters = () => {
    setFilters({
      patient_id: filterPatient ? undefined : undefined,
      service_id: filterService?.id || undefined,
      status_id: filterStatus?.id || undefined,
      date_from: filterDateFrom || undefined,
      date_to: filterDateTo || undefined,
    });
  };

  const clearFilters = () => {
    setFilterPatient("");
    setFilterService(null);
    setFilterStatus(null);
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilters({});
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    const notes = await showAlert.prompt(
      "Cancelar reserva",
      "Comentario de cancelación (opcional):",
      "Motivo de la cancelación...",
    );
    if (notes === null) return;
    cancelMutation.mutate({ id: selectedAppointment.id, notes });
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;
    const ok = await showAlert.confirm(
      "Finalizar reserva",
      "¿Deseas finalizar esta reserva? Esta acción no se puede deshacer.",
      "Sí, finalizar",
    );
    if (!ok) return;
    completeMutation.mutate(selectedAppointment.id);
  };

  const openDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
  };

  const sessions = useMemo(
    () => appointmentDetail?.sessions ?? [],
    [appointmentDetail],
  );

  // Definición de columnas DataGrid
  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", headerName: "#", width: 70 },
      {
        field: "patient_name",
        headerName: "Paciente",
        flex: 1,
        minWidth: 150,
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant="body2" fontWeight={500}>
              {params.row.patient_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatRut(params.row.patient_national_id)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "service_name",
        headerName: "Servicio",
        flex: 1.2,
        minWidth: 200,
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: params.row.label_color,
                }}
              />
              <Typography variant="body2">{params.row.service_name}</Typography>
            </Box>
            {params.row.specialty_name && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 2.2 }}
              >
                {params.row.specialty_name}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: "session_count",
        headerName: "Sesiones",
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Chip size="small" label={params.row.session_count ?? 0} />
        ),
      },
      {
        field: "status_name",
        headerName: "Estado",
        width: 150,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.row.status_name}
            color={getStatusColor(params.row.status_name)}
            sx={{ fontWeight: 500 }}
          />
        ),
      },
      {
        field: "created_at",
        headerName: "Creada",
        width: 150,
        valueGetter: (params) => fmtDate(params),
      },
      {
        field: "actions",
        headerName: "Acciones",
        width: 120,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => (
          <Button
            variant="outlined"
            size="small"
            onClick={() => openDetail(params.row as Appointment)}
          >
            Ver detalle
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, height: "100%" }}
    >
      <Box>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="text.primary"
          gutterBottom
        >
          Reservas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona las reservas y sus sesiones.
        </Typography>
      </Box>

      {/* Filtros */}
      <Box
        sx={{
          bgcolor: "background.paper",
          p: 2,
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          <Autocomplete
            value={filterService}
            options={servicesList}
            onChange={(_, newValue: Service | null) => {
              setFilterService(newValue);
            }}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Servicio" />}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box
                  component="span"
                  sx={{
                    width: 14,
                    height: 14,
                    flexShrink: 0,
                    borderRadius: "50%",
                    mr: 1.5,
                    backgroundColor: option.label_color,
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography variant="body1">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.specialty_name}
                  </Typography>
                </Box>
              </li>
            )}
          />

          <Autocomplete
            value={filterStatus}
            options={appointmentStatuses}
            onChange={(_, newValue: AppointmentStatus | null) => {
              setFilterStatus(newValue);
            }}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Estado" />}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Chip
                    size="small"
                    label={option.name}
                    color={getStatusColor(option.name)}
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
              </li>
            )}
          />

          <DatePicker
            label="Desde"
            value={filterDateFrom ? parseISO(filterDateFrom) : null}
            onChange={(newValue) =>
              setFilterDateFrom(newValue ? format(newValue, "yyyy-MM-dd") : "")
            }
            slotProps={{ textField: { fullWidth: true } }}
          />
          <DatePicker
            label="Hasta"
            value={filterDateTo ? parseISO(filterDateTo) : null}
            onChange={(newValue) =>
              setFilterDateTo(newValue ? format(newValue, "yyyy-MM-dd") : "")
            }
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Box>
        <Box
          sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "flex-end" }}
        >
          <Button variant="outlined" size="small" onClick={clearFilters}>
            Limpiar
          </Button>
          <Button variant="contained" size="small" onClick={applyFilters}>
            Aplicar filtros
          </Button>
        </Box>
      </Box>

      {/* DataGrid */}
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 1,
          overflow: "hidden",
          minHeight: 400,
        }}
      >
        <DataGrid
          rows={appointments}
          columns={columns}
          loading={isLoading}
          getRowHeight={() => "auto"}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{ border: 0, "& .MuiDataGrid-cell": { py: 1 } }}
        />
      </Box>

      {/* Panel de detalle de reserva */}
      <Drawer
        anchor="right"
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        disableEnforceFocus
      >
        <Box
          sx={{
            width: { xs: "100vw", sm: 600 },
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {appointmentDetail && (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: appointmentDetail.label_color,
                      }}
                    />
                    {appointmentDetail.service_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reserva #{appointmentDetail.id} —{" "}
                    {appointmentDetail.patient_name}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Descargar PDF">
                    <IconButton
                      onClick={() => generateReservationPDF(appointmentDetail)}
                      color="primary"
                      sx={{ bgcolor: "primary.50" }}
                    >
                      <PictureAsPdfIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    onClick={() => setIsDetailOpen(false)}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>

              <Divider />

              {/* Info general */}
              <Box
                sx={{
                  bgcolor: "grey.50",
                  p: 2,
                  borderRadius: 2,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textTransform="uppercase"
                  >
                    Paciente
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {appointmentDetail.patient_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatRut(appointmentDetail.patient_national_id)}
                  </Typography>
                  {appointmentDetail.patient_phone && (
                    <Typography variant="caption" color="text.secondary">
                      {appointmentDetail.patient_phone}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textTransform="uppercase"
                  >
                    Estado
                  </Typography>
                  <Box>
                    <Chip
                      size="small"
                      label={appointmentDetail.status_name}
                      color={getStatusColor(appointmentDetail.status_name)}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textTransform="uppercase"
                  >
                    Especialidad
                  </Typography>
                  <Typography variant="body2">
                    {appointmentDetail.specialty_name ?? "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textTransform="uppercase"
                  >
                    Creada
                  </Typography>
                  <Typography variant="body2">
                    {fmtDate(appointmentDetail.created_at)}
                  </Typography>
                </Box>
                {appointmentDetail.notes && (
                  <Box sx={{ gridColumn: "span 2" }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      textTransform="uppercase"
                    >
                      Notas
                    </Typography>
                    <Typography variant="body2">
                      {appointmentDetail.notes}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Ficha Clínica Láser (solo se muestra si la reserva incluye estos datos) */}
              {appointmentDetail.laserRecord && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ mb: 2 }}
                  >
                    Ficha Clínica Láser
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: "info.50",
                      p: 2.5,
                      borderRadius: 2,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2.5,
                      border: 1,
                      borderColor: "info.200",
                    }}
                  >
                    {/* Zonas a tratar */}
                    {appointmentDetail.laserRecord.zones &&
                      appointmentDetail.laserRecord.zones.length > 0 && (
                        <Box sx={{ gridColumn: "span 2" }}>
                          <Typography
                            variant="caption"
                            color="info.800"
                            textTransform="uppercase"
                            fontWeight="bold"
                          >
                            Zonas a tratar
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mt: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            {appointmentDetail.laserRecord.zones.map(
                              (zone: any, i: number) => (
                                <Chip
                                  key={i}
                                  label={
                                    typeof zone === "string"
                                      ? zone
                                      : zone.zone_name
                                  }
                                  size="small"
                                  color="info"
                                  sx={{ fontWeight: 500 }}
                                />
                              ),
                            )}
                          </Box>
                        </Box>
                      )}

                    {/* Fototipo y Método */}
                    <Box>
                      <Typography
                        variant="caption"
                        color="info.800"
                        textTransform="uppercase"
                        fontWeight="bold"
                      >
                        Fototipo (Fitzpatrick)
                      </Typography>
                      <Typography variant="body2" color="info.900">
                        Tipo{" "}
                        {appointmentDetail.laserRecord.fitzpatrick_type ||
                          "N/A"}{" "}
                        (Puntaje:{" "}
                        {appointmentDetail.laserRecord.total_score || 0})
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="caption"
                        color="info.800"
                        textTransform="uppercase"
                        fontWeight="bold"
                      >
                        Método depilación actual
                      </Typography>
                      <Typography variant="body2" color="info.900">
                        {appointmentDetail.laserRecord
                          .current_hair_removal_method || "No especificado"}
                      </Typography>
                    </Box>

                    {/* Antecedentes Médicos */}
                    <Box sx={{ gridColumn: "span 2" }}>
                      <Typography
                        variant="caption"
                        color="info.800"
                        textTransform="uppercase"
                        fontWeight="bold"
                        sx={{ mb: 1, display: "block" }}
                      >
                        Antecedentes Médicos (Contraindicaciones)
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 1.5,
                          bgcolor: "rgba(255,255,255,0.5)",
                          p: 1.5,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body2" color="info.900">
                          <b>Enfermedades a la piel:</b>{" "}
                          {appointmentDetail.laserRecord.skin_diseases ||
                            "Ninguna"}
                        </Typography>
                        <Typography variant="body2" color="info.900">
                          <b>Medicamentos:</b>{" "}
                          {appointmentDetail.laserRecord.photosensitive_meds ||
                            "Ninguno"}
                        </Typography>
                        <Typography variant="body2" color="info.900">
                          <b>Tatuajes:</b>{" "}
                          {appointmentDetail.laserRecord.tattoos_zone ||
                            "Ninguno"}
                        </Typography>
                        <Typography variant="body2" color="info.900">
                          <b>Implantes/Injertos:</b>{" "}
                          {appointmentDetail.laserRecord.implants_zone ||
                            "Ninguno"}
                        </Typography>
                        <Typography variant="body2" color="info.900">
                          <b>Prótesis/Placas:</b>{" "}
                          {appointmentDetail.laserRecord
                            .plates_prosthesis_zone || "Ninguno"}
                        </Typography>
                        <Typography variant="body2" color="info.900">
                          <b>Nevus atípico:</b>{" "}
                          {appointmentDetail.laserRecord.atypical_nevus_zone ||
                            "Ninguno"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Lista de sesiones */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Sesiones ({sessions.length})
                  </Typography>
                  {appointmentDetail.status_code ===
                    AppointmentStatusCodes.IN_TREATMENT && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setIsAddSessionOpen(true)}
                    >
                      + Nueva sesión
                    </Button>
                  )}
                </Box>

                {sessions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No hay sesiones agendadas.
                  </Typography>
                ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {sessions.map((sess) => (
                      <Box
                        key={sess.id}
                        sx={{
                          border: 1,
                          borderColor: "grey.200",
                          borderRadius: 2,
                          p: 2,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          "&:hover": { bgcolor: "grey.50" },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              fontWeight="bold"
                              color="text.secondary"
                            >
                              Sesión #{sess.session_number}
                            </Typography>
                            <Chip
                              size="small"
                              label={sess.session_status}
                              color={getSessionStatusColor(sess.session_status)}
                              sx={{ height: 20, fontSize: "0.65rem" }}
                            />
                          </Box>
                          <Typography variant="body2" fontWeight="medium">
                            {sess.staff_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fmtDate(sess.start_date_time)} →{" "}
                            {format(parseISO(sess.end_date_time), "HH:mm", {
                              locale: es,
                            })}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedSession({
                              ...sess,
                              patient_name: appointmentDetail.patient_name,
                              service_name: appointmentDetail.service_name,
                            });
                            setIsSessionModalOpen(true);
                          }}
                        >
                          Gestionar
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Acciones de la reserva */}
              {appointmentDetail.status_code ===
                AppointmentStatusCodes.IN_TREATMENT &&
                (() => {
                  const hasPendingSessions = sessions.some(
                    (s) =>
                      s.session_status_code === SessionStatusCodes.SCHEDULED ||
                      s.session_status_code === SessionStatusCodes.CONFIRMED,
                  );
                  return (
                    <Box
                      sx={{
                        mt: "auto",
                        pt: 2,
                        borderTop: 1,
                        borderColor: "divider",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="success"
                        fullWidth
                        disabled={
                          hasPendingSessions || completeMutation.isPending
                        }
                        onClick={handleCompleteAppointment}
                      >
                        {completeMutation.isPending
                          ? "Finalizando..."
                          : "✅ Finalizar reserva"}
                      </Button>
                      {hasPendingSessions && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          textAlign="center"
                        >
                          Hay sesiones pendientes — finaliza o cancela cada una
                          para poder cerrar la reserva.
                        </Typography>
                      )}
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        disabled={cancelMutation.isPending}
                        onClick={handleCancelAppointment}
                      >
                        {cancelMutation.isPending
                          ? "Cancelando..."
                          : "✖ Cancelar reserva completa"}
                      </Button>
                    </Box>
                  );
                })()}
            </>
          )}
        </Box>
      </Drawer>

      {/* Modales de sesión (Drawers apilados) */}
      <SessionModal
        session={selectedSession}
        staffList={staffList}
        open={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onSaved={() => refetchDetail()}
      />
      <AddSessionModal
        appointment={selectedAppointment}
        staffList={staffList}
        open={isAddSessionOpen}
        onClose={() => setIsAddSessionOpen(false)}
        onSaved={() => refetchDetail()}
      />
    </Box>
  );
};

export default ReservationsPage;
