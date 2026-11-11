import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { MainNav, type NavLink } from "@/components/public/main-nav";
import logo from "@/public/MinEl-logo.jpg";

export function SiteHeader({ links }: { links: NavLink[] }) {
    return (
        <header className="sticky top-0 z-40 bg-[#14472a] text-white">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
                <Link href="/" className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-white">
                    <span className="rounded-lg bg-white p-1">
                        <Image src={logo} alt="" priority className="h-10 w-auto" />
                    </span>
                    <span className="leading-tight">
                        <span className="block font-heading text-sm font-bold">Ministère de l’Élevage</span>
                        <span className="block text-xs text-white/70">MINEL</span>
                    </span>
                </Link>
                <MainNav links={links} />
                <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />
            </div>
            <div aria-hidden className="h-1 bg-sun" />
        </header>
    );
}
