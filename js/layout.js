// En-tête et pied de page partagés : on les modifie ICI, une seule fois.
(function () {
  var pages = [
    ["index.html", "Accueil"], ["services.html", "Services"], ["offers.html", "Formations"],
    ["process.html", "Notre méthode"], ["audit.html", "Audit"], ["contact.html", "Contact"],
    ["acceuil_bibliotheque.html", "Bibliothèque"]
  ];
  var current = location.pathname.split("/").pop() || "index.html";
  if (current === "bibliotheque.html" || current === "login.html" || current === "register.html") current = "acceuil_bibliotheque.html";
  var links = pages.map(function (p) {
    return '<a href="' + p[0] + '"' + (p[0] === current ? ' aria-current="page"' : "") + ">" + p[1] + "</a>";
  }).join("");
  var h = document.getElementById("site-header");
  if (h) h.innerHTML =
    '<header class="site-header"><div class="container nav-wrap">' +
    '<a class="brand" href="index.html" aria-label="Woldjy Impact Lab, accueil"><span class="brand-mark" aria-hidden="true">W</span><span>Woldjy Impact Lab<small>Innovation, impact, croissance</small></span></a>' +
    '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav">Menu</button>' +
    '<nav class="nav-links" id="main-nav" aria-label="Navigation principale">' + links + "</nav></div></header>";
  var f = document.getElementById("site-footer");
  if (f) f.innerHTML =
    '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
    '<div><strong>Woldjy Impact Lab</strong><p>Nous aidons les entrepreneurs, les étudiants et les organisations à transformer leurs idées en projets numériques concrets.</p></div>' +
    '<div><h2>Explorer</h2><div class="footer-links"><a href="services.html">Services</a><a href="offers.html">Formations</a><a href="process.html">Notre méthode</a></div></div>' +
    '<div><h2>Ressources</h2><div class="footer-links"><a href="audit.html">Demander un audit</a><a href="acceuil_bibliotheque.html">Bibliothèque numérique</a><a href="contact.html">Nous contacter</a></div></div>' +
    '<div><h2>Contact</h2><div class="footer-links"><a href="mailto:contact@woldjyimpactlab.com">contact@woldjyimpactlab.com</a><span>Cap-Haïtien, Haïti</span><a href="confidentialite.html">Confidentialité</a></div></div>' +
    '</div><div class="footer-bottom"><span>© ' + new Date().getFullYear() + " Woldjy Impact Lab. Tous droits réservés.</span></div></div></footer>";
})();
