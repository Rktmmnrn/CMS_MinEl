import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 Mo
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


class Media(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ImageField(upload_to="uploads/%Y/%m/", max_length=255)
    filename = models.CharField(max_length=255, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)
    alt_text = models.CharField(max_length=255, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="media"
    )

    def validate(self):
        if self.file.size > MAX_UPLOAD_SIZE:
            raise ValidationError("Fichier trop volumineux (5 Mo maximum).")
        content_type = getattr(self.file.file, "content_type", None)
        if content_type and content_type not in ALLOWED_MIME_TYPES:
            raise ValidationError("Type de fichier non autorisé (images uniquement).")
        return True

    def clean(self):
        self.validate()

    def save(self, *args, **kwargs):
        if self.file:
            self.filename = self.file.name.split("/")[-1]
            self.size = self.file.size
            self.mime_type = getattr(self.file.file, "content_type", "") or self.mime_type
        super().save(*args, **kwargs)

    def __str__(self):
        return self.filename or str(self.id)