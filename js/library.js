// Espace lecteur : lien de partage, compteur de partages, dépôt et téléchargement de livres.
(function () {
  var db = window.wilDb, root = document.getElementById("library-app"), h = wilEl;
  if (!root) return;
  if (!db) { root.textContent = "Les comptes ne sont pas encore actifs sur ce site."; return; }
  db.auth.getSession().then(function (s) {
    if (!s.data.session) { location.replace("login.html"); return; }
    var uid = s.data.session.user.id;
    Promise.all([
      db.from("profiles").select("role,referral_code,full_name").eq("id", uid).single(),
      db.rpc("has_access"), db.rpc("my_share_count")
    ]).then(function (r) {
      if (r[0].error) { root.textContent = "Impossible de charger votre profil."; return; }
      render(uid, r[0].data, r[1].data === true, r[2].data || 0);
    });
  });

  function render(uid, me, access, count) {
    root.textContent = "";
    var link = location.href.replace(/[^/]*(\?.*)?$/, "") + "register.html?ref=" + me.referral_code;
    var text = "Découvrez la bibliothèque de Woldjy Impact Lab : " + link;
    var top = h("div", { class: "actions" });
    if (me.role === "admin") top.appendChild(h("a", { class: "btn btn-primary", href: "admin.html" }, "Administration"));
    top.appendChild(h("button", { class: "btn btn-outline", type: "button", on: { click: function () { db.auth.signOut().then(function () { location.href = "login.html"; }); } } }, "Se déconnecter"));

    var share = h("div", { class: "card" }, h("h2", {}, "Votre bibliothèque est accessible"),
      h("p", {}, "Nombre de partages enregistrés depuis votre compte : " + count + ". Chaque utilisation d’un bouton de partage augmente ce compteur."),
      h("p", { class: "tag" }, "Partages : " + count),
      h("div", { class: "field", style: "margin-top:1rem" }, h("label", { for: "ref-link" }, "Votre lien de partage"), h("input", { id: "ref-link", value: link, readonly: "" })));
    var a = h("div", { class: "actions" });
    a.appendChild(h("button", { class: "btn btn-primary", type: "button", on: { click: function () {
      db.rpc("record_share").then(function (r) {
        if (!r.error) { var badge = share.querySelector(".tag"); if (badge) badge.textContent = "Partages : " + r.data; }
      });
      if (navigator.share) navigator.share({ title: "Woldjy Impact Lab", text: text, url: link }).catch(function () {});
      else navigator.clipboard.writeText(link).then(function () { alert("Lien copié."); });
    } } }, "Partager"));
    a.appendChild(h("a", { class: "btn btn-outline", href: "https://wa.me/?text=" + encodeURIComponent(text), target: "_blank", rel: "noopener", on: { click: function () {
      db.rpc("record_share").then(function (r) { if (!r.error) { var badge = share.querySelector(".tag"); if (badge) badge.textContent = "Partages : " + r.data; } });
    } } }, "WhatsApp"));
    share.appendChild(a);
    root.append(top, share);

    var up = h("div", { style: "margin-top:2rem" }, h("h2", {}, "Partager un livre"),
      h("p", {}, "Ne déposez que des documents dont vous détenez les droits de diffusion. Chaque dépôt est vérifié par l'équipe avant publication."));
    up.appendChild(wilForm([["title", "Titre", "text", null, true], ["author", "Auteur"], ["description", "Description", "textarea"], ["file", "Fichier (PDF ou EPUB, 20 Mo max)", "file", null, true]],
      null, "Envoyer pour validation", function (v, say, btn, f) {
        btn.disabled = true;
        var path = uid + "/" + Date.now() + "-" + wilSafeName(v.file.name);
        db.storage.from("library").upload(path, v.file).then(function (r) {
          if (r.error) { btn.disabled = false; return say("Envoi impossible : " + r.error.message, false); }
          return db.from("documents").insert({ title: v.title, author: v.author, description: v.description, file_path: path, uploaded_by: uid, status: "pending" }).then(function (q) {
            btn.disabled = false;
            if (q.error) return say("Échec : " + q.error.message, false);
            f.reset(); say("Merci ! Votre livre sera visible après validation.", true); loadDocs();
          });
        });
      }));
    var list = h("div", { class: "grid grid-3" });
    root.append(up, h("h2", { style: "margin-top:2rem" }, "Livres disponibles"), list);
    function loadDocs() {
      db.from("documents").select("id,title,author,description,file_path,cover_path,status,uploaded_by").order("created_at", { ascending: false }).then(function (r) {
        list.textContent = "";
        if (r.error) { list.textContent = "Impossible de charger les livres."; return; }
        if (!r.data.length) list.textContent = "Aucun livre pour le moment.";
        r.data.forEach(function (d) {
          var c = h("div", { class: "card" });
          if (d.status !== "approved") c.appendChild(h("span", { class: "tag" }, d.status === "pending" ? "Votre dépôt : en attente" : "Votre dépôt : refusé"));
          if (d.cover_path) db.storage.from("library").createSignedUrl(d.cover_path, 300).then(function (u) {
            if (!u.error) { var img = h("img", { src: u.data.signedUrl, alt: "Couverture de " + d.title, loading: "lazy", style: "width:100%;height:220px;object-fit:cover;border-radius:14px;margin-bottom:1rem" }); c.insertBefore(img, c.firstChild); }
          });
          c.append(h("h3", {}, d.title), h("p", {}, [d.author, d.description].filter(Boolean).join(" · ")));
          c.appendChild(h("button", { class: "btn btn-outline", type: "button", on: { click: function (e) {
            var b = e.currentTarget;
            db.storage.from("library").createSignedUrl(d.file_path, 60, { download: true }).then(function (u) {
              if (u.error) { b.textContent = "Indisponible"; return; }
              window.location.href = u.data.signedUrl;
            });
          } } }, "Télécharger"));
          list.appendChild(c);
        });
      });
    }
    loadDocs();
  }
})();
