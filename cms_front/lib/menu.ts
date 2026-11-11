import type { NavLink } from "@/components/public/main-nav";
import type { Page } from "@/types/api";

const byOrder = (a: Page, b: Page) =>
    a.position - b.position || a.title.localeCompare(b.title, "fr");

const toLink = (p: Page): NavLink => ({ href: `/${p.slug}`, label: p.title });

export function buildMenu(pages: Page[]): NavLink[] {
    const ids = new Set(pages.map((p) => p.id));
    const sorted = [...pages].sort(byOrder);
    const top = sorted.filter((p) => !p.parent_id || !ids.has(p.parent_id));

    return top.map((p) => {
        const children = sorted.filter((c) => c.parent_id === p.id).map(toLink);
        return children.length > 0 ? { ...toLink(p), children } : toLink(p);
    });
}
