import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Save, 
  ArrowLeft, 
  Upload, 
  Calendar, 
  MapPin, 
  Building, 
  Tag, 
  ShieldAlert,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { AparItem, MediaType, AparStatus } from '../types';
import { useApp } from '../context/AppContext';

interface AparFormProps {
  initialApar?: AparItem | null;
  onSuccess: (aparId: string) => void;
  onCancel: () => void;
}

const COMMON_BUILDINGS = [
  'Gedung Produksi Utama',
  'Gedung Utility & Power',
  'Gudang Bahan Baku Karet & Kimia',
  'Gudang Finished Goods & Ekspedisi',
  'Kantor Manajemen & Lab QC',
  'Bengkel Pemeliharaan & Workshop',
];

const COMMON_AREAS = [
  'Area Banbury & Rubber Mixing',
  'Area Kalender & Ekstruder Cord V-Belt',
  'Area Building & Assembling V-Belt',
  'Area Vulkanisasi & Curing Press',
  'Area Cutting & Slitting V-Belt',
  'Area Quality Inspection & Packing',
  'Ruang Gardu Induk & Substation',
  'Ruang Boiler & Kompresor',
  'Ruang Genset & Trafo 1000 kVA',
  'Area Loading Dock & Ekspedisi',
  'Area Workshop & Mesin Bubut',
];

const COMMON_BRANDS = ['Yamato', 'Servvo', 'Gunnebo', 'Chubb', 'GuardALL', 'Viking', 'Appron'];

const CAPACITIES_BY_MEDIA: Record<MediaType, string[]> = {
  'ABC Powder': ['1 kg', '2 kg', '3 kg', '4.5 kg', '6 kg', '9 kg', '12 kg', '25 kg (Trolley)', '50 kg (Trolley)'],
  'CO2': ['2 kg', '3 kg', '5 kg', '6.8 kg', '10 kg', '25 kg (Trolley)'],
  'Foam': ['6 Liter', '9 Liter', '25 Liter (Trolley)', '50 Liter (Trolley)'],
  'Clean Agent': ['2.5 kg', '4 kg', '6 kg', '9 kg'],
  'Water Mist': ['6 Liter', '9 Liter'],
};

