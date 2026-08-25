import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DomainError,
  addAccountToPlan,
  addJournalToSetup,
  addThirdPartyToDirectory,
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
  updateJournalInSetup,
  buildFinancialStatements,
  buildTrialBalance,
  calculateDocumentTotals,
  calculateFiscalResult,
  calculateOpeningBalances,
  closePeriod,
  createMonthlyPeriods,
  evaluatePeriodClosure,
  finalizeFiscalYear,
  calculatePeriodResult,
  createDossier,
  createFecAnnualDemoEntries,
  createIntegratedJournal,
  createZipArchive,
  createInvoiceDocument,
  documentToJournalLines,
  syncIntegratedJournal,
  summarizeIntegratedJournal,
  canDeleteCorrectionCandidate,
  createAutomaticJournalEntry,
  createCompany,
  SYSTEM_JOURNAL_BY_CATEGORY,
  createCorrectionWindow,
  createJournalEntry,
  createLocalWorkspaceStore,
  deleteCorrectionCandidate,
  registerCorrectionCandidate,
  createWorkspace,
  depreciationEntry,
  exportAccountPlanTxt,
  exportBalanceTxt,
  applyPaymentAllocations,
  centralizeEntries,
  createBankMovement,
  reconcileBankMovement,
  createPayment,
  paymentToJournalLines,
  encodeFecText,
  exportFecControlReportTxt,
  exportFecNoticeTxt,
  exportFecTxt,
  fecFieldDefinitions,
  importAccountPlanRows,
  makeDossierCode,
  nextAuxiliaryAccountId,
  mapImportedRows,
  parseDelimited,
  suggestPosting,
  prepareFecExport,
  validateFecTxt,
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
  assert.ok(setup.accounts.some((account) => account.id === '4111'));
  assert.ok(setup.journals.some((journal) => journal.id === 'VE'));
});

test('configure les journaux et verrouille le code utilisé', () => {
  const setup = createCsrSetup({ companyId: 'co-a' });
  setup.journals = addJournalToSetup(setup.journals, { id: 'OD2', label: 'Opérations diverses 2', type: 'OPERATIONS_DIVERSES', prefix: 'OD2-', nextNumber: 1 });
  assert.equal(setup.journals.at(-1).id, 'OD2');
  setup.journals = updateJournalInSetup(setup.journals, 'OD2', { label: 'OD complémentaires', nextNumber: 12 });
  assert.equal(setup.journals.at(-1).nextNumber, 12);
  assert.throws(() => updateJournalInSetup(setup.journals, 'VE', { id: 'VEX' }, { usedJournalIds: ['VE'] }), (error) => error.code === 'USED_JOURNAL_CODE_LOCKED');
  assert.throws(() => addJournalToSetup(setup.journals, { id: 'OD', label: 'Doublon' }), (error) => error.code === 'DUPLICATE_JOURNAL');
});

test('réserve les journaux automatiques aux traitements système', () => {
  const lines = [{ accountId: '6281', debit: 12000, credit: 0 }, { accountId: '4011', debit: 0, credit: 12000 }];
  const entry = createAutomaticJournalEntry({ companyId: 'co-a', integrationCategory: 'ABONNEMENTS', date: '2025-06-01', label: 'Abonnement internet', lines });
  assert.equal(entry.journalId, SYSTEM_JOURNAL_BY_CATEGORY.ABONNEMENTS);
  assert.equal(entry.integrationCategory, 'ABONNEMENTS');
  assert.throws(() => createJournalEntry({ companyId: 'co-a', journalId: 'AB', date: '2025-06-01', lines }), (error) => error.code === 'SYSTEM_JOURNAL_USER_POST_FORBIDDEN');
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
  assert.equal(nextAuxiliaryAccountId(setup.accounts, '4111'), '411101');
  const tiers = addThirdPartyToDirectory([], { id: 'tp-1', code: 'ACACIA', name: 'Acacia Client', type: 'CLIENT', collectiveAccountId: '4111' }, setup.accounts);
  assert.equal(tiers[0].auxiliaryAccountId, '411101');
  assert.throws(() => updateAccountInPlan(setup.accounts, '4111', { id: '411001' }, { usedAccountIds: ['4111'] }), (error) => error.code === 'USED_ACCOUNT_NUMBER_LOCKED');
  assert.throws(() => addAccountToPlan(setup.accounts, { id: '411100', label: 'Doublon' }), (error) => error.code === 'DUPLICATE_ACCOUNT');
  const imported = importAccountPlanRows([{ id: '512100', label: 'Banque locale', nature: 'Actif / trésorerie' }], { existingAccounts: setup.accounts });
  assert.equal(imported.valid, true);
  assert.match(exportAccountPlanTxt({ companyName: 'Acacia Conseil', accounts: imported.imported }), /512100/);
});

