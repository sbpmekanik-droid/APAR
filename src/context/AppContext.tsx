import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AparItem, 
  InspectionRecord, 
  AuditLogItem, 
  SystemSettings 
} from '../types';
import { 
  INITIAL_DEMO_APARS, 
  INITIAL_DEMO_INSPECTIONS, 
  DEFAULT_SETTINGS 
} from '../utils/seedData';
import { useAuth } from './AuthContext';
import { db, testConnection } from '../firebase/config';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';

interface AppContextType {
  apars: AparItem[];
  inspections: InspectionRecord[];
  auditLogs: AuditLogItem[];
  settings: SystemSettings;
  loading: boolean;
  isFirestoreConnected: boolean;
  addApar: (apar: Omit<AparItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateApar: (id: string, updates: Partial<AparItem>) => Promise<void>;
  deactivateApar: (id: string, reason: string) => Promise<void>;
  activateApar: (id: string) => Promise<void>;
  deleteApar: (id: string) => Promise<void>;
  addInspection: (inspection: Omit<InspectionRecord, 'id' | 'createdAt'>) => Promise<string>;
  updateFollowUp: (
    inspectionId: string, 
    status: 'none' | 'pending' | 'in_progress' | 'resolved', 
    notes?: string, 
    replacementAparId?: string
  ) => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  resetToDemoData: () => void;
  getAparById: (id: string) => AparItem | undefined;
  getInspectionsByAparId: (aparId: string) => InspectionRecord[];
  generateNextAparCode: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_APARS = 'hse_apar_items';
const LOCAL_STORAGE_INSPECTIONS = 'hse_apar_inspections';
const LOCAL_STORAGE_LOGS = 'hse_apar_audit_logs';
const LOCAL_STORAGE_SETTINGS = 'hse_apar_settings';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  const [apars, setApars] = useState<AparItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_APARS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_DEMO_APARS;
  });

  const [inspections, setInspections] = useState<InspectionRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_INSPECTIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_DEMO_INSPECTIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_LOGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'log_001',
        entityType: 'APAR',
        entityId: 'APAR-VBLT-001',
        action: 'CREATE',
        userId: 'usr_admin_01',
        userName: 'Budi Santoso, S.T.',
        timestamp: '2024-02-15T10:00:00Z',
        details: 'Pendaftaran awal APAR Banbury & Mixing V-Belt Unit 1',
      },
      {
        id: 'log_002',
        entityType: 'APAR',
        entityId: 'APAR-VBLT-010',
        action: 'STATUS_CHANGE',
        userId: 'usr_admin_01',
        userName: 'Budi Santoso, S.T.',
        timestamp: '2026-09-15T10:00:00Z',
        details: 'Penonaktifan APAR: Tabung pensiun karena korosi dinding tabung.',
      },
    ];
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_SETTINGS;
  });

  const [loading, setLoading] = useState(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_APARS, JSON.stringify(apars));
  }, [apars]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_INSPECTIONS, JSON.stringify(inspections));
  }, [inspections]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Helper to remove any undefined fields before writing to Firestore
  const cleanData = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(cleanData);
    if (typeof obj === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          result[key] = cleanData(value);
        }
      }
      return result;
    }
    return obj;
  };

  // Live Firestore Real-Time Synchronization across all devices
  useEffect(() => {
    let unsubApar: (() => void) | undefined;
    let unsubInsp: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    async function initFirestoreSync() {
      try {
        setIsFirestoreConnected(true);

        // 1. Live APAR collection listener
        unsubApar = onSnapshot(collection(db, 'apars'), (snap) => {
          if (!snap.empty) {
            const list: AparItem[] = [];
            snap.forEach((d) => list.push(d.data() as AparItem));
            setApars(list);
          }
        }, (err) => console.warn('Apar live sync notice:', err));

        // 2. Live Inspections collection listener
        unsubInsp = onSnapshot(collection(db, 'inspections'), (snap) => {
          if (!snap.empty) {
            const list: InspectionRecord[] = [];
            snap.forEach((d) => list.push(d.data() as InspectionRecord));
            setInspections(list);
          }
        }, (err) => console.warn('Inspections live sync notice:', err));

        // 3. Live Audit Logs listener
        unsubLogs = onSnapshot(collection(db, 'audit_logs'), (snap) => {
          if (!snap.empty) {
            const list: AuditLogItem[] = [];
            snap.forEach((d) => list.push(d.data() as AuditLogItem));
            setAuditLogs(list);
          }
        }, (err) => console.warn('Logs live sync notice:', err));

        // 4. Live Settings listener
        unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
          if (snap.exists()) {
            setSettings(snap.data() as SystemSettings);
          }
        }, (err) => console.warn('Settings live sync notice:', err));

      } catch (e) {
        console.warn('Firestore sync setup notice:', e);
      }
    }

    initFirestoreSync();

    return () => {
      if (unsubApar) unsubApar();
      if (unsubInsp) unsubInsp();
      if (unsubLogs) unsubLogs();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  const addAuditLog = (
    entityType: 'APAR' | 'INSPECTION' | 'USER' | 'SETTINGS',
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'DELETE' | 'RESOLVE_ACTION',
    details: string
  ) => {
    const newLog: AuditLogItem = {
      id: `log_${Date.now()}`,
      entityType,
      entityId,
      action,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Administrator HSE',
      timestamp: new Date().toISOString(),
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Firestore async sync
    if (isFirestoreConnected) {
      setDoc(doc(db, 'audit_logs', newLog.id), cleanData(newLog)).catch(e => console.warn(e));
    }
  };

  const generateNextAparCode = (): string => {
    const numbers = apars
      .map(a => {
        const match = a.aparCode.match(/APAR-VBLT-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));

    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    const next = max + 1;
    return `APAR-VBLT-${String(next).padStart(3, '0')}`;
  };

  const addApar = async (aparData: Omit<AparItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const aparCode = aparData.aparCode || generateNextAparCode();
    const id = aparCode;
    const now = new Date().toISOString();

    const newApar: AparItem = {
      ...aparData,
      id,
      aparCode,
      createdAt: now,
      updatedAt: now,
    };

    setApars(prev => [newApar, ...prev]);
    addAuditLog('APAR', id, 'CREATE', `Mendaftarkan APAR baru: ${aparCode} (${newApar.mediaType} ${newApar.capacity}) di ${newApar.building} - ${newApar.area}`);

    if (isFirestoreConnected) {
      try {
        await setDoc(doc(db, 'apars', id), cleanData(newApar));
      } catch (e) {
        console.warn('Saved locally, Firestore sync error:', e);
      }
    }

    return id;
  };

  const updateApar = async (id: string, updates: Partial<AparItem>) => {
    const now = new Date().toISOString();
    setApars(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, ...updates, updatedAt: now };
      }
      return a;
    }));

    addAuditLog('APAR', id, 'UPDATE', `Memperbarui data master APAR ${id}: ${Object.keys(updates).join(', ')}`);

    if (isFirestoreConnected) {
      try {
        await updateDoc(doc(db, 'apars', id), cleanData({ ...updates, updatedAt: now }));
      } catch (e) {
        console.warn('Update kept locally, Firestore notice:', e);
      }
    }
  };

  const deactivateApar = async (id: string, reason: string) => {
    const now = new Date().toISOString();
    setApars(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: 'nonaktif', inactiveReason: reason, updatedAt: now };
      }
      return a;
    }));

    addAuditLog('APAR', id, 'STATUS_CHANGE', `Menonaktifkan APAR ${id}. Alasan: ${reason}`);

    if (isFirestoreConnected) {
      try {
        await updateDoc(doc(db, 'apars', id), cleanData({
          status: 'nonaktif',
          inactiveReason: reason,
          updatedAt: now,
        }));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const activateApar = async (id: string) => {
    const now = new Date().toISOString();
    setApars(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: 'aktif', inactiveReason: '', updatedAt: now };
      }
      return a;
    }));

    addAuditLog('APAR', id, 'STATUS_CHANGE', `Mengaktifkan kembali APAR ${id} ke operasional`);

    if (isFirestoreConnected) {
      try {
        await updateDoc(doc(db, 'apars', id), cleanData({
          status: 'aktif',
          inactiveReason: '',
          updatedAt: now,
        }));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const deleteApar = async (id: string) => {
    setApars(prev => prev.filter(a => a.id !== id));
    addAuditLog('APAR', id, 'DELETE', `Menghapus data APAR ${id} dari database`);

    if (isFirestoreConnected) {
      try {
        await deleteDoc(doc(db, 'apars', id));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const addInspection = async (inspectionData: Omit<InspectionRecord, 'id' | 'createdAt'>): Promise<string> => {
    const now = new Date();
    const id = `INSP-${now.toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    
    const newInspection: InspectionRecord = {
      ...inspectionData,
      id,
      createdAt: now.toISOString(),
    };

    // Save inspection permanently
    setInspections(prev => [newInspection, ...prev]);

    // Update APAR master record's latest inspection timestamp and condition
    setApars(prev => prev.map(a => {
      if (a.id === newInspection.aparId || a.aparCode === newInspection.aparCode) {
        return {
          ...a,
          lastInspectionDate: newInspection.inspectionDate,
          lastInspectionStatus: newInspection.finalStatus,
          lastInspectorName: newInspection.inspectorName,
          updatedAt: now.toISOString(),
        };
      }
      return a;
    }));

    addAuditLog(
      'INSPECTION', 
      id, 
      'CREATE', 
      `Inspeksi mingguan APAR ${newInspection.aparCode} oleh ${newInspection.inspectorName}. Hasil: ${newInspection.finalStatus}`
    );

    if (isFirestoreConnected) {
      try {
        await setDoc(doc(db, 'inspections', id), cleanData(newInspection));
        await updateDoc(doc(db, 'apars', newInspection.aparId), cleanData({
          lastInspectionDate: newInspection.inspectionDate,
          lastInspectionStatus: newInspection.finalStatus,
          lastInspectorName: newInspection.inspectorName,
          updatedAt: now.toISOString(),
        }));
      } catch (e) {
        console.warn('Synced locally, Firestore error:', e);
      }
    }

    return id;
  };

  const updateFollowUp = async (
    inspectionId: string, 
    status: 'none' | 'pending' | 'in_progress' | 'resolved', 
    notes?: string, 
    replacementAparId?: string
  ) => {
    const now = new Date().toISOString();
    setInspections(prev => prev.map(insp => {
      if (insp.id === inspectionId) {
        return {
          ...insp,
          followUpStatus: status,
          followUpNotes: notes || insp.followUpNotes,
          temporaryReplacementAparId: replacementAparId || insp.temporaryReplacementAparId,
          resolvedAt: status === 'resolved' ? now : insp.resolvedAt,
          resolvedBy: status === 'resolved' ? currentUser?.name : insp.resolvedBy,
        };
      }
      return insp;
    }));

    addAuditLog(
      'INSPECTION', 
      inspectionId, 
      'RESOLVE_ACTION', 
      `Update status tindak lanjut temuan inspeksi ${inspectionId} menjadi: ${status}. Catatan: ${notes || '-'}`
    );

    if (isFirestoreConnected) {
      try {
        await updateDoc(doc(db, 'inspections', inspectionId), cleanData({
          followUpStatus: status,
          followUpNotes: notes || '',
          temporaryReplacementAparId: replacementAparId || '',
          resolvedAt: status === 'resolved' ? now : null,
          resolvedBy: status === 'resolved' ? currentUser?.name : null,
        }));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    addAuditLog('SETTINGS', 'global', 'UPDATE', 'Memperbarui pengaturan sistem HSE & konfigurasi label');
    if (isFirestoreConnected) {
      try {
        await setDoc(doc(db, 'settings', 'global'), cleanData(updated));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const resetToDemoData = () => {
    setApars(INITIAL_DEMO_APARS);
    setInspections(INITIAL_DEMO_INSPECTIONS);
    setSettings(DEFAULT_SETTINGS);
    addAuditLog('SETTINGS', 'system', 'UPDATE', 'Reset data simulasi Pabrik Manufaktur V-Belt');
  };

  const getAparById = (id: string) => {
    return apars.find(a => a.id === id || a.aparCode === id);
  };

  const getInspectionsByAparId = (aparId: string) => {
    return inspections.filter(i => i.aparId === aparId || i.aparCode === aparId);
  };

  return (
    <AppContext.Provider
      value={{
        apars,
        inspections,
        auditLogs,
        settings,
        loading,
        isFirestoreConnected,
        addApar,
        updateApar,
        deactivateApar,
        activateApar,
        deleteApar,
        addInspection,
        updateFollowUp,
        updateSettings,
        resetToDemoData,
        getAparById,
        getInspectionsByAparId,
        generateNextAparCode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
