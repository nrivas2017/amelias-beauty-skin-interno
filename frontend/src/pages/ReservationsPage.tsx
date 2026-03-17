import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format, parseISO, addMinutes } from "date-fns";
import { es } from "date-fns/locale/es";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { showAlert } from "@/lib/alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type {
  Appointment,
  AppointmentFilters,
  Session,
  SessionStatus,
  UpdateSessionDTO,
} from "@/services/types";
import {
  SessionStatusCodes,
  AppointmentStatusCodes,
  type SessionStatusCode,
} from "@/services/catalogCodes";

const fmtDate = (dt: string) => {
  try {
    return format(parseISO(dt), "dd MMM yyyy, HH:mm", { locale: es });
  } catch {
    return dt;
  }
};

const STATUS_COLORS: Record<string, string> = {
  "En tratamiento": "bg-blue-100 text-blue-700",
  Finalizada: "bg-green-100 text-green-700",
  Cancelada: "bg-red-100 text-red-700",
};

const SESSION_STATUS_COLORS: Record<string, string> = {
  Agendada: "bg-sky-100 text-sky-700",
  Confirmada: "bg-indigo-100 text-indigo-700",
  Realizada: "bg-green-100 text-green-700",
  "Cancelada por paciente": "bg-rose-100 text-rose-700",
  "Cancelada por profesional": "bg-orange-100 text-orange-700",
  Finalizada: "bg-emerald-100 text-emerald-700",
};

