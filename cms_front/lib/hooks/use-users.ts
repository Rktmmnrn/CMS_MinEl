import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import type { UserCreateInput, UserUpdateInput } from "@/types/api";

export function useUsers(page: number) {
    return useQuery({
        queryKey: ["users", "list", page],
        queryFn: () => usersApi.list(page),
        placeholderData: keepPreviousData,
    });
}

function useInvalidate() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: ["users"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
    };
}

export function useCreateUser() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (data: UserCreateInput) => usersApi.create(data),
        onSuccess: invalidate,
    });
}

export function useUpdateUser() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UserUpdateInput }) => usersApi.update(id, data),
        onSuccess: invalidate,
    });
}
