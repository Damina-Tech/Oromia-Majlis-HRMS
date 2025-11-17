# Location Configuration Guide

## Overview
The HRMS system now includes intelligent location detection for attendance tracking. It can:
1. Detect if an employee is at the office or working remotely
2. Calculate distance from office location
3. Display human-readable addresses (optional reverse geocoding)

## Configuration

### Office Locations
Edit `backend/src/utils/location.ts` to configure your office locations:

```typescript
export const OFFICE_LOCATIONS = [
  {
    id: "main-office",
    name: "Main Office - Addis Ababa",
    latitude: 9.0192,        // Your office latitude
    longitude: 38.7525,      // Your office longitude
    radiusMeters: 100,       // Detection radius (100m default)
    address: "Bole, Addis Ababa, Ethiopia"
  },
  // Add more offices as needed
];
```

### How to Get Your Office Coordinates

#### Method 1: Google Maps
1. Open Google Maps
2. Right-click on your office location
3. Click the coordinates (e.g., "9.0192, 38.7525")
4. Coordinates are copied to clipboard

#### Method 2: GPS Device
Use any GPS-enabled device at your office location

#### Method 3: Online Tools
- https://www.latlong.net/
- https://gps-coordinates.org/

### Detection Radius
The `radiusMeters` parameter defines how close an employee must be to be considered "at office":
- **50m**: Very strict (small office)
- **100m**: Recommended for most offices
- **200m**: Loose (large campus)
- **500m**: Very loose (office park)

## Features

### 1. Office Detection
Automatically detects if GPS coordinates are within office radius:
- ✅ **At Office**: Green badge, shows distance from center
- 🌍 **Remote**: Orange badge, shows location type

### 2. Location Display
Three display modes:
1. **Office**: "Main Office - Addis Ababa" + distance
2. **Remote**: Coordinates or reverse-geocoded address
3. **Unknown**: Raw coordinates if parsing fails

### 3. Reverse Geocoding (Optional)
Uses OpenStreetMap Nominatim API (free, no API key required):
- Converts coordinates to readable addresses
- Example: "9.0652, 40.8683" → "Bole Road, Addis Ababa, Ethiopia"
- Fallback to coordinates if service unavailable

## API Response Format

### Check-in Response
```json
{
  "id": "...",
  "checkInTime": "2025-10-14T10:00:00Z",
  "checkInLocation": "9.0192, 38.7525",
  "locationInfo": {
    "type": "OFFICE",
    "displayName": "Main Office - Addis Ababa",
    "isOffice": true,
    "officeName": "Main Office - Addis Ababa",
    "distanceMeters": 45
  }
}
```

### List Attendance Response
```json
{
  "items": [
    {
      "id": "...",
      "date": "2025-10-14",
      "checkInLocation": "9.0192, 38.7525",
      "checkInLocationInfo": {
        "type": "OFFICE",
        "displayName": "Main Office - Addis Ababa",
        "isOffice": true,
        "officeName": "Main Office - Addis Ababa"
      }
    }
  ]
}
```

## Frontend Display

### Current Location Card
Shows:
- GPS coordinates
- Readable location name
- Office/Remote badge
- Distance from office (if at office)

### Attendance History Table
Shows:
- Location Type column (Office/Remote icons)
- Location column (readable name)
- Color-coded badges

## Customization

### Change Office Work Hours
Edit `backend/src/modules/attendance/attendance.controller.ts`:
```typescript
const workStartHour = 9;      // 9:00 AM
const workStartMinute = 0;
const lateThresholdMinutes = 15; // 15 minutes grace period
```

### Add Multiple Offices
Simply add more objects to `OFFICE_LOCATIONS` array:
```typescript
export const OFFICE_LOCATIONS = [
  { id: "hq", name: "HQ", latitude: 9.0192, longitude: 38.7525, radiusMeters: 100, address: "..." },
  { id: "branch1", name: "Branch 1", latitude: 9.6000, longitude: 41.8500, radiusMeters: 100, address: "..." },
  { id: "branch2", name: "Branch 2", latitude: 8.5500, longitude: 39.2700, radiusMeters: 100, address: "..." },
];
```

### Disable Reverse Geocoding
If you don't want to use external APIs:
1. Remove the `reverseGeocode` function calls
2. System will show coordinates for remote locations

## Privacy & Security

### Data Storage
- Only GPS coordinates are stored in database
- Location info is calculated on-the-fly
- No external API calls during check-in (fast)

### Reverse Geocoding
- Optional feature
- Uses free OpenStreetMap service
- No API key required
- No user data sent except coordinates
- Respects rate limits

### Employee Privacy
- Exact coordinates not shown to managers
- Only "Office" or "Remote" distinction visible
- Detailed location only visible to HR/Admin

## Troubleshooting

### "Location access denied"
- Employee must allow browser location access
- Check browser settings
- HTTPS required for geolocation API

### Wrong office detection
- Verify office coordinates are correct
- Adjust `radiusMeters` if needed
- Check GPS accuracy (outdoor vs indoor)

### Reverse geocoding not working
- Service might be rate-limited
- Falls back to coordinates automatically
- No impact on core functionality

## Future Enhancements

Possible additions:
1. Geofencing alerts for unauthorized locations
2. Route tracking for field employees
3. Multiple check-in points per day
4. Location-based shift scheduling
5. Automatic timezone detection

