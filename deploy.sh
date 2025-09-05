#!/bin/bash

# QuickShare Deployment Script
# This script can be used to deploy on various platforms

echo "🚀 QuickShare Deployment Script"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "🌐 Deployment Options:"
echo "1. Docker: docker build -t quickshare . && docker run -p 3000:3000 quickshare"
echo "2. PM2: pm2 start dist/server/index.js --name quickshare"
echo "3. Node.js: node dist/server/index.js"
echo "4. Heroku: git push heroku main"
echo "5. Vercel: vercel deploy"
echo ""
echo "📝 Environment Variables to set:"
echo "- PORT (default: 3000)"
echo "- NODE_ENV (production)"
echo "- DATABASE_URL (if using PostgreSQL)"
echo ""
echo "🎉 Ready for deployment!"