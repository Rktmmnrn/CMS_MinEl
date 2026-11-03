import { apiFetch } from "@/lib/api/client";
import type { Media, Paginated } from "@/types/api";

export const mediaApi = {
    list: (page = 1) => apiFetch<Paginated<Media>>("/media/", { query: { page } }),
    upload: (file: File, altText = "") => {
        const form = new FormData();
        form.append("file", file);
        form.append("alt_text", altText);
        return apiFetch<Media>("/media/", { method: "POST", body: form });
    },
    update: (id: number, altText: string) =>
        apiFetch<Media>(`/media/${id}/`, { method: "PATCH", body: { alt_text: altText } }),
    remove: (id: number) => apiFetch<void>(`/media/${id}/`, { method: "DELETE" }),
};
