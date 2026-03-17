import { useState, type FunctionComponent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { showAlert } from "@/lib/alerts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CreatePatientDTO, Patient } from "@/services/types";

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<CreatePatientDTO>(defaultFormData);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: api.getPatients,
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
      showAlert.warning("Campos incompletos", "El nombre completo y el teléfono son obligatorios.");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-slate-500">
            Gestiona la información y el historial clínico de los pacientes.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + Nuevo Paciente
        </Button>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Alergias / Tratamientos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  No hay pacientes registrados.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient: Patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    {patient.full_name}
                    <div className="text-xs text-slate-500">
                      {patient.age} años
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{patient.phone}</div>
                    <div className="text-xs text-slate-500">
                      {patient.email || "Sin email"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600">
                      {patient.allergies
                        ? `Alergias: ${patient.allergies}`
                        : "Sin alergias conocidas"}
                    </div>
                    {(patient.pregnant_lactating ||
                      patient.medical_treatment) && (
                      <div className="text-xs text-amber-600 mt-1 font-medium">
                        ⚠️ Atención especial requerida
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(patient)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewFicha(patient)}
                    >
                      Ver Ficha
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Paciente" : "Registrar Nuevo Paciente"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Nombre Completo *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Ej: Ana Gabriela Silva"
              />
            </div>
            <div className="space-y-2">
              <Label>Edad</Label>
              <Input
                type="number"
                value={formData.age || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    age: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Dirección</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Calle, Número, Comuna"
              />
            </div>

            <div className="col-span-2 mt-2 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">
                Información Médica Básica
              </h4>
            </div>

            <div className="space-y-2 col-span-2 flex flex-col justify-center">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pregnant_lactating}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pregnant_lactating: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                ¿Está embarazada o en periodo de lactancia?
              </Label>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Alergias Conocidas</Label>
              <Input
                value={formData.allergies}
                onChange={(e) =>
                  setFormData({ ...formData, allergies: e.target.value })
                }
                placeholder="Ej: Alergia al látex, penicilina..."
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Tratamientos Médicos Actuales</Label>
              <Input
                value={formData.medical_treatment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    medical_treatment: e.target.value,
                  })
                }
                placeholder="Ej: Tratamiento para la tiroides..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Paciente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">
              {selectedPatient?.full_name}
            </SheetTitle>
            <SheetDescription>
              Ficha Clínica e Información de Contacto
            </SheetDescription>
          </SheetHeader>

          {selectedPatient && (
            <div className="space-y-6 text-sm">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-2">
                  Datos de Contacto
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="font-medium text-slate-900">Teléfono:</div>
                  <div>{selectedPatient.phone}</div>
                  <div className="font-medium text-slate-900">Email:</div>
                  <div>{selectedPatient.email || "-"}</div>
                  <div className="font-medium text-slate-900">Edad:</div>
                  <div>{selectedPatient.age} años</div>
                  <div className="font-medium text-slate-900">Dirección:</div>
                  <div>{selectedPatient.address || "-"}</div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h4 className="font-semibold text-amber-900 mb-2">
                  Alertas Médicas
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-amber-900 block">
                      Condición Especial:
                    </span>
                    <span className="text-amber-800">
                      {selectedPatient.pregnant_lactating
                        ? "Embarazada / Lactando"
                        : "Ninguna reportada"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-amber-900 block">
                      Alergias:
                    </span>
                    <span className="text-amber-800">
                      {selectedPatient.allergies || "Ninguna reportada"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-amber-900 block">
                      Tratamientos Actuales:
                    </span>
                    <span className="text-amber-800">
                      {selectedPatient.medical_treatment || "Ninguno reportado"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-slate-900 mb-2">
                  Historial de Citas
                </h4>
                <p className="text-slate-500 italic">
                  Próximamente: Aquí se listarán las sesiones de depilación,
                  masajes, etc. agendadas para este paciente.
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PatientsPage;
