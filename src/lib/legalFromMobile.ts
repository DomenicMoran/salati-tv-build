import legal from '@/data/legal-from-mobile.json';
import type { Locale } from '@/lib/locale';

export type LegalDoc = 'datenschutz' | 'impressum';

type LegalBlock = Record<string, string>;

const byLocale = legal as Record<string, Record<LegalDoc, LegalBlock>>;

/** Same legal copy as the mobile app / salati.pro (synced JSON). */
export function legalBlock(locale: Locale, doc: LegalDoc): LegalBlock {
  return byLocale[locale]?.[doc] ?? byLocale.en?.[doc] ?? byLocale.de[doc];
}

export function legalText(locale: Locale, doc: LegalDoc, key: string): string {
  const block = legalBlock(locale, doc);
  return block[key] ?? key;
}
