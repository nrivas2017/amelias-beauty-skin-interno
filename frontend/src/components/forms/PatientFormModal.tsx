import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { showAlert } from "@/lib/alerts";
import type { CreatePatientDTO, Patient } from "@/services/types";
import { formatRut, cleanRut, validateRut } from "@/utils/rut";

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
import Divider from "@mui/material/Divider";

interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  editingPatient: Patient | null;
  existingPatients: Patient[];
  onSuccess?: (patientId: string | number) => void;
}

const defaultFormData: CreatePatientDTO = {
  national_id: "",
  full_name: "",
  age: 0,
  email: "",
  address: "",
  phone: "",
  pregnant_lactating: false,
  allergies: "",
  medical_treatment: "",
};

export const PatientFormModal = ({
  open,
  onClose,
  editingPatient,
  existingPatients,
  onSuccess,
}: PatientFormModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreatePatientDTO>(defaultFormData);
  const [rutError, setRutError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRutError(null);
      if (editingPatient) {
        setFormData({
          national_id: formatRut(editingPatient.national_id || ""),
          full_name: editingPatient.full_name,
          age: editingPatient.age,
          email: editingPatient.email,
          address: editingPatient.address,
          phone: editingPatient.phone,
          pregnant_lactating: editingPatient.pregnant_lactating,
          allergies: editingPatient.allergies,
          medical_treatment: editingPatient.medical_treatment,
        });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [open, editingPatient]);

  const createMutation = useMutation({
    mutationFn: api.createPatient,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      onSuccess?.(res.id);
      onClose();
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
      onSuccess?.(editingPatient!.id);
      onClose();
    },
    onError: (err: any) => showAlert.error("Error al actualizar", err.message),
  });

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const clean = value.replace(/[^0-9kK\.\-]/g, "");
    setFormData({ ...formData, national_id: clean });
    if (rutError) setRutError(null);
  };

  const validateRutInternal = (rut: string) => {
    if (!rut.trim()) return false;

    if (!validateRut(rut)) {
      setRutError("RUT inválido");
      return false;
    }

    const cleanInputRut = cleanRut(rut);
    const isDuplicate = existingPatients.some(
      (p) =>
        cleanRut(p.national_id) === cleanInputRut &&
        p.id !== editingPatient?.id,
    );

    if (isDuplicate) {
      setRutError("El RUT ingresado ya se encuentra registrado");
      return false;
    }

    setRutError(null);
    return true;
  };

  const handleRutBlur = () => {
    const formatted = formatRut(formData.national_id);
    setFormData({ ...formData, national_id: formatted });
    if (formatted) {
      validateRutInternal(formatted);
    }
  };

  const handleSave = () => {
    if (
      !formData.national_id.trim() ||
      !formData.full_name.trim() ||
      !formData.phone.trim()
    ) {
      showAlert.warning(
        "Campos incompletos",
        "El RUT, nombre completo y el teléfono son obligatorios.",
      );
      return;
    }

    if (!validateRutInternal(formData.national_id)) {
      return;
    }

    const cleanInputRut = cleanRut(formData.national_id);

    const payload = {
      ...formData,
      national_id: cleanInputRut,
    };

    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle fontWeight="bold">
        {editingPatient ? "Editar Paciente" : "Registrar Nuevo Paciente"}
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
            label="RUT *"
            variant="outlined"
            fullWidth
            value={formData.national_id}
            onChange={handleRutChange}
            onBlur={handleRutBlur}
            error={!!rutError}
            helperText={rutError}
            placeholder="Ej: 12.345.678-9"
          />
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
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Calle, Número, Comuna"
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
        <Button onClick={onClose} variant="outlined" color="inherit">
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
  );
};
