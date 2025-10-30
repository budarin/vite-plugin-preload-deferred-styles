import type { Plugin } from 'vite';
import * as cheerio from 'cheerio';

export interface PreloadDeferredStylesOptions {
    // Опции будут добавлены в будущих версиях
}

/**
 * Модифицирует часть стиля, добавляя preload тег и изменяя атрибуты
 * Оптимизировано: все атрибуты считываются один раз, изменения применяются батчем
 */
function processStylesheet(
    $stylesheet: ReturnType<ReturnType<typeof cheerio.load>>
): {
    href: string;
    isModified: boolean;
} | null {
    // Кэшируем все атрибуты за один проход для избежания повторных DOM-запросов
    const href = $stylesheet.attr('href');

    // Исключаем инлайн стили (якорные ссылки)
    if (!href || href.startsWith('#')) {
        return null;
    }

    // Кэшируем проверку модификации (один раз читаем оба атрибута)
    const media = $stylesheet.attr('media');
    const onload = $stylesheet.attr('onload');
    const isModified = Boolean(media === 'print' && onload);

    return { href, isModified };
}

/**
 * Модифицирует HTML: перемещает стили перед первым внешним скриптом
 * и добавляет preload теги для предзагрузки стилей
 */
function modifyOriginalStyles(html: string): string {
    const $ = cheerio.load(html);

    // Находим все стили (link с rel="stylesheet")
    // Используем jQuery-подобный объект напрямую вместо .toArray() для лучшей производительности
    const $stylesheets = $('link[rel="stylesheet"]');

    if ($stylesheets.length === 0) {
        return html;
    }

    // Находим первый внешний скрипт (script с атрибутом src, НЕ инлайн скрипт)
    // Используем селектор script[src] чтобы сразу исключить инлайн скрипты
    // Инлайн скрипты не имеют атрибута src, поэтому селектор script[src] их не найдет
    const $externalScripts = $('script[src]');
    let $firstExternalScript: ReturnType<typeof $> | null = null;

    // Проверяем каждый скрипт с src, чтобы убедиться что src не пустой
    $externalScripts.each((_, element) => {
        const $script = $(element);
        const src = $script.attr('src');
        // Дополнительная проверка: src должен быть непустым
        // Это защита от случаев, когда src="" (пустая строка)
        if (src && src.trim() !== '') {
            $firstExternalScript = $script;
            return false; // прерываем цикл each, нашли первый валидный внешний скрипт
        }
    });

    // Если внешнего скрипта нет, модифицируем стили без перемещения
    if (!$firstExternalScript) {
        $stylesheets.each((_, element) => {
            const $stylesheet = $(element);
            const data = processStylesheet($stylesheet);

            if (!data || data.isModified) {
                return;
            }

            // Создаем preload тег (используем строку, но это все равно быстрее с кэшированием)
            const $preloadTag = $(
                `<link rel="preload" href="${data.href}" as="style" crossorigin>`
            );

            // Модифицируем стиль батчем (один вызов вместо двух)
            $stylesheet.attr({
                media: 'print',
                onload: "this.media='all'",
            });

            $stylesheet.before($preloadTag);
        });

        return $.html();
    }

    // Собираем все стили и их preload теги для перемещения
    const stylesToMove: Parameters<typeof $>[0][] = [];
    const $preloadsToMove: ReturnType<typeof $>[] = [];

    $stylesheets.each((_, element) => {
        const $stylesheet = $(element);
        const data = processStylesheet($stylesheet);

        if (!data) {
            return;
        }

        stylesToMove.push(element);

        // Проверяем наличие существующего preload
        let $preload: ReturnType<typeof $> | null = null;

        if (!data.isModified) {
            // Для немодифицированных стилей проверяем предыдущий элемент
            const $prev = $stylesheet.prev();
            if (
                $prev.length &&
                $prev.is('link[rel="preload"][as="style"]') &&
                $prev.attr('href') === data.href
            ) {
                $preload = $prev;
            }
        } else {
            // Для модифицированных стилей тоже проверяем
            const $prev = $stylesheet.prev();
            if ($prev.length && $prev.is('link[rel="preload"][as="style"]')) {
                $preload = $prev;
            }
        }

        if ($preload) {
            $preloadsToMove.push($preload);
        } else {
            // Создаем новый preload тег
            const $preloadTag = $(
                `<link rel="preload" href="${data.href}" as="style" crossorigin>`
            );
            $preloadsToMove.push($preloadTag);
        }

        // Модифицируем стиль только если еще не модифицирован (batch update)
        if (!data.isModified) {
            $stylesheet.attr({
                media: 'print',
                onload: "this.media='all'",
            });
        }
    });

    // Перемещаем все элементы в обратном порядке для сохранения правильной последовательности
    // cheerio автоматически удаляет элементы из старой позиции при перемещении
    // $firstExternalScript здесь гарантированно не null (если бы был null, мы бы вернулись выше)
    const $targetScript = $firstExternalScript as ReturnType<typeof $>;

    // Сначала перемещаем preload теги
    for (let i = $preloadsToMove.length - 1; i >= 0; i--) {
        $targetScript.before($preloadsToMove[i]);
    }

    // Затем перемещаем стили
    for (let i = stylesToMove.length - 1; i >= 0; i--) {
        $targetScript.before($(stylesToMove[i]));
    }

    return $.html();
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
