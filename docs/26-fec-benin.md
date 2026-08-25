# FEC fiscal — système béninois

**Référence de travail :** arrêté n° 1085/MEF/CAB/SGM/DGI/DLC/1355SGG20 du 23 avril 2020, portant modalités et normes de présentation du Fichier des Écritures Comptables (FEC).

> Ce document décrit l’implémentation du prototype. Il ne constitue pas une attestation de conformité ni une validation juridique ou fiscale.

## Périmètre réglementaire retenu

Le FEC regroupe les écritures comptables validées, classées par ordre chronologique de validation, après les opérations d’inventaire. Il comprend les écritures de report et exclut les écritures de centralisation ainsi que les écritures de solde des comptes de charges et de produits.

Le FEC du dossier CSR est produit par exercice, avec une période contrôlée à l’intérieur de l’exercice. La société active est toujours portée dans le contexte de génération.

## Structure normale

Les dix-huit premiers champs, dans l’ordre de l’arrêté, sont :

1. `CodeJournal`
2. `LibJournal`
3. `NumEcriture`
4. `DateEcriture`
5. `NumCompte`
6. `LibCompte`
7. `NumCompteAux`
8. `LibCompteAux`
9. `RefPiece`
10. `DatePiece`
11. `LibEcriture`
12. `MontDebit`
13. `MontCredit`
14. `LetEcriture`
15. `DateLetEcriture`
16. `DateValid`
17. `MontDevise`
18. `CodeDevise`

Lorsqu’un système ne distingue pas le débit et le crédit, l’arrêté prévoit la variante `Montant` et `sens`. Le moteur CSR dispose de deux montants distincts ; il utilise donc `MontDebit` et `MontCredit`.

## Variante de trésorerie

Pour la comptabilité de trésorerie du contribuable imposable à l’impôt sur le revenu, trois champs sont ajoutés :

19. `Date Règlement` — obligatoire ;
20. `Mode Règlement` — obligatoire ;
21. `NatOp` — non obligatoire.

Dans le prototype, le profil SMT active ces trois champs et contrôle la présence de la date et du mode de règlement.

## Normes techniques

Le prototype prépare un fichier plat TXT avec :

- tabulation ou point-virgule comme séparateur de champs ;
- séparateur d’enregistrements CRLF ;
- dates `AAAAMMJJ` ;
- montants décimaux à virgule, sans séparateur de milliers ;
- encodage ASCII, ISO 8859-15 ou EBCDIC ;
- une ligne d’en-tête portant les noms des champs ;
- une ligne par ligne d’imputation, les lignes d’une même écriture partageant le même `NumEcriture`.

## Nommage et découpage

Le nom prévu est :

```text
FEC_IFU_AAAAMMJJ.txt
```

En cas de découpage par volume :

```text
FEC_IFU_AAAAMMJJ_1.txt
FEC_IFU_AAAAMMJJ_2.txt
```

Le prototype génère également un descriptif technique associé :

```text
FEC_IFU_AAAAMMJJ.notice.txt
```

Il décrit les champs, leur signification, le jeu de caractères et les séparateurs.

## Contrôle et modes de génération

Trois modes sont prévus :

- **FEC officiel strict** : les erreurs bloquantes empêchent la génération ;
- **FEC officiel + rapport** : les anomalies sont détaillées et la génération reste bloquée tant qu’elles ne sont pas corrigées ;
- **Diagnostic provisoire** : les écritures en attente peuvent être analysées et une sortie de diagnostic peut être générée, avec la mention non transmissible.

Les contrôles portent notamment sur :

- la société et la période ;
- les statuts d’écriture ;
- le séquencement ;
- l’équilibre débit/crédit par écriture ;
- la présence et la validité des dates ;
- le journal et son libellé ;
- le compte et son rattachement au plan SYSCOHADA ;
- le libellé du compte ;
- la référence de pièce ;
- les données de règlement en SMT ;
- l’exclusion des centralisations et des soldes de résultat.

Chaque génération est enregistrée dans l’historique et la piste d’audit du dossier.

## Préparation des données sources

Les nouveaux flux d’écriture conservent désormais la date de pièce, le tiers, l’auxiliaire et, pour les règlements, la date et le mode de règlement. La transition vers l’état `VALIDATED` conserve une date de validation dédiée. L’assistant FEC signale encore les écritures historiques qui ne possèdent pas ces informations plutôt que de les inventer dans un FEC officiel.

Depuis le résultat du précontrôle, l’utilisateur peut ouvrir **Saisie et insertion** afin de compléter les écritures sources. Cette correction doit être effectuée dans la comptabilité, puis le FEC doit être contrôlé à nouveau.

## Points à compléter avant usage professionnel

- faire valider la correspondance exacte entre le régime fiscal du contribuable et le profil SMT ;
- compléter les dates de validation et les références de pièces des écritures historiques ;
- tester les sorties avec les outils ou procédures de la DGID ;
- vérifier les dimensions de découpage et les supports acceptés lors d’un contrôle ;
- faire relire le générateur et le descriptif technique par un professionnel compétent au Bénin.
