# Reports à nouveau — module CSR

**Version :** 0.1  
**Statut :** prévisualisation et génération contrôlée

## Objectif

Préparer les soldes d’ouverture d’un nouvel exercice à partir des comptes de bilan de l’exercice arrêté.

## Règles

- seuls les comptes de bilan des classes 1 à 5 sont repris ;
- les comptes de charges et de produits ne sont pas reportés ;
- le résultat de l’exercice est repris via le compte de bénéfice ou de perte après arrêté ;
- les débits et crédits des reports doivent être équilibrés ;
- le journal système `AN` est utilisé ;
- une génération répétée ne crée pas de doublon ;
- les écritures sources restent inchangées.

## Parcours

1. arrêter définitivement l’exercice source ;
2. ouvrir **Reports à nouveau** ;
3. consulter les soldes proposés ;
4. vérifier les totaux débit/crédit ;
5. générer les reports dans `AN` ;
6. ouvrir l’exercice suivant.

La génération est bloquée tant que l’exercice source n’est pas `FINALIZED`. Le prototype prévisualise déjà les soldes de bilan mais conserve cette règle de sécurité.
