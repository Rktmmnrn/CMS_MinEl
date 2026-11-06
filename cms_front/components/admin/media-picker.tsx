"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/admin/pagination";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { frenchFieldError } from "@/lib/i18n/errors";
import { useMediaList, useUploadMedia } from "@/lib/hooks/use-media";
import { cn } from "@/lib/utils";
import { ALLOWED_IMAGE_TYPES, mediaUrl, validateImage } from "@/lib/utils/media";
import type { Media } from "@/types/api";

function PickerBody({
    selectedId,
    onSelect,
}: {
    selectedId: string | null;
    onSelect: (media: Media) => void;
}) {
    const [page, setPage] = useState(1);
    const { data, isPending, isError, error, refetch } = useMediaList(page);
    const upload = useUploadMedia();
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(file: File | undefined) {
        if (!file) return;
        const problem = validateImage(file);
        if (problem) {
            toast.error(`${file.name} : ${problem}`);
            return;
        }
        try {
            const media = await upload.mutateAsync(file);
            toast.success("Image envoyée et choisie.");
            onSelect(media);
        } catch (e) {
            const message =
                e instanceof ApiError && e.fieldErrors.file
                    ? frenchFieldError("file", e.fieldErrors.file)
                    : getErrorMessage(e);
            toast.error(`${file.name} : ${message}`);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    Cliquez sur une image pour la choisir, ou envoyez-en une nouvelle.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    disabled={upload.isPending}
                    onClick={() => inputRef.current?.click()}
                >
                    {upload.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                        <Upload className="size-4" aria-hidden />
                    )}
                    Envoyer une image
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    className="sr-only"
                    tabIndex={-1}
                    aria-label="Choisir une image à envoyer"
                    onChange={(e) => {
                        void handleFile(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
            </div>

            {isError && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                    <p>{getErrorMessage(error)}</p>
                    <Button type="button" variant="outline" onClick={() => refetch()}>Réessayer</Button>
                </div>
            )}

            {isPending && (
                <div role="status" aria-label="Chargement des images" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                </div>
            )}

            {data && data.results.length === 0 && (
                <p className="rounded-xl border border-dashed py-10 text-center text-muted-foreground">
                    Aucune image pour le moment. Envoyez-en une ci-dessus.
                </p>
            )}

            {data && data.results.length > 0 && (
                <>
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                        {data.results.map((media) => {
                            const selected = media.id === selectedId;
                            return (
                                <li key={media.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(media)}
                                        aria-pressed={selected}
                                        aria-label={`Choisir ${media.filename}`}
                                        className={cn(
                                            "relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                                            selected ? "border-primary" : "border-transparent hover:border-input",
                                        )}
                                    >
                                        <img src={mediaUrl(media.file)} alt="" loading="lazy" className="size-full object-cover" />
                                        {selected && (
                                            <span className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                <Check className="size-4" aria-hidden />
                                            </span>
                                        )}
                                    </button>
                                    <p className="mt-1 truncate text-xs text-muted-foreground" title={media.filename}>
                                        {media.filename}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                    <Pagination page={page} count={data.count} onPageChange={setPage} />
                </>
            )}
        </div>
    );
}

export function MediaPicker({
    open,
    onOpenChange,
    selectedId,
    onSelect,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedId: string | null;
    onSelect: (media: Media) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Choisir l’image de couverture</DialogTitle>
                    <DialogDescription>Images de la médiathèque.</DialogDescription>
                </DialogHeader>
                {open && (
                    <PickerBody
                        selectedId={selectedId}
                        onSelect={(media) => {
                            onSelect(media);
                            onOpenChange(false);
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
