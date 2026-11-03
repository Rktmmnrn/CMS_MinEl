import { apiFetch } from "@/lib/api/client";
import type { Article, ArticleInput, ArticleStatus, Paginated } from "@/types/api";

export interface ArticleFilters {
    page?: number;
    search?: string;
    status?: ArticleStatus | "";
    category?: string;
    tag?: string;
}

export type ArticleAction = "publish" | "unpublish" | "archive" | "restore";

export const articlesApi = {
    list: (filters: ArticleFilters = {}) =>
        apiFetch<Paginated<Article>>("/articles/", { query: { ...filters } }),
    get: (slug: string) => apiFetch<Article>(`/articles/${slug}/`),
    create: (data: ArticleInput) =>
        apiFetch<Article>("/articles/", { method: "POST", body: data }),
    update: (slug: string, data: Partial<ArticleInput>) =>
        apiFetch<Article>(`/articles/${slug}/`, { method: "PATCH", body: data }),
    remove: (slug: string) =>
        apiFetch<void>(`/articles/${slug}/`, { method: "DELETE" }),
    action: (slug: string, action: ArticleAction) =>
        apiFetch<Article>(`/articles/${slug}/${action}/`, { method: "POST" }),
};
