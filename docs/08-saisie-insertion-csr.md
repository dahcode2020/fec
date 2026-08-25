# Menu « Saisie et insertion » — module CSR

**Version :** 0.1  
**Statut :** première maquette opérationnelle

## Objectif

Le menu **Saisie et insertion** est la partie opérationnelle du module Comptabilité SYSCOHADA Révisé. Il sert à enregistrer les opérations au fil de l’eau, à recalculer les propositions comptables en temps réel et à insérer une écriture contrôlée dans le brouillard.

Il constitue le point d’entrée quotidien de l’utilisateur. Les menus Fichier et Configuration servent à préparer l’environnement ; Saisie et insertion sert à produire les données comptables.

## Parcours cible

1. l’utilisateur ouvre le menu **Saisie et insertion** ;
2. la société active, l’exercice et l’état de la période sont rappelés ;
3. il choisit un type d’opération ;
4. il saisit la date, le journal, la référence, le libellé, le tiers et le montant ;
5. la proposition d’imputation se met à jour à chaque modification ;
6. il contrôle les lignes débit/crédit et la justification de la proposition ;
7. il clique sur **Prévisualiser et insérer** ;
8. l’écriture est placée dans le brouillard avec l’état **À contrôler** ;
9. la ligne reste consultable dans les dernières saisies ;
10. un utilisateur habilité la valide ensuite avec l’action de validation.

## Onglets de saisie

Les types de saisie sont affichés horizontalement :

- Écriture libre ;
- Vente ;
- Achat ;
- Abonnement ;
- Encaissement ;
- Décaissement ;
- Transfert ;
- Immobilisation.

Le choix d’un onglet préconfigure le journal et la catégorie d’opération, mais ne remplace pas le contrôle de l’utilisateur.

## Mise à jour en temps réel

Le panneau de contrôle à droite affiche :

- l’état de l’équilibre ;
- les comptes proposés ;
- les montants débit et crédit ;
- le total de l’écriture ;
- la règle ou l’historique à l’origine de la suggestion ;
- les informations à compléter en cas d’imputation inconnue.

Une modification de la catégorie, du tiers ou du montant relance la suggestion. La proposition ne devient jamais une écriture validée sans action explicite.

## Imputations multi-lignes

Une imputation n’est pas limitée à une ligne au débit et une ligne au crédit. L’utilisateur peut ouvrir **Modifier / ajouter des lignes** pour compléter la proposition :

- une ligne ou plusieurs lignes au débit ;
- une ligne ou plusieurs lignes au crédit ;
- comptes, libellés et montants distincts par ligne ;
- répartition contrôlée pour que le total des lignes corresponde au montant de l’opération ;
- équilibre débit/crédit vérifié avant insertion.

Exemple :

```text
Débit   411000 — Client                         250 000
Crédit  706000 — Prestation                     200 000
Crédit  445700 — TVA collectée                   50 000
```

Le moteur accepte un nombre quelconque de lignes tant que chaque ligne possède un seul côté, que les comptes existent dans le référentiel et que le total débit égale le total crédit.

L’écran de modification affiche explicitement les colonnes **Compte**, **Libellé**, **Débit** et **Crédit**. Sur ordinateur, la fenêtre est suffisamment large pour afficher toutes les colonnes simultanément, sans barre de défilement horizontale. Sur petit écran, les champs restent visibles les uns sous les autres. L’ordre naturel des champs permet de passer de Compte à Libellé, Débit, Crédit puis à la ligne suivante avec la touche `Tab`.

## Fenêtre fixe de correction

Une fenêtre de correction est ouverte pour le dossier actif. Elle enregistre au maximum les trois premières imputations récentes de la séquence de saisie, tous journaux confondus.

- la suppression se fait dans l’ordre inverse de création ;
- après suppression d’une imputation, aucune imputation plus ancienne ne remonte dans la fenêtre ;
- une quatrième imputation est insérée normalement, mais elle est verrouillée pour la suppression directe ;
- toute suppression est une annulation tracée, pas un effacement physique silencieux ;
- une imputation validée ou clôturée ne peut pas être supprimée par ce mécanisme ;
- après la fenêtre, seul l’administrateur peut ouvrir une procédure de correction contrôlée.

## États de l’opération

- **Brouillon** : saisie en cours, non insérée ;
- **À contrôler** : écriture insérée dans le brouillard, équilibrée mais non validée ;
- **Validée** : contrôlée par un utilisateur habilité ;
- **Clôturée** : période verrouillée ;
- **Extournée** : correction passée par une écriture inverse documentée.

## Règles métier

- la société active et la période ouverte sont affichées dans le contexte de saisie ;
- chaque ligne possède un seul côté, débit ou crédit ;
- l’insertion est refusée si l’écriture n’est pas équilibrée ;
- l’insertion est refusée si l’imputation obligatoire n’est pas complétée ;
- la référence, la date et le journal suivent la numérotation de la société ;
- une écriture insérée ne peut pas être supprimée silencieusement ;
- une erreur sur une écriture insérée passe par une correction traçable ;
- l’utilisateur est averti si la période est clôturée ;
- les opérations d’un autre dossier ou d’un autre module sont inaccessibles.

## Maquette disponible

Dans le prototype :

1. ouvrir un dossier ;
2. choisir le module CSR ;
3. cliquer sur **Saisie et insertion** dans la section **Opérations** ;
4. modifier le type de saisie ;
5. changer le montant ou le tiers pour observer la mise à jour en direct ;
6. cliquer sur **Prévisualiser et insérer** ;
7. retrouver l’opération dans la liste « Dernières saisies ».

Le moteur métier utilisé dans la maquette contrôle déjà l’équilibre et les règles d’imputation de démonstration. La persistance SQLite et la validation multi-utilisateurs seront ajoutées ultérieurement.
