import Link from "next/link";

export function SiteFooter() {
    return (
        <footer className="border-t bg-card">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
                <p>© {new Date().getFullYear()} Ministère de l’Élevage (MINEL)</p>
                <Link href="/login" className="hover:text-foreground hover:underline">
                    Espace de gestion
                </Link>
            </div>
        </footer>
    );
}
