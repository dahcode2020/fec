import {
  MAPPING_TARGETS, SOFTWARE_PROFILES, getProfile, suggestProfiles, autoMapHeaders,
  detectDelimiter, parseDelimitedText, parseDateToISO, parseAmountValue,
  buildInternalLines, balanceRowsToInternalLines, prepareFecFromLines,
  buildFecText, validateFecText, splitRecords, fecFileBaseName,
  buildNoticeText, buildReportText, buildManifestText,
  encodeFecBytes, createZipArchive, sha256Hex, buildGenericTemplate,
  fecFieldsForRegime, parsePerfectoText, extractPerfectoSections,
  detectPerfectoText, isPerfectoSectionRow
} from './converter.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const state = {
  step: 1,
  fileName: '',
  rawText: '',
  workbook: null,
  sheetName: '',
  parsed: { headers: [], rows: [], delimiter: ';' },
  profileId: 'sage100',
  profileTouched: false,
  mapping: {},
  internal: { lines: [], issues: [] },
  isBalance: false,
  prepared: null,
  validations: [],
  outputs: [],
  packageHash: ''
};

// ---------------------------------------------------------------------------
// Navigation + toast
// ---------------------------------------------------------------------------

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('is-visible');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => node.classList.remove('is-visible'), 3200);
}

function showStep(step) {
  state.step = step;
  $$('[data-panel]').forEach((panel) => { panel.hidden = Number(panel.dataset.panel) !== step; });
  $$('.step').forEach((button) => {
    const index = Number(button.dataset.step);
    button.classList.toggle('is-current', index === step);
    button.classList.toggle('is-done', index < step);
  });
  if (step === 3) renderMapping();
  if (step === 4) runControls();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$$('.step').forEach((button) => button.addEventListener('click', () => {
  const target = Number(button.dataset.step);
  if (target === 3 && !state.parsed.rows.length) { toast('Importez d’abord un fichier source.'); return; }
  if (target === 4 && !state.internal.lines.length) { toast('Mappez d’abord les colonnes (aperçu vide).'); return; }
  if (target === 5 && !state.prepared) { toast('Lancez d’abord le précontrôle.'); return; }
  showStep(target);
}));

$$('[data-next]').forEach((button) => button.addEventListener('click', () => {
  const target = Number(button.dataset.next);
  if (target === 2 && !validateContext()) return;
  if (target === 3 && !state.parsed.rows.length) { toast('Importez d’abord un fichier source.'); return; }
  if (target === 4 && !state.internal.lines.length) { toast('Aucune ligne interprétée : vérifiez le mapping.'); return; }
  showStep(target);
}));

// ---------------------------------------------------------------------------
// Étape 1 : contexte
// ---------------------------------------------------------------------------

function context() {
  return {
    companyName: $('#companyName').value.trim(),
    ifu: $('#companyIfu').value.replace(/[^0-9]/g, ''),
    exerciseStart: $('#exerciseStart').value,
    exerciseEnd: $('#exerciseEnd').value,
    regime: $('#regime').value,
    mode: $('#mode').value,
    outDelimiter: $('#outDelimiter').value === 'SEMICOLON' ? ';' : '\t',
    outEncoding: $('#outEncoding').value,
    maxLines: Math.max(0, Number($('#maxLines').value) || 0),
    autoSequence: $('#optAutoSequence').checked,
    validFallback: $('#optValidFallback').checked,
    excludeCentral: $('#optExcludeCentral').checked,
    groupSourceNum: $('#optGroupSourceNum').checked
  };
}

function validateContext() {
  const ctx = context();
  if (!ctx.companyName) { toast('La raison sociale est obligatoire.'); return false; }
  if (!/^\d{13}$/.test(ctx.ifu)) { toast('L’IFU doit contenir exactement 13 chiffres.'); return false; }
  if (!ctx.exerciseStart || !ctx.exerciseEnd || ctx.exerciseEnd <= ctx.exerciseStart) {
    toast('Les dates d’exercice sont invalides (fin postérieure au début).');
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Étape 2 : import
// ---------------------------------------------------------------------------

function initProfiles() {
  const select = $('#profileSelect');
  select.innerHTML = SOFTWARE_PROFILES.map((p) => `<option value="${p.id}">${p.label}</option>`).join('');
  select.value = state.profileId;
  select.addEventListener('change', () => {
    state.profileId = select.value;
    state.profileTouched = true;
    applyProfileDefaults();
    refreshImport();
  });
  applyProfileDefaults();
}

function applyProfileDefaults() {
  const profile = getProfile(state.profileId);
  $('#profileHint').textContent = profile.hint;
  $('#srcDateOrder').value = profile.dateOrder || 'DMY';
  $('#balanceNotice').hidden = state.profileId !== 'balance';
  state.isBalance = state.profileId === 'balance';
}

async function readFileWithEncoding(file, encoding) {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

async function ensureXlsx() {
  if (globalThis.XLSX) return globalThis.XLSX;
  const sources = [
    'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/xlsx@0.20.2/dist/xlsx.full.min.js'
  ];
  let lastError;
  for (const src of sources) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`CDN indisponible : ${src}`));
        document.head.appendChild(script);
        window.setTimeout(() => reject(new Error('Délai dépassé')), 15000);
      });
      if (globalThis.XLSX) return globalThis.XLSX;
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('Librairie Excel indisponible.');
}

