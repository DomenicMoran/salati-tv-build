import { SURAHS } from '@/data/surahs';
import { adaptQuranText, quranFontDef } from '@/lib/quranFonts';

/** Sure 3 (API-Name) enthaelt U+06E1 — KFGQPC rendert Sukun nur nach adaptQuranText. */
const SURAH3 = SURAHS.find((s) => s.n === 3)!;

describe('QuranArabicText (Surennamen)', () => {
  it('maps API surah-3 name for KFGQPC madina (U+06E1, kein Systemschrift-Tofu)', () => {
    const adapted = adaptQuranText(SURAH3.ar, quranFontDef('kfgqpc'), 'madina');
    expect(adapted).toContain('\u06e1');
    expect(adapted).not.toMatch(/\u064B|\u064F\u0652/); // kein rohes Sukun-Zeichen neben U+06E1-Pfad
  });
});
