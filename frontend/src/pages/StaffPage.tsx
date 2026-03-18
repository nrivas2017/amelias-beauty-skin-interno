import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { showAlert } from "@/lib/alerts";
import type { Staff, Specialty } from "@/services/types";

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
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";

import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

const defaultFormData = {
  full_name: "",
  is_active: true,
  specialty_ids: [] as Array<number | string>,
};

const StaffPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [formData, setFormData] = useState(defaultFormData);

  const { data: staffList = [], isLoading: isLoadingStaff } = useQuery<Staff[]>(
    {
      queryKey: ["staff"],
      queryFn: api.getStaff,
    },
  );

  const { data: specialtiesList = [], isLoading: isLoadingSpecialties } =
    useQuery<Specialty[]>({
      queryKey: ["specialties"],
      queryFn: api.getSpecialties,
    });

  const createMutation = useMutation({
    mutationFn: api.createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      closeModal();
    },
    onError: (err: any) => showAlert.error("Error al crear", err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      api.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      closeModal();
    },
    onError: (err: any) => showAlert.error("Error al actualizar", err.message),
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (person: Staff) => {
    setEditingId(person.id);
    setFormData({
      full_name: person.full_name,
      is_active: Boolean(person.is_active),
      specialty_ids: person.specialties
        ? person.specialties.map((sp) => sp.id)
        : [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(defaultFormData);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.full_name.trim()) {
      showAlert.warning("Campos incompletos", "El nombre es obligatorio");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleSpecialty = (specialtyId: number) => {
    setFormData((prev) => {
      const currentIds = prev.specialty_ids || [];
      if (currentIds.includes(specialtyId)) {
        return {
          ...prev,
          specialty_ids: currentIds.filter((id) => id !== specialtyId),
        };
      } else {
        return { ...prev, specialty_ids: [...currentIds, specialtyId] };
      }
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "full_name",
        headerName: "Nombre",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "specialties",
        headerName: "Especialidades",
        flex: 2,
        minWidth: 250,
        sortable: false,
        renderCell: (params) => {
          const specialties = params.value as Specialty[];
          if (!specialties || specialties.length === 0) {
            return (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: "flex", alignItems: "center", height: "100%" }}
              >
                Sin especialidades
              </Typography>
            );
          }
          return (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
                alignItems: "center",
                height: "100%",
                py: 1,
              }}
            >
              {specialties.map((sp) => (
                <Chip
                  key={sp.id}
                  label={sp.name}
                  size="small"
                  sx={{
                    bgcolor: "secondary.50",
                    color: "secondary.main",
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>
          );
        },
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
            onClick={() => handleOpenEdit(params.row as Staff)}
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
            Personal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona al equipo y sus datos.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenCreate}
          sx={{ boxShadow: 1 }}
        >
          + Nuevo Miembro
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
          rows={staffList}
          columns={columns}
          loading={isLoadingStaff}
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
      <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold">
          {editingId ? "Editar Personal" : "Agregar Nuevo Personal"}
        </DialogTitle>
        <Divider />

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
        >
          <TextField
            label="Nombre completo *"
            variant="outlined"
            fullWidth
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            placeholder="Ej: María José Sandoval"
          />

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Especialidades
            </Typography>
            {isLoadingSpecialties ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Cargando especialidades...
                </Typography>
              </Box>
            ) : specialtiesList.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay especialidades registradas en el sistema.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                  bgcolor: "grey.50",
                  p: 2,
                  borderRadius: 1,
                  border: 1,
                  borderColor: "grey.200",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {specialtiesList.map((sp) => {
                  const spId =
                    typeof sp.id === "string" ? parseInt(sp.id) : sp.id;
                  const isChecked = formData.specialty_ids.includes(spId);

                  return (
                    <FormControlLabel
                      key={spId}
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={() => toggleSpecialty(spId)}
                          color="primary"
                        />
                      }
                      label={<Typography variant="body2">{sp.name}</Typography>}
                    />
                  );
                })}
              </Box>
            )}
          </Box>

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
            label="¿Personal se encuentra activo?"
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

export default StaffPage;
