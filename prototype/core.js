/**
 * FEC — noyau métier local, indépendant de l’interface.
 *
 * Cette première version n’écrit pas encore dans SQLite : elle formalise les
 * invariants qui seront conservés lors du passage à Tauri/SQLite.
 */

export class DomainError extends Error {
  constructor(message, code = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const amount = (value) => {
  if (typeof value === 'number') return round(value);
  const normalized = String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s/g, '').replace(',', '.');
  if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) return NaN;
  return round(Number(normalized));
};

const dateFrom = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new DomainError(`Date invalide : ${value}`, 'INVALID_DATE');
  return date;
};

const isoDate = (date) => date.toISOString().slice(0, 10);
const isoMonth = (date) => date.toISOString().slice(0, 7);

export function exerciseYear(value) {
  const year = String(value || '').slice(0, 4);
  return /^\d{4}$/.test(year) ? year : '20YY';
}

export function makeDossierCode(code, exerciseStart) {
  const normalizedCode = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 18);
  return `${normalizedCode || 'SIGLE'}-${exerciseYear(exerciseStart).slice(-2)}`;
}

export const INTEGRATED_JOURNAL_CATEGORIES = Object.freeze({
  GENERAL: Object.freeze({ label: 'Opérations générales', shortLabel: 'Général' }),
  AMORTISSEMENTS: Object.freeze({ label: 'Amortissements automatiques', shortLabel: 'Amortissements' }),
  CENTRALISATION: Object.freeze({ label: 'Centralisations', shortLabel: 'Centralisation' }),
  ABONNEMENTS: Object.freeze({ label: 'Abonnements', shortLabel: 'Abonnements' }),
  RESULTAT: Object.freeze({ label: 'Résultat de la période', shortLabel: 'Résultat' })
});

export function classifyIntegratedEntry(entry = {}) {
  const explicit = String(entry.integrationCategory || entry.categoryId || '').toUpperCase();
  const aliases = { AMORT: 'AMORTISSEMENTS', DEPRECIATION: 'AMORTISSEMENTS', AUTOMATIC_DEPRECIATION: 'AMORTISSEMENTS', CENTRALIZATION: 'CENTRALISATION', SUBSCRIPTION: 'ABONNEMENTS', ABONNEMENT: 'ABONNEMENTS', PERIOD_RESULT: 'RESULTAT', RESULT: 'RESULTAT' };
  if (INTEGRATED_JOURNAL_CATEGORIES[explicit]) return explicit;
  if (aliases[explicit]) return aliases[explicit];
  const source = `${entry.source || ''} ${entry.label || ''}`.toLowerCase();
  if (source.includes('amort')) return 'AMORTISSEMENTS';
  if (source.includes('central')) return 'CENTRALISATION';
  if (source.includes('abonnement')) return 'ABONNEMENTS';
  if (source.includes('résultat') || source.includes('resultat')) return 'RESULTAT';
  return 'GENERAL';
}

export function createIntegratedJournal({ id, companyId, fiscalYear } = {}) {
  if (!companyId) throw new DomainError('Le livre journal doit appartenir à une société.', 'INVALID_INTEGRATED_JOURNAL');
  return { id: id || `integrated_${companyId}_${fiscalYear || 'current'}`, companyId, fiscalYear: fiscalYear || null, entries: [], updatedAt: new Date().toISOString() };
}

export function syncIntegratedJournal(journal, entry) {
  if (!journal?.companyId || entry?.companyId !== journal.companyId) throw new DomainError('L’écriture ne peut pas être synchronisée dans ce livre journal.', 'COMPANY_SCOPE_VIOLATION');
  const syncedEntry = { ...entry, integratedCategory: classifyIntegratedEntry(entry), syncedAt: new Date().toISOString() };
  const withoutEntry = journal.entries.filter((item) => item.id !== syncedEntry.id);
  return { ...journal, entries: [syncedEntry, ...withoutEntry], updatedAt: new Date().toISOString() };
}

export function summarizeIntegratedJournal(journal) {
  return Object.fromEntries(Object.keys(INTEGRATED_JOURNAL_CATEGORIES).map((categoryId) => {
    const entries = (journal?.entries || []).filter((entry) => (entry.integratedCategory || classifyIntegratedEntry(entry)) === categoryId);
    return [categoryId, { count: entries.length, amount: entries.reduce((total, entry) => total + Number(entry.amount || entry.debit || 0), 0) }];
  }));
}

