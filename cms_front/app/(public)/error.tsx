"use client";

import { btnPrimary } from "@/components/public/styles";

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
    return (
        <div role="alert" className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
            <h1 className="font-heading text-2xl font-bold">Le site est momentanément indisponible</h1>
            <p className="text-muted-foreground">
                Nous n’arrivons pas à charger le contenu. Réessayez dans quelques instants.
            </p>
            <button type="button" onClick={reset} className={btnPrimary}>Réessayer</button>
        </div>
    );
}
