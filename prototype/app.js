const appState = {
  activeCompany: 'acacia',
  companies: {
    acacia: {
      id: 'acacia',
      name: 'Acacia Conseil',
      shortName: 'AC',
      type: 'Entreprise individuelle',
      meta: 'Entreprise individuelle · XOF',
      ifu: '3201900045612',
      color: 'orange',
      treasury: '2 840 500',
      sales: '1 265 000',
      receivables: '486 000',
      expenses: '392 400'
    },
    noria: {
      id: 'noria',
      name: 'Noria Épicerie',
      shortName: 'NE',
      type: 'Commerce de détail',
      meta: 'Commerce de détail · XOF',
      ifu: '3202300087129',
      color: 'teal',
      treasury: '1 486 200',
      sales: '842 500',
      receivables: '125 000',
      expenses: '267 900'
    }
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[character]));
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function companyAvatarClass(company) {
  return company.color === 'teal' ? 'avatar-teal' : company.color === 'purple' ? 'avatar-purple' : 'avatar-orange';
}

function setActiveCompany(companyId, notify = true) {
  const company = appState.companies[companyId];
  if (!company) return;
  appState.activeCompany = companyId;

  $$('[data-company-name]').forEach((node) => { node.textContent = company.name; });
  const meta = $('[data-company-meta]');
  if (meta) meta.textContent = company.meta;
  $$('[data-money]').forEach((node) => {
    const key = node.dataset.money;
    if (company[key]) node.innerHTML = `${company[key]} <small>FCFA</small>`;
  });

  const pickerAvatar = $('#companyPicker .avatar');
  if (pickerAvatar) {
    pickerAvatar.textContent = company.shortName;
    pickerAvatar.className = `avatar avatar-small ${companyAvatarClass(company)}`;
  }

  $$('.company-card').forEach((card) => {
    card.classList.toggle('is-current', card.dataset.companyCard === companyId);
    const button = $('[data-company-switch]', card);
    if (button) button.textContent = card.dataset.companyCard === companyId ? 'Ouverte' : 'Ouvrir';
  });
  renderCompanyMenu();
  if (notify) showToast(`${company.name} est maintenant la société active.`);
}

function renderCompanyMenu() {
  const menu = $('#companyMenu');
  if (!menu) return;
  menu.innerHTML = `<div class="company-menu-header">VOS SOCIÉTÉS</div>${Object.values(appState.companies).map((company) => `
    <button class="company-option ${company.id === appState.activeCompany ? 'is-active' : ''}" type="button" role="option" aria-selected="${company.id === appState.activeCompany}" data-company-option="${company.id}">
      <span class="avatar avatar-small ${companyAvatarClass(company)}">${escapeHtml(company.shortName)}</span>
      <span class="company-option-copy"><strong>${escapeHtml(company.name)}</strong><small>${escapeHtml(company.type)} · XOF</small></span>
      ${company.id === appState.activeCompany ? '<span class="company-option-check">✓</span>' : ''}
    </button>`).join('')}
    <button class="company-option" type="button" data-action="show-company-modal"><span class="add-circle" style="width:28px;height:28px;margin:0;font-size:14px"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span><span class="company-option-copy"><strong>Ajouter une société</strong><small>Créer un nouveau dossier</small></span></button>`;
}

