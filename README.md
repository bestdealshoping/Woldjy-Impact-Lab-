# Woldjy Impact Lab

Site vitrine et bibliothèque numérique de Woldjy Impact Lab.

## Structure actuelle
- Pages HTML à la racine : `index.html`, `services.html`, `offers.html`, `process.html`, `audit.html`, `contact.html`, `acceuil_bibliotheque.html`, `register.html`, `login.html`, `bibliotheque.html`, `confidentialite.html`.
- `css/style.css` : styles du site.
- `js/config.js` : configuration publique de Supabase et URLs Formspree.
- `js/main.js` : navigation et soumission des formulaires.
- `js/layout.js` : éléments communs du site.
- `js/auth.js` et scripts associés : authentification et bibliothèque, selon les pages.
- `android-app/` : projet Android WebView.
- `.github/workflows/build-android-apk.yml` : génération de l'APK de test.

## Configuration des formulaires
Les formulaires Audit et Contact utilisent Formspree. Dans `js/config.js`, remplacer :
- `VOTRE_ID_AUDIT` par l'identifiant réel du formulaire Audit.
- `VOTRE_ID_CONTACT` par l'identifiant réel du formulaire Contact.

Tant que ces deux identifiants ne sont pas renseignés, les formulaires ne peuvent pas transmettre les demandes.

## Supabase
Le site utilise le projet Supabase configuré dans `js/config.js`. La clé présente dans le code doit rester une clé publique (publishable/anon). Ne jamais placer une clé `service_role` dans le dépôt.

Dans Supabase, Authentication > URL Configuration, définir l'URL principale du site et ajouter les URL de redirection exactes utilisées par le site et l'application. Vérifier aussi les liens de confirmation et de réinitialisation de mot de passe.

## Application Android
Le dossier `android-app/` contient une application WebView qui charge l'URL définie dans `MainActivity.kt`. L'URL doit correspondre au domaine officiel choisi pour le site. Le workflow actuel produit un APK debug destiné aux essais, pas une version signée pour Google Play.

## Publication
Le site web est publié via GitHub Pages et/ou Vercel selon le domaine configuré. Garder une seule URL canonique officielle et rediriger ou harmoniser les autres versions.
