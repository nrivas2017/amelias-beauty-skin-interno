export const SPECIALTY_CODES = {
  LASER_DEPILATION: "LASER_DEPILATION",
  MANICURE: "MANICURE",
  MASSAGE: "MASSAGE",
  EYELASHES: "EYELASHES",
  FOOT_CARE: "FOOT_CARE",
} as const;

export type SpecialtyCode =
  (typeof SPECIALTY_CODES)[keyof typeof SPECIALTY_CODES];

export const isLaserSpecialty = (code: string | null | undefined): boolean =>
  code === SPECIALTY_CODES.LASER_DEPILATION;
