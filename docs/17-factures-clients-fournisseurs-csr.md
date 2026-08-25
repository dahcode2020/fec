# Factures clients et fournisseurs — module CSR

**Version :** 0.1  
**Statut :** premier flux fonctionnel

## Objectif

Relier le référentiel des tiers au flux opérationnel CSR : facture, imputation multi-lignes, brouillard, validation et livre journal intégré.

## Facture client

Le formulaire permet de saisir :

- client ;
- date ;
- référence ;
- échéance ;
- taux de TVA ;
- lignes de désignation ;
- quantités ;
- prix unitaires.

Le logiciel calcule :

- total hors taxe ;
- taxe ;
- total TTC ;
- compte auxiliaire du client ;
- compte de produit ;
- compte de TVA.

Exemple :

```text
Débit    411101 — Awa Concept             295 000
Crédit   7061   — Services vendus         250 000
Crédit   4431   — TVA facturée             45 000
```

## Facture fournisseur

Même parcours pour les fournisseurs :

```text
Débit    6047   — Fournitures de bureau    38 500
Crédit   401101 — Cotonou Bureau            38 500
```

Avec TVA, la ligne de TVA récupérable est ajoutée au débit du compte prévu.

## Contrôles

- tiers obligatoire ;
- référence et date obligatoires ;
- désignation obligatoire pour chaque ligne ;
- quantité positive ;
- prix non négatif ;
- compte auxiliaire rattaché à la société active ;
- comptes présents dans le plan ;
- écriture débit/crédit équilibrée ;
- insertion dans le journal VE ou AC ;
- statut « À contrôler » avant validation.

## Persistance et synchronisation

Les factures sont conservées localement dans le dossier actif. Une facture comptabilisée produit une écriture multi-lignes qui alimente :

- le journal des ventes ou des achats ;
- le compte auxiliaire du tiers ;
- le Livre journal intégré ;
- la liste des dernières saisies ;
- les futures éditions de comptes à recevoir ou à payer.

Le paiement, son affectation à une facture et le lettrage seront développés dans la prochaine tranche.
