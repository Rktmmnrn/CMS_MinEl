import django_filters

from .models import Article


class ArticleFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug")
    tag = django_filters.CharFilter(field_name="tags__slug")

    class Meta:
        model = Article
        fields = ["category", "tag", "status"]