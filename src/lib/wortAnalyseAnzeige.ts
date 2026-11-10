import { stammSegment, wortart, type Wortart } from '@/lib/grammatikKurz';
import type { MorphFeatures, MorphSegment, MorphWord } from '@/lib/morphologieTypen';
import type { Uebersetzer } from '@/lib/wortAnalyseKurz';

const RELATION_FAMILIE_RE = /^(\w+)\s*<<\s*(.+?)\s*>>$/;

export interface RelationBasis {
  basis: string;
  regens: string | null;
}

export function relationBasis(relation: string): RelationBasis {
  const treffer = RELATION_FAMILIE_RE.exec(relation);
  if (treffer) return { basis: treffer[1], regens: treffer[2] };
  return { basis: relation, regens: null };
}

export interface FragmentZeile {
  text: string;
  kindLabel: string;
  pos: string;
  merkmale: string[];
}

export interface SyntaxZeile {
  rolle: string;
  rolleAr: string;
  bezug: string | null;
}

export interface WortAnalyseAnzeige {
  arabisch: string;
  root: string | null;
  lemma: string;
  stemPos: string;
  wortart: Wortart | null;
  fragmente: FragmentZeile[];
  syntax: SyntaxZeile | null;
  stammMerkmale: string[];
}

const FEATURE_KEYS: (keyof MorphFeatures)[] = [
  'person',
  'gender',
  'number',
  'case',
  'state',
  'mood',
  'tense',
  'voice',
  'verbForm',
  'derivation',
];

function merkmalZeile(
  t: Uebersetzer,
  key: keyof MorphFeatures,
  wert: string | number,
): string | null {
  if (key === 'verbForm') {
    return t('reader.wordAnalysis.features.verbForm', { n: wert });
  }
  const schluessel = `reader.wordAnalysis.features.${key}.${wert}`;
  const text = t(schluessel);
  return text === schluessel ? null : text;
}

function segmentMerkmale(segment: MorphSegment, t: Uebersetzer): string[] {
  const zeilen: string[] = [];
  for (const key of FEATURE_KEYS) {
    const wert = segment.features[key];
    if (wert == null) continue;
    const zeile = merkmalZeile(t, key, wert);
    if (zeile) zeilen.push(zeile);
  }
  for (const key of segment.derived) {
    const name = t(`reader.wordAnalysis.featureKeys.${key}`);
    const label = name === `reader.wordAnalysis.featureKeys.${key}` ? key : name;
    zeilen.push(t('reader.wordAnalysis.legendDerived', { feature: label }));
  }
  return zeilen;
}

export function fragmentZeilen(word: MorphWord, t: Uebersetzer): FragmentZeile[] {
  return word.segments.map((segment) => ({
    text: segment.text,
    kindLabel: t(`reader.wordAnalysis.segmentKind.${segment.kind}`),
    pos: segment.pos,
    merkmale: segmentMerkmale(segment, t),
  }));
}

export function syntaxZeile(
  word: MorphWord,
  verseWords: MorphWord[] | undefined,
  t: Uebersetzer,
): SyntaxZeile | null {
  const syntax = word.syntax;
  if (!syntax) return null;

  const { basis, regens } = relationBasis(syntax.relation);
  const headWord =
    syntax.head != null ? verseWords?.find((w) => w.position === syntax.head) : undefined;
  const platzhalter = headWord?.text ?? regens ?? (syntax.head != null ? String(syntax.head) : '');

  let rolle: string;
  if (regens) {
    const muster = basis === 'pred' ? 'predOf' : 'subjOf';
    rolle = t(`reader.wordAnalysis.relations.${muster}`, { wort: platzhalter });
  } else {
    const schluessel = `reader.wordAnalysis.relations.${basis}`;
    const uebersetzt = t(schluessel);
    rolle =
      uebersetzt === schluessel
        ? t('reader.wordAnalysis.relations.fallback', {
            code: syntax.relation,
            ar: syntax.relationAr,
          })
        : uebersetzt;
  }

  let bezug: string | null = null;
  if (syntax.head != null && headWord) {
    bezug = t('reader.wordAnalysis.headWord', {
      position: syntax.head,
      text: headWord.text,
    });
  } else if (syntax.head != null) {
    bezug = t('reader.wordAnalysis.headPosition', { position: syntax.head });
  }

  return {
    rolle,
    rolleAr: syntax.relationAr,
    bezug,
  };
}

export function wortAnalyseAnzeige(
  morph: MorphWord | null,
  readerArabisch: string,
  verseWords: MorphWord[] | undefined,
  t: Uebersetzer,
): WortAnalyseAnzeige | null {
  if (!morph) return null;
  const stem = stammSegment(morph);
  return {
    arabisch: readerArabisch || morph.text,
    root: morph.root,
    lemma: morph.lemma,
    stemPos: stem?.pos ?? '',
    wortart: stem ? wortart(stem.pos) : null,
    fragmente: fragmentZeilen(morph, t),
    syntax: syntaxZeile(morph, verseWords, t),
    stammMerkmale: stem ? segmentMerkmale(stem, t) : [],
  };
}
