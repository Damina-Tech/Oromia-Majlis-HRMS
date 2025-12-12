# Frontend Deployment Quick Reference

## Essential Commands

### 1. Build for Production

```bash
# Set API URL and build
VITE_API_URL=https://hrms-api.ciroocity.com npm run build

# Or create .env.production first
echo "VITE_API_URL=https://hrms-api.ciroocity.com" > .env.production
npm run build
```

### 2. Local Development

```bash
# Create .env.local
echo "VITE_API_URL=http://localhost:4000" > .env.local

# Start dev server
npm run dev
```

### 3. Upload to cPanel

1. Build the project (see above)
2. Upload contents of `dist/` folder to cPanel
3. Add `.htaccess` file for SPA routing

## Environment Files

### `.env.production` (Production)
```env
VITE_API_URL=https://hrms-api.ciroocity.com
```

### `.env.local` (Local Development)
```env
VITE_API_URL=http://localhost:4000
```

## .htaccess Configuration

Create `.htaccess` in your frontend root:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Verify Configuration

1. **Check API URL in code:**
   - Open `src/config/api.ts`
   - Verify `API_BASE_URL` uses environment variable

2. **Check browser console:**
   - Open DevTools → Console
   - Look for API calls to `https://hrms-api.ciroocity.com`

3. **Check Network tab:**
   - All API requests should go to production URL

## Common Issues

### API still using localhost
- Clear browser cache
- Rebuild with correct environment variable
- Check `.env.production` exists

### 404 on page refresh
- Add `.htaccess` file
- Verify `mod_rewrite` enabled

### Build fails
- Check Node.js version (18.x or 20.x)
- Clear `node_modules`: `rm -rf node_modules && npm install`

## File Locations

- **API Config:** `src/config/api.ts`
- **Environment:** `.env.production` / `.env.local`
- **Build Output:** `dist/`
- **Web Config:** `.htaccess`

---

**Full Guide:** See `CPANEL_DEPLOYMENT.md` for detailed instructions.

