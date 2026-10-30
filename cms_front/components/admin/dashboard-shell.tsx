"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import logo from "@/public/MinEl-logo.jpg";

function Brand() {
    return (
        <div className="flex items-center gap-3 px-3">
            <div className="rounded-lg bg-white p-1">
                <Image src={logo} alt="" className="h-9 w-auto" />
            </div>
            <div className="leading-tight">
                <p className="font-heading text-sm font-bold">MINEL</p>
                <p className="text-xs text-sidebar-foreground/70">Espace de gestion</p>
            </div>
        </div>
    );
}

export function DashboardShell({ children }: { children: ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen">
            <a
                href="#contenu"
                className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
                Aller au contenu
            </a>

            {/* Menu fixe (ordinateur, tablette en paysage) */}
            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 border-r border-sidebar-border bg-sidebar py-5 pl-2 pr-3 text-sidebar-foreground lg:flex">
                <Brand />
                <SidebarNav />
            </aside>

            {/* Tiroir (tablette en portrait, mobile) */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent
                    side="left"
                    className="w-72 border-sidebar-border bg-sidebar p-4 text-sidebar-foreground"
                >
                    <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                    <div className="space-y-6">
                        <Brand />
                        <SidebarNav onNavigate={() => setMenuOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        aria-label="Ouvrir le menu"
                        onClick={() => setMenuOpen(true)}
                    >
                        <Menu className="size-5" aria-hidden />
                    </Button>
                    <div className="ml-auto flex items-center gap-1">
                        <ThemeToggle />
                        <UserMenu />
                    </div>
                </header>

                <main id="contenu" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 outline-none sm:px-6 sm:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
