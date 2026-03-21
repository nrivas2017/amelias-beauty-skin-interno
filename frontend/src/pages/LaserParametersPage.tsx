import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { showAlert } from "@/lib/alerts";
import type {
  LaserPatient,
  LaserZone,
  LaserSessionWithParams,
} from "@/services/types";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";

import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import type { MRT_ColumnDef } from "material-react-table";
import dayjs from "dayjs";
import { formatRut } from "@/utils/rut";

const PARAMETER_ROWS = [
  { id: "fecha", property_name: "Fecha", editable: false },
  { id: "profesional", property_name: "Profesional", editable: false },
  { id: "mole_or_tattoo", property_name: "Lunar o Tatuaje", editable: true },
  { id: "energy_j_cm2", property_name: "Energía (J/cm2)", editable: true },
  {
    id: "pulse_width_ms",
    property_name: "Ancho de Pulso (ms)",
    editable: true,
  },
  { id: "frequency", property_name: "Frecuencia", editable: true },
  {
    id: "laser_intensity",
    property_name: "Intensidad de laser",
    editable: true,
  },
  { id: "machine_used", property_name: "Maquina utilizada", editable: true },
  {
    id: "reevaluation_description",
    property_name: "Descripción de reevaluacion",
    editable: true,
  },
  { id: "general_notes", property_name: "Observaciones", editable: true },
];

