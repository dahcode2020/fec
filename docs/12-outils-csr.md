# Menu « Outils » — module CSR

**Version :** 0.1
**Emplacement :** section Opérations
**Module :** Comptabilité SYSCOHADA Révisé

## Objectif

Le menu **Outils** rassemble les aides pratiques utilisées pendant la saisie, le contrôle et la préparation des pièces comptables. Ces outils ne modifient jamais une écriture sans confirmation.

## Accès

Le menu est disponible :

- dans la navigation latérale, sous **Opérations** ;
- dans la barre supérieure de l’espace de travail ;
- par raccourci clavier pour les outils les plus fréquents.

## Outils rapides

### Capture d’écran

Raccourci proposé :

```text
Ctrl + Alt + S
```

Fonctionnement prévu :

- demander l’autorisation de capture au système ;
- capturer l’écran choisi ;
- produire une image PNG ;
- proposer son enregistrement comme pièce justificative ;
- ne jamais envoyer l’image vers un service distant sans consentement.

La disponibilité dépend des autorisations du navigateur ou du système d’exploitation.

### Calculatrice

Raccourci proposé :

```text
Ctrl + Alt + C
```

La calculatrice permet les opérations intermédiaires sans quitter la saisie. Elle accepte les nombres, parenthèses et opérations `+`, `-`, `×` et `÷`. Le résultat n’est pas injecté automatiquement dans une écriture : l’utilisateur décide de le reporter.

## Outils comptables proposés

### Calculs comptables

- calcul TVA / HT / TTC ;
- montant en lettres ;
- prorata temporis ;
- conversion de devises.

### Contrôles

- vérification de l’équilibre débit/crédit ;
- calcul d’un écart de caisse ;
- calcul d’une échéance ;
- contrôles rapides des montants avant insertion.

### Aide à la saisie

- mémo des classes du SYSCOHADA ;
- raccourcis clavier ;
- bloc-notes de saisie.

Ces outils seront ajoutés progressivement. Ils doivent rester des assistants et ne pas contourner les contrôles du moteur comptable.

## Principes de sécurité

- aucune capture sans autorisation explicite ;
- aucun résultat de calcul ne valide automatiquement une écriture ;
- aucun outil ne doit contourner les droits du dossier ;
- les pièces capturées doivent être rattachées à la société active ;
- les raccourcis sont désactivables si un environnement les utilise déjà ;
- toute fonction ayant un impact comptable doit afficher une prévisualisation.

## Maquette

Parcours de démonstration :

1. ouvrir un dossier ;
2. sélectionner le module CSR ;
3. cliquer sur **Outils** dans la section **Opérations** ;
4. ouvrir **Calculatrice** ou utiliser `Ctrl + Alt + C` ;
5. essayer les opérations ;
6. ouvrir **Capture d’écran** ou utiliser `Ctrl + Alt + S` ;
7. parcourir les outils comptables complémentaires.
