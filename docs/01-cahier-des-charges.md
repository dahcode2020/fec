# Cahier des charges — application comptable TPE Bénin

**Version :** 0.2
**Statut :** cadrage fonctionnel et UX — multi-sociétés, imputations et amortissements automatiques intégrés
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
7. **Multi-sociétés maîtrisé** : un même utilisateur peut gérer plusieurs sociétés, sans mélange de leurs écritures, paramètres, exercices ou pièces.
8. **Assistance sans automatisme aveugle** : les imputations proposées et les amortissements calculés sont toujours prévisualisables, explicables et contrôlables.

## 2. Périmètre de la première version UX

La première livraison n’est pas encore le moteur comptable complet. Elle doit valider les parcours et le vocabulaire avec des utilisateurs béninois.

### Parcours à prototyper

- création d’un espace de travail et d’une première société ;
- ajout d’une deuxième société et changement de société active ;
- choix de l’exercice, de la devise et du régime comptable par société ;
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

- nom de la société ;
- forme juridique : SARL, SA, SAS, ETS ou Autres ;
- adresse ;
- IFU et autres identifiants ;
- activité principale ;
- code ou sigle du dossier ;
- période d’exercice, avec date de début et date de fin ;
- téléphone, e-mail et logo, dans une étape complémentaire ;
- exercice comptable ;
- devise principale : XOF/FCFA ;
- régime comptable applicable ;
- paramètres de taxes ;
- comptes de caisse, banque, ventes, achats et taxes par défaut.

Le code affiché dans la liste des dossiers est généré à partir du code ou sigle saisi et de l’année de début de l’exercice : `SIGLE-YY`. Par exemple, un sigle `ACACIA` avec un exercice commençant en 2025 devient `ACACIA-25`. Si l’utilisateur ouvre un exercice commençant en 2026, le suffixe devient automatiquement `-26`. Le code généré est prévisualisé avant la création et doit rester unique dans l’espace de travail.

Les seuils, taux, mentions obligatoires et règles fiscales sont versionnés dans la configuration et doivent pouvoir être mis à jour sans modifier les écritures historiques.

### 3.1.1 Gestion multi-sociétés

L’application est organisée autour d’un espace de travail local pouvant contenir plusieurs sociétés juridiquement distinctes. La multi-sociétés est une capacité du socle, et non une extension ultérieure.

Fonctions prévues :

- créer, modifier, archiver et sélectionner une société ;
- afficher en permanence la société active dans l’interface ;
- passer d’une société à l’autre sans se déconnecter ;
- attribuer à chaque utilisateur un rôle différent selon la société ;
- isoler strictement les écritures, comptes, journaux, tiers, exercices, taxes, immobilisations, pièces et paramètres par société ;
- définir un plan comptable propre à chaque société, à partir d’un modèle SYSCOHADA importable ;
- gérer une numérotation indépendante des journaux et des pièces pour chaque société ;
- afficher les tableaux de bord et états d’une seule société par défaut ;
- exporter une société seule ou sauvegarder l’ensemble de l’espace de travail ;
- archiver une société sans supprimer son historique.

Le prototype peut limiter l’espace à deux sociétés de test, mais tous les écrans et toutes les données doivent porter explicitement un `company_id`. Aucun compte, tiers ou mouvement ne doit pouvoir être sélectionné depuis une autre société. La consolidation et les écritures inter-sociétés sont hors périmètre du premier MVP : elles seront étudiées séparément pour éviter de confondre multi-dossiers et consolidation de groupe.

### 3.1.2 Modules associés aux dossiers

Le logiciel est une suite composée de modules conçus et livrés séparément :

- **CSR** — Comptabilité SYSCOHADA Révisé ;
- **GP** — Gestion de Paie ;
- **GCSF** — Gestion Commerciale, Stocks et Facturation ;
- **GC** — Gestion de Courrier.

Une société possède un dossier de travail, mais un module n’est pas activé automatiquement par défaut. Depuis la page des dossiers, l’utilisateur pourra rattacher indépendamment un ou plusieurs modules au dossier.

Règles de fonctionnement :

