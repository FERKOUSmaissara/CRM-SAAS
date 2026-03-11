# CRM SaaS — Gestion de la Relation Client

Projet universitaire développé avec **Next.js 16**, **Supabase** (PostgreSQL) et **Brevo** (emailing).
Application web full-stack de type CRM (Customer Relationship Management) permettant de gérer l'ensemble du cycle de vente : entreprises, contacts, prospects, pipeline commercial, tâches et campagnes email.

---

## Objectif du projet

Concevoir et déployer une application CRM fonctionnelle en mode SaaS, permettant à une équipe commerciale de :

- Centraliser les informations sur ses **entreprises clientes** et ses **contacts**
- Suivre l'avancement des **prospects** (leads) à travers un **pipeline commercial**
- Planifier et gérer des **tâches** internes
- Envoyer des **campagnes email** ciblées via Brevo et suivre leurs statistiques
- Consulter un **dashboard analytique** synthétisant les indicateurs clés

---

## Fonctionnalités principales

| Module | Description |
|---|---|
| **Authentification** | Inscription, connexion, déconnexion via Supabase Auth (JWT + cookies SSR) |
| **Entreprises** | Ajout, consultation, suppression d'entreprises avec contacts associés |
| **Contacts** | Gestion des contacts liés à une entreprise (nom, email, téléphone) |
| **Prospects (Leads)** | Création et suivi des prospects avec statut, valeur estimée, source, email |
| **Pipeline commercial** | Vue Kanban des prospects par étape (Nouveau / En cours / Converti / Perdu) |
| **Tâches** | Création, édition, filtrage et suivi des tâches par statut et date d'échéance |
| **Campagnes email** | Envoi d'emails individuels ou en masse via l'API Brevo avec logs de tracking |
| **Statistiques email** | Suivi des événements Brevo (livraison, ouverture, clic, rebond) via webhooks |
| **Dashboard** | Vue d'ensemble : KPIs, tâches du jour, prospects récents, performances |
| **Thème clair / sombre** | Basculement de thème persistant via `ThemeContext` |

---

## Technologies utilisées

