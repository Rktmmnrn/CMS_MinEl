import type { Metadata } from "next";
import { RequireAuth } from "@/components/admin/require-auth";
import { DashboardShell } from "@/components/admin/dashboard-shell";

export const metadata: Metadata = {
    title: { default: "Espace de gestion", template: "%s | Espace de gestion" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <RequireAuth>
            <DashboardShell>{children}</DashboardShell>
        </RequireAuth>
    );
}