export const MODULE_DEFINITIONS = Object.freeze({
  CSR: Object.freeze({ label: 'Comptabilité SYSCOHADA Révisé', shortLabel: 'Comptabilité', description: 'Journaux, écritures, imputations, amortissements et états comptables.' }),
  GP: Object.freeze({ label: 'Gestion de Paie', shortLabel: 'Paie', description: 'Collaborateurs, variables, bulletins et déclarations sociales.' }),
  GCSF: Object.freeze({ label: 'Gestion commerciale', shortLabel: 'Commerciale & stock', description: 'Ventes, achats, stocks, facturation et suivi des règlements.' }),
  GC: Object.freeze({ label: 'Gestion de Courrier', shortLabel: 'Courrier', description: 'Courriers entrants, sortants, suivi, classement et recherche.' })
});

export function createDossier({ id, companyId, code, exerciseStart, exerciseEnd, archived = false } = {}) {
  if (!companyId || !code) throw new DomainError('Un dossier doit avoir une société et un code.', 'INVALID_DOSSIER');
  if (exerciseStart && exerciseEnd && new Date(`${exerciseEnd}T00:00:00Z`) <= new Date(`${exerciseStart}T00:00:00Z`)) throw new DomainError('La fin de l’exercice doit être postérieure au début.', 'INVALID_EXERCISE');
  return { id: id || `dossier_${Date.now()}`, companyId, code, exerciseStart: exerciseStart || null, exerciseEnd: exerciseEnd || null, archived, modules: [] };
}

export function attachModule(dossier, moduleId, { id, settings = {}, permissions = [] } = {}) {
  if (!MODULE_DEFINITIONS[moduleId]) throw new DomainError(`Module inconnu : ${moduleId}`, 'UNKNOWN_MODULE');
  if (dossier.modules?.some((module) => module.moduleId === moduleId && module.status !== 'ARCHIVED')) throw new DomainError('Ce module est déjà rattaché au dossier.', 'DUPLICATE_MODULE');
  const association = { id: id || `${dossier.id}_${moduleId.toLowerCase()}`, dossierId: dossier.id, companyId: dossier.companyId, moduleId, status: 'ACTIVE', settings, permissions, createdAt: new Date().toISOString() };
  return { ...dossier, modules: [...(dossier.modules || []), association] };
}

export function activeModules(dossier) {
  return (dossier.modules || []).filter((module) => module.status === 'ACTIVE');
}

export function assertModuleAccess(dossier, moduleId) {
  if (!activeModules(dossier).some((module) => module.moduleId === moduleId)) throw new DomainError('Ce module n’est pas activé pour ce dossier.', 'MODULE_NOT_ACTIVE');
  return true;
}
const startOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const endOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
const addMonths = (date, months) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
const addDays = (date, days) => new Date(date.getTime() + days * 86400000);
const daysBetweenInclusive = (from, to) => Math.max(0, Math.floor((to - from) / 86400000) + 1);

export function createWorkspace({ id, name = 'Mon espace de travail' } = {}) {
  if (!name.trim()) throw new DomainError('Le nom de l’espace est obligatoire.', 'INVALID_WORKSPACE');
  return { id: id || `ws_${Date.now()}`, name: name.trim(), companies: [] };
}

export function createCompany({ id, name, type = '', currency = 'XOF', country = 'BJ', archived = false } = {}) {
  if (!name?.trim()) throw new DomainError('Le nom de la société est obligatoire.', 'INVALID_COMPANY');
  return {
    id: id || `co_${Date.now()}`,
    name: name.trim(),
    type: type.trim(),
    currency,
    country,
    archived,
    createdAt: new Date().toISOString()
  };
}

export function addCompany(workspace, company) {
  if (!workspace?.id || !Array.isArray(workspace.companies)) throw new DomainError('Espace de travail invalide.', 'INVALID_WORKSPACE');
  if (workspace.companies.some((item) => item.id === company.id)) throw new DomainError('Cette société existe déjà dans l’espace.', 'DUPLICATE_COMPANY');
  return { ...workspace, companies: [...workspace.companies, { ...company }] };
}

export const DEFAULT_CSR_ACCOUNTS = Object.freeze([
  Object.freeze({ id: '411000', label: 'Clients' }),
  Object.freeze({ id: '401000', label: 'Fournisseurs' }),
  Object.freeze({ id: '601000', label: 'Achats de marchandises' }),
  Object.freeze({ id: '606000', label: 'Achats de fournitures' }),
  Object.freeze({ id: '627000', label: 'Services bancaires' }),
  Object.freeze({ id: '628000', label: 'Abonnements' }),
  Object.freeze({ id: '512000', label: 'Banque' }),
  Object.freeze({ id: '571000', label: 'Caisse' }),
  Object.freeze({ id: '681000', label: 'Dotations aux amortissements' }),
  Object.freeze({ id: '284500', label: 'Amortissements du matériel' }),
  Object.freeze({ id: '706000', label: 'Services vendus' })
]);

