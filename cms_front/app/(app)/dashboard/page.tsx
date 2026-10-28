"use client";

import { RequireAuth } from "@/components/admin/require-auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";

function Content() {
  const { user, logout } = useAuth();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-heading text-2xl font-bold">
        Bonjour {user?.full_name || user?.username} ({user?.role})
      </h1>
      <Button onClick={logout}>Se déconnecter</Button>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Content />
    </RequireAuth>
  );
}
