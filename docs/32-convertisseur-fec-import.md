# Convertisseur FEC — import depuis les logiciels du marché (Bénin)

**Version :** 0.1
**Périmètre :** produire un FEC béninois à partir d'un grand livre, journal,
brouillard ou export d'écritures issu d'un logiciel courant en Afrique de l'Ouest.
**Référence fiscale :** arrêté n° 1085/MEF/CAB/SGM/DGI/DLC/1355SGG20 du 23 avril 2020
(structure détaillée dans [`26-fec-benin.md`](26-fec-benin.md)).

> Ce document décrit l'implémentation du convertisseur (`fec-converter/`). Il ne
> constitue ni une attestation de conformité ni une validation juridique ou fiscale.

## 1. Intention

Les cabinets et entreprises du Bénin tiennent leur comptabilité dans des logiciels
variés (Sage 100, Sage SAARI / Sage 50, Ciel, EBP, Odoo, outils locaux). Aucun ne
produit nativement le FEC au format de la DGI béninoise. Le convertisseur est une
**application web 100 % locale** (aucun envoi vers un serveur) qui :

1. importe un export d'écritures du logiciel source (TXT, CSV, Excel) ;
2. associe les colonnes sources aux champs FEC (mapping auto + manuel) ;
3. exécute un précontrôle bloquant calqué sur l'arrêté ;
4. génère le FEC, le descriptif technique, le rapport de contrôle et un paquet
   ZIP scellé (empreintes SHA-256).

## 2. Limite fondamentale : balance vs écritures

Le FEC exige **chaque écriture détaillée, ligne par ligne**, avec journal, dates,
comptes, pièces et validation. Une **balance ne contient que des soldes** : elle ne
permet donc pas de reconstituer les écritures.

Règle appliquée par le convertisseur :

- **grand livre / journal / brouillard / export d'écritures** → FEC officiel
  possible (18 champs, 21 en SMT) ;
- **balance seule** → uniquement une écriture de **reports à nouveau**
  (journal `AN`, libellé `REPORT`), ou un **diagnostic provisoire non
  transmissible** explicitement marqué (`DIAGNOSTIC-…`).

L'interface l'explique à l'étape 1 et le profil « Balance seule » affiche un
avertissement permanent.

## 3. Profils logiciels

| Profil | Source typique | Séparateur | Dates | Particularités |
|---|---|---|---|---|
| `sage100` | Export paramétrable des écritures | `;` | `JJ/MM/AAAA` | Compte général + compte tiers séparés |
| `saari_ciel` | Grand livre / brouillard / journal TXT | `;`/tab | `JJ/MM/AAAA` | Référence pièce parfois = N° de pièce |
| `ebp` | Export des écritures CSV | `;` | `JJ/MM/AAAA` | Proche de Ciel |
| `odoo` | Grand livre / `account.move.line` CSV/XLSX | `,`/`;` | `AAAA-MM-JJ` | En-têtes anglais possibles |
| `perfecto` | Journal texte en sections `Journal <XXX> …` | tab | `JJ/MM/AAAA` | Parseur de sections dédié, colonnes Journal virtuelles |
| `generique` | Modèle CSV fourni (18/21 colonnes FEC) | `;` | `JJ/MM/AAAA` | Mapping immédiat |
| `balance` | Balance générale | auto | — | Reports `AN`/`REPORT` uniquement |

Chaque profil définit : séparateur et formats par défaut, synonymes d'en-têtes
(normalisés : minuscules, sans accents) pour le mapping automatique, et un texte
d'aide expliquant comment exporter depuis le logiciel. La suggestion automatique
score les profils selon les en-têtes trouvés (seuil : 3 correspondances).

**PERFECTO (outil local béninois)** : l'export « Journaux » est un texte tabulé
organisé en sections (`Journal <ACH> Achats`, …), avec titres, ligne
`1ère saisie / Dernière saisie` et totaux intercalés. Le parseur dédié
(`parsePerfectoText` / `extractPerfectoSections`) ignore ces lignes parasites,
rattache chaque ligne d'écriture à son journal (colonnes virtuelles
`Journal` / `Libellé journal`), et mappe : `Date` → date d'écriture,
`N° pièce` (regroupement par journal + N°), `Compte` / `Intitulé`,
`Référence` → référence de pièce, `Libellé` → libellé d'écriture,
`En devise` → montant en devise, **dernière** `Date saisie` → date de
validation. Exemple synthétique : `fec-converter/exemples/perfecto-journal.txt`.

## 4. Lecture des fichiers

- **Texte** : `TextDecoder` avec encodage choisi (UTF-8, Windows-1252, ISO-8859-1) ;
  BOM retiré ; détection auto du séparateur (`\t`, `;`, `,`, `|`) sur 12 lignes.
- **Excel** (`.xlsx`, `.xls`, `.ods`) : librairie SheetJS chargée depuis un CDN si
  la connexion le permet ; choix de la feuille ; repli documenté (convertir en CSV).