export const DEFAULT_CSR_JOURNALS = Object.freeze([
  Object.freeze({ id: 'VE', label: 'Ventes' }),
  Object.freeze({ id: 'AC', label: 'Achats' }),
  Object.freeze({ id: 'BQ', label: 'Banque' }),
  Object.freeze({ id: 'CA', label: 'Caisse' }),
  Object.freeze({ id: 'OD', label: 'Opérations diverses' })
]);

export function createCsrSetup({ companyId, regime = 'NORMAL', planVersion = 'SYSCOHADA-RÉVISÉ' } = {}) {
  if (!companyId) throw new DomainError('Le paramétrage CSR doit être rattaché à une société.', 'INVALID_CSR_SETUP');
  return { companyId, regime, planVersion, accounts: DEFAULT_CSR_ACCOUNTS.map((account) => ({ ...account })), journals: DEFAULT_CSR_JOURNALS.map((journal) => ({ ...journal })), createdAt: new Date().toISOString() };
}

export function companiesFor(workspace, { includeArchived = false } = {}) {
  return workspace.companies.filter((company) => includeArchived || !company.archived);
}

/**
 * Adaptateur de persistance minimal pour le prototype hors ligne.
 * Il sera remplacé par SQLite dans le shell desktop sans changer le contrat.
 */
export function createLocalWorkspaceStore({ storage = globalThis.localStorage, key = 'fec.workspace.v1' } = {}) {
  return {
    load() {
      if (!storage) return null;
      try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
    },
    save(workspace) {
      if (!storage) throw new DomainError('Aucun stockage local disponible.', 'STORAGE_UNAVAILABLE');
      storage.setItem(key, JSON.stringify(workspace));
      return workspace;
    },
    clear() {
      storage?.removeItem(key);
    }
  };
}

export function assertCompanyScope(entity, companyId) {
  if (!entity || entity.companyId !== companyId) {
    throw new DomainError('Cette donnée appartient à une autre société.', 'COMPANY_SCOPE_VIOLATION');
  }
  return true;
}

export function validateJournalEntry(entry, { companyId, periodOpen = true, accountIds = [] } = {}) {
  if (!entry?.companyId || entry.companyId !== companyId) throw new DomainError('L’écriture n’appartient pas à la société active.', 'COMPANY_SCOPE_VIOLATION');
  if (!periodOpen) throw new DomainError('La période comptable est clôturée.', 'CLOSED_PERIOD');
  if (!entry.journalId) throw new DomainError('Le journal est obligatoire.', 'MISSING_JOURNAL');
  if (!entry.date) throw new DomainError('La date comptable est obligatoire.', 'MISSING_DATE');
  if (!entry.lines?.length || entry.lines.length < 2) throw new DomainError('Une écriture doit comporter au moins deux lignes.', 'MISSING_LINES');

  let debit = 0;
  let credit = 0;
  for (const line of entry.lines) {
    if (accountIds.length && !accountIds.includes(line.accountId)) throw new DomainError(`Compte inconnu : ${line.accountId}`, 'UNKNOWN_ACCOUNT');
    const lineDebit = amount(line.debit || 0);
    const lineCredit = amount(line.credit || 0);
    if (!Number.isFinite(lineDebit) || !Number.isFinite(lineCredit) || lineDebit < 0 || lineCredit < 0) throw new DomainError('Un montant de ligne est invalide.', 'INVALID_AMOUNT');
    if ((lineDebit > 0 && lineCredit > 0) || (lineDebit === 0 && lineCredit === 0)) throw new DomainError('Chaque ligne doit être soit débit, soit crédit.', 'INVALID_LINE_SIDE');
    debit += lineDebit;
    credit += lineCredit;
  }
  debit = round(debit);
  credit = round(credit);
  if (Math.abs(debit - credit) > 0.005) throw new DomainError(`Écriture déséquilibrée : débit ${debit}, crédit ${credit}.`, 'UNBALANCED_ENTRY');
  return { valid: true, debit, credit };
}

