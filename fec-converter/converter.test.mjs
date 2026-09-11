import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOFTWARE_PROFILES, suggestProfiles, autoMapHeaders,
  detectDelimiter, parseDelimitedText, parseDateToISO, parseAmountValue,
  buildInternalLines, balanceRowsToInternalLines, prepareFecFromLines,
  buildFecText, validateFecText, splitRecords, fecFileBaseName,
  buildNoticeText, buildReportText, buildManifestText,
  encodeFecBytes, createZipArchive, sha256Hex, buildGenericTemplate
} from './converter.js';

test('détecte le séparateur point-virgule (Sage/Ciel)', () => {
  const text = 'Journal;Date;Compte;Libellé;Débit;Crédit\nVE;15/01/2025;4111;Client;118000;0\n';
  assert.equal(detectDelimiter(text), ';');
  const parsed = parseDelimitedText(text, { delimiter: ';' });
  assert.deepEqual(parsed.headers, ['Journal', 'Date', 'Compte', 'Libellé', 'Débit', 'Crédit']);
  assert.equal(parsed.rows.length, 1);
});

test('détecte la tabulation', () => {
  const text = 'Journal\tDate\tDébit\nVE\t15/01/2025\t100\n';
  assert.equal(detectDelimiter(text), '\t');
});

test('parse les dates JJ/MM/AAAA, AAAA-MM-JJ et AAAAMMJJ', () => {
  assert.equal(parseDateToISO('15/01/2025'), '2025-01-15');
  assert.equal(parseDateToISO('15-01-2025'), '2025-01-15');
  assert.equal(parseDateToISO('2025-01-15'), '2025-01-15');
  assert.equal(parseDateToISO('20250115'), '2025-01-15');
  assert.equal(parseDateToISO(''), '');
});

test('parse les montants virgule/point/espaces/parenthèses', () => {
  assert.equal(parseAmountValue('1 234,56'), 1234.56);
  assert.equal(parseAmountValue('1 234,56'), 1234.56);
  assert.equal(parseAmountValue('1234.56'), 1234.56);
  assert.equal(parseAmountValue('(1 234,56)'), -1234.56);
  assert.equal(parseAmountValue(''), 0);
  assert.ok(Number.isNaN(parseAmountValue('abc')));
});

test('suggère le profil Sage 100 pour ses en-têtes typiques', () => {
  const headers = ['Code journal', 'Date', 'N° pièce', 'N° compte général', 'N° compte tiers', 'Libellé', 'Débit', 'Crédit'];
  const ranked = suggestProfiles(headers);
  assert.equal(ranked[0].profile.id === 'sage100' || ranked[0].profile.id === 'saari_ciel', true);
  const mapping = autoMapHeaders(headers, 'sage100');
  assert.ok(mapping.journalCode >= 0);
  assert.ok(mapping.accountNum >= 0);
  assert.ok(mapping.debit >= 0 && mapping.credit >= 0);
});

test('chaîne complète : export Sage -> FEC valide 18 champs', () => {
  const text = [
    'Code journal;Date;N° pièce;N° compte général;Libellé;Débit;Crédit',
    'VE;15/01/2025;FAC-001;411100;Client exemple;118000;0',
    'VE;15/01/2025;FAC-001;706100;Services vendus;0;100000',
    'VE;15/01/2025;FAC-001;443100;TVA facturée;0;18000',
    'BQ;20/01/2025;REG-001;521100;Banque locale;118000;0',
    'BQ;20/01/2025;REG-001;411100;Client exemple;0;118000'
  ].join('\n');
  const parsed = parseDelimitedText(text, { delimiter: ';' });
  const mapping = autoMapHeaders(parsed.headers, 'sage100');
  // La référence de pièce est portée par "N° pièce".
  mapping.pieceRef = parsed.headers.indexOf('N° pièce');
  mapping.entryNum = parsed.headers.indexOf('N° pièce');
  mapping.accountLabel = parsed.headers.indexOf('Libellé');
  mapping.entryLabel = parsed.headers.indexOf('Libellé');
  const { lines } = buildInternalLines(parsed.rows, mapping, { dateOrder: 'DMY' });
  assert.equal(lines.length, 5);
  const prepared = prepareFecFromLines(lines, { regime: 'NORMAL', startDate: '2025-01-01', endDate: '2025-12-31' });
  assert.equal(prepared.valid, true);
  assert.equal(prepared.entryCount, 2);
  assert.equal(prepared.lineCount, 5);
  const fecText = buildFecText(prepared, { delimiter: '\t' });
  assert.ok(fecText.startsWith('CodeJournal\tLibJournal\tNumEcriture'));
  const validation = validateFecText(fecText, { regime: 'NORMAL', delimiter: '\t' });
  assert.equal(validation.valid, true);
  assert.equal(validation.entryCount, 2);
});

