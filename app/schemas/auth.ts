import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email es requerido")
    .email("Email inválido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

export type LoginInput = z.infer<typeof loginSchema>;
