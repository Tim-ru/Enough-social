#!/bin/bash

# Build script for Enough Social Chrome Extension
echo "Building Enough Social Chrome Extension..."

# Remove old zip if exists
if [ -f "enough-social-extension.zip" ]; then
    rm enough-social-extension.zip
    echo "Removed old zip file"
fi

# Create new zip with all necessary files
zip -r enough-social-extension.zip . \
    -x "*.DS_Store" \
    "*.git*" \
    "build.sh" \
    "*.md" \
    "node_modules/*" \
    "*.log"

echo "✅ Extension packaged successfully: enough-social-extension.zip"
echo "📦 File size: $(du -h enough-social-extension.zip | cut -f1)"
echo ""
echo "Ready for Chrome Web Store upload!"
