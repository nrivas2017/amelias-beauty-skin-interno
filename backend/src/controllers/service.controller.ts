import { Request, Response, NextFunction } from "express";
import db from "../config/database";
import { AppError } from "../utils/errors";

export const getServices = async (
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const services = await db("services as s")
      .join("specialties as sp", "s.specialty_id", "sp.id")
      .select(
        "s.id",
        "s.name",
        "s.specialty_id",
        "s.label_color",
        "s.is_active",
        "sp.name as specialty_name",
        "sp.code as specialty_code",
      )
      .orderBy("specialty_name", "asc")
      .orderBy("s.name", "asc");
    res.json(services);
  } catch (err) {
    next(err);
  }
};

export const createService = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { name, specialty_id, label_color, is_active } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(400)
        .json({ errors: ["El nombre del servicio es obligatorio."] });
    }

    if (!specialty_id) {
      return res
        .status(400)
        .json({ errors: ["La especialidad del servicio es obligatoria."] });
    }

    if (
      !label_color ||
      typeof label_color !== "string" ||
      label_color.trim() === ""
    ) {
      return res
        .status(400)
        .json({ errors: ["El color de la etiqueta es obligatorio."] });
    }

    const [id] = await db("services").insert({
      name: name.trim(),
      specialty_id: specialty_id,
      label_color: label_color,
      is_active: is_active !== undefined ? is_active : 1,
    });

    res.status(201).json({ id, message: "Servicio creado exitosamente" });
  } catch (err) {
    next(err);
  }
};

export const updateService = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, specialty_id, label_color, is_active } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(400)
        .json({ errors: ["El nombre del servicio es obligatorio."] });
    }

    if (!specialty_id) {
      return res
        .status(400)
        .json({ errors: ["La especialidad del servicio es obligatoria."] });
    }

    if (
      !label_color ||
      typeof label_color !== "string" ||
      label_color.trim() === ""
    ) {
      return res
        .status(400)
        .json({ errors: ["El color de la etiqueta es obligatorio."] });
    }

    const updatedRows = await db("services")
      .where({ id })
      .update({
        name: name.trim(),
        specialty_id: specialty_id,
        label_color,
        is_active: is_active ? 1 : 0,
      });

    if (updatedRows === 0) {
      throw new AppError(`Servicio con ID ${id} no encontrado.`);
    }

    res.json({ message: "Servicio actualizado exitosamente" });
  } catch (err) {
    next(err);
  }
};
