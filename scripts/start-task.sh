#!/bin/bash

# Скрипт для быстрого старта новой задачи с агентной командой

if [ $# -eq 0 ]; then
    echo "Использование: $0 \"Название задачи\""
    echo "Пример: $0 \"Добавить уведомления о превышении лимита времени\""
    exit 1
fi

TASK_NAME="$1"
DATE=$(date +"%Y-%m-%d %H:%M")

# Обновляем TASK.md
cat > TASK.md << EOF
# Текущая задача

Краткое название
- $TASK_NAME

Описание
- <что нужно сделать, для кого, зачем>

Scope
- In: <что точно делаем>
- Out: <что не делаем>

Срок
- <дата или лимит времени>

Связанные тикеты или контекст
- <ссылки>

Acceptance Criteria
- Будут уточнены Product Owner в SHARED.md
EOF

# Обновляем SHARED.md с новой задачей
echo "" >> SHARED.md
echo "## Новая задача: $TASK_NAME" >> SHARED.md
echo "- Дата старта: $DATE" >> SHARED.md
echo "- Статус: В работе" >> SHARED.md
echo "" >> SHARED.md

echo "✅ Задача '$TASK_NAME' создана!"
echo "📝 Обновлены файлы: TASK.md, SHARED.md"
echo "🚀 Следующий шаг: PRODUCT_OWNER должен заполнить AC в SHARED.md"
