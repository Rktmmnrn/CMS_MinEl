"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
    Eye,
    FileText,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Pagination } from "@/components/admin/pagination";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getErrorMessage } from "@/lib/api/client";
import { useArticleAction, useArticles, useDeleteArticle } from "@/lib/hooks/use-articles";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { Article, ArticleStatus } from "@/types/api";
import { ACTIONS_BY_STATUS, type ActionDef } from "@/lib/article-actions";
import { isBodyEmpty } from "@/lib/schemas/article";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

const STATUS_TABS: { value: ArticleStatus | ""; label: string }[] = [
    { value: "", label: "Tous" },
    { value: "DRAFT", label: "Brouillons" },
    { value: "PUBLISHED", label: "Publiés" },
    { value: "ARCHIVED", label: "Archivés" },
];

export function ArticlesList() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();

    const page = Number(params.get("page")) || 1;
    const status = (params.get("status") ?? "") as ArticleStatus | "";
    const urlSearch = params.get("search") ?? "";

    const [searchInput, setSearchInput] = useState(urlSearch);
    const debouncedSearch = useDebounce(searchInput);

    function updateParams(changes: Record<string, string | number | null>) {
        const next = new URLSearchParams(params.toString());
        for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === "" || value === 1 && key === "page") next.delete(key);
            else next.set(key, String(value));
        }
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
    }

    // Recherche
    useEffect(() => {
        if (debouncedSearch !== urlSearch) {
            updateParams({ search: debouncedSearch, page: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const { data, isPending, isError, error, refetch } = useArticles({
        page,
        status,
        search: urlSearch,
    });

    const actionMutation = useArticleAction();
    const deleteMutation = useDeleteArticle();

    const [pending, setPending] = useState<{ article: Article; def: ActionDef } | null>(null);
    const [toDelete, setToDelete] = useState<Article | null>(null);

    function runAction(article: Article, def: ActionDef) {
        if (def.action === "publish" && isBodyEmpty(article.body)) {
            toast.error("Cet article n’a pas de contenu : ouvrez-le pour le rédiger avant de le publier.");
            setPending(null);
            return;
        }
        actionMutation.mutate(
            { slug: article.slug, action: def.action },
            {
                onSuccess: () => toast.success(def.success),
                onError: (e) => toast.error(getErrorMessage(e)),
                onSettled: () => setPending(null),
            },
        );
    }

    function confirmDelete() {
        if (!toDelete) return;
        deleteMutation.mutate(toDelete.slug, {
            onSuccess: () => toast.success("Article supprimé."),
            onError: (e) => toast.error(getErrorMessage(e)),
            onSettled: () => setToDelete(null),
        });
    }

    const hasFilters = !!status || !!urlSearch;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-heading text-2xl font-bold sm:text-3xl">Articles</h1>
                <Link href="/dashboard/articles/creer" className={buttonVariants()}>
                    <Plus className="size-4" aria-hidden />
                    Nouvel article
                </Link>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div role="group" aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
                    {STATUS_TABS.map((tab) => (
                        <Button
                            key={tab.value}
                            size="sm"
                            variant={status === tab.value ? "default" : "outline"}
                            aria-pressed={status === tab.value}
                            onClick={() => updateParams({ status: tab.value, page: null })}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>
                <div className="relative w-full lg:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                        type="search"
                        aria-label="Rechercher un article"
                        placeholder="Rechercher un article…"
                        className="pl-9"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
            </div>

            {isError && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                    <p>{getErrorMessage(error)}</p>
                    <Button variant="outline" onClick={() => refetch()}>Réessayer</Button>
                </div>
            )}

            {isPending && (
                <div role="status" aria-label="Chargement des articles" className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                </div>
            )}

            {data && data.results.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
                    <FileText className="size-10 text-muted-foreground" aria-hidden />
                    <p className="font-medium">
                        {hasFilters ? "Aucun article ne correspond à votre recherche." : "Vous n’avez pas encore d’article."}
                    </p>
                    {!hasFilters && (
                        <Link href="/dashboard/articles/creer" className={buttonVariants()}>
                            Écrire le premier article
                        </Link>
                    )}
                </div>
            )}

            {data && data.results.length > 0 && (
                <>
                    <div className="overflow-x-auto rounded-xl border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Titre</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                                    <TableHead className="hidden lg:table-cell">Modifié le</TableHead>
                                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.results.map((article) => (
                                    <TableRow key={article.id}>
                                        <TableCell className="max-w-xs">
                                            <Link
                                                href={`/dashboard/articles/modifier/${article.slug}`}
                                                className="block truncate font-medium hover:text-primary hover:underline"
                                            >
                                                {article.title}
                                            </Link>
                                            <span className="text-xs text-muted-foreground">par {article.author}</span>
                                        </TableCell>
                                        <TableCell><StatusBadge status={article.status} /></TableCell>
                                        <TableCell className="hidden md:table-cell">{article.category?.name ?? "—"}</TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {dateFormat.format(new Date(article.updated_at))}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    aria-label={`Actions pour ${article.title}`}
                                                    className="flex size-9 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                                                >
                                                    <MoreHorizontal className="size-5" aria-hidden />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/articles/modifier/${article.slug}`)}>
                                                        <Pencil aria-hidden /> Modifier
                                                    </DropdownMenuItem>
                                                    {article.status === "PUBLISHED" && (
                                                        <DropdownMenuItem onClick={() => window.open(`/articles/${article.slug}`, "_blank")}>
                                                            <Eye aria-hidden /> Voir sur le site
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    {ACTIONS_BY_STATUS[article.status].map((def) => (
                                                        <DropdownMenuItem
                                                            key={def.action}
                                                            onClick={() => (def.confirm ? setPending({ article, def }) : runAction(article, def))}
                                                        >
                                                            <def.icon aria-hidden /> {def.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    {article.status !== "PUBLISHED" && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem variant="destructive" onClick={() => setToDelete(article)}>
                                                                <Trash2 aria-hidden /> Supprimer
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Pagination page={page} count={data.count} onPageChange={(p) => updateParams({ page: p })} />
                </>
            )}

            <ConfirmDialog
                open={!!pending}
                onOpenChange={(open) => !open && setPending(null)}
                title={pending ? `${pending.def.label} « ${pending.article.title} » ?` : ""}
                description={pending?.def.confirm ?? ""}
                confirmLabel={pending?.def.label ?? ""}
                loading={actionMutation.isPending}
                onConfirm={() => pending && runAction(pending.article, pending.def)}
            />

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
                title="Supprimer cet article ?"
                description={toDelete ? `« ${toDelete.title} » sera supprimé définitivement. Cette action est irréversible.` : ""}
                confirmLabel="Supprimer"
                destructive
                loading={deleteMutation.isPending}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
