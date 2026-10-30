from django.conf import settings
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User
from .permissions import IsAdmin
from .serializers import (
    CMSTokenObtainPairSerializer,
    PasswordChangeSerializer,
    ProfileUpdateSerializer,
    UserAdminSerializer,
    UserSerializer,
)

COOKIE_PATH = "/api/v1/auth/"


def _set_refresh_cookie(response, token):
    response.set_cookie(
        settings.REFRESH_COOKIE_NAME,
        token,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=not settings.DEBUG,  # HTTPS obligatoire en production
        samesite="Lax",
        path=COOKIE_PATH,  # le cookie n'est envoyé qu'aux routes d'auth
    )


class LoginView(TokenObtainPairView):
    serializer_class = CMSTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        refresh = response.data.pop("refresh", None)
        if refresh:
            _set_refresh_cookie(response, refresh)
        return response


class RefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not token:
            return Response({"detail": "Refresh token manquant."}, status=401)
        serializer = self.get_serializer(data={"refresh": token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
        data = serializer.validated_data
        response = Response({"access": data["access"]})
        if "refresh" in data:  # rotation
            _set_refresh_cookie(response, data["refresh"])
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass  # déjà invalide
        response = Response(status=204)
        response.delete_cookie(settings.REFRESH_COOKIE_NAME, path=COOKIE_PATH)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Mot de passe modifié."})


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("role").order_by("email")
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdmin]
    # Pas de DELETE : on désactive (is_active=false) au lieu de supprimer
    http_method_names = ["get", "post", "patch", "head", "options"]
