import type { Plugin } from 'vite';

export interface PreloadDeferredStylesOptions {
    // Опции будут добавлены в будущих версиях
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
function modifyOriginalStyles(html: string): string {
    return html.replace(
        /<link([^>]*?)rel\s*=\s*["']stylesheet["']([^>]*?)>/gi,
        (match) => {
            // Извлекаем href одним regex
            const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
            if (!hrefMatch) return match;

            const href = hrefMatch[1];

            // Исключаем инлайн стили (якорные ссылки)
            if (href.startsWith('#')) return match;

            // Проверяем, не модифицирован ли уже этот стиль (одна проверка)
            if (match.includes('media="print"') && match.includes('onload=')) {
                return match;
            }

            // Создаем preload тег
            const preloadTag = createPreloadTag(href);

            // Модифицируем стиль одним replace
            const modifiedMatch = match
                .replace(
                    /rel\s*=\s*["']stylesheet["']/,
                    'rel="stylesheet" media="print"'
                )
                .replace(/>$/, ' onload="this.media=\'all\'">');

            return preloadTag + '\n' + modifiedMatch;
        }
    );
}

/**
 * Vite плагин для предзагрузки и отложенного применения стилей
 */
export function preloadDeferredStyles(): Plugin {
    return {
        name: 'vite-plugin-preload-deferred-styles',
        apply: 'build',
        transformIndexHtml(html: string) {
            return modifyOriginalStyles(html);
        },
    };
}

export default preloadDeferredStyles;
