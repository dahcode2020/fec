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

Le système peut maintenant prévisualiser les écritures sources de la période, les regrouper par compte et préparer une écriture technique dans `CT`. Cette écriture porte les références des sources et ne doit pas être ajoutée une seconde fois aux états de synthèse. Les règles de centralisation détaillées du dossier pourront compléter ce premier traitement.

### Résultat

Le système calcule maintenant le résultat provisoire à partir des lignes validées des comptes de charges et de produits. Il prépare une écriture technique dans `RP`, en choisissant le compte de bénéfice ou de perte approprié, avec la liste des écritures sources. Cette écriture reste à contrôler et ne vaut pas arrêté définitif de l’exercice. Le calcul fiscal, l’impôt et le résultat net après impôt sont présentés dans le panneau séparé de résultat fiscal.

## Règles de sécurité

- aucune saisie manuelle dans un journal système ;
- prévisualisation obligatoire ;
- une génération répétée ne crée pas de doublon ;
- chaque traitement est rattaché à une société, un dossier et une période ;
- toute génération est synchronisée dans le Livre journal intégré ;
- le traitement est conservé dans l’historique ;
- une période clôturée refuse toute génération.
