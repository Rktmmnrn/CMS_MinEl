from rest_framework.routers import SimpleRouter

from .views import ArticleViewSet, CategoryViewSet, PageViewSet, TagViewSet

router = SimpleRouter()
router.register("articles", ArticleViewSet, basename="article")
router.register("pages", PageViewSet, basename="page")
router.register("categories", CategoryViewSet, basename="category")
router.register("tags", TagViewSet, basename="tag")

urlpatterns = router.urls
