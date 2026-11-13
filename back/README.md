# Backend : API du CMS du ministère de l'élevage

API REST qui gère les contenus (articles, pages, catégories, étiquettes, médias), les utilisateurs et leurs rôles. Elle est consommée par le frontend Next.js (`cms_front/`) et sert aussi un point de contrôle de santé utilisé par la CI/CD.

**Stack** : Python 3.13, Django, Django REST Framework, JWT (`djangorestframework-simplejwt`), PostgreSQL 16, `django-filter`, `django-cors-headers`, Pillow, `nh3` (nettoyage HTML), gunicorn. Tests avec `pytest` + `pytest-django`, lint avec `ruff`.

Architecture globale, pipeline CI/CD et déploiement : voir le [README racine](../README.md).

## Prérequis et installation

### Avec Docker (voie principale)

Prérequis : Docker et Docker Compose, un fichier `.env` à la racine du dépôt (`cp .env.example .env`, puis renseigner les valeurs).

```bash
docker compose up -d --build        # depuis la racine du dépôt
docker compose exec backend python manage.py createsuperuser
curl http://localhost:8080/api/v1/health/
```

Au démarrage, le conteneur exécute `entrypoint.sh` : `migrate`, `createcachetable`, `collectstatic`, puis gunicorn (3 workers). Le backend n'est pas exposé directement : tout passe par Nginx (`localhost:8080` en développement).

### En local, sans Docker pour Django

Prérequis : Python 3.13 et un PostgreSQL accessible (le plus simple : le service `db` de Docker Compose).

```bash
docker compose up -d db                       # depuis la racine
python3 -m venv venv && source venv/bin/activate
pip install -r back/requirements.txt
cd back
python manage.py migrate
python manage.py createcachetable             # obligatoire : le throttling du login utilise cette table
python manage.py createsuperuser
python manage.py runserver                    # http://localhost:8000
```

Le `venv/` est à la racine du dépôt (ignoré par Git). Le fichier `.env` est lu depuis la racine, pas depuis `back/`.

## Variables d'environnement

Lues par `cms_back/settings.py` depuis le `.env` de la racine. Ne jamais commiter `.env` ; seul `.env.example` (sans valeurs réelles) est versionné.

