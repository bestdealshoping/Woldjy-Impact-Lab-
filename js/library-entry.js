document.addEventListener("DOMContentLoaded",function(){
 var db=window.wilDb;if(!db)return;
 db.auth.getSession().then(function(r){
  var session=r.data&&r.data.session;if(!session)return;
  var box=document.querySelector(".library-hero .actions");if(!box)return;
  box.textContent="";
  var rolePromise=db.from("profiles").select("role").eq("id",session.user.id).single();
  rolePromise.then(function(p){
   var dest=p.data&&p.data.role==="admin"?"admin.html":"espace-client.html";
   var a=document.createElement("a");a.className="btn btn-primary";a.href=dest;a.textContent=p.data&&p.data.role==="admin"?"Ouvrir l'administration":"Ouvrir mon espace";
   var b=document.createElement("a");b.className="btn btn-glass";b.href="bibliotheque.html";b.textContent="Accéder aux livres";
   box.append(a,b);
  });
 });
});