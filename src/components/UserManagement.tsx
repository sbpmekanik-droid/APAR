import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Shield, 
  Power, 
  Edit3, 
  CheckCircle2, 
  X, 
  Phone, 
  Mail, 
  Building,
  Trash2,
  AlertTriangle,
  Key,
  Save
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

export const UserManagement: React.FC = () => {
  const { usersList, addUser, updateUser, toggleUserStatus, updateUserRole, deleteUser, currentUser } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Add form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<UserRole>('inspector');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('HSE Field Inspection');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('inspector');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Nama dan Email wajib diisi.');
      return;
    }

    await addUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      password: password.trim() || '123456',
      phone: phone.trim() || undefined,
      department: department.trim() || undefined,
      isActive: true,
    });

    setName('');
    setEmail('');
    setPassword('123456');
    setPhone('');
    setShowAddModal(false);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPhone(user.phone || '');
    setEditDepartment(user.department || '');
    setEditPassword('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim() || !editEmail.trim()) {
      alert('Nama dan Email wajib diisi.');
      return;
    }

    await updateUser(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      phone: editPhone.trim() || undefined,
      department: editDepartment.trim() || undefined,
      ...(editPassword ? { password: editPassword.trim() } : {}),
    });

    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-red-500" />
            <span>Manajemen Pengguna & Akun Petugas HSE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola hak akses petugas inspeksi lapangan (Inspector) dan Administrator / HSE Manager.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Petugas</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center space-x-2 text-red-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator / HSE Manager</span>
          </div>
          <p className="text-slate-300">
            Hak akses penuh: Mengelola master APAR, nonaktifkan tabung, cetak QR massal, kelola akun petugas, analisis laporan dan ekspor data ke Excel/PDF.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>Inspector / Petugas Lapangan</span>
          </div>
          <p className="text-slate-300">
            Hak akses operasional: Scan QR Code, mengisi formulir pemeriksaan mingguan, unggah foto bukti. Dilarang mengubah master data APAR atau menghapus arsip riwayat.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Nama & Kontak</th>
                <th className="px-4 py-3.5">Departemen</th>
                <th className="px-4 py-3.5">Hak Akses (Role)</th>
                <th className="px-4 py-3.5">Status Akun</th>
                <th className="px-4 py-3.5">Terdaftar Sejak</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {usersList.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <tr key={user.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white text-sm flex items-center space-x-1.5">
                        <span>{user.name}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            (Anda)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="flex items-center"><Mail className="w-3 h-3 mr-1 text-slate-500" />{user.email}</span>
                        {user.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1 text-slate-500" />{user.phone}</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {user.department || 'HSE Department'}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        user.role === 'admin' 
                          ? 'bg-red-950 text-red-300 border border-red-800' 
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {user.role === 'admin' ? '🛡️ HSE Manager' : '🔍 Inspector Lapangan'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.isActive 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' 
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {user.isActive ? 'AKTIF' : 'NON-AKTIF'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {user.createdAt ? user.createdAt.split('T')[0] : '-'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Edit User Button */}
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 cursor-pointer"
                          title="Edit Akun & Password"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {!isSelf && (
                          <>
                            {/* Toggle Role */}
                            <button
                              onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'inspector' : 'admin')}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium border border-slate-700 cursor-pointer"
                              title="Ganti Peran Pengguna"
                            >
                              Jadikan {user.role === 'admin' ? 'Inspector' : 'Admin'}
                            </button>

                            {/* Toggle Active */}
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`p-1.5 rounded-lg cursor-pointer ${
                                user.isActive 
                                  ? 'text-amber-400 hover:bg-slate-800' 
                                  : 'text-emerald-400 hover:bg-slate-800'
                              }`}
                              title={user.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/60 cursor-pointer"
                              title="Hapus Akun Pengguna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-red-500" />
                <span>Pendaftaran Akun Petugas HSE Baru</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Lengkap Petugas <span className="text-red-400">*</span>:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Ahmad Fadilah"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email Perusahaan / Login <span className="text-red-400">*</span>:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ahmad.f@vbelt.hse.id"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Kata Sandi (Password) Login <span className="text-red-400">*</span>:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter (default: 123456)"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Peran / Hak Akses:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 font-bold"
                >
                  <option value="inspector">Inspector / Petugas Lapangan</option>
                  <option value="admin">Administrator / HSE Manager</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nomor WhatsApp / Telepon:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Departemen / Seksi:
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="HSE Field Inspection"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer shadow-md"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-red-500" />
                <span>Edit Data Akun & Password</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Lengkap Petugas <span className="text-red-400">*</span>:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email Perusahaan / Login <span className="text-red-400">*</span>:
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Peran / Hak Akses:
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 font-bold"
                >
                  <option value="inspector">Inspector / Petugas Lapangan</option>
                  <option value="admin">Administrator / HSE Manager</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Kata Sandi Baru (Kosongkan jika tidak diubah):
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Biarkan kosong jika tidak ingin ganti sandi"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nomor WhatsApp / Telepon:
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Departemen / Seksi:
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="HSE Field Inspection"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer shadow-md flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan ke Cloud</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-red-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <div className="flex items-center space-x-3 text-red-400 mb-3">
              <div className="p-2 rounded-xl bg-red-950 border border-red-800">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Konfirmasi Hapus Akun</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Apakah Anda yakin ingin menghapus akun pengguna{' '}
              <strong className="text-white">{deletingUser.name}</strong> ({deletingUser.email})? 
              Akses login untuk pengguna ini akan dihapus secara permanen dari sistem.
            </p>

            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300 mb-4 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                Pengguna yang dihapus tidak akan dapat masuk kembali ke sistem HSE APAR.
              </span>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deletingUser) {
                    await deleteUser(deletingUser.id);
                    setDeletingUser(null);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
