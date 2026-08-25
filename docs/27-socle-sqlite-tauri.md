# Socle SQLite et Tauri

**Version :** 0.1
**Statut :** adaptateur SQLite de préparation pour le futur shell desktop

## Objectif

Le prototype navigateur utilise encore `localStorage`. Le modèle de production doit conserver les mêmes invariants dans une base SQLite locale gérée par le shell Tauri : isolation des sociétés, permissions par module, périodes, écritures immuables, instantanés annuels, archives FEC et piste d’audit.

## Schéma

Le schéma est disponible dans [`storage/schema.sql`](../storage/schema.sql).

Il prévoit notamment :

- `workspace` ;
- `users` ;
- `companies` ;
- `memberships` ;
- `dossiers` ;
- `fiscal_years` ;
- `periods` ;
- `journal_entries` ;
- `journal_entry_lines` ;
- `financial_snapshots` ;
- `fec_archives` ;
- `audit_events`.

Les relations utilisateur-société-module et les clés étrangères sont garanties par SQLite. Les index couvrent les recherches par société, exercice, période et date d’écriture.

Le schéma comprend aussi les tables de fiabilité :

- `schema_migrations` pour versionner le schéma ;
- `sync_outbox` pour les changements locaux non encore envoyés ;
- `sync_inbox` pour dédupliquer les changements reçus ;
- `sync_cursors` pour reprendre une synchronisation interrompue ;
- `sync_conflicts` pour empêcher la résolution silencieuse d’un conflit ;
- `data_snapshots` et `backup_manifests` pour vérifier les copies.

## Adaptateur de développement

[`storage/sqlite-store.mjs`](../storage/sqlite-store.mjs) utilise `node:sqlite` pour tester le contrat de persistance sans dépendre de Tauri. Il permet de :

- créer ou mettre à jour les utilisateurs, sociétés et adhésions ;
- enregistrer les dossiers, exercices et périodes ;
- insérer une écriture et toutes ses lignes dans une transaction ;
- enregistrer un instantané et une archive FEC ;
- conserver un événement d’audit ;
- relire les utilisateurs, sociétés, adhésions, exercices et instantanés.

L’insertion d’une écriture et de ses lignes est transactionnelle : une erreur sur une ligne annule l’ensemble de l’opération.

## Passage prévu vers Tauri

Le module SQLite de développement sera remplacé ou encapsulé par des commandes Tauri :

```text
interface utilisateur
→ commande Tauri
→ service métier CSR
→ transaction SQLite
→ événement d’audit
```

L’interface ne devra pas ouvrir directement le fichier SQLite. Le shell sera responsable des chemins, des sauvegardes, du verrouillage et de la protection du fichier de base.

## Points de sécurité à finaliser

- chiffrement ou protection du fichier de base selon la cible desktop ;
- gestion réelle des sessions et des mots de passe côté service d’identité ;
- migrations versionnées et sauvegardes atomiques ;
- contrôle d’autorisation dans les commandes Tauri, et pas uniquement dans l’interface ;
- journalisation des restaurations et des opérations administrateur ;
- verrouillage définitif des snapshots et écritures validées ;
- tests sur Windows, Linux et macOS.

## Moteur de synchronisation de développement

[`storage/sync-engine.mjs`](../storage/sync-engine.mjs) fournit un service distant en mémoire pour tester le protocole sans dépendre d’un hébergeur. Il simule :

- l’envoi des événements de l’outbox ;
- les acquittements idempotents ;
- la réception et l’application des événements dans l’inbox ;
- la reprise par curseur ;
- le passage hors ligne puis la reprise des événements `FAILED` ;
- la détection et la conservation des conflits.

Le moteur ne résout jamais silencieusement une divergence entre deux versions d’une même entité. Cette règle sera conservée lors du branchement à l’API distante.

Le socle SQLite actuel et ce moteur de synchronisation sont des adaptateurs de développement. Ils ne doivent pas encore être présentés comme une solution de production ou comme une authentification serveur complète.
