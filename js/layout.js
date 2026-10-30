// Navigation et pied de page partagés — Woldjy Impact Lab
(function(){
  var pages=[
    ["index.html","Accueil"],["services.html","Services"],["offers.html","Formations"],
    ["process.html","Notre méthode"],["audit.html","Audit"],["contact.html","Contact"],
    ["acceuil_bibliotheque.html","Bibliothèque"]
  ];
  var current=location.pathname.split("/").pop()||"index.html";
  if(["bibliotheque.html","login.html","register.html"].includes(current)) current="acceuil_bibliotheque.html";
  var links=pages.map(function(p){
    return '<a href="'+p[0]+'"'+(p[0]===current?' aria-current="page"':"")+'>'+p[1]+'</a>';
  }).join("");
  var header=document.getElementById("site-header");
  if(header) header.innerHTML=
    '<header class="site-header"><div class="container nav-wrap">'+
    '<a class="brand" href="index.html" aria-label="Woldjy Impact Lab, accueil"><span class="brand-mark" aria-hidden="true">W</span><span>Woldjy Impact Lab<small>Learn. Build. Scale.</small></span></a>'+
    '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav">Menu</button>'+
    '<nav class="nav-links" id="main-nav" aria-label="Navigation principale">'+links+'</nav></div></header>';
  var footer=document.getElementById("site-footer");
  if(footer) footer.innerHTML=
    '<footer class="site-footer"><div class="container"><div class="footer-grid">'+
    '<div><strong>Woldjy Impact Lab</strong><p>Des idées ambitieuses. Des stratégies claires. Des solutions numériques concrètes.</p><p>Innovation · Impact · Croissance</p></div>'+
    '<div><h2>Explorer</h2><div class="footer-links"><a href="services.html">Nos services</a><a href="offers.html">Formations</a><a href="process.html">Notre méthode</a></div></div>'+
    '<div><h2>Ressources</h2><div class="footer-links"><a href="audit.html">Demander un audit</a><a href="acceuil_bibliotheque.html">Bibliothèque</a><a href="contact.html">Contact</a></div></div>'+
    '<div><h2>Parlons de votre projet</h2><div class="footer-links"><a href="mailto:woldjyimpactlab@gmail.com">woldjyimpactlab@gmail.com</a><a href="tel:+50942824391">Appel direct : +509 42824391</a><a href="https://wa.me/50942824391" target="_blank" rel="noopener noreferrer">WhatsApp : +509 42824391 ↗</a><span>Cap-Haïtien, Haïti</span></div></div>'+
    '</div><div class="footer-bottom"><span>© '+new Date().getFullYear()+' Woldjy Impact Lab. Tous droits réservés.</span><span>Learn. Build. Scale.</span></div></div></footer>';
})();