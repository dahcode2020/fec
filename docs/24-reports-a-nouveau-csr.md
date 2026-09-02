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
3. consulter les soldes proposés depuis l’instantané officiel ;
4. vérifier les totaux débit/crédit ;
5. générer les reports dans `AN` ;
6. valider l’écriture automatique ;
7. ouvrir l’exercice suivant ;
8. travailler dans les douze périodes nouvellement créées.

La génération est bloquée tant que l’exercice source n’est pas `FINALIZED`. L’ouverture de l’exercice suivant est séparée de la génération : les reports sont d’abord contrôlés, puis l’exercice cible est créé avec son dossier, ses périodes et sa période active de janvier.
