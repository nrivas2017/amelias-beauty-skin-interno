export const AppointmentStatusCodes = {
  IN_TREATMENT: "IN_TREATMENT",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type AppointmentStatusCode =
  (typeof AppointmentStatusCodes)[keyof typeof AppointmentStatusCodes];

export const SessionStatusCodes = {
  SCHEDULED: "SCHEDULED",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED_BY_PATIENT: "CANCELLED_BY_PATIENT",
  CANCELLED_BY_STAFF: "CANCELLED_BY_STAFF",
  FINALIZED: "FINALIZED",
} as const;

export type SessionStatusCode =
  (typeof SessionStatusCodes)[keyof typeof SessionStatusCodes];
