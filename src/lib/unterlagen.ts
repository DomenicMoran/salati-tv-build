export interface UnterlageZeile {
  lang?: string;
  visible?: boolean;
}

function sprachcode(wert: string): string {
  return wert.split(/[-_]/)[0];
}

/** Fehlen Unterlagen in der Oberflächensprache, bleiben die vorhandenen sichtbar. */
export function unterlagenFuerSprache<T extends UnterlageZeile>(liste: readonly T[], locale: string): T[] {
  const sichtbar = liste.filter((eintrag) => eintrag.visible !== false);
  const code = sprachcode(locale);
  const passend = sichtbar.filter((eintrag) => !eintrag.lang || sprachcode(eintrag.lang) === code);
  return passend.length > 0 ? passend : sichtbar;
}

export function unterlageHinweis(lang: string | undefined, locale: string): boolean {
  return !!lang && sprachcode(lang) !== sprachcode(locale);
}
