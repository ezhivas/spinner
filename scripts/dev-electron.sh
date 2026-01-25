#!/bin/bash

echo "💻 Starting in Electron mode..."
echo ""

# Navigate to project root (one level up from scripts/)
cd "$(dirname "$0")/.." || exit 1

# Check if .env.electron exists
if [ ! -f .env.electron ]; then
    echo "❌ Error: .env.electron not found"
    exit 1
fi

# Copy Electron environment variables
echo "📝 Copying .env.electron to .env..."
cp .env.electron .env

# Create data directory if it doesn't exist
echo "📁 Creating data directory..."
mkdir -p ./data

# Build backend
echo "🔨 Building backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi

# Start backend in background
echo "🚀 Starting backend..."
npm run start:prod &
BACKEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping backend..."
    kill $BACKEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    echo "✅ Electron mode stopped"
}

# Register cleanup function
trap cleanup EXIT INT TERM

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Backend failed to start"
    exit 1
fi

echo "✅ Backend started (PID: $BACKEND_PID)"
echo "🎨 Starting Electron..."
echo ""

# Start Electron
electron electron/main.js

# Cleanup will be called automatically on exit
