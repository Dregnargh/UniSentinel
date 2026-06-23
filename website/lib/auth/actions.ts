"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getUserByEmail, createUser } from "./user";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroySession } from "./session";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name is too short.").max(80),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export type AuthState = { error?: string };

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const user = await getUserByEmail(parsed.data.email);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  await createSession(user);
  redirect("/app");
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  if (await getUserByEmail(parsed.data.email)) {
    return { error: "An account with that email already exists." };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  // First-party signups become admins of their own workspace in this demo.
  const user = await createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: "admin",
  });
  await createSession(user);
  redirect("/app");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
