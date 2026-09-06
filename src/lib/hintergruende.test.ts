import {
  HINTERGRUENDE,
  HINTERGRUND_BEREICHE,
  HINTERGRUND_SICHTBARKEIT_STANDARD,
  hintergrundBereichNameKey,
  hintergrundNameKey,
  istHintergrundId,
  medienId,
  medienIdLesen,
  normalizeHintergrundSichtbarkeit,
} from '@/lib/hintergruende';

/**
 * Die Kennung eines Motivs wird zu einem DATEINAMEN auf dem Geraet
 * (lib/hintergrundMedien.ts) und kommt aus einem Index im Netz. Deshalb steht
 * hier nicht nur, was erlaubt ist, sondern vor allem, was es nicht ist.
 */
describe('medienIdLesen', () => {
  it('liest eine gueltige Kennung', () => {
    expect(medienIdLesen('medium:kaaba-nacht')).toBe('kaaba-nacht');
    expect(medienIdLesen(medienId('tawaf'))).toBe('tawaf');
  });

  it('verwirft alles, was einen Pfad aufmachen koennte', () => {
    for (const boese of [
      'medium:../../geheim',
      'medium:a/b',
      'medium:a\\b',
      'medium:Kaaba',       // Grossbuchstaben sind nicht vorgesehen
      'medium:',
      'medium:' + 'a'.repeat(65),
      'kaaba-nacht',
      42,
      null,
      undefined,
    ]) {
      expect(medienIdLesen(boese)).toBeNull();
    }
  });
});

describe('istHintergrundId', () => {
  it('nimmt jeden gezeichneten Hintergrund', () => {
    for (const id of HINTERGRUENDE) expect(istHintergrundId(id)).toBe(true);
  });

  it('nimmt ein Motiv und verwirft Unbekanntes', () => {
    expect(istHintergrundId('medium:tawaf')).toBe(true);
    expect(istHintergrundId('bunt')).toBe(false);
    expect(istHintergrundId('medium:../x')).toBe(false);
  });
});

it('bildet fuer jeden gezeichneten Hintergrund einen Locale-Schluessel', () => {
  for (const id of HINTERGRUENDE) {
    expect(hintergrundNameKey(id)).toBe(`settings.background.${id}`);
  }
});

/**
 * Wo ein Foto/Video zusaetzlich zum Ruhebildschirm laufen darf
 * (Nutzerwunsch 2026-09-06). Die Voreinstellung ist der springende Punkt:
 * bestehende Nutzer duerfen nach einem Update nicht ploetzlich ein Motiv
 * hinter dem Startmenue oder dem Koran-Leser sehen, das sie nie eingestellt
 * haben.
 */
describe('normalizeHintergrundSichtbarkeit', () => {
  it('faellt ohne gespeicherten Wert auf „nur Ruhebildschirm" zurueck', () => {
    expect(normalizeHintergrundSichtbarkeit(undefined)).toEqual(HINTERGRUND_SICHTBARKEIT_STANDARD);
    expect(HINTERGRUND_SICHTBARKEIT_STANDARD.ruhebildschirm).toBe(true);
    expect(HINTERGRUND_SICHTBARKEIT_STANDARD.startmenue).toBe(false);
    expect(HINTERGRUND_SICHTBARKEIT_STANDARD.koran).toBe(false);
    expect(HINTERGRUND_SICHTBARKEIT_STANDARD.inhalte).toBe(false);
  });

  it('uebernimmt nur bekannte Bereiche mit boolschem Wert', () => {
    expect(
      normalizeHintergrundSichtbarkeit({ startmenue: true, koran: 'ja', fremderSchluessel: true }),
    ).toEqual({ ruhebildschirm: true, startmenue: true, koran: false, inhalte: false });
  });

  it('verwirft Muell', () => {
    for (const wert of [null, 'an', 42, []]) {
      expect(normalizeHintergrundSichtbarkeit(wert)).toEqual(HINTERGRUND_SICHTBARKEIT_STANDARD);
    }
  });
});

it('bildet fuer jeden Bereich einen Locale-Schluessel', () => {
  for (const bereich of HINTERGRUND_BEREICHE) {
    expect(hintergrundBereichNameKey(bereich)).toBe(`settings.bereiche.${bereich}`);
  }
});
