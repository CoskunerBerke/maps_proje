import React, { useState, useEffect } from 'react';
import { TabType } from '../App';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Radar, Navigation, Map, ShieldAlert, CheckCircle2, Loader2, Info } from 'lucide-react';
// Fix Leaflet marker icon path issues in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface NewScanProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  userLocation: { lat: number; lng: number } | null;
  onSetLocation: (lat: number, lng: number) => void;
  setActiveTab: (tab: TabType) => void;
}

const CATEGORY_GROUPS = {
  yemeIcme: {
    label: 'Yeme ve İçme',
    categories: [
      { key: 'restaurant', label: 'Restoran' },
      { key: 'cafe', label: 'Kafe' },
      { key: 'coffee_shop', label: 'Kahve Dükkanı' },
      { key: 'bakery', label: 'Pastane / Fırın' },
      { key: 'meal_takeaway', label: 'Paket Servis' },
      { key: 'fast_food_restaurant', label: 'Fast Food' },
      { key: 'dessert_shop', label: 'Tatlıcı' },
      { key: 'ice_cream_shop', label: 'Dondurmacı' },
    ],
  },
  giyimPerakende: {
    label: 'Giyim ve Perakende',
    categories: [
      { key: 'clothing_store', label: 'Giyim Mağazası' },
      { key: 'shoe_store', label: 'Ayakkabıcı' },
      { key: 'jewelry_store', label: 'Kuyumcu' },
      { key: 'shopping_mall', label: 'AVM' },
      { key: 'store', label: 'Genel Mağaza' },
    ],
  },
  kisiselBakim: {
    label: 'Kişisel Bakım',
    categories: [
      { key: 'hair_salon', label: 'Kuaför' },
      { key: 'barber_shop', label: 'Berber' },
      { key: 'beauty_salon', label: 'Güzellik Salonu' },
      { key: 'spa', label: 'Spa' },
      { key: 'nail_salon', label: 'Tırnak Salonu' },
    ],
  },
};

