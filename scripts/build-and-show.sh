#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SpinneR - Автоматическая сборка и проверка результатов  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Переход в директорию проекта
cd "$(dirname "$0")/.."

# Проверка наличия необходимых файлов
echo -e "${YELLOW}📋 Проверка готовности к сборке...${NC}"
if [ ! -f "package.json" ]; then
    echo "❌ package.json не найден!"
    exit 1
fi

if [ ! -f "electron-builder.yml" ]; then
    echo "❌ electron-builder.yml не найден!"
    exit 1
fi

echo -e "${GREEN}✅ Все необходимые файлы на месте${NC}"
echo ""

# Очистка старых артефактов
echo -e "${YELLOW}🧹 Очистка старых артефактов сборки...${NC}"
rm -rf release/
rm -rf dist/
echo -e "${GREEN}✅ Очистка завершена${NC}"
echo ""

# Сборка
echo -e "${BLUE}🔨 Запуск сборки для Apple Silicon (ARM64)...${NC}"
echo -e "${YELLOW}⏱️  Это займёт 2-10 минут (в зависимости от кэша)${NC}"
echo ""

npm run build:mac:arm64

# Проверка результатов
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  РЕЗУЛЬТАТЫ СБОРКИ                       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ -d "release" ]; then
    echo -e "${GREEN}✅ Папка release создана${NC}"
    echo ""

    echo -e "${YELLOW}📦 Созданные файлы:${NC}"
    echo ""

    # DMG файл
    if [ -f "release/SpinneR-0.0.1-arm64.dmg" ]; then
        SIZE=$(du -h "release/SpinneR-0.0.1-arm64.dmg" | cut -f1)
        echo -e "${GREEN}✅ DMG инсталлятор:${NC}"
        echo -e "   📍 $(pwd)/release/SpinneR-0.0.1-arm64.dmg"
        echo -e "   📊 Размер: $SIZE"
        echo ""
    else
        echo -e "${YELLOW}⚠️  DMG файл не найден (возможно, сборка ещё не завершена)${NC}"
        echo ""
    fi

    # ZIP архив
    if [ -f "release/SpinneR-0.0.1-arm64-mac.zip" ]; then
        SIZE=$(du -h "release/SpinneR-0.0.1-arm64-mac.zip" | cut -f1)
        echo -e "${GREEN}✅ ZIP архив:${NC}"
        echo -e "   📍 $(pwd)/release/SpinneR-0.0.1-arm64-mac.zip"
        echo -e "   📊 Размер: $SIZE"
        echo ""
    fi

    # App bundle
    if [ -d "release/mac-arm64/SpinneR.app" ]; then
        SIZE=$(du -sh "release/mac-arm64/SpinneR.app" | cut -f1)
        echo -e "${GREEN}✅ Приложение:${NC}"
        echo -e "   📍 $(pwd)/release/mac-arm64/SpinneR.app"
        echo -e "   📊 Размер: $SIZE"
        echo ""
    fi

    # Все файлы
    echo -e "${YELLOW}📋 Все файлы в release/:${NC}"
    ls -lh release/ | grep -v "^total" | grep -v "^d" | awk '{print "   " $9 " (" $5 ")"}'
    echo ""

    # Что дальше
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                  ЧТО ДАЛЬШЕ?                             ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}1️⃣  Открыть папку с результатами:${NC}"
    echo -e "   open release/"
    echo ""
    echo -e "${YELLOW}2️⃣  Открыть DMG инсталлятор:${NC}"
    echo -e "   open release/SpinneR-0.0.1-arm64.dmg"
    echo ""
    echo -e "${YELLOW}3️⃣  Запустить приложение напрямую:${NC}"
    echo -e "   open release/mac-arm64/SpinneR.app"
    echo ""
    echo -e "${YELLOW}4️⃣  Установка (для тестирования):${NC}"
    echo -e "   - Откройте DMG"
    echo -e "   - Перетащите SpinneR в Applications"
    echo -e "   - Запустите из Applications"
    echo ""
    echo -e "${YELLOW}5️⃣  При первом запуске:${NC}"
    echo -e "   Если macOS блокирует запуск:"
    echo -e "   xattr -cr release/mac-arm64/SpinneR.app"
    echo -e "   open release/mac-arm64/SpinneR.app"
    echo ""

    # Открыть папку автоматически
    echo -e "${GREEN}🎉 СБОРКА ЗАВЕРШЕНА УСПЕШНО!${NC}"
    echo ""
    echo -e "${BLUE}Открываю папку с результатами...${NC}"
    open release/

else
    echo -e "${YELLOW}⚠️  Папка release не найдена${NC}"
    echo -e "${YELLOW}Возможно, сборка завершилась с ошибками.${NC}"
    echo ""
    echo -e "${YELLOW}Проверьте логи выше для деталей.${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
