// Typen für Morphologie-JSON (Schema v4, QAC) — abgestimmt mit der Handy-Pipeline
// (apps/mobile/src/features/quran/morphologieTypen.ts).

export type MorphSegmentKind = 'prefix' | 'stem' | 'suffix';

export interface MorphFeatures {
  person: '1' | '2' | '3' | null;
  gender: 'm' | 'f' | null;
  number: 'sg' | 'du' | 'pl' | null;
  case: 'nom' | 'acc' | 'gen' | null;
  state: 'definite' | 'indefinite' | null;
  mood: 'ind' | 'sub' | 'juss' | null;
  tense: 'perfect' | 'imperfect' | 'imperative' | null;
  voice: 'active' | 'passive' | null;
  verbForm: number | null;
  derivation: 'activeParticiple' | 'passiveParticiple' | 'verbalNoun' | null;
}

export interface MorphSegment {
  text: string;
  kind: MorphSegmentKind;
  pos: string;
  features: MorphFeatures;
  derived: (keyof MorphFeatures)[];
  raw: string;
}

export interface MorphSyntax {
  relation: string;
  relationAr: string;
  head: number | null;
  headReason?: 'elided' | 'otherVerse' | 'none';
}

export interface MorphWord {
  position: number;
  text: string;
  root: string | null;
  lemma: string;
  segments: MorphSegment[];
  syntax?: MorphSyntax;
}

export type MorphVerses = Record<string, MorphWord[]>;

export interface MorphologieDatei {
  schema: number;
  surah: number;
  verses: MorphVerses;
}

export const MORPHOLOGIE_SCHEMA_VERSION = 4;
