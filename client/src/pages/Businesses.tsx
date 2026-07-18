import React, { useState, useEffect } from 'react';
import { translateCategory } from './Dashboard';
import { 
  FileSpreadsheet, FileText, Phone, Star, MessageCircle, 
  ExternalLink, Eye, PhoneCall, Trash2, Edit3, Search, Filter, 
  ArrowUpDown, X, Check, Loader2, Globe 
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  primaryType: string;
  types: string[];
  formattedAddress: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  userRatingCount: number | null;
  websiteUri: string | null;
  websiteStatus: string;
  nationalPhoneNumber: string | null;
  internationalPhoneNumber: string | null;
  googleMapsUri: string | null;
  businessStatus: string | null;
  isOpen: boolean | null;
  callingStatus: string;
  createdAt: string;
  distance: number;
  notes: { id: string; content: string; createdAt: string }[];
  demoWebsiteUrl: string | null;
  email: string | null;
}

interface BusinessesProps {
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

export default function Businesses({ showToast, userLocation }: BusinessesProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting States
  const [websiteStatusFilter, setWebsiteStatusFilter] = useState<string>('all_website_less'); // 'no_website', 'social_media_only', 'has_website', 'all_website_less', 'all'
  const [crmFilter, setCrmFilter] = useState<string>('all'); // specific crm status or 'all', 'aranmamis', 'arananlar', 'olumlu', 'olumsuz', 'daha_sonra_ara'
  const [onlyWithPhone, setOnlyWithPhone] = useState<boolean>(false);
  const [excludeExisting, setExcludeExisting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('closest'); // 'closest', 'furthest', 'highest_rating', 'most_reviews', 'least_reviews', 'newest'
  
  // Selected Business for CRM Modal
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [crmStatusInput, setCrmStatusInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Export Loading States
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
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

      // Update selected business to refresh modal view
      if (selectedBusiness && selectedBusiness.id === id) {
        setSelectedBusiness({ ...selectedBusiness, ...updatedBusiness });
      }
    } catch (error: any) {
      showToast(error.message || 'Otomasyon başarısız oldu.', 'error');
    } finally {
      setGeneratingSiteId(null);
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Map frontend filters to API query params
      if (websiteStatusFilter === 'all_website_less') {
        // default (no filter explicitly sets no_website & social_media_only in backend)
      } else {
        params.append('status', websiteStatusFilter);
      }

      if (crmFilter !== 'all') {
        if (CRM_STATUSES.includes(crmFilter)) {
          params.append('callingStatus', crmFilter);
        } else {
          params.append('crmGroup', crmFilter);
        }
      }

      if (onlyWithPhone) {
        params.append('onlyWithPhone', 'true');
      }

      if (excludeExisting) {
        params.append('excludeExisting', 'true');
      }

      if (searchQuery.trim() !== '') {
        params.append('search', searchQuery.trim());
      }

      params.append('sortBy', sortBy);

      if (userLocation) {
        params.append('lat', String(userLocation.lat));
        params.append('lng', String(userLocation.lng));
      }

      const response = await fetch(`/api/businesses?${params.toString()}`);
      if (!response.ok) {
        throw new Error('İşletmeler çekilemedi.');
      }
      const data = await response.json();
      setBusinesses(data);
      setCurrentPage(1); // reset to page 1 on search
    } catch (error: any) {
      showToast(error.message || 'Veriler yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [websiteStatusFilter, crmFilter, onlyWithPhone, excludeExisting, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBusinesses();
  };

  // Quick action: Mark as Called (Arandı as default or "Arandı, ulaşılmadı")
  const handleMarkAsCalled = async (id: string) => {
    try {
      const response = await fetch(`/api/businesses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callingStatus: 'Arandı, ulaşılmadı',
          note: 'Hızlı arama yapıldı, ulaşılamadı.',
        }),
      });

      if (!response.ok) throw new Error('Güncelleme başarısız.');
      
      showToast('Arama durumu güncellendi.', 'success');
      
      // Update local state
      setBusinesses((prev) =>
        prev.map((b) => {
          if (b.id === id) {
            const updated = { 
              ...b, 
              callingStatus: 'Arandı, ulaşılmadı' 
            };
            // Add note to notes list
            updated.notes = [
              {
                id: Math.random().toString(),
                content: 'Hızlı arama yapıldı, ulaşılamadı.',
                createdAt: new Date().toISOString(),
              },
              ...b.notes,
            ];
            return updated;
          }
          return b;
        })
      );
    } catch (e: any) {
      showToast(e.message || 'Güncellenemedi.', 'error');
    }
  };

  // Listeden Çıkar (Delete Business)
  const handleDeleteBusiness = async (id: string) => {
    if (!window.confirm('Bu işletmeyi listeden kalıcı olarak çıkarmak istediğinize emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/businesses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Silme başarısız oldu.');

      showToast('İşletme listeden çıkarıldı.', 'success');
      setBusinesses((prev) => prev.filter((b) => b.id !== id));
    } catch (e: any) {
      showToast(e.message || 'Silinemedi.', 'error');
    }
  };

  // Open CRM Modal
  const openCrmModal = (business: Business) => {
    setSelectedBusiness(business);
    setCrmStatusInput(business.callingStatus);
    setNoteInput('');
  };

  // Close CRM Modal
  const closeCrmModal = () => {
    setSelectedBusiness(null);
    setCrmStatusInput('');
    setNoteInput('');
  };

  // Submit CRM Update
  const handleCrmUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    setModalLoading(true);
    try {
      const response = await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callingStatus: crmStatusInput,
          note: noteInput.trim() !== '' ? noteInput.trim() : undefined,
        }),
      });

      if (!response.ok) throw new Error('Güncelleme yapılamadı.');

      const updatedBusiness = await response.json();
      
      showToast('İşletme başarıyla güncellendi.', 'success');
      
      // Update local state list
      setBusinesses((prev) =>
        prev.map((b) => (b.id === selectedBusiness.id ? { ...b, ...updatedBusiness } : b))
      );

      closeCrmModal();
    } catch (e: any) {
      showToast(e.message || 'Hata oluştu.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    setExportingXlsx(true);
    try {
      const payload: any = {
        businessIds: businesses.map((b) => b.id),
      };
      if (userLocation) {
        payload.lat = userLocation.lat;
        payload.lng = userLocation.lng;
      }

      const response = await fetch('/api/businesses/export/xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Excel dışa aktarılamadı.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header if possible
      const disposition = response.headers.get('Content-Disposition');
      let filename = `websitesiz-isletmeler-${new Date().toISOString().split('T')[0]}.xlsx`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Excel dosyası başarıyla indirildi.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Excel indirilemedi.', 'error');
    } finally {
      setExportingXlsx(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const response = await fetch('/api/businesses/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessIds: businesses.map((b) => b.id),
        }),
      });

      if (!response.ok) throw new Error('CSV dışa aktarılamadı.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const disposition = response.headers.get('Content-Disposition');
      let filename = `websitesiz-isletmeler-${new Date().toISOString().split('T')[0]}.csv`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('CSV dosyası başarıyla indirildi.', 'success');
    } catch (e: any) {
      showToast(e.message || 'CSV indirilemedi.', 'error');
    } finally {
      setExportingCsv(false);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(businesses.length / itemsPerPage);
  const paginatedBusinesses = businesses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">İşletmeler Sonuç Listesi</h2>
          <p className="text-sm text-slate-400">Bulunan işletmelerin detaylı tablosu, filtreler ve CRM yönetimi.</p>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportExcel}
            disabled={exportingXlsx || businesses.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer disabled:cursor-not-allowed transition-all"
          >
            {exportingXlsx ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            <span>Excel Dışa Aktar</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv || businesses.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 disabled:border-slate-800 disabled:text-slate-500 text-slate-200 font-semibold text-xs rounded-xl cursor-pointer disabled:cursor-not-allowed transition-all"
          >
            {exportingCsv ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            <span>CSV (UTF-8 BOM) İndir</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="İşletme adı veya adres içerisinde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl cursor-pointer transition-colors"
          >
            Filtrele ve Ara
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 border-t border-slate-850">
          {/* Website Status Select */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Filter size={10} />
              <span>Web Sitesi Durumu</span>
            </label>
            <select
              value={websiteStatusFilter}
              onChange={(e) => setWebsiteStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
            >
              <option value="all_website_less">Web Sitesi Olmayanlar (Varsayılan)</option>
              <option value="no_website">Sadece Web Sitesi Olmayanlar</option>
              <option value="social_media_only">Sadece Sosyal Medya Hesabı Olanlar</option>
              <option value="has_website">Web Sitesi Olanlar</option>
              <option value="all">Tüm İşletmeler</option>
            </select>
          </div>

          {/* CRM Status Select */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <PhoneCall size={10} />
              <span>Arama & CRM Durumu</span>
            </label>
            <select
              value={crmFilter}
              onChange={(e) => setCrmFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
            >
              <option value="all">Tümü</option>
              <option value="aranmamis">Aranmamış Olanlar</option>
              <option value="arananlar">Aranmış Olanlar (Tümü)</option>
              <option value="olumlu">Olumlu Dönüş (Kazanılan/İlgilenen)</option>
              <option value="olumsuz">Olumsuz Dönüş (İstemeyen/Hatalı)</option>
              <option value="daha_sonra_ara">Daha Sonra Aranacaklar</option>
              {CRM_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Sorting Select */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <ArrowUpDown size={10} />
              <span>Sıralama Seçeneği</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
            >
              <option value="closest">En Yakın</option>
              <option value="furthest">En Uzak</option>
              <option value="highest_rating">En Yüksek Puan</option>
              <option value="most_reviews">En Fazla Yorum</option>
              <option value="least_reviews">En Az Yorum</option>
              <option value="newest">En Yeni Bulunan</option>
            </select>
          </div>

          {/* Flags Toggles */}
          <div className="flex items-center h-full pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyWithPhone}
                onChange={(e) => setOnlyWithPhone(e.target.checked)}
                className="rounded border-slate-800 text-cyan-500 bg-slate-950 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-300">Sadece Telefonu Olanlar</span>
            </label>
          </div>

          <div className="flex items-center h-full pt-4">
            <label className="flex items-center gap-2 cursor-pointer" title="Daha önce not eklenen veya aranmış kayıtları aramada gizle.">
              <input
                type="checkbox"
                checked={excludeExisting}
                onChange={(e) => setExcludeExisting(e.target.checked)}
                className="rounded border-slate-800 text-cyan-500 bg-slate-950 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-300">Eski Kayıtları Gizle</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            <span className="text-sm text-slate-400">Veriler yükleniyor...</span>
          </div>
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Aranan kriterlere uygun işletme bulunamadı. Lütfen filtreleri güncelleyin veya yeni tarama yapın.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">İşletme Adı</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Mesafe</th>
                  <th className="px-6 py-4">Telefon</th>
                  <th className="px-6 py-4">Adres</th>
                  <th className="px-6 py-4">Puan / Yorum</th>
                  <th className="px-6 py-4">Web Sitesi Durumu</th>
                  <th className="px-6 py-4">Arama Durumu</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {paginatedBusinesses.map((b) => {
                  const phone = b.nationalPhoneNumber || b.internationalPhoneNumber;
                  const websiteStatusText = 
                    b.websiteStatus === 'no_website' ? 'Yok' :
                    b.websiteStatus === 'social_media_only' ? 'Sosyal Medya' :
                    b.websiteStatus === 'has_website' ? 'Var' : 'Bilinmiyor';

                  const websiteStatusColor = 
                    b.websiteStatus === 'no_website' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    b.websiteStatus === 'social_media_only' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                  const crmStatusColor = 
                    b.callingStatus === 'Müşteriye dönüştü' ? 'text-yellow-400 font-semibold' :
                    b.callingStatus === 'İlgileniyor' ? 'text-cyan-400' :
                    b.callingStatus === 'Henüz aranmadı' ? 'text-slate-400' : 'text-purple-400';

                  const distanceFormatted = b.distance < 1000 ? `${Math.round(b.distance)} m` : `${(b.distance / 1000).toFixed(1)} km`;

                  return (
                    <tr key={b.id} className="hover:bg-slate-850/40 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 font-semibold text-white max-w-[200px] truncate" title={b.name}>
                        {b.name}
                      </td>
                      {/* Category */}
                      <td className="px-6 py-4 text-slate-300">
                        {translateCategory(b.primaryType)}
                      </td>
                      {/* Distance */}
                      <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                        {distanceFormatted}
                      </td>
                      {/* Phone */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {phone ? (
                          <a
                            href={`tel:${phone.replace(/\s+/g, '')}`}
                            className="flex items-center gap-1.5 text-cyan-400 hover:underline"
                          >
                            <Phone size={12} />
                            <span>{phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-655">-</span>
                        )}
                      </td>
                      {/* Address */}
                      <td className="px-6 py-4 text-slate-400 max-w-[250px] truncate" title={b.formattedAddress}>
                        {b.formattedAddress}
                      </td>
                      {/* Rating & Reviews */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star size={12} fill="currentColor" />
                            <span>{b.rating || '0'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <MessageCircle size={12} />
                            <span>{b.userRatingCount || '0'}</span>
                          </div>
                        </div>
                      </td>
                      {/* Website Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${websiteStatusColor}`}>
                          {websiteStatusText}
                        </span>
                      </td>
                      {/* Calling Status */}
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        <span className={crmStatusColor}>{b.callingStatus}</span>
                      </td>
                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCrmModal(b)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 transition-colors cursor-pointer"
                            title="Detayları Aç & Düzenle"
                          >
                            <Eye size={14} />
                          </button>
                          
                          {b.callingStatus === 'Henüz aranmadı' && (
                            <button
                              onClick={() => handleMarkAsCalled(b.id)}
                              className="p-1.5 rounded bg-cyan-600/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 transition-colors cursor-pointer"
                              title="Arandı Olarak İşaretle"
                            >
                              <PhoneCall size={14} />
                            </button>
                          )}

                          {b.googleMapsUri && (
                            <a
                              href={b.googleMapsUri}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 transition-colors cursor-pointer"
                              title="Google Haritalar'da Aç"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}

                          <button
                            onClick={() => handleDeleteBusiness(b.id)}
                            className="p-1.5 rounded bg-red-950/20 hover:bg-red-500 text-red-400 hover:text-slate-950 transition-colors cursor-pointer"
                            title="Listeden Çıkar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Toplam {businesses.length} kayıttan {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, businesses.length)} arası gösteriliyor.
            </span>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-750 disabled:bg-slate-900 disabled:border-slate-900 disabled:text-slate-500 rounded text-xs cursor-pointer disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-750 disabled:bg-slate-900 disabled:border-slate-900 disabled:text-slate-500 rounded text-xs cursor-pointer disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRM DETAILS & NOTES MODAL */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
              <div>
                <h3 className="font-bold text-lg text-white">{selectedBusiness.name}</h3>
                <span className="text-xs text-slate-400">{translateCategory(selectedBusiness.primaryType)}</span>
              </div>
              <button onClick={closeCrmModal} className="text-slate-450 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-6">
              
              {/* Detailed Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <span className="text-slate-500 font-medium">Telefon Numarası</span>
                  <p className="text-slate-200 font-semibold">{selectedBusiness.nationalPhoneNumber || selectedBusiness.internationalPhoneNumber || '-'}</p>
                </div>
                <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <span className="text-slate-500 font-medium">Adres</span>
                  <p className="text-slate-200 font-semibold">{selectedBusiness.formattedAddress || '-'}</p>
                </div>
                <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <span className="text-slate-500 font-medium">Web Sitesi</span>
                  {selectedBusiness.websiteUri ? (
                    <a
                      href={selectedBusiness.websiteUri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>{selectedBusiness.websiteUri}</span>
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <p className="text-red-400 font-semibold">Web sitesi yok</p>
                  )}
                </div>
                <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <span className="text-slate-500 font-medium">Mesafe</span>
                  <p className="text-slate-200 font-semibold">
                    {selectedBusiness.distance < 1000 ? `${Math.round(selectedBusiness.distance)} m` : `${(selectedBusiness.distance / 1000).toFixed(1)} km`}
                  </p>
                </div>
                <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <span className="text-slate-500 font-medium">Bulunan E-posta</span>
                  <p className="text-slate-200 font-semibold">{selectedBusiness.email || 'Aranmadı / Bulunamadı'}</p>
                </div>
                <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-850 sm:col-span-2">
                  <span className="text-slate-500 font-medium">Üretilen Yapay Zeka Sitesi</span>
                  {selectedBusiness.demoWebsiteUrl ? (
                    <a
                      href={selectedBusiness.demoWebsiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Demoyu Görüntüle</span>
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <p className="text-slate-455 font-semibold text-slate-500">Henüz Üretilmedi</p>
                  )}
                </div>
              </div>

              {/* Notes History */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Edit3 size={16} className="text-cyan-400" />
                  <span>Not Geçmişi ({selectedBusiness.notes.length})</span>
                </h4>
                
                {selectedBusiness.notes.length === 0 ? (
                  <div className="p-4 bg-slate-950/40 rounded-lg text-slate-500 text-xs italic border border-slate-850">
                    Kayıtlı not bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                    {selectedBusiness.notes.map((note) => (
                      <div key={note.id} className="p-3 bg-slate-950/30 border border-slate-850 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>Kullanıcı Notu</span>
                          <span>{new Date(note.createdAt).toLocaleString('tr-TR')}</span>
                        </div>
                        <p className="text-slate-300 leading-normal">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer / Update Form */}
            <form onSubmit={handleCrmUpdate} className="p-6 border-t border-slate-800 bg-slate-950/20 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Arama Takip Durumu</label>
                  <select
                    value={crmStatusInput}
                    onChange={(e) => setCrmStatusInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  >
                    {CRM_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Yeni Not Ekle</label>
                  <input
                    type="text"
                    placeholder="Pazartesi tekrar aranacak vb..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleGenerateAiWebsite(selectedBusiness.id)}
                  disabled={generatingSiteId !== null}
                  className="mr-auto px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-850 disabled:to-slate-850 disabled:text-slate-500 text-slate-950 disabled:cursor-not-allowed text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  {generatingSiteId === selectedBusiness.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Globe size={12} />
                  )}
                  <span>Yapay Zeka Sitesi Üret</span>
                </button>
                <button
                  type="button"
                  onClick={closeCrmModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  {modalLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
