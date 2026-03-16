import { Request, Response, NextFunction } from "express";
import db from "../config/database";

export const getStaff = async (
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const staff = await db("staff");

    const specialties = await db("staff_specialties as ss")
      .join("specialties as sp", "ss.specialty_id", "sp.id")
      .select(
        "ss.staff_id",
        "sp.id as specialty_id",
        "sp.name as specialty_name",
      );

    const result = staff.map((s: any) => ({
      ...s,
      specialties: specialties
        .filter((sp: any) => sp.staff_id === s.id)
        .map((sp: any) => ({ id: sp.specialty_id, name: sp.specialty_name })),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createStaff = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { full_name, is_active, specialty_ids } = req.body;

    if (!full_name) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    const [staff_id] = await db("staff").insert({
      full_name,
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1,
    });

    if (
      specialty_ids &&
      Array.isArray(specialty_ids) &&
      specialty_ids.length > 0
    ) {
      const staffSpecialties = specialty_ids.map((specialty_id: number) => ({
        staff_id,
        specialty_id,
      }));
      await db("staff_specialties").insert(staffSpecialties);
    }

    res
      .status(201)
      .json({ id: staff_id, message: "Personal creado exitosamente" });
  } catch (err) {
    next(err);
  }
};

export const updateStaff = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;
    const { full_name, is_active, specialty_ids } = req.body;

    if (!full_name) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    const updatedRows = await db("staff")
      .where({ id })
      .update({
        full_name,
        is_active: is_active ? 1 : 0,
      });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Personal no encontrado" });
    }

    if (specialty_ids !== undefined && Array.isArray(specialty_ids)) {
      await db("staff_specialties").where({ staff_id: id }).delete();

      if (specialty_ids.length > 0) {
        const staffSpecialties = specialty_ids.map((specialty_id: number) => ({
          staff_id: id,
          specialty_id,
        }));
        await db("staff_specialties").insert(staffSpecialties);
      }
    }

    res.json({ message: "Personal actualizado exitosamente" });
  } catch (err) {
    next(err);
  }
};
