const pricing = {
  CSR: {
    label: 'CSR · Comptabilité',
    plans: [
      { name: 'Essentiel', price: '150 000', duration: '3 ans', features: ['1 société', '2 utilisateurs', 'Comptabilité SYSCOHADA Révisé', 'Journaux et états de contrôle'] },
      { name: 'Professionnel', price: '300 000', duration: '3 ans', features: ['3 sociétés', '2 utilisateurs', 'FEC béninois et rapprochement', 'Clôture et états financiers'], highlight: true },
      { name: 'Entreprise', price: '500 000', duration: '10 ans', features: ['Sociétés illimitées', '3 utilisateurs', 'FEC, archivage et multi-exercices', 'Accompagnement de démarrage'] },
      { name: 'Sur mesure', price: 'À définir', duration: 'Selon projet', features: ['Spécifications particulières', 'Intégration et migration', 'Hébergement dédié possible', 'Contacter le support'], custom: true }
    ]
  },
  GP: {
    label: 'GP · Gestion de Paie',
    plans: [
      { name: 'Essentiel', price: '100 000', duration: '3 ans', features: ['1 société', '2 utilisateurs', 'Jusqu’à 10 employés', 'Bulletins et variables'] },
      { name: 'Professionnel', price: '300 000', duration: '3 ans', features: ['3 sociétés', '2 utilisateurs', 'Jusqu’à 50 employés', 'Suivi des périodes de paie'], highlight: true },
      { name: 'Entreprise', price: '500 000', duration: '10 ans', features: ['Sociétés illimitées', '3 utilisateurs', 'Employés illimités', 'Paramétrage avancé'] },
      { name: 'Sur mesure', price: 'À définir', duration: 'Selon projet', features: ['Règles spécifiques', 'Intégrations', 'Accompagnement', 'Contacter le support'], custom: true }
    ]
  },
  GCSF: {
    label: 'GCSF · Gestion commerciale',
    plans: [
      { name: 'Essentiel', price: '150 000', duration: '3 ans', features: ['1 société', '2 utilisateurs', 'Ventes et achats', 'Facturation de base'] },
      { name: 'Professionnel', price: '300 000', duration: '3 ans', features: ['3 sociétés', '2 utilisateurs', 'Stocks et règlements', 'Suivi commercial'], highlight: true },
      { name: 'Entreprise', price: '500 000', duration: '10 ans', features: ['Sociétés illimitées', '3 utilisateurs', 'Stocks multi-dépôts', 'Paramétrage avancé'] },
      { name: 'Sur mesure', price: 'À définir', duration: 'Selon projet', features: ['Connecteurs spécifiques', 'Migration de données', 'Workflows personnalisés', 'Contacter le support'], custom: true }
    ]
  },
  GC: {
    label: 'GC · Gestion de Courrier',
    plans: [
      { name: 'Essentiel', price: '100 000', duration: '3 ans', features: ['1 société', '2 utilisateurs', 'Courriers entrants et sortants', 'Classement de base'] },
      { name: 'Professionnel', price: '200 000', duration: '3 ans', features: ['3 sociétés', '2 utilisateurs', 'Recherche et suivi', 'Historique des réponses'], highlight: true },
      { name: 'Entreprise', price: '400 000', duration: '10 ans', features: ['Sociétés illimitées', '3 utilisateurs', 'Courriers illimités', 'Paramétrage avancé'] },
      { name: 'Sur mesure', price: 'À définir', duration: 'Selon projet', features: ['Classement spécifique', 'Workflows de validation', 'Intégrations', 'Contacter le support'], custom: true }
    ]
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
let deferredInstallPrompt = null;
let toastTimer;

function showToast(message) {
  const toast = $('#siteToast');
  const text = $('#siteToastMessage');
  if (!toast || !text) return;
  text.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3600);
}

function renderPricing(moduleId = 'CSR') {
  const grid = $('#pricingGrid');
  if (!grid) return;
  const data = pricing[moduleId] || pricing.CSR;
  grid.innerHTML = data.plans.map((plan) => `<article class="price-card ${plan.highlight ? 'is-highlight' : ''}">${plan.highlight ? '<span class="price-card-tag">LE PLUS CHOISI</span>' : ''}<span class="eyebrow">${data.label}</span><h3>${plan.name}</h3><p>${plan.custom ? 'Construisons une offre adaptée à votre organisation.' : 'Une licence claire pour avancer sans surprise.'}</p><div class="price">${plan.price} <small>${plan.price === 'À définir' ? '' : 'FCFA HT'}</small></div><div class="price-duration">Durée : ${plan.duration}</div><ul>${plan.features.map((feature) => `<li>${feature}</li>`).join('')}</ul><button class="button ${plan.highlight ? 'button-primary' : 'button-dark'} button-small" type="button" data-action="open-signup" data-plan="${moduleId} · ${plan.name}">${plan.custom ? 'Parler au support' : 'Choisir cette offre'}</button></article>`).join('');
}

function openSignup(plan = '') {
  const modal = $('#signupModal');
  $('#signupPlan')?.remove();
  if (plan) {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = 'signupPlan';
    hidden.name = 'plan';
    hidden.value = plan;
    $('#signupForm')?.append(hidden);
  }
  $('#signupBackdrop')?.removeAttribute('hidden');
  modal?.removeAttribute('hidden');
  document.body.classList.add('modal-open');
  setTimeout(() => $('#signupForm input')?.focus(), 40);
}

function closeSignup() {
  $('#signupBackdrop')?.setAttribute('hidden', '');
  $('#signupModal')?.setAttribute('hidden', '');
  document.body.classList.remove('modal-open');
}

function toggleNav() {
  const nav = $('#siteNav');
  const button = document.querySelector('[data-action="toggle-nav"]');
  const open = nav?.classList.toggle('is-open');
  button?.setAttribute('aria-expanded', String(Boolean(open)));
}

async function handleSignup(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const submit = form.querySelector('button[type="submit"]');
  const originalLabel = submit?.textContent;
  if (submit) { submit.disabled = true; submit.textContent = 'Création en cours…'; }
  try {
    const data = new FormData(form);
    const response = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: String(data.get('name')).trim(), email: String(data.get('email')).trim().toLowerCase(), password: String(data.get('password') || ''), plan: String(data.get('plan') || '') }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || 'L’inscription n’a pas pu être finalisée.');
    closeSignup();
    showToast(`Votre essai de 30 jours est créé, ${payload.user?.name || 'bienvenue'}. Vérifiez votre e-mail lorsque l’authentification sera activée.`);
    form.reset();
  } catch (error) {
    showToast(error.message || 'Le service d’inscription est momentanément indisponible.');
  } finally {
    if (submit) { submit.disabled = false; submit.textContent = originalLabel || 'Démarrer mon essai'; }
  }
}