function workbookToMatrix(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  const matrix = globalThis.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  return matrix.map((row) => row.map((cell) => String(cell ?? '').trim()));
}

function refreshSheetSelector() {
  const field = $('#sheetField');
  const select = $('#sheetSelect');
  if (!state.workbook) { field.hidden = true; return; }
  field.hidden = false;
  select.innerHTML = state.workbook.SheetNames.map((name) => `<option value="${name}">${name}</option>`).join('');
  select.value = state.sheetName || state.workbook.SheetNames[0];
  state.sheetName = select.value;
}

async function handleFile(file) {
  if (!file) return;
  state.fileName = file.name;
  state.workbook = null;
  const chip = $('#fileChip');
  chip.hidden = false;
  chip.textContent = `⏳ Lecture de ${file.name}…`;
  try {
    if (/\.(xlsx|xls|ods)$/i.test(file.name)) {
      const XLSX = await ensureXlsx();
      const buffer = await file.arrayBuffer();
      state.workbook = XLSX.read(buffer, { type: 'array' });
      state.sheetName = state.workbook.SheetNames[0];
      state.rawText = '';
      refreshSheetSelector();
      chip.textContent = `📊 ${file.name} — ${state.workbook.SheetNames.length} feuille(s)`;
    } else {
      const encoding = $('#srcEncoding').value;
      state.rawText = await readFileWithEncoding(file, encoding);
      refreshSheetSelector();
      chip.textContent = `📄 ${file.name} — ${(file.size / 1024).toFixed(1)} Ko`;
    }
    // Détection PERFECTO (sections « Journal <XXX> … ») prioritaire.
    if (!state.profileTouched) {
      let isPerfecto = false;
      if (state.workbook) {
        try {
          const matrix = workbookToMatrix(state.workbook, state.sheetName);
          isPerfecto = matrix.slice(0, 80).some((row) => isPerfectoSectionRow(row[0]));
        } catch { isPerfecto = false; }
      } else {
        isPerfecto = detectPerfectoText(state.rawText);
      }
      if (isPerfecto) {
        state.profileId = 'perfecto';
        $('#profileSelect').value = 'perfecto';
        applyProfileDefaults();
        toast('Journal PERFECTO détecté : profil appliqué.');
      }
    }
    // Suggestion du profil au premier import (si l'utilisateur n'a pas choisi).
    if (!state.profileTouched && state.profileId !== 'perfecto') {
      const preview = quickParse();
      if (preview.headers.length) {
        const ranked = suggestProfiles(preview.headers);
        if (ranked[0]?.score >= 3) {
          state.profileId = ranked[0].profile.id;
          $('#profileSelect').value = state.profileId;
          applyProfileDefaults();
          toast(`Profil suggéré : ${ranked[0].profile.label}.`);
        }
      }
    }
    refreshImport();
    toast(`${file.name} chargé. Vérifiez le profil puis continuez.`);
  } catch (error) {
    console.error(error);
    chip.textContent = `❌ ${file.name}`;
    toast(`Lecture impossible : ${error.message}. Pour Excel sans connexion, convertissez en CSV.`);
  }
}

