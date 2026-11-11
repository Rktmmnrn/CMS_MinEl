import { apiFetch } from "@/lib/api/client";
import type { Page, PageInput, PageStatus, Paginated } from "@/types/api";

export interface PageFilters {
    page?: number;
    search?: string;
    status?: PageStatus | "";
    show_in_menu?: boolean;
    page_size?: number;
}

export type PageAction = "publish" | "unpublish";

export const pagesApi = {
    list: (filters: PageFilters = {}) =>
        apiFetch<Paginated<Page>>("/pages/", { query: { ...filters } }),
    get: (slug: string) => apiFetch<Page>(`/pages/${slug}/`),
    create: (data: PageInput) =>
        apiFetch<Page>("/pages/", { method: "POST", body: data }),
    update: (slug: string, data: Partial<PageInput>) =>
        apiFetch<Page>(`/pages/${slug}/`, { method: "PATCH", body: data }),
    remove: (slug: string) => apiFetch<void>(`/pages/${slug}/`, { method: "DELETE" }),
    action: (slug: string, action: PageAction) =>
        apiFetch<Page>(`/pages/${slug}/${action}/`, { method: "POST" }),
};
