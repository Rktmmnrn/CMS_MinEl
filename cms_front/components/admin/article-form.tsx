"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2, Save, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { CoverPicker } from "@/components/admin/cover-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { StatusBadge } from "@/components/admin/status-badge";
import { TagPicker } from "@/components/admin/tag-picker";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { ACTIONS_BY_STATUS, type ActionDef } from "@/lib/article-actions";
import { frenchFieldError } from "@/lib/i18n/errors";
import { useCategories } from "@/lib/hooks/use-taxonomy";
import { useArticleAction, useUpdateArticle, useCreateArticle, useDeleteArticle } from "@/lib/hooks/use-articles";
import { useUnsavedWarning } from "@/lib/hooks/use-unsaved-warning";
import { articleSchema, isBodyEmpty, type ArticleFormValues } from "@/lib/schemas/article";
import { cn } from "@/lib/utils";
import type { Article, Media } from "@/types/api";

const FORM_FIELDS = ["title", "excerpt", "body", "category_id", "tag_ids", "cover_image_id"] as const;
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) return null;
    return <p id={id} className="text-sm text-destructive">{message}</p>;
}

function Counter({ length, max }: { length: number; max: number }) {
    return (
        <span className={cn("text-xs", length > max ? "font-semibold text-destructive" : "text-muted-foreground")}>
            {length}/{max}
        </span>
    );
}

function statusHelp(article: Article) {
    if (article.status === "PUBLISHED") {
        const date = article.published_at ? ` depuis le ${dateFormat.format(new Date(article.published_at))}` : "";
        return `Cet article est visible sur le site${date}.`;
    }
    if (article.status === "ARCHIVED") return "Cet article est archivé : il n’est plus visible sur le site.";
    return "Brouillon : seule l’équipe peut voir cet article.";
}

