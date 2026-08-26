# Inscription EMRYS et API de développement

**Statut :** squelette d’API local, non destiné à la production

## Endpoints disponibles

Avec `npm run preview-site`, le serveur de développement sert la one page et expose :

- `GET /api/health` — état de l’API et version du schéma ;
- `POST /api/signup` — crée un utilisateur, un espace, une première société et un essai de 30 jours ;
- `POST /api/login` — vérifie un compte créé par l’API et crée une session de développement ;
- `GET /api/me` — vérifie la session courante et renvoie l’utilisateur et son essai ;
- `GET /api/trial` — renvoie l’état et les limites de l’essai courant ;
- `POST /api/logout` — révoque la session de développement ;
- `GET /api/auth/google/start` — démarre Google OAuth lorsqu’il est configuré ;
- `POST /api/payment/checkout` — valide la demande de paiement et attend le connecteur marchand.

## Données d’inscription

Le formulaire accepte le nom complet, un nom d’entreprise facultatif, l’adresse e-mail, le mot de passe et l’offre choisie. Une première société est créée avec le libellé fourni ou un libellé provisoire à compléter dans EMRYS.

## Données d’essai

Le serveur crée une ligne `trials` avec les limites de découverte :

- 1 société ;
- 1 utilisateur ;
- 100 écritures CSR ;
- 20 factures ;
- 20 tiers ;
- 10 employés GP ;
- 20 articles GCSF ;
- 50 documents GC ;
- 30 jours.

Les mots de passe sont dérivés avec PBKDF2 côté serveur et ne sont jamais conservés en clair.

## Google

Google n’est activé que lorsque `GOOGLE_CLIENT_ID` et `GOOGLE_REDIRECT_URI` sont configurés côté serveur. Aucun secret Google ne doit être placé dans la page publique.

Le callback, la vérification du code, la liaison avec une adresse existante, le consentement et la gestion des sessions devront être finalisés avant publication.

## Paiement

Les fournisseurs affichés par le site sont préparés, mais le serveur refuse volontairement de simuler un paiement réel. FedaPay devra être appelé uniquement côté serveur avec ses secrets, puis le retour de paiement devra être vérifié avant de créer une licence.

## Démarrage

```bash
npm run preview-site
```

Le serveur écoute sur le port `4174` et la base SQLite de développement est placée dans `/tmp/emrys-dev.sqlite` par défaut. Pour choisir un emplacement :

```bash
EMRYS_DB_PATH=/chemin/vers/emrys.sqlite npm run preview-site
```

Cette API n’est pas encore une infrastructure de production : il manque notamment la gestion durable des sessions, la vérification d’e-mail, les limites côté service métier, la protection CSRF, la limitation de débit, les journaux de sécurité, le paiement réel et l’authentification Google complète.
