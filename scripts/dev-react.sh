#!/bin/bash

# Скрипт для запуска React frontend и NestJS backend одновременно

echo "🚀 Starting SpinneR in Development Mode (React UI)"
echo "================================================"
echo ""

# Проверка что скрипт запущен из корня проекта
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root"
    exit 1
fi

# Функция для очистки процессов при выходе
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Проверка и установка зависимостей
if [ ! -d "node_modules" ] || [ ! -d "packages/frontend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Сборка shared-types если нужно
if [ ! -d "packages/shared-types/dist" ]; then
    echo "🔨 Building shared-types..."
    cd packages/shared-types
    npm run build
    cd ../..
fi

echo ""
echo "Starting services..."
echo "-------------------"

# Установка переменных окружения для SQLite режима (не Docker)
export DB_TYPE=sqlite
export DB_PATH="./data/dev.db"
export PORT=3000

# Запуск NestJS backend
echo "🔧 Starting NestJS backend on port 3000 (SQLite mode)..."
npm run start:dev > /tmp/spinner-backend.log 2>&1 &
BACKEND_PID=$!

# Ждем запуска backend
sleep 3

# Запуск React frontend
echo "⚛️  Starting React frontend on port 5173..."
cd packages/frontend
npm run dev > /tmp/spinner-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ Services started!"
echo "==================="
echo ""
echo "📱 Frontend (React):  http://localhost:5173"
echo "🔌 Backend (NestJS):  http://localhost:3000/api"
echo "📚 Swagger API:       http://localhost:3000/api-docs"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/spinner-backend.log"
echo "   Frontend: tail -f /tmp/spinner-frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Показываем логи frontend в реальном времени
tail -f /tmp/spinner-frontend.log &
TAIL_PID=$!

# Ждем завершения
wait $BACKEND_PID $FRONTEND_PID
