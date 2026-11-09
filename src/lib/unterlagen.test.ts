import { unterlageHinweis, unterlagenAufloesen, unterlagenFuerSprache } from './unterlagen';

describe('unterlagenFuerSprache', () => {
  const deutsch = [{ id: 'a', lang: 'de', visible: true }];

  it('blendet DE-Unterlagen ohne CTA aus (VP-A-008)', () => {
    expect(unterlagenFuerSprache(deutsch, 'en').map((eintrag) => eintrag.id)).toEqual([]);
    const mit = unterlagenAufloesen(deutsch, 'en', true);
    expect(mit.liste.map((eintrag) => eintrag.id)).toEqual(['a']);
    expect(unterlageHinweis('de', 'en')).toBe(true);
    expect(unterlageHinweis('en', 'en-US')).toBe(false);
  });

  it('erklaert Locale-Leerzustand vor deutschem CTA', () => {
    const leer = unterlagenAufloesen(deutsch, 'en', false);
    expect(leer.localeLeer).toBe(true);
    expect(leer.deutschVerfuegbar).toBe(true);
    expect(leer.liste).toEqual([]);
  });

  it('behält die passende Sprache, sobald sie vorkommt', () => {
    const gemischt = [
      { id: 'de', lang: 'de' },
      { id: 'en', lang: 'en' },
    ];
    expect(unterlagenFuerSprache(gemischt, 'en').map((eintrag) => eintrag.id)).toEqual(['en']);
  });
});
