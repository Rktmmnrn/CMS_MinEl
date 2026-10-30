"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import { useAuth } from "@/lib/auth/AuthProvider";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { isAdmin } = useAuth();
    const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

    return (
        <nav aria-label="Navigation principale">
            <ul className="space-y-1">
                {items.map(({ label, href, icon: Icon }) => {
                    const active =
                        href === "/dashboard" ? pathname === href : pathname.startsWith(href);
                    return (
                        <li key={href}>
                            <Link
                                href={href}
                                onClick={onNavigate}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition-colors",
                                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
                                    active
                                        ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                                )}
                            >
                                <Icon className="size-5 shrink-0" aria-hidden />
                                {label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
