import type { Plugin } from 'vite';

export interface PreloadDeferredStylesOptions {
    /**
     * Включить отладочные логи (по умолчанию: false)
     */
    debug?: boolean;
}

/**
 * Находит все стили в HTML и создает для них preload теги
 */
function findStyles(
    html: string,
    options: PreloadDeferredStylesOptions
): string[] {
    const {} = options;

    // Создаем регулярное выражение для поиска link тегов со стилями
    const linkRegex = /<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi;
    const styles: string[] = [];

    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const linkTag = match[0];

        // Проверяем, что это внешний стиль (имеет href)
        const hrefMatch = linkTag.match(/href\s*=\s*["']([^"']+)["']/i);
        if (!hrefMatch) continue;

        const href = hrefMatch[1];

        // Исключаем только инлайн стили (якорные ссылки)
        if (href.startsWith('#')) continue;

        styles.push(href);
    }

    return styles;
}

/**
 * Создает preload теги для стилей
 */
function createPreloadTags(styles: string[]): string {
    return styles
        .map(
            (href) =>
                `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">`
        )
        .join('\n');
}

/**
 * Модифицирует оригинальные стили, добавляя media="print" onload="this.media='all'"
 */
function modifyOriginalStyles(
    html: string,
    options: PreloadDeferredStylesOptions
): string {
    const {} = options;

    return html.replace(
        /<link([^>]*?)rel\s*=\s*["']stylesheet["']([^>]*?)>/gi,
        (match) => {
            // Проверяем, что это внешний стиль
            const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
            if (!hrefMatch) return match;

            const href = hrefMatch[1];

            // Исключаем только инлайн стили (якорные ссылки)
            if (href.startsWith('#')) return match;

            // Проверяем, не модифицирован ли уже этот стиль
            if (match.includes('media="print"') && match.includes('onload='))
                return match;

            // Добавляем атрибуты для отложенной загрузки
            let modifiedMatch = match;

            // Добавляем media="print"
            if (!match.includes('media=')) {
                modifiedMatch = modifiedMatch.replace(
                    /rel\s*=\s*["']stylesheet["']/,
                    'rel="stylesheet" media="print"'
                );
            } else {
                modifiedMatch = modifiedMatch.replace(
                    /media\s*=\s*["'][^"']*["']/,
                    'media="print"'
                );
            }

            // Добавляем onload="this.media='all'"
            if (!match.includes('onload=')) {
                modifiedMatch = modifiedMatch.replace(
                    />$/,
                    ' onload="this.media=\'all\'">'
                );
            }

            return modifiedMatch;
        }
    );
}

/**
 * Vite плагин для предзагрузки и отложенного применения стилей
 */
export function preloadDeferredStyles(
    options: PreloadDeferredStylesOptions = {}
): Plugin {
    const { debug = false, ...pluginOptions } = options;

    return {
        name: 'vite-plugin-preload-deferred-styles',
        apply: 'build',

        transformIndexHtml(html: string) {
            if (debug) {
                console.log(
                    '[vite-plugin-preload-deferred-styles] Processing HTML...'
                );
            }

            // Находим все стили (кроме инлайн)
            const styles = findStyles(html, pluginOptions);

            if (debug) {
                console.log(
                    '[vite-plugin-preload-deferred-styles] Found styles:',
                    styles
                );
            }

            if (styles.length === 0) {
                return html;
            }

            // Создаем preload теги
            const preloadTags = createPreloadTags(styles);

            // Модифицируем оригинальные стили
            let modifiedHtml = modifyOriginalStyles(html, pluginOptions);

            // Добавляем preload теги в head
            if (modifiedHtml.includes('<head>')) {
                modifiedHtml = modifiedHtml.replace(
                    /<head>/i,
                    `<head>\n${preloadTags}`
                );
            } else if (modifiedHtml.includes('<html>')) {
                modifiedHtml = modifiedHtml.replace(
                    /<html[^>]*>/i,
                    `$&\n<head>\n${preloadTags}\n</head>`
                );
            } else {
                // Если нет head, добавляем в начало документа
                modifiedHtml = `<head>\n${preloadTags}\n</head>\n${modifiedHtml}`;
            }

            if (debug) {
                console.log(
                    '[vite-plugin-preload-deferred-styles] HTML processed successfully'
                );
            }

            return modifiedHtml;
        },
    };
}

export default preloadDeferredStyles;
