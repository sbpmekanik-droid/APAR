import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  QrCode, 
  Edit, 
  Trash2, 
  Power, 
  ClipboardList, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Calendar, 
  Tag, 
  FileText,
  AlertTriangle,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { AparItem, MediaType, AparStatus } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { checkExpiryStatus } from '../utils/inspectionLogic';

interface AparListProps {
  onAddNew: () => void;
  onEditApar: (apar: AparItem) => void;
  onPrintQr: (apar: AparItem) => void;
  onStartInspection: (apar: AparItem) => void;
  selectedAparId?: string;
}

export const AparList: React.FC<AparListProps> = ({
  onAddNew,
  onEditApar,
  onPrintQr,
  onStartInspection,
  selectedAparId,
}) => {
  const { apars, deactivateApar, activateApar, deleteApar, getInspectionsByAparId } = useApp();
  const { isAdmin } = useAuth();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedMedia, setSelectedMedia] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'code' | 'expiry' | 'inspection'>('code');

  // Deactivation Modal State
  const [deactivatingApar, setDeactivatingApar] = useState<AparItem | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');

  // Delete Confirmation Modal State
  const [deletingApar, setDeletingApar] = useState<AparItem | null>(null);

  // Detail Modal State
  const [viewingApar, setViewingApar] = useState<AparItem | null>(
    selectedAparId ? apars.find(a => a.id === selectedAparId) || null : null
  );

  // Unique filters lists
  const buildings = useMemo(() => Array.from(new Set(apars.map(a => a.building))), [apars]);
  const areas = useMemo(() => Array.from(new Set(apars.map(a => a.area))), [apars]);

  // Filtered and sorted APAR list
  const filteredApars = useMemo(() => {
    return apars.filter(item => {
      const query = searchQuery.toLowerCase();
      const matchQuery = 
        item.aparCode.toLowerCase().includes(query) ||
        item.inventoryNumber.toLowerCase().includes(query) ||
        item.locationDetail.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.serialNumber.toLowerCase().includes(query);

      const matchArea = selectedArea === 'all' || item.area === selectedArea;
      const matchBuilding = selectedBuilding === 'all' || item.building === selectedBuilding;
      const matchMedia = selectedMedia === 'all' || item.mediaType === selectedMedia;
      const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchQuery && matchArea && matchBuilding && matchMedia && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'code') return a.aparCode.localeCompare(b.aparCode);
      if (sortBy === 'expiry') return (a.expiryDate || '').localeCompare(b.expiryDate || '');
      return (b.lastInspectionDate || '').localeCompare(a.lastInspectionDate || '');
    });
  }, [apars, searchQuery, selectedArea, selectedBuilding, selectedMedia, selectedStatus, sortBy]);

  const handleConfirmDeactivate = async () => {
    if (!deactivatingApar) return;
    if (!deactivationReason.trim()) {
      alert('Wajib mengisi alasan penonaktifan APAR untuk pencatatan riwayat HSE.');
      return;
    }
    await deactivateApar(deactivatingApar.id, deactivationReason.trim());
    setDeactivatingApar(null);
    setDeactivationReason('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingApar) return;
    await deleteApar(deletingApar.id);
    setDeletingApar(null);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>Master Data APAR</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
              {filteredApars.length} Unit Ditemukan
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar seluruh tabung pemadam api, lokasi penempatan, dan status operasional di Pabrik V-Belt.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onAddNew}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-950/40 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Daftarkan APAR Baru</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID APAR, No. Inventaris, Lokasi, Merek, No. Seri..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors"
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

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1 text-xs">
          {/* Building Filter */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Gedung</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Gedung</option>
              {buildings.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Area Filter */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Area Produksi</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Area</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Media Type Filter */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Jenis Media</label>
            <select
              value={selectedMedia}
              onChange={(e) => setSelectedMedia(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Media</option>
              <option value="ABC Powder">ABC Powder</option>
              <option value="CO2">CO2</option>
              <option value="Foam">Foam</option>
              <option value="Clean Agent">Clean Agent</option>
              <option value="Water Mist">Water Mist</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Status Operasi</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif (Operasional)</option>
              <option value="nonaktif">Non-Aktif (Tarik)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Urutkan</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="code">ID APAR</option>
              <option value="expiry">Masa Berlaku / Servis</option>
              <option value="inspection">Inspeksi Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* APAR Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">ID & Inventaris</th>
                <th className="px-4 py-3.5">Media & Kapasitas</th>
                <th className="px-4 py-3.5">Lokasi & Area</th>
                <th className="px-4 py-3.5">Masa Berlaku</th>
                <th className="px-4 py-3.5">Status & Kondisi</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredApars.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Flame className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="font-semibold">Tidak ada tabung APAR yang sesuai kriteria filter.</p>
                  </td>
                </tr>
              ) : (
                filteredApars.map((apar) => {
                  const expiry = checkExpiryStatus(apar.expiryDate);
                  const isInactive = apar.status === 'nonaktif';

                  return (
                    <tr 
                      key={apar.id} 
                      className={`hover:bg-slate-850/60 transition-colors ${
                        isInactive ? 'opacity-60 bg-slate-950/40' : ''
                      }`}
                    >
                      {/* ID & Inventory */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setViewingApar(apar)}
                            className="font-bold text-white hover:text-red-400 transition-colors text-xs sm:text-sm cursor-pointer"
                          >
                            {apar.aparCode}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {apar.inventoryNumber}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {apar.brand} • #{apar.serialNumber || '-'}
                        </div>
                      </td>

                      {/* Media & Capacity */}
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          apar.mediaType === 'CO2' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' :
                          apar.mediaType === 'Foam' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                          apar.mediaType === 'Clean Agent' ? 'bg-purple-950 text-purple-300 border border-purple-800/60' :
                          'bg-red-950 text-red-300 border border-red-800/60'
                        }`}>
                          {apar.mediaType}
                        </span>
                        <div className="text-xs font-semibold text-slate-200 mt-1">
                          {apar.capacity}
                        </div>
                      </td>

                      {/* Location & Area */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-slate-200 flex items-center space-x-1 truncate">
                          <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                          <span className="truncate">{apar.area}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {apar.building}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate" title={apar.locationDetail}>
                          {apar.locationDetail}
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-slate-200">
                          {apar.expiryDate || '-'}
                        </div>
                        {expiry.isExpired && (
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-900/80 text-red-300 mt-0.5">
                            Kedaluwarsa
                          </span>
                        )}
                        {!expiry.isExpired && expiry.isExpiringSoon && (
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-900/80 text-amber-300 mt-0.5">
                            Segera Servis ({expiry.daysRemaining} hr)
                          </span>
                        )}
                      </td>

                      {/* Status & Last Inspection */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          {isInactive ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              NON-AKTIF
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                              AKTIF
                            </span>
                          )}

                          {apar.lastInspectionStatus && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              apar.lastInspectionStatus === 'BAIK' ? 'bg-emerald-900/60 text-emerald-300' :
                              apar.lastInspectionStatus === 'TIDAK LAYAK' ? 'bg-red-900/70 text-red-300 animate-pulse' :
                              apar.lastInspectionStatus === 'PERLU TINDAKAN' ? 'bg-amber-900/70 text-amber-300' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {apar.lastInspectionStatus}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Inspeksi: {apar.lastInspectionDate || 'Belum pernah'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          
                          {/* View details */}
                          <button
                            onClick={() => setViewingApar(apar)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                            title="Lihat Detail & Riwayat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print QR */}
                          <button
                            onClick={() => onPrintQr(apar)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                            title="Generate / Cetak QR Code"
                          >
                            <QrCode className="w-4 h-4 text-red-400" />
                          </button>

                          {/* Start Inspection */}
                          {!isInactive && (
                            <button
                              onClick={() => onStartInspection(apar)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 cursor-pointer"
                              title="Mulai Formulir Inspeksi"
                            >
                              <ClipboardList className="w-4 h-4" />
                            </button>
                          )}

                          {/* Admin Only Actions */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => onEditApar(apar)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                                title="Edit Data Master"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {isInactive ? (
                                <button
                                  onClick={() => activateApar(apar.id)}
                                  className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 cursor-pointer"
                                  title="Aktifkan Kembali APAR"
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setDeactivatingApar(apar);
                                    setDeactivationReason('');
                                  }}
                                  className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 cursor-pointer"
                                  title="Non-aktifkan Tabung APAR"
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => setDeletingApar(apar)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/60 cursor-pointer"
                                title="Hapus Permanen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivation Modal with Mandatory Reason */}
      {deactivatingApar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-200">
            <div className="flex items-center space-x-3 text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Konfirmasi Penonaktifan APAR</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Anda akan menonaktifkan APAR <span className="font-bold text-white">{deactivatingApar.aparCode}</span> ({deactivatingApar.mediaType} {deactivatingApar.capacity}). Tabung yang non-aktif tidak akan dihitung dalam jadwal inspeksi aktif mingguan.
            </p>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-slate-300 block">
                Alasan Penonaktifan <span className="text-red-400">*</span>:
              </label>
              <textarea
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="Contoh: Tabung ditarik ke karantina HSE karena uji hidrostatik gagal / korosi berat..."
                rows={3}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeactivatingApar(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeactivate}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Simpan & Non-aktifkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingApar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-red-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-200">
            <div className="flex items-center space-x-3 text-red-400 mb-3">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Hapus Data APAR</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Apakah Anda yakin ingin menghapus data APAR <span className="font-bold text-white">{deletingApar.aparCode}</span>? 
              Tindakan ini akan dicatat ke dalam audit log HSE.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeletingApar(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Modal per Tabung APAR */}
      {viewingApar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-200 my-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-950 text-red-400 border border-red-800 flex items-center justify-center font-bold">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{viewingApar.aparCode}</h3>
                  <p className="text-xs text-slate-400">{viewingApar.inventoryNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingApar(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Grid Information */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 text-xs">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-750">
                <span className="text-[10px] text-slate-400 block uppercase">Media & Kapasitas</span>
                <span className="font-bold text-white text-sm">{viewingApar.mediaType} ({viewingApar.capacity})</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-750">
                <span className="text-[10px] text-slate-400 block uppercase">Merek & No. Seri</span>
                <span className="font-bold text-white">{viewingApar.brand} #{viewingApar.serialNumber || '-'}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-750">
                <span className="text-[10px] text-slate-400 block uppercase">Status Operasi</span>
                <span className={`font-bold ${viewingApar.status === 'aktif' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {viewingApar.status === 'aktif' ? 'AKTIF' : 'NON-AKTIF'}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-750 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block uppercase">Lokasi Gedung</span>
                <span className="font-semibold text-white">{viewingApar.building}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-750 col-span-2">
                <span className="text-[10px] text-slate-400 block uppercase">Area Produksi & Detail Posisi</span>
                <span className="font-semibold text-white block truncate">{viewingApar.area}</span>
                <span className="text-[11px] text-slate-400">{viewingApar.locationDetail}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-750">
                <span className="text-[10px] text-slate-400 block uppercase">Tgl Pengadaan</span>
                <span className="text-slate-300">{viewingApar.procurementDate || '-'}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-750">
                <span className="text-[10px] text-slate-400 block uppercase">Pengisian Terakhir</span>
                <span className="text-slate-300">{viewingApar.lastRefillDate || '-'}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-750">
                <span className="text-[10px] text-slate-400 block uppercase">Jadwal Servis / Uji</span>
                <span className="font-bold text-red-400">{viewingApar.expiryDate || '-'}</span>
              </div>
            </div>

            {viewingApar.inactiveReason && (
              <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300 mb-4">
                <span className="font-bold block">Alasan Non-Aktif:</span>
                {viewingApar.inactiveReason}
              </div>
            )}

            {/* Riwayat Inspeksi Tabung Ini */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Riwayat Inspeksi Tabung ({viewingApar.aparCode})
              </h4>
              {(() => {
                const history = getInspectionsByAparId(viewingApar.id);
                if (history.length === 0) {
                  return (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      Belum ada riwayat inspeksi tercatat untuk tabung ini.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map(insp => (
                      <div key={insp.id} className="p-2.5 rounded-lg bg-slate-800 border border-slate-750 text-xs flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">{insp.inspectionDate} {insp.inspectionTime}</span>
                            <span className="text-[11px] text-slate-400">oleh {insp.inspectorName}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">{insp.notes || 'Semua item checklist BAIK'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          insp.finalStatus === 'BAIK' ? 'bg-emerald-950 text-emerald-300' :
                          insp.finalStatus === 'TIDAK LAYAK' ? 'bg-red-950 text-red-300' :
                          'bg-amber-950 text-amber-300'
                        }`}>
                          {insp.finalStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  onPrintQr(viewingApar);
                  setViewingApar(null);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-red-400" />
                <span>Cetak Label QR</span>
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setViewingApar(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Tutup
                </button>
                {viewingApar.status === 'aktif' && (
                  <button
                    onClick={() => {
                      onStartInspection(viewingApar);
                      setViewingApar(null);
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Mulai Inspeksi</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
