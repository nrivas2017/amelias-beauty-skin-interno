import { useState, useMemo, type FunctionComponent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { showAlert } from "@/lib/alerts";
import type { CreatePatientDTO, Patient } from "@/services/types";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
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

const defaultFormData: CreatePatientDTO = {
  full_name: "",
  age: 0,
  email: "",
  address: "",
  phone: "",
  pregnant_lactating: false,
  allergies: "",
  medical_treatment: "",
};

const PatientsPage: FunctionComponent = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<CreatePatientDTO>(defaultFormData);

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

  const createMutation = useMutation({
    mutationFn: api.createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      closeModal();
    },
    onError: (err: any) => showAlert.error("Error al crear", err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: Partial<CreatePatientDTO>;
    }) => api.updatePatient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      closeModal();
    },
    onError: (err: any) => showAlert.error("Error al actualizar", err.message),
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setEditingId(patient.id);
    setFormData({
      full_name: patient.full_name,
      age: patient.age,
      email: patient.email,
      address: patient.address,
      phone: patient.phone,
      pregnant_lactating: patient.pregnant_lactating,
      allergies: patient.allergies,
      medical_treatment: patient.medical_treatment,
    });
    setIsModalOpen(true);
  };

  const handleViewFicha = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsSheetOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(defaultFormData);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      showAlert.warning(
        "Campos incompletos",
        "El nombre completo y el teléfono son obligatorios.",
      );
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const columns: GridColDef[] = useMemo(
    () => [
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
      <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="md">
        <DialogTitle fontWeight="bold">
          {editingId ? "Editar Paciente" : "Registrar Nuevo Paciente"}
        </DialogTitle>
        <Divider />

        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 3,
              pt: 1,
            }}
          >
            <TextField
              label="Nombre Completo *"
              variant="outlined"
              fullWidth
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="Ej: Ana Gabriela Silva"
            />
            <TextField
              label="Edad"
              variant="outlined"
              type="number"
              fullWidth
              value={formData.age || ""}
              onChange={(e) =>
                setFormData({ ...formData, age: parseInt(e.target.value) || 0 })
              }
            />
            <TextField
              label="Teléfono *"
              variant="outlined"
              fullWidth
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+56 9 1234 5678"
            />
            <TextField
              label="Email"
              variant="outlined"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="correo@ejemplo.com"
            />
            <TextField
              label="Dirección"
              variant="outlined"
              fullWidth
              sx={{ gridColumn: { sm: "span 2" } }}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Calle, Número, Comuna"
            />

            <Box sx={{ gridColumn: { sm: "span 2" }, mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Información Médica Básica
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pregnant_lactating}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pregnant_lactating: e.target.checked,
                      })
                    }
                    color="primary"
                  />
                }
                label="¿Está embarazada o en periodo de lactancia?"
                sx={{ mb: 2 }}
              />

              <TextField
                label="Alergias Conocidas"
                variant="outlined"
                fullWidth
                sx={{ mb: 3 }}
                value={formData.allergies}
                onChange={(e) =>
                  setFormData({ ...formData, allergies: e.target.value })
                }
                placeholder="Ej: Alergia al látex, penicilina..."
              />

              <TextField
                label="Tratamientos Médicos Actuales"
                variant="outlined"
                fullWidth
                value={formData.medical_treatment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    medical_treatment: e.target.value,
                  })
                }
                placeholder="Ej: Tratamiento para la tiroides..."
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeModal} variant="outlined" color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="contained"
            color="primary"
            disableElevation
          >
            {isSaving ? "Guardando..." : "Guardar Paciente"}
          </Button>
        </DialogActions>
      </Dialog>

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
