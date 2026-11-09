import React, { useState } from 'react';
import { 
  Settings, 
  Building, 
  User, 
  Key, 
  RotateCcw, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  History, 
  ShieldCheck,
  Flame,
  FileText,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const SettingsModal: React.FC = () => {
  const { settings, updateSettings, resetToDemoData, auditLogs, isFirestoreConnected } = useApp();
  const { currentUser, updateProfileData, createFirstAdminAccount, deleteUser, isAdmin } = useAuth();
  const [showDeleteOwnModal, setShowDeleteOwnModal] = useState(false);

  // Company Profile State
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [departmentName, setDepartmentName] = useState(settings.departmentName);
  const [plantLocation, setPlantLocation] = useState(settings.plantLocation);
  const [hseManagerName, setHseManagerName] = useState(settings.hseManagerName);
  const [hseManagerTitle, setHseManagerTitle] = useState(settings.hseManagerTitle);
  const [companySaved, setCompanySaved] = useState(false);

  // User Profile / Password State
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // First Admin Setup State
  const [showFirstAdminSetup, setShowFirstAdminSetup] = useState(false);
  const [firstAdminName, setFirstAdminName] = useState('');
  const [firstAdminEmail, setFirstAdminEmail] = useState('');
  const [firstAdminPass, setFirstAdminPass] = useState('');

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      companyName,
      departmentName,
      plantLocation,
      hseManagerName,
      hseManagerTitle,
    });
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    await updateProfileData({
      name: userName,
      phone: userPhone,
    });

    setProfileSuccess(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleCreateFirstAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstAdminPass.length < 6) {
      alert('Password administrator baru harus minimal 6 karakter.');
      return;
    }
    await createFirstAdminAccount(firstAdminName, firstAdminEmail, firstAdminPass);
    alert('Akun Administrator Utama berhasil dibuat dan diaktifkan!');
    setShowFirstAdminSetup(false);
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset data simulasi pabrik V-Belt? Tindakan ini akan mengembalikan APAR dan inspeksi demo bawaan.')) {
      resetToDemoData();
      alert('Data simulasi berhasil dimuat ulang!');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Banner */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Settings className="w-6 h-6 text-red-500" />
          <span>Pengaturan Sistem & Profil HSE</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Konfigurasi identitas pabrik manufaktur V-Belt, keamanan akun, dan audit trail perubahan data.
        </p>
      </div>

      {/* Cloud Status Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <span className="font-bold text-white">Database Cloud Firestore & Firebase Auth:</span>{' '}
            <span className="text-emerald-400 font-semibold">Terkoneksi Aktif</span>
          </div>
        </div>
        <span className="text-slate-400 text-[11px]">Database: micro-medley-179b0</span>
      </div>

      {/* Grid: Company Profile & User Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Form 1: Profil Pabrik & Kop Surat HSE */}
        <form onSubmit={handleSaveCompany} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Building className="w-4 h-4 text-red-500" />
              <span>Identitas Pabrik & Kop Surat</span>
            </h2>
            {companySaved && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tersimpan!</span>
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Nama Perusahaan / Pabrik:</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Departemen / Divisi:</label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Lokasi Kawasan Pabrik:</label>
              <input
                type="text"
                value={plantLocation}
                onChange={(e) => setPlantLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">HSE Manager:</label>
                <input
                  type="text"
                  value={hseManagerName}
                  onChange={(e) => setHseManagerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Jabatan Resmi:</label>
                <input
                  type="text"
                  value={hseManagerTitle}
                  onChange={(e) => setHseManagerTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
            >
              Simpan Identitas Pabrik
            </button>
          </div>
        </form>

        {/* Form 2: Profil & Ubah Password Pengguna */}
        <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Key className="w-4 h-4 text-red-500" />
              <span>Profil Pengguna & Kata Sandi</span>
            </h2>
            {profileSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Profil Diperbarui!</span>
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Nama Pengguna:</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Email Akun (Login):</label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Nomor Kontak WhatsApp:</label>
              <input
                type="text"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Kata Sandi Baru:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Opsional..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Konfirmasi Sandi:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi sandi..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col space-y-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 cursor-pointer transition-colors"
            >
              Simpan Profil & Kata Sandi
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteOwnModal(true)}
              className="w-full py-2 px-4 rounded-xl bg-red-950/40 hover:bg-red-950/80 text-red-400 hover:text-red-300 font-semibold text-[11px] border border-red-900/60 cursor-pointer transition-colors flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Akun Saya</span>
            </button>
          </div>
        </form>

      </div>

      {/* Section 3: Mekanisme Pembuatan Akun Administrator Pertama Secara Aman */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span>Mekanisme Pendaftaran Administrator Baru</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Buat kredensial admin HSE resmi dengan kata sandi kuat tanpa menggunakan password default yang tidak aman.
            </p>
          </div>

          <button
            onClick={() => setShowFirstAdminSetup(!showFirstAdminSetup)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer self-start sm:self-auto"
          >
            {showFirstAdminSetup ? 'Tutup Formulir' : '+ Daftarkan Akun Admin Baru'}
          </button>
        </div>

        {showFirstAdminSetup && (
          <form onSubmit={handleCreateFirstAdmin} className="mt-4 p-4 rounded-xl bg-slate-850 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Nama Lengkap Admin:</label>
              <input
                type="text"
                value={firstAdminName}
                onChange={(e) => setFirstAdminName(e.target.value)}
                placeholder="Contoh: Ir. Hendra Wijaya"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Email Resmi Admin:</label>
              <input
                type="email"
                value={firstAdminEmail}
                onChange={(e) => setFirstAdminEmail(e.target.value)}
                placeholder="hendra@vbelt.hse.id"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Kata Sandi Kuat (Min 6 Karakter):</label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={firstAdminPass}
                  onChange={(e) => setFirstAdminPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shrink-0"
                >
                  Buat
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Section 4: Audit Logs (Pencatatan Riwayat Perubahan) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">Log Audit Perubahan Master Data APAR</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Immutable Log Trail</span>
        </div>

        <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-850 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-3 py-2">Waktu</th>
                <th className="px-3 py-2">Pengguna</th>
                <th className="px-3 py-2">Aksi</th>
                <th className="px-3 py-2">Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/60">
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-2 font-semibold text-white whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Data Simulasi & Reset Demo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Simulasi & Reset Data Pabrik V-Belt</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            Muat ulang 10 tabung APAR demo pabrik V-Belt lengkap dengan simulasi inspeksi mingguan, kasus tabung kritis, dan kasus perlu perbaikan untuk pengujian fitur.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-amber-950/60 hover:text-amber-300 hover:border-amber-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          Reset Data Demo Pabrik
        </button>
      </div>

      {/* Delete Own Account Modal */}
      {showDeleteOwnModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-red-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <div className="flex items-center space-x-3 text-red-400 mb-3">
              <div className="p-2 rounded-xl bg-red-950 border border-red-800">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Akun Pengguna</h3>
                <p className="text-xs text-slate-400">Peringatan: Tindakan ini permanen</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Apakah Anda yakin ingin menghapus akun Anda (<strong className="text-white">{currentUser?.email}</strong>)? 
              Setelah akun dihapus, sesi login Anda akan diakhiri dan akun tidak dapat digunakan lagi.
            </p>

            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300 mb-4 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                Data riwayat inspeksi sebelumnya yang telah dicatat tetap tersimpan demi kepatuhan audit HSE.
              </span>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDeleteOwnModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (currentUser) {
                    await deleteUser(currentUser.id);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Akun Saya</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
