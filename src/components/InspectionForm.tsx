import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Camera, 
  Save, 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  MapPin, 
  Tag, 
  ShieldAlert, 
  Info,
  Check,
  Upload
} from 'lucide-react';
import { 
  AparItem, 
  ChecklistValue, 
  InspectionRecord 
} from '../types';
import { 
  STANDARD_CHECKLIST_ITEMS, 
  MEDIA_SPECIFIC_CHECKS, 
  evaluateInspectionStatus, 
  getIsoWeek 
} from '../utils/inspectionLogic';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface InspectionFormProps {
  apar: AparItem;
  onSuccess: (inspectionId: string) => void;
  onCancel: () => void;
}

export const InspectionForm: React.FC<InspectionFormProps> = ({
  apar,
  onSuccess,
  onCancel,
}) => {
  const { addInspection } = useApp();
  const { currentUser } = useAuth();

  // Current date and time (automatic)
  const now = new Date();
  const currentDateStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toTimeString().split(' ')[0].slice(0, 5); // HH:mm
  const { week, year } = getIsoWeek(now);

  // Standard checklist state (initialized with empty or defaults)
  const [checklist, setChecklist] = useState<Record<string, ChecklistValue>>(() => {
    const initial: Record<string, ChecklistValue> = {};
    STANDARD_CHECKLIST_ITEMS.forEach(item => {
      // If pressure gauge check and APAR is CO2, default to 'TIDAK BERLAKU'
      if (item.id === 'item_8' && apar.mediaType === 'CO2') {
        initial[item.id] = 'TIDAK BERLAKU';
      }
    });
    return initial;
  });

  // Media-specific checks state
  const [mediaChecks, setMediaChecks] = useState<Record<string, ChecklistValue>>({});

  // Additional form inputs
  const [notes, setNotes] = useState('');
  const [actionRecommendation, setActionRecommendation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Applicable checklist items for this media type
  const applicableStandardItems = useMemo(() => {
    return STANDARD_CHECKLIST_ITEMS.filter(item => {
      if (item.applicableMedia && !item.applicableMedia.includes(apar.mediaType)) {
        return false;
      }
      return true;
    });
  }, [apar.mediaType]);

  const specificCheckItems = useMemo(() => {
    return MEDIA_SPECIFIC_CHECKS[apar.mediaType] || [];
  }, [apar.mediaType]);

  // Live status evaluation
  const liveEvaluation = useMemo(() => {
    return evaluateInspectionStatus(checklist, mediaChecks, apar.mediaType);
  }, [checklist, mediaChecks, apar.mediaType]);

  // Quick fill all remaining as BAIK button (very handy for field inspectors)
  const handleQuickFillGood = () => {
    const nextChecklist = { ...checklist };
    applicableStandardItems.forEach(item => {
      if (!nextChecklist[item.id]) {
        nextChecklist[item.id] = 'BAIK';
      }
    });

    const nextMediaChecks = { ...mediaChecks };
    specificCheckItems.forEach(item => {
      if (!nextMediaChecks[item.id]) {
        nextMediaChecks[item.id] = 'BAIK';
      }
    });

    setChecklist(nextChecklist);
    setMediaChecks(nextMediaChecks);
  };

  const handleStandardItemChange = (itemId: string, value: ChecklistValue) => {
    setChecklist(prev => ({ ...prev, [itemId]: value }));
  };

  const handleMediaCheckChange = (itemId: string, value: ChecklistValue) => {
    setMediaChecks(prev => ({ ...prev, [itemId]: value }));
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar (maksimal 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation: Check that every applicable standard item is filled
    for (const item of applicableStandardItems) {
      if (!checklist[item.id]) {
        setValidationError(`Mohon isi jawaban untuk: "${item.question}"`);
        return;
      }
    }

    // Validation: Check that every specific item is filled
    for (const item of specificCheckItems) {
      if (!mediaChecks[item.id]) {
        setValidationError(`Mohon isi pemeriksaan khusus: "${item.question}"`);
        return;
      }
    }

    // If status is not BAIK, encourage adding notes
    if (liveEvaluation.finalStatus !== 'BAIK' && !notes.trim()) {
      setValidationError('Wajib mengisi catatan temuan inspeksi untuk APAR yang tidak normal / bermasalah.');
      return;
    }

    try {
      setIsSubmitting(true);

      const inspectionId = await addInspection({
        aparId: apar.id,
        aparCode: apar.aparCode,
        inventoryNumber: apar.inventoryNumber,
        mediaType: apar.mediaType,
        location: apar.locationDetail,
        area: apar.area,
        building: apar.building,
        inspectionDate: currentDateStr,
        inspectionTime: currentTimeStr,
        inspectorId: currentUser?.id || 'usr_unknown',
        inspectorName: currentUser?.name || 'Petugas Inspeksi HSE',
        weekNumber: week,
        year,
        checklist,
        mediaSpecificChecks: mediaChecks,
        finalStatus: liveEvaluation.finalStatus,
        notes: notes.trim(),
        actionRecommendation: actionRecommendation.trim(),
        photoUrl: photoUrl || undefined,
        followUpStatus: liveEvaluation.finalStatus === 'BAIK' ? 'none' : 'pending',
      });

      onSuccess(inspectionId);
    } catch (err: any) {
      setValidationError(err.message || 'Gagal menyimpan data inspeksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Batal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <ClipboardCheck className="w-6 h-6 text-red-500" />
              <span>Formulir Checklist Inspeksi Mingguan</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemeriksaan fisik & keselamatan tabung APAR Minggu ke-{week} ({year})
            </p>
          </div>
        </div>
      </div>

      {/* APAR Target Identity Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-red-950 text-red-400 border border-red-800 flex items-center justify-center font-bold text-lg">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-black text-white">{apar.aparCode}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  {apar.mediaType} ({apar.capacity})
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{apar.inventoryNumber} • {apar.brand}</p>
              <div className="flex items-center space-x-1.5 text-xs text-slate-300 mt-1">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">{apar.building} — {apar.area}</span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
            <div className="flex items-center space-x-1 sm:justify-end">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-200">{currentUser?.name}</span>
            </div>
            <div className="flex items-center space-x-1 sm:justify-end mt-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentDateStr} • {currentTimeStr} WIB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Status Evaluator Floating Banner */}
      <div className={`p-4 rounded-2xl border transition-all shadow-lg flex items-center justify-between ${
        liveEvaluation.finalStatus === 'BAIK' 
          ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
          : liveEvaluation.finalStatus === 'TIDAK LAYAK' 
          ? 'bg-red-950/60 border-red-800 text-red-200 animate-pulse' 
          : 'bg-amber-950/50 border-amber-800 text-amber-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-slate-900/60">
            {liveEvaluation.finalStatus === 'BAIK' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
            {liveEvaluation.finalStatus === 'PERLU TINDAKAN' && <AlertTriangle className="w-6 h-6 text-amber-400" />}
            {liveEvaluation.finalStatus === 'TIDAK LAYAK' && <XCircle className="w-6 h-6 text-red-500" />}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
              Prediksi Status Akhir Otomatis:
            </span>
            <span className="text-base font-black tracking-wide">
              {liveEvaluation.finalStatus}
            </span>
            {liveEvaluation.criticalIssues.length > 0 && (
              <span className="text-xs block text-red-300 font-medium mt-0.5">
                {liveEvaluation.criticalIssues.length} temuan kondisi kritis terdeteksi!
              </span>
            )}
          </div>
        </div>

        {/* Quick Fill Good Button */}
        <button
          type="button"
          onClick={handleQuickFillGood}
          className="text-xs px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-750 font-semibold cursor-pointer shadow-xs"
        >
          Isi Semua "BAIK"
        </button>
      </div>

      {validationError && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Checklist Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 13 Standard Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              13 Poin Checklist Standar HSE (Pabrik V-Belt)
            </h2>
            <span className="text-[11px] text-slate-500">
              Sentuh opsi pilihan untuk tiap butir
            </span>
          </div>

          <div className="space-y-3">
            {applicableStandardItems.map((item, index) => {
              const currentVal = checklist[item.id];

              return (
                <div 
                  key={item.id} 
                  className={`p-3.5 rounded-xl border transition-colors ${
                    currentVal === 'TIDAK BAIK' 
                      ? item.isCritical 
                        ? 'bg-red-950/30 border-red-800/80' 
                        : 'bg-amber-950/20 border-amber-800/60'
                      : currentVal === 'BAIK' 
                      ? 'bg-slate-850/50 border-slate-800' 
                      : 'bg-slate-850/30 border-slate-800/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        {item.question}
                      </p>
                      {item.isCritical && (
                        <span className="inline-block mt-1 text-[9px] uppercase font-bold text-red-400 px-1.5 py-0.2 rounded bg-red-950/80 border border-red-800/50">
                          Poin Kritis Keselamatan
                        </span>
                      )}
                    </div>

                    {/* Touch Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 sm:w-72 shrink-0">
                      
                      {/* BAIK Button */}
                      <button
                        type="button"
                        onClick={() => handleStandardItemChange(item.id, 'BAIK')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          currentVal === 'BAIK'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 scale-102 ring-2 ring-emerald-400'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>BAIK</span>
                      </button>

                      {/* TIDAK BAIK Button */}
                      <button
                        type="button"
                        onClick={() => handleStandardItemChange(item.id, 'TIDAK BAIK')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          currentVal === 'TIDAK BAIK'
                            ? item.isCritical
                              ? 'bg-red-600 text-white shadow-md shadow-red-950/50 scale-102 ring-2 ring-red-400'
                              : 'bg-amber-600 text-white shadow-md shadow-amber-950/50 scale-102 ring-2 ring-amber-400'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>TIDAK BAIK</span>
                      </button>

                      {/* TIDAK BERLAKU Button */}
                      <button
                        type="button"
                        onClick={() => handleStandardItemChange(item.id, 'TIDAK BERLAKU')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center cursor-pointer ${
                          currentVal === 'TIDAK BERLAKU'
                            ? 'bg-slate-700 text-slate-200 ring-2 ring-slate-500 scale-102'
                            : 'bg-slate-800 text-slate-500 hover:text-slate-400 hover:bg-slate-750'
                        }`}
                      >
                        <span>N/A</span>
                      </button>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Media Specific Checks */}
        {specificCheckItems.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="pb-2 border-b border-slate-800">
              <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Flame className="w-4 h-4" />
                <span>Pemeriksaan Khusus Media: {apar.mediaType}</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pemeriksaan karakter spesifik sesuai tipe agen pemadam (CO2, Powder, Foam, Clean Agent).
              </p>
            </div>

            <div className="space-y-3">
              {specificCheckItems.map((item) => {
                const currentVal = mediaChecks[item.id];

                return (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-850/40"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-white">
                          {item.question}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.hint}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 sm:w-72 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMediaCheckChange(item.id, 'BAIK')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                            currentVal === 'BAIK'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 scale-102 ring-2 ring-emerald-400'
                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>BAIK</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMediaCheckChange(item.id, 'TIDAK BAIK')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                            currentVal === 'TIDAK BAIK'
                              ? 'bg-red-600 text-white shadow-md shadow-red-950/50 scale-102 ring-2 ring-red-400'
                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>TIDAK BAIK</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMediaCheckChange(item.id, 'TIDAK BERLAKU')}
                          className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center cursor-pointer ${
                            currentVal === 'TIDAK BERLAKU'
                              ? 'bg-slate-700 text-slate-200 ring-2 ring-slate-500 scale-102'
                              : 'bg-slate-800 text-slate-500 hover:text-slate-400 hover:bg-slate-750'
                          }`}
                        >
                          <span>N/A</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload Foto & Catatan Lapangan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
            Foto Bukti & Catatan Petugas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Foto Inspeksi */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Foto Bukti Kondisi APAR (Kamera / File)
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 cursor-pointer transition-colors">
                  <Camera className="w-4 h-4 text-red-400" />
                  <span>Ambil / Unggah Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>
                {photoUrl && (
                  <span className="text-xs text-emerald-400 font-medium">Foto tersimpan ✓</span>
                )}
              </div>
              {photoUrl && (
                <div className="mt-3 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700">
                  <img src={photoUrl} alt="Bukti Inspeksi" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Catatan & Rekomendasi */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Catatan Temuan Lapangan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Barometer normal di zona hijau, pin utuh, tabung bersih bebas debu vulkanisasi..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Rekomendasi Tindakan Lanjutan (Jika Ada Temuan)
                </label>
                <textarea
                  value={actionRecommendation}
                  onChange={(e) => setActionRecommendation(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Pindahkan palet penghalang berjarak min 1 meter atau lakukan penggantian segel..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-base shadow-xl shadow-red-950/50 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{isSubmitting ? 'Menyimpan...' : 'SIMPAN HASIL INSPEKSI'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
