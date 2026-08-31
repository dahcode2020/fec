import { assertPermission, accountClass, addAccountToPlan, addJournalToSetup, addThirdPartyToDirectory, applyPaymentAllocations, buildFinancialStatements, buildTrialBalance, calculateDocumentTotals, calculateFiscalResult, createBeninFiscalSettings, BENIN_FISCAL_ACTIVITY_PROFILES, BENIN_CGI_RULES_BY_YEAR, calculateOpeningBalances, calculatePeriodResult, calculateStraightLinePlan, canDeleteCorrectionCandidate, deleteCorrectionCandidate, centralizeEntries, closePeriod, classifyIntegratedEntry, createAutomaticJournalEntry, createBankMovement, createCorrectionWindow, createCsrSetup, createFinancialSnapshot, createIntegratedJournal, createInvoiceDocument, createJournalEntry, createLocalWorkspaceStore, createMonthlyPeriods, createPayment, createFecAnnualDemoEntries, createZipArchive, createUser, createMembership, decodeFecText, extractZipArchive, encodeFecText, evaluatePeriodClosure, roleLabel, USER_PERMISSIONS, USER_ROLE_LABELS, USER_ROLES, exportAccountPlanTxt, exportBalanceTxt, exportFecControlReportTxt, exportFecNoticeTxt, exportFecTxt, fecFieldDefinitions, finalizeFiscalYear, depreciationEntry, documentToJournalLines, exerciseYear, importAccountPlanRows, INTEGRATED_JOURNAL_CATEGORIES, makeDossierCode, MODULE_DEFINITIONS, normalizeAccountNumber, parseDelimited, PAYMENT_TYPES, paymentToJournalLines, prepareFecExport, reconcileBankMovement, registerCorrectionCandidate, suggestPosting, summarizeIntegratedJournal, syncIntegratedJournal, transitionOperation, updateAccountInPlan, updateJournalInSetup, updateThirdPartyInDirectory, validateFecTxt, validateJournalDefinition, validateJournalEntry, OPERATION_STATES, THIRD_PARTY_TYPES } from './core.js';
import { createHttpSyncRemote } from './sync-client.js';

const appState = {
  authenticated: false,
  currentUserId: 'claire-dossou',
  users: [
    createUser({ id: 'claire-dossou', name: 'Claire Dossou', email: 'claire@acacia.bj' }),
    createUser({ id: 'marc-kponton', name: 'Marc Kponton', email: 'marc@acacia.bj' }),
    createUser({ id: 'awa-operatrice', name: 'Awa Hounkpe', email: 'awa@acacia.bj' })
  ],
  memberships: [
    createMembership({ userId: 'claire-dossou', companyId: 'acacia', moduleId: 'CSR', role: 'ADMIN' }),
    createMembership({ userId: 'claire-dossou', companyId: 'noria', moduleId: 'GCSF', role: 'ADMIN' }),
    createMembership({ userId: 'marc-kponton', companyId: 'acacia', moduleId: 'CSR', role: 'CONTROLLER' }),
    createMembership({ userId: 'awa-operatrice', companyId: 'acacia', moduleId: 'CSR', role: 'OPERATOR' })
  ],
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
  accountingSetups: {
    acacia: createCsrSetup({ companyId: 'acacia', regime: 'NORMAL' }),
    noria: createCsrSetup({ companyId: 'noria', regime: 'SMT' })
  },
  invoices: [
    { id: 'invoice-demo', companyId: 'acacia', type: 'SALE', thirdPartyId: 'tp-awa', thirdPartyName: 'Awa Concept', thirdPartyAccountId: '411101', date: '2025-06-10', reference: 'FAC-2025-018', dueDate: '2025-07-10', lines: [{ description: 'Accompagnement administratif', quantity: 1, unitPrice: 250000, total: 250000 }], taxRate: 0, totalExclTax: 250000, tax: 0, totalInclTax: 250000, paidAmount: 0, outstanding: 250000, allocations: [], status: 'POSTED' }
  ],
  purchaseBills: [
    { id: 'purchase-demo', companyId: 'acacia', type: 'PURCHASE', thirdPartyId: 'tp-cotonou-bureau', thirdPartyName: 'Cotonou Bureau', thirdPartyAccountId: '401101', date: '2025-06-12', reference: 'FA-0154', dueDate: '2025-07-12', lines: [{ description: 'Fournitures de bureau', quantity: 1, unitPrice: 38500, total: 38500 }], taxRate: 0, totalExclTax: 38500, tax: 0, totalInclTax: 38500, paidAmount: 0, outstanding: 38500, allocations: [], status: 'POSTED' }
  ],
  payments: [],
  fiscalSettings: {
    acacia: { years: { '2025': createBeninFiscalSettings({ fiscalYear: '2025', codeVersion: '2026' }) } },
    noria: { years: { '2025': createBeninFiscalSettings({ fiscalYear: '2025', codeVersion: '2026' }) } }
  },
  periods: {
    acacia: createMonthlyPeriods(2025),
    noria: createMonthlyPeriods(2025)
  },
  activePeriodIds: {
    acacia: '2025-06',
    noria: '2025-06'
  },
  fiscalYears: {
    acacia: { id: '2025', label: 'Exercice 2025', status: 'OPEN' },
    noria: { id: '2025', label: 'Exercice 2025', status: 'OPEN' }
  },
  fiscalYearCatalog: {
    acacia: [{ id: '2025', label: 'Exercice 2025', status: 'OPEN' }],
    noria: [{ id: '2025', label: 'Exercice 2025', status: 'OPEN' }]
  },
  fiscalYearPeriods: {
    acacia: { '2025': createMonthlyPeriods(2025) },
    noria: { '2025': createMonthlyPeriods(2025) }
  },
  activePeriodIdsByYear: {
    acacia: { '2025': '2025-06' },
    noria: { '2025': '2025-06' }
  },
  periodClosures: [],
  fiscalYearFinalizations: [],
  openingRuns: [],
  financialSnapshots: [],
  statementMode: 'control',
  syncStatus: { state: 'LOCAL', pending: 0, conflicts: 0, lastSyncAt: null, forcedOffline: false, transport: 'NOT_CONNECTED', deviceId: null, cursor: '0', entityHashes: {}, appliedEventIds: [], lastError: null },
  syncOutbox: [],
  syncConflicts: [],
  exportDraft: null,
  exportHistory: [],
  fecDraft: null,
  fecHistory: [],
  fecArchives: [],
  pendingFiscalYears: {},
  pendingPeriods: {},
  bankMovements: [
    { id: 'bank-demo-1', companyId: 'acacia', date: '2025-06-16', reference: 'BQ-0012', label: 'Encaissement client Awa Concept', debit: 0, credit: 250000, amount: 250000, status: 'RECONCILED', matchedEntryId: 'sale-1', currency: 'XOF' },
    { id: 'bank-demo-2', companyId: 'acacia', date: '2025-06-15', reference: 'BQ-0011', label: 'Paiement Cotonou Bureau', debit: 38500, credit: 0, amount: 38500, status: 'POINTED', matchedEntryId: 'purchase-1', currency: 'XOF' },
    { id: 'bank-demo-3', companyId: 'acacia', date: '2025-06-12', reference: 'BQ-0010', label: 'Frais de tenue de compte', debit: 4800, credit: 0, amount: 4800, status: 'UNMATCHED', matchedEntryId: null, currency: 'XOF' }
  ],
  thirdParties: {
    acacia: [
      { id: 'tp-awa', code: 'AWACONCEPT', name: 'Awa Concept', type: THIRD_PARTY_TYPES.CLIENT, collectiveAccountId: '4111', auxiliaryAccountId: '411101', ifu: '3201900045612', address: 'Cotonou, Littoral', phone: '+229 97 00 00 01', paymentTerms: '30 jours', currency: 'XOF', active: true },
      { id: 'tp-benin-services', code: 'BENINSERVICES', name: 'Bénin Services', type: THIRD_PARTY_TYPES.CLIENT, collectiveAccountId: '4111', auxiliaryAccountId: '411102', ifu: '3201800037211', address: 'Cotonou, Akpakpa', phone: '+229 96 00 00 02', paymentTerms: 'Comptant', currency: 'XOF', active: true },
      { id: 'tp-cotonou-bureau', code: 'COTONOUBUREAU', name: 'Cotonou Bureau', type: THIRD_PARTY_TYPES.SUPPLIER, collectiveAccountId: '4011', auxiliaryAccountId: '401101', ifu: '3202100065413', address: 'Cotonou, Haie Vive', phone: '+229 95 00 00 03', paymentTerms: '30 jours', currency: 'XOF', active: true },
      { id: 'tp-fournisseur-internet', code: 'FOURNISSEURINTERNET', name: 'Fournisseur internet', type: THIRD_PARTY_TYPES.SUPPLIER, collectiveAccountId: '4011', auxiliaryAccountId: '401102', ifu: '', address: 'Cotonou', phone: '', paymentTerms: 'Mensuel', currency: 'XOF', active: true }
    ],
    noria: [
      { id: 'tp-noria-client', code: 'CLIENTNORIA', name: 'Client Noria', type: THIRD_PARTY_TYPES.CLIENT, collectiveAccountId: '4111', auxiliaryAccountId: '411101', ifu: '', address: 'Cotonou', phone: '', paymentTerms: 'Comptant', currency: 'XOF', active: true }
    ]
  },
  automaticSchedules: [
    { id: 'sub-internet-acacia', companyId: 'acacia', label: 'Abonnement internet', supplierName: 'Fournisseur internet', amount: 12000, expenseAccount: '6281', supplierAccount: '4011', periodicity: 'Mensuelle', active: true },
    { id: 'sub-banque-acacia', companyId: 'acacia', label: 'Abonnement logiciel', supplierName: 'Éditeur logiciel', amount: 18500, expenseAccount: '6288', supplierAccount: '4011', periodicity: 'Mensuelle', active: true }
  ],
  automaticRuns: [],
  dossiers: [
    { id: 'acacia-25-csr', companyId: 'acacia', dossier: 'ACACIA-25', moduleId: 'CSR', period: '01/01/2025 - 31/12/2025', exerciseYear: '2025', sessions: 1, status: 'Actif', statusClass: 'status-green' },
    { id: 'acacia-25-gcsf', companyId: 'acacia', dossier: 'ACACIA-25', moduleId: 'GCSF', period: '01/01/2025 - 31/12/2025', exerciseYear: '2025', sessions: 0, status: 'Disponible', statusClass: 'status-blue' },
    { id: 'noria-25-gcsf', companyId: 'noria', dossier: 'NORIA-25', moduleId: 'GCSF', period: '01/01/2025 - 31/12/2025', exerciseYear: '2025', sessions: 0, status: 'Disponible', statusClass: 'status-blue' }
  ],
  integratedJournal: createIntegratedJournal({ id: 'lj-acacia-2025', companyId: 'acacia', fiscalYear: '2025' }),
  integratedEntries: [
    { id: 'sale-1', companyId: 'acacia', reference: 'VE-0008', date: '2025-06-16', journalId: 'VE', label: 'Awa Concept — FAC-2025-018', debit: 250000, credit: 250000, amount: 250000, lines: [{ accountId: '4111', label: 'Awa Concept', debit: 250000, credit: 0 }, { accountId: '7061', label: 'Services vendus', debit: 0, credit: 250000 }], integrationCategory: 'GENERAL', status: 'TO_REVIEW', source: 'Saisie et insertion' },
    { id: 'purchase-1', companyId: 'acacia', reference: 'AC-0007', date: '2025-06-15', journalId: 'AC', label: 'Cotonou Bureau — FA-0154', debit: 38500, credit: 38500, amount: 38500, lines: [{ accountId: '6047', label: 'Fournitures de bureau', debit: 38500, credit: 0 }, { accountId: '4011', label: 'Cotonou Bureau', debit: 0, credit: 38500 }], integrationCategory: 'GENERAL', status: 'VALIDATED', source: 'Saisie et insertion' },
    { id: 'auto-amort-acacia-2025-06', companyId: 'acacia', reference: 'AM-0003', date: '2025-06-30', journalId: 'AM', label: 'Dotation amortissement — juin', debit: 23667, credit: 23667, amount: 23667, integrationCategory: 'AMORTISSEMENTS', status: 'TO_REVIEW', source: 'Amortissement automatique' },
    { id: 'auto-centralization-acacia-2025-06', companyId: 'acacia', reference: 'CT-0001', date: '2025-06-30', journalId: 'CT', label: 'Centralisation des journaux — juin', debit: 125000, credit: 125000, amount: 125000, integrationCategory: 'CENTRALISATION', status: 'VALIDATED', source: 'Centralisation' },
    { id: 'auto-sub-internet-acacia-2025-06', companyId: 'acacia', reference: 'AB-0001', date: '2025-06-01', journalId: 'AB', label: 'Abonnement internet — juin', debit: 12000, credit: 12000, amount: 12000, integrationCategory: 'ABONNEMENTS', status: 'VALIDATED', source: 'Abonnement périodique' },
    { id: 'auto-result-acacia-2025-06', companyId: 'acacia', reference: 'RP-0001', date: '2025-06-30', journalId: 'RP', label: 'Résultat de la période — juin', debit: 548000, credit: 548000, amount: 548000, integrationCategory: 'RESULTAT', status: 'TO_REVIEW', source: 'Résultat de la période' }
  ],
  correctionWindows: {
    acacia: createCorrectionWindow({ id: 'correction-acacia-25', dossierId: 'ACACIA-25', companyId: 'acacia', userId: 'claire-dossou', periodId: '2025-06' })
  },
  recentEntries: [
    { id: 'queue-1', companyId: 'acacia', dossierId: 'acacia-25', reference: 'SAI-0003', date: '2025-06-16', journalId: 'OD', label: 'Accompagnement administratif', amount: 250000, accountIds: ['4111', '7061'], status: OPERATION_STATES.TO_REVIEW },
    { id: 'queue-2', companyId: 'acacia', dossierId: 'acacia-25', reference: 'SAI-0002', date: '2025-06-15', journalId: 'AC', label: 'Fournitures de bureau', amount: 38500, accountIds: ['6047', '4011'], status: OPERATION_STATES.VALIDATED },
    { id: 'queue-3', companyId: 'acacia', dossierId: 'acacia-25', reference: 'SAI-0001', date: '2025-06-12', journalId: 'BQ', label: 'Frais de tenue de compte', amount: 4800, accountIds: ['6318', '5211'], status: OPERATION_STATES.VALIDATED }
  ],
  auditEvents: []
};

const appStore = createLocalWorkspaceStore({ key: 'fec.csr.vertical-slice.v1' });
const persistedStateKeys = ['currentUserId', 'users', 'memberships', 'activeCompany', 'selectedDossier', 'companies', 'accountingSetups', 'thirdParties', 'invoices', 'purchaseBills', 'payments', 'fiscalSettings', 'periods', 'activePeriodIds', 'bankMovements', 'automaticSchedules', 'automaticRuns', 'dossiers', 'fiscalYears', 'fiscalYearCatalog', 'fiscalYearPeriods', 'activePeriodIdsByYear', 'periodClosures', 'fiscalYearFinalizations', 'openingRuns', 'financialSnapshots', 'statementMode', 'syncStatus', 'syncOutbox', 'syncConflicts', 'exportDraft', 'exportHistory', 'fecDraft', 'fecHistory', 'fecArchives', 'pendingFiscalYears', 'pendingPeriods', 'integratedEntries', 'correctionWindows', 'recentEntries', 'auditEvents'];

function fiscalYearIdForCompany(companyId = appState.activeCompany) {
  return String(appState.fiscalYears?.[companyId]?.id || appState.companies?.[companyId]?.exerciseStart?.slice(0, 4) || '2025');
}

function ensureFiscalSettingsForCompany(companyId, year = fiscalYearIdForCompany(companyId)) {
  if (!appState.fiscalSettings || typeof appState.fiscalSettings !== 'object' || Array.isArray(appState.fiscalSettings)) appState.fiscalSettings = {};
  const stored = appState.fiscalSettings[companyId];
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) appState.fiscalSettings[companyId] = { years: {} };
  const settingsContainer = appState.fiscalSettings[companyId];
  if (!settingsContainer.years || typeof settingsContainer.years !== 'object' || Array.isArray(settingsContainer.years)) {
    const legacy = { ...settingsContainer };
    delete legacy.years;
    appState.fiscalSettings[companyId] = { years: { [String(year)]: { ...createBeninFiscalSettings({ fiscalYear: year, codeVersion: legacy.codeVersion || '2026' }), ...legacy } } };
  }
  const years = appState.fiscalSettings[companyId].years;
  const yearId = String(year);
  const existing = years[yearId] || {};
  const defaults = createBeninFiscalSettings({ fiscalYear: yearId, codeVersion: existing.codeVersion || '2026' });
  years[yearId] = {
    ...defaults,
    ...existing,
    fiscalYear: yearId,
    excludedProducts: { ...defaults.excludedProducts, ...(existing.excludedProducts || {}) }
  };
  return years[yearId];
}

function hydrateAppState() {
  const saved = appStore.load();
  if (!saved || saved.version !== 1) return;
  if (!saved.companies || typeof saved.companies !== 'object' || Array.isArray(saved.companies)) return;
  persistedStateKeys.forEach((key) => {
    if (saved[key] !== undefined) appState[key] = saved[key];
  });
  if (!appState.companies[appState.activeCompany]) appState.activeCompany = Object.keys(appState.companies)[0] || 'acacia';
  if (!appState.fiscalYearCatalog || typeof appState.fiscalYearCatalog !== 'object' || Array.isArray(appState.fiscalYearCatalog)) appState.fiscalYearCatalog = {};
  if (!appState.fiscalYearPeriods || typeof appState.fiscalYearPeriods !== 'object' || Array.isArray(appState.fiscalYearPeriods)) appState.fiscalYearPeriods = {};
  if (!appState.activePeriodIdsByYear || typeof appState.activePeriodIdsByYear !== 'object' || Array.isArray(appState.activePeriodIdsByYear)) appState.activePeriodIdsByYear = {};
  Object.keys(appState.companies).forEach((companyId) => {
    const year = String(appState.fiscalYears?.[companyId]?.id || '2025');
    if (!Array.isArray(appState.fiscalYearCatalog[companyId])) appState.fiscalYearCatalog[companyId] = [{ id: year, label: `Exercice ${year}`, status: appState.fiscalYears?.[companyId]?.status || 'OPEN' }];
    if (!appState.fiscalYearCatalog[companyId].some((item) => String(item.id) === year)) appState.fiscalYearCatalog[companyId].push({ id: year, label: `Exercice ${year}`, status: appState.fiscalYears?.[companyId]?.status || 'OPEN' });
    if (!appState.fiscalYearPeriods[companyId] || typeof appState.fiscalYearPeriods[companyId] !== 'object') appState.fiscalYearPeriods[companyId] = {};
    if (!Array.isArray(appState.fiscalYearPeriods[companyId][year])) appState.fiscalYearPeriods[companyId][year] = appState.periods?.[companyId] || createMonthlyPeriods(Number(year));
    if (!appState.activePeriodIdsByYear[companyId] || typeof appState.activePeriodIdsByYear[companyId] !== 'object') appState.activePeriodIdsByYear[companyId] = {};
    appState.activePeriodIdsByYear[companyId][year] = appState.activePeriodIdsByYear[companyId][year] || appState.activePeriodIds?.[companyId] || `${year}-01`;
  });
  Object.keys(appState.companies).forEach((companyId) => {
    const defaults = createCsrSetup({ companyId });
    const existing = appState.accountingSetups?.[companyId];
    if (!existing) appState.accountingSetups[companyId] = defaults;
    else {
      existing.accounts = Array.from(new Map([...defaults.accounts, ...(existing.accounts || [])].map((account) => [account.id, account])).values());
      const defaultJournals = new Map(defaults.journals.map((journal) => [journal.id, journal]));
      existing.journals = (existing.journals?.length ? existing.journals : defaults.journals).map((journal) => ({ ...(defaultJournals.get(journal.id) || {}), ...journal, prefix: journal.prefix || `${journal.id}-`, nextNumber: journal.nextNumber || 1, active: journal.active !== false }));
    }
  });
  if (!appState.correctionWindows) appState.correctionWindows = {};
  if (!appState.recentEntries) appState.recentEntries = [];
  if (!appState.automaticSchedules) appState.automaticSchedules = [];
  if (!appState.automaticRuns) appState.automaticRuns = [];
  if (!appState.payments) appState.payments = [];
  if (!appState.fiscalSettings) appState.fiscalSettings = {};
  Object.keys(appState.companies).forEach((companyId) => ensureFiscalSettingsForCompany(companyId));
  if (!appState.periods) appState.periods = {};
  if (!appState.activePeriodIds) appState.activePeriodIds = {};
  Object.keys(appState.companies).forEach((companyId) => {
    const existingPeriods = appState.periods[companyId] || [];
    const defaults = createMonthlyPeriods(Number(appState.fiscalYears?.[companyId]?.id || 2025));
    appState.periods[companyId] = defaults.map((period) => ({ ...period, ...(existingPeriods.find((item) => item.id === period.id) || {}) }));
    const year = String(appState.fiscalYears?.[companyId]?.id || 2025);
    appState.fiscalYearPeriods[companyId][year] = appState.periods[companyId];
    if (!appState.activePeriodIds[companyId]) appState.activePeriodIds[companyId] = appState.activePeriodIdsByYear[companyId][year] || appState.periods[companyId].find((period) => period.id === `${year}-06`)?.id || appState.periods[companyId][0].id;
    appState.activePeriodIdsByYear[companyId][year] = appState.activePeriodIds[companyId];
  });
  if (!appState.periodClosures) appState.periodClosures = [];
  if (!appState.fiscalYears) appState.fiscalYears = {};
  Object.keys(appState.companies).forEach((companyId) => { if (!appState.fiscalYears[companyId]) appState.fiscalYears[companyId] = { id: '2025', label: 'Exercice 2025', status: 'OPEN' }; });
  if (!appState.fiscalYearFinalizations) appState.fiscalYearFinalizations = [];
  if (!appState.openingRuns) appState.openingRuns = [];
  if (!Array.isArray(appState.financialSnapshots)) appState.financialSnapshots = [];
  if (!appState.statementMode) appState.statementMode = 'control';
  if (!Array.isArray(appState.exportHistory)) appState.exportHistory = [];
  if (!Array.isArray(appState.fecHistory)) appState.fecHistory = [];
  if (!appState.syncStatus || typeof appState.syncStatus !== 'object' || Array.isArray(appState.syncStatus)) appState.syncStatus = { state: 'LOCAL', pending: 0, conflicts: 0, lastSyncAt: null, forcedOffline: false, transport: 'NOT_CONNECTED', deviceId: null, cursor: '0', entityHashes: {}, appliedEventIds: [], lastError: null };
  if (!Array.isArray(appState.syncOutbox)) appState.syncOutbox = [];
  if (!Array.isArray(appState.syncConflicts)) appState.syncConflicts = [];
  appState.syncStatus.entityHashes = appState.syncStatus.entityHashes || {};
  appState.syncStatus.appliedEventIds = Array.isArray(appState.syncStatus.appliedEventIds) ? appState.syncStatus.appliedEventIds : [];
  appState.syncStatus.cursor = String(appState.syncStatus.cursor || '0');
  if (!Array.isArray(appState.fecArchives)) appState.fecArchives = [];
  if (!appState.pendingFiscalYears || typeof appState.pendingFiscalYears !== 'object' || Array.isArray(appState.pendingFiscalYears)) appState.pendingFiscalYears = {};
  if (!appState.pendingPeriods || typeof appState.pendingPeriods !== 'object' || Array.isArray(appState.pendingPeriods)) appState.pendingPeriods = {};
  if (!Array.isArray(appState.integratedEntries)) appState.integratedEntries = [];
  if (!Array.isArray(appState.recentEntries)) appState.recentEntries = [];
  if (!Array.isArray(appState.auditEvents)) appState.auditEvents = [];
  if (!appState.accountingSetups || typeof appState.accountingSetups !== 'object' || Array.isArray(appState.accountingSetups)) appState.accountingSetups = {};
  if (!appState.thirdParties || typeof appState.thirdParties !== 'object' || Array.isArray(appState.thirdParties)) appState.thirdParties = {};
  if (!appState.bankMovements || !Array.isArray(appState.bankMovements)) appState.bankMovements = [];
  if (!Array.isArray(appState.users) || !appState.users.length) appState.users = [createUser({ id: 'claire-dossou', name: 'Claire Dossou', email: 'claire@acacia.bj' })];
  if (!Array.isArray(appState.memberships)) appState.memberships = [];
  if (!appState.currentUserId || !appState.users.some((user) => user.id === appState.currentUserId)) appState.currentUserId = appState.users[0].id;
  if (!appState.memberships.length) appState.memberships.push(createMembership({ userId: appState.currentUserId, companyId: appState.activeCompany, moduleId: 'CSR', role: 'ADMIN' }));
  Object.keys(appState.companies).forEach((companyId) => {
    const hasAnyMember = appState.memberships.some((membership) => membership.companyId === companyId && membership.active !== false);
    if (!hasAnyMember) appState.memberships.push(createMembership({ userId: appState.currentUserId, companyId, moduleId: 'CSR', role: 'ADMIN' }));
  });
}

async function loadFullSyscohadaPlan() {
  try {
    const response = await fetch('data/syscohada-revise.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Plan comptable indisponible');
    const payload = await response.json();
    fullPlanPayload = payload;
    const fullAccounts = payload.accounts.map((account) => ({ ...account, nature: account.nature || 'À définir', active: account.active !== false, isCustom: false }));
    Object.keys(appState.companies).forEach((companyId) => {
      const setup = appState.accountingSetups[companyId] || createCsrSetup({ companyId });
      const customAccounts = (setup.accounts || []).filter((account) => account.isCustom);
      setup.accounts = Array.from(new Map([...fullAccounts, ...customAccounts].map((account) => [account.id, account])).values());
      setup.planVersion = `${payload.metadata.name} · ${payload.metadata.accountCount} comptes`;
      setup.planMetadata = payload.metadata;
      appState.accountingSetups[companyId] = setup;
    });
    persistAppState();
    renderAccountPlan();
  } catch {
    // Le référentiel embarqué de démonstration reste disponible hors connexion.
  }
}

function persistAppState() {
  try {
    const payload = { version: 1 };
    persistedStateKeys.forEach((key) => { payload[key] = appState[key]; });
    appStore.save(payload);
  } catch {
    showToast('Les données ne peuvent pas être sauvegardées localement.');
  }
}

let manualLineOverride = null;
let manualLineDraft = [];
let editingEntryId = null;
let manualLineContext = null;
let fullPlanPayload = null;

const MODULES = {
  CSR: { ...MODULE_DEFINITIONS.CSR, color: 'green' },
  GP: { ...MODULE_DEFINITIONS.GP, color: 'purple' },
  GCSF: { ...MODULE_DEFINITIONS.GCSF, color: 'blue' },
  GC: { ...MODULE_DEFINITIONS.GC, color: 'amber' }
};

const AUTOMATIC_DEFINITIONS = {
  AMORTISSEMENTS: { label: 'Amortissements automatiques', journalId: 'AM', description: 'Calculer les dotations des immobilisations en service.', tone: 'amber', symbol: '◴' },
  ABONNEMENTS: { label: 'Abonnements', journalId: 'AB', description: 'Générer les écritures des abonnements récurrents.', tone: 'purple', symbol: '↻' },
  CENTRALISATION: { label: 'Centralisations', journalId: 'CT', description: 'Regrouper les écritures selon le paramétrage du dossier.', tone: 'blue', symbol: '◎' },
  RESULTAT: { label: 'Résultat de la période', journalId: 'RP', description: 'Calculer le résultat avant clôture de la période.', tone: 'green', symbol: '≋' }
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
      { label: 'Exportation FEC pour la DGID', description: 'Produire le Fichier des Écritures Comptables selon l’arrêté béninois', symbol: '⚖', tone: 'red', action: 'fec' },
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
      { label: 'Exercices et périodes', description: 'Créer, ouvrir ou clôturer une période comptable', symbol: '◷', tone: 'purple', action: 'periods' },
      { label: 'Paramètres régionaux', description: 'Devise XOF, format des dates et préférences', symbol: '⚙', tone: 'green', action: 'placeholder' }
    ]
  },
  comptes: {
    label: 'Comptes généraux',
    description: 'Plan Comptable SYSCOHADA Révisé : complétez et adaptez vos comptes aux besoins de votre société.',
    actions: [
      { label: 'Comptes Généraux (Plan Comptable Syscohada Révisé)', description: 'Consulter le plan et rechercher un compte', symbol: '▤', tone: 'green', action: 'accounts' },
      { label: 'Ajouter ou compléter un compte', description: 'Créer un sous-compte avec contrôle du référentiel', symbol: '+', tone: 'blue', action: 'add-account' },
      { label: 'Importer / exporter le plan comptable', description: 'Échanger vos comptes et vos personnalisations', symbol: '↕', tone: 'purple', action: 'import-accounts' },
      { label: 'Comptes favoris et règles par défaut', description: 'Accélérer la saisie des opérations courantes', symbol: '★', tone: 'amber', action: 'placeholder' }
    ]
  },
  tiers: {
    label: 'Tiers',
    description: 'Organisez les fiches et les comptes auxiliaires de vos partenaires.',
    actions: [
      { label: 'Fournisseurs', description: 'Fiches, comptes auxiliaires, échéances et contacts', symbol: 'F', tone: 'blue', action: 'thirdparties-supplier' },
      { label: 'Clients', description: 'Fiches, comptes auxiliaires, créances et règlements', symbol: 'C', tone: 'green', action: 'thirdparties-client' },
      { label: 'Personnel', description: 'Comptes de personnel et avances à suivre', symbol: 'P', tone: 'purple', action: 'placeholder' },
      { label: 'Débiteurs / créditeurs divers', description: 'Tiers occasionnels et comptes à régulariser', symbol: 'D', tone: 'amber', action: 'placeholder' }
    ]
  },
  journaux: {
    label: 'Journaux',
    description: 'Définissez vos journaux, leurs séquences et leurs comptes par défaut.',
    actions: [
      { label: 'Journaux comptables', description: 'Achats, ventes, banque, caisse et opérations diverses', symbol: '≡', tone: 'blue', action: 'journals-config' },
      { label: 'Ajouter un journal', description: 'Créer un journal adapté à votre activité', symbol: '+', tone: 'green', action: 'add-journal' },
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
      { label: 'Utilisateurs de la société', description: 'Inviter, retirer ou modifier un accès', symbol: 'U', tone: 'purple', action: 'access' },
      { label: 'Rôles et permissions', description: 'Saisie, contrôle, validation, clôture et lecture', symbol: '✓', tone: 'green', action: 'access' },
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

const EDITION_GROUPS = {
  journaux: {
    label: 'Journaux & pièces', description: 'Les livres et contrôles issus des écritures de la société.',
    actions: [
      { label: 'Livre journal intégré', description: 'Toutes les écritures classées et synchronisées', symbol: '▤', tone: 'green', action: 'journal' },
      { label: 'Détail des lignes saisies', description: 'Lignes débit/crédit avec leur imputation', symbol: '≡', tone: 'blue', action: 'journal' },
      { label: 'Pièces modifiées après la 1ère saisie', description: 'Repérer les corrections avant validation', symbol: '↻', tone: 'amber', action: 'placeholder', control: true },
      { label: 'Pièces déséquilibrées', description: 'Anomalies bloquantes à régulariser', symbol: '!', tone: 'red', action: 'placeholder', control: true },
      { label: 'Cumul des pièces saisies', description: 'Synthèse par période et par journal', symbol: '∑', tone: 'purple', action: 'journal' }
    ]
  },
  comptes: {
    label: 'Comptes & tiers', description: 'Les balances, grands livres et situations des comptes auxiliaires.',
    actions: [
      { label: 'Comptes généraux', description: 'Balance et mouvements par compte', symbol: 'C', tone: 'green', action: 'reports' },
      { label: 'Grand livre', description: 'Détail chronologique des mouvements', symbol: '▥', tone: 'blue', action: 'reports' },
      { label: 'Cumul par comptes individuels', description: 'Vue détaillée des comptes sélectionnés', symbol: '1', tone: 'purple', action: 'reports' },
      { label: 'Cumul par comptes de synthèse', description: 'Vue regroupée pour le pilotage', symbol: 'Σ', tone: 'amber', action: 'reports' },
      { label: 'Fournisseurs', description: 'Soldes, mouvements et comptes à payer', symbol: 'F', tone: 'blue', action: 'purchases' },
      { label: 'Clients', description: 'Soldes, mouvements et comptes à recevoir', symbol: 'C', tone: 'green', action: 'sales' },
      { label: 'Personnel', description: 'Mouvements des comptes de personnel', symbol: 'P', tone: 'purple', action: 'placeholder' },
      { label: 'Débiteurs / créditeurs divers', description: 'Situations des comptes occasionnels', symbol: 'D', tone: 'amber', action: 'placeholder' },
      { label: 'Lettrage', description: 'Écritures lettrées et non lettrées', symbol: '✓', tone: 'green', action: 'placeholder' }
    ]
  },
  analytique: {
    label: 'Analytique & budgets', description: 'Mesurez vos activités et comparez vos réalisations à vos prévisions.',
    actions: [
      { label: 'États analytiques', description: 'Résultats par axe ou centre analytique', symbol: 'A', tone: 'purple', action: 'reports' },
      { label: 'Cumul par tiers', description: 'Répartition par client, fournisseur ou tiers', symbol: 'T', tone: 'blue', action: 'placeholder' },
      { label: 'Cumul par centres analytiques', description: 'Comparer les activités ou projets', symbol: '◎', tone: 'green', action: 'placeholder' },
      { label: 'Cumul par devises', description: 'Mouvements par devise et conversion', symbol: '₣', tone: 'amber', action: 'placeholder' },
      { label: 'Budgets prévisionnels', description: 'Budget, réalisé et écarts', symbol: 'B', tone: 'purple', action: 'placeholder' }
    ]
  },
  tresorerie: {
    label: 'Trésorerie & rapprochements', description: 'Suivez les mouvements de caisse, de banque et les règlements.',
    actions: [
      { label: 'Opérations de caisse', description: 'Livre de caisse et solde en temps réel', symbol: 'C', tone: 'green', action: 'treasury' },
      { label: 'Comptes à payer', description: 'Échéances fournisseurs et règlements', symbol: '↓', tone: 'red', action: 'purchases' },
      { label: 'Comptes à recevoir', description: 'Échéances clients et encaissements', symbol: '↑', tone: 'blue', action: 'sales' },
      { label: 'Pointage et rapprochements bancaires', description: 'Mouvements pointés et non rapprochés', symbol: '✓', tone: 'purple', action: 'treasury' },
      { label: 'Programmation des règlements', description: 'Paiements à effectuer sur une période', symbol: '◷', tone: 'amber', action: 'placeholder' },
      { label: 'Affectation des règlements aux factures émises', description: 'Factures réglées, partielles ou non affectées', symbol: '↗', tone: 'green', action: 'placeholder' }
    ]
  },
  immobilisations: {
    label: 'Immobilisations & fiscalité', description: 'Éditez vos actifs, amortissements et documents de suivi fiscal.',
    actions: [
      { label: 'Immobilisations', description: 'Registre des biens et valeurs nettes', symbol: '▥', tone: 'blue', action: 'assets' },
      { label: 'Tableau des amortissements', description: 'Plans et dotations par période', symbol: '◴', tone: 'amber', action: 'assets' },
      { label: 'Déclarations périodiques', description: 'États préparatoires à contrôler', symbol: '%', tone: 'purple', action: 'placeholder' },
      { label: 'Déductions et réintégrations fiscales', description: 'Traitements documentés de fin de période', symbol: 'R', tone: 'red', action: 'placeholder' }
    ]
  },
  etats: {
    label: 'États & plans', description: 'Préparez les états spécifiques et tableaux financiers du dossier.',
    actions: [
      { label: 'États spécifiques au dossier', description: 'Éditions personnalisées de la société', symbol: '▧', tone: 'blue', action: 'reports' },
      { label: 'Tableaux financiers OHADA révisé', description: 'États selon le régime comptable retenu', symbol: 'O', tone: 'green', action: 'reports' },
      { label: 'Calcul du résultat de la période', description: 'Résultat avant clôture et écritures sources', symbol: '≋', tone: 'purple', action: 'placeholder' },
      { label: 'Définitions et plans', description: 'Paramètres et modèles d’éditions', symbol: 'D', tone: 'amber', action: 'placeholder' }
    ]
  }
};

const PARAMETER_GROUPS = {
  dossier: {
    label: 'Dossier & analytique',
    description: 'Les éléments d’organisation du dossier et de ses sections analytiques.',
    actions: [
      { label: 'Configuration du dossier', description: 'Paramètres généraux, exercice et comportement du dossier', symbol: '▣', tone: 'blue', action: 'companies' },
      { label: 'Sections et comptes analytiques', description: 'Créer les axes et sections de suivi de l’activité', symbol: 'A', tone: 'purple', action: 'placeholder' },
      { label: 'Clés de répartition des sections', description: 'Distribuer les charges et produits par section', symbol: '÷', tone: 'green', action: 'placeholder' },
      { label: 'Natures des comptes généraux', description: 'Définir les natures utilisées dans les analyses', symbol: 'C', tone: 'amber', action: 'placeholder' },
      { label: 'Natures analytiques', description: 'Structurer les natures de dépenses et de recettes', symbol: 'N', tone: 'blue', action: 'placeholder' }
    ]
  },
  immobilisations: {
    label: 'Immobilisations & engagements',
    description: 'Reliez les actifs et les engagements aux bons comptes et aux bons suivis.',
    actions: [
      { label: 'Comptes associés aux immobilisations', description: 'Comptes d’acquisition, de dotation et d’amortissement', symbol: '▥', tone: 'purple', action: 'assets' },
      { label: 'Comptes de suivi des commandes et marchés accordés', description: 'Suivre les engagements et leurs comptes dédiés', symbol: 'M', tone: 'blue', action: 'placeholder' },
      { label: 'Natures des commandes', description: 'Classer les commandes et marchés du dossier', symbol: 'C', tone: 'amber', action: 'placeholder' }
    ]
  },
  comptes: {
    label: 'Comptes & états',
    description: 'Contrôlez les attributs des comptes et le cadre utilisé pour les états financiers.',
    actions: [
      { label: 'Comptes lettrables, pointables, à payer et à recevoir', description: 'Définir les comptes concernés par chaque suivi', symbol: '✓', tone: 'green', action: 'journal' },
      { label: 'Cadre comptable et postes des tableaux financiers', description: 'Associer les comptes aux postes de restitution', symbol: '▤', tone: 'blue', action: 'reports' },
      { label: 'Tableaux de passage entre comptabilités', description: 'Préparer les correspondances de reprise', symbol: '↔', tone: 'purple', action: 'placeholder' }
    ]
  },
  referentiels: {
    label: 'Éditions & référentiels',
    description: 'Préparez les informations communes aux états imprimés et les devises du dossier.',
    actions: [
      { label: 'Informations communes aux états imprimés', description: 'En-têtes, mentions et informations de la société', symbol: '▧', tone: 'blue', action: 'editions' },
      { label: 'Devises', description: 'Devises autorisées, cours et règles de conversion', symbol: '₣', tone: 'green', action: 'placeholder' },
      { label: 'Définitions des éditions', description: 'Modèles, colonnes et profils de sortie', symbol: 'D', tone: 'amber', action: 'editions' }
    ]
  },
  securite: {
    label: 'Sécurité',
    description: 'Limitez les accès aux informations sensibles et aux opérations du dossier.',
    actions: [
      { label: 'Comptes confidentiels', description: 'Masquer les comptes sensibles dans les éditions', symbol: '◉', tone: 'red', action: 'placeholder' },
      { label: 'Droits des opérateurs', description: 'Saisie, contrôle, édition et validation par rôle', symbol: 'U', tone: 'purple', action: 'companies' },
      { label: 'Journal des changements', description: 'Historiser les modifications de paramétrage', symbol: '◷', tone: 'blue', action: 'placeholder' }
    ]
  }
};

const TOOL_GROUPS = {
  rapides: {
    label: 'Outils rapides', description: 'Les outils accessibles à tout moment pendant la saisie.',
    actions: [
      { label: 'Capture d’écran', description: 'Conserver une pièce ou une information affichée', symbol: '▣', tone: 'blue', shortcut: 'Ctrl + Alt + S', action: 'capture' },
      { label: 'Calculatrice', description: 'Effectuer un calcul sans quitter votre dossier', symbol: '±', tone: 'green', shortcut: 'Ctrl + Alt + C', action: 'calculator' }
    ]
  },
  calculs: {
    label: 'Calculs comptables', description: 'Des aides de calcul pour préparer une opération.',
    actions: [
      { label: 'Calcul TVA / HT / TTC', description: 'Retrouver rapidement une base et un montant de taxe', symbol: '%', tone: 'amber', shortcut: '', action: 'placeholder' },
      { label: 'Montant en lettres', description: 'Convertir un montant FCFA pour une pièce ou un règlement', symbol: 'A', tone: 'purple', shortcut: '', action: 'placeholder' },
      { label: 'Prorata temporis', description: 'Estimer une durée ou une dotation au prorata', symbol: '◷', tone: 'blue', shortcut: '', action: 'placeholder' },
      { label: 'Conversion de devises', description: 'Appliquer un cours enregistré au dossier', symbol: '₣', tone: 'green', shortcut: '', action: 'placeholder' }
    ]
  },
  controles: {
    label: 'Contrôles', description: 'Vérifiez une opération avant de l’insérer dans le brouillard.',
    actions: [
      { label: 'Vérifier l’équilibre débit / crédit', description: 'Tester les lignes d’une écriture', symbol: '✓', tone: 'green', shortcut: '', action: 'entry' },
      { label: 'Calculer un écart de caisse', description: 'Comparer le solde théorique et le comptage réel', symbol: 'Δ', tone: 'amber', shortcut: '', action: 'placeholder' },
      { label: 'Calculer une échéance', description: 'Obtenir une date à partir d’un délai de règlement', symbol: '◷', tone: 'blue', shortcut: '', action: 'placeholder' }
    ]
  },
  aide: {
    label: 'Aide à la saisie', description: 'Des repères pratiques pendant le travail comptable.',
    actions: [
      { label: 'Mémo des classes SYSCOHADA', description: 'Rappeler les grandes classes de comptes', symbol: 'C', tone: 'purple', shortcut: '', action: 'placeholder' },
      { label: 'Raccourcis clavier', description: 'Afficher les commandes disponibles', symbol: '⌘', tone: 'blue', shortcut: '', action: 'shortcuts' },
      { label: 'Bloc-notes de saisie', description: 'Noter une information avant de l’imputer', symbol: 'N', tone: 'green', shortcut: '', action: 'placeholder' }
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

function currentUser() {
  return appState.users.find((user) => user.id === appState.currentUserId) || appState.users[0] || { id: 'anonymous', name: 'Utilisateur', email: '' };
}

function currentMembership(companyId = appState.activeCompany, moduleId = 'CSR') {
  return (appState.memberships || []).find((membership) => membership.userId === appState.currentUserId && membership.companyId === companyId && membership.moduleId === moduleId && membership.active !== false) || null;
}

function renderCurrentUser() {
  const user = currentUser();
  const membership = currentMembership();
  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  $$('[data-current-user-name]').forEach((node) => { node.textContent = user.name; });
  $$('[data-current-user-role]').forEach((node) => { node.textContent = roleLabel(membership?.role); });
  $$('[data-current-user-avatar]').forEach((node) => { node.textContent = initials; });
}

function can(permission, { companyId = appState.activeCompany, moduleId = 'CSR' } = {}) {
  return Boolean(currentMembership(companyId, moduleId)?.role && hasMembershipPermission(currentMembership(companyId, moduleId), permission));
}

function hasMembershipPermission(membership, permission) {
  try {
    return assertPermission(membership, permission) === true;
  } catch {
    return false;
  }
}

function requirePermission(permission, { companyId = appState.activeCompany, moduleId = 'CSR' } = {}) {
  const membership = currentMembership(companyId, moduleId);
  if (!membership || !hasMembershipPermission(membership, permission)) {
    showToast(`Action refusée pour le rôle « ${roleLabel(membership?.role)} ».`);
    return false;
  }
  return true;
}

function companyModuleAccess(companyId, moduleId = 'CSR') {
  return (appState.memberships || []).some((membership) => membership.userId === appState.currentUserId && membership.companyId === companyId && membership.moduleId === moduleId && membership.active !== false);
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
  const hasAccess = (appState.memberships || []).some((membership) => membership.userId === appState.currentUserId && membership.companyId === companyId && membership.active !== false);
  if (!hasAccess) { showToast('Vous n’avez aucun accès à cette société.'); return; }
  appState.activeCompany = companyId;
  renderCurrentUser();
  appState.exportDraft = null;
  appState.fecDraft = null;
  pendingExportRows = null;
  pendingExportReportType = null;
  fecPrepared = null;
  persistAppState();

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
  renderEntryQueue();
  renderCorrectionWindow();
  renderAccountPlan();
  renderJournalSetup();
  renderThirdpartyList();
  renderInvoicePartyOptions('SALE');
  renderInvoicePartyOptions('PURCHASE');
  renderInvoiceLines('SALE');
  renderInvoiceLines('PURCHASE');
  renderInvoicePreview('SALE');
  renderInvoicePreview('PURCHASE');
  renderInvoiceHistory('SALE');
  renderInvoiceHistory('PURCHASE');
  renderPaymentPartyOptions();
  renderPaymentDocuments();
  renderPaymentHistory();
  renderLettering();
  renderBankMovements();
  renderTreasury();
  renderAutomaticTasks();
  renderAutomaticRuns();
  renderPeriods();
  renderFiscalPreview({ preserveActiveInput: false });
  renderClosure();
  renderFinalization();
  renderOpening();
  renderStatements();
  renderExportAssistant();
  renderFecAssistant();
  renderAccessView();
  refreshSyncStatus();
  if (notify) showToast(`${company.name} est maintenant la société active.`);
}

function renderCompanyMenu() {
  const menu = $('#companyMenu');
  if (!menu) return;
  const accessibleCompanies = Object.values(appState.companies).filter((company) => (appState.memberships || []).some((membership) => membership.userId === appState.currentUserId && membership.companyId === company.id && membership.active !== false));
  menu.innerHTML = `<div class="company-menu-header">VOS SOCIÉTÉS</div>${accessibleCompanies.map((company) => `
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
    const module = dossier.moduleId ? (MODULES[dossier.moduleId] || { label: 'Module', shortLabel: dossier.moduleId }) : { label: 'Aucun module activé', shortLabel: 'À configurer' };
    const access = dossier.moduleId ? companyModuleAccess(dossier.companyId, dossier.moduleId) : (appState.memberships || []).some((membership) => membership.userId === appState.currentUserId && membership.companyId === dossier.companyId && membership.active !== false);
    return access && (!normalizedQuery || [dossier.dossier, dossier.period, company?.name, module.label, dossier.moduleId].join(' ').toLowerCase().includes(normalizedQuery));
  });
  rows.innerHTML = visibleDossiers.map((dossier) => {
    const company = appState.companies[dossier.companyId] || { name: 'Société inconnue', shortName: '??', color: 'teal', type: 'Dossier comptable' };
    const module = dossier.moduleId ? MODULES[dossier.moduleId] : { label: 'Aucun module activé', shortLabel: 'À configurer', color: 'muted' };
    const isSelected = dossier.id === appState.selectedDossier;
    const moduleClass = dossier.moduleId ? `module-table-${module.color}` : 'module-table-muted';
    return `<tr class="${isSelected ? 'is-selected' : ''}" data-dossier-id="${escapeHtml(dossier.id)}" tabindex="0" role="button" aria-label="Sélectionner ${escapeHtml(dossier.dossier)} ${escapeHtml(module.shortLabel)}"><td><span class="dossier-code-icon ${company.color === 'orange' ? 'dossier-code-orange' : 'dossier-code-teal'}">${escapeHtml(company.shortName)}</span><span class="dossier-code"><b>${escapeHtml(dossier.dossier)}</b><small>${dossier.moduleId ? 'Dossier · module rattaché' : 'Dossier · à configurer'}</small></span></td><td><span class="module-table-cell"><i class="module-table-mark ${moduleClass}">${escapeHtml(dossier.moduleId || '—')}</i><span><b>${escapeHtml(module.shortLabel)}</b><small>${escapeHtml(module.label)}</small></span></span></td><td><span class="company-name-cell">${escapeHtml(company.name)}</span><small class="cell-subtitle">${escapeHtml(company.activity || company.type || 'Dossier comptable')}</small></td><td>${escapeHtml(dossier.period)}</td><td><span class="session-count">${dossier.sessions ? dossier.sessions : '—'}</span></td><td><span class="status ${dossier.statusClass || 'status-green'}">${escapeHtml(dossier.status)}</span></td></tr>`;
  }).join('');
  const activeRecords = visibleDossiers.filter((dossier) => dossier.status !== 'Archivé');
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
  if (!appState.dossiers.some((dossier) => dossier.id === appState.selectedDossier && dossier.status !== 'Archivé')) {
    appState.selectedDossier = appState.dossiers.find((dossier) => dossier.status !== 'Archivé')?.id || null;
  }
  selectDossier(appState.selectedDossier);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLogin() {
  appState.authenticated = false;
  try { sessionStorage.removeItem('fec.session'); } catch { /* Session locale indisponible. */ }
  $('#dossiersScreen')?.setAttribute('hidden', '');
  $('#appShell')?.setAttribute('hidden', '');
  $('#loginScreen')?.removeAttribute('hidden');
  document.body.style.overflow = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function syncStateText(state) {
  return ({ OFFLINE: 'Hors ligne', PENDING: 'À synchroniser', CONFLICT: 'Conflit à traiter', LOCAL: 'Données locales' })[state] || 'Données locales';
}

function refreshSyncStatus() {
  if (!appState.syncStatus || typeof appState.syncStatus !== 'object') appState.syncStatus = { state: 'LOCAL', pending: 0, conflicts: 0, lastSyncAt: null, forcedOffline: false, transport: 'NOT_CONNECTED', deviceId: null, cursor: '0', entityHashes: {}, appliedEventIds: [], lastError: null };
  if (!Array.isArray(appState.syncOutbox)) appState.syncOutbox = [];
  if (!Array.isArray(appState.syncConflicts)) appState.syncConflicts = [];
  appState.syncStatus.entityHashes = appState.syncStatus.entityHashes || {};
  appState.syncStatus.appliedEventIds = Array.isArray(appState.syncStatus.appliedEventIds) ? appState.syncStatus.appliedEventIds : [];
  const browserOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const status = appState.syncStatus;
  status.pending = pendingSyncCount();
  status.state = status.forcedOffline || browserOffline ? 'OFFLINE' : status.conflicts > 0 ? 'CONFLICT' : status.pending > 0 ? 'PENDING' : 'LOCAL';
  const label = syncStateText(status.state);
  const indicator = $('#syncStatusButton');
  if (indicator) {
    indicator.className = `sync-status sync-status-${status.state.toLowerCase()}`;
    indicator.setAttribute('aria-label', `${label}. Ouvrir le centre de synchronisation`);
  }
  const detail = status.state === 'OFFLINE' ? 'Les changements restent sur cet appareil' : status.transport === 'CONNECTING' ? 'Connexion au service distant…' : status.transport === 'AUTH_REQUIRED' ? 'Connexion requise pour envoyer les données' : status.transport === 'NOT_CONNECTED' ? 'Connecteur distant non disponible' : status.lastError ? 'Dernière tentative avec erreur' : 'Prêt à synchroniser';
  $('#syncStatusLabel').textContent = label;
  $('#syncStatusDetail').textContent = detail;
  $('#syncModalState').textContent = label;
  $('#syncModalDescription').textContent = detail;
  $('#syncPendingCount').textContent = String(status.pending || 0);
  $('#syncConflictCount').textContent = String(status.conflicts || 0);
  $('#syncLastDate').textContent = status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString('fr-FR') : 'Jamais';
  $('#syncTransportLabel').textContent = ({ CONNECTING: 'Connexion…', AUTH_REQUIRED: 'Session requise', NOT_CONNECTED: 'Non connecté', AVAILABLE: 'Disponible' })[status.transport] || 'Non connecté';
}

function openSyncModal() {
  refreshSyncStatus();
  openModal('syncModal');
}

function toggleOfflineDemo() {
  appState.syncStatus.forcedOffline = !appState.syncStatus.forcedOffline;
  if (syncRemote) syncRemote.setOnline(!appState.syncStatus.forcedOffline);
  refreshSyncStatus();
  $('#toggleOfflineButton').textContent = appState.syncStatus.forcedOffline ? 'Repasser en mode réseau' : 'Simuler une coupure';
  showToast(appState.syncStatus.forcedOffline ? 'Mode hors ligne simulé : les données restent locales.' : 'Mode réseau simulé rétabli.');
}

let syncRemote;

function syncDeviceId() {
  if (appState.syncStatus.deviceId) return appState.syncStatus.deviceId;
  try {
    const saved = localStorage.getItem('emrys.sync.device-id');
    if (saved) appState.syncStatus.deviceId = saved;
    else {
      appState.syncStatus.deviceId = globalThis.crypto?.randomUUID?.() || `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('emrys.sync.device-id', appState.syncStatus.deviceId);
    }
  } catch {
    appState.syncStatus.deviceId = appState.syncStatus.deviceId || `device-${Date.now()}`;
  }
  return appState.syncStatus.deviceId;
}

function syncRemoteForSession() {
  if (!syncRemote) syncRemote = createHttpSyncRemote({ baseUrl: '', deviceId: syncDeviceId(), deviceName: `EMRYS · ${navigator.userAgent.includes('Windows') ? 'Windows' : 'Navigateur'}` });
  return syncRemote;
}

function syncEntityKey(entityType, entityId, companyId = appState.activeCompany) {
  return `${companyId || 'global'}:${entityType}:${entityId}`;
}

function pendingSyncCount() {
  return (appState.syncOutbox || []).filter((event) => event.status !== 'CONFLICT').length;
}

function queueSyncChange({ entityType, entityId, payload, companyId = appState.activeCompany, moduleId = 'CSR' }) {
  if (!entityType || !entityId || !payload || !companyId) return;
  if (!appState.syncOutbox) appState.syncOutbox = [];
  if (!appState.syncStatus.entityHashes) appState.syncStatus.entityHashes = {};
  const key = syncEntityKey(entityType, entityId, companyId);
  const previous = appState.syncOutbox.find((event) => syncEntityKey(event.entityType, event.entityId, event.companyId) === key && event.status !== 'CONFLICT');
  const event = {
    id: previous?.id || `sync-${entityType}-${entityId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    companyId,
    moduleId,
    entityType,
    entityId,
    operation: 'UPSERT',
    payload: { ...payload, id: payload.id || entityId, companyId: payload.companyId || companyId, moduleId: payload.moduleId || moduleId },
    baseHash: appState.syncStatus.entityHashes[key] || previous?.payloadHash || null,
    status: 'PENDING',
    attempts: previous?.attempts || 0,
    lastError: null,
    queuedAt: new Date().toISOString()
  };
  // Coalesce unsent modifications of one entity. The final local state is
  // sufficient and this avoids sending an obsolete intermediate screen state.
  const index = previous ? appState.syncOutbox.indexOf(previous) : -1;
  if (index >= 0) appState.syncOutbox[index] = event;
  else appState.syncOutbox.push(event);
  appState.syncStatus.pending = pendingSyncCount();
  persistAppState();
  refreshSyncStatus();
  return event;
}

function rememberAppliedSyncEvent(eventId) {
  if (!eventId) return;
  const ids = appState.syncStatus.appliedEventIds || [];
  if (!ids.includes(eventId)) ids.push(eventId);
  appState.syncStatus.appliedEventIds = ids.slice(-1000);
}

function cursorMax(first, second) {
  try { return (BigInt(String(second || 0)) > BigInt(String(first || 0)) ? String(second) : String(first || 0)); }
  catch { return String(second || first || '0'); }
}

function applyRemoteSyncEvent(event) {
  if (!event || appState.syncStatus.appliedEventIds?.includes(event.id)) return;
  const payload = event.payload || {};
  const companyId = event.companyId || payload.companyId;
  if (!companyId) return;
  if (event.entityType === 'COMPANY') {
    appState.companies[companyId] = { ...(appState.companies[companyId] || {}), ...payload, id: companyId };
  } else if (event.entityType === 'DOSSIER') {
    const dossier = { ...payload, id: event.entityId, companyId, dossier: payload.dossier || payload.code || event.entityId };
    const index = appState.dossiers.findIndex((item) => item.id === event.entityId);
    if (index >= 0) appState.dossiers[index] = { ...appState.dossiers[index], ...dossier };
    else appState.dossiers.push(dossier);
  } else if (event.entityType === 'FISCAL_YEAR') {
    const year = String(payload.year || payload.id || '');
    appState.fiscalYears[companyId] = { ...(appState.fiscalYears[companyId] || {}), ...payload, id: year };
    appState.fiscalYearCatalog[companyId] = appState.fiscalYearCatalog[companyId] || [];
    const index = appState.fiscalYearCatalog[companyId].findIndex((item) => String(item.id) === year);
    if (index >= 0) appState.fiscalYearCatalog[companyId][index] = { ...appState.fiscalYearCatalog[companyId][index], ...payload, id: year };
    else appState.fiscalYearCatalog[companyId].push({ ...payload, id: year });
  } else if (event.entityType === 'PERIOD') {
    const year = String(payload.fiscalYear || payload.fiscal_year || appState.fiscalYears?.[companyId]?.id || '2025');
    appState.periods[companyId] = appState.periods[companyId] || createMonthlyPeriods(Number(year));
    const period = { ...payload, id: payload.id || event.entityId };
    const index = appState.periods[companyId].findIndex((item) => item.id === period.id);
    if (index >= 0) appState.periods[companyId][index] = { ...appState.periods[companyId][index], ...period };
    else appState.periods[companyId].push(period);
  } else if (event.entityType === 'JOURNAL_ENTRY') {
    const entry = { ...payload, id: event.entityId, companyId, source: payload.source || 'Synchronisation distante' };
    if (entry.status === 'CANCELLED') {
      appState.integratedEntries = appState.integratedEntries.filter((item) => item.id !== event.entityId);
      appState.recentEntries = appState.recentEntries.filter((item) => item.id !== event.entityId);
    } else {
      const index = appState.integratedEntries.findIndex((item) => item.id === event.entityId);
      if (index >= 0) appState.integratedEntries[index] = { ...appState.integratedEntries[index], ...entry };
      else appState.integratedEntries.push(entry);
      const remoteTreasuryMovement = treasuryMovementForEntry(entry);
      if (remoteTreasuryMovement && !appState.bankMovements.some((movement) => movement.id === remoteTreasuryMovement.id)) appState.bankMovements.unshift(remoteTreasuryMovement);
    }
  } else if (event.entityType === 'AUDIT_EVENT') {
    if (!appState.auditEvents.some((item) => item.id === event.entityId)) appState.auditEvents.push({ ...payload, id: event.entityId });
  }
  rememberAppliedSyncEvent(event.id);
}

async function synchronizeWithServer() {
  const status = appState.syncStatus;
  if (status.forcedOffline || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    refreshSyncStatus();
    showToast('Mode hors ligne : les changements restent dans cet appareil.');
    return;
  }
  status.transport = 'CONNECTING';
  status.lastError = null;
  refreshSyncStatus();
  try {
    const remote = syncRemoteForSession();
    const pending = (appState.syncOutbox || []).filter((event) => event.status === 'PENDING' || event.status === 'FAILED').slice(0, 100);
    const pushed = pending.length ? await remote.push(pending) : { acknowledgements: [], conflicts: [], errors: [] };
    (pushed.acknowledgements || []).forEach((ack) => {
      const event = appState.syncOutbox.find((item) => item.id === ack.id);
      if (ack.payloadHash && event) appState.syncStatus.entityHashes[syncEntityKey(event.entityType, event.entityId, event.companyId)] = ack.payloadHash;
      appState.syncOutbox = appState.syncOutbox.filter((item) => item.id !== ack.id);
      rememberAppliedSyncEvent(ack.id);
    });
    (pushed.conflicts || []).forEach((conflict) => {
      const event = appState.syncOutbox.find((item) => item.id === conflict.outboxId);
      if (event) { event.status = 'CONFLICT'; event.lastError = conflict.reason; }
      if (!appState.syncConflicts.some((item) => item.outboxId === conflict.outboxId)) appState.syncConflicts.push({ ...conflict, status: 'OPEN', createdAt: new Date().toISOString() });
    });
    (pushed.errors || []).forEach((failure) => {
      const event = appState.syncOutbox.find((item) => item.id === failure.id);
      if (event) { event.status = 'FAILED'; event.attempts = (event.attempts || 0) + 1; event.lastError = failure.message || failure.code; }
    });
    let cursor = String(status.cursor || '0');
    const incoming = await remote.pull(cursor, { limit: 100, companyId: appState.activeCompany });
    incoming.forEach((event) => { applyRemoteSyncEvent(event); cursor = cursorMax(cursor, event.cursor); });
    status.cursor = cursor;
    status.lastSyncAt = new Date().toISOString();
    status.transport = 'AVAILABLE';
    const remoteStatus = await remote.status().catch(() => null);
    if (remoteStatus?.conflicts !== undefined) status.remoteConflicts = Number(remoteStatus.conflicts) || 0;
    status.pending = pendingSyncCount();
    status.conflicts = (appState.syncConflicts || []).filter((item) => item.status === 'OPEN').length + (status.remoteConflicts || 0);
    persistAppState();
    refreshSyncStatus();
    renderCompanyMenu();
    renderIntegratedJournal();
    renderEntryQueue();
    renderBankMovements();
    renderTreasury();
    renderDossiers();
    showToast(status.conflicts ? 'Synchronisation terminée avec un conflit à traiter.' : 'Synchronisation terminée.');
  } catch (error) {
    status.transport = error.status === 401 ? 'AUTH_REQUIRED' : 'NOT_CONNECTED';
    status.lastError = error.message;
    status.pending = pendingSyncCount();
    refreshSyncStatus();
    showToast(error.status === 401 ? 'Reconnectez-vous avant de synchroniser.' : 'Serveur de synchronisation indisponible. Les données restent locales.');
  }
}

function showSyncTransportInfo() {
  showToast('EMRYS pousse les changements locaux, vérifie les versions distantes et conserve les conflits avant toute résolution.');
}

function resetLocalData() {
  const confirmed = typeof window.confirm !== 'function' || window.confirm('Réinitialiser le prototype et effacer les données locales ?');
  if (!confirmed) return;
  try {
    appStore.clear();
    sessionStorage.removeItem('fec.bootstrap.recovered');
  } catch {
    // Le rechargement remettra les données de démonstration si le stockage est indisponible.
  }
  window.location.reload();
}

function recoverFromBootstrapError() {
  let alreadyRecovered = false;
  try {
    alreadyRecovered = sessionStorage.getItem('fec.bootstrap.recovered') === '1';
    if (!alreadyRecovered) {
      appStore.clear();
      sessionStorage.setItem('fec.bootstrap.recovered', '1');
    } else sessionStorage.removeItem('fec.bootstrap.recovered');
  } catch {
    // Le rechargement reste le dernier recours si le stockage est indisponible.
  }
  if (!alreadyRecovered && typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
    window.location.reload();
    return;
  }
  // Même si une erreur persiste, l’authentification reste utilisable et son erreur est visible dans la console.
  bindAuthForm();
}

function openSelectedDossier() {
  const selected = appState.dossiers.find((item) => item.id === appState.selectedDossier && item.status !== 'Archivé');
  const dossier = selected || appState.dossiers.find((item) => item.status !== 'Archivé' && appState.companies[item.companyId]);
  const company = dossier && appState.companies[dossier.companyId];
  if (!dossier || !company) {
    showToast('Sélectionnez d’abord un dossier accessible.');
    return;
  }
  appState.selectedDossier = dossier.id;
  dossier.sessions = Math.max(1, Number(dossier.sessions || 0));
  appState.moduleCompanyId = dossier.companyId;
  appState.moduleDossierCode = dossier.dossier || dossier.code;
  if (dossier.moduleId && !companyModuleAccess(dossier.companyId, dossier.moduleId)) {
    showToast('Vous n’avez pas accès au module de ce dossier.');
    return;
  }
  persistAppState();
  // Change d’écran avant les rafraîchissements secondaires : une vue ou une
  // donnée locale ancienne ne doit jamais rendre le bouton Ouvrir inerte.
  $('#dossiersScreen')?.setAttribute('hidden', '');
  $('#appShell')?.setAttribute('hidden', '');
  $('#moduleStubScreen')?.setAttribute('hidden', '');
  $('#moduleHomeScreen')?.removeAttribute('hidden');
  try { setActiveCompany(dossier.companyId, false); } catch (error) { console.error('Rafraîchissement de société impossible.', error); }
  renderModuleHome(dossier.companyId, appState.moduleDossierCode);
  showToast(`${company.name} est ouvert. Choisissez un module.`);
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
  persistAppState();
  renderDossiers();
  renderModuleHome(selected.companyId, selected.dossier);
  showToast(`${MODULES[moduleId].label} a été rattaché à ${selected.dossier}.`);
}

function openModule(moduleId) {
  const companyId = appState.moduleCompanyId;
  const dossierCode = appState.moduleDossierCode;
  const entry = activeModulesFor(companyId, dossierCode).find((item) => item.moduleId === moduleId);
  if (!entry) return activateModule(moduleId);
  const company = appState.companies[companyId];
  if (!company) { showToast('La société de ce dossier est introuvable.'); return; }
  if (moduleId === 'CSR') {
    // Le changement de vue est prioritaire ; le rafraîchissement des panneaux
    // ne doit pas empêcher l’ouverture du module.
    $('#moduleHomeScreen')?.setAttribute('hidden', '');
    $('#moduleStubScreen')?.setAttribute('hidden', '');
    $('#appShell')?.removeAttribute('hidden');
    openView('dashboard');
    try { setActiveCompany(companyId, false); } catch (error) { console.error('Rafraîchissement de société impossible.', error); }
    showToast('Module CSR ouvert.');
    return;
  }
  try { setActiveCompany(companyId, false); } catch (error) { console.error('Rafraîchissement de société impossible.', error); }
  const definition = MODULES[moduleId];
  $('#moduleHomeScreen')?.setAttribute('hidden', '');
  $('#appShell')?.setAttribute('hidden', '');
  $('#moduleStubScreen')?.removeAttribute('hidden');
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
  persistAppState();
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
  persistAppState();
  renderDossiers();
  selectDossier(appState.selectedDossier);
  showToast(`${dossier.dossier} a été archivé. Ses données sont conservées.`);
}

function bindAuthForm() {
  const form = $('#authForm');
  if (!form || form.dataset.authBound === 'true') return;
  form.addEventListener('submit', authenticate);
  form.dataset.authBound = 'true';
}

const AUTH_DEMO_PASSWORD = 'fec-demo';
const AUTH_ITERATIONS = 120000;

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function passwordDigest(password, salt) {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) throw new Error('Le navigateur ne permet pas de sécuriser cette session.');
  const key = await globalThis.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await globalThis.crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: AUTH_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return new Uint8Array(bits);
}

async function verifyOrSeedPassword(user, password, { allowAnySeed = false } = {}) {
  if (user.passwordHash && user.passwordSalt) {
    const digest = await passwordDigest(password, base64ToBytes(user.passwordSalt));
    return bytesToBase64(digest) === user.passwordHash;
  }
  if (!allowAnySeed && password !== AUTH_DEMO_PASSWORD) return false;
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const digest = await passwordDigest(password, salt);
  user.passwordSalt = bytesToBase64(salt);
  user.passwordHash = bytesToBase64(digest);
  user.passwordSeededAt = new Date().toISOString();
  return true;
}

async function authenticateAgainstServer(email, password) {
  if (typeof window === 'undefined' || !window.location.pathname.startsWith('/app')) return { available: false };
  try {
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ email, password }) });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 404) return { available: false };
    return { available: true, ok: response.ok, payload };
  } catch {
    return { available: false };
  }
}

function mergeRemoteContext(context, userId) {
  if (!context) return;
  const remoteCompanies = context.companies || [];
  remoteCompanies.forEach((company) => {
    appState.companies[company.id] = { ...company, color: company.color || 'teal' };
    if (!appState.accountingSetups[company.id]) appState.accountingSetups[company.id] = createCsrSetup({ companyId: company.id });
    const remoteYear = String(context.fiscalYears?.find((year) => year.companyId === company.id)?.id || new Date().getUTCFullYear());
    appState.periods[company.id] = appState.periods[company.id] || createMonthlyPeriods(Number(remoteYear));
    const selectedPeriod = appState.activePeriodIds[company.id];
    appState.activePeriodIds[company.id] = selectedPeriod && String(selectedPeriod).startsWith(`${remoteYear}-`) ? selectedPeriod : appState.periods[company.id][0]?.id;
  });
  const remoteCompanyIds = new Set(remoteCompanies.map((company) => company.id));
  const remoteMembershipKeys = new Set((context.memberships || []).map((membership) => `${membership.companyId}:${membership.moduleId || ''}`));
  const pendingLocalMemberships = (appState.memberships || []).filter((membership) => membership.userId === userId
    && !remoteMembershipKeys.has(`${membership.companyId}:${membership.moduleId || ''}`)
    && !remoteCompanyIds.has(membership.companyId));
  appState.memberships = [...(appState.memberships || []).filter((membership) => membership.userId !== userId), ...pendingLocalMemberships, ...(context.memberships || [])];
  const remoteDossiers = (context.dossiers || []).map((dossier) => ({
    ...dossier,
    period: dossier.period || `${displayDate(dossier.exerciseStart)} - ${displayDate(dossier.exerciseEnd)}`,
    sessions: Number(dossier.sessions || 0),
    statusClass: dossier.status === 'Archivé' ? 'status-muted' : 'status-green'
  }));
  appState.dossiers = [...(appState.dossiers || []).filter((dossier) => !remoteCompanyIds.has(dossier.companyId)), ...remoteDossiers];
  (context.fiscalYears || []).forEach((fiscalYear) => {
    appState.fiscalYears[fiscalYear.companyId] = { ...fiscalYear, id: String(fiscalYear.id) };
    if (!appState.fiscalYearCatalog[fiscalYear.companyId]) appState.fiscalYearCatalog[fiscalYear.companyId] = [];
    if (!appState.fiscalYearCatalog[fiscalYear.companyId].some((item) => String(item.id) === String(fiscalYear.id))) appState.fiscalYearCatalog[fiscalYear.companyId].push({ ...fiscalYear, id: String(fiscalYear.id) });
    if (!appState.fiscalYearPeriods[fiscalYear.companyId]) appState.fiscalYearPeriods[fiscalYear.companyId] = {};
    if (!appState.fiscalYearPeriods[fiscalYear.companyId][String(fiscalYear.id)]) appState.fiscalYearPeriods[fiscalYear.companyId][String(fiscalYear.id)] = createMonthlyPeriods(Number(fiscalYear.id), { status: fiscalYear.status === 'FINALIZED' ? 'CLOSED' : 'OPEN' });
    appState.periods[fiscalYear.companyId] = appState.fiscalYearPeriods[fiscalYear.companyId][String(fiscalYear.id)];
  });
  const firstCompany = remoteCompanies[0];
  if (firstCompany) appState.activeCompany = firstCompany.id;
  const firstDossier = remoteDossiers.find((dossier) => dossier.moduleId === 'CSR');
  if (firstDossier) appState.selectedDossier = firstDossier.id;
}

async function authenticate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  const originalLabel = submit?.textContent;
  if (submit) { submit.disabled = true; submit.textContent = 'Vérification…'; }
  try {
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const localUser = appState.users.find((item) => item.email === email && item.active !== false);
    const remote = await authenticateAgainstServer(email, password);
    let user = localUser;
    if (remote.ok && remote.payload?.user) {
      user = localUser || createUser({ id: remote.payload.user.id, name: remote.payload.user.name, email: remote.payload.user.email });
      if (!localUser) appState.users.push(user);
      if (!user.passwordHash) { try { await verifyOrSeedPassword(user, password, { allowAnySeed: true }); } catch { /* La session distante reste utilisable même sans cache hors ligne. */ } }
      mergeRemoteContext(remote.payload.context, user.id);
    } else if (!localUser || remote.available && remote.payload?.code === 'INVALID_CREDENTIALS' && !localUser) {
      showToast(remote.payload?.message || 'Adresse e-mail ou mot de passe incorrect.');
      return;
    } else if (!user || !(await verifyOrSeedPassword(user, password))) {
      showToast('Adresse e-mail ou mot de passe incorrect.');
      return;
    }
    appState.currentUserId = user.id;
    user.lastLoginAt = new Date().toISOString();
    const firstAccessibleMembership = (appState.memberships || []).find((membership) => membership.userId === user.id && membership.active !== false);
    if (!(appState.memberships || []).some((membership) => membership.userId === user.id && membership.companyId === appState.activeCompany && membership.active !== false) && firstAccessibleMembership) appState.activeCompany = firstAccessibleMembership.companyId;
    const firstAccessibleDossier = (appState.dossiers || []).find((dossier) => dossier.companyId === appState.activeCompany && (dossier.moduleId ? companyModuleAccess(dossier.companyId, dossier.moduleId) : true) && dossier.status !== 'Archivé');
    if (firstAccessibleDossier) appState.selectedDossier = firstAccessibleDossier.id;
    try { sessionStorage.setItem('fec.session', JSON.stringify({ userId: user.id, loggedAt: user.lastLoginAt, remember: Boolean(formData.get('remember')) })); } catch { /* Session locale indisponible, la session reste en mémoire. */ }
    renderCurrentUser();
    persistAppState();
    showDossiers();
  } catch (error) {
    console.error('Impossible d’ouvrir les dossiers.', error);
    recoverFromBootstrapError();
  } finally {
    if (submit) { submit.disabled = false; submit.textContent = originalLabel || 'Accéder à mes dossiers'; }
  }
}

async function requestPasswordReset(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const email = String(new FormData(form).get('email') || '').trim().toLowerCase();
  try {
    const response = await fetch('/api/password/reset/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ email }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || 'La demande n’a pas pu être traitée.');
    const result = $('#passwordResetResult');
    if (result) {
      result.innerHTML = payload.resetUrl ? `En développement : <a href="${escapeHtml(payload.resetUrl)}" target="_self">Ouvrir le lien de réinitialisation</a>` : escapeHtml(payload.message || 'Si le compte existe, un lien sera envoyé.');
      result.removeAttribute('hidden');
    }
    showToast(payload.resetUrl ? 'Lien de réinitialisation prêt.' : 'Si cette adresse existe, un lien sera envoyé.');
  } catch (error) { showToast(error.message || 'Service de réinitialisation indisponible.'); }
}

function refreshViewData(viewName) {
  if (viewName === 'periodic') { renderAutomaticTasks(); renderAutomaticRuns(); renderFiscalPreview({ preserveActiveInput: false }); renderClosure(); }
  if (viewName === 'finalization') renderFinalization();
  if (viewName === 'opening') renderOpening();
  if (viewName === 'periods') renderPeriods();
  if (viewName === 'statements') renderStatements();
  if (viewName === 'journal') renderIntegratedJournal();
  if (viewName === 'sales') { renderInvoiceHistory('SALE'); renderInvoicePartyOptions('SALE'); renderInvoiceLines('SALE'); renderInvoicePreview('SALE'); }
  if (viewName === 'purchases') { renderInvoiceHistory('PURCHASE'); renderInvoicePartyOptions('PURCHASE'); renderInvoiceLines('PURCHASE'); renderInvoicePreview('PURCHASE'); }
  if (viewName === 'payments') { renderPaymentHistory(); renderLettering(); }
  if (viewName === 'bank') renderBankMovements();
  if (viewName === 'treasury') renderTreasury();
  if (viewName === 'companies') { renderCompanyMenu(); }
  if (viewName === 'access') renderAccessView();
  if (viewName === 'imports') { renderExportAssistant(); renderFecAssistant(); }
}

function openView(viewName) {
  $$('.view').forEach((view) => view.classList.toggle('is-visible', view.dataset.viewPanel === viewName));
  $$('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.view === viewName));
  $$('.workspace-top-menu-item').forEach((item) => item.classList.toggle('is-active', item.dataset.view === viewName));
  $('#companyMenu')?.classList.remove('is-open');
  $('#companyPicker')?.setAttribute('aria-expanded', 'false');
  $('#quickMenu')?.setAttribute('hidden', '');
  $('#sidebar')?.classList.remove('is-open');
  refreshViewData(viewName);
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
  const ownerMembership = createMembership({ id: `${appState.currentUserId}_${id}_CSR`, userId: appState.currentUserId, companyId: id, moduleId: 'CSR', role: 'ADMIN' });
  appState.memberships.push(ownerMembership);
  const addCard = $('.company-card-add');
  addCard?.insertAdjacentHTML('beforebegin', makeCompanyCard(company));
  appState.dossiers.push({ id: dossierId, companyId: id, dossier: generatedDossierCode, period: `${displayDate(exerciseStart)} - ${displayDate(exerciseEnd)}`, exerciseYear: year, sessions: 0, status: 'Disponible', statusClass: 'status-blue' });
  const newSetup = createCsrSetup({ companyId: id, regime: 'NORMAL' });
  if (fullPlanPayload) newSetup.accounts = fullPlanPayload.accounts.map((account) => ({ ...account, nature: account.nature || 'À définir', active: account.active !== false, isCustom: false }));
  appState.accountingSetups[id] = newSetup;
  appState.periods[id] = createMonthlyPeriods(Number(year));
  appState.activePeriodIds[id] = `${year}-01`;
  appState.fiscalYearPeriods[id] = { [String(year)]: appState.periods[id] };
  appState.activePeriodIdsByYear[id] = { [String(year)]: appState.activePeriodIds[id] };
  appState.fiscalYearCatalog[id] = [{ id: String(year), label: `Exercice ${year}`, status: 'OPEN' }];
  appState.fiscalYears[id] = { id: year, label: `Exercice ${year}`, status: 'OPEN' };
  appState.fiscalSettings[id] = { years: { [String(year)]: createBeninFiscalSettings({ fiscalYear: year, codeVersion: '2026' }) } };
  queueSyncChange({ entityType: 'COMPANY', entityId: id, companyId: id, payload: company });
  queueSyncChange({ entityType: 'MEMBERSHIP', entityId: ownerMembership.id, companyId: id, moduleId: 'CSR', payload: ownerMembership });
  queueSyncChange({ entityType: 'DOSSIER', entityId: dossierId, companyId: id, moduleId: 'CSR', payload: appState.dossiers.find((item) => item.id === dossierId) });
  queueSyncChange({ entityType: 'FISCAL_YEAR', entityId: `${id}-${year}`, companyId: id, moduleId: 'CSR', payload: { id: `${id}-${year}`, companyId: id, year, label: `Exercice ${year}`, status: 'OPEN' } });
  persistAppState();
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

const EXPORT_REPORTS = Object.freeze([
  { value: 'trial-balance', label: 'Balance générale' },
  { value: 'general-ledger', label: 'Grand livre' },
  { value: 'integrated-journal', label: 'Livre-journal' },
  { value: 'customer-balance', label: 'Balance auxiliaire clients' },
  { value: 'supplier-balance', label: 'Balance auxiliaire fournisseurs' },
  { value: 'assets', label: 'État des immobilisations' },
  { value: 'income-statement', label: 'Compte de résultat' },
  { value: 'balance-sheet', label: 'Bilan' },
  { value: 'cash-flow', label: 'Flux de trésorerie' },
  { value: 'notes', label: 'Notes et annexes' }
]);

const EXPORT_FORMATS = Object.freeze({
  xlsx: { label: 'Excel moderne', extension: 'xlsx', outputExtension: 'txt', available: false, description: '.xlsx · adaptateur à venir', icon: 'X', tone: 'green' },
  xls: { label: 'Excel compatibilité', extension: 'xls', outputExtension: 'txt', available: false, description: '.xls · adaptateur à venir', icon: 'X', tone: 'blue' },
  txt: { label: 'Texte comptable', extension: 'txt', outputExtension: 'txt', available: true, description: '.txt · séparateur tabulation', icon: 'T', tone: 'purple' }
});

let pendingExportRows = null;
let pendingExportReportType = null;
let fecPrepared = null;

function exportReportDefinition(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return EXPORT_REPORTS.find((report) => report.value === value || report.label.toLowerCase() === normalized)
    || EXPORT_REPORTS[0];
}

function exportFileBase(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 90) || 'export-comptable';
}

function exportPeriodOptions(selectedId) {
  const periods = appState.periods[appState.activeCompany] || [];
  const year = currentFiscalYear();
  const options = [{ value: 'YEAR', label: `${year.label} · toutes les périodes` }, ...periods.map((period) => ({ value: period.id, label: period.label }))];
  return options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === selectedId ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('');
}

function exportJournalOptions(selectedId) {
  const journals = currentAccountSetup().journals || [];
  return [`<option value="ALL" ${selectedId === 'ALL' ? 'selected' : ''}>Tous les journaux</option>`, ...journals.map((journal) => `<option value="${escapeHtml(journal.id)}" ${journal.id === selectedId ? 'selected' : ''}>${escapeHtml(journal.id)} · ${escapeHtml(journal.label)}</option>`)].join('');
}

function defaultExportDraft(reportType = null) {
  const company = appState.companies[appState.activeCompany];
  const period = currentPeriod();
  const report = exportReportDefinition(reportType);
  const extension = EXPORT_FORMATS.txt.extension;
  return {
    reportType: report.value,
    periodId: period.id,
    journalId: 'ALL',
    statusMode: 'CONTROL',
    format: 'txt',
    profile: 'cabinet',
    title: `${report.label} — ${period.label}`,
    filename: `${exportFileBase(company.code || company.shortName)}-${period.id}-${exportFileBase(report.label)}.${extension}`,
    recipient: '',
    purpose: '',
    sourcePreview: false,
    exportReady: false
  };
}

function buildExportPane() {
  const pane = document.createElement('div');
  pane.className = 'export-pane panel';
  pane.id = 'exportPane';
  pane.hidden = true;
  const recent = $('.recent-imports');
  recent?.parentElement?.insertBefore(pane, recent);
  renderExportAssistant();
  return pane;
}

function renderExportAssistant() {
  const pane = $('#exportPane');
  const company = appState.companies[appState.activeCompany];
  if (!pane || !company) return;
  const draft = appState.exportDraft || defaultExportDraft();
  const report = exportReportDefinition(draft.reportType);
  const format = EXPORT_FORMATS[draft.format] || EXPORT_FORMATS.txt;
  const fiscalYear = currentFiscalYear();
  const dossier = currentDossierCode(appState.activeCompany);
  const reportOptions = EXPORT_REPORTS.map((item) => `<option value="${item.value}" ${item.value === report.value ? 'selected' : ''}>${item.label}</option>`).join('');
  const formatOptions = Object.entries(EXPORT_FORMATS).map(([value, item]) => `<button class="export-format ${value === draft.format ? 'is-selected' : ''} ${item.available ? '' : 'is-unavailable'}" type="button" data-export-format="${value}" aria-pressed="${value === draft.format}" ${item.available ? '' : 'disabled aria-disabled="true" title="Adaptateur tableur prévu dans un prochain jalon"'}><span class="file-icon file-icon-${item.tone}">${item.icon}</span><span><strong>${item.label}</strong><small>${item.description}</small></span><span class="radio-check"></span></button>`).join('');
  const reviewHidden = draft.exportReady ? '' : ' hidden';
  const confirmDisabled = draft.exportReady ? '' : ' disabled';

  pane.innerHTML = `<div class="export-assistant-heading"><div><span class="eyebrow">ASSISTANT D’EXPORTATION</span><h2>Préparer la sortie comptable</h2><p>Complétez les informations demandées, vérifiez le périmètre, puis confirmez le téléchargement.</p></div><span class="status status-green"><i></i> ${escapeHtml(company.shortName)} · société active</span></div>
    <div class="export-progress" aria-label="Étapes de l’export"><span class="export-progress-step is-done"><b>1</b><span>Périmètre</span></span><i></i><span class="export-progress-step ${draft.exportReady ? 'is-done' : 'is-current'}"><b>2</b><span>Informations</span></span><i></i><span class="export-progress-step ${draft.exportReady ? 'is-current' : ''}"><b>3</b><span>Vérification</span></span></div>
    <form id="exportForm" class="export-form" novalidate>
      <section class="export-form-section"><div class="export-section-heading"><span class="export-section-number">1</span><div><h3>Définir le périmètre</h3><p>Le contexte est affiché avant toute production du fichier.</p></div><span class="export-context-lock">Société verrouillée</span></div>
        <div class="export-context-grid"><div><small>SOCIÉTÉ ACTIVE</small><strong>${escapeHtml(company.name)}</strong><span>${escapeHtml(company.ifu || 'IFU non renseigné')} · XOF</span></div><div><small>DOSSIER</small><strong>${escapeHtml(dossier)}</strong><span>${escapeHtml(company.activity || 'Activité non renseignée')}</span></div><div><small>EXERCICE</small><strong>${escapeHtml(fiscalYear.label)}</strong><span>${escapeHtml(displayDate(company.exerciseStart))} — ${escapeHtml(displayDate(company.exerciseEnd))}</span></div></div>
        <div class="export-fields-grid"><label class="field"><span>État à exporter <b>*</b></span><select id="exportReportType" name="reportType" required>${reportOptions}</select></label><label class="field"><span>Période <b>*</b></span><select id="exportPeriod" name="periodId" required>${exportPeriodOptions(draft.periodId)}</select></label><label class="field"><span>Journaux <b>*</b></span><select id="exportJournal" name="journalId" required>${exportJournalOptions(draft.journalId)}</select></label><label class="field"><span>Niveau de données <b>*</b></span><select id="exportStatusMode" name="statusMode" required><option value="CONTROL" ${draft.statusMode === 'CONTROL' ? 'selected' : ''}>Contrôle · brouillons et écritures en revue</option><option value="OFFICIAL" ${draft.statusMode === 'OFFICIAL' ? 'selected' : ''}>Officiel · validées ou clôturées uniquement</option></select></label></div>
        <p class="export-field-help"><span>i</span> Une édition officielle exclut les brouillons et les écritures en revue. Pour changer de société, utilisez le sélecteur de société avant de recommencer.</p>
      </section>
      <section class="export-form-section"><div class="export-section-heading"><span class="export-section-number">2</span><div><h3>Compléter les informations de sortie</h3><p>Ces informations seront reprises dans le fichier et dans l’historique des échanges.</p></div><span class="export-required-note"><b>*</b> obligatoire</span></div>
        <div class="export-fields-grid export-output-fields"><label class="field field-span-2"><span>Intitulé de l’export <b>*</b></span><input id="exportTitle" name="title" type="text" value="${escapeHtml(draft.title)}" placeholder="Ex. Balance à transmettre au cabinet" required><small class="field-help">Donnez un nom explicite à cette sortie.</small></label><label class="field field-span-2"><span>Nom du fichier <b>*</b></span><input id="exportFilename" name="filename" type="text" value="${escapeHtml(draft.filename)}" placeholder="balance-juin-2025.txt" required><small class="field-help">L’extension sera ajustée selon le format choisi.</small></label><label class="field"><span>Destinataire</span><input id="exportRecipient" name="recipient" type="text" value="${escapeHtml(draft.recipient || '')}" placeholder="Ex. Cabinet Kora"></label><label class="field"><span>Objet / remarque</span><input id="exportPurpose" name="purpose" type="text" value="${escapeHtml(draft.purpose || '')}" placeholder="Ex. Préparation de la clôture"></label></div>
      </section>
      <section class="export-form-section"><div class="export-section-heading"><span class="export-section-number">3</span><div><h3>Choisir le format et le profil</h3><p>Le profil standard conserve les colonnes utiles au travail du cabinet.</p></div></div><div class="export-format-grid">${formatOptions}</div><div class="export-fields-grid export-format-fields"><label class="field"><span>Profil de colonnes <b>*</b></span><select id="exportProfile" name="profile" required><option value="cabinet" ${draft.profile === 'cabinet' ? 'selected' : ''}>Cabinet · complet</option><option value="saisie" ${draft.profile === 'saisie' ? 'selected' : ''}>Saisie · import comptable</option><option value="lecture" ${draft.profile === 'lecture' ? 'selected' : ''}>Lecture · présentation</option></select></label><div class="export-format-selected"><small>FORMAT RETENU</small><strong>${format.label}</strong><span>${format.description}</span></div></div></section>
      <div class="export-review" id="exportReview"${reviewHidden}></div>
      <div class="export-footer"><span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/></svg> Aucun fichier n’est créé avant votre vérification.</span><div class="export-footer-actions"><button class="button button-secondary" type="button" data-action="prepare-export">Vérifier l’export</button><button class="button button-primary" id="confirmExportButton" type="button" data-action="confirm-export"${confirmDisabled}>Télécharger le fichier <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 11l4 4 4-4M5 20h14"/></svg></button></div></div>
    </form>`;
  if (draft.exportReady) renderExportReview(buildExportData(draft));
}

function fecCompactDate(value) {
  return String(value || '').slice(0, 10).replace(/-/g, '');
}

function fecFileBase(company, draft) {
  const ifu = String(company.ifu || '').trim().replace(/[^A-Za-z0-9]/g, '');
  return `FEC_${ifu}_${fecCompactDate(draft.closureDate)}`;
}

function defaultFecDraft() {
  const company = appState.companies[appState.activeCompany];
  const year = currentFiscalYear();
  const setup = currentAccountSetup();
  return {
    fiscalYear: String(year.id),
    regime: setup.regime === 'SMT' ? 'SMT' : 'NORMAL',
    mode: 'OFFICIAL_REPORT',
    startDate: company.exerciseStart || `${year.id}-01-01`,
    endDate: company.exerciseEnd || `${year.id}-12-31`,
    closureDate: company.exerciseEnd || `${year.id}-12-31`,
    separator: 'TAB',
    encoding: 'ISO-8859-15',
    maxRecords: 0
  };
}

function buildFecPane() {
  const pane = document.createElement('div');
  pane.className = 'fec-pane panel';
  pane.id = 'fecPane';
  pane.hidden = true;
  const recent = $('.recent-imports');
  recent?.parentElement?.insertBefore(pane, recent);
  renderFecAssistant();
  return pane;
}

function renderFecArchiveVerification(result) {
  const container = $('#fecArchiveVerificationResult');
  if (!container) return;
  const issueList = [...result.errors.map((message) => `<li class="fec-archive-error"><span>×</span>${escapeHtml(message)}</li>`), ...result.warnings.map((message) => `<li class="fec-archive-warning"><span>!</span>${escapeHtml(message)}</li>`)].join('');
  container.innerHTML = `<div class="fec-archive-result ${result.valid ? 'is-valid' : 'is-invalid'}"><div class="fec-archive-result-heading"><span class="fec-archive-result-icon">${result.valid ? '✓' : '×'}</span><div><strong>${result.valid ? 'Paquet intègre' : 'Paquet à contrôler'}</strong><p>${result.valid ? 'Les fichiers décrits dans le manifeste correspondent aux empreintes recalculées.' : 'Le paquet ne doit pas être remis avant résolution des anomalies.'}</p></div><span class="fec-archive-hash" title="${escapeHtml(result.packageHash)}">SHA-256 · ${escapeHtml(result.packageHash.slice(0, 16))}…</span></div><div class="fec-archive-stats"><span><small>FICHIERS</small><strong>${result.fileCount}</strong></span><span><small>FICHIERS VÉRIFIÉS</small><strong>${result.checkedCount}</strong></span><span><small>ERREURS</small><strong>${result.errors.length}</strong></span><span><small>AVERTISSEMENTS</small><strong>${result.warnings.length}</strong></span></div>${issueList ? `<ul class="fec-archive-issues">${issueList}</ul>` : '<div class="fec-archive-clean">✓ Toutes les empreintes correspondent.</div>'}</div>`;
  container.removeAttribute('hidden');
}

async function verifyFecArchiveFile(file) {
  if (!file) return;
  const container = $('#fecArchiveVerificationResult');
  if (container) { container.removeAttribute('hidden'); container.innerHTML = '<div class="fec-archive-loading">Vérification du paquet en cours…</div>'; }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const files = extractZipArchive(bytes);
    const fileMap = new Map(files.map((item) => [item.name, item.bytes]));
    const manifestEntry = files.find((item) => item.name.endsWith('.manifest.txt'));
    const errors = [];
    const warnings = [];
    if (!manifestEntry) throw new Error('Le manifeste d’empreintes est absent du paquet.');
    const manifestEncoding = manifestEntry.bytes[0] === 0xd4 ? 'EBCDIC' : 'ISO-8859-15';
    const manifestText = decodeFecText(manifestEntry.bytes, manifestEncoding);
    const manifestLines = manifestText.split(/\r\n|\n|\r/);
    const headerIndex = manifestLines.findIndex((line) => line === 'FICHIER\tSHA256\tOCTETS');
    if (headerIndex < 0) throw new Error('Le manifeste ne contient pas la table des empreintes attendue.');
    const expected = manifestLines.slice(headerIndex + 1).filter((line) => line && !line.startsWith('STATUT\t')).map((line) => line.split('\t')).filter((row) => row.length >= 3 && /^[a-f0-9]{64}$/i.test(row[1])).map(([name, sha256, size]) => ({ name, sha256: sha256.toLowerCase(), size: Number(size) }));
    if (!expected.length) errors.push('Aucun fichier n’est décrit dans le manifeste.');
    const checked = await Promise.all(expected.map(async (item) => {
      const stored = fileMap.get(item.name);
      if (!stored) { errors.push(`Fichier manquant dans le paquet : ${item.name}.`); return false; }
      const actualHash = await sha256Hex(stored);
      if (actualHash !== item.sha256) { errors.push(`Empreinte incorrecte pour ${item.name}.`); return false; }
      if (stored.length !== item.size) { errors.push(`Taille incorrecte pour ${item.name}.`); return false; }
      return true;
    }));
    const packageHash = await sha256Hex(bytes);
    const localArchive = (appState.fecArchives || []).find((archive) => archive.packageFile === file.name || archive.packageSha256 === packageHash);
    if (localArchive && localArchive.packageSha256 !== packageHash) errors.push('L’empreinte du paquet ne correspond pas à celle conservée dans le dossier.');
    if (!localArchive) warnings.push('Ce paquet ne correspond pas à une archive scellée conservée dans ce navigateur.');
    const fecFile = files.find((item) => /^FEC_.*\.txt$/i.test(item.name) && !item.name.endsWith('.notice.txt') && !item.name.endsWith('.rapport.txt') && !item.name.endsWith('.manifest.txt'));
    if (!fecFile) errors.push('Aucun fichier FEC principal n’a été trouvé.');
    renderFecArchiveVerification({ valid: errors.length === 0, errors, warnings, packageHash, fileCount: files.length, checkedCount: checked.filter(Boolean).length });
  } catch (error) {
    renderFecArchiveVerification({ valid: false, errors: [error.message || 'Le paquet ne peut pas être vérifié.'], warnings: [], packageHash: '', fileCount: 0, checkedCount: 0 });
  }
}

function renderFecHistory(returnOnly = false) {
  const history = (appState.fecHistory || []).filter((item) => item.companyId === appState.activeCompany).slice(0, 5);
  const html = `<section class="fec-history-panel"><div class="fec-history-heading"><div><span class="eyebrow">CONSERVATION DU DOSSIER</span><h3>Derniers FEC générés</h3></div><span>${history.length} fichier${history.length > 1 ? 's' : ''}</span></div>${history.length ? `<div class="fec-history-list">${history.map((item) => `<div class="fec-history-row"><span class="fec-history-icon">FEC</span><div><strong>${escapeHtml(item.packageFile || `FEC_${item.ifu}_${fecCompactDate(item.closureDate)}.zip`)}</strong><small>${escapeHtml(item.regime === 'SMT' ? 'SMT' : 'Système normal')} · ${escapeHtml(item.demo ? 'Jeu d’essai' : item.mode === 'DIAGNOSTIC' ? 'Diagnostic provisoire' : 'Officiel')} · ${escapeHtml(String(item.lineCount))} lignes</small></div><span class="fec-history-seal">Scellé</span><span class="fec-history-date">${escapeHtml(new Date(item.createdAt).toLocaleDateString('fr-FR'))}</span></div>`).join('')}</div>` : '<p class="fec-history-empty">Aucun FEC n’a encore été généré pour cette société.</p>'}</section>`;
  if (returnOnly) return html;
  const panel = $('#fecHistoryPanel');
  if (panel) panel.outerHTML = html.replace('<section class="fec-history-panel">', '<section class="fec-history-panel" id="fecHistoryPanel">');
  return html;
}

function renderFecAssistant() {
  const pane = $('#fecPane');
  const company = appState.companies[appState.activeCompany];
  if (!pane || !company) return;
  const draft = appState.fecDraft || defaultFecDraft();
  const year = currentFiscalYear();
  const sourceType = draft.mode === 'DIAGNOSTIC' ? 'Diagnostic provisoire' : draft.mode === 'OFFICIAL_STRICT' ? 'FEC officiel strict' : 'FEC officiel + rapport';
  const fieldCount = draft.regime === 'SMT' ? 21 : 18;
  const result = fecPrepared ? renderFecResult(fecPrepared, true) : '';
  const fiscalYearOptions = Object.values(appState.fiscalYears || {}).filter((item) => item && item.id).map((item) => `<option value="${escapeHtml(item.id)}" ${String(item.id) === String(draft.fiscalYear) ? 'selected' : ''}>${escapeHtml(item.label || `Exercice ${item.id}`)}</option>`).join('') || `<option value="${escapeHtml(year.id)}">${escapeHtml(year.label)}</option>`;
  pane.innerHTML = `<div class="fec-heading"><div><span class="eyebrow">EXPORT FISCAL DGID · BÉNIN</span><h2>Fichier des Écritures Comptables</h2><p>Préparez le FEC selon l’arrêté ministériel du 23 avril 2020, puis contrôlez-le avant toute remise.</p></div><span class="fec-law-badge">Arrêté FEC béninois</span></div>
    <div class="fec-warning"><span class="fec-warning-icon">!</span><div><strong>Une sortie fiscale, pas une simple balance</strong><p>Le FEC reprend les écritures validées, les reports à nouveau et les opérations détaillées. Les centralisations et les soldes des comptes de charges et de produits sont exclus.</p></div><button class="button button-secondary button-small" type="button" data-action="run-fec-demo">Tester un jeu annuel</button></div>
    <div class="fec-context-grid"><div><small>SOCIÉTÉ ACTIVE</small><strong>${escapeHtml(company.name)}</strong><span>IFU · ${escapeHtml(company.ifu || 'À renseigner')}</span></div><div><small>EXERCICE</small><strong>${escapeHtml(year.label)}</strong><span>${escapeHtml(displayDate(company.exerciseStart))} — ${escapeHtml(displayDate(company.exerciseEnd))}</span></div><div><small>STRUCTURE</small><strong>Fichier plat TXT</strong><span>${fieldCount} champs · ${escapeHtml(sourceType)}</span></div></div>
    <form id="fecForm" class="fec-form" novalidate>
      <section class="fec-form-section"><div class="fec-section-heading"><span class="fec-section-number">1</span><div><h3>Définir le périmètre fiscal</h3><p>Le fichier est rattaché à un exercice et à la période soumise à vérification.</p></div><span class="fec-locked-context">Société verrouillée</span></div><div class="fec-fields-grid"><label class="field"><span>Exercice <b>*</b></span><select id="fecFiscalYear" name="fiscalYear" required>${fiscalYearOptions}</select></label><label class="field"><span>Régime comptable <b>*</b></span><select id="fecRegime" name="regime" required><option value="NORMAL" ${draft.regime === 'NORMAL' ? 'selected' : ''}>Système normal · 18 champs</option><option value="SMT" ${draft.regime === 'SMT' ? 'selected' : ''}>SMT · 21 champs</option></select></label><label class="field"><span>Début de la période contrôlée <b>*</b></span><input id="fecStartDate" name="startDate" type="date" value="${escapeHtml(draft.startDate)}" required></label><label class="field"><span>Fin de la période contrôlée <b>*</b></span><input id="fecEndDate" name="endDate" type="date" value="${escapeHtml(draft.endDate)}" required></label><label class="field"><span>Date de clôture de l’exercice <b>*</b></span><input id="fecClosureDate" name="closureDate" type="date" value="${escapeHtml(draft.closureDate)}" required><small class="field-help">Utilisée dans le nom du fichier.</small></label><label class="field"><span>Mode de préparation <b>*</b></span><select id="fecMode" name="mode" required><option value="OFFICIAL_STRICT" ${draft.mode === 'OFFICIAL_STRICT' ? 'selected' : ''}>FEC officiel strict</option><option value="OFFICIAL_REPORT" ${draft.mode === 'OFFICIAL_REPORT' ? 'selected' : ''}>FEC officiel + rapport</option><option value="DIAGNOSTIC" ${draft.mode === 'DIAGNOSTIC' ? 'selected' : ''}>Diagnostic provisoire · non transmissible</option></select></label></div></section>
      <section class="fec-form-section"><div class="fec-section-heading"><span class="fec-section-number">2</span><div><h3>Paramètres techniques de l’arrêté</h3><p>Ces paramètres seront repris dans le descriptif technique accompagnant le FEC.</p></div></div><div class="fec-fields-grid"><label class="field"><span>Séparateur des champs <b>*</b></span><select id="fecSeparator" name="separator" required><option value="TAB" ${draft.separator === 'TAB' ? 'selected' : ''}>Tabulation</option><option value="SEMICOLON" ${draft.separator === 'SEMICOLON' ? 'selected' : ''}>Point-virgule</option></select></label><label class="field"><span>Jeu de caractères <b>*</b></span><select id="fecEncoding" name="encoding" required><option value="ISO-8859-15" ${draft.encoding === 'ISO-8859-15' ? 'selected' : ''}>ISO 8859-15</option><option value="ASCII" ${draft.encoding === 'ASCII' ? 'selected' : ''}>ASCII</option><option value="EBCDIC" ${draft.encoding === 'EBCDIC' ? 'selected' : ''}>EBCDIC</option></select></label><label class="field"><span>Découpage par volume</span><input id="fecMaxRecords" name="maxRecords" type="number" min="0" step="1" value="${escapeHtml(draft.maxRecords || 0)}"><small class="field-help">0 = un fichier unique. Sinon, nombre maximal de lignes par fichier.</small></label><div class="fec-file-preview"><small>NOM PRÉVISIONNEL</small><strong id="fecPreviewFilename">FEC_${escapeHtml(company.ifu || 'IFU')}_${escapeHtml(fecCompactDate(draft.closureDate))}.txt</strong><span>Le suffixe _1, _2… est ajouté si le volume est découpé.</span></div></div><p class="fec-technical-note"><span>i</span> Les 18 premiers champs suivent exactement l’ordre de l’article 5. En SMT, les champs <b>Date Règlement</b>, <b>Mode Règlement</b> et <b>NatOp</b> sont ajoutés.</p></section>
      <div class="fec-result" id="fecResult">${result}</div>
      <div class="fec-footer"><span><span class="fec-shield">✓</span> Le paquet inclut le FEC, sa notice, son rapport et son manifeste d’empreintes.</span><div class="fec-footer-actions"><button class="button button-secondary" type="button" data-action="check-fec">Contrôler le FEC</button><button class="button button-primary" id="generateFecButton" type="button" data-action="generate-fec" disabled>Générer le paquet</button></div></div>
    </form><div class="fec-archive-verify"><div class="fec-archive-verify-heading"><div><span class="eyebrow">VÉRIFICATION D’UNE REMISE</span><h3>Contrôler un paquet FEC archivé</h3><p>Sélectionnez un paquet ZIP pour recalculer les empreintes de ses fichiers avant de le remettre.</p></div><input id="fecArchiveFile" type="file" accept=".zip" hidden><label class="button button-secondary button-small" for="fecArchiveFile">Choisir un paquet ZIP</label></div><div id="fecArchiveVerificationResult" hidden></div></div><div id="fecHistoryPanel">${renderFecHistory(true)}</div>`;
  if (fecPrepared) renderFecResult(fecPrepared);
}

function invalidateFecPreview() {
  fecPrepared = null;
  $('#fecResult').textContent = '';
  $('#generateFecButton')?.setAttribute('disabled', '');
  const company = appState.companies[appState.activeCompany];
  const closureDate = $('#fecClosureDate')?.value;
  const preview = $('#fecPreviewFilename');
  if (preview && company) preview.textContent = `FEC_${String(company.ifu || 'IFU').replace(/[^A-Za-z0-9]/g, '')}_${fecCompactDate(closureDate)}.txt`;
}

function readFecForm() {
  const form = $('#fecForm');
  if (!form) return null;
  const data = new FormData(form);
  return {
    ...(appState.fecDraft || defaultFecDraft()),
    fiscalYear: String(data.get('fiscalYear') || currentFiscalYear().id),
    regime: String(data.get('regime') || 'NORMAL'),
    mode: String(data.get('mode') || 'OFFICIAL_REPORT'),
    startDate: String(data.get('startDate') || ''),
    endDate: String(data.get('endDate') || ''),
    closureDate: String(data.get('closureDate') || ''),
    separator: String(data.get('separator') || 'TAB'),
    encoding: String(data.get('encoding') || 'ISO-8859-15'),
    maxRecords: Math.max(0, Number(data.get('maxRecords') || 0))
  };
}

function fecStatusesForMode(mode) {
  return mode === 'DIAGNOSTIC'
    ? [OPERATION_STATES.IMPUTED, OPERATION_STATES.TO_REVIEW, OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED]
    : [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED];
}

function appendFecIssue(prepared, issue) {
  const target = issue.severity === 'WARNING' ? prepared.warnings : prepared.errors;
  target.push(issue);
  prepared.valid = prepared.errors.length === 0;
}

function prepareFecFromForm() {
  const form = $('#fecForm');
  if (!form) return null;
  if (!form.reportValidity()) {
    showToast('Complétez les paramètres du FEC avant le contrôle.');
    return null;
  }
  const draft = readFecForm();
  const company = appState.companies[appState.activeCompany];
  const setup = currentAccountSetup();
  const year = appState.fiscalYears[appState.activeCompany] || currentFiscalYear();
  const selectedYear = String(draft.fiscalYear || year.id);
  if (!company.ifu?.trim()) {
    showToast('L’IFU de la société est obligatoire pour nommer le FEC.');
    return null;
  }
  if (draft.startDate > draft.endDate) {
    showToast('La fin de la période contrôlée doit être postérieure au début.');
    return null;
  }
  const prepared = prepareFecExport({ entries: appState.integratedEntries, companyId: appState.activeCompany, fiscalYear: draft.fiscalYear, startDate: draft.startDate, endDate: draft.endDate, regime: draft.regime, journals: setup.journals, accounts: setup.accounts, thirdParties: currentThirdParties(), payments: appState.payments, statuses: fecStatusesForMode(draft.mode), diagnostic: draft.mode === 'DIAGNOSTIC' });
  if (draft.startDate < `${selectedYear}-01-01` || draft.endDate > `${selectedYear}-12-31`) appendFecIssue(prepared, { code: 'FEC_PERIOD_SCOPE', severity: 'ERROR', message: 'La période contrôlée doit rester comprise dans l’exercice sélectionné.' });
  if (draft.mode !== 'DIAGNOSTIC' && prepared.pendingCount > 0) appendFecIssue(prepared, { code: 'FEC_PENDING_ENTRIES', severity: 'ERROR', message: `${prepared.pendingCount} écriture(s) de la période ne sont pas encore validées et ne peuvent pas être remises dans un FEC officiel.` });
  if (draft.closureDate < draft.startDate || draft.closureDate > `${selectedYear}-12-31` || draft.closureDate < `${selectedYear}-01-01`) appendFecIssue(prepared, { code: 'FEC_CLOSURE_DATE_SCOPE', severity: 'ERROR', message: 'La date de clôture doit correspondre à l’exercice sélectionné.' });
  prepared.fecDraft = draft;
  prepared.companyName = company.name;
  prepared.ifu = company.ifu;
  prepared.mode = draft.mode;
  const delimiter = draft.separator === 'SEMICOLON' ? ';' : '\t';
  const serialized = exportFecTxt({ prepared, delimiter });
  const fileValidation = validateFecTxt(serialized, { regime: draft.regime, delimiter, allowProvisional: draft.mode === 'DIAGNOSTIC' });
  prepared.fileValidation = fileValidation;
  if (fileValidation.errors.length && prepared.errors.length === 0) appendFecIssue(prepared, { code: 'FEC_SERIALIZED_INVALID', severity: 'ERROR', message: `${fileValidation.errors.length} anomalie(s) ont été détectées dans le fichier FEC sérialisé.` });
  appState.fecDraft = draft;
  fecPrepared = prepared;
  renderFecResult(prepared);
  persistAppState();
  return prepared;
}

function fecCorrectionEntry(entryId) {
  return appState.integratedEntries.find((entry) => entry.id === entryId && entry.companyId === appState.activeCompany)
    || appState.recentEntries.find((entry) => entry.id === entryId && entry.companyId === appState.activeCompany);
}

function renderFecCorrectionOptions(selectedAccountId, selectedThirdPartyId) {
  const accounts = currentAccountSetup().accounts || [];
  const parties = currentThirdParties().filter((party) => party.active !== false);
  const accountOptions = accounts.map((account) => `<option value="${escapeHtml(account.id)}" ${account.id === selectedAccountId ? 'selected' : ''}>${escapeHtml(account.id)} · ${escapeHtml(account.label)}</option>`).join('');
  const partyOptions = [`<option value="">Aucun tiers / non applicable</option>`, ...parties.map((party) => `<option value="${escapeHtml(party.id)}" ${party.id === selectedThirdPartyId ? 'selected' : ''}>${escapeHtml(party.name)} · ${escapeHtml(party.auxiliaryAccountId || '')}</option>`)].join('');
  return { accountOptions, partyOptions };
}

function openFecCorrection(entryId, lineNumber = 1) {
  const entry = fecCorrectionEntry(entryId);
  if (!entry) { showToast('Écriture FEC introuvable dans la société active.'); return; }
  const lineIndex = Math.max(0, Number(lineNumber || 1) - 1);
  const line = entry.lines?.[lineIndex] || entry.lines?.[0];
  if (!line) { showToast('La ligne comptable à corriger est introuvable.'); return; }
  const thirdParty = currentThirdParties().find((party) => party.id === line.thirdPartyId || party.auxiliaryAccountId === line.auxiliaryAccountId || party.auxiliaryAccountId === line.accountId);
  const options = renderFecCorrectionOptions(line.accountId, thirdParty?.id || '');
  $('#fecCorrectionEntryId').value = entry.id;
  $('#fecCorrectionLineNumber').value = String(lineIndex + 1);
  $('#fecCorrectionReference').value = entry.reference || '';
  $('#fecCorrectionPieceDate').value = String(entry.pieceDate || line.pieceDate || entry.date || '').slice(0, 10);
  const validationInput = $('#fecCorrectionValidationDate');
  validationInput.value = String(entry.validatedAt || entry.dateValid || '').slice(0, 10);
  validationInput.required = entry.status === OPERATION_STATES.VALIDATED || entry.status === OPERATION_STATES.CLOSED;
  $('#fecCorrectionLabel').value = entry.label || line.entryLabel || line.label || '';
  $('#fecCorrectionAccount').innerHTML = options.accountOptions;
  $('#fecCorrectionThirdParty').innerHTML = options.partyOptions;
  $('#fecCorrectionThirdParty').value = thirdParty?.id || '';
  $('#fecCorrectionSettlementDate').value = String(line.settlementDate || entry.settlementDate || '').slice(0, 10);
  $('#fecCorrectionSettlementMode').value = line.settlementMode || entry.settlementMode || '';
  $('#fecCorrectionReason').value = '';
  $('#fecCorrectionContext').textContent = `${entry.journalId || '—'} · ${entry.reference || entry.id} · ligne ${lineIndex + 1}`;
  $('#fecCorrectionStatus').textContent = entry.status === OPERATION_STATES.VALIDATED || entry.status === OPERATION_STATES.CLOSED ? 'Écriture validée' : 'Écriture à contrôler';
  openModal('fecCorrectionModal');
}

function saveFecCorrection(event) {
  event.preventDefault();
  if (!requirePermission(USER_PERMISSIONS.ENTRIES_CORRECT)) return;
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const entryId = $('#fecCorrectionEntryId').value;
  const lineIndex = Math.max(0, Number($('#fecCorrectionLineNumber').value || 1) - 1);
  const entry = fecCorrectionEntry(entryId);
  const sourceLines = entry?.lines;
  if (!entry || !Array.isArray(sourceLines) || !sourceLines[lineIndex]) { showToast('Écriture FEC introuvable.'); return; }
  const partyId = $('#fecCorrectionThirdParty').value;
  const party = currentThirdParties().find((item) => item.id === partyId);
  const pieceDate = $('#fecCorrectionPieceDate').value;
  const validationDate = $('#fecCorrectionValidationDate').value;
  const settlementDate = $('#fecCorrectionSettlementDate').value;
  const settlementMode = $('#fecCorrectionSettlementMode').value.trim();
  const nextLine = { ...sourceLines[lineIndex], accountId: $('#fecCorrectionAccount').value, pieceDate, thirdPartyId: party?.id || undefined, auxiliaryAccountId: party?.auxiliaryAccountId || undefined, auxiliaryLabel: party?.name || undefined, settlementDate: settlementDate || undefined, settlementMode: settlementMode || undefined };
  const updatedEntry = { ...entry, reference: $('#fecCorrectionReference').value.trim(), pieceDate, label: $('#fecCorrectionLabel').value.trim(), lines: sourceLines.map((line, index) => index === lineIndex ? nextLine : line) };
  if (validationDate) updatedEntry.validatedAt = `${validationDate}T12:00:00.000Z`;
  const updateCollection = (collection) => collection.map((item) => item.id === entryId && item.companyId === appState.activeCompany ? { ...item, ...updatedEntry, lines: updatedEntry.lines } : item);
  appState.integratedEntries = updateCollection(appState.integratedEntries);
  appState.recentEntries = updateCollection(appState.recentEntries);
  const reason = $('#fecCorrectionReason').value.trim();
  appState.auditEvents.push({ id: `audit-${Date.now()}`, action: 'FEC_SOURCE_CORRECTION', companyId: appState.activeCompany, entryId, line: lineIndex + 1, reason, at: new Date().toISOString(), userId: 'claire-dossou' });
  persistAppState();
  closeModal();
  renderEntryQueue();
  renderIntegratedJournal();
  renderFecCorrectionAfterSave();
  showToast('Donnée source corrigée. Le précontrôle FEC a été relancé.');
}

function renderFecCorrectionAfterSave() {
  if ($('#fecForm')) prepareFecFromForm();
}

function runFecAnnualDemo() {
  const company = appState.companies[appState.activeCompany];
  const draft = readFecForm() || defaultFecDraft();
  const setup = currentAccountSetup();
  const parties = currentThirdParties();
  const client = parties.find((party) => party.type === THIRD_PARTY_TYPES.CLIENT && party.active !== false);
  const supplier = parties.find((party) => party.type === THIRD_PARTY_TYPES.SUPPLIER && party.active !== false);
  const entries = createFecAnnualDemoEntries({ companyId: appState.activeCompany, fiscalYear: draft.fiscalYear, client, supplier });
  const prepared = prepareFecExport({ entries, companyId: appState.activeCompany, fiscalYear: draft.fiscalYear, startDate: `${draft.fiscalYear}-01-01`, endDate: `${draft.fiscalYear}-12-31`, regime: draft.regime, journals: setup.journals, accounts: setup.accounts, thirdParties: parties, payments: [], statuses: [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED] });
  const demoDraft = { ...draft, startDate: `${draft.fiscalYear}-01-01`, endDate: `${draft.fiscalYear}-12-31`, closureDate: `${draft.fiscalYear}-12-31`, demo: true };
  prepared.fecDraft = demoDraft;
  prepared.companyName = company.name;
  prepared.ifu = company.ifu;
  prepared.mode = demoDraft.mode;
  prepared.demo = true;
  const delimiter = demoDraft.separator === 'SEMICOLON' ? ';' : '\t';
  const content = exportFecTxt({ prepared, delimiter });
  prepared.fileValidation = validateFecTxt(content, { regime: demoDraft.regime, delimiter });
  if (!prepared.fileValidation.valid && prepared.errors.length === 0) appendFecIssue(prepared, { code: 'FEC_SERIALIZED_INVALID', severity: 'ERROR', message: `${prepared.fileValidation.errors.length} anomalie(s) ont été détectées dans le jeu annuel sérialisé.` });
  appState.fecDraft = demoDraft;
  fecPrepared = prepared;
  renderFecResult(prepared);
  showToast(`Jeu annuel de test chargé : ${prepared.entryCount} écritures et ${prepared.lineCount} lignes, sans modification de votre comptabilité.`);
}

function fecIssueLabel(issue) {
  return `${issue.severity === 'WARNING' ? 'Avertissement' : 'Blocage'} · ${issue.message}`;
}

function renderFecResult(prepared, returnOnly = false) {
  if (!prepared) return '';
  const draft = prepared.fecDraft || appState.fecDraft || defaultFecDraft();
  const official = draft.mode !== 'DIAGNOSTIC';
  const canGenerate = (prepared.valid || !official || draft.mode === 'OFFICIAL_REPORT') && can(USER_PERMISSIONS.EXPORTS_CREATE);
  const demoLabel = prepared.demo ? 'Jeu annuel de test : aucune donnée de votre comptabilité n’a été modifiée.' : '';
  const fileIssues = prepared.fileValidation?.errors || [];
  const fileWarnings = prepared.fileValidation?.warnings || [];
  const issueItems = [...prepared.errors, ...fileIssues, ...prepared.warnings, ...fileWarnings].slice(0, 60).map((issue) => { const correction = issue.entryId ? `<button class="fec-correction-button" type="button" data-action="open-fec-correction" data-fec-entry-id="${escapeHtml(issue.entryId)}" data-fec-line="${escapeHtml(issue.line || '1')}">Corriger</button>` : ''; return `<li class="fec-issue-${issue.severity === 'WARNING' ? 'warning' : 'error'}"><span>${issue.severity === 'WARNING' ? '!' : '×'}</span><span class="fec-issue-message">${escapeHtml(fecIssueLabel(issue))}</span>${correction}</li>`; }).join('');
  const previewRows = prepared.records.slice(0, 8).map((record) => `<tr><td>${escapeHtml(record.values.CodeJournal)}</td><td>${escapeHtml(record.values.NumEcriture)}</td><td>${escapeHtml(record.values.DateEcriture)}</td><td><b>${escapeHtml(record.values.NumCompte)}</b></td><td>${escapeHtml(record.values.RefPiece)}</td><td class="align-right">${escapeHtml(record.values.MontDebit)}</td><td class="align-right">${escapeHtml(record.values.MontCredit)}</td></tr>`).join('');
  const html = `<section class="fec-control-result"><div class="fec-result-heading"><div><span class="eyebrow">RÉSULTAT DU PRÉCONTRÔLE</span><h3>${prepared.demo ? 'Jeu annuel contrôlé' : prepared.valid ? 'FEC contrôlé' : 'Corrections nécessaires avant remise'}</h3><p>${escapeHtml(demoLabel || (official ? 'Le mode officiel ne produit aucun FEC tant qu’un blocage subsiste.' : 'Ce diagnostic peut être généré pour préparer les corrections, mais reste non transmissible.'))}</p></div><span class="fec-result-status ${prepared.valid ? 'is-valid' : 'is-invalid'}"><i></i>${prepared.valid ? 'Aucune erreur bloquante' : `${prepared.errors.length} blocage${prepared.errors.length > 1 ? 's' : ''}`}</span></div><div class="fec-summary"><span><small>ÉCRITURES</small><strong>${prepared.entryCount}</strong><em>retenues</em></span><span><small>LIGNES</small><strong>${prepared.lineCount}</strong><em>enregistrements</em></span><span><small>EXCLUES</small><strong>${prepared.excludedEntries.length}</strong><em>centralisation / résultat</em></span><span><small>EN ATTENTE</small><strong>${prepared.pendingCount}</strong><em>non validées</em></span></div>${issueItems ? `<div class="fec-issues"><strong>Anomalies et avertissements</strong><ul>${issueItems}</ul><button class="text-button" type="button" data-action="open-view" data-view="entry">Compléter les écritures sources <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></div>` : '<div class="fec-clean"><span>✓</span><strong>Le périmètre ne présente aucune anomalie bloquante.</strong></div>'}<div class="fec-preview-table"><div class="fec-preview-table-heading"><strong>Premières lignes du fichier</strong><span>${prepared.lineCount} ligne${prepared.lineCount > 1 ? 's' : ''} · ${prepared.totalDebit.toFixed(2).replace('.', ',')} débit / ${prepared.totalCredit.toFixed(2).replace('.', ',')} crédit</span></div><div class="table-wrap"><table><thead><tr><th>JOURNAL</th><th>N° ÉCRITURE</th><th>DATE</th><th>COMPTE</th><th>PIÈCE</th><th class="align-right">DÉBIT</th><th class="align-right">CRÉDIT</th></tr></thead><tbody>${previewRows || '<tr><td colspan="7" class="fec-empty">Aucune ligne dans la période sélectionnée.</td></tr>'}</tbody></table></div></div></section>`;
  if (returnOnly) return html;
  const result = $('#fecResult');
  if (result) result.innerHTML = html;
  const button = $('#generateFecButton');
  if (button) { button.disabled = !canGenerate; button.textContent = prepared.demo ? 'Exporter le jeu d’essai' : draft.mode === 'DIAGNOSTIC' ? 'Générer le diagnostic' : (draft.mode === 'OFFICIAL_REPORT' && !prepared.valid ? 'Générer le rapport' : 'Générer le paquet'); }
  return html;
}

function downloadBytes(filename, bytes, type = 'application/octet-stream') {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(bytes) {
  if (!globalThis.crypto?.subtle) throw new Error('Le navigateur ne permet pas de calculer l’empreinte SHA-256.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(digest));
}

function buildFecManifest({ base, draft, company, prepared, payloads, packageHash = '' }) {
  const delimiter = draft.separator === 'SEMICOLON' ? 'POINT-VIRGULE' : 'TABULATION';
  const rows = payloads.map((payload) => `${payload.name}\t${payload.sha256}\t${payload.bytes.length}`);
  return [
    'MANIFESTE DU PAQUET FEC',
    `SOCIETE\t${String(company.name).replace(/[\t\r\n]/g, ' ')}`,
    `IFU\t${company.ifu}`,
    `EXERCICE\t${draft.fiscalYear}`,
    `PERIODE_CONTROLEE\t${draft.startDate} — ${draft.endDate}`,
    `DATE_CLOTURE\t${draft.closureDate}`,
    `REGIME\t${draft.regime === 'SMT' ? 'SMT' : 'SYSTEME_NORMAL'}`,
    `SEPARATEUR\t${delimiter}`,
    `ENCODAGE\t${draft.encoding}`,
    `ECRITURES\t${prepared.entryCount}`,
    `LIGNES\t${prepared.lineCount}`,
    `DEBIT\t${prepared.totalDebit.toFixed(2).replace('.', ',')}`,
    `CREDIT\t${prepared.totalCredit.toFixed(2).replace('.', ',')}`,
    `PAQUET\t${base}.zip`,
    'EMPREINTE_PAQUET\tconsignee_dans_historique_du_dossier',
    '',
    'FICHIER\tSHA256\tOCTETS',
    ...rows,
    '',
    'STATUT\tPAQUET SCELLE — toute modification invalide les empreintes.',
    'Ce manifeste accompagne le FEC et ne remplace pas le procès-verbal de validation du vérificateur.'
  ].join('\r\n') + '\r\n';
}

async function generateFec() {
  if (!requirePermission(USER_PERMISSIONS.EXPORTS_CREATE)) return;
  const prepared = fecPrepared || prepareFecFromForm();
  if (!prepared) return;
  const draft = prepared.fecDraft || readFecForm();
  const official = draft.mode !== 'DIAGNOSTIC';
  const company = appState.companies[appState.activeCompany];
  const delimiter = draft.separator === 'SEMICOLON' ? ';' : '\t';
  const base = fecFileBase(company, draft);
  const fileValidation = prepared.fileValidation || validateFecTxt(exportFecTxt({ prepared, delimiter }), { regime: draft.regime, delimiter, allowProvisional: draft.mode === 'DIAGNOSTIC' });
  if (official && !prepared.valid) {
    if (draft.mode === 'OFFICIAL_REPORT') {
      const report = exportFecControlReportTxt({ prepared, validation: fileValidation, companyName: company.name, ifu: company.ifu, mode: 'FEC officiel + rapport de contrôle', fileBase: `${base}.txt` });
      downloadBytes(`${base}.rapport.txt`, encodeFecText(report, draft.encoding), 'text/plain');
      showToast('Rapport de contrôle généré. Le FEC reste bloqué tant que les anomalies subsistent.');
    } else showToast('Génération bloquée : corrigez les anomalies du FEC officiel.');
    return;
  }
  const maxRecords = Number(draft.maxRecords || 0);
  const chunks = maxRecords > 0 ? Array.from({ length: Math.max(1, Math.ceil(prepared.records.length / maxRecords)) }, (_, index) => prepared.records.slice(index * maxRecords, (index + 1) * maxRecords)) : [prepared.records];
  const payloads = chunks.map((records, index) => {
    const filePrepared = { ...prepared, records };
    const suffix = chunks.length > 1 ? `_${index + 1}` : '';
    const name = `${base}${suffix}.txt`;
    return { name, bytes: encodeFecText(exportFecTxt({ prepared: filePrepared, delimiter }), draft.encoding) };
  });
  const noticeName = `${base}.notice.txt`;
  const notice = exportFecNoticeTxt({ prepared, delimiter, encoding: draft.encoding, recordSeparator: 'CRLF' });
  payloads.push({ name: noticeName, bytes: encodeFecText(notice, draft.encoding) });
  const reportName = `${base}.rapport.txt`;
  const report = exportFecControlReportTxt({ prepared, validation: fileValidation, companyName: company.name, ifu: company.ifu, mode: draft.mode === 'DIAGNOSTIC' ? 'Diagnostic provisoire' : 'FEC officiel', fileBase: `${base}.txt` });
  payloads.push({ name: reportName, bytes: encodeFecText(report, draft.encoding) });
  const hashedPayloads = await Promise.all(payloads.map(async (payload) => ({ ...payload, sha256: await sha256Hex(payload.bytes) })));
  const manifest = buildFecManifest({ base, draft, company, prepared, payloads: hashedPayloads });
  const manifestPayload = { name: `${base}.manifest.txt`, bytes: encodeFecText(manifest, draft.encoding) };
  manifestPayload.sha256 = await sha256Hex(manifestPayload.bytes);
  const finalArchiveFiles = [...hashedPayloads, manifestPayload];
  const finalZipBytes = createZipArchive(finalArchiveFiles);
  const finalPackageHash = await sha256Hex(finalZipBytes);
  downloadBytes(`${base}.zip`, finalZipBytes, 'application/zip');
  const archive = { id: `fec-archive-${Date.now()}`, packageFile: `${base}.zip`, companyId: appState.activeCompany, ifu: company.ifu, exercise: draft.fiscalYear, regime: draft.regime, mode: draft.mode, sealedAt: new Date().toISOString(), immutable: true, packageSha256: finalPackageHash, files: finalArchiveFiles.map((file) => ({ name: file.name, sha256: file.sha256 || '', bytes: file.bytes.length })), entryCount: prepared.entryCount, lineCount: prepared.lineCount };
  appState.fecArchives.unshift(archive);
  const history = { id: `fec-${Date.now()}`, companyId: appState.activeCompany, ifu: company.ifu, demo: Boolean(prepared.demo), packageFile: archive.packageFile, packageSha256: finalPackageHash, exercise: draft.fiscalYear, startDate: draft.startDate, endDate: draft.endDate, closureDate: draft.closureDate, regime: draft.regime, mode: draft.mode, encoding: draft.encoding, separator: draft.separator, files: chunks.length, entryCount: prepared.entryCount, lineCount: prepared.lineCount, valid: prepared.valid, createdAt: archive.sealedAt, author: 'Claire Dossou' };
  appState.fecHistory.unshift(history);
  appState.auditEvents.unshift({ id: `audit-${Date.now()}`, action: 'FEC_ARCHIVE_SEALED', companyId: appState.activeCompany, label: `Paquet FEC ${company.ifu} ${draft.fiscalYear}`, metadata: archive, at: archive.sealedAt, userId: 'claire-dossou' });
  persistAppState();
  renderFecHistory();
  showToast(`${draft.mode === 'DIAGNOSTIC' ? 'Diagnostic FEC' : 'Paquet FEC'} scellé et téléchargé avec manifeste, notice et rapport.`);
}

function openFecAssistant() {
  closeModal();
  appState.fecDraft = defaultFecDraft();
  fecPrepared = null;
  renderFecAssistant();
  openView('imports');
  setImportMode('fec');
  window.setTimeout(() => $('#fecStartDate')?.focus(), 50);
}

function readExportForm() {
  const form = $('#exportForm');
  if (!form) return null;
  const formData = new FormData(form);
  const report = exportReportDefinition(formData.get('reportType'));
  const filenameInput = String(formData.get('filename') || '').trim();
  const filenameBase = filenameInput.replace(/\.[a-z0-9]{1,5}$/i, '') || exportFileBase(`${report.label}-${formData.get('periodId')}`);
  return {
    ...(appState.exportDraft || defaultExportDraft(report.value)),
    reportType: report.value,
    periodId: String(formData.get('periodId') || ''),
    journalId: String(formData.get('journalId') || 'ALL'),
    statusMode: String(formData.get('statusMode') || 'CONTROL'),
    profile: String(formData.get('profile') || 'cabinet'),
    format: EXPORT_FORMATS[(appState.exportDraft || {}).format]?.available ? appState.exportDraft.format : 'txt',
    title: String(formData.get('title') || '').trim(),
    filename: filenameBase,
    recipient: String(formData.get('recipient') || '').trim(),
    purpose: String(formData.get('purpose') || '').trim(),
    exportReady: false
  };
}

function exportStatuses(draft) {
  return draft.statusMode === 'OFFICIAL'
    ? [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED]
    : [OPERATION_STATES.IMPUTED, OPERATION_STATES.TO_REVIEW, OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED];
}

function buildExportData(draft) {
  const company = appState.companies[appState.activeCompany];
  const fiscalYear = currentFiscalYear();
  const report = exportReportDefinition(draft.reportType);
  const period = (appState.periods[appState.activeCompany] || []).find((item) => item.id === draft.periodId);
  const periodFilter = draft.periodId === 'YEAR' ? String(fiscalYear.id) : draft.periodId;
  const periodLabel = draft.periodId === 'YEAR' ? fiscalYear.label : period?.label || draft.periodId;
  if (draft.sourcePreview && pendingExportRows && pendingExportReportType === draft.reportType) {
    return { report, periodLabel, rows: pendingExportRows.map((row) => ({ accountId: row.ref || row.accountId || '', label: row.label || row.description || '', debit: row.debit || 0, credit: row.credit || 0 })), source: 'aperçu' };
  }
  const entries = appState.integratedEntries.filter((entry) => draft.journalId === 'ALL' || entry.journalId === draft.journalId);
  const statement = buildFinancialStatements(entries, { companyId: appState.activeCompany, period: periodFilter, statuses: exportStatuses(draft) });
  let rows = statement.trialBalance;
  if (report.value === 'income-statement') rows = statement.incomeStatement;
  if (report.value === 'balance-sheet') rows = statement.balanceSheet;
  if (report.value === 'customer-balance') rows = rows.filter((line) => line.accountId.startsWith('411'));
  if (report.value === 'supplier-balance') rows = rows.filter((line) => line.accountId.startsWith('401'));
  if (report.value === 'assets') rows = rows.filter((line) => line.accountId.startsWith('2'));
  if (report.value === 'cash-flow') rows = rows.filter((line) => line.accountId.startsWith('5'));
  if (report.value === 'notes') rows = rows.filter((line) => /^[1-8]/.test(line.accountId));
  return { report, periodLabel, rows, source: 'données comptables' };
}

function renderExportReview(data) {
  const review = $('#exportReview');
  const draft = appState.exportDraft;
  if (!review || !draft || !data) return;
  const company = appState.companies[appState.activeCompany];
  const format = EXPORT_FORMATS[draft.format] || EXPORT_FORMATS.txt;
  const statusLabel = draft.statusMode === 'OFFICIAL' ? 'Officiel · validées ou clôturées' : 'Contrôle · brouillons et revue inclus';
  const journalLabel = draft.journalId === 'ALL' ? 'Tous les journaux' : draft.journalId;
  const extension = format.outputExtension || format.extension;
  review.innerHTML = `<div class="export-review-icon">✓</div><div class="export-review-copy"><strong>Vérification prête</strong><p>${escapeHtml(data.rows.length)} ligne${data.rows.length > 1 ? 's' : ''} seront exportée${data.rows.length > 1 ? 's' : ''} pour ${escapeHtml(company.name)}. Aucun téléchargement n’a encore été lancé.</p><div class="export-review-tags"><span>${escapeHtml(data.report.label)}</span><span>${escapeHtml(data.periodLabel)}</span><span>${escapeHtml(journalLabel)}</span><span>${escapeHtml(statusLabel)}</span><span>${escapeHtml(`${draft.filename}.${extension}`)}</span></div></div>`;
  review.removeAttribute('hidden');
  $('#confirmExportButton')?.removeAttribute('disabled');
}

function invalidateExportReview() {
  if (appState.exportDraft) appState.exportDraft.exportReady = false;
  $('#exportReview')?.setAttribute('hidden', '');
  $('#confirmExportButton')?.setAttribute('disabled', '');
  $$('.export-progress-step').forEach((step, index) => step.classList.toggle('is-current', index === 1));
}

function prepareExport() {
  const form = $('#exportForm');
  if (!form) return;
  if (!form.reportValidity()) {
    showToast('Complétez les champs obligatoires avant de vérifier l’export.');
    return;
  }
  const draft = readExportForm();
  if (!draft?.title || !draft.filename) {
    showToast('L’intitulé et le nom du fichier sont obligatoires.');
    return;
  }
  draft.exportReady = true;
  appState.exportDraft = draft;
  const data = buildExportData(draft);
  renderExportReview(data);
  $$('.export-progress-step').forEach((step, index) => step.classList.toggle('is-current', index === 2));
  $$('.export-progress-step').forEach((step, index) => step.classList.toggle('is-done', index < 2));
  showToast('Périmètre contrôlé. Vérifiez le récapitulatif avant le téléchargement.');
}

function exportContent(draft, data) {
  const company = appState.companies[appState.activeCompany];
  const dossier = currentDossierCode(appState.activeCompany);
  const format = EXPORT_FORMATS[draft.format] || EXPORT_FORMATS.txt;
  const rows = data.rows.map((line) => ({ accountId: line.accountId, label: line.label, debit: line.debit, credit: line.credit }));
  const metadata = [
    ['SOCIETE', company.name],
    ['IFU', company.ifu || ''],
    ['DOSSIER', dossier],
    ['EXERCICE', currentFiscalYear().label],
    ['PERIODE', data.periodLabel],
    ['ETAT', data.report.label],
    ['JOURNAUX', draft.journalId === 'ALL' ? 'Tous les journaux' : draft.journalId],
    ['STATUT', draft.statusMode === 'OFFICIAL' ? 'Officiel' : 'Contrôle'],
    ['INTITULE', draft.title],
    ['DESTINATAIRE', draft.recipient],
    ['OBJET', draft.purpose],
    ['FORMAT', format.label]
  ].map(([key, value]) => `${key}\t${String(value || '').replace(/[\t\r\n]/g, ' ')}`);
  return [...metadata, '', exportBalanceTxt({ companyName: company.name, period: data.periodLabel, rows }).trim()].join('\r\n') + '\r\n';
}

function confirmExport() {
  if (!appState.exportDraft?.exportReady) {
    prepareExport();
    return;
  }
  const draft = appState.exportDraft;
  const data = buildExportData(draft);
  const format = EXPORT_FORMATS[draft.format] || EXPORT_FORMATS.txt;
  const outputExtension = format.outputExtension || format.extension;
  const filename = `${exportFileBase(draft.filename)}.${outputExtension}`;
  downloadText(filename, exportContent(draft, data));
  const historyItem = { id: `export-${Date.now()}`, companyId: appState.activeCompany, dossier: currentDossierCode(appState.activeCompany), exercise: currentFiscalYear().id, period: draft.periodId, reportType: data.report.label, format: outputExtension, requestedFormat: format.extension, title: draft.title, filename, recipient: draft.recipient, purpose: draft.purpose, statusMode: draft.statusMode, journalId: draft.journalId, createdAt: new Date().toISOString(), author: 'Claire Dossou' };
  appState.exportHistory.unshift(historyItem);
  appState.auditEvents.unshift({ id: `audit-${Date.now()}`, action: 'EXPORT_CREATED', companyId: appState.activeCompany, label: draft.title, metadata: historyItem, at: historyItem.createdAt, userId: 'claire-dossou' });
  persistAppState();
  showToast(`${draft.title} a été exporté pour ${appState.companies[appState.activeCompany].name}.`);
}

function openExportAssistant(reportType = null, { rows = null, periodLabel = null } = {}) {
  closeModal();
  const defaults = defaultExportDraft(reportType);
  appState.exportDraft = { ...defaults };
  if (reportType) {
    const report = exportReportDefinition(reportType);
    appState.exportDraft.reportType = report.value;
    appState.exportDraft.title = `${report.label} — ${currentPeriod().label}`;
  }
  if (periodLabel) appState.exportDraft.title = `${appState.exportDraft.title.split(' — ')[0]} — ${periodLabel}`;
  appState.exportDraft.exportReady = false;
  appState.exportDraft.sourcePreview = Boolean(rows);
  pendingExportRows = rows;
  pendingExportReportType = rows ? appState.exportDraft.reportType : null;
  renderExportAssistant();
  openView('imports');
  setImportMode('export');
  window.setTimeout(() => $('#exportTitle')?.focus(), 50);
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
  openExportAssistant($('#exportReportType')?.value || null);
}

function downloadTemplate() {
  downloadText('modele-import-fec.txt', 'DATE\tJOURNAL\tNUMERO\tCOMPTE\tLIBELLE\tDEBIT\tCREDIT\n16/06/2025\tVE\tVE-0001\t4111\tClient exemple\t250000\t0\n16/06/2025\tVE\tVE-0001\t7061\tPrestation exemple\t0\t250000\n');
  showToast('Le modèle TXT a été téléchargé.');
}

function setImportMode(mode) {
  $$('.tab-button').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.importTab === mode));
  const importPane = $('#importPane');
  const mapping = $('#mappingPanel');
  const exportPane = $('#exportPane');
  const fecPane = $('#fecPane');
  if (mode === 'export') {
    importPane?.setAttribute('hidden', '');
    mapping?.setAttribute('hidden', '');
    fecPane?.setAttribute('hidden', '');
    renderExportAssistant();
    exportPane?.removeAttribute('hidden');
  } else if (mode === 'fec') {
    importPane?.setAttribute('hidden', '');
    mapping?.setAttribute('hidden', '');
    exportPane?.setAttribute('hidden', '');
    renderFecAssistant();
    fecPane?.removeAttribute('hidden');
  } else {
    importPane?.removeAttribute('hidden');
    exportPane?.setAttribute('hidden', '');
    fecPane?.setAttribute('hidden', '');
  }
}

function currentFiscalSettings() {
  return ensureFiscalSettingsForCompany(appState.activeCompany, fiscalYearIdForCompany(appState.activeCompany));
}

function fiscalSettingDisplay(value) {
  return value === null || value === undefined ? '' : String(value);
}

function renderFiscalPreview({ preserveActiveInput = true } = {}) {
  const beforeNode = $('#fiscalBeforeTax');
  if (!beforeNode) return;
  const settings = currentFiscalSettings();
  const result = calculatePeriodResult(appState.integratedEntries, { companyId: appState.activeCompany, period: currentPeriod().id });
  const fiscal = calculateFiscalResult({ ...settings, accountingResult: result.result, products: result.products, excludedProducts: settings.excludedProducts });
  const rules = BENIN_CGI_RULES_BY_YEAR[settings.codeVersion] || BENIN_CGI_RULES_BY_YEAR['2026'];
  const versionSelect = $('#fiscalCodeVersion');
  if (versionSelect) {
    versionSelect.innerHTML = Object.entries(BENIN_CGI_RULES_BY_YEAR).map(([year, item]) => `<option value="${escapeHtml(year)}">${escapeHtml(item.label)}</option>`).join('');
    versionSelect.value = settings.codeVersion;
  }
  const profileSelect = $('#fiscalActivityProfile');
  if (profileSelect) {
    profileSelect.innerHTML = `<option value="">À sélectionner</option>${Object.entries(BENIN_FISCAL_ACTIVITY_PROFILES).filter(([, profile]) => profile.visible !== false).map(([id, profile]) => `<option value="${escapeHtml(id)}">${escapeHtml(profile.label)}</option>`).join('')}`;
    profileSelect.value = settings.activityProfile || '';
  }
  const profile = BENIN_FISCAL_ACTIVITY_PROFILES[settings.activityProfile];
  const conventionField = $('#fiscalConventionRateField');
  if (conventionField) conventionField.hidden = !profile?.requiresConventionRate;
  const stationConfig = $('#fiscalStationConfig');
  if (stationConfig) stationConfig.hidden = !profile?.volumeMinimum;
  const conventionInput = $('#fiscalConventionRate');
  if (conventionInput) conventionInput.value = fiscalSettingDisplay(settings.conventionRate);
  const policySummary = $('#fiscalPolicySummary');
  if (policySummary) {
    const minimumSummary = fiscal.missingRegulatoryMinimum
      ? 'minimum réglementaire spécial à renseigner'
      : `${fiscal.minimumRate} % des produits encaissables${profile?.volumeMinimum ? ' et comparaison avec 0,60 FCFA/litre' : ''}`;
    policySummary.textContent = profile
      ? `${profile.label} · taux ${fiscal.taxRate || 'à renseigner'} % · ${minimumSummary}. Référentiel ${rules?.year || settings.codeVersion}.`
      : 'Sélectionnez un profil pour appliquer les règles correspondantes.';
  }
  const controls = {
    fiscalDeductions: settings.deductions,
    fiscalReintegrations: settings.reintegrations,
    fiscalCashableProducts: settings.cashableProducts,
    fiscalMinimumTax: settings.minimumTax,
    fiscalTaxRate: fiscal.taxRate,
    fiscalMinimumRate: fiscal.minimumRate,
    fiscalExcludedImmobilized: settings.excludedProducts?.immobilizedProduction,
    fiscalExcludedStocked: settings.excludedProducts?.stockedProduction,
    fiscalExcludedTransfers: settings.excludedProducts?.transferredCharges,
    fiscalExcludedReversals: settings.excludedProducts?.provisionsAndDepreciationReversals,
    fiscalStationFuelLiters: settings.stationFuelLiters,
    fiscalRegulatoryMinimumTax: settings.regulatoryMinimumTax
  };
  Object.entries(controls).forEach(([id, value]) => { const input = $(`#${id}`); if (input && (!preserveActiveInput || document.activeElement !== input)) input.value = fiscalSettingDisplay(value); });
  const feeCheckbox = $('#fiscalBroadcastingFeeEnabled');
  if (feeCheckbox) feeCheckbox.checked = settings.broadcastingFeeEnabled !== false;
  beforeNode.innerHTML = `${numberLabel(fiscal.accountingResult)} <em>FCFA</em>`;
  $('#fiscalTaxableResult').innerHTML = `${numberLabel(fiscal.taxableResult)} <em>FCFA</em>`;
  $('#fiscalCashableProductsResult').innerHTML = `${numberLabel(fiscal.cashableProducts)} <em>FCFA</em>`;
  $('#fiscalCalculatedTax').innerHTML = `${numberLabel(fiscal.calculatedTax)} <em>FCFA</em>`;
  const fiscalPendingLabel = '<span class="fiscal-pending">À renseigner</span>';
  $('#fiscalMinimumTaxResult').innerHTML = fiscal.ready ? `${numberLabel(fiscal.minimumTax)} <em>FCFA</em>` : fiscalPendingLabel;
  $('#fiscalTaxAmount').innerHTML = fiscal.ready ? `${numberLabel(fiscal.tax)} <em>FCFA</em>` : fiscalPendingLabel;
  $('#fiscalNetResult').innerHTML = fiscal.ready ? `${numberLabel(fiscal.netResult)} <em>FCFA</em>` : fiscalPendingLabel;
  const badge = $('#fiscalStatusBadge');
  if (badge) { badge.innerHTML = `<i></i> ${fiscal.ready ? 'Impôt estimé · à valider' : 'À paramétrer'}`; badge.className = `fiscal-status-badge ${fiscal.ready ? 'is-ready' : ''}`; }
  const generateButton = $('[data-action="generate-fiscal-result"]');
  if (generateButton) generateButton.disabled = !fiscal.ready || currentPeriod().status === 'CLOSED';
  const note = $('#fiscalEntryNote');
  if (note) note.innerHTML = fiscal.ready
    ? `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/></svg> Total calculé : ${numberLabel(fiscal.tax)} FCFA${fiscal.broadcastingFee ? `, dont ${numberLabel(fiscal.broadcastingFee)} FCFA de redevance ORTB.` : '.'} L’écriture reste à contrôler.`
    : fiscal.missingRegulatoryMinimum
      ? `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/></svg> Renseignez le minimum réglementaire applicable à cette activité avant de générer.`
      : `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/></svg> Sélectionnez et faites valider un profil fiscal avant de générer une écriture.`;
}

function updateFiscalSetting(field, value) {
  const settings = currentFiscalSettings();
  const excludedFieldMap = {
    excludedImmobilized: 'immobilizedProduction',
    excludedStocked: 'stockedProduction',
    excludedTransfers: 'transferredCharges',
    excludedReversals: 'provisionsAndDepreciationReversals'
  };
  if (field === 'activityProfile') {
    settings.activityProfile = String(value || '');
    const profile = BENIN_FISCAL_ACTIVITY_PROFILES[settings.activityProfile];
    const rules = BENIN_CGI_RULES_BY_YEAR[settings.codeVersion] || BENIN_CGI_RULES_BY_YEAR['2026'];
    const profileRule = rules?.activityProfiles?.[settings.activityProfile] || profile;
    settings.taxRate = profile?.requiresConventionRate ? 0 : (profileRule?.corporateRate || 0);
    settings.validated = false;
  } else if (field === 'codeVersion') {
    settings.codeVersion = String(value || '2026');
    const rules = BENIN_CGI_RULES_BY_YEAR[settings.codeVersion] || BENIN_CGI_RULES_BY_YEAR['2026'];
    settings.minimumTaxFloor = rules.minimumFloor;
    settings.broadcastingFee = rules.broadcastingFee;
    settings.stationRatePerLiter = rules.stationRatePerLiter;
    const profile = BENIN_FISCAL_ACTIVITY_PROFILES[settings.activityProfile];
    const profileRule = rules?.activityProfiles?.[settings.activityProfile] || profile;
    if (profile && !profile.requiresConventionRate) settings.taxRate = profileRule?.corporateRate || 0;
  } else if (field === 'broadcastingFeeEnabled') {
    settings.broadcastingFeeEnabled = Boolean(value);
  } else if (excludedFieldMap[field]) {
    settings.excludedProducts[excludedFieldMap[field]] = parseUiAmount(value) || 0;
  } else if (field === 'cashableProducts') {
    settings.cashableProducts = String(value || '').trim() === '' ? null : (parseUiAmount(value) || 0);
  } else if (field === 'conventionRate') {
    settings.conventionRate = Number(value) || 0;
    settings.taxRate = settings.conventionRate > 0 ? settings.conventionRate : 0;
  } else if (field === 'taxRate') {
    settings.taxRate = Number(value) || 0;
  } else {
    settings[field] = parseUiAmount(value) || 0;
  }
  persistAppState();
  renderFiscalPreview();
}

function fiscalResultForPeriod(periodId = currentPeriod().id) {
  const settings = currentFiscalSettings();
  const result = calculatePeriodResult(appState.integratedEntries, { companyId: appState.activeCompany, period: periodId });
  return calculateFiscalResult({ ...settings, accountingResult: result.result, products: result.products, excludedProducts: settings.excludedProducts });
}

function generateFiscalResult() {
  if (!ensureActivePeriodOpen()) return;
  const settings = currentFiscalSettings();
  const result = calculatePeriodResult(appState.integratedEntries, { companyId: appState.activeCompany, period: currentPeriod().id });
  const fiscal = calculateFiscalResult({ ...settings, accountingResult: result.result, products: result.products, excludedProducts: settings.excludedProducts });
  if (!fiscal.ready || fiscal.tax <= 0) { showToast(fiscal.missingRegulatoryMinimum ? 'Renseignez le minimum réglementaire applicable avant la génération.' : 'Sélectionnez un profil fiscal et faites valider ses paramètres avant la génération.'); return; }
  const accountId = fiscal.calculatedTax >= fiscal.minimumTax ? '8911' : '895';
  const taxEntry = createAutomaticJournalEntry({ companyId: appState.activeCompany, integrationCategory: 'RESULTAT', date: currentPeriod().end, reference: 'RP-0002', label: `Impôt sur le résultat — ${currentPeriod().label}`, dossierId: currentDossierCode(appState.activeCompany), lines: [{ accountId, label: accountId === '895' ? 'Impôt minimum forfaitaire' : 'Impôts sur les bénéfices', debit: fiscal.tax, credit: 0 }, { accountId: '441', label: 'État, impôt sur les bénéfices', debit: 0, credit: fiscal.tax }] });
  const synced = syncIntegratedJournal(integratedJournalForCompany(appState.activeCompany), { ...taxEntry, id: `auto-tax-${appState.activeCompany}-${currentPeriod().id}`, amount: fiscal.tax, debit: fiscal.tax, credit: fiscal.tax, source: 'Calcul fiscal automatique', integrationCategory: 'RESULTAT', technicalOnly: true, status: OPERATION_STATES.TO_REVIEW }).entries[0];
  const index = appState.integratedEntries.findIndex((entry) => entry.id === synced.id && entry.companyId === synced.companyId);
  if (index >= 0) appState.integratedEntries[index] = synced; else appState.integratedEntries.unshift(synced);
  appState.automaticRuns = appState.automaticRuns.filter((run) => !(run.companyId === appState.activeCompany && run.category === 'FISCAL_TAX' && run.period === currentPeriod().id));
  appState.automaticRuns.unshift({ companyId: appState.activeCompany, category: 'FISCAL_TAX', period: currentPeriod().id, count: 1, at: new Date().toISOString(), status: 'TO_REVIEW' });
  persistAppState();
  renderIntegratedJournal();
  renderAutomaticRuns();
  showToast(`Impôt de ${numberLabel(fiscal.tax)} FCFA généré dans le journal RP.`);
}

function automaticPreview(category) {
  const companyId = appState.activeCompany;
  const period = currentPeriod();
  const periodId = period.id;
  const dossierId = currentDossierCode(companyId);
  if (category === 'AMORTISSEMENTS') {
    const plan = calculateStraightLinePlan({ assetId: 'IMM-2025-001', companyId, cost: 850000, serviceDate: '2025-01-01', usefulLifeMonths: 36, prorata: false, expenseAccount: '6813', accumulatedAccount: '2844' });
    const entry = depreciationEntry(plan, { journalId: 'AM', date: period.end });
    return { ready: true, entries: [{ ...entry, id: `auto-amort-${companyId}-${periodId}`, dossierId, reference: 'AM-0003', source: 'Traitement automatique des amortissements', integrationCategory: category, amount: entry.lines[0].debit, debit: entry.lines[0].debit, credit: entry.lines[1].credit, status: OPERATION_STATES.TO_REVIEW }] };
  }
  if (category === 'ABONNEMENTS') {
    const schedules = appState.automaticSchedules.filter((schedule) => schedule.companyId === companyId && schedule.active !== false);
    const entries = schedules.map((schedule) => {
      const entry = createAutomaticJournalEntry({ companyId, integrationCategory: category, date: period.end, reference: `AB-${String(schedules.indexOf(schedule) + 1).padStart(4, '0')}`, label: `${schedule.label} — ${period.label}`, dossierId, lines: [{ accountId: schedule.expenseAccount || '6281', debit: schedule.amount, credit: 0 }, { accountId: schedule.supplierAccount || '4011', debit: 0, credit: schedule.amount }] });
      return { ...entry, id: `auto-${schedule.id}-${periodId}`, source: 'Abonnement périodique', amount: schedule.amount, debit: schedule.amount, credit: schedule.amount, status: OPERATION_STATES.TO_REVIEW };
    });
    return { ready: entries.length > 0, entries, reason: entries.length ? '' : 'Aucun abonnement actif n’est paramétré pour cette société.' };
  }
  if (category === 'CENTRALISATION') {
    const source = centralizeEntries(appState.integratedEntries, { companyId, period: periodId, sourceJournalIds: ['VE', 'AC', 'BQ', 'CA', 'OD'] });
    if (!source.sourceCount || !source.lines.length) return { ready: false, entries: [], reason: 'Aucune écriture source validée n’est disponible pour cette période.' };
    const entry = createAutomaticJournalEntry({ companyId, integrationCategory: category, date: period.end, reference: 'CT-0001', label: `Centralisation des journaux — ${period.label}`, dossierId, lines: source.lines });
    return { ready: true, entries: [{ ...entry, id: `auto-centralization-${companyId}-${periodId}`, amount: source.totalDebit, debit: source.totalDebit, credit: source.totalCredit, source: `Centralisation de ${source.sourceCount} écriture${source.sourceCount > 1 ? 's' : ''}`, sourceEntryIds: source.sourceEntryIds, technicalOnly: true, status: OPERATION_STATES.TO_REVIEW }] };
  }
  const result = calculatePeriodResult(appState.integratedEntries, { companyId, period: periodId });
  if (!result.sourceCount || !result.lines.length || result.result === 0) return { ready: false, entries: [], reason: 'Aucun résultat à générer pour cette période.' };
  const resultEntry = createAutomaticJournalEntry({ companyId, integrationCategory: category, date: period.end, reference: 'RP-0001', label: `Résultat de la période — ${period.label}`, dossierId, lines: result.lines });
  return { ready: true, entries: [{ ...resultEntry, id: `auto-result-${companyId}-${periodId}`, amount: result.totalDebit, debit: result.totalDebit, credit: result.totalCredit, source: `Résultat net ${numberLabel(result.result)} FCFA · ${result.sourceCount} écriture${result.sourceCount > 1 ? 's' : ''}`, sourceEntryIds: result.sourceEntryIds, technicalOnly: true, result: result.result, status: OPERATION_STATES.TO_REVIEW }] };
}

function automaticEntryBelongsToRun(entry, run) {
  const isFiscalTax = run.category === 'FISCAL_TAX' && (entry.source === 'Calcul fiscal automatique' || String(entry.id || '').startsWith('auto-tax-'));
  return entry.companyId === run.companyId && (entry.integrationCategory === run.category || isFiscalTax) && String(entry.date || '').slice(0, 7) === String(run.period);
}

function automaticRunFor(category) {
  const run = appState.automaticRuns.find((item) => item.companyId === appState.activeCompany && item.category === category && item.period === currentPeriod().id);
  if (!run) return null;
  const linkedEntries = appState.integratedEntries.filter((entry) => automaticEntryBelongsToRun(entry, run));
  const allLinkedEntriesValidated = linkedEntries.length >= Number(run.count || 0) && linkedEntries.slice(0, Number(run.count || linkedEntries.length)).every((entry) => [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status));
  return run.status === 'TO_REVIEW' && allLinkedEntriesValidated ? { ...run, status: 'VALIDATED' } : run;
}

function automaticRunStatus(run) {
  if (['VALIDATED', 'FINALIZED', 'CLOSED'].includes(String(run.status || '').toUpperCase())) return ['Validée', 'status-green'];
  return ['À contrôler', 'status-purple'];
}

function renderAutomaticRuns() {
  const rows = $('#automaticRunsRows');
  if (!rows) return;
  const runs = appState.automaticRuns.filter((run) => run.companyId === appState.activeCompany);
  rows.innerHTML = runs.map((run) => {
    const definition = AUTOMATIC_DEFINITIONS[run.category] || (run.category === 'FISCAL_TAX' ? { label: 'Impôt sur le résultat', journalId: 'RP' } : null);
    const linkedEntries = appState.integratedEntries.filter((entry) => automaticEntryBelongsToRun(entry, run));
    const allLinkedEntriesValidated = linkedEntries.length >= Number(run.count || 0) && linkedEntries.slice(0, Number(run.count || linkedEntries.length)).every((entry) => [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status));
    const [runLabel, runClass] = automaticRunStatus(run.status === 'TO_REVIEW' && allLinkedEntriesValidated ? { ...run, status: 'VALIDATED' } : run);
    return `<tr><td><span class="cell-title">${escapeHtml(definition?.label || run.category)}</span></td><td><span class="journal-badge ${run.category === 'ABONNEMENTS' ? 'journal-badge-purple' : run.category === 'AMORTISSEMENTS' ? 'journal-badge-amber' : 'journal-badge-blue'}">${escapeHtml(definition?.journalId || '—')}</span></td><td>${escapeHtml(run.period)}</td><td>${escapeHtml(run.count)}</td><td>${escapeHtml(new Date(run.at).toLocaleString('fr-FR'))}</td><td><span class="status ${runClass}">${runLabel}</span></td></tr>`;
  }).join('');
  if (!runs.length) rows.innerHTML = '<tr><td colspan="6" class="dossier-empty">Aucun traitement exécuté pour cette société.</td></tr>';
}

function addDemoSubscription() {
  const companyId = appState.activeCompany;
  const alreadyConfigured = appState.automaticSchedules.some((schedule) => schedule.companyId === companyId && schedule.active !== false);
  if (alreadyConfigured) { showToast('Un abonnement est déjà paramétré pour cette société.'); return; }
  appState.automaticSchedules.push({ id: `sub-demo-${companyId}`, companyId, label: 'Abonnement internet mensuel', supplierName: 'Fournisseur internet', amount: 12000, expenseAccount: '6281', supplierAccount: '4011', periodicity: 'Mensuelle', active: true, source: 'Jeu de test EMRYS' });
  persistAppState();
  renderAutomaticTasks();
  showToast('Abonnement de test ajouté : 12 000 FCFA par mois.');
}

function addDemoCentralizationSources() {
  const companyId = appState.activeCompany;
  const period = currentPeriod();
  const setup = currentAccountSetup();
  const existing = appState.integratedEntries.filter((entry) => entry.companyId === companyId && entry.source === 'Jeu de test centralisation' && String(entry.date).startsWith(period.id));
  if (!existing.length) {
    const definitions = [
      { journalId: 'VE', reference: 'VE-TEST-001', label: 'Vente de test — centralisation', lines: [{ accountId: '4111', label: 'Client test', debit: 100000, credit: 0 }, { accountId: '7061', label: 'Services vendus', debit: 0, credit: 100000 }] },
      { journalId: 'AC', reference: 'AC-TEST-001', label: 'Achat de test — centralisation', lines: [{ accountId: '6047', label: 'Fournitures test', debit: 45000, credit: 0 }, { accountId: '4011', label: 'Fournisseur test', debit: 0, credit: 45000 }] },
      { journalId: 'BQ', reference: 'BQ-TEST-001', label: 'Encaissement de test — centralisation', lines: [{ accountId: '5211', label: 'Banque', debit: 15000, credit: 0 }, { accountId: '4111', label: 'Client test', debit: 0, credit: 15000 }] }
    ];
    definitions.forEach((definition, index) => {
      const entry = createJournalEntry({ companyId, journalId: definition.journalId, date: period.end, pieceDate: period.end, reference: definition.reference, label: definition.label, lines: definition.lines }, { activeCompanyId: companyId, dossierId: currentDossierCode(companyId), accountIds: setup.accounts.map((account) => account.id) });
      appState.integratedEntries.unshift({ ...entry, id: `demo-central-${companyId}-${period.id}-${index}`, status: OPERATION_STATES.VALIDATED, source: 'Jeu de test centralisation', amount: 0, debit: definition.lines.reduce((sum, line) => sum + line.debit, 0), credit: definition.lines.reduce((sum, line) => sum + line.credit, 0), integrationCategory: 'GENERAL' });
    });
    ensureTreasuryMovements();
    persistAppState();
  }
  renderAutomaticTasks();
  renderAutomaticRuns();
  renderIntegratedJournal();
  renderBankMovements();
  renderTreasury();
  showToast('Jeu de test centralisation ajouté : 3 écritures validées.');
}

function renderAutomaticTasks() {
  const container = $('#periodicTasks');
  if (!container) return;
  const periodLabel = $('#periodicPeriodLabel');
  if (periodLabel) periodLabel.textContent = currentPeriod().label;
  container.innerHTML = Object.entries(AUTOMATIC_DEFINITIONS).map(([category, definition]) => {
    const preview = automaticPreview(category);
    const run = automaticRunFor(category);
    const systemReady = preview.ready;
    const [runLabel, runClass] = run ? automaticRunStatus(run) : ['', ''];
    const status = run ? `Généré · ${runLabel.toLowerCase()}` : systemReady ? 'Prêt à générer' : 'Paramétrage requis';
    const statusClass = run ? runClass : systemReady ? 'status-green' : 'status-amber';
    const isSubscriptionSetup = category === 'ABONNEMENTS' && !systemReady && !run;
    const isCentralizationSetup = category === 'CENTRALISATION' && !systemReady && !run;
    const buttonLabel = run ? 'Prévisualiser' : systemReady ? 'Prévisualiser' : isSubscriptionSetup ? 'Ajouter un abonnement de test' : isCentralizationSetup ? 'Ajouter un jeu de test' : 'Voir le détail';
    const buttonAction = isSubscriptionSetup ? 'add-demo-subscription' : isCentralizationSetup ? 'add-demo-centralization' : 'preview-automatic';
    return `<article class="periodic-task periodic-task-${definition.tone} ${systemReady ? '' : 'is-not-ready'}"><div class="periodic-task-top"><span class="periodic-task-icon">${definition.symbol}</span><span class="status ${statusClass}">${status}</span></div><h2>${definition.label}</h2><p>${definition.description}</p><div class="periodic-task-foot"><span><b>Journal ${definition.journalId}</b><small>${run ? `${run.count} écriture${run.count > 1 ? 's' : ''} · ${new Date(run.at).toLocaleDateString('fr-FR')}` : currentPeriod().label}</small></span><button class="button ${systemReady ? 'button-primary' : 'button-secondary'} button-small" type="button" data-action="${buttonAction}" data-automatic-category="${category}">${buttonLabel}</button></div></article>`;
  }).join('');
}

function openAutomaticPreview(category) {
  const definition = AUTOMATIC_DEFINITIONS[category];
  const preview = automaticPreview(category);
  appState.pendingAutomaticCategory = category;
  $('#automaticPreviewTitle').textContent = `Prévisualiser ${definition.label.toLowerCase()}`;
  $('#automaticPreviewCategory').textContent = definition.label;
  $('#automaticPreviewJournal').textContent = `Journal ${definition.journalId}`;
  const content = $('#automaticPreviewContent');
  const total = preview.entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const netResult = preview.entries.reduce((sum, entry) => sum + Number(entry.result || 0), 0);
  const resultSummary = category === 'RESULTAT' && preview.entries.some((entry) => entry.result !== undefined) ? `<span><small>RÉSULTAT NET</small><strong>${numberLabel(netResult)} <em>FCFA</em></strong></span>` : '';
  $('#automaticPreviewSummary').innerHTML = `<span><small>ÉCRITURES À GÉNÉRER</small><strong>${preview.entries.length}</strong></span><span><small>MONTANT TOTAL DE L’ÉCRITURE</small><strong>${numberLabel(total)} <em>FCFA</em></strong></span>${resultSummary}<span><small>JOURNAL</small><strong>${definition.journalId}</strong></span>`;
  if (preview.entries.length) {
    content.innerHTML = `<div class="automatic-preview-table-wrap"><table class="automatic-preview-table"><thead><tr><th>RÉFÉRENCE</th><th>LIBELLÉ</th><th>IMPUTATION GÉNÉRÉE</th><th class="align-right">MONTANT</th></tr></thead><tbody>${preview.entries.map((entry) => `<tr><td><b>${escapeHtml(entry.reference)}</b></td><td>${escapeHtml(entry.label)}</td><td>${escapeHtml(entry.lines.map((line) => `${line.accountId} ${line.debit > 0 ? 'D' : 'C'}`).join(' · '))}</td><td class="align-right">${numberLabel(entry.amount)} FCFA</td></tr>`).join('')}</tbody></table></div>`;
  } else content.innerHTML = `<div class="automatic-preview-empty"><span>⌁</span><strong>Aucune écriture ne sera générée</strong><p>${escapeHtml(preview.reason)}</p></div>`;
  const button = $('#runAutomaticButton');
  button.disabled = !preview.ready;
  button.textContent = preview.ready ? 'Générer les écritures' : 'Paramétrage requis';
  openModal('automaticPreviewModal');
}

function runAutomaticProcess(category) {
  if (!ensureActivePeriodOpen()) return;
  const preview = automaticPreview(category);
  if (!preview.ready) { showToast(preview.reason || 'Ce traitement n’est pas prêt.'); return; }
  preview.entries.forEach((entry) => {
    const synced = syncIntegratedJournal(integratedJournalForCompany(appState.activeCompany), entry).entries[0];
    const index = appState.integratedEntries.findIndex((item) => item.id === synced.id && item.companyId === synced.companyId);
    if (index >= 0) appState.integratedEntries[index] = synced;
    else appState.integratedEntries.unshift(synced);
  });
  appState.automaticRuns = appState.automaticRuns.filter((run) => !(run.companyId === appState.activeCompany && run.category === category && run.period === currentPeriod().id));
  appState.automaticRuns.unshift({ companyId: appState.activeCompany, category, period: currentPeriod().id, count: preview.entries.length, at: new Date().toISOString(), status: 'TO_REVIEW' });
  persistAppState();
  closeModal();
  renderAutomaticTasks();
  renderAutomaticRuns();
  renderIntegratedJournal();
  showToast(`${preview.entries.length} écriture${preview.entries.length > 1 ? 's' : ''} générée${preview.entries.length > 1 ? 's' : ''} dans le journal automatique.`);
}

function generateDepreciation() {
  const plan = calculateStraightLinePlan({
    assetId: 'IMM-2025-001',
    companyId: appState.activeCompany,
    cost: 850000,
    serviceDate: '2025-01-01',
    usefulLifeMonths: 36,
    prorata: false,
    expenseAccount: '6813',
    accumulatedAccount: '2844'
  });
  const entry = depreciationEntry(plan, { journalId: 'AM', date: currentPeriod().end });
  $$('#assetRows .status-amber').forEach((status) => {
    status.textContent = 'À contrôler';
  });
  const amount = entry.lines[0].debit;
  const syncedEntry = syncIntegratedJournal(integratedJournalForCompany(appState.activeCompany), { id: `auto-amort-${appState.activeCompany}-${currentPeriod().id}`, companyId: appState.activeCompany, reference: 'AM-0003', date: currentPeriod().end, journalId: 'AM', label: `Dotation amortissement — ${currentPeriod().label}`, lines: entry.lines, debit: amount, credit: amount, amount, source: 'Amortissement automatique', integrationCategory: 'AMORTISSEMENTS', status: 'TO_REVIEW' }).entries[0];
  const existingIndex = appState.integratedEntries.findIndex((item) => item.id === syncedEntry.id && item.companyId === syncedEntry.companyId);
  if (existingIndex >= 0) appState.integratedEntries[existingIndex] = syncedEntry;
  else appState.integratedEntries.unshift(syncedEntry);
  const runAt = new Date().toISOString();
  appState.automaticRuns = appState.automaticRuns.filter((run) => !(run.companyId === appState.activeCompany && run.category === 'AMORTISSEMENTS' && run.period === currentPeriod().id));
  appState.automaticRuns.unshift({ companyId: appState.activeCompany, category: 'AMORTISSEMENTS', period: currentPeriod().id, count: 1, at: runAt, status: 'TO_REVIEW' });
  persistAppState();
  renderAutomaticRuns();
  renderAutomaticTasks();
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
  openManualLineEditor();
}

function validateImport() {
  const button = $('[data-action="validate-import"]');
  if (button) button.textContent = 'Contrôle terminé ✓';
  const status = $('#mappingPanel .status');
  if (status) { status.textContent = 'Prêt à intégrer'; status.className = 'status status-green'; }
  showToast('48 lignes contrôlées : aucune anomalie bloquante.');
}

let accountShowInactive = false;
let editingAccountId = null;
let editingJournalId = null;
let pendingAccountImport = null;
let currentThirdpartyType = THIRD_PARTY_TYPES.CLIENT;
let thirdpartyShowInactive = false;
let editingThirdPartyId = null;
const invoiceDraftLines = {
  SALE: [{ id: 'sale-line-1', description: 'Accompagnement administratif', quantity: 1, unitPrice: 250000 }],
  PURCHASE: [{ id: 'purchase-line-1', description: 'Fournitures de bureau', quantity: 1, unitPrice: 38500 }]
};
const invoiceImputationOverrides = { SALE: null, PURCHASE: null };
let currentPaymentType = PAYMENT_TYPES.RECEIPT;
let paymentAllocations = {};
let currentStatementTab = 'trial';

const THIRD_PARTY_TYPE_LABELS = { CLIENT: 'Clients', SUPPLIER: 'Fournisseurs', PERSONNEL: 'Personnel', OTHER: 'Débiteurs / créditeurs divers' };
const THIRD_PARTY_DEFAULT_ACCOUNTS = { CLIENT: '4111', SUPPLIER: '4011', PERSONNEL: '421', OTHER: '4711' };

function currentThirdParties() {
  return appState.thirdParties[appState.activeCompany] || (appState.thirdParties[appState.activeCompany] = []);
}

function nextThirdPartyAuxiliary(collectiveAccountId) {
  const prefix = normalizeAccountNumber(collectiveAccountId);
  const accountIds = currentAccountSetup().accounts.map((account) => normalizeAccountNumber(account.id));
  const values = accountIds.filter((id) => id.startsWith(prefix) && id.length > prefix.length).map((id) => Number(id.slice(prefix.length))).filter(Number.isFinite);
  return `${prefix}${String((values.length ? Math.max(...values) : 0) + 1).padStart(2, '0')}`;
}

function updateAuxiliaryPreview() {
  const collective = $('#collectiveAccountId')?.value || '4111';
  const preview = $('#auxiliaryAccountPreview');
  const label = $('#auxiliaryAccountLabel');
  if (preview) preview.textContent = editingThirdPartyId ? (currentThirdParties().find((item) => item.id === editingThirdPartyId)?.auxiliaryAccountId || nextThirdPartyAuxiliary(collective)) : nextThirdPartyAuxiliary(collective);
  if (label) label.textContent = `Sous-compte de ${collective}`;
}

function entryPartyType(category) {
  if (category === 'goods-purchase' || category === 'bank-fee') return THIRD_PARTY_TYPES.SUPPLIER;
  if (category === 'service-sale') return THIRD_PARTY_TYPES.CLIENT;
  return THIRD_PARTY_TYPES.OTHER;
}

function manualEntryParty() {
  const name = $('#entryManualParty')?.value.trim() || '';
  if (!name) return null;
  const type = entryPartyType($('#entryCategory')?.value || 'other');
  const collectiveAccountId = THIRD_PARTY_DEFAULT_ACCOUNTS[type] || THIRD_PARTY_DEFAULT_ACCOUNTS.OTHER;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'tiers';
  const prefix = type === THIRD_PARTY_TYPES.CLIENT ? 'CLI' : type === THIRD_PARTY_TYPES.SUPPLIER ? 'FOU' : 'TIE';
  return { id: `manual-entry-${slug}`, code: `${prefix}-${slug}`.toUpperCase(), name, type, collectiveAccountId, auxiliaryAccountId: collectiveAccountId, currency: 'XOF', active: true, manual: true };
}

function toggleManualEntryParty({ focus = false } = {}) {
  const select = $('#entryThirdParty');
  const field = $('#entryManualPartyField');
  const input = $('#entryManualParty');
  const manual = select?.value === 'manual';
  const type = entryPartyType($('#entryCategory')?.value || 'other');
  if (select) select.required = false;
  field?.toggleAttribute('hidden', !manual);
  $('#entryManualPartyLabel').textContent = `Nom du ${type === THIRD_PARTY_TYPES.SUPPLIER ? 'fournisseur' : type === THIRD_PARTY_TYPES.CLIENT ? 'client' : 'tiers'}`;
  if (input) {
    input.required = manual;
    if (!manual) input.value = '';
    if (manual && focus) window.setTimeout(() => input.focus(), 0);
  }
}

function currentEntryParty() {
  const select = $('#entryThirdParty');
  if (select?.value === 'manual') return manualEntryParty();
  return currentThirdParties().find((thirdParty) => thirdParty.id === select?.value) || null;
}

function ensureManualEntryParty(party) {
  if (!party?.manual) return party;
  const existing = currentThirdParties().find((item) => item.type === party.type && item.name.toLowerCase() === party.name.toLowerCase());
  if (existing) return existing;
  const setup = currentAccountSetup();
  const created = addThirdPartyToDirectory(currentThirdParties(), { ...party, auxiliaryAccountId: nextThirdPartyAuxiliary(party.collectiveAccountId) }, setup.accounts);
  const added = created.at(-1);
  appState.thirdParties[appState.activeCompany] = created;
  if (!setup.accounts.some((account) => account.id === added.auxiliaryAccountId)) setup.accounts = addAccountToPlan(setup.accounts, { id: added.auxiliaryAccountId, label: `${added.collectiveAccountId} — ${added.name}`, nature: added.type === THIRD_PARTY_TYPES.CLIENT ? 'Actif / tiers' : added.type === THIRD_PARTY_TYPES.SUPPLIER ? 'Passif / tiers' : 'Tiers', isCustom: true });
  return added;
}

function renderThirdpartyOptions() {
  const select = $('#entryThirdParty');
  if (!select) return;
  const category = $('#entryCategory')?.value || 'service-sale';
  const desiredType = entryPartyType(category);
  const options = currentThirdParties().filter((thirdParty) => thirdParty.active !== false && (thirdParty.type === desiredType || category === 'other')).map((thirdParty) => `<option value="${escapeHtml(thirdParty.id)}">${escapeHtml(thirdParty.name)} · ${escapeHtml(thirdParty.auxiliaryAccountId || thirdParty.collectiveAccountId)}</option>`);
  select.innerHTML = `${options.join('')}<option value="none">Aucun tiers</option><option value="manual">+ Saisir un ${desiredType === THIRD_PARTY_TYPES.SUPPLIER ? 'fournisseur' : desiredType === THIRD_PARTY_TYPES.CLIENT ? 'client' : 'tiers'}</option>`;
  if (options.length) select.value = currentThirdParties().find((thirdParty) => thirdParty.type === desiredType)?.id || 'none';
  else select.value = 'none';
  toggleManualEntryParty();
}

function renderThirdpartyList() {
  const rows = $('#thirdpartyRows');
  if (!rows) return;
  const all = currentThirdParties();
  const filtered = all.filter((thirdParty) => thirdParty.type === currentThirdpartyType && (thirdpartyShowInactive || thirdParty.active !== false));
  const query = ($('#thirdpartySearch')?.value || '').trim().toLowerCase();
  const visible = filtered.filter((thirdParty) => !query || `${thirdParty.code} ${thirdParty.name} ${thirdParty.ifu} ${thirdParty.auxiliaryAccountId}`.toLowerCase().includes(query));
  rows.innerHTML = visible.map((thirdParty) => `<tr><td><b class="thirdparty-code">${escapeHtml(thirdParty.code)}</b></td><td><span class="cell-title">${escapeHtml(thirdParty.name)}</span><small class="cell-subtitle">${escapeHtml(thirdParty.address || 'Adresse à compléter')}</small></td><td><span class="thirdparty-aux-account">${escapeHtml(thirdParty.auxiliaryAccountId || 'À définir')}</span></td><td><span class="account-class-badge">${escapeHtml(thirdParty.collectiveAccountId)}</span></td><td>${escapeHtml(thirdParty.paymentTerms || 'Comptant')}</td><td><span class="status ${thirdParty.active === false ? 'status-muted' : 'status-green'}">${thirdParty.active === false ? 'Inactif' : 'Actif'}</span></td><td><button class="icon-button small" type="button" data-action="edit-thirdparty" data-thirdparty-id="${escapeHtml(thirdParty.id)}" aria-label="Modifier le tiers"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 20 8-8-4-4-8 8-1 5zM14 6l4 4M4 4h6"/></svg></button></td></tr>`).join('');
  if (!visible.length) rows.innerHTML = '<tr><td colspan="7" class="dossier-empty">Aucun tiers dans cette catégorie.</td></tr>';
  const count = (type) => all.filter((thirdParty) => thirdParty.type === type && thirdParty.active !== false).length;
  $('#clientCount').textContent = String(count(THIRD_PARTY_TYPES.CLIENT));
  $('#supplierCount').textContent = String(count(THIRD_PARTY_TYPES.SUPPLIER));
  $('#personnelCount').textContent = String(count(THIRD_PARTY_TYPES.PERSONNEL));
  $('#otherThirdpartyCount').textContent = String(count(THIRD_PARTY_TYPES.OTHER));
  $('#thirdpartyListTitle').textContent = THIRD_PARTY_TYPE_LABELS[currentThirdpartyType];
  $('#thirdpartyListSubtitle').textContent = `${visible.length} fiche${visible.length > 1 ? 's' : ''} · comptes auxiliaires et informations de règlement`;
  renderThirdpartyOptions();
}

function openThirdPartyModal(thirdPartyId = null) {
  editingThirdPartyId = thirdPartyId;
  const thirdParty = thirdPartyId ? currentThirdParties().find((item) => item.id === thirdPartyId) : null;
  $('#thirdpartyModalTitle').textContent = thirdParty ? 'Modifier un tiers' : `Ajouter ${THIRD_PARTY_TYPE_LABELS[currentThirdpartyType].toLowerCase().replace('s', '')}`;
  $('#thirdpartySubmitButton').textContent = thirdParty ? 'Enregistrer les modifications' : 'Ajouter le tiers';
  $('#thirdpartyOriginalId').value = thirdParty?.id || '';
  $('#thirdpartyType').value = thirdParty?.type || currentThirdpartyType;
  $('#thirdpartyType').disabled = Boolean(thirdParty);
  $('#thirdpartyCode').value = thirdParty?.code || '';
  $('#thirdpartyName').value = thirdParty?.name || '';
  $('#thirdpartyIfu').value = thirdParty?.ifu || '';
  $('#thirdpartyAddress').value = thirdParty?.address || '';
  $('#thirdpartyPhone').value = thirdParty?.phone || '';
  $('#paymentTerms').value = thirdParty?.paymentTerms || 'Comptant';
  $('#collectiveAccountId').value = thirdParty?.collectiveAccountId || THIRD_PARTY_DEFAULT_ACCOUNTS[currentThirdpartyType];
  $('#collectiveAccountId').disabled = Boolean(thirdParty);
  updateAuxiliaryPreview();
  openModal('thirdpartyModal');
}

function saveThirdParty(event) {
  event.preventDefault();
  if (!requirePermission(USER_PERMISSIONS.SETTINGS_MANAGE)) return;
  const formData = new FormData(event.currentTarget);
  const existing = editingThirdPartyId ? currentThirdParties().find((item) => item.id === editingThirdPartyId) : null;
  const type = String(formData.get('thirdpartyType') || existing?.type || currentThirdpartyType);
  const input = { id: String(formData.get('thirdpartyOriginalId') || `tp-${Date.now()}`), type, code: formData.get('thirdpartyCode'), name: formData.get('thirdpartyName'), ifu: formData.get('thirdpartyIfu'), address: formData.get('thirdpartyAddress'), phone: formData.get('thirdpartyPhone'), paymentTerms: formData.get('paymentTerms'), collectiveAccountId: formData.get('collectiveAccountId') || existing?.collectiveAccountId || THIRD_PARTY_DEFAULT_ACCOUNTS[type], currency: 'XOF', active: true };
  try {
    const list = currentThirdParties();
    let saved;
    if (editingThirdPartyId) {
      saved = updateThirdPartyInDirectory(list, editingThirdPartyId, input);
    } else {
      saved = addThirdPartyToDirectory(list, input, currentAccountSetup().accounts);
      const added = saved.at(-1);
      const setup = currentAccountSetup();
      if (!setup.accounts.some((account) => account.id === added.auxiliaryAccountId)) setup.accounts = addAccountToPlan(setup.accounts, { id: added.auxiliaryAccountId, label: `${added.collectiveAccountId} — ${added.name}`, nature: type === THIRD_PARTY_TYPES.CLIENT ? 'Actif / tiers' : type === THIRD_PARTY_TYPES.SUPPLIER ? 'Passif / tiers' : 'Tiers', isCustom: true });
    }
    appState.thirdParties[appState.activeCompany] = saved;
    appState.auditEvents.push({ type: editingThirdPartyId ? 'THIRD_PARTY_UPDATED' : 'THIRD_PARTY_CREATED', companyId: appState.activeCompany, thirdPartyId: input.id, at: new Date().toISOString() });
    persistAppState();
    closeModal();
    renderThirdpartyList();
    renderAccountPlan();
    showToast(editingThirdPartyId ? 'Fiche tiers mise à jour.' : 'Tiers ajouté avec son compte auxiliaire.');
  } catch (error) { showToast(error.message); }
}

function exportThirdParties() {
  const company = appState.companies[appState.activeCompany];
  const content = ['SOCIETE;'+company.name, 'TYPE;CODE;NOM;COMPTE_AUXILIAIRE;COMPTE_COLLECTIF;IFU;CONDITIONS', ...currentThirdParties().map((thirdParty) => [THIRD_PARTY_TYPE_LABELS[thirdParty.type], thirdParty.code, thirdParty.name, thirdParty.auxiliaryAccountId, thirdParty.collectiveAccountId, thirdParty.ifu, thirdParty.paymentTerms].join(';'))].join('\r\n') + '\r\n';
  downloadText(`${company.code || company.shortName}-tiers.txt`, content);
  showToast('Les tiers de la société ont été exportés.');
}

let currentBankView = 'reconciliation';
let pendingBankImport = [];
let pendingBankImputationId = null;

function bankStatusLabel(status) {
  return ({ RECONCILED: ['Rapproché', 'status-green'], POINTED: ['Pointé', 'status-purple'], UNMATCHED: ['À pointer', 'status-amber'] })[status] || ['À contrôler', 'status-amber'];
}

function treasuryMovementForEntry(entry) {
  if (!entry || !['BQ', 'CA'].includes(entry.journalId)) return null;
  const treasuryLines = (entry.lines || []).filter((line) => String(line.accountId || '').startsWith('5'));
  if (treasuryLines.length !== 1) return null;
  const line = treasuryLines[0];
  const credit = Number(line.debit || 0);
  const debit = Number(line.credit || 0);
  const amount = credit || debit;
  if (!Number.isFinite(amount) || amount <= 0 || (credit > 0 && debit > 0)) return null;
  return {
    id: `bank-entry-${entry.id}`,
    companyId: entry.companyId,
    date: entry.date,
    reference: entry.reference || '',
    label: entry.label || 'Mouvement de trésorerie',
    debit,
    credit,
    amount,
    currency: entry.currency || 'XOF',
    treasuryAccountId: line.accountId,
    treasuryType: entry.journalId === 'CA' || String(line.accountId).startsWith('57') ? 'CASH' : 'BANK',
    origin: 'ACCOUNTING',
    status: 'POINTED',
    matchedEntryId: entry.id,
    importedAt: new Date().toISOString()
  };
}

function ensureTreasuryMovements() {
  const activeCompanyId = appState.activeCompany;
  let added = false;
  for (const entry of (appState.integratedEntries || []).filter((item) => item.companyId === activeCompanyId && item.status !== OPERATION_STATES.CANCELLED)) {
    const movement = treasuryMovementForEntry(entry);
    if (!movement) continue;
    const alreadyRecorded = (appState.bankMovements || []).some((item) => item.matchedEntryId === entry.id || item.id === movement.id);
    const statementAlreadyLinked = (appState.bankMovements || []).some((item) => (item.origin === 'STATEMENT' || String(item.id).startsWith('imported-bank-')) && item.matchedEntryId === entry.id);
    if (alreadyRecorded || statementAlreadyLinked) continue;
    appState.bankMovements.unshift(movement);
    added = true;
  }
  if (added) persistAppState();
}

function bankEntryMatchesMovement(movement, entry) {
  if (!movement || !entry || movement.companyId !== entry.companyId) return false;
  const entryAmount = Number(entry.amount || entry.debit || entry.credit || 0);
  if (!Number.isFinite(entryAmount) || Math.abs(entryAmount - Number(movement.amount || 0)) > 0.005) return false;
  const lines = Array.isArray(entry.lines) ? entry.lines : [];
  if (!lines.length) return true;
  const treasuryAccountId = String(movement.treasuryAccountId || '5211');
  const treasuryLine = lines.find((line) => String(line.accountId) === treasuryAccountId || String(line.accountId || '').startsWith('5'));
  if (!treasuryLine) return true;
  if (Number(movement.debit || 0) > 0) return Math.abs(Number(treasuryLine.credit || 0) - Number(movement.amount || 0)) < 0.005;
  return Math.abs(Number(treasuryLine.debit || 0) - Number(movement.amount || 0)) < 0.005;
}

function findBankCandidate(movement) {
  const candidates = appState.integratedEntries.filter((entry) => {
    if (entry.companyId !== movement.companyId || entry.status === OPERATION_STATES.CANCELLED || !bankEntryMatchesMovement(movement, entry)) return false;
    const alreadyMatchedByStatement = appState.bankMovements.some((item) => item.id !== movement.id && item.origin === 'STATEMENT' && item.matchedEntryId === entry.id);
    return !alreadyMatchedByStatement;
  });
  return candidates.map((entry) => {
    let score = 0;
    if (movement.reference && entry.reference && String(movement.reference).toLowerCase() === String(entry.reference).toLowerCase()) score += 12;
    if (movement.date && entry.date === movement.date) score += 6;
    if (entry.journalId === 'BQ') score += 4;
    if (Array.isArray(entry.lines) && entry.lines.length) score += 8;
    return { entry, score };
  }).sort((a, b) => b.score - a.score)[0]?.entry || null;
}

function renderBankSummary(movements) {
  const company = appState.companies[appState.activeCompany];
  if (!company) return;
  const opening = parseUiAmount(company.bankOpeningBalance ?? company.treasury ?? 0);
  const isStatementMovement = (movement) => movement.origin === 'STATEMENT' || String(movement.id).startsWith('imported-bank-');
  const accounting = movements.filter((movement) => !isStatementMovement(movement));
  const statement = movements.filter(isStatementMovement);
  const accountingEntryIds = new Set(accounting.map((movement) => movement.matchedEntryId).filter(Boolean));
  const matchedStatementMovements = statement.filter((movement) => movement.matchedEntryId && !accountingEntryIds.has(movement.matchedEntryId));
  const bookMovements = [...accounting, ...matchedStatementMovements];
  const net = (items) => items.reduce((sum, movement) => sum + Number(movement.credit || 0) - Number(movement.debit || 0), 0);
  const bookBalance = opening + net(bookMovements);
  const statementBalance = opening + net(statement);
  const difference = Math.abs(bookBalance - statementBalance);
  const unmatched = statement.filter((movement) => movement.status !== 'RECONCILED');
  const reconciled = statement.length ? statement.filter((movement) => movement.status === 'RECONCILED').length : movements.filter((movement) => movement.status === 'RECONCILED').length;
  const total = statement.length || movements.length;
  $('#bankBookBalance').innerHTML = `${numberLabel(bookBalance)} <em>FCFA</em>`;
  $('#bankStatementBalance').innerHTML = `${numberLabel(statementBalance)} <em>FCFA</em>`;
  $('#bankDifference').innerHTML = `${numberLabel(difference)} <em>FCFA</em>`;
  $('#bankDifferenceLabel').textContent = unmatched.length ? `${unmatched.length} mouvement${unmatched.length > 1 ? 's' : ''} à expliquer` : 'Écart expliqué';
  $('#bankReconciledCount').textContent = `${reconciled} / ${total}`;
}

function renderBankMovements() {
  ensureTreasuryMovements();
  const rows = $('#bankMovementRows');
  if (!rows) return;
  const filter = currentBankView === 'unmatched' ? 'UNMATCHED' : 'ALL';
  const movements = (appState.bankMovements || []).filter((movement) => movement.companyId === appState.activeCompany && (filter === 'ALL' || movement.status === filter));
  rows.innerHTML = movements.map((movement) => {
    const [statusLabelText, statusClass] = bankStatusLabel(movement.status);
    const matchedEntry = movement.matchedEntryId && appState.integratedEntries.find((entry) => entry.id === movement.matchedEntryId);
    const proposedEntry = !matchedEntry ? findBankCandidate(movement) : null;
    const match = matchedEntry || proposedEntry;
    const matchLabel = match ? `${match.reference || match.label}${proposedEntry ? ' · proposition' : ''}` : 'Aucune correspondance';
    const isStatement = movement.origin === 'STATEMENT' || String(movement.id).startsWith('imported-bank-');
    const imputeAction = isStatement && movement.status !== 'RECONCILED' ? `<button class="text-button table-action" type="button" data-action="impute-bank-movement" data-bank-id="${escapeHtml(movement.id)}">Imputer</button>` : '';
    const reconcileAction = movement.status === 'RECONCILED' ? '<span class="entry-locked" title="Mouvement rapproché">✓</span>' : `<button class="button button-secondary button-small" type="button" data-action="reconcile-bank" data-bank-id="${escapeHtml(movement.id)}">${movement.status === 'POINTED' ? 'Rapprocher' : proposedEntry ? 'Rapprocher la proposition' : 'Pointer'}</button>`;
    const action = `<div class="table-actions">${imputeAction}${reconcileAction}</div>`;
    return `<tr><td>${escapeHtml(displayDate(movement.date))}</td><td><span class="cell-title">${escapeHtml(movement.label)}</span></td><td><b>${escapeHtml(movement.reference || '—')}</b></td><td class="align-right">${movement.debit ? numberLabel(movement.debit) : '—'}</td><td class="align-right amount-positive">${movement.credit ? numberLabel(movement.credit) : '—'}</td><td>${match ? `<span class="bank-match">${escapeHtml(matchLabel)}</span>` : '<span class="bank-no-match">Aucune correspondance</span>'}</td><td><span class="status ${statusClass}">${statusLabelText}</span></td><td>${action}</td></tr>`;
  }).join('');
  if (!movements.length) rows.innerHTML = '<tr><td colspan="8" class="dossier-empty">Aucun mouvement dans cette vue.</td></tr>';
  renderBankSummary((appState.bankMovements || []).filter((movement) => movement.companyId === appState.activeCompany));
}

function renderTreasury() {
  ensureTreasuryMovements();
  const rows = $('#treasuryMovementRows');
  const company = appState.companies[appState.activeCompany];
  if (!rows || !company) return;
  const allMovements = (appState.bankMovements || []).filter((movement) => movement.companyId === appState.activeCompany);
  const movements = allMovements.filter((movement) => movement.origin !== 'STATEMENT');
  const chronological = movements.slice().sort((a, b) => `${a.date || ''} ${a.importedAt || ''}`.localeCompare(`${b.date || ''} ${b.importedAt || ''}`));
  let balance = parseUiAmount(company.treasury || 0);
  const withBalance = chronological.map((movement) => {
    balance += Number(movement.credit || 0) - Number(movement.debit || 0);
    return { movement, balance };
  }).reverse();
  const receipts = movements.reduce((sum, movement) => sum + Number(movement.credit || 0), 0);
  const payments = movements.reduce((sum, movement) => sum + Number(movement.debit || 0), 0);
  const total = parseUiAmount(company.treasury || 0) + receipts - payments;
  $('#treasuryTotalAvailable').innerHTML = `${numberLabel(total)} <small>FCFA</small>`;
  $('#treasuryReceipts').innerHTML = `${numberLabel(receipts)} <small>FCFA</small>`;
  $('#treasuryPayments').innerHTML = `${numberLabel(payments)} <small>FCFA</small>`;
  $('#treasuryReceiptCount').textContent = `${movements.filter((movement) => Number(movement.credit || 0) > 0).length} opération${movements.filter((movement) => Number(movement.credit || 0) > 0).length > 1 ? 's' : ''}`;
  $('#treasuryPaymentCount').textContent = `${movements.filter((movement) => Number(movement.debit || 0) > 0).length} opération${movements.filter((movement) => Number(movement.debit || 0) > 0).length > 1 ? 's' : ''}`;
  $('#treasuryMovementSubtitle').textContent = `${movements.length} mouvement${movements.length > 1 ? 's' : ''} de trésorerie comptabilisé${movements.length > 1 ? 's' : ''}`;
  rows.innerHTML = withBalance.map(({ movement, balance: after }) => {
    const [statusText, statusClass] = bankStatusLabel(movement.status);
    const amount = Number(movement.amount || movement.debit || movement.credit || 0);
    const isDebit = Number(movement.debit || 0) > 0;
    return `<tr><td>${escapeHtml(displayDate(movement.date))}</td><td><span class="cell-title">${escapeHtml(movement.label)}</span><small class="cell-subtitle">${escapeHtml(movement.reference || 'Sans référence')}</small></td><td>${escapeHtml(`${movement.treasuryAccountId || '5211'} · ${isDebit ? 'Décaissement' : 'Encaissement'}`)}</td><td class="align-right ${isDebit ? '' : 'amount-positive'}">${isDebit ? '−' : '+'} ${numberLabel(amount)} FCFA</td><td>${numberLabel(after)} FCFA</td><td><span class="status ${statusClass}">${escapeHtml(statusText)}</span></td></tr>`;
  }).join('');
  if (!movements.length) rows.innerHTML = '<tr><td colspan="6" class="dossier-empty">Aucun mouvement de trésorerie enregistré.</td></tr>';
}

function renderBankImportPreview() {
  const container = $('#bankImportRows');
  if (!container) return;
  container.innerHTML = pendingBankImport.map((movement) => `<div class="bank-import-row"><span>${escapeHtml(displayDate(movement.date))}</span><strong>${escapeHtml(movement.label)}</strong><span>${escapeHtml(movement.reference || '—')}</span><b>${movement.debit ? `− ${numberLabel(movement.debit)}` : `+ ${numberLabel(movement.credit)}`} FCFA</b></div>`).join('');
  $('#bankImportSummary').textContent = `${pendingBankImport.length} mouvement${pendingBankImport.length > 1 ? 's' : ''} détecté${pendingBankImport.length > 1 ? 's' : ''}`;
}

function setBankView(view) {
  currentBankView = view;
  $$('.bank-tab').forEach((tab) => { const active = tab.dataset.bankView === view; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); });
  const reconciliation = $('#bankReconciliationPane');
  const importPane = $('#bankImportPane');
  const cashPane = $('#cashPane');
  if (view === 'import') { reconciliation?.setAttribute('hidden', ''); cashPane?.setAttribute('hidden', ''); importPane?.removeAttribute('hidden'); }
  else if (view === 'cash') { reconciliation?.setAttribute('hidden', ''); importPane?.setAttribute('hidden', ''); cashPane?.removeAttribute('hidden'); }
  else { reconciliation?.removeAttribute('hidden'); importPane?.setAttribute('hidden', ''); cashPane?.setAttribute('hidden', ''); renderBankMovements(); }
}

function reconcileBankMovementById(movementId) {
  const index = appState.bankMovements.findIndex((movement) => movement.id === movementId && movement.companyId === appState.activeCompany);
  if (index < 0) return;
  const movement = appState.bankMovements[index];
  const candidate = movement.matchedEntryId ? appState.integratedEntries.find((entry) => entry.id === movement.matchedEntryId) : findBankCandidate(movement);
  if (!candidate) { movement.status = 'POINTED'; persistAppState(); renderBankMovements(); renderTreasury(); showToast('Mouvement pointé. Aucune correspondance automatique sûre.'); return; }
  if (!bankEntryMatchesMovement(movement, candidate)) { showToast('Le sens ou le montant du mouvement ne correspond pas à cette écriture.'); return; }
  try {
    appState.bankMovements[index] = reconcileBankMovement(movement, candidate);
    persistAppState();
    renderBankMovements();
    renderTreasury();
    showToast('Mouvement rapproché avec le journal BQ.');
  } catch (error) { showToast(error.message); }
}

function openBankMovementInEntry(movementId) {
  const movement = (appState.bankMovements || []).find((item) => item.id === movementId && item.companyId === appState.activeCompany);
  if (!movement) { showToast('Mouvement bancaire introuvable.'); return; }
  const tab = document.querySelector('.entry-tab[data-entry-tab="free"]');
  if (!tab) { showToast('La saisie centrale est indisponible.'); return; }
  openView('entry');
  selectEntryTab(tab);
  const amount = Number(movement.amount || movement.debit || movement.credit || 0);
  const label = movement.label || 'Mouvement bancaire';
  const isDebit = Number(movement.debit || 0) > 0;
  const isFee = /frais|commission|agios|tenue de compte/i.test(label);
  $('#entryDate').value = movement.date || '';
  $('#entryJournal').value = 'BQ';
  $('#entryReference').value = movement.reference || '';
  $('#entryLabel').value = label;
  $('#entryAmount').value = numberLabel(amount);
  $('#entryCategory').value = isFee ? 'bank-fee' : 'other';
  renderThirdpartyOptions();
  $('#entryThirdParty').value = 'none';
  toggleManualEntryParty();
  manualLineOverride = isDebit
    ? [{ accountId: isFee ? '6318' : '4711', label: isFee ? 'Frais bancaires' : 'Mouvement à qualifier', debit: amount, credit: 0 }, { accountId: '5211', label: 'Banque', debit: 0, credit: amount }]
    : [{ accountId: '5211', label: 'Banque', debit: amount, credit: 0 }, { accountId: isFee ? '7581' : '4711', label: isFee ? 'Produit bancaire' : 'Mouvement à qualifier', debit: 0, credit: amount }];
  pendingBankImputationId = movement.id;
  const source = $('#entryBankSource');
  if (source) { $('#entryBankSourceText').textContent = `Relevé bancaire · ${movement.reference || 'sans référence'} · ${numberLabel(amount)} FCFA`; source.removeAttribute('hidden'); }
  renderLivePosting();
  showToast('Imputation proposée. Corrigez les lignes si nécessaire, puis insérez l’écriture.');
}

function openBankImport() {
  pendingBankImport = [];
  $('#bankFileInput').value = '';
  $('#bankFileName').textContent = 'Déposez votre relevé ici';
  $('#bankImportResult')?.setAttribute('hidden', '');
  setBankView('import');
}

function parseBankFile(file) {
  if (!file) return;
  const extension = file.name.toLowerCase().split('.').pop();
  if (!['txt', 'csv'].includes(extension)) { showToast('Pour ce premier import, utilisez un relevé TXT ou CSV.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || '');
    const delimiter = text.includes(';') ? ';' : text.includes('\t') ? '\t' : ',';
    const parsed = parseDelimited(text, { delimiter });
    const headers = Object.fromEntries(parsed.headers.map((value) => [value.toLowerCase().replace(/[^a-zà-ÿ]/g, ''), value]));
    const getHeader = (names) => names.map((name) => headers[name]).find(Boolean);
    const dateHeader = getHeader(['date', 'dateoperation']) || parsed.headers[0];
    const labelHeader = getHeader(['libelle', 'description', 'operation']) || parsed.headers[1];
    const referenceHeader = getHeader(['reference', 'ref', 'numero']) || parsed.headers[2];
    const debitHeader = getHeader(['debit', 'sortie']) || parsed.headers[3];
    const creditHeader = getHeader(['credit', 'entree']) || parsed.headers[4];
    try {
      pendingBankImport = parsed.rows.map((row, index) => ({ ...createBankMovement({ id: `imported-bank-${Date.now()}-${index}`, companyId: appState.activeCompany, date: row[dateHeader], label: row[labelHeader], reference: row[referenceHeader], debit: row[debitHeader], credit: row[creditHeader] }), origin: 'STATEMENT' }));
      $('#bankFileName').textContent = file.name;
      $('#bankImportResult')?.removeAttribute('hidden');
      renderBankImportPreview();
    } catch (error) { showToast(error.message); }
  };
  reader.readAsText(file);
}

function applyBankImport() {
  if (!pendingBankImport.length) { showToast('Aucun mouvement à intégrer.'); return; }
  appState.bankMovements = [...pendingBankImport, ...(appState.bankMovements || [])];
  appState.auditEvents.push({ type: 'BANK_STATEMENT_IMPORTED', companyId: appState.activeCompany, count: pendingBankImport.length, at: new Date().toISOString() });
  persistAppState();
  pendingBankImport = [];
  setBankView('reconciliation');
  renderTreasury();
  showToast('Relevé intégré. Les mouvements sont prêts à être pointés.');
}

const PAYMENT_TYPE_LABELS = { RECEIPT: 'Encaissement client', PAYMENT: 'Paiement fournisseur' };

function paymentPartyType() {
  return currentPaymentType === PAYMENT_TYPES.RECEIPT ? THIRD_PARTY_TYPES.CLIENT : THIRD_PARTY_TYPES.SUPPLIER;
}

function manualPaymentParty() {
  const name = $('#paymentManualParty')?.value.trim() || '';
  if (!name) return null;
  const type = paymentPartyType();
  const collectiveAccountId = THIRD_PARTY_DEFAULT_ACCOUNTS[type];
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'tiers';
  const prefix = type === THIRD_PARTY_TYPES.CLIENT ? 'CLI' : 'FOU';
  return { id: `manual-payment-${currentPaymentType.toLowerCase()}-${slug}`, code: `${prefix}-${slug}`.toUpperCase(), name, type, collectiveAccountId, auxiliaryAccountId: collectiveAccountId, currency: 'XOF', active: true, manual: true };
}

function toggleManualPaymentParty({ focus = false } = {}) {
  const select = $('#paymentParty');
  const field = $('#paymentManualPartyField');
  const input = $('#paymentManualParty');
  const manual = select?.value === 'manual';
  if (select) select.required = !manual;
  field?.toggleAttribute('hidden', !manual);
  const type = paymentPartyType();
  if ($('#paymentManualPartyLabel')) $('#paymentManualPartyLabel').innerHTML = `Nom du ${type === THIRD_PARTY_TYPES.CLIENT ? 'client' : 'fournisseur'} <b>*</b>`;
  if (input) {
    input.required = manual;
    if (!manual) input.value = '';
    if (manual && focus) window.setTimeout(() => input.focus(), 0);
  }
}

function currentPaymentParty() {
  const select = $('#paymentParty');
  if (select?.value === 'manual') return manualPaymentParty();
  return currentThirdParties().find((thirdParty) => thirdParty.id === select?.value) || null;
}

function ensureManualPaymentParty(payment) {
  if (!payment?.manual) return payment;
  const partyType = payment.type === PAYMENT_TYPES.RECEIPT ? THIRD_PARTY_TYPES.CLIENT : THIRD_PARTY_TYPES.SUPPLIER;
  const existing = currentThirdParties().find((party) => party.type === partyType && party.name.toLowerCase() === payment.thirdPartyName.toLowerCase());
  if (existing) return { ...payment, thirdPartyId: existing.id, thirdPartyAccountId: existing.auxiliaryAccountId, manual: false };
  const setup = currentAccountSetup();
  const created = addThirdPartyToDirectory(currentThirdParties(), { ...manualPaymentParty(), auxiliaryAccountId: nextThirdPartyAuxiliary(THIRD_PARTY_DEFAULT_ACCOUNTS[partyType]) }, setup.accounts);
  const party = created.at(-1);
  appState.thirdParties[appState.activeCompany] = created;
  if (!setup.accounts.some((account) => account.id === party.auxiliaryAccountId)) setup.accounts = addAccountToPlan(setup.accounts, { id: party.auxiliaryAccountId, label: `${party.collectiveAccountId} — ${party.name}`, nature: partyType === THIRD_PARTY_TYPES.CLIENT ? 'Actif / tiers' : 'Passif / tiers', isCustom: true });
  return { ...payment, thirdPartyId: party.id, thirdPartyAccountId: party.auxiliaryAccountId, manual: false };
}

function paymentDocuments() {
  const type = currentPaymentType === PAYMENT_TYPES.RECEIPT ? 'SALE' : 'PURCHASE';
  const partyId = $('#paymentParty')?.value;
  const collection = type === 'SALE' ? appState.invoices : appState.purchaseBills;
  return collection.filter((document) => document.companyId === appState.activeCompany && document.thirdPartyId === partyId && ['POSTED', 'PARTIAL'].includes(document.status) && (document.outstanding ?? document.totalInclTax) > 0);
}

function renderPaymentPartyOptions() {
  const select = $('#paymentParty');
  if (!select) return;
  const type = paymentPartyType();
  const parties = currentThirdParties().filter((thirdParty) => thirdParty.type === type && thirdParty.active !== false);
  select.innerHTML = `${parties.map((party) => `<option value="${escapeHtml(party.id)}">${escapeHtml(party.name)} · ${escapeHtml(party.auxiliaryAccountId)}</option>`).join('')}<option value="manual">+ Saisir un ${type === THIRD_PARTY_TYPES.CLIENT ? 'nouveau client' : 'nouveau fournisseur'}</option>`;
  if (parties.length) select.value = parties[0].id;
  else select.value = 'manual';
  toggleManualPaymentParty();
}

function renderPaymentDocuments() {
  const container = $('#paymentDocuments');
  if (!container) return;
  const documents = paymentDocuments();
  const hasAmount = parseUiAmount($('#paymentAmount')?.value || '') || 0;
  if (!documents.length) { container.innerHTML = '<div class="payment-documents-empty">Aucune facture ouverte pour ce tiers.</div>'; updatePaymentPreview(); return; }
  container.innerHTML = documents.map((document) => {
    const outstanding = document.outstanding ?? document.totalInclTax;
    const allocation = paymentAllocations[document.id] ?? Math.min(outstanding, hasAmount);
    const checked = paymentAllocations[document.id] !== undefined || (documents.length === 1 && hasAmount > 0);
    if (checked && paymentAllocations[document.id] === undefined) paymentAllocations[document.id] = allocation;
    return `<label class="payment-document-row"><input class="payment-allocation-check" type="checkbox" data-payment-document="${escapeHtml(document.id)}" ${checked ? 'checked' : ''}><span class="payment-document-copy"><strong>${escapeHtml(document.reference)}</strong><small>${escapeHtml(document.thirdPartyName)} · Échéance ${escapeHtml(displayDate(document.dueDate))}</small></span><span class="payment-document-outstanding"><small>À régler</small><b>${numberLabel(outstanding)} FCFA</b></span><span class="payment-allocation-input"><input type="text" value="${checked ? escapeHtml(allocation) : ''}" placeholder="0" data-payment-allocation="${escapeHtml(document.id)}"><small>FCFA</small></span></label>`;
  }).join('');
  updatePaymentPreview();
}

function readPaymentAllocations() {
  const allocations = [];
  $$('.payment-allocation-check:checked').forEach((checkbox) => {
    const id = checkbox.dataset.paymentDocument;
    const field = $(`[data-payment-allocation="${id}"]`);
    const value = parseUiAmount(field?.value || '');
    if (Number.isFinite(value) && value > 0) allocations.push({ documentId: id, amount: value });
  });
  return allocations;
}

function buildPaymentDraft() {
  const selected = $('#paymentParty')?.value;
  const party = currentPaymentParty();
  if (!party) throw new Error(selected === 'manual' ? 'Saisissez le nom du tiers avant le règlement.' : 'Sélectionnez un tiers pour le règlement.');
  const payment = createPayment({ companyId: appState.activeCompany, type: currentPaymentType, thirdPartyId: party.id, thirdPartyName: party.name, thirdPartyAccountId: party.auxiliaryAccountId, date: $('#paymentDate').value, reference: $('#paymentReference').value.trim(), amount: $('#paymentAmount').value, method: $('#paymentMethod').value, treasuryAccountId: $('#paymentTreasuryAccount').value });
  return party.manual ? { ...payment, manual: true } : payment;
}

function updatePaymentPreview() {
  const party = currentPaymentParty();
  const amount = parseUiAmount($('#paymentAmount')?.value || '') || 0;
  const previewLines = party && amount > 0 ? paymentToJournalLines({ type: currentPaymentType, amount, method: $('#paymentMethod')?.value || 'Virement', thirdPartyName: party.name, thirdPartyAccountId: party.auxiliaryAccountId, treasuryAccountId: $('#paymentTreasuryAccount')?.value || '5211' }) : [];
  const lines = $('#paymentPostingLines');
  if (lines) lines.innerHTML = previewLines.length ? previewLines.map((line) => `<div class="document-posting-row"><span><b>${escapeHtml(line.accountId)}</b><small>${escapeHtml(line.label)}</small></span><strong>${numberLabel(line.debit || line.credit)}</strong><em class="${line.debit ? '' : 'credit'}">${line.debit ? 'D' : 'C'}</em></div>`).join('') : '<div class="payment-documents-empty">Saisissez un montant pour voir l’imputation.</div>';
  if ($('#paymentPostingTotal')) $('#paymentPostingTotal').innerHTML = `${numberLabel(amount)} <small>FCFA</small>`;
  const allocated = readPaymentAllocations().reduce((sum, allocation) => sum + allocation.amount, 0);
  if ($('#paymentUnallocated')) $('#paymentUnallocated').textContent = `Non affecté : ${numberLabel(Math.max(0, amount - allocated))} FCFA`;
  if ($('#paymentPreviewNote')) $('#paymentPreviewNote').textContent = allocated ? `${numberLabel(allocated)} FCFA affectés · le solde sera mis à jour après insertion.` : 'L’affectation sera proposée à partir du règlement saisi.';
}

function renderPaymentHistory() {
  const rows = $('#paymentRows');
  if (!rows) return;
  const payments = (appState.payments || []).filter((payment) => payment.companyId === appState.activeCompany);
  rows.innerHTML = payments.slice().reverse().map((payment) => {
    const entry = payment.journalEntryId && appState.recentEntries.find((item) => item.id === payment.journalEntryId);
    const editable = !entry || ![OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status);
    const editAction = editable ? `<button class="text-button table-action" type="button" data-action="edit-payment-imputation" data-payment-id="${escapeHtml(payment.id)}">Modifier l’imputation</button>` : '<span class="table-action-locked">Verrouillée</span>';
    return `<tr><td><b>${escapeHtml(payment.reference)}</b></td><td>${escapeHtml(displayDate(payment.date))}</td><td>${escapeHtml(payment.thirdPartyName)}</td><td><span class="journal-badge ${payment.type === PAYMENT_TYPES.RECEIPT ? 'journal-badge-teal' : 'journal-badge-blue'}">${payment.type === PAYMENT_TYPES.RECEIPT ? 'Encaissement' : 'Paiement'}</span></td><td class="align-right">${numberLabel(payment.amount)} FCFA</td><td>${numberLabel(payment.allocatedAmount || 0)} FCFA</td><td><span class="status ${payment.status === 'ALLOCATED' ? 'status-green' : 'status-amber'}">${payment.status === 'ALLOCATED' ? 'Affecté' : 'Partiel'}</span></td><td><div class="table-actions">${editAction}</div></td></tr>`;
  }).join('');
  if (!payments.length) rows.innerHTML = '<tr><td colspan="8" class="dossier-empty">Aucun règlement enregistré.</td></tr>';
  if ($('#paymentCount')) $('#paymentCount').textContent = String(payments.length);
}

function renderLettering() {
  const rows = $('#letteringRows');
  if (!rows) return;
  const documents = [...appState.invoices, ...appState.purchaseBills].filter((document) => document.companyId === appState.activeCompany && document.status !== 'DRAFT');
  const content = documents.map((document) => `<div class="lettering-row"><span class="lettering-status ${document.lettered ? 'is-lettered' : ''}">${document.lettered ? '✓' : '·'}</span><span><strong>${escapeHtml(document.reference)}</strong><small>${escapeHtml(document.thirdPartyName)} · ${document.type === 'SALE' ? 'Client' : 'Fournisseur'}</small></span><span><small>Facture</small><b>${numberLabel(document.totalInclTax)} FCFA</b></span><span><small>Solde</small><b>${numberLabel(document.outstanding ?? document.totalInclTax)} FCFA</b></span><span class="status ${document.lettered ? 'status-green' : 'status-amber'}">${document.lettered ? 'Lettrée' : 'En attente'}</span></div>`).join('');
  rows.innerHTML = content || '<div class="payment-documents-empty">Aucune facture à lettrer.</div>';
}

function setPaymentType(type) {
  $$('.payment-tab').forEach((tab) => { const active = tab.dataset.paymentType === type; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); });
  const inCentralEntry = $('#view-entry')?.classList.contains('is-visible');
  if (type === 'LETTERING') {
    $('#paymentEntryPane')?.setAttribute('hidden', '');
    if (!inCentralEntry) $('#letteringPane')?.removeAttribute('hidden');
    renderLettering();
    return;
  }
  currentPaymentType = type;
  if (inCentralEntry) {
    $('#entryDocumentPane')?.removeAttribute('hidden');
    $('#paymentEntryPane')?.removeAttribute('hidden');
    $('#letteringPane')?.setAttribute('hidden', '');
  } else {
    // Gestion/Règlements only displays the follow-up list. Creation remains
    // centralized in Opérations → Saisie et insertion.
    $('#paymentEntryPane')?.setAttribute('hidden', '');
    $('#letteringPane')?.setAttribute('hidden', '');
  }
  const isReceipt = type === PAYMENT_TYPES.RECEIPT;
  $('#paymentTypeTitle').textContent = PAYMENT_TYPE_LABELS[type];
  $('#paymentPartyLabel').innerHTML = `${isReceipt ? 'Client' : 'Fournisseur'} <b>*</b>`;
  $('#paymentJournalLabel').textContent = 'BQ · Banque';
  $('#paymentPreviewTitle').textContent = PAYMENT_TYPE_LABELS[type];
  renderPaymentPartyOptions();
  paymentAllocations = {};
  renderPaymentDocuments();
  renderPaymentHistory();
}

function resetPayment() {
  paymentAllocations = {};
  $('#paymentForm')?.reset();
  $('#paymentDate').value = '2025-06-16';
  $('#paymentReference').value = `REG-2025-${String((appState.payments?.length || 0) + 1).padStart(3, '0')}`;
  $('#paymentAmount').value = '';
  renderPaymentPartyOptions();
  renderPaymentDocuments();
  updatePaymentPreview();
  showToast('Nouveau règlement prêt à être saisi.');
}

function clearPayment() {
  paymentAllocations = {};
  $('#paymentAmount').value = '';
  renderPaymentDocuments();
  updatePaymentPreview();
}

function postPayment() {
  if (!requirePermission(USER_PERMISSIONS.ENTRIES_CREATE)) return;
  if (!ensureActivePeriodOpen()) return;
  try {
    let payment = buildPaymentDraft();
    payment = ensureManualPaymentParty(payment);
    const documents = paymentDocuments();
    const result = applyPaymentAllocations(payment, documents, readPaymentAllocations());
    const setup = currentAccountSetup();
    const journalEntry = createJournalEntry({ companyId: appState.activeCompany, journalId: 'BQ', date: payment.date, pieceDate: payment.date, reference: payment.reference, label: `${PAYMENT_TYPE_LABELS[payment.type]} — ${payment.thirdPartyName}`, thirdPartyId: payment.thirdPartyId, thirdPartyAccountId: payment.thirdPartyAccountId, settlementDate: payment.date, settlementMode: payment.method, natureOperation: payment.type === PAYMENT_TYPES.RECEIPT ? 'ENCAISSEMENT' : 'PAIEMENT', lines: paymentToJournalLines(payment) }, { activeCompanyId: appState.activeCompany, dossierId: currentDossierCode(appState.activeCompany), accountIds: setup.accounts.map((account) => account.id) });
    const workflowEntry = transitionOperation(transitionOperation(journalEntry, OPERATION_STATES.IMPUTED), OPERATION_STATES.TO_REVIEW);
    const paymentLines = paymentToJournalLines(payment);
    const updatedPayment = { ...result.payment, journalEntryId: workflowEntry.id, imputationLines: paymentLines };
    appState.payments.push(updatedPayment);
    const bankMovement = createBankMovement({ id: `bank-${payment.id}`, companyId: appState.activeCompany, date: payment.date, reference: payment.reference, label: `${PAYMENT_TYPE_LABELS[payment.type]} — ${payment.thirdPartyName}`, debit: payment.type === PAYMENT_TYPES.PAYMENT ? payment.amount : 0, credit: payment.type === PAYMENT_TYPES.RECEIPT ? payment.amount : 0, currency: 'XOF' });
    bankMovement.treasuryAccountId = payment.treasuryAccountId;
    bankMovement.origin = 'ACCOUNTING';
    bankMovement.status = 'POINTED';
    bankMovement.matchedEntryId = workflowEntry.id;
    appState.bankMovements.unshift(bankMovement);
    const collectionKey = payment.type === PAYMENT_TYPES.RECEIPT ? 'invoices' : 'purchaseBills';
    appState[collectionKey] = appState[collectionKey].map((document) => result.documents.find((updated) => updated.id === document.id) || document);
    const synced = syncIntegratedJournal(integratedJournalForCompany(appState.activeCompany), { ...workflowEntry, amount: payment.amount, debit: payment.amount, credit: payment.amount, source: PAYMENT_TYPE_LABELS[payment.type], integrationCategory: 'GENERAL' }).entries[0];
    appState.integratedEntries.unshift(synced);
    appState.recentEntries.unshift({ ...workflowEntry, amount: payment.amount, accountIds: paymentToJournalLines(payment).map((line) => line.accountId) });
    queueSyncChange({ entityType: 'JOURNAL_ENTRY', entityId: workflowEntry.id, companyId: appState.activeCompany, moduleId: 'CSR', payload: { ...workflowEntry, amount: payment.amount, debit: payment.amount, credit: payment.amount, source: PAYMENT_TYPE_LABELS[payment.type], integrationCategory: 'GENERAL' } });
    persistAppState();
    renderPaymentHistory();
    renderPaymentDocuments();
    renderBankMovements();
    renderTreasury();
    renderInvoiceHistory('SALE');
    renderInvoiceHistory('PURCHASE');
    renderIntegratedJournal();
    renderEntryQueue();
    showToast(`${PAYMENT_TYPE_LABELS[payment.type]} inséré dans le brouillard.`);
    resetPayment();
  } catch (error) { showToast(error.message); }
}

function invoiceConfig(type) {
  return type === 'PURCHASE' ? { partyLabel: 'Fournisseur', formPrefix: 'purchase', collection: 'purchaseBills', journalId: 'AC', expenseAccountId: '6047', revenueAccountId: '7061', taxAccountId: '4452', title: 'Facture fournisseur' } : { partyLabel: 'Client', formPrefix: 'sales', collection: 'invoices', journalId: 'VE', expenseAccountId: '6047', revenueAccountId: '7061', taxAccountId: '4431', title: 'Facture client' };
}

function manualInvoiceParty(type) {
  const config = invoiceConfig(type);
  const input = $(`#${config.formPrefix}InvoiceManualParty`);
  const name = input?.value.trim() || '';
  if (!name) return null;
  const partyType = type === 'PURCHASE' ? THIRD_PARTY_TYPES.SUPPLIER : THIRD_PARTY_TYPES.CLIENT;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'tiers';
  const codePrefix = type === 'PURCHASE' ? 'FOU' : 'CLI';
  return { id: `manual-${type.toLowerCase()}-${slug}`, code: `${codePrefix}-${slug}`.toUpperCase(), name, type: partyType, collectiveAccountId: THIRD_PARTY_DEFAULT_ACCOUNTS[partyType], auxiliaryAccountId: THIRD_PARTY_DEFAULT_ACCOUNTS[partyType], currency: 'XOF', active: true, manual: true };
}

function toggleManualInvoiceParty(type, { focus = false } = {}) {
  const config = invoiceConfig(type);
  const select = $(`#${config.formPrefix}Invoice${type === 'PURCHASE' ? 'Supplier' : 'Customer'}`);
  const field = $(`#${config.formPrefix}InvoiceManualPartyField`);
  const input = $(`#${config.formPrefix}InvoiceManualParty`);
  const manual = select?.value === 'manual';
  if (select) select.required = !manual;
  field?.toggleAttribute('hidden', !manual);
  if (input) {
    input.required = manual;
    if (!manual) input.value = '';
    if (manual && focus) window.setTimeout(() => input.focus(), 0);
  }
}

function currentInvoiceParty(type) {
  const config = invoiceConfig(type);
  const select = $(`#${config.formPrefix}Invoice${type === 'PURCHASE' ? 'Supplier' : 'Customer'}`);
  if (select?.value === 'manual') return manualInvoiceParty(type);
  return currentThirdParties().find((thirdParty) => thirdParty.id === select?.value && thirdParty.type === (type === 'PURCHASE' ? THIRD_PARTY_TYPES.SUPPLIER : THIRD_PARTY_TYPES.CLIENT));
}

function ensureManualInvoiceParty(type, document) {
  if (!document.thirdPartyId?.startsWith('manual-')) return document;
  const partyType = type === 'PURCHASE' ? THIRD_PARTY_TYPES.SUPPLIER : THIRD_PARTY_TYPES.CLIENT;
  const existing = currentThirdParties().find((party) => party.type === partyType && party.name.toLowerCase() === document.thirdPartyName.toLowerCase());
  if (existing) return { ...document, thirdPartyId: existing.id, thirdPartyAccountId: existing.auxiliaryAccountId };
  const setup = currentAccountSetup();
  const party = { ...manualInvoiceParty(type), id: document.thirdPartyId, auxiliaryAccountId: nextThirdPartyAuxiliary(THIRD_PARTY_DEFAULT_ACCOUNTS[partyType]) };
  const updatedParties = addThirdPartyToDirectory(currentThirdParties(), party, setup.accounts);
  appState.thirdParties[appState.activeCompany] = updatedParties;
  if (!setup.accounts.some((account) => account.id === party.auxiliaryAccountId)) setup.accounts = addAccountToPlan(setup.accounts, { id: party.auxiliaryAccountId, label: `${party.collectiveAccountId} — ${party.name}`, nature: partyType === THIRD_PARTY_TYPES.CLIENT ? 'Actif / tiers' : 'Passif / tiers', isCustom: true });
  return { ...document, thirdPartyId: party.id, thirdPartyAccountId: party.auxiliaryAccountId };
}

function renderInvoicePartyOptions(type) {
  const config = invoiceConfig(type);
  const select = $(`#${config.formPrefix}Invoice${type === 'PURCHASE' ? 'Supplier' : 'Customer'}`);
  if (!select) return;
  const partyType = type === 'PURCHASE' ? THIRD_PARTY_TYPES.SUPPLIER : THIRD_PARTY_TYPES.CLIENT;
  const parties = currentThirdParties().filter((thirdParty) => thirdParty.type === partyType && thirdParty.active !== false);
  select.innerHTML = `${parties.map((party) => `<option value="${escapeHtml(party.id)}">${escapeHtml(party.name)} · ${escapeHtml(party.auxiliaryAccountId)}</option>`).join('')}<option value="manual">+ Saisir un ${type === 'PURCHASE' ? 'nouveau fournisseur' : 'nouveau client'}</option>`;
  if (parties.length) select.value = parties[0].id;
  else select.value = 'manual';
  toggleManualInvoiceParty(type);
}

function invoiceField(type, name) {
  return $(`#${invoiceConfig(type).formPrefix}Invoice${name.charAt(0).toUpperCase()}${name.slice(1)}`);
}

function renderInvoiceLines(type) {
  const prefix = invoiceConfig(type).formPrefix;
  const container = $(`#${prefix}InvoiceLines`);
  if (!container) return;
  container.innerHTML = invoiceDraftLines[type].map((line, index) => `<div class="invoice-line document-invoice-line"><input type="text" value="${escapeHtml(line.description || '')}" placeholder="Désignation" data-invoice-line="${index}" data-invoice-field="description"><input type="number" min="0" step="1" value="${escapeHtml(line.quantity ?? 1)}" data-invoice-line="${index}" data-invoice-field="quantity"><input type="text" value="${escapeHtml(line.unitPrice ?? 0)}" placeholder="0" data-invoice-line="${index}" data-invoice-field="unitPrice"><strong>${numberLabel((Number(line.quantity) || 0) * (Number(String(line.unitPrice).replace(/\s/g, '').replace(',', '.')) || 0))}</strong><button class="icon-button small" type="button" aria-label="Supprimer la ligne" data-action="remove-invoice-line" data-invoice-type="${type}" data-line-index="${index}" ${invoiceDraftLines[type].length <= 1 ? 'disabled' : ''}><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div>`).join('');
}

function buildInvoice(type) {
  const config = invoiceConfig(type);
  const party = currentInvoiceParty(type);
  const prefix = config.formPrefix;
  if (!party) throw new Error(`Sélectionnez un ${config.partyLabel.toLowerCase()}.`);
  return createInvoiceDocument({ companyId: appState.activeCompany, type, thirdPartyId: party.id, thirdPartyName: party.name, thirdPartyAccountId: party.auxiliaryAccountId, date: $(`#${prefix}InvoiceDate`).value, reference: $(`#${prefix}InvoiceReference`).value.trim(), dueDate: $(`#${prefix}InvoiceDueDate`).value || null, taxRate: $(`#${prefix}InvoiceTaxRate`).value, lines: invoiceDraftLines[type] });
}

function invoicePostingLines(type, document) {
  const config = invoiceConfig(type);
  const generated = documentToJournalLines(document, { revenueAccountId: config.revenueAccountId, expenseAccountId: config.expenseAccountId, salesTaxAccountId: '4431', purchaseTaxAccountId: config.taxAccountId });
  const custom = invoiceImputationOverrides[type];
  if (!custom) return generated;
  const debit = custom.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const credit = custom.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  if (Math.abs(debit - credit) > 0.005 || Math.abs(debit - document.totalInclTax) > 0.005) return generated;
  return custom;
}

function openInvoiceImputationEditor(type, invoiceId = null) {
  const config = invoiceConfig(type);
  const source = invoiceId ? (appState[config.collection] || []).find((item) => item.id === invoiceId) : null;
  let document;
  try { document = source || buildInvoice(type); } catch (error) { showToast(error.message); return; }
  const entryId = source?.journalEntryId || null;
  const entry = entryId && appState.recentEntries.find((item) => item.id === entryId);
  if (entry && [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status)) {
    showToast('Cette écriture est validée et verrouillée. Utilisez une correction contrôlée.');
    return;
  }
  const lines = source?.imputationLines || invoicePostingLines(type, document);
  invoiceImputationOverrides[type] = lines.map((line) => ({ ...line }));
  openManualLineEditor({
    lines,
    title: `Imputation · ${config.title}`,
    context: { kind: 'INVOICE', type, invoiceId, entryId, total: document.totalInclTax, document }
  });
}

function renderInvoicePreview(type) {
  const config = invoiceConfig(type);
  const prefix = config.formPrefix;
  const targetPrefix = type === 'PURCHASE' ? 'purchase' : 'sales';
  let document;
  try { document = buildInvoice(type); } catch (error) {
    const note = $(`#${targetPrefix}InvoicePreviewNote`);
    if (note) note.textContent = error.message;
    return;
  }
  const lines = invoicePostingLines(type, document);
  $(`#${targetPrefix}TotalExclTax`).textContent = `${numberLabel(document.totalExclTax)} FCFA`;
  $(`#${targetPrefix}TaxAmount`).textContent = `${numberLabel(document.tax)} FCFA`;
  $(`#${targetPrefix}TotalInclTax`).textContent = `${numberLabel(document.totalInclTax)} FCFA`;
  $(`#${targetPrefix}PostingTotal`).innerHTML = `${numberLabel(document.totalInclTax)} <small>FCFA</small>`;
  $(`#${targetPrefix}InvoicePosting`).innerHTML = lines.map((line) => `<div class="document-posting-row"><span><b>${escapeHtml(line.accountId)}</b><small>${escapeHtml(line.label)}</small></span><strong>${numberLabel(line.debit || line.credit)}</strong><em class="${line.debit ? '' : 'credit'}">${line.debit ? 'D' : 'C'}</em></div>`).join('');
  const note = $(`#${targetPrefix}InvoicePreviewNote`);
  if (note) note.textContent = `${lines.length} ligne${lines.length > 1 ? 's' : ''} ${invoiceImputationOverrides[type] ? 'personnalisée' : 'd’imputation proposée'}${lines.length > 1 ? 's' : ''} · ${document.taxRate}% de TVA.`;
}

function openInvoiceSource(type, invoiceId) {
  const config = invoiceConfig(type);
  const document = (appState[config.collection] || []).find((item) => item.id === invoiceId);
  if (!document) { showToast('Facture source introuvable.'); return; }
  const tab = document.querySelector(`.entry-tab[data-entry-tab="${type === 'PURCHASE' ? 'purchase' : 'sale'}"]`);
  if (!tab) { showToast('La saisie centrale de cette facture est indisponible.'); return; }
  openView('entry');
  selectEntryTab(tab);
  renderInvoicePartyOptions(type);
  const select = $(`#${config.formPrefix}Invoice${type === 'PURCHASE' ? 'Supplier' : 'Customer'}`);
  if (select && document.thirdPartyId && Array.from(select.options).some((option) => option.value === document.thirdPartyId)) select.value = document.thirdPartyId;
  $(`#${config.formPrefix}InvoiceDate`).value = document.date || '';
  $(`#${config.formPrefix}InvoiceReference`).value = document.reference || '';
  $(`#${config.formPrefix}InvoiceDueDate`).value = document.dueDate || '';
  $(`#${config.formPrefix}InvoiceTaxRate`).value = String(document.taxRate || 0);
  invoiceDraftLines[type] = (document.lines || []).map((line) => ({ ...line }));
  invoiceImputationOverrides[type] = document.imputationLines ? document.imputationLines.map((line) => ({ ...line })) : null;
  renderInvoiceLines(type);
  renderInvoicePreview(type);
  showToast(`${document.reference} affichée depuis sa facture source.`);
}

function renderInvoiceHistory(type) {
  const config = invoiceConfig(type);
  const collection = appState[config.collection] || [];
  const entries = collection.filter((document) => document.companyId === appState.activeCompany);
  const rows = $(`#${config.formPrefix}InvoiceRows`);
  if (!rows) return;
  rows.innerHTML = entries.slice().reverse().map((document) => {
    const settled = (document.outstanding ?? document.totalInclTax) === 0;
    const partial = !settled && (document.paidAmount || 0) > 0;
    const documentStatus = settled ? ['Réglée', 'status-green'] : partial ? ['Partielle', 'status-amber'] : document.status === 'POSTED' ? ['À contrôler', 'status-purple'] : ['Brouillon', 'status-amber'];
    const entry = document.journalEntryId && appState.recentEntries.find((item) => item.id === document.journalEntryId);
    const editable = !entry || ![OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status);
    const editAction = editable && document.status !== 'DRAFT' ? `<button class="text-button table-action" type="button" data-action="edit-saved-invoice-imputation" data-invoice-type="${type}" data-invoice-id="${escapeHtml(document.id)}">Modifier l’imputation</button>` : '';
    const locked = !editable && document.status !== 'DRAFT' ? '<span class="table-action-locked">Verrouillée</span>' : '';
    const paidAmount = Number(document.paidAmount || 0);
    const outstanding = Number(document.outstanding ?? Math.max(0, Number(document.totalInclTax || 0) - paidAmount));
    return `<tr><td><b>${escapeHtml(document.reference)}</b></td><td>${escapeHtml(displayDate(document.date))}</td><td>${escapeHtml(document.thirdPartyName)}</td><td>${escapeHtml(displayDate(document.dueDate))}</td><td class="align-right">${numberLabel(document.totalInclTax)} FCFA</td><td class="align-right">${numberLabel(paidAmount)} FCFA</td><td class="align-right">${numberLabel(outstanding)} FCFA</td><td><span class="status ${documentStatus[1]}">${documentStatus[0]}</span></td><td><div class="table-actions"><button class="text-button table-action" type="button" data-action="view-invoice-source" data-invoice-type="${type}" data-invoice-id="${escapeHtml(document.id)}">Voir la source</button>${editAction}${locked}</div></td></tr>`;
  }).join('');
  if (!entries.length) rows.innerHTML = `<tr><td colspan="9" class="dossier-empty">Aucune facture ${type === 'PURCHASE' ? 'fournisseur' : 'client'} enregistrée.</td></tr>`;
  const count = $(`#${config.formPrefix}InvoiceCount`);
  if (count) count.textContent = String(entries.length);
}

function resetInvoice(type) {
  invoiceImputationOverrides[type] = null;
  invoiceDraftLines[type] = type === 'PURCHASE' ? [{ id: `purchase-line-${Date.now()}`, description: 'Fournitures de bureau', quantity: 1, unitPrice: 38500 }] : [{ id: `sale-line-${Date.now()}`, description: 'Accompagnement administratif', quantity: 1, unitPrice: 250000 }];
  const prefix = invoiceConfig(type).formPrefix;
  $(`#${prefix}InvoiceReference`).value = type === 'PURCHASE' ? `FA-${String((appState.purchaseBills?.length || 0) + 155).padStart(4, '0')}` : `FAC-2025-${String((appState.invoices?.length || 0) + 19).padStart(3, '0')}`;
  renderInvoiceLines(type);
  renderInvoicePreview(type);
}

function saveInvoiceDocument(type, post = false) {
  if (post && !requirePermission(USER_PERMISSIONS.ENTRIES_CREATE)) return;
  if (post && !ensureActivePeriodOpen()) return;
  const config = invoiceConfig(type);
  try {
    let document = buildInvoice(type);
    if (post) document = ensureManualInvoiceParty(type, document);
    const setup = currentAccountSetup();
    const accountLines = invoicePostingLines(type, document);
    let stored = { ...document, imputationLines: accountLines, paidAmount: 0, outstanding: document.totalInclTax, allocations: [], status: post ? 'POSTED' : 'DRAFT' };
    if (post) {
      const entry = createJournalEntry({ companyId: appState.activeCompany, journalId: config.journalId, date: document.date, pieceDate: document.date, reference: document.reference, label: `${config.title} — ${document.thirdPartyName}`, thirdPartyId: document.thirdPartyId, thirdPartyAccountId: document.thirdPartyAccountId, lines: accountLines }, { activeCompanyId: appState.activeCompany, dossierId: currentDossierCode(appState.activeCompany), accountIds: setup.accounts.map((account) => account.id) });
      const workflowEntry = transitionOperation(transitionOperation(entry, OPERATION_STATES.IMPUTED), OPERATION_STATES.TO_REVIEW);
      const total = document.totalInclTax;
      stored = { ...stored, journalEntryId: workflowEntry.id };
      const synced = syncIntegratedJournal(integratedJournalForCompany(appState.activeCompany), { ...workflowEntry, amount: total, debit: total, credit: total, source: config.title, integrationCategory: 'GENERAL' }).entries[0];
      appState.integratedEntries.unshift(synced);
      appState.recentEntries.unshift({ ...workflowEntry, amount: total, accountIds: accountLines.map((line) => line.accountId) });
      queueSyncChange({ entityType: 'JOURNAL_ENTRY', entityId: workflowEntry.id, companyId: appState.activeCompany, moduleId: 'CSR', payload: { ...workflowEntry, amount: total, debit: total, credit: total, source: config.title, integrationCategory: 'GENERAL' } });
    }
    appState[config.collection].push(stored);
    appState.auditEvents.push({ type: post ? 'INVOICE_POSTED' : 'INVOICE_DRAFT_CREATED', companyId: appState.activeCompany, documentId: stored.id, at: new Date().toISOString() });
    persistAppState();
    renderInvoiceHistory(type);
    renderIntegratedJournal();
    renderEntryQueue();
    showToast(post ? `${config.title} insérée dans le brouillard.` : 'Brouillon de facture enregistré.');
    if (post) resetInvoice(type);
  } catch (error) { showToast(error.message); }
}

function currentAccountSetup() {
  const companyId = appState.activeCompany;
  if (!appState.accountingSetups[companyId]) appState.accountingSetups[companyId] = createCsrSetup({ companyId });
  const setup = appState.accountingSetups[companyId];
  (appState.thirdParties?.[companyId] || []).forEach((thirdParty) => {
    if (thirdParty.auxiliaryAccountId && !setup.accounts.some((account) => account.id === thirdParty.auxiliaryAccountId)) {
      setup.accounts.push({ id: thirdParty.auxiliaryAccountId, label: `${thirdParty.collectiveAccountId} — ${thirdParty.name}`, nature: thirdParty.type === THIRD_PARTY_TYPES.CLIENT ? 'Actif / tiers' : thirdParty.type === THIRD_PARTY_TYPES.SUPPLIER ? 'Passif / tiers' : 'Tiers', active: true, isCustom: true, class: accountClass(thirdParty.auxiliaryAccountId) });
    }
  });
  return setup;
}

function usedAccountIds() {
  return new Set(appState.integratedEntries.filter((entry) => entry.companyId === appState.activeCompany).flatMap((entry) => entry.lines?.map((line) => line.accountId) || entry.accountIds || []));
}

function renderAccountPlan(query = $('#accountSearch')?.value || '') {
  const rows = $('#accountRows');
  if (!rows) return;
  const setup = currentAccountSetup();
  const normalizedQuery = query.trim().toLowerCase();
  const classFilter = $('#accountClassFilter')?.value || 'ALL';
  const accounts = setup.accounts || [];
  const filtered = accounts.filter((account) => {
    const matchesQuery = !normalizedQuery || `${account.id} ${account.label} ${account.nature || ''}`.toLowerCase().includes(normalizedQuery);
    const matchesClass = classFilter === 'ALL' || accountClass(account.id) === classFilter;
    const matchesStatus = accountShowInactive || account.active !== false;
    return matchesQuery && matchesClass && matchesStatus;
  });
  const usedIds = usedAccountIds();
  rows.innerHTML = filtered.map((account) => {
    const used = usedIds.has(account.id);
    const nature = account.nature || 'À définir';
    return `<tr><td><b class="account-number">${escapeHtml(account.id)}</b></td><td><span class="cell-title">${escapeHtml(account.label)}</span>${used ? '<small class="cell-subtitle">Utilisé dans le dossier</small>' : ''}</td><td><span class="account-nature">${escapeHtml(nature)}</span></td><td><span class="account-class-badge">Classe ${escapeHtml(accountClass(account.id))}</span></td><td><span class="account-origin ${account.isCustom ? 'origin-custom' : ''}">${account.isCustom ? 'Personnalisé' : 'SYSCOHADA'}</span></td><td><span class="status ${account.active === false ? 'status-muted' : used ? 'status-green' : 'status-blue'}">${account.active === false ? 'Inactif' : used ? 'Utilisé' : 'Actif'}</span></td><td><button class="icon-button small" type="button" data-action="edit-account" data-account-id="${escapeHtml(account.id)}" aria-label="Modifier le compte"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 20 8-8-4-4-8 8-1 5zM14 6l4 4M4 4h6"/></svg></button></td></tr>`;
  }).join('');
  if (!filtered.length) rows.innerHTML = '<tr><td colspan="7" class="dossier-empty">Aucun compte ne correspond à votre recherche.</td></tr>';
  const active = accounts.filter((account) => account.active !== false).length;
  const custom = accounts.filter((account) => account.isCustom).length;
  const used = accounts.filter((account) => usedIds.has(account.id)).length;
  $('#activeAccountCount').textContent = String(active);
  $('#customAccountCount').textContent = String(custom);
  $('#usedAccountCount').textContent = String(used);
  $('#accountPlanVersion').textContent = setup.planVersion || 'SYSCOHADA Révisé';
  $('#accountListSubtitle').textContent = `${accounts.length} comptes · recherchez, complétez ou adaptez vos comptes`;
}

const JOURNAL_TYPE_LABELS = { VENTES: 'Ventes', ACHATS: 'Achats', BANQUE: 'Banque', CAISSE: 'Caisse', OPERATIONS_DIVERSES: 'Opérations diverses', AUTRE: 'Autre' };

function usedJournalIds() {
  return new Set([...appState.integratedEntries, ...appState.recentEntries].filter((entry) => entry.companyId === appState.activeCompany).map((entry) => entry.journalId));
}

function renderEntryJournalOptions() {
  const select = $('#entryJournal');
  if (!select) return;
  const current = select.value;
  const journals = currentAccountSetup().journals.filter((journal) => journal.active !== false && !journal.systemGenerated);
  select.innerHTML = journals.map((journal) => `<option value="${escapeHtml(journal.id)}">${escapeHtml(journal.id)} · ${escapeHtml(journal.label)}</option>`).join('');
  if (journals.some((journal) => journal.id === current)) select.value = current;
}

function renderJournalSetup() {
  const rows = $('#journalSetupRows');
  if (!rows) return;
  const setup = currentAccountSetup();
  const journals = setup.journals || [];
  const used = usedJournalIds();
  rows.innerHTML = journals.map((journal) => `<tr><td><b class="journal-code-large">${escapeHtml(journal.id)}</b></td><td><span class="cell-title">${escapeHtml(journal.label)}</span>${used.has(journal.id) ? '<small class="cell-subtitle">Utilisé dans le dossier</small>' : ''}${journal.systemGenerated ? '<small class="cell-subtitle system-generated-label">Renseigné automatiquement</small>' : ''}</td><td><span class="account-nature">${escapeHtml(JOURNAL_TYPE_LABELS[journal.type] || journal.type || 'Autre')}</span></td><td><span class="journal-prefix">${escapeHtml(journal.prefix || `${journal.id}-`)}</span></td><td><span class="journal-sequence">${String(journal.nextNumber || 1).padStart(4, '0')}</span></td><td><span class="status ${journal.systemGenerated ? 'status-purple' : journal.active === false ? 'status-muted' : used.has(journal.id) ? 'status-green' : 'status-blue'}">${journal.systemGenerated ? 'Automatique' : journal.active === false ? 'Inactif' : used.has(journal.id) ? 'Utilisé' : 'Actif'}</span></td><td>${journal.systemGenerated ? '<span class="journal-system-lock" title="Journal alimenté automatiquement">⌁</span>' : `<button class="icon-button small" type="button" data-action="edit-journal" data-journal-id="${escapeHtml(journal.id)}" aria-label="Modifier le journal"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 20 8-8-4-4-8 8-1 5zM14 6l4 4M4 4h6"/></svg></button>`}</td></tr>`).join('');
  if (!journals.length) rows.innerHTML = '<tr><td colspan="7" class="dossier-empty">Aucun journal configuré.</td></tr>';
  const active = journals.filter((journal) => journal.active !== false);
  $('#activeJournalCount').textContent = String(active.length);
  $('#customJournalCount').textContent = String(journals.filter((journal) => journal.isCustom).length);
  $('#mainJournalLabel').textContent = journals.find((journal) => journal.id === 'OD')?.id || active[0]?.id || '—';
  $('#journalSetupSubtitle').textContent = `${journals.length} journaux · prêts pour la saisie`;
  renderEntryJournalOptions();
}

function openJournalModal(journalId = null) {
  editingJournalId = journalId;
  const title = $('#journalModalTitle');
  const submit = $('#journalSubmitButton');
  const idField = $('#journalId');
  const original = $('#journalOriginalId');
  const label = $('#journalLabel');
  const type = $('#journalType');
  const prefix = $('#journalPrefix');
  const next = $('#journalNextNumber');
  if (journalId) {
    const journal = currentAccountSetup().journals.find((item) => item.id === journalId);
    if (!journal) return;
    title.textContent = 'Modifier un journal';
    submit.textContent = 'Enregistrer les modifications';
    idField.value = journal.id;
    idField.disabled = usedJournalIds().has(journal.id);
    $('#journalCodeHelp').textContent = idField.disabled ? 'Code verrouillé : ce journal est déjà utilisé dans le dossier.' : 'Le code peut encore être adapté avant utilisation.';
    original.value = journal.id;
    label.value = journal.label;
    type.value = journal.type || 'AUTRE';
    prefix.value = journal.prefix || `${journal.id}-`;
    next.value = journal.nextNumber || 1;
  } else {
    title.textContent = 'Ajouter un journal';
    submit.textContent = 'Ajouter le journal';
    idField.disabled = false;
    $('#journalCodeHelp').textContent = '2 à 4 caractères, par exemple VE, AC, BQ.';
    original.value = '';
    idField.value = '';
    label.value = '';
    type.value = 'OPERATIONS_DIVERSES';
    prefix.value = '';
    next.value = 1;
  }
  openModal('journalModal');
}

function saveJournal(event) {
  event.preventDefault();
  if (!requirePermission(USER_PERMISSIONS.SETTINGS_MANAGE)) return;
  const formData = new FormData(event.currentTarget);
  const setup = currentAccountSetup();
  const journal = { id: formData.get('journalId'), label: formData.get('journalLabel'), type: formData.get('journalType'), prefix: formData.get('journalPrefix'), nextNumber: formData.get('journalNextNumber'), active: true, isCustom: true };
  try {
    if (editingJournalId) setup.journals = updateJournalInSetup(setup.journals, editingJournalId, journal, { usedJournalIds: [...usedJournalIds()] });
    else setup.journals = addJournalToSetup(setup.journals, journal);
    appState.accountingSetups[appState.activeCompany] = setup;
    appState.auditEvents.push({ type: editingJournalId ? 'JOURNAL_UPDATED' : 'JOURNAL_CREATED', companyId: appState.activeCompany, journalId: journal.id, at: new Date().toISOString() });
    persistAppState();
    closeModal();
    renderJournalSetup();
    showToast(editingJournalId ? 'Journal mis à jour dans le dossier.' : 'Journal ajouté au dossier.');
  } catch (error) { showToast(error.message); }
}

function exportJournalConfig() {
  const setup = currentAccountSetup();
  const company = appState.companies[appState.activeCompany];
  const content = ['SOCIETE;'+company.name, 'JOURNAL;LIBELLE;NATURE;PREFIXE;PROCHAINE_PIECE;ETAT', ...setup.journals.map((journal) => [journal.id, journal.label, JOURNAL_TYPE_LABELS[journal.type] || journal.type, journal.prefix, journal.nextNumber || 1, journal.active === false ? 'Inactif' : 'Actif'].join(';'))].join('\r\n') + '\r\n';
  downloadText(`${company.code || company.shortName}-journaux.txt`, content);
  showToast('La configuration des journaux a été exportée.');
}

function openAccountModal(accountId = null) {
  editingAccountId = accountId;
  const modalTitle = $('#accountModalTitle');
  const submit = $('#accountSubmitButton');
  const idField = $('#accountId');
  const original = $('#accountOriginalId');
  const label = $('#accountLabel');
  const nature = $('#accountNature');
  if (accountId) {
    const account = currentAccountSetup().accounts.find((item) => item.id === accountId);
    if (!account) return;
    modalTitle.textContent = 'Modifier un compte';
    submit.textContent = 'Enregistrer les modifications';
    idField.value = account.id;
    idField.disabled = usedAccountIds().has(account.id);
    $('#accountNumberHelp').textContent = idField.disabled ? 'Numéro verrouillé : ce compte est déjà utilisé dans le dossier.' : 'Le numéro peut encore être adapté avant utilisation.';
    original.value = account.id;
    label.value = account.label;
    nature.value = account.nature || 'À définir';
  } else {
    modalTitle.textContent = 'Ajouter un compte';
    submit.textContent = 'Ajouter le compte';
    idField.disabled = false;
    $('#accountNumberHelp').textContent = 'Entre 1 et 8 chiffres. Un numéro utilisé sera protégé.';
    original.value = '';
    idField.value = '';
    label.value = '';
    nature.value = 'À définir';
  }
  openModal('accountModal');
}

function saveAccount(event) {
  event.preventDefault();
  if (!requirePermission(USER_PERMISSIONS.SETTINGS_MANAGE)) return;
  const formData = new FormData(event.currentTarget);
  const setup = currentAccountSetup();
  const account = { id: formData.get('accountId'), label: formData.get('accountLabel'), nature: formData.get('accountNature'), isCustom: true, active: true };
  try {
    if (editingAccountId) setup.accounts = updateAccountInPlan(setup.accounts, editingAccountId, account, { usedAccountIds: [...usedAccountIds()] });
    else setup.accounts = addAccountToPlan(setup.accounts, account);
    appState.accountingSetups[appState.activeCompany] = setup;
    appState.auditEvents.push({ type: editingAccountId ? 'ACCOUNT_UPDATED' : 'ACCOUNT_CREATED', companyId: appState.activeCompany, accountId: account.id, at: new Date().toISOString() });
    persistAppState();
    closeModal();
    renderAccountPlan();
    showToast(editingAccountId ? 'Compte mis à jour dans le plan de la société.' : 'Compte ajouté au plan de la société.');
  } catch (error) { showToast(error.message); }
}

function exportAccountPlan() {
  const setup = currentAccountSetup();
  const company = appState.companies[appState.activeCompany];
  const content = exportAccountPlanTxt({ companyName: company.name, planVersion: setup.planVersion, accounts: setup.accounts });
  downloadText(`${company.code || company.shortName}-plan-comptable.txt`, content);
  showToast('Le plan comptable de la société a été exporté.');
}

function openAccountImportModal() {
  pendingAccountImport = null;
  $('#accountImportFile').value = '';
  $('#accountImportFileName').textContent = 'Déposez le fichier du plan comptable';
  $('#accountImportPreview')?.setAttribute('hidden', '');
  openModal('accountImportModal');
}

function parseAccountImportFile(file) {
  if (!file) return;
  const extension = file.name.toLowerCase().split('.').pop();
  if (!['txt', 'csv'].includes(extension)) { showToast('Pour ce premier import, utilisez un fichier TXT ou CSV.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || '');
    const delimiter = text.includes(';') ? ';' : text.includes('\t') ? '\t' : ',';
    const parsed = parseDelimited(text, { delimiter });
    const header = Object.fromEntries(parsed.headers.map((value) => [value.toLowerCase().replace(/[^a-zà-ÿ]/g, ''), value]));
    const getHeader = (names) => names.map((name) => header[name]).find(Boolean);
    const idHeader = getHeader(['compte', 'numero', 'numcompte', 'ncompte']) || parsed.headers[0];
    const labelHeader = getHeader(['libelle', 'libellecompte', 'intitule', 'intitulecompte']) || parsed.headers[1];
    const natureHeader = getHeader(['nature', 'naturecompte']) || parsed.headers[2];
    const rows = parsed.rows.map((row) => ({ id: row[idHeader], label: row[labelHeader], nature: natureHeader ? row[natureHeader] : 'À définir' }));
    pendingAccountImport = importAccountPlanRows(rows, { existingAccounts: currentAccountSetup().accounts });
    $('#accountImportFileName').textContent = file.name;
    $('#accountImportPreview').removeAttribute('hidden');
    $('#accountImportSummary').textContent = `${pendingAccountImport.imported.length} compte${pendingAccountImport.imported.length > 1 ? 's' : ''} importable${pendingAccountImport.imported.length > 1 ? 's' : ''} sur ${pendingAccountImport.rowCount}`;
    const status = $('#accountImportStatus');
    status.textContent = pendingAccountImport.valid ? 'Prêt à intégrer' : `${pendingAccountImport.errors.length} erreur${pendingAccountImport.errors.length > 1 ? 's' : ''}`;
    status.className = `status ${pendingAccountImport.valid ? 'status-green' : 'status-red'}`;
    $('#accountImportList').innerHTML = pendingAccountImport.imported.slice(0, 8).map((account) => `<div class="account-import-row"><b>${escapeHtml(account.id)}</b><span>${escapeHtml(account.label)}</span><small>${escapeHtml(account.nature)}</small></div>`).join('') + (pendingAccountImport.errors.length ? `<div class="account-import-errors">${pendingAccountImport.errors.slice(0, 3).map((error) => `<span>Ligne ${error.row}: ${escapeHtml(error.message)}</span>`).join('')}</div>` : '');
  };
  reader.readAsText(file);
}

function applyAccountImport() {
  if (!pendingAccountImport?.valid || !pendingAccountImport.imported.length) { showToast('Corrigez les erreurs avant d’intégrer le plan.'); return; }
  const setup = currentAccountSetup();
  setup.accounts = [...setup.accounts, ...pendingAccountImport.imported];
  setup.planVersion = 'SYSCOHADA Révisé · personnalisé';
  appState.accountingSetups[appState.activeCompany] = setup;
  appState.auditEvents.push({ type: 'ACCOUNT_PLAN_IMPORTED', companyId: appState.activeCompany, count: pendingAccountImport.imported.length, at: new Date().toISOString() });
  persistAppState();
  closeModal();
  renderAccountPlan();
  showToast(`${pendingAccountImport.imported.length} comptes ajoutés au plan.`);
}

function fiscalYearStatusLabel(status) {
  return status === 'FINALIZED' ? 'Arrêté' : status === 'OPEN' ? 'Ouvert' : 'Préparé';
}

function renderFiscalYearCatalog() {
  const container = $('#fiscalYearCatalog');
  if (!container) return;
  const companyId = appState.activeCompany;
  const current = currentFiscalYear();
  const years = [...(appState.fiscalYearCatalog?.[companyId] || [])].sort((left, right) => Number(right.id) - Number(left.id));
  container.innerHTML = years.map((year) => {
    const active = String(year.id) === String(current.id);
    const status = year.status || 'OPEN';
    return `<button class="fiscal-year-card ${active ? 'is-active' : ''} ${status === 'FINALIZED' ? 'is-finalized' : ''}" type="button" data-fiscal-year-switch="${escapeHtml(year.id)}" aria-pressed="${active}"><span class="fiscal-year-card-year">${escapeHtml(year.id)}</span><span><strong>${escapeHtml(year.label || `Exercice ${year.id}`)}</strong><small>${active ? 'Exercice actif' : status === 'FINALIZED' ? 'Consultation historique' : 'Disponible'}</small></span><span class="fiscal-year-card-status">${fiscalYearStatusLabel(status)}</span></button>`;
  }).join('');
  if (!years.length) container.innerHTML = '<div class="fiscal-year-empty">Aucun exercice enregistré.</div>';
}

function switchFiscalYear(yearId) {
  const companyId = appState.activeCompany;
  const target = (appState.fiscalYearCatalog?.[companyId] || []).find((year) => String(year.id) === String(yearId));
  if (!target) { showToast('Exercice introuvable pour cette société.'); return; }
  const current = currentFiscalYear();
  if (String(current.id) === String(target.id)) { renderFiscalYearCatalog(); return; }
  appState.fiscalYearPeriods[companyId][String(current.id)] = appState.periods[companyId] || createMonthlyPeriods(Number(current.id));
  appState.activePeriodIdsByYear[companyId][String(current.id)] = appState.activePeriodIds[companyId] || `${current.id}-01`;
  const targetPeriods = appState.fiscalYearPeriods[companyId][String(target.id)] || createMonthlyPeriods(Number(target.id), { status: target.status === 'FINALIZED' ? 'CLOSED' : 'OPEN' });
  appState.fiscalYears[companyId] = { ...target };
  appState.periods[companyId] = targetPeriods;
  appState.activePeriodIds[companyId] = appState.activePeriodIdsByYear[companyId][String(target.id)] || targetPeriods[0]?.id || `${target.id}-01`;
  appState.activePeriodIdsByYear[companyId][String(target.id)] = appState.activePeriodIds[companyId];
  appState.exportDraft = null;
  appState.fecDraft = null;
  appState.selectedDossier = (appState.dossiers || []).find((dossier) => dossier.companyId === companyId && dossier.moduleId === 'CSR' && String(dossier.exerciseYear) === String(target.id) && dossier.status !== 'Archivé')?.id || appState.selectedDossier;
  persistAppState();
  renderFiscalYearCatalog();
  renderPeriods();
  renderFinalization();
  renderOpening();
  renderStatements();
  renderClosure();
  renderFiscalPreview();
  renderFecAssistant();
  showToast(`${target.label || `Exercice ${target.id}`} est maintenant l’exercice actif.`);
}

function renderPeriods() {
  const grid = $('#periodGrid');
  if (!grid) return;
  const currentYear = currentFiscalYear();
  const periods = appState.periods[appState.activeCompany] || [];
  const activeId = appState.activePeriodIds?.[appState.activeCompany];
  const open = periods.filter((period) => period.status !== 'CLOSED').length;
  const closed = periods.filter((period) => period.status === 'CLOSED').length;
  const active = periods.find((period) => period.id === activeId) || periods[0];
  grid.innerHTML = periods.map((period) => `<button class="period-card ${period.id === active?.id ? 'is-active' : ''} ${period.status === 'CLOSED' ? 'is-closed' : ''}" type="button" data-period-id="${period.id}" aria-pressed="${period.id === active?.id}"><span class="period-card-number">${period.id.slice(-2)}</span><span><strong>${period.label}</strong><small>${displayDate(period.start)} — ${displayDate(period.end)}</small></span><span class="period-card-status">${period.status === 'CLOSED' ? 'Clôturée' : period.id === active?.id ? 'Active' : 'Ouverte'}</span></button>`).join('');
  $('#openPeriodsCount').textContent = String(open);
  $('#closedPeriodsCount').textContent = String(closed);
  $('#periodsActiveYearBadge').textContent = currentYear.label;
  $('#periodsBannerYear').textContent = currentYear.id;
  $('#periodsBannerLabel').textContent = currentYear.label;
  $('#periodsBannerStatus').textContent = currentYear.status === 'FINALIZED' ? 'Exercice arrêté' : 'Exercice ouvert';
  $('#periodsPanelTitle').textContent = `Les périodes de ${currentYear.id}`;
  renderFiscalYearCatalog();
  $('#activePeriodLabel').textContent = active?.label?.split(' ')[0] || '—';
  $('#activePeriodDates').textContent = active ? `${displayDate(active.start)} — ${displayDate(active.end)}` : '—';
}

function selectPeriod(periodId) {
  const period = (appState.periods[appState.activeCompany] || []).find((item) => item.id === periodId);
  if (!period) return;
  appState.activePeriodIds[appState.activeCompany] = period.id;
  const yearId = String(currentFiscalYear().id);
  appState.activePeriodIdsByYear[appState.activeCompany][yearId] = period.id;
  appState.fiscalYearPeriods[appState.activeCompany][yearId] = appState.periods[appState.activeCompany];
  persistAppState();
  renderPeriods();
  renderClosure();
  renderFiscalPreview();
  renderStatements();
  showToast(`${period.label} est maintenant la période active.`);
}

function statementEntries() {
  const statuses = appState.statementMode === 'official' ? [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED] : [OPERATION_STATES.IMPUTED, OPERATION_STATES.TO_REVIEW, OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED];
  const period = currentPeriod();
  return appState.integratedEntries.filter((entry) => entry.companyId === appState.activeCompany && !entry.technicalOnly && entry.status !== OPERATION_STATES.CANCELLED && statuses.includes(entry.status) && String(entry.date).startsWith(period.id));
}

function renderStatementTable(statement) {
  const table = $('#statementTableContent');
  if (!table) return;
  if (currentStatementTab === 'cashflow') {
    const isStatementMovement = (movement) => movement.origin === 'STATEMENT' || String(movement.id).startsWith('imported-bank-');
    const movements = appState.bankMovements.filter((movement) => movement.companyId === appState.activeCompany && !isStatementMovement(movement) && String(movement.date).startsWith(statement.period));
    const cashflowStatus = (status) => status === 'RECONCILED' ? ['Rapproché', 'status-green'] : status === 'POINTED' ? ['Pointé', 'status-purple'] : ['À pointer', 'status-amber'];
    table.innerHTML = `<div class="statement-table-scroll"><table class="statement-data-table"><thead><tr><th>DATE</th><th>LIBELLÉ</th><th class="align-right">SORTIES</th><th class="align-right">ENTRÉES</th><th>ÉTAT</th></tr></thead><tbody>${movements.map((movement) => { const [statusText, statusClass] = cashflowStatus(movement.status); return `<tr><td>${escapeHtml(displayDate(movement.date))}</td><td>${escapeHtml(movement.label)}</td><td class="align-right">${movement.debit ? numberLabel(movement.debit) : '—'}</td><td class="align-right amount-positive">${movement.credit ? numberLabel(movement.credit) : '—'}</td><td><span class="status ${statusClass}">${statusText}</span></td></tr>`; }).join('')}</tbody></table></div>`;
    if (!movements.length) table.innerHTML = '<div class="statement-empty">Aucun mouvement bancaire dans cette période.</div>';
    return;
  }
  if (currentStatementTab === 'notes') {
    table.innerHTML = `<div class="statement-notes-grid"><div><small>SOCIÉTÉ</small><strong>${escapeHtml(appState.companies[appState.activeCompany].name)}</strong></div><div><small>RÉFÉRENTIEL</small><strong>SYSCOHADA Révisé</strong></div><div><small>RÉGIME</small><strong>${escapeHtml(currentAccountSetup().regime)}</strong></div><div><small>STATUT</small><strong>${appState.statementMode === 'official' ? 'Officiel' : 'Contrôle'}</strong></div></div><div class="statement-empty"><strong>Les notes et annexes seront paramétrées avec le régime retenu.</strong><p>Ce volet conservera la date de génération, le périmètre et les choix de présentation.</p></div>`;
    return;
  }
  const lines = currentStatementTab === 'income' ? statement.incomeStatement : currentStatementTab === 'balance' ? statement.balanceSheet : statement.trialBalance;
  const rows = lines.map((line) => `<tr><td><b>${escapeHtml(line.accountId)}</b></td><td>${escapeHtml(line.label || 'Compte')}</td><td class="align-right">${line.debit ? numberLabel(line.debit) : '—'}</td><td class="align-right">${line.credit ? numberLabel(line.credit) : '—'}</td><td class="align-right">${numberLabel(Math.abs(line.balance))}</td></tr>`).join('');
  const total = currentStatementTab === 'income' ? `<div class="statement-total-row"><span>Résultat avant impôt</span><strong>${numberLabel(statement.resultBeforeTax)} FCFA</strong></div>` : `<div class="statement-total-row"><span>Totaux débit / crédit</span><strong>${numberLabel(statement.totalDebit)} / ${numberLabel(statement.totalCredit)}</strong></div>`;
  table.innerHTML = `<div class="statement-table-scroll"><table class="statement-data-table"><thead><tr><th>COMPTE</th><th>LIBELLÉ</th><th class="align-right">DÉBIT</th><th class="align-right">CRÉDIT</th><th class="align-right">SOLDE</th></tr></thead><tbody>${rows}</tbody></table></div>${total}`;
  if (!lines.length) table.innerHTML = '<div class="statement-empty">Aucune écriture dans le périmètre sélectionné.</div>';
}

function renderStatements() {
  const table = $('#statementTableContent');
  if (!table) return;
  const period = currentPeriod();
  const year = currentFiscalYear();
  const snapshot = currentFinancialSnapshot();
  const statuses = appState.statementMode === 'official' ? [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED] : [OPERATION_STATES.IMPUTED, OPERATION_STATES.TO_REVIEW, OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED];
  const statement = appState.statementMode === 'official' && year.status === 'FINALIZED' && snapshot?.statements ? snapshot.statements : buildFinancialStatements(appState.integratedEntries, { companyId: appState.activeCompany, period: period.id, statuses });
  const statementLabels = {
    trial: ['Balance générale', 'Comptes et soldes du périmètre sélectionné.'],
    income: ['Compte de résultat', 'Produits, charges et résultat de la période.'],
    balance: ['Bilan', 'Actif, passif et situation nette de la société.'],
    cashflow: ['Flux de trésorerie', 'Entrées et sorties enregistrées dans les journaux BQ et CA.'],
    notes: ['Notes et annexes', 'Informations complémentaires du périmètre sélectionné.']
  };
  const [statementTitle, statementDescription] = statementLabels[currentStatementTab] || statementLabels.trial;
  $('#statementSelectedTitle').textContent = statementTitle;
  $('#statementSelectedDescription').textContent = statementDescription;
  $('#statementPeriodLabel').textContent = appState.statementMode === 'official' && snapshot ? `Exercice ${year.id}` : period.label;
  $('#statementPeriodStatus').textContent = appState.statementMode === 'official' ? (year.status === 'FINALIZED' && snapshot ? 'Instantané officiel scellé · écritures validées ou clôturées' : 'Écritures validées ou clôturées · édition officielle') : 'Écritures validées et en revue · édition de contrôle';
  $('#statementAccountCount').textContent = String(statement.trialBalance.length);
  $('#statementDebitTotal').innerHTML = `${numberLabel(statement.totalDebit)} <em>FCFA</em>`;
  $('#statementCreditTotal').innerHTML = `${numberLabel(statement.totalCredit)} <em>FCFA</em>`;
  $('#statementResultTotal').innerHTML = `${numberLabel(statement.resultBeforeTax)} <em>FCFA</em>`;
  const regime = currentAccountSetup().regime === 'SMT' ? 'Système minimal de trésorerie' : 'Système normal';
  $('#statementRegimeBadge').innerHTML = `<i></i> ${regime}`;
  const finalized = currentFiscalYear().status === 'FINALIZED';
  $('#statementPreviewStatus').innerHTML = `<i></i> ${appState.statementMode === 'official' && finalized ? 'État définitif' : 'Aperçu non définitif'}`;
  $('#statementPreviewStatus').className = `statement-preview-status ${appState.statementMode === 'official' && finalized ? 'is-final' : ''}`;
  renderStatementTable(statement);
}

function exportStatements() {
  const report = currentStatementTab === 'income' ? 'Compte de résultat' : currentStatementTab === 'balance' ? 'Bilan' : currentStatementTab === 'cashflow' ? 'Flux de trésorerie' : currentStatementTab === 'notes' ? 'Notes et annexes' : 'Balance générale';
  openExportAssistant(report);
}

function selectStatementTab(tab) {
  currentStatementTab = tab.dataset.statementTab;
  $$('.statement-tab').forEach((item) => item.classList.toggle('is-active', item === tab));
  renderStatements();
}

function setStatementMode(mode) {
  appState.statementMode = mode;
  $$('.statement-mode').forEach((button) => button.classList.toggle('is-active', button.dataset.statementMode === mode));
  persistAppState();
  renderStatements();
}

function openingPlanFromSnapshot(snapshot) {
  const lines = [];
  (snapshot?.statements?.balanceSheet || []).forEach((line) => {
    const balance = Number(line.debit || 0) - Number(line.credit || 0);
    if (balance > 0) lines.push({ accountId: line.accountId, label: `À-nouveau — ${line.label}`, debit: balance, credit: 0 });
    if (balance < 0) lines.push({ accountId: line.accountId, label: `À-nouveau — ${line.label}`, debit: 0, credit: Math.abs(balance) });
  });
  const result = Number(snapshot?.statements?.resultBeforeTax || 0);
  if (result > 0) lines.push({ accountId: '131', label: 'À-nouveau — résultat bénéficiaire', debit: 0, credit: result });
  if (result < 0) lines.push({ accountId: '139', label: 'À-nouveau — résultat déficitaire', debit: Math.abs(result), credit: 0 });
  return { companyId: snapshot.companyId, sourceYear: snapshot.fiscalYear, sourceEntryIds: snapshot.sourceEntryIds || [], sourceSnapshotId: snapshot.id, lines, totalDebit: lines.reduce((sum, line) => sum + Number(line.debit || 0), 0), totalCredit: lines.reduce((sum, line) => sum + Number(line.credit || 0), 0) };
}

function openingBalancePreview() {
  const year = currentFiscalYear();
  const targetYear = String(Number(year.id) + 1);
  const previousOpening = (appState.openingRuns || []).find((item) => item.companyId === appState.activeCompany && String(item.targetYear) === String(year.id));
  if (previousOpening && !currentFinancialSnapshot()) return { companyId: appState.activeCompany, sourceYear: year.id, targetYear, sourceEntryIds: [], lines: [], totalDebit: 0, totalCredit: 0, opened: true, run: null };
  const snapshot = currentFinancialSnapshot();
  const plan = snapshot ? openingPlanFromSnapshot(snapshot) : calculateOpeningBalances(appState.integratedEntries, { companyId: appState.activeCompany, sourceYear: year.id });
  const run = (appState.openingRuns || []).find((item) => item.companyId === appState.activeCompany && String(item.sourceYear) === String(year.id));
  return { ...plan, sourceYear: year.id, targetYear, run, opened: false };
}

function renderOpening() {
  const rows = $('#openingRows');
  if (!rows) return;
  const year = currentFiscalYear();
  const preview = openingBalancePreview();
  rows.innerHTML = preview.lines.map((line) => `<tr><td><b class="account-number">${escapeHtml(line.accountId)}</b></td><td>${escapeHtml(line.label)}</td><td class="align-right">${line.debit ? numberLabel(line.debit) : '—'}</td><td class="align-right">${line.credit ? numberLabel(line.credit) : '—'}</td><td><span class="account-origin ${preview.sourceSnapshotId ? 'origin-custom' : ''}">${preview.sourceSnapshotId ? 'Instantané officiel' : 'Calcul automatique'}</span></td></tr>`).join('');
  if (!preview.lines.length) rows.innerHTML = `<tr><td colspan="5" class="dossier-empty">${preview.opened ? `L’exercice ${escapeHtml(year.id)} est ouvert. Les reports de ${escapeHtml(String(Number(year.id) - 1))} ont déjà été intégrés.` : 'Aucun solde de bilan à reporter pour cet exercice.'}</td></tr>`;
  $('#openingAccountCount').textContent = String(preview.lines.length);
  $('#openingDebitTotal').innerHTML = `${numberLabel(preview.totalDebit)} <em>FCFA</em>`;
  $('#openingCreditTotal').innerHTML = `${numberLabel(preview.totalCredit)} <em>FCFA</em>`;
  $('#openingSourceYear').textContent = `Exercice ${year.id}`;
  $('#openingTargetYear').textContent = `Exercice ${preview.targetYear}`;
  $('#openingPreviewDescription').textContent = preview.opened ? `Exercice ${year.id} ouvert avec ses reports intégrés.` : `${preview.sourceEntryIds.length} écriture(s) source · destination : exercice ${preview.targetYear}`;
  const badge = $('#openingStatusBadge');
  const lock = $('#openingLockLabel');
  const button = $('#generateOpeningButton');
  const validateButton = $('#openNextYearButton');
  const finalized = year.status === 'FINALIZED';
  const generated = Boolean(preview.run);
  const opened = Boolean(preview.opened);
  if (badge) { badge.innerHTML = `<i></i> ${opened ? 'Exercice ouvert' : generated ? 'Reports à contrôler' : finalized ? 'Prêt à générer' : 'En attente de l’arrêté'}`; badge.className = `opening-status-badge ${finalized || opened ? 'is-ready' : ''}`; }
  if (lock) lock.textContent = opened ? `Exercice ${year.id} ouvert` : generated ? 'Reports à contrôler' : finalized ? `Exercice ${year.id} arrêté` : `Exercice ${year.id} ouvert`;
  if (button) { button.disabled = !finalized || generated || !preview.lines.length || !can(USER_PERMISSIONS.OPENING_GENERATE); button.textContent = generated ? 'Reports générés' : finalized ? 'Générer les reports' : 'Attente de l’arrêté'; }
  if (validateButton) { validateButton.disabled = !generated || opened || preview.run?.status === 'VALIDATED' || !can(USER_PERMISSIONS.OPENING_VALIDATE); validateButton.textContent = opened ? `Exercice ${year.id} ouvert` : preview.run?.status === 'VALIDATED' ? `Ouvrir l’exercice ${preview.targetYear}` : `Valider les reports et ouvrir ${preview.targetYear}`; }
}

function generateOpeningBalances() {
  if (!requirePermission(USER_PERMISSIONS.OPENING_GENERATE)) return;
  const year = currentFiscalYear();
  if (year.status !== 'FINALIZED') { showToast('L’exercice doit être arrêté avant de générer les reports à nouveau.'); return; }
  const preview = openingBalancePreview();
  if (preview.run) { showToast('Les reports de cet exercice ont déjà été générés.'); return; }
  if (!preview.lines.length) { showToast('Aucun solde à reporter.'); return; }
  const entry = createAutomaticJournalEntry({ companyId: appState.activeCompany, integrationCategory: 'REPORTS_A_NOUVEAU', date: `${preview.targetYear}-01-01`, reference: 'AN-0001', label: `Reports à nouveau — exercice ${preview.targetYear}`, dossierId: currentDossierCode(appState.activeCompany), lines: preview.lines });
  const synced = syncIntegratedJournal(integratedJournalForCompany(appState.activeCompany), { ...entry, id: `auto-opening-${appState.activeCompany}-${preview.targetYear}`, amount: preview.totalDebit, debit: preview.totalDebit, credit: preview.totalCredit, source: `Reports de l’exercice ${preview.sourceYear}`, technicalOnly: false, status: OPERATION_STATES.TO_REVIEW });
  const openingEntry = synced.entries[0];
  appState.integratedEntries.unshift(openingEntry);
  appState.openingRuns.push({ companyId: appState.activeCompany, sourceYear: preview.sourceYear, targetYear: preview.targetYear, count: preview.lines.length, entryId: openingEntry.id, at: new Date().toISOString(), status: 'TO_REVIEW' });
  appState.pendingFiscalYears[appState.activeCompany] = { id: preview.targetYear, label: `Exercice ${preview.targetYear}`, status: 'OPEN', openedFrom: preview.sourceYear, openingEntryId: openingEntry.id, createdAt: new Date().toISOString() };
  appState.pendingPeriods[appState.activeCompany] = createMonthlyPeriods(Number(preview.targetYear));
  appState.auditEvents.push({ id: `audit-${Date.now()}`, action: 'OPENING_BALANCES_GENERATED', companyId: appState.activeCompany, sourceYear: preview.sourceYear, targetYear: preview.targetYear, entryId: openingEntry.id, at: new Date().toISOString(), userId: 'claire-dossou' });
  persistAppState();
  renderOpening();
  renderIntegratedJournal();
  showToast(`Reports à nouveau préparés pour ${preview.targetYear}. Contrôlez-les avant d’ouvrir l’exercice.`);
}

function validateOpeningAndOpen() {
  if (!requirePermission(USER_PERMISSIONS.OPENING_VALIDATE)) return;
  const year = currentFiscalYear();
  const preview = openingBalancePreview();
  const run = preview.run;
  if (year.status !== 'FINALIZED' || !run) { showToast('Générez d’abord les reports à nouveau depuis l’exercice arrêté.'); return; }
  if (run.status !== 'VALIDATED') {
    const entryIndex = appState.integratedEntries.findIndex((entry) => entry.id === run.entryId && entry.companyId === appState.activeCompany);
    if (entryIndex < 0) { showToast('L’écriture de report est introuvable.'); return; }
    const validatedAt = new Date().toISOString();
    appState.integratedEntries[entryIndex] = { ...appState.integratedEntries[entryIndex], status: OPERATION_STATES.VALIDATED, validatedAt, statusChangedAt: validatedAt };
    const recentIndex = appState.recentEntries.findIndex((entry) => entry.id === run.entryId && entry.companyId === appState.activeCompany);
    if (recentIndex >= 0) appState.recentEntries[recentIndex] = { ...appState.recentEntries[recentIndex], status: OPERATION_STATES.VALIDATED, validatedAt, statusChangedAt: validatedAt };
    run.status = 'VALIDATED';
    run.validatedAt = validatedAt;
    appState.auditEvents.push({ id: `audit-${Date.now()}`, action: 'OPENING_BALANCES_VALIDATED', companyId: appState.activeCompany, sourceYear: run.sourceYear, targetYear: run.targetYear, entryId: run.entryId, at: validatedAt, userId: 'claire-dossou' });
  }
  openNextFiscalYear();
}

function openNextFiscalYear() {
  const target = appState.pendingFiscalYears[appState.activeCompany];
  if (!target) { showToast('Aucun exercice suivant n’est prêt à être ouvert.'); return; }
  const periods = appState.pendingPeriods[appState.activeCompany] || createMonthlyPeriods(Number(target.id));
  const openingRun = (appState.openingRuns || []).find((run) => run.companyId === appState.activeCompany && String(run.targetYear) === String(target.id));
  const company = appState.companies[appState.activeCompany];
  const targetDossierCode = makeDossierCode(company.code || company.shortName, `${target.id}-01-01`);
  let targetDossier = (appState.dossiers || []).find((item) => item.companyId === appState.activeCompany && item.moduleId === 'CSR' && item.exerciseYear === String(target.id) && item.status !== 'Archivé');
  if (!targetDossier) {
    targetDossier = { id: `${appState.activeCompany}-${target.id}-csr`, companyId: appState.activeCompany, dossier: targetDossierCode, moduleId: 'CSR', period: `01/01/${target.id} - 31/12/${target.id}`, exerciseYear: String(target.id), sessions: 0, status: 'Actif', statusClass: 'status-green' };
    appState.dossiers.push(targetDossier);
  }
  appState.selectedDossier = targetDossier.id;
  appState.fiscalYears[appState.activeCompany] = { ...target, dossierCode: targetDossierCode, status: 'OPEN', openedAt: new Date().toISOString() };
  appState.fiscalYearCatalog[appState.activeCompany] = [...(appState.fiscalYearCatalog[appState.activeCompany] || []).filter((item) => String(item.id) !== String(target.id)), { ...appState.fiscalYears[appState.activeCompany] }];
  appState.fiscalYearPeriods[appState.activeCompany][String(target.id)] = periods;
  appState.activePeriodIdsByYear[appState.activeCompany][String(target.id)] = `${target.id}-01`;
  appState.periods[appState.activeCompany] = periods;
  appState.activePeriodIds[appState.activeCompany] = `${target.id}-01`;
  appState.correctionWindows[appState.activeCompany] = createCorrectionWindow({ id: `correction-${appState.activeCompany}-${target.id}`, dossierId: currentDossierCode(appState.activeCompany), companyId: appState.activeCompany, userId: 'claire-dossou', periodId: `${target.id}-01` });
  delete appState.pendingFiscalYears[appState.activeCompany];
  delete appState.pendingPeriods[appState.activeCompany];
  appState.auditEvents.push({ id: `audit-${Date.now()}`, action: 'FISCAL_YEAR_OPENED', companyId: appState.activeCompany, sourceYear: target.openedFrom, targetYear: target.id, openingRunId: openingRun?.entryId || null, at: new Date().toISOString(), userId: 'claire-dossou' });
  persistAppState();
  renderPeriods();
  renderOpening();
  renderFinalization();
  renderStatements();
  renderEntryQueue();
  renderIntegratedJournal();
  showToast(`Exercice ${target.id} ouvert avec les reports à nouveau validés.`);
}

function currentFiscalYear() {
  if (!appState.fiscalYears[appState.activeCompany]) appState.fiscalYears[appState.activeCompany] = { id: '2025', label: 'Exercice 2025', status: 'OPEN' };
  return appState.fiscalYears[appState.activeCompany];
}

function officialEntriesForYear(fiscalYearId = currentFiscalYear().id) {
  return appState.integratedEntries.filter((entry) => {
    const category = String(entry.integrationCategory || entry.categoryId || '').toUpperCase();
    return entry.companyId === appState.activeCompany
      && String(entry.date || '').startsWith(String(fiscalYearId))
      && [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status)
      && !entry.technicalOnly
      && category !== 'CENTRALISATION'
      && category !== 'CENTRALIZATION'
      && category !== 'RESULTAT'
      && entry.journalId !== 'CT'
      && entry.journalId !== 'RP';
  });
}

function currentFinancialSnapshot() {
  const year = currentFiscalYear();
  return (appState.financialSnapshots || []).find((snapshot) => snapshot.companyId === appState.activeCompany && String(snapshot.fiscalYear) === String(year.id));
}

async function prepareFinalSnapshot() {
  if (!requirePermission(USER_PERMISSIONS.FISCAL_SNAPSHOT)) return;
  const year = currentFiscalYear();
  if (year.status === 'FINALIZED') { showToast('L’exercice est déjà arrêté ; son instantané est verrouillé.'); return; }
  const entries = officialEntriesForYear(year.id);
  const setup = currentAccountSetup();
  const statements = buildFinancialStatements(entries, { companyId: appState.activeCompany, period: String(year.id), statuses: [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED] });
  const snapshot = createFinancialSnapshot({ companyId: appState.activeCompany, fiscalYear: year.id, statements, sourceEntryIds: entries.map((entry) => entry.id), planVersion: setup.planVersion || 'SYSCOHADA Révisé', regime: setup.regime || 'NORMAL' });
  try {
    const snapshotHash = await sha256Hex(new TextEncoder().encode(JSON.stringify(snapshot)));
    const sealed = { ...snapshot, snapshotHash, sourceCount: entries.length, lineCount: entries.reduce((sum, entry) => sum + (entry.lines?.length || 0), 0), status: 'SEALED', immutable: true };
    appState.financialSnapshots = [sealed, ...(appState.financialSnapshots || []).filter((item) => !(item.companyId === sealed.companyId && String(item.fiscalYear) === String(sealed.fiscalYear)))];
    appState.auditEvents.push({ id: `audit-${Date.now()}`, action: 'FINANCIAL_SNAPSHOT_SEALED', companyId: appState.activeCompany, fiscalYear: year.id, snapshotId: sealed.id, snapshotHash, at: sealed.sealedAt, userId: 'claire-dossou' });
    persistAppState();
    renderFinalization();
    renderStatements();
    showToast(`Instantané officiel de l’exercice ${year.id} préparé et scellé.`);
  } catch (error) { showToast(error.message); }
}

function currentFinalizationChecks() {
  const periods = appState.periods[appState.activeCompany] || [];
  const activeEntries = appState.recentEntries.filter((entry) => entry.companyId === appState.activeCompany && entry.status !== OPERATION_STATES.CANCELLED);
  const year = currentFiscalYear();
  const sourceEntries = officialEntriesForYear(year.id);
  const runs = new Set(appState.automaticRuns.filter((run) => run.companyId === appState.activeCompany && String(run.period || '').startsWith(String(year.id))).map((run) => `${run.category}:${run.period}`));
  const fiscalSettings = currentFiscalSettings();
  const annualPeriodResult = calculatePeriodResult(appState.integratedEntries, { companyId: appState.activeCompany, period: String(year.id) });
  const fiscal = calculateFiscalResult({ ...fiscalSettings, accountingResult: annualPeriodResult.result, products: annualPeriodResult.products, excludedProducts: fiscalSettings.excludedProducts });
  const snapshot = currentFinancialSnapshot();
  const relevantPeriods = (appState.periods[appState.activeCompany] || []).filter((period) => String(period.id).startsWith(String(year.id)) && appState.integratedEntries.some((entry) => entry.companyId === appState.activeCompany && String(entry.date || '').startsWith(period.id)));
  const annualAutomaticReady = ['AMORTISSEMENTS', 'ABONNEMENTS', 'CENTRALISATION', 'RESULTAT'].every((category) => relevantPeriods.every((period) => runs.has(`${category}:${period.id}`)));
  return [
    { id: 'periods', label: 'Calendrier de l’exercice complet', description: `${periods.filter((period) => period.status === 'CLOSED').length} période(s) verrouillée(s) sur les 12 ; la clôture mensuelle reste facultative.`, passed: periods.length === 12, action: 'periods', actionLabel: 'Voir les périodes' },
    { id: 'entries', label: 'Aucune saisie en attente', description: `${activeEntries.filter((entry) => entry.status !== OPERATION_STATES.VALIDATED).length} écriture(s) nécessitent encore un contrôle.`, passed: activeEntries.every((entry) => entry.status === OPERATION_STATES.VALIDATED), action: 'entry', actionLabel: 'Contrôler les saisies' },
    { id: 'automatic', label: 'Traitements automatiques terminés', description: 'Les traitements nécessaires de l’exercice doivent être exécutés pour chaque période concernée.', passed: annualAutomaticReady, action: 'periodic', actionLabel: 'Voir les traitements' },
    { id: 'fiscal', label: 'Résultat fiscal préparé', description: fiscal.ready ? `Le taux de ${fiscal.taxRate} % et le calcul de l’impôt sont disponibles.` : fiscal.missingRegulatoryMinimum ? 'Le minimum réglementaire de cette activité doit être renseigné.' : 'Le profil fiscal et le taux doivent être validés pour l’exercice.', passed: fiscal.ready, action: 'periodic', actionLabel: 'Voir le résultat fiscal' },
    { id: 'snapshot', label: 'Instantané officiel des états', description: snapshot ? `États calculés sur ${sourceEntries.length} écriture(s), référentiel ${snapshot.planVersion}.` : 'Préparez l’instantané officiel avant l’arrêté.', passed: Boolean(snapshot?.immutable && ['SEALED', 'FINALIZED'].includes(snapshot.status) && snapshot.sourceCount > 0), action: 'snapshot', actionLabel: 'Préparer l’instantané' }
  ];
}

function renderFinalization() {
  const container = $('#finalizationChecks');
  if (!container) return;
  const year = currentFiscalYear();
  const snapshot = currentFinancialSnapshot();
  const evaluation = evaluatePeriodClosure(currentFinalizationChecks());
  const periods = appState.periods[appState.activeCompany] || [];
  const closedPeriods = periods.filter((period) => period.status === 'CLOSED').length;
  container.innerHTML = evaluation.checks.map((check) => `<div class="closure-check-row ${check.passed ? 'is-passed' : 'is-blocked'}"><span class="closure-check-icon">${check.passed ? '✓' : '!'}</span><span class="closure-check-copy"><strong>${escapeHtml(check.label)}</strong><small>${escapeHtml(check.description)}</small></span>${check.passed ? '<span class="status status-green">OK</span>' : `<button class="closure-check-action" type="button" data-finalization-action="${escapeHtml(check.action)}">${escapeHtml(check.actionLabel)}</button>`}</div>`).join('');
  $('#finalizationYearIcon').textContent = String(year.id);
  $('#finalizationYearLabel').textContent = year.label;
  $('#finalizationProgress').textContent = `${evaluation.passedCount} / ${evaluation.totalCount} contrôles`;
  $('#finalizationBlockCount').textContent = evaluation.blockingCount ? `${evaluation.blockingCount} blocage${evaluation.blockingCount > 1 ? 's' : ''}` : 'Prêt à arrêter';
  $('#finalizationScore').textContent = String(evaluation.passedCount);
  const annualResult = calculatePeriodResult(appState.integratedEntries, { companyId: appState.activeCompany, period: String(year.id) });
  const accountingResult = snapshot?.statements?.resultBeforeTax ?? annualResult.result;
  const annualProducts = snapshot?.statements?.products ?? annualResult.products;
  $('#finalNetResult').innerHTML = `${numberLabel(calculateFiscalResult({ ...currentFiscalSettings(), accountingResult, products: annualProducts, excludedProducts: currentFiscalSettings().excludedProducts }).netResult)} <em>FCFA</em>`;
  $('#closedPeriodCount').textContent = `${closedPeriods} / 12`;
  $('#finalReportCount').textContent = snapshot ? '5' : '0';
  const snapshotState = $('#finalSnapshotState');
  if (snapshotState) snapshotState.textContent = snapshot ? `Scellé · SHA-256 ${String(snapshot.snapshotHash || '').slice(0, 12)}…` : 'À préparer après les contrôles';
  $('#finalizationMessage').textContent = year.status === 'FINALIZED' ? 'L’exercice est arrêté et son état est verrouillé.' : evaluation.valid ? 'Tous les contrôles sont satisfaits. L’exercice peut être arrêté.' : 'L’exercice reste ouvert tant que les contrôles bloquants ne sont pas terminés.';
  const snapshotButton = $('#prepareSnapshotButton');
  if (snapshotButton) { snapshotButton.disabled = year.status === 'FINALIZED' || !can(USER_PERMISSIONS.FISCAL_SNAPSHOT); snapshotButton.textContent = year.status === 'FINALIZED' ? 'Instantané scellé' : snapshot ? 'Instantané préparé' : 'Préparer l’instantané'; }
  const button = $('#finalizeYearButton');
  button.disabled = year.status === 'FINALIZED' || !evaluation.valid || !can(USER_PERMISSIONS.FISCAL_FINALIZE);
  button.textContent = year.status === 'FINALIZED' ? 'Exercice arrêté' : 'Arrêter l’exercice';
  const badge = $('#fiscalYearStatusBadge');
  if (badge) { badge.innerHTML = `<i></i> ${year.status === 'FINALIZED' ? 'Exercice arrêté' : 'Exercice ouvert'}`; badge.classList.toggle('is-finalized', year.status === 'FINALIZED'); }
}

function finalizeCurrentYear() {
  if (!requirePermission(USER_PERMISSIONS.FISCAL_FINALIZE)) return;
  const year = currentFiscalYear();
  const snapshot = currentFinancialSnapshot();
  if (!snapshot) { showToast('Préparez l’instantané officiel avant l’arrêté.'); return; }
  try {
    const finalized = finalizeFiscalYear(year, { periods: appState.periods[appState.activeCompany] || [], checks: currentFinalizationChecks(), snapshot, userId: 'claire-dossou' });
    appState.fiscalYears[appState.activeCompany] = finalized;
    appState.fiscalYearCatalog[appState.activeCompany] = (appState.fiscalYearCatalog[appState.activeCompany] || []).map((item) => String(item.id) === String(year.id) ? { ...item, ...finalized, status: 'FINALIZED' } : item);
    appState.periods[appState.activeCompany] = (appState.periods[appState.activeCompany] || []).map((period) => ({ ...period, status: 'CLOSED', closedAt: finalized.finalizedAt, closedBy: finalized.finalizedBy }));
    appState.fiscalYearPeriods[appState.activeCompany][String(year.id)] = appState.periods[appState.activeCompany];
    appState.financialSnapshots = (appState.financialSnapshots || []).map((item) => item.id === snapshot.id ? { ...item, status: 'FINALIZED', immutable: true, finalizedAt: finalized.finalizedAt } : item);
    appState.fiscalYearFinalizations.push({ companyId: appState.activeCompany, fiscalYear: year.id, snapshotId: snapshot.id, finalizedAt: finalized.finalizedAt, userId: 'claire-dossou' });
    appState.auditEvents.push({ id: `audit-${Date.now()}`, action: 'FISCAL_YEAR_FINALIZED', companyId: appState.activeCompany, fiscalYear: year.id, snapshotId: snapshot.id, at: finalized.finalizedAt, userId: 'claire-dossou' });
    persistAppState();
    renderFinalization();
    renderStatements();
    showToast('Exercice arrêté définitivement et instantané officiel scellé.');
  } catch (error) { showToast(error.message); }
}

function currentPeriod() {
  const periods = appState.periods[appState.activeCompany] || [];
  if (!periods.length) { appState.periods[appState.activeCompany] = [{ id: '2025-06', label: 'Juin 2025', start: '2025-06-01', end: '2025-06-30', status: 'OPEN' }]; }
  const activeId = appState.activePeriodIds?.[appState.activeCompany];
  return appState.periods[appState.activeCompany].find((period) => period.id === activeId) || appState.periods[appState.activeCompany][0];
}

function currentClosureChecks() {
  const period = currentPeriod();
  const companyEntries = appState.recentEntries.filter((entry) => entry.companyId === appState.activeCompany && entry.status !== OPERATION_STATES.CANCELLED && String(entry.date).startsWith(period.id));
  const sourceEntries = appState.integratedEntries.filter((entry) => entry.companyId === appState.activeCompany && !entry.technicalOnly && entry.status !== OPERATION_STATES.CANCELLED && String(entry.date).startsWith(period.id));
  const isStatementMovement = (movement) => movement.origin === 'STATEMENT' || String(movement.id).startsWith('imported-bank-');
  const companyBanks = appState.bankMovements.filter((movement) => movement.companyId === appState.activeCompany && String(movement.date).startsWith(period.id) && movement.treasuryType !== 'CASH' && isStatementMovement(movement));
  const periodRuns = appState.automaticRuns.filter((run) => run.companyId === appState.activeCompany && run.period === period.id);
  const runCategories = new Set(periodRuns.map((run) => run.category));
  const fiscalTaxRun = periodRuns.find((run) => run.category === 'FISCAL_TAX');
  const fiscalTaxEntries = appState.integratedEntries.filter((entry) => entry.companyId === appState.activeCompany && (entry.source === 'Calcul fiscal automatique' || String(entry.id || '').startsWith('auto-tax-')) && String(entry.date || '').startsWith(period.id));
  const fiscalTaxPending = Boolean(fiscalTaxEntries.some((entry) => ![OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status)) || (fiscalTaxRun && fiscalTaxRun.status !== 'VALIDATED' && !fiscalTaxEntries.length));
  const fiscal = fiscalResultForPeriod(period.id);
  const automaticReady = ['AMORTISSEMENTS', 'ABONNEMENTS', 'CENTRALISATION', 'RESULTAT'].every((category) => runCategories.has(category)) && !fiscalTaxPending;
  return [
    { id: 'balance', label: 'Équilibres fondamentaux', description: 'Les écritures sources possèdent des lignes équilibrées.', passed: sourceEntries.length > 0, action: 'journal', actionLabel: 'Voir le journal' },
    { id: 'entries', label: 'Saisies validées', description: `${companyEntries.filter((entry) => entry.status !== OPERATION_STATES.VALIDATED).length} saisie(s) restent à contrôler.`, passed: companyEntries.every((entry) => entry.status === OPERATION_STATES.VALIDATED), action: 'entry', actionLabel: 'Contrôler les saisies' },
    { id: 'automatic', label: 'Traitements automatiques', description: fiscalTaxPending ? 'Une proposition d’impôt reste à contrôler avant la clôture.' : 'Amortissements, abonnements, centralisation et résultat traités.', passed: automaticReady, action: 'periodic', actionLabel: 'Voir les traitements' },
    { id: 'bank', label: 'Banque et rapprochement', description: companyBanks.length ? `${companyBanks.filter((movement) => movement.status !== 'RECONCILED').length} mouvement(s) bancaire(s) restent à rapprocher.` : 'Aucun mouvement de relevé ne reste à rapprocher.', passed: companyBanks.every((movement) => movement.status === 'RECONCILED'), action: 'bank', actionLabel: 'Ouvrir la banque' },
    { id: 'fiscal', label: 'Résultat fiscal et impôt', description: fiscal.ready ? `Taux ${fiscal.taxRate} % renseigné et calcul disponible.` : fiscal.missingRegulatoryMinimum ? 'Le minimum réglementaire de cette activité reste à renseigner.' : 'Le taux fiscal de la société reste à valider.', passed: fiscal.ready, action: 'periodic', actionLabel: 'Paramétrer le fiscal' },
    { id: 'sync', label: 'Livre journal synchronisé', description: 'Les écritures actives sont présentes dans le livre journal intégré.', passed: sourceEntries.length > 0, action: 'journal', actionLabel: 'Vérifier le livre' }
  ];
}

function renderClosure() {
  const container = $('#closureChecks');
  if (!container) return;
  const period = currentPeriod();
  const periodLabel = $('#closurePeriodLabel');
  if (periodLabel) periodLabel.textContent = period.label;
  const evaluation = evaluatePeriodClosure(currentClosureChecks());
  container.innerHTML = evaluation.checks.map((check) => `<div class="closure-check-row ${check.passed ? 'is-passed' : 'is-blocked'}"><span class="closure-check-icon">${check.passed ? '✓' : '!'}</span><span class="closure-check-copy"><strong>${escapeHtml(check.label)}</strong><small>${escapeHtml(check.description)}</small></span>${check.passed ? '<span class="status status-green">OK</span>' : `<button class="closure-check-action" type="button" data-closure-action="${escapeHtml(check.action)}">${escapeHtml(check.actionLabel)}</button>`}</div>`).join('');
  $('#closureProgress').textContent = `${evaluation.passedCount} / ${evaluation.totalCount} contrôles`;
  $('#closureBlockCount').textContent = evaluation.blockingCount ? `${evaluation.blockingCount} blocage${evaluation.blockingCount > 1 ? 's' : ''}` : 'Prête à clôturer';
  $('#closureScore strong').textContent = String(evaluation.passedCount);
  $('#closureScore small').textContent = `sur ${evaluation.totalCount} contrôles`;
  $('#closureSideMessage').textContent = period.status === 'CLOSED' ? 'La période est clôturée et les écritures sont verrouillées.' : evaluation.valid ? 'Tous les contrôles bloquants sont résolus.' : 'La période ne peut pas encore être clôturée.';
  const sideNote = $('#closureSideNote');
  if (sideNote) sideNote.textContent = `La clôture définitive sera enregistrée dans l’audit et bloquera toute nouvelle saisie sur ${period.label}.`;
  const button = $('#closePeriodButton');
  button.disabled = period.status === 'CLOSED' || !evaluation.valid || !can(USER_PERMISSIONS.PERIODS_CLOSE);
  button.textContent = period.status === 'CLOSED' ? 'Période clôturée' : 'Clôturer la période';
  const badge = $('#closePeriodBadge');
  if (badge) { badge.innerHTML = `<i></i> ${period.status === 'CLOSED' ? 'Période clôturée' : 'Période ouverte'}`; badge.classList.toggle('is-closed', period.status === 'CLOSED'); }
}

function refreshClosure() {
  renderClosure();
  showToast('Les contrôles de clôture ont été actualisés.');
}

function closeCurrentPeriod() {
  if (!requirePermission(USER_PERMISSIONS.PERIODS_CLOSE)) return;
  const period = currentPeriod();
  try {
    const closed = closePeriod(period, { checks: currentClosureChecks(), userId: 'claire-dossou' });
    appState.periods[appState.activeCompany] = (appState.periods[appState.activeCompany] || []).map((item) => item.id === period.id ? closed : item);
    appState.periodClosures.push({ companyId: appState.activeCompany, periodId: period.id, closedAt: closed.closedAt, userId: closed.closedBy });
    persistAppState();
    renderClosure();
    showToast('Période clôturée. Les écritures de juin sont maintenant verrouillées.');
  } catch (error) { showToast(error.message); }
}

function currentDossierCode(companyId = appState.activeCompany) {
  const fiscalYear = appState.fiscalYears?.[companyId]?.id;
  const dossiers = appState.dossiers || [];
  const dossier = dossiers.find((item) => item.companyId === companyId && item.moduleId === 'CSR' && item.exerciseYear === String(fiscalYear) && item.status !== 'Archivé')
    || dossiers.find((item) => item.companyId === companyId && item.moduleId === 'CSR' && item.status !== 'Archivé')
    || dossiers.find((item) => item.companyId === companyId && item.status !== 'Archivé');
  return dossier?.dossier || `${appState.companies[companyId]?.code || 'DOSSIER'}-${String(fiscalYear || '2025').slice(-2)}`;
}

function activeCorrectionWindow() {
  const companyId = appState.activeCompany;
  if (!appState.correctionWindows[companyId]) {
    appState.correctionWindows[companyId] = createCorrectionWindow({ dossierId: currentDossierCode(companyId), companyId, userId: 'claire-dossou', periodId: currentPeriod().id });
  }
  return appState.correctionWindows[companyId];
}

function renderCorrectionWindow() {
  const panel = $('#correctionWindowPanel');
  const usedNode = $('#correctionWindowUsed');
  const remainingNode = $('#correctionWindowRemaining');
  if (!panel || !usedNode || !remainingNode) return;
  const window = activeCorrectionWindow();
  const remaining = Math.max(0, 3 - window.candidateIds.length);
  usedNode.textContent = String(window.candidateIds.length);
  remainingNode.textContent = remaining ? `${remaining} disponible${remaining > 1 ? 's' : ''}` : 'Fenêtre verrouillée';
  panel.classList.toggle('is-full', remaining === 0);
}

function queueStatus(status) {
  return ({ TO_REVIEW: ['À contrôler', 'status-purple'], VALIDATED: ['Validée', 'status-green'], CANCELLED: ['Annulée', 'status-red'] })[status] || ['Brouillon', 'status-amber'];
}

function renderEntryQueue() {
  const rows = $('#entryRows');
  if (!rows) return;
  const window = activeCorrectionWindow();
  const entries = appState.recentEntries.filter((entry) => entry.companyId === appState.activeCompany && entry.status !== OPERATION_STATES.CANCELLED);
  const pending = entries.filter((entry) => entry.status !== OPERATION_STATES.VALIDATED).length;
  const count = $('#entryQueueCount');
  if (count) count.textContent = String(pending);
  rows.innerHTML = entries.map((entry) => {
    const [label, statusClass] = queueStatus(entry.status);
    const deletable = canDeleteCorrectionCandidate(window, entry);
    const deleteAction = deletable ? `<button class="icon-button small delete-entry-button" type="button" data-action="delete-entry" data-entry-id="${escapeHtml(entry.id)}" aria-label="Supprimer cette imputation"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>` : '<span class="entry-locked" title="Correction verrouillée">⌁</span>';
    const validateAction = entry.status === OPERATION_STATES.TO_REVIEW ? `<button class="icon-button small validate-entry-button" type="button" data-action="validate-entry" data-entry-id="${escapeHtml(entry.id)}" aria-label="Valider cette imputation">✓</button>` : '';
    const editAction = entry.status === OPERATION_STATES.TO_REVIEW ? `<button class="icon-button small edit-entry-button" type="button" data-action="edit-entry" data-entry-id="${escapeHtml(entry.id)}" aria-label="Modifier cette imputation">✎</button>` : '';
    const action = `<span class="entry-actions">${editAction}${validateAction}${deleteAction}</span>`;
    const journalClass = entry.journalId === 'AC' ? 'journal-badge-blue' : entry.journalId === 'BQ' ? 'journal-badge-teal' : '';
    return `<tr><td>${escapeHtml(displayDate(entry.date))}</td><td><span class="journal-badge ${journalClass}">${escapeHtml(entry.journalId || 'OD')}</span> Saisie</td><td><span class="cell-title">${escapeHtml(entry.label)}</span><small class="cell-subtitle">${deletable ? 'Dans la fenêtre de correction' : 'Correction verrouillée'}</small></td><td class="align-right">${numberLabel(entry.amount)}</td><td>${escapeHtml(entry.accountIds?.join(' / ') || 'À compléter')}</td><td><span class="status ${statusClass}">${label}</span></td><td>${action}</td></tr>`;
  }).join('');
  if (!entries.length) rows.innerHTML = '<tr><td colspan="7" class="dossier-empty">Aucune saisie active dans ce dossier.</td></tr>';
}

function editRecentEntry(entryId) {
  if (!requirePermission(USER_PERMISSIONS.ENTRIES_CORRECT)) return;
  const entry = appState.recentEntries.find((item) => item.id === entryId && item.companyId === appState.activeCompany);
  if (!entry) { showToast('Écriture introuvable.'); return; }
  if (entry.status !== OPERATION_STATES.TO_REVIEW) {
    showToast('Cette écriture est validée ou verrouillée.');
    return;
  }
  const tab = document.querySelector(`.entry-tab[data-entry-tab="${entry.journalId === 'VE' ? 'sale' : entry.journalId === 'AC' ? 'purchase' : entry.journalId === 'BQ' ? (entry.natureOperation === 'PAIEMENT' ? 'payment' : 'receipt') : 'free'}"]`);
  openView('entry');
  if (tab) selectEntryTab(tab);
  $('#entryDate').value = entry.date || '';
  $('#entryJournal').value = entry.journalId || 'OD';
  $('#entryReference').value = entry.reference || '';
  $('#entryLabel').value = entry.label || '';
  $('#entryAmount').value = numberLabel(entry.amount || entry.debit || entry.credit || 0);
  $('#entryCategory').value = entry.category || (entry.journalId === 'AC' ? 'goods-purchase' : entry.journalId === 'VE' ? 'service-sale' : 'other');
  renderThirdpartyOptions();
  const partySelect = $('#entryThirdParty');
  if (partySelect && entry.thirdPartyId && Array.from(partySelect.options).some((option) => option.value === entry.thirdPartyId)) partySelect.value = entry.thirdPartyId;
  else if (partySelect && entry.thirdPartyName && entry.thirdPartyName !== 'Aucun tiers') {
    partySelect.value = 'manual';
    $('#entryManualParty').value = entry.thirdPartyName;
  }
  toggleManualEntryParty();
  editingEntryId = entryId;
  manualLineOverride = (entry.lines || []).map((line) => ({ ...line }));
  $('#entryCorrectionReasonField')?.removeAttribute('hidden');
  $('#entryCorrectionReason').value = '';
  const button = $('#insertEntryButton');
  if (button) button.firstChild.textContent = 'Enregistrer la correction ';
  renderLivePosting();
  showToast('Écriture chargée. Modifiez les lignes puis enregistrez la correction.');
}

function validateRecentEntry(entryId) {
  if (!requirePermission(USER_PERMISSIONS.ENTRIES_VALIDATE)) return;
  const entryIndex = appState.recentEntries.findIndex((item) => item.id === entryId && item.companyId === appState.activeCompany);
  if (entryIndex < 0) return;
  const entry = appState.recentEntries[entryIndex];
  if (entry.status !== OPERATION_STATES.TO_REVIEW) return;
  const validated = transitionOperation(entry, OPERATION_STATES.VALIDATED);
  appState.recentEntries[entryIndex] = validated;
  const integratedIndex = appState.integratedEntries.findIndex((item) => item.id === entryId && item.companyId === appState.activeCompany);
  if (integratedIndex >= 0) appState.integratedEntries[integratedIndex] = { ...appState.integratedEntries[integratedIndex], status: OPERATION_STATES.VALIDATED, validatedAt: validated.statusChangedAt };
  const validationAudit = { id: `audit-${Date.now()}`, type: 'ENTRY_VALIDATED', action: 'ENTRY_VALIDATED', companyId: entry.companyId, entryId, at: validated.statusChangedAt, userId: appState.currentUserId };
  appState.auditEvents.push(validationAudit);
  queueSyncChange({ entityType: 'AUDIT_EVENT', entityId: validationAudit.id, companyId: entry.companyId, moduleId: 'CSR', payload: validationAudit });
  queueSyncChange({ entityType: 'JOURNAL_ENTRY', entityId: entryId, companyId: entry.companyId, moduleId: 'CSR', payload: { ...validated, source: 'Validation CSR' } });
  persistAppState();
  renderEntryQueue();
  renderIntegratedJournal();
  renderCorrectionWindow();
  showToast('Écriture validée et verrouillée.');
}

function deleteRecentEntry(entryId) {
  if (!requirePermission(USER_PERMISSIONS.ENTRIES_CORRECT)) return;
  const entry = appState.recentEntries.find((item) => item.id === entryId && item.companyId === appState.activeCompany);
  if (!entry) return;
  const window = activeCorrectionWindow();
  if (!canDeleteCorrectionCandidate(window, entry)) {
    showToast('Cette imputation est verrouillée. Une correction contrôlée est nécessaire.');
    return;
  }
  const result = deleteCorrectionCandidate(window, entry, 'Correction depuis la fenêtre des trois imputations récentes');
  appState.correctionWindows[appState.activeCompany] = result.window;
  appState.recentEntries = appState.recentEntries.filter((item) => item.id !== entryId);
  const deletionAudit = { id: `audit-${Date.now()}`, type: 'CORRECTION_DELETE', action: 'CORRECTION_DELETE', companyId: entry.companyId, entryId, reason: result.entry.cancellationReason, at: result.entry.cancelledAt, userId: appState.currentUserId };
  appState.auditEvents.push(deletionAudit);
  appState.integratedEntries = appState.integratedEntries.filter((item) => item.id !== entryId);
  queueSyncChange({ entityType: 'AUDIT_EVENT', entityId: deletionAudit.id, companyId: entry.companyId, moduleId: 'CSR', payload: deletionAudit });
  queueSyncChange({ entityType: 'JOURNAL_ENTRY', entityId: entryId, companyId: entry.companyId, moduleId: 'CSR', payload: { ...entry, ...result.entry, status: 'CANCELLED', source: 'Correction CSR' } });
  persistAppState();
  renderEntryQueue();
  renderCorrectionWindow();
  renderIntegratedJournal();
  showToast('Imputation supprimée. La trace reste conservée dans l’audit.');
}

function integratedJournalForCompany(companyId) {
  const fiscalYear = appState.fiscalYears?.[companyId]?.id || '2025';
  let journal = createIntegratedJournal({ id: `lj-${companyId}-${fiscalYear}`, companyId, fiscalYear });
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

function validateAutomaticEntry(entryId) {
  if (!requirePermission(USER_PERMISSIONS.ENTRIES_VALIDATE)) return;
  const index = appState.integratedEntries.findIndex((entry) => entry.id === entryId && entry.companyId === appState.activeCompany);
  if (index < 0) { showToast('Écriture automatique introuvable.'); return; }
  const entry = appState.integratedEntries[index];
  if (!['AM', 'AB', 'CT', 'RP'].includes(entry.journalId)) { showToast('Cette écriture ne relève pas d’un journal automatique.'); return; }
  // The action is idempotent: a double click or an old browser listener must
  // not turn a successful validation into a misleading error message.
  if ([OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status)) {
    renderIntegratedJournal();
    renderAutomaticRuns();
    return;
  }
  if (entry.status !== OPERATION_STATES.TO_REVIEW) { showToast('Cette écriture automatique ne peut plus être validée.'); return; }
  const validatedAt = new Date().toISOString();
  const validated = { ...entry, status: OPERATION_STATES.VALIDATED, validatedAt, statusChangedAt: validatedAt };
  appState.integratedEntries[index] = validated;
  const runCategory = entry.source === 'Calcul fiscal automatique' || String(entry.id || '').startsWith('auto-tax-')
    ? 'FISCAL_TAX'
    : entry.integrationCategory || ({ AM: 'AMORTISSEMENTS', AB: 'ABONNEMENTS', CT: 'CENTRALISATION', RP: 'RESULTAT' })[entry.journalId];
  const runPeriod = String(entry.date || currentPeriod().id).slice(0, 7);
  const run = appState.automaticRuns.find((item) => item.companyId === entry.companyId && item.category === runCategory && item.period === runPeriod);
  if (run) { run.status = 'VALIDATED'; run.validatedAt = validatedAt; }
  const audit = { id: `audit-${Date.now()}`, action: 'AUTOMATIC_ENTRY_VALIDATED', companyId: appState.activeCompany, entryId, journalId: entry.journalId, at: validated.validatedAt, userId: appState.currentUserId };
  appState.auditEvents.push(audit);
  queueSyncChange({ entityType: 'AUDIT_EVENT', entityId: audit.id, companyId: appState.activeCompany, moduleId: 'CSR', payload: audit });
  queueSyncChange({ entityType: 'JOURNAL_ENTRY', entityId, companyId: appState.activeCompany, moduleId: 'CSR', payload: validated });
  persistAppState();
  renderIntegratedJournal();
  renderAutomaticRuns();
  showToast('Écriture automatique validée et verrouillée.');
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
    const journalClass = ({ AC: 'journal-badge-blue', BQ: 'journal-badge-teal', OD: 'journal-badge-amber', AM: 'journal-badge-amber', AB: 'journal-badge-purple', CT: 'journal-badge-blue', RP: 'journal-badge-teal' })[entry.journalId] || '';
    const automatic = ['AM', 'AB', 'CT', 'RP'].includes(entry.journalId);
    const action = automatic && entry.status === OPERATION_STATES.TO_REVIEW ? `<button class="text-button table-action" type="button" data-action="validate-automatic-entry" data-entry-id="${escapeHtml(entry.id)}">Valider</button>` : automatic ? '<span class="table-action-locked">Verrouillée</span>' : '';
    return `<tr><td><b>${escapeHtml(entry.reference || '—')}</b></td><td>${escapeHtml(displayDate(entry.date))}</td><td><span class="journal-badge ${journalClass}">${escapeHtml(entry.journalId || 'OD')}</span></td><td><span class="integrated-category ${categoryClass(categoryId)}">${escapeHtml(category.shortLabel)}</span></td><td><span class="cell-title">${escapeHtml(entry.label)}</span><small class="cell-subtitle">${escapeHtml(entry.source || 'Imputation synchronisée')}</small></td><td class="align-right">${numberLabel(entry.debit || entry.amount || 0)}</td><td class="align-right">${numberLabel(entry.credit || entry.amount || 0)}</td><td><span class="status ${statusClass}">${label}</span></td><td>${action}</td></tr>`;
  }).join('');
  if (!entries.length) rows.innerHTML = '<tr><td colspan="9" class="dossier-empty">Aucune écriture dans cette catégorie.</td></tr>';
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
  receipt: { title: 'Encaissement', category: 'other', journal: 'BQ' },
  payment: { title: 'Décaissement', category: 'other', journal: 'BQ' },
  transfer: { title: 'Transfert', category: 'other', journal: 'BQ' },
  asset: { title: 'Immobilisation', category: 'other', journal: 'OD' }
};

function parseUiAmount(value) {
  let normalized = String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s/g, '').trim();
  if (!normalized) return 0;
  const commaCount = (normalized.match(/,/g) || []).length;
  const dotCount = (normalized.match(/\./g) || []).length;
  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  if (commaCount && dotCount) {
    normalized = lastComma > lastDot ? normalized.replace(/\./g, '').replace(',', '.') : normalized.replace(/,/g, '');
  } else if (commaCount > 1 || (commaCount === 1 && normalized.split(',')[1].length === 3)) {
    normalized = normalized.replace(/,/g, '');
  } else if (commaCount === 1) {
    normalized = normalized.replace(',', '.');
  } else if (dotCount > 1 || (dotCount === 1 && normalized.split('.')[1].length === 3)) {
    normalized = normalized.replace(/\./g, '');
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : NaN;
}

function normalizedManualLines() {
  return manualLineDraft.map((line) => ({ accountId: String(line.accountId || '').trim(), label: String(line.label || '').trim(), debit: parseUiAmount(line.debit), credit: parseUiAmount(line.credit) }));
}

function renderManualLineEditor() {
  const rows = $('#multiLineRows');
  if (!rows) return;
  rows.innerHTML = manualLineDraft.map((line, index) => `<div class="manual-line-row"><span class="manual-line-number">${index + 1}</span><label class="manual-field"><span>Compte</span><input type="text" value="${escapeHtml(line.accountId || '')}" placeholder="N° compte" data-manual-line="${index}" data-manual-field="accountId"></label><label class="manual-field manual-field-wide"><span>Libellé</span><input class="manual-line-label" type="text" value="${escapeHtml(line.label || '')}" placeholder="Libellé" data-manual-line="${index}" data-manual-field="label"></label><label class="manual-field"><span>Débit</span><div class="manual-amount"><input type="text" value="${escapeHtml(line.debit || '')}" placeholder="0" data-manual-line="${index}" data-manual-field="debit"><span>D</span></div></label><label class="manual-field"><span>Crédit</span><div class="manual-amount manual-credit"><input type="text" value="${escapeHtml(line.credit || '')}" placeholder="0" data-manual-line="${index}" data-manual-field="credit"><span>C</span></div></label><button class="icon-button small" type="button" data-action="remove-manual-line" data-line-index="${index}" aria-label="Supprimer la ligne" ${manualLineDraft.length <= 2 ? 'disabled' : ''}><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div>`).join('');
  updateManualLineSummary();
}

function updateManualLineSummary() {
  const lines = normalizedManualLines();
  const debit = lines.reduce((sum, line) => sum + (Number.isFinite(line.debit) ? line.debit : 0), 0);
  const credit = lines.reduce((sum, line) => sum + (Number.isFinite(line.credit) ? line.credit : 0), 0);
  const totalDebit = $('#multiLineSummary span:first-child strong');
  const totalCredit = $('#multiLineSummary span:nth-child(2) strong');
  const balance = $('#multiLineBalance');
  if (totalDebit) totalDebit.textContent = numberLabel(debit);
  if (totalCredit) totalCredit.textContent = numberLabel(credit);
  if (balance) { const balanced = lines.length >= 2 && Math.abs(debit - credit) < 0.005; balance.textContent = balanced ? 'Équilibrée ✓' : 'À équilibrer'; balance.className = `multi-line-balance ${balanced ? 'is-balanced' : 'is-unbalanced'}`; }
}

function openManualLineEditor({ lines = null, title = 'Modifier les lignes', context = null } = {}) {
  manualLineContext = context;
  if (!lines) {
    let suggestion;
    try { suggestion = suggestPosting(entryOperation()); } catch { suggestion = { lines: [] }; }
    lines = suggestion.lines?.length ? suggestion.lines : [{ accountId: '', label: '', debit: 0, credit: 0 }, { accountId: '', label: '', debit: 0, credit: 0 }];
  }
  manualLineDraft = lines.map((line) => ({ accountId: line.accountId || '', label: line.label || '', debit: line.debit || 0, credit: line.credit || 0 }));
  renderManualLineEditor();
  const titleNode = $('#multiLineTitle');
  if (titleNode) titleNode.textContent = title;
  openModal('multiLineModal');
}

function openPaymentImputationEditor(paymentId) {
  const payment = (appState.payments || []).find((item) => item.id === paymentId && item.companyId === appState.activeCompany);
  if (!payment) { showToast('Règlement introuvable.'); return; }
  const entry = payment.journalEntryId && appState.recentEntries.find((item) => item.id === payment.journalEntryId);
  if (entry && [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status)) {
    showToast('Cette écriture est validée et verrouillée. Utilisez une correction contrôlée.');
    return;
  }
  openManualLineEditor({
    lines: payment.imputationLines || paymentToJournalLines(payment),
    title: `Imputation · ${payment.type === PAYMENT_TYPES.RECEIPT ? 'Encaissement' : 'Paiement'}`,
    context: { kind: 'PAYMENT', paymentId, entryId: payment.journalEntryId, total: payment.amount, document: { date: payment.date } }
  });
}

function applyPaymentImputationLines(lines, context) {
  const setup = appState.accountingSetups[appState.activeCompany] || createCsrSetup({ companyId: appState.activeCompany });
  validateJournalEntry({ companyId: appState.activeCompany, journalId: 'BQ', date: context.document?.date || $('#entryDate')?.value, lines }, { companyId: appState.activeCompany, accountIds: setup.accounts.map((account) => account.id) });
  const debit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const credit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  if (Math.abs(debit - credit) > 0.005 || Math.abs(debit - Number(context.total || 0)) > 0.005) throw new Error(`L’imputation doit rester équilibrée et totaliser ${numberLabel(context.total)} FCFA.`);
  const payment = (appState.payments || []).find((item) => item.id === context.paymentId && item.companyId === appState.activeCompany);
  if (!payment) throw new Error('Règlement source introuvable.');
  const entry = context.entryId && appState.recentEntries.find((item) => item.id === context.entryId);
  if (entry && [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status)) throw new Error('Cette écriture est validée et verrouillée.');
  payment.imputationLines = lines;
  if (entry) {
    entry.lines = lines;
    entry.accountIds = lines.map((line) => line.accountId);
    const integrated = appState.integratedEntries.find((item) => item.id === context.entryId);
    if (integrated) { integrated.lines = lines; integrated.accountIds = entry.accountIds; integrated.debit = debit; integrated.credit = credit; }
    queueSyncChange({ entityType: 'JOURNAL_ENTRY', entityId: context.entryId, companyId: payment.companyId, moduleId: 'CSR', payload: { ...entry, lines, source: 'Modification d’imputation règlement' } });
  }
  persistAppState();
  closeModal();
  manualLineContext = null;
  renderPaymentHistory();
  renderIntegratedJournal();
  renderEntryQueue();
  showToast('Imputation du règlement modifiée et historisée.');
}

function applyInvoiceImputationLines(lines, context) {
  const setup = appState.accountingSetups[appState.activeCompany] || createCsrSetup({ companyId: appState.activeCompany });
  const journalId = context.type === 'PURCHASE' ? 'AC' : 'VE';
  validateJournalEntry({ companyId: appState.activeCompany, journalId, date: context.document?.date || $('#entryDate')?.value, lines }, { companyId: appState.activeCompany, accountIds: setup.accounts.map((account) => account.id) });
  const debit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const credit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  if (Math.abs(debit - credit) > 0.005 || Math.abs(debit - Number(context.total || 0)) > 0.005) throw new Error(`L’imputation doit rester équilibrée et totaliser ${numberLabel(context.total)} FCFA.`);
  const baseLines = context.document?.imputationLines || [];
  const enrichedLines = lines.map((line, index) => ({ ...(baseLines[index] || {}), ...line }));
  invoiceImputationOverrides[context.type] = enrichedLines;
  if (!context.invoiceId) {
    closeModal();
    renderInvoicePreview(context.type);
    manualLineContext = null;
    showToast('Imputation de facture modifiée. Elle sera utilisée lors de la comptabilisation.');
    return;
  }
  const config = invoiceConfig(context.type);
  const invoice = (appState[config.collection] || []).find((item) => item.id === context.invoiceId);
  if (!invoice) throw new Error('Facture source introuvable.');
  const entry = context.entryId && appState.recentEntries.find((item) => item.id === context.entryId);
  if (entry && [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED].includes(entry.status)) throw new Error('Cette écriture est validée et verrouillée.');
  invoice.imputationLines = enrichedLines;
  invoice.imputationEditedAt = new Date().toISOString();
  if (entry) {
    entry.lines = enrichedLines;
    entry.accountIds = enrichedLines.map((line) => line.accountId);
    const integrated = appState.integratedEntries.find((item) => item.id === context.entryId);
    if (integrated) { integrated.lines = enrichedLines; integrated.accountIds = entry.accountIds; integrated.debit = debit; integrated.credit = credit; }
    queueSyncChange({ entityType: 'JOURNAL_ENTRY', entityId: context.entryId, companyId: invoice.companyId, moduleId: 'CSR', payload: { ...entry, lines: enrichedLines, source: 'Modification d’imputation facture' } });
  }
  persistAppState();
  closeModal();
  manualLineContext = null;
  renderInvoiceHistory(context.type);
  renderIntegratedJournal();
  renderEntryQueue();
  showToast('Imputation de facture modifiée et historisée.');
}

function applyManualLines() {
  const lines = normalizedManualLines();
  const setup = appState.accountingSetups[appState.activeCompany] || createCsrSetup({ companyId: appState.activeCompany });
  try {
    if (manualLineContext?.kind === 'INVOICE') return applyInvoiceImputationLines(lines, manualLineContext);
    if (manualLineContext?.kind === 'PAYMENT') return applyPaymentImputationLines(lines, manualLineContext);
    validateJournalEntry({ companyId: appState.activeCompany, journalId: $('#entryJournal').value, date: $('#entryDate').value, lines }, { companyId: appState.activeCompany, accountIds: setup.accounts.map((account) => account.id) });
    manualLineOverride = lines;
    manualLineContext = null;
    closeModal();
    renderLivePosting();
    showToast(`${lines.length} lignes d’imputation prêtes à être contrôlées.`);
  } catch (error) { updateManualLineSummary(); showToast(error.message); }
}

function entryLinesForCurrentOperation(suggestion) {
  return manualLineOverride ? manualLineOverride : (suggestion.lines || []);
}

function entryOperation() {
  const category = $('#entryCategory')?.value || 'other';
  const thirdParty = currentEntryParty();
  const manual = $('#entryThirdParty')?.value === 'manual';
  const manualName = $('#entryManualParty')?.value.trim() || '';
  return {
    category,
    total: $('#entryAmount')?.value || '',
    thirdPartyName: manual ? manualName || 'Nouveau tiers' : thirdParty?.name || 'Aucun tiers',
    customerAccount: (thirdParty?.type === THIRD_PARTY_TYPES.CLIENT || (manual && entryPartyType(category) === THIRD_PARTY_TYPES.CLIENT)) ? (thirdParty?.auxiliaryAccountId || THIRD_PARTY_DEFAULT_ACCOUNTS.CLIENT) : undefined,
    supplierAccount: (thirdParty?.type === THIRD_PARTY_TYPES.SUPPLIER || (manual && entryPartyType(category) === THIRD_PARTY_TYPES.SUPPLIER)) ? (thirdParty?.auxiliaryAccountId || THIRD_PARTY_DEFAULT_ACCOUNTS.SUPPLIER) : undefined,
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
  const lines = entryLinesForCurrentOperation(suggestion);
  const validSides = lines.length >= 2 && lines.every((line) => {
    const debit = parseUiAmount(line.debit);
    const credit = parseUiAmount(line.credit);
    return Number.isFinite(debit) && Number.isFinite(credit) && ((debit > 0 && credit === 0) || (credit > 0 && debit === 0));
  });
  const debit = lines.reduce((sum, line) => { const value = parseUiAmount(line.debit); return sum + (Number.isFinite(value) ? value : 0); }, 0);
  const credit = lines.reduce((sum, line) => { const value = parseUiAmount(line.credit); return sum + (Number.isFinite(value) ? value : 0); }, 0);
  const parsedTotal = parseUiAmount(operation.total);
  const hasTotal = Number.isFinite(parsedTotal) && parsedTotal > 0;
  const amountMatches = !manualLineOverride || (hasTotal && Math.abs(debit - parsedTotal) < 0.005);
  totalNode.innerHTML = `${hasTotal ? numberLabel(parsedTotal) : '—'} <small>FCFA</small>`;
  const balanced = validSides && amountMatches && Math.abs(debit - credit) < 0.005;
  if (!balanced) {
    rows.innerHTML = lines.length ? lines.map((line) => `<div class="live-posting-row"><span><b>${escapeHtml(line.accountId || 'Compte à compléter')}</b><small>${escapeHtml(line.label || 'Libellé à compléter')}</small></span><strong>${parseUiAmount(line.debit) > 0 ? numberLabel(parseUiAmount(line.debit)) : parseUiAmount(line.credit) > 0 ? numberLabel(parseUiAmount(line.credit)) : '—'}</strong><em class="${parseUiAmount(line.debit) > 0 ? '' : 'credit'}">${parseUiAmount(line.debit) > 0 ? 'D' : 'C'}</em></div>`).join('') : '<div class="posting-empty"><span>?</span><p>Complétez le montant et choisissez une catégorie pour obtenir une proposition d’imputation.</p></div>';
    status.className = 'entry-balance entry-balance-warning';
    status.querySelector('.balance-symbol').textContent = '!';
    status.querySelector('strong').textContent = manualLineOverride ? 'Imputation à équilibrer' : 'Imputation à compléter';
    statusMessage.textContent = manualLineOverride && hasTotal && !amountMatches ? `Le montant saisi est ${numberLabel(parsedTotal)} mais les lignes totalisent ${numberLabel(debit)}.` : manualLineOverride && hasTotal ? `Débit ${numberLabel(debit)} · Crédit ${numberLabel(credit)}.` : hasTotal ? 'Aucune règle automatique pour cette opération.' : 'Le montant est nécessaire pour contrôler l’écriture.';
    if (titleNode) titleNode.textContent = manualLineOverride ? 'Saisie multi-lignes' : 'En attente de catégorie';
    if (reasonNode) reasonNode.textContent = manualLineOverride ? 'Complétez les comptes et répartissez les montants avant insertion.' : suggestion.reason || 'Choisissez une catégorie d’opération.';
    return;
  }
  rows.innerHTML = lines.map((line) => `<div class="live-posting-row"><span><b>${escapeHtml(line.accountId)}</b><small>${escapeHtml(line.label)}</small></span><strong>${parseUiAmount(line.debit) > 0 ? numberLabel(parseUiAmount(line.debit)) : numberLabel(parseUiAmount(line.credit))}</strong><em class="${parseUiAmount(line.debit) > 0 ? '' : 'credit'}">${parseUiAmount(line.debit) > 0 ? 'D' : 'C'}</em></div>`).join('');
  status.className = 'entry-balance';
  status.querySelector('.balance-symbol').textContent = '✓';
  status.querySelector('strong').textContent = 'Écriture équilibrée';
  statusMessage.textContent = 'Débit et crédit correspondent au montant saisi.';
  if (titleNode) titleNode.textContent = manualLineOverride ? `Imputation multi-lignes · ${lines.length} lignes` : `Suggestion · ${Math.round(suggestion.confidence * 100)} %`;
  if (reasonNode) reasonNode.textContent = manualLineOverride ? 'Répartition saisie par l’utilisateur · prête pour insertion.' : suggestion.reason;
}

function centralizeEntryForms() {
  const pane = $('#entryDocumentPane');
  if (!pane || pane.dataset.centralized === 'true') return;
  const invoiceLayouts = [
    ['sale', document.querySelector('#view-sales .document-layout')],
    ['purchase', document.querySelector('#view-purchases .document-layout')]
  ];
  invoiceLayouts.forEach(([type, layout]) => {
    if (!layout) return;
    layout.dataset.entryDocumentType = type;
    pane.append(layout);
  });
  const paymentPane = $('#paymentEntryPane');
  if (paymentPane) {
    paymentPane.dataset.entryDocumentType = 'payment';
    pane.append(paymentPane);
  }
  pane.dataset.centralized = 'true';
}

function showCentralEntryDocument(type) {
  const tab = document.querySelector(`.entry-tab[data-entry-tab="${type}"]`);
  if (!tab) { showToast('Cette saisie centralisée n’est pas disponible.'); return; }
  openView('entry');
  selectEntryTab(tab);
  if (type === 'sale' || type === 'purchase') resetInvoice(type === 'sale' ? 'SALE' : 'PURCHASE');
  if (type === 'receipt' || type === 'payment') resetPayment();
}

function selectEntryTab(tab) {
  manualLineOverride = null;
  const tabId = tab.dataset.entryTab;
  const config = ENTRY_TAB_CONFIG[tabId] || ENTRY_TAB_CONFIG.free;
  $$('.entry-tab').forEach((item) => item.classList.toggle('is-active', item === tab));
  const genericLayout = document.querySelector('#view-entry .entry-layout');
  const documentPane = $('#entryDocumentPane');
  const documentType = tabId === 'sale' || tabId === 'purchase' ? tabId : tabId === 'receipt' || tabId === 'payment' ? 'payment' : null;
  if (documentPane) {
    documentPane.toggleAttribute('hidden', !documentType);
    Array.from(documentPane.children).forEach((child) => child.toggleAttribute('hidden', child.dataset.entryDocumentType !== documentType));
  }
  if (genericLayout) genericLayout.toggleAttribute('hidden', Boolean(documentType));
  if (documentType === 'payment') setPaymentType(tabId === 'payment' ? PAYMENT_TYPES.PAYMENT : PAYMENT_TYPES.RECEIPT);
  if (tabId === 'sale' || tabId === 'purchase') {
    const invoiceType = tabId === 'sale' ? 'SALE' : 'PURCHASE';
    renderInvoicePartyOptions(invoiceType);
    renderInvoiceLines(invoiceType);
    renderInvoicePreview(invoiceType);
  }
  const title = $('#entryTypeTitle');
  if (title) title.textContent = config.title;
  const category = $('#entryCategory');
  if (category) category.value = config.category;
  const journal = $('#entryJournal');
  if (journal) journal.value = config.journal;
  renderThirdpartyOptions();
  renderLivePosting();
}

function clearEntry(notify = true) {
  manualLineOverride = null;
  editingEntryId = null;
  manualLineContext = null;
  pendingBankImputationId = null;
  $('#entryBankSource')?.setAttribute('hidden', '');
  $('#entryCorrectionReasonField')?.setAttribute('hidden', '');
  $('#entryCorrectionReason').value = '';
  const button = $('#insertEntryButton');
  if (button) button.firstChild.textContent = 'Prévisualiser et insérer ';
  const form = $('#entryForm');
  if (!form) return;
  form.reset();
  $('#entryLabel').value = '';
  $('#entryReference').value = '';
  $('#entryAmount').value = '';
  renderLivePosting();
  if (notify) showToast('La saisie a été effacée.');
}

function ensureActivePeriodOpen() {
  const period = currentPeriod();
  if (period.status === 'CLOSED') {
    showToast(`${period.label} est clôturée. Une réouverture autorisée est nécessaire.`);
    return false;
  }
  return true;
}

function saveEntryCorrection(entryId, lines) {
  const entryIndex = appState.recentEntries.findIndex((item) => item.id === entryId && item.companyId === appState.activeCompany);
  if (entryIndex < 0) throw new Error('Écriture introuvable.');
  const current = appState.recentEntries[entryIndex];
  if (current.status !== OPERATION_STATES.TO_REVIEW) throw new Error('Cette écriture est déjà validée ou verrouillée.');
  const reason = $('#entryCorrectionReason')?.value.trim() || '';
  if (!reason) throw new Error('Le motif de la correction est obligatoire.');
  const setup = currentAccountSetup();
  const validation = validateJournalEntry({ companyId: appState.activeCompany, journalId: $('#entryJournal').value, date: $('#entryDate').value, lines }, { companyId: appState.activeCompany, accountIds: setup.accounts.map((account) => account.id) });
  const party = ensureManualEntryParty(currentEntryParty());
  const updated = { ...current, date: $('#entryDate').value, journalId: $('#entryJournal').value, reference: $('#entryReference').value.trim(), label: $('#entryLabel').value.trim(), thirdPartyId: party?.id, thirdPartyAccountId: party?.auxiliaryAccountId, thirdPartyName: party?.name, lines, amount: validation.debit, debit: validation.debit, credit: validation.credit };
  appState.recentEntries[entryIndex] = updated;
  const integratedIndex = appState.integratedEntries.findIndex((item) => item.id === entryId && item.companyId === appState.activeCompany);
  if (integratedIndex >= 0) appState.integratedEntries[integratedIndex] = { ...appState.integratedEntries[integratedIndex], ...updated, source: 'Correction contrôlée' };
  const existingTreasuryIndex = appState.bankMovements.findIndex((movement) => movement.matchedEntryId === entryId && movement.origin !== 'STATEMENT');
  const correctedTreasuryMovement = treasuryMovementForEntry(updated);
  if (correctedTreasuryMovement && existingTreasuryIndex >= 0) appState.bankMovements[existingTreasuryIndex] = { ...appState.bankMovements[existingTreasuryIndex], ...correctedTreasuryMovement, status: appState.bankMovements[existingTreasuryIndex].status };
  else if (correctedTreasuryMovement && existingTreasuryIndex < 0) appState.bankMovements.unshift(correctedTreasuryMovement);
  else if (!correctedTreasuryMovement && existingTreasuryIndex >= 0) appState.bankMovements.splice(existingTreasuryIndex, 1);
  const correctedAt = new Date().toISOString();
  const correctionAudit = { id: `audit-${Date.now()}`, action: 'ENTRY_CORRECTED', companyId: appState.activeCompany, entryId, reason, at: correctedAt, userId: appState.currentUserId };
  appState.auditEvents.push(correctionAudit);
  queueSyncChange({ entityType: 'AUDIT_EVENT', entityId: correctionAudit.id, companyId: appState.activeCompany, moduleId: 'CSR', payload: correctionAudit });
  queueSyncChange({ entityType: 'JOURNAL_ENTRY', entityId: entryId, companyId: appState.activeCompany, moduleId: 'CSR', payload: { ...updated, source: 'Correction contrôlée', correctionReason: reason } });
  editingEntryId = null;
  manualLineOverride = null;
  $('#entryCorrectionReasonField')?.setAttribute('hidden', '');
  $('#entryCorrectionReason').value = '';
  const button = $('#insertEntryButton');
  if (button) button.firstChild.textContent = 'Prévisualiser et insérer ';
  persistAppState();
  renderEntryQueue();
  renderIntegratedJournal();
  renderCorrectionWindow();
  showToast('Correction enregistrée dans l’audit. L’écriture reste à valider.');
}

function insertEntry() {
  if (!requirePermission(USER_PERMISSIONS.ENTRIES_CREATE)) return;
  if (!ensureActivePeriodOpen()) return;
  const operation = entryOperation();
  let suggestion;
  try { suggestion = suggestPosting(operation); } catch (error) { showToast(error.message); return; }
  const lines = entryLinesForCurrentOperation(suggestion);
  if (!lines.length) { showToast('Complétez l’imputation avant d’insérer l’écriture.'); return; }
  try {
    if (editingEntryId) {
      saveEntryCorrection(editingEntryId, lines);
      return;
    }
    const dossierId = currentDossierCode(appState.activeCompany);
    const setup = appState.accountingSetups[appState.activeCompany] || createCsrSetup({ companyId: appState.activeCompany });
    const selectedEntryParty = currentEntryParty();
    if ($('#entryThirdParty')?.value === 'manual' && !selectedEntryParty) throw new Error('Saisissez le nom du tiers avant d’insérer l’écriture.');
    const wasManualEntryParty = Boolean(selectedEntryParty?.manual);
    const entryThirdParty = ensureManualEntryParty(selectedEntryParty);
    const entryLines = wasManualEntryParty ? lines.map((line) => line.accountId === selectedEntryParty.collectiveAccountId ? { ...line, accountId: entryThirdParty.auxiliaryAccountId } : line) : lines;
    appState.accountingSetups[appState.activeCompany] = setup;
    const entry = createJournalEntry({ companyId: appState.activeCompany, journalId: $('#entryJournal').value, date: $('#entryDate').value, pieceDate: $('#entryDate').value, reference: $('#entryReference').value, label: $('#entryLabel').value, thirdPartyId: entryThirdParty?.id, thirdPartyAccountId: entryThirdParty?.auxiliaryAccountId, thirdPartyName: entryThirdParty?.name, lines: entryLines }, { activeCompanyId: appState.activeCompany, dossierId, accountIds: setup.accounts.map((account) => account.id) });
    const workflowEntry = transitionOperation(transitionOperation(entry, OPERATION_STATES.IMPUTED), OPERATION_STATES.TO_REVIEW);
    const total = entryLines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const enteredAmount = parseUiAmount(operation.total);
    if (manualLineOverride && (!Number.isFinite(enteredAmount) || Math.abs(total - enteredAmount) > 0.005)) {
      showToast('Le total des lignes doit correspondre au montant de l’opération.');
      return;
    }
    const queueEntry = { ...workflowEntry, amount: total, accountIds: entryLines.map((line) => line.accountId) };
    const correctionWindow = activeCorrectionWindow();
    try {
      appState.correctionWindows[appState.activeCompany] = registerCorrectionCandidate(correctionWindow, queueEntry);
    } catch (windowError) {
      if (windowError.code !== 'CORRECTION_WINDOW_FULL') throw windowError;
    }
    const linkedBankMovement = pendingBankImputationId && appState.bankMovements.find((movement) => movement.id === pendingBankImputationId && movement.companyId === appState.activeCompany);
    if (linkedBankMovement) {
      linkedBankMovement.matchedEntryId = workflowEntry.id;
      linkedBankMovement.status = 'POINTED';
      linkedBankMovement.imputationEntryId = workflowEntry.id;
      pendingBankImputationId = null;
      const bankAudit = { id: `audit-${Date.now()}`, action: 'BANK_MOVEMENT_IMPUTED', companyId: appState.activeCompany, movementId: linkedBankMovement.id, entryId: workflowEntry.id, at: new Date().toISOString(), userId: appState.currentUserId };
      appState.auditEvents.push(bankAudit);
      queueSyncChange({ entityType: 'AUDIT_EVENT', entityId: bankAudit.id, companyId: appState.activeCompany, moduleId: 'CSR', payload: bankAudit });
    }
    if (!linkedBankMovement) {
      const treasuryMovement = treasuryMovementForEntry(workflowEntry);
      if (treasuryMovement && !appState.bankMovements.some((movement) => movement.id === treasuryMovement.id)) appState.bankMovements.unshift(treasuryMovement);
    }
    appState.recentEntries.unshift(queueEntry);
    const syncedEntry = syncIntegratedJournal(integratedJournalForCompany(appState.activeCompany), { ...workflowEntry, amount: total, debit: total, credit: total, source: 'Saisie et insertion', integrationCategory: operation.category }).entries[0];
    appState.integratedEntries.unshift(syncedEntry);
    queueSyncChange({ entityType: 'JOURNAL_ENTRY', entityId: workflowEntry.id, companyId: appState.activeCompany, moduleId: 'CSR', payload: { ...workflowEntry, amount: total, debit: total, credit: total, source: 'Saisie et insertion', integrationCategory: operation.category } });
    persistAppState();
    renderIntegratedJournal();
    renderEntryQueue();
    renderCorrectionWindow();
    renderBankMovements();
    renderTreasury();
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
  if (action === 'fec') openFecAssistant();
  if (action === 'help') showToast('Le tutoriel d’utilisation sera ajouté dans l’étape dédiée.');
  if (action === 'placeholder') showToast('Cette opération sera paramétrée dans l’étape dédiée.');
  if (action === 'close') showLogin();
}

function renderAccessView() {
  const company = appState.companies[appState.activeCompany];
  const rows = $('#accessRows');
  if (!company || !rows) return;
  const memberships = (appState.memberships || []).filter((membership) => membership.companyId === appState.activeCompany && membership.moduleId === 'CSR' && membership.active !== false);
  rows.innerHTML = memberships.map((membership) => {
    const user = appState.users.find((item) => item.id === membership.userId) || { name: 'Utilisateur inconnu', email: '' };
    const role = roleLabel(membership.role);
    const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    const permissions = membership.role === USER_ROLES.ADMIN ? 'Toutes les permissions' : membership.role === USER_ROLES.CONTROLLER ? 'Contrôle, validation, clôture et exports' : membership.role === USER_ROLES.OPERATOR ? 'Saisie des opérations' : 'Consultation et exports';
    return `<tr><td><span class="access-user-cell"><i class="avatar avatar-purple">${escapeHtml(initials)}</i><span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.email)}</small></span></span></td><td><span class="role role-${membership.role.toLowerCase()}">${escapeHtml(role)}</span></td><td>${escapeHtml(permissions)}</td><td><span class="status status-green">Actif</span></td></tr>`;
  }).join('');
  if (!memberships.length) rows.innerHTML = '<tr><td colspan="4" class="dossier-empty">Aucun accès CSR configuré pour cette société.</td></tr>';
  const current = currentMembership();
  $('#accessCompanyName').textContent = company.name;
  $('#accessCurrentRole').textContent = roleLabel(current?.role);
  $('#accessMemberCount').textContent = String(memberships.length);
  $('#accessPermissionCount').textContent = String(current ? permissionsForCurrentMembership(current).length : 0);
  const manageButton = $('#inviteMemberButton');
  if (manageButton) manageButton.disabled = !can(USER_PERMISSIONS.USERS_MANAGE);
}

function permissionsForCurrentMembership(membership) {
  const permissions = [];
  Object.values(USER_PERMISSIONS).forEach((permission) => { if (hasMembershipPermission(membership, permission)) permissions.push(permission); });
  return permissions;
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
  if (action === 'access') { openView('access'); renderAccessView(); }
  if (action === 'periods') openView('periods');
  if (action === 'thirdparties-client') { currentThirdpartyType = THIRD_PARTY_TYPES.CLIENT; openView('thirdparties'); renderThirdpartyList(); }
  if (action === 'thirdparties-supplier') { currentThirdpartyType = THIRD_PARTY_TYPES.SUPPLIER; openView('thirdparties'); renderThirdpartyList(); }
  if (action === 'accounts') openView('accounts');
  if (action === 'add-account') openAccountModal();
  if (action === 'journals-config') openView('journals-config');
  if (action === 'add-journal') openJournalModal();
  if (action === 'import-accounts') openAccountImportModal();
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

function renderToolGroup(groupId = 'rapides') {
  const group = TOOL_GROUPS[groupId] || TOOL_GROUPS.rapides;
  const label = $('#toolSelectedLabel');
  const description = $('#toolSelectedDescription');
  const count = $('#toolSelectedCount');
  const actionList = $('#toolActionList');
  if (label) label.textContent = group.label;
  if (description) description.textContent = group.description;
  if (count) count.textContent = `${group.actions.length} outil${group.actions.length > 1 ? 's' : ''}`;
  if (actionList) {
    actionList.innerHTML = group.actions.map((item) => `<button class="fichier-action tool-action" type="button" data-tool-action="${escapeHtml(item.action)}"><span class="fichier-action-icon fichier-action-${escapeHtml(item.tone)}">${escapeHtml(item.symbol)}</span><span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.description)}</small></span>${item.shortcut ? `<span class="tool-action-shortcut">${escapeHtml(item.shortcut)}</span>` : ''}<span class="parameter-action-arrow">›</span></button>`).join('');
  }
}

function safeEvaluate(expression) {
  const source = String(expression || '').replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.').trim();
  if (!source || !/^[0-9+\-*/(). ]+$/.test(source)) throw new Error('Expression non valide.');
  const tokens = source.match(/\d+(?:\.\d+)?|[()+\-*/]/g) || [];
  const values = [];
  const operators = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const apply = () => {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (operator === '/' && right === 0) throw new Error('Division par zéro.');
    values.push(operator === '+' ? left + right : operator === '-' ? left - right : operator === '*' ? left * right : left / right);
  };
  let previous = 'operator';
  tokens.forEach((token) => {
    if (/^\d/.test(token)) { values.push(Number(token)); previous = 'value'; return; }
    if (token === '(') { operators.push(token); previous = 'operator'; return; }
    if (token === ')') { while (operators.length && operators.at(-1) !== '(') apply(); if (operators.pop() !== '(') throw new Error('Parenthèses incorrectes.'); previous = 'value'; return; }
    if (token === '-' && previous === 'operator') { values.push(0); }
    while (operators.length && operators.at(-1) !== '(' && precedence[operators.at(-1)] >= precedence[token]) apply();
    operators.push(token); previous = 'operator';
  });
  while (operators.length) { if (operators.at(-1) === '(') throw new Error('Parenthèses incorrectes.'); apply(); }
  if (values.length !== 1 || !Number.isFinite(values[0])) throw new Error('Expression non valide.');
  return values[0];
}

let calculatorExpression = '';
function updateCalculator() {
  const expressionNode = $('#calculatorExpression');
  const resultNode = $('#calculatorResult');
  if (expressionNode) expressionNode.textContent = calculatorExpression || '0';
  if (!resultNode) return;
  if (!calculatorExpression) { resultNode.textContent = '0'; return; }
  try { resultNode.textContent = numberLabel(safeEvaluate(calculatorExpression)); } catch { resultNode.textContent = '…'; }
}

function calculatorKey(key) {
  if (key === 'C') calculatorExpression = '';
  else if (key === '=') {
    try { calculatorExpression = String(safeEvaluate(calculatorExpression)); } catch { showToast('Expression de calcul non valide.'); }
  } else calculatorExpression += key;
  updateCalculator();
}

function openCalculator() {
  calculatorExpression = '';
  openModal('calculatorModal');
  updateCalculator();
}

async function captureScreen() {
  if (!navigator.mediaDevices?.getDisplayMedia) { showToast('La capture d’écran dépend des autorisations du navigateur.'); return; }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    const canvas = document.createElement('canvas');
    canvas.width = settings.width || 1280;
    canvas.height = settings.height || 720;
    const context = canvas.getContext('2d');
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    await new Promise((resolve) => { video.onloadeddata = resolve; });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    track.stop();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fec-capture-ecran.png';
      link.click();
      URL.revokeObjectURL(url);
      showToast('Capture d’écran enregistrée.');
    }, 'image/png');
  } catch (error) {
    if (error?.name !== 'NotAllowedError') showToast('La capture d’écran n’a pas pu être enregistrée.');
  }
}

function handleToolAction(action) {
  if (action === 'capture') captureScreen();
  if (action === 'calculator') openCalculator();
  if (action === 'entry') { openView('entry'); showToast('Utilisez le panneau de contrôle en direct pour vérifier l’écriture.'); }
  if (action === 'shortcuts') showToast('Ctrl + Alt + S : capture · Ctrl + Alt + C : calculatrice.');
  if (action === 'placeholder') showToast('Cet outil sera paramétré dans l’étape dédiée.');
}

function renderParameterGroup(groupId = 'dossier') {
  const group = PARAMETER_GROUPS[groupId] || PARAMETER_GROUPS.dossier;
  const label = $('#parameterSelectedLabel');
  const description = $('#parameterSelectedDescription');
  const count = $('#parameterSelectedCount');
  const actionList = $('#parameterActionList');
  if (label) label.textContent = group.label;
  if (description) description.textContent = group.description;
  if (count) count.textContent = `${group.actions.length} paramètre${group.actions.length > 1 ? 's' : ''}`;
  if (actionList) {
    actionList.innerHTML = group.actions.map((item) => `<button class="fichier-action parameter-action" type="button" data-parameter-action="${escapeHtml(item.action)}"><span class="fichier-action-icon fichier-action-${escapeHtml(item.tone)}">${escapeHtml(item.symbol)}</span><span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.description)}</small></span><span class="parameter-action-arrow">›</span></button>`).join('');
  }
}

function handleParameterAction(action) {
  if (action === 'companies') openView('companies');
  if (action === 'assets') openView('assets');
  if (action === 'journal') openView('journal');
  if (action === 'reports' || action === 'editions') openView('editions');
  if (action === 'placeholder') showToast('Ce paramètre sera défini dans l’étape dédiée.');
}

function renderEditionGroup(groupId = 'journaux') {
  const group = EDITION_GROUPS[groupId] || EDITION_GROUPS.journaux;
  const label = $('#editionSelectedLabel');
  const description = $('#editionSelectedDescription');
  const actionList = $('#editionActionList');
  if (label) label.textContent = group.label;
  if (description) description.textContent = group.description;
  if (actionList) {
    actionList.innerHTML = group.actions.map((item) => `<button class="edition-action ${item.control ? 'is-control' : ''}" type="button" data-edition-action="${escapeHtml(item.action)}" data-edition-title="${escapeHtml(item.label)}"><span class="edition-action-icon edition-icon-${escapeHtml(item.tone)}">${escapeHtml(item.symbol)}</span><span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.description)}</small></span>${item.control ? '<span class="edition-action-tag">Contrôle</span>' : '<span class="edition-action-tag edition-tag-ready">Disponible</span>'}<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>`).join('');
  }
}

function setEditionMode(mode) {
  $$('.edition-status-button').forEach((button) => button.classList.toggle('is-active', button.dataset.editionMode === mode));
  const label = $('#editionStatusLabel');
  const description = $('#editionStatusDescription');
  if (mode === 'control') {
    if (label) label.textContent = 'Éditions de contrôle';
    if (description) description.textContent = 'Retrouvez les brouillons, anomalies et pièces à régulariser.';
  } else {
    if (label) label.textContent = 'Éditions officielles';
    if (description) description.textContent = 'Les états officiels utilisent les écritures validées et clôturées.';
  }
  showToast(mode === 'control' ? 'Mode contrôle activé.' : 'Mode éditions officielles activé.');
}

function editionPreviewRows(action, title) {
  if (action === 'journal') {
    return appState.integratedEntries.filter((entry) => entry.companyId === appState.activeCompany).slice(0, 8).map((entry) => ({ date: displayDate(entry.date), ref: entry.reference, label: entry.label, debit: entry.debit || entry.amount || 0, credit: entry.credit || entry.amount || 0, status: statusLabel(entry.status)[0] }));
  }
  if (action === 'assets') {
    return [
      { date: '01/01/2025', ref: 'IMM-2025-001', label: 'Ordinateur portable Dell', debit: 850000, credit: 0, status: 'En service' },
      { date: '30/06/2025', ref: 'OD-0003', label: 'Dotation amortissement — juin', debit: 23667, credit: 23667, status: 'À contrôler' }
    ];
  }
  if (action === 'treasury') {
    return [
      { date: '16/06/2025', ref: 'BQ-0012', label: 'Vente — Bénin Services', debit: 240000, credit: 0, status: 'Rapproché' },
      { date: '15/06/2025', ref: 'BQ-0011', label: 'Cotonou Bureau — fournitures', debit: 0, credit: 38500, status: 'À rapprocher' }
    ];
  }
  if (action === 'sales') {
    return [{ date: '16/06/2025', ref: 'FAC-2025-018', label: 'Awa Concept — prestation', debit: 250000, credit: 250000, status: 'Validée' }];
  }
  if (action === 'purchases') {
    return [{ date: '15/06/2025', ref: 'FA-0154', label: 'Cotonou Bureau — fournitures', debit: 38500, credit: 38500, status: 'Validée' }];
  }
  return [
    { date: '30/06/2025', ref: 'À définir', label: title, debit: 0, credit: 0, status: 'Aperçu' },
    { date: '—', ref: '—', label: 'Les données seront disponibles après paramétrage', debit: 0, credit: 0, status: 'À définir' }
  ];
}

function openEditionPreview(title = 'Livre journal intégré', action = 'journal') {
  const company = appState.companies[appState.activeCompany];
  const mode = $('.edition-status-button.is-active')?.textContent?.trim() || 'Officielles';
  const period = currentPeriod();
  const rows = editionPreviewRows(action, title);
  appState.editionPreview = { title, action, mode, rows, period: period.label, companyName: company.name };
  openModal('editionPreviewModal');
  $('#editionPreviewTitle').textContent = title;
  $('#editionPreviewCompany').textContent = company.name;
  $('#editionPreviewPeriod').textContent = period.label;
  $('#editionPreviewMode').textContent = mode === 'Contrôle' ? 'Édition de contrôle' : 'Édition officielle';
  $('#editionPreviewCount').textContent = `${rows.length} ligne${rows.length > 1 ? 's' : ''}`;
  const totalDebit = rows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const totalCredit = rows.reduce((sum, row) => sum + Number(row.credit || 0), 0);
  $('#editionPreviewSummary').innerHTML = `<span><small>LIGNES AFFICHÉES</small><strong>${rows.length}</strong></span><span><small>TOTAL DÉBIT</small><strong>${numberLabel(totalDebit)} <em>FCFA</em></strong></span><span><small>TOTAL CRÉDIT</small><strong>${numberLabel(totalCredit)} <em>FCFA</em></strong></span><span><small>ÉTAT</small><strong class="preview-balanced">${totalDebit === totalCredit ? 'Équilibré' : 'À contrôler'}</strong></span>`;
  $('#editionPreviewContent').innerHTML = `<div class="preview-table-wrap"><table class="preview-table"><thead><tr><th>DATE</th><th>RÉFÉRENCE</th><th>LIBELLÉ</th><th class="align-right">DÉBIT</th><th class="align-right">CRÉDIT</th><th>ÉTAT</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.date)}</td><td><b>${escapeHtml(row.ref)}</b></td><td>${escapeHtml(row.label)}</td><td class="align-right">${row.debit ? numberLabel(row.debit) : '—'}</td><td class="align-right">${row.credit ? numberLabel(row.credit) : '—'}</td><td><span class="status status-green">${escapeHtml(row.status)}</span></td></tr>`).join('')}</tbody></table></div>`;
}

function exportEditionPreview() {
  const preview = appState.editionPreview;
  if (!preview) return;
  const reportTypeByAction = { journal: 'integrated-journal', assets: 'assets', treasury: 'cash-flow', sales: 'customer-balance', purchases: 'supplier-balance' };
  const report = exportReportDefinition(reportTypeByAction[preview.action] || preview.title);
  const rows = preview.rows.map((row) => ({ ...row, ref: row.ref || '' }));
  openExportAssistant(report.value, { rows, periodLabel: preview.period || 'Juin 2025' });
}

function handleEditionAction(action, title) {
  openEditionPreview(title, action);
}

function bindEvents() {
  if (document.body?.dataset.eventsBound === 'true') return;
  if (document.body) document.body.dataset.eventsBound = 'true';
  bindAuthForm();
  $('#passwordResetForm')?.addEventListener('submit', requestPasswordReset);
  window.addEventListener('online', refreshSyncStatus);
  window.addEventListener('offline', refreshSyncStatus);
  $('#entryForm')?.addEventListener('input', renderLivePosting);
  $('#bankFileInput')?.addEventListener('change', (event) => parseBankFile(event.target.files?.[0]));
  ['Deductions', 'Reintegrations', 'TaxRate', 'MinimumTax', 'CashableProducts', 'ExcludedImmobilized', 'ExcludedStocked', 'ExcludedTransfers', 'ExcludedReversals', 'StationFuelLiters', 'RegulatoryMinimumTax', 'ConventionRate'].forEach((field) => {
    const input = $(`#fiscal${field}`);
    input?.addEventListener('input', () => updateFiscalSetting(field === 'TaxRate' ? 'taxRate' : field.charAt(0).toLowerCase() + field.slice(1), input.value));
  });
  $('#fiscalCodeVersion')?.addEventListener('change', (event) => updateFiscalSetting('codeVersion', event.target.value));
  $('#fiscalActivityProfile')?.addEventListener('change', (event) => updateFiscalSetting('activityProfile', event.target.value));
  $('#fiscalBroadcastingFeeEnabled')?.addEventListener('change', (event) => updateFiscalSetting('broadcastingFeeEnabled', event.target.checked));
  $('#paymentForm')?.addEventListener('input', updatePaymentPreview);
  $('#paymentForm')?.addEventListener('change', (event) => {
    if (event.target.id === 'paymentParty') { paymentAllocations = {}; toggleManualPaymentParty({ focus: true }); renderPaymentDocuments(); }
    else if (event.target.classList.contains('payment-allocation-check')) {
      const id = event.target.dataset.paymentDocument;
      if (!event.target.checked) delete paymentAllocations[id];
      else paymentAllocations[id] = parseUiAmount($(`[data-payment-allocation="${id}"]`)?.value || '') || 0;
    }
    updatePaymentPreview();
  });
  ['SALE', 'PURCHASE'].forEach((type) => {
    const form = $(`#${invoiceConfig(type).formPrefix}InvoiceForm`);
    form?.addEventListener('input', (event) => {
      const field = event.target.closest('[data-invoice-line]');
      if (field) {
        const index = Number(field.dataset.invoiceLine);
        const key = field.dataset.invoiceField;
        if (invoiceDraftLines[type][index]) invoiceDraftLines[type][index][key] = field.value;
        const row = field.closest('.document-invoice-line');
        if (row && (key === 'quantity' || key === 'unitPrice')) row.querySelector('strong').textContent = numberLabel((Number(invoiceDraftLines[type][index]?.quantity) || 0) * (parseUiAmount(invoiceDraftLines[type][index]?.unitPrice) || 0));
      }
      renderInvoicePreview(type);
    });
    form?.addEventListener('change', (event) => {
      if (event.target.matches('select[name="customerId"], select[name="supplierId"]')) toggleManualInvoiceParty(type, { focus: true });
      renderInvoicePreview(type);
    });
  });
  $('#entryForm')?.addEventListener('change', (event) => {
    if (event.target.id === 'entryCategory') renderThirdpartyOptions();
    if (event.target.id === 'entryThirdParty') toggleManualEntryParty({ focus: true });
    renderLivePosting();
  });
  $('#multiLineRows')?.addEventListener('input', (event) => {
    const input = event.target.closest('[data-manual-line]');
    if (!input) return;
    const index = Number(input.dataset.manualLine);
    const field = input.dataset.manualField;
    if (manualLineDraft[index]) manualLineDraft[index][field] = input.value;
    updateManualLineSummary();
  });
  $('#dossierSearch')?.addEventListener('input', (event) => renderDossiers(event.target.value));
  $('#integratedSearch')?.addEventListener('input', renderIntegratedJournal);
  $('#integratedCategoryFilter')?.addEventListener('change', renderIntegratedJournal);
  $('#accountSearch')?.addEventListener('input', (event) => renderAccountPlan(event.target.value));
  $('#accountClassFilter')?.addEventListener('change', () => renderAccountPlan());
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

    const toolTab = event.target.closest('.tool-tab[data-tool-group]');
    if (toolTab) {
      $$('.tool-tab').forEach((item) => {
        const selected = item === toolTab;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      renderToolGroup(toolTab.dataset.toolGroup);
      return;
    }

    const toolAction = event.target.closest('[data-tool-action]');
    if (toolAction) { handleToolAction(toolAction.dataset.toolAction); return; }

    const calculatorButton = event.target.closest('[data-calculator-key]');
    if (calculatorButton) { calculatorKey(calculatorButton.dataset.calculatorKey); return; }

    const manualAdd = event.target.closest('[data-action="add-manual-line"]');
    if (manualAdd) { manualLineDraft.push({ accountId: '', label: '', debit: 0, credit: 0 }); renderManualLineEditor(); window.setTimeout(() => $('#multiLineRows [data-manual-line="' + (manualLineDraft.length - 1) + '"]')?.focus(), 0); return; }

    const manualRemove = event.target.closest('[data-action="remove-manual-line"]');
    if (manualRemove) { manualLineDraft.splice(Number(manualRemove.dataset.lineIndex), 1); renderManualLineEditor(); return; }

    const thirdpartyTab = event.target.closest('.thirdparty-tab[data-thirdparty-type]');
    if (thirdpartyTab) {
      currentThirdpartyType = thirdpartyTab.dataset.thirdpartyType;
      $$('.thirdparty-tab').forEach((item) => {
        const selected = item === thirdpartyTab;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      renderThirdpartyList();
      return;
    }

    const parameterTab = event.target.closest('.parameter-tab[data-parameter-group]');
    if (parameterTab) {
      $$('.parameter-tab').forEach((item) => {
        const selected = item === parameterTab;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      renderParameterGroup(parameterTab.dataset.parameterGroup);
      return;
    }

    const parameterAction = event.target.closest('[data-parameter-action]');
    if (parameterAction) { handleParameterAction(parameterAction.dataset.parameterAction); return; }

    const fiscalYearSwitch = event.target.closest('[data-fiscal-year-switch]');
    if (fiscalYearSwitch) { switchFiscalYear(fiscalYearSwitch.dataset.fiscalYearSwitch); return; }

    const periodCard = event.target.closest('[data-period-id]');
    if (periodCard) { selectPeriod(periodCard.dataset.periodId); return; }

    const closureAction = event.target.closest('[data-closure-action]');
    if (closureAction) { openView(closureAction.dataset.closureAction); return; }

    const finalizationAction = event.target.closest('[data-finalization-action]');
    if (finalizationAction) { openView(finalizationAction.dataset.finalizationAction); return; }

    const statementTab = event.target.closest('.statement-tab[data-statement-tab]');
    if (statementTab) { selectStatementTab(statementTab); return; }

    const statementMode = event.target.closest('.statement-mode[data-statement-mode]');
    if (statementMode) { setStatementMode(statementMode.dataset.statementMode); return; }

    const bankTab = event.target.closest('.bank-tab[data-bank-view]');
    if (bankTab) { setBankView(bankTab.dataset.bankView); return; }

    const paymentTab = event.target.closest('.payment-tab[data-payment-type]');
    if (paymentTab) { setPaymentType(paymentTab.dataset.paymentType); return; }

    const editionTab = event.target.closest('.edition-tab[data-edition-group]');
    if (editionTab) {
      $$('.edition-tab').forEach((item) => {
        const selected = item === editionTab;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      renderEditionGroup(editionTab.dataset.editionGroup);
      return;
    }

    const editionMode = event.target.closest('.edition-status-button[data-edition-mode]');
    if (editionMode) { setEditionMode(editionMode.dataset.editionMode); return; }

    const editionAction = event.target.closest('[data-edition-action]');
    if (editionAction) { handleEditionAction(editionAction.dataset.editionAction, editionAction.dataset.editionTitle); return; }

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
      const draft = readExportForm() || appState.exportDraft || defaultExportDraft();
      draft.format = exportFormat.dataset.exportFormat;
      draft.exportReady = false;
      appState.exportDraft = draft;
      $$('.export-format').forEach((format) => {
        const selected = format === exportFormat;
        format.classList.toggle('is-selected', selected);
        format.setAttribute('aria-pressed', String(selected));
      });
      const selectedFormat = EXPORT_FORMATS[draft.format] || EXPORT_FORMATS.txt;
      const selectedLabel = $('.export-format-selected strong');
      const selectedDescription = $('.export-format-selected span');
      if (selectedLabel) selectedLabel.textContent = selectedFormat.label;
      if (selectedDescription) selectedDescription.textContent = selectedFormat.description;
      invalidateExportReview();
      return;
    }

    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (action === 'open-view') openView(actionTarget.dataset.view);
    if (action === 'preview-statement') { renderStatements(); showToast('Aperçu de l’état actualisé.'); }
    if (action === 'export-statements') exportStatements();
    if (action === 'open-bank-import') openBankImport();
    if (action === 'close-bank-import') setBankView('reconciliation');
    if (action === 'apply-bank-import') applyBankImport();
    if (action === 'impute-bank-movement') openBankMovementInEntry(actionTarget.dataset.bankId);
    if (action === 'reconcile-bank') reconcileBankMovementById(actionTarget.dataset.bankId);
    if (action === 'reset-payment') showCentralEntryDocument('receipt');
    if (action === 'clear-payment') clearPayment();
    if (action === 'post-payment') postPayment();
    if (action === 'auto-lettering') { renderLettering(); showToast('Les lettrages complets sont proposés à partir des factures soldées.'); }
    if (action === 'reset-invoice') { showCentralEntryDocument(actionTarget.dataset.invoiceType === 'PURCHASE' ? 'purchase' : 'sale'); showToast('Nouvelle facture prête à être saisie dans Opérations.'); }
    if (action === 'open-entry-invoice') showCentralEntryDocument(actionTarget.dataset.invoiceType === 'PURCHASE' ? 'purchase' : 'sale');
    if (action === 'add-invoice-line') { const type = actionTarget.dataset.invoiceType; invoiceDraftLines[type].push({ id: `line-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }); renderInvoiceLines(type); renderInvoicePreview(type); window.setTimeout(() => $(`#${invoiceConfig(type).formPrefix}InvoiceLines [data-invoice-field="description"]:last-of-type`)?.focus(), 0); }
    if (action === 'remove-invoice-line') { const type = actionTarget.dataset.invoiceType; invoiceDraftLines[type].splice(Number(actionTarget.dataset.lineIndex), 1); renderInvoiceLines(type); renderInvoicePreview(type); }
    if (action === 'save-invoice-draft') saveInvoiceDocument(actionTarget.dataset.invoiceType, false);
    if (action === 'post-invoice') saveInvoiceDocument(actionTarget.dataset.invoiceType, true);
    if (action === 'edit-invoice-imputation') openInvoiceImputationEditor(actionTarget.dataset.invoiceType);
    if (action === 'edit-saved-invoice-imputation') openInvoiceImputationEditor(actionTarget.dataset.invoiceType, actionTarget.dataset.invoiceId);
    if (action === 'view-invoice-source') openInvoiceSource(actionTarget.dataset.invoiceType, actionTarget.dataset.invoiceId);
    if (action === 'edit-payment-imputation') openPaymentImputationEditor(actionTarget.dataset.paymentId);
    if (action === 'focus-entry-amount') { openView('entry'); window.setTimeout(() => $('#entryAmount')?.focus(), 50); }
    if (action === 'show-calculator') openCalculator();
    if (action === 'capture-screen') captureScreen();
    if (action === 'show-shortcuts') showToast('Ctrl + Alt + S : capture · Ctrl + Alt + C : calculatrice.');
    if (action === 'clear-entry') clearEntry();
    if (action === 'insert-entry') insertEntry();
    if (action === 'apply-manual-lines') applyManualLines();
    if (action === 'delete-entry') deleteRecentEntry(actionTarget.dataset.entryId);
    if (action === 'edit-entry') editRecentEntry(actionTarget.dataset.entryId);
    if (action === 'validate-entry') validateRecentEntry(actionTarget.dataset.entryId);
    if (action === 'validate-automatic-entry') validateAutomaticEntry(actionTarget.dataset.entryId);
    if (action === 'preview-automatic') openAutomaticPreview(actionTarget.dataset.automaticCategory);
    if (action === 'add-demo-subscription') addDemoSubscription();
    if (action === 'add-demo-centralization') addDemoCentralizationSources();
    if (action === 'run-automatic') runAutomaticProcess(appState.pendingAutomaticCategory);
    if (action === 'show-automatic-help') showToast('Les traitements automatiques calculent une proposition ; la validation reste contrôlée.');
    if (action === 'generate-fiscal-result') generateFiscalResult();
    if (action === 'refresh-closure') refreshClosure();
    if (action === 'close-period') closeCurrentPeriod();
    if (action === 'finalize-year') finalizeCurrentYear();
    if (action === 'prepare-final-snapshot') void prepareFinalSnapshot().catch((error) => showToast(error.message));
    if (action === 'generate-opening') generateOpeningBalances();
    if (action === 'validate-opening') validateOpeningAndOpen();
    if (action === 'sync-integrated') { synchronizeIntegratedJournal(); void synchronizeWithServer(); }
    if (action === 'export-current-edition') openEditionPreview('Livre journal intégré', 'journal');
    if (action === 'preview-current-edition') openEditionPreview($('.edition-tab.is-active')?.textContent?.trim() || 'Livre journal intégré', 'journal');
    if (action === 'export-preview') exportEditionPreview();
    if (action === 'print-preview') window.print();
    if (action === 'print-edition') openEditionPreview($('.edition-tab.is-active')?.textContent?.trim() || 'Livre journal intégré', 'journal');
    if (action === 'edition-help') showToast('Les éditions officielles et de contrôle resteront séparées.');
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
    if (action === 'forgot-password') { $('#passwordResetEmail').value = $('#authForm input[name="email"]')?.value || ''; $('#passwordResetResult')?.setAttribute('hidden', ''); openModal('passwordResetModal'); }
    if (action === 'show-company-modal') openModal('companyModal');
    if (action === 'show-account-modal') openAccountModal();
    if (action === 'edit-account') openAccountModal(actionTarget.dataset.accountId);
    if (action === 'show-thirdparty-modal') openThirdPartyModal();
    if (action === 'edit-thirdparty') openThirdPartyModal(actionTarget.dataset.thirdpartyId);
    if (action === 'export-thirdparties') exportThirdParties();
    if (action === 'toggle-inactive-thirdparties') { thirdpartyShowInactive = !thirdpartyShowInactive; actionTarget.childNodes[0].textContent = thirdpartyShowInactive ? 'Tous les tiers ' : 'Actifs uniquement '; renderThirdpartyList(); }
    if (action === 'show-journal-modal') openJournalModal();
    if (action === 'edit-journal') openJournalModal(actionTarget.dataset.journalId);
    if (action === 'export-journal-config') exportJournalConfig();
    if (action === 'export-account-plan') exportAccountPlan();
    if (action === 'show-account-import') openAccountImportModal();
    if (action === 'apply-account-import') applyAccountImport();
    if (action === 'toggle-inactive-accounts') { accountShowInactive = !accountShowInactive; actionTarget.childNodes[0].textContent = accountShowInactive ? 'Tous les comptes ' : 'Actifs uniquement '; renderAccountPlan(); }
    if (action === 'show-account-help') showToast('Un compte utilisé conserve son numéro ; son libellé évolue avec traçabilité.');
    if (action === 'show-asset-modal') openModal('assetModal');
    if (action === 'close-modal') closeModal();
    if (action === 'show-quick') toggleQuickMenu();
    if (action === 'close-quick') $('#quickMenu')?.setAttribute('hidden', '');
    if (action === 'toggle-sidebar') $('#sidebar')?.classList.toggle('is-open');
    if (action === 'show-help') showToast('Le guide vous accompagne à chaque étape.');
    if (action === 'show-notifications') showToast('3 actions attendent votre contrôle.');
    if (action === 'open-sync-modal') openSyncModal();
    if (action === 'toggle-offline-demo') toggleOfflineDemo();
    if (action === 'sync-now') void synchronizeWithServer();
    if (action === 'sync-info') showSyncTransportInfo();
    if (action === 'dismiss-notice') actionTarget.closest('.notice')?.remove();
    if (action === 'save-draft') showToast('Brouillon enregistré.');
    if (action === 'accept-suggestion') acceptSuggestion();
    if (action === 'edit-suggestion') editSuggestion();
    if (action === 'generate-depreciation') generateDepreciation();
    if (action === 'validate-import') validateImport();
    if (action === 'prepare-export') prepareExport();
    if (action === 'confirm-export') confirmExport();
    if (action === 'check-fec') prepareFecFromForm();
    if (action === 'run-fec-demo') runFecAnnualDemo();
    if (action === 'generate-fec') void generateFec().catch((error) => showToast(error.message));
    if (action === 'open-fec-correction') openFecCorrection(actionTarget.dataset.fecEntryId, actionTarget.dataset.fecLine);
    if (action === 'open-fec') openFecAssistant();
    if (action === 'download-report') openExportAssistant(actionTarget.dataset.exportReport || null);
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
  $('#accountForm')?.addEventListener('submit', saveAccount);
  $('#journalForm')?.addEventListener('submit', saveJournal);
  $('#thirdpartyForm')?.addEventListener('submit', saveThirdParty);
  $('#thirdpartySearch')?.addEventListener('input', () => renderThirdpartyList());
  $('#thirdpartyType')?.addEventListener('change', (event) => { currentThirdpartyType = event.target.value; $('#collectiveAccountId').value = THIRD_PARTY_DEFAULT_ACCOUNTS[currentThirdpartyType]; updateAuxiliaryPreview(); });
  $('#collectiveAccountId')?.addEventListener('change', updateAuxiliaryPreview);
  $('#accountImportFile')?.addEventListener('change', (event) => parseAccountImportFile(event.target.files?.[0]));
  $('#companyForm')?.addEventListener('input', updateDossierPreview);
  $('#companyForm')?.addEventListener('change', (event) => {
    if (event.target.id === 'legalForm') toggleOtherLegalForm();
    updateDossierPreview();
  });
  $('#assetForm')?.addEventListener('submit', addAsset);
  $('#fecCorrectionForm')?.addEventListener('submit', saveFecCorrection);
  $('#fecArchiveFile')?.addEventListener('change', (event) => verifyFecArchiveFile(event.target.files?.[0]));
  $('#fileInput')?.addEventListener('change', (event) => handleFile(event.target.files?.[0]));
  document.addEventListener('input', (event) => {
    if (event.target.closest('#exportForm')) invalidateExportReview();
  });
  document.addEventListener('change', (event) => {
    if (event.target.closest('#exportForm')) invalidateExportReview();
    if (event.target.closest('#fecForm')) invalidateFecPreview();
  });
  document.addEventListener('input', (event) => {
    if (event.target.closest('#fecForm')) invalidateFecPreview();
  });

  const dropZone = $('#dropZone');
  ['dragenter', 'dragover'].forEach((name) => dropZone?.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
  ['dragleave', 'drop'].forEach((name) => dropZone?.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
  dropZone?.addEventListener('drop', (event) => handleFile(event.dataTransfer.files?.[0]));

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'c') { event.preventDefault(); openCalculator(); return; }
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') { event.preventDefault(); captureScreen(); return; }
    if ($('#calculatorModal') && !$('#calculatorModal').hasAttribute('hidden') && event.key === 'Enter') { event.preventDefault(); calculatorKey('='); return; }
    if (event.key === 'Escape') { closeModal(); $('#quickMenu')?.setAttribute('hidden', ''); $('#companyMenu')?.classList.remove('is-open'); }
  });
}

function bindResetLocalData() {
  const button = $('#resetLocalData');
  if (!button || button.dataset.resetBound === 'true') return;
  button.addEventListener('click', resetLocalData);
  button.dataset.resetBound = 'true';
}

function bindCriticalNavigation() {
  const dossierOpen = document.querySelector('[data-action="dossier-open"]');
  if (dossierOpen && dossierOpen.dataset.criticalBound !== 'true') {
    dossierOpen.addEventListener('click', (event) => { event.stopPropagation(); openSelectedDossier(); });
    dossierOpen.dataset.criticalBound = 'true';
  }
  const moduleGrid = $('#moduleGrid');
  if (moduleGrid && moduleGrid.dataset.criticalBound !== 'true') {
    moduleGrid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-module-open]');
      if (!button) return;
      event.stopPropagation();
      openModule(button.dataset.moduleOpen);
    });
    moduleGrid.dataset.criticalBound = 'true';
  }
}

function bootstrapApp() {
  try {
    // Bind the global delegation before any secondary renderer. A malformed
    // legacy local state must never make the whole workspace inert.
    bindEvents();
    bindResetLocalData();
    hydrateAppState();
    centralizeEntryForms();
    persistAppState();
    loadFullSyscohadaPlan();
    renderCompanyMenu();
    setActiveCompany(appState.activeCompany, false);
    buildExportPane();
    buildFecPane();
    toggleOtherLegalForm();
    updateDossierPreview();
    renderFichierGroup('dossiers');
    renderConfigurationGroup('societe');
    renderEditionGroup('journaux');
    renderParameterGroup('dossier');
    renderToolGroup('rapides');
    renderLivePosting();
  } catch (error) {
    console.error('Échec du démarrage de FEC.', error);
    recoverFromBootstrapError();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // L’accès aux dossiers reste disponible même si une vue secondaire rencontre une donnée locale ancienne.
  bindAuthForm();
  bindResetLocalData();
  bindCriticalNavigation();
  bootstrapApp();
});
