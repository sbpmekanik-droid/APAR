import { ChecklistItemDef, ChecklistValue, MediaType } from '../types';

export const STANDARD_CHECKLIST_ITEMS: ChecklistItemDef[] = [
  {
    id: 'item_1',
    question: '1. Apakah APAR berada di lokasi yang telah ditentukan?',
    category: 'lokasi',
    isCritical: true,
  },
  {
    id: 'item_2',
    question: '2. Apakah APAR mudah terlihat dan mudah dijangkau?',
    category: 'akses',
    isCritical: false,
  },
  {
    id: 'item_3',
    question: '3. Apakah APAR tidak terhalang barang atau material pabrik?',
    category: 'akses',
    isCritical: false,
  },
  {
    id: 'item_4',
    question: '4. Apakah petunjuk penggunaan APAR terlihat dan terbaca?',
    category: 'fisik',
    isCritical: false,
  },
  {
    id: 'item_5',
    question: '5. Apakah label identitas APAR masih terbaca dengan jelas?',
    category: 'fisik',
    isCritical: false,
  },
  {
    id: 'item_6',
    question: '6. Apakah pin pengaman (safety pin) masih terpasang sempurna?',
    category: 'keselamatan',
    isCritical: true,
  },
  {
    id: 'item_7',
    question: '7. Apakah segel pengaman (tamper seal) dalam kondisi utuh dan baik?',
    category: 'keselamatan',
    isCritical: true,
  },
  {
    id: 'item_8',
    question: '8. Apakah pressure gauge menunjukkan tekanan pada zona normal (hijau)?',
    category: 'keselamatan',
    isCritical: true,
    applicableMedia: ['ABC Powder', 'Foam', 'Clean Agent', 'Water Mist'], // Not for standard CO2 stored pressure
  },
  {
    id: 'item_9',
    question: '9. Apakah kondisi tabung tidak berkarat, bocor, penyok, atau retak?',
    category: 'fisik',
    isCritical: true,
  },
  {
    id: 'item_10',
    question: '10. Apakah selang (hose) dan nozzle/corong dalam kondisi baik & bersih?',
    category: 'fisik',
    isCritical: true,
  },
  {
    id: 'item_11',
    question: '11. Apakah bracket atau dudukan APAR terpasang kuat dan kokoh?',
    category: 'lokasi',
    isCritical: false,
  },
  {
    id: 'item_12',
    question: '12. Apakah akses menuju APAR bebas hambatan minimal radius 1 meter?',
    category: 'akses',
    isCritical: false,
  },
  {
    id: 'item_13',
    question: '13. Apakah kondisi fisik APAR secara keseluruhan layak dioperasikan?',
    category: 'fisik',
    isCritical: true,
  },
];

export interface MediaCheckItem {
  id: string;
  question: string;
  hint: string;
  isCritical: boolean;
}

export const MEDIA_SPECIFIC_CHECKS: Record<MediaType, MediaCheckItem[]> = {
  'CO2': [
    {
      id: 'co2_horn',
      question: 'Kondisi corong corong pelepasan (discharge horn) tidak pecah / retak & terisolasi baik?',
      hint: 'Mencegah bahaya cold burn / frostbite saat pemakaian gas CO2',
      isCritical: true,
    },
    {
      id: 'co2_weight',
      question: 'Pemeriksaan bobot tabung (berat bruto tidak berkurang >10% dari berat tara)?',
      hint: 'Indikasi kebocoran gas cair CO2 bertekanan tinggi',
      isCritical: true,
    },
  ],
  'ABC Powder': [
    {
      id: 'powder_flow',
      question: 'Kondisi serbuk kimia tidak menggumpal (tabung dibalik 2-3 kali terdengar mengalir)?',
      hint: 'Bubuk powder harus tetap gembur dan tidak mengeras akibat kelembapan',
      isCritical: false,
    },
    {
      id: 'powder_moisture',
      question: 'Tutup nozzle/discharge seal bebas dari sumbatan bubuk kering?',
      hint: 'Mencegah macet saat tuas ditekan',
      isCritical: true,
    },
  ],
  'Foam': [
    {
      id: 'foam_aerator',
      question: 'Saluran udara/aerator pada foam nozzle tidak tersumbat kerak foam?',
      hint: 'Dibutuhkan agar busa AFFF dapat berekspansi sempurna',
      isCritical: true,
    },
    {
      id: 'foam_leak',
      question: 'Bebas dari rembesan cairan busa di dasar tabung dan sambungan las?',
      hint: 'Cairan foam bersifat korosif jika terjadi kebocoran',
      isCritical: true,
    },
  ],
  'Clean Agent': [
    {
      id: 'clean_pressure',
      question: 'Indikator gas propellant dalam rentang tekanan kerja optimal?',
      hint: 'Gas bersih HFC/Halotron peka terhadap perubahan suhu ekstrem',
      isCritical: true,
    },
  ],
  'Water Mist': [
    {
      id: 'mist_nozzle',
      question: 'Lubang micro-nozzle bebas dari kotoran atau kerak mineral air?',
      hint: 'Mencegah penyumbatan semprotan kabut air',
      isCritical: true,
    },
  ],
};