test('calcule et impute une facture client multi-lignes', () => {
  const totals = calculateDocumentTotals([
    { description: 'Conseil', quantity: 1, unitPrice: 200000 },
    { description: 'Support', quantity: 2, unitPrice: 25000 }
  ], 18);
  assert.equal(totals.totalExclTax, 250000);
  assert.equal(totals.tax, 45000);
  assert.equal(totals.totalInclTax, 295000);
  const invoice = createInvoiceDocument({ companyId: 'co-a', type: 'SALE', thirdPartyId: 'tp-1', thirdPartyName: 'Client test', thirdPartyAccountId: '411101', date: '2025-06-16', reference: 'FAC-001', taxRate: 18, lines: totals.lines });
  const lines = documentToJournalLines(invoice);
  assert.equal(lines.length, 3);
  assert.equal(lines[0].debit, 295000);
  assert.equal(lines[1].credit, 250000);
  assert.equal(lines[2].credit, 45000);
});

test('affecte un encaissement à une facture et met à jour son solde', () => {
  const payment = createPayment({ companyId: 'co-a', type: 'RECEIPT', thirdPartyId: 'tp-1', thirdPartyName: 'Client test', thirdPartyAccountId: '411101', date: '2025-06-16', reference: 'REG-001', amount: 150000, treasuryAccountId: '5211' });
  const paymentLines = paymentToJournalLines(payment);
  assert.equal(paymentLines[1].settlementDate, '2025-06-16');
  assert.equal(paymentLines[1].settlementMode, 'Virement');
  assert.equal(paymentLines[0].auxiliaryAccountId, undefined);
  const invoice = { id: 'invoice-1', companyId: 'co-a', type: 'SALE', thirdPartyId: 'tp-1', totalInclTax: 250000, paidAmount: 0, outstanding: 250000, status: 'POSTED' };
  const result = applyPaymentAllocations(payment, [invoice], [{ documentId: 'invoice-1', amount: 150000 }]);
  assert.equal(result.payment.allocatedAmount, 150000);
  assert.equal(result.payment.unallocatedAmount, 0);
  assert.equal(result.documents[0].outstanding, 100000);
  assert.equal(result.documents[0].status, 'PARTIAL');
  assert.equal(result.documents[0].lettered, false);
});

test('centralise les lignes sans modifier les écritures sources', () => {
  const entries = [
    { id: 'e1', companyId: 'co-a', journalId: 'VE', date: '2025-06-15', status: 'VALIDATED', lines: [{ accountId: '4111', label: 'Client', debit: 100000, credit: 0 }, { accountId: '7061', label: 'Vente', debit: 0, credit: 100000 }] },
    { id: 'e2', companyId: 'co-a', journalId: 'AC', date: '2025-06-16', status: 'TO_REVIEW', lines: [{ accountId: '6047', label: 'Fournitures', debit: 25000, credit: 0 }, { accountId: '4011', label: 'Fournisseur', debit: 0, credit: 25000 }] }
  ];
  const result = centralizeEntries(entries, { companyId: 'co-a', period: '2025-06' });
  assert.equal(result.sourceCount, 2);
  assert.equal(result.totalDebit, 125000);
  assert.equal(result.totalCredit, 125000);
  assert.deepEqual(result.sourceEntryIds, ['e1', 'e2']);
  assert.equal(entries[0].journalId, 'VE');
});

