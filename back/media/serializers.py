from rest_framework import serializers

from .models import ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE, Media


class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ["id", "file", "filename", "mime_type", "size",
                  "alt_text", "uploaded_at", "uploaded_by"]
        read_only_fields = ["filename", "mime_type", "size", "uploaded_at", "uploaded_by"]

    def validate_file(self, f):
        if f.size > MAX_UPLOAD_SIZE:
            raise serializers.ValidationError("Fichier trop volumineux (5 Mo maximum).")
        if getattr(f, "content_type", None) not in ALLOWED_MIME_TYPES:
            raise serializers.ValidationError("Type non autorisé (images uniquement).")
        return f

    def validate(self, attrs):
        if self.instance and "file" in attrs:
            raise serializers.ValidationError("Le fichier ne peut pas être remplacé.")
        return attrs
