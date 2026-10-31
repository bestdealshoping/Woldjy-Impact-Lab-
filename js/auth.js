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

})();
