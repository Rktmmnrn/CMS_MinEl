import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { ArticleCard } from "@/components/public/article-card";
import { PaginationLinks } from "@/components/public/pagination-links";
import { btnOutline, btnPrimary, fieldClass } from "@/components/public/styles";
import { getArticles, getCategories, getTags } from "@/lib/public-api";

export const metadata: Metadata = { title: "Articles" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ArticlesPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams;
    const search = first(sp.search).trim();
    const category = first(sp.category);
    const tag = first(sp.tag);
    const page = Math.max(1, Number(first(sp.page)) || 1);

    const [data, categories, tags] = await Promise.all([
        getArticles({ page, search, category, tag }),
        getCategories(),
        getTags(),
    ]);
    if (!data) notFound();

    const hasFilters = !!(search || category || tag);
    const href = (p: number) => {
        const qs = new URLSearchParams();
        if (search) qs.set("search", search);
        if (category) qs.set("category", category);
        if (tag) qs.set("tag", tag);
        if (p > 1) qs.set("page", String(p));
        const s = qs.toString();
        return s ? `/articles?${s}` : "/articles";
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <h1 className="font-heading text-3xl font-bold">Articles</h1>

            <form action="/articles" method="get" className="mt-6 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
                <div className="space-y-1">
                    <label htmlFor="f-search" className="text-sm font-medium">Rechercher</label>
                    <input id="f-search" type="search" name="search" defaultValue={search} placeholder="Un mot du titre ou du texte…" className={fieldClass} />
                </div>
                <div className="space-y-1">
                    <label htmlFor="f-category" className="text-sm font-medium">Catégorie</label>
                    <select id="f-category" name="category" defaultValue={category} className={fieldClass}>
                        <option value="">Toutes</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="f-tag" className="text-sm font-medium">Étiquette</label>
                    <select id="f-tag" name="tag" defaultValue={tag} className={fieldClass}>
                        <option value="">Toutes</option>
                        {tags.map((t) => (
                            <option key={t.id} value={t.slug}>{t.name}</option>
                        ))}
                    </select>
                </div>
                <button type="submit" className={btnPrimary}>
                    <Search className="size-4" aria-hidden />
                    Filtrer
                </button>
            </form>

            <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
                {data.count === 0 ? "Aucun résultat." : `${data.count} article${data.count > 1 ? "s" : ""}`}
                {hasFilters && (
                    <>
                        {" · "}
                        <Link href="/articles" className="text-primary underline">Effacer les filtres</Link>
                    </>
                )}
            </p>

            {data.results.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed py-14 text-center">
                    <p className="font-medium">
                        {hasFilters ? "Aucun article ne correspond à votre recherche." : "Aucun article publié pour le moment."}
                    </p>
                    {hasFilters && (
                        <Link href="/articles" className={`${btnOutline} mt-4`}>Voir tous les articles</Link>
                    )}
                </div>
            ) : (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.results.map((a) => (
                        <ArticleCard key={a.id} article={a} headingLevel="h2" />
                    ))}
                </div>
            )}

            <PaginationLinks page={page} count={data.count} href={href} />
        </div>
    );
}
