const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
document.querySelectorAll('form[data-demo-form]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const success = form.querySelector('.notice-success');
    if (success) {
      success.style.display = 'block';
      success.textContent = form.dataset.success || 'Merci. Votre formulaire est valide, mais son envoi doit encore être connecté à un service de traitement.';
    }
  });
});
document.querySelectorAll('[data-library-auth]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const msg = form.querySelector('.notice-success');
    if (msg) {
      msg.style.display = 'block';
      msg.textContent = 'Cette interface est prête visuellement. Pour activer les comptes et protéger les documents, connectez Supabase Auth et configurez les règles RLS avant publication.';
    }
  });
});
