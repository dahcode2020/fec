import { calculateStraightLinePlan, classifyIntegratedEntry, createIntegratedJournal, createJournalEntry, depreciationEntry, exerciseYear, exportBalanceTxt, INTEGRATED_JOURNAL_CATEGORIES, makeDossierCode, MODULE_DEFINITIONS, suggestPosting, summarizeIntegratedJournal, syncIntegratedJournal } from './core.js';

const appState = {
  authenticated: false,
  activeCompany: 'acacia',
  selectedDossier: 'acacia-25-csr',
  companies: {
    acacia: {
      id: 'acacia',
      name: 'Acacia Conseil',
      shortName: 'AC',
      type: 'ETS',
      legalForm: 'ETS',
      address: 'Cotonou, Littoral',
      activity: 'Conseil et services',
      code: 'ACACIA',
      exerciseStart: '2025-01-01',
      exerciseEnd: '2025-12-31',
      meta: 'ETS · XOF',
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
      type: 'ETS',
      legalForm: 'ETS',
      address: 'Cotonou, Littoral',
      activity: 'Commerce de détail',
      code: 'NORIA',
      exerciseStart: '2025-01-01',
      exerciseEnd: '2025-12-31',
      meta: 'ETS · XOF',
      ifu: '3202300087129',
      color: 'teal',
      treasury: '1 486 200',
      sales: '842 500',
      receivables: '125 000',
      expenses: '267 900'
    }
  },
  dossiers: [
    { id: 'acacia-25-csr', companyId: 'acacia', dossier: 'ACACIA-25', moduleId: 'CSR', period: '01/01/2025 - 31/12/2025', exerciseYear: '2025', sessions: 1, status: 'Actif', statusClass: 'status-green' },
    { id: 'acacia-25-gcsf', companyId: 'acacia', dossier: 'ACACIA-25', moduleId: 'GCSF', period: '01/01/2025 - 31/12/2025', exerciseYear: '2025', sessions: 0, status: 'Disponible', statusClass: 'status-blue' },
    { id: 'noria-25-gcsf', companyId: 'noria', dossier: 'NORIA-25', moduleId: 'GCSF', period: '01/01/2025 - 31/12/2025', exerciseYear: '2025', sessions: 0, status: 'Disponible', statusClass: 'status-blue' }
  ],
  integratedJournal: createIntegratedJournal({ id: 'lj-acacia-2025', companyId: 'acacia', fiscalYear: '2025' }),
  integratedEntries: [
    { id: 'sale-1', companyId: 'acacia', reference: 'VE-0008', date: '2025-06-16', journalId: 'VE', label: 'Awa Concept — FAC-2025-018', debit: 250000, credit: 250000, amount: 250000, integrationCategory: 'GENERAL', status: 'TO_REVIEW', source: 'Saisie et insertion' },
    { id: 'purchase-1', companyId: 'acacia', reference: 'AC-0007', date: '2025-06-15', journalId: 'AC', label: 'Cotonou Bureau — FA-0154', debit: 38500, credit: 38500, amount: 38500, integrationCategory: 'GENERAL', status: 'VALIDATED', source: 'Saisie et insertion' },
    { id: 'amort-1', companyId: 'acacia', reference: 'OD-0003', date: '2025-06-30', journalId: 'OD', label: 'Dotation amortissement — juin', debit: 23667, credit: 23667, amount: 23667, integrationCategory: 'AMORTISSEMENTS', status: 'TO_REVIEW', source: 'Amortissement automatique' },
    { id: 'central-1', companyId: 'acacia', reference: 'CT-0001', date: '2025-06-30', journalId: 'OD', label: 'Centralisation des journaux — juin', debit: 125000, credit: 125000, amount: 125000, integrationCategory: 'CENTRALISATION', status: 'VALIDATED', source: 'Centralisation' },
    { id: 'subscription-1', companyId: 'acacia', reference: 'OD-0004', date: '2025-06-01', journalId: 'OD', label: 'Abonnement internet — juin', debit: 12000, credit: 12000, amount: 12000, integrationCategory: 'ABONNEMENTS', status: 'VALIDATED', source: 'Abonnement périodique' },
    { id: 'result-1', companyId: 'acacia', reference: 'OD-0005', date: '2025-06-30', journalId: 'OD', label: 'Résultat de la période — juin', debit: 548000, credit: 548000, amount: 548000, integrationCategory: 'RESULTAT', status: 'TO_REVIEW', source: 'Résultat de la période' }
  ]
};

const MODULES = {
  CSR: { ...MODULE_DEFINITIONS.CSR, color: 'green' },
  GP: { ...MODULE_DEFINITIONS.GP, color: 'purple' },
  GCSF: { ...MODULE_DEFINITIONS.GCSF, color: 'blue' },
  GC: { ...MODULE_DEFINITIONS.GC, color: 'amber' }
};

const FICHIER_GROUPS = {
  dossiers: {
    label: 'Dossiers',
    description: 'Ouvrez, créez et protégez vos dossiers d’entreprises depuis un même espace.',
    actions: [
      { label: 'Dossiers en cours', description: 'Afficher les entreprises enregistrées', symbol: '▣', tone: 'blue', action: 'companies' },
      { label: 'Nouveau dossier', description: 'Créer une nouvelle entreprise', symbol: '+', tone: 'green', action: 'new-dossier' },
      { label: 'Sauvegarder les dossiers', description: 'Créer une sauvegarde locale', symbol: '↓', tone: 'purple', action: 'backup' },
      { label: 'Restaurer une sauvegarde', description: 'Reprendre depuis une copie', symbol: '↥', tone: 'amber', action: 'restore' },
      { label: 'Fermer', description: 'Fermer la session de travail', symbol: '×', tone: 'red', action: 'close' }
    ]
  },
  echanges: {
    label: 'Échanges comptables',
    description: 'Échangez vos balances et livres comptables avec votre cabinet ou une autre solution.',
    actions: [
      { label: 'Exportation de Fichiers Comptables', description: 'Exporter une balance ou un livre', symbol: '↑', tone: 'green', action: 'export' },
      { label: 'Importation de Fichiers Comptables', description: 'Importer un fichier TXT ou Excel', symbol: '↓', tone: 'blue', action: 'import' },
      { label: 'Importation d’une Balance Générale', description: 'Reprendre les soldes d’un exercice', symbol: '▤', tone: 'purple', action: 'balance' }
    ]
  },
  centralisation: {
    label: 'Centralisation',
    description: 'Regroupez les données comptables selon les règles qui seront définies pour votre dossier.',
    actions: [
      { label: 'Centralisation de Données Comptables', description: 'Préparer une centralisation', symbol: '◎', tone: 'blue', action: 'placeholder' },
      { label: 'Annulation d’une Centralisation', description: 'Revenir sur une centralisation', symbol: '↶', tone: 'amber', action: 'placeholder' }
    ]
  },
  consolidation: {
    label: 'Consolidation',
    description: 'Préparez vos travaux de consolidation avant ou après la détermination du résultat.',
    actions: [
      { label: 'Consolidation de Comptabilité (avant Résultat)', description: 'Étape de préparation avant résultat', symbol: '≋', tone: 'purple', action: 'placeholder' },
      { label: 'Consolidation de Comptabilité (Après Résultat)', description: 'Étape de consolidation après résultat', symbol: '≋', tone: 'green', action: 'placeholder' }
    ]
  },
  controle: {
    label: 'Contrôle & maintenance',
    description: 'Contrôlez les soldes et protégez l’intégrité de votre base comptable.',
    actions: [
      { label: 'Inspection et Recalcul du solde des Comptes', description: 'Vérifier la cohérence des soldes', symbol: '⌕', tone: 'blue', action: 'placeholder' },
      { label: 'Réparation d’une Base', description: 'Diagnostiquer une base de données', symbol: '⚙', tone: 'red', action: 'placeholder' }
    ]
  },
  aide: {
    label: 'Aide',
    description: 'Retrouvez les ressources pour prendre en main le module CSR.',
    actions: [
      { label: 'Tutoriel d’Utilisation', description: 'Découvrir les principaux parcours', symbol: '?', tone: 'purple', action: 'help' }
    ]
  }
};