export function ArticleForm({ article }: { article?: Article }) {
    const router = useRouter();
    const categories = useCategories();
    const create = useCreateArticle();
    const update = useUpdateArticle(article?.slug ?? "");
    const actionMutation = useArticleAction();
    const remove = useDeleteArticle();

    const [serverError, setServerError] = useState<string | null>(null);
    const [cover, setCover] = useState<Media | null>(article?.cover_image ?? null);
    const [acting, setActing] = useState(false);
    const [pendingDef, setPendingDef] = useState<ActionDef | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const {
        register, control, handleSubmit, reset, setError, clearErrors, getValues,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<ArticleFormValues>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: article?.title ?? "",
            excerpt: article?.excerpt ?? "",
            body: article?.body ?? "",
            category_id: article?.category?.id ?? null,
            tag_ids: article?.tags.map((t) => t.id) ?? [],
            cover_image_id: article?.cover_image?.id ?? null,
        },
    });

    const title = useWatch({ control, name: "title" });
    const excerpt = useWatch({ control, name: "excerpt" });
    const busy = isSubmitting || acting;

    useUnsavedWarning(isDirty && !busy);

    async function save(values: ArticleFormValues): Promise<boolean> {
        setServerError(null);
        try {
            if (article) {
                await update.mutateAsync(values);
                reset(values);
                toast.success("Modifications enregistrées.");
            } else {
                const created = await create.mutateAsync(values);
                reset(values);
                toast.success("Brouillon créé.");
                router.replace(`/dashboard/articles/modifier/${created.slug}`);
            }
            return true;
        } catch (error) {
            if (error instanceof ApiError && error.status === 400) {
                let handled = false;
                for (const [field, messages] of Object.entries(error.fieldErrors)) {
                    if ((FORM_FIELDS as readonly string[]).includes(field)) {
                        setError(field as (typeof FORM_FIELDS)[number], { message: frenchFieldError(field, messages) });
                        handled = true;
                    }
                }
                if (!handled) setServerError(error.message);
            } else {
                setServerError(getErrorMessage(error));
            }
            return false;
        }
    }

    async function onSubmit(values: ArticleFormValues) {
        await save(values);
    }

    async function performAction(def: ActionDef) {
        if (!article) return;
        setActing(true);
        try {
            if (def.action === "publish") {
                if (isBodyEmpty(getValues("body"))) {
                    setError("body", { message: "Le contenu est obligatoire pour publier l’article." });
                    toast.error("Ajoutez du contenu avant de publier.");
                    return;
                }
                // Enregistrer d'abord
                if (isDirty) {
                    let saved = false;
                    await handleSubmit(async (values) => {
                        saved = await save(values);
                    })();
                    if (!saved) return;
                }
            }
            await actionMutation.mutateAsync({ slug: article.slug, action: def.action });
            toast.success(def.success);
        } catch (e) {
            toast.error(getErrorMessage(e));
        } finally {
            setActing(false);
            setPendingDef(null);
        }
    }

    function onAction(def: ActionDef) {
        if (def.confirm) setPendingDef(def);
        else void performAction(def);
    }

    async function confirmDelete() {
        if (!article) return;
        try {
            await remove.mutateAsync(article.slug);
            reset(getValues());
            toast.success("Article supprimé.");
            router.replace("/dashboard/articles");
        } catch (e) {
            toast.error(getErrorMessage(e));
            setConfirmDeleteOpen(false);
        }
    }

    const actions = article ? ACTIONS_BY_STATUS[article.status] : [];

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            <div className="space-y-3">
                <Link href="/dashboard/articles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden />
                    Retour aux articles
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-heading text-2xl font-bold sm:text-3xl">
                        {article ? "Modifier l’article" : "Nouvel article"}
                    </h1>
                    {article && <StatusBadge status={article.status} />}
                </div>
            </div>

            {serverError && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {serverError}
                </p>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <Label htmlFor="title">Titre</Label>
                            <Counter length={title.length} max={200} />
                        </div>
                        <Input
                            id="title"
                            className="h-11 text-lg"
                            aria-invalid={!!errors.title}
                            aria-describedby={errors.title ? "title-error" : undefined}
                            {...register("title")}
                        />
                        <FieldError id="title-error" message={errors.title?.message} />
                        {article && (
                            <p className="text-xs text-muted-foreground">
                                L’adresse de l’article (/{article.slug}) ne change pas, même si vous modifiez le titre.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label id="body-label">Contenu</Label>
                        <Controller
                            control={control}
                            name="body"
                            render={({ field, fieldState }) => (
                                <RichTextEditor
                                    value={field.value}
                                    onChange={(html) => {
                                        field.onChange(html);
                                        if (errors.body) clearErrors("body");
                                    }}
                                    onBlur={field.onBlur}
                                    invalid={!!fieldState.error}
                                />
                            )}
                        />
                        <FieldError id="body-error" message={errors.body?.message} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <Label htmlFor="excerpt">Extrait (facultatif)</Label>
                            <Counter length={excerpt.length} max={300} />
                        </div>
                        <Textarea
                            id="excerpt"
                            rows={3}
                            aria-invalid={!!errors.excerpt}
                            aria-describedby="excerpt-help excerpt-error"
                            {...register("excerpt")}
                        />
                        <p id="excerpt-help" className="text-sm text-muted-foreground">
                            Résumé affiché dans les listes d’articles du site.
                        </p>
                        <FieldError id="excerpt-error" message={errors.excerpt?.message} />
                    </div>
                </div>

                <aside className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading text-base">Enregistrement</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button type="submit" className="w-full" disabled={isSubmitting || (!!article && !isDirty)}>
                                {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
                                {article ? "Enregistrer" : "Créer le brouillon"}
                            </Button>
                            {article && isDirty && <p className="text-xs text-warning">Modifications non enregistrées.</p>}
                            {!article && (
                                <p className="text-xs text-muted-foreground">
                                    Une fois le brouillon créé, vous pourrez le publier.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {article && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading text-base">Publication</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">{statusHelp(article)}</p>
                                {actions.map((def) => {
                                    const isPublish = def.action === "publish";
                                    const label = isPublish && isDirty ? `Enregistrer et ${def.label.toLowerCase()}` : def.label;
                                    return (
                                        <Button
                                            key={def.action}
                                            type="button"
                                            variant={isPublish ? "default" : "outline"}
                                            className="w-full"
                                            disabled={busy}
                                            onClick={() => onAction(def)}
                                        >
                                            {acting && isPublish ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <def.icon className="size-4" aria-hidden />}
                                            {label}
                                        </Button>
                                    );
                                })}
                                {article.status === "PUBLISHED" && (
                                    <a
                                        href={`/articles/${article.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(buttonVariants({ variant: "ghost" }), "w-full")}
                                    >
                                        <ExternalLink className="size-4" aria-hidden />
                                        Voir sur le site
                                    </a>
                                )}
                                {article.status !== "PUBLISHED" && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full text-destructive hover:text-destructive"
                                        disabled={busy}
                                        onClick={() => setConfirmDeleteOpen(true)}
                                    >
                                        <Trash2 className="size-4" aria-hidden />
                                        Supprimer l’article
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading text-base">Image de couverture</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Controller
                                control={control}
                                name="cover_image_id"
                                render={({ field }) => (
                                    <CoverPicker
                                        media={cover}
                                        onChange={(media) => {
                                            setCover(media);
                                            field.onChange(media?.id ?? null);
                                        }}
                                    />
                                )}
                            />
                            <FieldError id="cover-error" message={errors.cover_image_id?.message} />
                        </CardContent>
                    </Card>

                    <Card className="overflow-visible">
                        <CardHeader>
                            <CardTitle className="font-heading text-base">Classement</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Controller
                                    control={control}
                                    name="category_id"
                                    render={({ field }) => (
                                        <select
                                            id="category"
                                            value={field.value ?? ""}
                                            onChange={(e) => field.onChange(e.target.value || null)}
                                            onBlur={field.onBlur}
                                            disabled={categories.isPending}
                                            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                                        >
                                            <option value="">Aucune catégorie</option>
                                            {categories.data?.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                                <FieldError id="category-error" message={errors.category_id?.message} />
                            </div>

                            <div className="space-y-2 ">
                                <Label>Étiquettes</Label>
                                <Controller
                                    control={control}
                                    name="tag_ids"
                                    render={({ field }) => <TagPicker value={field.value} onChange={field.onChange} />}
                                />
                                <FieldError id="tags-error" message={errors.tag_ids?.message} />
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>

            <ConfirmDialog
                open={!!pendingDef}
                onOpenChange={(open) => !open && setPendingDef(null)}
                title={pendingDef ? `${pendingDef.label} cet article ?` : ""}
                description={pendingDef?.confirm ?? ""}
                confirmLabel={pendingDef?.label ?? ""}
                loading={acting}
                onConfirm={() => pendingDef && void performAction(pendingDef)}
            />

            <ConfirmDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
                title="Supprimer cet article ?"
                description="L’article sera supprimé définitivement. Cette action est irréversible."
                confirmLabel="Supprimer"
                destructive
                loading={remove.isPending}
                onConfirm={() => void confirmDelete()}
            />
        </form>
    );
}