| Technologie | Rôle |
|---|---|
| [Next.js 16](https://nextjs.org/) | Framework React full-stack (App Router, Server Components, API Routes) |
| [Supabase](https://supabase.com/) | Backend as a Service : base de données PostgreSQL, authentification, RLS |
| [PostgreSQL](https://www.postgresql.org/) | Base de données relationnelle hébergée par Supabase |
| [Brevo](https://www.brevo.com/) | API d'envoi d'emails transactionnels et de campagnes |
| [Tailwind CSS v4](https://tailwindcss.com/) | Framework CSS utilitaire pour la mise en page et le style |
| [Recharts](https://recharts.org/) | Bibliothèque de graphiques React pour le dashboard |
| [TypeScript](https://www.typescriptlang.org/) | Typage statique sur l'ensemble du projet |
| [Vercel](https://vercel.com/) | Plateforme de déploiement continu |
| [GitHub](https://github.com/) | Versioning et collaboration |

---

## Prérequis

- **Node.js** v18 ou supérieur
- **npm** v9 ou supérieur
- Un projet **Supabase** créé sur [supabase.com](https://supabase.com/)
- Un compte **Brevo** avec une clé API

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/<votre-compte>/<votre-repo>.git
cd crm-saas
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du dossier `crm-saas/` :

```bash
# Supabase  clés disponibles dans Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://<votre-projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé_anon_publique>
SUPABASE_SERVICE_ROLE_KEY=<clé_service_role_privée>

# Brevo  disponible dans Account > SMTP & API > API Keys
BREVO_API_KEY=<votre_clé_brevo>
BREVO_FROM_EMAIL=no-reply@votre-domaine.com

# Optionnel  secret pour valider la signature des webhooks Brevo
BREVO_WEBHOOK_SECRET=<secret_webhook>
```

> **Attention** : ne jamais commiter `.env.local` dans Git. Il est déjà ignoré par `.gitignore`.

### 4. Initialiser la base de données Supabase

Ouvrez l'éditeur SQL de votre projet Supabase et exécutez dans l'ordre :

```
supabase/schema.sql                                     Schéma principal (tables, RLS, index)
crm-saas/supabase/schema_tasks.sql                      Table des tâches
crm-saas/supabase/schema_email_logs.sql                 Logs d'envoi email
crm-saas/supabase/schema_brevo_email_tracking.sql       Colonnes de tracking Brevo
crm-saas/supabase/schema_leads_email.sql                Colonne email sur les prospects
crm-saas/supabase/schema_cascade_deletes.sql            Suppressions en cascade
```

---

## Lancer le projet en local

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

Autres commandes disponibles :

```bash
npm run build    # Compile le projet pour la production
npm run start    # Démarre le serveur de production (après build)
npm run lint     # Analyse le code avec ESLint
```

---

## Déploiement sur Vercel

1. Importez le dépôt GitHub dans [Vercel](https://vercel.com/new)
2. Définissez le **Root Directory** sur `crm-saas`
3. Ajoutez toutes les variables d'environnement dans *Project > Settings > Environment Variables*
4. Déployez  Vercel détecte automatiquement Next.js

### Configuration du webhook Brevo (optionnel)

Dans votre compte Brevo, configurez un webhook pointant vers :

```
https://<votre-domaine>/api/webhooks/brevo
```

Événements recommandés : `delivered`, `opened`, `clicked`, `hard_bounce`, `soft_bounce`, `blocked`, `spam`, `unsubscribed`.

---

## Structure du projet

```
crm-saas/
 src/
    app/                              # Pages et routes Next.js (App Router)
       layout.tsx                    # Layout racine (métadonnées, thème global)
       page.tsx                      # Redirection vers /login ou /dashboard
       globals.css                   # Styles globaux Tailwind
       login/                        # Page de connexion
       signup/                       # Page d'inscription
       auth/callback/                # Callback OAuth Supabase
       dashboard/                    # Zone protégée  interface principale
          layout.tsx                # Layout dashboard (Sidebar + Topbar)
          page.tsx                  # Page d'accueil du dashboard (KPIs)
          companies/                # CRUD entreprises
          contacts/                 # CRUD contacts
          leads/                    # CRUD prospects
          pipeline/                 # Vue Kanban du pipeline commercial
          tasks/                    # CRUD tâches
          messages/                 # Envoi de campagnes email
       api/                          # Routes API Next.js (côté serveur)
           send-email/               # Envoi email via Brevo (individuel ou campagne)
           email-stats/              # Agrégation des statistiques d'emailing
           webhooks/brevo/           # Réception des événements Brevo
           health/                   # Endpoint de monitoring
           auth/                     # Routes d'authentification Supabase SSR
    components/
       dashboard/                    # Sections du tableau de bord
          OverviewSection.tsx       # Résumé global (KPIs)
          AnalyticsDashboardSection.tsx  # Graphiques et tendances
          LeadsPipelineSection.tsx  # Résumé du pipeline prospects
          TasksSection.tsx          # Compteurs de tâches du jour / en retard
          ContactsSection.tsx       # Contacts récents
          CompaniesSection.tsx      # Entreprises récentes
          PerformanceSection.tsx    # Indicateurs de performance commerciale
          FinanceMarketingSection.tsx  # Données financières et marketing
       ui/                           # Composants d'interface réutilisables
           Sidebar.tsx               # Barre de navigation latérale
           Topbar.tsx                # Barre supérieure (profil, thème)
           Button.tsx                # Bouton générique stylisé
           Card.tsx                  # Carte de contenu
           FormInput.tsx             # Champ de formulaire avec label
           Input.tsx                 # Champ texte brut
           PageHeader.tsx            # En-tête de page (titre + actions)
           TableWrapper.tsx          # Conteneur de tableau responsive
           ConfirmModal.tsx          # Modale de confirmation d'action
           ThemeToggle.tsx           # Bouton bascule thème clair/sombre
           AvatarMenu.tsx            # Menu utilisateur avec avatar
           LogoutButton.tsx          # Bouton de déconnexion
           Logo.tsx                  # Composant logo de l'application
    context/
       ThemeContext.tsx              # Contexte React pour le thème global
    hooks/
       useDashboardData.ts           # Hook central : charge toutes les données du dashboard
    lib/
       supabase.ts                   # Client Supabase navigateur (singleton)
       supabaseAdmin.ts              # Client Supabase serveur (service role)
       tasks.ts                      # Fonctions partagées pour les tâches
       deleteEntity.ts              # Helper générique de suppression Supabase
       email/
           service.ts               # Service Brevo : résolution destinataires + envoi
    middleware.ts                     # Protection des routes /dashboard (vérif. session)
 supabase/                             # Migrations SQL à exécuter dans Supabase
 public/                               # Fichiers statiques (images, icônes)
 tailwind.config.js                    # Configuration Tailwind CSS
 next.config.ts                        # Configuration Next.js
 tsconfig.json                         # Configuration TypeScript
 package.json                          # Dépendances et scripts npm
```

---

## Dépendances principales

| Package | Version | Rôle |
|---|---|---|
| `next` | 16.1.6 | Framework React full-stack |
| `react` / `react-dom` | 19.2.3 | Bibliothèque UI React |
| `@supabase/supabase-js` | ^2.98 | Client JavaScript Supabase |
| `@supabase/ssr` | ^0.8 | Intégration SSR Supabase pour Next.js |
| `tailwindcss` | ^4 | Framework CSS utility-first |
| `recharts` | ^2.6 | Graphiques React pour le dashboard |
| `lucide-react` | ^0.575 | Bibliothèque d'icônes SVG |
| `typescript` | ^5 | Typage statique |
| `eslint` | ^9 | Analyse statique du code |

---

## Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL de votre projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Clé publique anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Clé privée service role (serveur uniquement) |
| `BREVO_API_KEY` | Oui | Clé API Brevo pour l'envoi d'emails |
| `BREVO_FROM_EMAIL` | Oui | Adresse expéditrice des emails |
| `BREVO_WEBHOOK_SECRET` | Non | Secret pour valider les webhooks Brevo |

---

## API interne

| Endpoint | Méthode | Description |
|---|---|---|
| `/api/send-email` | `POST` | Email individuel `{ leadId }` ou campagne `{ leadIds, campaignName, eventType }` |
| `/api/webhooks/brevo` | `POST` | Réception des événements Brevo (livraison, ouverture, clic) |
| `/api/email-stats` | `GET` | Statistiques agrégées sur les N derniers jours (`?days=30`) |
| `/api/health` | `GET` | Endpoint de santé pour monitoring |
| `/api/auth/signin` | `POST` | Connexion utilisateur |
| `/api/auth/signup` | `POST` | Inscription utilisateur |
| `/api/auth/logout` | `POST` | Déconnexion |
| `/api/auth/set-session` | `POST` | Persistance de session SSR |

---

## Architecture et choix techniques

- **App Router Next.js** : toutes les pages utilisent `"use client"` pour les interactions, avec des routes API purement serveur pour les opérations sensibles (envoi email, webhooks).
- **Row Level Security (RLS) Supabase** : chaque utilisateur ne voit et ne modifie que ses propres données (`owner_id = auth.uid()`).
- **Client Supabase singleton** : `src/lib/supabase.ts` exporte un singleton navigateur pour éviter les connexions multiples.
- **Client admin séparé** : `src/lib/supabaseAdmin.ts` utilise la clé `service_role` uniquement dans les API routes, jamais côté client.
- **Middleware de protection** : `src/middleware.ts` redirige vers `/login` tout accès non authentifié à `/dashboard`.
- **Module de tâches partagé** : `src/lib/tasks.ts` centralise les requêtes et calculs de tâches utilisés par le dashboard et la page Tâches.

---

## Auteur

Projet universitaire  développé dans le cadre d'un cours de développement web full-stack.
