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
    [["Tableau de bord", dashboard], ["Messagerie", inbox], ["Notifications", notificationCenter], ["Contenu du site", contentManager], ["Livres", books], ["Formations", formations], ["Membres", members]].forEach(function (d) {
      tabs.appendChild(h("button", { type: "button", class: "btn btn-outline", on: { click: function () { panel.textContent = ""; d[1](panel); } } }, d[0]));
    });
    root.textContent = ""; root.append(tabs, panel); dashboard(panel);
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
    function setStatus(id, s) {
      db.from("documents").select("id,title,uploaded_by").eq("id", id).single().then(function (r) {
        if (r.error) throw r.error;
        var item = r.data;
        return db.from("documents").update({ status: s }).eq("id", id).then(function (u) {
          if (u.error) throw u.error;
          if (!item.uploaded_by) return;
          var title = s === "approved" ? "Votre livre a été accepté" : "Mise à jour de votre proposition de livre";
          var body = s === "approved" ? "Votre ouvrage « " + item.title + " » a été accepté et sera visible dans la bibliothèque." : (s === "rejected" ? "Votre ouvrage « " + item.title + " » n’est pas retenu. Contactez notre équipe pour plus d’informations." : "Le statut de votre ouvrage a changé.");
          return db.from("wil_notifications").insert({user_id:item.uploaded_by,title:title,body:body,kind:"publication"});
        });
      }).then(function (r) { if (r && r.error) throw r.error; load(); }).catch(function (e) { alert("Modification impossible : " + e.message); });
    }
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
  function dashboard(p) {
    p.append(h("h2",{},"Tableau de bord")); var grid=h("div",{class:"grid"}); p.appendChild(grid);
    Promise.all([db.from("wil_conversations").select("id",{count:"exact",head:true}),db.from("wil_messages").select("id",{count:"exact",head:true}).eq("is_read",false),db.from("profiles").select("id",{count:"exact",head:true}),db.from("wil_notifications").select("id",{count:"exact",head:true})]).then(function(r){
      [["Conversations",r[0]],["Messages non lus",r[1]],["Comptes clients",r[2]],["Notifications",r[3]]].forEach(function(x){grid.appendChild(h("div",{class:"card"},h("h3",{},x[1].error?"Erreur":String(x[1].count||0)),h("p",{},x[0])));});
    });
  }
  function inbox(p) {
    p.append(h("h2",{},"Messagerie clients")); var list=h("div",{class:"grid"}), chat=h("div",{class:"card"}); p.append(list,chat);
    db.auth.getUser().then(function(u){ var admin=u.data.user; if(!admin)return;
      db.from("wil_conversations").select("*").order("updated_at",{ascending:false}).then(function(r){
        if(r.error){list.textContent=r.error.message;return;} if(!r.data.length){list.textContent="Aucune conversation pour le moment.";return;}
        r.data.forEach(function(c){var b=h("button",{type:"button",class:"btn btn-outline"},(c.subject||"Conversation")+" · "+c.status); b.onclick=function(){
          chat.textContent=""; chat.appendChild(h("h3",{},c.subject||"Conversation"));
          db.from("wil_messages").select("*").eq("conversation_id",c.id).order("created_at").then(function(m){
            if(m.error){chat.appendChild(h("p",{},m.error.message));return;}
            m.data.forEach(function(x){chat.appendChild(h("div",{class:"card"},h("p",{},x.body),h("small",{},new Date(x.created_at).toLocaleString())));});
            db.from("wil_messages").update({is_read:true}).eq("conversation_id",c.id).neq("sender_id",admin.id);
          });
          var form=h("form",{}), field=h("textarea",{required:true,rows:"4"}), send=h("button",{type:"submit",class:"btn btn-primary"},"Envoyer"); form.append(field,send); chat.appendChild(form);
          form.onsubmit=function(e){e.preventDefault(); if(!field.value.trim())return; send.disabled=true;
            db.from("wil_messages").insert({conversation_id:c.id,sender_id:admin.id,body:field.value.trim()}).then(function(x){if(x.error)throw x.error;return db.from("wil_conversations").update({status:"answered",updated_at:new Date().toISOString()}).eq("id",c.id);})
            .then(function(x){if(x.error)throw x.error;b.click();}).catch(function(x){alert(x.message);send.disabled=false;});
          };
        }; list.appendChild(b);});
      });
    });
  }
  function notificationCenter(p) {
    p.append(h("h2",{},"Notifications")); var list=h("div",{class:"grid"}); p.appendChild(list);
    db.from("wil_notifications").select("*").order("created_at",{ascending:false}).limit(100).then(function(r){if(r.error){list.textContent=r.error.message;return;} if(!r.data.length){list.textContent="Aucune notification.";return;} r.data.forEach(function(n){list.appendChild(h("div",{class:"card"},h("strong",{},n.title),h("p",{},n.body||""),h("small",{},new Date(n.created_at).toLocaleString())));});});
  }
  function contentManager(p) {
    p.append(h("h2",{},"Contenu du site"),h("p",{},"Gérez les textes et images enregistrés dans la base."));
    var form=h("form",{}), list=h("div",{class:"grid"});
    [["Clé unique","content_key"],["Titre","title"],["Texte","body"],["URL image","image_url"]].forEach(function(x){var label=h("label",{},x[0]);var input=x[1]==="body"?h("textarea",{name:x[1],rows:"3"}):h("input",{name:x[1],type:"text"});label.appendChild(input);form.appendChild(label);});
    var pub=h("input",{type:"checkbox",checked:true}); form.append(pub,document.createTextNode(" Publier "),h("button",{type:"submit",class:"btn btn-primary"},"Enregistrer")); p.append(form,list);
    form.onsubmit=function(e){e.preventDefault();var row={content_key:form.elements.content_key.value.trim(),title:form.elements.title.value,body:form.elements.body.value,image_url:form.elements.image_url.value||null,is_published:pub.checked,updated_at:new Date().toISOString()};if(!row.content_key)return;db.from("wil_site_content").upsert(row,{onConflict:"content_key"}).then(function(r){if(r.error){alert(r.error.message);return;}form.reset();pub.checked=true;load();});};
    function load(){list.textContent="";db.from("wil_site_content").select("*").order("updated_at",{ascending:false}).then(function(r){if(r.error){list.textContent=r.error.message;return;}r.data.forEach(function(x){var card=h("div",{class:"card"},h("strong",{},x.content_key+" · "+(x.title||"")),h("p",{},x.body||""));var b=h("button",{type:"button",class:"btn btn-outline"},"Modifier");b.onclick=function(){form.elements.content_key.value=x.content_key;form.elements.title.value=x.title||"";form.elements.body.value=x.body||"";form.elements.image_url.value=x.image_url||"";pub.checked=x.is_published;};card.appendChild(b);list.appendChild(card);});});} load();
  }
})();
