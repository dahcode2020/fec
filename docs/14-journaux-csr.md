# Configuration des journaux — module CSR

**Version :** 0.1  
**Accès :** Configuration → Journaux  
**Statut :** premier écran fonctionnel

## Objectif

Les journaux déterminent le contexte dans lequel une écriture CSR est saisie. Chaque société dispose de ses propres journaux, codes et séquences.

## Journaux initiaux

- `VE` — Ventes ;
- `AC` — Achats ;
- `BQ` — Banque ;
- `CA` — Caisse ;
- `OD` — Opérations diverses ;
- `AM` — Amortissements automatiques ;
- `AB` — Abonnements ;
- `CT` — Centralisations ;
- `RP` — Résultat de la période.

Les journaux `AM`, `AB`, `CT` et `RP` sont réservés aux traitements système. Ils sont visibles pour consultation et édition, mais ne sont pas proposés comme journaux de saisie manuelle.

Les journaux de saisie constituent une configuration de départ. Le dossier pourra ensuite ajouter d’autres journaux adaptés à son activité, sans modifier les journaux automatiques.

## Paramètres d’un journal

- code de 2 à 4 caractères alphanumériques ;
- libellé ;
- nature ;
- préfixe de la pièce ;
- numéro de la prochaine pièce ;
- état actif/inactif ;
- origine SYSCOHADA ou personnalisé.

## Règles de contrôle

- le code du journal est unique dans la société ;
- le code d’un journal utilisé est verrouillé ;
- un journal utilisé peut être désactivé mais pas supprimé ;
- la séquence est propre à la société, au journal et à l’exercice ;
- modifier le préfixe ne renumérote pas les pièces existantes ;
- les changements sont inscrits dans l’audit ;
- les nouveaux journaux sont disponibles dans la saisie après leur création.

## Écran

L’écran affiche :

- journaux actifs ;
- journaux personnalisés ;
- journal principal ;
- nature ;
- préfixe ;
- prochaine pièce ;
- état ;
- action de modification.

Il permet aussi d’exporter la configuration courante en TXT.