test('calcule le résultat d’une période à partir des comptes 6 et 7', () => {
  const result = calculatePeriodResult([
    { id: 'sale', companyId: 'co-a', date: '2025-06-10', status: 'VALIDATED', lines: [{ accountId: '7061', label: 'Ventes', debit: 0, credit: 250000 }] },
    { id: 'expense', companyId: 'co-a', date: '2025-06-10', status: 'VALIDATED', lines: [{ accountId: '6047', label: 'Fournitures', debit: 38500, credit: 0 }] }
  ], { companyId: 'co-a', period: '2025-06' });
  assert.equal(result.products, 250000);
  assert.equal(result.charges, 38500);
  assert.equal(result.result, 211500);
  assert.equal(result.resultAccount, '131');
  assert.equal(result.totalDebit, result.totalCredit);
});

test('produit une balance et des états sur les écritures validées', () => {
  const entries = [
    { id: 'sale', companyId: 'co-a', date: '2025-06-10', status: 'VALIDATED', lines: [{ accountId: '4111', label: 'Clients', debit: 250000, credit: 0 }, { accountId: '7061', label: 'Services vendus', debit: 0, credit: 250000 }] },
    { id: 'purchase', companyId: 'co-a', date: '2025-06-10', status: 'TO_REVIEW', lines: [{ accountId: '6047', label: 'Fournitures', debit: 38500, credit: 0 }, { accountId: '4011', label: 'Fournisseur', debit: 0, credit: 38500 }] }
  ];
  assert.equal(buildTrialBalance(entries, { companyId: 'co-a', period: '2025-06', statuses: ['VALIDATED'] }).length, 2);
  const statements = buildFinancialStatements(entries, { companyId: 'co-a', period: '2025-06', statuses: ['VALIDATED', 'TO_REVIEW'] });
  assert.equal(statements.balanceSheet.length, 2);
  assert.equal(statements.incomeStatement.length, 2);
  assert.equal(statements.resultBeforeTax, 211500);
  assert.equal(statements.totalDebit, statements.totalCredit);
});

test('verrouille une période uniquement après les contrôles bloquants', () => {
  const period = { id: '2025-06', status: 'OPEN' };
  const blocked = evaluatePeriodClosure([{ id: 'journal', passed: true }, { id: 'saisie', passed: false }]);
  assert.equal(blocked.valid, false);
  assert.throws(() => closePeriod(period, { checks: blocked.checks }), (error) => error.code === 'PERIOD_CLOSURE_BLOCKED');
  const ready = evaluatePeriodClosure([{ id: 'journal', passed: true }, { id: 'saisie', passed: true }]);
  const closed = closePeriod(period, { checks: ready.checks, userId: 'user-1' });
  assert.equal(closed.status, 'CLOSED');
  assert.equal(closed.closedBy, 'user-1');
});

test('génère les 12 périodes mensuelles avec des bornes correctes', () => {
  const periods = createMonthlyPeriods(2025);
  assert.equal(periods.length, 12);
  assert.equal(periods[0].id, '2025-01');
  assert.equal(periods[0].end, '2025-01-31');
  assert.equal(periods[1].end, '2025-02-28');
  assert.equal(periods[11].end, '2025-12-31');
});

test('permet un arrêté annuel sans exiger la clôture de chaque mois', () => {
  const year = { id: '2025', status: 'OPEN' };
  const periods = createMonthlyPeriods(2025);
  assert.throws(() => finalizeFiscalYear(year, { periods: periods.slice(0, 11), checks: [{ passed: true }] }), (error) => error.code === 'FISCAL_YEAR_PERIODS_MISSING');
  const finalized = finalizeFiscalYear(year, { periods, checks: [{ passed: true }], userId: 'user-1' });
  assert.equal(finalized.status, 'FINALIZED');
  assert.equal(finalized.finalizedBy, 'user-1');
});

