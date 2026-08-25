# Résultat fiscal et impôt — module CSR

**Version :** 0.1  
**Statut :** calcul paramétrable et génération contrôlée

## Ordre des traitements

```text
Résultat comptable avant impôt
→ Déductions fiscales
→ Réintégrations fiscales
→ Résultat fiscal
→ Impôt calculé
→ Résultat net après impôt
```

## Données produites par le système

Le résultat comptable avant impôt est calculé à partir des écritures validées des comptes de charges et de produits. L’utilisateur ne renseigne pas ce résultat.

L’utilisateur peut saisir, avec justification et selon les droits :

- les déductions fiscales ;
- les réintégrations fiscales ;
- le taux d’impôt validé pour la société ;
- le minimum fiscal éventuel.

Le système calcule ensuite :

- résultat fiscal ;
- impôt théorique ;
- impôt retenu après minimum éventuel ;
- résultat net après impôt.

## Comptabilisation automatique

Lorsque l’impôt est supérieur à zéro, le système prépare l’écriture dans le journal `RP` :

```text
Débit    8911 ou compte fiscal configuré
Crédit   441 ou compte État configuré
```

L’écriture reste à contrôler. Elle n’est pas saisie manuellement et n’est pas considérée comme un arrêté définitif.

## Sécurité

- aucun taux légal n’est codé en dur ;
- le taux et le minimum sont propres à la société et à la période ;
- les paramètres fiscaux sont historisés ;
- le résultat fiscal est distingué du résultat comptable ;
- le résultat net après impôt est distingué du résultat avant impôt ;
- une validation professionnelle est nécessaire avant usage au Bénin.
