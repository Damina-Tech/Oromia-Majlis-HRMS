#!/bin/bash

# HRMS Frontend Deployment Script
# This script builds the frontend for production deployment

set -e  # Exit on any error

echo "🚀 Starting HRMS Frontend Deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the frontend directory.${NC}"
    exit 1
fi

# Default API URL
DEFAULT_API_URL="https://hrms-api.ciroocity.com"

# Check if API URL is provided as argument
if [ -n "$1" ]; then
    API_URL="$1"
else
    # Check if .env.production exists
    if [ -f ".env.production" ]; then
        # Extract VITE_API_URL from .env.production
        API_URL=$(grep "^VITE_API_URL=" .env.production | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        if [ -z "$API_URL" ]; then
            API_URL="$DEFAULT_API_URL"
        fi
    else
        API_URL="$DEFAULT_API_URL"
    fi
fi

echo -e "${YELLOW}📦 Step 1: Installing dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}🔧 Step 2: Setting up environment...${NC}"
echo "VITE_API_URL=$API_URL" > .env.production
echo -e "${GREEN}✅ Environment configured: VITE_API_URL=$API_URL${NC}"
echo ""

echo -e "${YELLOW}🏗️  Step 3: Building for production...${NC}"
VITE_API_URL="$API_URL" npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}🔍 Step 4: Verifying build...${NC}"
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✅ Build verification successful${NC}"
    echo -e "${GREEN}   - dist/index.html exists${NC}"
    echo -e "${GREEN}   - Build output is ready${NC}"
else
    echo -e "${RED}❌ Build verification failed${NC}"
    exit 1
fi
echo ""

# Final message
echo -e "${GREEN}🎉 Frontend build completed successfully!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Upload the contents of the 'dist' folder to your cPanel"
echo "   2. Ensure .htaccess file is in the root directory"
echo "   3. Verify API URL in browser console (should be: $API_URL)"
echo ""
echo "📁 Files to upload:"
echo "   - All files from the 'dist' folder"
echo "   - .htaccess file (for SPA routing)"
echo ""
echo "🌐 API Configuration:"
echo "   Production API URL: $API_URL"
echo ""

