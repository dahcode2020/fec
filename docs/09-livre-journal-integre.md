# Livre journal intégré — module CSR

**Version :** 0.1  
**Statut :** maquette et noyau de catégorisation

## Objectif

Le **Livre journal intégré** est le registre transversal du module CSR. Il rassemble les écritures provenant des opérations manuelles et des traitements automatiques, puis les classe selon leur origine comptable. Les catégories automatiques sont alimentées par des journaux système réservés, et non par une saisie libre de l’utilisateur.

Il ne remplace pas les journaux Achats, Ventes, Banque, Caisse et Opérations diverses. Il en est la vue intégrée et contrôlée.

## Catégories suivies

- **Amortissements automatiques** ;
- **Centralisations** ;
- **Abonnements** ;
- **Résultat de la période** ;
- **Opérations générales**, pour les écritures qui ne relèvent pas encore d’une catégorie automatique.

Chaque ligne du livre conserve son journal d’origine, sa référence, son libellé, son imputation, ses montants, son état et sa catégorie intégrée.

## Synchronisation

Lorsqu’une opération est imputée ou qu’un traitement automatique produit une écriture :

1. l’écriture est validée par les contrôles débit/crédit ;
2. sa source et sa catégorie sont déterminées ;
3. elle est ajoutée ou mise à jour dans le livre journal intégré ;
4. le compteur et le total de sa catégorie sont recalculés ;
5. la mise à jour est visible dans le registre et dans les synthèses.

Une même écriture identifiée ne doit pas être dupliquée lors d’une nouvelle synchronisation. Une correction remplace la version précédente en conservant la trace de l’opération. Si une écriture est annulée dans la fenêtre des trois imputations récentes, elle est retirée de la vue active et conserve un événement d’audit.

## Catégorisation initiale

La catégorisation peut être explicite lorsque le traitement fournit `integrationCategory`. À défaut, le moteur recherche des indicateurs dans la source et le libellé :

- `amort` → Amortissements automatiques ;
- `central` → Centralisations ;
- `abonnement` → Abonnements ;
- `résultat` ou `resultat` → Résultat de la période ;
- sinon → Opérations générales.

Cette règle de départ est déterministe et sera complétée par les paramétrages du module CSR.

## Interface

La page **Journaux** présente :

- quatre indicateurs dédiés aux catégories demandées ;
- leur nombre d’écritures et leur montant ;
- une recherche par référence, libellé, journal ou catégorie ;
- un filtre de catégorie ;
- la liste des écritures synchronisées ;
- un état d’équilibre du livre ;
- la date de dernière synchronisation ;
- un rappel de la piste d’audit.

Le bouton **Saisir une écriture** renvoie vers le menu **Saisie et insertion**. Une écriture insérée depuis ce menu est immédiatement visible dans les opérations générales du livre, puis pourra être reclassée selon son traitement.

## Catégories à alimenter automatiquement dans les prochaines étapes

- la génération d’une dotation d’amortissement alimentera la catégorie Amortissements automatiques ;
- la procédure de centralisation alimentera la catégorie Centralisations ;
- les écritures récurrentes alimenteront la catégorie Abonnements ;
- le calcul et la clôture du résultat alimenteront la catégorie Résultat de la période.

Le calcul du résultat doit rester soumis à la période et au régime comptable de la société. Le livre intégré présente l’état du traitement ; il ne doit pas créer une clôture sans validation explicite.
