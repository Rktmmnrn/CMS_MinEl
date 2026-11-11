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
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { StatusBadge } from "@/components/admin/status-badge";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { frenchFieldError } from "@/lib/i18n/errors";
import { PAGE_ACTIONS_BY_STATUS, type PageActionDef } from "@/lib/page-actions";
import {
    useCreatePage,
    useDeletePage,
    usePageAction,
    useUpdatePage,
    usePageOptions,
} from "@/lib/hooks/use-pages";
import { useUnsavedWarning } from "@/lib/hooks/use-unsaved-warning";
import { isBodyEmpty } from "@/lib/schemas/article";
import { pageSchema, type PageFormValues } from "@/lib/schemas/page";
import { cn } from "@/lib/utils";
import type { Page } from "@/types/api";

const FORM_FIELDS = ["title", "body", "show_in_menu", "position", "parent_id"] as const;
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) return null;
    return <p id={id} className="text-sm text-destructive">{message}</p>;
}

function statusHelp(page: Page) {
    if (page.status === "PUBLISHED") {
        const date = page.published_at ? ` depuis le ${dateFormat.format(new Date(page.published_at))}` : "";
        return `Cette page est visible sur le site${date}.`;
    }
    return "Brouillon : seule l’équipe peut voir cette page.";
}

