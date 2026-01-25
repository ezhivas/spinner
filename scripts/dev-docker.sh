#!/bin/bash
echo "🐳 Starting in Docker mode..."
echo ""
# Navigate to project root (one level up from scripts/)
cd "$(dirname "$0")/.." || exit 1
# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "   Please start Docker Desktop and try again"
    exit 1
fi
# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    echo "❌ Error: .env.docker not found"
    exit 1
fi
# Copy Docker environment variables
echo "📝 Copying .env.docker to .env..."
cp .env.docker .env
# Check if docker-compose.yml exists
if [ ! -f docker-compose.yml ]; then
    echo "❌ Error: docker-compose.yml not found"
    exit 1
fi
# Start Docker Compose
echo "🚀 Starting Docker Compose..."
docker-compose up --build
echo ""
echo "✅ Docker mode started"
echo "🌐 Open http://localhost:3000 in browser"
