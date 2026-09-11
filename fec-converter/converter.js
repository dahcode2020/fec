/**
 * Convertisseur FEC Bénin — moteur réutilisable (navigateur + Node).
 *
 * Référence : arrêté n° 1085/MEF/CAB/SGM/DGI/DLC/1355SGG20 du 23 avril 2020.
 * Transforme un export d'écritures (grand livre / journal / brouillard) ou une
 * balance d'ouverture en fichier FEC plat conforme (18 champs, 21 en SMT).
 *
 * 100 % local : aucune dépendance réseau. Les fonctions d'encodage et de ZIP
 * (méthode "stored", sans compression) sont embarquées.
 */

// ---------------------------------------------------------------------------
// Champs FEC réglementaires
// ---------------------------------------------------------------------------

export const FEC_FIELDS_NORMAL = Object.freeze([
  'CodeJournal', 'LibJournal', 'NumEcriture', 'DateEcriture',
  'NumCompte', 'LibCompte', 'NumCompteAux', 'LibCompteAux',
  'RefPiece', 'DatePiece', 'LibEcriture',
  'MontDebit', 'MontCredit', 'LetEcriture', 'DateLetEcriture',
  'DateValid', 'MontDevise', 'CodeDevise'
]);

export const FEC_FIELDS_SMT = Object.freeze([
  ...FEC_FIELDS_NORMAL, 'Date Règlement', 'Mode Règlement', 'NatOp'
]);

export const FEC_FIELD_DESCRIPTIONS = Object.freeze({
  CodeJournal: 'Code du journal de l’écriture comptable',
  LibJournal: 'Libellé du journal de l’écriture comptable',
  NumEcriture: 'Numéro séquentiel continu de l’écriture comptable',
  DateEcriture: 'Date de comptabilisation de l’écriture comptable',
  NumCompte: 'Numéro du compte (plan SYSCOHADA)',
  LibCompte: 'Libellé du compte (nomenclature SYSCOHADA)',
  NumCompteAux: 'Numéro du compte auxiliaire',
  LibCompteAux: 'Libellé du compte auxiliaire',
  RefPiece: 'Référence de la pièce justificative',
  DatePiece: 'Date de la pièce justificative',
  LibEcriture: 'Libellé de l’écriture comptable',
  MontDebit: 'Montant au débit',
  MontCredit: 'Montant au crédit',
  LetEcriture: 'Lettrage de l’écriture comptable',
  DateLetEcriture: 'Date de lettrage de l’écriture comptable',
  DateValid: 'Date de validation de l’écriture comptable',
  MontDevise: 'Montant en devise',
  CodeDevise: 'Code de la devise',
  'Date Règlement': 'Date de règlement (comptabilité de trésorerie / SMT)',
  'Mode Règlement': 'Mode de règlement (comptabilité de trésorerie / SMT)',
  NatOp: 'Nature de l’opération'
});

export const FEC_REQUIRED_FIELDS = Object.freeze(new Set([
  'CodeJournal', 'LibJournal', 'NumEcriture', 'DateEcriture',
  'NumCompte', 'LibCompte', 'RefPiece', 'DatePiece', 'LibEcriture',
  'MontDebit', 'MontCredit', 'DateValid'
]));

export const FEC_SMT_EXTRA_REQUIRED = Object.freeze(new Set(['Date Règlement', 'Mode Règlement']));

export function fecFieldsForRegime(regime) {
  return regime === 'SMT' ? [...FEC_FIELDS_SMT] : [...FEC_FIELDS_NORMAL];
}

export function fecRequiredForRegime(regime) {
  const required = new Set(FEC_REQUIRED_FIELDS);
  if (regime === 'SMT') FEC_SMT_EXTRA_REQUIRED.forEach((f) => required.add(f));
  return required;
}

// ---------------------------------------------------------------------------
// Référentiels SYSCOHADA embarqués (libellés de secours)
// ---------------------------------------------------------------------------

/** Libellés de journaux usuels (code normalisé -> libellé). */
export const DEFAULT_JOURNAL_LABELS = Object.freeze({
  AC: 'Achats', ACH: 'Achats', HA: 'Achats',
  VE: 'Ventes', VTE: 'Ventes', VT: 'Ventes',
  BQ: 'Banque', BQ1: 'Banque', BNQ: 'Banque',
  CA: 'Caisse', CAI: 'Caisse', CS: 'Caisse',
  OD: 'Opérations diverses', ODI: 'Opérations diverses', OD1: 'Opérations diverses',
  AN: 'À-nouveaux', RAN: 'Reports à nouveau', OUV: 'Ouverture',
  AM: 'Amortissements', AB: 'Abonnements', CT: 'Centralisations', RP: 'Résultat',
  PA: 'Paie', PAY: 'Paie', SA: 'Salaires'
});

/** Extrait du plan SYSCOHADA révisé pour compléter les libellés manquants. */
export const SYSCOHADA_LABELS = Object.freeze({
  101: 'Capital social', 105: 'Primes liées au capital', 106: 'Écarts de réévaluation',
  109: 'Actionnaires, capital souscrit non appelé', 111: 'Réserve légale', 118: 'Autres réserves',
  121: 'Report à nouveau créditeur', 129: 'Report à nouveau débiteur',
  131: 'Résultat net : bénéfice', 139: 'Résultat net : perte',
  141: 'Subventions d’équipement reçues', 148: 'Autres subventions d’investissement',
  161: 'Emprunts obligataires', 162: 'Emprunts et dettes auprès des établissements de crédit',
  166: 'Avances reçues et comptes courants bloqués', 171: 'Dettes de location-acquisition',
  173: 'Emprunts et dettes assortis de conditions particulières',
  181: 'Dettes de location-acquisition', 185: 'Emprunts et dettes divers',
  191: 'Provisions pour risques', 194: 'Provisions pour charges', 197: 'Provisions réglementées',
  201: 'Frais immobilisés', 205: 'Concours et primes de développement immobilisés',
  211: 'Frais de recherche', 213: 'Logiciels, sites internet', 215: 'Brevets, licences, logiciels',
  216: 'Fonds commercial', 217: 'Investissements de création', 218: 'Autres frais immobilisés',
  221: 'Terrains agricoles', 222: 'Terrains nus', 223: 'Terrains bâtis',
  224: 'Travaux de mise en valeur des terrains', 225: 'Terrains d’immeubles',
  231: 'Bâtiments industriels', 232: 'Bâtiments administratifs et commerciaux', 233: 'Ouvrages d’infrastructure',
  234: 'Installations techniques', 235: 'Aménagements de bureaux',
  241: 'Matériel et mobilier', 242: 'Matériel de transport', 243: 'Matériel de bureau',
  244: 'Matériel informatique', 245: 'Matériel et mobilier de bureau',
  251: 'Avances et acomptes versés sur immobilisations', 261: 'Titres de participation',
  271: 'Prêts et créances non commerciaux', 275: 'Dépôts et cautionnements versés',
  281: 'Amortissements des frais immobilisés', 282: 'Amortissements des terrains',
  283: 'Amortissements des bâtiments', 284: 'Amortissements du matériel et mobilier',
  2844: 'Amortissements du matériel et mobilier', 285: 'Amortissements des avances',
  291: 'Dépréciations des immobilisations incorporelles', 292: 'Dépréciations des terrains',
  293: 'Dépréciations des bâtiments', 294: 'Dépréciations du matériel',
  311: 'Marchandises', 312: 'Marchandises (inventaire permanent)', 321: 'Matières premières',
  322: 'Matières consommables', 323: 'Emballages', 331: 'Produits en cours',
  341: 'Produits intermédiaires', 351: 'Produits finis', 361: 'Produits résiduels',
  381: 'Marchandises en cours de route', 391: 'Dépréciations des stocks',
  401: 'Fournisseurs', 4011: 'Fournisseurs', 402: 'Fournisseurs d’immobilisations',
  408: 'Fournisseurs, factures non parvenues', 409: 'Fournisseurs débiteurs',
  411: 'Clients', 4111: 'Clients', 412: 'Clients, effets à recevoir',
  416: 'Créances douteuses', 418: 'Clients, factures à établir', 419: 'Clients créditeurs',
  421: 'Personnel, avances et acomptes', 422: 'Personnel, rémunérations dues',
  423: 'Personnel, oppositions, saisies-arrêts', 424: 'Personnel, œuvres sociales',
  431: 'Sécurité sociale', 433: 'Autres organismes sociaux', 437: 'Autres organismes sociaux',
  441: 'État, impôt sur les bénéfices', 442: 'État, autres impôts et taxes',
  443: 'État, TVA facturée', 4431: 'TVA facturée sur ventes', 444: 'État, TVA due',
  445: 'État, TVA récupérable', 4452: 'TVA récupérable sur achats', 446: 'État, TVA à régulariser',
  447: 'État, retenues à la source', 448: 'État, charges à payer et produits à recevoir',
  449: 'État, créances et dettes diverses',
  451: 'Organismes internationaux', 458: 'Associés, comptes courants',
  461: 'Associés, opérations sur le capital', 462: 'Associés, versements reçus sur augmentation de capital',
  465: 'Associés, dividendes à payer', 471: 'Débiteurs divers', 472: 'Créditeurs divers',
  473: 'Dépôts et cautionnements reçus', 475: 'Créances sur travaux non encore facturables',
  476: 'Charges constatées d’avance', 477: 'Produits constatés d’avance',
  478: 'Écarts de conversion - Actif', 479: 'Écarts de conversion - Passif',
  481: 'Fournisseurs d’investissements', 485: 'Créances sur cessions d’immobilisations',
  491: 'Dépréciations des comptes de clients', 492: 'Dépréciations des comptes de personnel',
  493: 'Dépréciations des comptes d’organismes sociaux', 494: 'Dépréciations des comptes de l’État',
  495: 'Dépréciations des comptes d’associés', 496: 'Dépréciations des comptes de débiteurs divers',
  499: 'Risques provisionnés à court terme',
  501: 'Titres de placement', 502: 'Actions propres', 503: 'Échéances à moins d’un an',
  511: 'Valeurs à l’encaissement', 512: 'Banques locales', 521: 'Banques locales',
  5211: 'Banque locale', 522: 'Banques, dépôts à terme', 526: 'Banques, crédits d’escompte',
  527: 'Banques, crédits de trésorerie', 528: 'Banques, découverts',
  531: 'Chèques postaux', 532: 'Trésor', 541: 'Régies d’avances et accréditifs',
  561: 'Crédits d’escompte', 571: 'Caisse', 5711: 'Caisse en monnaie nationale',
  572: 'Caisse, timbres', 581: 'Virements internes', 591: 'Dépréciations des titres de placement',
  601: 'Achats de marchandises', 6011: 'Achats de marchandises dans la Région',
  6012: 'Achats de marchandises hors Région', 602: 'Achats de matières premières',
  604: 'Achats stockés de matières et fournitures consommables', 6041: 'Matières consommables',
  6047: 'Fournitures de bureau', 605: 'Autres achats', 608: 'Achats d’emballages',
  611: 'Transports sur achats', 612: 'Transports sur ventes', 613: 'Transports pour le compte de tiers',
  621: 'Transports sur achats', 622: 'Transports sur ventes', 623: 'Redevances de crédit-bail',
  624: 'Transports du personnel', 625: 'Transports de plis', 626: 'Frais postaux et de télécommunications',
  627: 'Frais bancaires', 628: 'Autres charges externes', 6281: 'Frais de téléphone',
  6288: 'Autres charges externes diverses', 631: 'Impôts et taxes directs', 6318: 'Autres frais bancaires',
  632: 'Impôts et taxes indirects', 633: 'Droits d’enregistrement', 634: 'Taxes sur les véhicules',
  635: 'Taxes sur les salaires', 641: 'Impôts et taxes directs', 646: 'Droits de douane',
  651: 'Pertes sur créances clients', 658: 'Charges diverses', 659: 'Charges pour dépréciations à court terme',
  661: 'Salaires et appointements', 662: 'Primes et gratifications', 664: 'Charges sociales sur rémunérations',
  666: 'Charges sociales du personnel national', 667: 'Charges sociales du personnel non national',
  671: 'Intérêts dans les loyers de location-acquisition', 672: 'Intérêts dans les loyers de crédit-bail',
  674: 'Autres intérêts', 676: 'Pertes de change', 677: 'Pertes sur cessions de titres de placement',
  678: 'Pertes sur risques financiers', 681: 'Dotations aux amortissements d’exploitation',
  6813: 'Dotations aux amortissements des immobilisations corporelles',
  691: 'Dotations aux provisions d’exploitation', 695: 'Dotations aux provisions financières',
  701: 'Ventes de marchandises', 702: 'Ventes de produits finis', 703: 'Ventes de produits intermédiaires',
  704: 'Ventes de produits résiduels', 705: 'Travaux facturés', 706: 'Services vendus',
  7061: 'Services vendus dans la Région', 707: 'Ventes d’accessoires', 711: 'Transports sur ventes',
  712: 'Transports pour le compte de tiers', 713: 'Transports du personnel',
  721: 'Production immobilisée', 722: 'Production stockée', 726: 'Production immobilisée - immobilisations incorporelles',
  SUBVENTIONS: 'Subventions reçues',
  771: 'Intérêts de prêts', 772: 'Revenus de participations', 776: 'Gains de change',
  781: 'Reprises de provisions d’exploitation', 786: 'Reprises de provisions financières',
  791: 'Reprises de provisions pour risques', 797: 'Reprises de subventions d’investissement',
  801: 'Valeur comptable des cessions d’immobilisations', 811: 'Valeur comptable des cessions d’immobilisations incorporelles',
  812: 'Valeur comptable des cessions d’immobilisations corporelles',
  821: 'Produits des cessions d’immobilisations', 831: 'Charges HAO constatées',
  841: 'Produits HAO constatés', 851: 'Dotations HAO', 861: 'Reprises HAO',
  871: 'Subventions d’équilibre reçues', 881: 'Subventions d’équilibre accordées',
  891: 'Impôts sur les bénéfices de l’exercice', 8911: 'Impôts sur les bénéfices de l’exercice — activités dans l’État',
  895: 'Impôt minimum forfaitaire', 899: 'Autres impôts sur le résultat'
});

