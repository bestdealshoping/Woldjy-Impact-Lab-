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
    var shell = h("div", { class: "wil-admin-shell" });
    var heading = h("div", { class: "wil-admin-heading" },
      h("span", { class: "wil-admin-kicker" }, "WOLDJY IMPACT LAB · CONTROL CENTER"),
      h("h2", {}, "Centre de pilotage"),
      h("p", {}, "Gérez votre plateforme, vos clients et vos ressources depuis un seul espace.")
    );
    var tabs = h("nav", { class: "wil-admin-tabs", "aria-label": "Navigation administration" });
    var panel = h("section", { class: "wil-admin-panel" });
    var sections = [["⌂", "Tableau de bord", dashboard], ["✉", "Messagerie", inbox], ["◉", "Notifications", notificationCenter], ["✎", "Contenu du site", contentManager], ["▣", "Livres", books], ["▤", "Formations", formations], ["♙", "Membres", members]];
    sections.forEach(function (d, i) {
      var b = h("button", { type: "button", class: "wil-admin-tab" + (i === 0 ? " active" : ""), on: { click: function () {
        tabs.querySelectorAll(".wil-admin-tab").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); panel.textContent = ""; d[2](panel);
      } } }, h("span", { class: "wil-admin-tab-icon" }, d[0]), h("span", {}, d[1]));
      tabs.appendChild(b);
    });
    shell.append(heading, tabs, panel);
    root.textContent = ""; root.appendChild(shell); dashboard(panel);
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
    var membersData = [], search = h("input", { type: "search", placeholder: "Rechercher par nom ou adresse e-mail…", "aria-label": "Rechercher un membre" });
    var roleFilter = h("select", { "aria-label": "Filtrer par rôle" },
      h("option", { value: "all" }, "Tous les rôles"),
      h("option", { value: "client" }, "Clients"),
      h("option", { value: "admin" }, "Administrateurs"));
    var accessFilter = h("select", { "aria-label": "Filtrer par accès" },
      h("option", { value: "all" }, "Tous les accès"),
      h("option", { value: "active" }, "Accès actif"),
      h("option", { value: "restricted" }, "Accès personnalisé"));
    var summary = h("p", { class: "wil-members-summary" }, "Chargement des membres…");
    var controls = h("div", { class: "wil-members-controls" }, search, roleFilter, accessFilter);
    var list = h("div", { class: "grid wil-members-grid" });
    var refresh = h("button", { type: "button", class: "btn btn-outline", on: { click: load } }, "Actualiser");
    p.append(h("h2", {}, "Gestion des membres"), h("p", {}, "Recherchez un compte, filtrez les profils et consultez les détails de chaque membre. Les changements de privilèges restent protégés."), controls, summary, refresh, list);
    search.addEventListener("input", render);
    roleFilter.addEventListener("change", render);
    accessFilter.addEventListener("change", render);

    function render() {
      var term = search.value.trim().toLocaleLowerCase();
      var role = roleFilter.value, access = accessFilter.value;
      var rows = membersData.filter(function (m) {
        var text = ((m.full_name || "") + " " + (m.email || "")).toLocaleLowerCase();
        var accessType = m.access_override ? "restricted" : "active";
        return (!term || text.indexOf(term) !== -1) &&
          (role === "all" || m.role === role) &&
          (access === "all" || accessType === access);
      });
      summary.textContent = rows.length + " membre(s) affiché(s) sur " + membersData.length + " compte(s).";
      list.textContent = "";
      if (!rows.length) { list.append(h("div", { class: "card" }, "Aucun membre ne correspond à votre recherche.")); return; }
      rows.forEach(function (m) {
        var accessText = m.access_override ? "Accès personnalisé" : "Accès actif";
        var card = h("article", { class: "card wil-member-card" });
        var top = h("div", { class: "wil-member-card-top" },
          h("span", { class: "tag" }, m.role === "admin" ? "Administrateur" : "Client"),
          h("span", { class: "wil-member-access" }, accessText));
        var name = h("h3", {}, m.full_name || "Nom non renseigné");
        var email = h("p", { class: "wil-member-email" }, m.email || "E-mail non disponible");
        var detail = h("div", { class: "wil-member-details", hidden: true });
        detail.append(
          h("p", {}, h("strong", {}, "Identifiant : "), m.id || "Non disponible"),
          h("p", {}, h("strong", {}, "Date d’inscription : "), m.created_at ? new Date(m.created_at).toLocaleDateString() : "Non disponible"),
          h("p", {}, h("strong", {}, "Inscriptions référées : "), String(m.referrals || 0)),
          h("p", {}, h("strong", {}, "Rôle : "), m.role === "admin" ? "Administrateur" : "Client"),
          h("p", {}, h("strong", {}, "Accès : "), accessText)
        );
        var toggle = h("button", { type: "button", class: "btn btn-outline", "aria-expanded": "false" }, "Voir les détails");
        toggle.onclick = function () {
          var show = detail.hidden;
          detail.hidden = !show;
          toggle.textContent = show ? "Masquer les détails" : "Voir les détails";
          toggle.setAttribute("aria-expanded", show ? "true" : "false");
        };
        card.append(top, name, email, toggle, detail);
        list.appendChild(card);
      });
    }
    function load() {
      refresh.disabled = true;
      summary.textContent = "Chargement des membres…";
      db.rpc("admin_members").then(function (r) {
        refresh.disabled = false;
        if (r.error) { summary.textContent = "Impossible de charger les membres : " + r.error.message; list.textContent = ""; return; }
        membersData = Array.isArray(r.data) ? r.data : [];
        render();
      }).catch(function (e) {
        refresh.disabled = false;
        summary.textContent = "Erreur : " + e.message;
      });
    }
    load();
  }
  function dashboard(p) {
    var intro = h("div", { class: "wil-admin-welcome" },
      h("div", {},
        h("span", { class: "wil-admin-kicker" }, "VOTRE ACTIVITÉ EN UN COUP D’ŒIL"),
        h("h2", {}, "Bonjour, administrateur."),
        h("p", {}, "Voici les indicateurs principaux de votre espace Woldjy Impact Lab.")
      ),
      h("div", { class: "wil-admin-welcome-mark" }, "WIL")
    );
    var grid = h("div", { class: "wil-admin-stats" });
    var recent = h("div", { class: "wil-admin-info-grid" });
    var info = h("article", { class: "wil-admin-info-card wil-admin-info-blue" },
      h("span", { class: "wil-admin-info-icon" }, "↗"),
      h("h3", {}, "Développez votre communauté"),
      h("p", {}, "Suivez les comptes, répondez aux demandes et accompagnez vos membres.")
    );
    var resources = h("article", { class: "wil-admin-info-card wil-admin-info-purple" },
      h("span", { class: "wil-admin-info-icon" }, "✦"),
      h("h3", {}, "Gardez vos ressources à jour"),
      h("p", {}, "Publiez des livres et des formations pour enrichir votre bibliothèque.")
    );
    recent.append(info, resources);
    p.append(intro, grid, recent);
    db.auth.getUser().then(function (u) {
      var adminId = u.data && u.data.user ? u.data.user.id : "";
      var unreadQuery = db.from("wil_messages").select("id", { count: "exact", head: true }).eq("is_read", false);
      if (adminId) unreadQuery = unreadQuery.neq("sender_id", adminId);
      return Promise.all([
        db.from("wil_conversations").select("id", { count: "exact", head: true }),
        unreadQuery,
        db.from("profiles").select("id", { count: "exact", head: true }),
        db.from("wil_notifications").select("id", { count: "exact", head: true }),
        db.from("documents").select("id", { count: "exact", head: true }),
        db.from("formations").select("id", { count: "exact", head: true })
      ]);
    }).then(function (r) {
      var stats = [
        ["✉", "Conversations", r[0], "blue"],
        ["●", "Messages à lire", r[1], "orange"],
        ["♙", "Comptes enregistrés", r[2], "green"],
        ["♧", "Notifications", r[3], "pink"],
        ["▣", "Livres", r[4], "purple"],
        ["▤", "Formations", r[5], "teal"]
      ];
      stats.forEach(function (x) {
        var card = h("article", { class: "wil-admin-stat wil-admin-stat-" + x[3] },
          h("span", { class: "wil-admin-stat-icon" }, x[0]),
          h("div", { class: "wil-admin-stat-copy" },
            h("strong", {}, x[2].error ? "—" : String(x[2].count || 0)),
            h("span", {}, x[1])
          )
        );
        grid.appendChild(card);
      });
    }).catch(function () {
      grid.appendChild(h("p", { class: "wil-admin-error" }, "Les statistiques ne sont pas disponibles pour le moment."));
    });
  }
  function inbox(p) {
    p.append(h("h2",{},"Messagerie clients"),h("p",{},"Les conversations sont classées par client. Le nom du client apparaît dans chaque discussion."));
    var wrap=h("div",{class:"wil-chat-shell wil-admin-chat"}),list=h("aside",{class:"wil-chat-sidebar"}),chat=h("section",{class:"wil-chat-main"});list.append(h("div",{class:"wil-chat-top"},"Boîte de réception"));chat.append(h("div",{class:"wil-chat-thread"},h("div",{class:"wil-chat-placeholder"},"Sélectionnez une conversation pour afficher les messages.")));wrap.append(list,chat);p.append(wrap);
    db.auth.getUser().then(function(u){var admin=u.data.user;if(!admin)return;
      function load(){
        db.from("wil_conversations").select("*").order("updated_at",{ascending:false}).then(function(r){
          list.querySelectorAll(".wil-chat-item").forEach(function(x){x.remove();});
          if(r.error){list.append(h("p",{},r.error.message));return;}
          if(!r.data.length){list.append(h("p",{class:"wil-chat-empty"},"Aucune conversation pour le moment."));return;}
          var ids=[...new Set(r.data.map(function(c){return c.user_id;}))];
          db.from("profiles").select("id,full_name,email").in("id",ids).then(function(pr){
            var people={};if(!pr.error)(pr.data||[]).forEach(function(x){people[x.id]=x;});
            r.data.forEach(function(c){
              var person=people[c.user_id]||{},name=person.full_name||person.email||"Client sans nom";
              var b=h("button",{type:"button",class:"wil-chat-item"},h("span",{class:"wil-chat-avatar"},(name.charAt(0)||"C").toUpperCase()),h("span",{class:"wil-chat-item-text"},name),h("small",{class:"wil-chat-state"},(c.subject||"Conversation")+" · "+(c.status==="answered"?"Répondu":"Ouvert")));
              b.onclick=function(){open(c,name,person.email||"");};list.append(b);
            });
          });
        });
      }
      function open(c,name,email){
        chat.textContent="";var thread=h("div",{class:"wil-chat-thread"});
        thread.append(h("div",{class:"wil-chat-heading"},name+" · "+(c.subject||"Conversation")),h("p",{class:"wil-chat-person-meta"},email||"Compte client Woldjy Impact Lab"));chat.append(thread);
        db.from("wil_messages").select("*").eq("conversation_id",c.id).order("created_at").then(function(m){
          if(m.error){thread.append(h("p",{},m.error.message));return;}
          var feed=h("div",{class:"wil-chat-feed"});
          m.data.forEach(function(x){var mine=x.sender_id===admin.id,box=h("article",{class:"wil-bubble "+(mine?"mine":"theirs")},h("div",{class:"wil-bubble-label"},mine?"Woldjy Impact Lab":name),h("p",{},x.body),h("time",{},new Date(x.created_at).toLocaleString()));feed.append(box);});
          thread.append(feed);feed.scrollTop=feed.scrollHeight;
          db.from("wil_messages").update({is_read:true}).eq("conversation_id",c.id).neq("sender_id",admin.id);
          var form=h("form",{class:"wil-chat-reply"}),area=h("textarea",{required:true,rows:"2",placeholder:"Écrire à "+name+"..."}),send=h("button",{type:"submit",class:"btn btn-primary"},"Envoyer");form.append(area,send);thread.append(form);
          form.onsubmit=function(e){e.preventDefault();var val=area.value.trim();if(!val)return;send.disabled=true;db.from("wil_messages").insert({conversation_id:c.id,sender_id:admin.id,body:val}).then(function(x){if(x.error)throw x.error;return db.from("wil_conversations").update({status:"answered",updated_at:new Date().toISOString()}).eq("id",c.id);}).then(function(x){if(x.error)throw x.error;open(c,name,email);load();}).catch(function(x){alert("Envoi impossible : "+x.message);send.disabled=false;});};
        });
      }
      load();
      if(db.channel)db.channel("wil-admin-inbox").on("postgres_changes",{event:"*",schema:"public",table:"wil_messages"},load).subscribe();
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
