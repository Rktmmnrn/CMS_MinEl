"use client";

import Link from "next/link";
import { FileText, Files, Plus, RefreshCw, Users, type LucideIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { getErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
});

function StatCard({
    label,
    value,
    icon: Icon,
    href,
}: {
    label: string;
    value: number;
    icon: LucideIcon;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
            <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4">
                    <span className="flex size-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Icon className="size-6" aria-hidden />
                    </span>
                    <div>
                        <p className="font-heading text-3xl font-bold">{value}</p>
                        <p className="text-sm text-muted-foreground">{label}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function OverviewSkeleton() {
    return (
        <div role="status" aria-label="Chargement du tableau de bord" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-72 rounded-xl" />
        </div>
    );
}

export function DashboardOverview() {
    const { user, isAdmin } = useAuth();
    const { data, isPending, isError, error, refetch, isFetching } = useDashboard();

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold sm:text-3xl">
                        Bonjour {user?.first_name || user?.username}
                    </h1>
                    <p className="text-muted-foreground">Voici un aperçu de votre site.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/articles/nouveau" className={buttonVariants()}>
                        <Plus className="size-4" aria-hidden />
                        Nouvel article
                    </Link>
                    <Link href="/dashboard/pages/nouvelle" className={buttonVariants({ variant: "outline" })}>
                        <Plus className="size-4" aria-hidden />
                        Nouvelle page
                    </Link>
                </div>
            </div>

            {isPending && <OverviewSkeleton />}

            {isError && (
                <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive"
                >
                    <p>{getErrorMessage(error)}</p>
                    <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                        <RefreshCw className="size-4" aria-hidden />
                        Réessayer
                    </Button>
                </div>
            )}

            {data && (
                <>
                    <section aria-label="Chiffres clés" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard label="Articles" value={data.articles} icon={FileText} href="/dashboard/articles" />
                        <StatCard label="Pages" value={data.pages} icon={Files} href="/dashboard/pages" />
                        {isAdmin && data.users !== undefined && (
                            <StatCard label="Utilisateurs" value={data.users} icon={Users} href="/dashboard/utilisateurs" />
                        )}
                    </section>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Dernières modifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.latest_contents.length === 0 ? (
                                <p className="py-6 text-center text-muted-foreground">
                                    Aucun contenu pour le moment. Commencez par créer un article.
                                </p>
                            ) : (
                                <ul className="divide-y">
                                    {data.latest_contents.map((item) => (
                                        <li key={`${item.type}-${item.id}`}>
                                            <Link
                                                href={`/dashboard/${item.type === "article" ? "articles" : "pages"}/${item.slug}`}
                                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{item.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.type === "article" ? "Article" : "Page"} · modifié le{" "}
                                                        {dateFormat.format(new Date(item.updated_at))}
                                                    </p>
                                                </div>
                                                <StatusBadge status={item.status} />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
