# Cahier des charges — application comptable TPE Bénin

**Version :** 0.1  
**Statut :** cadrage fonctionnel et UX  
**Pays pilote :** Bénin  
**Cible initiale :** très petites entreprises et entrepreneurs  
**Canal :** application de bureau, hors ligne par défaut

> Ce document décrit un produit original inspiré des besoins couverts par les logiciels de gestion comptable du marché. Il ne reprend ni leur code, ni leurs écrans, ni leurs éléments protégés. Les règles comptables et fiscales doivent être revues et validées par un expert-comptable ou un conseil local avant toute mise en production.

## 1. Vision du produit

Proposer aux petites entreprises béninoises une application simple qui transforme leurs opérations quotidiennes — ventes, achats, paiements et encaissements — en écritures comptables traçables et en tableaux de bord compréhensibles.

L’application doit masquer la complexité inutile sans contourner les principes fondamentaux : partie double, pièce justificative, chronologie, contrôle, clôture et conservation de la piste d’audit.

### Promesse

> « Je sais ce que mon entreprise a vendu, dépensé, encaissé et doit encore payer, tout en gardant une comptabilité compatible avec le SYSCOHADA. »

### Principes de conception

1. **Simple avant d’être exhaustif** : les écrans sont orientés tâches, pas jargon comptable.
2. **Une opération, une source** : chaque écriture est générée depuis une saisie métier ou documentée manuellement.
3. **Hors ligne d’abord** : aucune connexion permanente ne doit être nécessaire pour travailler.
4. **Contrôlable** : toute écriture validée est retrouvable, justifiée et non altérable silencieusement.
5. **Configurable localement** : le pays, le régime, les taxes et les modèles de documents sont des paramètres, pas des constantes cachées dans le code.
6. **Compatible cabinet** : les exports doivent pouvoir être transmis à un comptable sans retraitement inutile.

## 2. Périmètre de la première version UX

La première livraison n’est pas encore le moteur comptable complet. Elle doit valider les parcours et le vocabulaire avec des utilisateurs béninois.

### Parcours à prototyper

- création d’une entreprise ;
- choix de l’exercice, de la devise et du régime comptable ;
- tableau de bord de trésorerie ;
- création d’un client ou d’un fournisseur ;
- émission d’une facture simple ;
- enregistrement d’un achat ;
- saisie d’un encaissement ou d’un décaissement ;
- consultation du journal ;
- visualisation du solde de caisse et de banque ;
- export d’un état pour le cabinet comptable.

### Hors périmètre du prototype UX

- déclaration fiscale automatisée ;
- télétransmission vers une administration ;
- intégration bancaire en temps réel ;
- paie ;
- multi-site complexe ;
- gestion avancée des stocks ;
- consolidation de groupes ;
- comptabilité analytique avancée ;
- application mobile native.

## 3. MVP fonctionnel après validation UX

### 3.1 Paramétrage de l’entreprise

L’assistant de démarrage recueille :

- raison sociale ou nom commercial ;
- IFU et autres identifiants, facultatifs selon le profil ;
- adresse, téléphone, e-mail et logo ;
- secteur d’activité ;
- exercice comptable ;
- devise principale : XOF/FCFA ;
- régime comptable applicable ;
- paramètres de taxes ;
- comptes de caisse, banque, ventes, achats et taxes par défaut.

Les seuils, taux, mentions obligatoires et règles fiscales sont versionnés dans la configuration et doivent pouvoir être mis à jour sans modifier les écritures historiques.

### 3.2 Référentiel comptable

Le produit doit fournir un référentiel initial basé sur le **SYSCOHADA révisé**, importable et versionné.

Fonctions prévues :

- plan de comptes par entreprise ;
- recherche par numéro ou libellé ;
- comptes auxiliaires clients et fournisseurs ;
- comptes activés/désactivés ;
- comptes favoris pour la saisie rapide ;
- comptes par défaut pour les modèles d’opérations ;
- interdiction de supprimer un compte utilisé dans une écriture ;
- possibilité d’ajouter des sous-comptes selon les règles autorisées.

Le référentiel livré ne doit pas être figé sans validation documentaire. Une table de version permettra de distinguer le plan fourni, les personnalisations de l’entreprise et la version applicable à un exercice donné.

### 3.3 Journaux et écritures

Journaux minimum :

- achats ;
- ventes ;
- banque ;
- caisse ;
- opérations diverses.

Chaque écriture comporte au minimum :

- journal ;
- numéro séquentiel ;
- date comptable ;
- date de saisie ;
- exercice et période ;
- libellé ;
- référence de pièce ;
- lignes de comptes ;
- montants débit et crédit ;
- tiers, si nécessaire ;
- pièce jointe, si disponible ;
- auteur, statut et historique des changements.

Contraintes du moteur :

