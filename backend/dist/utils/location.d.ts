/**
 * Location utility functions for attendance management
 */
export declare const OFFICE_LOCATIONS: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    address: string;
}[];
/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export declare function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Parse location string (e.g., "9.0192, 38.7525") into coordinates
 */
export declare function parseLocationString(location: string): {
    latitude: number;
    longitude: number;
} | null;
/**
 * Check if coordinates are within office premises
 * Returns the office location if within radius, null otherwise
 */
export declare function detectOfficeLocation(latitude: number, longitude: number): {
    distanceMeters: number;
    isWithinOffice: boolean;
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    address: string;
} | null;
/**
 * Get location type and details from coordinates
 */
export declare function getLocationInfo(location: string): {
    type: string;
    displayName: string;
    isOffice: boolean;
    coordinates: string;
    officeName?: undefined;
    officeAddress?: undefined;
    distanceMeters?: undefined;
    reverseGeocodingNeeded?: undefined;
} | {
    type: string;
    displayName: string;
    isOffice: boolean;
    officeName: string;
    officeAddress: string;
    distanceMeters: number;
    coordinates: string;
    reverseGeocodingNeeded?: undefined;
} | {
    type: string;
    displayName: string;
    isOffice: boolean;
    coordinates: string;
    reverseGeocodingNeeded: boolean;
    officeName?: undefined;
    officeAddress?: undefined;
    distanceMeters?: undefined;
};
/**
 * Reverse geocoding using OpenStreetMap Nominatim API (Free, no API key required)
 * Converts coordinates to human-readable address
 */
export declare function reverseGeocode(latitude: number, longitude: number): Promise<string>;
/**
 * Get comprehensive location details with reverse geocoding
 */
export declare function getDetailedLocationInfo(location: string): Promise<{
    type: string;
    displayName: string;
    isOffice: boolean;
    coordinates: string;
    officeName?: undefined;
    officeAddress?: undefined;
    distanceMeters?: undefined;
    reverseGeocodingNeeded?: undefined;
} | {
    type: string;
    displayName: string;
    isOffice: boolean;
    officeName: string;
    officeAddress: string;
    distanceMeters: number;
    coordinates: string;
    reverseGeocodingNeeded?: undefined;
} | {
    type: string;
    displayName: string;
    isOffice: boolean;
    coordinates: string;
    reverseGeocodingNeeded: boolean;
    officeName?: undefined;
    officeAddress?: undefined;
    distanceMeters?: undefined;
} | {
    displayName: string;
    fullAddress: string;
    type: string;
    isOffice: boolean;
    coordinates: string;
    officeName?: undefined;
    officeAddress?: undefined;
    distanceMeters?: undefined;
    reverseGeocodingNeeded?: undefined;
} | {
    displayName: string;
    fullAddress: string;
    type: string;
    isOffice: boolean;
    officeName: string;
    officeAddress: string;
    distanceMeters: number;
    coordinates: string;
    reverseGeocodingNeeded?: undefined;
} | {
    displayName: string;
    fullAddress: string;
    type: string;
    isOffice: boolean;
    coordinates: string;
    reverseGeocodingNeeded: boolean;
    officeName?: undefined;
    officeAddress?: undefined;
    distanceMeters?: undefined;
}>;
//# sourceMappingURL=location.d.ts.map