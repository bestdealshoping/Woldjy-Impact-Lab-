// Messagerie client style WhatsApp : liste des conversations et fil de discussion.
document.addEventListener("DOMContentLoaded",function(){
var root=document.getElementById("wil-client-messages");if(!root)return;
function node(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
var db=window.wilDb;if(!db){root.textContent="Messagerie indisponible.";return;}
db.auth.getSession().then(function(sr){
var session=sr.data&&sr.data.session;
if(!session){root.innerHTML="";root.append(node("p","", "Connectez-vous pour accéder à vos conversations."));var l=node("a","btn btn-primary","Se connecter");l.href="login.html?redirect=contact.html";root.append(l);return;}
var uid=session.user.id,active=null,thread=node("div","wil-chat-thread"),list=node("div","wil-chat-list"),notice=node("div","wil-chat-notice");
var shell=node("div","wil-chat-shell"),side=node("aside","wil-chat-sidebar"),main=node("section","wil-chat-main");
var top=node("div","wil-chat-top","Vos conversations");side.append(top,list);main.append(thread,notice);shell.append(side,main);
var compose=node("form","wil-chat-compose"),subject=node("input","");subject.placeholder="Sujet de la conversation";subject.maxLength=120;subject.required=true;
var message=node("textarea","");message.placeholder="Écrivez votre premier message...";message.rows=2;message.maxLength=5000;message.required=true;
var create=node("button","btn btn-primary","Démarrer une conversation");create.type="submit";
compose.append(subject,message,create);main.append(compose);root.innerHTML="";root.append(shell);
function say(t){notice.textContent=t;}
function renderThread(c){
active=c;thread.innerHTML="";thread.append(node("div","wil-chat-heading",c.subject||"Conversation"));
db.from("wil_messages").select("*").eq("conversation_id",c.id).order("created_at").then(function(r){
if(r.error){thread.append(node("p","",r.error.message));return;}
var feed=node("div","wil-chat-feed");
r.data.forEach(function(m){var mine=m.sender_id===uid,b=node("article","wil-bubble "+(mine?"mine":"theirs"));b.append(node("div","wil-bubble-label",mine?"Vous":"Woldjy Impact Lab"),node("p","",m.body),node("time","",new Date(m.created_at).toLocaleString()));feed.append(b);if(!mine&&!m.is_read)db.from("wil_messages").update({is_read:true}).eq("id",m.id);});
thread.append(feed);feed.scrollTop=feed.scrollHeight;
var reply=node("form","wil-chat-reply"),area=node("textarea","");area.placeholder="Écrire un message...";area.rows=2;area.required=true;var send=node("button","btn btn-primary","Envoyer");send.type="submit";reply.append(area,send);thread.append(reply);
reply.onsubmit=function(e){e.preventDefault();var val=area.value.trim();if(!val)return;send.disabled=true;db.from("wil_messages").insert({conversation_id:c.id,sender_id:uid,body:val}).then(function(x){if(x.error)throw x.error;return db.from("wil_conversations").update({status:"open",updated_at:new Date().toISOString()}).eq("id",c.id);}).then(function(x){if(x.error)throw x.error;area.value="";renderThread(c);loadList();}).catch(function(x){say("Envoi impossible : "+x.message);send.disabled=false;});};
});
}
function loadList(){
db.from("wil_conversations").select("*").eq("user_id",uid).order("updated_at",{ascending:false}).then(function(r){
list.innerHTML="";if(r.error){list.append(node("p","",r.error.message));return;}
if(!r.data.length){list.append(node("p","wil-chat-empty","Aucune conversation. Commencez par envoyer un message."));return;}
r.data.forEach(function(c){var b=node("button","wil-chat-item"+(active&&active.id===c.id?" selected":""));b.type="button";b.append(node("span","wil-chat-avatar","W"),node("span","wil-chat-item-text",c.subject||"Conversation"),node("small","wil-chat-state",c.status==="answered"?"Répondu":"Ouvert"));b.onclick=function(){renderThread(c);loadList();};list.append(b);});
});
}
compose.onsubmit=function(e){e.preventDefault();var title=subject.value.trim(),body=message.value.trim();if(!title||!body)return;create.disabled=true;db.from("wil_conversations").insert({user_id:uid,subject:title,status:"open"}).select("id,subject,status,created_at,updated_at").single().then(function(r){if(r.error)throw r.error;return db.from("wil_messages").insert({conversation_id:r.data.id,sender_id:uid,body:body}).then(function(m){if(m.error)throw m.error;return r.data;});}).then(function(c){compose.reset();say("Message envoyé.");loadList();renderThread(c);}).catch(function(x){say("Envoi impossible : "+x.message);}).finally(function(){create.disabled=false;});};
loadList();
if(db.channel)db.channel("wil-client-chat-"+uid).on("postgres_changes",{event:"*",schema:"public",table:"wil_messages"},function(){loadList();if(active)renderThread(active);}).subscribe();
});
});