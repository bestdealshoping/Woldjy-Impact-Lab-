// Menu mobile + formulaires (Formspree). L'authentification est dans auth.js.
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".menu-toggle"), nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      toggle.setAttribute("aria-expanded", String(nav.classList.toggle("open")));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }
  function say(form, msg, ok) {
    var box = form.querySelector(".form-status");
    box.textContent = msg; box.className = "form-status " + (ok ? "ok" : "err");
  }
  // Formulaires envoyés à Formspree
  document.querySelectorAll("form[data-formspree]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var url = window.WIL_CONFIG[form.dataset.formspree];
      if (!url || url.indexOf("VOTRE_ID") !== -1) { say(form, "Le formulaire n'est pas encore configuré. Écrivez-nous à contact@woldjyimpactlab.com.", false); return; }
      var btn = form.querySelector("button[type=submit]"); btn.disabled = true;
      fetch(url, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) {
          if (r.ok) { form.reset(); say(form, "Merci, votre message a bien été envoyé.", true); }
          else say(form, "L'envoi a échoué. Réessayez ou écrivez-nous par e-mail.", false);
        })
        .catch(function () { say(form, "Problème de connexion. Réessayez dans un instant.", false); })
        .finally(function () { btn.disabled = false; });
    });
  });
});
