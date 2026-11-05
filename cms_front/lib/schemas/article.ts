import { z } from "zod";

export const articleSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Le titre est obligatoire.")
        .max(200, "Le titre ne peut pas dépasser 200 caractères."),
    excerpt: z.string().trim().max(300, "L’extrait ne peut pas dépasser 300 caractères."),
    body: z.string(),
    category_id: z.string().nullable(),
    tag_ids: z.array(z.string()),
});

export type ArticleFormValues = z.infer<typeof articleSchema>;

export function isBodyEmpty(html: string): boolean {
    if (/<(img|hr|table)\b/i.test(html)) return false;
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}
