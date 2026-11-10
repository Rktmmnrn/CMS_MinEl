import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/utils/media";
import type { Media } from "@/types/api";

export function CoverImage({
    media,
    className,
    priority = false,
}: {
    media: Media | null;
    className?: string;
    priority?: boolean;
}) {
    if (!media) {
        return (
            <div aria-hidden className={cn("flex items-center justify-center bg-accent text-accent-foreground/50", className)}>
                <ImageIcon className="size-10" />
            </div>
        );
    }
    return (
        <img
            src={mediaUrl(media.file)}
            alt={media.alt_text ?? ""}
            loading={priority ? "eager" : "lazy"}
            className={cn("bg-muted object-cover", className)}
        />
    );
}
