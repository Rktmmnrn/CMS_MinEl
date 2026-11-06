import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api/articles";

export function useArticleCount(kind: "category" | "tag", slug: string | null) {
    return useQuery({
        queryKey: ["articles", "count", kind, slug],
        queryFn: async () => {
            const res = await articlesApi.list(kind === "category" ? { category: slug! } : { tag: slug! });
            return res.count;
        },
        enabled: !!slug,
        staleTime: 0,
        gcTime: 0,
    });
}
