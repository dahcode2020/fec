import { accountClass, addAccountToPlan, calculateStraightLinePlan, canDeleteCorrectionCandidate, classifyIntegratedEntry, createCorrectionWindow, createCsrSetup, createIntegratedJournal, createJournalEntry, createLocalWorkspaceStore, deleteCorrectionCandidate, depreciationEntry, exerciseYear, exportAccountPlanTxt, exportBalanceTxt, importAccountPlanRows, INTEGRATED_JOURNAL_CATEGORIES, makeDossierCode, MODULE_DEFINITIONS, normalizeAccountNumber, parseDelimited, registerCorrectionCandidate, suggestPosting, summarizeIntegratedJournal, syncIntegratedJournal, transitionOperation, updateAccountInPlan, validateJournalEntry, OPERATION_STATES } from './core.js';

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
  accountingSetups: {
    acacia: createCsrSetup({ companyId: 'acacia', regime: 'NORMAL' }),
    noria: createCsrSetup({ companyId: 'noria', regime: 'SMT' })
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
  ],
  correctionWindows: {
    acacia: createCorrectionWindow({ id: 'correction-acacia-25', dossierId: 'ACACIA-25', companyId: 'acacia', userId: 'claire-dossou', periodId: '2025-06' })
  },
  recentEntries: [
    { id: 'queue-1', companyId: 'acacia', dossierId: 'acacia-25', reference: 'SAI-0003', date: '2025-06-16', journalId: 'OD', label: 'Accompagnement administratif', amount: 250000, accountIds: ['411000', '706000'], status: OPERATION_STATES.TO_REVIEW },
    { id: 'queue-2', companyId: 'acacia', dossierId: 'acacia-25', reference: 'SAI-0002', date: '2025-06-15', journalId: 'AC', label: 'Fournitures de bureau', amount: 38500, accountIds: ['605000', '401000'], status: OPERATION_STATES.VALIDATED },
    { id: 'queue-3', companyId: 'acacia', dossierId: 'acacia-25', reference: 'SAI-0001', date: '2025-06-12', journalId: 'BQ', label: 'Frais de tenue de compte', amount: 4800, accountIds: ['627000', '512000'], status: OPERATION_STATES.VALIDATED }
  ],
  auditEvents: []
};

const appStore = createLocalWorkspaceStore({ key: 'fec.csr.vertical-slice.v1' });
const persistedStateKeys = ['activeCompany', 'selectedDossier', 'companies', 'accountingSetups', 'dossiers', 'integratedEntries', 'correctionWindows', 'recentEntries', 'auditEvents'];

