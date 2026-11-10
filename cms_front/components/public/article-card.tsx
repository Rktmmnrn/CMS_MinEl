import Link from "next/link";
import { CoverImage } from "@/components/public/cover-image";
import { formatDate } from "@/lib/utils/format";
import type { Article } from "@/types/api";

export function ArticleCard({
    article,
    headingLevel: Heading = "h3",
}: {
    article: Article;
    headingLevel?: "h2" | "h3";
}) {
    return (
        <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-md">
            <CoverImage media={article.cover_image} className="aspect-video w-full" />
            <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-xs text-muted-foreground">
                    {article.category && <span className="font-semibold text-primary">{article.category.name}</span>}
                    {article.category && article.published_at && " · "}
                    {article.published_at && (
                        <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
                    )}
                </p>
                <Heading className="font-heading text-lg font-semibold leading-snug">
                    <Link
                        href={`/articles/${article.slug}`}
                        className="outline-none after:absolute after:inset-0 group-hover:text-primary"
                    >
                        {article.title}
                    </Link>
                </Heading>
                {article.excerpt && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
                )}
            </div>
        </article>
    );
}
