# Architecture de déploiement EMRYS

**Statut :** socle d’expérimentation en ligne, non encore destiné à la production

Cette étape concrétise le choix validé pour EMRYS :

```text
Vercel
└── site public + PWA statique + application web

API Docker indépendante
└── authentification, essais, sessions, paiements à venir, synchronisation à venir

Neon PostgreSQL
└── base centrale en ligne, durable et portable

SQLite local
└── application Windows/Tauri, travail hors ligne, outbox/inbox
```

## 1. Responsabilité de chaque brique

### Vercel

Vercel ne contient pas la base métier. Il sert les fichiers construits par `npm run build:site` :

- page publique EMRYS ;
- manifest et service worker PWA ;
- application web sous `/app/` ;
- ressources statiques et référencement.

Le fichier `vercel.json` réécrit `/api/*` vers `https://api.emrys-saas.com/api/*`. Le domaine API devra être remplacé si un autre sous-domaine est retenu.

### API Docker

`server/api-server.mjs` est un premier serveur HTTP indépendant du site. Il utilise le même contrat d’authentification que l’API de développement, mais ses données sont stockées dans PostgreSQL :

- `GET /api/health` : santé de l’API et de la base ;
- `GET /api/ready` : migrations prêtes ;
- `POST /api/sync/push` : dépôt transactionnel d’un lot d’événements locaux ;
- `GET /api/sync/pull?cursor=...` : reprise des événements visibles depuis un curseur ;
- `GET /api/sync/status` : état des conflits et du dernier curseur connu ;
- `POST /api/signup` : utilisateur, espace, société CSR, exercice, 12 périodes et essai ;
- `GET /api/auth/verify` : vérification d’e-mail ;
- `POST /api/login`, `GET /api/me`, `GET /api/trial`, `POST /api/logout` ;
- réinitialisation de mot de passe ;
- expose un point d’entrée Google OAuth qui reste explicitement en attente tant que le callback, la vérification du jeton et la liaison d’identité ne sont pas finalisés ;
- enregistrement contrôlé d’une commande de paiement.

Les sessions sont conservées dans PostgreSQL sous forme d’empreinte de jeton. Elles ne dépendent donc pas de la mémoire d’un conteneur et restent compatibles avec plusieurs instances API.

### Neon PostgreSQL

Le schéma central est [`storage/schema.postgres.sql`](../storage/schema.postgres.sql). Il conserve des identifiants textuels et des payloads JSON afin que les événements créés hors ligne par SQLite puissent être rejoués sans changer d’identité.

Le store [`storage/postgres-store.mjs`](../storage/postgres-store.mjs) :

- utilise un pool PostgreSQL ;
- applique le schéma dans une transaction ;
- enregistre la version de socle `6` ;
- expose des transactions pour les inscriptions et les opérations sensibles ;
- refuse de démarrer sans `DATABASE_URL` ;
- accepte SSL pour Neon ;
- ne place aucun secret dans le navigateur.

Le schéma est idempotent pour une première installation. Les futures évolutions devront être ajoutées comme migrations versionnées et testées sur une copie avant toute migration de production.

### SQLite local

SQLite reste le stockage de proximité de l’application Windows/Tauri. Il n’est pas remplacé par PostgreSQL :

- SQLite conserve les changements locaux ;
- l’outbox conserve les événements à envoyer ;
- l’API centrale reçoit les événements ;
- l’inbox et les curseurs rendent les reprises idempotentes ;
- les conflits restent visibles et ne sont jamais résolus silencieusement ;
- une sauvegarde vérifiée doit précéder une migration ou une mise à jour importante.

Le navigateur actuel reste un prototype utilisant son adaptateur local. Le branchement Tauri/SQLite réel et l’API de synchronisation ne sont pas encore terminés.

## 2. Lancer l’expérimentation localement

Prérequis : Docker et Docker Compose.

```bash
cp .env.example .env

docker compose up --build
```

