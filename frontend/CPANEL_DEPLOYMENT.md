# cPanel Frontend Deployment Guide for HRMS

This guide will help you deploy the HRMS frontend to cPanel and configure it to use the production API at `https://hrms-api.ciroocity.com`.

## Prerequisites

1. **cPanel Access** with File Manager or SSH access
2. **Backend API** deployed and accessible at `https://hrms-api.ciroocity.com`
3. **Domain/Subdomain** configured (e.g., `hrms.ciroocity.com` or `ciroocity.com/hrms`)

## Step 1: Prepare Environment Configuration

### Option A: Using Environment File (Recommended)

1. **Create `.env.production` file** in the frontend root directory:
   ```env
   VITE_API_URL=https://hrms-api.ciroocity.com
   ```

2. **For local development**, create `.env.local`:
   ```env
   VITE_API_URL=http://localhost:4000
   ```

### Option B: Using Build-Time Environment Variable

You can also set the environment variable during build:
```bash
VITE_API_URL=https://hrms-api.ciroocity.com npm run build
```

## Step 2: Build the Frontend

### On Your Local Machine (Recommended)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create production environment file:**
   ```bash
   # Create .env.production
   echo "VITE_API_URL=https://hrms-api.ciroocity.com" > .env.production
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

   This creates a `dist/` folder with optimized production files.

### On cPanel Server (Alternative)

If you prefer to build on the server:

1. **Upload source files** to cPanel
2. **SSH into your server** or use Terminal in cPanel
3. **Navigate to frontend directory:**
   ```bash
   cd ~/public_html/your-domain/frontend
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Set environment variable and build:**
   ```bash
   VITE_API_URL=https://hrms-api.ciroocity.com npm run build
   ```

## Step 3: Upload Files to cPanel

### Option A: Upload Built Files (Recommended)

1. **Compress the `dist/` folder** from your local build
2. **Upload via cPanel File Manager:**
   - Navigate to your domain's public directory (e.g., `public_html/hrms.ciroocity.com`)
   - Upload the compressed `dist` folder
   - Extract it
   - Move all files from `dist/` to the root of your domain directory

### Option B: Upload Source and Build on Server

1. **Upload entire frontend folder** to cPanel
2. **Build on server** (see Step 2 - Alternative)

## Step 4: Configure Web Server

### For Subdomain (e.g., hrms.ciroocity.com)

1. **In cPanel:**
   - Go to **Subdomains**
   - Create subdomain `hrms` pointing to `public_html/hrms`
   - Or point existing subdomain to your frontend directory

2. **Upload files** to `public_html/hrms/` (or your subdomain directory)

### For Subdirectory (e.g., ciroocity.com/hrms)

1. **Upload files** to `public_html/hrms/` directory
2. **Access at:** `https://ciroocity.com/hrms`

### For Root Domain

1. **Upload files** to `public_html/` directory
2. **Access at:** `https://ciroocity.com`

## Step 5: Configure .htaccess for React Router

Since this is a Single Page Application (SPA), you need to configure URL rewriting so all routes work correctly.

**Create or update `.htaccess` file** in your frontend root directory:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html
  RewriteRule . /index.html [L]
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType text/x-javascript "access plus 1 month"
  ExpiresByType application/x-shockwave-flash "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresDefault "access plus 2 days"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

## Step 6: Verify API Configuration

After deployment, verify that the frontend is using the correct API URL:

1. **Open browser developer tools** (F12)
2. **Go to Console tab**
3. **Check for API calls** - they should be going to `https://hrms-api.ciroocity.com/api/v1/...`
4. **Check Network tab** - verify all API requests use the production URL

## Step 7: Test Deployment

1. **Access your frontend URL:**
   - Subdomain: `https://hrms.ciroocity.com`
   - Subdirectory: `https://ciroocity.com/hrms`
   - Root: `https://ciroocity.com`

2. **Test login:**
   - Use admin credentials: `admin@ciro.gov.et` / `Admin12345!`
   - Verify API calls work correctly

3. **Test navigation:**
   - Navigate to different pages
   - Verify all routes work (no 404 errors)

## Troubleshooting

### Issue: API calls still going to localhost

**Solution:**
1. Clear browser cache
2. Verify `.env.production` file exists with correct URL
3. Rebuild the project: `npm run build`
4. Check browser console for environment variable value

### Issue: 404 errors on page refresh

**Solution:**
1. Ensure `.htaccess` file is in the root directory
2. Verify `mod_rewrite` is enabled on your server
3. Check that `.htaccess` rules are correct

### Issue: Assets not loading (CSS/JS files)

**Solution:**
1. Check file permissions (should be 644 for files, 755 for directories)
2. Verify all files were uploaded correctly
3. Check browser console for 404 errors on specific assets
4. Ensure base path in `vite.config.ts` is correct (if using subdirectory)

### Issue: CORS errors

**Solution:**
1. Verify backend CORS configuration allows your frontend domain
2. Check backend `FRONTEND_URL` environment variable
3. Ensure API URL in frontend matches backend configuration

### Issue: Build fails

**Solution:**
1. Check Node.js version (should be 18.x or 20.x)
2. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check for TypeScript errors: `npm run build` will show errors

## Environment Variables Reference

### Development (.env.local)
```env
VITE_API_URL=http://localhost:4000
```

### Production (.env.production)
```env
VITE_API_URL=https://hrms-api.ciroocity.com
```

### Build-time (Alternative)
```bash
VITE_API_URL=https://hrms-api.ciroocity.com npm run build
```

## File Structure After Deployment

```
public_html/
├── index.html
├── .htaccess
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── [other static files]
```

## Updating the Frontend

When you need to update the frontend:

1. **Make changes** to source code
2. **Update environment** if API URL changed
3. **Rebuild:**
   ```bash
   npm run build
   ```
4. **Upload new `dist/` contents** to cPanel
5. **Clear browser cache** or do hard refresh (Ctrl+Shift+R)

## Security Checklist

- [ ] HTTPS enabled (SSL certificate configured)
- [ ] API URL uses HTTPS
- [ ] `.env` files not accessible via web (should be in `.gitignore`)
- [ ] `.htaccess` security headers configured
- [ ] File permissions set correctly (644 for files, 755 for directories)

## Quick Deployment Script

Create `deploy.sh` in frontend root:

```bash
#!/bin/bash
set -e

echo "🚀 Building frontend for production..."

# Set production API URL
export VITE_API_URL=https://hrms-api.ciroocity.com

# Build
npm run build

echo "✅ Build complete! Upload the 'dist' folder contents to cPanel."
```

Make executable and run:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Centralized API Configuration

The frontend now uses a centralized API configuration located at:
- **File:** `src/config/api.ts`
- **Exports:** `API_BASE_URL`, `API_URL`, `resolveFileUrl()`, `resolveAvatarUrl()`

All API URLs are managed through this single file, preventing hardcoded values throughout the codebase.

---

**Need Help?** Check the browser console for errors or contact your hosting provider.

