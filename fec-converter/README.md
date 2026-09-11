# Convertisseur FEC — Bénin (DGI)

Application web **100 % locale** (aucun envoi vers un serveur) qui transforme un
**grand livre / journal / export d'écritures** issu d'un logiciel de comptabilité
courant en Afrique de l'Ouest en **Fichier des Écritures Comptables (FEC)**
conforme à l'arrêté béninois du 23 avril 2020
(n° 1085/MEF/CAB/SGM/DGI/DLC/1355SGG20).

> ⚠️ **Point de vigilance fiscale.** Une **balance seule ne permet pas** de produire
> un FEC officiel complet : le FEC exige chaque écriture détaillée, ligne par ligne,
> avec journal, dates, pièces et validation. Le convertisseur accepte une balance
> uniquement pour générer des **reports à nouveau** (journal `AN`, libellé `REPORT`)
> ou un **diagnostic provisoire non transmissible**. Le FEC officiel exige un
> grand livre / journal / brouillard détaillé.

## Démarrage rapide

```bash
# Depuis la racine du dépôt
npm run preview:converter
# puis ouvrir http://localhost:4175
```

Ou ouvrez directement `fec-converter/index.html` dans un navigateur moderne
(Chrome, Edge, Firefox récents). Tout fonctionne hors ligne après chargement,
sauf l'import Excel `.xlsx` qui tente de charger la librairie SheetJS depuis un CDN
(fallback : convertissez le classeur en CSV délimité).

## Logiciels sources pris en charge

| Profil | Fichiers typiques | Séparateur | Dates | Décimales |
|---|---|---|---|---|
| Sage 100 Comptabilité | Export paramétrable des écritures (`.txt`/`.csv`) | `;` | `JJ/MM/AAAA` | virgule |
| Sage SAARI / Sage 50 / Ciel | Grand livre, brouillard, journal (`.txt`/`.csv`) | `;` ou tab | `JJ/MM/AAAA` | virgule |
| EBP Comptabilité | Export des écritures (`.csv`) | `;` | `JJ/MM/AAAA` | virgule |
| Odoo (Comptabilité OHADA) | `account.move.line`, grand livre (`.csv`/`.xlsx`) | `,` ou `;` | `AAAA-MM-JJ` | point |
| Générique SYSCOHADA | Modèle fourni dans l'application | `;` | `JJ/MM/AAAA` | virgule |
| Balance seule | Balance générale (`.csv`/`.txt`) | auto | — | auto |

Le mapping des colonnes est **auto-détecté** puis **modifiable** : chaque colonne
source est associée à un champ FEC cible, avec valeurs par défaut
(`XOF`, `DateValid = DateEcriture`, libellés SYSCOHADA…).

## Parcours en 5 étapes

1. **Contexte** — raison sociale, IFU (13 chiffres), exercice, régime
   (Système normal = 18 champs, SMT = 21 champs), format de sortie.
2. **Import** — dépôt du fichier (`.txt`, `.csv`, `.xlsx`), choix du profil
   logiciel, détection du séparateur, de l'encodage et des formats.
3. **Mapping** — association colonnes source → champs FEC, aperçu des lignes.
4. **Contrôles** — précontrôle bloquant (équilibre, séquence, dates, comptes
   SYSCOHADA, pièces, règlements SMT…), corrections guidées.
5. **Génération** — `FEC_IFU_AAAAMMJJ.txt` (+ découpage `_1`, `_2`…),
   descriptif `.notice.txt`, rapport `.rapport.txt`, manifeste `.manifest.txt`
   et paquet `.zip` scellé avec empreintes SHA-256. Chaque fichier est
   récupérable de 3 façons : **téléchargement**, **ouverture dans un nouvel
   onglet** (puis `Ctrl+S`), et **« Voir & copier »** (copier-coller vers le
   Bloc-notes si le navigateur bloque les téléchargements).

## Fichiers

- `index.html` — application (assistant en 5 étapes).
- `styles.css` — styles de l'application.
- `app.js` — interface (import, mapping, contrôles, génération, téléchargements).
- `converter.js` — moteur réutilisable (parsers, profils, mapping, contrôles,
  sérialisation, ZIP). Fonctionne dans le navigateur **et** sous Node.
- `converter.test.mjs` — tests (`npm run test:converter`).
- `exemples/` — fichiers d'exemple par logiciel + modèle générique + balance.
- `README.md` — ce fichier.

## Tests

```bash
npm run test:converter
```

## Référence réglementaire

Voir [`docs/26-fec-benin.md`](../docs/26-fec-benin.md) (structure des 18/21 champs,
normes techniques, nommage) et [`docs/32-convertisseur-fec-import.md`](../docs/32-convertisseur-fec-import.md)
(spécification du convertisseur).

> Ce convertisseur est un outil d'aide ; il ne constitue ni une attestation de
> conformité ni une validation juridique ou fiscale. Faites relire vos sorties par
> un professionnel compétent au Bénin et testez-les avec les outils de la DGI.
