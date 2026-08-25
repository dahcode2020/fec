# Authentification et page des dossiers

**Version :** 0.1  
**Statut :** maquette interactive  
**Parcours :** authentification → dossiers en cours → ouverture d’une société

## Objectif

Après son identification, l’utilisateur ne doit pas arriver directement dans une société choisie arbitrairement. Il arrive d’abord sur une page de sélection qui répertorie les dossiers comptables disponibles dans son espace de travail.

Un dossier correspond à une société et à son contexte comptable : exercice, période, plan SYSCOHADA, sessions et état du dossier.

## Parcours cible

1. l’utilisateur saisit son adresse e-mail et son mot de passe ;
2. l’authentification est vérifiée ;
3. l’application affiche **Dossiers en cours** ;
4. l’utilisateur recherche ou sélectionne une entreprise ;
5. il consulte les informations du dossier ;
6. il clique sur **Ouvrir** ;
7. l’application affiche la page de choix des modules ;
8. l’utilisateur ouvre un module déjà activé ou active un nouveau module ;
9. le logiciel ouvre l’espace métier du module dans le contexte de cette société.

La sélection du dossier est obligatoire pour éviter qu’une écriture soit saisie dans la mauvaise société.

## Dossier et modules

Un dossier peut exister sans module activé. Les modules sont ensuite rattachés séparément : **CSR**, **GP**, **GCSF** et **GC**.

La liste affiche une ligne par association dossier-module. Ainsi, si le dossier `ACACIA-25` utilise CSR et GCSF, il apparaît deux fois : une ligne pour CSR et une ligne pour GCSF. Une entreprise sans module conserve une ligne « Aucun module activé » pour permettre sa configuration.

L’ouverture d’une ligne ne lance pas immédiatement un module métier. Elle ouvre d’abord une page de choix présentant les modules activés pour ce dossier. Les modules non activés y sont visibles comme options d’activation. Chaque module possède ensuite son espace séparé.

Le partage des données entre modules est sélectif et sera configurable : les données d’identité, les utilisateurs et les droits peuvent constituer le socle commun, tandis que les données comptables, de paie, commerciales et de courrier restent séparées par défaut.

## Formulaire « Nouveau dossier »

Depuis la page **Dossiers en cours**, le bouton **Nouveau dossier** ouvre un formulaire composé des éléments suivants :

- nom de la société ;
- forme juridique : SARL, SA, SAS, ETS ou Autres ;
- adresse ;
- IFU ;
- activité principale ;
- code ou sigle à afficher dans la liste des dossiers ;
- date de début de l’exercice ;
- date de fin de l’exercice.

Le code visible dans la liste est généré automatiquement sous la forme `SIGLE-YY`, où `YY` correspond aux deux derniers chiffres de l’année de début de l’exercice. Ainsi :

- `ACACIA` + exercice commençant en 2025 → `ACACIA-25` ;
- `ACACIA` + exercice commençant en 2026 → `ACACIA-26`.

Le formulaire affiche le résultat en temps réel avant création. La fin de l’exercice doit être postérieure au début et le code généré doit être unique dans l’espace de travail.

### Tableau principal

Colonnes prévues :

- **Dossier** : identifiant lisible du dossier ;
- **Module** : CSR, GP, GCSF ou GC associé au dossier ;
- **Société** : raison sociale et activité ;
- **Période** : exercice couvert ;
- **Sessions** : sessions ouvertes ou disponibles ;
- **État** : actif, disponible, à contrôler, archivé.

La ligne sélectionnée est clairement mise en évidence. La page indique également qu’aucune donnée ne sera mélangée entre deux sociétés.

### Actions du dossier

- **Ouvrir** : démarre la session dans la société choisie ;
- **Dupliquer** : crée une copie de travail, sans remplacer le dossier original ;
- **Sauvegarder** : prépare une sauvegarde locale ;
- **Supprimer** : archive le dossier et conserve son historique ;
- **Positionner** : sera étudié pour le classement ou l’ordre d’affichage ;
- **Actualiser** : recharge la liste ;
- **Restaurer une sauvegarde** : sera branché au stockage local dans le prochain jalon.

La suppression définitive n’est pas l’action par défaut. L’interface utilise l’archivage pour protéger l’historique comptable.

### Informations complémentaires

La page affiche pour le dossier sélectionné :

- dernière sauvegarde ;
- poste et utilisateur de la sauvegarde ;
- emplacement de sauvegarde ;
- dernière modification ;
- utilisateur et heure de modification ;
- mode de fonctionnement du dossier.

## Maquette interactive disponible

La maquette se trouve dans [`../prototype/index.html`](../prototype/index.html).

Le parcours de démonstration est le suivant :

1. utiliser le formulaire prérempli ;
2. cliquer sur **Accéder à mes dossiers** ;
3. sélectionner Acacia Conseil ou Noria Épicerie ;
4. tester la recherche et les actions ;
5. cliquer sur **Ouvrir** pour rejoindre le tableau de bord ;
6. utiliser le bouton de déconnexion du tableau de bord pour revenir à l’authentification.

Le bouton « Nouveau dossier » permet également de vérifier le parcours d’ajout depuis cette page. Les données restent simulées en mémoire dans cette maquette.

## Règles de sécurité à conserver dans le produit réel

- l’utilisateur ne voit que les dossiers pour lesquels il possède une autorisation ;
- la société choisie doit être conservée dans le contexte de session ;
- toute requête métier devra vérifier le `company_id` actif ;
- le dossier archivé ne doit pas être ouvert en modification ;
- une session ouverte dans une société ne doit pas exposer les données d’une autre ;
- les actions de duplication, archivage et restauration seront tracées ;
- le mot de passe ne devra jamais être stocké en clair ;
- la récupération du mot de passe sera traitée avec l’authentification réelle, pas dans la maquette ;
- le prototype distingue désormais l’utilisateur courant, son rôle et ses droits par société/module ;
- les opérations sensibles CSR refusent une action lorsque le rôle ne possède pas la permission correspondante.

## Limites actuelles

- l’identification est une simulation locale ;
- il n’y a pas encore de serveur d’authentification ;
- les sessions ne sont pas persistées ;
- les sauvegardes et restaurations sont représentées par des notifications ;
- les droits réels par utilisateur et par société seront implémentés avec le modèle de données et SQLite.
