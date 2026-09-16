# Üsküdar Travel — site vitrine + administration

Site Next.js (App Router) en deux parties :

- **Vitrine publique** (`/`) : accueil, à propos, services, galerie — contenu piloté par un mini-CMS, ISR 60 s ;
- **Administration** (`/admin`) : gestion des services, de la galerie, des contenus et du compte, protégée par better-auth (e-mail + mot de passe).

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
| `BETTER_AUTH_URL` | ✅ en prod | runtime | URL de base de l'auth (ex. `https://votre-site.netlify.app`). |
| `UPLOADTHING_TOKEN` | ✅ (uploads) | runtime | Upload des images admin (cartes galerie, logo, hero). Sans lui, le site fonctionne mais pas d'upload. |
| `RESEND_API_KEY` | optionnel | runtime | Envoi des e-mails (demandes de contact, reset password). Sans clé : les envois sont ignorés (warning) sans faire échouer la demande. |
| `CONTACT_NOTIFICATION_EMAIL` | optionnel | runtime | Destinataire des notifications de contact. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed uniquement | scripts | Compte admin initial créé par `pnpm db:seed` (local). |

## Déploiement Netlify

La configuration Netlify est prête : [`netlify.toml`](../netlify.toml) à la racine du dépôt (base `site/`, build `pnpm build`, runtime officiel `@netlify/plugin-nextjs`).

1. Pousser le dépôt sur GitHub, puis sur Netlify : **Add new site → Import an existing project**.
2. Netlify lit `netlify.toml` — ne rien changer à build/publish. Il suffit de définir les **variables d'environnement** (Site settings → Environment variables) : celles marquées ✅ du tableau ci-dessus, avec les URL de prod dans `NEXT_PUBLIC_SITE_URL` et `BETTER_AUTH_URL`.
3. Déployer. À chaque push sur la branche de prod, build + déploiement automatiques.

Notes de fonctionnement sur Netlify :

- **ISR / SSR / server actions** sont gérés par le runtime Netlify Next.js ; `next/image` passe par le Netlify Image CDN (aucune config).
- Le garde d'auth `src/proxy.ts` (ex-middleware Next 16) ne fait qu'un test de présence de cookie : compatible edge, aucune dépendance Node.
- Après le premier déploiement, mettre à jour `BETTER_AUTH_URL` et `NEXT_PUBLIC_SITE_URL` si le nom de site Netlify change ou après ajout d'un domaine custom, puis redéployer.
- Migrations de base : à lancer manuellement depuis la machine de dev (`pnpm db:push` ou `pnpm db:migrate`) — la base Neon est partagée entre local et prod.
