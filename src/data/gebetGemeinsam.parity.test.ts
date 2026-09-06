/**
 * `src/data/gebetGemeinsam.ts` ist eine Spiegelkopie von
 * `apps/mobile/src/features/gebet-gemeinsam/daten.ts` — gleiche Begründung
 * wie bei `quranFonts.parity.test.ts`: apps/tv ist ein eigenes pnpm-Projekt,
 * ein Import über die App-Grenze wäre im Metro-Bundle nicht auflösbar.
 *
 * Warum ein Wächter: an dieser Datei hängen 13 religiöse Regeln mit
 * Sicherheitsgrad, Rechtsschule und Quellenbeleg sowie 5 Aufstellungs-
 * Diagramme. Läuft die Kopie auseinander, zeigt der Fernseher eine andere
 * Rechtsauskunft als das Handy — und niemand sähe es, bis jemand beide
 * Bildschirme nebeneinander hält.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const HANDY_DATEI = join(
  __dirname,
  '..',
  '..',
  '..',
  'mobile',
  'src',
  'features',
  'gebet-gemeinsam',
  'daten.ts',
);
const TV_DATEI = join(__dirname, 'gebetGemeinsam.ts');

/** Alles ab der ersten Nicht-Kommentarzeile — der Kopf darf sich unterscheiden. */
function rumpf(quelle: string): string {
  const zeilen = quelle.split(/\r?\n/);
  const start = zeilen.findIndex((z) => z.trim() !== '' && !z.trimStart().startsWith('//'));
  return zeilen.slice(start).join('\n').trimEnd();
}

describe('Datenmodell "Gemeinsam beten" stimmt mit der Handy-App überein', () => {
  // Die Standalone-Kopie der TV-App (eigenes Repo für den EAS-Build) hat keine
  // Handy-App daneben — dort ist nichts zu vergleichen.
  const vergleichbar = existsSync(HANDY_DATEI);

  (vergleichbar ? it : it.skip)('hat denselben Inhalt wie die Handy-Datei', () => {
    expect(rumpf(readFileSync(TV_DATEI, 'utf8'))).toBe(rumpf(readFileSync(HANDY_DATEI, 'utf8')));
  });

  it('weist in der Kopie auf den Ursprung hin', () => {
    expect(readFileSync(TV_DATEI, 'utf8')).toContain('SPIEGELKOPIE');
  });
});
