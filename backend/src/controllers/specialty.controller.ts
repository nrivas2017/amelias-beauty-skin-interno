import { Request, Response, NextFunction } from "express";
import db from "../config/database";
import { AppError } from "../utils/errors";

export const getSpecialties = async (
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const specialties = await db("specialties").orderBy("name", "asc");
    res.json(specialties);
  } catch (err) {
    next(err);
  }
};

export const createSpecialty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { name, is_active } = req.body;

    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ message: "El nombre de la especialidad es obligatorio" });
    }

    const [id] = await db("specialties").insert({
      name: name.trim(),
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1,
    });

    res.status(201).json({ id, message: "Especialidad creada exitosamente" });
  } catch (err) {
    const dbError = err as { code?: string };
    if (dbError.code === "SQLITE_CONSTRAINT") {
      throw new AppError("Ya existe una especialidad con este nombre o código");
    }
    next(err);
  }
};

export const updateSpecialty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ message: "El nombre de la especialidad es obligatorio" });
    }

    const updateData: Record<string, any> = {
      name: name.trim(),
      is_active: is_active ? 1 : 0,
    };

    const updatedRows = await db("specialties")
      .where({ id })
      .update(updateData);

    if (updatedRows === 0) {
      throw new AppError(`Especialidad con ID ${id} no encontrada.`);
    }

    res.json({ message: "Especialidad actualizada exitosamente" });
  } catch (err) {
    const dbError = err as { code?: string };
    if (dbError.code === "SQLITE_CONSTRAINT") {
      throw new AppError("Ya existe una especialidad con este nombre o código");
    }
    next(err);
  }
};