export function journalLabelFor(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (DEFAULT_JOURNAL_LABELS[normalized]) return DEFAULT_JOURNAL_LABELS[normalized];
  return '';
}

export function accountLabelFor(accountNum) {
  const normalized = String(accountNum || '').trim();
  if (SYSCOHADA_LABELS[normalized]) return SYSCOHADA_LABELS[normalized];
  // Recherche du parent le plus proche (ex. 411101 -> 4111 -> 411).
  for (let length = normalized.length - 1; length >= 3; length -= 1) {
    const parent = normalized.slice(0, length);
    if (SYSCOHADA_LABELS[parent]) return SYSCOHADA_LABELS[parent];
  }
  return '';
}

// ---------------------------------------------------------------------------
// Profils logiciels
// ---------------------------------------------------------------------------

/**
 * Cibles internes du mapping (colonnes sources -> champs FEC).
 * Chaque cible accepte plusieurs synonymes d'en-têtes (normalisés).
 */
export const MAPPING_TARGETS = Object.freeze([
  { id: 'journalCode', label: 'Code journal', required: true },
  { id: 'journalLabel', label: 'Libellé journal', required: false },
  { id: 'entryNum', label: 'N° écriture source (regroupement)', required: false },
  { id: 'entryDate', label: 'Date écriture', required: true },
  { id: 'accountNum', label: 'N° compte général', required: true },
  { id: 'accountLabel', label: 'Libellé compte', required: false },
  { id: 'auxNum', label: 'N° compte auxiliaire', required: false },
  { id: 'auxLabel', label: 'Libellé auxiliaire / tiers', required: false },
  { id: 'pieceRef', label: 'Référence pièce', required: true },
  { id: 'pieceDate', label: 'Date pièce', required: false },
  { id: 'entryLabel', label: 'Libellé écriture', required: true },
  { id: 'debit', label: 'Montant débit', required: false },
  { id: 'credit', label: 'Montant crédit', required: false },
  { id: 'amount', label: 'Montant unique (si pas de débit/crédit)', required: false },
  { id: 'sense', label: 'Sens (D/C ou +/-)', required: false },
  { id: 'lettering', label: 'Lettrage', required: false },
  { id: 'letteringDate', label: 'Date lettrage', required: false },
  { id: 'validDate', label: 'Date validation', required: false },
  { id: 'foreignAmount', label: 'Montant devise', required: false },
  { id: 'currency', label: 'Code devise', required: false },
  { id: 'settlementDate', label: 'Date règlement (SMT)', required: false },
  { id: 'settlementMode', label: 'Mode règlement (SMT)', required: false },
  { id: 'natOp', label: 'Nature opération (NatOp)', required: false }
]);