const LaserParametersPage = () => {
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState<
    string | number | null
  >(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | number | null>(
    null,
  );
  const [patientSearch, setPatientSearch] = useState("");

  const { data: patients = [], isLoading: loadingPatients } = useQuery<
    LaserPatient[]
  >({
    queryKey: ["laser-patients"],
    queryFn: api.getLaserPatients,
  });

  const { data: zones = [], isLoading: loadingZones } = useQuery<LaserZone[]>({
    queryKey: ["laser-zones"],
    queryFn: api.getLaserZones,
  });

  const {
    data: sessions = [],
    isLoading: loadingSessions,
    isFetching: fetchingSessions,
  } = useQuery<LaserSessionWithParams[]>({
    queryKey: ["laser-sessions", selectedPatientId],
    queryFn: () => api.getLaserSessionsByPatient(selectedPatientId!),
    enabled: !!selectedPatientId,
  });

  const upsertMutation = useMutation({
    mutationFn: ({
      sessionId,
      zoneId,
      data,
    }: {
      sessionId: string | number;
      zoneId: string | number;
      data: any;
    }) => api.upsertLaserParameters(sessionId, zoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["laser-sessions", selectedPatientId],
      });
    },
    onError: (err: any) => {
      showAlert.error("Error", err.message);
    },
  });

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const search = patientSearch.toLowerCase();
      const cleanRut = p.national_id.replace(/[^0-9kK]/g, "").toLowerCase();
      return (
        p.full_name.toLowerCase().includes(search) ||
        cleanRut.includes(search) ||
        p.national_id.toLowerCase().includes(search)
      );
    });
  }, [patients, patientSearch]);

  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    if (!selectedZoneId || !sessions.length) {
      return [];
    }

    const dynamicColumns: MRT_ColumnDef<any>[] = [
      {
        accessorKey: "property_name",
        header: "Parámetro",
        size: 220,
        enableEditing: false,
      },
    ];

    sessions.forEach((session, index) => {
      dynamicColumns.push({
        accessorKey: `session_${session.id}`,
        header: `Sesión ${index + 1}`,
        size: 180,
        muiEditTextFieldProps: ({ cell, row }) => ({
          type: "text",
          disabled: !row.original._editable,
          onBlur: async (event) => {
            if (!row.original._editable) return;
            const newValue = event.target.value;
            // Solo guardar si el valor cambió
            if (newValue === cell.getValue()) return;

            const propertyId = row.original.id; // "energy_j_cm2" etc.
            const sessionObj = session;

            const currentParams =
              sessionObj?.parameters?.find(
                (p) => String(p.zone_id) === String(selectedZoneId),
              ) || {};

            const dataToSave: any = { ...currentParams };

            if (propertyId === "general_notes") {
              dataToSave.general_notes = newValue;
            } else {
              dataToSave[propertyId] = newValue;
            }

            try {
              await upsertMutation.mutateAsync({
                sessionId: session.id,
                zoneId: selectedZoneId!,
                data: dataToSave,
              });
            } catch (e) {
              console.error(e);
            }
          },
        }),
      });
    });

    return dynamicColumns;
  }, [sessions, selectedZoneId]);

  const rows = useMemo(() => {
    if (!selectedZoneId || !sessions.length) {
      return [];
    }

    return PARAMETER_ROWS.map((paramDef) => {
      const rowData: Record<string, any> = {
        id: paramDef.id,
        property_name: paramDef.property_name,
        _editable: paramDef.editable,
      };

      sessions.forEach((session) => {
        const fieldKey = `session_${session.id}`;

        if (paramDef.id === "fecha") {
          rowData[fieldKey] = dayjs(session.start_date_time).format(
            "DD/MM/YYYY HH:mm",
          );
        } else if (paramDef.id === "profesional") {
          rowData[fieldKey] = session.staff_name || "Sin asignar";
        } else if (paramDef.id === "general_notes") {
          rowData[fieldKey] = session.notes || "";
        } else {
          const paramForZone = session.parameters?.find(
            (p) => String(p.zone_id) === String(selectedZoneId),
          );
          rowData[fieldKey] = paramForZone
            ? (paramForZone as any)[paramDef.id] || ""
            : "";
        }
      });

      return rowData;
    });
  }, [sessions, selectedZoneId]);

  const table = useMaterialReactTable({
    columns,
    data: rows,
    enableTopToolbar: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableStickyHeader: true,
    enableColumnPinning: true,
    enableEditing: true,
    editDisplayMode: "cell",
    initialState: {
      columnPinning: { left: ["property_name"] },
    },
    muiTableContainerProps: {
      className: "mrt-scroller",
      sx: { height: "100%", flexGrow: 1 },
    },
    muiTableBodyCellProps: ({ row, column }) => {
      // Diferenciar visualmente la celda editable de las bloqueadas
      if (!row.original._editable && column.id !== "property_name") {
        return {
          sx: { opacity: 0.6, bgcolor: "transparent !important" },
        };
      }
      return {};
    },
  });

  useMemo(() => {
    if (zones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  // Auto-scroll a la derecha
  useEffect(() => {
    if (sessions.length > 0) {
      const timer = setTimeout(() => {
        const scroller = document.querySelector(".mrt-scroller");
        if (scroller) {
          scroller.scrollLeft = scroller.scrollWidth;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sessions.length, selectedZoneId]);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, height: "100%" }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            color="text.primary"
            gutterBottom
          >
            Parámetros de Depilación Láser
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Selecciona un paciente y revisa su historial de parámetros por zona.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 3, flexGrow: 1, overflow: "hidden" }}>
        <Paper
          sx={{
            width: 250,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: 1,
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: "primary.50",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="primary.900"
            >
              Pacientes ({filteredPatients.length})
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar paciente..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              sx={{ mt: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { bgcolor: "background.paper" },
              }}
            />
          </Box>

          <List sx={{ flexGrow: 1, overflow: "auto", p: 0 }}>
            {loadingPatients ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredPatients.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ p: 2, color: "text.secondary", textAlign: "center" }}
              >
                No se encontraron pacientes.
              </Typography>
            ) : (
              filteredPatients.map((p) => (
                <Box key={p.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={selectedPatientId === p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemText
                        primary={p.full_name}
                        secondary={formatRut(p.national_id)}
                        primaryTypographyProps={{
                          fontWeight:
                            selectedPatientId === p.id ? "bold" : "normal",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </Box>
              ))
            )}
          </List>
        </Paper>

        <Paper
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: 1,
            borderRadius: 2,
          }}
        >
          {loadingZones ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : zones.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
              No existen zonas de láser configuradas en el sistema.
            </Box>
          ) : !selectedPatientId ? (
            <Box
              sx={{
                p: 4,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
              }}
            >
              Selecciona un paciente a la izquierda para ver su historial.
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Tabs
                  value={selectedZoneId}
                  onChange={(_, val) => setSelectedZoneId(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ minHeight: 48 }}
                >
                  {zones.map((zone) => (
                    <Tab
                      key={zone.id}
                      value={zone.id}
                      label={zone.name}
                      sx={{ minHeight: 48, fontWeight: "bold" }}
                    />
                  ))}
                </Tabs>
              </Box>

              <Box
                sx={{
                  flexGrow: 1,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "auto",
                }}
              >
                {loadingSessions && !fetchingSessions ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : sessions.length === 0 ? (
                  <Box
                    sx={{ p: 4, textAlign: "center", color: "text.secondary" }}
                  >
                    Este paciente no ha tenido ninguna sesión registrada aún.
                  </Box>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Haz clic en las celdas de la tabla para editar los
                      parámetros. Los cambios se guardarán automáticamente al
                      salir del recuadro.
                    </Typography>

                    <Box>
                      <MaterialReactTable table={table} />
                    </Box>
                  </>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default LaserParametersPage;
