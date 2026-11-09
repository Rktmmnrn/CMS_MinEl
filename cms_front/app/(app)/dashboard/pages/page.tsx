import { Suspense } from "react";
import type { Metadata } from "next";
import { PagesList } from "@/components/admin/pages-list";

export const metadata: Metadata = { title: "Pages" };

export default function PagesPage() {
    return (
        <Suspense fallback={null}>
            <PagesList />
        </Suspense>
    );
}