export default function NewScan({ showToast, userLocation, onSetLocation, setActiveTab }: NewScanProps) {
  // Coordinates Form State
  const [lat, setLat] = useState<string>(userLocation?.lat ? String(userLocation.lat) : '39.9334');
  const [lng, setLng] = useState<string>(userLocation?.lng ? String(userLocation.lng) : '32.8597');
  
  // Manual address info when geolocation is denied
  const [manualCity, setManualCity] = useState('');
  const [manualDistrict, setManualDistrict] = useState('');
  const [geoError, setGeoError] = useState<string | null>(null);

  // Search parameters
  const [radius, setRadius] = useState<number>(3000); // 3km in meters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'restaurant', 'cafe', 'clothing_store', 'hair_salon', 'beauty_salon'
  ]);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [minReviews, setMinReviews] = useState<number>(0);
  const [excludeChains, setExcludeChains] = useState(true);

  // Interactive map picker state
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0); // 0: idle, 1: scanning places, 2: checking details, 3: filtering, 4: complete

  // Update input fields if global coordinate location changes
  useEffect(() => {
    if (userLocation) {
      setLat(String(userLocation.lat));
      setLng(String(userLocation.lng));
    }
  }, [userLocation]);

  // Request browser location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('Tarayıcınız konum servisini desteklemiyor.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        onSetLocation(latitude, longitude);
        setLat(String(latitude));
        setLng(String(longitude));
        setGeoError(null);
        showToast('Konumunuz başarıyla alındı.', 'success');
      },
      (error) => {
        console.error(error);
        let errorMsg = 'Konum alınamadı.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Konum izni reddedildi. Lütfen bilgileri manuel girin.';
        }
        setGeoError(errorMsg);
        showToast(errorMsg, 'error');
      }
    );
  };

  const handleToggleCategory = (categoryKey: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((k) => k !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const handleSelectGroup = (groupKey: keyof typeof CATEGORY_GROUPS, select: boolean) => {
    const keys = CATEGORY_GROUPS[groupKey].categories.map((c) => c.key);
    if (select) {
      setSelectedCategories((prev) => Array.from(new Set([...prev, ...keys])));
    } else {
      setSelectedCategories((prev) => prev.filter((k) => !keys.includes(k)));
    }
  };

  // Map Click Handler Component
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setLat(String(e.latlng.lat));
        setLng(String(e.latlng.lng));
        onSetLocation(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  // Handle Search Execution
  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      showToast('Geçerli koordinat değerleri girin.', 'error');
      return;
    }

    if (selectedCategories.length === 0) {
      showToast('Lütfen en az bir kategori seçin.', 'error');
      return;
    }

    // Set map center global coordinates
    onSetLocation(latitude, longitude);

    setScanning(true);
    setScanStep(1); // Yakındaki işletmeler taranıyor

    // We simulate step progress to show the stages beautifully
    const stepInterval = setTimeout(() => {
      setScanStep(2); // İşletme bilgileri kontrol ediliyor
    }, 2000);

    const stepInterval2 = setTimeout(() => {
      setScanStep(3); // Web sitesi olmayan işletmeler belirleniyor
    }, 4500);

    try {
      const response = await fetch('/api/places/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          radius,
          categories: selectedCategories,
          onlyOpen,
          onlyWithPhone,
          minimumRating: minRating,
          minimumReviewCount: minReviews,
          excludeChains,
        }),
      });

      clearTimeout(stepInterval);
      clearTimeout(stepInterval2);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Arama sırasında hata oluştu.');
      }

      const data = await response.json();
      setScanStep(4); // completed

      showToast(`${data.results.length} işletme başarıyla listelendi.`, 'success');
      
      setTimeout(() => {
        setScanning(false);
        setScanStep(0);
        setActiveTab('businesses'); // Redirect to results table
      }, 1000);

    } catch (error: any) {
      clearTimeout(stepInterval);
      clearTimeout(stepInterval2);
      setScanning(false);
      setScanStep(0);
      showToast(error.message || 'Tarama başarısız oldu.', 'error');
    }
  };

  const parsedLat = parseFloat(lat) || 39.9334;
  const parsedLng = parseFloat(lng) || 32.8597;

  // Estimate number of API requests based on selected categories (1 request per category)
  const estimatedRequests = selectedCategories.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Yeni Bölge Tarama</h2>
        <p className="text-sm text-slate-400">Tarama yapmak istediğiniz koordinatları ve filtreleri belirleyerek aramayı başlatın.</p>
      </div>

      {scanning ? (
        /* PROGRESS VIEW DURING SCANNING */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05),transparent)] pointer-events-none" />
          <Loader2 className="h-16 w-16 text-cyan-400 animate-spin" />
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Tarama İşlemi Başlatıldı</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Google Places veritabanı taranıyor. Lütfen tarayıcıyı kapatmayın ve bekleyin.
            </p>
          </div>

          {/* Stepper Display */}
          <div className="w-full max-w-md bg-slate-950/80 border border-slate-850 rounded-xl p-6 text-left space-y-4">
            <ScanStepItem
              number={1}
              label="Yakındaki işletmeler taranıyor..."
              status={scanStep === 1 ? 'running' : scanStep > 1 ? 'done' : 'waiting'}
            />
            <ScanStepItem
              number={2}
              label="İşletme bilgileri kontrol ediliyor..."
              status={scanStep === 2 ? 'running' : scanStep > 2 ? 'done' : 'waiting'}
            />
            <ScanStepItem
              number={3}
              label="Web sitesi olmayan işletmeler belirleniyor..."
              status={scanStep === 3 ? 'running' : scanStep > 3 ? 'done' : 'waiting'}
            />
          </div>
        </div>
      ) : (
        /* SCANNING PARAMETERS FORM */
        <form onSubmit={handleStartScan} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location & Coordinates Input */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Navigation size={18} className="text-cyan-400" />
                <span>Konum ve Koordinatlar</span>
              </h3>

              {/* Geolocation Button */}
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/10 cursor-pointer"
              >
                <Navigation size={16} />
                <span>Konumumu Kullan</span>
              </button>

              {geoError && (
                <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-lg flex gap-2 text-xs text-red-400">
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{geoError} Şehir ve İlçe kısımlarını manuel girin.</span>
                </div>
              )}

              {/* Coordinate Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Enlem (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    required
                    placeholder="39.9334"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Boylam (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    required
                    placeholder="32.8597"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all"
                  />
                </div>
              </div>

              {/* Manual Entry Fields (Shown when error or voluntarily) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Şehir (Opsiyonel)</label>
                  <input
                    type="text"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    placeholder="Ankara"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">İlçe (Opsiyonel)</label>
                  <input
                    type="text"
                    value={manualDistrict}
                    onChange={(e) => setManualDistrict(e.target.value)}
                    placeholder="Çankaya"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all"
                  />
                </div>
              </div>

              {/* Map Toggle Button */}
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <Map size={14} />
                <span>{showMapPicker ? 'Haritayı Gizle' : 'Haritadan Konum Seç'}</span>
              </button>
            </div>

            {/* Radius & Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Radar size={18} className="text-cyan-400" />
                <span>Tarama Filtreleri</span>
              </h3>

              {/* Radius Select */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Arama Yarıçapı</label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all"
                >
                  <option value={500}>500 Metre</option>
                  <option value={1000}>1 Kilometre</option>
                  <option value={2000}>2 Kilometre</option>
                  <option value={3000}>3 Kilometre (Varsayılan)</option>
                  <option value={5000}>5 Kilometre</option>
                  <option value={10000}>10 Kilometre</option>
                </select>
              </div>

              {/* Score and Reviews Count */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">En Az Puan (1-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value) || 0)}
                    placeholder="3.5"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">En Az Yorum Sayısı</label>
                  <input
                    type="number"
                    min="0"
                    value={minReviews}
                    onChange={(e) => setMinReviews(parseInt(e.target.value) || 0)}
                    placeholder="10"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all"
                  />
                </div>
              </div>

              {/* Boolean Switches */}
              <div className="space-y-3 pt-2">
                <SwitchLabel
                  label="Yalnızca açık işletmeleri göster"
                  checked={onlyOpen}
                  onChange={setOnlyOpen}
                />
                <SwitchLabel
                  label="Telefon numarası olanları göster"
                  checked={onlyWithPhone}
                  onChange={setOnlyWithPhone}
                />
                <SwitchLabel
                  label="Zincir işletmeleri hariç tut"
                  checked={excludeChains}
                  onChange={setExcludeChains}
                />
              </div>
            </div>
          </div>

          {/* Interactive Map Picker Block */}
          {showMapPicker && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 h-[350px]">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info size={14} className="text-cyan-400" />
                <span>Haritada tıklayarak kırmızı işaretçiyi tarama merkezine getirebilirsiniz.</span>
              </div>
              <div className="h-[280px] rounded-lg overflow-hidden border border-slate-800">
                <MapContainer center={[parsedLat, parsedLng]} zoom={13} style={{ height: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[parsedLat, parsedLng]} />
                  <MapClickHandler />
                </MapContainer>
              </div>
            </div>
          )}

          {/* Category Select Block */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-800 pb-3">
              <h3 className="font-semibold text-white">Çoklu Kategori Seçimi</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allKeys = Object.values(CATEGORY_GROUPS).flatMap(g => g.categories.map(c => c.key));
                    setSelectedCategories(allKeys);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Tümünü Seç
                </button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategories([])}
                  className="text-xs text-slate-400 hover:text-slate-300 font-medium"
                >
                  Temizle
                </button>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(CATEGORY_GROUPS).map(([key, group]) => {
                const groupKey = key as keyof typeof CATEGORY_GROUPS;
                const groupKeys = group.categories.map((c) => c.key);
                const allSelected = groupKeys.every((k) => selectedCategories.includes(k));

                return (
                  <div key={key} className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                        {group.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectGroup(groupKey, !allSelected)}
                        className="text-[10px] text-cyan-500 hover:text-cyan-400 font-medium"
                      >
                        {allSelected ? 'Grubu Kaldır' : 'Grubu Seç'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {group.categories.map((c) => {
                        const active = selectedCategories.includes(c.key);
                        return (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => handleToggleCategory(c.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              active
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                : 'bg-slate-900 text-slate-400 border border-slate-850 hover:bg-slate-800/80 hover:text-slate-300'
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing warning / API request count estimation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-cyan-500/20 rounded-xl p-5 shadow-md">
            <div className="flex gap-3">
              <Info className="text-cyan-400 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <span className="text-sm font-semibold text-white">API Güvenliği & Maliyet Bilgisi</span>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  Google Places API (New) aramalarında her seçtiğiniz kategori için 1 adet Nearby Search isteği gönderilecektir. Tarama başlamadan önce limitlerinizi kontrol etmeniz önerilir.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-start sm:items-end text-xs space-y-1 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 w-full sm:w-auto">
              <span className="text-slate-400 font-medium">Seçilen Kategori: <strong className="text-white">{selectedCategories.length}</strong></span>
              <span className="text-slate-400 font-medium">Tahmini Google API İsteği: <strong className="text-cyan-400">{estimatedRequests}</strong></span>
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-slate-950 font-extrabold text-base rounded-2xl transition-all shadow-xl shadow-cyan-500/10 cursor-pointer"
          >
            Taramayı Başlat
          </button>
        </form>
      )}
    </div>
  );
}

interface SwitchLabelProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchLabel({ label, checked, onChange }: SwitchLabelProps) {
  return (
    <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-850 hover:bg-slate-950/80 cursor-pointer transition-colors">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="relative w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 peer-checked:after:bg-slate-950 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-400" />
    </label>
  );
}

interface ScanStepItemProps {
  number: number;
  label: string;
  status: 'waiting' | 'running' | 'done';
}

function ScanStepItem({ number, label, status }: ScanStepItemProps) {
  return (
    <div className="flex items-center gap-3">
      {status === 'done' ? (
        <CheckCircle2 className="text-cyan-400 shrink-0" size={18} />
      ) : status === 'running' ? (
        <Loader2 className="text-cyan-400 animate-spin shrink-0" size={18} />
      ) : (
        <div className="w-[18px] h-[18px] rounded-full border border-slate-700 text-[10px] flex items-center justify-center text-slate-500 font-semibold shrink-0">
          {number}
        </div>
      )}
      <span
        className={`text-xs font-medium transition-colors ${
          status === 'waiting'
            ? 'text-slate-600'
            : status === 'running'
            ? 'text-cyan-400 animate-pulse'
            : 'text-slate-350'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
