/* ============================================================
   Woldjy Impact Lab — js/supabase.js
   Connexion à Supabase : authentification + bibliothèque.

   SEKIRITE :
   - Sèlman URL la ak kle "publishable" la nan fichye sa a.
     Yo fèt pou piblik. Pa janm mete kle "service_role" isit la.
   - Se règ RLS yo (nan Supabase) ki pwoteje done yo ak dokiman yo,
     pa JavaScript la.
   ============================================================ */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/+esm";

const SUPABASE_URL = "https://smrajunpiymbaexvlvln.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Jf88V0I1OrNio2j36oBE4g_02XDt33m";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const BUCKET = "library";
const MAX_FILE_MB = 25;
const PAGES_AUTORISEES = ["bibliotheque.html", "admin.html"]; // redirection permise après connexion

/* ---------- Petits outils ---------- */

function showMessage(form, text, ok = true) {
  const box = form.querySelector(".notice-success");
  if (!box) return;
  box.style.display = "block";
  box.classList.toggle("error", !ok);
  box.textContent = text;
}

function setBusy(form, busy) {
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.disabled = busy;
}

function nextPage() {
  const next = new URLSearchParams(location.search).get("next");
  return PAGES_AUTORISEES.includes(next) ? next : "bibliotheque.html";
}

/* ---------- Lien Connexion / Déconnexion dans le menu ---------- */

async function refreshNav(session) {
  document.querySelectorAll("[data-auth-link]").forEach((link) => {
    if (session) {
      link.textContent = "Déconnexion";
      link.setAttribute("href", "#");
      link.onclick = async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        location.href = "index.html";
      };
    } else {
      link.textContent = "Connexion";
      link.setAttribute("href", "login.html");
      link.onclick = null;
    }
  });
}

async function refreshAdminLink(session) {
  const links = document.querySelectorAll("[data-admin-link]");
  if (!links.length) return;
  let isAdmin = false;
  if (session) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();
    isAdmin = data?.role === "admin";
  }
  links.forEach((l) => (l.hidden = !isAdmin));
}

/* ---------- Inscription ---------- */

async function handleRegister(form) {
  const data = new FormData(form);
  const fullName = String(data.get("full_name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  const confirm = String(data.get("confirm_password") || "");

  if (password !== confirm) {
    showMessage(form, "Les deux mots de passe ne sont pas identiques.", false);
    return;
  }

  setBusy(form, true);
  const { data: result, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: new URL("login.html", location.href).href,
    },
  });
  setBusy(form, false);

  if (error) {
    showMessage(form, "Inscription impossible : " + error.message, false);
    return;
  }

  if (result.session) {
    location.href = nextPage();
  } else {
    form.reset();
    showMessage(
      form,
      "Compte créé. Vérifiez votre boîte e-mail et cliquez sur le lien de confirmation avant de vous connecter."
    );
  }
}

/* ---------- Connexion ---------- */

async function handleLogin(form) {
  const data = new FormData(form);
  setBusy(form, true);
  const { error } = await supabase.auth.signInWithPassword({
    email: String(data.get("email") || "").trim(),
    password: String(data.get("password") || ""),
  });
  setBusy(form, false);

  if (error) {
    // Message volontairement général : on ne dit pas si l'e-mail existe.
    const msg = /confirm/i.test(error.message)
      ? "Votre e-mail n'est pas encore confirmé. Vérifiez votre boîte de réception."
      : "E-mail ou mot de passe incorrect.";
    showMessage(form, msg, false);
    return;
  }
  location.href = nextPage();
}

function initAuthForms() {
  document.querySelectorAll("form[data-auth]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (form.dataset.auth === "register") handleRegister(form);
      if (form.dataset.auth === "login") handleLogin(form);
    });
  });
}

/* ---------- Bibliothèque (page protégée) ---------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text; // textContent = pas de HTML injecté
  return node;
}

async function openDocument(doc, statusEl) {
  statusEl.textContent = "";
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_path, 60); // lien valable 60 secondes
  if (error || !data) {
    statusEl.textContent = "Impossible d'ouvrir ce document pour le moment.";
    return;
  }
  location.assign(data.signedUrl);
}

async function initLibrary() {
  const root = document.querySelector("[data-library]");
  if (!root) return;

  const status = root.querySelector("[data-library-status]");
  const list = root.querySelector("[data-library-list]");
  const hello = root.querySelector("[data-library-hello]");

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) {
    location.replace("login.html?next=bibliotheque.html");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .maybeSingle();
  if (hello) {
    hello.textContent = profile?.full_name
      ? "Bonjour, " + profile.full_name + "."
      : "Bienvenue dans votre espace lecteur.";
  }

  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, title, description, category, file_path")
    .order("created_at", { ascending: false });

  if (error) {
    status.textContent = "Impossible de charger les documents. Réessayez plus tard.";
    return;
  }
  if (!docs.length) {
    status.textContent = "Aucun document n'a encore été ajouté.";
    return;
  }

  status.textContent = "";
  list.replaceChildren();
  docs.forEach((doc) => {
    const card = el("article", "card");
    if (doc.category) card.appendChild(el("span", "tag", doc.category));
    const title = el("h3", "", doc.title);
    title.style.marginTop = "12px";
    card.appendChild(title);
    if (doc.description) card.appendChild(el("p", "", doc.description));
    const btn = el("button", "btn btn-outline", "Ouvrir le document");
    btn.type = "button";
    btn.style.marginTop = "18px";
    btn.addEventListener("click", () => openDocument(doc, status));
    card.appendChild(btn);
    list.appendChild(card);
  });
}

/* ---------- Mot de passe oublié ---------- */