test('montants à virgule et dates AAAAMMJJ dans le fichier', () => {
  const text = [
    'Code journal;Date;N° pièce;N° compte général;Libellé;Débit;Crédit',
    'VE;15/01/2025;FAC-001;411100;Client;118000,50;0',
    'VE;15/01/2025;FAC-001;706100;Ventes;0;118000,50'
  ].join('\n');
  const parsed = parseDelimitedText(text, { delimiter: ';' });
  const mapping = autoMapHeaders(parsed.headers, 'sage100');
  mapping.pieceRef = parsed.headers.indexOf('N° pièce');
  mapping.entryNum = parsed.headers.indexOf('N° pièce');
  mapping.accountLabel = parsed.headers.indexOf('Libellé');
  mapping.entryLabel = parsed.headers.indexOf('Libellé');
  const { lines } = buildInternalLines(parsed.rows, mapping, { dateOrder: 'DMY' });
  const prepared = prepareFecFromLines(lines, { regime: 'NORMAL' });
  const fecText = buildFecText(prepared, { delimiter: ';' });
  assert.ok(fecText.includes('20250115'));
  assert.ok(fecText.includes('118000,50'));
});

test('déséquilibre bloquant détecté', () => {
  const text = [
    'Journal;Date;Pièce;Compte;Libellé;Débit;Crédit',
    'VE;15/01/2025;FAC-001;4111;Client;118000;0',
    'VE;15/01/2025;FAC-001;7061;Ventes;0;100000'
  ].join('\n');
  const parsed = parseDelimitedText(text, { delimiter: ';' });
  const mapping = autoMapHeaders(parsed.headers, 'saari_ciel');
  mapping.accountLabel = parsed.headers.indexOf('Libellé');
  mapping.entryLabel = parsed.headers.indexOf('Libellé');
  const { lines } = buildInternalLines(parsed.rows, mapping, { dateOrder: 'DMY' });
  const prepared = prepareFecFromLines(lines, { regime: 'NORMAL' });
  assert.equal(prepared.valid, false);
  assert.ok(prepared.errors.some((e) => e.code === 'ECRITURE_DESEQUILIBREE'));
});

test('SMT exige date et mode de règlement', () => {
  const text = [
    'Journal;Date;Pièce;Compte;Libellé;Débit;Crédit',
    'VE;15/01/2025;FAC-001;4111;Client;100;0',
    'VE;15/01/2025;FAC-001;7061;Ventes;0;100'
  ].join('\n');
  const parsed = parseDelimitedText(text, { delimiter: ';' });
  const mapping = autoMapHeaders(parsed.headers, 'saari_ciel');
  mapping.accountLabel = parsed.headers.indexOf('Libellé');
  mapping.entryLabel = parsed.headers.indexOf('Libellé');
  const { lines } = buildInternalLines(parsed.rows, mapping, { dateOrder: 'DMY' });
  const prepared = prepareFecFromLines(lines, { regime: 'SMT' });
  assert.equal(prepared.valid, false);
  assert.ok(prepared.errors.some((e) => e.code === 'SMT_DATE_REGLEMENT'));
  assert.ok(prepared.errors.some((e) => e.code === 'SMT_MODE_REGLEMENT'));
});

