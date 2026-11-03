import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, tagsApi } from "@/lib/api/taxonomy";
import type { CategoryInput, TagInput } from "@/types/api";

function useInvalidate(key: "categories" | "tags") {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: [key] });
        qc.invalidateQueries({ queryKey: ["articles"] });
    };
}

/* Catégories */

export function useCategories() {
    return useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
}

export function useCreateCategory() {
    const invalidate = useInvalidate("categories");
    return useMutation({
        mutationFn: (data: CategoryInput) => categoriesApi.create(data),
        onSuccess: invalidate,
    });
}

export function useUpdateCategory() {
    const invalidate = useInvalidate("categories");
    return useMutation({
        mutationFn: ({ slug, data }: { slug: string; data: Partial<CategoryInput> }) =>
            categoriesApi.update(slug, data),
        onSuccess: invalidate,
    });
}

export function useDeleteCategory() {
    const invalidate = useInvalidate("categories");
    return useMutation({
        mutationFn: (slug: string) => categoriesApi.remove(slug),
        onSuccess: invalidate,
    });
}

/* Étiquettes */

export function useTags() {
    return useQuery({ queryKey: ["tags"], queryFn: tagsApi.list });
}

export function useCreateTag() {
    const invalidate = useInvalidate("tags");
    return useMutation({
        mutationFn: (data: TagInput) => tagsApi.create(data),
        onSuccess: invalidate,
    });
}

export function useUpdateTag() {
    const invalidate = useInvalidate("tags");
    return useMutation({
        mutationFn: ({ slug, data }: { slug: string; data: Partial<TagInput> }) =>
            tagsApi.update(slug, data),
        onSuccess: invalidate,
    });
}

export function useDeleteTag() {
    const invalidate = useInvalidate("tags");
    return useMutation({
        mutationFn: (slug: string) => tagsApi.remove(slug),
        onSuccess: invalidate,
    });
}