test('calcule le résultat fiscal et l’impôt sans taux implicite', () => {
  const noTax = calculateFiscalResult({ accountingResult: 211500, deductions: 5000, reintegrations: 20000, taxRate: 0 });
  assert.equal(noTax.taxableResult, 226500);
  assert.equal(noTax.tax, 0);
  assert.equal(noTax.netResult, 211500);
  const taxed = calculateFiscalResult({ accountingResult: 211500, taxRate: 30 });
  assert.equal(taxed.taxableResult, 211500);
  assert.equal(taxed.tax, 63450);
  assert.equal(taxed.netResult, 148050);
});

test('prépare les reports à nouveau des comptes de bilan', () => {
  const result = calculateOpeningBalances([
    { id: 'sale', companyId: 'co-a', date: '2025-06-10', status: 'VALIDATED', lines: [{ accountId: '411101', label: 'Client', debit: 250000, credit: 0 }, { accountId: '7061', label: 'Vente', debit: 0, credit: 250000 }] },
    { id: 'bank', companyId: 'co-a', date: '2025-06-10', status: 'VALIDATED', lines: [{ accountId: '5211', label: 'Banque', debit: 0, credit: 100000 }, { accountId: '401101', label: 'Fournisseur', debit: 100000, credit: 0 }] }
  ], { companyId: 'co-a', sourceYear: '2025' });
  assert.equal(result.sourceEntryIds.length, 2);
  assert.equal(result.totalDebit, result.totalCredit);
  assert.equal(result.lines.some((line) => line.accountId === '7061'), false);
  assert.equal(result.lines.some((line) => line.accountId === '411101' && line.debit === 250000), true);
});

test('pointe et rapproche un mouvement bancaire avec une écriture', () => {
  const movement = createBankMovement({ companyId: 'co-a', date: '2025-06-16', reference: 'BQ-001', label: 'Encaissement client', credit: 250000 });
  const reconciled = reconcileBankMovement(movement, { companyId: 'co-a', id: 'entry-1', amount: 250000 });
  assert.equal(reconciled.status, 'RECONCILED');
  assert.equal(reconciled.matchedEntryId, 'entry-1');
  assert.throws(() => reconcileBankMovement(movement, { companyId: 'co-a', id: 'entry-2', amount: 200000 }), (error) => error.code === 'BANK_RECONCILIATION_AMOUNT_MISMATCH');
});

test('accepte une imputation multi-lignes équilibrée', () => {
  const entry = createJournalEntry({ companyId: 'co-a', journalId: 'VE', date: '2025-06-16', lines: [
    { accountId: '4111', debit: 250000, credit: 0 },
    { accountId: '7061', debit: 0, credit: 200000 },
    { accountId: '445700', debit: 0, credit: 50000 }
  ] });
  assert.equal(entry.lines.length, 3);
  assert.equal(entry.lines.reduce((sum, line) => sum + line.debit, 0), 250000);
  assert.equal(entry.lines.reduce((sum, line) => sum + line.credit, 0), 250000);
});

test('fait progresser une écriture sans autoriser de saut de statut', () => {
  const draft = createJournalEntry({ companyId: 'co-a', journalId: 'VE', date: '2025-06-16', lines: [
    { accountId: '4111', debit: 250000, credit: 0 },
    { accountId: '7061', debit: 0, credit: 250000 }
  ] });
  const imputed = transitionOperation(draft, OPERATION_STATES.IMPUTED);
  const review = transitionOperation(imputed, OPERATION_STATES.TO_REVIEW);
  assert.equal(review.status, 'TO_REVIEW');
  const validated = transitionOperation(review, OPERATION_STATES.VALIDATED);
  assert.equal(validated.status, 'VALIDATED');
  assert.ok(validated.validatedAt);
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
      { accountId: '4111', debit: 250000, credit: 0 },
      { accountId: '7061', debit: 0, credit: 200000 }
    ]
  }), (error) => error.code === 'UNBALANCED_ENTRY');

  assert.throws(() => createJournalEntry({
    companyId: 'co-b', journalId: 'VE', date: '2025-06-16', lines: [
      { accountId: '4111', debit: 250000, credit: 0 },
      { accountId: '7061', debit: 0, credit: 250000 }
    ]
  }, { activeCompanyId: 'co-a' }), (error) => error.code === 'COMPANY_SCOPE_VIOLATION');
});

