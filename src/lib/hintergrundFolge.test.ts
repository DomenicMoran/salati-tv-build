import { naechstesMotiv } from '@/lib/hintergrundFolge';

describe('naechstesMotiv', () => {
  it('geht in der Reihe im Kreis', () => {
    expect(naechstesMotiv(0, 4, 'reihe', () => 0)).toBe(1);
    expect(naechstesMotiv(3, 4, 'reihe', () => 0)).toBe(0);
  });

  it('bleibt bei einem einzelnen Motiv stehen', () => {
    expect(naechstesMotiv(0, 1, 'zufall', () => 0.9)).toBe(0);
    expect(naechstesMotiv(5, 0, 'reihe', () => 0)).toBe(0);
  });

  it('zieht im Zufall ein anderes Motiv', () => {
    expect(naechstesMotiv(1, 5, 'zufall', () => 0)).toBe(0);
    expect(naechstesMotiv(1, 5, 'zufall', () => 0.2)).toBe(2);
  });
});
