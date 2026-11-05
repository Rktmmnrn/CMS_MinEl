"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { categorySchema, type TaxonomyValues } from "@/lib/schemas/taxonomy";
import { frenchFieldError } from "@/lib/i18n/errors";

export interface TaxonomyItem {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

export interface TaxonomyLabels {
    title: string;
    newButton: string;
    createTitle: string;
    editTitle: string;
    empty: string;
    created: string;
    updated: string;
    deleted: string;
    deleteTitle: string;
    deleteHint: string;
}

interface Props {
    labels: TaxonomyLabels;
    icon: LucideIcon;
    withDescription?: boolean;
    items: TaxonomyItem[] | undefined;
    isPending: boolean;
    isError: boolean;
    error: unknown;
    schema: typeof categorySchema;
    onRetry: () => void;
    onSave: (slug: string | null, values: TaxonomyValues) => Promise<unknown>;
    onDelete: (slug: string) => Promise<unknown>;
}

/* ---------- Formulaire ---------- */

function TaxonomyForm({
    item,
    labels,
    withDescription,
    schema,
    onSave,
    onClose,
}: {
    item: TaxonomyItem | null;
    labels: TaxonomyLabels;
    withDescription: boolean;
    schema: typeof categorySchema;
    onSave: Props["onSave"];
    onClose: () => void;
}) {
    const [serverError, setServerError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<TaxonomyValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: item?.name ?? "", description: item?.description ?? "" },
    });

    async function submit(values: TaxonomyValues) {
        setServerError(null);
        try {
            await onSave(item?.slug ?? null, values);
            toast.success(item ? labels.updated : labels.created);
            onClose();
        } catch (error) {
            let handled = false;
            if (error instanceof ApiError) {
                for (const [field, messages] of Object.entries(error.fieldErrors)) {
                    if (field === "name" || field === "description") {
                        setError(field, { message: frenchFieldError(field, messages) });
                        handled = true;
                    }
                }
            }
            if (!handled) setServerError(getErrorMessage(error));
        }
    }

    return (
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
            <DialogHeader>
                <DialogTitle>{item ? labels.editTitle : labels.createTitle}</DialogTitle>
                <DialogDescription>
                    L’adresse (slug) est créée automatiquement à partir du nom.
                </DialogDescription>
            </DialogHeader>

            {serverError && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {serverError}
                </p>
            )}

            <div className="space-y-2">
                <Label htmlFor="tax-name">Nom</Label>
                <Input
                    id="tax-name"
                    autoFocus
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "tax-name-error" : undefined}
                    {...register("name")}
                />
                {errors.name && (
                    <p id="tax-name-error" className="text-sm text-destructive">{errors.name.message}</p>
                )}
            </div>

            {withDescription && (
                <div className="space-y-2">
                    <Label htmlFor="tax-description">Description (facultative)</Label>
                    <Textarea
                        id="tax-description"
                        rows={3}
                        aria-invalid={!!errors.description}
                        aria-describedby={errors.description ? "tax-description-error" : undefined}
                        {...register("description")}
                    />
                    {errors.description && (
                        <p id="tax-description-error" className="text-sm text-destructive">
                            {errors.description.message}
                        </p>
                    )}
                </div>
            )}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    {item ? "Enregistrer" : "Créer"}
                </Button>
            </DialogFooter>
        </form>
    );
}

/* ---------- Écran ---------- */

export function TaxonomyManager({
    labels,
    icon: Icon,
    withDescription = false,
    items,
    isPending,
    isError,
    error,
    schema,
    onRetry,
    onSave,
    onDelete,
}: Props) {
    const [editor, setEditor] = useState<{ item: TaxonomyItem | null } | null>(null);
    const [toDelete, setToDelete] = useState<TaxonomyItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    async function confirmDelete() {
        if (!toDelete) return;
        setDeleting(true);
        try {
            await onDelete(toDelete.slug);
            toast.success(labels.deleted);
        } catch (e) {
            toast.error(getErrorMessage(e));
        } finally {
            setDeleting(false);
            setToDelete(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-heading text-2xl font-bold sm:text-3xl">{labels.title}</h1>
                <Button onClick={() => setEditor({ item: null })}>
                    <Plus className="size-4" aria-hidden />
                    {labels.newButton}
                </Button>
            </div>

            {isError && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                    <p>{getErrorMessage(error)}</p>
                    <Button variant="outline" onClick={onRetry}>Réessayer</Button>
                </div>
            )}

            {isPending && (
                <div role="status" aria-label="Chargement" className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                </div>
            )}

            {items && items.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
                    <Icon className="size-10 text-muted-foreground" aria-hidden />
                    <p className="font-medium">{labels.empty}</p>
                    <Button onClick={() => setEditor({ item: null })}>{labels.newButton}</Button>
                </div>
            )}

            {items && items.length > 0 && (
                <div className="overflow-x-auto rounded-xl border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead className="hidden sm:table-cell">Adresse (slug)</TableHead>
                                {withDescription && <TableHead className="hidden md:table-cell">Description</TableHead>}
                                <TableHead className="w-28"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="hidden text-muted-foreground sm:table-cell">{item.slug}</TableCell>
                                    {withDescription && (
                                        <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                                            {item.description || "—"}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Modifier ${item.name}`}
                                                onClick={() => setEditor({ item })}
                                            >
                                                <Pencil className="size-4" aria-hidden />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Supprimer ${item.name}`}
                                                onClick={() => setToDelete(item)}
                                            >
                                                <Trash2 className="size-4 text-destructive" aria-hidden />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={!!editor} onOpenChange={(open) => !open && setEditor(null)}>
                <DialogContent>
                    {editor && (
                        <TaxonomyForm
                            key={editor.item?.id ?? "new"}
                            item={editor.item}
                            labels={labels}
                            withDescription={withDescription}
                            onSave={onSave}
                            onClose={() => setEditor(null)}
                            schema={schema}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
                title={labels.deleteTitle}
                description={toDelete ? `« ${toDelete.name} » sera supprimé(e). ${labels.deleteHint}` : ""}
                confirmLabel="Supprimer"
                destructive
                loading={deleting}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
