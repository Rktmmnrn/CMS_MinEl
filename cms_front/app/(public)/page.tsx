import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArticleCard } from "@/components/public/article-card";
import { btnOutline } from "@/components/public/styles";
import { getLatestArticles } from "@/lib/public-api";

export default async function HomePage() {
    const articles = await getLatestArticles(6);

    return (
        <>
            <section className="relative overflow-hidden bg-forest text-white">
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{ backgroundImage: "radial-gradient(circle at 88% 0%, rgba(242,168,29,0.55), transparent 55%)" }}
                />
                <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
                    <p className="text-sm font-semibold uppercase tracking-widest text-sun">MINEL</p>
                    <h1 className="mt-2 max-w-2xl font-heading text-3xl font-bold sm:text-5xl">
                        Ministère de l’Élevage
                    </h1>
                    <p className="mt-4 max-w-xl text-white/85">
                        Actualités et informations du ministère.
                    </p>
                    <Link
                        href="/articles"
                        className="mt-8 inline-flex h-10 items-center gap-2 rounded-lg bg-sun px-5 text-sm font-semibold text-[#1f1500] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                        Voir tous les articles
                        <ArrowRight className="size-4" aria-hidden />
                    </Link>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <h2 className="font-heading text-2xl font-bold">Derniers articles</h2>
                {articles.length === 0 ? (
                    <p className="mt-6 rounded-xl border border-dashed py-12 text-center text-muted-foreground">
                        Aucun article publié pour le moment.
                    </p>
                ) : (
                    <>
                        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {articles.map((a) => (
                                <ArticleCard key={a.id} article={a} />
                            ))}
                        </div>
                        <div className="mt-8 text-center">
                            <Link href="/articles" className={btnOutline}>
                                Tous les articles
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
