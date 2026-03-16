import { Request, Response, NextFunction } from "express";
import db from "../config/database";

const validateServiceData = (data: any) => {
  const errors: string[] = [];
  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push("El nombre del servicio es obligatorio.");
  }
  if (
    data.estimated_duration !== undefined &&
    (isNaN(data.estimated_duration) || data.estimated_duration <= 0)
  ) {
    errors.push("La duración debe ser un número mayor a 0.");
  }
  return errors;
};

export const getServices = async (
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const services = await db("services").orderBy("name", "asc");
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
    const errors = validateServiceData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { name, estimated_duration, label_color, is_active } = req.body;

    const [id] = await db("services").insert({
      name,
      estimated_duration: estimated_duration || 60,
      label_color: label_color || "#3b82f6",
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

    const errors = validateServiceData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { name, estimated_duration, label_color, is_active } = req.body;

    const updatedRows = await db("services")
      .where({ id })
      .update({
        name,
        estimated_duration,
        label_color,
        is_active: is_active ? 1 : 0,
      });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    res.json({ message: "Servicio actualizado exitosamente" });
  } catch (err) {
    next(err);
  }
};
