import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LaserClinicalRecord } from "@/services/types";

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
  const { register, watch, handleSubmit } = useForm<LaserFormData>({
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 bg-white p-6 rounded-xl border border-slate-200"
    >
      {/* Sección 1: Antecedentes clínicos */}
      <div>
        <h3 className="text-base font-semibold border-b pb-2 mb-4 text-slate-800">
          1. Antecedentes Clínicos (Contraindicaciones)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">
              Enfermedades a la Piel / Otras (Ca, HTA, Epilepsia)
            </Label>
            <Input {...register("skin_diseases")} placeholder="Ej: Ninguna" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              Medicamentos Fotosensibles actuales
            </Label>
            <Input
              {...register("photosensitive_meds")}
              placeholder="Ej: Isotretinoína"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tatuajes (Indicar zona)</Label>
            <Input
              {...register("tattoos_zone")}
              placeholder="Ej: Brazo derecho"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              Implantes / Injertos (Indicar zona)
            </Label>
            <Input {...register("implants_zone")} placeholder="Ninguno" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Placas / Prótesis / Marcapasos</Label>
            <Input
              {...register("plates_prosthesis_zone")}
              placeholder="Ninguno"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nevus Atípico (Indicar zona)</Label>
            <Input {...register("atypical_nevus_zone")} placeholder="Ninguno" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Método de depilación actual</Label>
            <Input
              {...register("current_hair_removal_method")}
              placeholder="Ej: Máquina de afeitar, Cera"
            />
          </div>
        </div>
      </div>

      {/* Sección 2: Test Fitzpatrick */}
      <div className="bg-slate-50 p-5 rounded-xl border border-blue-100">
        <h3 className="text-base font-semibold border-b border-blue-200 pb-2 mb-4 text-slate-800 flex justify-between">
          <span>2. Test Fototipo de Fitzpatrick</span>
          <span className="text-blue-600">Puntaje: {totalScore}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
            <div key={field} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <select
                {...register(field as keyof LaserFormData)}
                className="w-full flex h-9 rounded-md border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {options.map((opt, i) => (
                  <option key={i} value={i}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-5 p-4 bg-blue-600 text-white rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-blue-200 font-semibold mb-1">
              Resultado
            </h4>
            <p className="font-medium">Fototipo {fitzpatrickLabel}</p>
          </div>
          {(totalScore <= 7 || totalScore >= 35) && (
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider">
              ⚠️ Revisar parámetros máquina
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            ← Atrás
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-slate-900 text-white px-8 ml-auto"
        >
          {isSaving ? "Guardando..." : "Guardar Reserva con Ficha"}
        </Button>
      </div>
    </form>
  );
}
