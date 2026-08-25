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
- menu opérationnel « Saisie et insertion » avec recalcul en temps réel et imputations multi-lignes ;
- menu « Paramétrage » pour organiser les règles opérationnelles du dossier ;
- menu « Outils » avec capture d’écran, calculatrice et aides comptables ;
- règlements clients/fournisseurs, affectation aux factures et lettrage ;
- banque, caisse et rapprochement des écritures ;
- travaux périodiques pour générer les écritures système ;
- gestion des 12 périodes mensuelles de l’exercice ;
- clôture périodique avec checklist et verrouillage contrôlé ;
- arrêté définitif de l’exercice avec contrôles annuels ;
- reports à nouveau contrôlés vers l’exercice suivant ;
- livre journal intégré, catégorisé et synchronisé automatiquement ;
- section Éditions pour exploiter, imprimer et exporter les informations ;
- regroupement des amortissements, centralisations, abonnements et résultats de période ;
- propositions d’imputations comptables avant validation ;
- calcul et génération contrôlés des amortissements ;
- import et export des balances et livres comptables en TXT et formats tableur Excel ;
- assistant d’exportation guidé avec périmètre, informations de sortie, vérification et historique ;
- comptabilité générale, trésorerie et facturation comme base du futur MVP ;
- devise de travail : FCFA/XOF ;
- paramètres comptables et fiscaux béninois configurables et validables par un professionnel.

## Maquettes UX

Le prototype interactif est disponible dans [`prototype/index.html`](prototype/index.html). Les parcours et conventions de la maquette sont décrits dans [`docs/02-maquettes-ux.md`](docs/02-maquettes-ux.md).

Le parcours d’accès initial — authentification puis sélection d’un dossier — est décrit dans [`docs/04-authentification-et-dossiers.md`](docs/04-authentification-et-dossiers.md).

L’architecture multi-modules et l’association indépendante des modules aux dossiers sont décrites dans [`docs/05-modules-et-dossiers.md`](docs/05-modules-et-dossiers.md).

La structure des menus **Fichier** et **Configuration** du module CSR est décrite dans [`docs/06-menus-pilotage.md`](docs/06-menus-pilotage.md). Les fonctions de configuration sont détaillées dans [`docs/07-configuration-csr.md`](docs/07-configuration-csr.md).

Le menu opérationnel **Saisie et insertion** est décrit dans [`docs/08-saisie-insertion-csr.md`](docs/08-saisie-insertion-csr.md). Le menu **Paramétrage** est décrit dans [`docs/11-parametrage-operationnel.md`](docs/11-parametrage-operationnel.md). Le menu **Outils** est décrit dans [`docs/12-outils-csr.md`](docs/12-outils-csr.md). Les traitements système sont décrits dans [`docs/15-travaux-periodiques-csr.md`](docs/15-travaux-periodiques-csr.md). Le résultat fiscal et l’impôt sont décrits dans [`docs/20-resultat-fiscal-impot-csr.md`](docs/20-resultat-fiscal-impot-csr.md). La gestion des exercices et périodes est décrite dans [`docs/23-exercices-periodes-csr.md`](docs/23-exercices-periodes-csr.md). La clôture périodique est décrite dans [`docs/21-cloture-periodique-csr.md`](docs/21-cloture-periodique-csr.md). L’arrêté définitif et les reports à nouveau sont décrits dans [`docs/22-arrete-definitif-csr.md`](docs/22-arrete-definitif-csr.md) et [`docs/24-reports-a-nouveau-csr.md`](docs/24-reports-a-nouveau-csr.md).

L’écran fonctionnel **Comptes généraux** est décrit dans [`docs/13-comptes-generaux.md`](docs/13-comptes-generaux.md). Les états financiers sont décrits dans [`docs/25-etats-financiers-csr.md`](docs/25-etats-financiers-csr.md). L’écran **Configuration → Journaux** est décrit dans [`docs/14-journaux-csr.md`](docs/14-journaux-csr.md). L’écran **Configuration → Tiers** est décrit dans [`docs/16-tiers-csr.md`](docs/16-tiers-csr.md). Les factures clients et fournisseurs sont décrites dans [`docs/17-factures-clients-fournisseurs-csr.md`](docs/17-factures-clients-fournisseurs-csr.md). Les règlements et le lettrage sont décrits dans [`docs/18-reglements-lettrage-csr.md`](docs/18-reglements-lettrage-csr.md). La banque, la caisse et le rapprochement sont décrits dans [`docs/19-banque-rapprochement-csr.md`](docs/19-banque-rapprochement-csr.md). Le fonctionnement du livre journal intégré est décrit dans [`docs/09-livre-journal-integre.md`](docs/09-livre-journal-integre.md).

La section **Éditions** du module CSR est décrite dans [`docs/10-editions-csr.md`](docs/10-editions-csr.md). L’export fiscal FEC selon l’arrêté béninois est décrit dans [`docs/26-fec-benin.md`](docs/26-fec-benin.md).

Pour l’ouvrir localement :

```bash
npm run preview
```

Puis ouvrir `http://localhost:4173` dans un navigateur.

Le premier noyau métier est décrit dans [`docs/03-socle-technique.md`](docs/03-socle-technique.md). Les tests se lancent avec :

```bash
npm test
```
