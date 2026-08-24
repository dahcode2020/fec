# FEC

Prototype d’un logiciel de gestion modulaire destiné en priorité aux TPE béninoises.

Le produit est conçu autour de quatre modules séparés : **CSR** (Comptabilité SYSCOHADA Révisé), **GP** (Gestion de Paie), **GCSF** (Gestion Commerciale, Stocks et Facturation) et **GC** (Gestion de Courrier). Il ne s’agit pas d’une copie technique ou visuelle de Sage, mais d’une expérience plus simple, locale et adaptée aux petites entreprises.

## Première étape

Le périmètre initial est décrit dans [`docs/01-cahier-des-charges.md`](docs/01-cahier-des-charges.md) :

- application de bureau, utilisable hors ligne ;
- TPE comme cible prioritaire ;
- prototype UX avant l’implémentation métier ;
- gestion de plusieurs sociétés dans un même espace de travail, avec isolation des données ;
- association indépendante de chaque dossier aux modules CSR, GP, GCSF et GC ;
- accueil de sélection des modules après ouverture d’un dossier ;
- menu opérationnel « Saisie et insertion » avec recalcul en temps réel ;
- menu « Paramétrage » pour organiser les règles opérationnelles du dossier ;
- livre journal intégré, catégorisé et synchronisé automatiquement ;
- section Éditions pour exploiter, imprimer et exporter les informations ;
- regroupement des amortissements, centralisations, abonnements et résultats de période ;
- propositions d’imputations comptables avant validation ;
- calcul et génération contrôlés des amortissements ;
- import et export des balances et livres comptables en TXT et formats tableur Excel ;
- comptabilité générale, trésorerie et facturation comme base du futur MVP ;
- devise de travail : FCFA/XOF ;
- paramètres comptables et fiscaux béninois configurables et validables par un professionnel.

## Maquettes UX

Le prototype interactif est disponible dans [`prototype/index.html`](prototype/index.html). Les parcours et conventions de la maquette sont décrits dans [`docs/02-maquettes-ux.md`](docs/02-maquettes-ux.md).

Le parcours d’accès initial — authentification puis sélection d’un dossier — est décrit dans [`docs/04-authentification-et-dossiers.md`](docs/04-authentification-et-dossiers.md).

L’architecture multi-modules et l’association indépendante des modules aux dossiers sont décrites dans [`docs/05-modules-et-dossiers.md`](docs/05-modules-et-dossiers.md).

La structure des menus **Fichier** et **Configuration** du module CSR est décrite dans [`docs/06-menus-pilotage.md`](docs/06-menus-pilotage.md). Les fonctions de configuration sont détaillées dans [`docs/07-configuration-csr.md`](docs/07-configuration-csr.md).

Le menu opérationnel **Saisie et insertion** est décrit dans [`docs/08-saisie-insertion-csr.md`](docs/08-saisie-insertion-csr.md). Le menu **Paramétrage** est décrit dans [`docs/11-parametrage-operationnel.md`](docs/11-parametrage-operationnel.md). Le fonctionnement du livre journal intégré est décrit dans [`docs/09-livre-journal-integre.md`](docs/09-livre-journal-integre.md).

La section **Éditions** du module CSR est décrite dans [`docs/10-editions-csr.md`](docs/10-editions-csr.md).

Pour l’ouvrir localement :

```bash
npm run preview
```

Puis ouvrir `http://localhost:4173` dans un navigateur.

Le premier noyau métier est décrit dans [`docs/03-socle-technique.md`](docs/03-socle-technique.md). Les tests se lancent avec :

```bash
npm test
```
