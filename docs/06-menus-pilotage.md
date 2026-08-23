# Menus de pilotage du module CSR

**Version :** 0.1
**Périmètre :** module Comptabilité SYSCOHADA Révisé (CSR)
**Statut :** structure UX initiale

## Objectif

Dans l’espace de travail du module CSR, la section **Pilotage** comprend désormais deux menus structurants :

- **Fichier** ;
- **Configuration**.

Chaque menu possède une barre de sous-menus présentée sous forme d’onglets alignés horizontalement. Les intitulés et les règles métier des sous-menus restent provisoires et seront paramétrés progressivement.

## Menu Fichier

Sous-menus proposés pour la structure initiale :

- Dossiers ;
- Nouveau dossier ;
- Importer / exporter ;
- Sauvegardes ;
- Restaurer.

## Menu Configuration

Sous-menus proposés pour la structure initiale :

- Société & dossier ;
- Plan comptable ;
- Journaux ;
- Taxes ;
- Utilisateurs ;
- Sauvegarde.

Ces sous-menus sont pour le moment des emplacements UX. Leur contenu, leurs formulaires et leurs droits seront définis dans les étapes suivantes.

## Règles d’affichage

- les menus Fichier et Configuration sont visibles dans la section Pilotage de la navigation CSR ;
- le menu actif est mis en évidence ;
- les sous-menus du menu actif sont affichés sur une ligne horizontale ;
- si les onglets dépassent la largeur disponible, la barre peut défiler horizontalement ;
- un seul sous-menu est actif à la fois ;
- la sélection d’un onglet conserve le contexte de la société active ;
- les modules GP, GCSF et GC auront leurs propres menus et sous-menus lorsqu’ils seront conçus.

## Maquette

Dans le prototype :

1. ouvrir un dossier ;
2. choisir le module **CSR** ;
3. utiliser la navigation latérale **Fichier** ou **Configuration** ;
4. cliquer sur les onglets horizontaux ;
5. observer le changement du sous-menu sélectionné.

Les écrans affichent volontairement un état d’attente jusqu’au paramétrage détaillé de chaque sous-menu.