L’API est alors accessible sur :

```text
http://localhost:8080/api/health
http://localhost:8080/api/ready
```

La base PostgreSQL est conservée dans le volume Docker `emrys-postgres-data`. Pour arrêter les conteneurs sans effacer les données :

```bash
docker compose down
```

Ne pas utiliser `docker compose down -v` sauf pour supprimer volontairement la base d’expérimentation.

Pour lancer l’API hors Docker, Node et la dépendance `pg` doivent être installés :

```bash
npm install
DATABASE_URL='postgresql://emrys:emrys_dev_password@localhost:5432/emrys' \
DATABASE_SSL=false \
NODE_ENV=development \
DEV_EXPOSE_TOKENS=true \
npm run preview-api
```

L’API de démonstration avec SQLite reste disponible séparément :

```bash
npm run preview-site
```

## 3. Préparer Neon

Pour l’expérimentation en ligne :

1. créer un projet Neon distinct de la future production ;
2. utiliser sa branche Neon `main` uniquement pour le développement ;
3. copier la chaîne PostgreSQL Neon dans une copie locale de `.env.example` nommée `.env` ;
4. remplacer `DATABASE_URL` par la chaîne Neon et mettre `DATABASE_SSL=true` ;
5. démarrer l’API Docker avec `docker compose up --build` ;
6. contrôler `/api/health` et `/api/ready` ;
7. tester une inscription avec une adresse de test ;
8. vérifier les lignes créées dans `users`, `workspace`, `companies`, `memberships`, `dossiers`, `fiscal_years`, `periods` et `trials`.

Le fichier `.env` est ignoré par Git. La chaîne `DATABASE_URL` ne doit être ni committée ni envoyée dans une conversation.

Les secrets Neon, Google, e-mail et paiement ne doivent jamais être committés, ni placés dans le code du site public.

## 4. Contrat de synchronisation

Le moteur local utilise [`storage/http-sync-remote.mjs`](../storage/http-sync-remote.mjs) comme adaptateur HTTP du contrat défini dans [`storage/sync-engine.mjs`](../storage/sync-engine.mjs).

### Push

`POST /api/sync/push` reçoit au maximum 100 événements et un `deviceId`. Chaque événement contient notamment :

```json
{
  "id": "sync-…",
  "companyId": "company-…",
  "moduleId": "CSR",
  "entityType": "JOURNAL_ENTRY",
  "entityId": "entry-…",
  "operation": "UPSERT",
  "payload": {},
  "payloadHash": "sha256…",
  "baseHash": "sha256…"
}
```

L’API :

1. vérifie la session et l’appartenance à la société ;
2. vérifie l’empreinte du contenu reçu ;
3. refuse qu’un appareil déjà enregistré soit repris par un autre compte ;
4. traite chaque événement dans sa propre transaction ;
5. inscrit l’événement dans un journal distant append-only ;
6. conserve la dernière version par entité ;
7. renvoie un acquittement, un conflit ou une erreur explicite.

Un événement portant un identifiant déjà connu et un contenu identique est acquitté sans être rejoué. Une version distante différente exige un `baseHash` ou un `baseCursor` correspondant à la version courante. Sinon le conflit est conservé dans `sync_conflicts` et aucune version n’écrase l’autre.

Les écritures `VALIDATED` ou `CLOSED` sont protégées contre le remplacement par synchronisation. Les suppressions synchronisées restent désactivées à ce stade afin de respecter le principe « aucune perte silencieuse ».

### Pull

`GET /api/sync/pull?cursor=42&limit=100` renvoie les événements accessibles à l’utilisateur, dans l’ordre du curseur PostgreSQL. Le curseur est monotone et peut être repris après une coupure réseau. La réponse ne contient jamais les événements d’une société à laquelle l’utilisateur n’a pas accès.

Le journal distant et les versions courantes sont portés par `sync_events` et `sync_entities`. Les tables `sync_inbox`, `sync_outbox` et `sync_conflicts` restent nécessaires côté SQLite pour la reprise et la présentation des erreurs dans l’application.

