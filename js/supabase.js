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
const PAGES_AUTORISEES = ["bibliotheque.html"]; // redirection permise après connexion

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

/* ---------- Démarrage ---------- */

supabase.auth.onAuthStateChange((_event, session) => refreshNav(session));
supabase.auth.getSession().then(({ data }) => refreshNav(data.session));
initAuthForms();
initLibrary();
