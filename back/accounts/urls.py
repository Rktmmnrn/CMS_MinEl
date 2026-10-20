from django.urls import path

from .views import LoginView, LogoutView, MeView, PasswordChangeView, RefreshView

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("refresh/", RefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("me/", MeView.as_view()),
    path("password/change/", PasswordChangeView.as_view()),
]
