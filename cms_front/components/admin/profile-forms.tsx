"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { frenchFieldError } from "@/lib/i18n/errors";
import { ROLE_LABELS } from "@/lib/nav";
import {
    passwordChangeSchema, profileSchema,
    type PasswordChangeValues, type ProfileValues,
} from "@/lib/schemas/user";

function Err({ id, message }: { id: string; message?: string }) {
    return message ? <p id={id} className="text-sm text-destructive">{message}</p> : null;
}

function ProfileForm() {
    const { user, reloadUser } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);
    const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting, isDirty } } =
        useForm<ProfileValues>({
            resolver: zodResolver(profileSchema),
            defaultValues: { first_name: user?.first_name ?? "", last_name: user?.last_name ?? "" },
        });

    async function submit(values: ProfileValues) {
        setServerError(null);
        try {
            await authApi.updateProfile(values);
            await reloadUser();
            reset(values);
            toast.success("Profil mis à jour.");
        } catch (error) {
            let handled = false;
            if (error instanceof ApiError) {
                for (const [field, messages] of Object.entries(error.fieldErrors)) {
                    if (field === "first_name" || field === "last_name") {
                        setError(field, { message: frenchFieldError(field, messages) });
                        handled = true;
                    }
                }
            }
            if (!handled) setServerError(getErrorMessage(error));
        }
    }

    if (!user) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-heading">Mes informations</CardTitle>
                <CardDescription>
                    {user.email} · {ROLE_LABELS[user.role]}. L’adresse e-mail et le rôle sont gérés par un administrateur.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
                    {serverError && (
                        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="p-first">Prénom</Label>
                            <Input id="p-first" autoComplete="given-name" {...register("first_name")} />
                            <Err id="p-first-e" message={errors.first_name?.message} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="p-last">Nom</Label>
                            <Input id="p-last" autoComplete="family-name" {...register("last_name")} />
                            <Err id="p-last-e" message={errors.last_name?.message} />
                        </div>
                    </div>
                    <Button type="submit" disabled={isSubmitting || !isDirty}>
                        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                        Enregistrer
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function PasswordForm() {
    const [serverError, setServerError] = useState<string | null>(null);
    const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } =
        useForm<PasswordChangeValues>({
            resolver: zodResolver(passwordChangeSchema),
            defaultValues: { old_password: "", new_password: "", confirm: "" },
        });

    async function submit(values: PasswordChangeValues) {
        setServerError(null);
        try {
            await authApi.changePassword({ old_password: values.old_password, new_password: values.new_password });
            reset();
            toast.success("Mot de passe modifié.");
        } catch (error) {
            let handled = false;
            if (error instanceof ApiError) {
                for (const [field, messages] of Object.entries(error.fieldErrors)) {
                    if (field === "old_password" || field === "new_password") {
                        setError(field, { message: frenchFieldError(field, messages) });
                        handled = true;
                    }
                }
            }
            if (!handled) setServerError(getErrorMessage(error));
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-heading">Mot de passe</CardTitle>
                <CardDescription>Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(submit)} noValidate className="max-w-md space-y-4">
                    {serverError && (
                        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="pw-old">Mot de passe actuel</Label>
                        <Input id="pw-old" type="password" autoComplete="current-password" aria-invalid={!!errors.old_password} {...register("old_password")} />
                        <Err id="pw-old-e" message={errors.old_password?.message} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pw-new">Nouveau mot de passe</Label>
                        <Input id="pw-new" type="password" autoComplete="new-password" aria-invalid={!!errors.new_password} {...register("new_password")} />
                        <Err id="pw-new-e" message={errors.new_password?.message} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pw-confirm">Confirmer le nouveau mot de passe</Label>
                        <Input id="pw-confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register("confirm")} />
                        <Err id="pw-confirm-e" message={errors.confirm?.message} />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                        Changer le mot de passe
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export function ProfileForms() {
    return (
        <div className="space-y-6">
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Mon profil</h1>
            <ProfileForm />
            <PasswordForm />
        </div>
    );
}
