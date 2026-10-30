"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LABELS } from "@/lib/nav";

function initials(name: string) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function UserMenu() {
    const { user, role, logout } = useAuth();
    const router = useRouter();
    if (!user) return null;

    const displayName = user.full_name || user.username;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="Menu du compte"
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
                <span
                    aria-hidden
                    className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                    {initials(displayName)}
                </span>
                <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-tight">{displayName}</span>
                    <span className="block text-xs text-muted-foreground">
                        {role ? ROLE_LABELS[role] : ""}
                    </span>
                </span>
                <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="space-y-0.5">
                        <span className="block text-sm font-medium text-foreground">{displayName}</span>
                        <span className="block text-xs font-normal text-muted-foreground">{user.email}</span>
                    </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/profil")}>
                    <UserRound aria-hidden />
                    Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                    <LogOut aria-hidden />
                    Se déconnecter
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
