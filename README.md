# CMS – Ministère de l'élevage

Système de gestion de contenu (articles, pages, médias) pour le ministère de l'élevage.
Projet de fin d'études, pour obtention du diplôme de Licence, centré sur la démarche **DevOps** : CI/CD, Docker, déploiement Linux avec Nginx.

## Stack

| Couche | Technologies |
|---|---|
| Backend | Python 3.13, Django, Django REST Framework, simplejwt, django-cors-headers, django-filter, Pillow, psycopg, gunicorn |
| Base de données | PostgreSQL 16 (Docker) |
| Frontend | Next.js, React, TypeScript |
| Qualité | pytest + pytest-django, ruff |
| DevOps | Git/GitHub, GitHub Actions, Docker Compose, Nginx |

## Structure du dépôt

```
CMS_project/
├── .github/workflows/ci.yml    # pipeline CI
├── .env / .env.example         # variables d'environnement
├── docker-compose.yml          # PostgreSQL, backend, frontend, Nginx
├── back/
│   ├── Dockerfile, entrypoint.sh, .dockerignore
│   ├── cms_back/               # configuration Django (settings, urls)
│   ├── accounts/               # Role, User, authentification JWT, utilisateurs
│   ├── content/                # Article, Page, Category, Tag
│   ├── media/                  # Media (upload d'images)
│   ├── dashboard/              # tableau de bord et health check
│   ├── manage.py
│   └── requirements.txt
├── nginx/default.conf          # reverse proxy (fichiers statiques, médias, API)
└── cms_front/                  # frontend Next.js
```

## Démarrage en local (backend)

**Prérequis** : Python 3.13, Docker, Git.

```bash
# 1. Variables d'environnement
cp .env.example .env            # puis renseigner les valeurs

# 2. Base de données
docker compose up -d

# 3. Environnement Python
python -m venv venv
source venv/bin/activate
pip install -r back/requirements.txt

# 4. Migrations et premier administrateur
cd back
python manage.py migrate
python manage.py createsuperuser

# 5. Lancer le serveur
python manage.py runserver
```

API : http://localhost:8000/api/v1/ — Admin Django : http://localhost:8000/admin/

## Lancer toute la pile avec Docker

```bash
docker compose up -d --build
```

| Service | Rôle | Accès |
|---|---|---|
| `db` | PostgreSQL 16 | `localhost:5432` (dev uniquement) |
| `backend` | Django + gunicorn | interne, via Nginx |
| `nginx` | Reverse proxy, fichiers statiques et médias | http://localhost:8080 |

- Au démarrage, le backend applique les migrations et collecte les fichiers statiques.
- Premier administrateur : `docker compose exec backend python manage.py createsuperuser`
- Health check : http://localhost:8080/api/v1/health/
- Réinitialiser la base : `docker compose down -v` (supprime les volumes).

### Variables d'environnement (`.env`)

| Variable | Exemple | Rôle |
|---|---|---|
| `DJANGO_SECRET_KEY` | `une-longue-valeur-aleatoire` | Clé de signature (Django et JWT) |
| `DJANGO_DEBUG` | `True` | `True` en dev, `False` en production |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Hôtes autorisés (séparés par des virgules) |
| `POSTGRES_DB` | `cms` | Nom de la base |
| `POSTGRES_USER` | `cms` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | `...` | Mot de passe PostgreSQL |
| `DB_HOST` | `localhost` | Hôte de la base |
| `DB_PORT` | `5432` | Port (5433 si 5432 est déjà pris) |

Remarques :
- Les variables `POSTGRES_*` ne sont lues qu'à la **première création du volume**. Pour les changer : `docker compose down -v`, puis `docker compose up -d`.
- Ne jamais commiter `.env`. Seul `.env.example` (sans vraies valeurs) est versionné.

## Rôles et permissions

