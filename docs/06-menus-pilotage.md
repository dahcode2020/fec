# Menus de pilotage du module CSR

**Version :** 0.2
**Périmètre :** module Comptabilité SYSCOHADA Révisé (CSR)
**Statut :** structure UX initiale

## Objectif

Dans l’espace de travail du module CSR, la section **Pilotage** comprend deux menus structurants :

- **Fichier** ;
- **Configuration**.

Les sous-menus sont présentés dans une barre d’onglets alignés horizontalement. Pour éviter une barre surchargée, les fonctions proches sont regroupées dans des rubriques cohérentes. Les actions détaillées apparaissent ensuite sous forme de cartes d’action dans la rubrique sélectionnée.

## Menu Fichier

### Onglets horizontaux

- **Dossiers** ;
- **Échanges comptables** ;
- **Centralisation** ;
- **Consolidation** ;
- **Contrôle & maintenance** ;
- **Aide**.

### Fonctions regroupées

#### Dossiers

- Dossiers en cours ;
- Nouveau dossier ;
- Sauvegarder les dossiers ;
- Restaurer une sauvegarde ;
- Fermer.

Les fonctions Dossiers, Sauvegardes et Restaurer de la structure précédente sont ainsi conservées dans une même rubrique, au lieu de multiplier les onglets.

#### Échanges comptables

- Exportation de Fichiers Comptables ;
- Importation de Fichiers Comptables ;
- Importation d’une Balance Générale.

#### Centralisation

- Centralisation de Données Comptables ;
- Annulation d’une Centralisation.

#### Consolidation

- Consolidation de Comptabilité (avant Résultat) ;
- Consolidation de Comptabilité (Après Résultat).

#### Contrôle & maintenance

- Inspection et Recalcul du solde des Comptes ;
- Réparation d’une Base.

#### Aide

- Tutoriel d’Utilisation.

## Menu Configuration

Les sous-menus provisoires sont conservés sous forme d’onglets horizontaux :

- Société & dossier ;
- Plan comptable ;
- Journaux ;
- Taxes ;
- Utilisateurs ;
- Sauvegarde.

Ces sous-menus seront détaillés dans les prochaines étapes, module CSR par module CSR.

## Règles d’affichage

- les menus Fichier et Configuration sont visibles dans la section Pilotage de la navigation CSR ;
- le menu actif est mis en évidence ;
- les onglets du menu actif sont affichés sur une ligne horizontale ;
- si les onglets dépassent la largeur disponible, la barre peut défiler horizontalement ;
- un seul onglet est actif à la fois ;
- la sélection d’un onglet conserve le contexte de la société et du dossier actifs ;
- l’organisation par rubriques évite d’afficher mécaniquement toutes les fonctions au même niveau ;
- les modules GP, GCSF et GC auront leurs propres menus et sous-menus lorsqu’ils seront conçus.

## Maquette

Dans le prototype :

1. ouvrir un dossier ;
2. choisir le module **CSR** ;
3. utiliser la navigation latérale **Fichier** ;
4. cliquer sur **Échanges comptables**, **Centralisation**, **Consolidation**, **Contrôle & maintenance** ou **Aide** ;
5. consulter les actions regroupées dans la rubrique active ;
6. revenir à **Dossiers** pour accéder aux dossiers et aux sauvegardes ;
7. ouvrir **Configuration** et parcourir ses onglets horizontaux.

Les actions non encore développées affichent un état d’attente. Elles seront paramétrées une par une dans les prochaines étapes.
