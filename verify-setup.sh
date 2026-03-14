#!/bin/bash

echo "🔍 CoreInventory Setup Verification"
echo "=================================="

# Check Docker
echo "📦 Checking Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    if docker info &> /dev/null; then
        echo "✅ Docker is running"
    else
        echo "❌ Docker is not running"
        exit 1
    fi
else
    echo "❌ Docker is not installed"
    exit 1
fi

# Check docker-compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose is installed"
else
    echo "❌ Docker Compose is not installed"
    exit 1
fi

# Check Node.js
echo "🟢 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js is installed ($NODE_VERSION)"
else
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm is installed ($NPM_VERSION)"
else
    echo "❌ npm is not installed"
    exit 1
fi

# Check PostgreSQL
echo "🐘 Checking PostgreSQL..."
if command -v pg_isready &> /dev/null; then
    if pg_isready -q -h localhost -p 5432 2>/dev/null; then
        echo "✅ PostgreSQL is running on localhost:5432"
    else
        echo "⚠️  PostgreSQL is not running (required for manual development)"
    fi
else
    echo "⚠️  PostgreSQL client not found (required for manual development)"
fi

# Check project structure
echo "📁 Checking Project Structure..."
if [ -d "Backend" ] && [ -d "Frontend" ]; then
    echo "✅ Backend and Frontend directories exist"
else
    echo "❌ Backend or Frontend directory missing"
    exit 1
fi

# Check Backend dependencies
if [ -f "Backend/package.json" ]; then
    echo "✅ Backend package.json exists"
    if [ -d "Backend/node_modules" ]; then
        echo "✅ Backend dependencies installed"
    else
        echo "⚠️  Backend dependencies not installed (run: cd Backend && npm install)"
    fi
else
    echo "❌ Backend package.json missing"
fi

# Check Frontend dependencies
if [ -f "Frontend/package.json" ]; then
    echo "✅ Frontend package.json exists"
    if [ -d "Frontend/node_modules" ]; then
        echo "✅ Frontend dependencies installed"
    else
        echo "⚠️  Frontend dependencies not installed (run: cd Frontend && npm install)"
    fi
else
    echo "❌ Frontend package.json missing"
fi

# Check Docker files
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml exists"
    if docker-compose config &> /dev/null; then
        echo "✅ Docker Compose configuration is valid"
    else
        echo "❌ Docker Compose configuration has errors"
    fi
else
    echo "❌ docker-compose.yml missing"
fi

if [ -f "Backend/Dockerfile" ] && [ -f "Frontend/Dockerfile" ]; then
    echo "✅ Dockerfiles exist"
else
    echo "❌ Dockerfiles missing"
fi

# Check environment files
if [ -f "Backend/env.example" ]; then
    echo "✅ Backend env.example exists"
    if [ -f "Backend/.env" ]; then
        echo "✅ Backend .env exists (manual development ready)"
    else
        echo "⚠️  Backend .env missing (copy env.example to .env for manual development)"
    fi
else
    echo "❌ Backend env.example missing"
fi

echo ""
echo "🎉 Setup Verification Complete!"
echo "==============================="
echo ""
echo "Next Steps:"
echo "1. For Docker development: docker-compose up -d"
echo "2. For manual development: ./start-dev.sh"
echo "3. View documentation: README-DOCKER.md"
echo ""
echo "Services will be available at:"
echo "- Frontend: http://localhost:5173"
echo "- Backend:  http://localhost:5000"
echo "- API Docs: http://localhost:5000/api"
