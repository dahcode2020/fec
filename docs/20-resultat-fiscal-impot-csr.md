# Résultat fiscal et impôt — module CSR

**Version :** 0.2  
**Statut :** calcul paramétrable, versionné et soumis à validation professionnelle

> Les taux et seuils ci-dessous sont ceux du texte du CGI béninois 2026 fourni pour le développement. Ce document et le logiciel ne constituent ni une consultation fiscale, ni une attestation de conformité. Le référentiel doit être revu par un professionnel compétent au Bénin avant utilisation en production.

## Objectif

Le résultat fiscal est conservé par **société et exercice**. Une mise à jour du CGI crée une nouvelle version du référentiel ; elle ne réécrit pas les paramètres ni les calculs d’un exercice historique.

Le moteur sépare :

```text
Résultat comptable avant impôt
→ déductions et réintégrations justifiées
→ résultat fiscal
→ impôt calculé au taux
→ minimum fiscal applicable
→ redevance ORTB éventuelle
→ total à payer
→ résultat net après impôt
```

## Référentiel CGI Bénin 2026 intégré

### Article 46 — taux de l’impôt

Le profil d’activité permet de proposer :

- **25 %** pour les personnes morales ayant une activité industrielle hors industries extractives ;
- **25 %** pour les écoles privées d’enseignement scolaire, universitaire, technique et professionnel ;
- **30 %** pour les autres personnes morales ;
- pour une convention minière ou pétrolière, un taux conventionnel saisi par l’utilisateur, avec un plancher au taux de droit commun.

Le profil reste visible dans l’écran et le taux n’est pas présenté comme définitivement validé par le logiciel.

### Article 47 — minimum de perception

Le calcul compare l’impôt au taux avec le minimum applicable :

- **10 %** des produits encaissables pour une société à prépondérance immobilière ;
- **3 %** pour le secteur du bâtiment et des travaux publics ;
- **1 %** dans les autres cas ;
- dans tous les cas, un plancher de **250 000 FCFA**.

Les produits encaissables peuvent être saisis avant exclusions. Le moteur retire les montants renseignés pour :

- la production immobilisée ;
- la production stockée ;
- les transferts de charges ;
- les reprises de provisions et d’amortissements.

Pour une station-service ou un distributeur non importateur de produits pétroliers remplissant les conditions prévues par le texte, le moteur compare également le minimum en pourcentage avec **0,60 FCFA par litre**. Ces deux cas sont regroupés sous un même profil dans l’interface, car ils utilisent la même règle de calcul. Pour le commerce de véhicules d’occasion et certains produits de grande consommation, un champ de minimum réglementaire permet de renseigner le montant applicable après validation du texte réglementaire ; aucun montant n’est inventé.

La redevance ORTB de **4 000 FCFA** est affichée séparément et ajoutée au total calculé lorsqu’elle est activée.

## Paramétrage dans l’application

Dans **CSR → Travaux périodiques → Résultat fiscal et impôt**, l’utilisateur sélectionne :

1. le référentiel annuel ;
2. le profil d’activité ;
3. le taux conventionnel si le profil l’exige ;
4. les déductions et réintégrations justifiées ;
5. les produits encaissables et les exclusions ;
6. les litres vendus pour les activités pétrolières ;
7. le minimum réglementaire spécial si nécessaire ;
8. l’application de la redevance ORTB.

Le taux proposé pour un profil légal est affiché en lecture seule. Le profil doit être sélectionné explicitement : une société nouvellement créée reste bloquée tant qu’aucun profil n’a été choisi.

## Données produites par le système

Le moteur retourne distinctement :

- le résultat comptable avant impôt ;
- le résultat fiscal ;
- le taux retenu ;
- l’impôt calculé au taux ;
- la base des produits encaissables et le détail des exclusions ;
- le minimum en pourcentage, le minimum au volume et le plancher ;
- le minimum fiscal retenu ;
- la redevance ORTB ;
- le total à payer ;
- le résultat net après impôt.

## Comptabilisation automatique

Lorsque l’utilisateur lance la génération, le système prépare une proposition dans le journal `RP`. Elle reste à contrôler et ne vaut pas arrêté définitif.

La répartition comptable détaillée de la redevance ORTB et des cas particuliers doit être confirmée avec le professionnel chargé du dossier avant de figer les comptes de contrepartie. Le logiciel ne doit pas inventer une correspondance comptable réglementaire.

## Mise à jour annuelle

Une nouvelle année doit ajouter une entrée dans le référentiel versionné, par exemple :

```text
BENIN_CGI_RULES_BY_YEAR['2027']
```

Cette entrée peut modifier les taux, seuils, redevances ou paramètres particuliers pour les nouveaux exercices. Les exercices déjà calculés conservent leur `codeVersion` et leurs paramètres.

Avant activation d’une nouvelle version :

- comparer le texte officiel et sa date d’entrée en vigueur ;
- faire relire les taux et les comptes par un professionnel au Bénin ;
- ajouter des tests de non-régression ;
- conserver la version précédente ;
- vérifier les écritures générées et les déclarations concernées.
