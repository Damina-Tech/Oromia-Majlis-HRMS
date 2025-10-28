/**
 * Location utility functions for attendance management
 */

// Office location configuration
// You can add multiple office locations here
export const OFFICE_LOCATIONS = [
  {
    id: "main-office",
    name: "Main Office - Addis Ababa",
    latitude: 9.0192,
    longitude: 38.7525,
    radiusMeters: 100, // 100 meters radius
    address: "Bole, Addis Ababa, Ethiopia"
  },
  {
    id: "branch-office",
    name: "Branch Office - Dire Dawa",
    latitude: 9.6000,
    longitude: 41.8500,
    radiusMeters: 100,
    address: "Dire Dawa, Ethiopia"
  }
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Parse location string (e.g., "9.0192, 38.7525") into coordinates
 */
export function parseLocationString(location: string): { latitude: number; longitude: number } | null {
  try {
    const parts = location.split(',').map(p => p.trim());
    if (parts.length !== 2) return null;
    
    const latitude = parseFloat(parts[0]);
    const longitude = parseFloat(parts[1]);
    
    if (isNaN(latitude) || isNaN(longitude)) return null;
    if (latitude < -90 || latitude > 90) return null;
    if (longitude < -180 || longitude > 180) return null;
    
    return { latitude, longitude };
  } catch {
    return null;
  }
}

/**
 * Check if coordinates are within office premises
 * Returns the office location if within radius, null otherwise
 */
export function detectOfficeLocation(latitude: number, longitude: number) {
  for (const office of OFFICE_LOCATIONS) {
    const distance = calculateDistance(
      latitude,
      longitude,
      office.latitude,
      office.longitude
    );
    
    if (distance <= office.radiusMeters) {
      return {
        ...office,
        distanceMeters: Math.round(distance),
        isWithinOffice: true
      };
    }
  }
  
  return null;
}

/**
 * Get location type and details from coordinates
 */
export function getLocationInfo(location: string) {
  const coords = parseLocationString(location);
  
  if (!coords) {
    return {
      type: "UNKNOWN",
      displayName: location,
      isOffice: false,
      coordinates: location
    };
  }
  
  const officeLocation = detectOfficeLocation(coords.latitude, coords.longitude);
  
  if (officeLocation) {
    return {
      type: "OFFICE",
      displayName: officeLocation.name,
      isOffice: true,
      officeName: officeLocation.name,
      officeAddress: officeLocation.address,
      distanceMeters: officeLocation.distanceMeters,
      coordinates: location
    };
  }
  
  return {
    type: "REMOTE",
    displayName: `Remote Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`,
    isOffice: false,
    coordinates: location,
    reverseGeocodingNeeded: true
  };
}

/**
 * Reverse geocoding using OpenStreetMap Nominatim API (Free, no API key required)
 * Converts coordinates to human-readable address
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HRMS-Attendance-System/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }
    
    const data = await response.json();
    
    if (data.display_name) {
      return data.display_name;
    }
    
    // Fallback to formatted address
    const address = data.address;
    if (address) {
      const parts = [
        address.road || address.suburb,
        address.city || address.town || address.village,
        address.state,
        address.country
      ].filter(Boolean);
      
      return parts.join(', ');
    }
    
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

/**
 * Get comprehensive location details with reverse geocoding
 */
export async function getDetailedLocationInfo(location: string) {
  const basicInfo = getLocationInfo(location);
  const coords = parseLocationString(location);
  
  if (!coords || basicInfo.isOffice) {
    return basicInfo;
  }
  
  // For remote locations, try to get readable address
  try {
    const address = await reverseGeocode(coords.latitude, coords.longitude);
    return {
      ...basicInfo,
      displayName: address,
      fullAddress: address
    };
  } catch {
    return basicInfo;
  }
}

