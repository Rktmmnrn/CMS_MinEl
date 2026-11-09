import { z } from "zod";

const password = z.string().min(8, "8 caractères minimum.");

export const userCreateSchema = z.object({
    username: z.string().trim().min(1, "Le nom d’utilisateur est obligatoire."),
    email: z.string().trim().min(1, "L’adresse e-mail est obligatoire.").email("Adresse e-mail invalide."),
    first_name: z.string().trim(),
    last_name: z.string().trim(),
    role: z.enum(["ADMIN", "EDITOR"]),
    password,
});
export type UserCreateValues = z.infer<typeof userCreateSchema>;

export const userEditSchema = z.object({
    role: z.enum(["ADMIN", "EDITOR"]),
    is_active: z.boolean(),
    // Vide = mot de passe inchangé
    password: z.string().refine((v) => v === "" || v.length >= 8, "8 caractères minimum."),
});
export type UserEditValues = z.infer<typeof userEditSchema>;

export const profileSchema = z.object({
    first_name: z.string().trim(),
    last_name: z.string().trim(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
    .object({
        old_password: z.string().min(1, "Saisissez votre mot de passe actuel."),
        new_password: password,
        confirm: z.string().min(1, "Confirmez le nouveau mot de passe."),
    })
    .refine((v) => v.new_password === v.confirm, {
        path: ["confirm"],
        message: "Les deux mots de passe ne correspondent pas.",
    });
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
