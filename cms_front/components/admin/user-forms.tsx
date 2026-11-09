"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { frenchFieldError } from "@/lib/i18n/errors";
import { useCreateUser, useUpdateUser } from "@/lib/hooks/use-users";
import {
    userCreateSchema, userEditSchema,
    type UserCreateValues, type UserEditValues,
} from "@/lib/schemas/user";
import type { Role, User, UserUpdateInput } from "@/types/api";

const SELECT_CLASS =
    "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";

function Err({ id, message }: { id: string; message?: string }) {
    return message ? <p id={id} className="text-sm text-destructive">{message}</p> : null;
}

function RoleSelect({ id, ...props }: React.ComponentProps<"select">) {
    return (
        <select id={id} className={SELECT_CLASS} {...props}>
            <option value="EDITOR">Éditeur : contenus et médias</option>
            <option value="ADMIN">Administrateur : tout, y compris les utilisateurs</option>
        </select>
    );
}

/* ---------- Création ---------- */

export function UserCreateForm({ onClose }: { onClose: () => void }) {
    const create = useCreateUser();
    const [serverError, setServerError] = useState<string | null>(null);
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } =
        useForm<UserCreateValues>({
            resolver: zodResolver(userCreateSchema),
            defaultValues: { username: "", email: "", first_name: "", last_name: "", role: "EDITOR", password: "" },
        });

    async function submit(values: UserCreateValues) {
        setServerError(null);
        try {
            await create.mutateAsync(values);
            toast.success("Utilisateur créé.");
            onClose();
        } catch (error) {
            let handled = false;
            if (error instanceof ApiError) {
                for (const [field, messages] of Object.entries(error.fieldErrors)) {
                    if (field in values) {
                        setError(field as keyof UserCreateValues, { message: frenchFieldError(field, messages) });
                        handled = true;
                    }
                }
            }
            if (!handled) setServerError(getErrorMessage(error));
        }
    }

    return (
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
            <DialogHeader>
                <DialogTitle>Nouvel utilisateur</DialogTitle>
                <DialogDescription>
                    Communiquez le mot de passe à la personne par un canal sûr. Elle pourra le changer dans son profil.
                </DialogDescription>
            </DialogHeader>
            {serverError && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="u-first">Prénom</Label>
                    <Input id="u-first" autoComplete="off" {...register("first_name")} />
                    <Err id="u-first-e" message={errors.first_name?.message} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="u-last">Nom</Label>
                    <Input id="u-last" autoComplete="off" {...register("last_name")} />
                    <Err id="u-last-e" message={errors.last_name?.message} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="u-username">Nom d’utilisateur</Label>
                <Input id="u-username" autoComplete="off" aria-invalid={!!errors.username} {...register("username")} />
                <Err id="u-username-e" message={errors.username?.message} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="u-email">Adresse e-mail</Label>
                <Input id="u-email" type="email" autoComplete="off" aria-invalid={!!errors.email} {...register("email")} />
                <Err id="u-email-e" message={errors.email?.message} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="u-role">Rôle</Label>
                <RoleSelect id="u-role" {...register("role")} />
                <Err id="u-role-e" message={errors.role?.message} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="u-password">Mot de passe</Label>
                <Input id="u-password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
                <Err id="u-password-e" message={errors.password?.message} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Créer
                </Button>
            </DialogFooter>
        </form>
    );
}

/* ---------- Modification ---------- */

export function UserEditForm({ user, isSelf, onClose }: { user: User; isSelf: boolean; onClose: () => void }) {
    const update = useUpdateUser();
    const [serverError, setServerError] = useState<string | null>(null);
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } =
        useForm<UserEditValues>({
            resolver: zodResolver(userEditSchema),
            defaultValues: { role: user.role, is_active: user.is_active, password: "" },
        });

    async function submit(values: UserEditValues) {
        setServerError(null);
        const data: UserUpdateInput = {};
        if (values.role !== user.role) data.role = values.role as Role;
        if (values.is_active !== user.is_active) data.is_active = values.is_active;
        if (values.password) data.password = values.password;
        if (Object.keys(data).length === 0) {
            onClose();
            return;
        }
        try {
            await update.mutateAsync({ id: user.id, data });
            toast.success("Utilisateur modifié.");
            onClose();
        } catch (error) {
            let handled = false;
            if (error instanceof ApiError) {
                for (const [field, messages] of Object.entries(error.fieldErrors)) {
                    if (field in values) {
                        setError(field as keyof UserEditValues, { message: frenchFieldError(field, messages) });
                        handled = true;
                    }
                }
            }
            if (!handled) setServerError(getErrorMessage(error));
        }
    }

    return (
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
            <DialogHeader>
                <DialogTitle>{user.full_name || user.username}</DialogTitle>
                <DialogDescription>{user.email}</DialogDescription>
            </DialogHeader>
            {serverError && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
            )}
            {isSelf && (
                <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    C’est votre compte : vous ne pouvez pas changer votre propre rôle ni le désactiver, pour ne pas vous bloquer l’accès.
                </p>
            )}
            <div className="space-y-2">
                <Label htmlFor="e-role">Rôle</Label>
                <RoleSelect id="e-role" disabled={isSelf} {...register("role")} />
                <Err id="e-role-e" message={errors.role?.message} />
            </div>
            <div className="flex items-start gap-3">
                <input id="e-active" type="checkbox" disabled={isSelf} className="mt-1 size-4 accent-[var(--primary)]" {...register("is_active")} />
                <div>
                    <Label htmlFor="e-active">Compte actif</Label>
                    <p className="text-xs text-muted-foreground">
                        Un compte désactivé ne peut plus se connecter. Ses articles et pages sont conservés.
                    </p>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="e-password">Nouveau mot de passe (facultatif)</Label>
                <Input id="e-password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
                <p className="text-xs text-muted-foreground">Laissez vide pour ne pas le changer.</p>
                <Err id="e-password-e" message={errors.password?.message} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Enregistrer
                </Button>
            </DialogFooter>
        </form>
    );
}