async function handleResetRequest(form) {
  const email = String(new FormData(form).get("email") || "").trim();
  setBusy(form, true);
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("reset.html", location.href).href,
  });
  setBusy(form, false);
  // Même message dans tous les cas : on ne révèle pas si l'e-mail existe.
  showMessage(
    form,
    "Si un compte existe avec cet e-mail, un lien de réinitialisation vient d'être envoyé."
  );
}

async function handleResetUpdate(form) {
  const data = new FormData(form);
  const password = String(data.get("password") || "");
  if (password !== String(data.get("confirm_password") || "")) {
    showMessage(form, "Les deux mots de passe ne sont pas identiques.", false);
    return;
  }
  setBusy(form, true);
  const { error } = await supabase.auth.updateUser({ password });
  setBusy(form, false);
  if (error) {
    showMessage(form, "Impossible de changer le mot de passe : " + error.message, false);
    return;
  }
  showMessage(form, "Mot de passe modifié. Redirection vers votre espace…");
  setTimeout(() => (location.href = "bibliotheque.html"), 1500);
}

function showRecoveryForm() {
  const req = document.querySelector("[data-reset-request]");
  const upd = document.querySelector("[data-reset-update]");
  if (req) req.hidden = true;
  if (upd) upd.hidden = false;
}

function initReset() {
  const req = document.querySelector("[data-reset-request]");
  const upd = document.querySelector("[data-reset-update]");
  if (!req || !upd) return;
  req.addEventListener("submit", (e) => { e.preventDefault(); handleResetRequest(req); });
  upd.addEventListener("submit", (e) => { e.preventDefault(); handleResetUpdate(upd); });
  if (location.hash.includes("type=recovery")) showRecoveryForm();
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") showRecoveryForm();
  });
}

/* ---------- Administration des documents ---------- */

function safeFileName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.\-]+/g, "_");
}

async function loadAdminList(listEl, statusEl) {
  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, title, category, file_path, is_published")
    .order("created_at", { ascending: false });
  if (error) {
    statusEl.textContent = "Impossible de charger la liste.";
    return;
  }
  listEl.replaceChildren();
  if (!docs.length) {
    listEl.appendChild(el("p", "muted", "Aucun document pour le moment."));
    return;
  }
  docs.forEach((doc) => {
    const row = el("article", "card");
    row.style.marginBottom = "14px";
    row.appendChild(el("span", "tag", doc.is_published ? "Publié" : "Brouillon"));
    const title = el("h3", "", doc.title);
    title.style.marginTop = "10px";
    row.appendChild(title);
    if (doc.category) row.appendChild(el("p", "small", doc.category));

    const actions = el("div", "book-actions");
    const toggle = el("button", "btn btn-outline", doc.is_published ? "Dépublier" : "Publier");
    toggle.type = "button";
    toggle.addEventListener("click", async () => {
      const { error: upErr } = await supabase
        .from("documents")
        .update({ is_published: !doc.is_published })
        .eq("id", doc.id);
      statusEl.textContent = upErr ? "Modification impossible." : "";
      loadAdminList(listEl, statusEl);
    });
    const del = el("button", "btn btn-outline", "Supprimer");
    del.type = "button";
    del.addEventListener("click", async () => {
      if (!confirm("Supprimer définitivement « " + doc.title + " » ?")) return;
      const { error: delErr } = await supabase.from("documents").delete().eq("id", doc.id);
      if (delErr) { statusEl.textContent = "Suppression impossible."; return; }
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
      statusEl.textContent = "Document supprimé.";
      loadAdminList(listEl, statusEl);
    });
    actions.append(toggle, del);
    row.appendChild(actions);
    listEl.appendChild(row);
  });
}

async function initAdmin() {
  const root = document.querySelector("[data-admin]");
  if (!root) return;
  const status = root.querySelector("[data-admin-status]");
  const panel = root.querySelector("[data-admin-panel]");
  const form = root.querySelector("[data-admin-upload]");
  const listEl = root.querySelector("[data-admin-list]");

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) {
    location.replace("login.html?next=admin.html");
    return;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    status.textContent = "Cette page est réservée aux administrateurs.";
    return;
  }
  status.textContent = "";
  panel.hidden = false;
  loadAdminList(listEl, status);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const file = data.get("file");
    if (!file || !file.size) {
      showMessage(form, "Choisissez un fichier.", false);
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showMessage(form, "Fichier trop lourd (maximum " + MAX_FILE_MB + " Mo).", false);
      return;
    }
    setBusy(form, true);
    const path = crypto.randomUUID() + "-" + safeFileName(file.name);
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (upErr) {
      setBusy(form, false);
      showMessage(form, "Téléversement impossible : " + upErr.message, false);
      return;
    }
    const { error: insErr } = await supabase.from("documents").insert({
      title: String(data.get("title") || "").trim(),
      description: String(data.get("description") || "").trim() || null,
      category: String(data.get("category") || "").trim() || null,
      file_path: path,
      is_published: data.get("is_published") === "on",
      created_by: session.user.id,
    });
    setBusy(form, false);
    if (insErr) {
      await supabase.storage.from(BUCKET).remove([path]); // on nettoie le fichier orphelin
      showMessage(form, "Enregistrement impossible : " + insErr.message, false);
      return;
    }
    form.reset();
    showMessage(form, "Document ajouté.");
    loadAdminList(listEl, status);
  });
}

/* ---------- Démarrage ---------- */

function refreshAll(session) {
  refreshNav(session);
  refreshAdminLink(session);
}
supabase.auth.onAuthStateChange((_event, session) => refreshAll(session));
supabase.auth.getSession().then(({ data }) => refreshAll(data.session));
initAuthForms();
initLibrary();
initReset();
initAdmin();
