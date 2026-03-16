import { useState, type FunctionComponent } from "react";
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
import type { CreateServiceDTO, Service } from "@/services/types";

const defaultFormData: CreateServiceDTO = {
  name: "",
  estimated_duration: 60,
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

  const createMutation = useMutation({
    mutationFn: api.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      closeModal();
    },
    onError: (error: any) =>
      alert("Error al crear el servicio: " + error.message),
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
      alert("Error al actualizar el servicio: " + error.message),
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
      estimated_duration: service.estimated_duration,
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
      alert("El nombre del servicio es obligatorio.");
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
          <h1 className="text-3xl font-bold tracking-tight">
            Catálogo de Servicios
          </h1>
          <p className="text-slate-500">
            Administra los servicios, su duración y colores para la agenda.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + Nuevo Servicio
        </Button>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nombre del Servicio</TableHead>
              <TableHead>Duración (Minutos)</TableHead>
              <TableHead>Color Agenda</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No hay servicios registrados.
                </TableCell>
              </TableRow>
            ) : (
              services.map((service: Service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.estimated_duration} min</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: service.label_color }}
                      ></div>
                      <span className="text-xs font-mono">
                        {service.label_color}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {service.is_active ? (
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
                      onClick={() => handleOpenEdit(service)}
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
              {editingId ? "Editar Servicio" : "Agregar Servicio"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Servicio *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Depilación Láser Piernas"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duración (Minutos) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.estimated_duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimated_duration: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color de Etiqueta</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-10 p-1 w-16"
                    value={formData.label_color}
                    onChange={(e) =>
                      setFormData({ ...formData, label_color: e.target.value })
                    }
                  />
                  <Input
                    type="text"
                    value={formData.label_color}
                    onChange={(e) =>
                      setFormData({ ...formData, label_color: e.target.value })
                    }
                    className="flex-1 uppercase font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="service_active_checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <Label
                htmlFor="service_active_checkbox"
                className="cursor-pointer"
              >
                ¿Servicio activo y disponible para agendar?
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Servicio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesPage;
