import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { translateCategory } from './Dashboard';
import { MapPin, Phone, Star, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

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
  distance: number;
}

interface MapViewProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  userLocation: { lat: number; lng: number } | null;
}

// Leaflet icon configs (Vite safe paths)
import markerIconRed from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const businessIcon = L.icon({
  iconUrl: markerIconRed,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create custom canvas/SVG icon for User's Location (pulsing dot)
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="relative flex items-center justify-center h-8 w-8">
    <div class="absolute h-6 w-6 rounded-full bg-cyan-500 opacity-30 animate-ping"></div>
    <div class="h-3 w-3 rounded-full bg-cyan-400 border-2 border-slate-950"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function MapView({ showToast, userLocation }: MapViewProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Default coordinate center if user location not set
  const centerLat = userLocation?.lat || 39.9334;
  const centerLng = userLocation?.lng || 32.8597;

  const fetchMapBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Fetch only potential clients (no website / social media only)
      params.append('status', 'all_website_less');
      
      if (userLocation) {
        params.append('lat', String(userLocation.lat));
        params.append('lng', String(userLocation.lng));
      }

      const response = await fetch(`/api/businesses?${params.toString()}`);
      if (!response.ok) throw new Error('Harita verileri yüklenemedi.');
      const data = await response.json();
      setBusinesses(data);
    } catch (e: any) {
      showToast(e.message || 'Hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapBusinesses();
  }, [userLocation]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Harita Görünümü</h2>
          <p className="text-sm text-slate-400">Web sitesi olmayan potansiyel müşterilerinizi coğrafi olarak keşfedin.</p>
        </div>
        
        <button
          onClick={fetchMapBusinesses}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={16} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Map Element Container */}
      <div className="flex-1 min-h-[500px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative shadow-xl">
        {loading ? (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm space-y-3">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            <span className="text-sm text-slate-350">Harita yükleniyor...</span>
          </div>
        ) : null}

        <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Location Marker (Pulse Icon) */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
              <Popup>
                <div className="text-xs space-y-1">
                  <span className="font-bold text-cyan-400">Sizin Konumunuz</span>
                  <p className="text-[10px] text-slate-400">Tarama merkez noktası</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Businesses Pins */}
          {businesses.map((b) => {
            const phone = b.nationalPhoneNumber || b.internationalPhoneNumber;
            const distanceText = b.distance < 1000 ? `${Math.round(b.distance)} m` : `${(b.distance / 1000).toFixed(1)} km`;

            return (
              <Marker key={b.id} position={[b.latitude, b.longitude]} icon={businessIcon}>
                <Popup>
                  <div className="p-1 space-y-3 text-xs w-[220px]">
                    {/* Header */}
                    <div>
                      <h4 className="font-bold text-white leading-tight">{b.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">{translateCategory(b.primaryType)}</span>
                    </div>

                    {/* Specs */}
                    <div className="space-y-1.5 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-cyan-400 shrink-0" />
                        <span className="truncate" title={b.formattedAddress}>{b.formattedAddress}</span>
                      </div>
                      
                      {phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-cyan-400 shrink-0" />
                          <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-cyan-400 hover:underline">
                            {phone}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700/50">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star size={11} fill="currentColor" />
                          <span>{b.rating || '0'} ({b.userRatingCount || '0'})</span>
                        </div>
                        <span className="text-slate-400 font-semibold">{distanceText}</span>
                      </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="flex gap-2 pt-1">
                      {b.googleMapsUri && (
                        <a
                          href={b.googleMapsUri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-semibold transition-colors"
                        >
                          <ExternalLink size={10} />
                          <span>Haritalarda Aç</span>
                        </a>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
