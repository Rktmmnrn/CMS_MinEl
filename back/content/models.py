import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True) # identifiant lisible dans l'URL
    description = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True)

    def __str__(self):
        return self.name


class ContentStatus(models.TextChoices):
    DRAFT = "DRAFT", "Brouillon"
    PUBLISHED = "PUBLISHED", "Publié"
    ARCHIVED = "ARCHIVED", "Archivé"


class Content(models.Model):
    """Classe abstraite : pas de table, ses champs sont copiés dans Article et Page."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=220, unique=True)
    body = models.TextField()
    status = models.CharField(
        max_length=10, choices=ContentStatus.choices, default=ContentStatus.DRAFT
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="%(class)ss",
    )

    class Meta:
        abstract = True

    def _set_status(self, new_status, allowed_from):
        if self.status not in allowed_from:
            return False
        self.status = new_status
        if new_status == ContentStatus.PUBLISHED and self.published_at is None:
            self.published_at = timezone.now()
        self.save(update_fields=["status", "published_at", "updated_at"])
        return True

    def save_draft(self):
        self.status = ContentStatus.DRAFT
        self.save()

    def publish(self):
        return self._set_status(
            ContentStatus.PUBLISHED, {ContentStatus.DRAFT, ContentStatus.ARCHIVED}
        )

    def unpublish(self):
        return self._set_status(ContentStatus.DRAFT, {ContentStatus.PUBLISHED})

    def __str__(self):
        return self.title


class Article(Content):
    excerpt = models.TextField(null=True, blank=True) # brève description du contenu
    category = models.ForeignKey(
        Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="articles"
    )
    cover_image = models.ForeignKey(
        "media.Media", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    tags = models.ManyToManyField(
        Tag, blank=True, related_name="articles", db_table="article_tags"
    )

    class Meta:
        indexes = [models.Index(fields=["status", "-published_at"], name="article_status_pub_idx")]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=["DRAFT", "PUBLISHED", "ARCHIVED"]),
                name="article_status_valid",
            )
        ]

    def archive(self):
        return self._set_status(ContentStatus.ARCHIVED, {ContentStatus.PUBLISHED})

    def restore(self):
        return self._set_status(ContentStatus.DRAFT, {ContentStatus.ARCHIVED})

    def add_tag(self, tag):
        self.tags.add(tag)

    def remove_tag(self, tag):
        self.tags.remove(tag)


class Page(Content):
    # On redéfinit status pour interdire ARCHIVED
    status = models.CharField(
        max_length=10,
        choices=[(ContentStatus.DRAFT, "Brouillon"), (ContentStatus.PUBLISHED, "Publié")],
        default=ContentStatus.DRAFT,
    )
    show_in_menu = models.BooleanField(default=False)
    position = models.IntegerField(default=0)

    class Meta:
        ordering = ["position"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=["DRAFT", "PUBLISHED"]),
                name="page_status_valid",
            )
        ]

    def move_to(self, position):
        self.position = position
        self.save(update_fields=["position", "updated_at"])