# Exercices et périodes — module CSR

**Version :** 0.1  
**Accès :** Configuration → Société & exercice  
**Statut :** calendrier mensuel du dossier

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

- périodes ouvertes ;
- périodes clôturées ;
- période active ;
- bornes de chaque mois ;
- état de la période ;
- lien vers la saisie ;
- lien vers la checklist de clôture.

Le changement de période active est enregistré dans le contexte local de la société.
