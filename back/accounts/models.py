import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class Role(models.Model):
    class Name(models.TextChoices):
        ADMIN = "ADMIN", "Administrateur"
        EDITOR = "EDITOR", "Éditeur"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=20, unique=True, choices=Name.choices)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, username, password, **extra):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, username, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        if "role" not in extra:
            extra["role"] = Role.objects.get(name=Role.Name.EDITOR)
        return self._create_user(email, username, password, **extra)

    def create_superuser(self, email, username, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra["role"] = Role.objects.get(name=Role.Name.ADMIN)
        return self._create_user(email, username, password, **extra)


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name="users")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = UserManager()

    def is_admin(self):
        return self.role.name == Role.Name.ADMIN

    isAdmin = is_admin

    @property
    def fullName(self):
        return f"{self.first_name} {self.last_name}".strip()

    def changePassword(self, old, new):
        if not self.check_password(old):
            return False
        self.set_password(new)
        self.save(update_fields=["password"])
        return True

    def __str__(self):
        return self.email