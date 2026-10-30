from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import Role
from accounts.permissions import IsEditorOrAdmin

from .filters import ArticleFilter
from .models import Article, Category, ContentStatus, Page, Tag
from .serializers import ArticleSerializer, CategorySerializer, PageSerializer, TagSerializer
from .utils import unique_slug


def is_staff_user(user):
    return bool(
        user.is_authenticated and user.is_active
        and user.role.name in (Role.Name.ADMIN, Role.Name.EDITOR)
    )


class PublicReadEditorWriteMixin:
    """Lecture ouverte à tous, écriture réservée aux éditeurs et admins."""

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsEditorOrAdmin()]


class SlugOnCreateMixin:
    slug_max_length = 220

    def perform_create(self, serializer):
        source = serializer.validated_data.get("title") or serializer.validated_data["name"]
        slug = unique_slug(self.queryset.model, source, self.slug_max_length)
        extra = {"author": self.request.user} if hasattr(self.queryset.model, "author") else {}
        serializer.save(slug=slug, **extra)


class ContentViewSet(PublicReadEditorWriteMixin, SlugOnCreateMixin, viewsets.ModelViewSet):
    lookup_field = "slug"
    staff_order = "-created_at"
    public_order = "-published_at"

    def get_queryset(self):
        qs = super().get_queryset()
        if is_staff_user(self.request.user):
            return qs.order_by(self.staff_order)
        return qs.filter(status=ContentStatus.PUBLISHED).order_by(self.public_order)

    def _transition(self, method_name):
        obj = self.get_object()
        if not getattr(obj, method_name)():
            return Response(
                {"detail": "Action impossible depuis le statut actuel."}, status=409)
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=["post"])
    def publish(self, request, slug=None):
        return self._transition("publish")

    @action(detail=True, methods=["post"])
    def unpublish(self, request, slug=None):
        return self._transition("unpublish")


class ArticleViewSet(ContentViewSet):
    queryset = Article.objects.select_related(
        "author", "category", "cover_image").prefetch_related("tags")
    serializer_class = ArticleSerializer
    filterset_class = ArticleFilter
    search_fields = ["title", "excerpt", "body"]

    @action(detail=True, methods=["post"])
    def archive(self, request, slug=None):
        return self._transition("archive")

    @action(detail=True, methods=["post"])
    def restore(self, request, slug=None):
        return self._transition("restore")

    def destroy(self, request, *args, **kwargs):
        # Cycle de vie
        if self.get_object().status == ContentStatus.PUBLISHED:
            return Response(
                {"detail": "Dépubliez ou archivez l'article avant de le supprimer."},
                status=409)
        return super().destroy(request, *args, **kwargs)


class PageViewSet(ContentViewSet):
    queryset = Page.objects.select_related("author")
    serializer_class = PageSerializer
    staff_order = "position"
    public_order = "position"
    filterset_fields = ["show_in_menu", "status"]
    search_fields = ["title", "body"]


class CategoryViewSet(PublicReadEditorWriteMixin, SlugOnCreateMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    slug_max_length = 120
    pagination_class = None


class TagViewSet(PublicReadEditorWriteMixin, SlugOnCreateMixin, viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by("name")
    serializer_class = TagSerializer
    slug_max_length = 60
    pagination_class = None