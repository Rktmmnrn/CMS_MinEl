import pytest
from rest_framework.test import APIClient

from accounts.models import Role, User


@pytest.fixture
def api():
    return APIClient()


def _make_user(email, role_name, **extra):
    return User.objects.create_user(
        email=email, username=email.split("@")[0], password="Str0ng-Passw0rd!",
        role=Role.objects.get(name=role_name), **extra)


@pytest.fixture
def admin_user(db):
    return _make_user("admin@test.org", "ADMIN")


@pytest.fixture
def editor_user(db):
    return _make_user("editor@test.org", "EDITOR")


@pytest.fixture
def admin_client(api, admin_user):
    api.force_authenticate(admin_user)
    return api


@pytest.fixture
def editor_client(editor_user):
    client = APIClient()
    client.force_authenticate(editor_user)
    return client