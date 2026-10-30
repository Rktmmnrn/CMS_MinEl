import type { Metadata } from "next";
import { DashboardOverview } from "@/components/admin/dashboard-overview";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function DashboardPage() {
    return <DashboardOverview />;
}
