import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LaserFormData {
  tattoos_zone: string;
  photosensitive_meds: string;
  implants_zone: string;
  plates_prosthesis_zone: string;
  atypical_nevus_zone: string;
  skin_diseases: string;
  current_hair_removal_method: string;

  // Fitzpatrick
  skin_color_score: string;
  hair_color_score: string;
  eye_color_score: string;
  freckles_score: string;
  genetic_heritage_score: string;
  burn_potential_score: string;
  tan_potential_score: string;
}

export function LaserClinicalForm() {
  const { register, watch, handleSubmit } = useForm<LaserFormData>({
    defaultValues: {
      skin_color_score: "0",
      hair_color_score: "0",
      eye_color_score: "0",
      freckles_score: "0",
      genetic_heritage_score: "0",
      burn_potential_score: "0",
      tan_potential_score: "0",
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

  // Logic to determine Fitzpatrick Type based on score
  let fitzpatrickType = "";
  if (totalScore <= 7)
    fitzpatrickType = "I (1: piel muy clara, siempre se quema)";
  else if (totalScore <= 16)
    fitzpatrickType = "II (2: piel clara, a veces se quema)";
  else if (totalScore <= 25)
    fitzpatrickType = "III (3: trigueña, se quema moderadamente)";
  else if (totalScore <= 30)
    fitzpatrickType = "IV (4: morena clara, se quema mínimo)";
  else if (totalScore <= 35)
    fitzpatrickType = "V (5: oscura, raramente se quema)";
  else fitzpatrickType = "VI (6: muy oscura, nunca se quema)";

  const onSubmit = (data: LaserFormData) => {
    console.log("Ficha a guardar", {
      ...data,
      total_score: totalScore,
      fitzpatrick_type: fitzpatrickType,
    });
    alert("Ficha guardada exitosamente");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 bg-white p-6 rounded-xl border border-slate-200"
    >
      <div>
        <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-slate-800">
          1. Antecedentes Clínicos (Contraindicaciones)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Enfermedades a la Piel / Otras (Ca, HTA, Epilepsia)</Label>
            <Input {...register("skin_diseases")} placeholder="Ej: Ninguna" />
          </div>
          <div className="space-y-2">
            <Label>Medicamentos Fotosensibles actuales</Label>
            <Input
              {...register("photosensitive_meds")}
              placeholder="Ej: Isotretinoína"
            />
          </div>
          <div className="space-y-2">
            <Label>Tatuajes (Indicar zona)</Label>
            <Input
              {...register("tattoos_zone")}
              placeholder="Ej: Brazo derecho"
            />
          </div>
          <div className="space-y-2">
            <Label>Implantes / Injertos (Indicar zona)</Label>
            <Input {...register("implants_zone")} placeholder="Ninguno" />
          </div>
          <div className="space-y-2">
            <Label>Placas / Prótesis / Marcapasos</Label>
            <Input
              {...register("plates_prosthesis_zone")}
              placeholder="Ninguno"
            />
          </div>
          <div className="space-y-2">
            <Label>Nevus Atípico (Indicar zona o derivar a dermatólogo)</Label>
            <Input {...register("atypical_nevus_zone")} placeholder="Ninguno" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Método de depilación actual</Label>
            <Input
              {...register("current_hair_removal_method")}
              placeholder="Ej: Máquina de afeitar, Cera"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-lg font-semibold border-b border-blue-200 pb-2 mb-4 text-slate-800 flex justify-between">
          <span>2. Test Fototipo de Fitzpatrick</span>
          <span className="text-blue-600">Puntaje: {totalScore}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-2">
            <Label>1. Color de Ojos</Label>
            <select
              {...register("eye_color_score")}
              className="w-full flex h-10 rounded-md border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Verde claro, azul, gris claro (0)</option>
              <option value="1">Azul, verde, gris (1)</option>
              <option value="2">Marrón claro (2)</option>
              <option value="3">Marrón oscuro (3)</option>
              <option value="4">Negro (4)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>2. Color natural del Pelo</Label>
            <select
              {...register("hair_color_score")}
              className="w-full flex h-10 rounded-md border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Pelirrojo (0)</option>
              <option value="1">Rubio (1)</option>
              <option value="2">Castaño claro (2)</option>
              <option value="3">Castaño oscuro (3)</option>
              <option value="4">Negro (4)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>3. Color natural de Piel</Label>
            <select
              {...register("skin_color_score")}
              className="w-full flex h-10 rounded-md border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Rosada (0)</option>
              <option value="1">Muy pálida (1)</option>
              <option value="2">Clara (2)</option>
              <option value="3">Mate / Trigueña (3)</option>
              <option value="4">Oscura o Negra (4)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>4. Cantidad de Pecas (Sin sol)</Label>
            <select
              {...register("freckles_score")}
              className="w-full flex h-10 rounded-md border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Pecas en todo el cuerpo (0)</option>
              <option value="1">Varias pecas en cara y cuerpo (1)</option>
              <option value="2">Pocas pecas (2)</option>
              <option value="3">Casí ninguna (3)</option>
              <option value="4">Ninguna peca (4)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>5. Herencia Genética</Label>
            <select
              {...register("genetic_heritage_score")}
              className="w-full flex h-10 rounded-md border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Caucásica de cutis muy blanco (0)</option>
              <option value="1">Caucásica de cutis claro (1)</option>
              <option value="2">Caucásica oscura / Mestiza clara (2)</option>
              <option value="3">Origen medio oriente, mestizo, asía (3)</option>
              <option value="4">Aborígenes, Afroamericanos (4)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>6. ¿Qué pasa cuando te expones al sol?</Label>
            <select
              {...register("burn_potential_score")}
              className="w-full flex h-10 rounded-md border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Siempre se quema con enrojecimiento (0)</option>
              <option value="1">Se quema seguido y duele (1)</option>
              <option value="2">A veces se quema (2)</option>
              <option value="3">Pocas veces se quema (3)</option>
              <option value="4">Nunca se quema (4)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>7. ¿Cómo es tu bronceado?</Label>
            <select
              {...register("tan_potential_score")}
              className="w-full flex h-10 rounded-md border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Nunca me bronceo (0)</option>
              <option value="1">Muy poco bronceado (1)</option>
              <option value="2">Bronceado moderado (2)</option>
              <option value="3">Me bronceo rápido y profundo (3)</option>
              <option value="4">Soy moreno/negro (4)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-600 text-white rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
          <div>
            <h4 className="text-sm uppercase tracking-wider text-blue-200 font-semibold mb-1">
              Resultado de Evaluación
            </h4>
            <p className="font-medium text-lg">
              Fototipo Detectado: {fitzpatrickType}
            </p>
          </div>
          {(totalScore <= 7 || totalScore >= 35) && (
            <div className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider">
              Revisar Riesgo / Parámetros Máquina
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" className="bg-slate-900 text-white px-8 py-2">
          Guardar Ficha Clínica
        </Button>
      </div>
    </form>
  );
}
