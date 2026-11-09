import { istMorphologieGueltig, morphologieUrl } from '@/lib/morphologie';
import { MORPHOLOGIE_SCHEMA_VERSION } from '@/lib/morphologieTypen';

describe('morphologie', () => {
  it('URL traegt Schema v4', () => {
    expect(morphologieUrl(1)).toContain(`/v${MORPHOLOGIE_SCHEMA_VERSION}/1.json`);
  });

  it('validiert Schema und Sure', () => {
    expect(
      istMorphologieGueltig(
        { schema: MORPHOLOGIE_SCHEMA_VERSION, surah: 2, verses: { '1': [] } },
        2,
      ),
    ).toBe(true);
    expect(istMorphologieGueltig({ schema: 2, surah: 1, verses: { '1': [] } }, 1)).toBe(false);
  });
});
