"use client";

import { useRef, useState, type DragEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination } from "@/components/admin/pagination";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import {
    useDeleteMedia,
    useMediaList,
    useUpdateMedia,
    useUploadMedia,
} from "@/lib/hooks/use-media";
import { cn } from "@/lib/utils";
import { ALLOWED_IMAGE_TYPES, formatBytes, validateImage, mediaUrl } from "@/lib/utils/media";
import type { Media } from "@/types/api";
import { frenchFieldError } from "@/lib/i18n/errors";

/* ---------- Fenêtre ---------- */

function MediaEditForm({ media, onClose }: { media: Media; onClose: () => void }) {
    const update = useUpdateMedia();
    const [serverError, setServerError] = useState<string | null>(null);
    const { register, handleSubmit } = useForm<{ alt_text: string }>({
        defaultValues: { alt_text: media.alt_text ?? "" },
    });

    async function submit(values: { alt_text: string }) {
        setServerError(null);
        try {
            await update.mutateAsync({ id: media.id, altText: values.alt_text.trim() });
            toast.success("Texte alternatif enregistré.");
            onClose();
        } catch (error) {
            const fieldErrors = error instanceof ApiError ? error.fieldErrors.alt_text : undefined;
            setServerError(fieldErrors ? frenchFieldError("alt_text", fieldErrors) : getErrorMessage(error));
        }
    }

    return (
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <DialogHeader>
                <DialogTitle className="truncate">{media.filename}</DialogTitle>
                <DialogDescription>
                    {formatBytes(media.size)} · {media.mime_type}. Le fichier ne peut pas être remplacé :
                    seul le texte alternatif est modifiable.
                </DialogDescription>
            </DialogHeader>

            <img
                src={mediaUrl(media.file)}
                alt={media.alt_text ?? ""}
                className="mx-auto max-h-64 w-auto rounded-lg border bg-muted object-contain"
            />

            {serverError && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {serverError}
                </p>
            )}

            <div className="space-y-2">
                <Label htmlFor="media-alt">Texte alternatif</Label>
                <Input id="media-alt" autoFocus aria-describedby="media-alt-help" {...register("alt_text")} />
                <p id="media-alt-help" className="text-sm text-muted-foreground">
                    Décrivez l’image en une phrase courte. Les personnes qui utilisent un lecteur d’écran
                    l’entendront à la place de l’image.
                </p>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={update.isPending}>
                    Annuler
                </Button>
                <Button type="submit" disabled={update.isPending}>
                    {update.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Enregistrer
                </Button>
            </DialogFooter>
        </form>
    );
}

/* ---------- Écran ---------- */

export function MediaLibrary() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const page = Number(params.get("page")) || 1;

    const { data, isPending, isError, error, refetch } = useMediaList(page);
    const upload = useUploadMedia();
    const remove = useDeleteMedia();

    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editing, setEditing] = useState<Media | null>(null);
    const [toDelete, setToDelete] = useState<Media | null>(null);

    function goToPage(p: number) {
        router.replace(p <= 1 ? pathname : `${pathname}?page=${p}`);
    }

    async function handleFiles(files: File[]) {
        if (files.length === 0) return;
        setUploading(true);
        let sent = 0;
        for (const file of files) {
            const problem = validateImage(file);
            if (problem) {
                toast.error(`${file.name} : ${problem}`);
                continue;
            }
            try {
                await upload.mutateAsync(file);
                sent += 1;
            } catch (e) {
                const message =
                    e instanceof ApiError && e.fieldErrors.file
                        ? frenchFieldError("file", e.fieldErrors.file)
                        : getErrorMessage(e);
                toast.error(`${file.name} : ${message}`);
            }
        }
        setUploading(false);
        if (sent > 0) {
            toast.success(
                sent === 1
                    ? "Image envoyée. Pensez à ajouter son texte alternatif."
                    : `${sent} images envoyées. Pensez à ajouter leur texte alternatif.`,
            );
        }
    }

    function onDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragging(false);
        void handleFiles(Array.from(e.dataTransfer.files));
    }

    async function confirmDelete() {
        if (!toDelete) return;
        try {
            await remove.mutateAsync(toDelete.id);
            toast.success("Image supprimée.");
        } catch (e) {
            toast.error(getErrorMessage(e));
        } finally {
            setToDelete(null);
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Médiathèque</h1>

            {/* Zone d'envoi : glisser-déposer, ou bouton */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                    dragging ? "border-primary bg-primary/10" : "border-input bg-card",
                )}
            >
                <Upload className="size-8 text-muted-foreground" aria-hidden />
                <p className="font-medium">Glissez vos images ici</p>
                <p className="text-sm text-muted-foreground">JPEG, PNG, GIF ou WebP · 5 Mo maximum par image</p>
                <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
                    {uploading && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    {uploading ? "Envoi en cours…" : "Choisir des images"}
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    className="sr-only"
                    tabIndex={-1}
                    aria-label="Choisir des images à envoyer"
                    onChange={(e) => {
                        void handleFiles(Array.from(e.target.files ?? []));
                        e.target.value = "";
                    }}
                />
            </div>

            {isError && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                    <p>{getErrorMessage(error)}</p>
                    <Button variant="outline" onClick={() => refetch()}>Réessayer</Button>
                </div>
            )}

            {isPending && (
                <div role="status" aria-label="Chargement de la médiathèque" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-xl" />
                    ))}
                </div>
            )}

            {data && data.results.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
                    <ImageIcon className="size-10 text-muted-foreground" aria-hidden />
                    <p className="font-medium">
                        {page > 1 ? "Cette page est vide." : "Aucune image pour le moment."}
                    </p>
                    {page > 1 && <Button variant="outline" onClick={() => goToPage(1)}>Retour à la première page</Button>}
                </div>
            )}

            {data && data.results.length > 0 && (
                <>
                    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                        {data.results.map((media) => (
                            <li key={media.id} className="overflow-hidden rounded-xl border bg-card">
                                <button
                                    type="button"
                                    onClick={() => setEditing(media)}
                                    aria-label={`Modifier le texte alternatif de ${media.filename}`}
                                    className="block aspect-square w-full bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
                                >
                                    <img
                                        src={mediaUrl(media.file)}
                                        alt={media.alt_text ?? ""}
                                        loading="lazy"
                                        className="size-full object-cover"
                                    />
                                </button>
                                <div className="flex items-start justify-between gap-1 p-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium" title={media.filename}>
                                            {media.filename}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatBytes(media.size)}</p>
                                        {!media.alt_text && (
                                            <p className="mt-1 text-xs font-semibold text-warning">Texte alternatif manquant</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={`Supprimer ${media.filename}`}
                                        onClick={() => setToDelete(media)}
                                    >
                                        <Trash2 className="size-4 text-destructive" aria-hidden />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <Pagination page={page} count={data.count} onPageChange={goToPage} />
                </>
            )}

            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    {editing && <MediaEditForm key={editing.id} media={editing} onClose={() => setEditing(null)} />}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
                title="Supprimer cette image ?"
                description={
                    toDelete
                        ? `« ${toDelete.filename} » sera supprimée définitivement. Si un article l’utilise comme image de couverture, il faudra en choisir une autre.`
                        : ""
                }
                confirmLabel="Supprimer"
                destructive
                loading={remove.isPending}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
