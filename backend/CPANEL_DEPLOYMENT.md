# cPanel Deployment Guide for HRMS Backend

This guide will help you deploy the HRMS backend to cPanel at `hrms-api.ciroocity.com` with Prisma setup and database seeding.

## Prerequisites

1. **cPanel Access** with Node.js version manager (Node.js Selector)
2. **Database Access** - PostgreSQL database created in cPanel
3. **SSH Access** (recommended) or File Manager access
4. **Environment Variables** - Database credentials and other configs

## Step 1: Prepare Your Database

1. **Create PostgreSQL Database in cPanel:**
   - Go to cPanel → PostgreSQL Databases
   - Create a new database (e.g., `ciroocity_hrms`)
   - Create a database user and assign it to the database
   - Note down: Database name, username, password, and host (usually `localhost`)

2. **Get Database Connection String:**
   ```
   postgresql://username:password@host:port/database_name
   ```
   Example:
   ```
   postgresql://ciroocity_user:your_password@localhost:5432/ciroocity_hrms
   ```

## Step 2: Upload Your Project Files

### Option A: Using Git (Recommended)
```bash
# SSH into your cPanel account
cd ~/public_html/hrms-api.ciroocity.com  # or your domain directory
git clone <your-repo-url> backend
cd backend
```

### Option B: Using File Manager
1. Upload your project files via cPanel File Manager
2. Extract if compressed
3. Ensure all files are in the correct directory

## Step 3: Set Up Node.js Version

1. **In cPanel:**
   - Go to **Node.js Selector** (or **Setup Node.js App**)
   - Click **Create Application**
   - Set:
     - **Node.js version**: 18.x or 20.x (LTS)
     - **Application root**: `/home/username/public_html/hrms-api.ciroocity.com/backend`
     - **Application URL**: `hrms-api.ciroocity.com`
     - **Application startup file**: `dist/server.js`
   - Click **Create**

2. **Note the Application URL and Port** - You'll need these for environment variables

## Step 4: Configure Environment Variables

1. **In cPanel Node.js App settings:**
   - Find your application
   - Click **Edit** or **Manage**
   - Add the following environment variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=production
PORT=4000

# Frontend Configuration
FRONTEND_URL=https://your-frontend-domain.com
NEXT_PUBLIC_API_URL=https://hrms-api.ciroocity.com

# Redis Configuration (if using)
REDIS_URL=redis://localhost:6379

# Email Configuration (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@ciroocity.com
```

2. **Save** the environment variables

## Step 5: Install Dependencies

### Via SSH:
```bash
cd ~/public_html/hrms-api.ciroocity.com/backend
npm install --production
```

### Via Terminal in cPanel:
1. Go to **Terminal** in cPanel
2. Navigate to your project directory
3. Run: `npm install --production`

## Step 6: Generate Prisma Client

```bash
cd ~/public_html/hrms-api.ciroocity.com/backend
npx prisma generate
```

This creates the Prisma Client based on your schema.

## Step 7: Run Database Migrations

```bash
cd ~/public_html/hrms-api.ciroocity.com/backend
npx prisma migrate deploy
```

**Important:** Use `prisma migrate deploy` (not `prisma migrate dev`) for production deployments. This applies all pending migrations without creating new ones.

## Step 8: Seed the Database

```bash
cd ~/public_html/hrms-api.ciroocity.com/backend
npm run prisma:seed
```

Or directly:
```bash
npx tsx prisma/seed.ts
```

This will:
- Create roles (ADMIN, HR, MANAGER, EMPLOYEE)
- Create permissions and assign them to roles
- Create departments
- Create admin user (admin@ciro.gov.et / Admin12345!)
- Create sample employees, assets, documents, tasks, expenses, and leads
- Set up payroll data (salary grades, tax rates, pension rates, allowances)

## Step 9: Build the TypeScript Project

```bash
cd ~/public_html/hrms-api.ciroocity.com/backend
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## Step 10: Create Required Directories

