# Arrêté définitif de l’exercice — module CSR

**Version :** 0.1  
**Statut :** assistant de préparation et verrouillage annuel

## Objectif

L’arrêté définitif verrouille l’exercice après la clôture de toutes ses périodes, la production des traitements et la préparation des états financiers.

## Contrôles bloquants

- les douze périodes de l’exercice existent ;
- les clôtures mensuelles sont traitées lorsqu’elles sont activées ;
- aucune saisie reste à contrôler ;
- les traitements automatiques sont exécutés ;
- les ajustements fiscaux et l’impôt sont préparés ;
- les états sont prêts à être archivés.

## Parcours

1. ouvrir **Opérations → Arrêté de l’exercice** ;
2. consulter la progression des périodes ;
3. traiter les contrôles renvoyant vers la saisie, les traitements ou les éditions ;
4. prévisualiser les états ;
5. arrêter l’exercice lorsque les conditions sont remplies ;
6. générer ensuite les reports à nouveau vers l’exercice suivant.

## Effets

- le statut de l’exercice devient `FINALIZED` ;
- un instantané officiel des états est associé à l’exercice et scellé avec une empreinte ;
- les périodes de l’exercice sont verrouillées ;
- les écritures ne sont plus modifiables ;
- l’événement et le lien avec l’instantané sont conservés dans l’audit ;
- une réouverture doit être autorisée et motivée.

## Préparation de l’instantané

Avant l’arrêté, l’utilisateur déclenche **Préparer l’instantané**. Le logiciel recalcule les états sur les écritures validées ou clôturées du seul exercice, en excluant les écritures techniques, les centralisations et les écritures de solde du résultat. Il conserve le référentiel, le régime, les écritures sources, les totaux et le résultat calculé.

L’instantané est ensuite utilisé pour restituer les états officiels après l’arrêté. Une modification de la comptabilité ne remplace pas silencieusement cet instantané.

Dans la maquette, l’arrêté annuel exige la présence des douze périodes et la résolution des contrôles bloquants. Les clôtures mensuelles restent facultatives ; l’arrêté annuel verrouille l’exercice et ses périodes.
