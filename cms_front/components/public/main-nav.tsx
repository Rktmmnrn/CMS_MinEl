"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavLink {
    href: string;
    label: string;
    children?: NavLink[];
}

const focus = "focus-visible:outline-2 focus-visible:outline-white";

function DesktopItem({
    link,
    isActive,
}: {
    link: NavLink;
    isActive: (href: string) => boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLLIElement>(null);
    const active = isActive(link.href) || !!link.children?.some((c) => isActive(c.href));

    const itemClass = cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        focus,
        active ? "bg-white/15" : "text-white/90 hover:bg-white/10 hover:text-white",
    );

    if (!link.children) {
        return (
            <li>
                <Link href={link.href} aria-current={isActive(link.href) ? "page" : undefined} className={itemClass}>
                    {link.label}
                </Link>
            </li>
        );
    }

    return (
        <li
            ref={ref}
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onBlur={(e) => {
                if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
            }}
            onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
            }}
        >
            <div className="flex items-center">
                <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(itemClass, "rounded-r-none pr-2")}
                >
                    {link.label}
                </Link>
                <button
                    type="button"
                    aria-expanded={open}
                    aria-label={`Sous-pages de ${link.label}`}
                    onClick={() => setOpen((v) => !v)}
                    className={cn("rounded-l-none rounded-r-lg py-2 pl-1 pr-2 hover:bg-white/10", focus, active && "bg-white/15")}
                >
                    <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
                </button>
            </div>
            {open && (
                <ul className="absolute left-0 top-full z-50 min-w-52 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
                    {link.children.map((c) => (
                        <li key={c.href}>
                            <Link
                                href={c.href}
                                onClick={() => setOpen(false)}
                                aria-current={isActive(c.href) ? "page" : undefined}
                                className={cn(
                                    "block rounded-md px-3 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
                                    isActive(c.href) && "font-semibold text-primary",
                                )}
                            >
                                {c.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
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

    const mobileLink = (href: string, extra?: string) =>
        cn(
            "block rounded-lg px-3 py-3 text-sm font-medium",
            focus,
            isActive(href) ? "bg-white/15" : "hover:bg-white/10",
            extra,
        );

    return (
        <>
            <nav aria-label="Navigation du site" className="ml-auto hidden md:block">
                <ul className="flex flex-wrap items-center gap-1">
                    {links.map((l) => (
                        <DesktopItem key={l.href} link={l} isActive={isActive} />
                    ))}
                </ul>
            </nav>

            <button
                type="button"
                aria-expanded={open}
                aria-controls="menu-mobile"
                aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
                onClick={() => setOpen((v) => !v)}
                className={cn("ml-auto flex size-10 items-center justify-center rounded-lg hover:bg-white/10 md:hidden", focus)}
            >
                {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>

            {open && (
                <nav id="menu-mobile"
                    aria-label="Navigation du site"
                    className="absolute inset-x-0 top-full max-h-[75vh] overflow-y-auto bg-[#14472a] shadow-md md:hidden"
                >
                    <ul className="mx-auto max-w-6xl px-4 py-2">
                        {links.map((l) => (
                            <li key={l.href}>
                                <Link
                                    href={l.href}
                                    onClick={() => setOpen(false)}
                                    aria-current={isActive(l.href) ? "page" : undefined}
                                    className={mobileLink(l.href)}
                                >
                                    {l.label}
                                </Link>
                                {l.children && (
                                    <ul className="ml-4 border-l border-white/20 pl-2">
                                        {l.children.map((c) => (
                                            <li key={c.href}>
                                                <Link href={c.href} onClick={() => setOpen(false)} aria-current={isActive(c.href) ? "page" : undefined} className={mobileLink(c.href, "py-2 font-normal")}>
                                                    {c.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </>
    );
}
