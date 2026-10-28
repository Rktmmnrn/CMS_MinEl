import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import Image from "next/image";
import logo from "@/public/MinEl-logo.jpg";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
            <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <Image
                            src={logo}
                            alt="Logo du MinEl"
                            priority
                            className="h-24 w-auto"
                        />
                    </div>
                    <h1 className="font-heading text-2xl font-bold text-forest dark:text-foreground">
                        Espace de gestion
                    </h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading">Connexion</CardTitle>
                        <CardDescription>
                            Réservé aux éditeurs et administrateurs du site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={null}>
                            <LoginForm />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
