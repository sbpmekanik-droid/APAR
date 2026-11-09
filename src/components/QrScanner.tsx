import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  FlipHorizontal, 
  Flashlight, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Flame, 
  ClipboardList, 
  ArrowRight,
  ShieldAlert,
  Search,
  Sparkles
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AparItem } from '../types';
import { useApp } from '../context/AppContext';
import { parseQrPayload } from '../utils/qrCode';

interface QrScannerProps {
  onStartInspection: (apar: AparItem) => void;
  onClose?: () => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({
  onStartInspection,
  onClose,
}) => {
  const { apars, getAparById } = useApp();

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedApar, setScannedApar] = useState<AparItem | null>(null);
  const [unrecognizedCode, setUnrecognizedCode] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hasTorchCapability, setHasTorchCapability] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'hse-qr-reader-region';

  // Start Scanner
  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      setCameraError(null);
      setScannedApar(null);
      setUnrecognizedCode(null);

      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch (e) {
          console.warn('Stopping previous scanner error:', e);
        }
      }

      const html5QrCode = new Html5Qrcode(qrRegionId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: mode },
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (_errorMessage) => {
          // ignore per-frame parse failures
        }
      );

      setScanning(true);

      // Check torch capability
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if ((capabilities as any)?.torch) {
          setHasTorchCapability(true);
        }
      } catch (e) {
        setHasTorchCapability(false);
      }

    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError(
        'Kamera tidak dapat diakses atau izin ditolak. Anda dapat menggunakan fitur upload foto QR atau input manual ID APAR di bawah ini.'
      );
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn('Camera stop error:', e);
      }
    }
    setScanning(false);
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const handleScanSuccess = async (rawText: string) => {
    const extractedId = parseQrPayload(rawText);
    const foundApar = getAparById(extractedId);

    if (foundApar) {
      setScannedApar(foundApar);
      setUnrecognizedCode(null);
      // Play brief success sound or vibration if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
      // Stop scanning to preserve battery and show result
      await stopCamera();
    } else {
      setUnrecognizedCode(extractedId || rawText);
      setScannedApar(null);
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorchCapability) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }
      const decodedResult = await scannerRef.current.scanFile(file, true);
      handleScanSuccess(decodedResult);
    } catch (err) {
      alert('Tidak dapat mendeteksi QR Code dari gambar yang dipilih.');
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const query = manualCode.trim().toUpperCase();
    const found = apars.find(
      a => a.aparCode.toUpperCase() === query || 
           a.id.toUpperCase() === query ||
           a.inventoryNumber.toUpperCase().includes(query)
    );

    if (found) {
      setScannedApar(found);
      setUnrecognizedCode(null);
      stopCamera();
    } else {
      setUnrecognizedCode(manualCode);
      setScannedApar(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Camera className="w-6 h-6 text-red-500" />
            <span>Scan QR Code APAR</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Arahkan kamera smartphone ke stiker QR Code pada tabung untuk memulai inspeksi.
          </p>
        </div>

        {onClose && (
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Viewport Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        
        {/* Camera Video Area */}
        <div className="relative bg-black min-h-[300px] sm:min-h-[360px] flex items-center justify-center">
          
          <div id={qrRegionId} className="w-full max-w-sm overflow-hidden" />

          {/* Scanner Overlay Sight Box (when scanning) */}
          {scanning && !scannedApar && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-60 h-60 border-2 border-red-500/80 rounded-2xl relative animate-pulse">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg"></div>
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/50 shadow-lg shadow-red-500"></div>
              </div>
            </div>
          )}

          {/* Camera Controls Bar (Overlaid on top of camera) */}
          {scanning && (
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center space-x-3 z-10">
              <button
                type="button"
                onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                className="p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 backdrop-blur-xs border border-slate-700 shadow-lg cursor-pointer"
                title="Putar Kamera"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>

              {hasTorchCapability && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-3 rounded-full backdrop-blur-xs border border-slate-700 shadow-lg cursor-pointer transition-colors ${
                    torchOn ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900/80 text-white hover:bg-slate-800'
                  }`}
                  title="Lampu Senter"
                >
                  <Flashlight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Camera Permission / Error Fallback */}
          {cameraError && !scannedApar && (
            <div className="p-6 text-center text-slate-300 max-w-sm">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-xs text-amber-300 font-semibold mb-2">{cameraError}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl mt-2"
              >
                Coba Akses Kamera Lagi
              </button>
            </div>
          )}
        </div>

        {/* Scan Result Card (When recognized) */}
        {scannedApar && (
          <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-white">{scannedApar.aparCode}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      scannedApar.status === 'aktif' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300'
                    }`}>
                      {scannedApar.status === 'aktif' ? 'AKTIF' : 'NON-AKTIF'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{scannedApar.inventoryNumber}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setScannedApar(null);
                  startCamera(facingMode);
                }}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Scan Ulang
              </button>
            </div>

            {/* Inactive Warning if APAR is not active */}
            {scannedApar.status === 'nonaktif' ? (
              <div className="my-4 p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-start space-x-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <p className="font-bold">PERINGATAN: APAR INI BERSTATUS TIDAK AKTIF</p>
                  <p className="mt-0.5 text-slate-300">
                    Alasan: {scannedApar.inactiveReason || 'Tabung sedang ditarik dari lini operasional.'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Inspeksi rutin tidak dapat dilakukan pada tabung yang telah dinonaktifkan.
                  </p>
                </div>
              </div>
            ) : (
              /* Active APAR Specs & Start Inspection Button */
              <div className="my-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-750">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Media & Kapasitas</span>
                    <span className="font-bold text-white text-sm">{scannedApar.mediaType} ({scannedApar.capacity})</span>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-750">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Merek & Seri</span>
                    <span className="font-bold text-white">{scannedApar.brand} #{scannedApar.serialNumber || '-'}</span>
                  </div>
                  <div className="col-span-2 p-2.5 bg-slate-800/80 rounded-xl border border-slate-750">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Lokasi Pabrik V-Belt</span>
                    <span className="font-semibold text-white block">{scannedApar.building} • {scannedApar.area}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{scannedApar.locationDetail}</span>
                  </div>
                </div>

                {/* Big MULAI INSPEKSI Button */}
                <button
                  onClick={() => onStartInspection(scannedApar)}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-red-950/60 transition-all active:scale-98 cursor-pointer"
                >
                  <ClipboardList className="w-5 h-5" />
                  <span>MULAI INSPEKSI MINGGUAN</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            )}

          </div>
        )}

        {/* Unrecognized QR Code Alert */}
        {unrecognizedCode && (
          <div className="p-4 bg-red-950/70 border-t border-red-800 text-xs text-red-300 flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">QR Code Tidak Dikenal</p>
                <p className="text-slate-300 mt-0.5">
                  Kode <span className="font-mono font-bold text-white">"{unrecognizedCode}"</span> tidak terdaftar dalam master inventaris APAR pabrik V-Belt.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setUnrecognizedCode(null);
                startCamera(facingMode);
              }}
              className="text-xs px-2.5 py-1 bg-red-900 hover:bg-red-800 text-white rounded-lg"
            >
              Coba Lagi
            </button>
          </div>
        )}

      </div>

      {/* Alternative Fallback Options (Upload Photo / Manual Input) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Alternatif Pemindaian
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          {/* File Upload Scan */}
          <div>
            <label className="flex items-center justify-center space-x-2 p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-slate-300 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-red-400" />
              <span>Unggah Foto QR dari Galeri</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Quick Manual Code Input */}
          <form onSubmit={handleManualSearch} className="flex space-x-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ketik ID APAR (misal: APAR-VBLT-001)"
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl cursor-pointer"
            >
              Cari
            </button>
          </form>

        </div>
      </div>

    </div>
  );
};
