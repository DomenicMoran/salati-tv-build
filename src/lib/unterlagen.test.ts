import { unterlageHinweis, unterlagenFuerSprache } from './unterlagen';

describe('unterlagenFuerSprache', () => {
  const deutsch = [{ id: 'a', lang: 'de', visible: true }];

  it('zeigt deutsche Unterlagen, wenn die Oberfläche keine eigenen hat', () => {
    expect(unterlagenFuerSprache(deutsch, 'en').map((eintrag) => eintrag.id)).toEqual(['a']);
    expect(unterlageHinweis('de', 'en')).toBe(true);
    expect(unterlageHinweis('en', 'en-US')).toBe(false);
  });

  it('behält die passende Sprache, sobald sie vorkommt', () => {
    const gemischt = [
      { id: 'de', lang: 'de' },
      { id: 'en', lang: 'en' },
    ];
    expect(unterlagenFuerSprache(gemischt, 'en').map((eintrag) => eintrag.id)).toEqual(['en']);
  });
});
