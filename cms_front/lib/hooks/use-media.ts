import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api/media";

export function useMediaList(page: number) {
    return useQuery({
        queryKey: ["media", "list", page],
        queryFn: () => mediaApi.list(page),
        placeholderData: keepPreviousData,
    });
}

function useInvalidate() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: ["media"] });
        qc.invalidateQueries({ queryKey: ["articles"] });
    };
}

export function useUploadMedia() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (file: File) => mediaApi.upload(file),
        onSuccess: invalidate,
    });
}

export function useUpdateMedia() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ id, altText }: { id: number; altText: string }) =>
            mediaApi.update(id, altText),
        onSuccess: invalidate,
    });
}

export function useDeleteMedia() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (id: number) => mediaApi.remove(id),
        onSuccess: invalidate,
    });
}
