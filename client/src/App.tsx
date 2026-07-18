import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import NewScan from './pages/NewScan';
import Businesses from './pages/Businesses';
import MapView from './pages/MapView';
import Settings from './pages/Settings';
import CRMTracking from './pages/CRMTracking';
import { LayoutGrid, Radar, Table2, MapPin, Settings as SettingsIcon, PhoneCall, Globe, X, Menu } from 'lucide-react';

export type TabType = 'dashboard' | 'new-scan' | 'businesses' | 'map' | 'crm' | 'settings';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load user location from localStorage if saved
  useEffect(() => {
    const saved = localStorage.getItem('user_location');
    if (saved) {
      try {
        setUserLocation(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleSetLocation = (lat: number, lng: number) => {
    const loc = { lat, lng };
    setUserLocation(loc);
    localStorage.setItem('user_location', JSON.stringify(loc));
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between min-w-[300px] p-4 rounded-lg shadow-lg border pointer-events-auto transform transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-slate-900 border-cyan-500/30 text-cyan-400'
                : toast.type === 'error'
                ? 'bg-slate-900 border-red-500/30 text-red-400'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-4 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800">
        <div className="flex items-center gap-3 p-6 border-b border-slate-800">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 font-bold">
            <Globe size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wider text-cyan-400">Eksik Web</h1>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Web Sitesi Bulucu</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <SidebarLink
            icon={<LayoutGrid size={18} />}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarLink
            icon={<Radar size={18} />}
            label="Yeni Tarama"
            active={activeTab === 'new-scan'}
            onClick={() => setActiveTab('new-scan')}
          />
          <SidebarLink
            icon={<Table2 size={18} />}
            label="İşletmeler"
            active={activeTab === 'businesses'}
            onClick={() => setActiveTab('businesses')}
          />
          <SidebarLink
            icon={<MapPin size={18} />}
            label="Harita"
            active={activeTab === 'map'}
            onClick={() => setActiveTab('map')}
          />
          <SidebarLink
            icon={<PhoneCall size={18} />}
            label="Arama Takibi"
            active={activeTab === 'crm'}
            onClick={() => setActiveTab('crm')}
          />
          <SidebarLink
            icon={<SettingsIcon size={18} />}
            label="Ayarlar"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          v1.0.0 &copy; Antigravity
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-cyan-500 text-slate-950 font-bold">
                  <Globe size={16} />
                </div>
                <span className="font-bold tracking-wider text-cyan-400">Eksik Web</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              <SidebarLink
                icon={<LayoutGrid size={18} />}
                label="Dashboard"
                active={activeTab === 'dashboard'}
                onClick={() => {
                  setActiveTab('dashboard');
                  setSidebarOpen(false);
                }}
              />
              <SidebarLink
                icon={<Radar size={18} />}
                label="Yeni Tarama"
                active={activeTab === 'new-scan'}
                onClick={() => {
                  setActiveTab('new-scan');
                  setSidebarOpen(false);
                }}
              />
              <SidebarLink
                icon={<Table2 size={18} />}
                label="İşletmeler"
                active={activeTab === 'businesses'}
                onClick={() => {
                  setActiveTab('businesses');
                  setSidebarOpen(false);
                }}
              />
              <SidebarLink
                icon={<MapPin size={18} />}
                label="Harita"
                active={activeTab === 'map'}
                onClick={() => {
                  setActiveTab('map');
                  setSidebarOpen(false);
                }}
              />
              <SidebarLink
                icon={<PhoneCall size={18} />}
                label="Arama Takibi"
                active={activeTab === 'crm'}
                onClick={() => {
                  setActiveTab('crm');
                  setSidebarOpen(false);
                }}
              />
              <SidebarLink
                icon={<SettingsIcon size={18} />}
                label="Ayarlar"
                active={activeTab === 'settings'}
                onClick={() => {
                  setActiveTab('settings');
                  setSidebarOpen(false);
                }}
              />
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 md:justify-end">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4">
            {userLocation ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                <MapPin size={14} className="text-cyan-400 animate-pulse" />
                <span>Enlem: {userLocation.lat.toFixed(4)}, Boylam: {userLocation.lng.toFixed(4)}</span>
              </div>
            ) : (
              <div className="hidden sm:block text-xs text-slate-500">Konum seçilmedi</div>
            )}
            
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            <div className="text-sm font-semibold text-cyan-400">Local Mod</div>
          </div>
        </header>

        {/* Tab content wrapper */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <Dashboard showToast={showToast} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'new-scan' && (
            <NewScan
              showToast={showToast}
              userLocation={userLocation}
              onSetLocation={handleSetLocation}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'businesses' && (
            <Businesses showToast={showToast} userLocation={userLocation} />
          )}
          {activeTab === 'map' && (
            <MapView showToast={showToast} userLocation={userLocation} />
          )}
          {activeTab === 'crm' && (
            <CRMTracking showToast={showToast} userLocation={userLocation} />
          )}
          {activeTab === 'settings' && (
            <Settings showToast={showToast} />
          )}
        </main>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SidebarLink({ icon, label, active, onClick }: SidebarLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default App;