test('balance seule -> écriture AN / REPORT équilibrée', () => {
  const text = [
    'Compte;Libellé;Débit;Crédit',
    '101000;Capital social;0;500000',
    '411100;Clients;150000;0',
    '521100;Banque locale;350000;0'
  ].join('\n');
  const parsed = parseDelimitedText(text, { delimiter: ';' });
  const mapping = autoMapHeaders(parsed.headers, 'balance');
  const { lines } = balanceRowsToInternalLines(parsed.rows, mapping, { date: '2025-01-01' });
  assert.equal(lines.length, 3);
  const prepared = prepareFecFromLines(lines, { regime: 'NORMAL' });
  assert.equal(prepared.valid, true);
  assert.equal(prepared.entryCount, 1);
  assert.ok(prepared.records.every((r) => r.values.LibEcriture === 'REPORT'));
  assert.ok(prepared.records.every((r) => r.values.CodeJournal === 'AN'));
});

test('nommage FEC_IFU_AAAAMMJJ', () => {
  assert.equal(fecFileBaseName('3201900045612', '2025-12-31'), 'FEC_3201900045612_20251231');
});

test('découpage par volume coupe entre écritures complètes', () => {
  const text = [
    'Journal;Date;Pièce;Compte;Libellé;Débit;Crédit',
    'VE;15/01/2025;F1;4111;A;10;0',
    'VE;15/01/2025;F1;7061;B;0;10',
    'VE;16/01/2025;F2;4111;A;20;0',
    'VE;16/01/2025;F2;7061;B;0;20'
  ].join('\n');
  const parsed = parseDelimitedText(text, { delimiter: ';' });
  const mapping = autoMapHeaders(parsed.headers, 'saari_ciel');
  mapping.accountLabel = parsed.headers.indexOf('Libellé');
  mapping.entryLabel = parsed.headers.indexOf('Libellé');
  const { lines } = buildInternalLines(parsed.rows, mapping, { dateOrder: 'DMY' });
  const prepared = prepareFecFromLines(lines, { regime: 'NORMAL' });
  const chunks = splitRecords(prepared, 2);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].lineCount, 2);
  assert.equal(chunks[1].lineCount, 2);
});

test('encodages ASCII / ISO-8859-15 / EBCDIC / UTF-8', () => {
  const ascii = encodeFecBytes('Crédit été', 'ASCII');
  assert.ok(![...ascii].some((b) => b > 127));
  const iso = encodeFecBytes('Crédit', 'ISO-8859-15');
  assert.ok([...iso].includes(0xe9));
  const ebcdic = encodeFecBytes('AB 12', 'EBCDIC');
  assert.deepEqual([...ebcdic], [0xc1, 0xc2, 0x40, 0xf1, 0xf2]);
  const utf8 = encodeFecBytes('Crédit', 'UTF-8');
  assert.ok(utf8.length > 'Crédit'.length);
});

test('ZIP minimal + SHA-256 + manifeste', async () => {
  const fileA = { name: 'FEC_123_20251231.txt', bytes: encodeFecBytes('A\r\n', 'ASCII') };
  const hashA = await sha256Hex(fileA.bytes);
  assert.match(hashA, /^[a-f0-9]{64}$/);
  const manifest = buildManifestText([{ name: fileA.name, sha256: hashA, bytes: fileA.bytes }], { fileBase: 'FEC_123_20251231' });
  assert.ok(manifest.includes('SHA256'));
  const zip = createZipArchive([fileA, { name: 'FEC_123_20251231.manifest.txt', bytes: encodeFecBytes(manifest, 'ASCII') }]);
  assert.ok(zip.length > 100);
  assert.equal(zip[0], 0x50);
  assert.equal(zip[1], 0x4b);
});

