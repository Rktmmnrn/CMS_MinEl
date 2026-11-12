# Frontend : CMS MINEL

Site public et espace de gestion du CMS du Ministère de l’Élevage.
Voir le [README du projet](../README.md) pour l’architecture globale.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI), TanStack Query, React Hook Form + Zod, Tiptap (éditeur de texte riche), sonner (notifications), next-themes (thème clair/sombre).

## Prérequis

- Node.js **22** (`nvm use` lit le fichier `.nvmrc`)
- Le backend lancé (`docker compose up -d` à la racine du dépôt)

## Installation

```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

## Variables d’environnement

| Variable | Où | Rôle |
|---|---|---|
| `BACKEND_URL` | développement | Cible du proxy Next vers l’API (`http://127.0.0.1:8080`). Inutilisée en production, Nginx s’en charge. |
| `API_INTERNAL_URL` | exécution, côté serveur | URL de l’API pour le rendu du site public. Développement : `http://127.0.0.1:8080`. Production : `http://nginx`. |

Aucune variable `NEXT_PUBLIC_*` : le navigateur appelle toujours `/api/v1/...` sur la même origine. `.env.local` n’est jamais versionné.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript (`tsc --noEmit`) |
| `npm run build` | Build de production (fonctionne sans backend) |
| `npm start` | Serveur de production |

Avant chaque commit : `npm run lint && npm run typecheck && npm run build`.

## Structure

```
app/
  (public)/       site public, rendu côté serveur (accueil, articles, pages)
  (app)/          espace connecté : /login et /dashboard/... (rendu côté client)
components/
  ui/             composants shadcn
  admin/          composants de l'espace de gestion
  public/         composants du site public
lib/
  api/            fonctions d'appel à l'API, par ressource
  hooks/          hooks TanStack Query
  schemas/        schémas Zod des formulaires
  auth/           AuthProvider (session)
  i18n/errors.ts  messages d'erreur de l'API traduits en français
types/api.ts      types des objets de l'API
```

## Choix techniques à connaître

- **Authentification** : le jeton d’accès (15 min) reste **en mémoire**, jamais dans `localStorage`. Le refresh token est dans un cookie `httpOnly`. Au chargement, un appel à `/auth/refresh/` restaure la session ; sur un 401, un seul refresh puis une seule relance de la requête. Les refresh simultanés partagent une même promesse, car le cookie est renouvelé à chaque appel.
- **Garde de l’espace de gestion** : côté client (le cookie de refresh n’est pas visible par un middleware Next). La vraie protection reste l’API, qui revérifie le rôle à chaque requête. Le rôle affiché sert seulement à adapter le menu.
- **Site public** : rendu à chaque requête (`force-dynamic`) avec 30 s de cache. Aucun appel d’authentification pour un visiteur.
- **HTML des contenus** : le serveur le nettoie (`nh3`) avant stockage. Le site l’affiche tel quel.
- **Routes de l’API** : articles, pages, catégories, étiquettes → slug ; médias, utilisateurs → UUID.
- **Messages d’erreur** : les erreurs de validation de l’API sont en anglais, le frontend les remplace par ses propres messages en français.
- **Accessibilité** : navigation au clavier, labels explicites, contrastes AA, lien d’évitement, annonces pour les lecteurs d’écran.

## Docker

Le `Dockerfile` construit une image multi-stage (Node 22 Alpine, mode `standalone`, utilisateur non-root).

```bash
docker build -t cms-front ./cms_front
docker run --rm -p 3000:3000 -e API_INTERNAL_URL=http://<hôte-api> cms-front
```

En production, l’image est lancée par `docker-compose.prod.yml` derrière Nginx. À COMPLÉTER à la fin de l’étape 12.

## Intégration continue

Job `frontend` : `npm ci`, lint, typage, build, `npm audit --omit=dev --audit-level=high`. Sur `main`, l’image est publiée sur `ghcr.io/rktmmnrn/cms_minel-frontend`. À COMPLÉTER à la fin de l’étape 12.

Les alertes `npm audit` restantes concernent l’outillage de développement (CLI shadcn, eslint). Ne jamais lancer `npm audit fix --force` : il rétrograderait des outils vers des versions incompatibles.

## Limites connues

- Édition simultanée : « dernier enregistrement gagne », sans détection de conflit.
- Le `alt` d’une image déjà insérée dans un texte n’est pas mis à jour si le texte alternatif change dans la médiathèque.
- Après un changement de mot de passe, les sessions ouvertes ailleurs restent valables jusqu’à 7 jours.
- Une publication peut mettre jusqu’à 30 s à apparaître sur le site public (cache).
- Le bouton « Retour » du navigateur ne déclenche pas l’alerte « modifications non enregistrées ».
- L’admin Django contourne le nettoyage HTML.