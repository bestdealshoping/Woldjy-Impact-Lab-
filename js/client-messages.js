// Messagerie client : conversations persistantes, réponses et notifications temps réel.
document.addEventListener("DOMContentLoaded",function(){
var root=document.getElementById("wil-client-messages");if(!root)return;
function el(tag,attrs,value){var n=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k]);});if(value!==undefined)n.textContent=value;return n;}
function start(){
var db=window.wilDb;if(!db){root.textContent="Messagerie indisponible.";return;}
db.auth.getSession().then(function(sr){
var session=sr.data&&sr.data.session;
if(!session){root.textContent="Connectez-vous pour accéder à votre messagerie.";root.append(el("a",{href:"login.html?redirect=contact.html",class:"btn btn-primary"},"Se connecter"));return;}
var uid=session.user.id,active=null,channel=null;
var form=el("form",{class:"form-card"}),grid=el("div",{class:"form-grid"}),subject=el("input",{required:"required",maxlength:"120",placeholder:"Sujet de votre demande"}),body=el("textarea",{required:"required",rows:"4",maxlength:"5000",placeholder:"Écrivez votre message..."});
var sf=el("div",{class:"field full"}),bf=el("div",{class:"field full"}),send=el("button",{type:"submit",class:"btn btn-primary"},"Nouvelle conversation"),notice=el("div",{class:"form-status",role:"status","aria-live":"polite"});
sf.append(el("label",{},"Sujet"),subject);bf.append(el("label",{},"Message"),body);grid.append(sf,bf);var sub=el("div",{class:"field full"});sub.append(send,notice);grid.append(sub);form.append(grid);
var history=el("div",{class:"grid"});root.textContent="";root.append(form,el("h3",{},"Mes conversations"),history);
function say(t,ok){notice.textContent=t;notice.className="form-status "+(ok?"ok":"err");}
function load(){
db.from("wil_conversations").select("id,subject,status,created_at,updated_at").eq("user_id",uid).order("updated_at",{ascending:false}).then(function(r){
history.textContent="";if(r.error){history.textContent="Erreur : "+r.error.message;return;}if(!r.data.length){history.textContent="Aucune conversation pour le moment.";return;}
r.data.forEach(function(c){var card=el("article",{class:"card"}),open=el("button",{class:"btn btn-outline",type:"button"},"Ouvrir la conversation");card.append(el("h3",{},c.subject),el("p",{},"Statut : "+c.status),open);var thread=el("div",{class:"grid"});card.append(thread);open.onclick=function(){thread.textContent="Chargement...";active=c.id;db.from("wil_messages").select("id,sender_id,body,created_at,is_read").eq("conversation_id",c.id).order("created_at",{ascending:true}).then(function(m){thread.textContent="";if(m.error){thread.textContent=m.error.message;return;}m.data.forEach(function(x){var own=x.sender_id===uid;thread.append(el("div",{class:"card"},(own?"Vous":"Woldjy Impact Lab")+" · "+new Date(x.created_at).toLocaleString()+"\n"+x.body));if(!own&&!x.is_read)db.from("wil_messages").update({is_read:true}).eq("id",x.id);});var reply=el("form",{class:"form-card"}),area=el("textarea",{required:"required",rows:"3",placeholder:"Écrire une réponse..."}),btn=el("button",{type:"submit",class:"btn btn-primary"},"Envoyer la réponse");reply.append(area,btn);reply.onsubmit=function(e){e.preventDefault();var val=area.value.trim();if(!val)return;btn.disabled=true;db.from("wil_messages").insert({conversation_id:c.id,sender_id:uid,body:val}).then(function(x){if(x.error)throw x.error;return db.from("wil_conversations").update({status:"open",updated_at:new Date().toISOString()}).eq("id",c.id);}).then(function(x){if(x.error)throw x.error;area.value="";open.click();}).catch(function(x){alert("Envoi impossible : "+x.message);btn.disabled=false;});};thread.append(reply);});};history.append(card);});
});
}
form.onsubmit=function(e){e.preventDefault();var title=subject.value.trim(),message=body.value.trim();if(!title||!message)return;send.disabled=true;db.from("wil_conversations").insert({user_id:uid,subject:title,status:"open"}).select("id").single().then(function(c){if(c.error)throw c.error;return db.from("wil_messages").insert({conversation_id:c.data.id,sender_id:uid,body:message});}).then(function(m){if(m.error)throw m.error;form.reset();say("Message envoyé. Vous pouvez suivre la conversation ci-dessous.",true);load();}).catch(function(x){say("Envoi impossible : "+x.message,false);}).finally(function(){send.disabled=false;});};
load();
if(db.channel){channel=db.channel("client-inbox-"+uid).on("postgres_changes",{event:"INSERT",schema:"public",table:"wil_messages"},function(payload){if(payload.new.sender_id!==uid){load();}}).on("postgres_changes",{event:"INSERT",schema:"public",table:"wil_notifications",filter:"user_id=eq."+uid},function(){load();}).subscribe();}
});
}
start();
});