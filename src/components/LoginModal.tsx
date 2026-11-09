import React, { useState } from 'react';
import { 
  Flame, 
  Lock, 
  User, 
  AlertCircle,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const { loginWithCredentials } = useAuth();

  const [identifier, setIdentifier] = useState('sbpmekanik@gmail.com');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await loginWithCredentials(identifier, password);
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(result.message || 'Login gagal.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Header */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-900/40 mb-3">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            HSE APAR MANAGEMENT
          </h1>
          <p className="text-xs text-red-400 font-bold uppercase tracking-wider mt-0.5">
            PT V-Belt Indonesia • Safety Inspection System
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Silakan login untuk mengakses inventaris APAR, scan QR, dan checklist inspeksi mingguan.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Username / Email Petugas:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="nama@vbelt.hse.id"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Kata Sandi (Password):
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-lg shadow-red-950/50 cursor-pointer transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Memverifikasi...' : 'MASUK KE SISTEM'}</span>
          </button>
        </form>



        {/* Footer info */}
        <div className="mt-6 text-center text-[11px] text-slate-400">
          PT V-Belt Indonesia • Departemen HSE & K3
        </div>

      </div>
    </div>
  );
};
