# vite-plugin-preload-deferred-styles

[![npm version](https://img.shields.io/npm/v/@budarin/vite-plugin-preload-deferred-styles.svg)](https://www.npmjs.com/package/@budarin/vite-plugin-preload-deferred-styles)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Vite плагин для предотвращения блокировки рендеринга стилями. Работает только в build режиме.

## ⚠️ Проблема

Современные веб-приложения часто генерируют страницы с важным контентом, который должен отображаться **мгновенно**. Однако при **медленном интернете** пользователи видят белый экран до полной загрузки всех CSS файлов, что критично влияет на пользовательский опыт.

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

**Результат:** Пользователи видят **белый экран** вместо контента, что особенно критично для:

- **SPA приложений** - контент не виден до инициализации JavaScript
- **Landing страниц** - потеря потенциальных клиентов
- **Новостных сайтов** - читатели уходят с сайта
- **E-commerce** - снижение конверсии

## ✅ Решение

Плагин автоматически оптимизирует загрузку стилей, позволяя контенту отображаться мгновенно:

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

**Результат:** Пользователи видят контент **мгновенно**, а стили подгружаются в фоне, что значительно улучшает пользовательский опыт!

## 🔧 Как работает

Плагин использует технику отложенной загрузки стилей:

1. **Сканирует HTML** и находит все внешние стили (исключая инлайн)
2. **Создает preload теги** для параллельной загрузки стилей
3. **Модифицирует оригинальные стили** добавляя `media="print" onload="this.media='all'"`

**Принцип:** Стили с `media="print"` не блокируют рендеринг, но после загрузки автоматически применяются к экрану.

> ⚠️ **Важно:** Плагин полезен только если загружаемые стили не участвуют в отображении контента, расположенного в HTML. Если стили критичны для первоначального отображения, их следует встроить инлайн.

## 🎯 Когда нужен плагин

- **SPA (Single Page Application)** - презентационный контент должен быть виден до инициализации JavaScript
- **Landing страницы** - важный контент должен быть виден сразу
- **Новостные сайты** - статьи должны загружаться мгновенно
- **E-commerce** - товары должны отображаться без задержек
- **Блоги** - текстовый контент должен быть доступен сразу

## ❌ Когда НЕ использовать

Плагин **НЕ подходит** если:

- **Критичные стили** - стили нужны для правильного отображения контента в HTML
- **Стили для "above the fold"** - стили для видимой части страницы
- **Базовые стили** - reset, normalize, основные стили документа
- **Стили для инлайн контента** - стили для контента, который должен быть стилизован сразу

**В таких случаях** используйте инлайн стили или критический CSS.

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

## 📄 Лицензия

MIT
