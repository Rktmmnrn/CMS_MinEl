"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/admin/pagination";
import { UserCreateForm, UserEditForm } from "@/components/admin/user-forms";
import { getErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUsers } from "@/lib/hooks/use-users";
import { ROLE_LABELS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { User } from "@/types/api";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function UsersList() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const page = Number(params.get("page")) || 1;
    const { user: me } = useAuth();
    const { data, isPending, isError, error, refetch } = useUsers(page);

    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);

    const goToPage = (p: number) => router.replace(p <= 1 ? pathname : `${pathname}?page=${p}`);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-heading text-2xl font-bold sm:text-3xl">Utilisateurs</h1>
                <Button onClick={() => setCreating(true)}>
                    <Plus className="size-4" aria-hidden />
                    Nouvel utilisateur
                </Button>
            </div>

            {isError && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                    <p>{getErrorMessage(error)}</p>
                    <Button variant="outline" onClick={() => refetch()}>Réessayer</Button>
                </div>
            )}

            {isPending && (
                <div role="status" aria-label="Chargement des utilisateurs" className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                </div>
            )}

            {data && data.results.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
                    <Users className="size-10 text-muted-foreground" aria-hidden />
                    <p className="font-medium">Aucun utilisateur.</p>
                </div>
            )}

            {data && data.results.length > 0 && (
                <>
                    <div className="overflow-x-auto rounded-xl border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Utilisateur</TableHead>
                                    <TableHead>Rôle</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="hidden lg:table-cell">Dernière connexion</TableHead>
                                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.results.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <p className="font-medium">
                                                {u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username}
                                                {u.id === me?.id && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                        </TableCell>
                                        <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                                u.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                                            )}>
                                                {u.is_active ? "Actif" : "Désactivé"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {u.last_login ? dateFormat.format(new Date(u.last_login)) : "Jamais"}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" aria-label={`Modifier ${u.username}`} onClick={() => setEditing(u)}>
                                                <Pencil className="size-4" aria-hidden />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Pagination page={page} count={data.count} onPageChange={goToPage} />
                </>
            )}

            <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
                <DialogContent>{creating && <UserCreateForm onClose={() => setCreating(false)} />}</DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent>
                    {editing && (
                        <UserEditForm key={editing.id} user={editing} isSelf={editing.id === me?.id} onClose={() => setEditing(null)} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
