# Arrêté définitif de l’exercice — module CSR

**Version :** 0.1  
**Statut :** assistant de préparation et verrouillage annuel

## Objectif

L’arrêté définitif verrouille l’exercice après la clôture de toutes ses périodes, la production des traitements et la préparation des états financiers.

## Contrôles bloquants

- toutes les périodes de l’exercice sont clôturées ;
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
- un instantané des états est associé à l’exercice ;
- les écritures ne sont plus modifiables ;
- l’événement est conservé dans l’audit ;
- une réouverture doit être autorisée et motivée.

Dans la maquette actuelle, un seul mois de démonstration est présent : l’arrêté annuel reste donc bloqué tant que les douze périodes ne sont pas créées et clôturées.
