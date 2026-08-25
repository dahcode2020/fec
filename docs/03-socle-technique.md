# Socle technique — première tranche

**Statut :** en place, sans dépendance externe  
**Version :** 0.1  
**Objectif :** sécuriser les règles métier avant le passage à Tauri et SQLite

## Ce qui est maintenant en place

Le prototype dispose d’un noyau métier dans [`prototype/core.js`](../prototype/core.js). Il est chargé par l’interface, mais reste indépendant du DOM afin d’être testé et réutilisé dans l’application de bureau. La première tranche persiste maintenant son état dans le stockage local du navigateur ; le contrat sera conservé lors du remplacement par SQLite.

### Espaces, sociétés et modules

- création d’un espace de travail ;
- ajout de sociétés sans doublon ;
- création d’un dossier sans module obligatoire ;
- catalogue CSR, GP, GCSF et GC ;
- association indépendante de plusieurs modules à un même dossier ;
- contrôle d’accès à un module uniquement s’il est activé ;
- filtrage des sociétés archivées ;
- contrôle d’appartenance à la société active ;
- persistance locale derrière un petit adaptateur remplaçable par SQLite ;
- génération du code de dossier sous la forme `SIGLE-YY`, à partir de l’année de début de l’exercice.

### Écritures

- création d’une écriture en brouillon ;
- contrôle de l’équilibre débit/crédit ;
- contrôle du journal, de la date et du nombre minimal de lignes ;
- contrôle des comptes connus, quand le référentiel est fourni ;
- refus d’une période clôturée ;
- refus d’une écriture créée dans une autre société ;
- fenêtre fixe de trois corrections récentes par dossier, avec suppression dans l’ordre inverse et verrouillage des anciennes.

### Imputations proposées

Le moteur propose actuellement des règles déterministes pour :

- vente de prestation : 411000 / 706000 ;
- achat de marchandises : 601000 / 401000 ;
- frais bancaires : 627000 / 512000.

Une suggestion renvoie les lignes, la règle utilisée, le motif et un niveau de confiance. Elle ne valide jamais l’écriture à la place de l’utilisateur. Le modèle d’écriture accepte plusieurs lignes au débit et au crédit, à condition de rester équilibré.

### Amortissements

Le noyau calcule un plan linéaire avec :

- valeur brute et valeur résiduelle ;
- durée en mois ;
- mise en service ;
- prorata temporis optionnel ;
- correction d’arrondi sur la dernière période ;
- génération de la dotation d’une période en écriture équilibrée.

Le calcul du plan, la proposition d’écriture et sa validation restent trois étapes séparées.

### Livre journal intégré

Le noyau sait créer et synchroniser une vue intégrée du livre journal par société. Il catégorise les écritures en opérations générales, amortissements automatiques, centralisations, abonnements et résultat de la période. Les catégories automatiques sont routées vers les journaux système `AM`, `AB`, `CT` et `RP`; un utilisateur ne peut pas poster directement dans ces journaux. Une synchronisation remplace une ligne portant le même identifiant au lieu de la dupliquer.

### Paramétrage CSR minimal

Le socle initialise une configuration par société avec le régime comptable, une version du plan SYSCOHADA révisé, les comptes de base et les journaux VE, AC, BQ, CA et OD. Cette liste est un point de départ configurable ; elle devra être remplacée par le référentiel validé du dossier.

L’écran **Configuration → Comptes généraux** permet désormais de rechercher, filtrer, ajouter, modifier de manière contrôlée, importer un plan TXT/CSV et exporter le plan actif.

### Échanges TXT

Le noyau sait déjà :

- parser des fichiers délimités ;
- gérer les guillemets et le BOM UTF-8 ;
- mapper les colonnes source ;
- convertir les montants avec espaces et virgule décimale ;
- contrôler les comptes, dates, montants et équilibre ;
- produire une balance TXT délimitée.

La lecture et l’écriture réelle des classeurs Excel nécessiteront un adaptateur dédié lors du choix de la bibliothèque de tableur. Le prototype UX en représente déjà le parcours.

## Contrat de test

Les règles sont couvertes dans [`prototype/core.test.mjs`](../prototype/core.test.mjs) :

```bash
npm test
```

La suite vérifie :

1. l’isolation et la persistance des sociétés ;
2. la génération du code `SIGLE-YY` ;
3. l’association indépendante des modules à un dossier ;
4. le refus des écritures déséquilibrées ou hors société ;
5. les propositions d’imputation ;
6. la catégorisation et la synchronisation du livre journal intégré ;
7. le calcul linéaire et les arrondis ;
8. le prorata temporis ;
9. l’import et l’export d’une balance TXT.

## Limites assumées de cette tranche

- aucune base SQLite n’est encore branchée ;
- un socle d’authentification locale avec dérivation PBKDF2, session et permissions par société/module est présent dans le prototype ; le serveur d’identité réel et SQLite/Tauri restent à brancher ;
- les règles fiscales béninoises ne sont pas codées ;
- le plan SYSCOHADA livré reste à importer depuis une source validée ;
- les fichiers Excel `.xls`, `.xlsx`, `.xlsm` et `.xlsb` ne sont pas encore lus par le noyau ;
- les méthodes d’amortissement autres que le linéaire ne sont pas activées ;
- aucune écriture ne doit être considérée comme juridiquement ou réglementairement validée par ce prototype.

## Prochaine tranche technique

Après revue de ces invariants, l’étape suivante sera :

1. choisir la bibliothèque de lecture/écriture tableur ;
2. définir le schéma SQLite versionné ;
3. brancher l’assistant d’import à une zone d’attente ;
4. remplacer les données simulées de l’interface par le stockage local ;
5. ajouter les tests de non-régression sur plusieurs sociétés et exercices.
