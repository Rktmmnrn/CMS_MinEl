def test_editor_cannot_manage_users(editor_client):
    assert editor_client.get("/api/v1/users/").status_code == 403


def test_admin_manages_users(admin_client):
    assert admin_client.get("/api/v1/users/").status_code == 200


def test_dashboard_users_count_admin_only(admin_client, editor_client):
    assert "users" in admin_client.get("/api/v1/dashboard/").data
    assert "users" not in editor_client.get("/api/v1/dashboard/").data


def test_health_is_public(api, db):
    r = api.get("/api/v1/health/")
    assert r.status_code == 200 and r.data["database"] == "up"


def test_patch_me_updates_names_only(editor_client):
    r = editor_client.patch(
        "/api/v1/auth/me/", {"first_name": "Ana", "role": "ADMIN"}, format="json")
    assert r.status_code == 200
    assert r.data["first_name"] == "Ana" and r.data["role"] == "EDITOR"