| Variable | Rôle | Exemple |
|---|---|---|
| `DJANGO_SECRET_KEY` | Clé de signature (Django et JWT). Obligatoire. | `<clé aléatoire longue>` |
| `DJANGO_DEBUG` | `True` en dev. Toute autre valeur (ou l'absence) = `False`. | `True` |
| `DJANGO_ALLOWED_HOSTS` | Hôtes autorisés, séparés par des virgules | `localhost,127.0.0.1` |
| `POSTGRES_DB` | Nom de la base | `cms` |
| `POSTGRES_USER` | Utilisateur PostgreSQL | `cms` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | `<mot de passe>` |
| `DB_HOST` | Hôte de la base (`localhost` en local ; Docker Compose le remplace par `db`) | `localhost` |
| `DB_PORT` | Port de la base (`5433` si le 5432 est pris) | `5432` |
| `CORS_ALLOWED_ORIGINS` | Origines du frontend autorisées (facultatif, défaut `http://localhost:3000`) | `https://cms.example.org` |
| `CSRF_TRUSTED_ORIGINS` | Origines de confiance pour CSRF (facultatif, utile en production) | `https://cms.example.org` |
| `BACKEND_TAG` | Lue par `docker-compose.prod.yml` seulement (pas par Django) : tag de l'image (défaut `latest`) | `sha-a570402` |

Les variables `POSTGRES_*` ne sont prises en compte qu'à la **première création du volume** `pgdata`. Pour les changer : `docker compose down -v`, puis relancer (efface les données).

## Commandes courantes

À lancer depuis `back/`, avec le `venv` activé.

```bash
python manage.py makemigrations          # après une modification de modèle ; commiter les fichiers créés
python manage.py makemigrations --check --dry-run   # contrôle utilisé en CI
python manage.py migrate
python manage.py createcachetable
python manage.py createsuperuser         # reçoit automatiquement le rôle ADMIN
python manage.py collectstatic --noinput
pytest -q                                # nécessite PostgreSQL démarré
ruff check .                             # ruff check . --fix pour les corrections simples
```

Dans le conteneur : `docker compose exec backend python manage.py <commande>`.

Les rôles `ADMIN` et `EDITOR` sont créés par la migration de données `accounts/0002_seed_roles.py`. Les migrations sont versionnées sur Git : ne jamais les supprimer.

## Structure du code

```
back/
├── cms_back/        # configuration : settings.py, urls.py, pagination.py (page_size)
├── accounts/        # Role, User (connexion par e-mail), permissions, authentification JWT, gestion des utilisateurs
├── content/         # Article, Page, Category, Tag : modèles, filtres, nettoyage HTML (sanitize.py), slugs (utils.py)
├── media/           # Media : envoi, validation et suppression des images
├── dashboard/       # statistiques du tableau de bord et health check (sans modèle)
├── conftest.py      # fixtures pytest (clients API, utilisateurs, cache)
├── pytest.ini, ruff.toml, requirements.txt
├── Dockerfile       # image Python 3.13-slim, utilisateur non-root, gunicorn
└── entrypoint.sh    # migrate + createcachetable + collectstatic au démarrage
```

Les tests sont à côté du code qu'ils couvrent : `accounts/test_*.py`, `content/test_api.py`, `media/test_api.py`.

## Contrat de l'API

Préfixe : `/api/v1/`. Tout est protégé par défaut (`IsAuthenticated`) ; les routes publiques le déclarent explicitement.

**Rôles** : *Visiteur* (sans jeton) = lecture des contenus `PUBLISHED` ; *Éditeur* (`EDITOR`) = tous les contenus, tous statuts, médias, tableau de bord ; *Administrateur* (`ADMIN`) = Éditeur + utilisateurs et nombre d'utilisateurs du tableau de bord. Le rôle est relu en base à chaque requête.

### Routes

**Règle d'identifiant** : articles, pages, catégories et étiquettes → **slug** ; médias et utilisateurs → **UUID**.

| Ressource | Routes | Accès |
|---|---|---|
| Articles | `GET /articles/`, `GET /articles/{slug}/` | Public (`PUBLISHED` seulement ; un brouillon donne 404) |
| | `POST /articles/`, `PATCH`, `DELETE /articles/{slug}/` | Éditeur / Admin |
| | `POST /articles/{slug}/publish/`, `unpublish/`, `archive/`, `restore/` | Éditeur / Admin |
| Pages | `GET /pages/`, `GET /pages/{slug}/` | Public (`PUBLISHED` seulement) |
| | `POST /pages/`, `PATCH`, `DELETE /pages/{slug}/` | Éditeur / Admin |
| | `POST /pages/{slug}/publish/`, `unpublish/` | Éditeur / Admin |
| Catégories, étiquettes | `GET /categories/`, `/tags/` (+ `/{slug}/`) | Public |
| | `POST`, `PATCH`, `DELETE` | Éditeur / Admin |
| Médias | `GET`, `POST /media/`, `GET`, `PATCH`, `DELETE /media/{uuid}/` | Éditeur / Admin |
| Utilisateurs | `GET`, `POST /users/`, `GET`, `PATCH /users/{uuid}/` (pas de DELETE) | Admin |
| Tableau de bord | `GET /dashboard/` | Éditeur / Admin (`users` réservé à l'Admin) |
| Santé | `GET /health/` | Public : 200 `{"status":"ok","database":"up"}` ou 503 si la base est injoignable |
| Authentification | voir section suivante | |

**Champs en écriture** : article `title`, `body`, `excerpt`, `category_id`, `cover_image_id`, `tag_ids` ; page `title`, `body`, `show_in_menu`, `position`, `parent_id` ; catégorie `name`, `description` ; étiquette `name` ; média `file` (multipart) et `alt_text` ; utilisateur `username`, `email`, `first_name`, `last_name`, `role` (`"ADMIN"` ou `"EDITOR"`), `is_active`, `password`. `slug`, `status` et `published_at` sont en lecture seule. Pour retirer une catégorie, une image de couverture ou les étiquettes : `PATCH` avec `category_id: null`, `cover_image_id: null`, `tag_ids: []` ; un champ absent n'est pas modifié.

**Slugs** : générés à la création à partir du titre (ou du nom), uniques (suffixe `-2`, `-3`...), **jamais modifiés ensuite**. Utiliser toujours le slug renvoyé par l'API.

**Slugs réservés (pages)** : à la création d'une page, un titre dont le slug serait `login`, `dashboard`, `articles`, `admin`, `api`, `static`, `mediafiles`, `_next`, `favicon.ico`, `robots.txt` ou `sitemap.xml` est refusé : `400 {"title": ["..."]}`. Seuls les sept premiers peuvent réellement se produire. Le contrôle ne s'applique pas aux articles ni aux renommages.

### Cycle de vie des statuts

| Action | Depuis | Vers |
|---|---|---|
| `publish` | `DRAFT`, `ARCHIVED` | `PUBLISHED` |
| `unpublish` | `PUBLISHED` | `DRAFT` |
| `archive` (articles) | `PUBLISHED` | `ARCHIVED` |
| `restore` (articles) | `ARCHIVED` | `DRAFT` |

- Une transition impossible renvoie **409** `{"detail": "..."}` (message en français).
- Le statut ne change **que** par ces actions : un `PATCH` contenant `status` est ignoré.
- Un article `PUBLISHED` ne peut pas être supprimé (409) ; une page publiée peut l'être (204).
- Les pages n'ont que `DRAFT` et `PUBLISHED`. `published_at` est fixé à la première publication seulement.

### Pages hiérarchiques (`parent_id`)

- `parent_id` (UUID d'une page ou `null`) est présent en lecture et en écriture.
- **2 niveaux maximum**. `400 {"parent_id": [...]}` si la page est son propre parent, si le parent est déjà une sous-page, ou si la page a elle-même des sous-pages.
- Supprimer un parent : ses enfants passent à `parent_id: null` (204).
- Dans `GET /pages/` côté public, un enfant dont le parent n'est pas publié est exclu. Le détail `GET /pages/{slug}/` reste accessible.
- `position` s'applique à l'intérieur d'un même parent ; deux pages peuvent avoir la même position (ordre alors indéterminé). Les URL restent plates (pas de `/parent/enfant`).

### Filtres, tri et pagination

| Ressource | Filtres | Tri |
|---|---|---|
| Articles | `?search=` (titre, extrait, texte), `?category=<slug>`, `?tag=<slug>`, `?status=` ; tous combinables (ET) | Public : date de publication décroissante. Éditeurs : date de création décroissante |
| Pages | `?search=`, `?show_in_menu=true`, `?status=` | `position` croissante |
| Utilisateurs | aucun | e-mail croissant |

La recherche ignore la casse mais **pas les accents**. `category` et `tag` n'acceptent qu'une seule valeur.

Pagination (articles, pages, médias, utilisateurs) : `?page=N`, 10 par page, réponse `{count, next, previous, results}`. `?page_size=` n'existe que sur **`/pages/` et `/media/`** (maximum 50). Catégories et étiquettes ne sont **pas paginées** (tableau simple). Menu complet : `GET /pages/?show_in_menu=true&page_size=50`.

### Erreurs

| Code | Signification | Corps |
|---|---|---|
| 400 | Validation | `{"champ": ["message"]}` |
| 401 | Non authentifié, jeton expiré ou compte désactivé | `{"detail": "..."}` |
| 403 | Rôle insuffisant | `{"detail": "..."}` |
| 404 | Introuvable (ou contenu non publié pour un visiteur) | `{"detail": "..."}` |
| 409 | Transition de statut impossible, suppression refusée | `{"detail": "..."}` |
| 429 | Trop de tentatives de connexion | `{"detail": "..."}` |
| 503 | Base injoignable (`/health/`) | `{"status": "error", "database": "down"}` |

Les messages de validation (400) suivent `LANGUAGE_CODE` (défaut du projet : `en-us`, donc en anglais) ; les `detail` des 409 sont déjà en français.

## Authentification

| Route | Détail |
|---|---|
| `POST /auth/login/` | `{email, password}` → 200 `{access, role}` + cookie `refresh_token`. Même 401 pour e-mail inconnu, mauvais mot de passe ou compte désactivé. |
| `POST /auth/refresh/` | Sans corps, cookie envoyé (`credentials: "include"`) → 200 `{access}` et nouveau cookie (rotation). 401 si le refresh est invalide, expiré ou sur liste noire. |
| `POST /auth/logout/` | Bearer requis. Met le refresh sur liste noire, supprime le cookie. 204. |
| `GET /auth/me/` | Profil de l'utilisateur connecté. |
| `PATCH /auth/me/` | Modifie `first_name` et `last_name` uniquement ; `email`, `role` et le reste sont ignorés. Renvoie le profil complet. |
| `POST /auth/password/change/` | `{old_password, new_password}` → 200, ou 400 (validateurs). |

- **Access token** : 15 minutes, à garder en mémoire côté client (jamais `localStorage`).
- **Refresh token** : 7 jours, **uniquement dans un cookie** (jamais dans le JSON) : nom `refresh_token`, `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth/`, `Secure` quand `DJANGO_DEBUG` ≠ `True`. Rotation à chaque refresh, ancien jeton sur liste noire.
- Le rôle est copié dans le jeton (affichage côté frontend), mais l'API relit toujours le rôle en base. Un compte `is_active=False` voit son access token refusé immédiatement.
- **Throttle du login** : 5 requêtes par minute et par adresse IP (toutes les tentatives comptent), puis **429**. Les compteurs sont dans un cache partagé en base (`DatabaseCache`, table `django_cache`), pour que les 3 workers gunicorn comptent ensemble. `NUM_PROXIES = 1` permet à DRF de lire l'IP réelle derrière Nginx.

## Sécurité

- **Nettoyage HTML (`nh3`)** : le champ `body` des articles et des pages est nettoyé **à l'écriture** (liste blanche) ; l'API renvoie donc toujours du HTML sûr, affichable tel quel.
  - Balises acceptées : `p`, `br`, `hr`, `strong`, `em`, `u`, `s`, `code`, `pre`, `blockquote`, `h2`, `h3`, `h4`, `ul`, `ol`, `li`, `a`, `img`, `table`, `thead`, `tbody`, `tr`, `th`, `td`.
  - Attributs : `a` → `href`, `title` ; `img` → `src`, `alt`, `width`, `height`. Tout le reste (`style`, `class`, `target`...) est supprimé.
  - Schémas d'URL absolues : `http`, `https`, `mailto`. Les URL relatives (`/mediafiles/...`) passent. `javascript:` et `data:` sont bloqués. Les liens reçoivent `rel="noopener noreferrer"`.
- **Mots de passe** : hachage Django (PBKDF2) et validateurs actifs : 8 caractères minimum, pas trop proche des données de l'utilisateur, pas dans la liste des mots de passe courants, pas entièrement numérique. À la création d'un compte par l'Admin, la comparaison avec les données de l'utilisateur n'est pas faite.
- **E-mail** : l'unicité et le login sont **sensibles à la casse** (`A@x.org` ≠ `a@x.org`). Le client doit envoyer l'e-mail **en minuscules**, à la création comme au login ; le serveur ne normalise que la partie domaine.
- **Comptes** : jamais supprimés, désactivés (`is_active`) ; `on_delete=PROTECT` sur les auteurs et les rôles.
- **Production** : en `DJANGO_DEBUG=False`, l'API ne répond qu'en JSON (pas de page navigable DRF) et `SECURE_PROXY_SSL_HEADER` fait confiance à `X-Forwarded-Proto` envoyé par Nginx.

## Médias

- **Types acceptés** : `image/jpeg`, `image/png`, `image/gif`, `image/webp`, 5 Mo maximum (`400` sinon). Pillow vérifie que le fichier est une vraie image. Nginx accepte jusqu'à 6 Mo (`client_max_body_size`).
- **Stockage** : `MEDIA_ROOT = back/mediafiles/` (dans le conteneur : `/app/mediafiles`, volume Docker `media`), sous-dossiers `uploads/AAAA/MM/`. Servi par Nginx sous `/mediafiles/` (par Django seulement en `DEBUG`). Ce dossier n'est jamais versionné.
- **`PATCH`** : seul `alt_text` est modifiable (pas de remplacement du fichier). **`DELETE`** : supprime la ligne **et** le fichier sur le disque ; les articles qui l'utilisaient comme couverture passent à `cover_image: null`.
- **Champ `file`** : URL absolue. Derrière Nginx en développement, le port peut manquer dans l'hôte : utiliser uniquement le **chemin** (`/mediafiles/...`) sur l'origine du site.
- **Droits du volume (non-root)** : l'application tourne sous l'utilisateur `appuser`. Un volume nommé n'hérite des droits de l'image qu'à sa **création**. S'il a été créé avec les droits `root`, l'envoi d'une image échoue (`PermissionError: ... '/app/mediafiles/uploads'`, erreur 500). Correction sans perte de données :

  ```bash
  docker compose exec -u root backend chown -R appuser:appuser /app/mediafiles /app/staticfiles
  ```

  Un volume neuf (premier déploiement) n'a pas ce problème.

## Limites connues et pistes

| Limite | Piste |
|---|---|
| L'admin Django (`/admin/`) contourne `nh3` : un texte saisi là n'est pas nettoyé | Nettoyer dans `Content.save()` |
| Pas d'invalidation des refresh tokens au changement de mot de passe ni à la désactivation (un refresh volé reste valable jusqu'à 7 jours). Le refresh d'un compte désactivé n'est pas couvert par un test | Mettre les jetons en liste noire à ces moments ; ajouter le test |
| Un Admin peut se rétrograder, se désactiver, ou laisser le système sans Admin | Refuser ces cas côté serveur (400) |
| Le `role` dans le jeton peut rester ancien jusqu'au renouvellement complet de la session | Lire `GET /auth/me/` pour l'affichage |
| Les liens `tel:` sont supprimés | Ajouter `tel` aux schémas dans `content/sanitize.py` |
| Pas de limite serveur sur l'extrait (`excerpt`) ; limite de 300 recommandée côté interface | Ajouter `max_length=300` |
| Aucun contrôle sur la publication d'un texte vide (`<p></p>` accepté) | Refuser `publish` si le texte est vide |
| Doublons d'étiquettes ou de catégories : seul le nom identique à la casse près est refusé (« Zébu » et « zebu » coexistent) | Comparer les slugs à la validation |
| Édition simultanée : le dernier enregistrement gagne | Contrôle sur `updated_at` (409) |
| `/users/` sans recherche ni filtre ; `page_size` absent sur articles et utilisateurs | À ajouter si nécessaire |
| Une `<img>` insérée dans un texte reste cassée si le média est supprimé | Avertir l'éditeur, ou lier les médias aux contenus |
| Une seule instance du backend (le `migrate` au démarrage n'est pas sûr en parallèle ; cache de throttle en base) | Passer à Redis et à une étape de migration dédiée si l'on monte en charge |