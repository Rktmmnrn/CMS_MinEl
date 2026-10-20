
LOGIN = "/api/v1/auth/login/"
CREDS = {"email": "editor@test.org", "password": "Str0ng-Passw0rd!"}


def test_login_ok_refresh_in_cookie_only(api, editor_user):
    r = api.post(LOGIN, CREDS, format="json")
    assert r.status_code == 200
    assert "access" in r.data and "refresh" not in r.data
    assert r.cookies["refresh_token"]["httponly"]


def test_login_same_error_unknown_email_or_bad_password(api, editor_user):
    bad_pwd = api.post(LOGIN, {**CREDS, "password": "faux"}, format="json")
    unknown = api.post(LOGIN, {"email": "x@test.org", "password": "faux"}, format="json")
    assert bad_pwd.status_code == unknown.status_code == 401
    assert bad_pwd.data == unknown.data


def test_inactive_account_refused(api, editor_user):
    editor_user.is_active = False
    editor_user.save()
    assert api.post(LOGIN, CREDS, format="json").status_code == 401


def test_refresh_then_logout_blacklists(api, editor_user):
    api.post(LOGIN, CREDS, format="json")
    access = api.post("/api/v1/auth/refresh/").data["access"]
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    assert api.post("/api/v1/auth/logout/").status_code == 204
    api.credentials()
    assert api.post("/api/v1/auth/refresh/").status_code == 401