function norm(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export const SOFTWARE_PROFILES = Object.freeze([
  Object.freeze({
    id: 'sage100', label: 'Sage 100 Comptabilité', origin: 'Export paramétrable des écritures',
    hint: 'Fichier > Export > Format paramétrable : Code journal, Date, N° pièce, Compte général, Compte tiers, Libellé, Débit, Crédit.',
    delimiter: ';', dateOrder: 'DMY', decimal: 'auto',
    synonyms: {
      journalCode: ['codejournal', 'journal', 'codejl', 'cj', 'journalcode'],
      journalLabel: ['libellejournal', 'libjournal', 'journalib', 'intitulejournal'],
      entryNum: ['numecriture', 'numeroecriture', 'numpiece', 'numeropiece', 'nopiece', 'piece', 'npiececomptable'],
      entryDate: ['date', 'dateecriture', 'datepiece', 'datecomptable', 'ecrituredate'],
      accountNum: ['nocomptegeneral', 'comptegeneral', 'numerocomptegeneral', 'compte', 'ncompte', 'comptenum', 'general'],
      accountLabel: ['libellecompte', 'intitulecompte', 'compteintitule', 'libcompte'],
      auxNum: ['nocomptetiers', 'comptetiers', 'numerocomptetiers', 'tiers', 'compauxnum', 'auxiliaire', 'numaux'],
      auxLabel: ['libelletiers', 'nomtiers', 'tierslibelle', 'intituletiers', 'compauxlib', 'libaux'],
      pieceRef: ['numerofacture', 'numfacture', 'referencepiece', 'refpiece', 'reference', 'ref', 'facture', 'npiece'],
      pieceDate: ['datefacture', 'datepiecejustif', 'datejustificatif'],
      entryLabel: ['libelleecriture', 'libelle', 'intitule', 'description', 'ecriturelib'],
      debit: ['montantdebit', 'debit', 'montdebit', 'dt'],
      credit: ['montantcredit', 'credit', 'montcredit', 'ct'],
      lettering: ['lettrage', 'letecriture', 'lettre', 'codelettrage'],
      letteringDate: ['datelettrage', 'dateletecriture'],
      validDate: ['datevalidation', 'datevalid', 'validation'],
      currency: ['codedevise', 'devise', 'idevise'],
      foreignAmount: ['montantdevise', 'montdevise', 'devmontant'],
      settlementDate: ['datereglement', 'dateregle', 'dateregl'],
      settlementMode: ['modereglement', 'moderegle', 'moderegl', 'modedepaiement', 'paiement']
    }
  }),
  Object.freeze({
    id: 'saari_ciel', label: 'Sage SAARI / Sage 50 / Ciel', origin: 'Grand livre, brouillard, journal (TXT/CSV)',
    hint: 'États > Grand livre / Brouillard > Fichier > Texte standard. Colonnes : Journal, Date, Pièce, Compte, Libellé, Débit, Crédit.',
    delimiter: ';', dateOrder: 'DMY', decimal: 'auto',
    synonyms: {
      journalCode: ['journal', 'codejournal', 'cj', 'codejl'],
      journalLabel: ['libellejournal', 'journalib'],
      entryNum: ['numpiece', 'piece', 'numeropiece', 'folio', 'numecriture'],
      entryDate: ['date', 'dateecriture', 'datecomptable'],
      accountNum: ['compte', 'ncompte', 'numerocompte', 'compten', 'general'],
      accountLabel: ['libellecompte', 'intitulecompte'],
      auxNum: ['auxiliaire', 'compteauxiliaire', 'tiers', 'numaux'],
      auxLabel: ['nom', 'libelleauxiliaire', 'tierslibelle'],
      pieceRef: ['piece', 'numpiece', 'reference', 'ref', 'refpiece', 'document'],
      pieceDate: ['datepiece', 'datefacture'],
      entryLabel: ['libelle', 'libelleecriture', 'intitule', 'ecriture'],
      debit: ['debit', 'montantdebit'],
      credit: ['credit', 'montantcredit'],
      lettering: ['lettrage', 'lettre'],
      letteringDate: ['datelettrage'],
      validDate: ['datevalidation', 'validation']
    }
  }),
  Object.freeze({
    id: 'ebp', label: 'EBP Comptabilité', origin: 'Export des écritures (CSV)',
    hint: 'Exports > Écritures comptables au format CSV : journal, date, compte, libellé, débit, crédit.',
    delimiter: ';', dateOrder: 'DMY', decimal: 'auto',
    synonyms: {
      journalCode: ['journal', 'codejournal'],
      journalLabel: ['libellejournal'],
      entryNum: ['numero', 'numpiece', 'piece'],
      entryDate: ['date', 'datecomptable'],
      accountNum: ['compte', 'numerocompte'],
      accountLabel: ['libellecompte', 'intitule'],
      auxNum: ['auxiliaire', 'tiers'],
      auxLabel: ['libelleauxiliaire', 'nomtiers'],
      pieceRef: ['piece', 'reference', 'document'],
      pieceDate: ['datepiece'],
      entryLabel: ['libelle', 'libelleecriture'],
      debit: ['debit'],
      credit: ['credit'],
      lettering: ['lettrage'],
      letteringDate: ['datelettrage'],
      validDate: ['datevalidation']
    }
  }),
  Object.freeze({
    id: 'odoo', label: 'Odoo (module Comptabilité)', origin: 'Grand livre / account.move.line (CSV/XLSX)',
    hint: 'Comptabilité > Rapports > Grand livre > Exporter. En-têtes anglais possibles : Journal, Date, Account, Debit, Credit.',
    delimiter: ',', dateOrder: 'YMD', decimal: 'auto',
    synonyms: {
      journalCode: ['journal', 'codejournal', 'journalcode'],
      journalLabel: ['journallabel', 'libellejournal'],
      entryNum: ['entry', 'move', 'number', 'piececomptable', 'ecriture', 'id'],
      entryDate: ['date', 'dated Comptabilisation'.replace(/ /g, ''), 'accountingdate', 'datedoperation'],
      accountNum: ['account', 'code', 'compte', 'numerocompte', 'accountcode'],
      accountLabel: ['accountlabel', 'libellecompte', 'accountname'],
      auxNum: ['partnerid', 'partner', 'auxiliaire'],
      auxLabel: ['partner', 'partenaire', 'nomtiers', 'customer', 'vendor', 'tiers'],
      pieceRef: ['ref', 'reference', 'piece', 'pieceref', 'document', 'name'],
      pieceDate: ['invoicedate', 'datepiece', 'datedocument'],
      entryLabel: ['label', 'libelle', 'description', 'narration', 'name'],
      debit: ['debit', 'debitamount'],
      credit: ['credit', 'creditamount'],
      lettering: ['matching', 'lettrage', 'match'],
      letteringDate: ['matchingdate'],
      validDate: ['posteddate', 'validationdate', 'datevalidation'],
      foreignAmount: ['amountcurrency', 'montantdevise'],
      currency: ['currency', 'devise'],
      settlementDate: ['paymentdate', 'datereglement'],
      settlementMode: ['paymentmethod', 'modereglement']
    }
  }),
  Object.freeze({
    id: 'perfecto', label: 'PERFECTO (livre journal TXT)', origin: 'Livre journal TXT : sections « Journal <CODE> … » + tableau Date, N° pièce, Compte…',
    hint: 'Export TXT du livre journal PERFECTO : le code journal est lu dans les lignes « Journal <XXX> … », les titres et totaux sont ignorés. Tabulation, dates JJ/MM/AAAA, validation = dernière date de saisie.',
    delimiter: '\t', dateOrder: 'DMY', decimal: 'auto',
    sectionParser: 'perfecto',
    lastMatchTargets: ['validDate'],
    synonyms: {
      journalCode: ['journal'],
      journalLabel: ['libellejournal'],
      entryNum: ['npiece', 'numpiece', 'numeropiece'],
      entryDate: ['date'],
      accountNum: ['compte'],
      accountLabel: ['intitule', 'intitulecompte'],
      pieceRef: ['reference', 'ref'],
      entryLabel: ['libelle'],
      debit: ['debit'],
      credit: ['credit'],
      foreignAmount: ['endevise'],
      validDate: ['datesaisie', 'datevalidation']
    }
  }),
  Object.freeze({
    id: 'generique', label: 'Générique SYSCOHADA (modèle)', origin: 'Modèle CSV fourni par le convertisseur',
    hint: 'Utilisez le modèle téléchargeable : 18/21 colonnes déjà nommées comme le FEC.',
    delimiter: ';', dateOrder: 'DMY', decimal: 'auto',
    synonyms: {
      journalCode: ['codejournal'], journalLabel: ['libjournal'],
      entryNum: ['numecriture'], entryDate: ['dateecriture'],
      accountNum: ['numcompte'], accountLabel: ['libcompte'],
      auxNum: ['numcompteaux'], auxLabel: ['libcompteaux'],
      pieceRef: ['refpiece'], pieceDate: ['datepiece'], entryLabel: ['libecriture'],
      debit: ['montdebit'], credit: ['montcredit'],
      lettering: ['letecriture'], letteringDate: ['dateletecriture'], validDate: ['datevalid'],
      foreignAmount: ['montdevise'], currency: ['codedevise'],
      settlementDate: ['datereglement'], settlementMode: ['modereglement'], natOp: ['natop']
    }
  }),
  Object.freeze({
    id: 'balance', label: 'Balance seule (reports à nouveau)', origin: 'Balance générale (CSV/TXT)',
    hint: 'Réservé aux reports : génère une écriture AN / REPORT équilibrée. Ne remplace pas un FEC officiel.',
    delimiter: ';', dateOrder: 'DMY', decimal: 'auto', balanceOnly: true,
    synonyms: {
      accountNum: ['compte', 'ncompte', 'numerocompte'],
      accountLabel: ['libelle', 'intitule', 'libellecompte'],
      debit: ['debit', 'solde debit', 'soldedebit', 'totaldebit', 'cumuldebit', 'mouvementdebit'],
      credit: ['credit', 'soldecredit', 'totalcredit', 'cumulcredit', 'mouvementcredit'],
      amount: ['solde', 'balance', 'montant']
    }
  })
]);

export function getProfile(profileId) {
  return SOFTWARE_PROFILES.find((p) => p.id === profileId) || SOFTWARE_PROFILES.find((p) => p.id === 'generique');
}

/** Score les profils selon les en-têtes trouvés (pour la suggestion auto). */
export function suggestProfiles(headers) {
  const normalized = headers.map(norm);
  return SOFTWARE_PROFILES
    .filter((p) => !p.balanceOnly)
    .map((profile) => {
      let score = 0;
      let matched = 0;
      Object.values(profile.synonyms).forEach((synonyms) => {
        if (synonyms.some((s) => normalized.includes(s))) { score += 1; matched += 1; }
      });
      // Bonus si des synonymes distinctifs sont présents.
      return { profile, score, matched };
    })
    .sort((a, b) => b.score - a.score);
}

/** Construit le mapping automatique en-têtes -> cibles pour un profil. */
export function autoMapHeaders(headers, profileId) {
  const profile = getProfile(profileId);
  const normalized = headers.map(norm);
  // Certains profils (ex. PERFECTO avec deux colonnes « Date saisie »)
  // préfèrent la DERNIÈRE occurrence pour quelques cibles.
  const lastTargets = new Set(profile.lastMatchTargets || []);
  const mapping = {};
  Object.entries(profile.synonyms).forEach(([target, synonyms]) => {
    const preferLast = lastTargets.has(target);
    let found = -1;
    for (const synonym of synonyms) {
      const index = preferLast ? normalized.lastIndexOf(synonym) : normalized.indexOf(synonym);
      if (index >= 0) { found = index; break; }
    }
    // Recherche floue : en-tête contenant le synonyme (ou l'inverse).
    if (found < 0) {
      const order = preferLast
        ? normalized.map((_, i) => i).reverse()
        : normalized.map((_, i) => i);
      outer: for (const synonym of synonyms) {
        for (const i of order) {
          const header = normalized[i];
          if (!header || !synonym) continue;
          if ((header.includes(synonym) && synonym.length >= 5) || (synonym.includes(header) && header.length >= 6)) {
            found = i;
            break outer;
          }
        }
      }
    }
    mapping[target] = found;
  });
  return mapping;
}

// ---------------------------------------------------------------------------
// Parsing texte / CSV
// ---------------------------------------------------------------------------

export function detectDelimiter(sampleText) {
  const candidates = ['\t', ';', ',', '|'];
  const lines = String(sampleText || '').split(/\r?\n/).filter((l) => l.trim()).slice(0, 12);
  if (!lines.length) return ';';
  let best = ';';
  let bestScore = -1;
  for (const delimiter of candidates) {
    const counts = lines.map((line) => line.split(delimiter).length - 1);
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) continue;
    const consistent = counts.filter((c) => c === counts[0]).length;
    const score = total * 10 + consistent - (delimiter === ',' ? 2 : 0);
    if (score > bestScore) { bestScore = score; best = delimiter; }
  }
  return best;
}

