import { parseTvPdfBridgeInbound } from './pdfBridge';

describe('pdfBridge TV', () => {
  it('parst outline mit Seite', () => {
    const msg = parseTvPdfBridgeInbound(
      JSON.stringify({
        type: 'outline',
        items: [{ title: 'Kapitel 1', depth: 0, page: 3 }],
      }),
    );
    expect(msg?.type).toBe('outline');
    if (msg?.type === 'outline') {
      expect(msg.items[0]?.page).toBe(3);
    }
  });
});
