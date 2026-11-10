from django.utils.text import slugify
from rest_framework import serializers

from media.models import Media
from media.serializers import MediaSerializer

from .models import Article, Category, Page, Tag
from .sanitize import clean_html
from .utils import RESERVED_PAGE_SLUGS


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description"]
        read_only_fields = ["slug"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["slug"]


class ArticleSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source="author.username", read_only=True)
    # Lecture : objets imbriqués. Écriture : identifiants.
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(),
        write_only=True, required=False, allow_null=True)
    cover_image = MediaSerializer(read_only=True)
    cover_image_id = serializers.PrimaryKeyRelatedField(
        source="cover_image", queryset=Media.objects.all(),
        write_only=True, required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        source="tags", queryset=Tag.objects.all(),
        many=True, write_only=True, required=False)

    def validate_body(self, value):
        return clean_html(value)

    class Meta:
        model = Article
        fields = ["id", "title", "slug", "body", "excerpt", "status", "author",
                  "category", "category_id", "cover_image", "cover_image_id",
                  "tags", "tag_ids", "created_at", "updated_at", "published_at"]
        # status et published_at ne changent que via publish/unpublish/archive
        read_only_fields = ["slug", "status", "published_at"]


class PageSerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent", queryset=Page.objects.all(),
        pk_field=serializers.UUIDField(), required=False, allow_null=True)
    author = serializers.CharField(source="author.username", read_only=True)

    def validate_parent_id(self, value):
        if value is None:
            return value
        if self.instance and value.pk == self.instance.pk:
            raise serializers.ValidationError("Une page ne peut pas être son propre parent.")
        if value.parent_id is not None:
            raise serializers.ValidationError("Ce parent est déjà une sous-page (2 niveaux maximum).")
        if self.instance and self.instance.children.exists():
            raise serializers.ValidationError(
                "Cette page a des sous-pages : elle ne peut pas devenir une sous-page.")
        return value

    def validate_body(self, value):
        return clean_html(value)

    class Meta:
        model = Page
        fields = ["id", "title", "slug", "body", "status", "show_in_menu",
                  "position", "parent_id", "author", "created_at", "updated_at", "published_at"]
        read_only_fields = ["slug", "status", "published_at"]

    def validate_title(self, value):
        if not self.instance and slugify(value) in RESERVED_PAGE_SLUGS:
            raise serializers.ValidationError(
                "Ce titre est réservé : choisissez-en un autre.")
        return value