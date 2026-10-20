from django.contrib import admin

from .models import Article, Category, Page, Tag


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "author", "published_at")
    list_filter = ("status", "category")
    search_fields = ("title",)
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "show_in_menu", "position")
    prepopulated_fields = {"slug": ("title",)}


admin.site.register(Category, prepopulated_fields={"slug": ("name",)})
admin.site.register(Tag, prepopulated_fields={"slug": ("name",)})