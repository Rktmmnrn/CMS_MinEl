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
    position: "La position n’est pas valide (nombre entier, 0 ou plus).",
    parent_id: "Cette page ne peut pas être placée sous la page choisie (2 niveaux maximum).",
    show_in_menu: "Le choix d’affichage dans le menu n’est pas valide.",
    username: "Ce nom d’utilisateur n’est pas valide ou est déjà pris.",
    email: "Cette adresse e-mail n’est pas valide ou est déjà utilisée.",
    first_name: "Le prénom n’est pas valide.",
    last_name: "Le nom n’est pas valide.",
    role: "Le rôle choisi n’est pas valide.",
    is_active: "Le statut du compte n’est pas valide.",
    password: "Mot de passe refusé : choisissez-en un plus long, moins courant, qui ne soit pas uniquement des chiffres.",
    new_password: "Mot de passe refusé : choisissez-en un plus long, moins courant, qui ne soit pas uniquement des chiffres.",
    old_password: "Le mot de passe actuel est incorrect.",
};

export function frenchFieldError(field: string, messages: string[]): string {
    const first = messages[0] ?? "";
    if (/réservé/i.test(first)) return first;
    return FIELD_MESSAGES[field] ?? "Cette valeur n’est pas valide.";
}
