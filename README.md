# FEC

Prototype d’une application de gestion comptable destinée en priorité aux TPE béninoises.

Le produit est conçu autour du **SYSCOHADA révisé** — et non comme une copie technique ou visuelle de Sage — avec une expérience plus simple, locale et adaptée aux petites entreprises.

## Première étape

Le périmètre initial est décrit dans [`docs/01-cahier-des-charges.md`](docs/01-cahier-des-charges.md) :

- application de bureau, utilisable hors ligne ;
- TPE comme cible prioritaire ;
- prototype UX avant l’implémentation métier ;
- gestion de plusieurs sociétés dans un même espace de travail, avec isolation des données ;
- propositions d’imputations comptables avant validation ;
- calcul et génération contrôlés des amortissements ;
- import et export des balances et livres comptables en TXT et formats tableur Excel ;
- comptabilité générale, trésorerie et facturation comme base du futur MVP ;
- devise de travail : FCFA/XOF ;
- paramètres comptables et fiscaux béninois configurables et validables par un professionnel.

## Maquettes UX

Le prototype interactif est disponible dans [`prototype/index.html`](prototype/index.html). Les parcours et conventions de la maquette sont décrits dans [`docs/02-maquettes-ux.md`](docs/02-maquettes-ux.md).

Le parcours d’accès initial — authentification puis sélection d’un dossier — est décrit dans [`docs/04-authentification-et-dossiers.md`](docs/04-authentification-et-dossiers.md).

Pour l’ouvrir localement :

```bash
npm run preview
```

Puis ouvrir `http://localhost:4173` dans un navigateur.

Le premier noyau métier est décrit dans [`docs/03-socle-technique.md`](docs/03-socle-technique.md). Les tests se lancent avec :

```bash
npm test
```
