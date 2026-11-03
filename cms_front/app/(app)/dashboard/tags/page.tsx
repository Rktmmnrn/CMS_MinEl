import type { Metadata } from "next";
import { TagsManager } from "@/components/admin/tags-manager";

export const metadata: Metadata = { title: "Étiquettes" };

export default function TagsPage() {
    return <TagsManager />;
}