```bash
cd ~/public_html/hrms-api.ciroocity.com/backend
mkdir -p uploads/tasks
mkdir -p uploads/expenses
mkdir -p uploads/documents
```

Ensure these directories have write permissions:
```bash
chmod 755 uploads
chmod 755 uploads/tasks
chmod 755 uploads/expenses
chmod 755 uploads/documents
```

## Step 11: Start/Restart the Application

### In cPanel Node.js App:
1. Go to **Node.js Selector**
2. Find your application
3. Click **Restart** or **Start**

### Via SSH:
```bash
cd ~/public_html/hrms-api.ciroocity.com/backend
npm start
```

## Step 12: Verify Deployment

1. **Check Health Endpoint:**
   ```
   https://hrms-api.ciroocity.com/health
   ```
   Should return: `{"status":"OK","timestamp":"..."}`

2. **Check API Endpoint:**
   ```
   https://hrms-api.ciroocity.com/api/v1/...
   ```

3. **Check Logs:**
   - In cPanel Node.js App, click **View Logs**
   - Or via SSH: Check application logs in your project directory

## Troubleshooting

### Issue: Prisma Client Not Found
**Solution:**
```bash
npx prisma generate
```

### Issue: Database Connection Failed
**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check database user has proper permissions
3. Ensure PostgreSQL is running
4. Check firewall/security settings

### Issue: Migrations Fail
**Solutions:**
1. Check database connection
2. Verify user has CREATE/ALTER permissions
3. Run migrations manually if needed:
   ```bash
   npx prisma migrate resolve --applied <migration_name>
   ```

### Issue: Seed Script Fails
**Solutions:**
1. Ensure migrations are applied first
2. Check for duplicate data (seed uses upsert, but verify)
3. Run seed in parts if needed

### Issue: Application Won't Start
**Solutions:**
1. Check Node.js version (should be 18.x or 20.x)
2. Verify `dist/server.js` exists
3. Check environment variables are set
4. Review application logs

### Issue: Permission Denied for Uploads
**Solution:**
```bash
chmod -R 755 uploads
```

## Post-Deployment Checklist

- [ ] Database created and accessible
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Prisma Client generated
- [ ] Migrations applied
- [ ] Database seeded
- [ ] TypeScript compiled
- [ ] Upload directories created with proper permissions
- [ ] Application started
- [ ] Health endpoint responding
- [ ] API endpoints accessible
- [ ] Logs checked for errors

## Maintenance Commands

### Update Dependencies:
```bash
npm install --production
npm run build
# Restart application
```

### Run New Migrations:
```bash
npx prisma migrate deploy
npx prisma generate
npm run build
# Restart application
```

### Re-seed Database (if needed):
```bash
npm run prisma:seed
```

### View Prisma Studio (for database inspection):
```bash
npx prisma studio
# Access at http://localhost:5555 (if SSH tunneled)
```

## Security Notes

1. **Never commit `.env` files** - Use cPanel environment variables
2. **Use strong JWT_SECRET** - Generate a random string
3. **Restrict database access** - Only allow necessary IPs
4. **Keep dependencies updated** - Regularly run `npm audit`
5. **Use HTTPS** - Configure SSL certificate in cPanel

## Default Test Credentials (After Seeding)

**Admin:**
- Email: `admin@ciro.gov.et`
- Password: `Admin12345!`

**Manager:**
- Email: `manager@ciro.gov.et`
- Password: `Manager123!`

**HR:**
- Email: `hr@ciro.gov.et`
- Password: `HrUser123!`

**Employee:**
- Email: `employee@ciro.gov.et`
- Password: `Employee123!`

**⚠️ Change these passwords in production!**

## Quick Deployment Script

Create a file `deploy.sh` in your project root:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

echo "📦 Installing dependencies..."
npm install --production

echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "🗄️ Running migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npm run prisma:seed

echo "🏗️ Building project..."
npm run build

echo "✅ Deployment complete! Restart your Node.js app in cPanel."
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run it:
```bash
./deploy.sh
```

---

**Need Help?** Check the logs in cPanel Node.js App or contact your hosting provider.

