from rest_framework.permissions import BasePermission

from .models import Role


class IsEditorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(
            u and u.is_authenticated and u.is_active
            and u.role.name in (Role.Name.ADMIN, Role.Name.EDITOR)
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(
            u and u.is_authenticated and u.is_active
            and u.role.name == Role.Name.ADMIN
        )