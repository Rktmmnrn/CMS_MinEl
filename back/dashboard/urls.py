from django.urls import path

from .views import DashboardView, HealthView

urlpatterns = [
    path("dashboard/", DashboardView.as_view()),
    path("health/", HealthView.as_view()),
]