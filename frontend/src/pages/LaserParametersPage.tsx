import { useState, useMemo } from "react";
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

import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRowModel } from "@mui/x-data-grid";
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
      // showAlert.success("Guardado", "Parámetros actualizados correctamente");
    },
    onError: (err: any) => {
      showAlert.error("Error", err.message);
    },
  });

  // Build rows and columns for the DataGrid whenever selectedZone or sessions change
  const { columns, rows } = useMemo(() => {
    if (!selectedZoneId || !sessions.length) {
      return { columns: [], rows: [] };
    }

    // CABECERAS DE COLUMNAS (1 fija + N sesiones)
    const dynamicColumns: GridColDef[] = [
      {
        field: "property_name",
        headerName: "Parámetro",
        width: 220,
        sortable: false,
        disableColumnMenu: true,
      },
    ];

    sessions.forEach((session, index) => {
      dynamicColumns.push({
        field: `session_${session.id}`,
        headerName: `Sesión ${index + 1}`,
        width: 180,
        sortable: false,
        disableColumnMenu: true,
        editable: true,
      });
    });

    // FILAS TRASPUESTAS
    const dynamicRows = PARAMETER_ROWS.map((paramDef) => {
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
          // Es un parámetro específico de la zona
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

    return { columns: dynamicColumns, rows: dynamicRows };
  }, [sessions, selectedZoneId]);

  const processRowUpdate = async (
    newRow: GridRowModel,
    oldRow: GridRowModel,
  ) => {
    // Si la fila no es editable (ej: Fecha o Profesional), ignoramos
    if (!newRow._editable) return oldRow;

    // Buscamos qué columna de sesión cambió
    let changedSessionId: string | number | null = null;
    let newValue: string = "";

    sessions.forEach((session) => {
      const fieldKey = `session_${session.id}`;
      if (newRow[fieldKey] !== oldRow[fieldKey]) {
        changedSessionId = session.id;
        newValue = newRow[fieldKey];
      }
    });

    if (changedSessionId && selectedZoneId) {
      // Preparar el objeto con TODOS los parámetros actuales de esta sesión para esa zona,
      // para no borrar los demás al hacer el PUT (el backend actualiza todos los datos)

      const sessionObj = sessions.find((s) => s.id === changedSessionId);
      const currentParams =
        sessionObj?.parameters?.find(
          (p) => String(p.zone_id) === String(selectedZoneId),
        ) || {};

      const dataToSave: any = { ...currentParams };

      if (newRow.id === "general_notes") {
        dataToSave.general_notes = newValue;
      } else {
        dataToSave[newRow.id] = newValue;
      }

      await upsertMutation.mutateAsync({
        sessionId: changedSessionId,
        zoneId: selectedZoneId,
        data: dataToSave,
      });

      return newRow;
    }

    return oldRow;
  };

  // Autoseleccionar primera zona si no hay ninguna
  useMemo(() => {
    if (zones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

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
              Pacientes ({patients.length})
            </Typography>
          </Box>

          <List sx={{ flexGrow: 1, overflow: "auto", p: 0 }}>
            {loadingPatients ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : patients.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ p: 2, color: "text.secondary" }}
              >
                No hay pacientes con servicios de láser.
              </Typography>
            ) : (
              patients.map((p) => (
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
                  overflow: "hidden",
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
                      Haz doble clic en las celdas de la tabla para editar los
                      parámetros. Los cambios se guardarán automáticamente.
                    </Typography>

                    <Box sx={{ flexGrow: 1, minHeight: 400, width: "100%" }}>
                      <DataGrid
                        rows={rows}
                        columns={columns}
                        processRowUpdate={processRowUpdate}
                        isCellEditable={(params) => params.row._editable}
                        hideFooter
                        disableColumnSelector
                        disableRowSelectionOnClick
                        sx={{
                          "& .MuiDataGrid-row:hover": {
                            bgcolor: "transparent",
                          },
                          "& .MuiDataGrid-cell--editable": {
                            bgcolor: "action.hover",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "action.selected" },
                          },
                        }}
                      />
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
