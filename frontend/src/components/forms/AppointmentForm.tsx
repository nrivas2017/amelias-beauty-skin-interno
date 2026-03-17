import { useState, useEffect } from "react";
import { format, addMinutes } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { showAlert } from "@/lib/alerts";
import { LaserClinicalForm } from "@/components/forms/LaserClinicalForm";
import type {
  CreateSessionDTO,
  Session,
  Staff,
  LaserClinicalRecord,
} from "@/services/types";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import DeleteIcon from "@mui/icons-material/Delete";

const SPECIALTY_LASER = "LASER_DEPILATION";

// Opciones de duración estimada: 15 a 60 minutos en intervalos de 5
const DURATION_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 5 + 10);

interface SessionRow extends CreateSessionDTO {
  _key: number;
}

interface AppointmentFormProps {
  selectedSlot: { start: Date; end: Date; resourceId?: string | number } | null;
  onClose: () => void;
  existingSessions: Session[];
  staffList: Staff[];
}

type Step = 1 | 2 | 3;

export function AppointmentForm({
  selectedSlot,
  onClose,
  existingSessions,
  staffList,
}: AppointmentFormProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);

  const [patientId, setPatientId] = useState<string | number>("");
  const [serviceId, setServiceId] = useState<string | number>("");

  const [sessionRows, setSessionRows] = useState<SessionRow[]>([
    {
      _key: 0,
      staff_id: "",
      start_date_time: "",
      end_date_time: "",
      estimated_duration_minutes: 30,
    },
  ]);

  const [laserData, setLaserData] = useState<Omit<
    LaserClinicalRecord,
    "id" | "appointment_id"
  > | null>(null);

  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (selectedSlot) {
      const startStr = format(selectedSlot.start, "yyyy-MM-dd'T'HH:mm");
      const endStr = format(selectedSlot.end, "yyyy-MM-dd'T'HH:mm");
      setSessionRows([
        {
          _key: 0,
          staff_id: selectedSlot.resourceId ?? "",
          start_date_time: startStr,
          end_date_time: endStr,
          estimated_duration_minutes: 30,
        },
      ]);
    }
  }, [selectedSlot]);

  const { data: servicesList = [] } = useQuery({
    queryKey: ["services"],
    queryFn: api.getServices,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: api.getPatients,
  });

  const selectedService = servicesList.find(
    (s: any) => String(s.id) === String(serviceId),
  );
  const isLaser = selectedService?.specialty_code === SPECIALTY_LASER;

  const createMutation = useMutation({
    mutationFn: api.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      onClose();
    },
    onError: (err: any) => showAlert.error("Error al guardar", err.message),
  });

  const addSessionRow = () => {
    setSessionRows((prev) => [
      ...prev,
      {
        _key: Date.now(),
        staff_id: "",
        start_date_time: "",
        end_date_time: "",
        estimated_duration_minutes: 30,
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
      prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)),
    );
  };

  const checkConflict = (
    staffId: string | number,
    start: string,
    end: string,
  ) => {
    if (!staffId || !start || !end) return false;
    const newStart = new Date(start);
    const newEnd = new Date(end);
    return existingSessions.some((s) => {
      if (String(s.staff_id) !== String(staffId)) return false;
      const eStart = new Date(s.start_date_time);
      const eEnd = new Date(s.end_date_time);
      return newStart < eEnd && newEnd > eStart;
    });
  };

  const goStep2 = () => {
    if (!patientId || !serviceId) {
      showAlert.warning(
        "Campos incompletos",
        "Por favor selecciona un paciente y un servicio.",
      );
      return;
    }
    setStep(2);
  };

  const goStep3OrSave = () => {
    const invalid = sessionRows.find(
      (r) => !r.staff_id || !r.start_date_time || !r.end_date_time,
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
      checkConflict(r.staff_id, r.start_date_time, r.end_date_time),
    );

    if (hasConflict) {
      const ok = window.confirm(
        "⚠️ Uno o más especialistas ya tienen sesiones en esos horarios. ¿Deseas agendar de todas formas?",
      );
      if (!ok) return;
    }

    if (isLaser) {
      setStep(3);
    } else {
      handleSave(null);
    }
  };

  const handleSave = (laser: typeof laserData) => {
    const payload = {
      patient_id: patientId,
      service_id: serviceId,
      notes: notes || undefined,
      sessions: sessionRows.map(({ _key, ...r }) => ({
        ...r,
        staff_id: r.staff_id,
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
          <TextField
            select
            label="Paciente *"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="">
              <em>Selecciona un paciente...</em>
            </MenuItem>
            {patients.map((p: any) => (
              <MenuItem key={p.id} value={p.id}>
                {p.full_name} — {p.phone}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <TextField
              select
              label="Servicio *"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="">
                <em>Selecciona un servicio...</em>
              </MenuItem>
              {servicesList.map((s: any) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} {s.specialty_name ? ` — ${s.specialty_name}` : ""}
                </MenuItem>
              ))}
            </TextField>
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

                <TextField
                  select
                  label="Especialista *"
                  size="small"
                  value={row.staff_id}
                  onChange={(e) =>
                    updateRow(row._key, "staff_id", e.target.value)
                  }
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Seleccionar...</em>
                  </MenuItem>
                  {staffList.map((st) => (
                    <MenuItem key={st.id} value={st.id}>
                      {st.full_name}
                    </MenuItem>
                  ))}
                </TextField>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <TextField
                    type="datetime-local"
                    label="Inicio *"
                    size="small"
                    value={row.start_date_time}
                    onChange={(e) => {
                      updateRow(row._key, "start_date_time", e.target.value);
                      if (
                        row.end_date_time &&
                        new Date(e.target.value) >= new Date(row.end_date_time)
                      ) {
                        const newEnd = addMinutes(new Date(e.target.value), 30);
                        updateRow(
                          row._key,
                          "end_date_time",
                          format(newEnd, "yyyy-MM-dd'T'HH:mm"),
                        );
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                  />
                  <TextField
                    type="datetime-local"
                    label="Fin *"
                    size="small"
                    value={row.end_date_time}
                    onChange={(e) =>
                      updateRow(row._key, "end_date_time", e.target.value)
                    }
                    disabled={!row.start_date_time}
                    InputProps={{
                      inputProps: { min: row.start_date_time, step: 300 },
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <TextField
                  select
                  label="Duración estimada (referencia)"
                  size="small"
                  value={row.estimated_duration_minutes}
                  onChange={(e) =>
                    updateRow(
                      row._key,
                      "estimated_duration_minutes",
                      Number(e.target.value),
                    )
                  }
                  fullWidth
                >
                  {DURATION_OPTIONS.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d} minutos
                    </MenuItem>
                  ))}
                </TextField>

                {/* Alerta de conflicto de horario de staff */}
                {row.staff_id &&
                  row.start_date_time &&
                  row.end_date_time &&
                  checkConflict(
                    row.staff_id,
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

      {/* ── Paso 3: Ficha Láser (solo si aplica) ──────────────────────── */}
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
    </Box>
  );
}