export const AparForm: React.FC<AparFormProps> = ({
  initialApar,
  onSuccess,
  onCancel,
}) => {
  const { addApar, updateApar, generateNextAparCode } = useApp();

  const isEditing = !!initialApar;

  const [aparCode, setAparCode] = useState(initialApar?.aparCode || '');
  const [inventoryNumber, setInventoryNumber] = useState(initialApar?.inventoryNumber || '');
  const [mediaType, setMediaType] = useState<MediaType>(initialApar?.mediaType || 'ABC Powder');
  const [capacity, setCapacity] = useState(initialApar?.capacity || '6 kg');
  const [brand, setBrand] = useState(initialApar?.brand || 'Yamato');
  const [serialNumber, setSerialNumber] = useState(initialApar?.serialNumber || '');
  const [building, setBuilding] = useState(initialApar?.building || COMMON_BUILDINGS[0]);
  const [area, setArea] = useState(initialApar?.area || COMMON_AREAS[0]);
  const [locationDetail, setLocationDetail] = useState(initialApar?.locationDetail || '');
  const [procurementDate, setProcurementDate] = useState(initialApar?.procurementDate || new Date().toISOString().split('T')[0]);
  const [lastRefillDate, setLastRefillDate] = useState(initialApar?.lastRefillDate || new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(initialApar?.expiryDate || '');
  const [status, setStatus] = useState<AparStatus>(initialApar?.status || 'aktif');
  const [notes, setNotes] = useState(initialApar?.notes || '');
  const [photoUrl, setPhotoUrl] = useState(initialApar?.photoUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generate code and calculate default 1-year expiry on mount if new
  useEffect(() => {
    if (!isEditing) {
      const nextCode = generateNextAparCode();
      setAparCode(nextCode);
      
      const yr = new Date().getFullYear();
      setInventoryNumber(`INV/HSE-VBLT/${yr}/${nextCode.replace('APAR-VBLT-', '')}`);

      // Default expiry date 1 year from now
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 1);
      setExpiryDate(exp.toISOString().split('T')[0]);
    }
  }, [isEditing]);

  // When media type changes, reset capacity suggestion
  const handleMediaTypeChange = (val: MediaType) => {
    setMediaType(val);
    const available = CAPACITIES_BY_MEDIA[val];
    if (available && available.length > 0) {
      setCapacity(available[0]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!aparCode.trim()) {
      setErrorMsg('ID APAR wajib diisi.');
      return;
    }
    if (!inventoryNumber.trim()) {
      setErrorMsg('Nomor Inventaris wajib diisi.');
      return;
    }
    if (!locationDetail.trim()) {
      setErrorMsg('Detail posisi pemasangan wajib diisi agar mudah ditemukan oleh petugas.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditing && initialApar) {
        await updateApar(initialApar.id, {
          aparCode: aparCode.trim(),
          inventoryNumber: inventoryNumber.trim(),
          mediaType,
          capacity,
          brand,
          serialNumber: serialNumber.trim(),
          building,
          area,
          locationDetail: locationDetail.trim(),
          procurementDate,
          lastRefillDate,
          expiryDate,
          status,
          notes: notes.trim(),
          photoUrl: photoUrl || undefined,
        });
        onSuccess(initialApar.id);
      } else {
        const newId = await addApar({
          aparCode: aparCode.trim(),
          inventoryNumber: inventoryNumber.trim(),
          mediaType,
          capacity,
          brand,
          serialNumber: serialNumber.trim(),
          building,
          area,
          locationDetail: locationDetail.trim(),
          procurementDate,
          lastRefillDate,
          expiryDate,
          status,
          notes: notes.trim(),
          photoUrl: photoUrl || undefined,
          lastInspectionStatus: 'BELUM DIPERIKSA',
        });
        onSuccess(newId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data APAR.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>{isEditing ? 'Edit Data Master APAR' : 'Pendaftaran Tabung APAR Baru'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Input spesifikasi tabung, penempatan pabrik V-Belt, dan tanggal pengujian rutin.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Section 1: Identitas Tabung APAR */}
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-red-400 flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800">
            <Tag className="w-4 h-4" />
            <span>1. Identitas & Nomor Registrasi APAR</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                ID APAR Unik <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={aparCode}
                onChange={(e) => setAparCode(e.target.value)}
                placeholder="Contoh: APAR-VBLT-011"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Dihubungkan ke QR Code unik</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nomor Inventaris Pabrik <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={inventoryNumber}
                onChange={(e) => setInventoryNumber(e.target.value)}
                placeholder="Contoh: INV/HSE-VBLT/2026/011"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nomor Seri Tabung Pabrikan
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Contoh: YM-2026-9011"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Spesifikasi Media & Merek */}
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-red-400 flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800">
            <Flame className="w-4 h-4" />
            <span>2. Media Pemadam & Merek Tabung</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Jenis Media Pemadam <span className="text-red-400">*</span>
              </label>
              <select
                value={mediaType}
                onChange={(e) => handleMediaTypeChange(e.target.value as MediaType)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="ABC Powder">ABC Dry Chemical Powder</option>
                <option value="CO2">Carbon Dioxide (CO2)</option>
                <option value="Foam">Foam Liquid (AFFF)</option>
                <option value="Clean Agent">Clean Agent (HFC-227ea / AF11)</option>
                <option value="Water Mist">Water Mist / Wet Chemical</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Kapasitas / Ukuran <span className="text-red-400">*</span>
              </label>
              <div className="flex space-x-2">
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                >
                  {(CAPACITIES_BY_MEDIA[mediaType] || []).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Kustom">Kustom...</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Merek Tabung APAR <span className="text-red-400">*</span>
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              >
                {COMMON_BRANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Lokasi & Penempatan Pabrik V-Belt */}
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-red-400 flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800">
            <MapPin className="w-4 h-4" />
            <span>3. Lokasi & Penempatan di Pabrik V-Belt</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Gedung Pabrik <span className="text-red-400">*</span>
              </label>
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              >
                {COMMON_BUILDINGS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Area Produksi / Fasilitas <span className="text-red-400">*</span>
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              >
                {COMMON_AREAS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Detail Posisi Pemasangan (Posisi Spesifik) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="Contoh: Tiang B-06 samping panel kontrol mesin Curing #2 / Dekat pintu darurat timur"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Tuliskan patokan tiang, nomor mesin, atau pintu terdekat untuk memudahkan petugas saat inspeksi dan evakuasi darurat.
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Jadwal Pengadaan, Isi Ulang & Kedaluwarsa */}
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-red-400 flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800">
            <Calendar className="w-4 h-4" />
            <span>4. Tanggal Pengadaan, Servis & Status Operasi</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Tanggal Pengadaan Tabung
              </label>
              <input
                type="date"
                value={procurementDate}
                onChange={(e) => setProcurementDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Tanggal Pengisian Terakhir
              </label>
              <input
                type="date"
                value={lastRefillDate}
                onChange={(e) => setLastRefillDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Batas Kedaluwarsa / Servis <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Status Operasional
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AparStatus)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 font-semibold"
              >
                <option value="aktif">Aktif (Operasional di Pabrik)</option>
                <option value="nonaktif">Non-Aktif (Karantina / Tarik)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Foto & Keterangan Tambahan */}
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-red-400 flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800">
            <Camera className="w-4 h-4" />
            <span>5. Foto Tabung & Catatan Tambahan</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Upload Foto APAR Terpasang
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-red-400" />
                  <span>Pilih File Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoUrl && (
                  <span className="text-xs text-emerald-400 font-medium">Foto siap terunggah ✓</span>
                )}
              </div>
              {photoUrl && (
                <div className="mt-3 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700">
                  <img src={photoUrl} alt="Preview APAR" className="w-full h-full object-cover" />
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

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Keterangan Tambahan / Hazard Khusus
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Contoh: Tabung dekat sumber panas steam curing 160°C. Jangan terhalang palet material..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-950/40 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Daftarkan APAR'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
