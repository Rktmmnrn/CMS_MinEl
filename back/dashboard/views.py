from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role, User
from accounts.permissions import IsEditorOrAdmin
from content.models import Article, Page


class DashboardView(APIView):
    permission_classes = [IsEditorOrAdmin]

    def get(self, request):
        fields = ("id", "title", "slug", "status", "updated_at")
        latest = [{"type": "article", **a}
                  for a in Article.objects.order_by("-updated_at").values(*fields)[:5]]
        latest += [{"type": "page", **p}
                   for p in Page.objects.order_by("-updated_at").values(*fields)[:5]]
        latest.sort(key=lambda c: c["updated_at"], reverse=True)

        data = {
            "articles": Article.objects.count(),
            "pages": Page.objects.count(),
            "latest_contents": latest[:5],
        }
        if request.user.role.name == Role.Name.ADMIN:  # réservé à l'Admin
            data["users"] = User.objects.count()
        return Response(data)


class HealthView(APIView):
    authentication_classes = []  # utilisé par la CI/CD : aucun jeton requis
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            connection.ensure_connection()
        except Exception:
            return Response({"status": "error", "database": "down"}, status=503)
        return Response({"status": "ok", "database": "up"})