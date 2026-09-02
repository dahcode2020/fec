# Clôture périodique — module CSR

**Version :** 0.1  
**Statut :** assistant de contrôle et verrouillage

## Objectif

La clôture périodique empêche de modifier une période tant que les contrôles essentiels ne sont pas résolus.

## Checklist

Le système vérifie :

- équilibres fondamentaux ;
- saisies validées ;
- traitements automatiques ;
- banque et rapprochement ;
- résultat fiscal et impôt ;
- synchronisation du Livre journal intégré.

Chaque contrôle est bloquant par défaut et renvoie vers l’écran approprié.

## Parcours

1. ouvrir **Opérations → Clôture périodique** ;
2. sélectionner la période ;
3. consulter la checklist ;
4. traiter les blocages ;
5. actualiser les contrôles ;
6. clôturer si tous les contrôles sont satisfaits.

## Effets de la clôture

- statut de la période : `CLOSED` ;
- écritures de la période verrouillées ;
- nouvelle saisie refusée sur la période ;
- événement conservé dans l’audit ;
- possibilité d’une demande de réouverture contrôlée avec motif.

La clôture ne supprime aucune donnée. Elle protège l’état arrêté de la période.
