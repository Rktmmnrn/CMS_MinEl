"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavLink {
    href: string;
    label: string;
}

export function MainNav({ links }: { links: NavLink[] }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

    const linkClass = (href: string) =>
        cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
            isActive(href) ? "bg-primary/10 text-primary" : "hover:bg-muted",
        );

    return (
        <>
            <nav aria-label="Navigation du site" className="ml-auto hidden md:block">
                <ul className="flex flex-wrap items-center gap-1">
                    {links.map((l) => (
                        <li key={l.href}>
                            <Link href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={linkClass(l.href)}>
                                {l.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <button
                type="button"
                aria-expanded={open}
                aria-controls="menu-mobile"
                aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
                onClick={() => setOpen((v) => !v)}
                className="ml-auto flex size-10 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring md:hidden"
            >
                {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>

            {open && (
                <nav id="menu-mobile" aria-label="Navigation du site" className="absolute inset-x-0 top-full border-b bg-background shadow-md md:hidden">
                    <ul className="mx-auto max-w-6xl px-4 py-2">
                        {links.map((l) => (
                            <li key={l.href}>
                                <Link
                                    href={l.href}
                                    onClick={() => setOpen(false)}
                                    aria-current={isActive(l.href) ? "page" : undefined}
                                    className={cn(linkClass(l.href), "block py-3")}
                                >
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </>
    );
}
