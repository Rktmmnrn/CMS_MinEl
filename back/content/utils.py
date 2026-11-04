from django.utils.text import slugify

RESERVED_PAGE_SLUGS = {
    "login", "dashboard", "articles", "admin", "api", "static", "mediafiles",
    "_next", "favicon.ico", "robots.txt", "sitemap.xml",
}

def unique_slug(model, text, max_length=220):
    base = slugify(text)[: max_length - 6] or "contenu"
    slug, n = base, 2
    while model.objects.filter(slug=slug).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug
