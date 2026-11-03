import { Suspense } from "react";
import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/media-library";

export const metadata: Metadata = { title: "Médiathèque" };

export default function MediaPage() {
    return (
        <Suspense fallback={null}>
            <MediaLibrary />
        </Suspense>
    );
}