function quickParse() {
  const isPerfecto = getProfile(state.profileId).sectionParser === 'perfecto';
  if (state.workbook) {
    const matrix = workbookToMatrix(state.workbook, state.sheetName).filter((row) => row.some((c) => c !== ''));
    if (isPerfecto) {
      const extracted = extractPerfectoSections(matrix);
      return { headers: extracted.headers, rows: extracted.rows, delimiter: '\t', perfecto: extracted };
    }
    const skip = Number($('#srcSkipRows').value) || 0;
    const sliced = matrix.slice(skip);
    if (!sliced.length) return { headers: [], rows: [] };
    if ($('#srcHasHeader').checked) return { headers: sliced[0], rows: sliced.slice(1) };
    return { headers: sliced[0].map((_, i) => `Colonne ${i + 1}`), rows: sliced };
  }
  if (isPerfecto) {
    const extracted = parsePerfectoText(state.rawText);
    return { headers: extracted.headers, rows: extracted.rows, delimiter: extracted.delimiter, perfecto: extracted };
  }
  const delimiterChoice = $('#srcDelimiter').value;
  return parseDelimitedText(state.rawText, {
    delimiter: delimiterChoice === 'auto' ? null : delimiterChoice,
    hasHeader: $('#srcHasHeader').checked,
    skipRows: Number($('#srcSkipRows').value) || 0
  });
}

function refreshImport() {
  if (!state.fileName && !state.rawText && !state.workbook) return;
  const parsed = quickParse();
  state.parsed = { headers: parsed.headers || [], rows: parsed.rows || [], delimiter: parsed.delimiter || ';' };
  state.mapping = autoMapHeaders(state.parsed.headers, state.profileId);
  // Compléments : si "N° pièce" sert aussi de référence, le recopier.
  if (state.mapping.pieceRef < 0 && state.mapping.entryNum >= 0) state.mapping.pieceRef = state.mapping.entryNum;

  const stats = $('#importStats');
  const delimiterLabel = { '\t': 'tabulation', ';': 'point-virgule', ',': 'virgule', '|': 'barre verticale' }[state.parsed.delimiter] || state.parsed.delimiter;
  const perfectoNote = parsed.perfecto ? `<div class="notice notice-blue"><span class="icon">ℹ</span><div><strong>Journal PERFECTO détecté :</strong> ${parsed.perfecto.journals.length} code(s) — ${escapeHtml(parsed.perfecto.journals.map((j) => `${j.code} (${j.lines})`).join(' · '))}. ${parsed.perfecto.skipped.length} ligne(s) de titre/total ignorée(s). Les deux colonnes virtuelles <span class="mono">Journal</span> et <span class="mono">Libellé journal</span> sont ajoutées automatiquement.</div></div>` : '';
  stats.innerHTML = state.parsed.rows.length ? `
    <div class="stats">
      <div class="stat"><small>COLONNES</small><strong>${state.parsed.headers.length}</strong></div>
      <div class="stat"><small>LIGNES DE DONNÉES</small><strong>${state.parsed.rows.length.toLocaleString('fr-FR')}</strong></div>
      <div class="stat"><small>SÉPARATEUR</small><strong style="font-size:14px">${delimiterLabel}</strong></div>
      <div class="stat"><small>PROFIL</small><strong style="font-size:14px">${getProfile(state.profileId).label}</strong></div>
    </div>
    ${perfectoNote}
    <div class="table-wrap"><table><thead><tr>${state.parsed.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${state.parsed.rows.slice(0, 5).map((row) => `<tr>${state.parsed.headers.map((_, i) => `<td>${escapeHtml(row[i] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="field-help">Aperçu des 5 premières lignes. Le mapping complet se règle à l'étape 3.</p>` : `
    <div class="notice notice-red"><span class="icon">×</span><div><strong>Aucune ligne de données.</strong> Vérifiez le séparateur, l'encodage et le nombre de lignes à ignorer.</div></div>`;
  $('#toMapping').disabled = !state.parsed.rows.length;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[c]));
}

// ---------------------------------------------------------------------------
// Étape 3 : mapping
// ---------------------------------------------------------------------------

const BALANCE_TARGETS = new Set(['accountNum', 'accountLabel', 'debit', 'credit', 'amount']);

function mappingTargets() {
  if (!state.isBalance) return MAPPING_TARGETS;
  return MAPPING_TARGETS.filter((t) => BALANCE_TARGETS.has(t.id));
}

function exampleForColumn(index) {
  if (index < 0) return '—';
  const found = state.parsed.rows.map((row) => row[index]).find((v) => String(v ?? '').trim() !== '');
  return found !== undefined ? String(found).slice(0, 40) : '—';
}

