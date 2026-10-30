// Panneau d'administration. La sécurité réelle vient de RLS : sans rôle "admin", Supabase refuse tout.
(function () {
  var db = window.wilDb, root = document.getElementById("admin-app"), h = wilEl;
  if (!root) return;
  if (!db) { root.textContent = "Supabase n'est pas encore configuré."; return; }
  db.auth.getSession().then(function (s) {
    if (!s.data.session) { location.replace("login.html"); return; }
    return db.from("profiles").select("role").eq("id", s.data.session.user.id).single().then(function (r) {
      if (r.error || r.data.role !== "admin") { root.textContent = "Accès réservé aux administrateurs."; return; }
      start();
    });
  });

  function start() {
    var tabs = h("div", { class: "actions" }), panel = h("div", {});
    [["Livres", books], ["Formations", formations], ["Membres", members]].forEach(function (d) {
      tabs.appendChild(h("button", { type: "button", class: "btn btn-outline", on: { click: function () { panel.textContent = ""; d[1](panel); } } }, d[0]));
    });
    root.textContent = ""; root.append(tabs, panel); books(panel);
  }
  function actions(list) {
    var a = h("div", { class: "actions" });
    list.forEach(function (x) { a.appendChild(h("button", { type: "button", class: "btn btn-outline", on: { click: x[1] } }, x[0])); });
    return a;
  }

  // ---------- Livres ----------
  function books(p) {
    var list = h("div", { class: "grid" }), box = h("div", {});
    p.append(h("h2", {}, "Livres"), list, h("h3", { style: "margin-top:2rem" }, "Ajouter ou modifier un livre"), box);
    var LABEL = { pending: "En attente", approved: "Approuvé", rejected: "Refusé" };
    function load() {
      db.from("documents").select("*").order("created_at", { ascending: false }).then(function (r) {
        list.textContent = "";
        if (r.error) { list.textContent = "Erreur de chargement."; return; }
        if (!r.data.length) list.textContent = "Aucun livre pour le moment.";
        r.data.forEach(function (d) {
          var a = [];
          if (d.status !== "approved") a.push(["Approuver", function () { setStatus(d.id, "approved"); }]);
          if (d.status !== "rejected") a.push(["Refuser", function () { setStatus(d.id, "rejected"); }]);
          a.push(["Modifier", function () { edit(d); }]);
          a.push(["Supprimer", function () {
            if (!confirm("Supprimer « " + d.title + " » ?")) return;
            db.storage.from("library").remove([d.file_path].concat(d.cover_path ? [d.cover_path] : [])).then(function () { return db.from("documents").delete().eq("id", d.id); }).then(load);
          }]);
          list.appendChild(h("div", { class: "card" }, h("span", { class: "tag" }, LABEL[d.status]), h("h3", {}, d.title), h("p", {}, [d.author, d.category].filter(Boolean).join(" · ")), actions(a)));
        });
      });
    }
    function setStatus(id, s) { db.from("documents").update({ status: s }).eq("id", id).then(load); }
    function edit(d) {
      box.textContent = "";
      var fields = [["title", "Titre", "text", null, true], ["author", "Auteur"], ["category", "Catégorie"], ["description", "Description", "textarea"],
        ["cover", d ? "Remplacer la couverture (JPG, PNG ou WEBP)" : "Image de couverture (JPG, PNG ou WEBP)", "file", null, false],
        ["status", "Statut", "select", [["approved", "Approuvé"], ["pending", "En attente"], ["rejected", "Refusé"]]],
        ["file", d ? "Remplacer le fichier (PDF ou EPUB, 20 Mo max)" : "Fichier (PDF ou EPUB, 20 Mo max)", "file", null, !d]];
      box.appendChild(wilForm(fields, d || { status: "approved" }, d ? "Enregistrer" : "Ajouter", function (v, say, btn, f) {
        btn.disabled = true;
        var rec = { title: v.title, author: v.author, category: v.category, description: v.description, status: v.status };
        function save(path, coverPath) {
          if (path) rec.file_path = path;
          if (coverPath) rec.cover_path = coverPath;
          var q = d ? db.from("documents").update(rec).eq("id", d.id) : db.from("documents").insert(rec);
          q.then(function (r) {
            btn.disabled = false;
            if (r.error) return say("Échec : " + r.error.message, false);
            say("Enregistré.", true); if (!d) f.reset(); load();
          });
        }
        var stamp = Date.now();
        function uploadCover(filePath) {
          if (!v.cover) return save(filePath, null);
          var cp = "admin/covers/" + stamp + "-" + wilSafeName(v.cover.name);
          db.storage.from("library").upload(cp, v.cover, { upsert: false }).then(function (r) {
            if (r.error) { btn.disabled = false; return say("Envoi de la couverture impossible : " + r.error.message, false); }
            save(filePath, cp);
          });
        }
        if (v.file) {
          var path = "admin/books/" + stamp + "-" + wilSafeName(v.file.name);
          db.storage.from("library").upload(path, v.file, { upsert: false }).then(function (r) {
            if (r.error) { btn.disabled = false; return say("Envoi du fichier impossible : " + r.error.message, false); }
            uploadCover(path);
          });
        } else uploadCover(null);
      }));
    }
    edit(null); load();
  }

  // ---------- Formations ----------
  function formations(p) {
    var list = h("div", { class: "grid" }), box = h("div", {});
    p.append(h("h2", {}, "Formations"), list, h("h3", { style: "margin-top:2rem" }, "Ajouter ou modifier une formation"), box);
    function load() {
      db.from("formations").select("*").order("created_at", { ascending: false }).then(function (r) {
        list.textContent = "";
        if (r.error) { list.textContent = "Erreur de chargement."; return; }
        if (!r.data.length) list.textContent = "Aucune formation pour le moment.";
        r.data.forEach(function (d) {
          list.appendChild(h("div", { class: "card" }, h("span", { class: "tag" }, d.is_published ? "Publiée" : "Brouillon"), h("h3", {}, d.title), h("p", {}, d.category || ""),
            actions([["Modifier", function () { edit(d); }], ["Supprimer", function () {
              if (confirm("Supprimer « " + d.title + " » ?")) db.from("formations").delete().eq("id", d.id).then(load);
            }]])));
        });
      });
    }
    function edit(d) {
      box.textContent = "";
      var fields = [["title", "Titre", "text", null, true], ["category", "Catégorie"], ["description", "Description", "textarea"],
        ["schedule_text", "Dates (facultatif, seulement si confirmées)"], ["price_text", "Tarif (facultatif, seulement si confirmé)"], ["is_published", "Publier sur la page Formations", "checkbox"]];
      box.appendChild(wilForm(fields, d, d ? "Enregistrer" : "Ajouter", function (v, say, btn, f) {
        btn.disabled = true;
        var q = d ? db.from("formations").update(v).eq("id", d.id) : db.from("formations").insert(v);
        q.then(function (r) {
          btn.disabled = false;
          if (r.error) return say("Échec : " + r.error.message, false);
          say("Enregistré.", true); if (!d) f.reset(); load();
        });
      }));
    }
    edit(null); load();
  }

  // ---------- Membres ----------
  function members(p) {
    var list = h("div", { class: "grid" });
    p.append(h("h2", {}, "Membres"), h("p", {}, "Tous les membres ayant confirmé leur compte peuvent accéder à la bibliothèque. Les partages sont suivis séparément et ne conditionnent plus l'accès."), list);
    function load() {
      db.rpc("admin_members").then(function (r) {
        list.textContent = "";
        if (r.error) { list.textContent = "Erreur de chargement."; return; }
        if (!r.data.length) list.textContent = "Aucun membre pour le moment.";
        r.data.forEach(function (m) {
          list.appendChild(h("div", { class: "card" },
            h("span", { class: "tag" }, m.role === "admin" ? "Administrateur" : "Accès actif"),
            h("h3", {}, m.full_name || "(sans nom)"),
            h("p", {}, (m.email || "") + " · Inscriptions référées : " + (m.referrals || 0))
          ));
        });
      });
    }
    load();
  }
})();