const CONFIG_GROUPS = {
  societe: {
    label: 'Société & exercice',
    description: 'Identité de la société, période et paramètres généraux du dossier actif.',
    actions: [
      { label: 'Fiche de la société', description: 'Nom, forme juridique, adresse, IFU et activité', symbol: '▣', tone: 'blue', action: 'companies' },
      { label: 'Exercices et périodes', description: 'Créer, ouvrir ou clôturer une période comptable', symbol: '◷', tone: 'purple', action: 'placeholder' },
      { label: 'Paramètres régionaux', description: 'Devise XOF, format des dates et préférences', symbol: '⚙', tone: 'green', action: 'placeholder' }
    ]
  },
  comptes: {
    label: 'Comptes généraux',
    description: 'Plan Comptable SYSCOHADA Révisé : complétez et adaptez vos comptes aux besoins de votre société.',
    actions: [
      { label: 'Comptes Généraux (Plan Comptable Syscohada Révisé)', description: 'Consulter le plan et rechercher un compte', symbol: '▤', tone: 'green', action: 'placeholder' },
      { label: 'Ajouter ou compléter un compte', description: 'Créer un sous-compte avec contrôle du référentiel', symbol: '+', tone: 'blue', action: 'placeholder' },
      { label: 'Importer / exporter le plan comptable', description: 'Échanger vos comptes et vos personnalisations', symbol: '↕', tone: 'purple', action: 'imports' },
      { label: 'Comptes favoris et règles par défaut', description: 'Accélérer la saisie des opérations courantes', symbol: '★', tone: 'amber', action: 'placeholder' }
    ]
  },
  tiers: {
    label: 'Tiers',
    description: 'Organisez les fiches et les comptes auxiliaires de vos partenaires.',
    actions: [
      { label: 'Fournisseurs', description: 'Fiches, comptes auxiliaires, échéances et contacts', symbol: 'F', tone: 'blue', action: 'purchases' },
      { label: 'Clients', description: 'Fiches, comptes auxiliaires, créances et règlements', symbol: 'C', tone: 'green', action: 'sales' },
      { label: 'Personnel', description: 'Comptes de personnel et avances à suivre', symbol: 'P', tone: 'purple', action: 'placeholder' },
      { label: 'Débiteurs / créditeurs divers', description: 'Tiers occasionnels et comptes à régulariser', symbol: 'D', tone: 'amber', action: 'placeholder' }
    ]
  },
  journaux: {
    label: 'Journaux',
    description: 'Définissez vos journaux, leurs séquences et leurs comptes par défaut.',
    actions: [
      { label: 'Journaux comptables', description: 'Achats, ventes, banque, caisse et opérations diverses', symbol: '≡', tone: 'blue', action: 'journal' },
      { label: 'Ajouter un journal', description: 'Créer un journal adapté à votre activité', symbol: '+', tone: 'green', action: 'placeholder' },
      { label: 'Numérotation des pièces', description: 'Configurer les séquences par journal et exercice', symbol: '#', tone: 'purple', action: 'placeholder' }
    ]
  },
  taxes: {
    label: 'Taxes & TVA',
    description: 'Paramétrez les codes de taxes et leurs versions sans modifier l’historique.',
    actions: [
      { label: 'Codes et taux de taxes', description: 'Créer et versionner les taux applicables', symbol: '%', tone: 'amber', action: 'placeholder' },
      { label: 'TVA sur les ventes et achats', description: 'Associer les comptes et les règles de calcul', symbol: 'T', tone: 'blue', action: 'placeholder' },
      { label: 'Retenues et taxes spécifiques', description: 'Préparer les règles à valider avec votre conseil', symbol: 'R', tone: 'purple', action: 'placeholder' }
    ]
  },
  immobilisations: {
    label: 'Immobilisations',
    description: 'Préparez les fiches d’actifs et les règles de calcul des amortissements.',
    actions: [
      { label: 'Registre des immobilisations', description: 'Biens, catégories, comptes et pièces justificatives', symbol: '▥', tone: 'blue', action: 'assets' },
      { label: 'Méthodes et durées', description: 'Linéaire, prorata temporis et durées par catégorie', symbol: '◴', tone: 'purple', action: 'placeholder' },
      { label: 'Comptes de dotation par défaut', description: 'Préparer les écritures périodiques à contrôler', symbol: '↗', tone: 'green', action: 'assets' }
    ]
  },
  imputations: {
    label: 'Imputations',
    description: 'Aidez l’utilisateur à comptabiliser ses opérations avec des règles explicables.',
    actions: [
      { label: 'Modèles d’écritures', description: 'Créer des schémas débit / crédit réutilisables', symbol: '✦', tone: 'purple', action: 'placeholder' },
      { label: 'Règles par fournisseur ou client', description: 'Retrouver les comptes utilisés habituellement', symbol: '↗', tone: 'blue', action: 'placeholder' },
      { label: 'Catégories d’opérations', description: 'Ventes, achats, frais, règlements et transferts', symbol: '◎', tone: 'green', action: 'placeholder' },
      { label: 'Validation et niveau de confiance', description: 'Imposer un contrôle avant toute écriture', symbol: '✓', tone: 'amber', action: 'placeholder' }
    ]
  },
  tresorerie: {
    label: 'Banques & caisses',
    description: 'Configurez les comptes de trésorerie et les modes de règlement de la société.',
    actions: [
      { label: 'Comptes bancaires', description: 'Banques, numéros de comptes et journaux associés', symbol: 'B', tone: 'blue', action: 'treasury' },
      { label: 'Caisses', description: 'Créer et suivre les comptes de caisse', symbol: 'C', tone: 'green', action: 'treasury' },
      { label: 'Modes de règlement', description: 'Espèces, virement, chèque, mobile money et autres', symbol: '₣', tone: 'amber', action: 'placeholder' }
    ]
  },
  acces: {
    label: 'Utilisateurs & accès',
    description: 'Attribuez des rôles par société et, à terme, par fonction du module CSR.',
    actions: [
      { label: 'Utilisateurs de la société', description: 'Inviter, retirer ou modifier un accès', symbol: 'U', tone: 'purple', action: 'companies' },
      { label: 'Rôles et permissions', description: 'Saisie, contrôle, validation, clôture et lecture', symbol: '✓', tone: 'green', action: 'placeholder' },
      { label: 'Journal des connexions', description: 'Consulter les accès et actions sensibles', symbol: '◷', tone: 'blue', action: 'placeholder' }
    ]
  },
  documents: {
    label: 'Documents',
    description: 'Paramétrez les modèles et les références affichées sur les pièces.',
    actions: [
      { label: 'Modèles de pièces', description: 'Factures, avoirs, reçus et impressions', symbol: '▧', tone: 'blue', action: 'placeholder' },
      { label: 'Mentions et identité visuelle', description: 'Logo, coordonnées et mentions de la société', symbol: '✦', tone: 'purple', action: 'companies' },
      { label: 'Références et numérotation', description: 'Préfixes et séquences des documents', symbol: '#', tone: 'amber', action: 'placeholder' }
    ]
  },
  sauvegarde: {
    label: 'Sauvegarde',
    description: 'Protégez et restaurez les données du dossier actif.',
    actions: [
      { label: 'Sauvegarder le dossier', description: 'Créer une copie locale vérifiable', symbol: '↓', tone: 'green', action: 'backup' },
      { label: 'Restaurer une sauvegarde', description: 'Reprendre les données depuis une copie', symbol: '↥', tone: 'blue', action: 'restore' },
      { label: 'Historique des sauvegardes', description: 'Consulter les sauvegardes et leur état', symbol: '◷', tone: 'purple', action: 'placeholder' }
    ]
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

function displayDate(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function updateDossierPreview() {
  const code = $('#companyCode')?.value;
  const start = $('#exerciseStart')?.value;
  const end = $('#exerciseEnd')?.value;
  const preview = $('#dossierCodePreview');
  const period = $('#exercisePreview');
  if (preview) preview.textContent = makeDossierCode(code, start);
  if (period) period.textContent = `${displayDate(start)} — ${displayDate(end)}`;
}

function toggleOtherLegalForm() {
  const otherField = $('#legalFormOtherField');
  const legalForm = $('#legalForm');
  if (!otherField || !legalForm) return;
  const isOther = legalForm.value === 'AUTRES';
  otherField.toggleAttribute('hidden', !isOther);
  const input = otherField.querySelector('input');
  if (input) input.required = isOther;
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
  renderIntegratedJournal();
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

function renderDossiers(query = $('#dossierSearch')?.value || '') {
  const rows = $('#dossierRows');
  if (!rows) return;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleDossiers = appState.dossiers.filter((dossier) => {
    const company = appState.companies[dossier.companyId];
    const module = dossier.moduleId ? MODULES[dossier.moduleId] : { label: 'Aucun module activé', shortLabel: 'À configurer' };
    return !normalizedQuery || [dossier.dossier, dossier.period, company?.name, module.label, dossier.moduleId].join(' ').toLowerCase().includes(normalizedQuery);
  });
  rows.innerHTML = visibleDossiers.map((dossier) => {
    const company = appState.companies[dossier.companyId] || { name: 'Société inconnue', shortName: '??', color: 'teal', type: 'Dossier comptable' };
    const module = dossier.moduleId ? MODULES[dossier.moduleId] : { label: 'Aucun module activé', shortLabel: 'À configurer', color: 'muted' };
    const isSelected = dossier.id === appState.selectedDossier;
    const moduleClass = dossier.moduleId ? `module-table-${module.color}` : 'module-table-muted';
    return `<tr class="${isSelected ? 'is-selected' : ''}" data-dossier-id="${escapeHtml(dossier.id)}" tabindex="0" role="button" aria-label="Sélectionner ${escapeHtml(dossier.dossier)} ${escapeHtml(module.shortLabel)}"><td><span class="dossier-code-icon ${company.color === 'orange' ? 'dossier-code-orange' : 'dossier-code-teal'}">${escapeHtml(company.shortName)}</span><span class="dossier-code"><b>${escapeHtml(dossier.dossier)}</b><small>${dossier.moduleId ? 'Dossier · module rattaché' : 'Dossier · à configurer'}</small></span></td><td><span class="module-table-cell"><i class="module-table-mark ${moduleClass}">${escapeHtml(dossier.moduleId || '—')}</i><span><b>${escapeHtml(module.shortLabel)}</b><small>${escapeHtml(module.label)}</small></span></span></td><td><span class="company-name-cell">${escapeHtml(company.name)}</span><small class="cell-subtitle">${escapeHtml(company.activity || company.type || 'Dossier comptable')}</small></td><td>${escapeHtml(dossier.period)}</td><td><span class="session-count">${dossier.sessions ? dossier.sessions : '—'}</span></td><td><span class="status ${dossier.statusClass || 'status-green'}">${escapeHtml(dossier.status)}</span></td></tr>`;
  }).join('');
  const activeRecords = appState.dossiers.filter((dossier) => dossier.status !== 'Archivé');
  const uniqueDossiers = new Set(activeRecords.map((dossier) => `${dossier.companyId}:${dossier.dossier}`));
  const activeModules = activeRecords.filter((dossier) => dossier.moduleId).length;
  const countNode = $('#dossierCount');
  const moduleCountNode = $('#moduleCount');
  if (countNode) countNode.textContent = String(uniqueDossiers.size);
  if (moduleCountNode) moduleCountNode.textContent = String(activeModules);
  if (!visibleDossiers.length) rows.innerHTML = '<tr><td colspan="6" class="dossier-empty">Aucun dossier ne correspond à votre recherche.</td></tr>';
}

function activeModulesFor(companyId, dossierCode) {
  return appState.dossiers.filter((dossier) => dossier.companyId === companyId && dossier.dossier === dossierCode && dossier.moduleId && dossier.status !== 'Archivé');
}

function renderModuleHome(companyId, dossierCode) {
  const company = appState.companies[companyId];
  if (!company) return;
  const activeEntries = activeModulesFor(companyId, dossierCode);
  const activeIds = new Set(activeEntries.map((entry) => entry.moduleId));
  const year = activeEntries[0]?.exerciseYear || dossierCode?.slice(-2) || 'YY';
  const displayCode = dossierCode || `${company.code || company.shortName}-20${year}`;
  ['moduleCompanyName', 'moduleHeadingCompany', 'moduleBannerCompany'].forEach((id) => { const node = $(`#${id}`); if (node) node.textContent = company.name; });
  ['moduleDossierCode', 'moduleHeadingCode'].forEach((id) => { const node = $(`#${id}`); if (node) node.textContent = displayCode; });
  const meta = $('#moduleBannerMeta');
  if (meta) meta.textContent = `${activeEntries.length} module${activeEntries.length > 1 ? 's' : ''} activé${activeEntries.length > 1 ? 's' : ''} · Exercice ${activeEntries[0]?.exerciseYear || 'à configurer'}`;
  const avatar = $('#moduleCompanyAvatar');
  if (avatar) { avatar.textContent = company.shortName; avatar.className = `avatar avatar-small ${companyAvatarClass(company)}`; }
  const bannerIcon = $('.module-banner-icon');
  if (bannerIcon) bannerIcon.textContent = company.shortName;
  $$('.module-card').forEach((card) => {
    const moduleId = card.dataset.moduleCard;
    const definition = MODULES[moduleId];
    const active = activeIds.has(moduleId);
    card.classList.toggle('is-inactive', !active);
    const state = $(`[data-module-state="${moduleId}"]`);
    if (state) { state.textContent = active ? 'ACTIVÉ' : 'NON ACTIVÉ'; state.classList.toggle('is-inactive', !active); }
    const button = $(`[data-module-open="${moduleId}"]`);
    if (button) { button.textContent = active ? 'Ouvrir' : 'Activer'; button.className = `button button-small ${active ? 'button-primary' : 'button-secondary'}`; button.dataset.moduleOpen = moduleId; }
    if (definition) card.setAttribute('aria-label', `${definition.label} — ${active ? 'activé' : 'non activé'}`);
  });
}

function selectDossier(dossierId) {
  const dossier = appState.dossiers.find((item) => item.id === dossierId);
  const company = dossier && appState.companies[dossier.companyId];
  if (!dossier || !company) return;
  appState.selectedDossier = dossierId;
  renderDossiers();
  const title = $('#selectedDossierTitle');
  const meta = $('#selectedDossierMeta');
  const moduleNode = $('#selectedDossierModule');
  const hint = $('#dossierSelectionHint');
  const module = dossier.moduleId ? MODULES[dossier.moduleId] : null;
  if (title) title.textContent = company.name;
  if (meta) meta.textContent = `${dossier.dossier} · ${module ? module.shortLabel : 'Aucun module'} · Exercice ${dossier.exerciseYear || dossier.period.slice(-4)}`;
  if (moduleNode) { moduleNode.textContent = module ? `${dossier.moduleId} · ${module.shortLabel}` : 'Aucun module activé'; moduleNode.className = `selected-module-pill ${module ? `selected-module-${module.color}` : 'selected-module-muted'}`; }
  if (hint) hint.textContent = `${dossier.dossier} · ${module ? module.shortLabel : 'aucun module'} sélectionné · choisissez une action à droite.`;
}

function showDossiers() {
  appState.authenticated = true;
  $('#loginScreen')?.setAttribute('hidden', '');
  $('#appShell')?.setAttribute('hidden', '');
  $('#dossiersScreen')?.removeAttribute('hidden');
  document.body.style.overflow = '';
  renderDossiers();
  selectDossier(appState.selectedDossier);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLogin() {
  appState.authenticated = false;
  $('#dossiersScreen')?.setAttribute('hidden', '');
  $('#appShell')?.setAttribute('hidden', '');
  $('#loginScreen')?.removeAttribute('hidden');
  document.body.style.overflow = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openSelectedDossier() {
  const dossier = appState.dossiers.find((item) => item.id === appState.selectedDossier);
  if (!dossier || dossier.status === 'Archivé') {
    showToast('Ce dossier est archivé et ne peut pas être ouvert.');
    return;
  }
  dossier.sessions = Math.max(1, dossier.sessions || 0);
  appState.moduleCompanyId = dossier.companyId;
  appState.moduleDossierCode = dossier.dossier;
  setActiveCompany(dossier.companyId, false);
  $('#dossiersScreen')?.setAttribute('hidden', '');
  $('#appShell')?.setAttribute('hidden', '');
  $('#moduleStubScreen')?.setAttribute('hidden', '');
  $('#moduleHomeScreen')?.removeAttribute('hidden');
  renderModuleHome(dossier.companyId, dossier.dossier);
  showToast(`${appState.companies[dossier.companyId].name} est ouvert. Choisissez un module.`);
}

function activateModule(moduleId) {
  const selected = appState.dossiers.find((item) => item.id === appState.selectedDossier);
  if (!selected || !MODULES[moduleId]) return;
  const companyEntries = activeModulesFor(selected.companyId, selected.dossier);
  if (companyEntries.some((entry) => entry.moduleId === moduleId)) return openModule(moduleId);
  const base = appState.dossiers.find((item) => item.companyId === selected.companyId && item.dossier === selected.dossier && !item.moduleId);
  if (base) appState.dossiers = appState.dossiers.filter((item) => item.id !== base.id);
  const entry = { ...selected, id: `${selected.companyId}-${selected.dossier.toLowerCase()}-${moduleId.toLowerCase()}`, moduleId, sessions: 0, status: 'Disponible', statusClass: 'status-blue' };
  appState.dossiers.push(entry);
  appState.selectedDossier = entry.id;
  renderDossiers();
  renderModuleHome(selected.companyId, selected.dossier);
  showToast(`${MODULES[moduleId].label} a été rattaché à ${selected.dossier}.`);
}

function openModule(moduleId) {
  const companyId = appState.moduleCompanyId;
  const dossierCode = appState.moduleDossierCode;
  const entry = activeModulesFor(companyId, dossierCode).find((item) => item.moduleId === moduleId);
  if (!entry) return activateModule(moduleId);
  setActiveCompany(companyId, false);
  if (moduleId === 'CSR') {
    $('#moduleHomeScreen')?.setAttribute('hidden', '');
    $('#moduleStubScreen')?.setAttribute('hidden', '');
    $('#appShell')?.removeAttribute('hidden');
    openView('dashboard');
    showToast('Module CSR ouvert.');
    return;
  }
  const definition = MODULES[moduleId];
  $('#moduleHomeScreen')?.setAttribute('hidden', '');
  $('#appShell')?.setAttribute('hidden', '');
  $('#moduleStubScreen')?.removeAttribute('hidden');
  const company = appState.companies[companyId];
  const stubName = $('#stubCompanyName');
  const stubCode = $('#stubDossierCode');
  const stubTitle = $('#stubModuleTitle');
  const stubDescription = $('#stubModuleDescription');
  const stubMark = $('#stubModuleMark');
  const stubAvatar = $('#stubCompanyAvatar');
  if (stubName) stubName.textContent = company.name;
  if (stubCode) stubCode.textContent = dossierCode;
  if (stubTitle) stubTitle.textContent = definition.label;
  if (stubDescription) stubDescription.textContent = definition.description;
  if (stubMark) { stubMark.textContent = moduleId; stubMark.className = `module-mark module-mark-${definition.color}`; }
  if (stubAvatar) { stubAvatar.textContent = company.shortName; stubAvatar.className = `avatar avatar-small ${companyAvatarClass(company)}`; }
}

function backToDossiers() {
  $('#moduleHomeScreen')?.setAttribute('hidden', '');
  $('#moduleStubScreen')?.setAttribute('hidden', '');
  $('#appShell')?.setAttribute('hidden', '');
  $('#dossiersScreen')?.removeAttribute('hidden');
  renderDossiers();
  selectDossier(appState.selectedDossier);
}

function backToModules() {
  $('#moduleStubScreen')?.setAttribute('hidden', '');
  $('#moduleHomeScreen')?.removeAttribute('hidden');
  renderModuleHome(appState.moduleCompanyId, appState.moduleDossierCode);
}

function duplicateSelectedDossier() {
  const source = appState.dossiers.find((item) => item.id === appState.selectedDossier);
  if (!source) return;
  const copyId = `${source.companyId}-copie-${Date.now()}`;
  appState.dossiers.push({ ...source, id: copyId, dossier: `${source.dossier}-COPIE`, sessions: 0, status: 'Copie de travail', statusClass: 'status-blue' });
  selectDossier(copyId);
  showToast('Une copie de travail du dossier a été créée.');
}

function archiveSelectedDossier() {
  const dossier = appState.dossiers.find((item) => item.id === appState.selectedDossier);
  if (!dossier) return;
  if (appState.dossiers.filter((item) => item.status !== 'Archivé').length <= 1) {
    showToast('Le dernier dossier actif ne peut pas être archivé ici.');
    return;
  }
  dossier.status = 'Archivé';
  dossier.statusClass = 'status-muted';
  const next = appState.dossiers.find((item) => item.status !== 'Archivé');
  if (next) appState.selectedDossier = next.id;
  renderDossiers();
  selectDossier(appState.selectedDossier);
  showToast(`${dossier.dossier} a été archivé. Ses données sont conservées.`);
}

function authenticate(event) {
  event.preventDefault();
  showDossiers();
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
  const safeActivity = escapeHtml(company.activity || company.type || 'Société');
  const safeLegalForm = escapeHtml(company.legalForm || company.type || '—');
  const safeIfu = escapeHtml(company.ifu || 'À compléter');
  const exercise = company.exerciseStart && company.exerciseEnd ? `${displayDate(company.exerciseStart)} — ${displayDate(company.exerciseEnd)}` : 'À configurer';
  return `<article class="company-card" data-company-card="${escapeHtml(company.id)}"><div class="company-card-top"><span class="company-logo logo-teal">${escapeHtml(company.shortName)}</span><span class="company-state">${safeLegalForm}</span><button class="icon-button small" type="button" aria-label="Options de la société"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg></button></div><h3>${safeName}</h3><p>${safeActivity}</p><div class="company-stats"><span><small>IFU</small><strong>${safeIfu}</strong></span><span><small>EXERCICE</small><strong>${exercise}</strong></span></div><div class="company-card-footer"><span class="member-stack"><i class="avatar avatar-purple">CD</i><small>1 membre</small></span><button class="button button-secondary button-small" type="button" data-company-switch="${escapeHtml(company.id)}">Ouvrir</button></div></article>`;
}

function addCompany(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const name = String(formData.get('companyName') || '').trim();
  const code = String(formData.get('companyCode') || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 18);
  const exerciseStart = String(formData.get('exerciseStart') || '').trim();
  const exerciseEnd = String(formData.get('exerciseEnd') || '').trim();
  if (!name || !code || !exerciseStart || !exerciseEnd) return;
  if (new Date(`${exerciseEnd}T00:00:00Z`) <= new Date(`${exerciseStart}T00:00:00Z`)) {
    showToast('La fin de l’exercice doit être postérieure à son début.');
    return;
  }
  const idBase = name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'societe';
  let id = idBase;
  let index = 2;
  while (appState.companies[id]) id = `${idBase}-${index++}`;
  const selectedLegalForm = String(formData.get('legalForm') || '').trim();
  const legalForm = selectedLegalForm === 'AUTRES' ? String(formData.get('legalFormOther') || '').trim() : selectedLegalForm;
  const activity = String(formData.get('companyActivity') || '').trim();
  const address = String(formData.get('companyAddress') || '').trim();
  const year = exerciseYear(exerciseStart);
  const generatedDossierCode = makeDossierCode(code, exerciseStart);
  if (appState.dossiers.some((dossier) => dossier.dossier === generatedDossierCode)) {
    showToast(`Le dossier ${generatedDossierCode} existe déjà dans cet espace.`);
    return;
  }
  const dossierId = `${id}-${year}`;
  const company = { id, name, shortName: code, code, legalForm: legalForm || 'Autres', type: legalForm || 'Autres', address, activity, exerciseStart, exerciseEnd, meta: `${legalForm || 'Autres'} · XOF`, ifu: String(formData.get('companyIfu') || '').trim(), color: 'teal', treasury: '0', sales: '0', receivables: '0', expenses: '0' };
  appState.companies[id] = company;
  const addCard = $('.company-card-add');
  addCard?.insertAdjacentHTML('beforebegin', makeCompanyCard(company));
  appState.dossiers.push({ id: dossierId, companyId: id, dossier: generatedDossierCode, period: `${displayDate(exerciseStart)} - ${displayDate(exerciseEnd)}`, exerciseYear: year, sessions: 0, status: 'Disponible', statusClass: 'status-blue' });
  const dossiersAreVisible = !$('#dossiersScreen')?.hasAttribute('hidden');
  closeModal();
  setActiveCompany(id, false);
  if (dossiersAreVisible) {
    appState.selectedDossier = dossierId;
    renderDossiers();
    selectDossier(dossierId);
    showDossiers();
  } else {
    openView('companies');
  }
  showToast(`${name} a été ajoutée à votre espace.`);
  event.currentTarget.reset();
  $('#legalFormOtherField')?.setAttribute('hidden', '');
  updateDossierPreview();
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
  const content = exportBalanceTxt({
    companyName: company.name,
    period: 'Juin 2025',
    rows: [
      { accountId: '411000', label: 'Clients', debit: 486000, credit: 0 },
      { accountId: '512100', label: 'Banque', debit: 2340500, credit: 0 },
      { accountId: '706000', label: 'Services vendus', debit: 0, credit: 1265000 }
    ]
  });
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
  const plan = calculateStraightLinePlan({
    assetId: 'IMM-2025-001',
    companyId: appState.activeCompany,
    cost: 850000,
    serviceDate: '2025-01-01',
    usefulLifeMonths: 36,
    prorata: false,
    expenseAccount: '681000',
    accumulatedAccount: '284500'
  });
  const entry = depreciationEntry(plan, { date: '2025-06-30' });
  $$('#assetRows .status-amber').forEach((status) => {
    status.textContent = 'À contrôler';
  });
  const amount = entry.lines[0].debit;
  const syncedEntry = syncIntegratedJournal(integratedJournalForCompany(appState.activeCompany), { id: 'amort-1', companyId: appState.activeCompany, reference: 'OD-0003', date: '2025-06-30', journalId: 'OD', label: 'Dotation amortissement — juin', debit: amount, credit: amount, amount, source: 'Amortissement automatique', integrationCategory: 'AMORTISSEMENTS', status: 'TO_REVIEW' }).entries[0];
  const existingIndex = appState.integratedEntries.findIndex((item) => item.id === syncedEntry.id && item.companyId === syncedEntry.companyId);
  if (existingIndex >= 0) appState.integratedEntries[existingIndex] = syncedEntry;
  else appState.integratedEntries.unshift(syncedEntry);
  renderIntegratedJournal();
  $$('.summary-card-action .button').forEach((button) => { button.textContent = 'Préparée'; });
  showToast(`Dotation de juin préparée : ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA à contrôler.`);
}

function synchronizeIntegratedJournal() {
  renderIntegratedJournal();
  const company = appState.companies[appState.activeCompany];
  showToast(`Livre journal synchronisé pour ${company.name}.`);
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

function integratedJournalForCompany(companyId) {
  let journal = createIntegratedJournal({ id: `lj-${companyId}-2025`, companyId, fiscalYear: '2025' });
  appState.integratedEntries.filter((entry) => entry.companyId === companyId).forEach((entry) => {
    journal = syncIntegratedJournal(journal, entry);
  });
  return journal;
}

function categoryClass(categoryId) {
  return ({ AMORTISSEMENTS: 'category-amort', CENTRALISATION: 'category-central', ABONNEMENTS: 'category-subscription', RESULTAT: 'category-result', GENERAL: 'category-general' })[categoryId] || 'category-general';
}

function statusLabel(status) {
  return ({ TO_REVIEW: ['À contrôler', 'status-purple'], VALIDATED: ['Validée', 'status-green'], CALCULATED: ['Calculé', 'status-amber'] })[status] || ['Brouillon', 'status-amber'];
}

function renderIntegratedJournal() {
  const rows = $('#integratedJournalRows');
  if (!rows) return;
  const journal = integratedJournalForCompany(appState.activeCompany);
  const summary = summarizeIntegratedJournal(journal);
  Object.keys(INTEGRATED_JOURNAL_CATEGORIES).forEach((categoryId) => {
    const count = $(`[data-integrated-summary-count="${categoryId}"]`);
    const total = $(`[data-integrated-summary-amount="${categoryId}"]`);
    if (count) count.textContent = String(summary[categoryId].count);
    if (total) total.innerHTML = `${numberLabel(summary[categoryId].amount)} <em>FCFA</em>`;
  });
  const search = ($('#integratedSearch')?.value || '').trim().toLowerCase();
  const selectedCategory = $('#integratedCategoryFilter')?.value || 'ALL';
  const entries = journal.entries.filter((entry) => {
    const categoryId = entry.integratedCategory || classifyIntegratedEntry(entry);
    const matchesCategory = selectedCategory === 'ALL' || categoryId === selectedCategory;
    const matchesSearch = !search || `${entry.reference} ${entry.label} ${categoryId} ${entry.journalId}`.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
  rows.innerHTML = entries.map((entry) => {
    const categoryId = entry.integratedCategory || classifyIntegratedEntry(entry);
    const category = INTEGRATED_JOURNAL_CATEGORIES[categoryId];
    const [label, statusClass] = statusLabel(entry.status);
    const journalClass = entry.journalId === 'AC' ? 'journal-badge-blue' : entry.journalId === 'BQ' ? 'journal-badge-teal' : entry.journalId === 'OD' ? 'journal-badge-amber' : '';
    return `<tr><td><b>${escapeHtml(entry.reference || '—')}</b></td><td>${escapeHtml(displayDate(entry.date))}</td><td><span class="journal-badge ${journalClass}">${escapeHtml(entry.journalId || 'OD')}</span></td><td><span class="integrated-category ${categoryClass(categoryId)}">${escapeHtml(category.shortLabel)}</span></td><td><span class="cell-title">${escapeHtml(entry.label)}</span><small class="cell-subtitle">${escapeHtml(entry.source || 'Imputation synchronisée')}</small></td><td class="align-right">${numberLabel(entry.debit || entry.amount || 0)}</td><td class="align-right">${numberLabel(entry.credit || entry.amount || 0)}</td><td><span class="status ${statusClass}">${label}</span></td></tr>`;
  }).join('');
  if (!entries.length) rows.innerHTML = '<tr><td colspan="8" class="dossier-empty">Aucune écriture dans cette catégorie.</td></tr>';
  const subtitle = $('#integratedJournalSubtitle');
  if (subtitle) subtitle.textContent = `${journal.entries.length} écritures · ${Object.values(summary).filter((item) => item.count > 0).length - (summary.GENERAL.count ? 1 : 0)} catégories automatiques · Débit et crédit équilibrés`;
  const footer = $('#integratedJournalFooter');
  if (footer) footer.textContent = `${entries.length} écriture${entries.length > 1 ? 's' : ''} affichée${entries.length > 1 ? 's' : ''} · mise à jour après chaque imputation.`;
}

function numberLabel(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('fr-FR').format(number) : '—';
}

const ENTRY_TAB_CONFIG = {
  free: { title: 'Écriture libre', category: 'service-sale', journal: 'OD' },
  sale: { title: 'Vente', category: 'service-sale', journal: 'VE' },
  purchase: { title: 'Achat', category: 'goods-purchase', journal: 'AC' },
  subscription: { title: 'Abonnement', category: 'subscription', journal: 'OD' },
  receipt: { title: 'Encaissement', category: 'other', journal: 'BQ' },
  payment: { title: 'Décaissement', category: 'other', journal: 'BQ' },
  transfer: { title: 'Transfert', category: 'other', journal: 'BQ' },
  asset: { title: 'Immobilisation', category: 'other', journal: 'OD' }
};

function entryOperation() {
  return {
    category: $('#entryCategory')?.value || 'other',
    total: $('#entryAmount')?.value || '',
    thirdPartyName: $('#entryThirdParty')?.value || '',
    label: $('#entryLabel')?.value || ''
  };
}

function renderLivePosting() {
  const rows = $('#livePostingRows');
  const status = $('#entryBalanceStatus');
  const statusMessage = $('#entryBalanceMessage');
  const totalNode = $('#entryLiveTotal');
  const reasonNode = $('#entrySuggestionReason');
  const titleNode = $('#entrySuggestionTitle');
  if (!rows || !status || !statusMessage || !totalNode) return;
  const operation = entryOperation();
  let suggestion;
  try { suggestion = suggestPosting(operation); } catch {
    suggestion = { lines: [], reason: 'Saisissez un montant valide pour obtenir une proposition.' };
  }
  const parsedTotal = Number(String(operation.total).replace(/\s/g, '').replace(',', '.'));
  const hasTotal = Number.isFinite(parsedTotal) && parsedTotal > 0;
  totalNode.innerHTML = `${hasTotal ? numberLabel(parsedTotal) : '—'} <small>FCFA</small>`;
  if (!suggestion.lines?.length) {
    rows.innerHTML = '<div class="posting-empty"><span>?</span><p>Complétez le montant et choisissez une catégorie pour obtenir une proposition d’imputation.</p></div>';
    status.className = 'entry-balance entry-balance-warning';
    status.querySelector('.balance-symbol').textContent = '!';
    status.querySelector('strong').textContent = 'Imputation à compléter';
    statusMessage.textContent = hasTotal ? 'Aucune règle automatique pour cette opération.' : 'Le montant est nécessaire pour contrôler l’écriture.';
    if (titleNode) titleNode.textContent = 'En attente de catégorie';
    if (reasonNode) reasonNode.textContent = suggestion.reason || 'Choisissez une catégorie d’opération.';
    return;
  }
  rows.innerHTML = suggestion.lines.map((line) => `<div class="live-posting-row"><span><b>${escapeHtml(line.accountId)}</b><small>${escapeHtml(line.label)}</small></span><strong>${line.debit > 0 ? numberLabel(line.debit) : numberLabel(line.credit)}</strong><em class="${line.debit > 0 ? '' : 'credit'}">${line.debit > 0 ? 'D' : 'C'}</em></div>`).join('');
  status.className = 'entry-balance';
  status.querySelector('.balance-symbol').textContent = '✓';
  status.querySelector('strong').textContent = 'Écriture équilibrée';
  statusMessage.textContent = 'Débit et crédit correspondent au montant saisi.';
  if (titleNode) titleNode.textContent = `Suggestion · ${Math.round(suggestion.confidence * 100)} %`;
  if (reasonNode) reasonNode.textContent = suggestion.reason;
}

function selectEntryTab(tab) {
  const config = ENTRY_TAB_CONFIG[tab.dataset.entryTab] || ENTRY_TAB_CONFIG.free;
  $$('.entry-tab').forEach((item) => item.classList.toggle('is-active', item === tab));
  const title = $('#entryTypeTitle');
  if (title) title.textContent = config.title;
  const category = $('#entryCategory');
  if (category) category.value = config.category;
  const journal = $('#entryJournal');
  if (journal) journal.value = config.journal;
  renderLivePosting();
}

function clearEntry(notify = true) {
  const form = $('#entryForm');
  if (!form) return;
  form.reset();
  $('#entryLabel').value = '';
  $('#entryReference').value = '';
  $('#entryAmount').value = '';
  renderLivePosting();
  if (notify) showToast('La saisie a été effacée.');
}

function insertEntry() {
  const operation = entryOperation();
  let suggestion;
  try { suggestion = suggestPosting(operation); } catch (error) { showToast(error.message); return; }
  if (!suggestion.lines?.length) { showToast('Complétez l’imputation avant d’insérer l’écriture.'); return; }
  try {
    const entry = createJournalEntry({ companyId: appState.activeCompany, journalId: $('#entryJournal').value, date: $('#entryDate').value, reference: $('#entryReference').value, label: $('#entryLabel').value, lines: suggestion.lines }, { activeCompanyId: appState.activeCompany });
    const total = suggestion.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const syncedEntry = syncIntegratedJournal(integratedJournalForCompany(appState.activeCompany), { ...entry, amount: total, debit: total, credit: total, source: 'Saisie et insertion', integrationCategory: operation.category }).entries[0];
    appState.integratedEntries.unshift(syncedEntry);
    renderIntegratedJournal();
    const row = `<tr><td>${escapeHtml(entry.date.split('-').reverse().join('/'))}</td><td><span class="journal-badge">${escapeHtml(entry.journalId)}</span> Saisie</td><td><span class="cell-title">${escapeHtml(entry.label)}</span><small class="cell-subtitle">Insertion en attente de validation</small></td><td class="align-right">${numberLabel(total)}</td><td>${escapeHtml(suggestion.lines.map((line) => line.accountId).join(' / '))}</td><td><span class="status status-purple">À contrôler</span></td></tr>`;
    $('#entryRows')?.insertAdjacentHTML('afterbegin', row);
    const count = $('#entryQueueCount');
    if (count) count.textContent = String(Number(count.textContent || 0) + 1);
    showToast('Écriture insérée dans le brouillard. Contrôle requis avant validation.');
    clearEntry(false);
  } catch (error) { showToast(error.message); }
}

function renderFichierGroup(groupId = 'dossiers') {
  const group = FICHIER_GROUPS[groupId] || FICHIER_GROUPS.dossiers;
  const label = $('#fichierSelectedLabel');
  const description = $('#fichierSelectedDescription');
  const actionList = $('#fichierActionList');
  if (label) label.textContent = group.label;
  if (description) description.textContent = group.description;
  if (actionList) {
    actionList.innerHTML = group.actions.map((item) => `<button class="fichier-action" type="button" data-fichier-action="${escapeHtml(item.action)}"><span class="fichier-action-icon fichier-action-${escapeHtml(item.tone)}">${escapeHtml(item.symbol)}</span><span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.description)}</small></span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>`).join('');
  }
}

function handleFichierAction(action) {
  if (action === 'companies') openView('companies');
  if (action === 'new-dossier') openModal('companyModal');
  if (action === 'backup') showToast('Sauvegarde du dossier préparée localement.');
  if (action === 'restore') showToast('Choisissez une sauvegarde FEC à restaurer.');
  if (action === 'import' || action === 'balance') { openView('imports'); setImportMode('import'); }
  if (action === 'export') { openView('imports'); setImportMode('export'); }
  if (action === 'help') showToast('Le tutoriel d’utilisation sera ajouté dans l’étape dédiée.');
  if (action === 'placeholder') showToast('Cette opération sera paramétrée dans l’étape dédiée.');
  if (action === 'close') showLogin();
}

function renderConfigurationGroup(groupId = 'societe') {
  const group = CONFIG_GROUPS[groupId] || CONFIG_GROUPS.societe;
  const label = $('#configurationSelectedLabel');
  const description = $('#configurationSelectedDescription');
  const actionList = $('#configurationActionList');
  if (label) label.textContent = group.label;
  if (description) description.textContent = group.description;
  if (actionList) {
    actionList.innerHTML = group.actions.map((item) => `<button class="fichier-action" type="button" data-configuration-action="${escapeHtml(item.action)}"><span class="fichier-action-icon fichier-action-${escapeHtml(item.tone)}">${escapeHtml(item.symbol)}</span><span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.description)}</small></span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>`).join('');
  }
}

function handleConfigurationAction(action) {
  if (action === 'companies') openView('companies');
  if (action === 'sales') openView('sales');
  if (action === 'purchases') openView('purchases');
  if (action === 'journal') openView('journal');
  if (action === 'assets') openView('assets');
  if (action === 'treasury') openView('treasury');
  if (action === 'imports') { openView('imports'); setImportMode('import'); }
  if (action === 'placeholder') showToast('Cette configuration sera paramétrée dans l’étape dédiée.');
}

function selectMenuTab(tab) {
  const parentView = tab.closest('.view');
  if (!parentView) return;
  $$('.menu-tab', parentView).forEach((item) => {
    const selected = item === tab;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-selected', String(selected));
  });
  if (parentView.dataset.viewPanel === 'fichier') {
    const groupId = tab.dataset.menuGroup || 'dossiers';
    renderFichierGroup(groupId);
    showToast(`Rubrique « ${FICHIER_GROUPS[groupId]?.label || groupId} » sélectionnée.`);
    return;
  }
  const groupId = tab.dataset.menuGroup || 'societe';
  renderConfigurationGroup(groupId);
  showToast(`Rubrique « ${CONFIG_GROUPS[groupId]?.label || groupId} » sélectionnée.`);
}

function bindEvents() {
  $('#authForm')?.addEventListener('submit', authenticate);
  $('#entryForm')?.addEventListener('input', renderLivePosting);
  $('#entryForm')?.addEventListener('change', renderLivePosting);
  $('#dossierSearch')?.addEventListener('input', (event) => renderDossiers(event.target.value));
  $('#integratedSearch')?.addEventListener('input', renderIntegratedJournal);
  $('#integratedCategoryFilter')?.addEventListener('change', renderIntegratedJournal);
  $('#dossiersScreen')?.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('[data-dossier-id]')) {
      event.preventDefault();
      selectDossier(event.target.closest('[data-dossier-id]').dataset.dossierId);
    }
  });

  document.addEventListener('click', (event) => {
    const dossierRow = event.target.closest('[data-dossier-id]');
    if (dossierRow && !event.target.closest('button')) {
      selectDossier(dossierRow.dataset.dossierId);
      return;
    }

    const navItem = event.target.closest('.nav-item[data-view]');
    if (navItem) { openView(navItem.dataset.view); return; }

    const entryTab = event.target.closest('.entry-tab[data-entry-tab]');
    if (entryTab) { selectEntryTab(entryTab); return; }

    const menuTab = event.target.closest('.menu-tab');
    if (menuTab) { selectMenuTab(menuTab); return; }

    const fichierAction = event.target.closest('[data-fichier-action]');
    if (fichierAction) { handleFichierAction(fichierAction.dataset.fichierAction); return; }

    const configurationAction = event.target.closest('[data-configuration-action]');
    if (configurationAction) { handleConfigurationAction(configurationAction.dataset.configurationAction); return; }

    const companyOption = event.target.closest('[data-company-option]');
    if (companyOption) { setActiveCompany(companyOption.dataset.companyOption); return; }

    const companySwitch = event.target.closest('[data-company-switch]');
    if (companySwitch) { setActiveCompany(companySwitch.dataset.companySwitch); openView('dashboard'); return; }

    const moduleOpen = event.target.closest('[data-module-open]');
    if (moduleOpen) { openModule(moduleOpen.dataset.moduleOpen); return; }

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
    if (action === 'focus-entry-amount') { openView('entry'); window.setTimeout(() => $('#entryAmount')?.focus(), 50); }
    if (action === 'clear-entry') clearEntry();
    if (action === 'insert-entry') insertEntry();
    if (action === 'sync-integrated') synchronizeIntegratedJournal();
    if (action === 'authenticate') showDossiers();
    if (action === 'back-to-dossiers') backToDossiers();
    if (action === 'back-to-modules') backToModules();
    if (action === 'dossier-select') selectDossier(actionTarget.dataset.dossierId);
    if (action === 'dossier-open') openSelectedDossier();
    if (action === 'dossier-refresh') { renderDossiers(); selectDossier(appState.selectedDossier); showToast('La liste des dossiers est à jour.'); }
    if (action === 'dossier-duplicate') duplicateSelectedDossier();
    if (action === 'dossier-delete') archiveSelectedDossier();
    if (action === 'dossier-backup') showToast('Sauvegarde du dossier préparée localement.');
    if (action === 'dossier-restore') showToast('Choisissez une sauvegarde FEC à restaurer.');
    if (action === 'logout') showLogin();
    if (action === 'toggle-password') {
      const password = actionTarget.closest('.password-field')?.querySelector('input');
      if (password) { password.type = password.type === 'password' ? 'text' : 'password'; actionTarget.textContent = password.type === 'password' ? 'Voir' : 'Masquer'; }
    }
    if (action === 'forgot-password') showToast('La récupération du mot de passe sera ajoutée avec l’authentification réelle.');
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
    if (action === 'menu-placeholder') showToast('Ce sous-menu sera paramétré dans l’étape dédiée.');
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
  $('#companyForm')?.addEventListener('input', updateDossierPreview);
  $('#companyForm')?.addEventListener('change', (event) => {
    if (event.target.id === 'legalForm') toggleOtherLegalForm();
    updateDossierPreview();
  });
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
  toggleOtherLegalForm();
  updateDossierPreview();
  renderFichierGroup('dossiers');
  renderConfigurationGroup('societe');
  renderLivePosting();
});
