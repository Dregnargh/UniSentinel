import bcrypt from "bcryptjs";
import { z } from "zod";

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, 12);
export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

// Password policy (fixed for now; becomes a workspace setting with the Phase 3
// settings framework). 12+ chars with at least one letter and one digit —
// length over composition-theater, per current NIST guidance.
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password must be at most 128 characters.")
  .regex(/[a-zA-Z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a digit.");

// Brute-force lockout.
export const MAX_FAILED_LOGINS = 10;
export const LOCKOUT_MINUTES = 15;
