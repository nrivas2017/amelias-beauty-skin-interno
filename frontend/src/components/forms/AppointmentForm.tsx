import { useState, useEffect } from "react";
import { format, addMinutes } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { showAlert } from "@/lib/alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LaserClinicalForm } from "@/components/forms/LaserClinicalForm";
import type {
  CreateSessionDTO,
  Session,
  Staff,
  LaserClinicalRecord,
} from "@/services/types";

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

  const [patientId, setPatientId] = useState("");
  const [serviceId, setServiceId] = useState("");

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
      showAlert.warning("Campos incompletos", "Por favor selecciona un paciente y un servicio.");
      return;
    }
    setStep(2);
  };

  const goStep3OrSave = () => {
    const invalid = sessionRows.find(
      (r) => !r.staff_id || !r.start_date_time || !r.end_date_time,
    );
    if (invalid) {
      showAlert.warning("Sesiones incompletas", "Completa todos los campos de las sesiones (especialista, inicio y fin).");
      return;
    }

    // Validar orden cronológico ascendente entre sesiones
    for (let i = 1; i < sessionRows.length; i++) {
      const prevStart = new Date(sessionRows[i - 1].start_date_time);
      const currStart = new Date(sessionRows[i].start_date_time);
      if (currStart < prevStart) {
        showAlert.warning("Error de orden cronológico", `La sesión ${i + 1} no puede comenzar antes que la sesión ${i}. Las sesiones deben estar en orden cronológico ascendente.`);
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

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        {[
          { n: 1, label: "Datos" },
          { n: 2, label: "Sesiones" },
          ...(isLaser ? [{ n: 3, label: "Ficha Láser" }] : []),
        ].map(({ n, label }, idx, arr) => (
          <span key={n} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === n
                  ? "bg-blue-600 text-white"
                  : step > n
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {step > n ? "✓" : n}
            </span>
            <span className={step === n ? "text-blue-700" : "text-slate-400"}>
              {label}
            </span>
            {idx < arr.length - 1 && <span className="text-slate-300">›</span>}
          </span>
        ))}
      </div>

      {/* ── Paso 1: Paciente y Servicio ────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-700">Paciente *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 text-sm"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              <option value="">Selecciona un paciente...</option>
              {patients.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} — {p.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Servicio *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 text-sm"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Selecciona un servicio...</option>
              {servicesList.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.specialty_name ? ` — ${s.specialty_name}` : ""}
                </option>
              ))}
            </select>
            {selectedService && (
              <p className="text-xs text-slate-400 pt-1">
                Especialidad:{" "}
                <span className="font-semibold text-slate-600">
                  {selectedService.specialty_name ?? "Sin especialidad"}
                </span>
                {isLaser && (
                  <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase">
                    Requiere ficha láser
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Notas generales</Label>
            <textarea
              className="flex min-h-[70px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm"
              placeholder="Observaciones generales de la reserva..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={goStep2}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}

      {/* ── Paso 2: Sesiones ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Agrega una o más sesiones para esta reserva. Puedes agregar el resto
            de las sesiones más adelante desde el módulo de Reservas.
          </p>

          {sessionRows.map((row, idx) => (
            <div
              key={row._key}
              className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">
                  Sesión #{idx + 1}
                </span>
                {sessionRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSessionRow(row._key)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-slate-600 text-xs">Especialista *</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  value={String(row.staff_id)}
                  onChange={(e) =>
                    updateRow(row._key, "staff_id", e.target.value)
                  }
                >
                  <option value="">Seleccionar...</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-600 text-xs">Inicio *</Label>
                  <Input
                    type="datetime-local"
                    className="bg-white text-sm h-9"
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
                    step={300}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-600 text-xs">Fin *</Label>
                  <Input
                    type="datetime-local"
                    className="bg-white text-sm h-9"
                    value={row.end_date_time}
                    onChange={(e) =>
                      updateRow(row._key, "end_date_time", e.target.value)
                    }
                    min={row.start_date_time}
                    disabled={!row.start_date_time}
                    step={300}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-slate-600 text-xs">
                  Duración estimada (referencia)
                </Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  value={row.estimated_duration_minutes}
                  onChange={(e) =>
                    updateRow(
                      row._key,
                      "estimated_duration_minutes",
                      Number(e.target.value),
                    )
                  }
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} minutos
                    </option>
                  ))}
                </select>
              </div>

              {/* Alerta de conflicto de horario de staff */}
              {row.staff_id &&
                row.start_date_time &&
                row.end_date_time &&
                checkConflict(
                  row.staff_id,
                  row.start_date_time,
                  row.end_date_time,
                ) && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    ⚠️ Este especialista tiene otra sesión en ese horario.
                  </p>
                )}

              {/* Alerta de orden cronológico */}
              {idx > 0 &&
                row.start_date_time &&
                sessionRows[idx - 1].start_date_time &&
                new Date(row.start_date_time) <
                  new Date(sessionRows[idx - 1].start_date_time) && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                    ❌ Esta sesión no puede comenzar antes que la sesión #{idx}.
                  </p>
                )}
            </div>
          ))}

          <button
            type="button"
            onClick={addSessionRow}
            className="w-full text-sm text-blue-600 border border-blue-200 border-dashed rounded-lg py-2 hover:bg-blue-50 transition"
          >
            + Agregar otra sesión
          </button>

          <div className="pt-4 border-t border-slate-100 flex gap-2 justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Atrás
            </Button>
            <Button
              onClick={goStep3OrSave}
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createMutation.isPending
                ? "Guardando..."
                : isLaser
                  ? "Siguiente → Ficha Láser"
                  : "Guardar Reserva"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Paso 3: Ficha Láser (solo si aplica) ──────────────────────── */}
      {step === 3 && isLaser && (
        <div className="space-y-4">
          <LaserClinicalForm
            onSubmitData={(data) => {
              setLaserData(data);
              handleSave(data);
            }}
            onBack={() => setStep(2)}
            isSaving={createMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}
