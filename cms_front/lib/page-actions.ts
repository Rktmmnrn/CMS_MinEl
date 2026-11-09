import { EyeOff, Send, type LucideIcon } from "lucide-react";
import type { PageAction } from "@/lib/api/pages";
import type { PageStatus } from "@/types/api";

export interface PageActionDef {
    action: PageAction;
    label: string;
    icon: LucideIcon;
    success: string;
    confirm?: string;
}

export const PAGE_ACTIONS_BY_STATUS: Record<PageStatus, PageActionDef[]> = {
    DRAFT: [{ action: "publish", label: "Publier", icon: Send, success: "Page publiée." }],
    PUBLISHED: [
        {
            action: "unpublish",
            label: "Dépublier",
            icon: EyeOff,
            success: "Page repassée en brouillon.",
            confirm: "La page ne sera plus visible sur le site public, ni dans le menu.",
        },
    ],
};