test('propose une imputation d’abonnement équilibrée', () => {
  const suggestion = suggestPosting({ category: 'subscription', total: 12000, thirdPartyName: 'Fournisseur internet' });
  assert.equal(suggestion.status, 'SUGGESTED');
  assert.equal(suggestion.lines[0].accountId, '6281');
  assert.equal(suggestion.lines[1].accountId, '4011');
});

test('propose une imputation de vente équilibrée', () => {
  const suggestion = suggestPosting({ category: 'service-sale', total: '250 000', thirdPartyName: 'Awa Concept' });
  assert.equal(suggestion.status, 'SUGGESTED');
  assert.equal(suggestion.confidence, 0.96);
  assert.equal(suggestion.lines[0].accountId, '4111');
  assert.equal(suggestion.lines[1].accountId, '7061');
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
  const source = '\uFEFFCOMPTE;LIBELLE;DEBIT;CREDIT\n4111;Clients;250 000;0\n7061;Services vendus;0;250 000\n';
  const parsed = parseDelimited(source, { delimiter: ';' });
  const rows = mapImportedRows(parsed.rows, { account: 'COMPTE', label: 'LIBELLE', debit: 'DEBIT', credit: 'CREDIT', date: 'COMPTE' });
  rows.forEach((row) => { row.date = '2025-06-30'; });
  const result = validateImportedBalance(rows, { knownAccounts: ['4111', '7061'] });
  assert.equal(result.valid, true);
  assert.equal(result.debit, 250000);
  assert.equal(result.credit, 250000);
  assert.match(exportBalanceTxt({ companyName: 'Acacia Conseil', period: 'Juin 2025', rows }), /Acacia Conseil/);
});

test('prépare le FEC béninois normal avec ses 18 champs et exclut les écritures interdites', () => {
  const journals = [
    { id: 'AN', label: 'À-nouveaux' },
    { id: 'VE', label: 'Ventes' },
    { id: 'CT', label: 'Centralisations' },
    { id: 'RP', label: 'Résultat de la période' }
  ];
  const accounts = [
    { id: '4111', label: 'Clients' },
    { id: '7061', label: 'Services vendus' },
    { id: '131', label: 'Résultat net' }
  ];
  const entries = [
    { id: 'report', companyId: 'co-a', journalId: 'AN', reference: 'AN-0001', date: '2025-01-01', validatedAt: '2025-01-02', label: 'Report des soldes', integrationCategory: 'REPORTS_A_NOUVEAU', status: 'VALIDATED', lines: [{ accountId: '4111', debit: 1000, credit: 0 }, { accountId: '131', debit: 0, credit: 1000 }] },
    { id: 'sale', companyId: 'co-a', journalId: 'VE', reference: 'FAC-001', date: '2025-01-03', validatedAt: '2025-01-04', label: 'Vente client', status: 'VALIDATED', lines: [{ accountId: '411101', thirdPartyId: 'tp-1', debit: 1000, credit: 0 }, { accountId: '7061', debit: 0, credit: 1000 }] },
    { id: 'central', companyId: 'co-a', journalId: 'CT', reference: 'CT-0001', date: '2025-01-05', validatedAt: '2025-01-05', label: 'Centralisation', integrationCategory: 'CENTRALISATION', status: 'VALIDATED', lines: [{ accountId: '4111', debit: 100, credit: 100 }] },
    { id: 'result', companyId: 'co-a', journalId: 'RP', reference: 'RP-0001', date: '2025-01-06', validatedAt: '2025-01-06', label: 'Solde des comptes 6 et 7', integrationCategory: 'RESULTAT', status: 'VALIDATED', lines: [{ accountId: '131', debit: 100, credit: 100 }] }
  ];
  const prepared = prepareFecExport({ entries, companyId: 'co-a', fiscalYear: '2025', regime: 'NORMAL', journals, accounts, thirdParties: [{ id: 'tp-1', name: 'Client test', collectiveAccountId: '4111', auxiliaryAccountId: '411101' }], startDate: '2025-01-01', endDate: '2025-12-31' });
  assert.equal(prepared.valid, true);
  assert.equal(prepared.fields.length, 18);
  assert.equal(prepared.records.length, 4);
  assert.equal(prepared.records[0].values.NumEcriture, '1');
  assert.equal(prepared.records[0].values.LibEcriture, 'REPORT');
  assert.equal(prepared.records[1].values.NumEcriture, '1');
  assert.equal(prepared.records[2].values.NumEcriture, '2');
  assert.equal(prepared.records[2].values.NumCompte, '4111');
  assert.equal(prepared.records[2].values.NumCompteAux, '411101');
  assert.equal(prepared.records[2].values.LibCompte, 'Clients');
  assert.equal(prepared.excludedEntries.length, 2);
  const content = exportFecTxt({ prepared });
  assert.match(content.split('\r\n')[0], /^CodeJournal\tLibJournal\tNumEcriture\tDateEcriture/);
  assert.match(content, /1000,00/);
  assert.equal(content.split('\r\n')[0].split('\t').length, 18);
  assert.match(exportFecNoticeTxt({ prepared }), /SEPARATEUR_CHAMPS\tTABULATION/);
  const checked = validateFecTxt(content, { regime: 'NORMAL' });
  assert.equal(checked.valid, true);
  assert.equal(checked.entryCount, 2);
  assert.match(exportFecControlReportTxt({ prepared, validation: checked, companyName: 'Acacia Conseil', ifu: '3201900045612', mode: 'FEC officiel', fileBase: 'FEC_3201900045612_20251231.txt' }), /STATUT\tPRET/);
});

