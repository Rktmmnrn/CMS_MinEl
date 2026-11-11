import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import type { NavLink } from "@/components/public/main-nav";
import { getMenuPages } from "@/lib/public-api";
import { buildMenu } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
    const pages = await getMenuPages();
    const links: NavLink[] = [
        { href: "/", label: "Accueil" },
        { href: "/articles", label: "Articles" },
        ...buildMenu(pages),
    ];

    return (
        <div className="flex min-h-screen flex-col">
            <a
                href="#contenu"
                className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
                Aller au contenu
            </a>
            <SiteHeader links={links} />
            <main id="contenu" tabIndex={-1} className="flex-1 outline-none">
                {children}
            </main>
            <SiteFooter />
        </div>
    );
}
