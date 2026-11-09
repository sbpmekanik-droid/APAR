/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AparList } from './components/AparList';
import { AparForm } from './components/AparForm';
import { QrGenerator } from './components/QrGenerator';
import { QrScanner } from './components/QrScanner';
import { InspectionForm } from './components/InspectionForm';
import { WeeklyMonitoring } from './components/WeeklyMonitoring';
import { InspectionHistory } from './components/InspectionHistory';
import { FollowUpList } from './components/FollowUpList';
import { Reports } from './components/Reports';
import { UserManagement } from './components/UserManagement';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { AparItem } from './types';

function MainApp() {
  const { currentUser, loading } = useAuth();
  const { apars, getAparById } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cross-component states
  const [targetAparForInspection, setTargetAparForInspection] = useState<AparItem | null>(null);
  const [targetAparForQr, setTargetAparForQr] = useState<AparItem | null>(null);
  const [editingApar, setEditingApar] = useState<AparItem | null>(null);
  const [selectedAparDetailId, setSelectedAparDetailId] = useState<string | undefined>(undefined);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  // If auth is still checking
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Memuat Sistem HSE APAR...
          </p>
        </div>
      </div>
    );
  }

  // If no user is logged in
  if (!currentUser) {
    return <LoginModal onSuccess={() => setActiveTab('dashboard')} />;
  }

  // Navigation handlers
  const handleStartInspection = (apar: AparItem) => {
    setTargetAparForInspection(apar);
    setActiveTab('inspection-form');
    setIsScannerModalOpen(false);
  };

  const handlePrintQr = (apar: AparItem) => {
    setTargetAparForQr(apar);
    setActiveTab('generate-qr');
  };

  const handleEditApar = (apar: AparItem) => {
    setEditingApar(apar);
    setActiveTab('tambah-apar');
  };

  const handleSelectApar = (aparId: string) => {
    setSelectedAparDetailId(aparId);
    setActiveTab('master-apar');
  };

  const handleOpenScanner = () => {
    setActiveTab('scan-qr');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      
      {/* Top Application Header */}
      <Header
        onOpenScanner={handleOpenScanner}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex overflow-hidden">
        
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'tambah-apar') setEditingApar(null);
            setActiveTab(tab);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto lg:pl-64 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {/* View 1: Dashboard */}
            {activeTab === 'dashboard' && (
              <Dashboard
                setActiveTab={setActiveTab}
                onOpenScanner={handleOpenScanner}
                onSelectApar={handleSelectApar}
              />
            )}

            {/* View 2: Master Data APAR */}
            {activeTab === 'master-apar' && (
              <AparList
                onAddNew={() => {
                  setEditingApar(null);
                  setActiveTab('tambah-apar');
                }}
                onEditApar={handleEditApar}
                onPrintQr={handlePrintQr}
                onStartInspection={handleStartInspection}
                selectedAparId={selectedAparDetailId}
              />
            )}

            {/* View 3: Tambah / Edit APAR */}
            {activeTab === 'tambah-apar' && (
              <AparForm
                initialApar={editingApar}
                onSuccess={(savedId) => {
                  setEditingApar(null);
                  setSelectedAparDetailId(savedId);
                  setActiveTab('master-apar');
                }}
                onCancel={() => {
                  setEditingApar(null);
                  setActiveTab('master-apar');
                }}
              />
            )}

            {/* View 4: Generate & Cetak QR */}
            {activeTab === 'generate-qr' && (
              <QrGenerator initialApar={targetAparForQr} />
            )}

            {/* View 5: Scan QR Code */}
            {activeTab === 'scan-qr' && (
              <QrScanner
                onStartInspection={handleStartInspection}
                onClose={() => setActiveTab('dashboard')}
              />
            )}

            {/* View 6: Formulir Inspeksi Mingguan */}
            {activeTab === 'inspection-form' && targetAparForInspection && (
              <InspectionForm
                apar={targetAparForInspection}
                onSuccess={(inspectionId) => {
                  setTargetAparForInspection(null);
                  setActiveTab('monitoring');
                }}
                onCancel={() => {
                  setTargetAparForInspection(null);
                  setActiveTab('master-apar');
                }}
              />
            )}

            {/* View 7: Monitoring Inspeksi Mingguan */}
            {activeTab === 'monitoring' && (
              <WeeklyMonitoring
                onStartInspection={handleStartInspection}
                onSelectApar={handleSelectApar}
              />
            )}

            {/* View 8: Riwayat Inspeksi */}
            {activeTab === 'riwayat' && (
              <InspectionHistory
                initialAparId={selectedAparDetailId}
                onSelectApar={handleSelectApar}
              />
            )}

            {/* View 9: Tindak Lanjut & Perbaikan */}
            {activeTab === 'tindak-lanjut' && (
              <FollowUpList />
            )}

            {/* View 10: Laporan & Export */}
            {activeTab === 'laporan' && (
              <Reports />
            )}

            {/* View 11: Manajemen User */}
            {activeTab === 'users' && (
              <UserManagement />
            )}

            {/* View 12: Pengaturan */}
            {activeTab === 'pengaturan' && (
              <SettingsModal />
            )}

          </div>
        </main>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}
