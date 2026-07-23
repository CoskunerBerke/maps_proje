import { prisma } from '../db';
import { mockPlaces } from '../data/demoData';
import { calculateDistance } from '../utils/distance';
import { classifyWebsite } from '../utils/websiteClassifier';

export interface SearchParams {
  latitude: number;
  longitude: number;
  radius: number;
  categories: string[];
  onlyOpen: boolean;
  onlyWithPhone: boolean;
  minimumRating: number;
  minimumReviewCount: number;
  excludeChains: boolean;
}

export interface PlaceResult {
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
  distance: number;
}

/**
 * Places Service to handle Google Places API (New) searches and Demo Mode mock searches.
 */
export class PlacesService {
  /**
   * Performs search, applying filters and saves/updates businesses in the DB.
   */
  static async search(params: SearchParams, sessionId: string): Promise<PlaceResult[]> {
    const settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });
    const isDemo = settings?.isDemoMode || !process.env.GOOGLE_MAPS_API_KEY;

    let places: any[] = [];
    let requestCount = 0;

    if (isDemo) {
      // DEMO MODE: Search from mockPlaces
      places = this.searchMock(params);
      requestCount = 0;
    } else {
      // REAL GOOGLE PLACES API (NEW)
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
      const results = await this.searchGoogle(params, apiKey);
      places = results.places;
      requestCount = results.requestCount;
    }

    // Load excluded chain brands from DB
    const excludedBrands = await prisma.excludedBrand.findMany();
    const chainNames = excludedBrands.map(b => b.name.toLowerCase());

    const processedResults: PlaceResult[] = [];
    const dbUpserts: any[] = [];

    for (const place of places) {
      const distance = calculateDistance(
        params.latitude,
        params.longitude,
        place.latitude,
        place.longitude
      );

      // Web site classification
      const websiteStatus = classifyWebsite(place.websiteUri);

      // Chain check
      const placeNameLower = place.name.toLowerCase();
      const isChain = chainNames.some(brand => placeNameLower.includes(brand));

      if (params.excludeChains && isChain) {
        continue; // Skip chain
      }

      // Filter by open state
      if (params.onlyOpen && place.isOpen === false) {
        continue;
      }

      // Filter by phone
      const phone = place.nationalPhoneNumber || place.internationalPhoneNumber;
      if (params.onlyWithPhone && !phone) {
        continue;
      }

      // Filter by rating
      if (params.minimumRating > 0 && (place.rating || 0) < params.minimumRating) {
        continue;
      }

      // Filter by review count
      if (params.minimumReviewCount > 0 && (place.userRatingCount || 0) < params.minimumReviewCount) {
        continue;
      }

      const result: PlaceResult = {
        id: place.id,
        name: place.name,
        primaryType: place.primaryType || (place.types && place.types[0]) || 'store',
        types: place.types || [],
        formattedAddress: place.formattedAddress || '',
        latitude: place.latitude,
        longitude: place.longitude,
        rating: place.rating || null,
        userRatingCount: place.userRatingCount || null,
        websiteUri: place.websiteUri || null,
        websiteStatus,
        nationalPhoneNumber: place.nationalPhoneNumber || null,
        internationalPhoneNumber: place.internationalPhoneNumber || null,
        googleMapsUri: place.googleMapsUri || null,
        businessStatus: place.businessStatus || null,
        isOpen: place.isOpen === undefined ? null : place.isOpen,
        distance,
      };

      processedResults.push(result);

      // Queue Prisma Upsert
      dbUpserts.push(
        prisma.business.upsert({
          where: { id: place.id },
          create: {
            id: place.id,
            name: place.name,
            primaryType: result.primaryType,
            types: JSON.stringify(result.types),
            formattedAddress: result.formattedAddress,
            latitude: result.latitude,
            longitude: result.longitude,
            rating: result.rating,
            userRatingCount: result.userRatingCount,
            websiteUri: result.websiteUri,
            websiteStatus: result.websiteStatus,
            nationalPhoneNumber: result.nationalPhoneNumber,
            internationalPhoneNumber: result.internationalPhoneNumber,
            googleMapsUri: result.googleMapsUri,
            businessStatus: result.businessStatus,
            isOpen: result.isOpen,
            searchSessionId: sessionId,
            callingStatus: 'Henüz aranmadı',
            photos: place.photos ? JSON.stringify(place.photos) : null,
          },
          update: {
            name: place.name,
            primaryType: result.primaryType,
            types: JSON.stringify(result.types),
            formattedAddress: result.formattedAddress,
            latitude: result.latitude,
            longitude: result.longitude,
            rating: result.rating,
            userRatingCount: result.userRatingCount,
            websiteUri: result.websiteUri,
            websiteStatus: result.websiteStatus,
            nationalPhoneNumber: result.nationalPhoneNumber,
            internationalPhoneNumber: result.internationalPhoneNumber,
            googleMapsUri: result.googleMapsUri,
            businessStatus: result.businessStatus,
            isOpen: result.isOpen,
            lastSeenAt: new Date(),
            photos: place.photos ? JSON.stringify(place.photos) : null,
          },
        })
      );
    }

    // Execute DB transactions
    if (dbUpserts.length > 0) {
      await prisma.$transaction(dbUpserts);
    }

    // Update session status in DB
    const noWebsiteCount = processedResults.filter(
      r => r.websiteStatus === 'no_website' || r.websiteStatus === 'social_media_only'
    ).length;

    await prisma.searchSession.update({
      where: { id: sessionId },
      data: {
        totalFound: processedResults.length,
        noWebsiteCount,
        requestCount,
        status: 'SUCCESS',
      },
    });

    return processedResults;
  }

  /**
   * Search mock places in memory (for demo mode).
   */
  private static searchMock(params: SearchParams): any[] {
    const results: any[] = [];
    const categoriesSet = new Set(params.categories);

    for (const place of mockPlaces) {
      // Calculate distance to verify if it's within radius
      const dist = calculateDistance(
        params.latitude,
        params.longitude,
        place.latitude,
        place.longitude
      );

      if (dist > params.radius) {
        continue;
      }

      // Check categories match
      const matchesCategory = place.types.some(t => categoriesSet.has(t));
      if (!matchesCategory) {
        continue;
      }

      results.push(place);
    }

    return results;
  }

  /**
   * Calls Google Places API (New) searchNearby in parallel with controlled concurrency
   */
  private static async searchGoogle(
    params: SearchParams,
    apiKey: string
  ): Promise<{ places: any[]; requestCount: number }> {
    const uniquePlacesMap = new Map<string, any>();
    let requestCount = 0;

    // Google API: /v1/places:searchNearby
    const url = 'https://places.googleapis.com/v1/places:searchNearby';

    // We do requests for each category in parallel to get up to 20 results per category.
    // If the user chooses many categories, we process them in chunks.
    const chunks: string[][] = [];
    const chunkSize = 5; // run 5 requests concurrently at most
    for (let i = 0; i < params.categories.length; i += chunkSize) {
      chunks.push(params.categories.slice(i, i + chunkSize));
    }

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.primaryType',
      'places.types',
      'places.websiteUri',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.rating',
      'places.userRatingCount',
      'places.googleMapsUri',
      'places.businessStatus',
      'places.regularOpeningHours',
      'places.photos',
    ].join(',');

    for (const chunk of chunks) {
      const promises = chunk.map(async (category) => {
        const payload = {
          includedTypes: [category],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: params.latitude,
                longitude: params.longitude,
              },
              radius: params.radius,
            },
          },
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
          requestCount++;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': fieldMask,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Google API Hatası: ${response.status} - ${errText}`);
          }

          const data: any = await response.json();
          return data.places || [];
        } catch (err: any) {
          clearTimeout(timeoutId);
          console.error(`Error searching category ${category}:`, err.message);
          // If aborted/timeout, we will propagate the error or return empty array
          // Since it's allSettled, it's fine either way, but propagating lets us log it
          throw err;
        }
      });

      const chunkResults = await Promise.allSettled(promises);

      for (const res of chunkResults) {
        if (res.status === 'fulfilled') {
          const placesList = res.value;
          for (const rawPlace of placesList) {
            // Map Google Places format to internal flat format
            const p = {
              id: rawPlace.id,
              name: rawPlace.displayName?.text || 'İsimsiz İşletme',
              primaryType: rawPlace.primaryType,
              types: rawPlace.types || [],
              formattedAddress: rawPlace.formattedAddress || '',
              latitude: rawPlace.location?.latitude,
              longitude: rawPlace.location?.longitude,
              rating: rawPlace.rating,
              userRatingCount: rawPlace.userRatingCount,
              websiteUri: rawPlace.websiteUri,
              nationalPhoneNumber: rawPlace.nationalPhoneNumber,
              internationalPhoneNumber: rawPlace.internationalPhoneNumber,
              googleMapsUri: rawPlace.googleMapsUri,
              businessStatus: rawPlace.businessStatus,
              isOpen: rawPlace.regularOpeningHours?.openNow,
            };

            if (p.id && p.latitude && p.longitude) {
              uniquePlacesMap.set(p.id, p);
            }
          }
        } else {
          // If any request failed, propagate the first error to warn the user
          // about API key or quota issues.
          throw new Error(res.reason?.message || 'Google Places API isteği başarısız oldu.');
        }
      }
    }

    return {
      places: Array.from(uniquePlacesMap.values()),
      requestCount,
    };
  }
}
