// ── OpenStreetMap Services (Nominatim, Photon, Mobile Device Geolocation) ──────────────
import * as Location from 'expo-location';

export interface ReverseGeocodeResult {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  countryCode: string;
  fullAddress: string;
  coordinates: { lat: number; lng: number };
}

export interface PhotonSuggestion {
  id: string;
  name: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  fullAddress: string;
  coordinates: { lat: number; lng: number };
}

/**
 * Fetch current user coordinates via expo-location native GPS
 */
export async function getCurrentCoordinates(): Promise<{ lat: number; lng: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied. Please allow location access in your device settings.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
}

/**
 * Reverse Geocode latitude and longitude into address fields using OpenStreetMap Nominatim API
 */
export async function reverseGeocodeNominatim(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RevoShelfMobile/1.0',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.address) return null;

    const a = data.address;
    const houseNum = a.house_number || '';
    const road = a.road || a.pedestrian || a.suburb || a.neighbourhood || '';
    const addressLine =
      [houseNum, road].filter(Boolean).join(', ') ||
      data.name ||
      data.display_name?.split(',')[0] ||
      '';

    const city = a.city || a.town || a.village || a.municipality || a.county || '';
    const state = a.state || a.region || a.state_district || '';
    const pincode = a.postcode || '';
    const country = a.country || '';
    const countryCode = (a.country_code || '').toUpperCase();
    const fullAddress =
      data.display_name || [addressLine, city, state, country].filter(Boolean).join(', ');

    return {
      addressLine,
      city,
      state,
      pincode,
      country,
      countryCode,
      fullAddress,
      coordinates: { lat, lng },
    };
  } catch (err) {
    console.error('[OSM Reverse Geocode Error]', err);
    return null;
  }
}

/**
 * Search locations with Photon (OpenStreetMap geocoding API by Komoot)
 */
export async function searchPhoton(
  query: string,
  limit: number = 6
): Promise<PhotonSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=${limit}&lang=en`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data || !Array.isArray(data.features)) return [];

    return data.features.map((feature: any, idx: number) => {
      const p = feature.properties || {};
      const coords = feature.geometry?.coordinates || [0, 0]; // [lng, lat]
      const lng = coords[0];
      const lat = coords[1];

      const parts = [
        p.name,
        p.street ? `${p.housenumber || ''} ${p.street}`.trim() : null,
        p.city || p.town || p.district,
        p.state,
        p.country,
      ].filter(Boolean);

      // Remove duplicate consecutive entries
      const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index);
      const fullAddress = uniqueParts.join(', ') || p.name || 'Selected Location';

      return {
        id: `${p.osm_id || idx}-${lat}-${lng}`,
        name: p.name || p.street || 'Selected Location',
        street: p.street ? `${p.housenumber || ''} ${p.street}`.trim() : undefined,
        city: p.city || p.town || p.district || undefined,
        state: p.state || undefined,
        country: p.country || undefined,
        postcode: p.postcode || undefined,
        fullAddress,
        coordinates: { lat, lng },
      };
    });
  } catch (err) {
    console.error('[Photon Autocomplete Error]', err);
    return [];
  }
}
