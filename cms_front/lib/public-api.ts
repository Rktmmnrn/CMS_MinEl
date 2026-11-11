import type { Article, Category, Page, Paginated, Tag } from "@/types/api";

// Nginx Docker
const API_URL = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8080";

type Query = Record<string, string | number | boolean | undefined>;

export const isValidSlug = (slug: string) => /^[\w-]+$/.test(slug);

async function get<T>(path: string, query: Query = {}): Promise<T | null> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    const res = await fetch(`${API_URL}/api/v1${path}${qs ? `?${qs}` : ""}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 30 },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${res.status} sur ${path}`);
    return (await res.json()) as T;
}

export interface ArticleQuery {
    page?: number;
    search?: string;
    category?: string;
    tag?: string;
}

export const getArticles = (query: ArticleQuery) =>
    get<Paginated<Article>>("/articles/", { ...query });

export async function getLatestArticles(limit = 6): Promise<Article[]> {
    const data = await get<Paginated<Article>>("/articles/", { page: 1 });
    return (data?.results ?? []).slice(0, limit);
}

export const getArticle = (slug: string) => get<Article>(`/articles/${slug}/`);
export const getPage = (slug: string) => get<Page>(`/pages/${slug}/`);

export async function getCategories(): Promise<Category[]> {
    return (await get<Category[]>("/categories/")) ?? [];
}

export async function getTags(): Promise<Tag[]> {
    return (await get<Tag[]>("/tags/")) ?? [];
}

export async function getMenuPages(): Promise<Page[]> {
    try {
        const data = await get<Paginated<Page>>("/pages/", { show_in_menu: true, page_size: 50 });
        return data?.results ?? [];
    } catch {
        return [];
    }
}
