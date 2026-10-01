export interface MockPlace {
  id: string;
  name: string;
  primaryType: string;
  types: string[];
  formattedAddress: string;
  latitude: number;
  longitude: number;
  rating: number;
  userRatingCount: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri: string;
  businessStatus: string;
  isOpen: boolean;
}

/**
 * Sample places for demo mode (no API key). Phone numbers (0312/0212/0216 000 00 xx)
 * and social media handles are fictional; the chain brand entries are kept so the
 * "exclude chains" filter has something to hide.
 */
export const mockPlaces: MockPlace[] = [
  // ANKARA (Center: 39.9334, 32.8597)
  {
    id: "demo_place_1",
    name: "Kızılay Pide ve Lahmacun Sarayı",
    primaryType: "restaurant",
    types: ["restaurant", "food", "point_of_interest", "establishment"],
    formattedAddress: "Kızılay, Atatürk Blv. No:122, 06420 Çankaya/Ankara",
    latitude: 39.9208,
    longitude: 32.8541,
    rating: 4.2,
    userRatingCount: 340,
    websiteUri: "", // No website
    nationalPhoneNumber: "0312 000 00 01",
    internationalPhoneNumber: "+90 312 000 00 01",
    googleMapsUri: "https://maps.google.com/?cid=1",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_2",
    name: "Tunalı Butik & Terzi Erol",
    primaryType: "clothing_store",
    types: ["clothing_store", "store", "point_of_interest", "establishment"],
    formattedAddress: "Tunalı Hilmi Cd. No:85, 06680 Çankaya/Ankara",
    latitude: 39.9075,
    longitude: 32.8612,
    rating: 4.8,
    userRatingCount: 42,
    websiteUri: "https://instagram.com/ornek-butik-demo", // Social media only
    nationalPhoneNumber: "0312 000 00 02",
    internationalPhoneNumber: "+90 312 000 00 02",
    googleMapsUri: "https://maps.google.com/?cid=2",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_3",
    name: "Bahçeli Coffee Lab",
    primaryType: "cafe",
    types: ["cafe", "coffee_shop", "food", "point_of_interest", "establishment"],
    formattedAddress: "Bahçelievler, 7. Cd. No:32, 06490 Çankaya/Ankara",
    latitude: 39.9238,
    longitude: 32.8224,
    rating: 4.5,
    userRatingCount: 1250,
    websiteUri: "https://ornek-coffee-lab.example", // Has website
    nationalPhoneNumber: "0312 000 00 03",
    internationalPhoneNumber: "+90 312 000 00 03",
    googleMapsUri: "https://maps.google.com/?cid=3",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_4",
    name: "Starbucks Kızılay",
    primaryType: "cafe",
    types: ["cafe", "coffee_shop", "food", "point_of_interest", "establishment"],
    formattedAddress: "Kızılay, Ziya Gökalp Cd. No:11, 06420 Çankaya/Ankara",
    latitude: 39.9215,
    longitude: 32.8562,
    rating: 4.0,
    userRatingCount: 5200,
    websiteUri: "https://starbucks.com.tr", // Has website, and is a chain brand
    nationalPhoneNumber: "0312 000 00 04",
    internationalPhoneNumber: "+90 312 000 00 04",
    googleMapsUri: "https://maps.google.com/?cid=4",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_5",
    name: "Yıldız Kuaför & Güzellik Salonu",
    primaryType: "beauty_salon",
    types: ["beauty_salon", "hair_salon", "point_of_interest", "establishment"],
    formattedAddress: "Yıldız, Turan Güneş Blv. No:45, 06550 Çankaya/Ankara",
    latitude: 39.8785,
    longitude: 32.8712,
    rating: 4.6,
    userRatingCount: 88,
    websiteUri: "https://facebook.com/ornek-kuafor-demo", // Social media only
    nationalPhoneNumber: "0312 000 00 05",
    internationalPhoneNumber: "+90 312 000 00 05",
    googleMapsUri: "https://maps.google.com/?cid=5",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_6",
    name: "Ankara Ayakkabı Dünyası Şubesi",
    primaryType: "shoe_store",
    types: ["shoe_store", "store", "point_of_interest", "establishment"],
    formattedAddress: "Atatürk Bulvarı No:140, Kızılay, Ankara",
    latitude: 39.9192,
    longitude: 32.8532,
    rating: 3.9,
    userRatingCount: 154,
    websiteUri: "https://www.ayakkabidunyasi.com.tr", // Has website
    nationalPhoneNumber: "0312 000 00 06",
    internationalPhoneNumber: "+90 312 000 00 06",
    googleMapsUri: "https://maps.google.com/?cid=6",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_7",
    name: "Meşhur Karadeniz Fırını",
    primaryType: "bakery",
    types: ["bakery", "food", "point_of_interest", "establishment"],
    formattedAddress: "Ayrancı, Dikmen Cd. No:50, 06540 Çankaya/Ankara",
    latitude: 39.9015,
    longitude: 32.8465,
    rating: 4.7,
    userRatingCount: 220,
    websiteUri: undefined, // No website (undefined)
    nationalPhoneNumber: "0312 000 00 07",
    internationalPhoneNumber: "+90 312 000 00 07",
    googleMapsUri: "https://maps.google.com/?cid=7",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_8",
    name: "Defacto Kızılay Mağazası",
    primaryType: "clothing_store",
    types: ["clothing_store", "store", "point_of_interest", "establishment"],
    formattedAddress: "Kızılay, İzmir Cd. No:8, Çankaya/Ankara",
    latitude: 39.9221,
    longitude: 32.8515,
    rating: 4.1,
    userRatingCount: 890,
    websiteUri: "https://defacto.com.tr", // Chain brand
    nationalPhoneNumber: "0312 000 00 08",
    internationalPhoneNumber: "+90 312 000 00 08",
    googleMapsUri: "https://maps.google.com/?cid=8",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_9",
    name: "Umut Nail & Spa",
    primaryType: "nail_salon",
    types: ["nail_salon", "beauty_salon", "point_of_interest", "establishment"],
    formattedAddress: "Gaziosmanpaşa, Filistin Cd. No:19, Çankaya/Ankara",
    latitude: 39.8992,
    longitude: 32.8695,
    rating: 4.9,
    userRatingCount: 35,
    websiteUri: "", // No website
    nationalPhoneNumber: undefined, // No phone number
    internationalPhoneNumber: undefined,
    googleMapsUri: "https://maps.google.com/?cid=9",
    businessStatus: "OPERATIONAL",
    isOpen: false
  },
  {
    id: "demo_place_10",
    name: "Domino’s Pizza Bahçelievler",
    primaryType: "fast_food_restaurant",
    types: ["restaurant", "fast_food_restaurant", "food", "point_of_interest", "establishment"],
    formattedAddress: "Bahçelievler, 3. Cd. No:5, Çankaya/Ankara",
    latitude: 39.9268,
    longitude: 32.8315,
    rating: 3.8,
    userRatingCount: 650,
    websiteUri: "https://dominos.com.tr", // Chain brand
    nationalPhoneNumber: "0312 000 00 10",
    internationalPhoneNumber: "+90 312 000 00 10",
    googleMapsUri: "https://maps.google.com/?cid=10",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },

  // ISTANBUL (Center: 41.0082, 28.9784)
  {
    id: "demo_place_11",
    name: "Karaköy Balık Evi",
    primaryType: "restaurant",
    types: ["restaurant", "food", "point_of_interest", "establishment"],
    formattedAddress: "Kemankeş Karamustafa Paşa, Rıhtım Cd. No:11, Karaköy/İstanbul",
    latitude: 41.0225,
    longitude: 28.9758,
    rating: 4.4,
    userRatingCount: 980,
    websiteUri: "", // No website
    nationalPhoneNumber: "0212 000 00 11",
    internationalPhoneNumber: "+90 212 000 00 11",
    googleMapsUri: "https://maps.google.com/?cid=11",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_12",
    name: "Moda Çay Bahçesi",
    primaryType: "cafe",
    types: ["cafe", "food", "point_of_interest", "establishment"],
    formattedAddress: "Caferağa, Şair Nefi Sk. No:24, Moda/Kadıköy/İstanbul",
    latitude: 40.9785,
    longitude: 29.0245,
    rating: 4.6,
    userRatingCount: 4300,
    websiteUri: "https://instagram.com/ornek-cay-bahcesi-demo", // Social media only
    nationalPhoneNumber: undefined,
    googleMapsUri: "https://maps.google.com/?cid=12",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_13",
    name: "Nişantaşı Butik Gelinlik",
    primaryType: "store",
    types: ["store", "clothing_store", "point_of_interest", "establishment"],
    formattedAddress: "Halaskargazi Cd. No:112, Şişli/İstanbul",
    latitude: 41.0535,
    longitude: 28.9892,
    rating: 4.7,
    userRatingCount: 29,
    websiteUri: "https://ornek-gelinlik.example", // Has website
    nationalPhoneNumber: "0212 000 00 13",
    internationalPhoneNumber: "+90 212 000 00 13",
    googleMapsUri: "https://maps.google.com/?cid=13",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_14",
    name: "Kadıköy Antika & Gümüş",
    primaryType: "jewelry_store",
    types: ["jewelry_store", "store", "point_of_interest", "establishment"],
    formattedAddress: "Caferağa, Mühürdar Cd. No:45, Kadıköy/İstanbul",
    latitude: 40.9882,
    longitude: 29.0231,
    rating: 4.3,
    userRatingCount: 18,
    websiteUri: "", // No website
    nationalPhoneNumber: "0216 000 00 14",
    internationalPhoneNumber: "+90 216 000 00 14",
    googleMapsUri: "https://maps.google.com/?cid=14",
    businessStatus: "OPERATIONAL",
    isOpen: true
  },
  {
    id: "demo_place_15",
    name: "McDonald's Beşiktaş",
    primaryType: "fast_food_restaurant",
    types: ["restaurant", "fast_food_restaurant", "food", "point_of_interest", "establishment"],
    formattedAddress: "Sinanpaşa, Barbaros Blv. No:5, Beşiktaş/İstanbul",
    latitude: 41.0425,
    longitude: 29.0068,
    rating: 3.7,
    userRatingCount: 3100,
    websiteUri: "https://mcdonalds.com.tr", // Chain brand
    nationalPhoneNumber: "0212 000 00 15",
    internationalPhoneNumber: "+90 212 000 00 15",
    googleMapsUri: "https://maps.google.com/?cid=15",
    businessStatus: "OPERATIONAL",
    isOpen: true
  }
];