/**
 * Determine automatic status based on rules:
 * - If all applicable items are 'BAIK' -> 'BAIK'
 * - If any critical item is 'TIDAK BAIK' -> 'TIDAK LAYAK'
 * - If only non-critical items are 'TIDAK BAIK' -> 'PERLU TINDAKAN'
 */
export function evaluateInspectionStatus(
  standardChecklist: Record<string, ChecklistValue>,
  mediaChecks: Record<string, ChecklistValue> | undefined,
  mediaType: MediaType
): {
  finalStatus: 'BAIK' | 'PERLU TINDAKAN' | 'TIDAK LAYAK';
  criticalIssues: string[];
  minorIssues: string[];
} {
  const crit: string[] = [];
  const min: string[] = [];

  // Check standard items
  for (const item of STANDARD_CHECKLIST_ITEMS) {
    // If not applicable for this media type, skip or treat as N/A
    if (item.applicableMedia && !item.applicableMedia.includes(mediaType)) {
      continue;
    }
    const val = standardChecklist[item.id];
    if (val === 'TIDAK BAIK') {
      if (item.isCritical) {
        crit.push(item.question);
      } else {
        min.push(item.question);
      }
    }
  }

  // Check media specific items
  const extraChecks = MEDIA_SPECIFIC_CHECKS[mediaType] || [];
  if (mediaChecks) {
    for (const item of extraChecks) {
      const val = mediaChecks[item.id];
      if (val === 'TIDAK BAIK') {
        if (item.isCritical) {
          crit.push(item.question);
        } else {
          min.push(item.question);
        }
      }
    }
  }

  let finalStatus: 'BAIK' | 'PERLU TINDAKAN' | 'TIDAK LAYAK' = 'BAIK';
  if (crit.length > 0) {
    finalStatus = 'TIDAK LAYAK';
  } else if (min.length > 0) {
    finalStatus = 'PERLU TINDAKAN';
  }

  return {
    finalStatus,
    criticalIssues: crit,
    minorIssues: min,
  };
}

/**
 * Calculate ISO 8601 week number and year
 */
export function getIsoWeek(date: Date = new Date()): { week: number; year: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return {
    week: weekNumber,
    year: target.getFullYear(),
  };
}

/**
 * Check if a date string is within the current week
 */
export function isDateInCurrentWeek(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const currentWeek = getIsoWeek(new Date());
  const itemWeek = getIsoWeek(d);
  return currentWeek.week === itemWeek.week && currentWeek.year === itemWeek.year;
}

/**
 * Check if date is expiring soon (within specified days, e.g. 30 days) or already expired
 */
export function checkExpiryStatus(dateStr: string | undefined, warningDays = 30): {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
} {
  if (!dateStr) return { isExpired: false, isExpiringSoon: false, daysRemaining: 999 };
  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) return { isExpired: false, isExpiringSoon: false, daysRemaining: 999 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isExpired: daysRemaining < 0,
    isExpiringSoon: daysRemaining >= 0 && daysRemaining <= warningDays,
    daysRemaining,
  };
}
