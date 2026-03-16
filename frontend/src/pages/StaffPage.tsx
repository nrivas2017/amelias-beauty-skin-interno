import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { Staff, Specialty } from "@/services/types";

interface StaffWithSpecialties extends Staff {
  specialties?: { id: number; name: string }[];
}

const defaultFormData = {
  full_name: "",
  is_active: true,
  specialty_ids: [] as number[],
};

const StaffPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [formData, setFormData] = useState(defaultFormData);

  const { data: staffList = [], isLoading: isLoadingStaff } = useQuery<
    StaffWithSpecialties[]
  >({
    queryKey: ["staff"],
    queryFn: api.getStaff,
  });

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
    onError: (err: any) => alert("Error al crear: " + err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      api.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      closeModal();
    },
    onError: (err: any) => alert("Error al actualizar: " + err.message),
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (person: StaffWithSpecialties) => {
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
      alert("El nombre es obligatorio");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personal</h1>
          <p className="text-slate-500">Gestiona al equipo y sus datos.</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + Nuevo Miembro
        </Button>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingStaff ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : staffList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No hay personal registrado.
                </TableCell>
              </TableRow>
            ) : (
              staffList.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">
                    {person.full_name}
                  </TableCell>
                  <TableCell>
                    {person.specialties && person.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {person.specialties.map((sp) => (
                          <span
                            key={sp.id}
                            className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200"
                          >
                            {sp.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Sin especialidades
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {person.is_active ? (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        Inactivo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(person)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Personal" : "Agregar Nuevo Personal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Ej: María José Sandoval"
              />
            </div>

            <div className="space-y-3">
              <Label>Especialidades</Label>
              {isLoadingSpecialties ? (
                <p className="text-sm text-slate-500">
                  Cargando especialidades...
                </p>
              ) : specialtiesList.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay especialidades registradas en el sistema.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3 bg-slate-50 max-h-48 overflow-y-auto">
                  {specialtiesList.map((sp) => {
                    const spId =
                      typeof sp.id === "string" ? parseInt(sp.id) : sp.id;
                    const isChecked = formData.specialty_ids.includes(spId);

                    return (
                      <div key={spId} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`specialty-${spId}`}
                          checked={isChecked}
                          onChange={() => toggleSpecialty(spId)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        />
                        <Label
                          htmlFor={`specialty-${spId}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {sp.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t">
              <input
                type="checkbox"
                id="is_active_checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <Label htmlFor="is_active_checkbox" className="cursor-pointer">
                ¿Personal se encuentra activo?
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPage;
