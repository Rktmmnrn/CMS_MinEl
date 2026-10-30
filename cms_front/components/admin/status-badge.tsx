import { cn } from "@/lib/utils";
import type { ArticleStatus, PageStatus } from "@/types/api";

const STATUS_STYLES: Record<ArticleStatus | PageStatus, { label: string; className: string }> = {
    DRAFT: { label: "Brouillon", className: "bg-warning/15 text-warning" },
    PUBLISHED: { label: "Publié", className: "bg-success/15 text-success" },
    ARCHIVED: { label: "Archivé", className: "bg-zebu/15 text-zebu" },
};

export function StatusBadge({ status }: { status: ArticleStatus | PageStatus }) {
    const { label, className } = STATUS_STYLES[status];
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                className,
            )}
        >
            {label}
        </span>
    );
}
