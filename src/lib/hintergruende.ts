/**
 * Was hinter allen Bildschirmen liegen kann — als reine Werte, ohne Zeichnung.
 *
 * WARUM ES DIESE DATEI GIBT: Der Katalog stand bis 2026-08-30 in
 * `components/Hintergrund.tsx`, und `lib/settings.ts` holte sich `istHintergrundId`
 * von dort. Solange dieser Baustein nur SVG zeichnete, war das harmlos. Mit den
 * Foto- und Video-Hintergruenden zog derselbe Import plötzlich `expo-video`
 * und `expo-file-system` in JEDE Datei, die Einstellungen liest — bis in die
 * reinen Logik-Tests, die daran sofort scheiterten.
 *
 * Die Kennungen sind Daten, keine Darstellung. Hier stehen sie ohne einen
 * einzigen Import.
 */

export type GezeichneterHintergrund =
  | 'ruhig'
  | 'schein'
  | 'verlauf'
  | 'muster'
  | 'bewegt'
  | 'sterne'
  | 'kuppel';

/**
 * Gezeichnet oder ein Motiv aus dem Katalog (`medium:<id>`, s.
 * lib/hintergrundMedien.ts). EINE Einstellung fuer beides — zwei waeren zwei
 * Wahrheiten darueber, was gerade hinten liegt.
 */
export type HintergrundId = GezeichneterHintergrund | `medium:${string}`;

export const HINTERGRUENDE: readonly GezeichneterHintergrund[] = [
  'ruhig',
  'schein',
  'verlauf',
  'muster',
  'bewegt',
  'sterne',
  'kuppel',
];

/** Kennung eines Motivs in den Einstellungen. */
export function medienId(id: string): `medium:${string}` {
  return `medium:${id}`;
}

/**
 * Umgekehrt: `medium:kaaba-nacht` → `kaaba-nacht`; sonst `null`.
 *
 * Das Muster ist eng gefasst (Kleinbuchstaben, Ziffern, Bindestrich), und das
 * ist kein Schoenheitsgrund: aus der Kennung wird ein DATEINAME auf dem Geraet
 * gebildet. Ein `/` oder `..` darin waere ein Pfad in ein fremdes Verzeichnis.
 */
export function medienIdLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null;
  const treffer = /^medium:([a-z0-9-]{1,64})$/.exec(wert);
  return treffer ? treffer[1] : null;
}

export function istHintergrundId(v: unknown): v is HintergrundId {
  if (typeof v !== 'string') return false;
  if ((HINTERGRUENDE as readonly string[]).includes(v)) return true;
  return medienIdLesen(v) !== null;
}

/** Locale-Schluessel des Anzeigenamens eines gezeichneten Hintergrunds. */
export function hintergrundNameKey(id: GezeichneterHintergrund): string {
  return `settings.background.${id}`;
}

/**
 * Bereiche, in denen ein FOTO oder VIDEO zusaetzlich zum Ruhebildschirm
 * laufen darf — je einer an- oder abschaltbar (Nutzerwunsch 2026-09-06).
 *
 * GERAETEBEFUND, der die erste Fassung (2026-08-30) zurueckgenommen hat: mit
 * demselben Motiv hinter den EINSTELLUNGEN war der kleine Text kaum noch zu
 * lesen, und auf dem STARTMENUE verschwanden die Unterzeilen der Kacheln im
 * Gewimmel. `einstellungen` gehoert deshalb NICHT zu dieser Liste — dort war
 * der Text am schlechtesten lesbar, und die Einstellung selbst muss bedienbar
 * bleiben, um ein Motiv wieder abzuschalten. Die uebrigen Bereiche bekommen
 * die Wahl zurueck, aber nur zusammen mit dem festen Saum und dem zusaetzlichen
 * Schleier aus components/MedienGrund.tsx — ohne die waere es derselbe Fehler
 * noch einmal.
 */
export const HINTERGRUND_BEREICHE = ['ruhebildschirm', 'startmenue', 'koran', 'inhalte'] as const;
export type HintergrundBereich = (typeof HINTERGRUND_BEREICHE)[number];

/** Je Bereich: darf dort ein Foto/Video laufen? */
export type HintergrundSichtbarkeit = Record<HintergrundBereich, boolean>;

/**
 * Voreinstellung: NUR der Ruhebildschirm, alles andere aus.
 *
 * Das ist genau das Verhalten vor dieser Einstellung (`MOTIV_BILDSCHIRME`
 * kannte bis 2026-09-06 nur `'clock'`) — bestehende Nutzer sehen also nach
 * einem Update keine ungefragte Aenderung, sie koennen die neuen Bereiche nur
 * zusaetzlich EINSCHALTEN.
 */
export const HINTERGRUND_SICHTBARKEIT_STANDARD: HintergrundSichtbarkeit = {
  ruhebildschirm: true,
  startmenue: false,
  koran: false,
  inhalte: false,
};

export function normalizeHintergrundSichtbarkeit(v: unknown): HintergrundSichtbarkeit {
  const out = { ...HINTERGRUND_SICHTBARKEIT_STANDARD };
  if (typeof v !== 'object' || v === null) return out;
  const roh = v as Record<string, unknown>;
  for (const bereich of HINTERGRUND_BEREICHE) {
    if (typeof roh[bereich] === 'boolean') out[bereich] = roh[bereich];
  }
  return out;
}

/** Locale-Schluessel des Anzeigenamens eines Bereichs (Einstellungen). */
export function hintergrundBereichNameKey(bereich: HintergrundBereich): string {
  return `settings.bereiche.${bereich}`;
}
