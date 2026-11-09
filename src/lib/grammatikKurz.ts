// Minimale Wortart-Zuordnung (QAC-POS → Ism/Fiʿl/Harf) — Port der Handy-Logik
// (apps/mobile/src/features/quran/grammatik.ts), nur für die TV-Wortanalyse-MVP.
import type { MorphSegment } from '@/lib/morphologieTypen';

const ISM_TAGS = new Set(['N', 'PN', 'ADJ', 'PRON', 'DEM', 'REL', 'T', 'LOC', 'IMPN']);
const FIIL_TAGS = new Set(['V']);
const HARF_TAGS = new Set([
  'ACC',
  'AMD',
  'ANS',
  'AVR',
  'CAUS',
  'CERT',
  'CIRC',
  'COM',
  'COND',
  'CONJ',
  'DET',
  'EMPH',
  'EQ',
  'EXH',
  'EXL',
  'EXP',
  'FUT',
  'IMPV',
  'INC',
  'INL',
  'INT',
  'INTG',
  'NEG',
  'P',
  'PREV',
  'PRO',
  'PRP',
  'REM',
  'RES',
  'RET',
  'RSLT',
  'SUB',
  'SUP',
  'SUR',
  'VOC',
]);

export type Wortart = 'ism' | 'fiil' | 'harf';

export function wortart(pos: string): Wortart | null {
  if (ISM_TAGS.has(pos)) return 'ism';
  if (FIIL_TAGS.has(pos)) return 'fiil';
  if (HARF_TAGS.has(pos)) return 'harf';
  return null;
}

export function stammSegment(word: { segments: MorphSegment[] }): MorphSegment {
  return word.segments.find((s) => s.kind === 'stem') ?? word.segments[0];
}
