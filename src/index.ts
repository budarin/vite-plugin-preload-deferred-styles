import type { Plugin } from 'vite';

export interface PreloadDeferredStylesOptions {
    /**
     * Включить отладочные логи (по умолчанию: false)
     */
    debug?: boolean;
}

/**
 * Создает preload тег для одного стиля
 */
function createPreloadTag(href: string): string {
    return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">`;
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

            // Создаем preload тег и вставляем его перед модифицированным стилем
            const preloadTag = createPreloadTag(href);
            return preloadTag + '\n' + modifiedMatch;
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

            // Модифицируем оригинальные стили и добавляем preload теги перед ними
            const modifiedHtml = modifyOriginalStyles(html, pluginOptions);

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