function renderMapping() {
  if (!state.parsed.rows.length) {
    $('#mappingRows').innerHTML = '<tr><td colspan="4">Importez d’abord un fichier (étape 2).</td></tr>';
    return;
  }
  const targets = mappingTargets();
  $('#mappingRows').innerHTML = targets.map((target) => {
    const current = state.mapping[target.id] ?? -1;
    const options = [`<option value="-1">— Non mappée —</option>`,
      ...state.parsed.headers.map((header, i) => `<option value="${i}" ${i === current ? 'selected' : ''}>${escapeHtml(header)}</option>`)].join('');
    const required = target.required ? '<span class="mapping-req">● Oui</span>' : '<span style="color:#94a3b8">Non</span>';
    const status = current >= 0 ? '<span class="mapping-ok">✓</span>' : (target.required ? '<span class="mapping-req">✗</span>' : '<span style="color:#94a3b8">○</span>');
    return `<tr><td><strong>${escapeHtml(target.label)}</strong> ${status}</td><td>${required}</td>
      <td><select data-mapping="${target.id}">${options}</select></td>
      <td class="mono">${escapeHtml(exampleForColumn(current))}</td></tr>`;
  }).join('');

  $$('#mappingRows select[data-mapping]').forEach((select) => {
    select.addEventListener('change', () => {
      state.mapping[select.dataset.mapping] = Number(select.value);
      renderMapping();
    });
  });
  renderPreview();
}

function currentParseOptions() {
  return { dateOrder: $('#srcDateOrder').value, decimal: $('#srcDecimal').value };
}

function renderPreview() {
  const ctx = context();
  let lines = [];
  let issues = [];
  if (state.isBalance) {
    ({ lines, issues } = balanceRowsToInternalLines(state.parsed.rows, state.mapping, {
      date: ctx.exerciseStart, decimal: currentParseOptions().decimal
    }));
  } else {
    ({ lines, issues } = buildInternalLines(state.parsed.rows, state.mapping, currentParseOptions()));
  }
  state.internal = { lines, issues };

  const missingRequired = mappingTargets()
    .filter((t) => t.required && (state.mapping[t.id] ?? -1) < 0 && !(state.isBalance && t.id !== 'accountNum'))
    .map((t) => t.label);
  const requiredForBalance = state.isBalance && (state.mapping.accountNum ?? -1) < 0;

  $('#mappingStats').innerHTML = `
    <div class="stats">
      <div class="stat"><small>LIGNES INTERPRÉTÉES</small><strong>${lines.length.toLocaleString('fr-FR')}</strong></div>
      <div class="stat"><small>ANOMALIES DE LECTURE</small><strong>${issues.length}</strong></div>
      <div class="stat"><small>CHAMPS OBLIGATOIRES</small><strong style="font-size:13px">${missingRequired.length || requiredForBalance ? '⚠ À compléter' : '✓ Mappés'}</strong></div>
    </div>
    ${missingRequired.length && !state.isBalance ? `<div class="notice notice-amber"><span class="icon">!</span><div><strong>Champs obligatoires non mappés :</strong> ${missingRequired.map(escapeHtml).join(', ')}.</div></div>` : ''}
    ${requiredForBalance ? `<div class="notice notice-red"><span class="icon">×</span><div><strong>Mappez au minimum le N° de compte</strong> pour interpréter la balance.</div></div>` : ''}
    ${issues.slice(0, 5).map((issue) => `<div class="notice notice-amber"><span class="icon">!</span><div>${escapeHtml(issue.message)}</div></div>`).join('')}
    ${issues.length > 5 ? `<p class="field-help">… et ${issues.length - 5} autre(s) anomalie(s) de lecture.</p>` : ''}`;

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  $('#previewRows').innerHTML = lines.slice(0, 20).map((line) => `<tr>
    <td class="mono">${line.__row}</td><td><strong>${escapeHtml(line.journalCode)}</strong></td>
    <td class="mono">${escapeHtml(line.entryDate || '⚠ ' + (line.entryDateRaw || 'vide'))}</td>
    <td class="mono">${escapeHtml(line.accountNum)}</td><td>${escapeHtml(line.pieceRef)}</td>
    <td>${escapeHtml(String(line.entryLabel).slice(0, 60))}</td>
    <td class="align-right mono">${fmt(line.debit)}</td><td class="align-right mono">${fmt(line.credit)}</td></tr>`).join('')
    || '<tr><td colspan="8">Aucune ligne interprétée.</td></tr>';
}

// ---------------------------------------------------------------------------
// Étape 4 : contrôles
// ---------------------------------------------------------------------------

