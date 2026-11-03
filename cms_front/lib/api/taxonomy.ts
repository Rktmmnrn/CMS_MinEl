import { apiFetch } from "@/lib/api/client";
import type { Category, CategoryInput, Tag, TagInput } from "@/types/api";

export const categoriesApi = {
    list: () => apiFetch<Category[]>("/categories/"),
    create: (data: CategoryInput) =>
        apiFetch<Category>("/categories/", { method: "POST", body: data }),
    update: (slug: string, data: Partial<CategoryInput>) =>
        apiFetch<Category>(`/categories/${slug}/`, { method: "PATCH", body: data }),
    remove: (slug: string) =>
        apiFetch<void>(`/categories/${slug}/`, { method: "DELETE" }),
};

export const tagsApi = {
    list: () => apiFetch<Tag[]>("/tags/"),
    create: (data: TagInput) =>
        apiFetch<Tag>("/tags/", { method: "POST", body: data }),
    update: (slug: string, data: Partial<TagInput>) =>
        apiFetch<Tag>(`/tags/${slug}/`, { method: "PATCH", body: data }),
    remove: (slug: string) =>
        apiFetch<void>(`/tags/${slug}/`, { method: "DELETE" }),
};
