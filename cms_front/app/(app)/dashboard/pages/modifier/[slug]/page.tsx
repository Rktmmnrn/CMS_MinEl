import type { Metadata } from "next";
import { PageEditor } from "@/components/admin/page-editor";

export const metadata: Metadata = { title: "Modifier la page" };

export default async function EditPagePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    return <PageEditor slug={slug} />;
}
