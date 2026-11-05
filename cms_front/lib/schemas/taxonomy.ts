import { z } from "zod";

const build = (max: number) =>
    z.object({
        name: z
            .string()
            .trim()
            .min(1, "Le nom est obligatoire.")
            .max(max, `${max} caractères maximum.`),
        description: z.string().trim(),
    });

export const categorySchema = build(100);
export const tagSchema = build(50);
export type TaxonomyValues = z.infer<typeof categorySchema>;