| Rôle | Accès |
|---|---|
| Visiteur (sans compte) | Lecture des contenus `PUBLISHED` uniquement |
| Éditeur (`EDITOR`) | Articles, pages, catégories, tags, médias ; voit brouillons et archivés ; tableau de bord sans le nombre d'utilisateurs |
| Administrateur (`ADMIN`) | Tout ce que fait l'Éditeur + gestion des utilisateurs, attribution des rôles, nombre d'utilisateurs |

Le rôle est vérifié en base à chaque requête (le jeton ne sert qu'à l'affichage côté frontend). Un compte désactivé (`is_active=False`) est refusé partout.

## Authentification

- JWT (simplejwt) : **access** 15 min (conservé en mémoire côté frontend), **refresh** 7 jours.
- Le refresh token est dans un cookie `httpOnly` (+ `Secure` en production), jamais dans le corps JSON.
- Rotation du refresh à chaque renouvellement, liste noire à la déconnexion.
- Limitation du login : 5 tentatives par minute. Message d'erreur identique pour un email inconnu et un mauvais mot de passe.
- Derrière Nginx, NUM_PROXIES = 1 permet à DRF de limiter les tentatives par IP réelle.

## API REST (préfixe `/api/v1/`)

| Route | Méthodes | Accès |
|---|---|---|
| `auth/login/` | POST | Public |
| `auth/refresh/` | POST | Public (cookie refresh valide) |
| `auth/logout/` | POST | Authentifié |
| `auth/me/` | GET | Authentifié |
| `auth/password/change/` | POST | Authentifié |
| `articles/`, `articles/{slug}/` | GET | Public (`PUBLISHED` seulement) |
| `articles/` , `articles/{slug}/` | POST, PATCH, DELETE | Éditeur / Admin |
| `articles/{slug}/publish/`, `unpublish/`, `archive/`, `restore/` | POST | Éditeur / Admin |
| `pages/`, `pages/{slug}/` (+ `publish/`, `unpublish/`) | GET public, écriture Éditeur / Admin | |
| `categories/`, `tags/` | GET public, écriture Éditeur / Admin | |
| `media/` | GET, POST, PATCH, DELETE | Éditeur / Admin |
| `users/` | GET, POST, PATCH | Admin |
| `dashboard/` | GET | Éditeur / Admin |
| `health/` | GET | Public (utilisé par la CI/CD) |

**Recherche et filtres (articles)** : `?search=mot`, `?category=<slug>`, `?tag=<slug>`, `?page=2`.

**Cycle de vie d'un article** : `DRAFT` → `PUBLISHED` → `ARCHIVED`.
Le statut ne se modifie que par les actions `publish`, `unpublish`, `archive` et `restore`. Une transition impossible renvoie `409`. Un article publié ne peut pas être supprimé directement.

**Pages** : `DRAFT` ↔ `PUBLISHED` uniquement.

## Tests et qualité

```bash
cd back
pytest -q            # tests (nécessite PostgreSQL)
ruff check .         # lint
ruff check . --fix   # corrections automatiques
python manage.py makemigrations --check --dry-run   # aucune migration oubliée
```

## CI/CD

Pipeline GitHub Actions (`.github/workflows/ci.yml`), déclenché sur chaque push vers `main` et chaque Pull Request :

1. Service PostgreSQL 16
2. Installation des dépendances (Python 3.13)
3. Lint (`ruff`)
4. Vérification des migrations
5. Tests (`pytest`)

Étapes réalisées : tests backend (ruff, migrations, pytest). Étapes prévues : build et publication
de l'image Docker (GHCR), déploiement SSH, vérification de `/api/v1/health/`, tests frontend.

## Conventions

- Clés primaires en UUID.
- Les utilisateurs se désactivent, ils ne se suppriment pas (`on_delete=PROTECT`).
- Les migrations sont versionnées sur Git.
- Les fichiers uploadés (`back/mediafiles/`) ne sont jamais versionnés.
