"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { StatusBadge } from "@/components/admin/status-badge";
import { TagPicker } from "@/components/admin/tag-picker";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { frenchFieldError } from "@/lib/i18n/errors";
import { useCategories } from "@/lib/hooks/use-taxonomy";
import { useCreateArticle, useUpdateArticle } from "@/lib/hooks/use-articles";
import { useUnsavedWarning } from "@/lib/hooks/use-unsaved-warning";
import { articleSchema, type ArticleFormValues } from "@/lib/schemas/article";
import { cn } from "@/lib/utils";
import type { Article } from "@/types/api";

const FORM_FIELDS = ["title", "excerpt", "body", "category_id", "tag_ids"] as const;

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

export function ArticleForm({ article }: { article?: Article }) {
    const router = useRouter();
    const categories = useCategories();
    const create = useCreateArticle();
    const update = useUpdateArticle(article?.slug ?? "");
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register, control, handleSubmit, reset, setError,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<ArticleFormValues>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: article?.title ?? "",
            excerpt: article?.excerpt ?? "",
            body: article?.body ?? "",
            category_id: article?.category?.id ?? null,
            tag_ids: article?.tags.map((t) => t.id) ?? [],
        },
    });

    const title = useWatch({ control, name: "title" });
    const excerpt = useWatch({ control, name: "excerpt" });

    useUnsavedWarning(isDirty && !isSubmitting);

    async function onSubmit(values: ArticleFormValues) {
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
        }
    }

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
                                    onChange={field.onChange}
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
                            {article && isDirty && (
                                <p className="text-xs text-warning">Modifications non enregistrées.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
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

                            <div className="space-y-2">
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
        </form>
    );
}
