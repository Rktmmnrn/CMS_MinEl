"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { PageForm } from "@/components/admin/page-form";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { usePage } from "@/lib/hooks/use-pages";

export function PageEditor({ slug }: { slug: string }) {
    const { data, isPending, isError, error, refetch } = usePage(slug);

    if (isPending) {
        return (
            <div role="status" aria-label="Chargement de la page" className="space-y-4">
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
                <p className="font-medium text-destructive">
                    {notFound ? "Cette page n’existe pas ou a été supprimée." : getErrorMessage(error)}
                </p>
                <div className="flex gap-2">
                    {!notFound && (
                        <button onClick={() => refetch()} className={buttonVariants({ variant: "outline" })}>
                            Réessayer
                        </button>
                    )}
                    <Link href="/dashboard/pages" className={buttonVariants({ variant: "outline" })}>
                        Retour aux pages
                    </Link>
                </div>
            </div>
        );
    }

    return <PageForm key={data.id} page={data} />;
}
