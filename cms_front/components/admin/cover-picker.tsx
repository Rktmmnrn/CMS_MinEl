"use client";

import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "@/components/admin/media-picker";
import { mediaUrl } from "@/lib/utils/media";
import type { Media } from "@/types/api";

export function CoverPicker({
    media,
    onChange,
}: {
    media: Media | null;
    onChange: (media: Media | null) => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-3">
            {media ? (
                <>
                    <div className="overflow-hidden rounded-lg border bg-muted">
                        <img
                            src={mediaUrl(media.file)}
                            alt={media.alt_text ?? ""}
                            className="aspect-video w-full object-cover"
                        />
                    </div>
                    <p className="truncate text-sm text-muted-foreground" title={media.filename}>
                        {media.filename}
                    </p>
                    {!media.alt_text && (
                        <p className="text-xs font-semibold text-warning">
                            Cette image n’a pas de texte alternatif.{" "}
                            <a href="/dashboard/medias" target="_blank" rel="noopener noreferrer" className="underline">
                                Ajoutez-en un dans la médiathèque
                            </a>
                            .
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
                            Changer l’image
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                            <X className="size-4" aria-hidden />
                            Retirer
                        </Button>
                    </div>
                </>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-input px-4 py-6 text-sm text-muted-foreground hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                    <ImageIcon className="size-8" aria-hidden />
                    Choisir une image
                </button>
            )}

            <MediaPicker
                open={open}
                onOpenChange={setOpen}
                selectedId={media?.id ?? null}
                onSelect={onChange}
            />
        </div>
    );
}
