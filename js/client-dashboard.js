// Tableau de bord personnel WIL. Les autorisations restent contrôlées par Supabase RLS.
(function(){
document.addEventListener("DOMContentLoaded",function(){
var db=window.wilDb, welcome=document.getElementById("welcome"), list=document.getElementById("notification-list");
if(!db){if(list)list.textContent="Service indisponible.";return;}
var current=null, channel=null;
function el(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
function status(txt,ok){var n=document.getElementById("publication-status");n.textContent=txt;n.className="form-status "+(ok?"ok":"err");}
function setCount(id,value){var n=document.getElementById(id);if(n)n.textContent=String(value||0);}
function date(v){return v?new Date(v).toLocaleString():"Date indisponible";}
function loadNotifications(){
db.from("wil_notifications").select("*").eq("user_id",current.id).order("created_at",{ascending:false}).limit(40).then(function(r){
list.textContent="";if(r.error){list.textContent="Impossible de charger les notifications.";return;}
var unread=(r.data||[]).filter(function(x){return !x.read_at;}).length;setCount("client-notification-count",unread);setCount("unread-notifications",unread+" non lue(s)");
if(!r.data.length){list.append(el("p","wil-client-empty","Aucune notification pour le moment."));return;}
r.data.forEach(function(n){
var card=el("article","wil-client-notice"+(!n.read_at?" is-unread":""));
var content=el("div","");content.append(el("h3","",n.title||"Notification"),el("p","",n.body||""),el("time","",date(n.created_at)));
card.append(content);
if(!n.read_at){var b=el("button","btn btn-outline","Marquer comme lu");b.type="button";b.onclick=function(){b.disabled=true;db.from("wil_notifications").update({read_at:new Date().toISOString()}).eq("id",n.id).eq("user_id",current.id).then(function(x){if(x.error){b.disabled=false;return;}loadNotifications();});};card.append(b);}
list.append(card);
});
});
}
function loadMessages(){
db.from("wil_messages").select("id",{count:"exact",head:true}).eq("is_read",false).neq("sender_id",current.id).then(function(r){if(!r.error){setCount("client-message-count",r.count);setCount("unread-messages",(r.count||0)+" message(s) non lu(s)");}});
}
function loadSubmissions(){
var box=document.getElementById("client-submissions-list");
db.from("documents").select("id,title,status,created_at").eq("uploaded_by",current.id).order("created_at",{ascending:false}).limit(5).then(function(r){
box.textContent="";if(r.error){box.textContent="Impossible de charger vos propositions.";return;}
setCount("client-publication-count",r.data.length);
if(!r.data.length){box.append(el("p","wil-client-empty","Vous n’avez pas encore envoyé de document."));return;}
r.data.forEach(function(d){var row=el("article","wil-client-submission");var label=d.status==="approved"?"Approuvé":d.status==="rejected"?"Non retenu":"En attente";row.append(el("strong","",d.title),el("span","wil-submission-badge "+d.status,label),el("small","",date(d.created_at)));box.append(row);});
});
}
db.auth.getSession().then(function(r){
current=r.data&&r.data.session&&r.data.session.user;
if(!current){location.replace("login.html?redirect=espace-client.html");return;}
db.from("profiles").select("full_name,role").eq("id",current.id).single().then(function(p){
if(p.error){welcome.textContent="Mon espace client";}else{if(p.data.role==="admin"){location.replace("admin.html");return;}welcome.textContent="Bonjour, "+(p.data.full_name||current.email||"membre")+".";}
});
loadNotifications();loadMessages();loadSubmissions();
if(db.channel){channel=db.channel("client-live-"+current.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"wil_notifications",filter:"user_id=eq."+current.id},function(){loadNotifications();}).on("INSERT",{schema:"public",table:"wil_messages"},function(payload){if(payload.new.sender_id!==current.id)loadMessages();}).subscribe();}
});
var logout=document.getElementById("logout");if(logout)logout.onclick=function(){db.auth.signOut().then(function(){location.href="index.html";});};
var all=document.getElementById("mark-all-read");if(all)all.onclick=function(){all.disabled=true;db.from("wil_notifications").update({read_at:new Date().toISOString()}).eq("user_id",current.id).is("read_at",null).then(function(r){all.disabled=false;if(r.error){alert("Impossible de mettre à jour les notifications.");return;}loadNotifications();});};
var form=document.getElementById("publication-form");if(form)form.addEventListener("submit",async function(e){
e.preventDefault();var file=document.getElementById("doc-file").files[0];if(!file||!current)return;
if(file.size>20*1024*1024){status("Le fichier dépasse la limite de 20 Mo.",false);return;}
var ext=(file.name.split(".").pop()||"").toLowerCase();if(["pdf","doc","docx","epub"].indexOf(ext)===-1){status("Format non accepté. Utilisez PDF, DOC, DOCX ou EPUB.",false);return;}
var btn=form.querySelector('button[type="submit"]');btn.disabled=true;
try{
var safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=current.id+"/propositions/"+Date.now()+"-"+safe;
var up=await db.storage.from("library").upload(path,file,{upsert:false});if(up.error)throw up.error;
var ins=await db.from("documents").insert({title:document.getElementById("doc-title").value.trim(),description:document.getElementById("doc-description").value.trim(),category:document.getElementById("doc-category").value.trim(),file_path:path,author:current.email,status:"pending",uploaded_by:current.id});
if(ins.error)throw ins.error;form.reset();status("Votre document a été soumis. Il sera examiné par notre équipe.",true);loadSubmissions();
}catch(err){status("Envoi impossible : "+err.message,false);}finally{btn.disabled=false;}
});
});
})();