export const OPERATION_STATES = Object.freeze({ DRAFT: 'DRAFT', IMPUTED: 'IMPUTED', TO_REVIEW: 'TO_REVIEW', VALIDATED: 'VALIDATED', CLOSED: 'CLOSED', CANCELLED: 'CANCELLED' });

const allowedTransitions = Object.freeze({
  DRAFT: ['IMPUTED', 'CANCELLED'],
  IMPUTED: ['TO_REVIEW', 'CANCELLED'],
  TO_REVIEW: ['VALIDATED', 'CANCELLED'],
  VALIDATED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: []
});

export function transitionOperation(operation, nextState) {
  const current = operation?.status || OPERATION_STATES.DRAFT;
  if (!Object.values(OPERATION_STATES).includes(nextState)) throw new DomainError(`État inconnu : ${nextState}`, 'UNKNOWN_OPERATION_STATE');
  if (!allowedTransitions[current]?.includes(nextState)) throw new DomainError(`Transition impossible : ${current} → ${nextState}.`, 'INVALID_OPERATION_TRANSITION');
  return { ...operation, status: nextState, statusChangedAt: new Date().toISOString() };
}

export const CORRECTION_WINDOW_LIMIT = 3;

export function createCorrectionWindow({ id, dossierId, companyId, userId, periodId } = {}) {
  if (!dossierId || !companyId) throw new DomainError('La fenêtre de correction doit être rattachée à un dossier.', 'INVALID_CORRECTION_WINDOW');
  return { id: id || `correction_${dossierId}_${Date.now()}`, dossierId, companyId, userId: userId || null, periodId: periodId || null, status: 'OPEN', candidateIds: [], deletedIds: [], createdAt: new Date().toISOString() };
}

export function registerCorrectionCandidate(window, entry) {
  if (!window || entry?.companyId !== window.companyId || entry?.dossierId !== window.dossierId) throw new DomainError('Cette imputation ne correspond pas à la fenêtre de correction.', 'CORRECTION_SCOPE_VIOLATION');
  if (window.status !== 'OPEN') throw new DomainError('La fenêtre de correction est fermée.', 'CORRECTION_WINDOW_CLOSED');
  if (window.candidateIds.includes(entry.id)) return window;
  if (window.candidateIds.length >= CORRECTION_WINDOW_LIMIT) throw new DomainError('La limite de trois imputations récentes est atteinte.', 'CORRECTION_WINDOW_FULL');
  return { ...window, candidateIds: [...window.candidateIds, entry.id] };
}

export function canDeleteCorrectionCandidate(window, entry) {
  const lastCandidateId = [...(window?.candidateIds || [])].reverse().find((id) => !(window.deletedIds || []).includes(id));
  return Boolean(window && entry && entry.companyId === window.companyId && entry.dossierId === window.dossierId && window.status === 'OPEN' && entry.id === lastCandidateId && entry.status !== OPERATION_STATES.VALIDATED && entry.status !== OPERATION_STATES.CLOSED);
}

export function deleteCorrectionCandidate(window, entry, reason = '') {
  if (!canDeleteCorrectionCandidate(window, entry)) throw new DomainError('Cette imputation est verrouillée ou ne fait pas partie des trois imputations supprimables.', 'CORRECTION_NOT_ALLOWED');
  return {
    window: { ...window, deletedIds: [...window.deletedIds, entry.id] },
    entry: { ...entry, status: OPERATION_STATES.CANCELLED, cancellationReason: reason, cancelledAt: new Date().toISOString() }
  };
}

export function createJournalEntry({ companyId, journalId, date, reference = '', label, lines }, options = {}) {
  const entry = {
    id: options.id || `entry_${Date.now()}`,
    companyId,
    dossierId: options.dossierId || null,
    journalId,
    date,
    reference,
    label: label || '',
    status: OPERATION_STATES.DRAFT,
    lines: lines.map((line) => ({ ...line, debit: amount(line.debit || 0), credit: amount(line.credit || 0) }))
  };
  validateJournalEntry(entry, { companyId: options.activeCompanyId || companyId, periodOpen: options.periodOpen !== false, accountIds: options.accountIds || [] });
  return entry;
}

