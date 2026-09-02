# Exercices et périodes — module CSR

**Version :** 0.1  
**Accès :** Configuration → Société & exercice  
**Statut :** catalogue multi-exercices et calendrier mensuel du dossier

## Objectif

Chaque exercice CSR est découpé en douze périodes mensuelles. La période active accompagne les saisies, traitements, rapprochements et éditions.

## Fonctionnement

- douze périodes sont préparées à la création de l’exercice ;
- chaque période possède un début, une fin et un état ;
- une seule période est active pour la saisie courante ;
- une période clôturée reste consultable mais refuse toute nouvelle écriture ;
- l’exercice ne peut être arrêté que lorsque les douze périodes existent et que les contrôles annuels sont satisfaits ;
- l’arrêté annuel verrouille ensuite toutes les périodes ; les clôtures mensuelles restent facultatives.

## États

```text
Ouverte
→ À contrôler
→ Clôturée
```

Le statut `CLOSED` est appliqué par l’assistant de clôture. L’arrêté définitif de l’exercice utilise ensuite le statut `FINALIZED`.

## Écran

L’écran affiche :

- le catalogue des exercices de la société ;
- l’exercice actif ;
- les exercices arrêtés consultables ;
- les exercices ouverts disponibles ;
- périodes ouvertes ;
- périodes clôturées ;
- période active ;
- bornes de chaque mois ;
- état de la période ;
- lien vers la saisie ;
- lien vers la checklist de clôture.

Le changement d’exercice et le changement de période active sont enregistrés séparément dans le contexte local de la société. Chaque exercice conserve son propre calendrier de douze périodes et sa propre période active. Le dossier annuel est identifié par le code sigle-année, par exemple `ACACIA-25` puis `ACACIA-26`. L’exercice arrêté reste consultable et ne peut pas recevoir de nouvelle saisie ; l’exercice ouvert suivant devient le contexte opérationnel courant après validation des reports à nouveau.
