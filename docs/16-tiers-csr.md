# Tiers CSR — clients, fournisseurs et partenaires

**Version :** 0.1  
**Accès :** Configuration → Tiers  
**Statut :** premier écran fonctionnel

## Objectif

Le référentiel des tiers relie les fiches de l’entreprise aux comptes auxiliaires du plan SYSCOHADA. Il alimente les propositions d’imputation, les factures, les règlements et les éditions.

## Types de tiers

- Clients ;
- Fournisseurs ;
- Personnel ;
- Débiteurs / créditeurs divers.

## Fiche tiers

- type ;
- code ;
- nom ou raison sociale ;
- IFU ;
- compte collectif ;
- compte auxiliaire ;
- adresse ;
- téléphone ;
- conditions de règlement ;
- devise ;
- état actif/inactif.

## Comptes auxiliaires

Lors de la création d’un tiers, le système propose le prochain sous-compte du compte collectif :

- clients → `4111` ;
- fournisseurs → `4011` ;
- personnel → `421` ;
- débiteurs/créditeurs divers → `4711`.

Le compte auxiliaire est ajouté comme compte personnalisé au plan de la société. Il est ensuite proposé automatiquement lors de la saisie d’une vente ou d’un achat.

## Sécurité et historique

- les codes des tiers sont uniques par société ;
- un tiers peut être désactivé sans supprimer son historique ;
- le compte auxiliaire reste rattaché aux écritures existantes ;
- les créations et modifications sont inscrites dans l’audit ;
- les tiers d’une autre société ne sont jamais proposés dans la saisie active.

## Intégration avec la saisie

- une vente propose le compte auxiliaire du client ;
- un achat propose le compte auxiliaire du fournisseur ;
- les comptes collectifs et auxiliaires restent visibles dans l’écriture ;
- le tiers sélectionné est conservé dans le livre journal intégré ;
- les soldes clients et fournisseurs alimenteront les éditions et le lettrage.
