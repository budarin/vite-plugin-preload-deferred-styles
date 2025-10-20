# vite-plugin-preload-deferred-styles

[![npm version](https://img.shields.io/npm/v/@budarin/vite-plugin-preload-deferred-styles.svg)](https://www.npmjs.com/package/@budarin/vite-plugin-preload-deferred-styles)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Vite плагин для оптимизации загрузки стилей путем их предзагрузки и отложенного применения.

## 🚀 Описание

Этот плагин автоматически оптимизирует загрузку всех CSS файлов (внешних и локальных) **только в build режиме**, улучшая производительность вашего приложения:

1. **Находит все стили** на странице (кроме инлайн)
2. **Создает preload теги** для их предзагрузки
3. **Модифицирует оригинальные стили**, добавляя `media="print" onload="this.media='all'"` для отложенного применения

## 📦 Установка

```bash
# npm
npm install @budarin/vite-plugin-preload-deferred-styles

# yarn
yarn add @budarin/vite-plugin-preload-deferred-styles

# pnpm
pnpm add @budarin/vite-plugin-preload-deferred-styles
```

## 🛠 Использование

### Базовое использование

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { preloadDeferredStyles } from '@budarin/vite-plugin-preload-deferred-styles';

export default defineConfig({
    plugins: [preloadDeferredStyles()],
});
```

### Расширенная конфигурация

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { preloadDeferredStyles } from '@budarin/vite-plugin-preload-deferred-styles';

export default defineConfig({
    plugins: [
        preloadDeferredStyles({
            // Включить отладочные логи
            debug: true,
        }),
    ],
});
```

## ⚙️ Опции

| Опция   | Тип       | По умолчанию | Описание                 |
| ------- | --------- | ------------ | ------------------------ |
| `debug` | `boolean` | `false`      | Включить отладочные логи |

## 🔧 Как это работает

### Принцип работы

1. **Поиск всех стилей**: Плагин находит все `<link rel="stylesheet">` теги (внешние и локальные)
2. **Создание preload тегов**: Для каждого найденного стиля создается `<link rel="preload" as="style">` тег
3. **Модификация оригинальных стилей**: Оригинальные стили получают атрибуты `media="print" onload="this.media='all'"`

### Преимущества

- **Быстрая загрузка**: Стили начинают загружаться параллельно с HTML
- **Отложенное применение**: Стили применяются только после загрузки, не блокируя рендеринг
- **Универсальность**: Обрабатывает как внешние, так и локальные стили
- **Автоматическая оптимизация**: Не требует ручного вмешательства
- **Только в production**: Работает только в build режиме, не мешает разработке

### Режимы работы

- **Dev режим** (`npm run dev`): Плагин **НЕ работает** - стили загружаются как обычно
- **Build режим** (`npm run build`): Плагин **работает** - оптимизирует загрузку стилей

### Пример преобразования

**До:**

```html
<head>
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap"
    />
    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
    />
    <link rel="stylesheet" href="/local-styles.css" />
    <link rel="stylesheet" href="#inline-styles" />
</head>
```

**После:**

```html
<head>
    <!-- Preload теги для всех стилей -->
    <link
        rel="preload"
        href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap"
        as="style"
        onload="this.onload=null;this.rel='stylesheet'"
    />
    <link
        rel="preload"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
        as="style"
        onload="this.onload=null;this.rel='stylesheet'"
    />
    <link
        rel="preload"
        href="/local-styles.css"
        as="style"
        onload="this.onload=null;this.rel='stylesheet'"
    />

    <!-- Модифицированные оригинальные стили -->
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap"
        media="print"
        onload="this.media='all'"
    />
    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
        media="print"
        onload="this.media='all'"
    />
    <link
        rel="stylesheet"
        href="/local-styles.css"
        media="print"
        onload="this.media='all'"
    />

    <!-- Инлайн стили остаются без изменений -->
    <link rel="stylesheet" href="#inline-styles" />
</head>
```

## 🚫 Исключения

Плагин автоматически исключает:

- **Инлайн стили** (якорные ссылки, начинающиеся с `#`)

### Примеры исключений

```html
<!-- Исключается - инлайн стиль (якорная ссылка) -->
<link rel="stylesheet" href="#inline-styles" />
```

## 🐛 Отладка

Включите отладочные логи для мониторинга работы плагина:

```typescript
preloadDeferredStyles({
    debug: true,
});
```

В консоли вы увидите:

```
[vite-plugin-preload-deferred-styles] Processing HTML...
[vite-plugin-preload-deferred-styles] Found styles: [
  "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
  "/local-styles.css"
]
[vite-plugin-preload-deferred-styles] HTML processed successfully
```

## 📋 Требования

- **Vite**: >= 5.0.0
- **Node.js**: >= 16.0.0

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста:

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 👨‍💻 Автор

**Budarin Sergey**

- GitHub: [@budarin](https://github.com/budarin)

## 🙏 Благодарности

- [Vite](https://vitejs.dev/) - за отличный инструмент сборки
- Сообществу разработчиков за идеи и предложения

---

⭐ Если этот плагин помог вам, поставьте звезду!
Плагин vite для предзагрузки стилей и отложенного их применения после загрузки
