import { Suspense } from "react";
import type { Metadata } from "next";
import { ArticlesList } from "@/components/admin/articles-list";

export const metadata: Metadata = { title: "Articles" };

export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesList />
    </Suspense>
  );
}