- une écriture ne peut être validée que si le total débit égale le total crédit ;
- une écriture validée ne peut pas être éditée directement ;
- une correction se fait par extourne, contrepassation ou nouvelle écriture documentée ;
- la numérotation est séquentielle par journal et exercice ;
- une période clôturée refuse toute nouvelle écriture, sauf procédure de réouverture autorisée ;
- les dates hors exercice actif sont bloquées ou explicitement confirmées ;
- les montants sont stockés avec une précision déterminée par la devise, sans erreur d’arrondi flottant.

Statuts : `Brouillon`, `À contrôler`, `Validée`, `Clôturée`, `Extournée`.

### 3.4 Ventes et encaissements

- fiche client ;
- devis facultatif ;
- facture ;
- avoir ;
- encaissement partiel ou total ;
- suivi des factures impayées ;
- duplicata clairement identifié ;
- impression et export PDF ;
- modèles avec identité de l’entreprise et mentions configurables.

Une facture validée génère une proposition d’écriture. L’utilisateur voit les comptes et le montant avant validation, avec la possibilité de corriger le paramétrage autorisé.

### 3.5 Achats et décaissements

- fiche fournisseur ;
- saisie d’une facture fournisseur ;
- ventilation de plusieurs lignes ;
- pièce justificative ;
- paiement partiel ou total ;
- échéance ;
- proposition d’écriture ;
- état des dettes fournisseurs.

### 3.6 Caisse et banque

- comptes de trésorerie ;
- entrées et sorties ;
- solde courant ;
- transfert caisse-banque ;
- import de relevé dans un format documenté ;
- rapprochement manuel dans un second jalon ;
- historique des opérations ;
- alerte de caisse négative, configurable selon le besoin.

### 3.7 États et exports

MVP :

- grand livre ;
- balance ;
- journal par période ;
- livre des ventes ;
- livre des achats ;
- situation clients ;
- situation fournisseurs ;
- synthèse recettes/dépenses ;
- évolution de trésorerie ;
- export CSV/XLSX ;
- export PDF imprimable.

Les états financiers SYSCOHADA complets seront livrés après validation du régime comptable et des données nécessaires. L’application doit néanmoins préparer une structure d’export compatible avec le travail du professionnel chargé de l’arrêté des comptes.

## 4. Utilisateurs et droits

### Profil TPE

- **Propriétaire/administrateur** : paramétrage, utilisateurs, clôture et consultation globale.
- **Opérateur** : saisie des ventes, achats et mouvements de trésorerie.
- **Contrôleur ou comptable** : contrôle, validation, extourne et exports.
- **Lecture seule** : consultation et impression.

Le premier prototype peut simuler ces rôles avec un seul utilisateur, mais le modèle de données doit prévoir les permissions dès le départ.

## 5. Écrans du prototype UX

1. **Onboarding** — créer son entreprise en moins de cinq minutes.
2. **Accueil** — solde caisse/banque, ventes, dépenses, impayés et alertes.
3. **Action rapide** — vendre, acheter, encaisser, payer, saisir une opération.
4. **Vente** — client, lignes, taxe, échéance, aperçu et validation.
5. **Achat** — fournisseur, pièce, ventilation et paiement.
6. **Trésorerie** — mouvements, solde et filtres.
7. **Journal** — écritures, statuts, recherche et détail de la piste d’audit.
8. **Tiers** — fiches et soldes clients/fournisseurs.
9. **Rapports** — états, période, export et impression.
10. **Paramètres** — entreprise, plan comptable, taxes, journaux, utilisateurs et sauvegarde.

### Règles UX

- français clair, avec aide contextuelle ;
- termes métier affichés progressivement ;
- montants toujours accompagnés de la devise ;
- distinction visuelle forte entre brouillon et validation ;
- confirmation avant action irréversible ;
- recherche globale ;
- filtres par période, journal, tiers et statut ;
- interface utilisable au clavier ;
- affichage correct sur les écrans d’ordinateur courants ;
- mode sombre non prioritaire pour le MVP.

## 6. Modèle de données conceptuel

Entités principales :

- `Organization` : entreprise utilisatrice ;
- `FiscalYear` et `AccountingPeriod` : exercices et périodes ;
- `User`, `Role`, `Permission` ;
- `AccountPlan`, `Account` et `AccountVersion` ;
- `Journal` et `EntryNumberSequence` ;
- `JournalEntry` et `JournalEntryLine` ;
- `Customer`, `Supplier` et `ThirdPartyLedger` ;
- `Quote`, `Invoice`, `CreditNote`, `PurchaseBill` ;
- `Payment`, `CashAccount`, `BankAccount` ;
- `TaxCode` et `TaxRateVersion` ;
- `Attachment` ;
- `AuditEvent` ;
- `ReportDefinition` et `ExportJob`.

### Invariants à tester

