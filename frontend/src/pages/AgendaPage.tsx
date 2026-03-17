import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type View,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar.css";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AppointmentForm } from "@/components/forms/AppointmentForm";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

const AgendaPage = () => {
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>(Views.DAY);

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
  };

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: api.getStaff,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.getSessions(),
  });

  const resourceMap = useMemo(() => {
    return staffList.map((staff) => ({
      resourceId: staff.id,
      resourceTitle: `${staff.full_name}`,
    }));
  }, [staffList]);

  const myEventsList = useMemo(() => {
    return sessions.map((session) => ({
      id: session.id,
      title: session.service_name || "Servicio",
      start: new Date(session.start_date_time),
      end: new Date(session.end_date_time),
      resourceId: session.staff_id,
      color: session.label_color || "#3b82f6",
      status: session.session_status,
      patient: session.patient_name,
      appointment_id: session.appointment_id,
    }));
  }, [sessions]);

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setIsDrawerOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    if (event.appointment_id && event.id) {
      navigate(
        `/reservations?appointment_id=${event.appointment_id}&session_id=${event.id}`,
      );
    } else {
      console.log("Evento sin appointment_id", event);
    }
  };

  const EventComponent = ({ event }: any) => {
    return (
      <div
        className="h-full flex flex-col p-2 text-xs rounded-md shadow-sm border border-black/5 transition-all hover:brightness-110 focus:outline-none"
        style={{ backgroundColor: event.color, color: "white" }}
      >
        <div className="font-bold truncate text-sm">{event.patient}</div>
        <div className="truncate opacity-90">{event.title}</div>
        <div className="mt-auto flex justify-between items-end">
          <span className="bg-black/20 px-1.5 py-0.5 rounded-sm text-[10px] uppercase font-semibold">
            {event.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 flex flex-col h-full bg-slate-50/50">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Agenda Diaria
          </h1>
          <p className="text-slate-500">
            Gestiona las citas del día por especialistas.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedSlot(null);
            setIsDrawerOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          + Nueva Cita
        </Button>
      </div>

      <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <Calendar
          localizer={localizer}
          events={myEventsList}
          view={currentView}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          views={[Views.DAY, Views.WEEK]}
          step={15}
          timeslots={4}
          resources={resourceMap}
          resourceIdAccessor="resourceId"
          resourceTitleAccessor="resourceTitle"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          min={new Date(new Date().setHours(8, 0, 0, 0))}
          max={new Date(new Date().setHours(21, 0, 0, 0))}
          components={{
            event: EventComponent,
          }}
          eventPropGetter={() => ({
            style: {
              backgroundColor: "transparent",
              border: "none",
              padding: 0,
            },
          })}
          messages={{
            next: "Sig",
            previous: "Ant",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
          culture="es"
        />
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto w-full md:w-3/4">
          <SheetHeader>
            <SheetTitle>Gestión de Cita</SheetTitle>
            <SheetDescription>
              Reserva una hora o completa la ficha clínica del paciente.
            </SheetDescription>
          </SheetHeader>

          <AppointmentForm
            selectedSlot={selectedSlot}
            onClose={() => setIsDrawerOpen(false)}
            existingSessions={sessions}
            staffList={staffList}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgendaPage;