- création du dossier sans module obligatoire ;
- activation séparée de CSR, GP, GCSF et GC ;
- possibilité d’avoir un seul module ou les quatre sur la même société ;
- une association `DossierModule` possède son propre état, ses paramètres, ses autorisations et, si nécessaire, sa période métier ;
- la page « Dossiers en cours » affiche une ligne par association dossier-module ;
- un dossier sans module reste visible sur une ligne « Aucun module activé » afin de permettre sa configuration ;
- l’ouverture d’un dossier affiche d’abord une page de choix des modules activés ;
- les modules non activés sont visibles comme options activables, sans exposer leur espace métier ;
- aucun module ne peut créer d’écriture, de bulletin, de mouvement de stock ou de courrier dans le contexte d’un autre module.

Le partage de données sera sélectif et paramétrable. L’identité de la société, ses utilisateurs et les règles d’accès constituent le socle commun. Les données sensibles ou métier — écritures CSR, bulletins GP, mouvements GCSF et courriers GC — restent séparées, sauf partage explicitement autorisé et tracé.

Les périodes sont propres aux usages : exercice comptable pour CSR, périodes de paie pour GP, périodes commerciales pour GCSF et dates de suivi pour GC. La période affichée dans la liste sera celle du dossier ou du module sélectionné.

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

### 3.2.1 Propositions d’imputations comptables

La saisie doit être guidée par des opérations compréhensibles — par exemple « achat de fournitures », « loyer », « frais bancaires », « vente de marchandises » ou « acquisition d’un équipement » — plutôt que d’exiger la connaissance immédiate de tous les numéros de comptes.

Pour chaque opération, l’application propose une imputation débit/crédit à vérifier avant validation. La suggestion peut s’appuyer sur :

- la catégorie choisie par l’utilisateur ;
- le type d’opération et le journal ;
- le client, le fournisseur ou le bénéficiaire ;
- l’article ou le service ;
- le code de taxe et le régime configurés ;
- un modèle d’écriture ;
- une imputation précédemment acceptée pour une opération similaire ;
- les comptes favoris de la société.

La première version utilisera des règles explicites et déterministes, plutôt qu’une décision opaque par intelligence artificielle. Chaque proposition doit afficher :

- les comptes et libellés proposés ;
- les montants débit et crédit ;
- la taxe appliquée et sa base ;
- la raison de la suggestion (« modèle fournisseur », « catégorie », « dernière imputation validée », etc.) ;
- les éventuelles informations manquantes ;
- un niveau de confiance indicatif, sans le présenter comme une validation comptable.

L’utilisateur pourra modifier les comptes, enregistrer la correction comme préférence et valider ensuite. Par défaut, une suggestion ne génère jamais automatiquement une écriture validée. Un utilisateur habilité pourra créer des modèles réutilisables avec plusieurs lignes, des règles de taxe, un compte de tiers et un compte de règlement.

Priorité de résolution recommandée : règle spécifique au fournisseur ou au client, règle liée à l’article/service, modèle de catégorie, préférence de la société, puis suggestion issue de l’historique. En cas de conflit, l’application signale le conflit et demande un choix au lieu de choisir silencieusement.

Les imputations proposées et les corrections de l’utilisateur sont conservées dans l’audit, afin de distinguer la suggestion du choix finalement validé.

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

### 3.7 Immobilisations et amortissements automatiques

L’utilisateur pourra enregistrer une immobilisation une seule fois, puis laisser l’application calculer et proposer les dotations périodiques. Cette fonction doit réduire les erreurs de calcul sans rendre automatique une décision comptable non contrôlée.

#### Fiche d’immobilisation

Chaque fiche comportera notamment :

- numéro ou code interne de l’immobilisation ;
- désignation et catégorie ;
- société propriétaire ;
- fournisseur et référence de la pièce ;
- date d’acquisition ;
- date de mise en service ;
- valeur d’origine ;
- valeur résiduelle, si applicable ;
- durée d’utilisation ;
- méthode d’amortissement ;
- compte d’immobilisation ;
- compte d’amortissement cumulé ;
- compte de dotation ;
- centre ou axe analytique, lorsque cette fonction sera activée ;
- pièce justificative ;
- statut : `À préparer`, `En service`, `Totalement amortie`, `Cédée` ou `Mise au rebut`.

#### Calcul et génération