async function handleGoogleSignup() {
  try {
    const response = await fetch('/api/auth/google/start', { headers: { Accept: 'application/json' } });
    if (response.redirected) { window.location.assign(response.url); return; }
    const payload = await response.json().catch(() => ({}));
    showToast(payload.message || 'L’authentification Google n’est pas encore configurée.');
  } catch {
    showToast('Le service Google est indisponible. Vous pouvez utiliser l’inscription par e-mail.');
  }
}

function installPwa() {
  if (!deferredInstallPrompt) {
    showToast('Votre navigateur ne propose pas encore l’installation PWA. Utilisez le menu « Installer l’application » du navigateur.');
    return;
  }
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then((choice) => {
    showToast(choice.outcome === 'accepted' ? 'EMRYS est en cours d’installation.' : 'Installation PWA annulée.');
    deferredInstallPrompt = null;
  });
}

function handleAction(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'open-signup') openSignup(target.dataset.plan || '');
  if (action === 'close-signup') closeSignup();
  if (action === 'toggle-nav') toggleNav();
  if (action === 'google-signup') handleGoogleSignup();
  if (action === 'install-pwa') installPwa();
  if (action === 'desktop-download') showToast('L’installateur Windows sera publié avec la première version Tauri d’EMRYS.');
  if (action === 'toggle-nav') return;
}

document.addEventListener('click', handleAction);
$('#signupForm')?.addEventListener('submit', handleSignup);
$('#signupBackdrop')?.addEventListener('click', closeSignup);
$$('.pricing-tab').forEach((tab) => tab.addEventListener('click', () => {
  $$('.pricing-tab').forEach((item) => item.classList.toggle('is-active', item === tab));
  renderPricing(tab.dataset.pricingModule);
}));
$$('[data-module-link]').forEach((link) => link.addEventListener('click', () => {
  const tab = $(`[data-pricing-module="${link.dataset.moduleLink}"]`);
  tab?.click();
}));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeSignup(); });
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstallPrompt = event; $('#installPwaButton')?.classList.add('is-ready'); });
window.addEventListener('appinstalled', () => { deferredInstallPrompt = null; showToast('EMRYS a été installée sur cet appareil.'); });

renderPricing();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