- **Options** : ligne d'en-tête (oui/non), lignes à ignorer, ordre des dates
  (`DMY`/`YMD`/`MDY`), décimales (`auto`/virgule/point).
- **Dates acceptées** : `JJ/MM/AAAA`, `AAAA-MM-JJ`, `AAAAMMJJ`, séries Excel,
  variantes avec `.`/`-` et heures ; sortie normalisée ISO puis `AAAAMMJJ`.
- **Montants acceptés** : virgule ou point décimal, espaces (y compris insécables),
  symboles `FCFA`/`XOF`, milliers, négatifs entre parenthèses ou signe trailing ;
  sortie `décimal à virgule, 2 chiffres`.

## 5. Mapping et regroupement

Cibles internes : code/libellé journal, N° écriture source, date écriture,
compte/libellé, auxiliaire/libellé, réf/date pièce, libellé écriture,
débit/crédit (ou montant unique + sens), lettrage/date, validation, devise,
date/mode règlement, nature opération.

- Mapping **auto** par synonymes + recherche floue, puis **manuel** (listes
  déroulantes avec exemple de valeur) ; aperçu des 20 premières lignes.
- **Regroupement en écritures** : par (`journal` + `N° source`) si la colonne
  existe et est renseignée, sinon par (`journal` + `date` + `référence pièce`).
- **Tri FEC** : reports (`AN`, `REPORT`, `à-nouveaux`…) d'abord, puis date de
  validation (ou date d'écriture), journal, pièce ; **renumérotation continue**
  `1…N` (option recommandée, conforme à l'arrêté).
- **Libellés de secours** : référentiel SYSCOHADA embarqué (~150 comptes) et
  journaux usuels ; un libellé de compte manquant reste une **erreur bloquante**
  en mode officiel (à compléter dans le logiciel source).

## 6. Contrôles (mode officiel = bloquants)

Précontrôle sur les lignes internes **et** validation du texte FEC final :

- périmètre d'exercice, exclusion des centralisations (journal `CT`, libellés) ;
- équilibre débit/crédit **par écriture** ; séquence `NumEcriture` continue ;
- dates `AAAAMMJJ`, montants à virgule, en-tête exact (18/21 champs ordonnés) ;
- comptes numériques SYSCOHADA, libellés obligatoires (journal, compte, écriture) ;
- référence et date de pièce ; date de validation (repli configurable) ;
- SMT : date et mode de règlement obligatoires ;
- écritures `REPORT` placées en tête de séquence.

Le **mode diagnostic** lève le blocage mais préfixe les fichiers
`DIAGNOSTIC-` et le rapport porte la mention **non transmissible**.

## 7. Sorties

- `FEC_IFU_AAAAMMJJ.txt` (tabulation ou `;`, CRLF, `AAAAMMJJ`, montants à
  virgule) ; découpage `_1`, `_2`… entre écritures complètes si demandé.
- `FEC_IFU_AAAAMMJJ.notice.txt` : descriptif technique (champs, séparateurs,
  jeu de caractères, référence de l'arrêté).
- `FEC_IFU_AAAAMMJJ.rapport.txt` : périmètre, totaux, erreurs, avertissements,
  exclusions, statut `PRET`/`BLOQUE`.
- `FEC_IFU_AAAAMMJJ.manifest.txt` : manifeste SHA-256 des fichiers.
- `FEC_IFU_AAAAMMJJ.zip` : paquet scellé (ZIP `stored`, sans compression).
- Encodages : ISO-8859-15 (défaut), ASCII, UTF-8 (compatibilité), EBCDIC (Cp037).
- Récupération : téléchargement direct, ouverture dans un nouvel onglet, ou
  fenêtre « Voir & copier » (secours si le navigateur ou l'aperçu intégré
  bloque les téléchargements : copier-coller vers le Bloc-notes).

## 8. Architecture et tests

- `fec-converter/converter.js` : moteur sans dépendance, importable dans le
  navigateur (ES module) et sous Node (parsers, profils, contrôles, ZIP, SHA-256).
- `fec-converter/app.js` + `index.html` + `styles.css` : assistant en 5 étapes.
- `fec-converter/converter.test.mjs` : 17 tests (`npm run test:converter`) —
  séparateurs, dates, montants, suggestion de profil, chaîne Sage→FEC valide,
  SMT, balance→REPORT, découpage, encodages, ZIP, notice/rapport, modèle.
- `fec-converter/exemples/` : Sage 100, Ciel/SAARI, Odoo, balance d'ouverture, journal PERFECTO.
- Lancement : `npm run preview:converter` → `http://localhost:4175`.

## 9. Points à valider avant usage professionnel

- Confronter le descriptif et un fichier réel aux outils/procédures de la DGI.
- Faire valider la correspondance régime fiscal ↔ profil SMT par un
  professionnel ; vérifier les modes de règlement attendus.
- Tester avec de vrais exports Sage/Ciel/Odoo (variantes d'en-têtes) et ajuster
  les synonymes si besoin.
- Vérifier les supports et volumes acceptés lors d'un contrôle (découpage).
- Relire le générateur avec un expert-comptable au Bénin.
