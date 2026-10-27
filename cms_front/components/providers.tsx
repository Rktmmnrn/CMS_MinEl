"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";

export function Providers({ children }: { children: ReactNode }) {
    const { resolvedTheme } = useTheme();
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        refetchOnWindowFocus: false,
                        retry: (count, error) =>
                            error instanceof ApiError && error.status < 500 && error.status !== 0
                                ? false
                                : count < 2,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
                <Toaster
                    richColors
                    closeButton
                    position="top-right"
                    theme={resolvedTheme === "dark" ? "dark" : "light"}
                />
            </AuthProvider>
        </QueryClientProvider>
    );
}
