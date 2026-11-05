"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { ArticleForm } from "@/components/admin/article-form";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { useArticle } from "@/lib/hooks/use-articles";

export function ArticleEditor({ slug }: { slug: string }) {
    const { data, isPending, isError, error, refetch } = useArticle(slug);

    if (isPending) {
        return (
            <div role="status" aria-label="Chargement de l’article" className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-12" />
                <Skeleton className="h-96" />
            </div>
        );
    }

    if (isError) {
        const notFound = error instanceof ApiError && error.status === 404;
        return (
            <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-6">
                <p className="font-medium text-destructive">{notFound ? "Cet article n’existe pas ou a été supprimé." : getErrorMessage(error)}</p>
                <div className="flex gap-2">
                    {!notFound && <button onClick={() => refetch()} className={buttonVariants({ variant: "outline" })}>Réessayer</button>}
                    <Link href="/dashboard/articles" className={buttonVariants({ variant: "outline" })}>Retour aux articles</Link>
                </div>
            </div>
        );
    }

    return <ArticleForm key={data.id} article={data} />;
}
