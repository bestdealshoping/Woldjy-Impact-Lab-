# Woldjy Impact Lab — nouvelle base du site

## Pages incluses
- `index.html` : accueil
- `services.html` : services
- `offers.html` : formations et offres
- `process.html` : méthode de travail
- `audit.html` : formulaire de demande d'audit
- `contact.html` : contact
- `acceuil_bibliotheque.html` : page d'accueil de la bibliothèque
- `register.html` : inscription (interface, non connectée)
- `login.html` : connexion (interface, non connectée)
- `bibliotheque.html` : espace documents (interface, non connectée)
- `style.css` : styles responsives communs
- `js/script.js` : menu mobile et interactions des formulaires de démonstration

## Publication GitHub Pages
1. Téléversez les fichiers HTML et `style.css` à la racine du dépôt.
2. Téléversez le dossier `js` avec `script.js` à l'intérieur.
3. Gardez les noms des fichiers tels quels : les liens sont relatifs.
4. Vérifiez que GitHub Pages publie depuis la bonne branche et le bon dossier.

## Avant une mise en production
- Les formulaires ne transmettent pas encore les réponses. Connectez-les à Formspree ou à un backend.
- Les pages de connexion et d'inscription sont des interfaces visuelles. Connectez Supabase Auth avant d'utiliser de vrais comptes.
- Pour les documents privés, utilisez un bucket Supabase Storage privé et des règles d'accès/RLS. Ne comptez pas sur JavaScript ou `localStorage` pour protéger les fichiers.
- Vérifiez les coordonnées, les offres, les tarifs, les statistiques et les images officielles avant publication.
- Remplacez les textes de démonstration par les informations réellement confirmées.
