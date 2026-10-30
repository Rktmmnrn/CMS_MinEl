"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";
import { safeRedirect } from "@/lib/utils/safe-redirect";

function loginErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "E-mail ou mot de passe incorrect.";
    if (error.status === 429) {
      return "Trop de tentatives de connexion. Patientez une minute avant de réessayer.";
    }
    return error.message;
  }
  return "Une erreur est survenue. Réessayez.";
}

export function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const target = safeRedirect(useSearchParams().get("next"));
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (status === "authenticated") router.replace(target);
  }, [status, router, target]);

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch (error) {
      setServerError(loginErrorMessage(error));
    }
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div role="status" aria-label="Chargement" className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-11"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {isSubmitting ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
