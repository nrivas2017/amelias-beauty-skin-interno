import { useState, useMemo, type FunctionComponent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { showAlert } from "@/lib/alerts";
import type { CreateServiceDTO, Service, Specialty } from "@/services/types";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

const defaultFormData: CreateServiceDTO = {
  name: "",
  specialty_id: null,
  label_color: "#3b82f6",
  is_active: true,
};

const ServicesPage: FunctionComponent = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<CreateServiceDTO>(defaultFormData);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: api.getServices,
  });

  const { data: specialties = [] } = useQuery<Specialty[]>({
    queryKey: ["specialties"],
    queryFn: api.getSpecialties,
  });

  const createMutation = useMutation({
    mutationFn: api.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      closeModal();
    },
    onError: (error: any) =>
      showAlert.error("Error al crear el servicio", error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: Partial<CreateServiceDTO>;
    }) => api.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      closeModal();
    },
    onError: (error: any) =>
      showAlert.error("Error al actualizar el servicio", error.message),
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      specialty_id: service.specialty_id ?? null,
      label_color: service.label_color,
      is_active: Boolean(service.is_active),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(defaultFormData);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      showAlert.warning(
        "Campos incompletos",
        "El nombre del servicio es obligatorio.",
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
        field: "name",
        headerName: "Nombre del Servicio",
        flex: 1.5,
        minWidth: 200,
      },
      {
        field: "specialty_name",
        headerName: "Especialidad",
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          if (params.value) {
            return (
              <Box
                sx={{ display: "flex", alignItems: "center", height: "100%" }}
              >
                <Chip
                  label={params.value}
                  size="small"
                  sx={{
                    bgcolor: "secondary.50",
                    color: "secondary.main",
                    fontWeight: 500,
                  }}
                />
              </Box>
            );
          }
          return (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", height: "100%" }}
            >
              Sin especialidad
            </Typography>
          );
        },
      },
      {
        field: "label_color",
        headerName: "Color Agenda",
        width: 150,
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              height: "100%",
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                bgcolor: params.value,
                border: 1,
                borderColor: "grey.300",
              }}
            />
            <Typography variant="body2" fontFamily="monospace">
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: "is_active",
        headerName: "Estado",
        width: 130,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Chip
              label={params.value ? "Activo" : "Inactivo"}
              color={params.value ? "success" : "default"}
              size="small"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        ),
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
            onClick={() => handleOpenEdit(params.row as Service)}
          >
            Editar
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
            Catálogo de Servicios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra los servicios, su especialidad y colores para la agenda.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenCreate}
          sx={{ boxShadow: 1 }}
        >
          + Nuevo Servicio
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
          rows={services}
          columns={columns}
          loading={isLoading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Box>

      {/* Modal / Dialogo de Creación/Edición */}
      <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold">
          {editingId ? "Editar Servicio" : "Agregar Servicio"}
        </DialogTitle>
        <Divider />

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
        >
          <TextField
            label="Nombre del Servicio *"
            variant="outlined"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Láser Cuerpo Completo"
          />

          <Box>
            <TextField
              select
              label="Especialidad"
              value={formData.specialty_id || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specialty_id: e.target.value ? Number(e.target.value) : null,
                })
              }
              fullWidth
              variant="outlined"
            >
              <MenuItem value="">
                <em>Sin especialidad</em>
              </MenuItem>
              {specialties.map((sp) => (
                <MenuItem key={sp.id} value={sp.id}>
                  {sp.name}
                </MenuItem>
              ))}
            </TextField>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              La especialidad determina si se requiere ficha clínica adicional
              (ej. Láser).
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Color de Etiqueta
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                type="color"
                value={formData.label_color}
                onChange={(e) =>
                  setFormData({ ...formData, label_color: e.target.value })
                }
                sx={{
                  width: 80,
                  "& input": { height: 40, p: 0.5, cursor: "pointer" },
                }}
              />
              <TextField
                type="text"
                value={formData.label_color}
                onChange={(e) =>
                  setFormData({ ...formData, label_color: e.target.value })
                }
                fullWidth
                inputProps={{
                  style: {
                    textTransform: "uppercase",
                    fontFamily: "monospace",
                  },
                }}
              />
            </Box>
          </Box>

          <Divider />

          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(formData.is_active)}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                color="primary"
              />
            }
            label="¿Servicio activo y disponible para agendar?"
          />
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
            {isSaving ? "Guardando..." : "Guardar Servicio"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServicesPage;
