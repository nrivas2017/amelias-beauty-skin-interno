import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LaserClinicalForm } from "@/components/forms/LaserClinicalForm";
import type { CreateAppointmentDTO, Session, Staff } from "@/services/types";

interface AppointmentFormProps {
  selectedSlot: { start: Date; end: Date; resourceId?: string | number } | null;
  onClose: () => void;
  existingSessions: Session[];
  staffList: Staff[];
}

export function AppointmentForm({
  selectedSlot,
  onClose,
  existingSessions,
  staffList,
}: AppointmentFormProps) {
  const queryClient = useQueryClient();

  const [patientId, setPatientId] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [resourceId, setResourceId] = useState<string | number>("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (selectedSlot) {
      setAppointmentDate(format(selectedSlot.start, "yyyy-MM-dd"));
      setAppointmentTime(format(selectedSlot.start, "HH:mm"));
      setResourceId(selectedSlot.resourceId || "");
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

  const createAppointmentMutation = useMutation({
    mutationFn: api.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      alert("Cita agendada exitosamente");
      onClose();
    },
    onError: (error: any) => {
      alert("Error al agendar: " + error.message);
    },
  });

  const handleSaveAppointment = () => {
    if (
      !patientId ||
      !selectedService ||
      !resourceId ||
      !appointmentDate ||
      !appointmentTime
    ) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    const startDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

    const hasConflict = existingSessions.some((session) => {
      if (String(session.staff_id) === String(resourceId)) {
        const service = servicesList.find(
          (s: any) => String(s.id) === String(selectedService),
        );
        const duration = service?.estimated_duration || 60;

        const newEndDateTime = new Date(
          startDateTime.getTime() + duration * 60000,
        );
        const eventStart = new Date(session.start_date_time);
        const eventEnd = new Date(session.end_date_time);

        return startDateTime < eventEnd && newEndDateTime > eventStart;
      }
      return false;
    });

    if (hasConflict) {
      const confirmProceed = window.confirm(
        "¡Alerta! Este especialista ya tiene una cita agendada en ese horario. ¿Deseas agendar de todos modos?",
      );
      if (!confirmProceed) return;
    }

    const payload: CreateAppointmentDTO = {
      patient_id: patientId,
      service_id: selectedService,
      staff_id: resourceId,
      start_date_time: startDateTime.toISOString(),
      notes,
    };

    createAppointmentMutation.mutate(payload);
  };

  const isLaserService = servicesList
    .find((s: any) => String(s.id) === String(selectedService))
    ?.name.toLowerCase()
    .includes("láser");

  return (
    <Tabs defaultValue="agenda" className="w-full mt-6">
      <TabsList className="grid w-full grid-cols-2 bg-slate-100">
        <TabsTrigger value="agenda">Programación</TabsTrigger>
        <TabsTrigger value="ficha" disabled={!isLaserService}>
          Ficha Láser
        </TabsTrigger>
      </TabsList>

      <TabsContent value="agenda" className="py-4 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="patient" className="text-slate-700">
            Paciente
          </Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            <option value="">Selecciona un paciente...</option>
            {patients.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="service" className="text-slate-700">
              Servicio
            </Label>
            <select
              id="service"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3"
            >
              <option value="">Seleccionar...</option>
              {servicesList.map((srv: any) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource" className="text-slate-700">
              Especialista
            </Label>
            <select
              id="resource"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3"
            >
              <option value="">Seleccionar...</option>
              {staffList.map((st: Staff) => (
                <option key={st.id} value={st.id}>
                  {st.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Fecha y Hora</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="bg-slate-50"
            />
            <Input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="bg-slate-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Notas Adicionales</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Ej. paciente tiene alergia a X producto..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>

        <div className="pt-4 border-t border-slate-100 flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAppointment}
            disabled={createAppointmentMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createAppointmentMutation.isPending
              ? "Guardando..."
              : "Guardar Agenda"}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="ficha" className="py-4">
        <LaserClinicalForm />
      </TabsContent>
    </Tabs>
  );
}
