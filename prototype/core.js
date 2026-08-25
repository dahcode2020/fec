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
  RESULTAT: Object.freeze({ label: 'Résultat de la période', shortLabel: 'Résultat' }),
  REPORTS_A_NOUVEAU: Object.freeze({ label: 'Reports à nouveau', shortLabel: 'À-nouveaux' })
});

export function classifyIntegratedEntry(entry = {}) {
  const explicit = String(entry.integrationCategory || entry.categoryId || '').toUpperCase();
  const aliases = { AMORT: 'AMORTISSEMENTS', DEPRECIATION: 'AMORTISSEMENTS', AUTOMATIC_DEPRECIATION: 'AMORTISSEMENTS', CENTRALIZATION: 'CENTRALISATION', SUBSCRIPTION: 'ABONNEMENTS', ABONNEMENT: 'ABONNEMENTS', PERIOD_RESULT: 'RESULTAT', RESULT: 'RESULTAT', RAN: 'REPORTS_A_NOUVEAU', OPENING_BALANCE: 'REPORTS_A_NOUVEAU' };
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
  Object.freeze({ id: '101', label: 'Capital social', nature: 'Ressources durables' }),
  Object.freeze({ id: '4111', label: 'Clients', nature: 'Actif / tiers' }),
  Object.freeze({ id: '4011', label: 'Fournisseurs', nature: 'Passif / tiers' }),
  Object.freeze({ id: '6011', label: 'Achats de marchandises dans la Région', nature: 'Charge' }),
  Object.freeze({ id: '6047', label: 'Fournitures de bureau', nature: 'Charge' }),
  Object.freeze({ id: '6318', label: 'Autres frais bancaires', nature: 'Charge' }),
  Object.freeze({ id: '6281', label: 'Frais de téléphone', nature: 'Charge' }),
  Object.freeze({ id: '5211', label: 'Banque locale', nature: 'Actif / trésorerie' }),
  Object.freeze({ id: '5711', label: 'Caisse en monnaie nationale', nature: 'Actif / trésorerie' }),
  Object.freeze({ id: '6813', label: 'Dotations aux amortissements des immobilisations corporelles', nature: 'Charge' }),
  Object.freeze({ id: '2844', label: 'Amortissements du matériel et mobilier', nature: 'Correctif d’actif' }),
  Object.freeze({ id: '4431', label: 'TVA facturée sur ventes', nature: 'Passif / taxe' }),
  Object.freeze({ id: '4452', label: 'TVA récupérable sur achats', nature: 'Actif / taxe' }),
  Object.freeze({ id: '441', label: 'État, impôt sur les bénéfices', nature: 'Passif / État' }),
  Object.freeze({ id: '8911', label: 'Impôts sur les bénéfices de l’exercice — activités dans l’État', nature: 'Charge fiscale' }),
  Object.freeze({ id: '895', label: 'Impôt minimum forfaitaire', nature: 'Charge fiscale' }),
  Object.freeze({ id: '7061', label: 'Services vendus dans la Région', nature: 'Produit' })
]);

export const DEFAULT_CSR_JOURNALS = Object.freeze([
  Object.freeze({ id: 'VE', label: 'Ventes', type: 'VENTES', prefix: 'VE-', nextNumber: 1, active: true, isCustom: false, systemGenerated: false }),
  Object.freeze({ id: 'AC', label: 'Achats', type: 'ACHATS', prefix: 'AC-', nextNumber: 1, active: true, isCustom: false, systemGenerated: false }),
  Object.freeze({ id: 'BQ', label: 'Banque', type: 'BANQUE', prefix: 'BQ-', nextNumber: 1, active: true, isCustom: false, systemGenerated: false }),
  Object.freeze({ id: 'CA', label: 'Caisse', type: 'CAISSE', prefix: 'CA-', nextNumber: 1, active: true, isCustom: false, systemGenerated: false }),
  Object.freeze({ id: 'OD', label: 'Opérations diverses', type: 'OPERATIONS_DIVERSES', prefix: 'OD-', nextNumber: 1, active: true, isCustom: false, systemGenerated: false }),
  Object.freeze({ id: 'AM', label: 'Amortissements automatiques', type: 'AMORTISSEMENTS', prefix: 'AM-', nextNumber: 1, active: true, isCustom: false, systemGenerated: true }),
  Object.freeze({ id: 'AB', label: 'Abonnements', type: 'ABONNEMENTS', prefix: 'AB-', nextNumber: 1, active: true, isCustom: false, systemGenerated: true }),
  Object.freeze({ id: 'CT', label: 'Centralisations', type: 'CENTRALISATIONS', prefix: 'CT-', nextNumber: 1, active: true, isCustom: false, systemGenerated: true }),
  Object.freeze({ id: 'RP', label: 'Résultat de la période', type: 'RESULTAT_PERIODE', prefix: 'RP-', nextNumber: 1, active: true, isCustom: false, systemGenerated: true }),
  Object.freeze({ id: 'AN', label: 'À-nouveaux', type: 'REPORTS_A_NOUVEAU', prefix: 'AN-', nextNumber: 1, active: true, isCustom: false, systemGenerated: true })
]);

export const SYSTEM_JOURNAL_IDS = Object.freeze(['AM', 'AB', 'CT', 'RP', 'AN']);
export const SYSTEM_JOURNAL_BY_CATEGORY = Object.freeze({
  AMORTISSEMENTS: 'AM',
  ABONNEMENTS: 'AB',
  CENTRALISATION: 'CT',
  RESULTAT: 'RP',
  REPORTS_A_NOUVEAU: 'AN'
});

export function createCsrSetup({ companyId, regime = 'NORMAL', planVersion = 'SYSCOHADA-RÉVISÉ' } = {}) {
  if (!companyId) throw new DomainError('Le paramétrage CSR doit être rattaché à une société.', 'INVALID_CSR_SETUP');
  return { companyId, regime, planVersion, accounts: DEFAULT_CSR_ACCOUNTS.map((account) => ({ ...account, nature: account.nature || 'À définir', active: true, isCustom: false })), journals: DEFAULT_CSR_JOURNALS.map((journal) => ({ ...journal })), createdAt: new Date().toISOString() };
}

export function normalizeAccountNumber(value) {
  return String(value || '').trim().replace(/\s/g, '').toUpperCase();
}

export function accountClass(accountId) {
  return normalizeAccountNumber(accountId).slice(0, 1) || '?';
}

export function validateAccountDefinition(account, { existingAccounts = [] } = {}) {
  const id = normalizeAccountNumber(account?.id);
  const label = String(account?.label || '').trim();
  if (!/^\d{1,8}$/.test(id)) throw new DomainError('Le numéro de compte doit contenir entre 1 et 8 chiffres.', 'INVALID_ACCOUNT_NUMBER');
  if (!label) throw new DomainError('Le libellé du compte est obligatoire.', 'INVALID_ACCOUNT_LABEL');
  if (existingAccounts.some((item) => normalizeAccountNumber(item.id) === id)) throw new DomainError(`Le compte ${id} existe déjà.`, 'DUPLICATE_ACCOUNT');
  return { id, label, nature: String(account.nature || 'À définir').trim(), active: account.active !== false, isCustom: account.isCustom !== false, class: account.class || accountClass(id) };
}

export function addAccountToPlan(accounts, account) {
  const normalized = validateAccountDefinition(account, { existingAccounts: accounts });
  return [...accounts, normalized];
}

export function validateJournalDefinition(journal, { existingJournals = [] } = {}) {
  const id = String(journal?.id || '').trim().toUpperCase();
  const label = String(journal?.label || '').trim();
  const prefix = String(journal?.prefix || `${id}-`).trim();
  const nextNumber = Number(journal?.nextNumber || 1);
  if (!/^[A-Z0-9]{2,4}$/.test(id)) throw new DomainError('Le code du journal doit contenir 2 à 4 caractères alphanumériques.', 'INVALID_JOURNAL_CODE');
  if (!label) throw new DomainError('Le libellé du journal est obligatoire.', 'INVALID_JOURNAL_LABEL');
  if (!Number.isInteger(nextNumber) || nextNumber < 1) throw new DomainError('Le numéro de la prochaine pièce est invalide.', 'INVALID_JOURNAL_SEQUENCE');
  if (existingJournals.some((item) => String(item.id).toUpperCase() === id)) throw new DomainError(`Le journal ${id} existe déjà.`, 'DUPLICATE_JOURNAL');
  return { id, label, type: journal.type || 'AUTRE', prefix, nextNumber, active: journal.active !== false, isCustom: journal.isCustom !== false };
}

export function addJournalToSetup(journals, journal) {
  return [...journals, validateJournalDefinition(journal, { existingJournals: journals })];
}

export function updateJournalInSetup(journals, journalId, patch, { usedJournalIds = [] } = {}) {
  const id = String(journalId || '').trim().toUpperCase();
  const index = journals.findIndex((journal) => String(journal.id).toUpperCase() === id);
  if (index < 0) throw new DomainError(`Journal inconnu : ${id}`, 'UNKNOWN_JOURNAL');
  const current = journals[index];
  if (current.systemGenerated && patch.source !== 'SYSTEM') throw new DomainError('Ce journal est alimenté automatiquement par le système et ne peut pas être paramétré comme un journal de saisie.', 'SYSTEM_JOURNAL_LOCKED');
  const nextId = String(patch.id || current.id).trim().toUpperCase();
  if (!/^[A-Z0-9]{2,4}$/.test(nextId)) throw new DomainError('Le code du journal doit contenir 2 à 4 caractères alphanumériques.', 'INVALID_JOURNAL_CODE');
  if (nextId !== id && usedJournalIds.includes(id)) throw new DomainError('Le code d’un journal déjà utilisé ne peut pas être modifié.', 'USED_JOURNAL_CODE_LOCKED');
  if (nextId !== id && journals.some((journal, journalIndex) => journalIndex !== index && String(journal.id).toUpperCase() === nextId)) throw new DomainError(`Le journal ${nextId} existe déjà.`, 'DUPLICATE_JOURNAL');
  const updated = { ...current, ...patch, id: nextId, label: String(patch.label ?? current.label).trim(), prefix: String(patch.prefix ?? current.prefix).trim(), nextNumber: Number(patch.nextNumber ?? current.nextNumber) };
  return journals.map((journal, journalIndex) => journalIndex === index ? updated : journal);
}