- calcul automatique du plan d’amortissement à partir des paramètres saisis ;
- méthode linéaire disponible en premier ;
- méthodes supplémentaires uniquement après validation des règles applicables au régime choisi ;
- périodicité mensuelle ou annuelle, configurable ;
- prorata temporis configurable selon la politique comptable validée ;
- affichage du tableau avant toute génération d’écriture ;
- possibilité de simuler une date de mise en service ou une durée modifiée avant validation ;
- arrondis gérés de façon déterministe, avec régularisation sur la dernière période ;
- génération en lot des dotations des périodes ouvertes ;
- une seule dotation générée par immobilisation, période et version de plan ;
- rattachement de chaque dotation à l’immobilisation et à la pièce d’origine ;
- proposition de l’écriture dans le journal des opérations diverses, avec contrôle débit/crédit avant validation ;
- recalcul interdit sur une période clôturée ; toute modification après validation produit une régularisation ou une contrepassation documentée ;
- aperçu de la valeur nette comptable, du cumul amorti et du reliquat à amortir.

Le moteur doit séparer le **calcul du plan**, la **proposition de l’écriture** et la **validation comptable**. Une dotation ne sera jamais postée silencieusement. Les paramètres modifiés, le plan initial, les recalculs et les écritures générées seront conservés dans la piste d’audit.

Les cessions, mises au rebut, dépréciations et changements de méthode devront respecter une procédure dédiée et seront soumis à validation métier avant d’être activés dans le produit.

### 3.8 États et exports

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
- état des immobilisations ;
- tableau des amortissements par immobilisation et par période ;
- dotations générées, à contrôler et validées ;
- export TXT, CSV et formats Excel ;
- export PDF imprimable.

### 3.8.1 Import et export TXT / Excel

L’application devra permettre d’échanger les balances et les livres comptables avec un cabinet, une ancienne solution ou un tableur, sans ressaisie manuelle. Les fichiers sont toujours rattachés à la société active, à un exercice et à une période explicitement choisis.

#### Documents concernés

- balance générale ;
- balance auxiliaire clients ;
- balance auxiliaire fournisseurs ;
- grand livre ;
- livre-journal ;
- journaux par période ;
- livre des ventes ;
- livre des achats ;
- livre de caisse et livre de banque ;
- état des immobilisations et tableau des amortissements.

#### Formats texte

L’import et l’export TXT accepteront :

- fichier délimité par tabulation, point-virgule, virgule ou barre verticale ;
- fichier à largeur fixe, avec définition des positions de colonnes ;
- encodages UTF-8, UTF-8 avec BOM, ISO-8859-1 et Windows-1252 ;
- fins de ligne Windows, Linux ou macOS ;
- séparateurs décimaux virgule ou point ;
- séparateurs de milliers configurables ;
- plusieurs formats de date configurables ;
- présence ou absence d’une ligne d’en-tête ;
- valeurs négatives avec signe `-` ou entre parenthèses.

L’application détectera les paramètres probables, mais l’utilisateur pourra les confirmer et les enregistrer dans un profil d’import/export réutilisable.

#### Formats Excel et tableurs

Objectif de compatibilité avec les principaux formats de classeurs Excel :

- `.xlsx` — format d’échange principal, à l’import comme à l’export ;
- `.xls` — ancien format Excel, pour compatibilité avec les fichiers existants ;
- `.xlsm` — classeur avec macros, importé sans exécuter ni conserver de code dangereux ;
- `.xlsb` — classeur binaire, importé lorsque le connecteur disponible le permet ;
- `.xltx` et `.xltm` — modèles Excel, traités comme des classeurs de données, sans exécuter de macros ;
- `.csv` — format texte compatible avec Excel, avec choix du séparateur et de l’encodage ;
- `.ods` — format tableur ouvert utile pour les échanges hors Excel.

Le format `.xlsx` restera le format canonique de sortie. Si un format historique ou binaire ne peut pas être réémis sans perte, l’application devra l’indiquer clairement et proposer une sortie `.xlsx` ou `.txt` équivalente. Aucun fichier importé ne devra exécuter de macro, de formule externe ou de contenu actif.

Les exports Excel contiendront au minimum :

- une feuille de présentation lisible ;
- une feuille de données brutes exploitable par un cabinet ;
- les critères utilisés : société, exercice, période, journal et statut ;
- les totaux débit et crédit ;
- la date de génération et la version du format ;
- les numéros de compte conservés comme texte lorsqu’ils comportent des zéros significatifs.

Pour les volumes dépassant les limites d’une feuille Excel, le logiciel créera plusieurs feuilles ou plusieurs fichiers numérotés, avec un récapitulatif de contrôle.

#### Parcours d’import contrôlé

