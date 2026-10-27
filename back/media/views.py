from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from accounts.permissions import IsEditorOrAdmin
from cms_back.pagination import FlexiblePagination

from .models import Media
from .serializers import MediaSerializer


class MediaViewSet(viewsets.ModelViewSet):
    queryset = Media.objects.all().order_by("-uploaded_at")
    serializer_class = MediaSerializer
    permission_classes = [IsEditorOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    pagination_class = FlexiblePagination

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def perform_destroy(self, instance):
        instance.file.delete(save=False)  # supprime aussi le fichier sur le disque
        instance.delete()
