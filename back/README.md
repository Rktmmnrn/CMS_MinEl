# Backend — API CMS

## Présentation

Le backend fournit l’API du CMS : authentification et gestion des comptes, du contenu et des médias.
Il expose des routes REST versionnées sous `/api/v1/`, avec lecture publique des contenus publiés et
écriture réservée aux éditeurs et administrateurs. L’application est construite avec Django et
Django REST Framework, des jetons JWT (Simple JWT), PostgreSQL et `nh3` pour nettoyer le HTML.

## Prérequis et installation

### Docker (voie principale)

Prérequis : Docker et Docker Compose. Depuis la racine du dépôt :

```bash
cp .env.example .env
# Définir POSTGRES_PASSWORD et DJANGO_SECRET_KEY dans .env avant le démarrage.
docker compose up --build -d
```

Le backend et PostgreSQL démarrent avec Nginx, qui publie l’API sur
`http://localhost:8080/api/v1/`. Le conteneur backend applique les migrations et collecte les
fichiers statiques au démarrage. `docker compose logs -f backend` permet de suivre son démarrage.

### Installation locale sans Docker

Il faut Python 3.13, PostgreSQL 16 accessible localement et une base dont les identifiants
correspondent à `.env`. Depuis la racine, copiez `.env.example` vers `.env`, renseignez les secrets,
puis utilisez `DB_HOST=localhost` (Compose remplace cette valeur par `db` dans le conteneur).

```bash
cd back
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

L’API de développement est alors disponible sur `http://localhost:8000/api/v1/`. Configurez aussi
`DJANGO_ALLOWED_HOSTS` et les origines CORS/CSRF si l’interface tourne sur une autre adresse.

## Variables d’environnement

Les valeurs vides ci-dessous sont intentionnelles : les deux secrets doivent être fournis
localement et ne doivent jamais être ajoutés au dépôt.

| Variable | Rôle | Exemple non secret |
|---|---|---|
| `POSTGRES_DB` | Nom de la base PostgreSQL | `cms` |
| `POSTGRES_USER` | Utilisateur PostgreSQL | `cms_user` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | À définir dans `.env` |
| `DB_HOST` | Hôte PostgreSQL ; Compose le remplace par le service `db` | `db` (Docker), `localhost` (local) |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DJANGO_SECRET_KEY` | Clé secrète Django | À générer localement, jamais à publier |
| `DJANGO_DEBUG` | Active le mode debug Django (`True` ou `False`) | `True` en développement |
| `DJANGO_ALLOWED_HOSTS` | Hôtes HTTP acceptés, séparés par des virgules | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Origines autorisées pour CORS, séparées par des virgules | `http://localhost:3000` |
| `CSRF_TRUSTED_ORIGINS` | Origines de confiance CSRF, séparées par des virgules | Vide en local si non nécessaire |

En production, désactivez le debug, restreignez les hôtes/origines aux domaines déployés et configurez
les deux secrets hors du dépôt.

## Commandes courantes

