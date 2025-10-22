'use client';

import { createContext, useCallback, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale, LocaleDictionary } from '@/lib/i18n';

type LocaleProviderProps = {
    locale: Locale;
    dictionary: LocaleDictionary;
    children: React.ReactNode;
};

type TranslationParams = Record<string, string | number | undefined> | undefined;

type LocaleContextValue = {
    locale: Locale;
    dictionary: LocaleDictionary;
    t: (key: string, params?: TranslationParams) => string;
    setLocale: (nextLocale: Locale) => void;
    isPending: boolean;
};

export const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function interpolate(template: string, params?: TranslationParams) {
    if (!params) return template;

    return template.replace(/\{\{(.*?)\}\}/g, (match, token) => {
        const key = token.trim();
        const value = params[key];
        if (value === undefined || value === null) {
            return match;
        }
        return String(value);
    });
}

function extractTranslation(dictionary: LocaleDictionary, key: string): string | null {
    const segments = key.split('.');
    let current: string | string[] | LocaleDictionary | undefined = dictionary;

    for (const segment of segments) {
        if (typeof current === 'object' && current !== null && !Array.isArray(current) && segment in current) {
            current = current[segment];
            continue;
        }
        return null;
    }

    return typeof current === 'string' ? current : null;
}

function LocaleProvider({ locale, dictionary, children }: LocaleProviderProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const translate = useCallback(
        (key: string, params?: TranslationParams) => {
            const resolved = extractTranslation(dictionary, key);
            if (!resolved) {
                return params?.defaultValue ? String(params.defaultValue) : key;
            }
            return interpolate(resolved, params);
        },
        [dictionary]
    );

    const setLocale = useCallback(
        (nextLocale: Locale) => {
            if (nextLocale === locale) return;

            if (typeof document !== 'undefined') {
                const direction = nextLocale === 'ar' ? 'rtl' : 'ltr';
                document.cookie = `locale=${nextLocale}; path=/; max-age=${COOKIE_MAX_AGE}; sameSite=Lax`;
                document.documentElement.setAttribute('lang', nextLocale);
                document.documentElement.setAttribute('dir', direction);
            }

            startTransition(() => {
                router.refresh();
            });
        },
        [locale, router, startTransition]
    );

    const value = useMemo<LocaleContextValue>(
        () => ({
            locale,
            dictionary,
            t: translate,
            setLocale,
            isPending,
        }),
        [dictionary, isPending, locale, setLocale, translate]
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export default LocaleProvider;
