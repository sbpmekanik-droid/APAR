import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  User, 
  MapPin, 
  Camera, 
  FileText,
  Clock,
  Flame,
  ClipboardCheck,
  X
} from 'lucide-react';
import { InspectionRecord } from '../types';
import { useApp } from '../context/AppContext';
import { STANDARD_CHECKLIST_ITEMS } from '../utils/inspectionLogic';

interface InspectionHistoryProps {
  initialAparId?: string;
  onSelectApar: (aparId: string) => void;
}

export const InspectionHistory: React.FC<InspectionHistoryProps> = ({
  initialAparId,
  onSelectApar,
}) => {
  const { inspections, apars } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialAparId || '');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [viewingInspection, setViewingInspection] = useState<InspectionRecord | null>(null);

  const years = useMemo(() => {
    return Array.from(new Set(inspections.map(i => i.year.toString())));
  }, [inspections]);

  const filteredInspections = useMemo(() => {
    return inspections.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        item.aparCode.toLowerCase().includes(q) ||
        item.inspectorName.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.building.toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q);

      const matchStatus = selectedStatus === 'all' || item.finalStatus === selectedStatus;
      const matchYear = selectedYear === 'all' || item.year.toString() === selectedYear;

      return matchSearch && matchStatus && matchYear;
    }).sort((a, b) => {
      // Sort newest first
      return new Date(`${b.inspectionDate}T${b.inspectionTime || '00:00'}`).getTime() - 
             new Date(`${a.inspectionDate}T${a.inspectionTime || '00:00'}`).getTime();
    });
  }, [inspections, searchQuery, selectedStatus, selectedYear]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <History className="w-6 h-6 text-red-500" />
            <span>Riwayat Seluruh Hasil Inspeksi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Arsip permanen pemeriksaan keselamatan APAR pabrik V-Belt yang tidak dapat diubah atau dihapus.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Total Tersimpan: <strong className="text-white">{inspections.length}</strong> Laporan
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID APAR, Petugas, atau Area..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-red-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Status Hasil</option>
              <option value="BAIK">Kondisi BAIK</option>
              <option value="PERLU TINDAKAN">PERLU TINDAKAN</option>
              <option value="TIDAK LAYAK">TIDAK LAYAK (Kritis)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Tahun</option>
              {years.map(yr => <option key={yr} value={yr}>Tahun {yr}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">ID Inspeksi & APAR</th>
                <th className="px-4 py-3.5">Tanggal & Jam</th>
                <th className="px-4 py-3.5">Lokasi / Area</th>
                <th className="px-4 py-3.5">Petugas Pemeriksa</th>
                <th className="px-4 py-3.5">Hasil Evaluasi</th>
                <th className="px-4 py-3.5">Catatan & Temuan</th>
                <th className="px-4 py-3.5 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <History className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="font-semibold text-slate-300">Tidak ada riwayat inspeksi yang sesuai filter.</p>
                  </td>
                </tr>
              ) : (
                filteredInspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-850/60 transition-colors">
                    {/* ID & APAR */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectApar(insp.aparId)}
                        className="font-bold text-white hover:text-red-400 transition-colors font-mono text-xs sm:text-sm cursor-pointer"
                      >
                        {insp.aparCode}
                      </button>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {insp.id}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {insp.mediaType}
                      </div>
                    </td>

                    {/* Tanggal & Jam */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{insp.inspectionDate}</div>
                      <div className="text-[11px] text-slate-400">{insp.inspectionTime} WIB</div>
                      <div className="text-[10px] text-red-400 font-semibold">Mg-{insp.weekNumber} / {insp.year}</div>
                    </td>

                    {/* Lokasi */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-slate-200 truncate">{insp.area}</div>
                      <div className="text-[11px] text-slate-400 truncate">{insp.building}</div>
                    </td>

                    {/* Petugas */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{insp.inspectorName}</div>
                      <div className="text-[10px] text-slate-400">ID: {insp.inspectorId.slice(-6)}</div>
                    </td>

                    {/* Hasil */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        insp.finalStatus === 'BAIK' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        insp.finalStatus === 'TIDAK LAYAK' ? 'bg-red-950 text-red-300 border border-red-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {insp.finalStatus}
                      </span>
                    </td>

                    {/* Catatan */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-300 line-clamp-1">{insp.notes || '-'}</p>
                      {insp.actionRecommendation && (
                        <p className="text-[10px] text-amber-400 mt-0.5 line-clamp-1">
                          Tindakan: {insp.actionRecommendation}
                        </p>
                      )}
                    </td>

                    {/* Detail Button */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setViewingInspection(insp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Buka Lembar Hasil Checklist"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Inspection Checklist Modal */}
      {viewingInspection && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-200 my-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-950 text-red-400 border border-red-800 flex items-center justify-center font-bold">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Lembar Checklist Hasil Inspeksi ({viewingInspection.id})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tabung: {viewingInspection.aparCode} • {viewingInspection.mediaType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingInspection(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 text-xs">
              <div className="p-2.5 bg-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Tanggal & Jam</span>
                <span className="font-bold text-white">{viewingInspection.inspectionDate} {viewingInspection.inspectionTime}</span>
              </div>
              <div className="p-2.5 bg-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Periode</span>
                <span className="font-bold text-red-400">Minggu {viewingInspection.weekNumber} / {viewingInspection.year}</span>
              </div>
              <div className="p-2.5 bg-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Petugas</span>
                <span className="font-bold text-white truncate block">{viewingInspection.inspectorName}</span>
              </div>
              <div className="p-2.5 bg-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Status Akhir</span>
                <span className={`font-black ${
                  viewingInspection.finalStatus === 'BAIK' ? 'text-emerald-400' :
                  viewingInspection.finalStatus === 'TIDAK LAYAK' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {viewingInspection.finalStatus}
                </span>
              </div>
            </div>

            {/* Checklist Answers Table */}
            <div className="my-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Jawaban 13 Butir Pemeriksaan:
              </h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-slate-800">
                    {STANDARD_CHECKLIST_ITEMS.map((item) => {
                      const val = viewingInspection.checklist[item.id] || 'TIDAK BERLAKU';
                      return (
                        <tr key={item.id} className="hover:bg-slate-850">
                          <td className="px-3 py-2 text-slate-300">{item.question}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              val === 'BAIK' ? 'bg-emerald-950 text-emerald-300' :
                              val === 'TIDAK BAIK' ? 'bg-red-950 text-red-300' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {val}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Photo & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs my-3">
              {viewingInspection.photoUrl && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Foto Bukti Inspeksi:</span>
                  <img 
                    src={viewingInspection.photoUrl} 
                    alt="Bukti Inspeksi" 
                    className="w-full h-32 object-cover rounded-xl border border-slate-700" 
                  />
                </div>
              )}
              <div className="space-y-2">
                <div className="p-3 bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Catatan Lapangan:</span>
                  <p className="text-slate-200 mt-1">{viewingInspection.notes || 'Tidak ada catatan.'}</p>
                </div>
                {viewingInspection.actionRecommendation && (
                  <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xl text-amber-200">
                    <span className="text-[10px] uppercase block font-bold">Rekomendasi Tindakan:</span>
                    <p className="mt-1">{viewingInspection.actionRecommendation}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewingInspection(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