function runControls() {
  renderPreview();
  const ctx = context();
  const { lines } = state.internal;
  const summary = $('#controlSummary');
  const details = $('#controlDetails');

  if (!lines.length) {
    summary.innerHTML = '<div class="notice notice-red"><span class="icon">×</span><div><strong>Aucune ligne à contrôler.</strong> Retournez au mapping.</div></div>';
    details.innerHTML = '';
    $('#toGeneration').disabled = true;
    return;
  }

  const prepared = prepareFecFromLines(lines, {
    regime: ctx.regime,
    startDate: ctx.exerciseStart,
    endDate: ctx.exerciseEnd,
    autoSequence: ctx.autoSequence,
    validDateFallback: ctx.validFallback,
    pieceRefFallback: true,
    pieceDateFallback: true,
    excludeCentralisation: ctx.excludeCentral,
    groupBySourceNum: ctx.groupSourceNum
  });
  state.prepared = prepared;

  // Validation du texte final (tous les découpages).
  const chunks = splitRecords(prepared, ctx.maxLines);
  state.validations = chunks.map((chunk) => validateFecText(buildFecText(chunk, { delimiter: ctx.outDelimiter }), {
    regime: ctx.regime, delimiter: ctx.outDelimiter
  }));
  const allErrors = [...prepared.errors, ...state.validations.flatMap((v) => v.errors)];
  const allWarnings = [...prepared.warnings, ...state.validations.flatMap((v) => v.warnings)];
  const blocked = ctx.mode === 'OFFICIAL' ? allErrors.length > 0 : false;

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fileBase = fecFileBaseName(ctx.ifu, ctx.exerciseEnd);
  summary.innerHTML = `
    ${ctx.mode === 'DIAGNOSTIC' ? '<div class="notice notice-amber"><span class="icon">!</span><div><strong>Mode diagnostic provisoire.</strong> La sortie générée sera marquée <strong>non transmissible</strong> (préfixe <span class="mono">DIAGNOSTIC-</span>). Corrigez les anomalies puis régénérez en mode officiel.</div></div>' : ''}
    ${state.isBalance ? '<div class="notice notice-amber"><span class="icon">!</span><div><strong>Source = balance seule.</strong> Seule une écriture de reports (<span class="mono">AN</span> / <span class="mono">REPORT</span>) peut être produite. Pour un FEC officiel complet, importez le grand livre détaillé.</div></div>' : ''}
    <div class="stats">
      <div class="stat"><small>ÉCRITURES</small><strong>${prepared.entryCount.toLocaleString('fr-FR')}</strong></div>
      <div class="stat"><small>LIGNES FEC</small><strong>${prepared.lineCount.toLocaleString('fr-FR')}</strong></div>
      <div class="stat"><small>TOTAL DÉBIT</small><strong>${fmt(prepared.totalDebit)} <em>FCFA</em></strong></div>
      <div class="stat"><small>TOTAL CRÉDIT</small><strong>${fmt(prepared.totalCredit)} <em>FCFA</em></strong></div>
      <div class="stat"><small>ERREURS</small><strong style="color:${allErrors.length ? 'var(--red-700)' : 'var(--green-700)'}">${allErrors.length}</strong></div>
      <div class="stat"><small>AVERTISSEMENTS</small><strong>${allWarnings.length}</strong></div>
      <div class="stat"><small>EXCLUES (CENTRAL.)</small><strong>${prepared.excluded.length}</strong></div>
      <div class="stat"><small>FICHIERS</small><strong>${chunks.length}</strong></div>
    </div>
    <p class="field-help">Fichier de base : <span class="mono">${fileBase}.txt</span> — ${prepared.fields.length} champs — ${ctx.outEncoding} — ${ctx.outDelimiter === '\t' ? 'tabulation' : 'point-virgule'} — CRLF.</p>
    ${blocked
      ? '<div class="notice notice-red"><span class="icon">×</span><div><strong>Génération bloquée.</strong> Corrigez les erreurs dans le logiciel source (ou le mapping), puis relancez le contrôle. En mode officiel, un FEC ne peut pas être généré avec des erreurs.</div></div>'
      : '<div class="notice notice-green"><span class="icon">✓</span><div><strong>Prêt pour génération.</strong> Le fichier FEC, le descriptif, le rapport et le paquet ZIP scellé peuvent être produits.</div></div>'}`;

  const renderIssues = (issues, kind) => issues.slice(0, 60).map((issue) =>
    `<li class="issue-${kind}"><span class="issue-code">${escapeHtml(issue.code || (kind === 'error' ? 'ERREUR' : 'ALERTE'))}</span><span>${escapeHtml(issue.message)}</span></li>`).join('');

  details.innerHTML = `
    ${allErrors.length ? `<h3>❌ Erreurs bloquantes (${allErrors.length})</h3><ul class="issue-list">${renderIssues(allErrors, 'error')}</ul>${allErrors.length > 60 ? `<p class="field-help">… ${allErrors.length - 60} erreur(s) supplémentaire(s) — voir le rapport complet après génération.</p>` : ''}` : ''}
    ${allWarnings.length ? `<h3>⚠️ Avertissements (${allWarnings.length})</h3><ul class="issue-list">${renderIssues(allWarnings, 'warning')}</ul>` : ''}
    ${prepared.excluded.length ? `<h3>➖ Lignes exclues (${prepared.excluded.length})</h3><p class="field-help">Centralisations exclues du FEC conformément à l'arrêté : ${prepared.excluded.slice(0, 8).map((e) => escapeHtml(e.label || `ligne ${e.row}`)).join(' · ')}${prepared.excluded.length > 8 ? '…' : ''}</p>` : ''}`;

  $('#toGeneration').disabled = blocked;
  if (!blocked && chunks.length) {
    // Prépare déjà la génération pour l'étape 5.
    void buildOutputs();
  }
}

