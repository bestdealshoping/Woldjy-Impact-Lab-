// Bibliothèque numérique WIL, expérience de lecture immersive.
(function(){
var db=window.wilDb,root=document.getElementById("library-app"),h=wilEl;
if(!root)return;
if(!db){root.textContent="Le service de bibliothèque est indisponible.";return;}
db.auth.getSession().then(function(s){
var session=s.data&&s.data.session;if(!session){location.replace("login.html?redirect=bibliotheque.html");return;}
db.from("profiles").select("role,full_name").eq("id",session.user.id).single().then(function(p){if(p.error){root.textContent="Impossible de charger votre profil.";return;}render(session.user.id,p.data);});
});
function node(tag,cls,txt){return h(tag,{class:cls||""},txt||"");}
function render(uid,me){
root.textContent="";
var head=node("section","library-welcome");
head.append(node("span","library-kicker","WOLDJY IMPACT LAB · DIGITAL LIBRARY"),node("h2","library-welcome-title","Un monde de connaissances vous attend."),node("p","library-welcome-text","Explorez nos collections, découvrez de nouveaux auteurs et prenez le temps de lire." ));
var headActions=node("div","library-head-actions");
headActions.append(h("a",{class:"btn btn-light",href:me.role==="admin"?"admin.html":"espace-client.html"},me.role==="admin"?"Administration":"Mon espace"),h("button",{class:"btn btn-glass",type:"button",on:{click:function(){db.auth.signOut().then(function(){location.href="login.html";});}}},"Déconnexion"));
head.append(headActions);root.append(head);
var stats=node("div","library-stats");
var total=node("div","library-stat");total.append(node("strong","","0"),node("span","","Ouvrages disponibles"));
var author=node("div","library-stat");author.append(node("strong","","✍"),node("span","","Espace auteurs"));
var reading=node("div","library-stat");reading.append(node("strong","","PDF"),node("span","","Lecture en ligne"));
stats.append(total,author,reading);root.append(stats);
var intro=node("div","library-section-title");intro.append(node("span","library-kicker","NOS COLLECTIONS"),node("h2","","Les rayonnages"),node("p","","Choisissez une catégorie et trouvez votre prochaine lecture."));
root.append(intro);
var toolbar=node("div","library-toolbar"),search=h("input",{type:"search",class:"library-search",placeholder:"Rechercher un titre, un auteur ou un thème…","aria-label":"Rechercher un livre"});
var cats=node("div","library-categories"),shelves=node("div","library-shelves");
toolbar.append(search);root.append(toolbar,cats,shelves);
var docs=[],active=null;
function draw(){
shelves.textContent="";
var q=search.value.trim().toLowerCase();
var shown=docs.filter(function(d){return(!active||d.category===active)&&(!q||[d.title,d.author,d.description,d.category].join(" ").toLowerCase().includes(q));});
if(!shown.length){shelves.append(node("div","library-empty","Aucun ouvrage ne correspond à votre recherche pour le moment."));return;}
shown.forEach(function(d,i){
var card=node("article","book-card");
var cover=node("div","book-cover");
var placeholder=node("div","book-placeholder");placeholder.append(node("span","book-placeholder-mark","W"),node("span","book-placeholder-label","WIL · LIBRARY"));
cover.append(placeholder);
if(d.cover_path){db.storage.from("library").createSignedUrl(d.cover_path,600).then(function(u){if(!u.error){var img=h("img",{src:u.data.signedUrl,alt:"Couverture de "+d.title,loading:"lazy"});cover.textContent="";cover.append(img);}});}
var info=node("div","book-info");info.append(node("span","book-category",d.category||"Collection"),node("h3","",d.title),node("p","book-author",d.author||"Auteur Woldjy Impact Lab"),node("p","book-description",d.description||"Découvrez cet ouvrage dans notre bibliothèque numérique."));
var actions=node("div","book-actions");
actions.append(h("button",{class:"btn btn-primary",type:"button",on:{click:function(){db.storage.from("library").createSignedUrl(d.file_path,900).then(function(u){if(u.error){alert("Lecture indisponible : "+u.error.message);return;}if((d.file_path.split(".").pop()||"").toLowerCase()==="pdf"){var win=window.open(u.data.signedUrl,"_blank","noopener");if(!win)location.href=u.data.signedUrl;}else{alert("La lecture intégrée est disponible pour les PDF. Utilisez Télécharger pour ce format.");}});}}},"Lire le livre"));
actions.append(h("button",{class:"btn btn-outline",type:"button",on:{click:function(){db.storage.from("library").createSignedUrl(d.file_path,60,{download:true}).then(function(u){if(u.error){alert("Téléchargement indisponible.");return;}location.href=u.data.signedUrl;});}}},"Télécharger"));
info.append(actions);card.append(cover,info);shelves.append(card);
});
}
search.addEventListener("input",draw);
db.from("documents").select("id,title,author,description,category,file_path,cover_path,status,uploaded_by,created_at").eq("status","approved").order("created_at",{ascending:false}).then(function(r){
if(r.error){shelves.textContent="Impossible de charger les ouvrages.";return;}
docs=r.data||[];total.querySelector("strong").textContent=docs.length;
var all=h("button",{class:"library-filter active",type:"button",on:{click:function(){active=null;cats.querySelectorAll("button").forEach(function(b){b.classList.remove("active");});all.classList.add("active");draw();}}},"Tous les livres");
cats.append(all);[...new Set(docs.map(function(d){return d.category;}).filter(Boolean))].forEach(function(c){var b=h("button",{class:"library-filter",type:"button",on:{click:function(){active=c;cats.querySelectorAll("button").forEach(function(x){x.classList.remove("active");});b.classList.add("active");draw();}}},c);cats.append(b);});
draw();
});
var pitch=node("section","author-banner");var pitchCopy=node("div","");pitchCopy.append(node("span","library-kicker","ESPACE AUTEURS"),node("h2","","Votre prochain livre peut trouver ses lecteurs ici."),node("p","","Vous êtes auteur ou autrice ? Proposez votre manuscrit à notre comité éditorial. Après examen et validation, votre ouvrage pourra rejoindre nos rayonnages."));
var pitchBtn=h("a",{class:"btn btn-light",href:"#proposer-livre"},"Proposer mon livre ↗");pitchCopy.append(pitchBtn);pitch.append(pitchCopy);root.append(pitch);
var proposal=node("section","author-form-section");proposal.id="proposer-livre";proposal.append(node("h2","","Soumettre un manuscrit"),node("p","","Complétez les informations de votre ouvrage et joignez votre fichier PDF ou EPUB."));
proposal.appendChild(wilForm([["title","Titre du livre","text",null,true],["author","Nom de l’auteur"],["description","Résumé du livre","textarea"],["category","Catégorie"],["file","Manuscrit (PDF ou EPUB)","file",null,true]],null,"Envoyer mon manuscrit",function(v,say,btn,form){
if(v.file.size>20*1024*1024){say("Le fichier dépasse la limite de 20 Mo.",false);return;}
btn.disabled=true;var path=uid+"/propositions/"+Date.now()+"-"+wilSafeName(v.file.name);
db.storage.from("library").upload(path,v.file,{upsert:false}).then(function(up){if(up.error)throw up.error;return db.from("documents").insert({title:v.title,author:v.author,description:v.description,category:v.category,file_path:path,uploaded_by:uid,status:"pending"});}).then(function(ins){if(ins.error)throw ins.error;form.reset();say("Votre manuscrit a été envoyé. Vous pourrez suivre son examen dans votre espace personnel.",true);loadMine();}).catch(function(e){say("Envoi impossible : "+e.message,false);}).finally(function(){btn.disabled=false;});
}));
root.append(proposal);
var mine=node("section","author-submissions");mine.append(node("h2","","Mes propositions"));var mineList=node("div","submission-list");mine.append(mineList);root.append(mine);
function loadMine(){db.from("documents").select("id,title,status,created_at").eq("uploaded_by",uid).order("created_at",{ascending:false}).then(function(r){mineList.textContent="";if(r.error){mineList.textContent="Impossible de charger vos propositions.";return;}if(!r.data.length){mineList.append(node("p","library-empty","Vous n’avez pas encore proposé de livre."));return;}r.data.forEach(function(d){var c=node("article","submission-item");c.append(node("strong","",d.title),node("span","submission-status",d.status==="approved"?"Publié":d.status==="rejected"?"Refusé":"En attente de validation"));mineList.append(c);});});}
loadMine();
}
})();