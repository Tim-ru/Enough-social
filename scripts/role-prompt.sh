#!/bin/bash

# Скрипт для генерации промптов для разных ролей агентов

if [ $# -eq 0 ]; then
    echo "Доступные роли:"
    echo "  product-owner, tech-lead, architect, manifest-specialist"
    echo "  implementer, security-auditor, qa-engineer, cross-browser-tester"
    echo "  devops, docs-writer, store-publisher, release-manager"
    echo ""
    echo "Использование: $0 <роль>"
    echo "Пример: $0 product-owner"
    exit 1
fi

ROLE="$1"

case $ROLE in
    "product-owner")
        echo "Как PRODUCT_OWNER, проанализируй требования в TASK.md и создай детальные Acceptance Criteria в SHARED.md. Учти потребности пользователей браузерного расширения для отслеживания времени."
        ;;
    "tech-lead")
        echo "Как TECH_LEAD, создай технический план в SHARED.md для реализации задачи из TASK.md. Учти архитектуру браузерного расширения, Service Worker, и принципы SOLID."
        ;;
    "architect")
        echo "Как ARCHITECT, спроектируй архитектуру решения в SHARED.md (секция ADR). Учти manifest v3, permissions, CSP, и паттерны для браузерных расширений."
        ;;
    "manifest-specialist")
        echo "Как MANIFEST_SPECIALIST, проверь и оптимизируй manifest.json, permissions, CSP. Обнови SHARED.md с рекомендациями по manifest v3 и безопасности."
        ;;
    "implementer")
        echo "Как IMPLEMENTER, реализуй функциональность согласно техническому плану. Следуй принципам SOLID, создай чистый поддерживаемый код. Обнови SHARED.md с ссылками на изменения."
        ;;
    "security-auditor")
        echo "Как SECURITY_AUDITOR, проведи аудит безопасности кода. Проверь на уязвимости, валидацию данных, CSP. Обнови SECURITY_LOG.md и SHARED.md с находками."
        ;;
    "qa-engineer")
        echo "Как QA_ENGINEER, создай тест-план для новой функциональности. Включи unit, integration, e2e тесты. Обнови TEST_PLAN.md и SHARED.md с результатами."
        ;;
    "cross-browser-tester")
        echo "Как CROSS_BROWSER_TESTER, протестируй расширение в Chrome, Firefox, Edge. Проверь API различия, совместимость. Обнови SHARED.md с результатами тестирования."
        ;;
    "devops")
        echo "Как DEVOPS, настрой CI/CD, автоматизацию сборки, деплой. Создай инструкции по запуску. Обнови SHARED.md с операционными деталями."
        ;;
    "docs-writer")
        echo "Как DOCS_WRITER, обнови README.md, документацию, инструкции по установке и использованию. Обнови SHARED.md с изменениями в документации."
        ;;
    "store-publisher")
        echo "Как STORE_PUBLISHER, подготовь расширение к публикации в Chrome Web Store. Проверь store guidelines, privacy policy. Обнови SHARED.md со статусом публикации."
        ;;
    "release-manager")
        echo "Как RELEASE_MANAGER, проверь все гейты качества, создай релиз. Обнови RELEASE_NOTES.md, версионирование. Обнови SHARED.md с информацией о релизе."
        ;;
    *)
        echo "Неизвестная роль: $ROLE"
        echo "Доступные роли: product-owner, tech-lead, architect, manifest-specialist, implementer, security-auditor, qa-engineer, cross-browser-tester, devops, docs-writer, store-publisher, release-manager"
        exit 1
        ;;
esac
