import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, ShieldCheck, Plus, 
  Trash2, Loader2, Save 
} from 'lucide-react';

interface SettingsData {
  id: string;
  dailyMaxSearches: number;
  maxCategoriesPerSearch: number;
  maxBusinessesPerSearch: number;
  isDemoMode: boolean;
  geminiApiKey: string | null;
  vercelToken: string | null;
}

interface ExcludedBrand {
  id: string;
  name: string;
}

interface SettingsProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function Settings({ showToast }: SettingsProps) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [brands, setBrands] = useState<ExcludedBrand[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Brand addition inputs
  const [newBrandName, setNewBrandName] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);

  const fetchSettingsAndBrands = async () => {
    setLoading(true);
    try {
      // 1. Fetch App Settings
      const settingsRes = await fetch('/api/settings');
      if (!settingsRes.ok) throw new Error('Uygulama ayarları alınamadı.');
      const settingsData = await settingsRes.json();
      setSettings(settingsData);

      // 2. Fetch Excluded Brands
      const brandsRes = await fetch('/api/excluded-brands');
      if (!brandsRes.ok) throw new Error('Kara liste alınamadı.');
      const brandsData = await brandsRes.json();
      setBrands(brandsData);
    } catch (e: any) {
      showToast(e.message || 'Veriler yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndBrands();
  }, []);

  // Save general settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSavingSettings(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyMaxSearches: settings.dailyMaxSearches,
          maxCategoriesPerSearch: settings.maxCategoriesPerSearch,
          maxBusinessesPerSearch: settings.maxBusinessesPerSearch,
          isDemoMode: settings.isDemoMode,
          geminiApiKey: settings.geminiApiKey,
          vercelToken: settings.vercelToken,
        }),
      });

      if (!response.ok) throw new Error('Ayarlar kaydedilemedi.');
      const updated = await response.json();
      setSettings(updated);
      showToast('Uygulama ayarları başarıyla güncellendi.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Güncelleme hatası.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle Demo Mode directly
  const handleToggleDemoMode = async (val: boolean) => {
    if (!settings) return;
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDemoMode: val,
        }),
      });

      if (!response.ok) throw new Error('Demo modu değiştirilemedi.');
      const updated = await response.json();
      setSettings(updated);
      showToast(val ? 'Demo modu aktif. Mock veriler kullanılacak.' : 'Gerçek mod aktif. Google API kullanılacak.', 'info');
    } catch (e: any) {
      showToast(e.message || 'Demo modu güncellenemedi.', 'error');
    }
  };

  // Add Excluded Brand
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBrandName.trim();
    if (!name || name === '') return;

    setAddingBrand(true);
    try {
      const response = await fetch('/api/excluded-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Marka eklenemedi.');
      }
      
      const newBrand = await response.json();
      setBrands((prev) => [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)));
      setNewBrandName('');
      showToast(`"${name}" zincir işletme kara listesine eklendi.`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Marka ekleme hatası.', 'error');
    } finally {
      setAddingBrand(false);
    }
  };

  // Delete Excluded Brand
  const handleDeleteBrand = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/excluded-brands/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Marka silinemedi.');
      
      setBrands((prev) => prev.filter((b) => b.id !== id));
      showToast(`"${name}" kara listeden çıkarıldı.`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Marka silme hatası.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[350px] bg-slate-900 border border-slate-800 rounded-2xl"></div>
          <div className="h-[350px] bg-slate-900 border border-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Uygulama Ayarları</h2>
        <p className="text-sm text-slate-400">Google API limitleri, demo modu ve kara liste parametrelerini yapılandırın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* General Settings Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <h3 className="font-semibold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <SettingsIcon size={18} className="text-cyan-400" />
              <span>Limit ve Genel Ayarlar</span>
            </h3>

            {/* Demo Mode Toggle Banner */}
            {settings && (
              <div className={`p-4 rounded-xl border flex justify-between items-center transition-colors ${
                settings.isDemoMode 
                  ? 'bg-amber-950/20 border-amber-500/20 text-amber-300' 
                  : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
              }`}>
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold uppercase tracking-wider">Demo Verileriyle Çalış</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Aktif edildiğinde, Google Cloud API yerine test amaçlı seed verileri kullanılır. API kotası harcanmaz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleDemoMode(!settings.isDemoMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    settings.isDemoMode
                      ? 'bg-amber-500/25 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-350 border border-slate-700'
                  }`}
                >
                  {settings.isDemoMode ? 'Aktif' : 'Pasif Yap'}
                </button>
              </div>
            )}

            {/* Numeric Inputs */}
            {settings && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Günlük Maksimum Tarama Sayısı</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.dailyMaxSearches}
                    onChange={(e) => setSettings({ ...settings, dailyMaxSearches: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-lg p-2 text-white outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Günde en fazla kaç tarama yapılabileceği sınırı</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Bir Taramada Maksimum Kategori Sayısı</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxCategoriesPerSearch}
                    onChange={(e) => setSettings({ ...settings, maxCategoriesPerSearch: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-lg p-2 text-white outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Tek bir aramada çoklu kategoride seçilebilecek maksimum limit</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Bir Taramada Maksimum İşletme Limiti</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.maxBusinessesPerSearch}
                    onChange={(e) => setSettings({ ...settings, maxBusinessesPerSearch: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-lg p-2 text-white outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Aramada dönebilecek maksimum işletme sayısı (Varsayılan: 100)</span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-850">
                  <label className="font-semibold text-slate-300">Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="AI Web sitesi üretimi için Gemini API Key girin..."
                    value={settings.geminiApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-lg p-2 text-white outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Google AI Studio'dan alacağınız API anahtarı</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Vercel Access Token</label>
                  <input
                    type="password"
                    placeholder="Otomatik deployment için Vercel Token girin..."
                    value={settings.vercelToken || ''}
                    onChange={(e) => setSettings({ ...settings, vercelToken: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-lg p-2 text-white outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Vercel kontrol panelinden üreteceğiniz Access Token</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 cursor-pointer disabled:bg-slate-800 disabled:text-slate-550 transition-all flex items-center justify-center gap-1.5"
            >
              {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Ayarları Kaydet</span>
            </button>
          </form>
        </div>

        {/* Excluded Brands Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col h-[520px]">
          <h3 className="font-semibold text-white flex items-center gap-2 pb-2 border-b border-slate-800 shrink-0">
            <ShieldCheck size={18} className="text-cyan-400" />
            <span>Zincir İşletme Kara Listesi</span>
          </h3>

          <p className="text-[10px] text-slate-450 leading-relaxed py-3 shrink-0">
            İşletme adı aşağıdaki listedeki kelimelerden birini içerirse ve arama formunda <strong>"Zincir işletmeleri hariç tut"</strong> seçeneği seçilirse bu işletmeler elenir.
          </p>

          {/* Add Brand Form */}
          <form onSubmit={handleAddBrand} className="flex gap-2 pb-4 border-b border-slate-850 shrink-0">
            <input
              type="text"
              placeholder="Yeni zincir marka adı (Örn: Subway)..."
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              required
            />
            <button
              type="submit"
              disabled={addingBrand || newBrandName.trim() === ''}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 disabled:bg-slate-950 disabled:text-slate-600 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition-all flex items-center gap-1 shrink-0"
            >
              {addingBrand ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              <span>Ekle</span>
            </button>
          </form>

          {/* Brands List Scrollbar Container */}
          <div className="flex-1 overflow-y-auto pt-4 pr-1 space-y-2">
            {brands.length === 0 ? (
              <div className="text-slate-500 text-center text-xs italic pt-8">
                Kara listede herhangi bir marka bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex justify-between items-center bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg text-xs"
                  >
                    <span className="font-semibold text-slate-350 truncate pr-2">{brand.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(brand.id, brand.name)}
                      className="text-red-500/80 hover:text-red-400 p-1 rounded hover:bg-slate-900 transition-all cursor-pointer shrink-0"
                      title="Sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