function hydrateAppState() {
  const saved = appStore.load();
  if (!saved || saved.version !== 1) return;
  persistedStateKeys.forEach((key) => {
    if (saved[key] !== undefined) appState[key] = saved[key];
  });
  Object.keys(appState.companies).forEach((companyId) => {
    const defaults = createCsrSetup({ companyId });
    const existing = appState.accountingSetups?.[companyId];
    if (!existing) appState.accountingSetups[companyId] = defaults;
    else {
      existing.accounts = Array.from(new Map([...defaults.accounts, ...(existing.accounts || [])].map((account) => [account.id, account])).values());
      existing.journals = existing.journals?.length ? existing.journals : defaults.journals;
    }
  });
  if (!appState.correctionWindows) appState.correctionWindows = {};
  if (!appState.recentEntries) appState.recentEntries = [];
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
let fullPlanPayload = null;

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
  persistAppState();
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

function authenticate(event) {
  event.preventDefault();
  showDossiers();
}

function openView(viewName) {
  $$('.view').forEach((view) => view.classList.toggle('is-visible', view.dataset.viewPanel === viewName));
  $$('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.view === viewName));
  $$('.workspace-top-menu-item').forEach((item) => item.classList.toggle('is-active', item.dataset.view === viewName));
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
  const newSetup = createCsrSetup({ companyId: id, regime: 'NORMAL' });
  if (fullPlanPayload) newSetup.accounts = fullPlanPayload.accounts.map((account) => ({ ...account, nature: account.nature || 'À définir', active: account.active !== false, isCustom: false }));
  appState.accountingSetups[id] = newSetup;
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
  persistAppState();
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
let pendingAccountImport = null;

function currentAccountSetup() {
  const companyId = appState.activeCompany;
  if (!appState.accountingSetups[companyId]) appState.accountingSetups[companyId] = createCsrSetup({ companyId });
  return appState.accountingSetups[companyId];
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

function currentDossierCode(companyId = appState.activeCompany) {
  const dossier = appState.dossiers.find((item) => item.companyId === companyId && item.moduleId === 'CSR' && item.status !== 'Archivé') || appState.dossiers.find((item) => item.companyId === companyId && item.status !== 'Archivé');
  return dossier?.dossier || `${appState.companies[companyId]?.code || 'DOSSIER'}-25`;
}

function activeCorrectionWindow() {
  const companyId = appState.activeCompany;
  if (!appState.correctionWindows[companyId]) {
    appState.correctionWindows[companyId] = createCorrectionWindow({ dossierId: currentDossierCode(companyId), companyId, userId: 'claire-dossou', periodId: '2025-06' });
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
    const action = `<span class="entry-actions">${validateAction}${deleteAction}</span>`;
    const journalClass = entry.journalId === 'AC' ? 'journal-badge-blue' : entry.journalId === 'BQ' ? 'journal-badge-teal' : '';
    return `<tr><td>${escapeHtml(displayDate(entry.date))}</td><td><span class="journal-badge ${journalClass}">${escapeHtml(entry.journalId || 'OD')}</span> Saisie</td><td><span class="cell-title">${escapeHtml(entry.label)}</span><small class="cell-subtitle">${deletable ? 'Dans la fenêtre de correction' : 'Correction verrouillée'}</small></td><td class="align-right">${numberLabel(entry.amount)}</td><td>${escapeHtml(entry.accountIds?.join(' / ') || 'À compléter')}</td><td><span class="status ${statusClass}">${label}</span></td><td>${action}</td></tr>`;
  }).join('');
  if (!entries.length) rows.innerHTML = '<tr><td colspan="7" class="dossier-empty">Aucune saisie active dans ce dossier.</td></tr>';
}

function validateRecentEntry(entryId) {
  const entryIndex = appState.recentEntries.findIndex((item) => item.id === entryId && item.companyId === appState.activeCompany);
  if (entryIndex < 0) return;
  const entry = appState.recentEntries[entryIndex];
  if (entry.status !== OPERATION_STATES.TO_REVIEW) return;
  const validated = transitionOperation(entry, OPERATION_STATES.VALIDATED);
  appState.recentEntries[entryIndex] = validated;
  const integratedIndex = appState.integratedEntries.findIndex((item) => item.id === entryId && item.companyId === appState.activeCompany);
  if (integratedIndex >= 0) appState.integratedEntries[integratedIndex] = { ...appState.integratedEntries[integratedIndex], status: OPERATION_STATES.VALIDATED, validatedAt: validated.statusChangedAt };
  appState.auditEvents.push({ type: 'ENTRY_VALIDATED', companyId: entry.companyId, entryId, at: validated.statusChangedAt });
  persistAppState();
  renderEntryQueue();
  renderIntegratedJournal();
  renderCorrectionWindow();
  showToast('Écriture validée et verrouillée.');
}

function deleteRecentEntry(entryId) {
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
  appState.auditEvents.push({ type: 'CORRECTION_DELETE', companyId: entry.companyId, entryId, reason: result.entry.cancellationReason, at: result.entry.cancelledAt });
  appState.integratedEntries = appState.integratedEntries.filter((item) => item.id !== entryId);
  persistAppState();
  renderEntryQueue();
  renderCorrectionWindow();
  renderIntegratedJournal();
  showToast('Imputation supprimée. La trace reste conservée dans l’audit.');
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

function parseUiAmount(value) {
  const normalized = String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s/g, '').replace(',', '.');
  if (!normalized) return 0;
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

function openManualLineEditor() {
  let suggestion;
  try { suggestion = suggestPosting(entryOperation()); } catch { suggestion = { lines: [] }; }
  manualLineDraft = (suggestion.lines?.length ? suggestion.lines : [{ accountId: '', label: '', debit: 0, credit: 0 }, { accountId: '', label: '', debit: 0, credit: 0 }]).map((line) => ({ accountId: line.accountId || '', label: line.label || '', debit: line.debit || 0, credit: line.credit || 0 }));
  renderManualLineEditor();
  openModal('multiLineModal');
}

function applyManualLines() {
  const lines = normalizedManualLines();
  const setup = appState.accountingSetups[appState.activeCompany] || createCsrSetup({ companyId: appState.activeCompany });
  try {
    validateJournalEntry({ companyId: appState.activeCompany, journalId: $('#entryJournal').value, date: $('#entryDate').value, lines }, { companyId: appState.activeCompany, accountIds: setup.accounts.map((account) => account.id) });
    manualLineOverride = lines;
    closeModal();
    renderLivePosting();
    showToast(`${lines.length} lignes d’imputation prêtes à être contrôlées.`);
  } catch (error) { updateManualLineSummary(); showToast(error.message); }
}

function entryLinesForCurrentOperation(suggestion) {
  return manualLineOverride ? manualLineOverride : (suggestion.lines || []);
}

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

function selectEntryTab(tab) {
  manualLineOverride = null;
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
  manualLineOverride = null;
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
  const lines = entryLinesForCurrentOperation(suggestion);
  if (!lines.length) { showToast('Complétez l’imputation avant d’insérer l’écriture.'); return; }
  try {
    const dossierId = currentDossierCode(appState.activeCompany);
    const setup = appState.accountingSetups[appState.activeCompany] || createCsrSetup({ companyId: appState.activeCompany });
    appState.accountingSetups[appState.activeCompany] = setup;
    const entry = createJournalEntry({ companyId: appState.activeCompany, journalId: $('#entryJournal').value, date: $('#entryDate').value, reference: $('#entryReference').value, label: $('#entryLabel').value, lines }, { activeCompanyId: appState.activeCompany, dossierId, accountIds: setup.accounts.map((account) => account.id) });
    const workflowEntry = transitionOperation(transitionOperation(entry, OPERATION_STATES.IMPUTED), OPERATION_STATES.TO_REVIEW);
    const total = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const enteredAmount = parseUiAmount(operation.total);
    if (manualLineOverride && (!Number.isFinite(enteredAmount) || Math.abs(total - enteredAmount) > 0.005)) {
      showToast('Le total des lignes doit correspondre au montant de l’opération.');
      return;
    }
    const queueEntry = { ...workflowEntry, amount: total, accountIds: lines.map((line) => line.accountId) };
    const correctionWindow = activeCorrectionWindow();
    try {
      appState.correctionWindows[appState.activeCompany] = registerCorrectionCandidate(correctionWindow, queueEntry);
    } catch (windowError) {
      if (windowError.code !== 'CORRECTION_WINDOW_FULL') throw windowError;
    }
    appState.recentEntries.unshift(queueEntry);
    const syncedEntry = syncIntegratedJournal(integratedJournalForCompany(appState.activeCompany), { ...workflowEntry, amount: total, debit: total, credit: total, source: 'Saisie et insertion', integrationCategory: operation.category }).entries[0];
    appState.integratedEntries.unshift(syncedEntry);
    persistAppState();
    renderIntegratedJournal();
    renderEntryQueue();
    renderCorrectionWindow();
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
  if (action === 'accounts') openView('accounts');
  if (action === 'add-account') openAccountModal();
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
  const rows = editionPreviewRows(action, title);
  appState.editionPreview = { title, action, mode, rows, companyName: company.name };
  openModal('editionPreviewModal');
  $('#editionPreviewTitle').textContent = title;
  $('#editionPreviewCompany').textContent = company.name;
  $('#editionPreviewPeriod').textContent = 'Juin 2025';
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
  const rows = preview.rows.map((row) => [row.date, row.ref, row.label, row.debit || 0, row.credit || 0, row.status].map((cell) => String(cell).replace(/\t/g, ' ')).join('\t'));
  downloadText(`${preview.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-apercu.txt`, ['SOCIETE\t' + preview.companyName, 'EDITION\t' + preview.title, 'PERIODE\tJuin 2025', '', 'DATE\tREFERENCE\tLIBELLE\tDEBIT\tCREDIT\tETAT', ...rows].join('\r\n') + '\r\n');
  showToast('L’aperçu a été exporté en TXT.');
}

function handleEditionAction(action, title) {
  openEditionPreview(title, action);
}

function bindEvents() {
  $('#authForm')?.addEventListener('submit', authenticate);
  $('#entryForm')?.addEventListener('input', renderLivePosting);
  $('#entryForm')?.addEventListener('change', renderLivePosting);
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
      $$('.export-format').forEach((format) => format.classList.toggle('is-selected', format === exportFormat));
      return;
    }

    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (action === 'open-view') openView(actionTarget.dataset.view);
    if (action === 'focus-entry-amount') { openView('entry'); window.setTimeout(() => $('#entryAmount')?.focus(), 50); }
    if (action === 'show-calculator') openCalculator();
    if (action === 'capture-screen') captureScreen();
    if (action === 'show-shortcuts') showToast('Ctrl + Alt + S : capture · Ctrl + Alt + C : calculatrice.');
    if (action === 'clear-entry') clearEntry();
    if (action === 'insert-entry') insertEntry();
    if (action === 'apply-manual-lines') applyManualLines();
    if (action === 'delete-entry') deleteRecentEntry(actionTarget.dataset.entryId);
    if (action === 'validate-entry') validateRecentEntry(actionTarget.dataset.entryId);
    if (action === 'sync-integrated') synchronizeIntegratedJournal();
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
    if (action === 'forgot-password') showToast('La récupération du mot de passe sera ajoutée avec l’authentification réelle.');
    if (action === 'show-company-modal') openModal('companyModal');
    if (action === 'show-account-modal') openAccountModal();
    if (action === 'edit-account') openAccountModal(actionTarget.dataset.accountId);
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
  $('#accountForm')?.addEventListener('submit', saveAccount);
  $('#accountImportFile')?.addEventListener('change', (event) => parseAccountImportFile(event.target.files?.[0]));
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
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'c') { event.preventDefault(); openCalculator(); return; }
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') { event.preventDefault(); captureScreen(); return; }
    if ($('#calculatorModal') && !$('#calculatorModal').hasAttribute('hidden') && event.key === 'Enter') { event.preventDefault(); calculatorKey('='); return; }
    if (event.key === 'Escape') { closeModal(); $('#quickMenu')?.setAttribute('hidden', ''); $('#companyMenu')?.classList.remove('is-open'); }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  hydrateAppState();
  persistAppState();
  loadFullSyscohadaPlan();
  renderCompanyMenu();
  setActiveCompany(appState.activeCompany, false);
  buildExportPane();
  bindEvents();
  toggleOtherLegalForm();
  updateDossierPreview();
  renderFichierGroup('dossiers');
  renderConfigurationGroup('societe');
  renderEditionGroup('journaux');
  renderParameterGroup('dossier');
  renderToolGroup('rapides');
  renderLivePosting();
});
