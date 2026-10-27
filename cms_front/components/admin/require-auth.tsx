"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Role } from "@/types/api";

export function RequireAuth({
    roles,
    children,
}: {
    roles?: Role[];
    children: ReactNode;
}) {
    const { status, role } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === "anonymous") {
            router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
    }, [status, router, pathname]);

    if (status !== "authenticated") {
        return (
            <div
                role="status"
                aria-label="Chargement"
                className="flex min-h-screen items-center justify-center"
            >
                <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
            </div>
        );
    }

    if (roles && role && !roles.includes(role)) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
                <h1 className="font-heading text-2xl font-bold">Accès refusé</h1>
                <p className="text-muted-foreground">
                    Vous n’avez pas les droits pour consulter cette page.
                </p>
            </main>
        );
    }

    return <>{children}</>;
}
