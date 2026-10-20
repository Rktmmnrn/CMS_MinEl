from rest_framework import serializers

from media.models import Media
from media.serializers import MediaSerializer

from .models import Article, Category, Page, Tag


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

    class Meta:
        model = Article
        fields = ["id", "title", "slug", "body", "excerpt", "status", "author",
                  "category", "category_id", "cover_image", "cover_image_id",
                  "tags", "tag_ids", "created_at", "updated_at", "published_at"]
        # status et published_at ne changent que via publish/unpublish/archive
        read_only_fields = ["slug", "status", "published_at"]


class PageSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Page
        fields = ["id", "title", "slug", "body", "status", "show_in_menu",
                  "position", "author", "created_at", "updated_at", "published_at"]
        read_only_fields = ["slug", "status", "published_at"]
