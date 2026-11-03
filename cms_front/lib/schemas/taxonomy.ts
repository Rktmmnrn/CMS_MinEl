import { z } from "zod";

export const taxonomySchema = z.object({
    name: z.string().trim().min(1, "Le nom est obligatoire."),
    description: z.string().trim(),
});

export type TaxonomyValues = z.infer<typeof taxonomySchema>;
