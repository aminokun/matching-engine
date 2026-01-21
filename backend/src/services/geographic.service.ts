/**
 * Geographic Service
 * Provides distance-based proximity scoring between countries/cities
 * using the Haversine formula for accurate km calculations.
 */

interface CountryCoordinates {
  lat: number;
  lng: number;
  name: string; // Capital city name
}

interface ProximityScore {
  score: number;
  distanceKm: number;
  explanation: string;
}

// Country capital coordinates (lat, lng)
// Comprehensive list covering major regions
const COUNTRY_COORDS: Record<string, CountryCoordinates> = {
  // Western Europe
  'Netherlands': { lat: 52.3676, lng: 4.9041, name: 'Amsterdam' },
  'Germany': { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
  'Belgium': { lat: 50.8503, lng: 4.3517, name: 'Brussels' },
  'France': { lat: 48.8566, lng: 2.3522, name: 'Paris' },
  'Luxembourg': { lat: 49.6116, lng: 6.1319, name: 'Luxembourg' },
  'Austria': { lat: 48.2082, lng: 16.3738, name: 'Vienna' },
  'Switzerland': { lat: 46.9480, lng: 7.4474, name: 'Bern' },

  // Northern Europe
  'United Kingdom': { lat: 51.5074, lng: -0.1278, name: 'London' },
  'UK': { lat: 51.5074, lng: -0.1278, name: 'London' },
  'Ireland': { lat: 53.3498, lng: -6.2603, name: 'Dublin' },
  'Denmark': { lat: 55.6761, lng: 12.5683, name: 'Copenhagen' },
  'Sweden': { lat: 59.3293, lng: 18.0686, name: 'Stockholm' },
  'Norway': { lat: 59.9139, lng: 10.7522, name: 'Oslo' },
  'Finland': { lat: 60.1699, lng: 24.9384, name: 'Helsinki' },
  'Iceland': { lat: 64.1466, lng: -21.9426, name: 'Reykjavik' },

  // Southern Europe
  'Spain': { lat: 40.4168, lng: -3.7038, name: 'Madrid' },
  'Portugal': { lat: 38.7223, lng: -9.1393, name: 'Lisbon' },
  'Italy': { lat: 41.9028, lng: 12.4964, name: 'Rome' },
  'Greece': { lat: 37.9838, lng: 23.7275, name: 'Athens' },
  'Malta': { lat: 35.8989, lng: 14.5146, name: 'Valletta' },
  'Cyprus': { lat: 35.1856, lng: 33.3823, name: 'Nicosia' },

  // Eastern Europe
  'Poland': { lat: 52.2297, lng: 21.0122, name: 'Warsaw' },
  'Czech Republic': { lat: 50.0755, lng: 14.4378, name: 'Prague' },
  'Czechia': { lat: 50.0755, lng: 14.4378, name: 'Prague' },
  'Slovakia': { lat: 48.1486, lng: 17.1077, name: 'Bratislava' },
  'Hungary': { lat: 47.4979, lng: 19.0402, name: 'Budapest' },
  'Romania': { lat: 44.4268, lng: 26.1025, name: 'Bucharest' },
  'Bulgaria': { lat: 42.6977, lng: 23.3219, name: 'Sofia' },
  'Croatia': { lat: 45.8150, lng: 15.9819, name: 'Zagreb' },
  'Slovenia': { lat: 46.0569, lng: 14.5058, name: 'Ljubljana' },
  'Serbia': { lat: 44.7866, lng: 20.4489, name: 'Belgrade' },
  'Ukraine': { lat: 50.4501, lng: 30.5234, name: 'Kyiv' },

  // Baltic States
  'Estonia': { lat: 59.4370, lng: 24.7536, name: 'Tallinn' },
  'Latvia': { lat: 56.9496, lng: 24.1052, name: 'Riga' },
  'Lithuania': { lat: 54.6872, lng: 25.2797, name: 'Vilnius' },

  // Middle East / Turkey
  'Turkey': { lat: 39.9334, lng: 32.8597, name: 'Ankara' },
  'Turkiye': { lat: 39.9334, lng: 32.8597, name: 'Ankara' },
  'Israel': { lat: 31.7683, lng: 35.2137, name: 'Jerusalem' },
  'United Arab Emirates': { lat: 24.4539, lng: 54.3773, name: 'Abu Dhabi' },
  'UAE': { lat: 24.4539, lng: 54.3773, name: 'Abu Dhabi' },
  'Saudi Arabia': { lat: 24.7136, lng: 46.6753, name: 'Riyadh' },
  'Qatar': { lat: 25.2854, lng: 51.5310, name: 'Doha' },

  // North America
  'United States': { lat: 38.9072, lng: -77.0369, name: 'Washington DC' },
  'USA': { lat: 38.9072, lng: -77.0369, name: 'Washington DC' },
  'Canada': { lat: 45.4215, lng: -75.6972, name: 'Ottawa' },
  'Mexico': { lat: 19.4326, lng: -99.1332, name: 'Mexico City' },

  // South America
  'Brazil': { lat: -15.8267, lng: -47.9218, name: 'Brasília' },
  'Argentina': { lat: -34.6037, lng: -58.3816, name: 'Buenos Aires' },
  'Chile': { lat: -33.4489, lng: -70.6693, name: 'Santiago' },
  'Colombia': { lat: 4.7110, lng: -74.0721, name: 'Bogotá' },
  'Peru': { lat: -12.0464, lng: -77.0428, name: 'Lima' },

  // Asia
  'China': { lat: 39.9042, lng: 116.4074, name: 'Beijing' },
  'Japan': { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
  'South Korea': { lat: 37.5665, lng: 126.9780, name: 'Seoul' },
  'India': { lat: 28.6139, lng: 77.2090, name: 'New Delhi' },
  'Singapore': { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
  'Hong Kong': { lat: 22.3193, lng: 114.1694, name: 'Hong Kong' },
  'Taiwan': { lat: 25.0330, lng: 121.5654, name: 'Taipei' },
  'Thailand': { lat: 13.7563, lng: 100.5018, name: 'Bangkok' },
  'Vietnam': { lat: 21.0278, lng: 105.8342, name: 'Hanoi' },
  'Indonesia': { lat: -6.2088, lng: 106.8456, name: 'Jakarta' },
  'Malaysia': { lat: 3.1390, lng: 101.6869, name: 'Kuala Lumpur' },
  'Philippines': { lat: 14.5995, lng: 120.9842, name: 'Manila' },

  // Oceania
  'Australia': { lat: -35.2809, lng: 149.1300, name: 'Canberra' },
  'New Zealand': { lat: -41.2866, lng: 174.7756, name: 'Wellington' },

  // Africa
  'South Africa': { lat: -25.7479, lng: 28.2293, name: 'Pretoria' },
  'Egypt': { lat: 30.0444, lng: 31.2357, name: 'Cairo' },
  'Morocco': { lat: 33.9716, lng: -6.8498, name: 'Rabat' },
  'Nigeria': { lat: 9.0765, lng: 7.3986, name: 'Abuja' },
  'Kenya': { lat: -1.2921, lng: 36.8219, name: 'Nairobi' },

  // Russia
  'Russia': { lat: 55.7558, lng: 37.6173, name: 'Moscow' },
};

// Normalize country names for matching
const normalizeCountryName = (name: string): string => {
  if (!name) return '';

  const normalized = name.trim();

  // Common aliases
  const aliases: Record<string, string> = {
    'the netherlands': 'Netherlands',
    'holland': 'Netherlands',
    'uk': 'United Kingdom',
    'great britain': 'United Kingdom',
    'england': 'United Kingdom',
    'usa': 'United States',
    'america': 'United States',
    'uae': 'United Arab Emirates',
    'turkiye': 'Turkey',
    'türkiye': 'Turkey',
    'czechia': 'Czech Republic',
    'korea': 'South Korea',
    'republic of korea': 'South Korea',
  };

  const lowerName = normalized.toLowerCase();
  if (aliases[lowerName]) {
    return aliases[lowerName];
  }

  // Title case the name
  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

class GeographicService {
  private readonly MAX_DISTANCE_KM = 5000; // Distance at which score = 0%

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  calculateDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km

    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get coordinates for a country
   * Returns null if country not found
   */
  getCountryCoordinates(country: string): CountryCoordinates | null {
    const normalized = normalizeCountryName(country);

    // Try exact match first
    if (COUNTRY_COORDS[normalized]) {
      return COUNTRY_COORDS[normalized];
    }

    // Try case-insensitive search
    const lowerCountry = normalized.toLowerCase();
    for (const [key, coords] of Object.entries(COUNTRY_COORDS)) {
      if (key.toLowerCase() === lowerCountry) {
        return coords;
      }
    }

    return null;
  }

  /**
   * Calculate proximity score between two countries
   * Score ranges from 0-100, with 100 being same location
   */
  calculateProximityScore(country1: string, country2: string): ProximityScore {
    // Same country = 100%
    const norm1 = normalizeCountryName(country1);
    const norm2 = normalizeCountryName(country2);

    if (norm1.toLowerCase() === norm2.toLowerCase()) {
      return {
        score: 100,
        distanceKm: 0,
        explanation: `Exact match: ${norm1}`,
      };
    }

    const coords1 = this.getCountryCoordinates(country1);
    const coords2 = this.getCountryCoordinates(country2);

    if (!coords1) {
      return {
        score: 0,
        distanceKm: -1,
        explanation: `Unknown country: ${country1}`,
      };
    }

    if (!coords2) {
      return {
        score: 0,
        distanceKm: -1,
        explanation: `Unknown country: ${country2}`,
      };
    }

    const distanceKm = this.calculateDistanceKm(
      coords1.lat,
      coords1.lng,
      coords2.lat,
      coords2.lng
    );

    // Linear score decay: 100% at 0km, 0% at MAX_DISTANCE_KM
    const score = Math.max(
      0,
      Math.round(100 - (distanceKm / this.MAX_DISTANCE_KM) * 100)
    );

    return {
      score,
      distanceKm: Math.round(distanceKm),
      explanation: `${norm1} to ${norm2}: ${Math.round(distanceKm)} km (${score}% match)`,
    };
  }

  /**
   * Check if a country is in our database
   */
  isKnownCountry(country: string): boolean {
    return this.getCountryCoordinates(country) !== null;
  }

  /**
   * Get list of all known countries
   */
  getKnownCountries(): string[] {
    return Object.keys(COUNTRY_COORDS).sort();
  }
}

// Export singleton instance
export const geographicService = new GeographicService();
export default geographicService;