1. choisir la société, l’exercice, la période et le type de document ;
2. sélectionner le fichier TXT ou tableur ;
3. détecter ou définir l’encodage, les colonnes, les séparateurs et les formats ;
4. associer les colonnes source aux champs comptables ;
5. mapper les comptes, journaux, tiers et taxes inconnus ;
6. afficher un aperçu des lignes et des écritures qui seraient créées ;
7. exécuter les contrôles d’équilibre, de date, de doublon, de période et de compte ;
8. placer les données dans une zone d’attente ;
9. demander une validation explicite avant l’intégration au journal.

L’import d’une balance pourra servir à reprendre des à-nouveaux ou des soldes d’ouverture. Il ne devra jamais écraser silencieusement une balance existante. L’import d’un livre ne créera des écritures que si les colonnes nécessaires sont présentes ; sinon, le fichier sera conservé comme archive consultable et l’utilisateur sera averti qu’il ne constitue pas une écriture comptable exploitable.

Les doublons seront recherchés au moyen de la référence, du journal, de la date, du compte, du montant et d’une empreinte du fichier. L’utilisateur pourra exclure une ligne, corriger son mapping ou annuler toute la prévisualisation avant validation.

#### Parcours d’export contrôlé

L’utilisateur pourra sélectionner :

- une société ou un espace complet, avec confirmation ;
- un exercice et une période ;
- un ou plusieurs journaux ;
- les écritures brouillon, validées ou clôturées selon ses droits ;
- le type d’état ;
- le format et le profil de colonnes.

Chaque export conservera sa configuration, son auteur, sa date, son périmètre et son empreinte dans la piste d’audit. Il sera impossible d’exporter par erreur les données d’une autre société depuis le contexte actif.

Les états financiers SYSCOHADA complets seront livrés après validation du régime comptable et des données nécessaires. L’application doit néanmoins préparer une structure d’export compatible avec le travail du professionnel chargé de l’arrêté des comptes.

## 4. Utilisateurs et droits

### Profil TPE

- **Propriétaire/administrateur** : paramétrage, utilisateurs, clôture et consultation globale.
- **Opérateur** : saisie des ventes, achats et mouvements de trésorerie.
- **Contrôleur ou comptable** : contrôle, validation, extourne et exports.
- **Lecture seule** : consultation et impression.

Le premier prototype peut simuler ces rôles avec un seul utilisateur, mais le modèle de données doit prévoir les permissions dès le départ. Les droits sont portés par une relation utilisateur-société : un même utilisateur peut être administrateur d’une société et simple lecteur d’une autre.

## 5. Écrans du prototype UX

1. **Onboarding** — créer un espace de travail et sa première société en moins de cinq minutes.
2. **Sélecteur de société** — société active, ajout, archivage et changement sécurisé.
3. **Dossiers en cours** — identifier les dossiers et leurs associations aux modules.
4. **Choix du module** — CSR, GP, GCSF ou GC activé pour le dossier sélectionné.
5. **Accueil CSR** — solde caisse/banque, ventes, dépenses, impayés et alertes comptables.
6. **Saisie et insertion** — enregistrer une opération, suivre l’imputation en temps réel et l’insérer dans le brouillard.
7. **Action rapide** — vendre, acheter, encaisser, payer, saisir une opération.
8. **Vente** — client, lignes, taxe, échéance, aperçu et validation.
9. **Achat** — fournisseur, pièce, ventilation et paiement.
10. **Trésorerie** — mouvements, solde et filtres.
11. **Journal** — écritures, statuts, recherche et détail de la piste d’audit.
12. **Tiers** — fiches et soldes clients/fournisseurs.
13. **Immobilisations** — registre, fiche, plan d’amortissement et dotations à valider.
14. **Rapports** — états, période, société, export et impression.
15. **Import / export** — assistant TXT/Excel, profils de colonnes, aperçu, contrôles et historique.
16. **Fichier CSR** — dossiers, sauvegardes, restaurations et échanges ;
17. **Configuration CSR** — société, exercice, comptes généraux, tiers, journaux, taxes, immobilisations, imputations, trésorerie, utilisateurs, documents et sauvegarde.

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

