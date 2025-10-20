export const locales = ["en", "am", "ar"] as const;

export type Locale = (typeof locales)[number];

export type LocaleDictionary = {
    [key: string]: string | LocaleDictionary;
};

export const defaultLocale: Locale = "en";

const dictionaryLoaders: Record<Locale, () => Promise<LocaleDictionary>> = {
    en: () => import("@/languages/en").then((module) => module.default),
    am: () => import("@/languages/am").then((module) => module.default),
    ar: () => import("@/languages/ar").then((module) => module.default),
};

export async function getDictionary(locale: Locale): Promise<LocaleDictionary> {
    const loader = dictionaryLoaders[locale] ?? dictionaryLoaders[defaultLocale];
    return loader();
}

export function isLocale(value: string | undefined | null): value is Locale {
    return value != null && locales.includes(value as Locale);
}

export const localeLabels: Record<Locale, string> = {
    en: "English",
    am: "አማርኛ",
    ar: "العربية",
};
