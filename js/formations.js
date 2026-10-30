// Page Formations : affiche les formations publiées par l'admin. Sans données, les cartes statiques restent.
(function () {
  var db = window.wilDb, grid = document.getElementById("formations-grid"), h = wilEl;
  if (!db || !grid) return;
  db.from("formations").select("*").eq("is_published", true).order("created_at", { ascending: false }).then(function (r) {
    if (r.error || !r.data.length) return;
    grid.textContent = "";
    r.data.forEach(function (d) {
      var c = h("article", { class: "card" });
      if (d.category) c.appendChild(h("span", { class: "tag" }, d.category));
      c.append(h("h3", {}, d.title), h("p", {}, d.description || ""));
      if (d.schedule_text) c.appendChild(h("p", {}, "Dates : " + d.schedule_text));
      if (d.price_text) c.appendChild(h("p", {}, "Tarif : " + d.price_text));
      c.appendChild(h("a", { class: "btn btn-outline", href: "contact.html?sujet=" + encodeURIComponent("Formation : " + d.title) }, "Demander des informations"));
      grid.appendChild(c);
    });
  });
})();
