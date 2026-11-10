import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { CoverImage } from "@/components/public/cover-image";
import { getArticle, isValidSlug } from "@/lib/public-api";
import { formatDate } from "@/lib/utils/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    if (!isValidSlug(slug)) return {};
    const article = await getArticle(slug);
    if (!article) return {};
    return { title: article.title, description: article.excerpt || undefined };
}

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;
    if (!isValidSlug(slug)) notFound();
    const article = await getArticle(slug);
    if (!article) notFound();

    return (
        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <Link href="/articles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" aria-hidden />
                Tous les articles
            </Link>

            <header className="mt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                    {article.category && (
                        <Link href={`/articles?category=${article.category.slug}`} className="font-semibold text-primary hover:underline">
                            {article.category.name}
                        </Link>
                    )}
                    {article.category && article.published_at && " · "}
                    {article.published_at && (
                        <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
                    )}
                </p>
                <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">{article.title}</h1>
            </header>

            {article.cover_image && (
                <CoverImage media={article.cover_image} priority className="mt-6 aspect-video w-full rounded-xl" />
            )}

            <div className="rich-content mt-8" dangerouslySetInnerHTML={{ __html: article.body }} />

            {article.tags.length > 0 && (
                <ul aria-label="Étiquettes" className="mt-8 flex flex-wrap gap-2 border-t pt-6">
                    {article.tags.map((t) => (
                        <li key={t.id}>
                            <Link href={`/articles?tag=${t.slug}`} className="inline-block rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground hover:underline">
                                {t.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
