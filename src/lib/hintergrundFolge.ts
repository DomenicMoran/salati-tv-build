/** Wie mehrere Katalog-Motive nacheinander den Hintergrund fuellen. */

export type HintergrundFolge = 'fest' | 'reihe' | 'zufall';

export const HINTERGRUND_FOLGEN: readonly HintergrundFolge[] = ['fest', 'reihe', 'zufall'];

/** Ein Motiv bleibt so lange stehen, dass es als Bild lesbar ist und nicht flackert. */
export const FOLGE_TAKT_MS = 20_000;

export function istHintergrundFolge(wert: unknown): wert is HintergrundFolge {
  return wert === 'fest' || wert === 'reihe' || wert === 'zufall';
}

/**
 * Naechstes Motiv. Zufall springt nie auf dieselbe Kachel, solange es eine
 * zweite gibt — sonst wirkt „zufaellig" wie ein haengendes Bild.
 */
export function naechstesMotiv(
  index: number,
  anzahl: number,
  folge: HintergrundFolge,
  rand: () => number,
): number {
  if (anzahl <= 1) return 0;
  const hier = ((index % anzahl) + anzahl) % anzahl;
  if (folge === 'zufall') {
    const gezogen = Math.floor(rand() * anzahl);
    return gezogen === hier ? (hier + 1) % anzahl : gezogen;
  }
  return (hier + 1) % anzahl;
}