function splitLine(line, delimiter) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { current += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === delimiter && !quoted) { cells.push(current); current = ''; continue; }
    current += char;
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

export function parseDelimitedText(text, { delimiter = null, hasHeader = true, skipRows = 0 } = {}) {
  const cleaned = String(text || '').replace(/^\uFEFF/, '');
  const usedDelimiter = delimiter || detectDelimiter(cleaned);
  const rawLines = cleaned.split(/\r?\n/);
  const dataLines = rawLines.slice(skipRows).filter((line) => line.trim() !== '');
  if (!dataLines.length) return { delimiter: usedDelimiter, headers: [], rows: [], totalLines: 0 };
  const matrix = dataLines.map((line) => splitLine(line, usedDelimiter));
  let headers = [];
  let rows = matrix;
  if (hasHeader) {
    headers = matrix[0].map((h, i) => h || `Colonne ${i + 1}`);
    rows = matrix.slice(1);
  } else {
    headers = matrix[0].map((_, i) => `Colonne ${i + 1}`);
  }
  return { delimiter: usedDelimiter, headers, rows, totalLines: rows.length };
}

/** Convertit une valeur de date hétérogène en ISO AAAA-MM-JJ (ou ''). */
export function parseDateToISO(raw, { dateOrder = 'DMY' } = {}) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  // AAAAMMJJ compact
  if (/^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    if (year >= 1900 && year <= 2200 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }
    return '';
  }
  // Numéro de série Excel (jours depuis 1899-12-30)
  if (/^\d{5}(\.\d+)?$/.test(value)) {
    const serial = Number(value);
    if (serial > 20000 && serial < 80000) {
      const base = Date.UTC(1899, 11, 30);
      const date = new Date(base + Math.floor(serial) * 86400000);
      return date.toISOString().slice(0, 10);
    }
  }
  // AAAA-MM-JJ (éventuellement avec heure)
  let match = value.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  // JJ/MM/AAAA ou MM/JJ/AAAA selon dateOrder
  match = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (match) {
    let [, first, second, year] = match;
    if (year.length === 2) year = `${Number(year) >= 70 ? '19' : '20'}${year}`;
    const day = dateOrder === 'MDY' ? second : first;
    const month = dateOrder === 'MDY' ? first : second;
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return '';
  }
  // Dernier recours : parse natif
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

/** Convertit un montant hétérogène (virgule/point, espaces, parenthèses) en nombre. */
export function parseAmountValue(raw, { decimal = 'auto' } = {}) {
  let text = String(raw ?? '').trim();
  if (!text) return 0;
  // Négatifs entre parenthèses : (1 234,56)
  let negative = false;
  if (/^\(.*\)$/.test(text)) { negative = true; text = text.slice(1, -1); }
  // Signe trailing comptable : 1234- ou 1234+
  const trailingMatch = text.match(/([+-])$/);
  if (trailingMatch) { if (trailingMatch[1] === '-') negative = true; text = text.slice(0, -1); }
  // Retire symboles monétaires et espaces (y compris insécables)
  text = text.replace(/[\s\u00a0\u202f]/g, '').replace(/(fcfa|xof|eur|€|\$)/gi, '');
  if (!text || text === '-') return 0;
  const commaCount = (text.match(/,/g) || []).length;
  const dotCount = (text.match(/\./g) || []).length;
  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  if (decimal === ',' || decimal === '.') {
    const decimalSep = decimal;
    const thousandSep = decimal === ',' ? '.' : ',';
    text = text.split(thousandSep).join('');
    if (decimalSep === ',') text = text.replace(',', '.');
  } else if (commaCount && dotCount) {
    text = lastComma > lastDot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
  } else if (commaCount === 1) {
    text = text.replace(',', '.');
  } else if (commaCount > 1) {
    text = text.replace(/,/g, '');
  } else if (dotCount > 1) {
    text = text.replace(/\./g, '');
  } else if (dotCount === 1) {
    // Un seul point : décimal sauf s'il sépare exactement 3 chiffres finaux (milliers).
    const [, decimals] = text.split('.');
    if (decimals && decimals.length === 3 && text.length > 4 && /^\d{1,3}\.\d{3}$/.test(text)) {
      text = text.replace('.', '');
    }
  }
  if (!/^[+-]?\d+(\.\d+)?$/.test(text)) return NaN;
  let number = Number(text);
  if (negative) number = -Math.abs(number);
  return Math.round(number * 100) / 100;
}

// ---------------------------------------------------------------------------
// Lignes internes -> enregistrements FEC
// ---------------------------------------------------------------------------

function cleanText(value) {
  return String(value ?? '').replace(/[\t;\r\n]+/g, ' ').trim();
}

function cleanAccount(value) {
  return String(value ?? '').replace(/[\s.\-_/]/g, '').toUpperCase();
}