// ---------------------------------------------------------------------------
// Étape 5 : génération
// ---------------------------------------------------------------------------

function downloadBytes(bytes, fileName, mime = 'text/plain') {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function fileMime(file) {
  if (file.kind === 'zip') return 'application/zip';
  if (String(file.name).endsWith('.csv')) return 'text/csv';
  return 'text/plain';
}

/** Ouvre le fichier dans un nouvel onglet (sauvegarde via Ctrl+S). */
function openInNewTab(file) {
  try {
    const blob = new Blob([file.bytes], { type: fileMime(file) });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, '_blank', 'noopener');
    window.setTimeout(() => URL.revokeObjectURL(url), 120000);
    if (!opened) toast('Ouverture bloquée : utilisez « Voir & copier » puis enregistrez le contenu.');
    else toast(`${file.name} ouvert : enregistrez-le via Ctrl+S.`);
  } catch {
    toast('Ouverture impossible : utilisez « Voir & copier ».');
  }
}

// ---------------------------------------------------------------------------
// Fenêtre « Voir & copier » (secours si téléchargements bloqués)
// ---------------------------------------------------------------------------

let modalFile = null;

function openFileModal(file) {
  modalFile = file;
  $('#fileModalTitle').textContent = file.name;
  $('#fileModalMeta').textContent = `${(file.bytes.length / 1024).toFixed(1)} Ko${file.sha256 ? ` · SHA-256 ${file.sha256.slice(0, 32)}…` : ''}`;
  $('#fileModalContent').value = file.text || '';
  $('#fileModalBackdrop').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeFileModal() {
  $('#fileModalBackdrop').hidden = true;
  document.body.style.overflow = '';
  modalFile = null;
}

async function copyModalContent() {
  const area = $('#fileModalContent');
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(area.value);
    } else {
      area.focus();
      area.select();
      if (!document.execCommand('copy')) throw new Error('copy');
    }
    toast('Contenu copié. Collez-le dans le Bloc-notes et enregistrez sous le nom indiqué.');
  } catch {
    area.focus();
    area.select();
    toast('Copie automatique impossible : texte sélectionné, faites Ctrl+C.');
  }
}

function initFileModal() {
  $('#fileModalClose').addEventListener('click', closeFileModal);
  $('#fileModalBackdrop').addEventListener('click', (event) => {
    if (event.target.id === 'fileModalBackdrop') closeFileModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('#fileModalBackdrop').hidden) closeFileModal();
  });
  $('#fileModalSelect').addEventListener('click', () => {
    const area = $('#fileModalContent');
    area.focus();
    area.select();
  });
  $('#fileModalCopy').addEventListener('click', copyModalContent);
  $('#fileModalDownload').addEventListener('click', () => {
    if (!modalFile) return;
    downloadBytes(modalFile.bytes, modalFile.name, fileMime(modalFile));
    toast(`${modalFile.name} : téléchargement lancé (sinon utilisez Copier).`);
  });
}

