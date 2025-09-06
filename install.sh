#!/bin/bash

echo "🚀 Installing OSL CLI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Install globally using npm
echo "Installing OSL CLI globally..."
npm install -g .

if [ $? -eq 0 ]; then
    echo "✅ OSL CLI installed successfully!"
    echo ""
    echo "You can now use the following commands:"
    echo "  osl compile file.osl    # Compile OSL file"
    echo "  osl run file.osl        # Run OSL file"
    echo "  osl origin              # Open Origin website"
    echo "  osl update              # Update OSL.js"
    echo "  osl help                # Show help"
    echo ""
    echo "Try: osl --help"
else
    echo "❌ Installation failed. You may need to run with sudo:"
    echo "sudo npm install -g ."
fi
