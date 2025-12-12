# API Configuration Centralization - Summary

## What Was Changed

All hardcoded `http://localhost:4000` references have been removed and centralized into a single configuration file.

## Changes Made

### 1. Created Centralized API Configuration
**File:** `src/config/api.ts`

This file now contains:
- `API_BASE_URL` - Base API URL from environment variable
- `API_URL` - Full API endpoint URL (`/api/v1` included)
- `resolveFileUrl()` - Helper to resolve file/asset URLs
- `resolveAvatarUrl()` - Helper to resolve avatar URLs
- `getApiUrl()` - Helper to get full API endpoint URLs

### 2. Updated Files to Use Centralized Config

**Files Updated:**
- ✅ `src/services/api.ts` - Now uses `API_URL` from config
- ✅ `src/pages/EmployeesPage.tsx` - Uses `resolveFileUrl()` and `resolveAvatarUrl()`
- ✅ `src/components/layout/Header.tsx` - Uses `resolveAvatarUrl()`
- ✅ `src/pages/ProfilePage.tsx` - Uses `resolveFileUrl()` and `resolveAvatarUrl()`
- ✅ `src/components/employees/IdCardPreview.tsx` - Uses `resolveFileUrl()`

### 3. Removed Hardcoded References

**Before:**
```typescript
const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
const resolveAvatarUrl = (value) => {
  if (value.startsWith("http")) return value;
  return `${apiBaseUrl}${value}`;
};
```

**After:**
```typescript
import { resolveAvatarUrl } from "@/config/api";
// Use directly - no need to define locally
```

## Environment Configuration

### Development
Create `.env.local`:
```env
VITE_API_URL=http://localhost:4000
```

### Production
Create `.env.production`:
```env
VITE_API_URL=https://hrms-api.ciroocity.com
```

### Build-time (Alternative)
```bash
VITE_API_URL=https://hrms-api.ciroocity.com npm run build
```

## Benefits

1. **Single Source of Truth** - API URL configured in one place
2. **No Hardcoded Values** - All references use the centralized config
3. **Easy Environment Switching** - Change `.env` file for different environments
4. **Type Safety** - TypeScript ensures correct usage
5. **Maintainability** - Future changes only need to update one file

## Usage Examples

### In API Service
```typescript
import { API_URL } from "@/config/api";
// API_URL already includes /api/v1
```

### For File/Avatar URLs
```typescript
import { resolveFileUrl, resolveAvatarUrl } from "@/config/api";

const avatarUrl = resolveAvatarUrl(user.avatarUrl);
const documentUrl = resolveFileUrl(document.path);
```

### For Direct API Calls
```typescript
import { getApiUrl } from "@/config/api";

const url = getApiUrl("/employees"); // Returns: https://hrms-api.ciroocity.com/api/v1/employees
```

## Verification

To verify all hardcoded references are removed:

```bash
# Search for any remaining localhost:4000 references (should only find the fallback in config)
grep -r "localhost:4000" src/

# Should only show:
# src/config/api.ts: export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
```

The fallback in `api.ts` is intentional and only used when `VITE_API_URL` is not set (development fallback).

## Migration Guide

If you have other files that still use hardcoded API URLs:

1. **Import the config:**
   ```typescript
   import { API_BASE_URL, resolveFileUrl, resolveAvatarUrl } from "@/config/api";
   ```

2. **Replace hardcoded URLs:**
   ```typescript
   // Before
   const url = `http://localhost:4000${path}`;
   
   // After
   const url = resolveFileUrl(path);
   ```

3. **For API endpoints:**
   ```typescript
   // Before
   const url = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/v1/endpoint`;
   
   // After
   import { getApiUrl } from "@/config/api";
   const url = getApiUrl("/endpoint");
   ```

## Deployment

See `CPANEL_DEPLOYMENT.md` for complete deployment instructions.

---

**Last Updated:** All hardcoded API URLs have been centralized to `src/config/api.ts`

