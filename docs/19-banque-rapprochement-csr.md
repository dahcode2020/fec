# Banque, caisse et rapprochement — module CSR

**Version :** 0.1  
**Statut :** premier flux fonctionnel

## Objectif

Comparer les mouvements d’un relevé bancaire avec les écritures du journal BQ, puis distinguer les mouvements rapprochés, pointés ou restant à imputer.

## Écran

Accès :

```text
Gestion → Banque & rapprochement
```

Onglets :

- Rapprochement bancaire ;
- Relevés importés ;
- Mouvements à pointer ;
- Caisse.

## Import d’un relevé

Le premier parcours accepte TXT et CSV avec les colonnes :

```text
DATE ; LIBELLÉ ; RÉFÉRENCE ; DÉBIT ; CRÉDIT
```

Le fichier est placé dans une prévisualisation avant intégration. Les lignes sont contrôlées et rattachées à la société active.

## États d’un mouvement

- **À pointer** : aucun lien confirmé avec une écriture ;
- **Pointé** : un lien est identifié mais reste à confirmer ;
- **Rapproché** : le montant et l’écriture comptable sont confirmés.

## Rapprochement

Le système propose une correspondance par société et par montant. La confirmation utilise le journal BQ et conserve l’identifiant de l’écriture associée.

Un rapprochement ne crée pas automatiquement une écriture. Un mouvement bancaire non reconnu doit d’abord être imputé depuis la saisie, puis rapproché.

## Lien avec les règlements

Un règlement client ou fournisseur génère un mouvement bancaire pointé vers l’écriture correspondante. Après import du relevé, ce mouvement peut être confirmé comme rapproché.

## Caisse

La page prévoit également le suivi du solde théorique, du comptage réel et de l’écart de caisse. Les écritures de caisse utilisent le journal CA et restent soumises aux mêmes règles de validation.
