# Règlements et lettrage — module CSR

**Version :** 0.1  
**Statut :** premier flux fonctionnel

## Objectif

Relier un encaissement ou un paiement à une facture, mettre à jour le solde du tiers et préparer le lettrage.

## Types de règlements

- encaissement client ;
- paiement fournisseur.

Champs communs :

- tiers ;
- date ;
- référence ;
- mode de règlement ;
- compte de trésorerie ;
- montant ;
- affectations aux factures.

## Imputations

### Encaissement client

```text
Débit    Banque / Caisse          montant
Crédit   Compte auxiliaire client montant
```

### Paiement fournisseur

```text
Débit    Compte auxiliaire fournisseur montant
Crédit   Banque / Caisse              montant
```

L’écriture est créée dans le journal `BQ`, puis placée dans le brouillard avec l’état `À contrôler`.

## Affectation

Le logiciel présente les factures ouvertes du tiers. Un règlement peut être :

- affecté intégralement à une facture ;
- affecté partiellement ;
- réparti sur plusieurs factures ;
- conservé comme acompte ou montant non affecté.

Le montant affecté ne peut pas dépasser le solde de la facture. Le logiciel vérifie également que la facture appartient à la même société et au même tiers.

## Lettrage

Une facture dont le solde atteint zéro est proposée comme **Réglée et lettrée**. Les factures partiellement réglées restent ouvertes.

Les factures et règlements sont regroupés par tiers afin de permettre un lettrage manuel ou automatique dans la prochaine extension.

## Synchronisation

Après validation du règlement :

- le solde de la facture est recalculé ;
- le solde du client ou fournisseur est recalculé ;
- la trésorerie est mise à jour ;
- le journal Banque est alimenté ;
- le Livre journal intégré est synchronisé ;
- les états comptes à payer/à recevoir sont actualisés.

## Contrôles

- société active ;
- tiers actif ;
- compte auxiliaire existant ;
- compte de banque ou de caisse existant ;
- période ouverte ;
- montant positif ;
- affectation sans dépassement ;
- absence de double affectation ;
- correction tracée après insertion.
