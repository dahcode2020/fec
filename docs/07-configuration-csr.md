# Configuration du module CSR

**Version :** 0.1  
**Module :** Comptabilité SYSCOHADA Révisé

## Objectif

Le menu **Configuration** rassemble les référentiels et les règles qui permettent d’adapter le module CSR à chaque société sans modifier les écritures déjà validées.

Les éléments de base fournis avec le SYSCOHADA Révisé sont conservés comme référentiel versionné. Les compléments et adaptations de l’utilisateur sont enregistrés dans la configuration de sa société, avec une trace de leur auteur et de leur date.

## Onglets horizontaux

1. Société & exercice ;
2. Comptes généraux ;
3. Tiers ;
4. Journaux ;
5. Taxes & TVA ;
6. Immobilisations ;
7. Imputations ;
8. Banques & caisses ;
9. Utilisateurs & accès ;
10. Documents ;
11. Sauvegarde.

## 1. Société & exercice

- identité, forme juridique, adresse, IFU et activité ;
- devise et formats d’affichage ;
- création et ouverture d’un exercice ;
- découpage en périodes ;
- verrouillage et clôture ;
- paramètres propres au régime comptable sélectionné ;
- contrôle des dates de saisie.

## 2. Comptes généraux

Référentiel : **Comptes Généraux — Plan Comptable SYSCOHADA Révisé**.

Fonctions :

- rechercher par numéro ou libellé ;
- consulter la classe, la nature et les attributs du compte ;
- compléter le plan avec des sous-comptes autorisés ;
- adapter les libellés et les comptes favoris aux besoins de la société ;
- associer les comptes de tiers, de taxes et de trésorerie ;
- importer ou exporter les personnalisations ;
- désactiver un compte non utilisé ;
- empêcher la suppression d’un compte présent dans une écriture ;
- conserver la version du plan applicable à chaque exercice ;
- contrôler les comptes non mouvementables ou réservés selon les règles validées.

L’utilisateur pourra adapter le plan, mais une modification ne devra pas réécrire l’historique des écritures ni changer rétroactivement la signification d’un compte utilisé.

## 3. Tiers

### Fournisseurs

- fiche fournisseur ;
- compte auxiliaire ;
- contacts et adresse ;
- conditions et délai de règlement ;
- catégorie et règle d’imputation par défaut ;
- historique des achats et solde.

### Clients

- fiche client ;
- compte auxiliaire ;
- contacts et adresse ;
- conditions et délai de règlement ;
- catégorie et règle d’imputation par défaut ;
- historique des ventes, règlements et solde.

### Personnel

- fiches ou comptes de personnel nécessaires à la comptabilité ;
- avances, acomptes et remboursements ;
- séparation avec les données détaillées du module GP ;
- règles d’accès renforcées pour les informations sensibles.

### Débiteurs / créditeurs divers

- tiers occasionnels ;
- comptes auxiliaires ;
- classement par nature ;
- suivi des soldes et des régularisations ;
- contrôle des comptes sans mouvement récent.

## 4. Journaux

- créer et modifier les journaux autorisés ;
- configurer achats, ventes, banque, caisse et opérations diverses ;
- définir le code et le libellé ;
- associer un type d’opération ;
- configurer la numérotation des pièces par société et exercice ;
- définir les comptes de contrepartie proposés ;
- limiter les journaux par rôle utilisateur ;
- activer ou désactiver un journal sans perdre son historique.

## 5. Taxes & TVA

- créer des codes de taxes ;
- versionner les taux par période ;
- définir la base et les comptes associés ;
- distinguer ventes, achats et opérations exonérées ;
- prévoir les retenues ou taxes spécifiques à valider localement ;
- contrôler la cohérence entre le code appliqué et le compte ;
- empêcher la modification rétroactive d’une taxe déjà utilisée.

Les taux, seuils et mentions devront être validés avec un professionnel compétent au Bénin avant activation.

## 6. Immobilisations

- catégories d’actifs ;
- comptes d’immobilisation, de dotation et d’amortissement cumulé ;
- méthode par défaut ;
- durée par catégorie ;
- prorata temporis ;
- périodicité des dotations ;
- seuils internes à documenter ;
- cession, mise au rebut et dépréciation à traiter selon une procédure dédiée.

## 7. Imputations

- modèles d’écritures ;
- comptes par catégorie d’opération ;
- règles par fournisseur, client, article ou service ;
- comptes favoris ;
- priorité des règles ;
- taux de confiance et motif affiché ;
- validation obligatoire avant comptabilisation ;
- historique des corrections acceptées.

## 8. Banques & caisses

- comptes bancaires ;
- caisses ;
- journaux associés ;
- modes de règlement : espèces, virement, chèque, mobile money et autres ;
- soldes initiaux ;
- formats de relevés ;
- paramètres de rapprochement ;
- frais bancaires et imputations par défaut.

## 9. Utilisateurs & accès

- utilisateurs de la société ;
- rôles : administrateur, opérateur, contrôleur, comptable et lecture seule ;
- autorisations par journal ;
- autorisations de validation, clôture, import et export ;
- journal des connexions et actions sensibles ;
- expiration ou suspension d’un accès ;
- séparation des tâches entre saisie et validation.

## 10. Documents

- modèles de factures, avoirs, reçus et pièces ;
- logo et identité visuelle ;
- mentions de la société ;
- préfixes et séquences ;
- formats d’impression et d’export ;
- conservation de la référence de la pièce source.

## 11. Sauvegarde

- sauvegarde manuelle ;
- sauvegarde automatique configurable ;
- emplacement ;
- chiffrement ;
- historique ;
- restauration contrôlée ;
- vérification de l’intégrité ;
- export complet d’un dossier ;
- sauvegarde avant clôture, migration ou réparation.

## Fonctionnement UX

Les onglets restent alignés horizontalement. Lorsqu’un onglet est sélectionné, ses fonctionnalités sont présentées sous forme de cartes d’action regroupées par usage. Cette organisation évite d’afficher mécaniquement tous les réglages au même niveau.

Les paramètres non encore développés affichent un état d’attente dans la maquette. Ils seront implémentés progressivement et validés avant d’être utilisés dans des écritures réelles.
