import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DomainError,
  addAccountToPlan,
  addCompany,
  calculateStraightLinePlan,
  companiesFor,
  activeModules,
  assertModuleAccess,
  attachModule,
  classifyIntegratedEntry,
  createCsrSetup,
  OPERATION_STATES,
  transitionOperation,
  updateAccountInPlan,
  createDossier,
  createIntegratedJournal,
  syncIntegratedJournal,
  summarizeIntegratedJournal,
  canDeleteCorrectionCandidate,
  createCompany,
  createCorrectionWindow,
  createJournalEntry,
  createLocalWorkspaceStore,
  deleteCorrectionCandidate,
  registerCorrectionCandidate,
  createWorkspace,
  depreciationEntry,
  exportAccountPlanTxt,
  exportBalanceTxt,
  importAccountPlanRows,
  makeDossierCode,
  mapImportedRows,
  parseDelimited,
  suggestPosting,
  validateImportedBalance
} from './core.js';

test('isole les sociétés d’un même espace de travail', () => {
  let workspace = createWorkspace({ id: 'ws-1', name: 'Cabinet Cotonou' });
  workspace = addCompany(workspace, createCompany({ id: 'co-a', name: 'Acacia Conseil' }));
  workspace = addCompany(workspace, createCompany({ id: 'co-b', name: 'Noria Épicerie' }));
  assert.equal(companiesFor(workspace).length, 2);
  assert.equal(workspace.companies.find((company) => company.id === 'co-b').currency, 'XOF');
  assert.throws(() => addCompany(workspace, createCompany({ id: 'co-a', name: 'Copie' })), (error) => error.code === 'DUPLICATE_COMPANY');
});

test('génère le suffixe du dossier à partir de l’année d’exercice', () => {
  assert.equal(makeDossierCode('acacia', '2025-01-01'), 'ACACIA-25');
  assert.equal(makeDossierCode('ACACIA', '2026-04-01'), 'ACACIA-26');
  assert.equal(makeDossierCode('sigle local', '2025-01-01'), 'SIGLELOCAL-25');
});

test('associe les modules séparément à un dossier', () => {
  let dossier = createDossier({ id: 'dossier-1', companyId: 'co-a', code: 'ACACIA-25', exerciseStart: '2025-01-01', exerciseEnd: '2025-12-31' });
  assert.equal(activeModules(dossier).length, 0);
  dossier = attachModule(dossier, 'CSR');
  dossier = attachModule(dossier, 'GCSF');
  assert.deepEqual(activeModules(dossier).map((module) => module.moduleId), ['CSR', 'GCSF']);
  assert.equal(assertModuleAccess(dossier, 'CSR'), true);
  assert.throws(() => assertModuleAccess(dossier, 'GP'), (error) => error.code === 'MODULE_NOT_ACTIVE');
  assert.throws(() => attachModule(dossier, 'CSR'), (error) => error.code === 'DUPLICATE_MODULE');
});

test('prépare un paramétrage CSR avec comptes et journaux', () => {
  const setup = createCsrSetup({ companyId: 'co-a', regime: 'SMT' });
  assert.equal(setup.planVersion, 'SYSCOHADA-RÉVISÉ');
  assert.equal(setup.regime, 'SMT');
  assert.ok(setup.accounts.some((account) => account.id === '411000'));
  assert.ok(setup.journals.some((journal) => journal.id === 'VE'));
});

test('le référentiel SYSCOHADA intégré couvre les 9 classes', () => {
  const plan = JSON.parse(readFileSync(new URL('./data/syscohada-revise.json', import.meta.url), 'utf8'));
  assert.equal(plan.metadata.classCount, 9);
  assert.ok(plan.accounts.length > 1200);
  assert.ok(plan.accounts.some((account) => account.id === '4111' && account.label));
  assert.ok(plan.accounts.some((account) => account.id === '7061' && account.label));
  assert.ok(plan.accounts.some((account) => account.id === '9011' && account.label));
});

test('ajoute, modifie et importe des comptes sans doublon', () => {
  const setup = createCsrSetup({ companyId: 'co-a' });
  setup.accounts = addAccountToPlan(setup.accounts, { id: '411100', label: 'Clients secteur public', nature: 'Actif / tiers' });
  assert.equal(setup.accounts.at(-1).isCustom, true);
  setup.accounts = updateAccountInPlan(setup.accounts, '411100', { label: 'Clients administrations', nature: 'Actif / tiers' });
  assert.equal(setup.accounts.at(-1).label, 'Clients administrations');
  assert.throws(() => updateAccountInPlan(setup.accounts, '411000', { id: '411001' }, { usedAccountIds: ['411000'] }), (error) => error.code === 'USED_ACCOUNT_NUMBER_LOCKED');
  assert.throws(() => addAccountToPlan(setup.accounts, { id: '411100', label: 'Doublon' }), (error) => error.code === 'DUPLICATE_ACCOUNT');
  const imported = importAccountPlanRows([{ id: '512100', label: 'Banque locale', nature: 'Actif / trésorerie' }], { existingAccounts: setup.accounts });
  assert.equal(imported.valid, true);
  assert.match(exportAccountPlanTxt({ companyName: 'Acacia Conseil', accounts: imported.imported }), /512100/);
});

