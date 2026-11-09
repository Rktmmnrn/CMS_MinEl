import { z } from "zod";

export const pageSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Le titre est obligatoire.")
        .max(200, "Le titre ne peut pas dépasser 200 caractères."),
    body: z.string(),
    show_in_menu: z.boolean(),
    position: z
        .string()
        .trim()
        .regex(/^\d+$/, "Saisissez un nombre entier, 0 ou plus."),
});

export type PageFormValues = z.infer<typeof pageSchema>;
