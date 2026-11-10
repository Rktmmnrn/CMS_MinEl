import Link from "next/link";
import { btnPrimary } from "@/components/public/styles";

export default function PublicNotFound() {
    return (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Erreur 404</p>
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">Page introuvable</h1>
            <p className="text-muted-foreground">
                La page que vous cherchez n’existe pas, a été déplacée ou n’est plus publiée.
            </p>
            <Link href="/" className={btnPrimary}>Retour à l’accueil</Link>
        </div>
    );
}
