import { Archive, ArchiveRestore, EyeOff, Send, type LucideIcon } from "lucide-react";
import type { ArticleAction } from "@/lib/api/articles";
import type { ArticleStatus } from "@/types/api";

export interface ActionDef {
    action: ArticleAction;
    label: string;
    icon: LucideIcon;
    success: string;
    confirm?: string;
}

// cycle de vie du backend
export const ACTIONS_BY_STATUS: Record<ArticleStatus, ActionDef[]> = {
    DRAFT: [
        { action: "publish", label: "Publier", icon: Send, success: "Article publié." },
    ],
    PUBLISHED: [
        {
            action: "unpublish",
            label: "Dépublier",
            icon: EyeOff,
            success: "Article repassé en brouillon.",
            confirm: "L’article ne sera plus visible sur le site public.",
        },
        {
            action: "archive",
            label: "Archiver",
            icon: Archive,
            success: "Article archivé.",
            confirm: "L’article ne sera plus visible sur le site public.",
        },
    ],
    ARCHIVED: [
        { action: "publish", label: "Republier", icon: Send, success: "Article publié." },
        {
            action: "restore",
            label: "Restaurer en brouillon",
            icon: ArchiveRestore,
            success: "Article restauré en brouillon.",
        },
    ],
};