const defaultPostingRules = [
  {
    id: 'service-sale',
    matches: (operation) => ['service-sale', 'vente-prestation', 'prestation'].includes(operation.category),
    confidence: 0.96,
    reason: 'Catégorie « Prestation de services » · déjà utilisée dans votre société',
    build: (operation) => [
      { accountId: operation.customerAccount || '411000', label: `Client — ${operation.thirdPartyName || 'à préciser'}`, debit: operation.total, credit: 0 },
      { accountId: operation.revenueAccount || '706000', label: 'Services vendus', debit: 0, credit: operation.total }
    ]
  },
  {
    id: 'goods-purchase',
    matches: (operation) => ['goods-purchase', 'achat-marchandises'].includes(operation.category),
    confidence: 0.91,
    reason: 'Catégorie « Achat de marchandises » · règle de société',
    build: (operation) => [
      { accountId: operation.expenseAccount || '601000', label: 'Achats de marchandises', debit: operation.total, credit: 0 },
      { accountId: operation.supplierAccount || '401000', label: `Fournisseur — ${operation.thirdPartyName || 'à préciser'}`, debit: 0, credit: operation.total }
    ]
  },
  {
    id: 'bank-fee',
    matches: (operation) => ['bank-fee', 'frais-bancaires'].includes(operation.category),
    confidence: 0.98,
    reason: 'Libellé reconnu · modèle « Frais bancaires »',
    build: (operation) => [
      { accountId: operation.expenseAccount || '627000', label: 'Services bancaires', debit: operation.total, credit: 0 },
      { accountId: operation.bankAccount || '512000', label: 'Banque', debit: 0, credit: operation.total }
    ]
  },
  {
    id: 'subscription',
    matches: (operation) => ['subscription', 'abonnement', 'abonnements'].includes(operation.category),
    confidence: 0.94,
    reason: 'Catégorie « Abonnement » · modèle d’écriture récurrente',
    build: (operation) => [
      { accountId: operation.expenseAccount || '628000', label: 'Abonnements', debit: operation.total, credit: 0 },
      { accountId: operation.supplierAccount || '401000', label: `Fournisseur — ${operation.thirdPartyName || 'à préciser'}`, debit: 0, credit: operation.total }
    ]
  }
];

export function suggestPosting(operation, { rules = [], history = [] } = {}) {
  const total = amount(operation?.total);
  if (!Number.isFinite(total) || total <= 0) throw new DomainError('Le montant de l’opération est invalide.', 'INVALID_AMOUNT');
  const candidates = [...rules, ...defaultPostingRules];
  const rule = candidates.find((candidate) => candidate.matches(operation));
  if (!rule) return { status: 'NEEDS_REVIEW', confidence: 0, reason: 'Aucune règle suffisamment précise', lines: [] };
  const lines = rule.build({ ...operation, total });
  const suggestion = { status: 'SUGGESTED', ruleId: rule.id, confidence: rule.confidence, reason: rule.reason, lines };
  if (history.length) suggestion.historyMatches = history.filter((item) => item.category === operation.category).length;
  return suggestion;
}

export function calculateStraightLinePlan({ assetId, companyId, cost, residualValue = 0, serviceDate, usefulLifeMonths, expenseAccount = '681000', accumulatedAccount = '28XXX', prorata = true } = {}) {
  const gross = amount(cost);
  const residual = amount(residualValue);
  const start = dateFrom(serviceDate);
  const months = Number(usefulLifeMonths);
  if (!Number.isFinite(gross) || gross <= 0) throw new DomainError('La valeur brute doit être positive.', 'INVALID_ASSET_VALUE');
  if (!Number.isFinite(residual) || residual < 0 || residual > gross) throw new DomainError('La valeur résiduelle est invalide.', 'INVALID_RESIDUAL_VALUE');
  if (!Number.isInteger(months) || months <= 0) throw new DomainError('La durée doit être exprimée en mois positifs.', 'INVALID_USEFUL_LIFE');

  const base = round(gross - residual);
  const regularAmount = round(base / months);
  const plan = [];
  let accumulated = 0;
  const endExclusive = addMonths(start, months);

  for (let index = 0; index < months; index += 1) {
    const month = startOfMonth(addMonths(start, index));
    const monthEnd = endOfMonth(month);
    const coveredFrom = index === 0 ? start : month;
    const coveredTo = index === months - 1 ? addDays(endExclusive, -1) : monthEnd;
    let lineAmount = regularAmount;
    if (prorata) {
      const monthDays = daysBetweenInclusive(month, monthEnd);
      const coveredDays = daysBetweenInclusive(coveredFrom, coveredTo);
      lineAmount = round(regularAmount * Math.min(1, coveredDays / monthDays));
    }
    if (index === months - 1) lineAmount = round(base - accumulated);
    accumulated = round(accumulated + lineAmount);
    plan.push({
      assetId,
      companyId,
      period: isoMonth(month),
      date: isoDate(coveredTo),
      amount: lineAmount,
      expenseAccount,
      accumulatedAccount,
      status: 'TO_REVIEW'
    });
  }
  return { assetId, companyId, method: 'STRAIGHT_LINE', base, usefulLifeMonths: months, total: round(accumulated), lines: plan };
}

