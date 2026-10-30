from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Role, User


class CMSTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role.name  # pour l'affichage dans NextJS
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["role"] = self.user.role.name
        return data


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="role.name", read_only=True)
    full_name = serializers.CharField(source="fullName", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name",
                  "full_name", "role", "is_active", "date_joined", "last_login"]
        read_only_fields = fields


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context["request"].user)
        return value


class UserAdminSerializer(serializers.ModelSerializer):
    role = serializers.SlugRelatedField(slug_field="name", queryset=Role.objects.all())

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name",
                  "password", "role", "is_active", "date_joined", "last_login"]
        read_only_fields = ["date_joined", "last_login"]
        extra_kwargs = {"password": {"write_only": True, "required": False}}

    def validate_password(self, value):
        validate_password(value, self.instance)
        return value

    def validate(self, attrs):
        if not self.instance and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Ce champ est obligatoire."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name"]
