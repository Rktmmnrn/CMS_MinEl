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