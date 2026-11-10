import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { btnOutline } from "@/components/public/styles";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function PaginationLinks({
    page,
    count,
    href,
}: {
    page: number;
    count: number;
    href: (page: number) => string;
}) {
    const total = Math.ceil(count / PAGE_SIZE);
    if (total <= 1) return null;
    const disabled = "pointer-events-none opacity-50";

    return (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-8">
            <p className="text-sm text-muted-foreground">
                Page {page} sur {total}
            </p>
            <div className="flex gap-2">
                <Link
                    href={href(Math.max(1, page - 1))}
                    aria-disabled={page <= 1}
                    tabIndex={page <= 1 ? -1 : undefined}
                    className={cn(btnOutline, page <= 1 && disabled)}
                >
                    <ChevronLeft className="size-4" aria-hidden />
                    Précédent
                </Link>
                <Link
                    href={href(Math.min(total, page + 1))}
                    aria-disabled={page >= total}
                    tabIndex={page >= total ? -1 : undefined}
                    className={cn(btnOutline, page >= total && disabled)}
                >
                    Suivant
                    <ChevronRight className="size-4" aria-hidden />
                </Link>
            </div>
        </nav>
    );
}
