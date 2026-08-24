# Menu « Éditions » — module CSR

**Version :** 0.1
**Périmètre :** restitution et export du module Comptabilité SYSCOHADA Révisé

## Objectif

Le menu **Éditions** rassemble les informations produites par le logiciel afin de les consulter, les imprimer et les exporter. Il ne modifie pas les données comptables et ne remplace pas la saisie, les traitements périodiques ou la configuration.

Il constitue une couche de restitution sur les écritures, les comptes, les tiers, la trésorerie, l’analytique, les immobilisations et les états financiers.

## Accès

Éditions est accessible de deux façons :

- dans la navigation latérale du module CSR ;
- dans la barre supérieure de l’espace de travail, à côté de Fichier et Configuration.

Le contexte de la société, du dossier, de l’exercice et de la période active est conservé lors de l’ouverture d’une édition.

## Niveaux de données

### Éditions officielles

Les éditions officielles utilisent uniquement les écritures validées et clôturées, selon les droits de l’utilisateur.

### Éditions de contrôle

Les éditions de contrôle permettent de retrouver :

- brouillons ;
- écritures à contrôler ;
- pièces déséquilibrées ;
- pièces modifiées après leur première saisie ;
- opérations non lettrées ou non pointées ;
- traitements automatiques non finalisés.

Une édition de contrôle ne doit pas être confondue avec un état financier définitif.

## Organisation en onglets horizontaux

Les fonctions sont regroupées dans six onglets afin d’éviter une longue liste d’éditions mécaniques :

1. **Journaux & pièces** ;
2. **Comptes & tiers** ;
3. **Analytique & budgets** ;
4. **Trésorerie & rapprochements** ;
5. **Immobilisations & fiscalité** ;
6. **États & plans**.

Chaque onglet présente des cartes d’édition avec leur description et leur disponibilité.

## Contenu des rubriques

### Journaux & pièces

- Livre journal intégré ;
- détail des lignes saisies ;
- pièces modifiées après la première saisie ;
- pièces déséquilibrées ;
- cumul des pièces saisies ;
- éditions par journal, période et statut.

### Comptes & tiers

- comptes généraux ;
- balance ;
- grand livre ;
- cumul par comptes individuels ;
- cumul par comptes de synthèse ;
- fournisseurs ;
- clients ;
- personnel ;
- débiteurs et créditeurs divers ;
- lettrage ;
- comptes à payer et comptes à recevoir.

### Analytique & budgets

- états analytiques ;
- cumul par tiers ;
- cumul par centres analytiques ;
- cumul par devises ;
- budgets prévisionnels ;
- comparaison budget/réalisé.

### Trésorerie & rapprochements

- opérations de caisse ;
- comptes bancaires ;
- comptes à payer ;
- comptes à recevoir ;
- pointage et rapprochements bancaires ;
- programmation des règlements ;
- affectation des règlements aux factures émises.

### Immobilisations & fiscalité

- immobilisations ;
- tableaux d’amortissements ;
- dotations de la période ;
- déclarations périodiques ;
- déductions et réintégrations fiscales.

### États & plans

- états spécifiques au dossier ;
- tableaux financiers OHADA révisés ;
- calcul du résultat de la période ;
- définitions et plans d’édition.

## Parcours d’une édition

1. sélectionner une rubrique ;
2. sélectionner une édition ;
3. confirmer la société et la période ;
4. choisir le niveau officiel ou contrôle ;
5. appliquer les filtres ;
6. ouvrir l’aperçu des données ;
7. contrôler les lignes, les totaux et le périmètre ;
8. choisir ensuite d’imprimer, d’exporter ou de fermer l’aperçu sans sortie.

L’aperçu est une étape indépendante et sans effet sur les données comptables. Aucune impression ou export ne doit être déclenché automatiquement à l’ouverture d’une édition.

## Formats

Les sorties prévues sont :

- PDF ;
- TXT ;
- XLSX ;
- XLS ;
- CSV ;
- impression directe.

La configuration d’une édition pourra être enregistrée pour être réutilisée. Chaque export devra conserver son périmètre, son auteur, sa date, son format et son empreinte dans l’audit.

## Principes de sécurité

- une édition ne doit jamais modifier les écritures ;
- les états officiels sont calculés à partir du périmètre validé ;
- les brouillons sont toujours signalés dans les éditions de contrôle ;
- une société ne peut pas consulter l’édition d’une autre société ;
- les éditions de fin d’exercice portent la version du plan et du régime utilisés ;
- un état définitif doit être associé à un instantané après arrêté des comptes.
