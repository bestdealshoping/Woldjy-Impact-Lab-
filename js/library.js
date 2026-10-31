// Bibliothèque numérique : rayonnages, lecture en ligne, téléchargement et propositions d'ouvrages.
(function () {
  var db=window.wilDb, root=document.getElementById("library-app"), h=wilEl;
  if(!root)return;
  if(!db){root.textContent="Le service de bibliothèque est indisponible.";return;}
  db.auth.getSession().then(function(s){
    var session=s.data&&s.data.session;
    if(!session){location.replace("login.html?redirect=bibliotheque.html");return;}
    var uid=session.user.id;
    db.from("profiles").select("role,full_name").eq("id",uid).single().then(function(p){
      if(p.error){root.textContent="Impossible de charger votre profil.";return;}
      render(uid,p.data);
    });
  });
  function render(uid,me){
    root.textContent="";
    var top=h("div",{class:"actions"});
    top.appendChild(h("a",{class:"btn btn-outline",href:me.role==="admin"?"admin.html":"espace-client.html"},me.role==="admin"?"Administration":"Mon espace"));
    top.appendChild(h("button",{class:"btn btn-outline",type:"button",on:{click:function(){db.auth.signOut().then(function(){location.href="login.html";});}}},"Se déconnecter"));
    root.appendChild(top);
    root.appendChild(h("div",{class:"section-heading",style:"margin-top:2rem"},h("div",{},h("span",{class:"eyebrow eyebrow-dark"},"WIL DIGITAL LIBRARY"),h("h2",{},"Explorez nos rayonnages")),h("p",{},"Choisissez un ouvrage, lisez-le directement sur le site ou téléchargez-le lorsque le téléchargement est autorisé.")));
    var filters=h("div",{class:"actions"}), all=h("button",{class:"btn btn-primary",type:"button"},"Tous les livres"), categories=h("div",{class:"actions"}), shelves=h("div",{class:"grid grid-3"});
    filters.append(all);root.append(filters,categories,shelves);
    var docs=[];
    function renderShelves(category){
      shelves.textContent="";
      var shown=docs.filter(function(d){return !category||d.category===category;});
      if(!shown.length){shelves.appendChild(h("p",{}, "Aucun livre publié dans cette catégorie pour le moment."));return;}
      shown.forEach(function(d){
        var card=h("article",{class:"card"});
        if(d.cover_path){db.storage.from("library").createSignedUrl(d.cover_path,600).then(function(u){if(!u.error){var img=h("img",{src:u.data.signedUrl,alt:"Couverture de "+d.title,loading:"lazy",style:"width:100%;height:230px;object-fit:cover;border-radius:12px;margin-bottom:1rem"});card.insertBefore(img,card.firstChild);}});}
        card.append(h("span",{class:"tag"},d.category||"Ouvrage"),h("h3",{},d.title),h("p",{},[d.author,d.description].filter(Boolean).join(" · ")));
        var actions=h("div",{class:"actions"});
        actions.appendChild(h("button",{class:"btn btn-primary",type:"button",on:{click:function(){
          db.storage.from("library").createSignedUrl(d.file_path,600).then(function(u){
            if(u.error){alert("Lecture indisponible : "+u.error.message);return;}
            var ext=(d.file_path.split(".").pop()||"").toLowerCase();
            if(ext==="pdf"){var win=window.open(u.data.signedUrl,"_blank","noopener");if(!win)location.href=u.data.signedUrl;}
            else {alert("La lecture intégrée est disponible pour les PDF. Vous pouvez télécharger cet ouvrage.");}
          });
        }}},"Lire en ligne"));
        actions.appendChild(h("button",{class:"btn btn-outline",type:"button",on:{click:function(){
          db.storage.from("library").createSignedUrl(d.file_path,60,{download:true}).then(function(u){if(u.error){alert("Téléchargement indisponible.");return;}location.href=u.data.signedUrl;});
        }}},"Télécharger"));
        card.appendChild(actions);shelves.appendChild(card);
      });
    }
    all.onclick=function(){renderShelves(null);};
    db.from("documents").select("id,title,author,description,category,file_path,cover_path,status,uploaded_by").eq("status","approved").order("created_at",{ascending:false}).then(function(r){
      if(r.error){shelves.textContent="Impossible de charger les livres publiés.";return;}
      docs=r.data||[];
      var cats=[...new Set(docs.map(function(d){return d.category;}).filter(Boolean))];
      cats.forEach(function(cat){categories.appendChild(h("button",{class:"btn btn-outline",type:"button",on:{click:function(){renderShelves(cat);}}},cat));});
      renderShelves(null);
    });
    var proposal=h("section",{class:"card",style:"margin-top:3rem"},h("span",{class:"eyebrow eyebrow-dark"},"DEVENEZ AUTEUR"),h("h2",{},"Vous souhaitez publier votre propre livre ?"),h("p",{},"Proposez votre manuscrit à Woldjy Impact Lab. Notre équipe examinera le contenu et les droits de diffusion avant toute publication."));
    proposal.appendChild(wilForm([["title","Titre du livre","text",null,true],["author","Nom de l’auteur"],["description","Résumé du livre","textarea"],["category","Catégorie"],["file","Manuscrit (PDF ou EPUB, 20 Mo maximum)","file",null,true]],null,"Soumettre mon livre",function(v,say,btn,form){
      btn.disabled=true;
      var path=uid+"/propositions/"+Date.now()+"-"+wilSafeName(v.file.name);
      db.storage.from("library").upload(path,v.file,{upsert:false}).then(function(up){
        if(up.error)throw up.error;
        return db.from("documents").insert({title:v.title,author:v.author,description:v.description,category:v.category,file_path:path,uploaded_by:uid,status:"pending"});
      }).then(function(ins){
        if(ins.error)throw ins.error;
        form.reset();say("Votre livre a bien été soumis. Il apparaîtra dans la bibliothèque après validation.",true);loadMine();
      }).catch(function(err){say("Soumission impossible : "+err.message,false);}).finally(function(){btn.disabled=false;});
    }));
    root.appendChild(proposal);
    var mine=h("section",{style:"margin-top:2rem"},h("h2",{},"Suivi de mes propositions")), mineList=h("div",{class:"grid"});
    mine.appendChild(mineList);root.appendChild(mine);
    function loadMine(){db.from("documents").select("id,title,status,created_at").eq("uploaded_by",uid).order("created_at",{ascending:false}).then(function(r){mineList.textContent="";if(r.error){mineList.textContent="Impossible de charger vos propositions.";return;}if(!r.data.length){mineList.textContent="Vous n’avez pas encore proposé de livre.";return;}r.data.forEach(function(d){mineList.appendChild(h("div",{class:"card"},h("h3",{},d.title),h("span",{class:"tag"},d.status==="approved"?"Publié":d.status==="rejected"?"Refusé":"En attente de validation")));});});}
    loadMine();
  }
})();