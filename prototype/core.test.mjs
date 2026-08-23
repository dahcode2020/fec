import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DomainError,
  addCompany,
  calculateStraightLinePlan,
  companiesFor,
  createCompany,
  createJournalEntry,
  createLocalWorkspaceStore,
  createWorkspace,
  depreciationEntry,
  exportBalanceTxt,
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
