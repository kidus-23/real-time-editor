'use client';

import { useContext } from 'react';
import { LocaleContext } from '@/components/LocaleProvider';
import type { Locale } from '@/lib/i18n';

type TranslationParams = Record<string, string | number | undefined> | undefined;

type TranslationHook = {
    locale: Locale;
    t: (key: string, params?: TranslationParams) => string;
    setLocale: (nextLocale: Locale) => void;
    isPending: boolean;
};

export function useTranslation(): TranslationHook {
    const context = useContext(LocaleContext);

    if (!context) {
        throw new Error('useTranslation must be used within a LocaleProvider');
    }

    return {
        locale: context.locale,
        t: context.t,
        setLocale: context.setLocale,
        isPending: context.isPending,
    };
}
