import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireAuth } from "@/components/admin/require-auth";
import { UsersList } from "@/components/admin/users-list";

export const metadata: Metadata = { title: "Utilisateurs" };

export default function UsersPage() {
    return (
        <RequireAuth roles={["ADMIN"]}>
            <Suspense fallback={null}>
                <UsersList />
            </Suspense>
        </RequireAuth>
    );
}
