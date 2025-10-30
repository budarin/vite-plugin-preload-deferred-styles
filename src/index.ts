import type { Plugin } from 'vite';
import * as cheerio from 'cheerio';

export interface PreloadDeferredStylesOptions {
    // Опции будут добавлены в будущих версиях
}

function processStylesheet(
    $stylesheet: ReturnType<ReturnType<typeof cheerio.load>>
): {
    href: string;
    isModified: boolean;
} | null {
    const href = $stylesheet.attr('href');
    if (!href || href.startsWith('#')) {
        return null;
    }

    const media = $stylesheet.attr('media');
    const onload = $stylesheet.attr('onload');
    const isModified = Boolean(media === 'print' && onload);

    return { href, isModified };
}

function modifyOriginalStyles(html: string): string {
    const $ = cheerio.load(html);

    const $stylesheets = $('link[rel="stylesheet"]');

    if ($stylesheets.length === 0) {
        return html;
    }

    const $firstExternalScript = $('head script[type="module"][src]').first();

    // Общая функция: создать/найти preload, применить defer-атрибуты к стилю
    const getPreloadAndDefer = (
        $stylesheet: ReturnType<typeof $>,
        href: string,
        isModified: boolean
    ): ReturnType<typeof $> => {
        const $prev = $stylesheet.prev();
        const hasMatchingPreload =
            $prev.length &&
            $prev.is('link[rel="preload"][as="style"]') &&
            (!isModified || $prev.attr('href') === href);

        const $preload = hasMatchingPreload
            ? $prev
            : $(`<link rel="preload" href="${href}" as="style" crossorigin>`);

        if (!isModified) {
            $stylesheet.attr({
                media: 'print',
                onload: "this.media='all'",
            });
        }

        return $preload;
    };

    if ($firstExternalScript.length === 0) {
        const $firstStylesheet = $stylesheets.first();
        const $preloadsToInsert: ReturnType<typeof $>[] = [];

        $stylesheets.each((_, element) => {
            const $stylesheet = $(element);
            const data = processStylesheet($stylesheet);

            if (!data || data.isModified) {
                return;
            }

            const $preload = getPreloadAndDefer(
                $stylesheet,
                data.href,
                data.isModified
            );
            $preloadsToInsert.push($preload);
        });

        for (let i = 0; i < $preloadsToInsert.length; i++) {
            $firstStylesheet.before($preloadsToInsert[i]);
        }

        return $.html();
    }

    const stylesToMove: Parameters<typeof $>[0][] = [];
    const $preloadsToMove: ReturnType<typeof $>[] = [];

    $stylesheets.each((_, element) => {
        const $stylesheet = $(element);
        const data = processStylesheet($stylesheet);

        if (!data) {
            return;
        }

        const $preload = getPreloadAndDefer(
            $stylesheet,
            data.href,
            data.isModified
        );
        stylesToMove.push(element);
        $preloadsToMove.push($preload);
    });

    // Вставляем в обратном порядке, чтобы сохранить исходный порядок стилей
    // .before() вставляет перед указанным элементом, но после уже вставленных
    // Сначала все preload, затем все стили
    for (let i = $preloadsToMove.length - 1; i >= 0; i--) {
        $firstExternalScript.before($preloadsToMove[i]);
    }

    for (let i = stylesToMove.length - 1; i >= 0; i--) {
        $firstExternalScript.before($(stylesToMove[i]));
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