async function buildOutputs() {
  const ctx = context();
  const prepared = state.prepared;
  if (!prepared) return;
  const diagnostic = ctx.mode === 'DIAGNOSTIC';
  const base = (diagnostic ? 'DIAGNOSTIC-' : '') + fecFileBaseName(ctx.ifu, ctx.exerciseEnd);
  const chunks = splitRecords(prepared, ctx.maxLines);
  const suffix = (index) => (chunks.length > 1 ? `_${index + 1}` : '');

  const files = [];
  chunks.forEach((chunk, index) => {
    const name = `${base}${suffix(index)}.txt`;
    files.push({ name, kind: 'FEC', text: buildFecText(chunk, { delimiter: ctx.outDelimiter }) });
  });
  const firstValidation = state.validations[0] || null;
  files.push({ name: `${base}.notice.txt`, kind: 'notice', text: buildNoticeText(prepared, { delimiter: ctx.outDelimiter, encoding: ctx.outEncoding }) });
  files.push({
    name: `${base}.rapport.txt`, kind: 'rapport',
    text: buildReportText({
      prepared, validation: firstValidation,
      companyName: ctx.companyName, ifu: ctx.ifu,
      mode: `${diagnostic ? 'DIAGNOSTIC PROVISOIRE — NON TRANSMISSIBLE' : 'FEC OFFICIEL'} · ${ctx.regime === 'SMT' ? 'SMT (21 champs)' : 'Système normal (18 champs)'}`,
      fileBase: base, sourceFile: state.fileName, profileLabel: getProfile(state.profileId).label
    })
  });

  // Encodage + empreintes.
  const encoded = files.map((file) => ({ ...file, bytes: encodeFecBytes(file.text, ctx.outEncoding) }));
  for (const file of encoded) file.sha256 = await sha256Hex(file.bytes);
  const manifestText = buildManifestText(encoded, { fileBase: base });
  const manifestBytes = encodeFecBytes(manifestText, ctx.outEncoding);
  const manifest = { name: `${base}.manifest.txt`, kind: 'manifeste', text: manifestText, bytes: manifestBytes, sha256: await sha256Hex(manifestBytes) };
  const allFiles = [...encoded, manifest];
  const zipBytes = createZipArchive(allFiles.map((f) => ({ name: f.name, bytes: f.bytes })));
  const zip = { name: `${base}.zip`, kind: 'zip', bytes: zipBytes, sha256: await sha256Hex(zipBytes) };

  state.outputs = [...allFiles, zip];
  state.packageHash = zip.sha256;
  renderOutputs();
}

function renderOutputs() {
  const ctx = context();
  const container = $('#generationResult');
  if (!state.outputs.length) {
    container.innerHTML = '<div class="notice notice-amber"><span class="icon">…</span><div>Préparation des fichiers…</div></div>';
    return;
  }
  const diagnostic = ctx.mode === 'DIAGNOSTIC';
  const zip = state.outputs.find((f) => f.kind === 'zip');
  container.innerHTML = `
    ${diagnostic
      ? '<div class="notice notice-red"><span class="icon">×</span><div><strong>Sortie de diagnostic — NON TRANSMISSIBLE.</strong> Ne remettez pas ces fichiers à la DGI. Corrigez les anomalies et régénérez en mode officiel.</div></div>'
      : '<div class="notice notice-green"><span class="icon">✓</span><div><strong>FEC officiel prêt.</strong> Vérifiez le rapport, conservez le paquet scellé et faites relire la sortie par votre cabinet avant toute remise à la DGI.</div></div>'}
    <div class="notice notice-blue"><span class="icon">i</span><div><strong>Téléchargement bloqué ?</strong> Certains navigateurs ou aperçus intégrés bloquent les téléchargements automatiques. Utilisez <strong>« 👁 Voir &amp; copier »</strong> sur chaque fichier texte, puis collez dans le Bloc-notes et enregistrez avec le nom exact. Pour le ZIP, essayez <strong>« ↗ Ouvrir »</strong> (puis Ctrl+S) — sinon récupérez les fichiers TXT un par un, le ZIP n'en est que le regroupement.</div></div>
    <div class="file-list">
      ${state.outputs.map((file) => `
        <div class="file-row">
          <div class="meta"><span class="file-icon ${file.kind === 'zip' ? 'zip' : file.kind === 'FEC' ? '' : 'doc'}">${file.kind === 'zip' ? 'ZIP' : file.kind === 'FEC' ? 'FEC' : 'TXT'}</span>
          <div><code>${escapeHtml(file.name)}</code><small>${(file.bytes.length / 1024).toFixed(1)} Ko · SHA-256 <span class="mono">${file.sha256.slice(0, 16)}…</span></small></div></div>
          <div class="actions" style="margin-top:0">
            ${file.kind === 'zip'
              ? `<button class="button button-small" type="button" data-opentab="${escapeHtml(file.name)}">↗ Ouvrir</button>`
              : `<button class="button button-small" type="button" data-view="${escapeHtml(file.name)}">👁 Voir &amp; copier</button>
                 <button class="button button-small" type="button" data-opentab="${escapeHtml(file.name)}">↗ Ouvrir</button>`}
            <button class="button button-small ${file.kind === 'zip' ? 'button-primary' : ''}" type="button" data-download="${escapeHtml(file.name)}">⬇ Télécharger</button>
          </div>
        </div>`).join('')}
    </div>
    <p class="field-help">Empreinte du paquet : <span class="mono">${state.packageHash}</span> — toute modification d'un fichier est détectable en recalculant les empreintes. Champs : ${state.prepared.fields.length} · Écritures : ${state.prepared.entryCount.toLocaleString('fr-FR')} · Lignes : ${state.prepared.lineCount.toLocaleString('fr-FR')}.</p>
    <div class="actions"><button class="button button-primary" type="button" data-download="${escapeHtml(zip.name)}">⬇ Télécharger le paquet ZIP scellé</button></div>`;

  $$('#generationResult [data-download]').forEach((button) => {
    button.addEventListener('click', () => {
      const file = state.outputs.find((f) => f.name === button.dataset.download);
      if (!file) return;
      downloadBytes(file.bytes, file.name, fileMime(file));
      toast(file.kind === 'zip'
        ? `${file.name} : téléchargement lancé. Si rien ne se passe, essayez « Ouvrir » ou récupérez les TXT un par un.`
        : `${file.name} : téléchargement lancé. Si rien ne se passe, utilisez « Voir & copier ».`);
    });
  });
  $$('#generationResult [data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const file = state.outputs.find((f) => f.name === button.dataset.view);
      if (file) openFileModal(file);
    });
  });
  $$('#generationResult [data-opentab]').forEach((button) => {
    button.addEventListener('click', () => {
      const file = state.outputs.find((f) => f.name === button.dataset.opentab);
      if (file) openInNewTab(file);
    });
  });
}

