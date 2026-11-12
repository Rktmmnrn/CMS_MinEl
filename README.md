# CMS – Ministère de l'élevage

Système de gestion de contenu (articles, pages, médias) pour le ministère de l'élevage.

Projet de fin d’études (Licence 3), avec un accent sur le DevOps : conteneurisation, intégration continue, publication d’images et déploiement.

## Architecture

```
Navigateur ──► Nginx (point d'entrée unique, même domaine)
                 ├── /api/, /admin/, /static/, /mediafiles/ ──► Backend Django (API REST)
                 └── /  (tout le reste)                     ──► Frontend Next.js
                                                                   │
                              Backend Django ──► PostgreSQL ◄──────┘ (via l'API)
```

Tout passe par la **même origine** : le cookie de session (refresh token) fonctionne sans CORS.

## Organisation du dépôt

| Dossier / fichier | Contenu |
|---|---|
| [`back/`](back/README.md) | API REST Django, authentification JWT, tests (pytest) |
| [`cms_front/`](cms_front/README.md) | Site public et espace de gestion (Next.js, React, TypeScript) |
| `nginx/` | Configuration du reverse proxy |
| `docker-compose.yml` | Environnement de développement (base, backend, Nginx) |
| `.github/workflows/ci.yml` | Intégration continue : tests, lint, images Docker |

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
└── cms_front/
    ├── app/
    │   ├── layout.tsx                  # racine : police, lang="fr", providers
    │   ├── not-found.tsx               # 404
    │   ├── (public)/                   # site public (rendu serveur)
    │   └── (app)/                      # espace éditeur/admin (côté client)
    │       ├── layout.tsx              # 
    │       ├── dashboard
    │       │    ├── layout.tsx
    │       │    ├── page.tsx
    │       │    ├── articles/(creer, modifier)
    │       │    ├── categories/page.tsx
    │       │    ├── medias/page.tsx
    │       │    ├── pages/(creer, modifier)
    │       │    ├── profil/page.tsx
    │       │    ├── tags/page.tsx
    │       │    └── utilisateurs/
    │       └── login/page.tsx          # page de login
    ├── components/
    │   ├── admin/                      # Sidebar, StatusBadge, RichTextEditor, MediaPicker...
    │   ├── ui/                         # shadcn (Button, Dialog, Table, Badge...)
        ├── auth/                       # Authentification
    │   └── public/                     # Header, ArticleCard, Pagination...
    ├── lib/
    │   ├── utils
    │   ├── api/*.ts                    # fonctions par ressource (articles, pages, media...)
    │   ├── auth/AuthProvider.tsx       # access token en mémoire, rôle, login/logout
    │   ├── hooks/                      # hooks TanStack Query (useArticles, ...)
    │   ├── schemas/                    # schémas Zod des formulaires
    │   └── i18n/errors.ts              # traduction des messages d'erreur API
    └── types/api.ts                    # types Article, Page, Media, User...
```
## Rôles

- **Visiteur** : lit les contenus publiés, sans compte.
- **Éditeur** : gère articles, pages, catégories, étiquettes et médias.
- **Administrateur** : tout ce que fait l’éditeur, plus la gestion des utilisateurs.

## Démarrage rapide (développement)

Prérequis : Docker et Docker Compose, Node.js 22 (voir `cms_front/.nvmrc`).

```bash
# 1. Variables d'environnement
cp .env.example .env        # puis renseigner les valeurs (ne jamais versionner .env)

# 2. Base de données, backend et Nginx
docker compose up -d        # site et API sur http://localhost:8080

# 3. Frontend en mode développement
cd cms_front
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Détails et commandes : [`back/README.md`](back/README.md) et [`cms_front/README.md`](cms_front/README.md).

## Intégration continue

À chaque `push` et chaque `pull request` :

- **backend** : lint (ruff), vérification des migrations, tests (pytest) ;
- **frontend** : lint (eslint), typage (tsc), build, audit des dépendances de production ;
- sur `main` uniquement : publication des images Docker sur GHCR
  (`ghcr.io/rktmmnrn/cms_minel-backend` et `…-frontend`).

## Déploiement

A suivre : `docker-compose.prod.yml`, serveur Linux (VPS), déploiement SSH, vérification de `/api/v1/health/`, HTTPS.

## Documentation

- Contrat de l’API : À COMPLÉTER (lien ou fichier).
- Limites connues : voir la section dédiée de [`cms_front/README.md`](cms_front/README.md) et de `back/README.md`.