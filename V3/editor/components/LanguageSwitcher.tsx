'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { locales, localeLabels, type Locale } from '@/lib/i18n';

function LanguageSwitcher() {
    const { locale, setLocale, t, isPending } = useTranslation();

    const handleChange = (next: string) => {
        setLocale(next as Locale);
    };

    return (
        <Select value={locale} onValueChange={handleChange} disabled={isPending}>
            <SelectTrigger className="w-[140px]" aria-label={t('languageSwitcher.button')}>
                <SelectValue placeholder={t('languageSwitcher.button')} />
            </SelectTrigger>
            <SelectContent>
                {locales.map((code) => (
                    <SelectItem key={code} value={code}>
                        {localeLabels[code]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default LanguageSwitcher;
