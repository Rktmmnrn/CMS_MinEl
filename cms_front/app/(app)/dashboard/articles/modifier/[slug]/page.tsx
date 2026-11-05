import type { Metadata } from "next";
import { ArticleEditor } from "@/components/admin/article-editor";

export const metadata: Metadata = { title: "Modifier l’article" };

export default async function EditArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    return <ArticleEditor slug={slug} />;
}
