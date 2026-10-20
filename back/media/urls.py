from rest_framework.routers import SimpleRouter

from .views import MediaViewSet

router = SimpleRouter()
router.register("media", MediaViewSet, basename="media")
urlpatterns = router.urls
