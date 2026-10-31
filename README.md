# Woldjy Impact Lab

Site vitrine et espace numérique de Woldjy Impact Lab.

## Pages principales
- `index.html` : accueil
- `services.html` : services
- `offers.html` : formations et offres
- `process.html` : méthode de travail
- `audit.html` : demande d'audit
- `contact.html` : contact
- `confidentialite.html` : politique de confidentialité
- `register.html` et `login.html` : accès membre
- `espace-client.html`, `messages.html`, `bibliotheque.html` : espace membre
- `admin.html` : administration

## Configuration publique
Le fichier `js/config.js` contient uniquement la clé publique Supabase (publishable) et les endpoints publics Formspree. Ne jamais y placer une clé `service_role`, un mot de passe ou un secret privé.

Les formulaires utilisent actuellement :
- Audit : `https://formspree.io/f/xykkzjgr`
- Contact : `https://formspree.io/f/xbddlylz`

Pour modifier ces formulaires, mettre à jour les valeurs `FORMSPREE_AUDIT` et `FORMSPREE_CONTACT` dans `js/config.js`, puis vérifier chaque envoi réel.

## Supabase
Projet : `smrajunpiymbaexvlvln`.
Dans Authentication > URL Configuration, définir l'URL principale du site public et autoriser les redirections exactes utilisées par les pages de connexion, inscription et confirmation d'e-mail. Vérifier également les modèles d'e-mail de confirmation et de réinitialisation.

La clé du navigateur doit rester une clé publique. La sécurité des données dépend aussi des politiques RLS et des privilèges SQL. Ne jamais désactiver RLS pour résoudre une erreur d'accès.

## Publication
Le site public canonique actuel est GitHub Pages :
`https://bestdealshoping.github.io/Woldjy-Impact-Lab-/`

Le projet Vercel `woldjy-impact-lab` possède également un déploiement de production. Avant de le promouvoir comme URL publique principale, vérifier la protection SSO, les domaines et la configuration de redirection. Garder une seule URL canonique cohérente dans les balises SEO.

## Application Android
Le dossier `android-app/` contient le projet Android WebView. L'APK debug sert aux essais. Une version de production doit être signée avec une clé de signature conservée en lieu sûr avant distribution.

## Vérifications avant lancement
- Tester les formulaires Audit et Contact et confirmer la réception des messages.
- Tester inscription, confirmation d'e-mail, connexion, déconnexion et récupération du mot de passe.
- Tester les accès client/admin, la messagerie, les notifications, la bibliothèque et les dépôts de documents.
- Tester les pages sur téléphone et ordinateur.
- Vérifier les liens, images, balises SEO et pages d'erreur.
- Vérifier que le site Vercel n'est pas bloqué par une protection SSO si son domaine doit être public.
