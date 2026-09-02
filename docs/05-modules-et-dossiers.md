# Architecture des modules et des dossiers

**Version :** 0.1  
**Statut :** cadrage fonctionnel

## 1. Vision

FEC est un logiciel composé de modules métier séparés, rattachés à un même dossier d’entreprise :

- **CSR** — Comptabilité SYSCOHADA Révisé ;
- **GP** — Gestion de Paie ;
- **GCSF** — Gestion Commerciale, Stock et Facturations ;
- **GC** — Gestion de Courrier.

Un dossier correspond à une entreprise et à son contexte de travail. L’association d’un dossier à un module est indépendante : un dossier peut utiliser CSR uniquement, GP uniquement, ou plusieurs modules en parallèle.

## 2. Règle d’association

La création d’un dossier ne force pas l’activation d’un module. L’utilisateur peut :

1. créer le dossier avec les informations de l’entreprise ;
2. retrouver le dossier dans « Dossiers en cours » ;
3. sélectionner une association existante ou la ligne « Aucun module activé » ;
4. ouvrir la page de choix des modules ;
5. activer CSR, GP, GCSF et/ou GC séparément.

L’activation d’un module crée un enregistrement `DossierModule`. Cet enregistrement porte au minimum :

- le dossier et la société concernés ;
- le code du module ;
- l’état : non activé, activé, suspendu ou archivé ;
- les droits d’accès ;
- les paramètres propres au module ;
- la période métier applicable ;
- l’utilisateur et la date d’activation.

## 3. Affichage des dossiers

La page « Dossiers en cours » affiche une ligne par association dossier-module.

Exemple pour une même entreprise :

| Dossier | Module | Société | Période |
|---|---|---|---|
| ACACIA-25 | CSR | Acacia Conseil | 01/01/2025 - 31/12/2025 |
| ACACIA-25 | GCSF | Acacia Conseil | 01/01/2025 - 31/12/2025 |

Un dossier sans module possède une ligne temporaire « Aucun module activé » afin de rester accessible et configurable.

Cette présentation permet de distinguer clairement :

- l’entreprise, qui est le dossier ;
- le module utilisé ;
- l’état d’ouverture du module ;
- les droits de l’utilisateur sur ce module.

## 4. Accès après ouverture

Cliquer sur une ligne de dossier ouvre une page intermédiaire de sélection des modules. Cette page affiche les quatre cartes de modules :

- les modules activés disposent d’un bouton **Ouvrir** ;
- les modules non activés disposent d’un bouton **Activer** ;
- aucun espace métier n’est accessible avant activation ;
- l’utilisateur peut revenir à la liste des dossiers sans ouvrir de module.

Dans la maquette actuelle, CSR ouvre l’espace comptable déjà prototypé. GP, GCSF et GC affichent pour le moment une page de module rattaché, en attendant leur conception métier séparée.

## 5. Partage des données

Le partage est sélectif, jamais implicite.

### Socle commun potentiel

- identité de l’entreprise ;
- adresse et IFU ;
- utilisateurs ;
- rôles et permissions par utilisateur, société et module ;
- pièces jointes autorisées ;
- paramètres d’espace de travail.

### Données séparées par défaut

- écritures et journaux CSR ;
- salariés, variables et bulletins GP ;
- articles, stocks, factures et règlements GCSF ;
- courriers, destinataires et historiques GC.

Toute donnée partagée entre deux modules devra être déclarée dans une politique `DataSharingPolicy`, limitée au besoin prévu et inscrite dans la piste d’audit.

## 6. Périodes

La période n’est pas nécessairement identique pour tous les modules :

- CSR : exercice et périodes comptables ;
- GP : mois ou période de paie ;
- GCSF : période commerciale et dates de stock ;
- GC : dates de réception, d’envoi et d’échéance.

Le dossier conserve les dates générales de l’entreprise, tandis que chaque module conserve ses propres règles de période.

## 7. Conséquences techniques

Le socle doit séparer :

- `Company` : l’entité juridique ;
- `Dossier` : le contexte sélectionnable dans l’espace ;
- `ModuleDefinition` : le catalogue des quatre modules ;
- `DossierModule` : l’association active ou inactive ;
- `ModuleSettings` : les paramètres propres au module ;
- `ModulePermission` : les autorisations par utilisateur et module ;
- `DataSharingPolicy` : les échanges de données autorisés.

Toutes les opérations métier devront vérifier simultanément :

```text
workspace_id → user_id → company_id → dossier_id → module_id → permission
```

Ainsi, une écriture CSR ne pourra pas être créée depuis un module non activé, un dossier différent ou une société différente.

## 8. Évolution de la maquette

Le parcours est disponible dans [`../prototype/index.html`](../prototype/index.html) :

1. authentification ;
2. liste des dossiers avec une ligne par module ;
3. ouverture d’un dossier ;
4. page de choix des modules ;
5. activation ou ouverture d’un module ;
6. accès à l’espace CSR ou à une page d’attente pour les modules à concevoir.
