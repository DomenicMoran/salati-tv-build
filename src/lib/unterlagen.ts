export interface UnterlageZeile {
  lang?: string;
  visible?: boolean;
  licenseStatus?: 'cleared' | 'pending';
}

export type UnterlagenAufloesung<T extends UnterlageZeile> = {
  liste: T[];
  localeLeer: boolean;
  deutschVerfuegbar: boolean;
};

function unterlageLizenzOk(eintrag: UnterlageZeile): boolean {
  return eintrag.licenseStatus !== 'pending';
}

function sprachcode(wert: string): string {
  return wert.split(/[-_]/)[0];
}

const DEFAULT_INHALT = 'de';

function sichtbareUnterlagen<T extends UnterlageZeile>(liste: readonly T[]): T[] {
  return liste.filter((eintrag) => eintrag.visible !== false && unterlageLizenzOk(eintrag));
}

function indexFuehrtLang<T extends UnterlageZeile>(liste: readonly T[]): boolean {
  return liste.some((eintrag) => typeof eintrag.lang === 'string' && eintrag.lang.trim() !== '');
}

function nachSprache<T extends UnterlageZeile>(liste: readonly T[], locale: string): T[] {
  const code = sprachcode(locale);
  return liste.filter((eintrag) => sprachcode(eintrag.lang ?? DEFAULT_INHALT) === code);
}

/**
 * Strikte Locale-Filterung mit optionalem deutschen Fallback (VP-A-008).
 */
export function unterlagenAufloesen<T extends UnterlageZeile>(
  liste: readonly T[],
  locale: string,
  deutscheZeigen: boolean,
): UnterlagenAufloesung<T> {
  const sichtbar = sichtbareUnterlagen(liste);
  if (!indexFuehrtLang(sichtbar)) {
    return { liste: sichtbar, localeLeer: false, deutschVerfuegbar: false };
  }
  const passend = nachSprache(sichtbar, locale);
  if (passend.length > 0) {
    return { liste: passend, localeLeer: false, deutschVerfuegbar: false };
  }
  const deutsch = nachSprache(sichtbar, DEFAULT_INHALT);
  const deutschVerfuegbar = deutsch.length > 0;
  if (deutscheZeigen && deutschVerfuegbar) {
    return { liste: deutsch, localeLeer: false, deutschVerfuegbar: true };
  }
  return { liste: [], localeLeer: sichtbar.length > 0, deutschVerfuegbar };
}

/** Nur passende Sprache (ohne Fallback). */
export function unterlagenFuerSprache<T extends UnterlageZeile>(liste: readonly T[], locale: string): T[] {
  return unterlagenAufloesen(liste, locale, false).liste;
}

export function unterlageHinweis(lang: string | undefined, locale: string): boolean {
  return !!lang && sprachcode(lang) !== sprachcode(locale);
}
