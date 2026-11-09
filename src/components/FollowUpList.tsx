import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Save, 
  X, 
  MapPin, 
  User, 
  Calendar,
  Flame,
  ArrowRight
} from 'lucide-react';
import { InspectionRecord } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const FollowUpList: React.FC = () => {
  const { inspections, apars, updateFollowUp } = useApp();
  const { isAdmin, currentUser } = useAuth();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);

  // Form states for update modal
  const [modalStatus, setModalStatus] = useState<'pending' | 'in_progress' | 'resolved'>('pending');
  const [modalNotes, setModalNotes] = useState('');
  const [modalReplacementApar, setModalReplacementApar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Problematic inspections needing follow-up
  const followUpItems = useMemo(() => {
    return inspections.filter(i => {
      // Items that were evaluated as TIDAK LAYAK or PERLU TINDAKAN
      const isProblematic = i.finalStatus === 'TIDAK LAYAK' || i.finalStatus === 'PERLU TINDAKAN';
      const hasFollowUp = i.followUpStatus !== 'none';
      return isProblematic || hasFollowUp;
    }).filter(i => {
      if (filterStatus === 'all') return true;
      return i.followUpStatus === filterStatus;
    });
  }, [inspections, filterStatus]);

  const handleOpenModal = (insp: InspectionRecord) => {
    setSelectedInspection(insp);
    setModalStatus(insp.followUpStatus === 'none' ? 'pending' : (insp.followUpStatus as any));
    setModalNotes(insp.followUpNotes || '');
    setModalReplacementApar(insp.temporaryReplacementAparId || '');
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInspection) return;

    try {
      setIsSubmitting(true);
      await updateFollowUp(
        selectedInspection.id,
        modalStatus,
        modalNotes.trim(),
        modalReplacementApar.trim() || undefined
      );
      setSelectedInspection(null);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui status tindak lanjut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = inspections.filter(i => i.followUpStatus === 'pending').length;
  const inProgressCount = inspections.filter(i => i.followUpStatus === 'in_progress').length;
  const resolvedCount = inspections.filter(i => i.followUpStatus === 'resolved').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Wrench className="w-6 h-6 text-red-500" />
            <span>Tindak Lanjut & Perbaikan APAR Bermasalah</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar prioritas penanganan tabung rusak, perbaikan seal, pemindahan hambatan, dan penempatan APAR pengganti sementara.
          </p>
        </div>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setFilterStatus('pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'pending'
              ? 'bg-red-950/70 border-red-700 ring-2 ring-red-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-red-400 uppercase">Belum Ditindaklanjuti</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{pendingCount} Kasus</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Memerlukan disposisi HSE segera</p>
        </button>

        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'in_progress'
              ? 'bg-amber-950/70 border-amber-700 ring-2 ring-amber-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-400 uppercase">Sedang Diperbaiki</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{inProgressCount} Kasus</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Dalam proses workshop / penggantian</p>
        </button>

        <button
          onClick={() => setFilterStatus('resolved')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'resolved'
              ? 'bg-emerald-950/70 border-emerald-700 ring-2 ring-emerald-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-400 uppercase">Selesai Diperbaiki</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{resolvedCount} Kasus</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Telah diverifikasi normal kembali</p>
        </button>
      </div>

      {/* Main List */}
      <div className="space-y-3">
        {followUpItems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
            <p className="font-bold text-slate-300">Tidak ada item tindak lanjut pada filter ini.</p>
            <p className="text-xs text-slate-400 mt-1">Seluruh tabung APAR di lini produksi dalam keadaan prima.</p>
          </div>
        ) : (
          followUpItems.map((insp) => {
            const isCritical = insp.finalStatus === 'TIDAK LAYAK';

            return (
              <div 
                key={insp.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all ${
                  isCritical ? 'border-red-900/60' : 'border-amber-900/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-black text-white text-base font-mono">{insp.aparCode}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {insp.mediaType}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-white'
                      }`}>
                        {insp.finalStatus}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        insp.followUpStatus === 'resolved' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                        insp.followUpStatus === 'in_progress' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                        'bg-red-950 text-red-300 border-red-800'
                      }`}>
                        {insp.followUpStatus === 'resolved' ? 'SELESAI DIPERBAIKI' :
                         insp.followUpStatus === 'in_progress' ? 'SEDANG DIPERBAIKI' :
                         'BELUM DITINDAKLANJUTI'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{insp.building} • {insp.area} ({insp.location})</span>
                    </div>

                    {/* Findings & Notes */}
                    <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-start space-x-1.5 text-slate-300">
                        <strong className="text-slate-400 shrink-0">Temuan Lapangan:</strong>
                        <span>{insp.notes || 'Tidak ada catatan terlampir.'}</span>
                      </div>
                      {insp.actionRecommendation && (
                        <div className="flex items-start space-x-1.5 text-amber-300 font-medium">
                          <strong className="text-amber-400 shrink-0">Rekomendasi HSE:</strong>
                          <span>{insp.actionRecommendation}</span>
                        </div>
                      )}
                    </div>

                    {/* Temporary Replacement & Follow-up Log */}
                    {(insp.temporaryReplacementAparId || insp.followUpNotes) && (
                      <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/60 text-xs space-y-1">
                        {insp.temporaryReplacementAparId && (
                          <p className="text-blue-300 font-semibold">
                            🛡️ Tabung Cadangan Sementara: <span className="font-mono text-white">{insp.temporaryReplacementAparId}</span>
                          </p>
                        )}
                        {insp.followUpNotes && (
                          <p className="text-slate-300">
                            Log Perbaikan: {insp.followUpNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="sm:self-center shrink-0 flex flex-col space-y-2">
                    <button
                      onClick={() => handleOpenModal(insp)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Update Tindak Lanjut</span>
                    </button>
                    <span className="text-[10px] text-slate-500 text-center">
                      Inspeksi: {insp.inspectionDate}
                    </span>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Follow-up Action Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-white">
                  Formulir Tindak Lanjut ({selectedInspection.aparCode})
                </h3>
              </div>
              <button 
                onClick={() => setSelectedInspection(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="mt-4 space-y-4 text-xs">
              
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Status Penanganan <span className="text-red-400">*</span>:
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-bold"
                >
                  <option value="pending">Belum Ditindaklanjuti</option>
                  <option value="in_progress">Sedang Diperbaiki di Workshop</option>
                  <option value="resolved">Selesai Diperbaiki & Terpasang Kembali</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  ID APAR Pengganti Sementara (Jika Tabung Ditarik):
                </label>
                <input
                  type="text"
                  value={modalReplacementApar}
                  onChange={(e) => setModalReplacementApar(e.target.value)}
                  placeholder="Contoh: APAR-BACKUP-02 (dari gudang cadangan HSE)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Pastikan area produksi tidak pernah ditinggalkan tanpa tabung pemadam aktif.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Catatan Tindakan Perbaikan / Bukti Penyelesaian:
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan tindakan yang telah dilakukan (misal: pengisian ulang powder, penggantian pin & segel baru, atau pemindahan palet material)..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedInspection(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Tindak Lanjut'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
