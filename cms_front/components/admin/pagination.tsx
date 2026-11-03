import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

export function Pagination({
    page,
    count,
    onPageChange,
}: {
    page: number;
    count: number;
    onPageChange: (page: number) => void;
}) {
    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    if (count <= PAGE_SIZE) return null;

    return (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-4">
            <p className="text-sm text-muted-foreground">
                Page {page} sur {totalPages} · {count} résultats
            </p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    <ChevronLeft className="size-4" aria-hidden />
                    Précédent
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                    Suivant
                    <ChevronRight className="size-4" aria-hidden />
                </Button>
            </div>
        </nav>
    );
}
