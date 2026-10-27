"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    apiFetch,
    refreshAccessToken,
    setAccessToken,
    setSessionExpiredHandler,
} from "@/lib/api/client";
import type { LoginResponse, Role, User } from "@/types/api";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
    status: AuthStatus;
    user: User | null;
    role: Role | null;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [user, setUser] = useState<User | null>(null);

    const clearSession = useCallback(() => {
        setAccessToken(null);
        setUser(null);
        setStatus("anonymous");
        queryClient.clear();
    }, [queryClient]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const token = await refreshAccessToken();
            if (!token) {
                if (!cancelled) setStatus("anonymous");
                return;
            }
            try {
                const me = await apiFetch<User>("/auth/me/");
                if (!cancelled) {
                    setUser(me);
                    setStatus("authenticated");
                }
            } catch {
                if (!cancelled) setStatus("anonymous");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Session expirée en cours d'utilisation
    useEffect(() => {
        setSessionExpiredHandler(() => {
            clearSession();
            toast.error("Votre session a expiré. Veuillez vous reconnecter.");
        });
        return () => setSessionExpiredHandler(null);
    }, [clearSession]);

    const login = useCallback(async (email: string, password: string) => {
        const res = await apiFetch<LoginResponse>("/auth/login/", {
            method: "POST",
            body: { email, password },
            auth: false,
        });
        setAccessToken(res.access);
        try {
            const me = await apiFetch<User>("/auth/me/");
            setUser(me);
            setStatus("authenticated");
        } catch (error) {
            setAccessToken(null);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiFetch<void>("/auth/logout/", { method: "POST" });
        } catch {
            // on déconnecte côté client même si le serveur ne répond pas
        }
        clearSession();
        router.replace("/login");
    }, [clearSession, router]);

    const reloadUser = useCallback(async () => {
        const me = await apiFetch<User>("/auth/me/");
        setUser(me);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            status,
            user,
            role: user?.role ?? null,
            isAdmin: user?.role === "ADMIN",
            login,
            logout,
            reloadUser,
        }),
        [status, user, login, logout, reloadUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
    return ctx;
}
