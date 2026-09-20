# Üsküdar Travel — site vitrine + administration

Site Next.js (App Router) en deux parties :

- **Vitrine publique** (`/`) : accueil, à propos, services, galerie, pages détail offres/destinations — contenu piloté par un mini-CMS, ISR 60 s ;
- **Administration** (`/admin`) : demandes de voyage (formulaire « Composer mon voyage »), services, galerie, contenus et compte, protégée par better-auth (e-mail + mot de passe).

Stack : Next.js 16 · React 19 · Tailwind CSS 4 · Drizzle ORM + Neon (PostgreSQL serverless) · better-auth · UploadThing · Resend. Package manager : **pnpm**.

## Développement local

```bash
pnpm install
cp .env.example .env.local   # puis renseigner les valeurs (voir ci-dessous)
pnpm db:push                 # crée le schéma sur la base (Neon)
pnpm db:seed                 # données de départ + admin (nécessite ADMIN_EMAIL/ADMIN_PASSWORD)
pnpm dev                     # http://localhost:3000
```

Tests de bout en bout (build de prod + Playwright) :

```bash
pnpm test:e2e
```

## Variables d'environnement

| Variable | Requis | Moment | Rôle |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | **build + runtime** | Neon PostgreSQL (chaîne *pooled*, `sslmode=require`). Les pages publiques sont pré-rendues au build → la base doit être joignable à ce moment. |
| `NEXT_PUBLIC_SITE_URL` | ✅ en prod | **build + runtime** | URL publique canonique (sitemap, robots, JSON-LD). |
| `BETTER_AUTH_SECRET` | ✅ | runtime | Secret de signature des sessions (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | ✅ en prod | runtime | URL de base de l'auth (ex. `https://votre-site.vercel.app`). |
| `UPLOADTHING_TOKEN` | ✅ (uploads) | runtime | Upload des images admin (cartes galerie, logo, hero). Sans lui, le site fonctionne mais pas d'upload. |
| `RESEND_API_KEY` | optionnel | runtime | Envoi du lien « mot de passe oublié » de l'admin. Sans clé : le lien est seulement loggé côté serveur. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed uniquement | scripts | Compte admin initial créé par `pnpm db:seed` (local). |

## Déploiement Vercel

Aucun fichier de config spécifique : Next.js 16 est détecté et servi nativement (SSR, ISR, server actions, `next/image` sur le Vercel Image CDN, `src/proxy.ts` ex-middleware edge-compatible).

1. Pousser le dépôt sur GitHub, puis sur Vercel : **Add New… → Project → Import** du dépôt.
2. **Root Directory : `site`** (monorepo — l'app Next.js vit dans `site/`). Build command et output par défaut, rien à changer.
3. Définir les **variables d'environnement** (Settings → Environment Variables) : celles marquées ✅ du tableau ci-dessus, avec les URL de prod dans `NEXT_PUBLIC_SITE_URL` et `BETTER_AUTH_URL`.
4. Déployer. À chaque push sur la branche de prod : build + déploiement automatiques.

Notes de fonctionnement sur Vercel :

- `DATABASE_URL` et `NEXT_PUBLIC_SITE_URL` sont nécessaires **au build** (pré-rendu ISR des pages publiques + sitemap) : les renseigner pour Production *et* Preview avant le premier déploiement.
- Après le premier déploiement, mettre à jour `BETTER_AUTH_URL` et `NEXT_PUBLIC_SITE_URL` avec l'URL finale (`*.vercel.app` ou domaine custom), puis redéployer (les variables `NEXT_PUBLIC_*` sont inlinées au build).
- Migrations de base : à lancer manuellement depuis la machine de dev (`pnpm db:push` ou `pnpm db:migrate`) — la base Neon est partagée entre local et prod. La chaîne *pooled* Neon est compatible avec les fonctions serverless Vercel (`prepare: false` déjà en place dans `src/db/index.ts`).