- équilibre débit/crédit ;
- unicité de la référence d’écriture dans son journal ;
- impossibilité de modifier une écriture validée ;
- appartenance de toutes les données à une entreprise ;
- interdiction de poster dans une période clôturée ;
- cohérence entre facture, règlement et solde du tiers ;
- conservation de l’auteur et de la date de chaque événement ;
- total des lignes d’une facture cohérent avec son total affiché.

## 7. Architecture recommandée

Pour une application de bureau hors ligne destinée aux TPE :

- **shell desktop** : Tauri ;
- **interface** : React + TypeScript ;
- **base locale** : SQLite ;
- **migrations** : versionnées et exécutées au démarrage ;
- **validation métier** : moteur partagé, indépendant de l’interface ;
- **exports** : PDF et tableurs ;
- **sauvegarde** : fichier chiffré ou archive chiffrée, avec sauvegarde manuelle puis automatique ;
- **synchronisation future** : service optionnel, sans rendre la saisie locale dépendante du réseau.

Cette proposition reste révisable après les premiers tests UX. Le moteur comptable doit être isolé afin de pouvoir être testé sans lancer l’interface.

## 8. Sécurité, sauvegarde et conformité

- mot de passe local protégé par dérivation sécurisée ;
- verrouillage automatique après inactivité ;
- chiffrement des sauvegardes ;
- restauration testable et vérifiée ;
- journal d’audit non modifiable depuis l’interface ;
- séparation entre suppression d’un brouillon et annulation d’une écriture validée ;
- export de toutes les données de l’entreprise ;
- information claire sur les données collectées ;
- aucun envoi vers un serveur distant sans consentement explicite ;
- sauvegarde avant migration de schéma ou mise à jour majeure.

La conformité juridique, fiscale, comptable et relative aux données personnelles devra être confirmée avec un conseil compétent au Bénin. Le logiciel ne doit pas être présenté comme une certification officielle sans base réglementaire vérifiée.

## 9. Critères d’acceptation du prototype UX

Le prototype est validé lorsqu’un utilisateur cible peut, sans formation longue :

1. créer son entreprise et ouvrir un exercice ;
2. créer un client ;
3. enregistrer une vente et voir son impact sur la trésorerie ou la créance ;
4. enregistrer un achat et un paiement ;
5. retrouver les opérations dans le journal ;
6. comprendre la différence entre brouillon et validé ;
7. consulter le montant restant dû par un client ;
8. exporter une synthèse sur une période ;
9. identifier clairement les erreurs bloquantes ;
10. restaurer ou demander une sauvegarde de ses données.

Tests qualitatifs recommandés : cinq à huit utilisateurs TPE, un opérateur de saisie et au moins un professionnel de la comptabilité. Les termes incompris et les étapes abandonnées doivent être consignés avant le développement du moteur complet.

## 10. Roadmap proposée

### Phase 1 — cadrage et UX

- entretiens utilisateurs ;
- inventaire des pièces et pratiques locales ;
- architecture de l’information ;
- wireframes ;
- prototype haute fidélité ;
- test utilisateur et corrections.

### Phase 2 — socle local

- initialisation Tauri/React/TypeScript ;
- schéma SQLite et migrations ;
- entreprises, exercices, périodes et utilisateurs ;
- référentiel de comptes importable ;
- moteur débit/crédit ;
- sauvegarde/restauration.

### Phase 3 — flux métier

- tiers ;
- ventes et achats ;
- caisse et banque ;
- génération d’écritures ;
- journal, grand livre et balance ;
- exports.

### Phase 4 — validation métier et pilote

- revue par expert-comptable ;
- tests sur jeux de données réalistes ;
- corrections d’arrondi, dates, taxes et numérotation ;
- pilote auprès de quelques TPE béninoises ;
- documentation et support.

### Phase 5 — extensions

- immobilisations ;
- rapprochement bancaire ;
- stocks ;
- analytique ;
- synchronisation multi-postes ;
- espace cabinet ;
- application mobile compagnon.

## 11. Décisions à prendre avant le développement

- régime comptable à couvrir en premier ;
- règles et taux de taxes à faire valider ;
- format des pièces et mentions de facture ;
- compatibilité Windows uniquement ou Windows/macOS/Linux ;
- possibilité de travailler à plusieurs sur une même entreprise ;
- politique de sauvegarde et de récupération ;
- rôle exact du cabinet comptable ;
- nom, identité visuelle et positionnement commercial.

## 12. Première tâche recommandée

Produire les maquettes de quatre flux :

1. onboarding de l’entreprise ;
2. tableau de bord ;
3. saisie d’une vente ;
4. journal et détail d’une écriture.

Ces flux couvrent la promesse principale tout en permettant de valider le vocabulaire et le niveau de simplicité avant d’investir dans les règles comptables complètes.
