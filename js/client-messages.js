// Messagerie privée des clients connectés
document.addEventListener("DOMContentLoaded", function () {
  var root = document.getElementById("wil-client-messages");
  if (!root) return;
  function el(tag, attrs, value) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (value !== undefined) node.textContent = value;
    return node;
  }
  function status(message, ok) {
    var box = root.querySelector(".form-status");
    if (box) { box.textContent = message; box.className = "form-status " + (ok ? "ok" : "err"); }
  }
  function start() {
    var db = window.wilDb;
    if (!db) { root.textContent = "Le service de messagerie est momentanément indisponible."; return; }
    db.auth.getSession().then(function (sessionResult) {
      var session = sessionResult.data && sessionResult.data.session;
      if (!session) {
        root.append(el("p", {}, "Connectez-vous pour envoyer un message privé et suivre les réponses de notre équipe."));
        var link = el("a", { href: "login.html?redirect=contact.html", class: "btn btn-primary" }, "Se connecter");
        root.append(link);
        return;
      }
      var form = el("form", { class: "form-card" });
      var grid = el("div", { class: "form-grid" });
      var subjectWrap = el("div", { class: "field full" });
      subjectWrap.append(el("label", { for: "wil-message-subject" }, "Sujet"));
      var subject = el("input", { id: "wil-message-subject", name: "subject", required: "required", maxlength: "120", type: "text", placeholder: "Objet de votre demande" });
      subjectWrap.append(subject);
      var bodyWrap = el("div", { class: "field full" });
      bodyWrap.append(el("label", { for: "wil-message-body" }, "Votre message"));
      var body = el("textarea", { id: "wil-message-body", name: "body", required: "required", rows: "5", maxlength: "5000", placeholder: "Écrivez votre message ici..." });
      bodyWrap.append(body);
      var submitWrap = el("div", { class: "field full" });
      var submit = el("button", { type: "submit", class: "btn btn-primary" }, "Envoyer à l'équipe");
      submitWrap.append(submit);
      var statusBox = el("div", { class: "form-status", role: "status", "aria-live": "polite" });
      var statusWrap = el("div", { class: "field full" }); statusWrap.append(statusBox);
      grid.append(subjectWrap, bodyWrap, submitWrap, statusWrap); form.append(grid);
      var history = el("div", { class: "grid" });
      root.append(form, el("h3", {}, "Mes conversations"), history);

      function loadHistory() {
        history.textContent = "Chargement des conversations...";
        db.from("wil_conversations").select("id,subject,status,created_at,updated_at").eq("user_id", session.user.id).order("updated_at", { ascending: false }).then(function (r) {
          history.textContent = "";
          if (r.error) { history.textContent = "Impossible de charger les conversations : " + r.error.message; return; }
          if (!r.data.length) { history.textContent = "Vous n'avez pas encore envoyé de message."; return; }
          r.data.forEach(function (conversation) {
            var card = el("article", { class: "card" });
            card.append(el("h3", {}, conversation.subject), el("p", {}, "Statut : " + conversation.status));
            var messages = el("div", { class: "grid" });
            card.append(messages);
            db.from("wil_messages").select("id,sender_id,body,created_at").eq("conversation_id", conversation.id).order("created_at", { ascending: true }).then(function (mr) {
              if (mr.error) { messages.textContent = "Erreur de lecture des messages."; return; }
              mr.data.forEach(function (m) {
                var mine = m.sender_id === session.user.id;
                messages.append(el("div", { class: "card" }, (mine ? "Vous" : "Woldjy Impact Lab") + " · " + new Date(m.created_at).toLocaleString() + "\n" + m.body));
              });
            });
            history.append(card);
          });
        });
      }
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var title = subject.value.trim(), message = body.value.trim();
        if (!title || !message) { status("Remplissez le sujet et le message.", false); return; }
        submit.disabled = true;
        db.from("wil_conversations").insert({ user_id: session.user.id, subject: title, status: "open" }).select("id").single()
          .then(function (created) {
            if (created.error) throw created.error;
            return db.from("wil_messages").insert({ conversation_id: created.data.id, sender_id: session.user.id, body: message });
          })
          .then(function (sent) {
            if (sent.error) throw sent.error;
            form.reset(); status("Votre message a été envoyé. Notre équipe pourra vous répondre dans cet espace.", true); loadHistory();
          })
          .catch(function (error) { status("Envoi impossible : " + error.message, false); })
          .finally(function () { submit.disabled = false; });
      });
      loadHistory();
    });
  }
  start();
});
