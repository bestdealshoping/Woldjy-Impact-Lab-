/* ============================================================
   Woldjy Impact Lab — js/script.js
   Menu mobile, année du footer, lien actif, formulaires Formspree.
   (L'authentification est dans js/supabase.js)
   ============================================================ */

/* Menu mobile */
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* Année automatique */
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

/* Lien actif dans le menu */
(function markActiveLink() {
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[href]").forEach((a) => {
    if (a.getAttribute("href") === page) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });
})();

/* Formulaires (audit, contact) envoyés via Formspree */
document.querySelectorAll("form[data-formspree]").forEach((form) => {
  const box = form.querySelector(".notice-success");
  const show = (text, ok) => {
    if (!box) return;
    box.style.display = "block";
    box.classList.toggle("error", !ok);
    box.textContent = text;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const endpoint = form.dataset.endpoint || "";

    // Tant que l'identifiant Formspree n'est pas mis, on le dit honnêtement.
    if (!endpoint || endpoint.includes("REMPLACER")) {
      show(
        "Ce formulaire n'est pas encore activé. Écrivez-nous à contact@woldjyimpactlab.com.",
        false
      );
      return;
    }

    // Piège anti-spam : un humain ne remplit pas ce champ caché.
    const trap = form.querySelector('[name="_gotcha"]');
    if (trap && trap.value) return;

    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (res.ok) {
        form.reset();
        show("Merci ! Votre message a bien été envoyé. Nous vous répondrons bientôt.", true);
      } else {
        show("L'envoi a échoué. Réessayez ou écrivez-nous par e-mail.", false);
      }
    } catch (err) {
      show("Connexion impossible. Vérifiez votre réseau et réessayez.", false);
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});