Depuis la racine du dépôt, en Docker :

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend pytest
docker compose exec backend ruff check .
docker compose exec backend python manage.py collectstatic --noinput
```

En installation locale, exécutez les mêmes commandes `python manage.py ...` dans `back/`; pour les
tests et le lint, utilisez `pytest` et `ruff check .`.

## Structure du code

```text
back/
├── cms_back/   # configuration Django, routes racine, pagination, ASGI/WSGI
├── accounts/   # utilisateurs, rôles, permissions et authentification JWT
├── content/    # articles, pages, catégories, tags, filtres et nettoyage HTML
├── media/      # téléversement, métadonnées et gestion des fichiers médias
├── dashboard/  # indicateurs du tableau de bord et vérification de santé
├── manage.py   # commandes d’administration Django
└── requirements.txt
```

## Contrat de l’API

Les routes sont préfixées par `/api/v1`. Les rôles sont : **visiteur** (non authentifié),
**éditeur** (gestion de contenu et médias) et **admin** (droits éditeur et gestion des utilisateurs).
Les visiteurs ne voient que les articles et pages publiés ; les éditeurs et admins peuvent aussi
consulter les brouillons et contenus archivés.

| Route | Accès et opérations | Filtres / recherche | Pagination |
|---|---|---|---|
| `/health/` | Public, `GET` ; vérifie la connexion à la base | — | Non |
| `/auth/login/`, `/auth/refresh/`, `/auth/logout/` | Connexion publique, renouvellement par cookie, déconnexion authentifiée | — | Non |
| `/auth/me/`, `/auth/password/change/` | Utilisateur authentifié : `GET`/`PATCH` son profil, `POST` pour changer son mot de passe | — | Non |
| `/dashboard/` | Éditeur/admin, `GET` | — | Non |
| `/articles/` et `/articles/{slug}/` | `GET` public ; `POST`, `PUT`/`PATCH`, `DELETE` éditeur/admin ; actions `publish`, `unpublish`, `archive`, `restore` par `POST` | `category`, `tag`, `status`; `search` dans titre, extrait et corps | 10 par défaut, fixe |
| `/pages/` et `/pages/{slug}/` | `GET` public ; écriture et actions `publish`/`unpublish` éditeur/admin | `show_in_menu`, `status`; `search` dans titre et corps | 10 par défaut, `page_size` configurable, maximum 50 |
| `/categories/` et `/categories/{slug}/` | `GET` public ; CRUD éditeur/admin | — | Non |
| `/tags/` et `/tags/{slug}/` | `GET` public ; CRUD éditeur/admin | — | Non |
| `/media/` et `/media/{uuid}/` | Éditeur/admin : `GET`, `POST`, `PATCH` (métadonnées), `DELETE` | — | 10 par défaut, `page_size` configurable, maximum 50 |
| `/users/` et `/users/{uuid}/` | Admin seulement : `GET`, `POST`, `PATCH` ; désactiver avec `is_active=false` (pas de suppression) | — | 10 par défaut, fixe |

Les routes de détail des **articles, pages, catégories et tags utilisent un slug** ; celles des
**médias et utilisateurs utilisent un UUID**. L’UUID demeure aussi présent comme champ `id` dans les
objets de contenu.

Les listes paginées suivent le format DRF `count`, `next`, `previous`, `results`. `page_size` n’est
accepté que pour les pages et les médias ; les catégories et tags ne sont pas paginés. Les filtres
non listés dans le tableau ne sont pas disponibles.

Les erreurs de validation DRF renvoient généralement `400` avec un objet par champ (ou `detail`) ;
une authentification absente/invalide renvoie `401`, un rôle insuffisant `403`, une ressource absente
`404`. Une transition de statut impossible renvoie `409` avec `{"detail": ...}` ; supprimer un
article publié renvoie également `409`.

### Statuts et pages

- **Articles** : `DRAFT` → `PUBLISHED` avec `publish`; `PUBLISHED` → `DRAFT` avec `unpublish` ou
  `ARCHIVED` avec `archive`; `ARCHIVED` → `PUBLISHED` avec `publish` ou `DRAFT` avec `restore`.
- **Pages** : `DRAFT` ↔ `PUBLISHED` par `publish` et `unpublish`; les pages ne sont pas archivables.
- L’API génère le slug à la création. Les slugs de pages réservés sont `login`, `dashboard`,
  `articles`, `admin`, `api`, `static`, `mediafiles`, `_next`, `favicon.ico`, `robots.txt` et
  `sitemap.xml`.
- `parent_id` accepte un UUID ou `null`. Une page ne peut avoir qu’un niveau de sous-pages
  (deux niveaux au total) ; une page ayant déjà des enfants ne peut pas devenir elle-même une
  sous-page.

## Authentification

Le login renvoie un jeton d’accès valable **15 minutes** et place le jeton de renouvellement
(valable **7 jours**, rotation activée) dans le cookie HTTP-only `refresh_token`. Le cookie est
limité à `Path=/api/v1/auth/`, avec `SameSite=Lax`; `Secure` est désactivé en debug et activé hors
debug (HTTPS requis en production). Le refresh token ne figure pas dans le JSON du login.
L’endpoint de login est limité à **5 requêtes par minute** ; le dépassement renvoie `429`.

## Sécurité et médias

- Le corps HTML des articles et pages est nettoyé par `nh3` à l’écriture via l’API. Les balises
  admises sont `p`, `br`, `hr`, `strong`, `em`, `u`, `s`, `code`, `pre`, `blockquote`, `h2`, `h3`,
  `h4`, `ul`, `ol`, `li`, `a`, `img`, `table`, `thead`, `tbody`, `tr`, `th` et `td`. Les attributs
  admis sont `href`/`title` sur `a` et `src`/`alt`/`width`/`height` sur `img`; les schémas URL
  acceptés sont `http`, `https` et `mailto`.
- Les mots de passe utilisent les validateurs Django : similarité avec les attributs du compte,
  longueur minimale (8 caractères par défaut), liste des mots de passe courants et rejet des mots
  de passe entièrement numériques.
- Les adresses e-mail enregistrées sont normalisées en minuscules.
- Les médias acceptent les images JPEG, PNG, GIF et WebP jusqu’à **5 Mo**. Les fichiers sont
  enregistrés dans `/app/mediafiles/uploads/AAAA/MM/` dans le conteneur et servis sous
  `/mediafiles/`.
- Le backend s’exécute en utilisateur **non-root**. Le volume monté sur `/app/mediafiles` doit être
  inscriptible par cet utilisateur (notamment si vous utilisez un bind mount sur l’hôte) ; sinon les
  téléversements échouent.

## Limites connues et pistes

- L’admin Django écrit le contenu sans passer par le sérialiseur API et donc sans le nettoyage `nh3`.
- Les refresh tokens ne sont pas invalidés lors d’un changement de mot de passe ou de la
  désactivation d’un compte.
- Rien n’empêche un Admin de se rétrograder lui-même ni de désactiver le dernier Admin.
- `tel:` est retiré des liens par la liste des schémas autorisés de `nh3`.
- L’extrait d’article n’a pas de limite de taille applicative.
- Les noms d’étiquettes en doublon ne font pas encore l’objet d’une erreur de validation API
  dédiée ; la contrainte d’unicité en base peut produire une réponse non maîtrisée.