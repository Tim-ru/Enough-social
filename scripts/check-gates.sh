#!/bin/bash

# Скрипт для проверки гейтов качества

echo "🔍 Проверка гейтов качества..."

# Проверка manifest.json
echo "📋 Проверка manifest.json..."
if [ -f "manifest.json" ]; then
    # Проверяем валидность JSON
    if python3 -m json.tool manifest.json > /dev/null 2>&1; then
        echo "✅ manifest.json валиден"
    else
        echo "❌ manifest.json содержит ошибки"
        exit 1
    fi
    
    # Проверяем версию manifest
    MANIFEST_VERSION=$(grep -o '"manifest_version": [0-9]*' manifest.json | grep -o '[0-9]*')
    if [ "$MANIFEST_VERSION" = "3" ]; then
        echo "✅ Manifest v3"
    else
        echo "⚠️  Manifest v$MANIFEST_VERSION (рекомендуется v3)"
    fi
else
    echo "❌ manifest.json не найден"
    exit 1
fi

# Проверка package.json
echo "📦 Проверка package.json..."
if [ -f "package.json" ]; then
    if python3 -m json.tool package.json > /dev/null 2>&1; then
        echo "✅ package.json валиден"
    else
        echo "❌ package.json содержит ошибки"
        exit 1
    fi
else
    echo "❌ package.json не найден"
    exit 1
fi

# Проверка основных файлов
echo "📁 Проверка основных файлов..."
REQUIRED_FILES=("background.js" "popup.html" "popup.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file найден"
    else
        echo "❌ $file не найден"
        exit 1
    fi
done

# Проверка сборки
echo "🔨 Проверка сборки..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Сборка успешна"
else
    echo "❌ Ошибка сборки"
    exit 1
fi

# Проверка SHARED.md
echo "📝 Проверка SHARED.md..."
if [ -f "SHARED.md" ] && [ -s "SHARED.md" ]; then
    echo "✅ SHARED.md существует и не пуст"
else
    echo "❌ SHARED.md отсутствует или пуст"
    exit 1
fi

echo ""
echo "🎉 Все гейты качества пройдены!"
echo "📋 Следующий шаг: RELEASE_MANAGER может создать релиз"