function openView(viewName) {
  $$('.view').forEach((view) => view.classList.toggle('is-visible', view.dataset.viewPanel === viewName));
  $$('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.view === viewName));
  $('#companyMenu')?.classList.remove('is-open');
  $('#companyPicker')?.setAttribute('aria-expanded', 'false');
  $('#quickMenu')?.setAttribute('hidden', '');
  $('#sidebar')?.classList.remove('is-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  const toastMessage = $('#toastMessage');
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function openModal(id) {
  $('#quickMenu')?.setAttribute('hidden', '');
  $('#modalBackdrop')?.removeAttribute('hidden');
  $$('.modal').forEach((modal) => modal.setAttribute('hidden', ''));
  const modal = $(`#${id}`);
  if (modal) modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  const firstInput = modal?.querySelector('input');
  window.setTimeout(() => firstInput?.focus(), 40);
}

function closeModal() {
  $('#modalBackdrop')?.setAttribute('hidden', '');
  $$('.modal').forEach((modal) => modal.setAttribute('hidden', ''));
  document.body.style.overflow = '';
}

function toggleQuickMenu() {
  const menu = $('#quickMenu');
  if (!menu) return;
  menu.toggleAttribute('hidden');
}

function makeCompanyCard(company) {
  const safeName = escapeHtml(company.name);
  const safeType = escapeHtml(company.type || 'Société');
  const safeIfu = escapeHtml(company.ifu || 'À compléter');
  return `<article class="company-card" data-company-card="${escapeHtml(company.id)}"><div class="company-card-top"><span class="company-logo logo-teal">${escapeHtml(company.shortName)}</span><span class="company-state">Configurée</span><button class="icon-button small" type="button" aria-label="Options de la société"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg></button></div><h3>${safeName}</h3><p>${safeType}</p><div class="company-stats"><span><small>IFU</small><strong>${safeIfu}</strong></span><span><small>EXERCICE</small><strong>À configurer</strong></span></div><div class="company-card-footer"><span class="member-stack"><i class="avatar avatar-purple">CD</i><small>1 membre</small></span><button class="button button-secondary button-small" type="button" data-company-switch="${escapeHtml(company.id)}">Ouvrir</button></div></article>`;
}

function addCompany(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const name = String(formData.get('companyName') || '').trim();
  if (!name) return;
  const idBase = name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'societe';
  let id = idBase;
  let index = 2;
  while (appState.companies[id]) id = `${idBase}-${index++}`;
  const type = String(formData.get('companyType') || '').trim() || 'Nouvelle société';
  const company = { id, name, shortName: initials(name), type, meta: `${type} · XOF`, ifu: String(formData.get('companyIfu') || '').trim() || 'À compléter', color: 'teal', treasury: '0', sales: '0', receivables: '0', expenses: '0' };
  appState.companies[id] = company;
  const addCard = $('.company-card-add');
  addCard?.insertAdjacentHTML('beforebegin', makeCompanyCard(company));
  closeModal();
  setActiveCompany(id, false);
  openView('companies');
  showToast(`${name} a été ajoutée à votre espace.`);
  event.currentTarget.reset();
}

function addAsset(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const name = String(formData.get('assetName') || '').trim();
  const value = String(formData.get('assetValue') || '').trim() || '0';
  if (!name) return;
  const count = $('#assetRows')?.querySelectorAll('tr').length + 1 || 4;
  const row = `<tr><td><span class="table-icon table-icon-purple">▣</span><span class="cell-title">${escapeHtml(name)}</span><small class="cell-subtitle">IMM-2025-00${count} · Nouvelle immobilisation</small></td><td>${escapeHtml(String(formData.get('assetDate') || '16/06/2025'))}</td><td>${escapeHtml(String(formData.get('assetDuration') || '3 ans'))}</td><td>${escapeHtml(String(formData.get('assetMethod') || 'Linéaire'))}</td><td class="align-right">${escapeHtml(value)}</td><td><span class="status status-amber">À contrôler</span></td><td><button class="icon-button small" type="button" aria-label="Voir le détail"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></td></tr>`;
  $('#assetRows')?.insertAdjacentHTML('afterbegin', row);
  closeModal();
  openView('assets');
  showToast(`Plan prévisionnel calculé pour ${name}.`);
  event.currentTarget.reset();
}

function handleFile(file) {
  if (!file) return;
  $('#fileName').textContent = file.name;
  $('#mappingFileLabel').textContent = file.name;
  $('#mappingPanel')?.removeAttribute('hidden');
  $('#mappingPanel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  showToast(`${file.name} est prêt à être analysé.`);
}

function buildExportPane() {
  const pane = document.createElement('div');
  pane.className = 'export-pane panel';
  pane.id = 'exportPane';
  pane.hidden = true;
  pane.innerHTML = `<div class="panel-heading"><div><h2>Choisir l’état à exporter</h2><p>Les données de la société active seront exportées selon votre sélection.</p></div><span class="status status-green">${escapeHtml(appState.companies[appState.activeCompany].shortName)} · actif</span></div><div class="export-format-grid"><button class="export-format is-selected" type="button" data-export-format="xlsx"><span class="file-icon file-icon-green">X</span><span><strong>Excel moderne</strong><small>.xlsx · recommandé</small></span><span class="radio-check"></span></button><button class="export-format" type="button" data-export-format="xls"><span class="file-icon file-icon-blue">X</span><span><strong>Excel compatibilité</strong><small>.xls · ancien format</small></span><span class="radio-check"></span></button><button class="export-format" type="button" data-export-format="txt"><span class="file-icon file-icon-purple">T</span><span><strong>Texte comptable</strong><small>.txt · séparateur tabulation</small></span><span class="radio-check"></span></button></div><div class="export-options"><label class="field"><span>État à exporter</span><select id="exportReportType"><option>Balance générale</option><option>Grand livre</option><option>Livre-journal</option><option>Balance auxiliaire clients</option><option>Balance auxiliaire fournisseurs</option><option>État des immobilisations</option></select></label><label class="field"><span>Période</span><select><option>Juin 2025</option><option>Exercice 2025</option><option>Personnalisée…</option></select></label><label class="field"><span>Journaux</span><select><option>Tous les journaux</option><option>Ventes uniquement</option><option>Achats uniquement</option></select></label></div><div class="export-footer"><span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/></svg> L’export sera enregistré dans l’historique.</span><button class="button button-primary" type="button" data-action="download-report">Télécharger l’état <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 11l4 4 4-4M5 20h14"/></svg></button></div>`;
  const recent = $('.recent-imports');
  recent?.parentElement?.insertBefore(pane, recent);
  return pane;
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadReport() {
  const company = appState.companies[appState.activeCompany];
  const reportType = $('#exportReportType')?.value || 'Balance générale';
  const filename = `${company.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-balance-juin.txt`;
  const content = `SOCIETE\t${company.name}\nETAT\t${reportType}\nPERIODE\tJuin 2025\n\nCOMPTE\tLIBELLE\tDEBIT\tCREDIT\n411000\tClients\t486000\t0\n512100\tBanque\t2340500\t0\n706000\tServices vendus\t0\t1265000\nTOTAL\t\t2826500\t2826500\n`;
  downloadText(filename, content);
  showToast(`${reportType} exportée pour ${company.name}.`);
}

function downloadTemplate() {
  downloadText('modele-import-fec.txt', 'DATE\tJOURNAL\tNUMERO\tCOMPTE\tLIBELLE\tDEBIT\tCREDIT\n16/06/2025\tVE\tVE-0001\t411000\tClient exemple\t250000\t0\n16/06/2025\tVE\tVE-0001\t706000\tPrestation exemple\t0\t250000\n');
  showToast('Le modèle TXT a été téléchargé.');
}

function setImportMode(mode) {
  $$('.tab-button').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.importTab === mode));
  const importPane = $('#importPane');
  const mapping = $('#mappingPanel');
  const exportPane = $('#exportPane');
  if (mode === 'export') {
    importPane?.setAttribute('hidden', '');
    mapping?.setAttribute('hidden', '');
    exportPane?.removeAttribute('hidden');
  } else {
    importPane?.removeAttribute('hidden');
    exportPane?.setAttribute('hidden', '');
  }
}

function generateDepreciation() {
  $$('#assetRows .status-amber').forEach((status) => {
    status.textContent = 'À contrôler';
  });
  $$('.summary-card-action .button').forEach((button) => { button.textContent = 'Préparée'; });
  showToast('La dotation de juin est prête à être contrôlée dans le journal.');
}

function acceptSuggestion() {
  const card = $('.suggestion-card');
  if (!card) return;
  card.classList.add('is-accepted');
  $$('.suggestion-card [data-action="accept-suggestion"]').forEach((button) => {
    button.textContent = 'Imputation acceptée ✓';
    button.classList.remove('button-primary');
    button.classList.add('button-secondary');
  });
  const foot = $('.suggestion-foot', card);
  if (foot) foot.innerHTML = '<span style="color:var(--green);font-size:15px">✓</span> Imputation prête pour validation dans le journal.';
  showToast('Imputation enregistrée dans le brouillon.');
}

function editSuggestion() {
  const confidence = $('.suggestion-card .confidence');
  if (confidence) confidence.textContent = 'À revoir';
  showToast('Les comptes sont maintenant modifiables.');
}

function validateImport() {
  const button = $('[data-action="validate-import"]');
  if (button) button.textContent = 'Contrôle terminé ✓';
  const status = $('#mappingPanel .status');
  if (status) { status.textContent = 'Prêt à intégrer'; status.className = 'status status-green'; }
  showToast('48 lignes contrôlées : aucune anomalie bloquante.');
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const navItem = event.target.closest('.nav-item[data-view]');
    if (navItem) { openView(navItem.dataset.view); return; }

    const companyOption = event.target.closest('[data-company-option]');
    if (companyOption) { setActiveCompany(companyOption.dataset.companyOption); return; }

    const companySwitch = event.target.closest('[data-company-switch]');
    if (companySwitch) { setActiveCompany(companySwitch.dataset.companySwitch); openView('dashboard'); return; }

    const importTab = event.target.closest('[data-import-tab]');
    if (importTab) { setImportMode(importTab.dataset.importTab); return; }

    const exportFormat = event.target.closest('[data-export-format]');
    if (exportFormat) {
      $$('.export-format').forEach((format) => format.classList.toggle('is-selected', format === exportFormat));
      return;
    }

    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (action === 'open-view') openView(actionTarget.dataset.view);
    if (action === 'show-company-modal') openModal('companyModal');
    if (action === 'show-asset-modal') openModal('assetModal');
    if (action === 'close-modal') closeModal();
    if (action === 'show-quick') toggleQuickMenu();
    if (action === 'close-quick') $('#quickMenu')?.setAttribute('hidden', '');
    if (action === 'toggle-sidebar') $('#sidebar')?.classList.toggle('is-open');
    if (action === 'show-help') showToast('Le guide vous accompagne à chaque étape.');
    if (action === 'show-notifications') showToast('3 actions attendent votre contrôle.');
    if (action === 'dismiss-notice') actionTarget.closest('.notice')?.remove();
    if (action === 'save-draft') showToast('Brouillon enregistré.');
    if (action === 'accept-suggestion') acceptSuggestion();
    if (action === 'edit-suggestion') editSuggestion();
    if (action === 'generate-depreciation') generateDepreciation();
    if (action === 'validate-import') validateImport();
    if (action === 'download-report') downloadReport();
    if (action === 'download-template') downloadTemplate();
    if (action === 'show-member-modal') showToast('L’invitation d’un membre sera disponible dans le prochain jalon.');
  });

  $('#companyPicker')?.addEventListener('click', () => {
    const menu = $('#companyMenu');
    const willOpen = !menu?.classList.contains('is-open');
    menu?.classList.toggle('is-open', willOpen);
    $('#companyPicker')?.setAttribute('aria-expanded', String(willOpen));
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.company-picker-wrap')) {
      $('#companyMenu')?.classList.remove('is-open');
      $('#companyPicker')?.setAttribute('aria-expanded', 'false');
    }
  });

  $('#modalBackdrop')?.addEventListener('click', closeModal);
  $('#companyForm')?.addEventListener('submit', addCompany);
  $('#assetForm')?.addEventListener('submit', addAsset);
  $('#fileInput')?.addEventListener('change', (event) => handleFile(event.target.files?.[0]));

  const dropZone = $('#dropZone');
  ['dragenter', 'dragover'].forEach((name) => dropZone?.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
  ['dragleave', 'drop'].forEach((name) => dropZone?.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
  dropZone?.addEventListener('drop', (event) => handleFile(event.dataTransfer.files?.[0]));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeModal(); $('#quickMenu')?.setAttribute('hidden', ''); $('#companyMenu')?.classList.remove('is-open'); }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCompanyMenu();
  setActiveCompany(appState.activeCompany, false);
  buildExportPane();
  bindEvents();
});
