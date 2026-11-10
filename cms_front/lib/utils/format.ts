const dateFormat = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "Indian/Antananarivo",
});

export function formatDate(iso: string | null): string {
    return iso ? dateFormat.format(new Date(iso)) : "";
}
