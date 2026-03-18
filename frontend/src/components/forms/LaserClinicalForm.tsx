import { Controller, useForm } from "react-hook-form";
import type { LaserClinicalRecord } from "@/services/types";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";

type LaserFormData = {
  tattoos_zone: string;
  photosensitive_meds: string;
  implants_zone: string;
  plates_prosthesis_zone: string;
  atypical_nevus_zone: string;
  skin_diseases: string;
  current_hair_removal_method: string;
  skin_color_score: string;
  hair_color_score: string;
  eye_color_score: string;
  freckles_score: string;
  genetic_heritage_score: string;
  burn_potential_score: string;
  tan_potential_score: string;
};

interface LaserClinicalFormProps {
  onSubmitData?: (
    data: Omit<LaserClinicalRecord, "id" | "appointment_id">,
  ) => void;
  onBack?: () => void;
  isSaving?: boolean;
  defaultValues?: Partial<LaserFormData>;
}

export function LaserClinicalForm({
  onSubmitData,
  onBack,
  isSaving = false,
  defaultValues,
}: LaserClinicalFormProps) {
  const { register, watch, handleSubmit, control } = useForm<LaserFormData>({
    defaultValues: {
      skin_color_score: "0",
      hair_color_score: "0",
      eye_color_score: "0",
      freckles_score: "0",
      genetic_heritage_score: "0",
      burn_potential_score: "0",
      tan_potential_score: "0",
      ...defaultValues,
    },
  });

  const watchScores = watch([
    "skin_color_score",
    "hair_color_score",
    "eye_color_score",
    "freckles_score",
    "genetic_heritage_score",
    "burn_potential_score",
    "tan_potential_score",
  ]);

  const totalScore = watchScores.reduce(
    (acc, val) => acc + (parseInt(val) || 0),
    0,
  );

  let fitzpatrickType = 1;
  let fitzpatrickLabel = "";
  if (totalScore <= 7) {
    fitzpatrickType = 1;
    fitzpatrickLabel = "I — Piel muy clara, siempre se quema";
  } else if (totalScore <= 16) {
    fitzpatrickType = 2;
    fitzpatrickLabel = "II — Piel clara, a veces se quema";
  } else if (totalScore <= 25) {
    fitzpatrickType = 3;
    fitzpatrickLabel = "III — Trigueña, se quema moderadamente";
  } else if (totalScore <= 30) {
    fitzpatrickType = 4;
    fitzpatrickLabel = "IV — Morena clara, se quema mínimo";
  } else if (totalScore <= 35) {
    fitzpatrickType = 5;
    fitzpatrickLabel = "V — Oscura, raramente se quema";
  } else {
    fitzpatrickType = 6;
    fitzpatrickLabel = "VI — Muy oscura, nunca se quema";
  }

  const onSubmit = (data: LaserFormData) => {
    const result: Omit<LaserClinicalRecord, "id" | "appointment_id"> = {
      tattoos_zone: data.tattoos_zone || undefined,
      photosensitive_meds: data.photosensitive_meds || undefined,
      implants_zone: data.implants_zone || undefined,
      plates_prosthesis_zone: data.plates_prosthesis_zone || undefined,
      atypical_nevus_zone: data.atypical_nevus_zone || undefined,
      skin_diseases: data.skin_diseases || undefined,
      current_hair_removal_method:
        data.current_hair_removal_method || undefined,
      skin_color_score: parseInt(data.skin_color_score),
      hair_color_score: parseInt(data.hair_color_score),
      eye_color_score: parseInt(data.eye_color_score),
      freckles_score: parseInt(data.freckles_score),
      genetic_heritage_score: parseInt(data.genetic_heritage_score),
      burn_potential_score: parseInt(data.burn_potential_score),
      tan_potential_score: parseInt(data.tan_potential_score),
      total_score: totalScore,
      fitzpatrick_type: fitzpatrickType,
    };

    if (onSubmitData) {
      onSubmitData(result);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        bgcolor: "background.paper",
        p: 3,
        borderRadius: 2,
        border: 1,
        borderColor: "grey.200",
      }}
    >
      {/* Sección 1: Antecedentes clínicos */}
      <Box>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          1. Antecedentes Clínicos (Contraindicaciones)
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            label="Enfermedades a la Piel / Otras (Ca, HTA, Epilepsia)"
            variant="outlined"
            fullWidth
            placeholder="Ej: Ninguna"
            {...register("skin_diseases")}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Medicamentos Fotosensibles actuales"
            variant="outlined"
            fullWidth
            placeholder="Ej: Isotretinoína"
            {...register("photosensitive_meds")}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Tatuajes (Indicar zona)"
            variant="outlined"
            fullWidth
            placeholder="Ej: Brazo derecho"
            {...register("tattoos_zone")}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Implantes / Injertos (Indicar zona)"
            variant="outlined"
            fullWidth
            placeholder="Ninguno"
            {...register("implants_zone")}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Placas / Prótesis / Marcapasos"
            variant="outlined"
            fullWidth
            placeholder="Ninguno"
            {...register("plates_prosthesis_zone")}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Nevus Atípico (Indicar zona)"
            variant="outlined"
            fullWidth
            placeholder="Ninguno"
            {...register("atypical_nevus_zone")}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Método de depilación actual"
            variant="outlined"
            fullWidth
            placeholder="Ej: Máquina de afeitar, Cera"
            {...register("current_hair_removal_method")}
            InputLabelProps={{ shrink: true }}
            sx={{ gridColumn: { md: "span 2" } }}
          />
        </Box>
      </Box>

      {/* Sección 2: Test Fitzpatrick */}
      <Box
        sx={{
          bgcolor: "grey.50",
          p: 3,
          borderRadius: 2,
          border: 1,
          borderColor: "info.light",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            2. Test Fototipo de Fitzpatrick
          </Typography>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="primary.main"
          >
            Puntaje: {totalScore}
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          {[
            {
              label: "1. Color de Ojos",
              field: "eye_color_score",
              options: [
                "Verde claro, azul, gris claro (0)",
                "Azul, verde, gris (1)",
                "Marrón claro (2)",
                "Marrón oscuro (3)",
                "Negro (4)",
              ],
            },
            {
              label: "2. Color natural del Pelo",
              field: "hair_color_score",
              options: [
                "Pelirrojo (0)",
                "Rubio (1)",
                "Castaño claro (2)",
                "Castaño oscuro (3)",
                "Negro (4)",
              ],
            },
            {
              label: "3. Color natural de Piel",
              field: "skin_color_score",
              options: [
                "Rosada (0)",
                "Muy pálida (1)",
                "Clara (2)",
                "Mate / Trigueña (3)",
                "Oscura o Negra (4)",
              ],
            },
            {
              label: "4. Cantidad de Pecas (Sin sol)",
              field: "freckles_score",
              options: [
                "Pecas en todo el cuerpo (0)",
                "Varias pecas en cara y cuerpo (1)",
                "Pocas pecas (2)",
                "Casí ninguna (3)",
                "Ninguna peca (4)",
              ],
            },
            {
              label: "5. Herencia Genética",
              field: "genetic_heritage_score",
              options: [
                "Caucásica de cutis muy blanco (0)",
                "Caucásica de cutis claro (1)",
                "Caucásica oscura / Mestiza clara (2)",
                "Origen medio oriente, mestizo, asia (3)",
                "Aborígenes, Afroamericanos (4)",
              ],
            },
            {
              label: "6. ¿Qué pasa cuando te expones al sol?",
              field: "burn_potential_score",
              options: [
                "Siempre se quema con enrojecimiento (0)",
                "Se quema seguido y duele (1)",
                "A veces se quema (2)",
                "Pocas veces se quema (3)",
                "Nunca se quema (4)",
              ],
            },
            {
              label: "7. ¿Cómo es tu bronceado?",
              field: "tan_potential_score",
              options: [
                "Nunca me bronceo (0)",
                "Muy poco bronceado (1)",
                "Bronceado moderado (2)",
                "Me bronceo rápido y profundo (3)",
                "Soy moreno/negro (4)",
              ],
            },
          ].map(({ label, field, options }) => (
            <Controller
              key={field}
              name={field as keyof LaserFormData}
              control={control}
              render={({ field: { onChange, value } }) => (
                <Autocomplete
                  disableClearable
                  options={options}
                  value={options[parseInt(value)] || undefined}
                  onChange={(_, newValue) => {
                    const score = options.indexOf(newValue as string);
                    onChange(score.toString());
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={label}
                      variant="outlined"
                      fullWidth
                    />
                  )}
                />
              )}
            />
          ))}
        </Box>

        {/* Banner de Resultado */}
        <Box
          sx={{
            mt: 4,
            p: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderRadius: 2,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            boxShadow: 2,
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ opacity: 0.8, fontWeight: "bold", letterSpacing: 1 }}
            >
              Resultado
            </Typography>
            <Typography variant="subtitle1" fontWeight="medium">
              Fototipo {fitzpatrickLabel}
            </Typography>
          </Box>

          {(totalScore <= 7 || totalScore >= 35) && (
            <Chip
              label="⚠️ Revisar parámetros máquina"
              color="warning"
              sx={{
                fontWeight: "bold",
                bgcolor: "warning.main",
                color: "warning.contrastText",
              }}
            />
          )}
        </Box>
      </Box>

      {/* Botonera inferior */}
      <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1 }}>
        {onBack && (
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            onClick={onBack}
          >
            ← Atrás
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={isSaving}
          sx={{
            ml: "auto",
            px: 4,
            bgcolor: "grey.900",
            "&:hover": { bgcolor: "black" },
          }}
          disableElevation
        >
          {isSaving ? "Guardando..." : "Guardar Reserva con Ficha"}
        </Button>
      </Box>
    </Box>
  );
}
