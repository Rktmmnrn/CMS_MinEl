import Link from "next/link";

export function SiteFooter() {
    return (
        <footer className="bg-[#14472a] text-white/80">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
                <p>© {new Date().getFullYear()} Ministère de l’Élevage (MINEL)</p>
                <Link href="/login" className="hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-white">
                    Espace de gestion
                </Link>
            </div>
        </footer>
    );
}
