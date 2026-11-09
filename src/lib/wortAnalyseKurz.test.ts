import type { MorphologieDatei } from '@/lib/morphologieTypen';
import { morphWortImVers, wortAnalyseKurz, wortartLabel } from '@/lib/wortAnalyseKurz';

const t = (key: string) => key;

const fixture: MorphologieDatei = {
  schema: 4,
  surah: 1,
  verses: {
    '1': [
      {
        position: 1,
        text: 'بِسْمِ',
        root: 'سمو',
        lemma: 'ٱسْم',
        segments: [
          {
            text: 'سْمِ',
            kind: 'stem',
            pos: 'N',
            features: {
              person: null,
              gender: 'm',
              number: 'sg',
              case: 'gen',
              state: 'definite',
              mood: null,
              tense: null,
              voice: null,
              verbForm: null,
              derivation: null,
            },
            derived: ['number', 'state'],
            raw: 'STEM|POS:N',
          },
        ],
      },
    ],
  },
};

describe('wortAnalyseKurz', () => {
  it('findet Morph-Wort an Position', () => {
    const w = morphWortImVers(fixture, 1, 1);
    expect(w?.root).toBe('سمو');
  });

  it('liefert Kurzanzeige mit Wortart', () => {
    const w = morphWortImVers(fixture, 1, 1);
    const kurz = wortAnalyseKurz(w, 'بِسْمِ', t);
    expect(kurz?.lemma).toBe('ٱسْم');
    expect(kurz?.stemPos).toBe('N');
    expect(wortartLabel(kurz?.wortart ?? null, t)).toBe('reader.wordAnalysis.wortarten.ism');
  });
});
