const FIELD_MESSAGES: Record<string, string> = {
    title: "Ce titre n’est pas valide (200 caractères maximum).",
    body: "Le contenu n’est pas valide.",
    excerpt: "L’extrait n’est pas valide.",
    name: "Ce nom n’est pas valide ou existe déjà.",
    description: "La description n’est pas valide.",
    category_id: "La catégorie choisie n’est pas valide.",
    tag_ids: "Une des étiquettes choisies n’est pas valide.",
    cover_image_id: "L’image de couverture n’est pas valide.",
    alt_text: "Le texte alternatif n’est pas valide.",
    file: "Ce fichier n’est pas accepté.",
};

export function frenchFieldError(field: string, messages: string[]): string {
    const first = messages[0] ?? "";
    if (/réservé/i.test(first)) return first;
    return FIELD_MESSAGES[field] ?? "Cette valeur n’est pas valide.";
}
