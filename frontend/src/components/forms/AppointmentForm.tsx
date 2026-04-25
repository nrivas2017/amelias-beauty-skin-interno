import { useState, useEffect, useMemo } from "react";
import { format, addMinutes, differenceInMinutes } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { showAlert } from "@/lib/alerts";
import { PatientFormModal } from "./PatientFormModal";
import { formatRut } from "@/utils/rut";
import { LaserClinicalForm } from "@/components/forms/LaserClinicalForm";
import type {
  CreateSessionDTO,
  Session,
  Staff,
  LaserClinicalRecord,
  Patient,
  Service,
  Appointment,
} from "@/services/types";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import DeleteIcon from "@mui/icons-material/Delete";
import Autocomplete from "@mui/material/Autocomplete";
import type { SlotInfo } from "react-big-calendar";
import Swal from "sweetalert2";
import { AppointmentStatusCodes } from "@/services/catalogCodes";

const SPECIALTY_LASER = "LASER_DEPILATION";

interface SessionRow extends CreateSessionDTO {
  _key: number;
}

interface AppointmentFormProps {
  selectedSlot: SlotInfo | null;
  onClose: () => void;
  existingSessions: Session[];
  staffList: Staff[];
}

type Step = 1 | 2 | 3;

export const AppointmentForm = ({
  selectedSlot,
  onClose,
  existingSessions,
  staffList,
}: AppointmentFormProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [pendingPatientId, setPendingPatientId] = useState<
    string | number | null
  >(null);

  const [sessionRows, setSessionRows] = useState<SessionRow[]>([
    {
      _key: 0,
      staff: null,
      start_date_time: "",
      end_date_time: "",
      estimated_duration_minutes: 0,
    },
  ]);

  const [laserData, setLaserData] = useState<Omit<
    LaserClinicalRecord,
    "id" | "appointment_id"
  > | null>(null);

  const [notes, setNotes] = useState("");

  useEffect(() => {
    const findStaff = staffList.find((s) => s.id === selectedSlot?.resourceId);
    if (selectedSlot) {
      const startStr = format(selectedSlot.start, "yyyy-MM-dd'T'HH:mm");
      const endStr = format(selectedSlot.end, "yyyy-MM-dd'T'HH:mm");

      const duration = differenceInMinutes(
        selectedSlot.end,
        selectedSlot.start,
      );

      setSessionRows([
        {
          _key: 0,
          staff: findStaff ?? null,
          start_date_time: startStr,
          end_date_time: endStr,
          estimated_duration_minutes: duration,
        },
      ]);
    }
  }, [selectedSlot, staffList]);

  const { data: servicesList = [] } = useQuery({
    queryKey: ["services"],
    queryFn: api.getServices,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: api.getPatients,
  });

  useEffect(() => {
    if (pendingPatientId && patients.length > 0) {
      const found = patients.find((p) => p.id === pendingPatientId);
      if (found) {
        setSelectedPatient(found);
        setPendingPatientId(null);
      }
    }
  }, [patients, pendingPatientId]);

  const isLaser = selectedService?.specialty_code === SPECIALTY_LASER;

  // Detección de reserva activa duplicada
  const { data: patientAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["appointments", { patient_id: selectedPatient?.id }],
    queryFn: () => api.getAppointments({ patient_id: selectedPatient!.id }),
    enabled: !!selectedPatient,
  });

  const activeConflict = useMemo(() => {
    if (!selectedPatient || !selectedService) return null;
    return (
      patientAppointments.find(
        (a) =>
          String(a.service_id) === String(selectedService.id) &&
          a.status_code === AppointmentStatusCodes.IN_TREATMENT,
      ) ?? null
    );
  }, [patientAppointments, selectedPatient, selectedService]);

  const createMutation = useMutation({
    mutationFn: api.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["laser-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["laser-patients"] });
      onClose();
    },
    onError: (err: any) => showAlert.error("Error al guardar", err.message),
  });

  const addSessionRow = () => {
    setSessionRows((prev) => [
      ...prev,
      {
        _key: Date.now(),
        staff: null,
        start_date_time: "",
        end_date_time: "",
        estimated_duration_minutes: 0,
      },
    ]);
  };

  const removeSessionRow = (key: number) => {
    setSessionRows((prev) => prev.filter((r) => r._key !== key));
  };

  const updateRow = (
    key: number,
    field: keyof Omit<SessionRow, "_key">,
    value: any,
  ) => {
    setSessionRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r;

        const updatedRow = { ...r, [field]: value };

        if (field === "start_date_time" || field === "end_date_time") {
          const start = updatedRow.start_date_time
            ? new Date(updatedRow.start_date_time)
            : null;
          const end = updatedRow.end_date_time
            ? new Date(updatedRow.end_date_time)
            : null;

          if (
            start &&
            end &&
            !isNaN(start.getTime()) &&
            !isNaN(end.getTime())
          ) {
            const diff = differenceInMinutes(end, start);
            updatedRow.estimated_duration_minutes = diff;
          }
        }

        return updatedRow;
      }),
    );
  };

  const checkConflict = (staff: Staff | null, start: string, end: string) => {
    if (!staff || !start || !end) return false;
    const newStart = new Date(start);
    const newEnd = new Date(end);
    return existingSessions.some((s) => {
      if (String(s.staff_id) !== String(staff.id)) return false;
      const eStart = new Date(s.start_date_time);
      const eEnd = new Date(s.end_date_time);
      return newStart < eEnd && newEnd > eStart;
    });
  };

  const goStep2 = () => {
    if (!selectedPatient || !selectedService) {
      showAlert.warning(
        "Campos incompletos",
        "Por favor selecciona un paciente y un servicio.",
      );
      return;
    }
    if (activeConflict) {
      showAlert.warning(
        "Reserva activa existente",
        `Este paciente ya tiene una reserva activa de "${selectedService.name}". Ve a la sección Reservas para agregar una nueva sesión.`,
      );
      return;
    }
    setStep(2);
  };

  const goStep3OrSave = () => {
    const invalid = sessionRows.find(
      (r) => !r.staff || !r.start_date_time || !r.end_date_time,
    );
    if (invalid) {
      showAlert.warning(
        "Sesiones incompletas",
        "Completa todos los campos de las sesiones (especialista, inicio y fin).",
      );
      return;
    }

    // Validar orden cronológico ascendente entre sesiones
    for (let i = 1; i < sessionRows.length; i++) {
      const prevStart = new Date(sessionRows[i - 1].start_date_time);
      const currStart = new Date(sessionRows[i].start_date_time);
      if (currStart < prevStart) {
        showAlert.warning(
          "Error de orden cronológico",
          `La sesión ${i + 1} no puede comenzar antes que la sesión ${i}. Las sesiones deben estar en orden cronológico ascendente.`,
        );
        return;
      }
    }

    const hasConflict = sessionRows.some((r) =>
      checkConflict(r.staff, r.start_date_time, r.end_date_time),
    );

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
          if (isLaser) {
            setStep(3);
          } else {
            handleSave(null);
          }
        }
      });
      return;
    }

    if (isLaser) {
      setStep(3);
    } else {
      handleSave(null);
    }
  };

  const handleSave = (laser: typeof laserData) => {
    const payload = {
      patient_id: String(selectedPatient?.id),
      service_id: String(selectedService?.id),
      notes: notes || undefined,
      sessions: sessionRows.map(({ _key, ...r }) => ({
        ...r,
        staff_id: r.staff?.id,
        start_date_time: new Date(r.start_date_time).toISOString(),
        end_date_time: new Date(r.end_date_time).toISOString(),
        estimated_duration_minutes: r.estimated_duration_minutes,
      })),
      laserRecord: laser ?? undefined,
    };
    createMutation.mutate(payload);
  };

  const steps = isLaser
    ? ["Datos", "Sesiones", "Ficha Láser"]
    : ["Datos", "Sesiones"];

  const activeServices = useMemo(
    () => servicesList.filter((s) => s.is_active),
    [servicesList],
  );

  const availableStaff = useMemo(
    () =>
      staffList.filter((st) => {
        if (!Boolean(st.is_active)) return false;
        return st.specialties?.some(
          (sp) => sp.id === selectedService?.specialty_id,
        );
      }),
    [staffList, selectedService],
  );

  return (
    <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 4 }}>
      {/* ── Indicador de Pasos (Stepper) ─────────────────────────────── */}
      <Stepper activeStep={step - 1} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ── Paso 1: Paciente y Servicio ────────────────────────────────── */}
      {step === 1 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <Autocomplete
              sx={{ flexGrow: 1 }}
              value={selectedPatient}
              options={patients}
              onChange={(_, newValue: Patient | null) => {
                setSelectedPatient(newValue);
              }}
              getOptionLabel={(option) =>
                `${option.full_name} - ${formatRut(option.national_id || "")}`
              }
              renderInput={(params) => (
                <TextField {...params} label="Paciente *" />
              )}
            />
            <Button
              variant="outlined"
              onClick={() => setIsPatientModalOpen(true)}
              sx={{ height: 56, whiteSpace: "nowrap" }}
            >
              + Nuevo
            </Button>
          </Box>

          <Box>
            <Autocomplete
              value={selectedService}
              options={activeServices}
              onChange={(_, newValue: Service | null) => {
                setSelectedService(newValue);
              }}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField {...params} label="Servicio *" />
              )}
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

            {selectedService && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 1,
                  px: 1,
                }}
              >
                Especialidad:{" "}
                <Box component="span" fontWeight="bold" color="text.primary">
                  {selectedService.specialty_name ?? "Sin especialidad"}
                </Box>
                {isLaser && (
                  <Chip
                    size="small"
                    label="Requiere ficha láser"
                    color="secondary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.65rem" }}
                  />
                )}
              </Typography>
            )}
          </Box>

          {/* Alerta de reserva activa duplicada */}
          {activeConflict && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Este paciente ya tiene una reserva activa (#{activeConflict.id})
              de <strong>{selectedService?.name}</strong>. Para agregar una
              nueva sesión a ese tratamiento, ve a la sección{" "}
              <strong>Reservas</strong> y busca la reserva existente.
            </Alert>
          )}

          <TextField
            label="Notas generales"
            multiline
            rows={3}
            placeholder="Observaciones generales de la reserva..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            variant="outlined"
          />

          <Divider />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={onClose} color="inherit">
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={goStep2}
              color="primary"
              disableElevation
              disabled={!!activeConflict}
            >
              Siguiente
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Paso 2: Sesiones ───────────────────────────────────────────── */}
      {step === 2 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Agrega una o más sesiones para esta reserva. Puedes agregar el resto
            de las sesiones más adelante desde el módulo de Reservas.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {sessionRows.map((row, idx) => (
              <Box
                key={row._key}
                sx={{
                  border: 1,
                  borderColor: "grey.300",
                  borderRadius: 2,
                  p: 2.5,
                  bgcolor: "grey.50",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    Sesión #{idx + 1}
                  </Typography>
                  {sessionRows.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeSessionRow(row._key)}
                    >
                      <DeleteIcon fontSize="medium" />
                    </IconButton>
                  )}
                </Box>

                <Autocomplete
                  value={row.staff}
                  options={availableStaff}
                  onChange={(_, newValue: Staff | null) => {
                    updateRow(row._key, "staff", newValue);
                  }}
                  getOptionLabel={(option) => option.full_name}
                  renderInput={(params) => (
                    <TextField {...params} label="Especialista *" />
                  )}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <DateTimePicker
                    label="Inicio *"
                    ampm
                    value={
                      row.start_date_time ? new Date(row.start_date_time) : null
                    }
                    onChange={(newValue) => {
                      if (newValue) {
                        const startStr = format(newValue, "yyyy-MM-dd'T'HH:mm");
                        updateRow(row._key, "start_date_time", startStr);
                        if (
                          row.end_date_time &&
                          newValue >= new Date(row.end_date_time)
                        ) {
                          const newEnd = addMinutes(newValue, 30);
                          updateRow(
                            row._key,
                            "end_date_time",
                            format(newEnd, "yyyy-MM-dd'T'HH:mm"),
                          );
                        }
                      } else {
                        updateRow(row._key, "start_date_time", "");
                      }
                    }}
                    slotProps={{
                      textField: { fullWidth: true },
                    }}
                  />
                  <DateTimePicker
                    label="Fin *"
                    ampm
                    value={
                      row.end_date_time ? new Date(row.end_date_time) : null
                    }
                    onChange={(newValue) => {
                      updateRow(
                        row._key,
                        "end_date_time",
                        newValue ? format(newValue, "yyyy-MM-dd'T'HH:mm") : "",
                      );
                    }}
                    disabled={!row.start_date_time}
                    minDateTime={
                      row.start_date_time
                        ? new Date(row.start_date_time)
                        : undefined
                    }
                    slotProps={{
                      textField: { fullWidth: true },
                    }}
                  />
                </Box>

                <TextField
                  label="Duración estimada"
                  value={`${row.estimated_duration_minutes} minutos`}
                  fullWidth
                  disabled
                />

                <TextField
                  multiline
                  rows={3}
                  label="Notas"
                  value={row.notes}
                  onChange={(e) => updateRow(row._key, "notes", e.target.value)}
                  fullWidth
                />

                {/* Alerta de conflicto de horario de staff */}
                {row.staff &&
                  row.start_date_time &&
                  row.end_date_time &&
                  checkConflict(
                    row.staff,
                    row.start_date_time,
                    row.end_date_time,
                  ) && (
                    <Alert
                      severity="warning"
                      sx={{ py: 0, "& .MuiAlert-message": { py: 1 } }}
                    >
                      Este especialista tiene otra sesión en ese horario.
                    </Alert>
                  )}

                {/* Alerta de orden cronológico */}
                {idx > 0 &&
                  row.start_date_time &&
                  sessionRows[idx - 1].start_date_time &&
                  new Date(row.start_date_time) <
                    new Date(sessionRows[idx - 1].start_date_time) && (
                    <Alert
                      severity="error"
                      sx={{ py: 0, "& .MuiAlert-message": { py: 1 } }}
                    >
                      Esta sesión no puede comenzar antes que la sesión #{idx}.
                    </Alert>
                  )}
              </Box>
            ))}

            <Button
              variant="outlined"
              onClick={addSessionRow}
              sx={{ borderStyle: "dashed", borderWidth: 2, mt: 1 }}
            >
              + Agregar otra sesión
            </Button>
          </Box>

          <Divider />

          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}
          >
            <Button
              variant="outlined"
              onClick={() => setStep(1)}
              color="inherit"
            >
              Atrás
            </Button>
            <Button
              variant="contained"
              onClick={goStep3OrSave}
              disabled={createMutation.isPending}
              color="primary"
              disableElevation
            >
              {createMutation.isPending
                ? "Guardando..."
                : isLaser
                  ? "Siguiente → Ficha Láser"
                  : "Guardar Reserva"}
            </Button>
          </Box>
        </Box>
      )}

      {/* Paso 3: Ficha Láser (solo si aplica) */}
      {step === 3 && isLaser && (
        <Box>
          <LaserClinicalForm
            onSubmitData={(data) => {
              setLaserData(data);
              handleSave(data);
            }}
            onBack={() => setStep(2)}
            isSaving={createMutation.isPending}
          />
        </Box>
      )}

      {/* Modal para Crear Paciente desde el Agendamiento */}
      {isPatientModalOpen && (
        <PatientFormModal
          open={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          editingPatient={null}
          existingPatients={patients}
          onSuccess={(createdId) => {
            setPendingPatientId(createdId);
          }}
        />
      )}
    </Box>
  );
};
