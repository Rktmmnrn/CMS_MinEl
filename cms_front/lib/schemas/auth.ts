import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L’adresse e-mail est obligatoire.")
    .email("Saisissez une adresse e-mail valide."),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

export type LoginValues = z.infer<typeof loginSchema>;