## 5. Déployer l’API

L’image est construite à la racine du dépôt :

```bash
docker build -t emrys-api .
docker run --rm \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e HOST=0.0.0.0 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e DATABASE_SSL=true \
  -e EMRYS_PUBLIC_URL=https://emrys-saas.com \
  -e CORS_ORIGINS=https://emrys-saas.com \
  -p 8080:8080 \
  emrys-api
```

En hébergement réel, le conteneur doit être placé derrière HTTPS, avec :

- un nom DNS, par exemple `api.emrys-saas.com` ;
- des sauvegardes PostgreSQL testées ;
- des logs sans mots de passe ni jetons ;
- une rotation des secrets ;
- une limite de débit ;
- une politique CORS limitée aux domaines EMRYS ;
- une supervision de `/api/health` ;
- au moins une instance de secours avant d’ouvrir l’inscription au public.

Le serveur Docker actuel est le socle d’expérimentation. Il ne prétend pas encore fournir l’ensemble des règles métier CSR, GP, GCSF et GC ni le connecteur de synchronisation complet.

## 6. Déployer le site sur Vercel

Le build public rassemble :

```text
dist/
├── index.html       # site public
├── app/             # application web
├── styles.css
├── app.js
├── manifest.webmanifest
└── sw.js
```

Le build se teste localement avec :

```bash
npm run build:site
python3 -m http.server 4173 --bind 0.0.0.0 --directory dist
```

Dans Vercel :

1. importer le dépôt GitHub ;
2. conserver la racine du dépôt comme répertoire du projet ;
3. utiliser le build command défini dans `vercel.json` ;
4. vérifier que le répertoire de sortie est `dist` ;
5. rattacher `emrys-saas.com` ;
6. configurer le DNS ;
7. vérifier que `/api/health` passe bien par le proxy vers l’API ;
8. tester l’inscription et la vérification d’e-mail sur le domaine HTTPS.

Tant que `api.emrys-saas.com` n’est pas réellement déployé, le site Vercel peut s’afficher mais son inscription en ligne ne doit pas être annoncée comme active.

## 7. Données et changement d’hébergeur

Neon n’est pas une dépendance propriétaire du modèle métier. Le contrat de stockage repose sur PostgreSQL standard :

- export `pg_dump` ;
- restauration `pg_restore` ou `psql` ;
- stockage objet S3-compatible pour les pièces et archives ;
- SQLite local exportable et sauvegardé séparément.

Avant un changement d’hébergeur :

1. arrêter les écritures ou passer en maintenance ;
2. effectuer une sauvegarde PostgreSQL ;
3. calculer et conserver son empreinte ;
4. restaurer sur le nouvel hébergeur ;
5. contrôler le nombre de lignes et les empreintes utiles ;
6. vérifier `/api/health` et les comptes de test ;
7. basculer le DNS ;
8. conserver l’ancien service en lecture seule pendant la période de vérification.

Aucune mise à jour, synchronisation ou migration ne devra supprimer automatiquement les données d’un espace EMRYS.

## 8. Ce qui reste à construire avant la production

- migration contrôlée des données SQLite vers PostgreSQL ;
- intégration de l’adaptateur HTTP dans Tauri et application des événements métier côté client ;
- application Tauri et sauvegarde locale avant mise à jour ;
- Google OAuth avec callback, vérification du jeton et liaison d’identité ;
- fournisseur réel d’e-mails ;
- limitation de débit et protection CSRF adaptée au mode de déploiement ;
- connecteur FedaPay et vérification des webhooks ;
- licences, lecture seule après essai et droits métier côté API ;
- stockage objet des pièces, FEC et sauvegardes ;
- tests de restauration, panne réseau, migration interrompue et concurrence ;
- revue comptable et fiscale professionnelle au Bénin avant toute promesse réglementaire.
