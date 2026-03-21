import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { showAlert } from "@/lib/alerts";
import type { LaserZone, CreateLaserZoneDTO } from "@/services/types";

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
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

const defaultFormData: CreateLaserZoneDTO = {
  name: "",
  description: "",
  is_active: true,
};

const LaserZonesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [formData, setFormData] = useState<CreateLaserZoneDTO>(defaultFormData);

  const { data: zonesList = [], isLoading } = useQuery<LaserZone[]>({
    queryKey: ["laser-zones"],
    queryFn: api.getLaserZones,
  });

  const createMutation = useMutation({
    mutationFn: api.createLaserZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laser-zones"] });
      closeModal();
    },
    onError: (err: any) => {
      return showAlert.error("Error al crear", err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: Partial<CreateLaserZoneDTO>;
    }) => api.updateLaserZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laser-zones"] });
      closeModal();
    },
    onError: (err: any) => showAlert.error("Error al actualizar", err.message),
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (zone: LaserZone) => {
    setEditingId(zone.id);
    setFormData({
      name: zone.name,
      description: zone.description || "",
      is_active: Boolean(zone.is_active),
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
        "El nombre de la zona es obligatorio",
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
        headerName: "Nombre de la zona",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "description",
        headerName: "Descripción",
        flex: 2,
        minWidth: 250,
      },
      {
        field: "is_active",
        headerName: "Estado",
        width: 150,
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
            onClick={() => handleOpenEdit(params.row as LaserZone)}
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
            Zonas de Láser
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona las zonas corporales para tratamientos de depilación láser.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenCreate}
          sx={{ boxShadow: 1 }}
        >
          + Nueva Zona
        </Button>
      </Box>

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
          rows={zonesList}
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

      <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold">
          {editingId ? "Editar Zona" : "Agregar Nueva Zona"}
        </DialogTitle>
        <Divider />

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
        >
          <TextField
            label="Nombre de la zona *"
            variant="outlined"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Rostro, Piernas, Axilas"
          />

          <TextField
            label="Descripción (Opcional)"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Descripción adicional de la zona..."
          />

          <Divider />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                color="primary"
              />
            }
            label="¿Zona activa?"
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
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LaserZonesPage;