test('accepte une imputation multi-lignes équilibrée', () => {
  const entry = createJournalEntry({ companyId: 'co-a', journalId: 'VE', date: '2025-06-16', lines: [
    { accountId: '411000', debit: 250000, credit: 0 },
    { accountId: '706000', debit: 0, credit: 200000 },
    { accountId: '445700', debit: 0, credit: 50000 }
  ] });
  assert.equal(entry.lines.length, 3);
  assert.equal(entry.lines.reduce((sum, line) => sum + line.debit, 0), 250000);
  assert.equal(entry.lines.reduce((sum, line) => sum + line.credit, 0), 250000);
});

test('fait progresser une écriture sans autoriser de saut de statut', () => {
  const draft = createJournalEntry({ companyId: 'co-a', journalId: 'VE', date: '2025-06-16', lines: [
    { accountId: '411000', debit: 250000, credit: 0 },
    { accountId: '706000', debit: 0, credit: 250000 }
  ] });
  const imputed = transitionOperation(draft, OPERATION_STATES.IMPUTED);
  const review = transitionOperation(imputed, OPERATION_STATES.TO_REVIEW);
  assert.equal(review.status, 'TO_REVIEW');
  assert.throws(() => transitionOperation(draft, OPERATION_STATES.VALIDATED), (error) => error.code === 'INVALID_OPERATION_TRANSITION');
});

test('catégorise et synchronise le livre journal intégré', () => {
  assert.equal(classifyIntegratedEntry({ label: 'Dotation amortissement juin' }), 'AMORTISSEMENTS');
  assert.equal(classifyIntegratedEntry({ integrationCategory: 'centralisation', label: 'OD' }), 'CENTRALISATION');
  assert.equal(classifyIntegratedEntry({ integrationCategory: 'subscription', label: 'OD' }), 'ABONNEMENTS');
  let journal = createIntegratedJournal({ id: 'lj-1', companyId: 'co-a', fiscalYear: '2025' });
  journal = syncIntegratedJournal(journal, { id: 'entry-1', companyId: 'co-a', label: 'Abonnement internet', amount: 12000 });
  journal = syncIntegratedJournal(journal, { id: 'entry-2', companyId: 'co-a', label: 'Dotation amortissement', amount: 5000 });
  assert.equal(journal.entries.length, 2);
  assert.equal(summarizeIntegratedJournal(journal).ABONNEMENTS.count, 1);
  assert.equal(summarizeIntegratedJournal(journal).AMORTISSEMENTS.amount, 5000);
  assert.throws(() => syncIntegratedJournal(journal, { id: 'entry-3', companyId: 'co-b', label: 'Autre', amount: 1 }), (error) => error.code === 'COMPANY_SCOPE_VIOLATION');
});

test('limite la correction aux trois imputations fixes et dans l’ordre inverse', () => {
  let window = createCorrectionWindow({ id: 'window-1', dossierId: 'ACACIA-25', companyId: 'co-a' });
  const makeEntry = (id, status = 'TO_REVIEW') => ({ id, dossierId: 'ACACIA-25', companyId: 'co-a', status });
  window = registerCorrectionCandidate(window, makeEntry('entry-1'));
  window = registerCorrectionCandidate(window, makeEntry('entry-2'));
  window = registerCorrectionCandidate(window, makeEntry('entry-3'));
  assert.equal(canDeleteCorrectionCandidate(window, makeEntry('entry-3')), true);
  assert.equal(canDeleteCorrectionCandidate(window, makeEntry('entry-2')), false);
  assert.throws(() => registerCorrectionCandidate(window, makeEntry('entry-4')), (error) => error.code === 'CORRECTION_WINDOW_FULL');
  const result = deleteCorrectionCandidate(window, makeEntry('entry-3'), 'Erreur de saisie');
  window = result.window;
  assert.equal(result.entry.status, 'CANCELLED');
  assert.equal(canDeleteCorrectionCandidate(window, makeEntry('entry-2')), true);
  assert.equal(canDeleteCorrectionCandidate(window, makeEntry('entry-1')), false);
  assert.throws(() => deleteCorrectionCandidate(window, makeEntry('entry-1')), (error) => error.code === 'CORRECTION_NOT_ALLOWED');
});