- `Workspace` : espace de travail local ;
- `Company` : société juridique, toujours rattachée à un espace ;
- `Dossier` : contexte de travail identifiable d’une société et d’un exercice ;
- `ModuleDefinition` : catalogue des modules CSR, GP, GCSF et GC ;
- `DossierModule` : association d’un module à un dossier, avec état, session et paramètres propres ;
- `ModuleSettings` : configuration métier propre à une association dossier-module ;
- `DataSharingPolicy` : règles de partage explicite entre modules ;
- `CompanyMembership` : accès d’un utilisateur à une société et rôle associé ;
- `CompanySettings` : devise, régime, taxes, paramètres de numérotation et préférences ;
- `FiscalYear` et `AccountingPeriod` : exercices et périodes, rattachés à une société ou à un module ;
- `User`, `Role`, `Permission` ;
- `AccountPlan`, `Account`, `AccountVersion` et `PostingRule` ;
- `Journal` et `EntryNumberSequence`, propres à chaque société ;
- `JournalEntry` et `JournalEntryLine` ;
- `Customer`, `Supplier` et `ThirdPartyLedger`, propres à chaque société ;
- `Quote`, `Invoice`, `CreditNote`, `PurchaseBill` ;
- `Payment`, `CashAccount`, `BankAccount` ;
- `TaxCode` et `TaxRateVersion` ;
- `FixedAsset`, `DepreciationPlan` et `DepreciationRun` ;
- `Attachment` et `SourceFile` ;
- `ImportProfile` et `ImportJob` ;
- `ExportProfile` et `ExportJob` ;
- `AuditEvent` ;
- `ReportDefinition`.

### Invariants à tester

- équilibre débit/crédit ;
- unicité de la référence d’écriture dans son journal et sa société ;
- impossibilité de modifier une écriture validée ;
- appartenance de toutes les données à une et une seule société ;
- appartenance de chaque donnée métier au bon module quand elle n’est pas explicitement partagée ;
- impossibilité de créer une écriture avec des comptes, tiers ou journaux d’une autre société ;
- impossibilité d’utiliser un module non activé pour le dossier ;
- accès d’un utilisateur limité aux sociétés et modules qui lui sont attribués ;
- interdiction de poster dans une période clôturée ;
- cohérence entre facture, règlement et solde du tiers ;
- conservation de l’auteur et de la date de chaque événement ;
- total des lignes d’une facture cohérent avec son total affiché ;
- unicité d’une dotation par immobilisation et période ;
- total du plan d’amortissement cohérent avec la base amortissable ;
- cumul amorti jamais supérieur à la base amortissable, sauf régularisation explicitement tracée ;
- fichier importé conservé avec son profil, son empreinte et son résultat de contrôle ;
- import impossible dans une période clôturée sans procédure de réouverture ;
- balance importée équilibrée avant intégration ;
- export reproductible à périmètre identique et identifiable dans l’audit.

## 7. Architecture recommandée

Pour une application de bureau hors ligne destinée aux TPE :

- **shell desktop** : Tauri ;
- **interface** : React + TypeScript ;
- **base locale** : SQLite, avec séparation logique stricte par `company_id` ;
- **migrations** : versionnées et exécutées au démarrage ;
- **validation métier** : moteur partagé, indépendant de l’interface ;
- **noyau commun** : sociétés, dossiers, utilisateurs, permissions, sessions et politiques de partage ;
- **modules isolés** : CSR, GP, GCSF et GC, chacun avec ses écrans, règles métier et migrations ;
- **moteur d’assistance** : règles d’imputation, modèles d’écriture et calcul d’amortissement testables indépendamment dans CSR ;
- **moteur d’échange** : lecteurs/écrivains TXT, CSV, XLSX et adaptateurs de compatibilité pour les formats Excel historiques ;
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
- export des données d’une société, avec option de sauvegarde complète de l’espace de travail ;
- avertissement clair lors d’un changement de société avec saisie non enregistrée ;
- information claire sur les données collectées ;
- aucun envoi vers un serveur distant sans consentement explicite ;
- sauvegarde avant migration de schéma ou mise à jour majeure ;
- neutralisation des macros, liens externes, formules exécutables et contenus actifs à l’import ;
- analyse de taille et de structure des fichiers afin d’éviter qu’un import ne bloque l’application ;
- confirmation explicite avant import massif ou export de plusieurs sociétés.

La conformité juridique, fiscale, comptable et relative aux données personnelles devra être confirmée avec un conseil compétent au Bénin. Le logiciel ne doit pas être présenté comme une certification officielle sans base réglementaire vérifiée.

## 9. Critères d’acceptation du prototype UX