export function PageForm({ page }: { page?: Page }) {
    const router = useRouter();
    const create = useCreatePage();
    const update = useUpdatePage(page?.slug ?? "");
    const actionMutation = usePageAction();
    const remove = useDeletePage();
    const options = usePageOptions();
    const allPages = options.data?.results ?? [];
    const hasChildren = page ? allPages.some((p) => p.parent_id === page.id) : false;
    const candidates = allPages.filter((p) => p.parent_id === null && p.id !== page?.id);

    const [serverError, setServerError] = useState<string | null>(null);
    const [acting, setActing] = useState(false);
    const [pendingDef, setPendingDef] = useState<PageActionDef | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const {
        register, control, handleSubmit, reset, setError, clearErrors, getValues,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<PageFormValues>({
        resolver: zodResolver(pageSchema),
        defaultValues: {
            title: page?.title ?? "",
            body: page?.body ?? "",
            show_in_menu: page?.show_in_menu ?? false,
            position: String(page?.position ?? 0),
            parent_id: page?.parent_id ?? null,
        },
    });

    const title = useWatch({ control, name: "title" });
    const busy = isSubmitting || acting;
    useUnsavedWarning(isDirty && !busy);

    async function save(values: PageFormValues): Promise<boolean> {
        setServerError(null);
        const payload = {
            title: values.title,
            body: values.body,
            show_in_menu: values.show_in_menu,
            position: Number(values.position),
            parent_id: values.parent_id,
        };
        try {
            if (page) {
                await update.mutateAsync(payload);
                reset(values);
                toast.success("Modifications enregistrées.");
            } else {
                const created = await create.mutateAsync(payload);
                reset(values);
                toast.success("Brouillon créé.");
                router.replace(`/dashboard/pages/modifier/${created.slug}`);
            }
            return true;
        } catch (error) {
            if (error instanceof ApiError && error.status === 400) {
                let handled = false;
                for (const [field, messages] of Object.entries(error.fieldErrors)) {
                    if ((FORM_FIELDS as readonly string[]).includes(field)) {
                        // « Ce titre est réservé » (déjà en français) passe tel quel
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

    async function performAction(def: PageActionDef) {
        if (!page) return;
        setActing(true);
        try {
            if (def.action === "publish") {
                if (isBodyEmpty(getValues("body"))) {
                    setError("body", { message: "Le contenu est obligatoire pour publier la page." });
                    toast.error("Ajoutez du contenu avant de publier.");
                    return;
                }
                if (isDirty) {
                    let saved = false;
                    await handleSubmit(async (values) => {
                        saved = await save(values);
                    })();
                    if (!saved) return;
                }
            }
            await actionMutation.mutateAsync({ slug: page.slug, action: def.action });
            toast.success(def.success);
        } catch (e) {
            toast.error(getErrorMessage(e));
        } finally {
            setActing(false);
            setPendingDef(null);
        }
    }

    function onAction(def: PageActionDef) {
        if (def.confirm) setPendingDef(def);
        else void performAction(def);
    }

    async function confirmDelete() {
        if (!page) return;
        try {
            await remove.mutateAsync(page.slug);
            reset(getValues());
            toast.success("Page supprimée.");
            router.replace("/dashboard/pages");
        } catch (e) {
            toast.error(getErrorMessage(e));
            setConfirmDeleteOpen(false);
        }
    }

    const actions = page ? PAGE_ACTIONS_BY_STATUS[page.status] : [];

    return (
        <form onSubmit={handleSubmit(async (v) => { await save(v); })} noValidate className="space-y-6">
            <div className="space-y-3">
                <Link href="/dashboard/pages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden />
                    Retour aux pages
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-heading text-2xl font-bold sm:text-3xl">
                        {page ? "Modifier la page" : "Nouvelle page"}
                    </h1>
                    {page && <StatusBadge status={page.status} />}
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
                            <span className={cn("text-xs", title.length > 200 ? "font-semibold text-destructive" : "text-muted-foreground")}>
                                {title.length}/200
                            </span>
                        </div>
                        <Input
                            id="title"
                            className="h-11 text-lg"
                            aria-invalid={!!errors.title}
                            aria-describedby={errors.title ? "title-error" : undefined}
                            {...register("title")}
                        />
                        <FieldError id="title-error" message={errors.title?.message} />
                        <p className="text-xs text-muted-foreground">
                            {page
                                ? `L’adresse de la page (/${page.slug}) ne change pas, même si vous modifiez le titre.`
                                : "L’adresse de la page est créée à partir du titre et ne pourra plus changer."}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label id="body-label">Contenu</Label>
                        <Controller
                            control={control}
                            name="body"
                            render={({ field, fieldState }) => (
                                <RichTextEditor
                                    label="Contenu de la page"
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
                </div>

                <aside className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading text-base">Enregistrement</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button type="submit" className="w-full" disabled={busy || (!!page && !isDirty)}>
                                {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
                                {page ? "Enregistrer" : "Créer le brouillon"}
                            </Button>
                            {page && isDirty && <p className="text-xs text-warning">Modifications non enregistrées.</p>}
                            {!page && <p className="text-xs text-muted-foreground">Une fois le brouillon créé, vous pourrez le publier.</p>}
                        </CardContent>
                    </Card>

                    {page && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading text-base">Publication</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">{statusHelp(page)}</p>
                                {actions.map((def) => {
                                    const isPublish = def.action === "publish";
                                    const label = isPublish && isDirty ? "Enregistrer et publier" : def.label;
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
                                {page.status === "PUBLISHED" && (
                                    <a
                                        href={`/${page.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(buttonVariants({ variant: "ghost" }), "w-full")}
                                    >
                                        <ExternalLink className="size-4" aria-hidden />
                                        Voir sur le site
                                    </a>
                                )}
                                {page.status !== "PUBLISHED" && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full text-destructive hover:text-destructive"
                                        disabled={busy}
                                        onClick={() => setConfirmDeleteOpen(true)}
                                    >
                                        <Trash2 className="size-4" aria-hidden />
                                        Supprimer la page
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading text-base">Menu du site</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <input
                                    id="show_in_menu"
                                    type="checkbox"
                                    className="mt-1 size-4 accent-[var(--primary)]"
                                    {...register("show_in_menu")}
                                />
                                <div>
                                    <Label htmlFor="show_in_menu">Afficher dans le menu</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Le lien apparaît dans le menu du site une fois la page publiée.
                                    </p>
                                </div>
                            </div>
                            <FieldError id="menu-error" message={errors.show_in_menu?.message} />

                            <div className="space-y-2">
                                <Label htmlFor="parent">Page parente (sous-menu)</Label>
                                <Controller
                                    control={control}
                                    name="parent_id"
                                    render={({ field }) => (
                                        <select
                                            id="parent"
                                            value={field.value ?? ""}
                                            onChange={(e) => field.onChange(e.target.value || null)}
                                            onBlur={field.onBlur}
                                            disabled={options.isPending || hasChildren}
                                            aria-describedby="parent-help parent-error"
                                            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                                        >
                                            <option value="">Aucune (page de premier niveau)</option>
                                            {candidates.map((p) => (
                                                <option key={p.id} value={p.id}>{p.title}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                                <p id="parent-help" className="text-xs text-muted-foreground">
                                    {hasChildren
                                        ? "Cette page a des sous-pages : elle ne peut pas devenir elle-même une sous-page."
                                        : "La page apparaîtra dans le sous-menu de la page parente (2 niveaux maximum). La position s’ordonne à l’intérieur d’un même parent."}
                                </p>
                                <FieldError id="parent-error" message={errors.parent_id?.message} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="position">Position dans le menu</Label>
                                <Input
                                    id="position"
                                    inputMode="numeric"
                                    className="w-24"
                                    aria-invalid={!!errors.position}
                                    aria-describedby="position-help position-error"
                                    {...register("position")}
                                />
                                <p id="position-help" className="text-xs text-muted-foreground">
                                    Les pages sont classées de la plus petite à la plus grande position.
                                </p>
                                <FieldError id="position-error" message={errors.position?.message} />
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>

            <ConfirmDialog
                open={!!pendingDef}
                onOpenChange={(open) => !open && setPendingDef(null)}
                title={pendingDef ? `${pendingDef.label} cette page ?` : ""}
                description={pendingDef?.confirm ?? ""}
                confirmLabel={pendingDef?.label ?? ""}
                loading={acting}
                onConfirm={() => pendingDef && void performAction(pendingDef)}
            />

            <ConfirmDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
                title="Supprimer cette page ?"
                description="La page sera supprimée définitivement. Cette action est irréversible."
                confirmLabel="Supprimer"
                destructive
                loading={remove.isPending}
                onConfirm={() => void confirmDelete()}
            />
        </form>
    );
}
