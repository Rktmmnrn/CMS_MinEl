import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        Erreur 404
      </p>
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">
        Page introuvable
      </h1>
      <p className="max-w-md text-muted-foreground">
        La page que vous cherchez n’existe pas, a été déplacée ou n’est plus
        publiée.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Retour à l’accueil
      </Link>
    </main>
  );
}
