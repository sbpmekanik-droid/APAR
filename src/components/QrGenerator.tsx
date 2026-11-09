import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  Flame, 
  QrCode, 
  CheckSquare, 
  Square, 
  Sliders, 
  Grid, 
  FileText,
  Search,
  Check
} from 'lucide-react';
import { AparItem } from '../types';
import { useApp } from '../context/AppContext';
import { generateQrDataUrl, formatQrPayload } from '../utils/qrCode';

interface QrGeneratorProps {
  initialApar?: AparItem | null;
}

export const QrGenerator: React.FC<QrGeneratorProps> = ({ initialApar }) => {
  const { apars, settings } = useApp();

  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [selectedAparId, setSelectedAparId] = useState<string>(
    initialApar ? initialApar.id : apars[0]?.id || ''
  );
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>(() => {
    return apars.filter(a => a.status === 'aktif').map(a => a.id);
  });

  const [labelSize, setLabelSize] = useState<'standard' | 'large' | 'compact'>('standard');
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [filterArea, setFilterArea] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Update selected if initialApar changes
  useEffect(() => {
    if (initialApar) {
      setSelectedAparId(initialApar.id);
      setMode('single');
    }
  }, [initialApar]);

  // Generate QR codes for all APARs as data URLs
  useEffect(() => {
    async function generateAll() {
      const urls: Record<string, string> = {};
      for (const apar of apars) {
        try {
          const payload = formatQrPayload(apar.id);
          const url = await generateQrDataUrl(payload, 280);
          urls[apar.id] = url;
        } catch (e) {
          console.error(e);
        }
      }
      setQrCodeDataUrls(urls);
    }
    generateAll();
  }, [apars]);

  const activeApars = apars.filter(a => a.status === 'aktif');
  const selectedApar = apars.find(a => a.id === selectedAparId) || apars[0];

  // Batch APAR filter
  const batchDisplayApars = activeApars.filter(a => {
    const matchArea = filterArea === 'all' || a.area === filterArea;
    const matchSearch = searchQuery === '' || 
      a.aparCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchArea && matchSearch;
  });

  const handleToggleBatchSelect = (id: string) => {
    setBatchSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllBatch = () => {
    setBatchSelectedIds(batchDisplayApars.map(a => a.id));
  };

  const handleDeselectAllBatch = () => {
    setBatchSelectedIds([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const areas = Array.from(new Set(activeApars.map(a => a.area)));

  return (
    <div className="space-y-6">
      
      {/* Screen Only Controls Banner */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <QrCode className="w-6 h-6 text-red-500" />
              <span>Generate & Cetak QR Code APAR</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Label tahan luntur berstandar HSE untuk penempelan pada tabung pemadam api di pabrik V-Belt.
            </p>
          </div>

          {/* Mode Switcher & Print Button */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-800 p-1 rounded-xl flex space-x-1 border border-slate-700">
              <button
                onClick={() => setMode('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  mode === 'single' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cetak Satuan
              </button>
              <button
                onClick={() => setMode('batch')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  mode === 'batch' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cetak Massal (A4)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/40 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          {/* Label Size Setting */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Ukuran Label Cetak:
            </label>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="standard">Standar (90 mm × 65 mm - 8 label / A4)</option>
              <option value="large">Besar (100 mm × 75 mm - 6 label / A4)</option>
              <option value="compact">Kompak (75 mm × 50 mm - 10 label / A4)</option>
            </select>
          </div>

          {/* Single Mode: Select APAR */}
          {mode === 'single' ? (
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Pilih Tabung APAR:
              </label>
              <select
                value={selectedAparId}
                onChange={(e) => setSelectedAparId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500 font-mono"
              >
                {activeApars.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.aparCode} - {a.mediaType} {a.capacity} ({a.area})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* Batch Mode: Filter and Selection */
            <div className="sm:col-span-2 flex items-end space-x-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Filter Berdasarkan Area:
                </label>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
                >
                  <option value="all">Semua Area ({activeApars.length} Tabung)</option>
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSelectAllBatch}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs cursor-pointer"
              >
                Pilih Semua
              </button>
              <button
                onClick={handleDeselectAllBatch}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs cursor-pointer"
              >
                Batal Semua
              </button>
            </div>
          )}
        </div>

        {/* Batch Selected Count Notice */}
        {mode === 'batch' && (
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>
              Terpilih: <strong className="text-white">{batchSelectedIds.length}</strong> dari {batchDisplayApars.length} label
            </span>
            <span className="text-slate-400">
              Perkiraan: {Math.ceil(batchSelectedIds.length / (labelSize === 'large' ? 6 : labelSize === 'compact' ? 10 : 8))} lembar A4
            </span>
          </div>
        )}
      </div>

      {/* Printable Area - Formatted as Clean Physical Labels */}
      <div className="print-label-container">
        
        {/* Style helper for printing only the labels */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            header, aside, .print\\:hidden {
              display: none !important;
            }
            .print-label-container {
              display: block !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .a4-page {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 auto !important;
              padding: 10mm 8mm !important;
              box-sizing: border-box !important;
              page-break-after: always;
            }
            .label-card {
              box-shadow: none !important;
              border: 1.5px solid #1f2937 !important;
              page-break-inside: avoid;
            }
          }
        `}} />

        {/* Single Mode Preview */}
        {mode === 'single' && selectedApar && (
          <div className="flex justify-center p-4">
            <div className={`label-card bg-white text-slate-900 border-2 border-slate-900 rounded-xl p-4 shadow-xl flex flex-col justify-between max-w-md w-full transition-all ${
              labelSize === 'large' ? 'h-[360px]' : labelSize === 'compact' ? 'h-[280px]' : 'h-[320px]'
            }`}>
              
              {/* Label Header */}
              <div className="border-b-2 border-red-600 pb-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm tracking-tight text-red-600 uppercase leading-none">
                      HSE - PT V-BELT INDONESIA
                    </h3>
                    <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                      FIRE SAFETY MANAGEMENT SYSTEM
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-black px-2 py-0.5 bg-slate-900 text-white rounded font-mono">
                    {selectedApar.aparCode}
                  </span>
                </div>
              </div>

              {/* Label Body: QR Code & Cylinder Specs */}
              <div className="flex items-center justify-between my-2 gap-3">
                <div className="shrink-0 p-1.5 bg-white border border-slate-300 rounded-lg">
                  {qrCodeDataUrls[selectedApar.id] ? (
                    <img 
                      src={qrCodeDataUrls[selectedApar.id]} 
                      alt={`QR Code ${selectedApar.aparCode}`}
                      className={`${labelSize === 'large' ? 'w-36 h-36' : labelSize === 'compact' ? 'w-24 h-24' : 'w-28 h-28'} object-contain`} 
                    />
                  ) : (
                    <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      Memuat QR...
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5 text-left text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">No. Inventaris:</span>
                    <span className="font-bold text-slate-900 font-mono text-[11px]">{selectedApar.inventoryNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Media & Kapasitas:</span>
                    <span className="font-extrabold text-red-700 text-xs">
                      {selectedApar.mediaType} ({selectedApar.capacity})
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Lokasi Gedung & Area:</span>
                    <span className="font-semibold text-slate-800 text-[11px] block">{selectedApar.area}</span>
                    <span className="text-[10px] text-slate-600 block line-clamp-1">{selectedApar.locationDetail}</span>
                  </div>
                </div>
              </div>

              {/* Label Footer: Big Instruction Banner */}
              <div className="bg-red-600 text-white text-center py-2 px-3 rounded-lg font-black text-xs tracking-wider uppercase shadow-inner flex items-center justify-center space-x-1.5">
                <QrCode className="w-4 h-4" />
                <span>SCAN UNTUK INSPEKSI APAR</span>
              </div>

            </div>
          </div>
        )}

        {/* Batch Mode: Grid on A4 Layout */}
        {mode === 'batch' && (
          <div className="a4-page max-w-5xl mx-auto bg-slate-900/40 print:bg-white rounded-2xl p-4 sm:p-6 print:p-0">
            <div className={`grid gap-4 print:gap-3 ${
              labelSize === 'large' 
                ? 'grid-cols-1 sm:grid-cols-2' 
                : labelSize === 'compact' 
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-2' 
                : 'grid-cols-1 sm:grid-cols-2'
            }`}>
              {batchDisplayApars
                .filter(a => batchSelectedIds.includes(a.id))
                .map((apar) => (
                  <div 
                    key={apar.id}
                    className="label-card bg-white text-slate-900 border-2 border-slate-900 rounded-xl p-3.5 shadow-md flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="border-b-2 border-red-600 pb-1.5 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Flame className="w-4 h-4 text-red-600 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-[11px] text-red-600 uppercase leading-none">
                            HSE - PT V-BELT INDONESIA
                          </h4>
                          <span className="text-[8px] text-slate-600 font-semibold">
                            INSPEKSI RUTIN MINGGUAN
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-900 text-white rounded font-mono">
                        {apar.aparCode}
                      </span>
                    </div>

                    {/* Middle Info + QR */}
                    <div className="flex items-center justify-between my-2 gap-2">
                      <div className="shrink-0 p-1 bg-white border border-slate-300 rounded-md">
                        {qrCodeDataUrls[apar.id] ? (
                          <img 
                            src={qrCodeDataUrls[apar.id]} 
                            alt={apar.aparCode}
                            className="w-20 h-20 sm:w-22 sm:h-22 object-contain" 
                          />
                        ) : (
                          <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px]">...</div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1 text-left text-[11px]">
                        <div>
                          <span className="text-[8px] uppercase font-bold text-slate-500 block leading-tight">Media & Kapasitas:</span>
                          <span className="font-extrabold text-red-700 text-xs">
                            {apar.mediaType} ({apar.capacity})
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-bold text-slate-500 block leading-tight">Area Produksi:</span>
                          <span className="font-semibold text-slate-800 line-clamp-1">{apar.area}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-bold text-slate-500 block leading-tight">Posisi:</span>
                          <span className="text-[10px] text-slate-600 line-clamp-1">{apar.locationDetail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Banner */}
                    <div className="bg-red-600 text-white text-center py-1 px-2 rounded-md font-extrabold text-[10px] tracking-wide uppercase">
                      SCAN UNTUK INSPEKSI APAR
                    </div>
                  </div>
                ))}
            </div>

            {batchSelectedIds.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                <p>Tidak ada label yang dipilih untuk dicetak.</p>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
