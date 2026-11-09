import type { Metadata } from "next";
import { PageForm } from "@/components/admin/page-form";

export const metadata: Metadata = { title: "Nouvelle page" };

export default function CreatePagePage() {
    return <PageForm />;
}
