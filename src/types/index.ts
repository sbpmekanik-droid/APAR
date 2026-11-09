export type UserRole = 'admin' | 'inspector';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
}

export type MediaType = 'ABC Powder' | 'CO2' | 'Foam' | 'Clean Agent' | 'Water Mist';

export type AparStatus = 'aktif' | 'nonaktif';

export type InspectionEvaluationStatus = 'BAIK' | 'PERLU TINDAKAN' | 'TIDAK LAYAK' | 'BELUM DIPERIKSA';

export interface AparItem {
  id: string; // e.g. "APAR-VBLT-001"
  aparCode: string;
  inventoryNumber: string; // e.g. "INV-VBLT/HSE/2024/001"
  mediaType: MediaType;
  capacity: string; // e.g. "6 kg", "4.5 kg", "6 L"
  brand: string; // e.g. "Yamato", "Servvo", "Chubb"
  serialNumber: string;
  building: string; // e.g. "Gedung Produksi Utama"
  area: string; // e.g. "Area Banbury & Mixing Rubber"
  locationDetail: string; // e.g. "Pilar B-08 samping panel listrik utama"
  procurementDate: string; // YYYY-MM-DD
  lastRefillDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD (next refill / hydrostatic test)
  status: AparStatus;
  inactiveReason?: string;
  photoUrl?: string;
  notes?: string;
  lastInspectionDate?: string;
  lastInspectionStatus?: InspectionEvaluationStatus;
  lastInspectorName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChecklistValue = 'BAIK' | 'TIDAK BAIK' | 'TIDAK BERLAKU';

export interface ChecklistItemDef {
  id: string;
  question: string;
  category: 'lokasi' | 'fisik' | 'keselamatan' | 'akses';
  isCritical: boolean; // if TIDAK BAIK, triggers TIDAK LAYAK
  applicableMedia?: MediaType[]; // if omitted, applies to all
}

export interface InspectionRecord {
  id: string; // e.g. "INSP-20261108-001"
  aparId: string;
  aparCode: string;
  inventoryNumber: string;
  mediaType: MediaType;
  location: string;
  area: string;
  building: string;
  inspectionDate: string; // YYYY-MM-DD
  inspectionTime: string; // HH:mm:ss
  inspectorId: string;
  inspectorName: string;
  weekNumber: number; // 1-52
  year: number;
  checklist: Record<string, ChecklistValue>;
  mediaSpecificChecks?: Record<string, ChecklistValue>;
  finalStatus: 'BAIK' | 'PERLU TINDAKAN' | 'TIDAK LAYAK';
  notes?: string;
  actionRecommendation?: string;
  photoUrl?: string;
  followUpStatus: 'none' | 'pending' | 'in_progress' | 'resolved';
  followUpNotes?: string;
  temporaryReplacementAparId?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  entityType: 'APAR' | 'INSPECTION' | 'USER' | 'SETTINGS';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'DELETE' | 'RESOLVE_ACTION';
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

export interface SystemSettings {
  companyName: string;
  departmentName: string;
  plantLocation: string;
  labelSize: 'standard' | 'large' | 'compact';
  labelsPerPage: 8 | 10 | 12;
  inspectionCycleDays: number;
  hseManagerName: string;
  hseManagerTitle: string;
}
