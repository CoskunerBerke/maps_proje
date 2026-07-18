import { useState, useEffect } from 'react';
import { translateCategory } from './Dashboard';
import { 
  Phone, PhoneCall, PlusCircle, Loader2, RefreshCw, 
  MessageSquare, Building, Globe, ExternalLink 
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  primaryType: string;
  formattedAddress: string;
  nationalPhoneNumber: string | null;
  internationalPhoneNumber: string | null;
  websiteUri: string | null;
  websiteStatus: string;
  callingStatus: string;
  createdAt: string;
  notes: { id: string; content: string; createdAt: string }[];
  demoWebsiteUrl: string | null;
  email: string | null;
}

interface CRMTrackingProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  userLocation: { lat: number; lng: number } | null;
}

const CRM_STATUSES = [
  'Henüz aranmadı',
  'Arandı, ulaşılmadı',
  'İlgileniyor',
  'Teklif istiyor',
  'Daha sonra ara',
  'Web sitesi istemiyor',
  'Yanlış telefon',
  'Müşteriye dönüştü',
];

export default function CRMTracking({ showToast }: CRMTrackingProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('Henüz aranmadı');
  
  // Note creation inputs map: businessId -> inputContent
  const [noteInputs, setNoteInputs] = useState<{ [key: string]: string }>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [generatingSiteId, setGeneratingSiteId] = useState<string | null>(null);

  const handleGenerateAiWebsite = async (id: string) => {
    setGeneratingSiteId(id);
    showToast('Yapay Zeka web sitesi üretimi başlatıldı. E-posta adresi aranıyor...', 'info');
    try {
      const response = await fetch(`/api/businesses/${id}/generate-site`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Web sitesi üretilemedi.');
      }

      const updatedBusiness = await response.json();
      showToast('Web sitesi başarıyla üretildi, Vercel\'e yüklendi ve masaüstüne kaydedildi!', 'success');
      
      // Update state list
      setBusinesses((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updatedBusiness } : b))
      );
    } catch (error: any) {
      showToast(error.message || 'Otomasyon başarısız oldu.', 'error');
    } finally {
      setGeneratingSiteId(null);
    }
  };

  const fetchCRMData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Only load potential clients
      params.append('status', 'all_website_less');
      // Load all of them, then we can filter in memory or get count aggregates
      const response = await fetch(`/api/businesses?${params.toString()}`);
      if (!response.ok) throw new Error('CRM verileri yüklenemedi.');
      const data = await response.json();
      setBusinesses(data);
    } catch (e: any) {
      showToast(e.message || 'Veri hatası.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMData();
  }, []);

  // Update Calling Status directly
  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/businesses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callingStatus: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Durum güncellenemedi.');
      
      showToast(`Durum "${newStatus}" olarak güncellendi.`, 'success');
      
      // Update local state
      setBusinesses((prev) =>
        prev.map((b) => (b.id === id ? { ...b, callingStatus: newStatus } : b))
      );
    } catch (e: any) {
      showToast(e.message || 'Hata oluştu.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Add inline note
  const handleAddNote = async (id: string) => {
    const noteText = noteInputs[id]?.trim();
    if (!noteText || noteText === '') return;

    setUpdatingId(id);
    try {
      const response = await fetch(`/api/businesses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: noteText,
        }),
      });

      if (!response.ok) throw new Error('Not eklenemedi.');
      
      const updated = await response.json();
      
      showToast('Kullanıcı notu kaydedildi.', 'success');
      
      // Update local list
      setBusinesses((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
      );

      // Clear input
      setNoteInputs((prev) => ({ ...prev, [id]: '' }));
    } catch (e: any) {
      showToast(e.message || 'Hata oluştu.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNoteInputChange = (id: string, text: string) => {
    setNoteInputs((prev) => ({ ...prev, [id]: text }));
  };

  // Get count of businesses for each CRM status in local memory
  const getStatusCount = (status: string) => {
    return businesses.filter((b) => b.callingStatus === status).length;
  };

  // Filtered list based on active sidebar tab
  const filteredList = businesses.filter((b) => b.callingStatus === activeStatusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Müşteri Takip Sistemi (CRM)</h2>
          <p className="text-sm text-slate-400">Web sitesi bulunmayan işletmelerle kurduğunuz iletişimi yönetin.</p>
        </div>
        <button
          onClick={fetchCRMData}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={16} />
          <span>Yenile</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          <span className="text-sm text-slate-400 font-medium">CRM Kayıtları Yükleniyor...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* CRM Status Filters (Left sidebar in tab view) */}
          <div className="lg:col-span-1 space-y-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 h-fit">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">Arama Aşamaları</span>
            <div className="space-y-1 pt-2">
              {CRM_STATUSES.map((status) => {
                const count = getStatusCount(status);
                const isActive = activeStatusFilter === status;

                return (
                  <button
                    key={status}
                    onClick={() => setActiveStatusFilter(status)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                    }`}
                  >
                    <span>{status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CRM Businesses List (Main display) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-slate-800 text-cyan-400">
                  <PhoneCall size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{activeStatusFilter}</h3>
                  <p className="text-xs text-slate-500">Bu aşamada toplam {filteredList.length} işletme listeleniyor.</p>
                </div>
              </div>
            </div>

            {filteredList.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl italic">
                Bu aşamada kayıtlı herhangi bir işletme bulunmuyor.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredList.map((b) => {
                  const phone = b.nationalPhoneNumber || b.internationalPhoneNumber;
                  return (
                    <div
                      key={b.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700/80 transition-colors relative"
                    >
                      {updatingId === b.id && (
                        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                          <Loader2 className="animate-spin text-cyan-400" size={24} />
                        </div>
                      )}

                      {/* Top Row: Business Info */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white text-sm">{b.name}</h4>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-semibold border border-slate-750">
                              {translateCategory(b.primaryType)}
                            </span>
                            {b.websiteStatus === 'social_media_only' && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[10px] text-amber-400 font-bold border border-amber-500/20">
                                Sadece Sosyal Medya
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-1 text-xs text-slate-400 pt-1">
                            <span className="flex items-center gap-1.5">
                              <Building size={12} className="text-slate-500" />
                              <span>{b.formattedAddress}</span>
                            </span>
                            {phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone size={12} className="text-slate-500" />
                                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-cyan-400 hover:underline">
                                  {phone}
                                </a>
                              </span>
                            )}
                            {b.email && (
                              <span className="text-[11px] text-slate-350 bg-slate-950/30 px-2 py-0.5 rounded border border-slate-850 w-fit mt-1">
                                E-posta: <strong className="text-slate-200">{b.email}</strong>
                              </span>
                            )}
                            {b.demoWebsiteUrl && (
                              <a
                                href={b.demoWebsiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 mt-1 font-semibold"
                              >
                                <span>Üretilen Site: {b.demoWebsiteUrl}</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Status Change Dropdown */}
                        <div className="space-y-1 shrink-0">
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Durumu Değiştir</label>
                          <select
                            value={b.callingStatus}
                            onChange={(e) => handleStatusChange(b.id, e.target.value)}
                            className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-lg p-2 text-xs text-white outline-none cursor-pointer"
                          >
                            {CRM_STATUSES.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Middle Row: Notes History log */}
                      {b.notes.length > 0 && (
                        <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3.5 space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <MessageSquare size={12} className="text-cyan-400" />
                            <span>Görüşme Geçmişi ({b.notes.length})</span>
                          </span>

                          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                            {b.notes.map((note) => (
                              <div key={note.id} className="text-xs border-l-2 border-slate-700 pl-3.5 py-0.5 space-y-0.5">
                                <div className="text-[9px] text-slate-500 flex gap-2">
                                  <span>{new Date(note.createdAt).toLocaleDateString('tr-TR')}</span>
                                  <span>{new Date(note.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-slate-350">{note.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bottom Row: Add new note inline */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="İşletmeyle ilgili görüşme notunuzu yazın... (örn: WhatsApp'tan ulaşıldı)"
                            value={noteInputs[b.id] || ''}
                            onChange={(e) => handleNoteInputChange(b.id, e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-850 focus:border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddNote(b.id)}
                            disabled={!noteInputs[b.id] || noteInputs[b.id].trim() === ''}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer disabled:cursor-not-allowed transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                          >
                            <PlusCircle size={12} />
                            <span>Not Ekle</span>
                          </button>
                        </div>
                        
                        {!b.demoWebsiteUrl && (
                          <button
                            type="button"
                            onClick={() => handleGenerateAiWebsite(b.id)}
                            disabled={generatingSiteId !== null}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-850 disabled:to-slate-850 disabled:text-slate-500 text-slate-950 disabled:cursor-not-allowed text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            {generatingSiteId === b.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Globe size={12} />
                            )}
                            <span>Yapay Zeka Sitesi Üret</span>
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
