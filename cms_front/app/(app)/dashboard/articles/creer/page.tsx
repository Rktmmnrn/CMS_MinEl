import type { Metadata } from "next";
import { ArticleForm } from "@/components/admin/article-form";

export const metadata: Metadata = { title: "Nouvel article" };

export default function CreateArticlePage() {
    return <ArticleForm />;
}
