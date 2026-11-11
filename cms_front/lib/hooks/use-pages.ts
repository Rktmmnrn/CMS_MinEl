import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pagesApi, type PageAction, type PageFilters } from "@/lib/api/pages";
import type { PageInput } from "@/types/api";

export function usePages(filters: PageFilters) {
    return useQuery({
        queryKey: ["pages", "list", filters],
        queryFn: () => pagesApi.list(filters),
        placeholderData: keepPreviousData,
    });
}

// Relire la page avant de l'éditer
export function usePage(slug: string) {
    return useQuery({
        queryKey: ["pages", "detail", slug],
        queryFn: () => pagesApi.get(slug),
        staleTime: 0,
        gcTime: 0,
    });
}

function useInvalidate() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: ["pages"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
    };
}

export function useCreatePage() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (data: PageInput) => pagesApi.create(data),
        onSuccess: invalidate,
    });
}

export function useUpdatePage(slug: string) {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (data: Partial<PageInput>) => pagesApi.update(slug, data),
        onSuccess: invalidate,
    });
}

export function usePageAction() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ slug, action }: { slug: string; action: PageAction }) =>
            pagesApi.action(slug, action),
        onSuccess: invalidate,
    });
}

export function useDeletePage() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (slug: string) => pagesApi.remove(slug),
        onSuccess: invalidate,
    });
}

export function usePageOptions() {
    return useQuery({
        queryKey: ["pages", "options"],
        queryFn: () => pagesApi.list({ page_size: 50 }),
    });
}
