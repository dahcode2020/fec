# Écran « Comptes généraux » — module CSR

**Version :** 0.1
**Accès :** Configuration → Comptes généraux
**Statut :** premier écran fonctionnel

## Objectif

Fournir à chaque société un plan comptable de départ basé sur le SYSCOHADA Révisé, puis permettre à l’utilisateur de le compléter et de l’adapter de manière contrôlée.

Le plan affiché dans l’écran est propre à la société active. Changer de société recharge un autre plan et ne mélange jamais les comptes.

## Fonctions disponibles

- recherche par numéro, libellé ou nature ;
- filtre par classe ;
- affichage des comptes actifs ;
- affichage optionnel des comptes inactifs ;
- ajout d’un compte ou d’un sous-compte ;
- modification contrôlée d’un compte ;
- export du plan au format TXT ;
- import d’un plan TXT ou CSV ;
- prévisualisation et validation avant import ;
- indication de l’origine du compte : SYSCOHADA ou Personnalisé ;
- indication des comptes déjà utilisés dans les écritures.

## Modification contrôlée

Lors de la modification :

- le numéro doit contenir entre 1 et 8 chiffres ;
- le libellé est obligatoire ;
- un numéro déjà utilisé dans le dossier est verrouillé ;
- un numéro ne peut pas être dupliqué ;
- les comptes personnalisés sont identifiés comme tels ;
- la modification est enregistrée dans l’audit ;
- les écritures historiques ne sont jamais réécrites.

## Import contrôlé

Le premier connecteur accepte un fichier TXT ou CSV comportant au minimum :

```text
COMPTE ; LIBELLE ; NATURE
```

Le logiciel :

1. détecte le séparateur ;
2. lit les colonnes ;
3. prévisualise les comptes ;
4. refuse les numéros invalides ;
5. refuse les doublons avec le plan existant ;
6. place les comptes en attente ;
7. ajoute les comptes seulement après confirmation.

L’import ne modifie aucune écriture et ne remplace pas le référentiel validé sans action explicite.

## Export

L’export TXT contient :

- société ;
- version du plan ;
- numéro du compte ;
- libellé ;
- nature ;
- état actif/inactif.

Un export Excel sera branché dans la tranche dédiée aux adaptateurs tableurs.

## Référentiel intégré

Le prototype charge maintenant le référentiel complet local `prototype/data/syscohada-revise.json`, organisé sur les 9 classes, avec les comptes de regroupement et les sous-comptes détaillés (1 357 entrées de l’arbre intégré). Il est chargé au démarrage et fusionné avec les personnalisations de la société.

Le référentiel intégré est versionné comme base de développement et sa source doit être comparée au PDF fourni puis validée par un professionnel avant une utilisation réglementaire. L’application ne remplace pas le référentiel officiel par des comptes personnalisés : les ajouts de la société restent une extension non destructive.
