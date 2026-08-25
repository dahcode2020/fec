# Travaux périodiques — module CSR

**Version :** 0.1  
**Emplacement :** opérations → travaux périodiques  
**Statut :** premier orchestrateur des traitements automatiques

## Objectif

Cette page orchestre les traitements qui ne doivent pas être saisis par l’utilisateur. Elle prépare les écritures dans les journaux système appropriés et affiche une prévisualisation avant génération.

## Traitements

- **Amortissements automatiques** → journal `AM` ;
- **Abonnements** → journal `AB` ;
- **Centralisations** → journal `CT` ;
- **Résultat de la période** → journal `RP`.

Les journaux `AM`, `AB`, `CT` et `RP` sont réservés au moteur système. L’utilisateur peut déclencher une prévisualisation ou demander une génération, mais il ne renseigne jamais leurs imputations.

## Parcours

1. ouvrir **Travaux périodiques** ;
2. choisir le traitement ;
3. consulter la période active et la société ;
4. ouvrir la prévisualisation ;
5. contrôler le nombre d’écritures, les comptes et les montants ;
6. générer l’écriture dans le journal automatique, si le paramétrage est complet ;
7. retrouver l’écriture dans le Livre journal intégré avec l’état « À contrôler ».

## Tranche actuelle

### Amortissements

Le système calcule un plan linéaire de démonstration à partir de l’immobilisation en service et génère une dotation dans `AM`.

### Abonnements

Les abonnements actifs de la société, définis comme modèles récurrents, génèrent une écriture dans `AB`. Chaque modèle possède son fournisseur, son montant, son compte de charge et sa périodicité.

### Centralisations

La page et le journal `CT` sont en place, mais la génération est bloquée tant que les journaux sources et les règles de centralisation ne sont pas validés.

### Résultat

La page et le journal `RP` sont en place, mais la génération est bloquée tant que les comptes de résultat, les régularisations et le régime comptable ne sont pas validés.

## Règles de sécurité

- aucune saisie manuelle dans un journal système ;
- prévisualisation obligatoire ;
- une génération répétée ne crée pas de doublon ;
- chaque traitement est rattaché à une société, un dossier et une période ;
- toute génération est synchronisée dans le Livre journal intégré ;
- le traitement est conservé dans l’historique ;
- une période clôturée refuse toute génération.
