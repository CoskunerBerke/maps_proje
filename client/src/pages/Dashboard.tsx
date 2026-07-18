import React, { useState, useEffect } from 'react';
import { TabType } from '../App';
import { Eye, Globe2, MessageSquareCode, Phone, CheckSquare, HeartHandshake, Award, RefreshCw, BarChart2 } from 'lucide-react';

interface Stats {
  totalFound: number;
  noWebsiteCount: number;
  socialMediaOnlyCount: number;
  hasWebsiteCount: number;
  phoneCount: number;
  calledCount: number;
  interestedCount: number;
  convertedCount: number;
  categoryDistribution: { category: string; count: number }[];
}

interface DashboardProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  setActiveTab: (tab: TabType) => void;
}

export default function Dashboard({ showToast, setActiveTab }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/statistics');
      if (!response.ok) {
        throw new Error('İstatistikler yüklenirken bir hata oluştu.');
      }
      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      showToast(error.message || 'Veri çekilemedi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-800 rounded"></div>
          <div className="h-10 w-24 bg-slate-800 rounded"></div>
        </div>
        
        {/* Stats skeleton grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-xl"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-900 border border-slate-800 rounded-xl"></div>
          <div className="h-96 bg-slate-900 border border-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const potentialClientsCount = (stats?.noWebsiteCount || 0) + (stats?.socialMediaOnlyCount || 0);
  const potentialPercent = stats?.totalFound
    ? Math.round((potentialClientsCount / stats.totalFound) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Genel Durum Paneli</h2>
          <p className="text-sm text-slate-400">Potansiyel müşterilerinizi takip edin ve istatistiklerinizi analiz edin.</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={16} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Eye className="text-blue-400" size={24} />}
          title="Toplam İncelenen"
          value={stats?.totalFound || 0}
          desc="Tüm aramalarda taranan"
          bgColor="from-blue-500/10 to-blue-500/0"
          borderColor="border-blue-500/20"
        />
        <StatCard
          icon={<Globe2 className="text-red-400" size={24} />}
          title="Web Sitesi Olmayan"
          value={stats?.noWebsiteCount || 0}
          desc="Site adresi bulunmayanlar"
          bgColor="from-red-500/10 to-red-500/0"
          borderColor="border-red-500/20"
          highlight
        />
        <StatCard
          icon={<MessageSquareCode className="text-amber-400" size={24} />}
          title="Sadece Sosyal Medya"
          value={stats?.socialMediaOnlyCount || 0}
          desc="Instagram/Facebook olanlar"
          bgColor="from-amber-500/10 to-amber-500/0"
          borderColor="border-amber-500/20"
        />
        <StatCard
          icon={<Phone className="text-emerald-400" size={24} />}
          title="Telefon Numarası Var"
          value={stats?.phoneCount || 0}
          desc="Ulaşılabilecek numarası olan"
          bgColor="from-emerald-500/10 to-emerald-500/0"
          borderColor="border-emerald-500/20"
        />
        <StatCard
          icon={<CheckSquare className="text-purple-400" size={24} />}
          title="Aranan İşletmeler"
          value={stats?.calledCount || 0}
          desc="CRM araması yapılmış olan"
          bgColor="from-purple-500/10 to-purple-500/0"
          borderColor="border-purple-500/20"
        />
        <StatCard
          icon={<HeartHandshake className="text-cyan-400" size={24} />}
          title="İlgilenen Müşteriler"
          value={stats?.interestedCount || 0}
          desc="Arama sonucu olumlu olan"
          bgColor="from-cyan-500/10 to-cyan-500/0"
          borderColor="border-cyan-500/20"
        />
        <StatCard
          icon={<Award className="text-yellow-400" size={24} />}
          title="Kazanılan Müşteriler"
          value={stats?.convertedCount || 0}
          desc="Müşteriye dönüşen işletme"
          bgColor="from-yellow-500/10 to-yellow-500/0"
          borderColor="border-yellow-500/20"
        />
        
        {/* Conversion Rate Card */}
        <div className="flex flex-col justify-between p-6 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent pointer-events-none rounded-bl-full" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hedef Oranı</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-bold text-white">{potentialPercent}%</span>
          </div>
          <span className="text-xs text-cyan-400 mt-2">Web sitesiz işletme oranı</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category distribution bar chart - custom styling */}
        <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="text-cyan-400" size={20} />
            <h3 className="font-semibold text-white">Potansiyel Müşteri Sektör Dağılımı</h3>
          </div>

          {stats && stats.categoryDistribution.length > 0 ? (
            <div className="space-y-4">
              {stats.categoryDistribution.slice(0, 6).map((item, idx) => {
                // Calculate percentage based on total potential clients
                const percent = Math.round((item.count / potentialClientsCount) * 100) || 0;
                
                // Translate category key if possible
                const label = translateCategory(item.category);

                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                      <span>{label}</span>
                      <span className="text-slate-400">{item.count} İşletme ({percent}%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <span>Gösterilecek kategori verisi bulunmuyor.</span>
              <button
                onClick={() => setActiveTab('new-scan')}
                className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs"
              >
                Yeni Tarama Başlat
              </button>
            </div>
          )}
        </div>

        {/* Quick action card */}
        <div className="flex flex-col justify-between p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <div>
            <h3 className="font-semibold text-white mb-4">Hızlı İşlemler</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Bulunduğunuz konumdaki veya harita üzerinde seçeceğiniz herhangi bir bölgedeki işletmeleri hemen aramaya başlayın. Sonuçları dilediğiniz gibi filtreleyip Excel'e aktarabilirsiniz.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setActiveTab('new-scan')}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md hover:shadow-cyan-500/10 cursor-pointer"
            >
              Yeni Tarama Başlat
            </button>
            <button
              onClick={() => setActiveTab('businesses')}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              Bulunan İşletmeleri İncele
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Translate Google place categories to Turkish
export function translateCategory(type: string): string {
  const mapping: { [key: string]: string } = {
    restaurant: 'Restoran',
    cafe: 'Kafe',
    coffee_shop: 'Kahve Dükkanı',
    bakery: 'Pastane / Fırın',
    meal_takeaway: 'Paket Servis',
    fast_food_restaurant: 'Fast Food',
    dessert_shop: 'Tatlıcı',
    ice_cream_shop: 'Dondurmacı',
    clothing_store: 'Giyim Mağazası',
    shoe_store: 'Ayakkabıcı',
    jewelry_store: 'Kuyumcu',
    shopping_mall: 'AVM',
    store: 'Mağaza / Dükkan',
    hair_salon: 'Kuaför',
    barber_shop: 'Berber',
    beauty_salon: 'Güzellik Salonu',
    spa: 'Spa',
    nail_salon: 'Tırnak Salonu',
  };
  return mapping[type] || type;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  desc: string;
  bgColor: string;
  borderColor: string;
  highlight?: boolean;
}

function StatCard({ icon, title, value, desc, bgColor, borderColor, highlight = false }: StatCardProps) {
  return (
    <div
      className={`p-6 bg-slate-900 border ${borderColor} rounded-xl bg-gradient-to-b ${bgColor} transition-all hover:scale-[1.02] flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="p-1.5 rounded-lg bg-slate-800/80">{icon}</div>
      </div>
      <div className="mt-4">
        <span className={`text-3xl font-bold ${highlight ? 'text-cyan-400' : 'text-white'}`}>{value}</span>
        <p className="text-xs text-slate-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}