export function updateAccountInPlan(accounts, accountId, patch, { usedAccountIds = [] } = {}) {
  const id = normalizeAccountNumber(accountId);
  const index = accounts.findIndex((account) => normalizeAccountNumber(account.id) === id);
  if (index < 0) throw new DomainError(`Compte inconnu : ${id}`, 'UNKNOWN_ACCOUNT');
  const current = accounts[index];
  const nextId = normalizeAccountNumber(patch.id || current.id);
  if (nextId !== id && usedAccountIds.includes(id)) throw new DomainError('Le numéro d’un compte déjà utilisé ne peut pas être modifié.', 'USED_ACCOUNT_NUMBER_LOCKED');
  if (nextId !== id && accounts.some((account, accountIndex) => accountIndex !== index && normalizeAccountNumber(account.id) === nextId)) throw new DomainError(`Le compte ${nextId} existe déjà.`, 'DUPLICATE_ACCOUNT');
  if (!/^\d{1,8}$/.test(nextId)) throw new DomainError('Le numéro de compte doit contenir entre 1 et 8 chiffres.', 'INVALID_ACCOUNT_NUMBER');
  const updated = { ...current, ...patch, id: nextId, label: String(patch.label ?? current.label).trim(), class: accountClass(nextId) };
  if (!updated.label) throw new DomainError('Le libellé du compte est obligatoire.', 'INVALID_ACCOUNT_LABEL');
  return accounts.map((account, accountIndex) => accountIndex === index ? updated : account);
}

export function importAccountPlanRows(rows, { existingAccounts = [] } = {}) {
  const imported = [];
  const errors = [];
  rows.forEach((row, index) => {
    try {
      const account = validateAccountDefinition({ id: row.id, label: row.label, nature: row.nature || 'À définir', isCustom: true }, { existingAccounts: [...existingAccounts, ...imported] });
      imported.push(account);
    } catch (error) {
      errors.push({ row: index + 1, code: error.code, message: error.message });
    }
  });
  return { valid: errors.length === 0, imported, errors, rowCount: rows.length };
}

export function exportAccountPlanTxt({ companyName = '', planVersion = 'SYSCOHADA-RÉVISÉ', accounts = [], delimiter = ';' } = {}) {
  const cell = (value) => String(value ?? '').replace(/[;\t\n]/g, ' ');
  const lines = accounts.map((account) => [account.id, account.label, account.nature || 'À définir', account.active === false ? 'Inactif' : 'Actif'].map(cell).join(delimiter));
  return [`SOCIETE${delimiter}${cell(companyName)}`, `PLAN${delimiter}${cell(planVersion)}`, '', ['COMPTE', 'LIBELLE', 'NATURE', 'ETAT'].join(delimiter), ...lines].join('\r\n') + '\r\n';
}

export const THIRD_PARTY_TYPES = Object.freeze({ CLIENT: 'CLIENT', SUPPLIER: 'SUPPLIER', PERSONNEL: 'PERSONNEL', OTHER: 'OTHER' });

export function nextAuxiliaryAccountId(accounts, collectiveAccountId) {
  const prefix = normalizeAccountNumber(collectiveAccountId);
  const children = accounts.filter((account) => normalizeAccountNumber(account.id).startsWith(prefix) && normalizeAccountNumber(account.id).length > prefix.length).map((account) => Number(normalizeAccountNumber(account.id).slice(prefix.length))).filter((number) => Number.isFinite(number));
  const next = (children.length ? Math.max(...children) : 0) + 1;
  return `${prefix}${String(next).padStart(2, '0')}`;
}

export function validateThirdParty(thirdParty, { existingThirdParties = [] } = {}) {
  const id = String(thirdParty?.id || '').trim();
  const code = String(thirdParty?.code || '').trim().toUpperCase();
  const name = String(thirdParty?.name || '').trim();
  const type = String(thirdParty?.type || '').trim().toUpperCase();
  const collectiveAccountId = normalizeAccountNumber(thirdParty?.collectiveAccountId);
  if (!id || !name || !code) throw new DomainError('Le code et le nom du tiers sont obligatoires.', 'INVALID_THIRD_PARTY');
  if (!Object.values(THIRD_PARTY_TYPES).includes(type)) throw new DomainError('Le type de tiers est invalide.', 'INVALID_THIRD_PARTY_TYPE');
  if (!/^\d{2,8}$/.test(collectiveAccountId)) throw new DomainError('Le compte collectif du tiers est invalide.', 'INVALID_COLLECTIVE_ACCOUNT');
  if (existingThirdParties.some((item) => item.code.toUpperCase() === code || item.id === id)) throw new DomainError(`Le tiers ${code} existe déjà dans cette société.`, 'DUPLICATE_THIRD_PARTY');
  return { id, code, name, type, collectiveAccountId, auxiliaryAccountId: thirdParty.auxiliaryAccountId || null, ifu: String(thirdParty.ifu || '').trim(), address: String(thirdParty.address || '').trim(), phone: String(thirdParty.phone || '').trim(), paymentTerms: String(thirdParty.paymentTerms || 'Comptant').trim(), currency: thirdParty.currency || 'XOF', active: thirdParty.active !== false, createdAt: thirdParty.createdAt || new Date().toISOString() };
}

export function addThirdPartyToDirectory(thirdParties, thirdParty, accounts = []) {
  const normalized = validateThirdParty(thirdParty, { existingThirdParties: thirdParties });
  const auxiliaryAccountId = normalized.auxiliaryAccountId || nextAuxiliaryAccountId(accounts, normalized.collectiveAccountId);
  return [...thirdParties, { ...normalized, auxiliaryAccountId }];
}

export function updateThirdPartyInDirectory(thirdParties, thirdPartyId, patch) {
  const index = thirdParties.findIndex((thirdParty) => thirdParty.id === thirdPartyId);
  if (index < 0) throw new DomainError('Tiers inconnu.', 'UNKNOWN_THIRD_PARTY');
  const current = thirdParties[index];
  const updated = { ...current, ...patch, id: current.id, code: String(patch.code ?? current.code).trim().toUpperCase(), name: String(patch.name ?? current.name).trim(), auxiliaryAccountId: current.auxiliaryAccountId, createdAt: current.createdAt };
  if (!updated.name || !updated.code) throw new DomainError('Le code et le nom du tiers sont obligatoires.', 'INVALID_THIRD_PARTY');
  if (thirdParties.some((thirdParty, thirdPartyIndex) => thirdPartyIndex !== index && thirdParty.code.toUpperCase() === updated.code)) throw new DomainError(`Le tiers ${updated.code} existe déjà dans cette société.`, 'DUPLICATE_THIRD_PARTY');
  return thirdParties.map((thirdParty, thirdPartyIndex) => thirdPartyIndex === index ? updated : thirdParty);
}

export const PAYMENT_TYPES = Object.freeze({ RECEIPT: 'RECEIPT', PAYMENT: 'PAYMENT' });

export function createPayment({ id, companyId, type, thirdPartyId, thirdPartyName, thirdPartyAccountId, date, reference, amount: paymentAmount, method = 'Virement', treasuryAccountId = '5211' } = {}) {
  const value = amount(paymentAmount);
  if (!companyId || !thirdPartyId || !thirdPartyAccountId) throw new DomainError('La société et le tiers sont obligatoires pour un règlement.', 'INVALID_PAYMENT');
  if (!Object.values(PAYMENT_TYPES).includes(type)) throw new DomainError('Type de règlement inconnu.', 'INVALID_PAYMENT_TYPE');
  if (!date || !reference || !Number.isFinite(value) || value <= 0) throw new DomainError('Date, référence et montant du règlement sont obligatoires.', 'INVALID_PAYMENT');
  if (!treasuryAccountId) throw new DomainError('Le compte de trésorerie est obligatoire.', 'INVALID_TREASURY_ACCOUNT');
  return { id: id || `payment_${Date.now()}`, companyId, type, thirdPartyId, thirdPartyName, thirdPartyAccountId, date, reference, amount: value, method, treasuryAccountId, allocations: [], allocatedAmount: 0, unallocatedAmount: value, status: 'DRAFT', createdAt: new Date().toISOString() };
}

export function applyPaymentAllocations(payment, documents = [], allocations = []) {
  if (!payment?.companyId || !payment.thirdPartyId) throw new DomainError('Règlement invalide.', 'INVALID_PAYMENT');
  const relevantType = payment.type === PAYMENT_TYPES.RECEIPT ? 'SALE' : 'PURCHASE';
  let allocatedAmount = 0;
  const updatedDocuments = documents.map((document) => {
    const requested = allocations.find((allocation) => allocation.documentId === document.id)?.amount || 0;
    if (!requested) return document;
    if (document.companyId !== payment.companyId || document.type !== relevantType || document.thirdPartyId !== payment.thirdPartyId) throw new DomainError('La facture ne correspond pas au règlement.', 'PAYMENT_SCOPE_VIOLATION');
    const outstanding = document.outstanding ?? Math.max(0, document.totalInclTax - (document.paidAmount || 0));
    const value = amount(requested);
    if (!Number.isFinite(value) || value <= 0 || value > outstanding) throw new DomainError(`Le montant affecté dépasse le solde de ${document.reference}.`, 'ALLOCATION_EXCEEDS_OUTSTANDING');
    allocatedAmount += value;
    const paidAmount = round((document.paidAmount || 0) + value);
    const nextOutstanding = round(Math.max(0, document.totalInclTax - paidAmount));
    return { ...document, paidAmount, outstanding: nextOutstanding, status: nextOutstanding === 0 ? 'PAID' : 'PARTIAL', lettered: nextOutstanding === 0 ? true : Boolean(document.lettered) };
  });
  if (allocatedAmount > payment.amount) throw new DomainError('Le total affecté dépasse le montant du règlement.', 'ALLOCATION_EXCEEDS_PAYMENT');
  const normalizedAllocations = allocations.filter((allocation) => Number(allocation.amount) > 0).map((allocation) => ({ documentId: allocation.documentId, amount: amount(allocation.amount) }));
  return { payment: { ...payment, allocations: normalizedAllocations, allocatedAmount: round(allocatedAmount), unallocatedAmount: round(payment.amount - allocatedAmount), status: allocatedAmount === payment.amount ? 'ALLOCATED' : 'PARTIAL' }, documents: updatedDocuments };
}