test('notice et rapport générés', () => {
  const prepared = prepareFecFromLines([{
    __row: 2, journalCode: 'VE', journalLabel: 'Ventes', entryNum: 'F1',
    entryDate: '2025-01-15', accountNum: '411100', accountLabel: 'Clients',
    auxNum: '', auxLabel: '', pieceRef: 'F1', pieceDate: '2025-01-15',
    entryLabel: 'Vente', debit: 100, credit: 0, lettering: '', letteringDate: '',
    validDate: '2025-01-15', foreignAmount: '', currency: '',
    settlementDate: '', settlementMode: '', natOp: ''
  }, {
    __row: 3, journalCode: 'VE', journalLabel: 'Ventes', entryNum: 'F1',
    entryDate: '2025-01-15', accountNum: '706100', accountLabel: 'Ventes',
    auxNum: '', auxLabel: '', pieceRef: 'F1', pieceDate: '2025-01-15',
    entryLabel: 'Vente', debit: 0, credit: 100, lettering: '', letteringDate: '',
    validDate: '2025-01-15', foreignAmount: '', currency: '',
    settlementDate: '', settlementMode: '', natOp: ''
  }], { regime: 'NORMAL' });
  const notice = buildNoticeText(prepared, { delimiter: '\t', encoding: 'ISO-8859-15' });
  assert.ok(notice.includes('CodeJournal'));
  const report = buildReportText({ prepared, companyName: 'Test', ifu: '123', mode: 'Officiel', fileBase: 'FEC_123_20251231' });
  assert.ok(report.includes('PRET'));
});

test('modèle générique téléchargeable (18 et 21 champs)', () => {
  const normal = buildGenericTemplate('NORMAL');
  assert.ok(normal.startsWith('CodeJournal;LibJournal;NumEcriture'));
  assert.equal(normal.split('\r\n')[0].split(';').length, 18);
  const smt = buildGenericTemplate('SMT');
  assert.equal(smt.split('\r\n')[0].split(';').length, 21);
  assert.ok(smt.includes('Date Règlement'));
});

test('libellés de secours : journal, compte SYSCOHADA, nom de tiers en auxiliaire', () => {
  const prepared = prepareFecFromLines([{
    __row: 2, journalCode: 'AN', journalLabel: 'AN', entryNum: 'R1',
    entryDate: '2025-01-01', accountNum: '411100', accountLabel: '411100',
    auxNum: 'Awa Concept', auxLabel: 'Awa Concept', pieceRef: 'R1', pieceDate: '2025-01-01',
    entryLabel: 'Report', debit: 100, credit: 0, lettering: '', letteringDate: '',
    validDate: '2025-01-01', foreignAmount: '', currency: '',
    settlementDate: '', settlementMode: '', natOp: ''
  }, {
    __row: 3, journalCode: 'AN', journalLabel: '', entryNum: 'R1',
    entryDate: '2025-01-01', accountNum: '101000', accountLabel: '',
    auxNum: '', auxLabel: '', pieceRef: 'R1', pieceDate: '2025-01-01',
    entryLabel: 'Report', debit: 0, credit: 100, lettering: '', letteringDate: '',
    validDate: '2025-01-01', foreignAmount: '', currency: '',
    settlementDate: '', settlementMode: '', natOp: ''
  }], { regime: 'NORMAL' });
  assert.equal(prepared.valid, true);
  assert.equal(prepared.records[0].values.LibJournal, 'À-nouveaux');
  assert.equal(prepared.records[0].values.LibCompte, 'Clients');
  assert.equal(prepared.records[0].values.NumCompteAux, '');
  assert.equal(prepared.records[0].values.LibCompteAux, 'Awa Concept');
  assert.equal(prepared.records[1].values.LibCompte, 'Capital social');
});

test('profils logiciels documentés', () => {
  const ids = SOFTWARE_PROFILES.map((p) => p.id);
  assert.ok(ids.includes('sage100'));
  assert.ok(ids.includes('saari_ciel'));
  assert.ok(ids.includes('ebp'));
  assert.ok(ids.includes('odoo'));
  assert.ok(ids.includes('generique'));
  assert.ok(ids.includes('balance'));
});
