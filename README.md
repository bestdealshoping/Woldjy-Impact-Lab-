# Woldjy Impact Lab — site (GitHub Pages + Supabase)

## Fichiers
- 10 pages `.html` à la racine (index, services, offers, process, audit, contact, acceuil_bibliotheque, register, login, bibliotheque)
- `style.css` : styles communs
- `js/script.js` : menu mobile, lien actif, formulaires Formspree
- `js/supabase.js` : connexion Supabase (inscription, connexion, déconnexion, bibliothèque protégée)

## Supabase (déjà créé)
- Tables : `profiles`, `documents` (RLS activé)
- Bucket privé : `library` (liens signés de 60 secondes)
- Seule la clé « publishable » est dans `js/supabase.js`. Jamais de clé `service_role`.

## À faire avant la mise en ligne
1. Formspree : créer un formulaire, remplacer `REMPLACER_PAR_VOTRE_ID` dans `audit.html` et `contact.html`.
2. Supabase → Authentication → URL Configuration : Site URL = `https://bestdealshoping.github.io/Woldjy-Impact-Lab-/` et la même adresse dans Redirect URLs.
3. S'inscrire, puis donner le rôle `admin` à votre compte :
   `update public.profiles set role='admin' where id = (select id from auth.users where email='VOTRE_EMAIL');`
4. Ajouter un document : téléverser le fichier dans le bucket `library`, puis insérer une ligne dans `documents` (`is_published = true`, `file_path` = chemin dans le bucket).
5. Téléverser `js/script.js` et `js/supabase.js` dans un dossier `js/` du dépôt.