export function paymentToJournalLines(payment) {
  const settlementMetadata = { settlementDate: payment.date, settlementMode: payment.method, natureOperation: payment.type === PAYMENT_TYPES.RECEIPT ? 'ENCAISSEMENT' : 'PAIEMENT', pieceDate: payment.date };
  const thirdPartyMetadata = { thirdPartyId: payment.thirdPartyId, auxiliaryAccountId: payment.thirdPartyAccountId, auxiliaryLabel: payment.thirdPartyName };
  if (payment.type === PAYMENT_TYPES.RECEIPT) return [
    { accountId: payment.treasuryAccountId, label: `${payment.method} — ${payment.thirdPartyName}`, ...settlementMetadata, debit: payment.amount, credit: 0 },
    { accountId: payment.thirdPartyAccountId, label: `Règlement client — ${payment.thirdPartyName}`, ...settlementMetadata, ...thirdPartyMetadata, debit: 0, credit: payment.amount }
  ];
  return [
    { accountId: payment.thirdPartyAccountId, label: `Règlement fournisseur — ${payment.thirdPartyName}`, ...settlementMetadata, ...thirdPartyMetadata, debit: payment.amount, credit: 0 },
    { accountId: payment.treasuryAccountId, label: `${payment.method} — ${payment.thirdPartyName}`, ...settlementMetadata, debit: 0, credit: payment.amount }
  ];
}

export const BANK_MOVEMENT_STATUS = Object.freeze({ UNMATCHED: 'UNMATCHED', POINTED: 'POINTED', RECONCILED: 'RECONCILED' });

export function createBankMovement({ id, companyId, statementId = null, date, reference = '', label, debit = 0, credit = 0, currency = 'XOF' } = {}) {
  const debitAmount = amount(debit);
  const creditAmount = amount(credit);
  if (!companyId || !date || !label) throw new DomainError('Société, date et libellé sont obligatoires pour un mouvement bancaire.', 'INVALID_BANK_MOVEMENT');
  if (!Number.isFinite(debitAmount) || !Number.isFinite(creditAmount) || debitAmount < 0 || creditAmount < 0 || (debitAmount === 0 && creditAmount === 0) || (debitAmount > 0 && creditAmount > 0)) throw new DomainError('Un mouvement bancaire doit avoir un seul sens et un montant positif.', 'INVALID_BANK_MOVEMENT_AMOUNT');
  return { id: id || `bank_${Date.now()}`, companyId, statementId, date, reference, label: String(label).trim(), debit: debitAmount, credit: creditAmount, amount: debitAmount || creditAmount, currency, status: BANK_MOVEMENT_STATUS.UNMATCHED, matchedEntryId: null, importedAt: new Date().toISOString() };
}

export function reconcileBankMovement(movement, entry) {
  if (!movement || !entry || movement.companyId !== entry.companyId) throw new DomainError('Le mouvement et l’écriture ne correspondent pas à la même société.', 'BANK_RECONCILIATION_SCOPE_VIOLATION');
  const entryAmount = amount(entry.amount || entry.debit || entry.credit);
  if (!Number.isFinite(entryAmount) || Math.abs(entryAmount - movement.amount) > 0.005) throw new DomainError('Le montant du mouvement ne correspond pas à l’écriture.', 'BANK_RECONCILIATION_AMOUNT_MISMATCH');
  return { ...movement, status: BANK_MOVEMENT_STATUS.RECONCILED, matchedEntryId: entry.id, reconciledAt: new Date().toISOString() };
}

export function calculatePeriodResult(entries = [], { companyId, period = null } = {}) {
  const charges = new Map();
  const products = new Map();
  const sourceEntryIds = [];
  entries.filter((entry) => entry.companyId === companyId && !entry.technicalOnly && entry.status !== OPERATION_STATES.CANCELLED && entry.status !== OPERATION_STATES.DRAFT && (!period || String(entry.date).startsWith(period)) && Array.isArray(entry.lines)).forEach((entry) => {
    let contributes = false;
    entry.lines.forEach((line) => {
      const accountId = normalizeAccountNumber(line.accountId);
      const debit = amount(line.debit || 0);
      const credit = amount(line.credit || 0);
      if (accountId.startsWith('6') && debit > 0) { charges.set(accountId, { accountId, label: line.label, amount: (charges.get(accountId)?.amount || 0) + debit }); contributes = true; }
      if (accountId.startsWith('7') && credit > 0) { products.set(accountId, { accountId, label: line.label, amount: (products.get(accountId)?.amount || 0) + credit }); contributes = true; }
    });
    if (contributes) sourceEntryIds.push(entry.id);
  });
  const chargeLines = [...charges.values()].filter((line) => line.amount > 0).map((line) => ({ accountId: line.accountId, label: `Clôture — ${line.label}`, debit: 0, credit: line.amount }));
  const productLines = [...products.values()].filter((line) => line.amount > 0).map((line) => ({ accountId: line.accountId, label: `Clôture — ${line.label}`, debit: line.amount, credit: 0 }));
  const totalCharges = chargeLines.reduce((sum, line) => sum + line.credit, 0);
  const totalProducts = productLines.reduce((sum, line) => sum + line.debit, 0);
  const result = Math.round((totalProducts - totalCharges) * 100) / 100;
  const resultAccount = result >= 0 ? '131' : '139';
  const resultLines = totalCharges ? [{ accountId: resultAccount, label: result >= 0 ? 'Résultat net — charges de la période' : 'Résultat net — charges de la période', debit: totalCharges, credit: 0 }] : [];
  if (totalProducts) resultLines.push({ accountId: resultAccount, label: result >= 0 ? 'Résultat net — produits de la période' : 'Résultat net — produits de la période', debit: 0, credit: totalProducts });
  return { companyId, period, sourceEntryIds, sourceCount: sourceEntryIds.length, charges: totalCharges, products: totalProducts, result, resultAccount, lines: [...productLines, ...chargeLines, ...resultLines], totalDebit: [...productLines, ...chargeLines, ...resultLines].reduce((sum, line) => sum + line.debit, 0), totalCredit: [...productLines, ...chargeLines, ...resultLines].reduce((sum, line) => sum + line.credit, 0) };
}

export function buildTrialBalance(entries = [], { companyId, period = null, includeTechnical = false, statuses = [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED] } = {}) {
  const byAccount = new Map();
  entries.filter((entry) => entry.companyId === companyId && (includeTechnical || !entry.technicalOnly) && entry.status !== OPERATION_STATES.CANCELLED && statuses.includes(entry.status) && (!period || String(entry.date).startsWith(period)) && Array.isArray(entry.lines)).forEach((entry) => entry.lines.forEach((line) => {
    const accountId = normalizeAccountNumber(line.accountId);
    const current = byAccount.get(accountId) || { accountId, label: line.label || '', debit: 0, credit: 0 };
    current.debit += amount(line.debit || 0);
    current.credit += amount(line.credit || 0);
    byAccount.set(accountId, current);
  }));
  return [...byAccount.values()].map((line) => ({ ...line, debit: round(line.debit), credit: round(line.credit), balance: round(line.debit - line.credit) })).sort((left, right) => left.accountId.localeCompare(right.accountId, 'fr', { numeric: true }));
}

export function buildFinancialStatements(entries = [], { companyId, period = null, includeTechnical = false, statuses = [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED] } = {}) {
  const trialBalance = buildTrialBalance(entries, { companyId, period, includeTechnical, statuses });
  const balanceSheet = trialBalance.filter((line) => /^[1-5]/.test(line.accountId));
  const incomeStatement = trialBalance.filter((line) => /^[6-8]/.test(line.accountId));
  const charges = incomeStatement.filter((line) => line.accountId.startsWith('6') || line.accountId.startsWith('8')).reduce((sum, line) => sum + line.debit - line.credit, 0);
  const products = incomeStatement.filter((line) => line.accountId.startsWith('7') || line.accountId.startsWith('8')).reduce((sum, line) => sum + line.credit - line.debit, 0);
  return { companyId, period, trialBalance, balanceSheet, incomeStatement, totalDebit: trialBalance.reduce((sum, line) => sum + line.debit, 0), totalCredit: trialBalance.reduce((sum, line) => sum + line.credit, 0), charges: round(charges), products: round(products), resultBeforeTax: round(products - charges), generatedAt: new Date().toISOString() };
}

export function calculateFiscalResult({ accountingResult = 0, deductions = 0, reintegrations = 0, taxRate = 0, minimumTax = 0 } = {}) {
  const beforeTax = amount(accountingResult);
  const deductible = amount(deductions);
  const taxable = amount(reintegrations);
  const rate = Number(taxRate) || 0;
  const minimum = amount(minimumTax);
  if (![beforeTax, deductible, taxable, minimum].every(Number.isFinite) || deductible < 0 || taxable < 0 || minimum < 0 || rate < 0) throw new DomainError('Les paramètres fiscaux sont invalides.', 'INVALID_FISCAL_INPUT');
  const taxableResult = round(Math.max(0, beforeTax + taxable - deductible));
  const calculatedTax = round(taxableResult * rate / 100);
  const tax = round(Math.max(calculatedTax, taxableResult > 0 ? minimum : 0));
  return { accountingResult: beforeTax, deductions: deductible, reintegrations: taxable, taxableResult, taxRate: rate, calculatedTax, minimumTax: minimum, tax, netResult: round(beforeTax - tax) };
}

export const PERIOD_STATUSES = Object.freeze({ OPEN: 'OPEN', READY: 'READY', CLOSED: 'CLOSED', REOPEN_REQUESTED: 'REOPEN_REQUESTED' });

const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function createMonthlyPeriods(year, { status = PERIOD_STATUSES.OPEN } = {}) {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2200) throw new DomainError('Année d’exercice invalide.', 'INVALID_FISCAL_YEAR');
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    const nextMonth = index === 11 ? new Date(Date.UTC(numericYear + 1, 0, 0)) : new Date(Date.UTC(numericYear, index + 1, 0));
    return { id: `${numericYear}-${month}`, label: `${monthNames[index]} ${numericYear}`, start: `${numericYear}-${month}-01`, end: nextMonth.toISOString().slice(0, 10), status };
  });
}