Le prototype est validé lorsqu’un utilisateur cible peut, sans formation longue :

1. créer un espace de travail, sa première société et ouvrir un exercice ;
2. ajouter une seconde société, passer sur celle-ci, puis revenir à la première sans mélange de données ;
3. créer un client et un fournisseur dans la société active ;
4. enregistrer une vente et voir son impact sur la trésorerie ou la créance ;
5. recevoir une proposition d’imputation, comprendre son origine et la modifier avant validation ;
6. enregistrer un achat et un paiement ;
7. créer une immobilisation et visualiser un plan d’amortissement calculé automatiquement ;
8. générer une dotation sur une période ouverte, contrôler l’écriture proposée et la valider ;
9. retrouver les opérations dans le journal de la bonne société ;
10. comprendre la différence entre brouillon, proposition, validé et clôturé ;
11. consulter le montant restant dû par un client ;
12. importer une balance ou un livre depuis un fichier TXT ou Excel, mapper les colonnes et corriger les erreurs dans la prévisualisation ;
13. refuser une balance déséquilibrée ou un doublon avant son intégration ;
14. exporter une balance et un livre au format TXT, XLSX et dans un format Excel de compatibilité ;
15. constater qu’un fichier Excel avec macros est traité sans exécuter son contenu actif ;
16. exporter une synthèse sur une période et une société données ;
17. identifier clairement les erreurs bloquantes ;
18. restaurer ou demander une sauvegarde de ses données.

Tests qualitatifs recommandés : cinq à huit utilisateurs TPE, un opérateur de saisie et au moins un professionnel de la comptabilité. Les termes incompris et les étapes abandonnées doivent être consignés avant le développement du moteur complet.

## 10. Roadmap proposée

### Phase 1 — cadrage et UX

- entretiens utilisateurs ;
- inventaire des pièces et pratiques locales ;
- architecture de l’information ;
- parcours multi-sociétés et sélecteur de société ;
- wireframes ;
- prototype haute fidélité des propositions d’imputation, du registre des immobilisations et de l’assistant TXT/Excel ;
- test utilisateur et corrections.

### Phase 2 — socle local

- initialisation Tauri/React/TypeScript ;
- schéma SQLite et migrations ;
- espace de travail, sociétés, dossiers, exercices, périodes et utilisateurs ;
- catalogue des modules et associations `DossierModule` ;
- droits par société, module et isolation `company_id` ;
- référentiel de comptes importable ;
- moteur débit/crédit ;
- sauvegarde/restauration par société et complète.

### Phase 3 — flux métier

- tiers ;
- ventes et achats ;
- caisse et banque ;
- page de choix des modules par dossier ;
- règles et modèles de propositions d’imputation dans CSR ;
- immobilisations et calcul des plans d’amortissement dans CSR ;
- contrats d’accès séparés pour GP, GCSF et GC ;
- génération contrôlée d’écritures ;
- journal, grand livre, balance et états d’immobilisations ;
- import/export TXT, CSV et Excel avec profils de mapping, prévisualisation et contrôles ;
- exports PDF.

### Phase 4 — validation métier et pilote

- revue par expert-comptable ;
- tests sur jeux de données réalistes ;
- corrections d’arrondi, dates, taxes et numérotation ;
- pilote auprès de quelques TPE béninoises ;
- documentation et support.

### Phase 5 — extensions

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
- nombre maximal de sociétés et d’utilisateurs dans un espace de travail ;
- possibilité de partager une société entre plusieurs postes ;
- politique de sauvegarde et de récupération par société ;
- rôle exact du cabinet comptable ;
- nom, identité visuelle et positionnement commercial.

## 12. Première tâche recommandée

Produire les maquettes de neuf flux :

1. authentification ;
2. liste des dossiers avec une ligne par module associé ;
3. création d’un dossier sans module obligatoire ;
4. rattachement séparé de CSR, GP, GCSF ou GC ;
5. page de choix des modules après ouverture d’un dossier ;
6. tableau de bord CSR isolé par société ;
7. saisie d’une vente avec proposition d’imputation ;
8. création d’une immobilisation et prévisualisation de son plan d’amortissement ;
9. import/export TXT/Excel avec aperçu et mapping.

Ces flux couvrent la nouvelle architecture modulaire tout en permettant de valider le vocabulaire et le niveau de simplicité avant d’investir dans les règles métier spécifiques de chaque module.