// ---------------------------------------------------------------------------
// Exemples + modèle
// ---------------------------------------------------------------------------

async function loadExample(path, profileId, fileName) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Exemple indisponible');
    state.rawText = await response.text();
    state.workbook = null;
    state.fileName = fileName;
    state.profileId = profileId;
    state.profileTouched = true;
    $('#profileSelect').value = profileId;
    applyProfileDefaults();
    const chip = $('#fileChip');
    chip.hidden = false;
    chip.textContent = `📄 ${fileName} (exemple)`;
    refreshImport();
    showStep(2);
    toast(`Exemple chargé : ${fileName}.`);
  } catch (error) {
    toast(`Exemple indisponible : ${error.message}`);
  }
}

function initExamples() {
  $('#loadExampleSage').addEventListener('click', () => loadExample('exemples/sage100-ecritures.csv', 'sage100', 'sage100-ecritures.csv'));
  $('#loadExampleOdoo').addEventListener('click', () => loadExample('exemples/odoo-grand-livre.csv', 'odoo', 'odoo-grand-livre.csv'));
  $('#loadExampleBalance').addEventListener('click', () => loadExample('exemples/balance-ouverture.csv', 'balance', 'balance-ouverture.csv'));
  $('#loadExamplePerfecto').addEventListener('click', () => loadExample('exemples/perfecto-journal.txt', 'perfecto', 'perfecto-journal.txt'));
  $('#downloadTemplate').addEventListener('click', () => {
    const regime = $('#regime').value;
    const template = buildGenericTemplate(regime, { delimiter: ';' });
    openFileModal({
      name: `modele-fec-generique-${regime === 'SMT' ? '21' : '18'}-champs.csv`,
      kind: 'template',
      text: template,
      bytes: new TextEncoder().encode(template),
      sha256: ''
    });
  });
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

function initImportEvents() {
  const dropzone = $('#dropzone');
  const fileInput = $('#fileInput');
  dropzone.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    fileInput.click();
  });
  dropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener('change', () => handleFile(fileInput.files?.[0]));
  ['dragenter', 'dragover'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.add('is-dragging'); }));
  ['dragleave', 'drop'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.remove('is-dragging'); }));
  dropzone.addEventListener('drop', (event) => handleFile(event.dataTransfer.files?.[0]));

  ['srcDelimiter', 'srcDateOrder', 'srcDecimal', 'srcHasHeader', 'srcSkipRows', 'srcEncoding'].forEach((id) => {
    $(`#${id}`).addEventListener('change', () => {
      if (id === 'srcEncoding' && state.fileName && !state.workbook) {
        toast('Réimportez le fichier pour appliquer le nouvel encodage, ou rechargez la page.');
        return;
      }
      refreshImport();
    });
  });
  $('#sheetSelect').addEventListener('change', (event) => {
    state.sheetName = event.target.value;
    refreshImport();
  });
  $('#regime').addEventListener('change', () => {
    if (state.step >= 4 && state.internal.lines.length) runControls();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProfiles();
  initImportEvents();
  initExamples();
  initFileModal();
  showStep(1);
});
