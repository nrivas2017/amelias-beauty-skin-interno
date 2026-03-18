import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type EventProps,
  type SlotInfo,
  type View,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar.css";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import CloseIcon from "@mui/icons-material/Close";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";

interface EventList {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  resourceId: string | number; // staff_id
  color: string;
  status: string;
  patient_id: string | number;
  patient: string;
  appointment_id: string | number;
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

const AgendaPage = () => {
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
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
    return staffList
      .filter((staff) => staff.is_active)
      .map((staff) => ({
        resourceId: staff.id,
        resourceTitle: `${staff.full_name}`,
      }));
  }, [staffList]);

  const myEventsList: EventList[] = useMemo(() => {
    return sessions.map((session) => ({
      id: session.id,
      title: session.service_name,
      start: new Date(session.start_date_time),
      end: new Date(session.end_date_time),
      resourceId: session.staff_id,
      color: session.label_color,
      status: session.session_status,
      patient_id: session.patient_id,
      patient: session.patient_name,
      appointment_id: session.appointment_id,
    }));
  }, [sessions]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    setIsDrawerOpen(true);
  };

  const handleSelectEvent = (event: EventList) => {
    if (event.appointment_id && event.id) {
      navigate(
        `/reservations?appointment_id=${event.appointment_id}&session_id=${event.id}`,
      );
    } else {
      console.log("Evento sin appointment_id", event);
    }
  };

  const EventComponent = ({ event }: EventProps<EventList>) => {
    const startTime = format(event.start, "HH:mm");
    const endTime = format(event.end, "HH:mm");

    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          p: 0.5,
          fontSize: "0.75rem",
          borderRadius: 1,
          boxShadow: 1,
          backgroundColor: event.color,
          color: "white",
          border: "1px solid rgba(0,0,0,0.05)",
          transition: "filter 0.2s",
          "&:hover": {
            filter: "brightness(1.1)",
            cursor: "pointer",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 0.5,
          }}
        >
          <Typography
            variant="caption"
            color="inherit"
            sx={{
              fontWeight: 600,
              opacity: 0.9,
              lineHeight: 1,
              fontSize: "0.65rem",
            }}
          >
            {startTime} - {endTime}
          </Typography>

          <Box
            component="span"
            sx={{
              bgcolor: "rgba(0,0,0,0.2)",
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: "0.6rem",
              textTransform: "uppercase",
              fontWeight: "bold",
              lineHeight: 1,
            }}
          >
            {event.status}
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="inherit"
          fontWeight="bold"
          noWrap
          sx={{ lineHeight: 1.2 }}
        >
          {event.patient}
        </Typography>
        <Typography
          variant="caption"
          color="inherit"
          noWrap
          sx={{ opacity: 0.9, lineHeight: 1.2 }}
        >
          {event.title}
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}
    >
      {/* Cabecera */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            color="text.primary"
            gutterBottom
          >
            Agenda Diaria
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona las citas del día por especialistas.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedSlot(null);
            setIsDrawerOpen(true);
          }}
          sx={{ boxShadow: 1 }}
        >
          + Nueva Cita
        </Button>
      </Box>

      {/* Contenedor del Calendario */}
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          p: 2,
          borderRadius: 2,
          boxShadow: 1,
          border: 1,
          borderColor: "grey.200",
          height: "calc(100vh - 160px)",
          minHeight: 500,
        }}
      >
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
          min={new Date(new Date().setHours(7, 0, 0, 0))}
          max={new Date(new Date().setHours(22, 0, 0, 0))}
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
      </Box>

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <Box
          sx={{
            width: { xs: "100vw", sm: 600, md: 700 },
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
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
              <Typography variant="h5" fontWeight="bold">
                Gestión de Cita
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reserva una hora o completa la ficha clínica del paciente.
              </Typography>
            </Box>
            <IconButton onClick={() => setIsDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1 }}>
            <AppointmentForm
              selectedSlot={selectedSlot}
              onClose={() => setIsDrawerOpen(false)}
              existingSessions={sessions}
              staffList={staffList}
            />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default AgendaPage;
