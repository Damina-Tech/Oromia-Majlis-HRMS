#!/bin/bash

# HRMS Backend Deployment Script for cPanel
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting HRMS Backend Deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the backend directory.${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Step 1: Installing dependencies...${NC}"
npm install --production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Step 2: Install dev dependencies (needed for tsx to run seed)
echo -e "${YELLOW}📦 Step 2: Installing dev dependencies (for seeding)...${NC}"
npm install --include=dev
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dev dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dev dependencies${NC}"
    exit 1
fi
echo ""

# Step 3: Generate Prisma Client
echo -e "${YELLOW}🔧 Step 3: Generating Prisma Client...${NC}"
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client generated successfully${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi
echo ""

# Step 4: Run database migrations
echo -e "${YELLOW}🗄️  Step 4: Running database migrations...${NC}"
npx prisma migrate deploy
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Failed to run migrations${NC}"
    echo -e "${YELLOW}⚠️  If migrations already exist, this is normal. Continuing...${NC}"
fi
echo ""

# Step 5: Seed database
echo -e "${YELLOW}🌱 Step 5: Seeding database...${NC}"
read -p "Do you want to seed the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run prisma:seed
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database seeded successfully${NC}"
    else
        echo -e "${RED}❌ Failed to seed database${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Skipping database seeding${NC}"
fi
echo ""

# Step 6: Build TypeScript
echo -e "${YELLOW}🏗️  Step 6: Building TypeScript project...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Project built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build project${NC}"
    exit 1
fi
echo ""

# Step 7: Create upload directories
echo -e "${YELLOW}📁 Step 7: Creating upload directories...${NC}"
mkdir -p uploads/tasks
mkdir -p uploads/expenses
mkdir -p uploads/documents
chmod -R 755 uploads
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Upload directories created${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Could not create upload directories. Please create them manually.${NC}"
fi
echo ""

# Step 8: Verify build
echo -e "${YELLOW}🔍 Step 8: Verifying build...${NC}"
if [ -f "dist/server.js" ]; then
    echo -e "${GREEN}✅ Build verification successful (dist/server.js exists)${NC}"
else
    echo -e "${RED}❌ Build verification failed (dist/server.js not found)${NC}"
    exit 1
fi
echo ""

# Final message
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Ensure all environment variables are set in cPanel Node.js App"
echo "   2. Restart your Node.js application in cPanel"
echo "   3. Verify the health endpoint: https://hrms-api.ciroocity.com/health"
echo ""
echo "🔐 Default admin credentials (change in production!):"
echo "   Email: admin@ciro.gov.et"
echo "   Password: Admin12345!"
echo ""

