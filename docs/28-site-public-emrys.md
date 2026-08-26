# Site public EMRYS

**Statut :** première one page publique et parcours d’essai local

## Identité

- nom : **EMRYS** ;
- slogan : **Gestion Sereine** ;
- domaine prévu : `https://emrys-saas.com` ;
- pays pilote : Bénin ;
- devise affichée : FCFA/XOF ;
- contact provisoire : `support@emrys-saas.com` et `+229 01 48 09 09 90` ;
- adresse provisoire : Rond Point Maria Gleta, Abomey-Calavi.

Les coordonnées sont regroupées dans la page pour pouvoir être remplacées sans réécrire les textes de présentation.

## Sections de la page

La one page présente :

- la promesse EMRYS ;
- les besoins des TPE et PME ;
- CSR, GP, GCSF et GC ;
- le travail en ligne, hors ligne et PWA ;
- le FEC béninois ;
- la protection et la portabilité des données ;
- les licences publiques ;
- la période d’essai de 30 jours ;
- les moyens de paiement ;
- les téléchargements et l’installation ;
- la FAQ ;
- les contacts et informations légales.

## Licences

Les prix sont présentés comme des licences uniques valables 3 ou 10 ans, en FCFA HT. Les offres sont regroupées par module :

- Essentiel ;
- Professionnel ;
- Entreprise ;
- Sur mesure.

Les montants affichés restent à confirmer avant publication contractuelle et devront préciser la TVA applicable, le périmètre de support et les modalités de renouvellement.

## Essai

L’essai dure 30 jours. Il donne accès aux quatre modules avec des limites de découverte. À l’expiration, les données ne sont pas supprimées : l’espace passe en lecture seule jusqu’à la souscription ou la récupération des données.

Dans la maquette, la demande d’essai est conservée localement pour tester le parcours. La création réelle du compte sera branchée à l’API d’authentification.

## SEO

La page contient déjà :

- titre et méta-description en français ;
- mots-clés orientés Bénin, SYSCOHADA, FEC, paie, facturation, stocks et hors ligne ;
- URL canonique ;
- balises Open Graph et Twitter ;
- données structurées `SoftwareApplication` et `Organization` ;
- manifest PWA ;
- `robots.txt` ;
- sitemap XML.

Le SEO naturel est séparé des textes publicitaires. Les campagnes Google Ads, Meta, WhatsApp et TikTok seront préparées après validation de la page et des offres.

## Parcours d’inscription

Le formulaire prépare :

- nom complet ;
- adresse e-mail ;
- mot de passe ;
- offre choisie ;
- acceptation des conditions générales et de la politique de confidentialité.

Le bouton **Continuer avec Google** est présent dans le parcours. Il sera relié à Google Identity Services avec validation côté serveur, sans conserver le mot de passe Google.

## Versions

- navigateur : accès en ligne ;
- PWA : manifest et service worker inclus ;
- Windows : emplacement réservé au futur installateur Tauri.

La page de test se lance avec :

```bash
npm run preview-site
```

Puis :

```text
http://localhost:4174
```

## Vérifications avant publication

- enregistrer le domaine et confirmer la disponibilité ;
- remplacer les coordonnées provisoires ;
- valider les prix, la TVA et les conditions de licence ;
- faire relire les conditions générales et la politique de confidentialité ;
- connecter l’authentification e-mail et Google ;
- connecter FedaPay sans exposer de secret dans le navigateur ;
- publier l’installateur Windows signé ;
- configurer les analytics et pixels avec consentement ;
- vérifier les liens sociaux et les balises de partage.