export function depreciationEntry(plan, { journalId = 'OD', date, periodOpen = true } = {}) {
  if (!plan?.lines?.length) throw new DomainError('Le plan d’amortissement est vide.', 'EMPTY_DEPRECIATION_PLAN');
  const line = plan.lines.find((item) => !date || item.period === date.slice(0, 7)) || plan.lines[0];
  return createJournalEntry({ companyId: plan.companyId, journalId, date: date || line.date, label: `Dotation amortissement — ${line.period}`, lines: [
    { accountId: line.expenseAccount, debit: line.amount, credit: 0 },
    { accountId: line.accumulatedAccount, debit: 0, credit: line.amount }
  ] }, { periodOpen });
}

function parseDelimitedLine(line, delimiter) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) { current += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === delimiter && !quoted) { cells.push(current.trim()); current = ''; continue; }
    current += character;
  }
  cells.push(current.trim());
  return cells;
}

export function parseDelimited(text, { delimiter = '\t', hasHeader = true } = {}) {
  const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== '');
  if (!lines.length) return { headers: [], rows: [] };
  const values = lines.map((line) => parseDelimitedLine(line, delimiter));
  const headers = hasHeader ? values.shift().map((header, index) => header || `colonne_${index + 1}`) : values[0].map((_, index) => `colonne_${index + 1}`);
  const rows = (hasHeader ? values : values).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
  return { headers, rows };
}

export function mapImportedRows(rows, { date, journal, reference, account, label, debit, credit } = {}) {
  return rows.map((row, index) => ({
    sourceRow: index + 2,
    date: row[date] || '',
    journalId: row[journal] || '',
    reference: row[reference] || '',
    accountId: row[account] || '',
    label: row[label] || '',
    debit: amount(row[debit] || 0),
    credit: amount(row[credit] || 0)
  }));
}

export function validateImportedBalance(rows, { knownAccounts = [], expectedCompanyId } = {}) {
  const errors = [];
  let debit = 0;
  let credit = 0;
  rows.forEach((row) => {
    if (!row.accountId) errors.push({ row: row.sourceRow, code: 'MISSING_ACCOUNT', message: 'Compte manquant' });
    if (knownAccounts.length && !knownAccounts.includes(row.accountId)) errors.push({ row: row.sourceRow, code: 'UNKNOWN_ACCOUNT', message: `Compte inconnu : ${row.accountId}` });
    if (!row.date) errors.push({ row: row.sourceRow, code: 'MISSING_DATE', message: 'Date manquante' });
    if (!Number.isFinite(row.debit) || !Number.isFinite(row.credit)) errors.push({ row: row.sourceRow, code: 'INVALID_AMOUNT', message: 'Montant invalide' });
    debit += Number.isFinite(row.debit) ? row.debit : 0;
    credit += Number.isFinite(row.credit) ? row.credit : 0;
    if (expectedCompanyId && row.companyId && row.companyId !== expectedCompanyId) errors.push({ row: row.sourceRow, code: 'COMPANY_SCOPE_VIOLATION', message: 'Société différente de la société active' });
  });
  debit = round(debit); credit = round(credit);
  if (Math.abs(debit - credit) > 0.005) errors.push({ code: 'UNBALANCED_IMPORT', message: `Import déséquilibré : débit ${debit}, crédit ${credit}` });
  return { valid: errors.length === 0, errors, debit, credit, rowCount: rows.length };
}

function textCell(value) {
  const string = String(value ?? '');
  return /[\t\n"]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
}

export function exportBalanceTxt({ companyName, period, rows = [], delimiter = '\t' } = {}) {
  const header = [`SOCIETE`, companyName || ''].map(textCell).join(delimiter);
  const periodLine = [`PERIODE`, period || ''].map(textCell).join(delimiter);
  const columns = ['COMPTE', 'LIBELLE', 'DEBIT', 'CREDIT'];
  const lines = rows.map((row) => [row.accountId, row.label, row.debit ?? 0, row.credit ?? 0].map(textCell).join(delimiter));
  return [header, periodLine, '', columns.join(delimiter), ...lines].join('\r\n') + '\r\n';
}
