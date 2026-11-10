import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPage, isValidSlug } from "@/lib/public-api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    if (!isValidSlug(slug)) return {};
    const page = await getPage(slug);
    return page ? { title: page.title } : {};
}

export default async function StaticPage({ params }: Props) {
    const { slug } = await params;
    if (!isValidSlug(slug)) notFound();
    const page = await getPage(slug);
    if (!page) notFound();

    return (
        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">{page.title}</h1>
            <div className="rich-content mt-8" dangerouslySetInnerHTML={{ __html: page.body }} />
        </article>
    );
}