function cleanJournal(value) {
  return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

function fecDate(isoLike) {
  const iso = String(isoLike || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.replace(/-/g, '');
  if (/^\d{8}$/.test(iso)) return iso;
  return '';
}

function fecAmount(number) {
  if (number === '' || number === null || number === undefined) return '';
  if (!Number.isFinite(Number(number))) return '';
  return Number(number).toFixed(2).replace('.', ',');
}

function senseToDebitCredit(amountValue, senseRaw) {
  const sense = String(senseRaw || '').trim().toUpperCase();
  const debitMarks = ['D', 'DEBIT', 'DEB', '+', '1', '+1'];
  const creditMarks = ['C', 'CREDIT', 'CRED', '-', '-1'];
  if (debitMarks.includes(sense)) return { debit: Math.abs(amountValue), credit: 0 };
  if (creditMarks.includes(sense)) return { debit: 0, credit: Math.abs(amountValue) };
  if (amountValue < 0) return { debit: 0, credit: Math.abs(amountValue) };
  return { debit: amountValue, credit: 0 };
}

const REPORT_PATTERNS = ['REPORT', 'A-NOUVEAU', 'ANOUVEAU', 'A NOUVEAU', 'OUVERTURE', 'OPENING', 'RAN '];

function isReportEntry({ journalCode, entryLabel }) {
  const journal = String(journalCode || '').toUpperCase();
  if (['AN', 'RAN', 'OUV'].includes(journal)) return true;
  const label = String(entryLabel || '').toUpperCase();
  return REPORT_PATTERNS.some((pattern) => label.includes(pattern));
}

const CENTRALISATION_PATTERNS = ['CENTRALISATION', 'CENTRALIZA', 'CENTR.'];

function isCentralisationEntry({ journalCode, entryLabel }) {
  const journal = String(journalCode || '').toUpperCase();
  if (journal === 'CT') return true;
  const label = String(entryLabel || '').toUpperCase();
  return CENTRALISATION_PATTERNS.some((pattern) => label.includes(pattern));
}

/**
 * Regroupe les lignes sources en écritures (même NumEcriture FEC).
 * Stratégie : si une colonne "N° écriture" est mappée et renseignée, regroupe par
 * (journal + n° source) ; sinon par (journal + date + référence pièce).
 */
export function groupLinesIntoEntries(lines, { useSourceEntryNum = true } = {}) {
  const groups = new Map();
  lines.forEach((line) => {
    const hasSourceNum = useSourceEntryNum && line.entryNum;
    const key = hasSourceNum
      ? `${line.journalCode}||${line.entryNum}`
      : `${line.journalCode}||${line.entryDate}||${line.pieceRef}||${line.entryLabel}`;
    if (!groups.has(key)) groups.set(key, { key, lines: [] });
    groups.get(key).lines.push(line);
  });
  return [...groups.values()];
}

export function prepareFecFromLines(lines, options = {}) {
  const {
    regime = 'NORMAL',
    startDate = null,
    endDate = null,
    journals = {},
    accounts = {},
    autoSequence = true,
    validDateFallback = true,
    pieceRefFallback = true,
    pieceDateFallback = true,
    excludeCentralisation = true,
    groupBySourceNum = true,
    defaultCurrency = 'XOF'
  } = options;

  const errors = [];
  const warnings = [];
  const excluded = [];
  const fields = fecFieldsForRegime(regime);

  const scopeStart = startDate ? String(startDate).slice(0, 10) : null;
  const scopeEnd = endDate ? String(endDate).slice(0, 10) : null;

  const scoped = lines.filter((line) => {
    if (scopeStart && line.entryDate < scopeStart) return false;
    if (scopeEnd && line.entryDate > scopeEnd) return false;
    return true;
  });
  if (lines.length && !scoped.length) {
    warnings.push({ code: 'HORS_EXERCICE', message: 'Aucune ligne dans la période d’exercice sélectionnée.' });
  }

  const withoutExcluded = scoped.filter((line) => {
    if (excludeCentralisation && isCentralisationEntry(line)) {
      excluded.push({ row: line.__row, reason: 'CENTRALISATION', label: line.entryLabel });
      return false;
    }
    return true;
  });

  const groups = groupLinesIntoEntries(withoutExcluded, { useSourceEntryNum: groupBySourceNum });

  // Tri : reports d'abord, puis date de validation / date d'écriture, journal, pièce.
  groups.sort((a, b) => {
    const firstA = a.lines[0];
    const firstB = b.lines[0];
    const reportOrder = Number(isReportEntry(firstB)) - Number(isReportEntry(firstA));
    if (reportOrder) return reportOrder;
    const dateA = firstA.validDate || firstA.entryDate || '9999-12-31';
    const dateB = firstB.validDate || firstB.entryDate || '9999-12-31';
    return `${dateA}|${firstA.journalCode}|${firstA.pieceRef}|${firstA.entryNum}`.localeCompare(
      `${dateB}|${firstB.journalCode}|${firstB.pieceRef}|${firstB.entryNum}`, 'fr', { numeric: true });
  });

  const records = [];
  let totalDebit = 0;
  let totalCredit = 0;

  groups.forEach((group, groupIndex) => {
    const entryNumber = autoSequence ? String(groupIndex + 1) : String(group.lines[0].entryNum || groupIndex + 1);
    const groupDebit = group.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const groupCredit = group.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    const first = group.lines[0];
    const ref = first.pieceRef || first.entryNum || `ligne ${first.__row}`;

    if (!group.lines.length) return;
    if (Math.abs(groupDebit - groupCredit) > 0.005) {
      errors.push({
        code: 'ECRITURE_DESEQUILIBREE', entryNumber, pieceRef: ref,
        message: `Écriture ${entryNumber} (${ref}) déséquilibrée : débit ${groupDebit.toFixed(2)}, crédit ${groupCredit.toFixed(2)}.`
      });
    }
    if (!first.journalCode) {
      errors.push({ code: 'JOURNAL_MANQUANT', entryNumber, message: `Écriture ${entryNumber} (${ref}) : code journal manquant.` });
    }
    if (!first.entryDate) {
      errors.push({ code: 'DATE_MANQUANTE', entryNumber, message: `Écriture ${entryNumber} (${ref}) : date d’écriture manquante ou illisible.` });
    }
    const effectiveValidDate = first.validDate || (validDateFallback ? first.entryDate : '');
    if (!effectiveValidDate) {
      errors.push({ code: 'DATE_VALID_MANQUANTE', entryNumber, message: `Écriture ${entryNumber} (${ref}) : date de validation manquante.` });
    }
    const effectivePieceRef = first.pieceRef || (pieceRefFallback ? `${first.journalCode}-${entryNumber}` : '');
    if (!effectivePieceRef) {
      errors.push({ code: 'PIECE_MANQUANTE', entryNumber, message: `Écriture ${entryNumber} : référence de pièce manquante.` });
    }

    group.lines.forEach((line, lineIndex) => {
      const journalCode = cleanJournal(line.journalCode);
      // Si le libellé journal est absent ou recopie le code (colonne unique),
      // bascule sur le référentiel embarqué.
      const rawJournalLabel = cleanText(line.journalLabel);
      const journalLabel = (!rawJournalLabel || rawJournalLabel.toUpperCase() === journalCode)
        ? cleanText(journals[journalCode] || journalLabelFor(journalCode) || rawJournalLabel)
        : rawJournalLabel;
      const accountNum = cleanAccount(line.accountNum);
      // Si le libellé compte est absent ou recopie le numéro, bascule sur le
      // plan SYSCOHADA embarqué (ou le plan importé).
      const rawAccountLabel = cleanText(line.accountLabel);
      const accountLabel = (!rawAccountLabel || rawAccountLabel.replace(/[^0-9]/g, '') === accountNum || rawAccountLabel === accountNum)
        ? cleanText(accounts[accountNum] || accountLabelFor(accountNum) || rawAccountLabel)
        : rawAccountLabel;
      // Un « numéro » auxiliaire sans chiffre est un nom de tiers : il bascule
      // en libellé auxiliaire plutôt qu'en numéro.
      let auxNum = cleanText(line.auxNum);
      let auxLabel = cleanText(line.auxLabel);
      if (auxNum && !/\d/.test(auxNum)) {
        if (!auxLabel) auxLabel = auxNum;
        else if (auxLabel !== auxNum) warnings.push({ code: 'AUXILIAIRE_NOM', entryNumber, row: line.__row, message: `Écriture ${entryNumber} (${ref}) : « ${auxNum} » ressemble à un nom de tiers, conservé en libellé auxiliaire.` });
        auxNum = '';
      }
      const pieceDate = line.pieceDate || (pieceDateFallback ? line.entryDate : '');
      const entryLabel = cleanText(line.entryLabel);

      if (!accountNum) {
        errors.push({ code: 'COMPTE_MANQUANT', entryNumber, row: line.__row, message: `Écriture ${entryNumber} (${ref}), ligne ${lineIndex + 1} : compte manquant.` });
      } else if (!/^\d{2,}/.test(accountNum)) {
        errors.push({ code: 'COMPTE_INVALIDE', entryNumber, row: line.__row, message: `Écriture ${entryNumber} (${ref}) : le compte « ${accountNum} » doit être numérique (SYSCOHADA).` });
      }
      if (!accountLabel) {
        warnings.push({ code: 'LIBELLE_COMPTE_DEFAUT', entryNumber, row: line.__row, message: `Écriture ${entryNumber} (${ref}) : libellé du compte ${accountNum || '(vide)'} non trouvé, à compléter.` });
        errors.push({ code: 'LIBELLE_COMPTE_MANQUANT', entryNumber, row: line.__row, message: `Écriture ${entryNumber} (${ref}) : libellé du compte ${accountNum || '(vide)'} obligatoire.` });
      }
      if (!entryLabel) {
        errors.push({ code: 'LIBELLE_MANQUANT', entryNumber, row: line.__row, message: `Écriture ${entryNumber} (${ref}) : libellé d’écriture manquant.` });
      }
      if (!journalLabel) {
        errors.push({ code: 'LIBELLE_JOURNAL_MANQUANT', entryNumber, message: `Écriture ${entryNumber} (${ref}) : libellé du journal ${journalCode || '(vide)'} manquant.` });
      }
      if (regime === 'SMT') {
        if (!line.settlementDate) errors.push({ code: 'SMT_DATE_REGLEMENT', entryNumber, row: line.__row, message: `Écriture ${entryNumber} (${ref}) : date de règlement obligatoire en SMT.` });
        if (!line.settlementMode) errors.push({ code: 'SMT_MODE_REGLEMENT', entryNumber, row: line.__row, message: `Écriture ${entryNumber} (${ref}) : mode de règlement obligatoire en SMT.` });
      }

      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      const values = {
        CodeJournal: journalCode,
        LibJournal: journalLabel,
        NumEcriture: entryNumber,
        DateEcriture: fecDate(line.entryDate),
        NumCompte: accountNum,
        LibCompte: accountLabel || accountNum,
        NumCompteAux: auxNum,
        LibCompteAux: auxLabel,
        RefPiece: cleanText(effectivePieceRef && line.pieceRef ? line.pieceRef : effectivePieceRef),
        DatePiece: fecDate(pieceDate),
        LibEcriture: isReportEntry(line) ? 'REPORT' : (entryLabel || `Écriture ${ref}`),
        MontDebit: fecAmount(debit),
        MontCredit: fecAmount(credit),
        LetEcriture: cleanText(line.lettering),
        DateLetEcriture: fecDate(line.letteringDate),
        DateValid: fecDate(line.validDate || effectiveValidDate),
        MontDevise: line.foreignAmount === '' || line.foreignAmount === null || line.foreignAmount === undefined ? '' : fecAmount(Number(line.foreignAmount)),
        CodeDevise: cleanText(line.currency || (line.foreignAmount ? defaultCurrency : '')),
        'Date Règlement': fecDate(line.settlementDate),
        'Mode Règlement': cleanText(line.settlementMode),
        NatOp: cleanText(line.natOp)
      };
      records.push({ entryNumber, row: line.__row, isReport: isReportEntry(line), values });
      totalDebit += debit;
      totalCredit += credit;
    });
  });

  return {
    valid: errors.length === 0,
    fields, records, errors, warnings, excluded,
    entryCount: groups.length,
    lineCount: records.length,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    scope: { startDate: scopeStart, endDate: scopeEnd },
    generatedAt: new Date().toISOString()
  };
}

/**
 * Construit les lignes internes à partir des lignes sources mappées.
 * Retourne { lines, issues }.
 */
export function buildInternalLines(matrixRows, mapping, { dateOrder = 'DMY', decimal = 'auto' } = {}) {
  const lines = [];
  const issues = [];
  const cell = (row, target) => {
    const index = mapping[target];
    if (index === undefined || index === null || index < 0) return '';
    return String(row[index] ?? '').trim();
  };
  matrixRows.forEach((row, index) => {
    const rowNum = index + 2; // +1 en-tête, +1 base 1
    const debitRaw = cell(row, 'debit');
    const creditRaw = cell(row, 'credit');
    const amountRaw = cell(row, 'amount');
    let debit = debitRaw === '' ? 0 : parseAmountValue(debitRaw, { decimal });
    let credit = creditRaw === '' ? 0 : parseAmountValue(creditRaw, { decimal });
    if (Number.isNaN(debit) || Number.isNaN(credit)) {
      issues.push({ row: rowNum, code: 'MONTANT_ILLISIBLE', message: `Ligne ${rowNum} : montant débit/crédit illisible (« ${debitRaw} » / « ${creditRaw} »).` });
      debit = Number.isNaN(debit) ? 0 : debit;
      credit = Number.isNaN(credit) ? 0 : credit;
    }
    if (amountRaw !== '' && debitRaw === '' && creditRaw === '') {
      const amountValue = parseAmountValue(amountRaw, { decimal });
      if (Number.isNaN(amountValue)) {
        issues.push({ row: rowNum, code: 'MONTANT_ILLISIBLE', message: `Ligne ${rowNum} : montant unique illisible (« ${amountRaw} »).` });
      } else {
        const split = senseToDebitCredit(amountValue, cell(row, 'sense'));
        debit = split.debit;
        credit = split.credit;
      }
    }
    const foreignRaw = cell(row, 'foreignAmount');
    const foreignAmount = foreignRaw === '' ? '' : parseAmountValue(foreignRaw, { decimal });
    lines.push({
      __row: rowNum,
      journalCode: cleanJournal(cell(row, 'journalCode')),
      journalLabel: cleanText(cell(row, 'journalLabel')),
      entryNum: cleanText(cell(row, 'entryNum')),
      entryDate: parseDateToISO(cell(row, 'entryDate'), { dateOrder }),
      entryDateRaw: cell(row, 'entryDate'),
      accountNum: cleanAccount(cell(row, 'accountNum')),
      accountLabel: cleanText(cell(row, 'accountLabel')),
      auxNum: cleanText(cell(row, 'auxNum')),
      auxLabel: cleanText(cell(row, 'auxLabel')),
      pieceRef: cleanText(cell(row, 'pieceRef')),
      pieceDate: parseDateToISO(cell(row, 'pieceDate'), { dateOrder }),
      entryLabel: cleanText(cell(row, 'entryLabel')),
      debit, credit,
      lettering: cleanText(cell(row, 'lettering')),
      letteringDate: parseDateToISO(cell(row, 'letteringDate'), { dateOrder }),
      validDate: parseDateToISO(cell(row, 'validDate'), { dateOrder }),
      foreignAmount: Number.isNaN(foreignAmount) ? '' : foreignAmount,
      currency: cleanText(cell(row, 'currency')).toUpperCase(),
      settlementDate: parseDateToISO(cell(row, 'settlementDate'), { dateOrder }),
      settlementMode: cleanText(cell(row, 'settlementMode')),
      natOp: cleanText(cell(row, 'natOp'))
    });
  });
  return { lines, issues };
}

/**
 * Convertit une balance (comptes + soldes) en lignes internes de REPORT.
 * Chaque compte soldé produit une ligne débitrice OU créditrice dans une
 * écriture AN unique et équilibrée.
 */
export function balanceRowsToInternalLines(matrixRows, mapping, { date = null, reference = 'AN-REPORT-0001', decimal = 'auto' } = {}) {
  const issues = [];
  const lines = [];
  const cell = (row, target) => {
    const index = mapping[target];
    if (index === undefined || index === null || index < 0) return '';
    return String(row[index] ?? '').trim();
  };
  matrixRows.forEach((row, index) => {
    const rowNum = index + 2;
    const accountNum = cleanAccount(cell(row, 'accountNum'));
    if (!accountNum) return; // Ligne vide ou total
    if (/total/i.test(accountNum + cell(row, 'accountLabel'))) return;
    const debit = cell(row, 'debit') === '' ? 0 : parseAmountValue(cell(row, 'debit'), { decimal });
    const credit = cell(row, 'credit') === '' ? 0 : parseAmountValue(cell(row, 'credit'), { decimal });
    let finalDebit = debit;
    let finalCredit = credit;
    const amountRaw = cell(row, 'amount');
    if (amountRaw !== '' && cell(row, 'debit') === '' && cell(row, 'credit') === '') {
      const solde = parseAmountValue(amountRaw, { decimal });
      if (Number.isNaN(solde)) {
        issues.push({ row: rowNum, code: 'SOLDE_ILLISIBLE', message: `Ligne ${rowNum} : solde illisible (« ${amountRaw} »).` });
        return;
      }
      finalDebit = solde > 0 ? solde : 0;
      finalCredit = solde < 0 ? Math.abs(solde) : 0;
    }
    if (Number.isNaN(finalDebit) || Number.isNaN(finalCredit)) {
      issues.push({ row: rowNum, code: 'SOLDE_ILLISIBLE', message: `Ligne ${rowNum} : solde illisible.` });
      return;
    }
    if (finalDebit === 0 && finalCredit === 0) return; // Compte soldé nul : ignoré
    lines.push({
      __row: rowNum,
      journalCode: 'AN',
      journalLabel: 'À-nouveaux',
      entryNum: 'REPORT-1',
      entryDate: date || '',
      entryDateRaw: date || '',
      accountNum,
      accountLabel: cleanText(cell(row, 'accountLabel')),
      auxNum: '', auxLabel: '',
      pieceRef: reference,
      pieceDate: date || '',
      entryLabel: 'Report des soldes — balance d’ouverture',
      debit: finalDebit, credit: finalCredit,
      lettering: '', letteringDate: '',
      validDate: date || '',
      foreignAmount: '', currency: '',
      settlementDate: date || '', settlementMode: 'Report', natOp: 'REPORT'
    });
  });
  return { lines, issues };
}

// ---------------------------------------------------------------------------
// Sérialisation FEC
// ---------------------------------------------------------------------------

export function buildFecText(prepared, { delimiter = '\t' } = {}) {
  if (!prepared?.fields) throw new Error('Préparation FEC absente.');
  const header = prepared.fields.join(delimiter);
  const rows = prepared.records.map((record) =>
    prepared.fields.map((field) => cleanText(record.values[field])).join(delimiter));
  return [header, ...rows].join('\r\n') + '\r\n';
}

export function splitRecords(prepared, maxLinesPerFile = 0) {
  if (!maxLinesPerFile || maxLinesPerFile <= 0) return [prepared];
  const chunks = [];
  // Découpe par écriture complète (jamais au milieu d'une écriture).
  let current = [];
  let currentEntry = null;
  for (const record of prepared.records) {
    if (current.length >= maxLinesPerFile && record.entryNumber !== currentEntry) {
      chunks.push(current);
      current = [];
    }
    current.push(record);
    currentEntry = record.entryNumber;
  }
  if (current.length) chunks.push(current);
  return chunks.map((records) => ({
    ...prepared,
    records,
    entryCount: new Set(records.map((r) => r.entryNumber)).size,
    lineCount: records.length,
    totalDebit: Math.round(records.reduce((s, r) => s + Number(String(r.values.MontDebit).replace(',', '.') || 0), 0) * 100) / 100,
    totalCredit: Math.round(records.reduce((s, r) => s + Number(String(r.values.MontCredit).replace(',', '.') || 0), 0) * 100) / 100
  }));
}

export function fecFileBaseName(ifu, closureDate) {
  const cleanIfu = String(ifu || '').replace(/[^A-Za-z0-9]/g, '');
  const compact = String(closureDate || '').slice(0, 10).replace(/-/g, '');
  return `FEC_${cleanIfu}_${compact}`;
}

// ---------------------------------------------------------------------------
// Validation d'un texte FEC (contrôle final avant remise)
// ---------------------------------------------------------------------------

function fecNumericValue(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) return NaN;
  return Number(normalized);
}

export function validateFecText(text, { regime = 'NORMAL', delimiter = '\t' } = {}) {
  const fields = fecFieldsForRegime(regime);
  const required = fecRequiredForRegime(regime);
  const errors = [];
  const warnings = [];
  const rawLines = String(text ?? '').split(/\r\n|\n|\r/);
  if (rawLines.at(-1) === '') rawLines.pop();
  if (!rawLines.length || !rawLines[0]) {
    return { valid: false, errors: [{ code: 'FICHIER_VIDE', message: 'Le fichier FEC est vide.' }], warnings, fields, entryCount: 0, lineCount: 0, totalDebit: 0, totalCredit: 0 };
  }
  const header = rawLines.shift().split(delimiter);
  if (header.length !== fields.length || header.some((field, index) => field !== fields[index])) {
    errors.push({ code: 'ENTETE_INVALIDE', message: `L’en-tête doit contenir exactement ${fields.length} champs dans l’ordre réglementaire (reçu : ${header.length}).` });
  }
  const records = [];
  rawLines.forEach((rawLine, index) => {
    const sourceLine = index + 2;
    if (!rawLine) { errors.push({ code: 'LIGNE_VIDE', line: sourceLine, message: `L’enregistrement ${sourceLine} est vide.` }); return; }
    const values = rawLine.split(delimiter);
    if (values.length !== fields.length) {
      errors.push({ code: 'NB_CHAMPS', line: sourceLine, message: `La ligne ${sourceLine} contient ${values.length} champs au lieu de ${fields.length}.` });
      return;
    }
    const record = Object.fromEntries(fields.map((name, i) => [name, values[i]]));
    fields.filter((field) => required.has(field) && !record[field]).forEach((field) => {
      errors.push({ code: 'CHAMP_OBLIGATOIRE', line: sourceLine, field, message: `Le champ obligatoire ${field} est vide à la ligne ${sourceLine}.` });
    });
    ['DateEcriture', 'DatePiece', 'DateValid', 'DateLetEcriture', 'Date Règlement'].forEach((fieldName) => {
      if (record[fieldName] && !/^\d{8}$/.test(record[fieldName])) {
        errors.push({ code: 'DATE_FORMAT', line: sourceLine, field: fieldName, message: `${fieldName} doit être au format AAAAMMJJ (ligne ${sourceLine}).` });
      }
    });
    ['MontDebit', 'MontCredit', 'MontDevise'].forEach((fieldName) => {
      if (record[fieldName] && !Number.isFinite(fecNumericValue(record[fieldName]))) {
        errors.push({ code: 'MONTANT_FORMAT', line: sourceLine, field: fieldName, message: `${fieldName} doit être un montant décimal avec une virgule (ligne ${sourceLine}).` });
      }
    });
    if (record.NumCompte && !/^\d{3}/.test(record.NumCompte)) {
      errors.push({ code: 'COMPTE_SYSCOHADA', line: sourceLine, message: `Le compte ${record.NumCompte} (ligne ${sourceLine}) doit respecter le plan SYSCOHADA.` });
    }
    records.push({ line: sourceLine, values: record });
  });

  // Séquence + équilibre par écriture + REPORT en tête.
  let expectedNumber = 1;
  let currentNumber = null;
  let currentDebit = 0;
  let currentCredit = 0;
  let currentFirstLine = 2;
  let reportSectionEnded = false;
  const closeEntry = () => {
    if (currentNumber === null) return;
    if (Math.abs(currentDebit - currentCredit) > 0.005) {
      errors.push({ code: 'ECRITURE_DESEQUILIBREE', line: currentFirstLine, message: `L’écriture ${currentNumber} n’est pas équilibrée dans le fichier.` });
    }
  };
  records.forEach((record) => {
    const number = Number(record.values.NumEcriture);
    if (!Number.isInteger(number) || number < 1) {
      errors.push({ code: 'NUM_ECRITURE', line: record.line, message: `NumEcriture invalide à la ligne ${record.line}.` });
    }
    if (currentNumber === null) { currentNumber = number; expectedNumber = number; currentFirstLine = record.line; }
    if (number !== currentNumber) {
      closeEntry();
      if (number !== expectedNumber + 1) {
        errors.push({ code: 'SEQUENCE', line: record.line, message: `La séquence NumEcriture passe de ${expectedNumber} à ${number}.` });
      }
      expectedNumber = number;
      currentNumber = number;
      currentFirstLine = record.line;
      currentDebit = 0;
      currentCredit = 0;
    }
    currentDebit += Number.isFinite(fecNumericValue(record.values.MontDebit)) ? fecNumericValue(record.values.MontDebit) : 0;
    currentCredit += Number.isFinite(fecNumericValue(record.values.MontCredit)) ? fecNumericValue(record.values.MontCredit) : 0;
    const isReport = record.values.LibEcriture === 'REPORT';
    if (isReport && reportSectionEnded) {
      errors.push({ code: 'REPORT_PLACEMENT', line: record.line, message: 'Une écriture REPORT doit apparaître au début de la séquence.' });
    }
    if (!isReport) reportSectionEnded = true;
  });
  closeEntry();

  const totalDebit = records.reduce((sum, r) => sum + (Number.isFinite(fecNumericValue(r.values.MontDebit)) ? fecNumericValue(r.values.MontDebit) : 0), 0);
  const totalCredit = records.reduce((sum, r) => sum + (Number.isFinite(fecNumericValue(r.values.MontCredit)) ? fecNumericValue(r.values.MontCredit) : 0), 0);
  return {
    valid: errors.length === 0, errors, warnings, fields, records,
    entryCount: new Set(records.map((r) => r.values.NumEcriture)).size,
    lineCount: records.length,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100
  };
}

// ---------------------------------------------------------------------------
// Descriptif, rapport, manifeste
// ---------------------------------------------------------------------------

export function buildNoticeText(prepared, { delimiter = '\t', encoding = 'ISO-8859-15' } = {}) {
  const lines = [
    'DESCRIPTIF TECHNIQUE DU FEC',
    `REFERENCE\tArrêté n° 1085/MEF/CAB/SGM/DGI/DLC/1355SGG20 du 23 avril 2020 (Bénin)`,
    `STRUCTURE\tFichier plat séquentiel`,
    `SEPARATEUR_CHAMPS\t${delimiter === '\t' ? 'TABULATION' : 'POINT-VIRGULE'}`,
    `SEPARATEUR_ENREGISTREMENTS\tCRLF`,
    `JEU_DE_CARACTERES\t${encoding}`,
    `DATES\tAAAAMMJJ`,
    `MONTANTS\tDécimaux à virgule, sans séparateur de milliers`,
    '',
    ['ORDRE', 'NOM DU CHAMP', 'DESCRIPTION', 'OBLIGATOIRE', 'FORMAT'].join('\t'),
    ...prepared.fields.map((name, index) => [
      index + 1, name, FEC_FIELD_DESCRIPTIONS[name] || '', fecRequiredForRegime(prepared.fields.length > 18 ? 'SMT' : 'NORMAL').has(name) ? 'OUI' : 'NON',
      /Date/i.test(name) ? 'AAAAMMJJ' : /^Mont/.test(name) ? 'Décimal, virgule' : ''
    ].join('\t'))
  ];
  return lines.join('\r\n') + '\r\n';
}

export function buildReportText({ prepared, validation = null, companyName = '', ifu = '', mode = '', fileBase = '', sourceFile = '', profileLabel = '' } = {}) {
  const allErrors = [...(prepared.errors || []), ...(validation?.errors || [])];
  const allWarnings = [...(prepared.warnings || []), ...(validation?.warnings || [])];
  const lines = [
    'RAPPORT DE CONTROLE DU FEC',
    `SOCIETE\t${cleanText(companyName)}`,
    `IFU\t${cleanText(ifu)}`,
    `FICHIER\t${fileBase}`,
    `MODE\t${mode}`,
    `SOURCE\t${cleanText(sourceFile)} (${cleanText(profileLabel)})`,
    `CHAMPS\t${prepared.fields.length}`,
    `ECRITURES\t${prepared.entryCount}`,
    `LIGNES\t${prepared.lineCount}`,
    `TOTAL_DEBIT\t${fecAmount(prepared.totalDebit)}`,
    `TOTAL_CREDIT\t${fecAmount(prepared.totalCredit)}`,
    `EXCLUS\t${(prepared.excluded || []).length} ligne(s) de centralisation exclue(s)`,
    `STATUT\t${allErrors.length ? 'BLOQUE' : 'PRET'}`,
    '',
    `ERREURS\t${allErrors.length}`,
    ...allErrors.map((issue) => `${issue.code || 'ERREUR'}\t${cleanText(issue.message)}`),
    '',
    `AVERTISSEMENTS\t${allWarnings.length}`,
    ...allWarnings.map((issue) => `${issue.code || 'AVERTISSEMENT'}\t${cleanText(issue.message)}`),
    '',
    'Ce rapport accompagne la préparation du FEC et ne remplace pas la validation par la DGI.'
  ];
  return lines.join('\r\n') + '\r\n';
}

export function buildManifestText(files, { fileBase = '', generatedAt = new Date().toISOString() } = {}) {
  const lines = [
    'MANIFESTE DU PAQUET FEC',
    `PAQUET\t${fileBase}.zip`,
    `GENERE_LE\t${generatedAt}`,
    '',
    'FICHIER\tSHA256\tOCTETS',
    ...files.map((file) => `${file.name}\t${file.sha256}\t${file.bytes.length}`),
    '',
    'STATUT\tSCELLE — toute modification est détectable en recalculant les empreintes.'
  ];
  return lines.join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------------------
// Encodages réglementaires (ASCII, ISO-8859-15, EBCDIC)
// ---------------------------------------------------------------------------

function asciiFold(value) {
  return String(value ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/Æ/g, 'AE');
}

export function encodeFecBytes(text, encoding = 'ISO-8859-15') {
  const source = String(text ?? '');
  if (encoding === 'EBCDIC') {
    // Table EBCDIC (Cp037) restreinte aux caractères utiles du FEC.
    const punctuation = {
      ' ': 0x40, '\t': 0x05, '\r': 0x0d, '\n': 0x25, '-': 0x60, '/': 0x61,
      ',': 0x6b, '.': 0x4b, ';': 0x5e, ':': 0x7a, '_': 0x6d, '+': 0x4e,
      '=': 0x7e, '?': 0x6f, '!': 0x5a, '@': 0x7c, '#': 0x7b, '$': 0x5b,
      '%': 0x6c, '&': 0x50, '*': 0x5c, '(': 0x4d, ')': 0x5d, '<': 0x4c,
      '>': 0x6e, "'": 0x7d, '"': 0x7f
    };
    const bytes = [];
    for (const original of source) {
      const folded = asciiFold(original);
      for (const unit of folded) {
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
  if (encoding === 'UTF-8') return new TextEncoder().encode(source);
  const isoMap = { '€': 0xa4, 'Š': 0xa6, 'š': 0xa8, 'Ž': 0xb4, 'ž': 0xb8, 'Œ': 0xbc, 'œ': 0xbd, 'Ÿ': 0xbe };
  const bytes = [];
  for (const original of source) {
    const folded = encoding === 'ASCII' ? asciiFold(original) : original;
    for (const unit of folded) {
      if (isoMap[unit] !== undefined && encoding !== 'ASCII') bytes.push(isoMap[unit]);
      else if (unit.charCodeAt(0) <= 0x7f || (encoding !== 'ASCII' && unit.charCodeAt(0) <= 0xff)) bytes.push(unit.charCodeAt(0));
      else bytes.push(0x3f);
    }
  }
  return Uint8Array.from(bytes);
}

// ---------------------------------------------------------------------------
// ZIP minimal (méthode "stored") + SHA-256
// ---------------------------------------------------------------------------

function zipCrc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const zipWord = (value) => [value & 0xff, (value >>> 8) & 0xff];
const zipDword = (value) => [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];

export function createZipArchive(files = []) {
  if (!Array.isArray(files) || !files.length) throw new Error('Un paquet FEC doit contenir au moins un fichier.');
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  files.forEach((file) => {
    const name = String(file?.name || '').trim();
    const bytes = file?.bytes instanceof Uint8Array ? file.bytes : Uint8Array.from(file?.bytes || []);
    if (!name || name.includes('/') || name.includes('\\')) throw new Error(`Nom de fichier d’archive invalide : ${name}`);
    const nameBytes = encoder.encode(name);
    const crc = zipCrc32(bytes);
    const localHeader = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ...zipDword(crc), ...zipDword(bytes.length), ...zipDword(bytes.length), ...zipWord(nameBytes.length), 0, 0]);
    localParts.push(Uint8Array.from([...localHeader, ...nameBytes, ...bytes]));
    const centralHeader = Uint8Array.from([0x50, 0x4b, 0x01, 0x02, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ...zipDword(crc), ...zipDword(bytes.length), ...zipDword(bytes.length), ...zipWord(nameBytes.length),
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...zipDword(offset)]);
    centralParts.push(Uint8Array.from([...centralHeader, ...nameBytes]));
    offset += localParts[localParts.length - 1].length;
  });
  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Uint8Array.from([0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0,
    ...zipWord(files.length), ...zipWord(files.length), ...zipDword(centralSize), ...zipDword(centralOffset), 0, 0]);
  const archive = new Uint8Array(localParts.reduce((sum, part) => sum + part.length, 0) + centralSize + end.length);
  let cursor = 0;
  [...localParts, ...centralParts, end].forEach((part) => { archive.set(part, cursor); cursor += part.length; });
  return archive;
}

export async function sha256Hex(bytes) {
  const source = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || []);
  if (globalThis.crypto?.subtle) {
    // Copie défensive : certains tampons (ex. Buffer Node) partagent leur mémoire.
    const digest = await globalThis.crypto.subtle.digest('SHA-256', Uint8Array.from(source));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Repli Node (crypto natif).
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(source).digest('hex');
}

// ---------------------------------------------------------------------------
// PERFECTO : livre journal TXT organisé en sections par journal
// ---------------------------------------------------------------------------

const PERFECTO_SECTION_RE = /^Journal\s*[<\uFF1C]\s*([^>\uFF1E&]+?)\s*[>\uFF1E]\s*(.*)$/i;

function normalizePerfectoLine(line) {
  return String(line ?? '').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
}

export function isPerfectoSectionRow(firstCell) {
  return PERFECTO_SECTION_RE.test(normalizePerfectoLine(String(firstCell || '').trim()));
}

export function parsePerfectoSectionRow(firstCell) {
  const match = normalizePerfectoLine(String(firstCell || '').trim()).match(PERFECTO_SECTION_RE);
  if (!match) return null;
  return { code: match[1].trim().toUpperCase(), label: match[2].trim() };
}

function isPerfectoHeaderRow(cells) {
  const joined = cells.map(norm).join('|');
  return norm(cells[0] || '') === 'date' && joined.includes('compte') && joined.includes('debit');
}

const PERFECTO_DATA_START = /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/;

function isPerfectoDataRow(cells) {
  return PERFECTO_DATA_START.test(String(cells[0] || '').trim());
}

/**
 * Extrait les sections « Journal <CODE> libellé » d'une matrice PERFECTO.
 * Deux colonnes virtuelles (Journal, Libellé journal) sont injectées en tête
 * pour uniformiser le mapping avec les autres profils. Titres, lignes vides
 * et totaux sont ignorés et comptabilisés dans `skipped`.
 */
export function extractPerfectoSections(matrix) {
  const headers = [];
  const rows = [];
  const skipped = [];
  const journals = [];
  let currentJournal = { code: '', label: '' };
  let headerFound = false;
  matrix.forEach((cells, index) => {
    const lineNum = index + 1;
    const line = Array.isArray(cells) ? cells.map((c) => String(c ?? '').trim()) : [];
    if (!line.some((c) => c !== '')) return; // Ligne vide ignorée silencieusement
    const first = line[0] || '';
    const section = parsePerfectoSectionRow(first);
    if (section && line.slice(1).every((c) => c === '')) {
      currentJournal = section;
      if (!journals.some((j) => j.code === section.code)) journals.push({ ...section, lines: 0 });
      return;
    }
    if (!headerFound && isPerfectoHeaderRow(line)) {
      headers.push('Journal', 'Libellé journal', ...line);
      headerFound = true;
      return;
    }
    if (isPerfectoDataRow(line)) {
      if (!currentJournal.code) {
        skipped.push({ line: lineNum, reason: 'HORS_SECTION', text: first });
        return;
      }
      if (!headerFound) {
        // Copier-coller partiel sans la ligne d'en-tête : colonnes génériques.
        headers.push('Journal', 'Libellé journal', ...line.map((_, i) => `Colonne ${i + 1}`));
        headerFound = true;
      }
      rows.push([currentJournal.code, currentJournal.label, ...line]);
      const journal = journals.find((j) => j.code === currentJournal.code);
      if (journal) journal.lines += 1;
      return;
    }
    const reason = /^total/i.test(first) ? 'TOTAL' : 'HORS_TABLEAU';
    skipped.push({ line: lineNum, reason, text: line.join(' ').slice(0, 80) });
  });
  return { headers, rows, skipped, journals };
}

export function parsePerfectoText(text) {
  const cleaned = String(text || '').replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r?\n/);
  // Délimiteur détecté depuis la ligne d'en-tête (commençant par Date).
  const headerLine = lines.find((l) => /^\s*Date\s*[\t;,|]/.test(l)) || '';
  const delimiter = headerLine.includes('\t') ? '\t' : detectDelimiter(lines.filter((l) => l.trim()).slice(0, 20).join('\n'));
  const matrix = lines.map((line) => splitLine(line, delimiter));
  return { ...extractPerfectoSections(matrix), delimiter };
}

/** Détection rapide d'un journal PERFECTO (sections + ligne Date…). */
export function detectPerfectoText(text) {
  const sample = String(text || '').slice(0, 20000);
  return /^Journal\s*(<|&lt;)/im.test(sample) && /^\s*Date\s*[\t;,|]/m.test(sample);
}

// ---------------------------------------------------------------------------
// Modèle générique téléchargeable
// ---------------------------------------------------------------------------

export function buildGenericTemplate(regime = 'NORMAL', { delimiter = ';' } = {}) {
  const fields = fecFieldsForRegime(regime);
  const example = {
    CodeJournal: 'VE', LibJournal: 'Ventes', NumEcriture: '1',
    DateEcriture: '15/01/2025', NumCompte: '411100', LibCompte: 'Clients',
    NumCompteAux: 'CLI001', LibCompteAux: 'Client exemple',
    RefPiece: 'FAC-2025-001', DatePiece: '15/01/2025', LibEcriture: 'Vente de services',
    MontDebit: '118000', MontCredit: '0', LetEcriture: '', DateLetEcriture: '',
    DateValid: '15/01/2025', MontDevise: '', CodeDevise: '',
    'Date Règlement': '20/01/2025', 'Mode Règlement': 'Virement', NatOp: 'VENTE'
  };
  const header = MAPPING_TARGETS.filter((t) => fields.includes(targetToFecField(t.id, regime))).map((t) => t.label);
  void example;
  void header;
  // Le modèle reprend les noms FEC pour un mapping immédiat.
  const row1 = fields.map((field) => ({
    CodeJournal: 'VE', LibJournal: 'Ventes', NumEcriture: 'FAC-2025-001',
    DateEcriture: '15/01/2025', NumCompte: '411100', LibCompte: 'Clients',
    NumCompteAux: 'CLI001', LibCompteAux: 'Client exemple',
    RefPiece: 'FAC-2025-001', DatePiece: '15/01/2025', LibEcriture: 'Vente de services — client exemple',
    MontDebit: '118000', MontCredit: '0', LetEcriture: '', DateLetEcriture: '',
    DateValid: '15/01/2025', MontDevise: '', CodeDevise: '',
    'Date Règlement': '20/01/2025', 'Mode Règlement': 'Virement', NatOp: 'VENTE'
  }[field] ?? ''));
  const row2 = fields.map((field) => ({
    CodeJournal: 'VE', LibJournal: 'Ventes', NumEcriture: 'FAC-2025-001',
    DateEcriture: '15/01/2025', NumCompte: '706100', LibCompte: 'Services vendus',
    NumCompteAux: '', LibCompteAux: '',
    RefPiece: 'FAC-2025-001', DatePiece: '15/01/2025', LibEcriture: 'Vente de services — client exemple',
    MontDebit: '0', MontCredit: '100000', LetEcriture: '', DateLetEcriture: '',
    DateValid: '15/01/2025', MontDevise: '', CodeDevise: '',
    'Date Règlement': '20/01/2025', 'Mode Règlement': 'Virement', NatOp: 'VENTE'
  }[field] ?? ''));
  const row3 = fields.map((field) => ({
    CodeJournal: 'VE', LibJournal: 'Ventes', NumEcriture: 'FAC-2025-001',
    DateEcriture: '15/01/2025', NumCompte: '443100', LibCompte: 'TVA facturée sur ventes',
    NumCompteAux: '', LibCompteAux: '',
    RefPiece: 'FAC-2025-001', DatePiece: '15/01/2025', LibEcriture: 'TVA 18 % — client exemple',
    MontDebit: '0', MontCredit: '18000', LetEcriture: '', DateLetEcriture: '',
    DateValid: '15/01/2025', MontDevise: '', CodeDevise: '',
    'Date Règlement': '20/01/2025', 'Mode Règlement': 'Virement', NatOp: 'VENTE'
  }[field] ?? ''));
  return [fields.join(delimiter), row1.join(delimiter), row2.join(delimiter), row3.join(delimiter)].join('\r\n') + '\r\n';
}

function targetToFecField(targetId, regime) {
  const map = {
    journalCode: 'CodeJournal', journalLabel: 'LibJournal', entryNum: 'NumEcriture',
    entryDate: 'DateEcriture', accountNum: 'NumCompte', accountLabel: 'LibCompte',
    auxNum: 'NumCompteAux', auxLabel: 'LibCompteAux', pieceRef: 'RefPiece',
    pieceDate: 'DatePiece', entryLabel: 'LibEcriture', debit: 'MontDebit',
    credit: 'MontCredit', lettering: 'LetEcriture', letteringDate: 'DateLetEcriture',
    validDate: 'DateValid', foreignAmount: 'MontDevise', currency: 'CodeDevise',
    settlementDate: 'Date Règlement', settlementMode: 'Mode Règlement', natOp: 'NatOp'
  };
  void regime;
  return map[targetId] || '';
}
