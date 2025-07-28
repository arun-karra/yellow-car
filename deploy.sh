#!/bin/bash

# Build the app
echo "Building the app..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "To deploy:"
    echo "1. Upload the contents of the 'dist' folder to your web server"
    echo "2. Ensure your server supports HTTPS (required for PWA)"
    echo "3. Set up your Neon database and update the .env file"
    echo ""
    echo "For local testing:"
    echo "npx serve dist"
else
    echo "❌ Build failed!"
    exit 1
fi 