interface SessionModalProps {
  session: Session | null;
  staffList: any[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function SessionModal({
  session,
  staffList,
  open,
  onClose,
  onSaved,
}: SessionModalProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "reschedule" | "close">("view");

  const [startDT, setStartDT] = useState("");
  const [endDT, setEndDT] = useState("");
  const [staffId, setStaffId] = useState("");

  const [closeStatus, setCloseStatus] = useState<SessionStatusCode | "">("");
  const [closeNotes, setCloseNotes] = useState("");

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSessionDTO) =>
      api.updateSession(session!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onSaved();
      onClose();
    },
    onError: (err: any) => showAlert.error("Error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onSaved();
      onClose();
    },
    onError: (err: any) => showAlert.error("Error", err.message),
  });

  const handleOpen = () => {
    if (!session) return;
    setMode("view");
    // Date inputs require YYYY-MM-DDTHH:mm format
    setStartDT(format(parseISO(session.start_date_time), "yyyy-MM-dd'T'HH:mm"));
    setEndDT(format(parseISO(session.end_date_time), "yyyy-MM-dd'T'HH:mm"));
    setStaffId(String(session.staff_id));
    setCloseNotes("");
    setCloseStatus("");
  };

  const saveReschedule = () => {
    updateMutation.mutate({
      staff_id: staffId,
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
    if (!statusId) return showAlert.error("Error", "Estado de sesión no encontrado");

    updateMutation.mutate({
      status_id: statusId,
      close_notes: closeNotes || undefined,
    });
  };

  if (!session) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
        else handleOpen();
      }}
    >
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sesión #{session.session_number}</SheetTitle>
          <SheetDescription>
            {session.service_name} — {session.patient_name}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {mode === "view" && (
            <>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Estado</dt>
                  <dd>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SESSION_STATUS_COLORS[session.session_status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {session.session_status}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Especialista</dt>
                  <dd className="font-medium">{session.staff_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Inicio</dt>
                  <dd className="font-medium">
                    {fmtDate(session.start_date_time)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Fin</dt>
                  <dd className="font-medium">
                    {fmtDate(session.end_date_time)}
                  </dd>
                </div>
                {session.estimated_duration_minutes && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Duración est.</dt>
                    <dd>{session.estimated_duration_minutes} min</dd>
                  </div>
                )}
                {session.notes && (
                  <div>
                    <dt className="text-slate-500 mb-1">Notas</dt>
                    <dd className="text-slate-700 bg-slate-50 rounded p-2 text-xs">
                      {session.notes}
                    </dd>
                  </div>
                )}
                {session.close_notes && (
                  <div>
                    <dt className="text-slate-500 mb-1">Nota de cierre</dt>
                    <dd className="text-slate-700 bg-amber-50 rounded p-2 text-xs">
                      {session.close_notes}
                    </dd>
                  </div>
                )}
              </dl>

              {![
                "Realizada",
                "Finalizada",
                "Cancelada por paciente",
                "Cancelada por profesional",
              ].includes(session.session_status) && (
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setMode("reschedule")}
                  >
                    📅 Reagendar sesión
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      setCloseStatus(SessionStatusCodes.FINALIZED);
                      setMode("close");
                    }}
                  >
                    ✅ Finalizar sesión
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    disabled={deleteMutation.isPending}
                    onClick={async () => {
                      if (await showAlert.confirm("Eliminar sesión", "¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer.", "Eliminar")) {
                        deleteMutation.mutate(session.id);
                      }
                    }}
                  >
                    🗑️ Eliminar sesión
                  </Button>
                </div>
              )}
            </>
          )}

          {mode === "reschedule" && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">Reagendar sesión</h4>
              <div className="space-y-1">
                <Label className="text-xs">Especialista</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-slate-50 px-3 text-sm"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nueva fecha y hora de inicio</Label>
                <Input
                  type="datetime-local"
                  value={startDT}
                  onChange={(e) => {
                    setStartDT(e.target.value);
                    if (endDT && new Date(e.target.value) >= new Date(endDT)) {
                       const newEnd = addMinutes(new Date(e.target.value), 30);
                       setEndDT(format(newEnd, "yyyy-MM-dd'T'HH:mm"));
                    }
                  }}
                  className="bg-slate-50"
                  step={300}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nueva fecha y hora de fin</Label>
                <Input
                  type="datetime-local"
                  value={endDT}
                  onChange={(e) => setEndDT(e.target.value)}
                  min={startDT}
                  disabled={!startDT}
                  className="bg-slate-50"
                  step={300}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setMode("view")}>
                  ← Volver
                </Button>
                <Button
                  className="flex-1 bg-blue-600 text-white"
                  disabled={updateMutation.isPending}
                  onClick={saveReschedule}
                >
                  {updateMutation.isPending
                    ? "Guardando..."
                    : "Guardar horario"}
                </Button>
              </div>
            </div>
          )}

          {mode === "close" && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">
                {closeStatus === SessionStatusCodes.FINALIZED
                  ? "Finalizar sesión"
                  : "Cancelar sesión"}
              </h4>
              <div className="space-y-1">
                <Label className="text-xs">
                  Comentarios{" "}
                  {closeStatus === SessionStatusCodes.FINALIZED
                    ? "de finalización"
                    : "de cancelación"}
                </Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm"
                  placeholder="Ej: Sesión completada sin inconvenientes..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setMode("view")}>
                  ← Volver
                </Button>
                <Button
                  className={`flex-1 text-white ${closeStatus === SessionStatusCodes.FINALIZED ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                  disabled={updateMutation.isPending}
                  onClick={saveClose}
                >
                  {updateMutation.isPending
                    ? "Guardando..."
                    : closeStatus === SessionStatusCodes.FINALIZED
                      ? "Confirmar finalización"
                      : "Confirmar cancelación"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface AddSessionModalProps {
  appointment: Appointment | null;
  staffList: any[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function AddSessionModal({
  appointment,
  staffList,
  open,
  onClose,
  onSaved,
}: AddSessionModalProps) {
  const queryClient = useQueryClient();
  const [staffId, setStaffId] = useState("");
  const [startDT, setStartDT] = useState("");
  const [endDT, setEndDT] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");

  const DURATION_OPTIONS = Array.from(
    { length: 10 },
    (_, i) => (i + 1) * 5 + 10,
  );

  const addMutation = useMutation({
    mutationFn: () =>
      api.addSession(appointment!.id, {
        staff_id: staffId,
        start_date_time: new Date(startDT).toISOString(),
        end_date_time: new Date(endDT).toISOString(),
        estimated_duration_minutes: duration,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onSaved();
      onClose();
    },
    onError: (err: any) => showAlert.error("Error", err.message),
  });

  if (!appointment) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nueva Sesión</SheetTitle>
          <SheetDescription>
            {appointment.service_name} — {appointment.patient_name}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Especialista *</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-slate-50 px-3 text-sm"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Inicio *</Label>
            <Input
              type="datetime-local"
              value={startDT}
              onChange={(e) => {
                 setStartDT(e.target.value);
                 if (endDT && new Date(e.target.value) >= new Date(endDT)) {
                    const newEnd = addMinutes(new Date(e.target.value), 30);
                    setEndDT(format(newEnd, "yyyy-MM-dd'T'HH:mm"));
                 }
              }}
              className="bg-slate-50"
              step={300}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fin *</Label>
            <Input
              type="datetime-local"
              value={endDT}
              onChange={(e) => setEndDT(e.target.value)}
              min={startDT}
              disabled={!startDT}
              className="bg-slate-50"
              step={300}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duración estimada (referencia)</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-slate-50 px-3 text-sm"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutos
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="pt-2">
            <Button
              className="w-full bg-blue-600 text-white"
              disabled={addMutation.isPending || !staffId || !startDT || !endDT}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? "Guardando..." : "Agendar sesión"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const ReservationsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initAppointmentId = searchParams.get("appointment_id");
  const initSessionId = searchParams.get("session_id");

  const [filters, setFilters] = useState<AppointmentFilters>({});
  const [filterPatient, setFilterPatient] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
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
    if (
      initSessionId &&
      appointmentDetail &&
      isDetailOpen &&
      !isSessionModalOpen &&
      !selectedSession
    ) {
      const sess = appointmentDetail.sessions?.find(
        (s) => s.id.toString() === initSessionId,
      );
      if (sess) {
        setSelectedSession({
          ...sess,
          patient_name: appointmentDetail.patient_name,
          service_name: appointmentDetail.service_name,
        });
        setIsSessionModalOpen(true);
        setSearchParams({});
      }
    }
  }, [
    initSessionId,
    appointmentDetail,
    isDetailOpen,
    isSessionModalOpen,
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
      setIsDetailOpen(false);
    },
    onError: (err: any) => showAlert.error("Error", err.message),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string | number) => api.completeAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setIsDetailOpen(false);
    },
    onError: (err: any) => showAlert.error("Error", err.message),
  });

  const applyFilters = () => {
    setFilters({
      patient_id: filterPatient ? undefined : undefined,
      service_id: filterService || undefined,
      status_id: filterStatus || undefined,
      date_from: filterDateFrom || undefined,
      date_to: filterDateTo || undefined,
    });
  };

  const clearFilters = () => {
    setFilterPatient("");
    setFilterService("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilters({});
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    const notes = await showAlert.prompt("Cancelar reserva", "Comentario de cancelación (opcional):", "Motivo de la cancelación...");
    if (notes === null) return;
    cancelMutation.mutate({ id: selectedAppointment.id, notes });
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;
    const ok = await showAlert.confirm(
      "Finalizar reserva",
      "¿Deseas finalizar esta reserva? Esta acción no se puede deshacer.",
      "Sí, finalizar"
    );
    if (!ok) return;
    completeMutation.mutate(selectedAppointment.id);
  };

  const openDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
  };

  const sessions = appointmentDetail?.sessions ?? [];

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          Reservas
        </h1>
        <p className="text-slate-500">Gestiona las reservas y sus sesiones.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-600">Servicio</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-slate-50 px-3 text-sm"
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
            >
              <option value="">Todos</option>
              {servicesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-600">Estado</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-slate-50 px-3 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos</option>
              {appointmentStatuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-600">Desde</Label>
            <Input
              type="date"
              className="h-9 bg-slate-50 text-sm"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-600">Hasta</Label>
            <Input
              type="date"
              className="h-9 bg-slate-50 text-sm"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Limpiar
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 text-white"
            onClick={applyFilters}
          >
            Aplicar filtros
          </Button>
        </div>
      </div>

      {/* Tabla de reservas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            Cargando reservas...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No hay reservas que coincidan.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  #
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  Paciente
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  Servicio
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  Sesiones
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  Estado
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  Creada
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <tr
                  key={apt.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    #{apt.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {apt.patient_name}
                    </div>
                    {apt.patient_phone && (
                      <div className="text-xs text-slate-400">
                        {apt.patient_phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: apt.label_color }}
                      />
                      <span className="text-slate-700">{apt.service_name}</span>
                    </div>
                    {apt.specialty_name && (
                      <div className="text-xs text-slate-400 ml-4">
                        {apt.specialty_name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                      {apt.session_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[apt.status_name] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {apt.status_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {fmtDate(apt.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetail(apt)}
                    >
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Panel de detalle de reserva */}
      <Sheet
        open={isDetailOpen}
        onOpenChange={(v) => {
          if (!v) setIsDetailOpen(false);
        }}
      >
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
          {appointmentDetail && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: appointmentDetail.label_color }}
                  />
                  {appointmentDetail.service_name}
                </SheetTitle>
                <SheetDescription>
                  Reserva #{appointmentDetail.id} —{" "}
                  {appointmentDetail.patient_name}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Info general */}
                <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                      Paciente
                    </p>
                    <p className="font-semibold">
                      {appointmentDetail.patient_name}
                    </p>
                    {appointmentDetail.patient_phone && (
                      <p className="text-slate-500 text-xs">
                        {appointmentDetail.patient_phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                      Estado
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[appointmentDetail.status_name] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {appointmentDetail.status_name}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                      Especialidad
                    </p>
                    <p>{appointmentDetail.specialty_name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                      Creada
                    </p>
                    <p>{fmtDate(appointmentDetail.created_at)}</p>
                  </div>
                  {appointmentDetail.notes && (
                    <div className="col-span-2">
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">
                        Notas
                      </p>
                      <p className="text-slate-600 text-xs">
                        {appointmentDetail.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Lista de sesiones */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-slate-700">
                      Sesiones ({sessions.length})
                    </h3>
                    {appointmentDetail.status_code ===
                      AppointmentStatusCodes.IN_TREATMENT && (
                      <Button
                        size="sm"
                        className="bg-blue-600 text-white"
                        onClick={() => setIsAddSessionOpen(true)}
                      >
                        + Nueva sesión
                      </Button>
                    )}
                  </div>

                  {sessions.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No hay sesiones agendadas.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="border border-slate-200 rounded-lg p-3 flex items-center justify-between hover:bg-slate-50 transition"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">
                                Sesión #{sess.session_number}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${SESSION_STATUS_COLORS[sess.session_status] ?? "bg-slate-100 text-slate-600"}`}
                              >
                                {sess.session_status}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-700">
                              {sess.staff_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {fmtDate(sess.start_date_time)} →{" "}
                              {format(parseISO(sess.end_date_time), "HH:mm", {
                                locale: es,
                              })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones de la reserva */}
                {appointmentDetail.status_code ===
                  AppointmentStatusCodes.IN_TREATMENT &&
                  (() => {
                    const hasPendingSessions = sessions.some(
                      (s) =>
                        s.session_status_code ===
                          SessionStatusCodes.SCHEDULED ||
                        s.session_status_code === SessionStatusCodes.CONFIRMED,
                    );
                    return (
                      <div className="border-t border-slate-200 pt-4 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          className="w-full border-green-400 text-green-700 hover:bg-green-50 disabled:opacity-50"
                          disabled={
                            hasPendingSessions || completeMutation.isPending
                          }
                          onClick={handleCompleteAppointment}
                          title={
                            hasPendingSessions
                              ? "Finaliza o cancela todas las sesiones pendientes antes de cerrar la reserva"
                              : "Finalizar reserva"
                          }
                        >
                          {completeMutation.isPending
                            ? "Finalizando..."
                            : "✅ Finalizar reserva"}
                        </Button>
                        {hasPendingSessions && (
                          <p className="text-xs text-slate-400 text-center">
                            Hay sesiones pendientes — finaliza o cancela cada
                            una para poder cerrar la reserva.
                          </p>
                        )}
                        <Button
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                          disabled={cancelMutation.isPending}
                          onClick={handleCancelAppointment}
                        >
                          {cancelMutation.isPending
                            ? "Cancelando..."
                            : "✖ Cancelar reserva completa"}
                        </Button>
                      </div>
                    );
                  })()}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de gestión de sesión */}
      <SessionModal
        session={selectedSession}
        staffList={staffList}
        open={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onSaved={() => refetchDetail()}
      />

      {/* Modal de agregar sesión */}
      <AddSessionModal
        appointment={selectedAppointment}
        staffList={staffList}
        open={isAddSessionOpen}
        onClose={() => setIsAddSessionOpen(false)}
        onSaved={() => refetchDetail()}
      />
    </div>
  );
};

export default ReservationsPage;
