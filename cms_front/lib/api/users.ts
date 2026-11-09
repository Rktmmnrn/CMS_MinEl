import { apiFetch } from "@/lib/api/client";
import type { Paginated, User, UserCreateInput, UserUpdateInput } from "@/types/api";

export const usersApi = {
    list: (page = 1) => apiFetch<Paginated<User>>("/users/", { query: { page } }),
    create: (data: UserCreateInput) => apiFetch<User>("/users/", { method: "POST", body: data }),
    update: (id: string, data: UserUpdateInput) =>
        apiFetch<User>(`/users/${id}/`, { method: "PATCH", body: data }),
};
