// Morphologie je Sure von R2 (v4) — gleicher Bucket wie die Handy-App.
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { fetchWithTimeout } from '@/lib/content';
import {
  MORPHOLOGIE_SCHEMA_VERSION,
  type MorphologieDatei,
} from '@/lib/morphologieTypen';

const MORPHOLOGIE_BASIS_URL = `https://pub-d0489c0572704285af79896edb72cbed.r2.dev/morphologie/v${MORPHOLOGIE_SCHEMA_VERSION}`;

export function morphologieUrl(surah: number): string {
  return `${MORPHOLOGIE_BASIS_URL}/${surah}.json`;
}

function cacheVerzeichnis(): string {
  return `${FileSystem.documentDirectory ?? ''}morphologie/`;
}

function cachePfad(surah: number): string {
  return `${cacheVerzeichnis()}${surah}.json`;
}

function hatDateisystem(): boolean {
  return Platform.OS !== 'web' && !!FileSystem.documentDirectory;
}

export function istMorphologieGueltig(datei: unknown, surah: number): datei is MorphologieDatei {
  if (!datei || typeof datei !== 'object') return false;
  const d = datei as Partial<MorphologieDatei>;
  return (
    d.schema === MORPHOLOGIE_SCHEMA_VERSION &&
    d.surah === surah &&
    !!d.verses &&
    typeof d.verses === 'object' &&
    Object.keys(d.verses).length > 0
  );
}

async function ausCacheLesen(surah: number): Promise<MorphologieDatei | null> {
  if (!hatDateisystem()) return null;
  try {
    const info = await FileSystem.getInfoAsync(cachePfad(surah));
    if (!info.exists || (info.size ?? 0) <= 0) return null;
    const roh = await FileSystem.readAsStringAsync(cachePfad(surah));
    const datei = JSON.parse(roh) as unknown;
    if (!istMorphologieGueltig(datei, surah)) return null;
    return datei;
  } catch {
    await FileSystem.deleteAsync(cachePfad(surah), { idempotent: true }).catch(() => {});
    return null;
  }
}

async function inCacheSchreiben(surah: number, roh: string): Promise<void> {
  if (!hatDateisystem()) return;
  await FileSystem.makeDirectoryAsync(cacheVerzeichnis(), { intermediates: true }).catch(() => {});
  await FileSystem.writeAsStringAsync(cachePfad(surah), roh).catch(() => {});
}

const laufend = new Map<number, Promise<MorphologieDatei>>();

export function ladeMorphologie(surah: number): Promise<MorphologieDatei> {
  const bereits = laufend.get(surah);
  if (bereits) return bereits;

  const auftrag = (async (): Promise<MorphologieDatei> => {
    try {
      const zwischenstand = await ausCacheLesen(surah);
      if (zwischenstand) return zwischenstand;

      const r = await fetchWithTimeout(morphologieUrl(surah));
      if (!r.ok) throw new Error(`morphologie_${surah}_http_${r.status}`);
      const roh = await r.text();
      const datei = JSON.parse(roh) as unknown;
      if (!istMorphologieGueltig(datei, surah)) throw new Error(`morphologie_${surah}_ungueltig`);
      await inCacheSchreiben(surah, roh);
      return datei;
    } finally {
      laufend.delete(surah);
    }
  })();
  laufend.set(surah, auftrag);
  return auftrag;
}
