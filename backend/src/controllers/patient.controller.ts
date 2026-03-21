import { Request, Response, NextFunction } from "express";
import db from "../config/database";
import { AppError } from "../utils/errors";

const validatePatientData = (data: any) => {
  const errors: string[] = [];
  if (
    !data.national_id ||
    typeof data.national_id !== "string" ||
    data.national_id.trim() === ""
  ) {
    errors.push("El RUT es obligatorio.");
  }
  if (
    !data.full_name ||
    typeof data.full_name !== "string" ||
    data.full_name.trim() === ""
  ) {
    errors.push("El nombre completo es obligatorio.");
  }
  if (
    !data.phone ||
    typeof data.phone !== "string" ||
    data.phone.trim() === ""
  ) {
    errors.push("El teléfono es obligatorio.");
  }
  if (data.age !== undefined && (isNaN(data.age) || data.age < 0)) {
    errors.push("La edad debe ser un número válido mayor o igual a 0.");
  }
  return errors;
};

export const getPatients = async (
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const patients = await db("patients").orderBy("full_name", "asc");
    res.json(patients);
  } catch (err) {
    next(err);
  }
};

export const createPatient = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const errors = validatePatientData(req.body);
    if (errors.length > 0) {
      throw new AppError(
        `Errores en la creación del paciente: ${errors.join(", ")}`,
      );
    }

    const {
      full_name,
      age,
      email,
      address,
      phone,
      pregnant_lactating,
      allergies,
      medical_treatment,
    } = req.body;

    const national_id = req.body.national_id.trim().toUpperCase();

    const existingPatient = await db("patients").where({ national_id }).first();
    if (existingPatient) {
      throw new AppError("El RUT ingresado ya se encuentra registrado.");
    }

    const [id] = await db("patients").insert({
      national_id,
      full_name,
      age: age || 0,
      email: email || "",
      address: address || "",
      phone,
      pregnant_lactating: pregnant_lactating || false,
      allergies: allergies || "",
      medical_treatment: medical_treatment || "",
    });

    res.status(201).json({ id, message: "Paciente creado exitosamente" });
  } catch (err) {
    next(err);
  }
};

export const updatePatient = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;

    const errors = validatePatientData(req.body);
    if (errors.length > 0) {
      throw new AppError(
        `Errores en la actualización del paciente: ${errors.join(", ")}`,
      );
    }

    const {
      full_name,
      age,
      email,
      address,
      phone,
      pregnant_lactating,
      allergies,
      medical_treatment,
    } = req.body;

    const national_id = req.body.national_id.trim().toUpperCase();

    const existingPatient = await db("patients")
      .where({ national_id })
      .andWhere("id", "!=", id)
      .first();
    if (existingPatient) {
      throw new AppError("El RUT ingresado ya se encuentra registrado por otro paciente.");
    }

    const updatedRows = await db("patients").where({ id }).update({
      national_id,
      full_name,
      age,
      email,
      address,
      phone,
      pregnant_lactating,
      allergies,
      medical_treatment,
    });

    if (updatedRows === 0) {
      throw new AppError(`Paciente con ID ${id} no encontrado.`);
    }

    res.json({ message: "Paciente actualizado exitosamente" });
  } catch (err) {
    next(err);
  }
};