test('ajoute les trois champs du SMT et bloque le FEC officiel si la date de validation manque', () => {
  const entry = { id: 'receipt', companyId: 'co-a', journalId: 'BQ', reference: 'BQ-0001', date: '2025-02-01', label: 'Encaissement client', status: 'VALIDATED', lines: [{ accountId: '5211', debit: 5000, credit: 0, settlementDate: '2025-02-01', settlementMode: 'Virement' }] };
  const prepared = prepareFecExport({ entries: [entry], companyId: 'co-a', fiscalYear: '2025', regime: 'SMT', journals: [{ id: 'BQ', label: 'Banque' }], accounts: [{ id: '5211', label: 'Banque locale' }], startDate: '2025-01-01', endDate: '2025-12-31' });
  assert.equal(prepared.valid, false);
  assert.equal(prepared.fields.length, 21);
  assert.ok(prepared.errors.some((issue) => issue.code === 'FEC_MISSING_VALID_DATE'));
  assert.equal(prepared.records[0].values['Date Règlement'], '20250201');
  assert.equal(prepared.records[0].values['Mode Règlement'], 'Virement');
  assert.equal(exportFecTxt({ prepared }).split('\r\n')[0].split('\t').length, 21);
});

test('encode le FEC dans les jeux de caractères prévus', () => {
  assert.deepEqual([...encodeFecText('A\tÉ\r\n', 'ASCII')], [0x41, 0x09, 0x45, 0x0d, 0x0a]);
  assert.deepEqual([...encodeFecText('A\tÉ\r\n', 'ISO-8859-15')], [0x41, 0x09, 0xc9, 0x0d, 0x0a]);
  assert.deepEqual([...encodeFecText('A1\t', 'EBCDIC')], [0xc1, 0xf1, 0x05]);
});

