# vite-plugin-preload-deferred-styles

[![npm version](https://img.shields.io/npm/v/@budarin/vite-plugin-preload-deferred-styles.svg)](https://www.npmjs.com/package/@budarin/vite-plugin-preload-deferred-styles)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Vite плагин для предотвращения блокировки рендеринга стилями. Работает только в build режиме.

## ⚠️ Проблема

Когда HTML содержит стилизованный контент, который должен отображаться **мгновенно**, возникает проблема:

**Любые стили блокируют отображение контента** до полной загрузки всех CSS файлов!

Особенно критично для **SPA** - пользователь видит белый экран до инициализации JavaScript!

### Что происходит без плагина:

```html
<head>
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Roboto"
    />
    <link rel="stylesheet" href="/bootstrap.css" />
    <link rel="stylesheet" href="/main.css" />
</head>
<body>
    <h1>Важная информация</h1>
    <!-- НЕ ВИДНА до загрузки стилей! -->
</body>
```

**Результат:** Пользователь видит **белый экран** до полной загрузки стилей!

## ✅ Решение

Плагин автоматически преобразует код:

### До:

```html
<head>
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Roboto"
    />
    <link rel="stylesheet" href="/main.css" />
</head>
<body>
    <h1>Важная информация</h1>
    <!-- НЕ ВИДНА -->
</body>
```

### После:

```html
<head>
    <!-- Preload тег перед каждым стилем -->
    <link
        rel="preload"
        href="https://fonts.googleapis.com/css2?family=Roboto"
        as="style"
        onload="this.onload=null;this.rel='stylesheet'"
    />
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Roboto"
        media="print"
        onload="this.media='all'"
    />

    <link
        rel="preload"
        href="/main.css"
        as="style"
        onload="this.onload=null;this.rel='stylesheet'"
    />
    <link
        rel="stylesheet"
        href="/main.css"
        media="print"
        onload="this.media='all'"
    />
</head>
<body>
    <h1>Важная информация</h1>
    <!-- ВИДНА СРАЗУ! -->
</body>
```

**Результат:** Контент отображается **мгновенно**, стили подгружаются в фоне!

## 🎯 Когда нужен плагин

- **SPA (Single Page Application)** - презентационный контент должен быть виден до инициализации JavaScript
- **Landing страницы** - важный контент должен быть виден сразу
- **Новостные сайты** - статьи должны загружаться мгновенно
- **E-commerce** - товары должны отображаться без задержек
- **Блоги** - текстовый контент должен быть доступен сразу

## 📦 Установка

```bash
npm install @budarin/vite-plugin-preload-deferred-styles
```

## 🛠 Использование

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { preloadDeferredStyles } from '@budarin/vite-plugin-preload-deferred-styles';

export default defineConfig({
    plugins: [preloadDeferredStyles()],
});
```

## ⚙️ Опции

| Опция   | Тип       | По умолчанию | Описание                 |
| ------- | --------- | ------------ | ------------------------ |
| `debug` | `boolean` | `false`      | Включить отладочные логи |

## 🔧 Как работает

1. **Находит все стили** (кроме инлайн `#`)
2. **Создает preload теги** для параллельной загрузки
3. **Добавляет `media="print" onload="this.media='all'"`** к оригинальным стилям

**Результат:** Контент отображается мгновенно, стили подгружаются в фоне.

## 🚫 Исключения

- Инлайн стили (`<style>...</style>` и `href="#inline-styles"`)

### Примеры исключений:

```html
<!-- Исключается - тег style -->
<style>
    body {
        margin: 0;
    }
</style>

<!-- Исключается - якорная ссылка -->
<link rel="stylesheet" href="#inline-styles" />
```

## 📋 Требования

- Vite >= 5.0.0
- Node.js >= 16.0.0

## 📄 Лицензия

MIT