test('persiste l’espace de travail localement', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
  const store = createLocalWorkspaceStore({ storage, key: 'test-workspace' });
  const workspace = addCompany(createWorkspace({ id: 'ws-2', name: 'Test' }), createCompany({ id: 'co-1', name: 'Société test' }));
  store.save(workspace);
  assert.deepEqual(store.load(), workspace);
  store.clear();
  assert.equal(store.load(), null);
});

test('refuse une écriture déséquilibrée ou hors société', () => {
  assert.throws(() => createJournalEntry({
    companyId: 'co-a', journalId: 'VE', date: '2025-06-16', lines: [
      { accountId: '411000', debit: 250000, credit: 0 },
      { accountId: '706000', debit: 0, credit: 200000 }
    ]
  }), (error) => error.code === 'UNBALANCED_ENTRY');

  assert.throws(() => createJournalEntry({
    companyId: 'co-b', journalId: 'VE', date: '2025-06-16', lines: [
      { accountId: '411000', debit: 250000, credit: 0 },
      { accountId: '706000', debit: 0, credit: 250000 }
    ]
  }, { activeCompanyId: 'co-a' }), (error) => error.code === 'COMPANY_SCOPE_VIOLATION');
});

test('propose une imputation d’abonnement équilibrée', () => {
  const suggestion = suggestPosting({ category: 'subscription', total: 12000, thirdPartyName: 'Fournisseur internet' });
  assert.equal(suggestion.status, 'SUGGESTED');
  assert.equal(suggestion.lines[0].accountId, '628000');
  assert.equal(suggestion.lines[1].accountId, '401000');
});

test('propose une imputation de vente équilibrée', () => {
  const suggestion = suggestPosting({ category: 'service-sale', total: '250 000', thirdPartyName: 'Awa Concept' });
  assert.equal(suggestion.status, 'SUGGESTED');
  assert.equal(suggestion.confidence, 0.96);
  assert.equal(suggestion.lines[0].accountId, '411000');
  assert.equal(suggestion.lines[1].accountId, '706000');
  assert.equal(suggestion.lines[0].debit, 250000);
  assert.equal(suggestion.lines[1].credit, 250000);
});

test('calcule un plan linéaire et absorbe les arrondis sur la dernière période', () => {
  const plan = calculateStraightLinePlan({
    assetId: 'asset-1', companyId: 'co-a', cost: 100000, serviceDate: '2025-01-01', usefulLifeMonths: 36, prorata: false
  });
  assert.equal(plan.lines.length, 36);
  assert.equal(plan.total, 100000);
  assert.equal(plan.lines[0].amount, 2777.78);
  assert.equal(plan.lines.at(-1).amount, 2777.7);
  const entry = depreciationEntry(plan, { date: '2025-06-30' });
  assert.equal(entry.companyId, 'co-a');
  assert.equal(entry.lines[0].debit, 2777.78);
  assert.equal(entry.lines[1].credit, 2777.78);
});

test('gère le prorata temporis sans perdre la base amortissable', () => {
  const plan = calculateStraightLinePlan({
    assetId: 'asset-2', companyId: 'co-a', cost: 120000, serviceDate: '2025-01-16', usefulLifeMonths: 12, prorata: true
  });
  assert.equal(plan.total, 120000);
  assert.ok(plan.lines[0].amount < plan.lines[1].amount);
  assert.equal(plan.lines.at(-1).status, 'TO_REVIEW');
});

test('importe une balance TXT délimitée et contrôle son équilibre', () => {
  const source = '\uFEFFCOMPTE;LIBELLE;DEBIT;CREDIT\n411000;Clients;250 000;0\n706000;Services vendus;0;250 000\n';
  const parsed = parseDelimited(source, { delimiter: ';' });
  const rows = mapImportedRows(parsed.rows, { account: 'COMPTE', label: 'LIBELLE', debit: 'DEBIT', credit: 'CREDIT', date: 'COMPTE' });
  rows.forEach((row) => { row.date = '2025-06-30'; });
  const result = validateImportedBalance(rows, { knownAccounts: ['411000', '706000'] });
  assert.equal(result.valid, true);
  assert.equal(result.debit, 250000);
  assert.equal(result.credit, 250000);
  assert.match(exportBalanceTxt({ companyName: 'Acacia Conseil', period: 'Juin 2025', rows }), /Acacia Conseil/);
});
