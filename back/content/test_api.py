from content.models import Article

ARTICLES = "/api/v1/articles/"


def test_visitor_cannot_write(api):
    assert api.post(ARTICLES, {"title": "A", "body": "B"}, format="json").status_code == 401


def test_editor_creates_draft_with_slug(editor_client):
    r = editor_client.post(ARTICLES, {"title": "Mon Article", "body": "texte"}, format="json")
    assert r.status_code == 201
    assert r.data["status"] == "DRAFT" and r.data["slug"] == "mon-article"


def test_visitor_sees_only_published(api, editor_client):
    editor_client.post(ARTICLES, {"title": "Brouillon", "body": "x"}, format="json")
    assert api.get(ARTICLES).data["count"] == 0
    assert api.get(ARTICLES + "brouillon/").status_code == 404

    editor_client.post(ARTICLES + "brouillon/publish/")
    assert api.get(ARTICLES).data["count"] == 1
    assert api.get(ARTICLES + "brouillon/").status_code == 200


def test_invalid_transition_returns_409(editor_client):
    editor_client.post(ARTICLES, {"title": "T", "body": "x"}, format="json")
    assert editor_client.post(ARTICLES + "t/publish/").status_code == 200
    assert editor_client.post(ARTICLES + "t/publish/").status_code == 409


def test_cannot_delete_published_article(editor_client):
    editor_client.post(ARTICLES, {"title": "T", "body": "x"}, format="json")
    editor_client.post(ARTICLES + "t/publish/")
    assert editor_client.delete(ARTICLES + "t/").status_code == 409
    editor_client.post(ARTICLES + "t/archive/")
    assert editor_client.delete(ARTICLES + "t/").status_code == 204


def test_status_cannot_be_forced_by_patch(editor_client):
    editor_client.post(ARTICLES, {"title": "T", "body": "x"}, format="json")
    editor_client.patch(ARTICLES + "t/", {"status": "PUBLISHED"}, format="json")
    assert Article.objects.get(slug="t").status == "DRAFT"


def test_body_is_sanitized(editor_client):
    r = editor_client.post(
        ARTICLES, {"title": "XSS", "body": "<p>ok</p><script>alert(1)</script>"}, format="json")
    assert r.status_code == 201
    assert r.data["body"] == "<p>ok</p>"


def test_pages_status_filter(editor_client):
    editor_client.post("/api/v1/pages/", {"title": "A", "body": "x"}, format="json")
    assert editor_client.get("/api/v1/pages/?status=PUBLISHED").data["count"] == 0
    assert editor_client.get("/api/v1/pages/?status=DRAFT").data["count"] == 1


def test_reserved_page_slug_refused(editor_client):
    r = editor_client.post(
        "/api/v1/pages/", {"title": "Dashboard", "body": "<p>x</p>"}, format="json")
    assert r.status_code == 400 and "title" in r.data
    r = editor_client.post(
        "/api/v1/pages/", {"title": "Dashboard 2", "body": "<p>x</p>"}, format="json")
    assert r.status_code == 201


def test_reserved_word_allowed_for_articles(editor_client):
    r = editor_client.post(ARTICLES, {"title": "Login", "body": "<p>x</p>"}, format="json")
    assert r.status_code == 201 and r.data["slug"] == "login"


def test_category_and_tag_use_slug_in_urls(editor_client):
    editor_client.post("/api/v1/categories/", {"name": "Bovins"}, format="json")
    r = editor_client.patch("/api/v1/categories/bovins/", {"description": "x"}, format="json")
    assert r.status_code == 200
    assert editor_client.delete("/api/v1/categories/bovins/").status_code == 204
    editor_client.post("/api/v1/tags/", {"name": "Zébu"}, format="json")
    assert editor_client.delete("/api/v1/tags/zebu/").status_code == 204


def test_relative_img_src_and_alt_are_kept(editor_client):
    html = '<p><img src="/mediafiles/uploads/a.png" alt="Zébu"></p>'
    r = editor_client.post(ARTICLES, {"title": "Img", "body": html}, format="json")
    assert 'src="/mediafiles/uploads/a.png"' in r.data["body"]
    assert 'alt="Zébu"' in r.data["body"]