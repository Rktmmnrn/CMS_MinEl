import nh3

ALLOWED_TAGS = {
    "p", "br", "hr", "strong", "em", "u", "s", "code", "pre", "blockquote",
    "h2", "h3", "h4", "ul", "ol", "li", "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
}
ALLOWED_ATTRIBUTES = {
    "a": {"href", "title"},
    "img": {"src", "alt", "width", "height"},
}


def clean_html(value):
    return nh3.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes={"http", "https", "mailto"},
        link_rel="noopener noreferrer",
    )