export function evaluatePeriodClosure(checks = []) {
  const normalized = checks.map((check) => ({ ...check, blocking: check.blocking !== false, passed: Boolean(check.passed) }));
  const blocking = normalized.filter((check) => check.blocking && !check.passed);
  return { valid: blocking.length === 0, checks: normalized, blockingCount: blocking.length, passedCount: normalized.filter((check) => check.passed).length, totalCount: normalized.length };
}

export function closePeriod(period, { checks = [], userId = null } = {}) {
  if (!period?.id) throw new DomainError('Période comptable invalide.', 'INVALID_PERIOD');
  if (period.status === PERIOD_STATUSES.CLOSED) throw new DomainError('La période est déjà clôturée.', 'PERIOD_ALREADY_CLOSED');
  const evaluation = evaluatePeriodClosure(checks);
  if (!evaluation.valid) throw new DomainError('La période ne peut pas être clôturée : des contrôles bloquants restent à traiter.', 'PERIOD_CLOSURE_BLOCKED');
  return { ...period, status: PERIOD_STATUSES.CLOSED, closedAt: new Date().toISOString(), closedBy: userId, closure: evaluation };
}

export function finalizeFiscalYear(year, { periods = [], checks = [], userId = null } = {}) {
  if (!year?.id) throw new DomainError('Exercice comptable invalide.', 'INVALID_FISCAL_YEAR');
  if (year.status === 'FINALIZED') throw new DomainError('L’exercice est déjà arrêté.', 'FISCAL_YEAR_ALREADY_FINALIZED');
  if (periods.length !== 12) throw new DomainError('Les douze périodes de l’exercice doivent être créées avant l’arrêté.', 'FISCAL_YEAR_PERIODS_MISSING');
  const evaluation = evaluatePeriodClosure(checks);
  if (!evaluation.valid) throw new DomainError('L’exercice ne peut pas être arrêté : des contrôles restent à traiter.', 'FISCAL_YEAR_CLOSURE_BLOCKED');
  return { ...year, status: 'FINALIZED', finalizedAt: new Date().toISOString(), finalizedBy: userId, closure: evaluation };
}

export function requestPeriodReopen(period, { userId = null, reason = '' } = {}) {
  if (!period?.id || period.status !== PERIOD_STATUSES.CLOSED) throw new DomainError('Seule une période clôturée peut demander une réouverture.', 'PERIOD_NOT_CLOSED');
  if (!reason.trim()) throw new DomainError('Le motif de réouverture est obligatoire.', 'MISSING_REOPEN_REASON');
  return { ...period, status: PERIOD_STATUSES.REOPEN_REQUESTED, reopenRequestedAt: new Date().toISOString(), reopenRequestedBy: userId, reopenReason: reason.trim() };
}

export function calculateOpeningBalances(entries = [], { companyId, sourceYear } = {}) {
  const byAccount = new Map();
  const sourceEntryIds = [];
  let totalCharges = 0;
  let totalProducts = 0;
  entries.filter((entry) => entry.companyId === companyId && !entry.technicalOnly && entry.status !== OPERATION_STATES.CANCELLED && entry.status !== OPERATION_STATES.DRAFT && (!sourceYear || String(entry.date).startsWith(String(sourceYear))) && Array.isArray(entry.lines)).forEach((entry) => {
    let contributes = false;
    entry.lines.forEach((line) => {
      const accountId = normalizeAccountNumber(line.accountId);
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      if (accountId.startsWith('6')) totalCharges += debit;
      if (accountId.startsWith('7')) totalProducts += credit;
      if (!/^[1-5]/.test(accountId)) return;
      const current = byAccount.get(accountId) || { accountId, label: line.label, debit: 0, credit: 0 };
      current.debit += debit;
      current.credit += credit;
      byAccount.set(accountId, current);
      contributes = true;
    });
    if (contributes) sourceEntryIds.push(entry.id);
  });
  const lines = [];
  byAccount.forEach((line) => {
    const balance = Math.round((line.debit - line.credit) * 100) / 100;
    if (balance > 0) lines.push({ accountId: line.accountId, label: `À-nouveau — ${line.label}`, debit: balance, credit: 0 });
    if (balance < 0) lines.push({ accountId: line.accountId, label: `À-nouveau — ${line.label}`, debit: 0, credit: Math.abs(balance) });
  });
  const result = Math.round((totalProducts - totalCharges) * 100) / 100;
  if (result > 0) lines.push({ accountId: '131', label: 'À-nouveau — résultat bénéficiaire', debit: 0, credit: result });
  if (result < 0) lines.push({ accountId: '139', label: 'À-nouveau — résultat déficitaire', debit: Math.abs(result), credit: 0 });
  return { companyId, sourceYear, sourceEntryIds, lines, totalDebit: lines.reduce((sum, line) => sum + line.debit, 0), totalCredit: lines.reduce((sum, line) => sum + line.credit, 0) };
}

export function centralizeEntries(entries = [], { companyId, period = null, sourceJournalIds = [] } = {}) {
  const eligible = entries.filter((entry) => entry.companyId === companyId && !entry.technicalOnly && entry.status !== OPERATION_STATES.CANCELLED && entry.status !== OPERATION_STATES.DRAFT && (!period || String(entry.date).startsWith(period)) && (!sourceJournalIds.length || sourceJournalIds.includes(entry.journalId)) && Array.isArray(entry.lines) && entry.lines.length);
  const byAccount = new Map();
  eligible.forEach((entry) => entry.lines.forEach((line) => {
    const current = byAccount.get(line.accountId) || { accountId: line.accountId, label: line.label, debit: 0, credit: 0 };
    current.debit += Number(line.debit || 0);
    current.credit += Number(line.credit || 0);
    byAccount.set(line.accountId, current);
  }));
  const lines = [...byAccount.values()].flatMap((line) => {
    const debit = Math.round(line.debit * 100) / 100;
    const credit = Math.round(line.credit * 100) / 100;
    return [debit ? { ...line, debit, credit: 0 } : null, credit ? { ...line, debit: 0, credit } : null].filter(Boolean);
  });
  return { companyId, period, sourceEntryIds: eligible.map((entry) => entry.id), sourceCount: eligible.length, lines, totalDebit: lines.reduce((sum, line) => sum + line.debit, 0), totalCredit: lines.reduce((sum, line) => sum + line.credit, 0) };
}

