import fixtureRoh from '../../../mobile/src/features/quran/__fixtures__/morphologie-1.json';

import type { MorphologieDatei } from '@/lib/morphologieTypen';
import {
  fragmentZeilen,
  relationBasis,
  syntaxZeile,
  wortAnalyseAnzeige,
} from '@/lib/wortAnalyseAnzeige';
import { morphWortImVers } from '@/lib/wortAnalyseKurz';

const t = (key: string, vars?: Record<string, string | number>) => {
  let s = key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(`{${k}}`, String(v));
    }
  }
  return s;
};

// Fixture ist Schema 2, Struktur der Wörter/Segmente wie v4 — Tests brauchen nur verses.
const fixture = fixtureRoh as unknown as MorphologieDatei;

describe('wortAnalyseAnzeige', () => {
  it('zerlegt kaana-Familien-Relationen', () => {
    expect(relationBasis('pred <<kan>>')).toEqual({ basis: 'pred', regens: 'kan' });
    expect(relationBasis('conj')).toEqual({ basis: 'conj', regens: null });
  });

  it('liefert Fragmente in Lesereihenfolge', () => {
    const w = morphWortImVers(fixture, 1, 1);
    expect(w).not.toBeNull();
    const zeilen = fragmentZeilen(w!, t);
    expect(zeilen.map((z) => z.text)).toEqual(['بِ', 'سْمِ']);
    expect(zeilen[0].pos).toBe('P');
    expect(zeilen[1].merkmale.filter((m) => m.includes('legendDerived'))).toHaveLength(2);
  });

  it('zeigt Satzrolle mit Bezugswort', () => {
    const liste = fixture.verses['1']!;
    const w = liste.find((x) => x.position === 2)!;
    const syntax = syntaxZeile(w, liste, t);
    expect(syntax?.rolleAr).toBe('مضاف إليه');
    expect(syntax?.bezug).not.toBeNull();
    expect(w.syntax?.head).toBe(1);
  });

  it('baut Vollanzeige für Stamm-Merkmale', () => {
    const w = morphWortImVers(fixture, 1, 2);
    const voll = wortAnalyseAnzeige(w, 'ٱللَّهِ', fixture.verses['1'], t);
    expect(voll?.fragmente).toHaveLength(1);
    expect(voll?.stammMerkmale.length).toBeGreaterThan(0);
    expect(voll?.syntax).not.toBeNull();
  });
});
