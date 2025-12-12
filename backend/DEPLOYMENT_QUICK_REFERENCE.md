# Quick Deployment Reference

## Essential Commands for cPanel Deployment

### 1. Initial Setup (First Time Only)

```bash
# Navigate to project directory
cd ~/public_html/hrms-api.ciroocity.com/backend

# Install all dependencies (including dev for seeding)
npm install

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# Seed database
npm run prisma:seed

# Build project
npm run build
```

### 2. Using the Deployment Script

```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

### 3. Manual Step-by-Step (If Script Fails)

```bash
# 1. Install dependencies
npm install --production
npm install --include=dev

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migrations
npx prisma migrate deploy

# 4. Seed database (optional, only first time)
npm run prisma:seed

# 5. Build TypeScript
npm run build

# 6. Create upload directories
mkdir -p uploads/tasks uploads/expenses uploads/documents
chmod -R 755 uploads
```

### 4. Environment Variables (Set in cPanel Node.js App)

Required variables:
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-frontend.com
```

### 5. Restart Application

In cPanel:
- Go to **Node.js Selector**
- Find your app
- Click **Restart**

### 6. Verify Deployment

```bash
# Check health endpoint
curl https://hrms-api.ciroocity.com/health

# Should return: {"status":"OK","timestamp":"..."}
```

## Common Issues & Quick Fixes

### Prisma Client Not Found
```bash
npx prisma generate
```

### Migration Errors
```bash
# Check migration status
npx prisma migrate status

# Resolve specific migration
npx prisma migrate resolve --applied <migration_name>
```

### Build Errors
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Permission Errors
```bash
chmod -R 755 uploads
```

### Application Won't Start
1. Check Node.js version (18.x or 20.x)
2. Verify `dist/server.js` exists
3. Check environment variables
4. Review logs in cPanel

## Update Commands (After Code Changes)

```bash
# Pull latest code (if using git)
git pull

# Install new dependencies
npm install --production

# Run new migrations (if any)
npx prisma migrate deploy
npx prisma generate

# Rebuild
npm run build

# Restart app in cPanel
```

## Database Management

### View Database (Prisma Studio)
```bash
npx prisma studio
# Access via SSH tunnel at localhost:5555
```

### Reset Database (⚠️ DANGER - Deletes all data)
```bash
npx prisma migrate reset
npm run prisma:seed
```

### Check Database Connection
```bash
npx prisma db pull
```

## Logs

### View Application Logs
- In cPanel: Node.js App → View Logs
- Or via SSH: Check logs in project directory

### View Prisma Logs
Add to `.env`:
```
DEBUG=prisma:*
```

## Testing Endpoints

```bash
# Health check
curl https://hrms-api.ciroocity.com/health

# API endpoint (example)
curl https://hrms-api.ciroocity.com/api/v1/employees
```

## Default Credentials (After Seeding)

**Admin:**
- Email: `admin@ciro.gov.et`
- Password: `Admin12345!`

**⚠️ Change these in production!**

---

**Need more details?** See `CPANEL_DEPLOYMENT.md` for comprehensive guide.