export function calculateDocumentTotals(lines = [], taxRate = 0) {
  const normalizedTaxRate = Number(taxRate) || 0;
  const normalizedLines = lines.map((line, index) => {
    const quantity = amount(line.quantity || 0);
    const unitPrice = amount(line.unitPrice || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new DomainError(`Quantité invalide à la ligne ${index + 1}.`, 'INVALID_DOCUMENT_LINE');
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new DomainError(`Prix invalide à la ligne ${index + 1}.`, 'INVALID_DOCUMENT_LINE');
    const total = round(quantity * unitPrice);
    return { id: line.id || `line_${index + 1}`, description: String(line.description || '').trim(), quantity, unitPrice, total };
  });
  if (!normalizedLines.length || normalizedLines.some((line) => !line.description)) throw new DomainError('Chaque ligne doit avoir une désignation.', 'INVALID_DOCUMENT_LINE');
  const totalExclTax = round(normalizedLines.reduce((sum, line) => sum + line.total, 0));
  const tax = round(totalExclTax * normalizedTaxRate / 100);
  return { lines: normalizedLines, taxRate: normalizedTaxRate, totalExclTax, tax, totalInclTax: round(totalExclTax + tax) };
}

export function createInvoiceDocument({ id, companyId, type = 'SALE', thirdPartyId, thirdPartyName, thirdPartyAccountId, date, reference, lines, taxRate = 0, dueDate = null } = {}) {
  if (!companyId || !thirdPartyId || !thirdPartyAccountId) throw new DomainError('La société et le tiers sont obligatoires.', 'INVALID_DOCUMENT');
  if (!date || !reference) throw new DomainError('La date et la référence de la pièce sont obligatoires.', 'INVALID_DOCUMENT');
  if (!['SALE', 'PURCHASE'].includes(type)) throw new DomainError('Type de document inconnu.', 'INVALID_DOCUMENT_TYPE');
  const totals = calculateDocumentTotals(lines, taxRate);
  return { id: id || `document_${Date.now()}`, companyId, type, thirdPartyId, thirdPartyName, thirdPartyAccountId, date, reference, dueDate, ...totals, status: 'DRAFT', createdAt: new Date().toISOString() };
}

export function documentToJournalLines(document, { revenueAccountId = '7061', expenseAccountId = '6047', salesTaxAccountId = '4431', purchaseTaxAccountId = '4452' } = {}) {
  const thirdPartyMetadata = { thirdPartyId: document.thirdPartyId, auxiliaryAccountId: document.thirdPartyAccountId, auxiliaryLabel: document.thirdPartyName, pieceDate: document.date };
  if (document.type === 'SALE') return [
    { accountId: document.thirdPartyAccountId, label: `Client — ${document.thirdPartyName}`, ...thirdPartyMetadata, debit: document.totalInclTax, credit: 0 },
    { accountId: revenueAccountId, label: 'Ventes / services', pieceDate: document.date, debit: 0, credit: document.totalExclTax },
    ...(document.tax > 0 ? [{ accountId: salesTaxAccountId, label: `TVA collectée ${document.taxRate}%`, pieceDate: document.date, debit: 0, credit: document.tax }] : [])
  ];
  return [
    { accountId: expenseAccountId, label: 'Achats / charges', pieceDate: document.date, debit: document.totalExclTax, credit: 0 },
    ...(document.tax > 0 ? [{ accountId: purchaseTaxAccountId, label: `TVA récupérable ${document.taxRate}%`, pieceDate: document.date, debit: document.tax, credit: 0 }] : []),
    { accountId: document.thirdPartyAccountId, label: `Fournisseur — ${document.thirdPartyName}`, ...thirdPartyMetadata, debit: 0, credit: document.totalInclTax }
  ];
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

export function validateJournalEntry(entry, { companyId, periodOpen = true, accountIds = [], source = 'USER', systemJournalIds = SYSTEM_JOURNAL_IDS } = {}) {
  if (!entry?.companyId || entry.companyId !== companyId) throw new DomainError('L’écriture n’appartient pas à la société active.', 'COMPANY_SCOPE_VIOLATION');
  if (!periodOpen) throw new DomainError('La période comptable est clôturée.', 'CLOSED_PERIOD');
  if (!entry.journalId) throw new DomainError('Le journal est obligatoire.', 'MISSING_JOURNAL');
  if (systemJournalIds.includes(entry.journalId) && source !== 'SYSTEM') throw new DomainError(`Le journal ${entry.journalId} est alimenté automatiquement par le système.`, 'SYSTEM_JOURNAL_USER_POST_FORBIDDEN');
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
  const statusChangedAt = new Date().toISOString();
  return { ...operation, status: nextState, statusChangedAt, ...(nextState === OPERATION_STATES.VALIDATED ? { validatedAt: statusChangedAt } : {}) };
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

export function createJournalEntry({ companyId, journalId, date, pieceDate = date, reference = '', label, thirdPartyId = null, thirdPartyAccountId = null, settlementDate = null, settlementMode = '', natureOperation = '', currency = 'XOF', lines }, options = {}) {
  const entry = {
    id: options.id || `entry_${Date.now()}`,
    companyId,
    dossierId: options.dossierId || null,
    journalId,
    date,
    pieceDate,
    reference,
    label: label || '',
    thirdPartyId,
    thirdPartyAccountId,
    settlementDate,
    settlementMode,
    natureOperation,
    currency,
    status: OPERATION_STATES.DRAFT,
    lines: lines.map((line) => ({ ...line, debit: amount(line.debit || 0), credit: amount(line.credit || 0) }))
  };
  validateJournalEntry(entry, { companyId: options.activeCompanyId || companyId, periodOpen: options.periodOpen !== false, accountIds: options.accountIds || [], source: options.source || 'USER' });
  return entry;
}

export function createSystemJournalEntry({ companyId, journalId, date, reference = '', label, lines, integrationCategory, dossierId = null }, options = {}) {
  if (!SYSTEM_JOURNAL_IDS.includes(journalId)) throw new DomainError(`Le journal ${journalId} n’est pas un journal automatique.`, 'INVALID_SYSTEM_JOURNAL');
  const entry = createJournalEntry({ companyId, journalId, date, reference, label, lines }, { ...options, dossierId, source: 'SYSTEM', activeCompanyId: companyId });
  return { ...entry, integrationCategory };
}

export function createAutomaticJournalEntry({ companyId, integrationCategory, date, reference = '', label, lines, dossierId = null }, options = {}) {
  const journalId = SYSTEM_JOURNAL_BY_CATEGORY[integrationCategory];
  if (!journalId) throw new DomainError(`Aucun journal automatique n’est défini pour la catégorie ${integrationCategory}.`, 'UNKNOWN_AUTOMATIC_CATEGORY');
  return createSystemJournalEntry({ companyId, journalId, date, reference, label, lines, integrationCategory, dossierId }, options);
}

const defaultPostingRules = [
  {
    id: 'service-sale',
    matches: (operation) => ['service-sale', 'vente-prestation', 'prestation'].includes(operation.category),
    confidence: 0.96,
    reason: 'Catégorie « Prestation de services » · déjà utilisée dans votre société',
    build: (operation) => [
      { accountId: operation.customerAccount || '4111', label: `Client — ${operation.thirdPartyName || 'à préciser'}`, debit: operation.total, credit: 0 },
      { accountId: operation.revenueAccount || '7061', label: 'Services vendus dans la Région', debit: 0, credit: operation.total }
    ]
  },
  {
    id: 'goods-purchase',
    matches: (operation) => ['goods-purchase', 'achat-marchandises'].includes(operation.category),
    confidence: 0.91,
    reason: 'Catégorie « Achat de marchandises » · règle de société',
    build: (operation) => [
      { accountId: operation.expenseAccount || '6011', label: 'Achats de marchandises dans la Région', debit: operation.total, credit: 0 },
      { accountId: operation.supplierAccount || '4011', label: `Fournisseur — ${operation.thirdPartyName || 'à préciser'}`, debit: 0, credit: operation.total }
    ]
  },
  {
    id: 'bank-fee',
    matches: (operation) => ['bank-fee', 'frais-bancaires'].includes(operation.category),
    confidence: 0.98,
    reason: 'Libellé reconnu · modèle « Frais bancaires »',
    build: (operation) => [
      { accountId: operation.expenseAccount || '6318', label: 'Autres frais bancaires', debit: operation.total, credit: 0 },
      { accountId: operation.bankAccount || '5211', label: 'Banque locale', debit: 0, credit: operation.total }
    ]
  },
  {
    id: 'subscription',
    matches: (operation) => ['subscription', 'abonnement', 'abonnements'].includes(operation.category),
    confidence: 0.94,
    reason: 'Catégorie « Abonnement » · modèle d’écriture récurrente',
    build: (operation) => [
      { accountId: operation.expenseAccount || '6281', label: 'Frais de téléphone et abonnements', debit: operation.total, credit: 0 },
      { accountId: operation.supplierAccount || '4011', label: `Fournisseur — ${operation.thirdPartyName || 'à préciser'}`, debit: 0, credit: operation.total }
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
  return createAutomaticJournalEntry({ companyId: plan.companyId, integrationCategory: 'AMORTISSEMENTS', date: date || line.date, label: `Dotation amortissement — ${line.period}`, lines: [
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

/* FEC DGID Bénin — arrêté du 23 avril 2020 */
export const FEC_FIELD_DEFINITIONS = Object.freeze([
  Object.freeze({ order: 1, name: 'CodeJournal', description: 'Code du journal de l’écriture comptable', type: 'Alphanumérique', required: true, format: '' }),
  Object.freeze({ order: 2, name: 'LibJournal', description: 'Libellé du journal de l’écriture comptable', type: 'Alphanumérique', required: true, format: '' }),
  Object.freeze({ order: 3, name: 'NumEcriture', description: 'Numéro séquentiel continu de l’écriture comptable', type: 'Alphanumérique', required: true, format: '' }),
  Object.freeze({ order: 4, name: 'DateEcriture', description: 'Date de comptabilisation de l’écriture comptable', type: 'Date', required: true, format: 'AAAAMMJJ' }),
  Object.freeze({ order: 5, name: 'NumCompte', description: 'Numéro du compte de l’écriture comptable', type: 'Alphanumérique', required: true, format: 'Plan comptable SYSCOHADA' }),
  Object.freeze({ order: 6, name: 'LibCompte', description: 'Libellé du compte de l’écriture comptable', type: 'Alphanumérique', required: true, format: 'Nomenclature SYSCOHADA' }),
  Object.freeze({ order: 7, name: 'NumCompteAux', description: 'Numéro du compte auxiliaire de l’écriture comptable', type: 'Alphanumérique', required: false, format: '' }),
  Object.freeze({ order: 8, name: 'LibCompteAux', description: 'Libellé du compte auxiliaire de l’écriture comptable', type: 'Alphanumérique', required: false, format: '' }),
  Object.freeze({ order: 9, name: 'RefPiece', description: 'Référence de la pièce justificative de l’écriture comptable', type: 'Alphanumérique', required: true, format: '' }),
  Object.freeze({ order: 10, name: 'DatePiece', description: 'Date de la pièce justificative de l’écriture comptable', type: 'Date', required: true, format: 'AAAAMMJJ' }),
  Object.freeze({ order: 11, name: 'LibEcriture', description: 'Libellé de l’écriture comptable', type: 'Alphanumérique', required: true, format: '' }),
  Object.freeze({ order: 12, name: 'MontDebit', description: 'Montant au débit de l’écriture comptable', type: 'Numérique', required: true, format: 'Décimal, virgule, sans séparateur de milliers' }),
  Object.freeze({ order: 13, name: 'MontCredit', description: 'Montant au crédit de l’écriture comptable', type: 'Numérique', required: true, format: 'Décimal, virgule, sans séparateur de milliers' }),
  Object.freeze({ order: 14, name: 'LetEcriture', description: 'Lettrage de l’écriture comptable', type: 'Alphanumérique', required: false, format: '' }),
  Object.freeze({ order: 15, name: 'DateLetEcriture', description: 'Date de lettrage de l’écriture comptable', type: 'Date', required: false, format: 'AAAAMMJJ' }),
  Object.freeze({ order: 16, name: 'DateValid', description: 'Date de validation de l’écriture comptable', type: 'Date', required: true, format: 'AAAAMMJJ' }),
  Object.freeze({ order: 17, name: 'MontDevise', description: 'Montant en devise de l’écriture comptable', type: 'Numérique', required: false, format: 'Décimal, virgule, sans séparateur de milliers' }),
  Object.freeze({ order: 18, name: 'CodeDevise', description: 'Code de la devise du montant de l’écriture comptable', type: 'Alphanumérique', required: false, format: '' })
]);

export const FEC_SMT_FIELD_DEFINITIONS = Object.freeze([
  ...FEC_FIELD_DEFINITIONS,
  Object.freeze({ order: 19, name: 'Date Règlement', description: 'Date de règlement', type: 'Date', required: true, format: 'AAAAMMJJ' }),
  Object.freeze({ order: 20, name: 'Mode Règlement', description: 'Mode de règlement', type: 'Alphanumérique', required: true, format: '' }),
  Object.freeze({ order: 21, name: 'NatOp', description: 'Nature de l’opération', type: 'Alphanumérique', required: false, format: '' })
]);

export function fecFieldDefinitions({ regime = 'NORMAL' } = {}) {
  return regime === 'SMT' ? FEC_SMT_FIELD_DEFINITIONS : FEC_FIELD_DEFINITIONS;
}

function fecDate(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (/^\d{8}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}${match[2]}${match[3]}`;
  const parsed = new Date(`${raw.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) throw new DomainError(`Date FEC invalide : ${value}`, 'FEC_INVALID_DATE');
  return parsed.toISOString().slice(0, 10).replace(/-/g, '');
}

function fecAmount(value) {
  if (value === '' || value === null || value === undefined) return '';
  const numeric = amount(value);
  if (!Number.isFinite(numeric)) throw new DomainError(`Montant FEC invalide : ${value}`, 'FEC_INVALID_AMOUNT');
  return numeric.toFixed(2).replace('.', ',');
}

function fecText(value) {
  return String(value ?? '').replace(/[\t;\r\n]/g, ' ').trim();
}

function fecReportEntry(entry) {
  const category = String(entry?.integrationCategory || entry?.categoryId || '').toUpperCase();
  const label = String(entry?.label || '').toUpperCase();
  return category === 'REPORTS_A_NOUVEAU' || entry?.journalId === 'AN' || label.includes('REPORT') || label.includes('À-NOUVEAU') || label.includes('A-NOUVEAU');
}

function fecEntryValidationDate(entry) {
  return entry?.dateValid || entry?.validationDate || entry?.validatedAt || entry?.statusChangedAt || '';
}

function fecEntrySortValue(entry) {
  return fecEntryValidationDate(entry) || entry?.date || '9999-12-31';
}

function fecIssue(list, issue) {
  list.push({ severity: issue.severity || 'ERROR', ...issue });
}

function fecDateInScope(value, startDate, endDate) {
  if (!value) return false;
  const date = String(value).slice(0, 10);
  return (!startDate || date >= String(startDate).slice(0, 10)) && (!endDate || date <= String(endDate).slice(0, 10));
}

export function prepareFecExport({ entries = [], companyId, fiscalYear = null, startDate = null, endDate = null, regime = 'NORMAL', journals = [], accounts = [], thirdParties = [], payments = [], statuses = [OPERATION_STATES.VALIDATED, OPERATION_STATES.CLOSED], diagnostic = false } = {}) {
  const fields = fecFieldDefinitions({ regime });
  const errors = [];
  const warnings = [];
  const excludedEntries = [];
  const accountMap = new Map(accounts.map((account) => [normalizeAccountNumber(account.id), account]));
  const journalMap = new Map(journals.map((journal) => [String(journal.id), journal]));
  const thirdPartyMap = new Map(thirdParties.map((party) => [String(party.id), party]));
  const paymentMap = new Map(payments.filter((payment) => payment.journalEntryId).map((payment) => [String(payment.journalEntryId), payment]));
  const scopeStart = startDate || (fiscalYear ? `${fiscalYear}-01-01` : null);
  const scopeEnd = endDate || (fiscalYear ? `${fiscalYear}-12-31` : null);
  const eligible = entries.filter((entry) => {
    if (entry.companyId !== companyId) return false;
    if (entry.status === OPERATION_STATES.CANCELLED || !statuses.includes(entry.status)) return false;
    if (!fecDateInScope(entry.date, scopeStart, scopeEnd)) return false;
    const category = String(entry.integrationCategory || entry.categoryId || '').toUpperCase();
    if (category === 'CENTRALISATION' || category === 'CENTRALIZATION' || entry.journalId === 'CT') { excludedEntries.push({ entryId: entry.id, reason: 'CENTRALISATION' }); return false; }
    if (category === 'RESULTAT' || entry.journalId === 'RP') { excludedEntries.push({ entryId: entry.id, reason: 'SOLDE_RESULTAT' }); return false; }
    if (entry.technicalOnly) { excludedEntries.push({ entryId: entry.id, reason: 'ECRITURE_TECHNIQUE' }); return false; }
    return true;
  }).sort((left, right) => {
    const reportOrder = Number(fecReportEntry(right)) - Number(fecReportEntry(left));
    if (reportOrder) return reportOrder;
    return `${fecEntrySortValue(left)}|${left.journalId || ''}|${left.reference || ''}|${left.id || ''}`.localeCompare(`${fecEntrySortValue(right)}|${right.journalId || ''}|${right.reference || ''}|${right.id || ''}`, 'fr', { numeric: true });
  });
  const pendingCount = entries.filter((entry) => {
    if (entry.companyId !== companyId || entry.status === OPERATION_STATES.CANCELLED || statuses.includes(entry.status) || !fecDateInScope(entry.date, scopeStart, scopeEnd)) return false;
    const category = String(entry.integrationCategory || entry.categoryId || '').toUpperCase();
    return category !== 'CENTRALISATION' && category !== 'CENTRALIZATION' && entry.journalId !== 'CT' && category !== 'RESULTAT' && entry.journalId !== 'RP' && !entry.technicalOnly;
  }).length;
  const records = [];
  let totalDebit = 0;
  let totalCredit = 0;
  eligible.forEach((entry, entryIndex) => {
    const journal = journalMap.get(String(entry.journalId));
    const lines = Array.isArray(entry.lines) ? entry.lines : [];
    const validationDate = fecEntryValidationDate(entry);
    const payment = paymentMap.get(String(entry.id));
    const entryDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const entryCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    if (!lines.length) fecIssue(errors, { code: 'FEC_NO_LINES', entryId: entry.id, message: `L’écriture ${entry.reference || entry.id} ne contient aucune ligne.` });
    if (Math.abs(entryDebit - entryCredit) > 0.005) fecIssue(errors, { code: 'FEC_UNBALANCED_ENTRY', entryId: entry.id, message: `L’écriture ${entry.reference || entry.id} est déséquilibrée.` });
    if (!journal) fecIssue(errors, { code: 'FEC_UNKNOWN_JOURNAL', entryId: entry.id, message: `Journal inconnu : ${entry.journalId || 'vide'}.` });
    if (!entry.reference) fecIssue(errors, { code: 'FEC_MISSING_PIECE_REF', entryId: entry.id, message: `Référence de pièce absente pour ${entry.id}.` });
    if (!entry.date) fecIssue(errors, { code: 'FEC_MISSING_ENTRY_DATE', entryId: entry.id, message: `Date d’écriture absente pour ${entry.id}.` });
    if (!validationDate) {
      if (diagnostic && entry.date) { fecIssue(warnings, { code: 'FEC_VALID_DATE_FALLBACK', entryId: entry.id, message: `Date de validation absente : la date d’écriture sera utilisée dans le diagnostic.` }); }
      else fecIssue(errors, { code: 'FEC_MISSING_VALID_DATE', entryId: entry.id, message: `Date de validation absente pour ${entry.reference || entry.id}.` });
    }
    const entryNumber = String(entryIndex + 1);
    lines.forEach((line, lineIndex) => {
      const rawAccountId = normalizeAccountNumber(line.accountId);
      const thirdParty = (line.thirdPartyId && thirdPartyMap.get(String(line.thirdPartyId))) || thirdParties.find((party) => normalizeAccountNumber(party.auxiliaryAccountId) === rawAccountId || party.code === line.thirdPartyCode);
      const auxiliaryAccountId = line.auxiliaryAccountId || line.accountAuxiliaryId || thirdParty?.auxiliaryAccountId || '';
      const isAuxiliaryPosting = Boolean(thirdParty && (rawAccountId === normalizeAccountNumber(thirdParty.auxiliaryAccountId) || normalizeAccountNumber(auxiliaryAccountId) === rawAccountId));
      const fecAccountId = isAuxiliaryPosting && thirdParty?.collectiveAccountId ? normalizeAccountNumber(thirdParty.collectiveAccountId) : rawAccountId;
      const account = accountMap.get(fecAccountId) || accountMap.get(rawAccountId);
      const auxiliaryLabel = line.auxiliaryLabel || thirdParty?.name || '';
      const accountLabel = account?.label || line.accountLabel || line.label || '';
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      const lineDate = entry.date;
      const pieceDate = entry.pieceDate || entry.datePiece || line.pieceDate || lineDate;
      const letDate = line.dateLetEcriture || line.lettrageDate || entry.dateLetEcriture || entry.lettrageDate || '';
      const settlementDate = line.settlementDate || line.dateReglement || entry.settlementDate || entry.dateReglement || payment?.date || (entry.journalId === 'BQ' ? entry.date : '');
      const settlementMode = line.settlementMode || line.modeReglement || entry.settlementMode || entry.modeReglement || payment?.method || '';
      if (!rawAccountId) fecIssue(errors, { code: 'FEC_MISSING_ACCOUNT', entryId: entry.id, line: lineIndex + 1, message: `Compte absent sur ${entry.reference || entry.id}, ligne ${lineIndex + 1}.` });
      else if (!account) fecIssue(errors, { code: 'FEC_UNKNOWN_ACCOUNT', entryId: entry.id, line: lineIndex + 1, message: `Compte ${fecAccountId} absent du plan SYSCOHADA actif.` });
      if (!/^\d{3}/.test(fecAccountId)) fecIssue(errors, { code: 'FEC_INVALID_ACCOUNT_PREFIX', entryId: entry.id, line: lineIndex + 1, message: `Les trois premiers caractères du compte ${fecAccountId || '(vide)'} doivent respecter le SYSCOHADA.` });
      if (!accountLabel) fecIssue(errors, { code: 'FEC_MISSING_ACCOUNT_LABEL', entryId: entry.id, line: lineIndex + 1, message: `Libellé de compte absent pour ${fecAccountId || '(vide)'}.` });
      if (!pieceDate) fecIssue(errors, { code: 'FEC_MISSING_PIECE_DATE', entryId: entry.id, line: lineIndex + 1, message: `Date de pièce absente pour ${entry.reference || entry.id}.` });
      if (!line.label && !entry.label) fecIssue(errors, { code: 'FEC_MISSING_ENTRY_LABEL', entryId: entry.id, line: lineIndex + 1, message: `Libellé d’écriture absent pour ${entry.reference || entry.id}.` });
      if (debit === 0 && credit === 0) fecIssue(errors, { code: 'FEC_ZERO_LINE', entryId: entry.id, line: lineIndex + 1, message: `La ligne ${lineIndex + 1} de ${entry.reference || entry.id} est sans montant.` });
      if (regime === 'SMT') {
        if (!settlementDate) fecIssue(errors, { code: 'FEC_MISSING_SETTLEMENT_DATE', entryId: entry.id, line: lineIndex + 1, message: `Date de règlement absente pour ${entry.reference || entry.id}.` });
        if (!settlementMode) fecIssue(errors, { code: 'FEC_MISSING_SETTLEMENT_MODE', entryId: entry.id, line: lineIndex + 1, message: `Mode de règlement absent pour ${entry.reference || entry.id}.` });
      }
      const values = {
        CodeJournal: fecText(entry.journalId),
        LibJournal: fecText(journal?.label || ''),
        NumEcriture: entryNumber,
        DateEcriture: fecDate(lineDate),
        NumCompte: fecAccountId,
        LibCompte: fecText(accountLabel),
        NumCompteAux: fecText(auxiliaryAccountId),
        LibCompteAux: fecText(auxiliaryLabel),
        RefPiece: fecText(entry.reference || line.pieceRef || ''),
        DatePiece: fecDate(pieceDate),
        LibEcriture: fecText(fecReportEntry(entry) ? 'REPORT' : (line.entryLabel || entry.label || line.label || '')),
        MontDebit: fecAmount(debit),
        MontCredit: fecAmount(credit),
        LetEcriture: fecText(line.letEcriture || line.lettering || entry.letEcriture || ''),
        DateLetEcriture: fecDate(letDate),
        DateValid: fecDate(validationDate || (diagnostic ? lineDate : '')),
        MontDevise: fecAmount(line.montDevise ?? line.foreignAmount ?? entry.montDevise ?? ''),
        CodeDevise: fecText(line.codeDevise || line.currency || entry.codeDevise || (entry.currency && entry.currency !== 'XOF' ? entry.currency : '')),
        'Date Règlement': fecDate(settlementDate),
        'Mode Règlement': fecText(settlementMode),
        NatOp: fecText(line.natOp || line.natureOperation || entry.natOp || entry.natureOperation || '')
      };
      records.push({ entryId: entry.id, line: lineIndex + 1, isReport: fecReportEntry(entry), values });
      totalDebit += debit;
      totalCredit += credit;
    });
  });
  return { valid: errors.length === 0, fields, records, errors, warnings, excludedEntries, pendingCount, entryCount: eligible.length, lineCount: records.length, totalDebit: round(totalDebit), totalCredit: round(totalCredit), scope: { companyId, fiscalYear, startDate: scopeStart, endDate: scopeEnd }, generatedAt: new Date().toISOString() };
}

export function exportFecTxt({ prepared, delimiter = '\t' } = {}) {
  if (!prepared?.fields) throw new DomainError('Préparation FEC absente.', 'FEC_PREPARATION_REQUIRED');
  const header = prepared.fields.map((field) => field.name).join(delimiter);
  const rows = prepared.records.map((record) => prepared.fields.map((field) => fecText(record.values[field.name])).join(delimiter));
  return [header, ...rows].join('\r\n') + '\r\n';
}

export function exportFecNoticeTxt({ prepared, delimiter = '\t', encoding = 'ISO-8859-15', recordSeparator = 'CRLF' } = {}) {
  if (!prepared?.fields) throw new DomainError('Préparation FEC absente.', 'FEC_PREPARATION_REQUIRED');
  const lines = [
    'DESCRIPTIF TECHNIQUE DU FEC',
    `STRUCTURE${delimiter}Fichier plat séquentiel`,
    `SEPARATEUR_CHAMPS${delimiter}${delimiter === '\t' ? 'TABULATION' : 'POINT-VIRGULE'}`,
    `SEPARATEUR_ENREGISTREMENTS${delimiter}${recordSeparator}`,
    `JEU_DE_CARACTERES${delimiter}${encoding}`,
    '',
    ['ORDRE', 'NOM DU CHAMP', 'DESCRIPTION', 'TYPE', 'OBLIGATOIRE', 'FORMAT'].join(delimiter),
    ...prepared.fields.map((field) => [field.order, field.name, field.description, field.type, field.required ? 'OUI' : 'NON', field.format].map(fecText).join(delimiter))
  ];
  return lines.join('\r\n') + '\r\n';
}

function asciiCharacter(value) {
  const normalized = String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized === 'œ' || normalized === 'Œ' ? (normalized === 'œ' ? 'oe' : 'OE') : normalized;
}

export function encodeFecText(text, encoding = 'ISO-8859-15') {
  const source = String(text ?? '');
  if (encoding === 'EBCDIC') {
    const punctuation = { ' ': 0x40, '\t': 0x05, '\r': 0x0d, '\n': 0x25, '-': 0x60, '/': 0x61, ',': 0x6b, '.': 0x4b, ';': 0x5e, ':': 0x7a, '_': 0x6d, '+': 0x4e, '=': 0x7e, '?': 0x6f, '!': 0x5a, '@': 0x7c, '#': 0x7b, '$': 0x5b, '%': 0x6c, '&': 0x50, '*': 0x5c, '(': 0x4d, ')': 0x5d, '<': 0x4c, '>': 0x6e, "'": 0x7d, '"': 0x7f };
    const bytes = [];
    for (const original of source) {
      const character = asciiCharacter(original);
      for (const unit of character) {
        const code = unit.charCodeAt(0);
        if (punctuation[unit] !== undefined) bytes.push(punctuation[unit]);
        else if (code >= 0x41 && code <= 0x49) bytes.push(0xc1 + code - 0x41);
        else if (code >= 0x4a && code <= 0x52) bytes.push(0xd1 + code - 0x4a);
        else if (code >= 0x53 && code <= 0x5a) bytes.push(0xe2 + code - 0x53);
        else if (code >= 0x61 && code <= 0x69) bytes.push(0x81 + code - 0x61);
        else if (code >= 0x6a && code <= 0x72) bytes.push(0x91 + code - 0x6a);
        else if (code >= 0x73 && code <= 0x7a) bytes.push(0xa2 + code - 0x73);
        else if (code >= 0x30 && code <= 0x39) bytes.push(0xf0 + code - 0x30);
        else bytes.push(0x6f);
      }
    }
    return Uint8Array.from(bytes);
  }
  const isoMap = { '€': 0xa4, 'Š': 0xa6, 'š': 0xa8, 'Ž': 0xb4, 'ž': 0xb8, 'Œ': 0xbc, 'œ': 0xbd, 'Ÿ': 0xbe };
  const bytes = [];
  for (const original of source) {
    const character = encoding === 'ASCII' ? asciiCharacter(original) : original;
    for (const unit of character) {
      if (isoMap[unit] !== undefined && encoding !== 'ASCII') bytes.push(isoMap[unit]);
      else if (unit.charCodeAt(0) <= 0x7f || (encoding !== 'ASCII' && unit.charCodeAt(0) <= 0xff)) bytes.push(unit.charCodeAt(0));
      else bytes.push(0x3f);
    }
  }
  return Uint8Array.from(bytes);
}

function fecNumericValue(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(normalized)) return NaN;
  return Number(normalized);
}

export function validateFecTxt(text, { regime = 'NORMAL', delimiter = '\t', allowProvisional = false } = {}) {
  const fields = fecFieldDefinitions({ regime });
  const errors = [];
  const warnings = [];
  const rawLines = String(text ?? '').split(/\r\n|\n|\r/);
  if (rawLines.at(-1) === '') rawLines.pop();
  if (!rawLines.length || !rawLines[0]) return { valid: false, errors: [{ code: 'FEC_EMPTY_FILE', message: 'Le fichier FEC est vide.' }], warnings, fields, entryCount: 0, lineCount: 0, totalDebit: 0, totalCredit: 0 };
  const header = rawLines.shift().split(delimiter);
  const expectedHeader = fields.map((field) => field.name);
  if (header.length !== expectedHeader.length || header.some((field, index) => field !== expectedHeader[index])) errors.push({ code: 'FEC_INVALID_HEADER', message: `L’en-tête doit contenir exactement ${expectedHeader.length} champs dans l’ordre réglementaire.` });
  const records = [];
  rawLines.forEach((rawLine, lineIndex) => {
    const sourceLine = lineIndex + 2;
    if (!rawLine) { errors.push({ code: 'FEC_EMPTY_RECORD', line: sourceLine, message: `L’enregistrement ${sourceLine} est vide.` }); return; }
    const values = rawLine.split(delimiter);
    if (values.length !== expectedHeader.length) { errors.push({ code: 'FEC_INVALID_FIELD_COUNT', line: sourceLine, message: `La ligne ${sourceLine} contient ${values.length} champs au lieu de ${expectedHeader.length}.` }); return; }
    const record = Object.fromEntries(expectedHeader.map((name, index) => [name, values[index]]));
    fields.filter((field) => field.required && !record[field.name]).forEach((field) => {
      const issue = { code: 'FEC_REQUIRED_FIELD_EMPTY', line: sourceLine, field: field.name, message: `Le champ obligatoire ${field.name} est vide à la ligne ${sourceLine}.` };
      (allowProvisional ? warnings : errors).push(issue);
    });
    ['DateEcriture', 'DatePiece', 'DateValid', 'DateLetEcriture', 'Date Règlement'].forEach((fieldName) => {
      if (record[fieldName] && !/^\d{8}$/.test(record[fieldName])) errors.push({ code: 'FEC_INVALID_DATE_FORMAT', line: sourceLine, field: fieldName, message: `${fieldName} doit être au format AAAAMMJJ.` });
    });
    ['MontDebit', 'MontCredit', 'MontDevise'].forEach((fieldName) => {
      if (record[fieldName] && !Number.isFinite(fecNumericValue(record[fieldName]))) errors.push({ code: 'FEC_INVALID_NUMERIC_FORMAT', line: sourceLine, field: fieldName, message: `${fieldName} doit être un montant décimal avec une virgule.` });
    });
    records.push({ line: sourceLine, values: record });
  });
  let expectedNumber = 1;
  let currentNumber = null;
  let currentDebit = 0;
  let currentCredit = 0;
  let currentRecords = [];
  let reportSectionEnded = false;
  const closeEntry = () => {
    if (currentNumber === null) return;
    if (Math.abs(currentDebit - currentCredit) > 0.005) errors.push({ code: 'FEC_UNBALANCED_RECORD_ENTRY', line: currentRecords[0]?.line, entryNumber: currentNumber, message: `L’écriture ${currentNumber} n’est pas équilibrée dans le fichier exporté.` });
  };
  records.forEach((record) => {
    const number = Number(record.values.NumEcriture);
    if (!Number.isInteger(number) || number < 1) errors.push({ code: 'FEC_INVALID_ENTRY_NUMBER', line: record.line, message: `NumEcriture invalide à la ligne ${record.line}.` });
    if (currentNumber === null) currentNumber = number;
    if (number !== currentNumber) {
      closeEntry();
      if (number !== expectedNumber + 1) errors.push({ code: 'FEC_SEQUENCE_BREAK', line: record.line, message: `La séquence NumEcriture passe de ${expectedNumber} à ${number}.` });
      expectedNumber = number;
      currentNumber = number;
      currentDebit = 0;
      currentCredit = 0;
      currentRecords = [];
    }
    currentRecords.push(record);
    currentDebit += Number.isFinite(fecNumericValue(record.values.MontDebit)) ? fecNumericValue(record.values.MontDebit) : 0;
    currentCredit += Number.isFinite(fecNumericValue(record.values.MontCredit)) ? fecNumericValue(record.values.MontCredit) : 0;
    const isReport = record.values.LibEcriture === 'REPORT';
    if (isReport && reportSectionEnded) errors.push({ code: 'FEC_REPORT_NOT_FIRST', line: record.line, message: 'Une écriture REPORT doit apparaître au début de la séquence.' });
    if (!isReport) reportSectionEnded = true;
  });
  closeEntry();
  const totalDebit = records.reduce((sum, record) => sum + (Number.isFinite(fecNumericValue(record.values.MontDebit)) ? fecNumericValue(record.values.MontDebit) : 0), 0);
  const totalCredit = records.reduce((sum, record) => sum + (Number.isFinite(fecNumericValue(record.values.MontCredit)) ? fecNumericValue(record.values.MontCredit) : 0), 0);
  return { valid: errors.length === 0, errors, warnings, fields, records, entryCount: new Set(records.map((record) => record.values.NumEcriture)).size, lineCount: records.length, totalDebit: round(totalDebit), totalCredit: round(totalCredit) };
}

export function exportFecControlReportTxt({ prepared, validation = null, companyName = '', ifu = '', mode = '', fileBase = '' } = {}) {
  if (!prepared?.fields) throw new DomainError('Préparation FEC absente.', 'FEC_PREPARATION_REQUIRED');
  const allErrors = [...(prepared.errors || []), ...(validation?.errors || [])];
  const allWarnings = [...(prepared.warnings || []), ...(validation?.warnings || [])];
  const lines = [
    'RAPPORT DE CONTROLE DU FEC',
    `SOCIETE\t${String(companyName).replace(/[\t\r\n]/g, ' ')}`,
    `IFU\t${String(ifu).replace(/[\t\r\n]/g, ' ')}`,
    `FICHIER\t${fileBase}`,
    `MODE\t${mode}`,
    `CHAMPS\t${prepared.fields.length}`,
    `ECRITURES\t${prepared.entryCount}`,
    `LIGNES\t${prepared.lineCount}`,
    `TOTAL_DEBIT\t${fecAmount(prepared.totalDebit)}`,
    `TOTAL_CREDIT\t${fecAmount(prepared.totalCredit)}`,
    `STATUT\t${allErrors.length ? 'BLOQUE' : 'PRET'}`,
    '',
    `ERREURS\t${allErrors.length}`,
    ...allErrors.map((issue) => `${issue.code || 'FEC_ERROR'}\t${issue.message}`),
    '',
    `AVERTISSEMENTS\t${allWarnings.length}`,
    ...allWarnings.map((issue) => `${issue.code || 'FEC_WARNING'}\t${issue.message}`),
    '',
    'Ce rapport accompagne la préparation du FEC et ne remplace pas la validation par la DGID.'
  ];
  return lines.join('\r\n') + '\r\n';
}

export function createFecAnnualDemoEntries({ companyId, fiscalYear = '2025', client = null, supplier = null } = {}) {
  if (!companyId) throw new DomainError('Le jeu annuel FEC doit être rattaché à une société.', 'FEC_DEMO_COMPANY_REQUIRED');
  const year = String(fiscalYear);
  const entries = [];
  const isoMonthDate = (month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const metadata = (date, mode = 'À terme') => ({ pieceDate: date, settlementDate: date, settlementMode: mode, natureOperation: mode === 'À terme' ? 'FACTURE' : 'REGLEMENT' });
  const addEntry = ({ id, journalId, date, reference, label, lines, integrationCategory = 'GENERAL' }) => entries.push({ id: `fec-demo-${companyId}-${id}`, companyId, journalId, date, pieceDate: date, reference, label, validatedAt: `${date}T18:00:00.000Z`, status: OPERATION_STATES.VALIDATED, integrationCategory, lines });
  const clientAccountId = client?.auxiliaryAccountId || '4111';
  const supplierAccountId = supplier?.auxiliaryAccountId || '4011';
  const clientLine = (date, mode = 'À terme') => ({ accountId: clientAccountId, thirdPartyId: client?.id, auxiliaryAccountId: client?.auxiliaryAccountId, auxiliaryLabel: client?.name, ...metadata(date, mode) });
  const supplierLine = (date, mode = 'À terme') => ({ accountId: supplierAccountId, thirdPartyId: supplier?.id, auxiliaryAccountId: supplier?.auxiliaryAccountId, auxiliaryLabel: supplier?.name, ...metadata(date, mode) });
  addEntry({ id: 'report', journalId: 'AN', date: isoMonthDate(1, 1), reference: 'AN-DEMO-0001', label: 'Report des soldes', integrationCategory: 'REPORTS_A_NOUVEAU', lines: [{ accountId: '5211', debit: 500000, credit: 0, ...metadata(isoMonthDate(1, 1), 'Report') }, { accountId: '101', debit: 0, credit: 500000, ...metadata(isoMonthDate(1, 1), 'Report') }] });
  for (let month = 1; month <= 12; month += 1) {
    const saleDate = isoMonthDate(month, 15);
    addEntry({ id: `sale-${String(month).padStart(2, '0')}`, journalId: 'VE', date: saleDate, reference: `FAC-DEMO-${String(month).padStart(2, '0')}`, label: `Vente de services — ${month}/${year}`, lines: [{ ...clientLine(saleDate), debit: 118000, credit: 0 }, { accountId: '7061', debit: 0, credit: 100000, ...metadata(saleDate) }, { accountId: '4431', debit: 0, credit: 18000, ...metadata(saleDate) }] });
    addEntry({ id: `receipt-${String(month).padStart(2, '0')}`, journalId: 'BQ', date: isoMonthDate(month, 20), reference: `REG-DEMO-${String(month).padStart(2, '0')}`, label: `Encaissement client — ${month}/${year}`, lines: [{ accountId: '5211', debit: 118000, credit: 0, ...metadata(isoMonthDate(month, 20), 'Virement') }, { ...clientLine(isoMonthDate(month, 20), 'Virement'), debit: 0, credit: 118000 }] });
    addEntry({ id: `depreciation-${String(month).padStart(2, '0')}`, journalId: 'AM', date: isoMonthDate(month, 28), reference: `AM-DEMO-${String(month).padStart(2, '0')}`, label: `Dotation aux amortissements — ${month}/${year}`, integrationCategory: 'AMORTISSEMENTS', lines: [{ accountId: '6813', debit: 23667, credit: 0, ...metadata(isoMonthDate(month, 28)) }, { accountId: '2844', debit: 0, credit: 23667, ...metadata(isoMonthDate(month, 28)) }] });
    addEntry({ id: `subscription-${String(month).padStart(2, '0')}`, journalId: 'AB', date: isoMonthDate(month, 5), reference: `AB-DEMO-${String(month).padStart(2, '0')}`, label: `Abonnement internet — ${month}/${year}`, integrationCategory: 'ABONNEMENTS', lines: [{ accountId: '6281', debit: 12000, credit: 0, ...metadata(isoMonthDate(month, 5)) }, { ...supplierLine(isoMonthDate(month, 5)), debit: 0, credit: 12000 }] });
    if (month % 2 === 0) {
      const purchaseDate = isoMonthDate(month, 10);
      addEntry({ id: `purchase-${String(month).padStart(2, '0')}`, journalId: 'AC', date: purchaseDate, reference: `FA-DEMO-${String(month).padStart(2, '0')}`, label: `Fournitures de bureau — ${month}/${year}`, lines: [{ accountId: '6047', debit: 50000, credit: 0, ...metadata(purchaseDate) }, { accountId: '4452', debit: 9000, credit: 0, ...metadata(purchaseDate) }, { ...supplierLine(purchaseDate), debit: 0, credit: 59000 }] });
    }
  }
  addEntry({ id: 'centralization', journalId: 'CT', date: isoMonthDate(12, 30), reference: 'CT-DEMO-0001', label: `Centralisation de test — ${year}`, integrationCategory: 'CENTRALISATION', lines: [{ accountId: '5211', debit: 1, credit: 0 }, { accountId: '101', debit: 0, credit: 1 }] });
  addEntry({ id: 'result', journalId: 'RP', date: isoMonthDate(12, 31), reference: 'RP-DEMO-0001', label: `Résultat de test — ${year}`, integrationCategory: 'RESULTAT', lines: [{ accountId: '7061', debit: 1, credit: 0 }, { accountId: '131', debit: 0, credit: 1 }] });
  return entries;
}

function zipCrc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipWord(value) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function zipDword(value) {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

export function createZipArchive(files = []) {
  if (!Array.isArray(files) || !files.length) throw new DomainError('Un paquet FEC doit contenir au moins un fichier.', 'FEC_ARCHIVE_EMPTY');
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  files.forEach((file) => {
    const name = String(file?.name || '').trim();
    const bytes = file?.bytes instanceof Uint8Array ? file.bytes : Uint8Array.from(file?.bytes || []);
    if (!name || name.includes('/') || name.includes('\\')) throw new DomainError(`Nom de fichier d’archive invalide : ${name}`, 'FEC_ARCHIVE_INVALID_NAME');
    const nameBytes = encoder.encode(name);
    const crc = zipCrc32(bytes);
    const localHeader = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...zipDword(crc), ...zipDword(bytes.length), ...zipDword(bytes.length), ...zipWord(nameBytes.length), 0, 0]);
    const local = Uint8Array.from([...localHeader, ...nameBytes, ...bytes]);
    localParts.push(local);
    const centralHeader = Uint8Array.from([0x50, 0x4b, 0x01, 0x02, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...zipDword(crc), ...zipDword(bytes.length), ...zipDword(bytes.length), ...zipWord(nameBytes.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...zipDword(offset)]);
    centralParts.push(Uint8Array.from([...centralHeader, ...nameBytes]));
    offset += local.length;
  });
  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Uint8Array.from([0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, ...zipWord(files.length), ...zipWord(files.length), ...zipDword(centralSize), ...zipDword(centralOffset), 0, 0]);
  const totalSize = localParts.reduce((sum, part) => sum + part.length, 0) + centralSize + end.length;
  const archive = new Uint8Array(totalSize);
  let cursor = 0;
  [...localParts, ...centralParts, end].forEach((part) => { archive.set(part, cursor); cursor += part.length; });
  return archive;
}
