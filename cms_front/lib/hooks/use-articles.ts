import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { articlesApi, type ArticleAction, type ArticleFilters } from "@/lib/api/articles";
import type { ArticleInput } from "@/types/api";

export function useArticles(filters: ArticleFilters) {
  return useQuery({
    queryKey: ["articles", "list", filters],
    queryFn: () => articlesApi.list(filters),
    placeholderData: keepPreviousData, // pas de clignotement entre deux pages
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["articles"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCreateArticle() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: ArticleInput) => articlesApi.create(data),
    onSuccess: invalidate,
  });
}

export function useUpdateArticle(slug: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: Partial<ArticleInput>) => articlesApi.update(slug, data),
    onSuccess: invalidate,
  });
}

export function useArticleAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ slug, action }: { slug: string; action: ArticleAction }) =>
      articlesApi.action(slug, action),
    onSuccess: invalidate,
  });
}

export function useDeleteArticle() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (slug: string) => articlesApi.remove(slug),
    onSuccess: invalidate,
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ["articles", "detail", slug],
    queryFn: () => articlesApi.get(slug),
    staleTime: 0,
    gcTime: 0,
  });
}
