import { apiFetch } from "@/lib/api/client";
import type { User } from "@/types/api";

export const authApi = {
    updateProfile: (data: { first_name: string; last_name: string }) =>
        apiFetch<User>("/auth/me/", { method: "PATCH", body: data }),
    changePassword: (data: { old_password: string; new_password: string }) =>
        apiFetch<{ detail: string }>("/auth/password/change/", { method: "POST", body: data }),
};