test('contrôle une séquence FEC annuelle avec reports, opérations détaillées et plusieurs mois', () => {
  const journals = [{ id: 'AN', label: 'À-nouveaux' }, { id: 'VE', label: 'Ventes' }, { id: 'BQ', label: 'Banque' }];
  const accounts = [{ id: '4111', label: 'Clients' }, { id: '5211', label: 'Banque locale' }, { id: '7061', label: 'Services vendus' }, { id: '101', label: 'Capital social' }];
  const entry = (id, journalId, date, reference, lines, extra = {}) => ({ id, companyId: 'co-a', journalId, date, reference, label: reference, status: 'VALIDATED', validatedAt: `${date}T12:00:00.000Z`, lines, ...extra });
  const entries = [
    entry('report', 'AN', '2025-01-01', 'AN-0001', [{ accountId: '101', debit: 0, credit: 500000 }, { accountId: '5211', debit: 500000, credit: 0 }], { integrationCategory: 'REPORTS_A_NOUVEAU' }),
    entry('jan', 'VE', '2025-01-15', 'FAC-001', [{ accountId: '4111', debit: 100000, credit: 0 }, { accountId: '7061', debit: 0, credit: 100000 }]),
    entry('jun', 'BQ', '2025-06-16', 'BQ-001', [{ accountId: '5211', debit: 100000, credit: 0 }, { accountId: '4111', debit: 0, credit: 100000 }]),
    entry('dec', 'VE', '2025-12-20', 'FAC-099', [{ accountId: '4111', debit: 250000, credit: 0 }, { accountId: '7061', debit: 0, credit: 250000 }])
  ];
  const prepared = prepareFecExport({ entries, companyId: 'co-a', fiscalYear: '2025', regime: 'NORMAL', journals, accounts, startDate: '2025-01-01', endDate: '2025-12-31' });
  const content = exportFecTxt({ prepared });
  const checked = validateFecTxt(content, { regime: 'NORMAL' });
  assert.equal(prepared.valid, true);
  assert.equal(checked.valid, true);
  assert.deepEqual(prepared.records.filter((record, index, records) => index === 0 || record.values.NumEcriture !== records[index - 1].values.NumEcriture).map((record) => record.values.NumEcriture), ['1', '2', '3', '4']);
  assert.equal(prepared.records.at(-1).values.DateEcriture, '20251220');
});

test('produit un jeu annuel de démonstration complet pour le système normal et le SMT', () => {
  const setup = createCsrSetup({ companyId: 'co-a' });
  const client = { id: 'demo-client', name: 'Client démonstration', type: 'CLIENT', collectiveAccountId: '4111', auxiliaryAccountId: '411101' };
  const supplier = { id: 'demo-supplier', name: 'Fournisseur démonstration', type: 'SUPPLIER', collectiveAccountId: '4011', auxiliaryAccountId: '401101' };
  const entries = createFecAnnualDemoEntries({ companyId: 'co-a', fiscalYear: '2025', client, supplier });
  assert.equal(entries.length, 57);
  const normal = prepareFecExport({ entries, companyId: 'co-a', fiscalYear: '2025', regime: 'NORMAL', journals: setup.journals, accounts: setup.accounts, thirdParties: [client, supplier], startDate: '2025-01-01', endDate: '2025-12-31' });
  const smt = prepareFecExport({ entries, companyId: 'co-a', fiscalYear: '2025', regime: 'SMT', journals: setup.journals, accounts: setup.accounts, thirdParties: [client, supplier], startDate: '2025-01-01', endDate: '2025-12-31' });
  assert.equal(normal.valid, true);
  assert.equal(normal.entryCount, 55);
  assert.equal(normal.lineCount, 128);
  assert.equal(normal.excludedEntries.length, 2);
  assert.equal(smt.valid, true);
  assert.equal(smt.fields.length, 21);
  assert.ok(smt.records.every((record) => record.values['Date Règlement']));
});

test('scelle un paquet FEC ZIP avec plusieurs fichiers sans compression destructive', () => {
  const archive = createZipArchive([
    { name: 'FEC_3201900045612_20251231.txt', bytes: new TextEncoder().encode('CodeJournal\tLibJournal\r\n') },
    { name: 'FEC_3201900045612_20251231.notice.txt', bytes: new TextEncoder().encode('NOTICE') }
  ]);
  assert.deepEqual([...archive.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  assert.ok(new TextDecoder().decode(archive).includes('FEC_3201900045612_20251231.txt'));
  assert.ok(new TextDecoder().decode(archive).includes('FEC_3201900045612_20251231.notice.txt'));
  assert.throws(() => createZipArchive([{ name: '../unsafe.txt', bytes: new Uint8Array() }]), (error) => error.code === 'FEC_ARCHIVE_INVALID_NAME');
});
