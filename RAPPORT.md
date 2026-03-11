# Rapport de Projet — Application CRM SaaS

**Titre du projet :** CRM SaaS — Gestion de la Relation Client
**Technologies :** Next.js, Supabase, PostgreSQL, Brevo, Vercel
**Type de projet :** Application web full-stack
**Contexte :** Projet universitaire

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Analyse des besoins](#2-analyse-des-besoins)
3. [Modélisation](#3-modélisation)
4. [Architecture technique](#4-architecture-technique)
5. [Description des fonctionnalités](#5-description-des-fonctionnalités)
6. [Conclusion](#6-conclusion)

---

## 1. Introduction

### 1.1 Contexte

Aujourd'hui, beaucoup d'entreprises gèrent encore leurs clients et prospects avec des fichiers Excel ou des emails. Ce n'est pas très pratique : les informations se perdent, les relances sont oubliées, et il est difficile de savoir où en est chaque dossier.

Un CRM (Customer Relationship Management) permet de régler ce problème en regroupant toutes ces informations dans une seule application. L'objectif est de faciliter le suivi commercial au quotidien.

### 1.2 Présentation du projet

Dans le cadre de ce projet universitaire, nous avons développé une application CRM accessible depuis un navigateur web. Elle permet de gérer des entreprises, des contacts, des prospects, un pipeline commercial, des tâches et des campagnes email.

L'application a été construite avec **Next.js** pour l'interface et les routes API, **Supabase** pour la base de données et l'authentification, et **Brevo** pour l'envoi d'emails.

### 1.3 Objectifs

- Concevoir et déployer une application web complète
- Mettre en place une base de données relationnelle avec isolation des données par utilisateur
- Intégrer un service d'emailing (Brevo) avec suivi des envois
- Produire une interface simple et utilisable par une équipe commerciale

---

## 2. Analyse des besoins

### 2.1 Pourquoi un CRM est utile

Quand une équipe commerciale n'a pas d'outil dédié, plusieurs problèmes apparaissent vite :

- Les informations sur les clients sont éparpillées (un fichier ici, des emails là).
- On oublie de rappeler un prospect ou de faire une relance.
- Il est impossible de savoir combien d'opportunités sont en cours ou ont été perdues.
- Quand plusieurs personnes travaillent ensemble, elles ne partagent pas les mêmes données.

Un CRM règle tous ces points en centralisant tout au même endroit.

### 2.2 Problèmes concrets résolus par l'application

| Problème | Ce que l'application apporte |
|---|---|
| Contacts et entreprises gérés dans des fichiers séparés | Module Entreprises + Contacts liés entre eux |
| Impossible de suivre l'avancement d'un prospect | Pipeline visuel avec 4 étapes |
| Tâches et relances oubliées | Module Tâches avec dates limites |
| Aucune trace des emails envoyés | Logs d'envoi + suivi Brevo (ouverture, clic, rebond) |
| Pas de vue globale sur les performances | Dashboard avec chiffres clés et graphiques |

### 2.3 Cible de l'application

L'application s'adresse aux **petites équipes commerciales** (PME, startups) qui cherchent un outil simple et abordable, sans avoir à payer pour un CRM comme Salesforce ou HubSpot. Elle convient particulièrement aux structures qui font de la prospection B2B par email.

### 2.4 Besoins fonctionnels

#### Besoins principaux

| Référence | Besoin | Priorité |
|---|---|---|
| BF-01 | Créer un compte et se connecter | Haute |
| BF-02 | Ajouter, modifier et supprimer des entreprises | Haute |
| BF-03 | Ajouter, modifier et supprimer des contacts | Haute |
| BF-04 | Créer et suivre des prospects avec un statut | Haute |
| BF-05 | Visualiser le pipeline commercial en mode Kanban | Haute |
| BF-06 | Créer et gérer des tâches avec une date d'échéance | Haute |
| BF-07 | Envoyer des emails à un ou plusieurs prospects | Haute |
| BF-08 | Consulter les statistiques d'ouverture et de clic | Moyenne |
| BF-09 | Accéder à un dashboard avec les indicateurs clés | Moyenne |
| BF-10 | Chaque utilisateur ne voit que ses propres données | Haute |

#### Besoins non fonctionnels

| Référence | Besoin |
|---|---|
| BNF-01 | Accessible depuis un navigateur, sans installation |
| BNF-02 | Données isolées par utilisateur (multi-tenant) |
| BNF-03 | Interface responsive (desktop et tablette) |
| BNF-04 | Thème clair et thème sombre disponibles |
| BNF-05 | Pages qui se chargent rapidement |
| BNF-06 | Mots de passe et sessions sécurisés |

---

## 3. Modélisation

### 3.1 Diagramme de cas d'utilisation (UML Use Case)

Le seul acteur du système est l'**Utilisateur authentifié**. Voici les cas d'utilisation principaux :

```
+------------------------------------------------------------------+
|                       Système CRM SaaS                           |
|                                                                  |
|   +-------------------+     +-----------------------------+     |
|   |  S'authentifier   |     |  Gérer les entreprises      |     |
|   | - S'inscrire      |     |  - Créer une entreprise     |     |
|   | - Se connecter    |     |  - Consulter une entreprise |     |
|   | - Se déconnecter  |     |  - Supprimer une entreprise |     |
|   +-------------------+     +-----------------------------+     |
|                                                                  |
|   +-------------------+     +-----------------------------+     |
|   |  Gérer contacts   |     |  Gérer les prospects        |     |
|   | - Créer contact   |     |  - Créer un prospect        |     |
|   | - Modifier contact|     |  - Changer le statut        |     |
|   | - Supprimer       |     |  - Supprimer un prospect    |     |
|   +-------------------+     +-----------------------------+     |
|                                                                  |
|   +-------------------+     +-----------------------------+     |
|   |  Gérer les tâches |     |  Gérer les emails           |     |
|   | - Créer tâche     |     |  - Envoyer un email         |     |
|   | - Modifier tâche  |     |  - Lancer une campagne      |     |
|   | - Suivre statut   |     |  - Voir les statistiques    |     |
|   +-------------------+     +-----------------------------+     |
|                                                                  |
|   +-------------------+     +-----------------------------+     |
|   |  Pipeline Kanban  |     |  Dashboard                  |     |
|   | - Voir le pipeline|     |  - Voir les KPIs            |     |
|   |                   |     |  - Voir les graphiques      |     |
|   +-------------------+     +-----------------------------+     |
|                                                                  |
+------------------------------------------------------------------+
           ^
           |
    [Utilisateur authentifié]
```

**Remarques :**
- La connexion est obligatoire pour accéder à toutes les fonctionnalités (`<<include>>`).
- On peut créer un contact en même temps qu'une entreprise si elle n'existe pas encore (`<<extend>>`).
- L'envoi d'une campagne nécessite de sélectionner des prospects au préalable (`<<include>>`).

---

### 3.2 Diagramme de classes simplifié (UML)

```
+------------------+          +--------------------+
|    Utilisateur   |          |     Entreprise     |
+------------------+          +--------------------+
| - id: UUID       |1       * | - id: UUID         |
| - email: string  |----------| - name: string     |
| - full_name: str |          | - industry: string |
| - role: string   |          | - website: string  |
+------------------+          | - owner_id: UUID   |
        |1                    +--------------------+
        |                             |1
        |  *+------------------+      | *
        +-->|      Contact     |<-----+
            +------------------+
            | - id: UUID       |
            | - first_name: str|
            | - last_name: str |
            | - email: string  |
            | - phone: string  |
            | - company_id: UUID|
            | - owner_id: UUID |
            +------------------+
                    |
                    | 0..1
                    |
            +------------------+        +------------------+
            |     Prospect     |        |      Tâche       |
            +------------------+        +------------------+
            | - id: UUID       |        | - id: UUID       |
            | - title: string  |        | - title: string  |
            | - status: enum   |        | - description: str|
            | - email: string  |        | - status: enum   |
            | - estimated_value|        | - due_date: date |
            | - source: string |        | - assigned_to: UUID|
            | - contact_id: UUID|       | - owner_id: UUID |
            | - company_id: UUID|       +------------------+
            | - owner_id: UUID |
            +------------------+
                    |1
                    | *
            +------------------+
            |    EmailLog      |
            +------------------+
            | - id: UUID       |
            | - lead_id: UUID  |
            | - to_email: str  |
            | - status: string |
            | - event_type: str|
            | - campaign_name  |
            | - opened_count   |
            | - clicked_count  |
            | - sent_at        |
            +------------------+

Énumérations :
  Prospect.status  : new | in_progress | converted | lost
  Tâche.status     : pending | in_progress | done
```

---

### 3.3 Modèle Conceptuel de Données (MCD  Merise)

```
[UTILISATEUR]----(possède)----[ENTREPRISE]
    | id                           | id
    | email                        | name
    | full_name                    | industry
    | role                         | website
    |
    +----------(crée)-----------+
                                |
                           [CONTACT]
                             | id
                             | first_name
                             | last_name
                             | email
                             | phone
                                |
               +----------------+----------------+
               |                                 |
          (concerne)                        (génère)
               |                                 |
          [TACHE]                          [PROSPECT]
            | id                              | id
            | title                           | title
            | description                     | email
            | status                          | status
            | due_date                        | estimated_value
            | assigned_to                     | source
                                                  |
                                            (déclenche)
                                                  |
                                           [EMAIL_LOG]
                                             | id
                                             | to_email
                                             | event_type
                                             | campaign_name
                                             | status
                                             | opened_count
                                             | clicked_count
                                             | sent_at
```

**Cardinalités :**

| Association | Cardinalité |
|---|---|
| UTILISATEUR  ENTREPRISE | 1,N : un utilisateur gère plusieurs entreprises |
| ENTREPRISE  CONTACT | 0,N : une entreprise peut avoir plusieurs contacts |
| CONTACT  PROSPECT | 0,1 : un contact peut être lié à un prospect |
| UTILISATEUR  TACHE | 1,N : un utilisateur crée plusieurs tâches |
| PROSPECT  EMAIL_LOG | 0,N : un prospect peut avoir plusieurs logs email |

**Règles de gestion :**
- Un utilisateur ne peut accéder qu'à ses propres données (`owner_id = auth.uid()`).
- Supprimer une entreprise supprime aussi tous ses contacts (cascade).
- Un prospect peut exister sans contact associé.
- Un email log est toujours rattaché à un prospect.

---

## 4. Architecture technique

### 4.1 Vue d'ensemble

L'application suit une organisation en couches : le navigateur communique avec le serveur Next.js, qui lui-même interroge Supabase (base de données) et Brevo (emails).

```
+-----------------------------------------------------------+
|                     NAVIGATEUR CLIENT                     |
|   Interface React (Next.js App Router)                    |
|   - Pages "use client" : dashboard, formulaires           |
|   - Composants UI : Sidebar, Cards, Tableaux              |
|   - Hook useDashboardData (chargement des données)        |
+----------------------------+------------------------------+
                             | HTTPS
+----------------------------v------------------------------+
|                   SERVEUR NEXT.JS (Vercel)                |
|                                                           |
|  +------------------------+  +------------------------+  |
|  |  Pages (App Router)    |  |     API Routes         |  |
|  |  /dashboard/*          |  |  /api/send-email       |  |
|  |  /login, /signup       |  |  /api/email-stats      |  |
|  +------------------------+  |  /api/webhooks/brevo   |  |
|                              +----------+-------------+  |
+----------------------------+------------|--------------+
                             |            |
          +------------------+            +------------------+
          |                                                  |
+---------v-----------+                  +------------------v--+
|      SUPABASE        |                  |       BREVO         |
|                      |                  |                     |
|  PostgreSQL          |   email_logs     | Envoi d'emails      |
|  - companies         |<---------------->| Webhooks entrants   |
|  - contacts          |                  | (ouverture, clic,   |
|  - leads             |                  |  rebond...)         |
|  - tasks             |                  +---------------------+
|  - email_logs        |
|  Auth + RLS          |
+----------------------+
```

### 4.2 Frontend  Next.js

On utilise **Next.js 16** avec l'App Router. L'application est divisée en deux parties :

**Les pages** (`/dashboard/*`) sont des composants React qui tournent dans le navigateur. Elles appellent directement Supabase pour afficher et modifier les données.

**Les routes API** (`/api/*`) tournent côté serveur. C'est là que sont faits les appels sensibles : envoi d'emails via Brevo, réception des webhooks, calcul des statistiques. Ces routes ont accès aux clés secrètes qui ne doivent jamais être exposées côté client.

Un **middleware** protège toutes les pages du dashboard : si l'utilisateur n'est pas connecté, il est redirigé vers `/login`.

### 4.3 Base de données  Supabase / PostgreSQL

**Supabase** est un service qui fournit une base de données PostgreSQL hébergée, avec en plus un système d'authentification intégré.

Ce qui est important dans ce projet, c'est la fonctionnalité **Row Level Security (RLS)**. Elle permet de définir des règles directement dans la base de données pour qu'un utilisateur ne puisse accéder qu'à ses propres lignes. Par exemple : `owner_id = auth.uid()`. Cela signifie que même si on faisait une erreur dans le code, les données des autres utilisateurs resteraient inaccessibles.

On utilise deux clients Supabase différents :
- Le **client navigateur** (clé `anon`) dans les composants React  soumis aux RLS.
- Le **client serveur** (clé `service_role`) dans les API Routes  accès complet pour les opérations internes.

### 4.4 Intégration email  Brevo

**Brevo** gère l'envoi des emails et le suivi de ce qui se passe après l'envoi.

Pour envoyer un email, la route `/api/send-email` appelle l'API Brevo. On ajoute un identifiant CRM dans chaque email (header `X-Mailin-custom`) pour pouvoir retrouver l'envoi dans notre base de données.

Pour le suivi, Brevo envoie des notifications (webhooks) à notre application chaque fois qu'un destinataire ouvre l'email ou clique sur un lien. La route `/api/webhooks/brevo` reçoit ces notifications et met à jour les compteurs dans la table `email_logs`.

### 4.5 Déploiement  Vercel

L'application est déployée sur **Vercel**. Chaque fois qu'on pousse du code sur GitHub, Vercel relance automatiquement le déploiement. Les clés API et variables d'environnement sont configurées directement dans l'interface Vercel.

### 4.6 Exemple de flux : envoi d'une campagne email

Pour illustrer comment les technologies communiquent, voici ce qui se passe quand un utilisateur envoie une campagne :

```
Utilisateur
    |
    | 1. Sélectionne des prospects et clique sur "Envoyer"
    v
Page React (navigateur)
    |
    | 2. Envoie une requête POST /api/send-email avec la liste des IDs
    v
API Route Next.js (serveur)
    |
    | 3. Récupère les prospects dans Supabase (email, nom...)
    | 4. Pour chaque prospect :
    |     - Crée un log dans email_logs (statut: pending)
    |     - Appelle l'API Brevo pour envoyer l'email
    v
Brevo
    |
    | 5. Envoie l'email au destinataire
    | 6. Plus tard : envoie un webhook quand l'email est ouvert
    v
API Route /api/webhooks/brevo
    |
    | 7. Met à jour email_logs (opened_count + 1, etc.)
    v
Dashboard (statistiques mises à jour)
```

---

## 5. Description des fonctionnalités

### 5.1 Authentification

La connexion est gérée par Supabase Auth. L'utilisateur peut créer un compte avec son email et un mot de passe, puis se connecter. Une session sécurisée est créée (token JWT dans un cookie). Quand l'utilisateur se déconnecte, la session est supprimée.

Les mots de passe sont stockés de façon chiffrée (bcrypt), jamais en clair.

---

### 5.2 Gestion des entreprises

Ce module permet d'enregistrer les entreprises clientes ou partenaires. On peut :
- Consulter la liste des entreprises avec leurs informations de base
- Créer une nouvelle entreprise (nom, secteur, site web)
- Accéder à la fiche d'une entreprise pour voir ses contacts
- Supprimer une entreprise (ses contacts sont supprimés automatiquement)

---

### 5.3 Gestion des contacts

Les contacts sont les personnes liées à une entreprise. On peut :
- Voir la liste des contacts avec leur nom, email, téléphone et entreprise
- Créer un contact et le rattacher à une entreprise existante
- Consulter la fiche d'un contact
- Supprimer un contact sans affecter son entreprise

---

### 5.4 Gestion des prospects (Leads)

Les prospects sont les opportunités commerciales à suivre. C'est le module central du CRM. On peut :
- Voir tous les prospects avec leur statut et leur valeur estimée
- Créer un prospect avec toutes ses informations (titre, email, source, valeur, lien vers un contact/entreprise)
- Modifier les informations ou changer le statut d'un prospect
- Supprimer un prospect

**Les 4 statuts d'un prospect :**
| Statut | Signification |
|---|---|
| `new`  Nouveau | On vient d'identifier ce prospect |
| `in_progress`  En cours | La négociation a commencé |
| `converted`  Converti | Le prospect est devenu client |
| `lost`  Perdu | L'opportunité n'a pas abouti |

---

### 5.5 Pipeline commercial

Le pipeline est une vue en mode **Kanban** (colonnes) des prospects. Chaque colonne correspond à un statut. On peut voir d'un coup d'œil combien de prospects sont à chaque étape et quelle est la valeur totale du pipeline.

C'est la même donnée que la liste des prospects, mais présentée de façon plus visuelle.

---

### 5.6 Gestion des tâches

Le module tâches permet de noter les actions à faire : appels à passer, documents à envoyer, réunions à préparer, etc.

- On peut créer une tâche avec un titre, une description et une date limite.
- On filtre les tâches par statut (en attente / en cours / terminées).
- Le dashboard affiche combien de tâches sont prévues aujourd'hui, combien sont en retard.

Une tâche est **en retard** si sa date limite est dépassée et qu'elle n'est pas encore marquée comme terminée.

---

### 5.7 Emails et campagnes

Depuis le module Messages, on peut envoyer des emails aux prospects :

**Email individuel** : on sélectionne un seul prospect et on lui envoie un email.

**Campagne** : on sélectionne plusieurs prospects, on donne un nom à la campagne, et les emails partent en lot.

Chaque envoi est enregistré dans la base de données. On sait si l'email a bien été envoyé, s'il a été ouvert, si un lien a été cliqué. Ces informations arrivent via les webhooks Brevo.

---

### 5.8 Dashboard analytique

Le dashboard est la première page que l'utilisateur voit après la connexion. Il regroupe les informations les plus importantes :

- **Chiffres clés** : nombre de prospects, valeur totale du pipeline, taux de conversion, nombre de contacts, nombre d'entreprises
- **Tâches** : ce qu'il y a à faire aujourd'hui, les tâches en retard, les prochaines échéances
- **Graphiques** : répartition des prospects par statut, évolution mensuelle, statistiques emails (taux d'ouverture, de clic)
- **Listes rapides** : contacts récents, entreprises récentes

---

## 6. Conclusion

### 6.1 Bilan

Ce projet nous a permis de développer une application CRM fonctionnelle et déployée en production. On a couvert les besoins essentiels d'une petite équipe commerciale : suivi des clients, gestion des opportunités, planification des tâches et communication par email.

Sur le plan technique, ce qui était le plus intéressant à mettre en place :
- Les politiques RLS de Supabase, qui isolent les données de chaque utilisateur directement au niveau de la base de données.
- L'intégration de Brevo avec les webhooks, qui permettent de savoir ce que les destinataires font réellement avec les emails reçus.
- L'architecture Next.js avec des pages client et des routes API côté serveur pour gérer les opérations sensibles.

### 6.2 Améliorations possibles

Si on devait continuer ce projet, voici ce qu'on pourrait ajouter :

- **Travail en équipe** : permettre à plusieurs commerciaux de partager les mêmes données, avec des niveaux d'accès différents.
- **Import de contacts** : pouvoir importer un fichier CSV pour ajouter des contacts en masse.
- **Notifications** : recevoir une alerte quand une tâche arrive à échéance.
- **Agenda** : vue calendrier pour mieux visualiser les tâches planifiées.
- **Templates emails** : préparer des modèles d'emails réutilisables pour les campagnes.
- **Scoring des prospects** : attribuer automatiquement un score à un prospect en fonction de ses réactions aux emails.

---

*Rapport rédigé dans le cadre d'un projet universitaire de développement web full-stack.*
