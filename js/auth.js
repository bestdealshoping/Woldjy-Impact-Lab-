// Supabase Auth (connexion, inscription). N'utilise QUE la clé publique "anon" (protégée par RLS).
(function () {
  var cfg = window.WIL_CONFIG || {};
  var ready = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
  var db = ready ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
  window.wilDb = db;

  function say(form, msg, ok) {
    var b = form.querySelector(".form-status"); b.textContent = msg; b.className = "form-status " + (ok ? "ok" : "err");
  }
  var rf = document.getElementById("ref");
  if (rf) rf.value = (new URLSearchParams(location.search).get("ref") || "").slice(0, 16);
  var NOT_READY = "Les comptes ne sont pas encore actifs sur ce site.";

  document.querySelectorAll("form[data-auth]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!db) return say(form, NOT_READY, false);
      var f = new FormData(form), email = f.get("email"), pw = f.get("password"), btn = form.querySelector("button[type=submit]");
      var isRegister = !!form.querySelector("[name=full_name]");
      if (isRegister && pw !== f.get("confirm_password")) return say(form, "Les deux mots de passe ne sont pas identiques.", false);
      btn.disabled = true;
      var req = isRegister
        ? db.auth.signUp({ email: email, password: pw, options: { data: { full_name: f.get("full_name"), ref: f.get("ref") || "" }, emailRedirectTo: location.origin + location.pathname.replace(/[^/]*$/, "login.html") } })
        : db.auth.signInWithPassword({ email: email, password: pw });
      req.then(function (r) {
        if (r.error) return say(form, isRegister ? "Inscription impossible : " + r.error.message : "E-mail ou mot de passe incorrect.", false);
        if (isRegister) return say(form, "Compte créé. Vérifiez votre e-mail pour confirmer votre adresse. Vous pourrez ensuite vous connecter.", true);
        return db.from("profiles").select("role").eq("id", r.data.user.id).single().then(function (profile) {
          if (profile.error) return say(form, "Connexion réussie, mais profil introuvable. Contactez l'équipe.", false);
          location.href = profile.data.role === "admin" ? "admin.html" : "espace-client.html";
        });
      }).finally(function () { btn.disabled = false; });
    });
  });

  // Demande de réinitialisation du mot de passe
  var forgotForm = document.getElementById("forgot-password-form");
  if (forgotForm) {
    forgotForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!db) return say(forgotForm, NOT_READY, false);
      var email = forgotForm.querySelector('[name="email"]').value.trim();
      var btn = forgotForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      db.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + location.pathname.replace(/[^/]*$/, "reset-password.html")
      }).then(function (r) {
        if (r.error) return say(forgotForm, "Envoi impossible : " + r.error.message, false);
        say(forgotForm, "Si cette adresse possède un compte, un e-mail de réinitialisation vient d'être demandé. Vérifiez aussi les courriers indésirables.", true);
      }).finally(function () { btn.disabled = false; });
    });
  }

  // Enregistrement du nouveau mot de passe après ouverture du lien reçu par e-mail
  var resetForm = document.getElementById("reset-password-form");
  if (resetForm) {
    resetForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!db) return say(resetForm, NOT_READY, false);
      var f = new FormData(resetForm);
      var pw = f.get("password");
      if (pw !== f.get("confirm_password")) return say(resetForm, "Les deux mots de passe ne sont pas identiques.", false);
      var btn = resetForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      db.auth.getSession().then(function (sessionResult) {
        if (sessionResult.error || !sessionResult.data.session) {
          throw new Error("Le lien est invalide ou expiré. Demandez un nouveau lien de réinitialisation.");
        }
        return db.auth.updateUser({ password: pw });
      }).then(function (r) {
        if (r.error) throw r.error;
        say(resetForm, "Votre mot de passe a été modifié. Vous allez être redirigé vers la connexion.", true);
        setTimeout(function () { location.href = "login.html"; }, 1800);
      }).catch(function (err) {
        say(resetForm, "Modification impossible : " + err.message, false);
      }).finally(function () { btn.disabled = false; });
    });
  }

})();
