#!/bin/bash

echo "🚀 Starting CoreInventory Development Environment"
echo "=============================================="

# Check if PostgreSQL is running
if ! pg_isready -q -h localhost -p 5432; then
    echo "❌ PostgreSQL is not running on localhost:5432"
    echo "Please start PostgreSQL service first:"
    echo "  - On macOS: brew services start postgresql"
    echo "  - On Ubuntu: sudo systemctl start postgresql"
    echo "  - On Windows: net start postgresql-x64-14"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Start Backend
echo "📦 Starting Backend..."
cd Backend
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "⚠️  Please update Backend/.env with your database credentials"
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing Backend dependencies..."
    npm install
fi

# Run migrations and start server
npm run migrate && npm run seed && npm run dev &
BACKEND_PID=$!

echo "✅ Backend started on http://localhost:5000"
echo "📋 API Documentation: http://localhost:5000/api"

# Start Frontend
echo "🎨 Starting Frontend..."
cd ../Frontend

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing Frontend dependencies..."
    npm install
fi

# Start frontend dev server
npm run dev &
FRONTEND_PID=$!

echo "✅ Frontend started on http://localhost:5173"
echo ""
echo "🎉 Development Environment Ready!"
echo "================================="
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"
echo "API Docs: http://localhost:5000/api"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt signal
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
