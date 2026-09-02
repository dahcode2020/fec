# Maquettes UX — version 0.1

**Prototype interactif :** [`../prototype/index.html`](../prototype/index.html)  
**Cible :** TPE béninoise  
**Support :** application de bureau, pensée pour le fonctionnement hors ligne

## Objectif

Cette première maquette permet de valider les parcours des fonctionnalités retenues avant de construire le moteur comptable :

1. gestion multi-sociétés ;
2. association indépendante des modules CSR, GP, GCSF et GC aux dossiers ;
3. propositions d’imputations comptables ;
4. calcul contrôlé des amortissements ;
5. import et export TXT/Excel, ajouté au périmètre lors de l’itération suivante.

Il s’agit d’une maquette fonctionnelle : les données affichées sont simulées, mais les principaux clics et états d’interface sont représentés.

## Parcours disponibles

### 1. Choisir une société

- le sélecteur de société reste visible dans la barre supérieure ;
- deux sociétés de démonstration sont disponibles : Acacia Conseil et Noria Épicerie ;
- le tableau de bord et les montants changent avec la société active ;
- la page **Sociétés & accès** permet d’ajouter une société ;
- les rôles d’une même personne peuvent différer d’une société à l’autre.

### 2. Ouvrir un dossier et choisir un module

- la page « Dossiers en cours » affiche une ligne par module rattaché ;
- un dossier sans module reste visible comme « Aucun module activé » ;
- ouvrir une ligne affiche d’abord l’accueil des modules du dossier ;
- CSR, GP, GCSF et GC sont activables séparément ;
- CSR mène vers l’espace comptable déjà prototypé ;
- GP, GCSF et GC affichent pour l’instant leur espace d’attente dédié.

### 3. Saisir une vente et contrôler l’imputation

- ouvrir **Ventes** ;
- renseigner le client, la date et la prestation ;
- consulter l’écriture suggérée à droite ;
- comprendre l’origine de la suggestion et son niveau de confiance ;
- accepter la proposition ou demander la modification des comptes ;
- conserver l’opération au stade brouillon avant validation.

### 4. Gérer les immobilisations

- ouvrir **Immobilisations** ;
- consulter la valeur brute, l’amorti cumulé et la valeur nette ;
- ajouter un bien avec sa valeur, sa date de mise en service et sa durée ;
- voir le statut « À contrôler » ;
- préparer la dotation de juin ;
- retrouver la dotation proposée dans le journal des opérations diverses.

### 5. Importer une balance ou un livre

- ouvrir **Import / export** ;
- sélectionner le type de document ;
- déposer un fichier ou parcourir l’ordinateur ;
- voir l’étape de correspondance des colonnes ;
- contrôler l’équilibre débit/crédit avant intégration.

La sélection d’un fichier réel ouvre une simulation de l’étape de mapping. Aucun fichier n’est envoyé ni intégré : le prototype fonctionne entièrement dans le navigateur.

### 6. Exporter un état

- ouvrir **Import / export** ;
- choisir **Exporter des états** ;
- sélectionner un format `.xlsx`, `.xls` ou `.txt` ;
- choisir la balance, le grand livre, le livre-journal ou un état d’immobilisations ;
- télécharger l’exemple TXT depuis le prototype.

## Conventions UX testées

- société active toujours visible ;
- séparation claire entre brouillon, suggestion, contrôle et validation ;
- montants en FCFA ;
- imputations présentées sous forme de lignes débit/crédit lisibles ;
- avertissement avant intégration d’un fichier ;
- aucun automatisme comptable silencieux ;
- couleur verte pour les éléments validés, ambre pour les éléments à contrôler et violette pour l’assistance ;
- navigation par tâches plutôt que par jargon comptable.

## Ce qui est volontairement simulé

- persistance des données ;
- authentification et droits réels ;
- calcul réglementaire complet des taxes ;
- calcul définitif des plans d’amortissement ;
- lecture réelle des formats `.xls`, `.xlsx`, `.xlsm` et `.xlsb` ;
- production native de tous les formats Excel ;
- validation comptable et génération définitive des écritures.

Ces éléments seront développés après validation des parcours avec des utilisateurs TPE et un professionnel de la comptabilité au Bénin.

## Critères de test utilisateur

Demander à chaque personne testée de :

1. changer de société sans se tromper de dossier ;
2. trouver la raison d’une imputation suggérée ;
3. identifier ce qui est encore à contrôler ;
4. ajouter une immobilisation et trouver son plan ;
5. importer un fichier et comprendre les colonnes à mapper ;
6. exporter une balance dans le format demandé par son cabinet.

Noter les termes incompris, les hésitations, les erreurs de contexte et les informations manquantes. Le résultat de ces tests servira à figer les écrans avant le démarrage du socle technique.
