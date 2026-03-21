import { useState, useMemo, type FunctionComponent } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Patient } from "@/services/types";
import { PatientFormModal } from "../components/forms/PatientFormModal";
import { formatRut } from "@/utils/rut";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import Chip from "@mui/material/Chip";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale/es";
import { useNavigate } from "react-router-dom";

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

const PatientsPage: FunctionComponent = () => {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: api.getPatients,
  });

  const { data: patientAppointments = [], isLoading: isLoadingAppointments } =
    useQuery({
      queryKey: ["appointments", "patient", selectedPatient?.id],
      queryFn: () =>
        api.getAppointments({ patient_id: selectedPatient?.id as number }),
      enabled: !!selectedPatient?.id && isSheetOpen,
    });

  const handleOpenCreate = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleViewFicha = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsSheetOpen(true);
  };

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "national_id",
        headerName: "RUT",
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Typography variant="body2" fontWeight={500}>
              {formatRut(params.row.national_id || "")}
            </Typography>
          </Box>
        ),
      },
      {
        field: "full_name",
        headerName: "Nombre",
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
            <Typography variant="body2" fontWeight={500}>
              {params.row.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.age} años
            </Typography>
          </Box>
        ),
      },
      {
        field: "contact",
        headerName: "Contacto",
        flex: 1,
        minWidth: 180,
        sortable: false,
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant="body2">{params.row.phone}</Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.email || "Sin email"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "medical_info",
        headerName: "Alergias / Tratamientos",
        flex: 1.5,
        minWidth: 250,
        sortable: false,
        renderCell: (params) => {
          const p = params.row as Patient;
          const hasWarning = p.pregnant_lactating || p.medical_treatment;
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                height: "100%",
                py: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {p.allergies
                  ? `Alergias: ${p.allergies}`
                  : "Sin alergias conocidas"}
              </Typography>
              {hasWarning && (
                <Typography
                  variant="caption"
                  color="warning.dark"
                  fontWeight="bold"
                  sx={{ mt: 0.5 }}
                >
                  ⚠️ Atención especial requerida
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: "actions",
        headerName: "Acciones",
        width: 180,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              height: "100%",
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleOpenEdit(params.row as Patient)}
            >
              Editar
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleViewFicha(params.row as Patient)}
            >
              Ver Ficha
            </Button>
          </Box>
        ),
      },
    ],
    [],
  );

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, height: "100%" }}
    >
      {/* Cabecera */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
            Pacientes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona la información y el historial clínico de los pacientes.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenCreate}
          sx={{ boxShadow: 1 }}
        >
          + Nuevo Paciente
        </Button>
      </Box>

      {/* Tabla DataGrid */}
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
          rows={patients}
          columns={columns}
          loading={isLoading}
          getRowHeight={() => "auto"}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            "& .MuiDataGrid-cell": { py: 1 },
          }}
        />
      </Box>

      {/* Modal / Dialogo de Creación/Edición */}
      <PatientFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingPatient={editingPatient}
        existingPatients={patients}
      />

      {/* Drawer (Reemplazo del Sheet lateral para ver la Ficha) */}
      <Drawer
        anchor="right"
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      >
        <Box
          sx={{
            width: { xs: "100vw", sm: 450 },
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
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {selectedPatient?.full_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ficha Clínica e Información de Contacto
              </Typography>
            </Box>
            <IconButton onClick={() => setIsSheetOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          {selectedPatient && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Datos de Contacto */}
              <Box
                sx={{
                  bgcolor: "grey.50",
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: "grey.200",
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Datos de Contacto
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    Teléfono:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPatient.phone}
                  </Typography>

                  <Typography variant="body2" fontWeight="medium">
                    Email:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPatient.email || "-"}
                  </Typography>

                  <Typography variant="body2" fontWeight="medium">
                    Edad:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPatient.age} años
                  </Typography>

                  <Typography variant="body2" fontWeight="medium">
                    Dirección:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPatient.address || "-"}
                  </Typography>
                </Box>
              </Box>

              {/* Alertas Médicas */}
              <Box
                sx={{
                  bgcolor: "warning.50",
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: "warning.200",
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  color="warning.900"
                  gutterBottom
                >
                  Alertas Médicas
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    mt: 1,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color="warning.900"
                    >
                      Condición Especial:
                    </Typography>
                    <Typography variant="body2" color="warning.800">
                      {selectedPatient.pregnant_lactating
                        ? "Embarazada / Lactando"
                        : "Ninguna reportada"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color="warning.900"
                    >
                      Alergias:
                    </Typography>
                    <Typography variant="body2" color="warning.800">
                      {selectedPatient.allergies || "Ninguna reportada"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color="warning.900"
                    >
                      Tratamientos Actuales:
                    </Typography>
                    <Typography variant="body2" color="warning.800">
                      {selectedPatient.medical_treatment || "Ninguno reportado"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Historial de Citas */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Historial de Reservas
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {isLoadingAppointments ? (
                  <Typography variant="body2" color="text.secondary">
                    Cargando historial...
                  </Typography>
                ) : patientAppointments.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontStyle="italic"
                  >
                    El paciente no tiene reservas registradas.
                  </Typography>
                ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {patientAppointments.map((apt) => (
                      <Box
                        key={apt.id}
                        onClick={() => {
                          setIsSheetOpen(false);
                          navigate(`/reservations?appointment_id=${apt.id}`);
                        }}
                        sx={{
                          border: 1,
                          borderColor: "grey.200",
                          borderRadius: 2,
                          p: 1.5,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          bgcolor: "background.paper",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: "grey.50",
                            borderColor: "primary.main",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                          },
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
                            <Typography variant="body2" fontWeight="bold">
                              {apt.service_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Reserva #{apt.id} • {fmtDate(apt.created_at)}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={apt.status_name}
                            color={getStatusColor(apt.status_name)}
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 500,
                            }}
                          />
                        </Box>
                        <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Especialidad: {apt.specialty_name || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sesiones: {apt.session_count || 0}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default PatientsPage;
