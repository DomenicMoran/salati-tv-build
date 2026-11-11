import { legalBlock, legalText } from '@/lib/legalFromMobile';

describe('legalFromMobile', () => {
  it('liefert deutschen Datenschutz mit Kernsaetzen', () => {
    const block = legalBlock('de', 'datenschutz');
    expect(block.title).toContain('Datenschutz');
    expect(block.intro).toMatch(/kein Nutzerkonto|keine Registrierung/i);
    expect(legalText('de', 'datenschutz', 'legalBasisText')).toContain('Art. 6');
  });

  it('liefert Impressum in der gewaehlten Sprache', () => {
    expect(legalBlock('en', 'impressum').title.toLowerCase()).toContain('legal');
    expect(legalBlock('de', 'impressum').companyValue).toContain('Salatibox');
  });
});
