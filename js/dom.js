// Petits outils pour construire le HTML sans innerHTML (évite les failles XSS).
window.wilEl = function (tag, props) {
  var e = document.createElement(tag); props = props || {};
  Object.keys(props).forEach(function (k) {
    var v = props[k];
    if (k === "on") Object.keys(v).forEach(function (ev) { e.addEventListener(ev, v[ev]); });
    else if (k === "class") e.className = v;
    else if (k === "value" || k === "checked") e[k] = v;
    else e.setAttribute(k, v);
  });
  for (var i = 2; i < arguments.length; i++) {
    var c = arguments[i]; if (c == null) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
};
window.wilNotice = function (parent) {
  var n = wilEl("div", { class: "form-status", role: "status", "aria-live": "polite" }); parent.appendChild(n);
  return function (t, ok) { n.textContent = t; n.className = "form-status " + (ok ? "ok" : "err"); };
};
window.wilSafeName = function (n) { return n.replace(/[^a-zA-Z0-9._-]/g, "_"); };
// Formulaire générique : fields = [nom, libellé, type, options, obligatoire]
window.wilForm = function (fields, vals, label, onSubmit) {
  var h = wilEl, f = h("form", { class: "form-card" }), g = h("div", { class: "form-grid" });
  fields.forEach(function (x) {
    var id = "f-" + x[0], inp;
    if (x[2] === "textarea") inp = h("textarea", { id: id, name: x[0] });
    else if (x[2] === "select") { inp = h("select", { id: id, name: x[0] }); x[3].forEach(function (o) { inp.appendChild(h("option", { value: o[0] }, o[1])); }); }
    else inp = h("input", { id: id, name: x[0], type: x[2] || "text" });
    if (x[2] === "file") inp.setAttribute("accept", ".pdf,.epub");
    if (vals && x[2] !== "file") { if (x[2] === "checkbox") inp.checked = !!vals[x[0]]; else if (vals[x[0]] != null) inp.value = vals[x[0]]; }
    if (x[4]) inp.required = true;
    var lab = h("label", { for: id }, x[1] + (x[4] ? " *" : ""));
    g.appendChild(h("div", { class: x[2] === "checkbox" ? "field full check-row" : "field full" }, x[2] === "checkbox" ? inp : lab, x[2] === "checkbox" ? lab : inp));
  });
  var btn = h("button", { class: "btn btn-primary", type: "submit" }, label), sw = h("div", { class: "field full" });
  g.append(h("div", { class: "field full" }, btn), sw); f.appendChild(g);
  var say = wilNotice(sw);
  f.addEventListener("submit", function (e) {
    e.preventDefault(); var v = {};
    fields.forEach(function (x) { var i = f.elements[x[0]]; v[x[0]] = x[2] === "file" ? i.files[0] : x[2] === "checkbox" ? i.checked : i.value.trim(); });
    onSubmit(v, say, btn, f);
  });
  return f;
};
