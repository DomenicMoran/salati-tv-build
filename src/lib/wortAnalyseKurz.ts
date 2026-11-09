import { stammSegment, wortart, type Wortart } from '@/lib/grammatikKurz';
import type { MorphologieDatei, MorphWord } from '@/lib/morphologieTypen';

export type Uebersetzer = (key: string, vars?: Record<string, string | number>) => string;

export interface WortAnalyseKurz {
  arabisch: string;
  root: string | null;
  lemma: string;
  stemPos: string;
  wortart: Wortart | null;
}

/** Morph-Eintrag für Vers (1-basiert) und Wortposition (1-basiert). */
export function morphWortImVers(
  datei: MorphologieDatei | null | undefined,
  ayah: number,
  position: number,
): MorphWord | null {
  if (!datei) return null;
  const liste = datei.verses[String(ayah)];
  if (!liste) return null;
  return liste.find((w) => w.position === position) ?? null;
}

/** Alle Morph-Wörter eines Verses (1-basierter ayah-Schlüssel in der JSON). */
export function versWoerter(
  datei: MorphologieDatei | null | undefined,
  ayah: number,
): MorphWord[] | undefined {
  if (!datei) return undefined;
  return datei.verses[String(ayah)];
}

export function wortAnalyseKurz(
  morph: MorphWord | null,
  readerArabisch: string,
  t: Uebersetzer,
): WortAnalyseKurz | null {
  if (!morph) return null;
  const stem = stammSegment(morph);
  return {
    arabisch: readerArabisch || morph.text,
    root: morph.root,
    lemma: morph.lemma,
    stemPos: stem.pos,
    wortart: wortart(stem.pos),
  };
}

export function wortartLabel(wortartKey: Wortart | null, t: Uebersetzer): string {
  if (!wortartKey) return t('reader.wordAnalysis.wortarten.unknown');
  return t(`reader.wordAnalysis.wortarten.${wortartKey}`);
}
