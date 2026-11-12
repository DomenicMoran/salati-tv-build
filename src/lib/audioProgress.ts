import AsyncStorage from '@react-native-async-storage/async-storage';

/** Gleicher Speicher wie Mobile (`features/progress/`) — TV-Parität Reader-Audio-Restschluss. */

export const AUDIO_PROGRESS_STORAGE_KEY = 'salatibox:progress:v1:audio';

export const AUDIO_NEAR_END_RATIO = 0.95;
export const AUDIO_MIN_POSITION_SEC = 5;

export type TvAudioProgressKind = 'podcast' | 'audiobook' | 'quran-listen';

export interface TvAudioProgressEntry {
  kind: TvAudioProgressKind;
  id: string;
  positionSec: number;
  durationSec: number;
  updatedAt: number;
  completedAt?: number;
  meta?: {
    reciter?: string;
    surah?: number;
    ayah?: number;
    chapterNo?: number;
    track?: string;
    lang?: string;
    episodeNo?: number;
  };
}

export type TvAudioProgressMap = Record<string, TvAudioProgressEntry>;

function isAudioMap(value: unknown): value is TvAudioProgressMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEntry(value: unknown): TvAudioProgressEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  const kind = o.kind;
  const id = o.id;
  const positionSec = o.positionSec;
  const durationSec = o.durationSec;
  const updatedAt = o.updatedAt;
  if (
    (kind !== 'podcast' && kind !== 'audiobook' && kind !== 'quran-listen') ||
    typeof id !== 'string' ||
    typeof positionSec !== 'number' ||
    typeof durationSec !== 'number' ||
    typeof updatedAt !== 'number'
  ) {
    return null;
  }
  const meta = o.meta;
  const completedAt = o.completedAt;
  return {
    kind,
    id,
    positionSec,
    durationSec,
    updatedAt,
    completedAt: typeof completedAt === 'number' ? completedAt : undefined,
    meta:
      meta && typeof meta === 'object' && !Array.isArray(meta)
        ? (meta as TvAudioProgressEntry['meta'])
        : undefined,
  };
}

export function parseAudioProgressMap(raw: string | null): TvAudioProgressMap {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isAudioMap(parsed)) return {};
    const out: TvAudioProgressMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      const entry = parseEntry(v);
      if (entry) out[k] = entry;
    }
    return out;
  } catch {
    return {};
  }
}

async function readMap(): Promise<TvAudioProgressMap> {
  return parseAudioProgressMap(await AsyncStorage.getItem(AUDIO_PROGRESS_STORAGE_KEY).catch(() => null));
}

async function writeMap(map: TvAudioProgressMap): Promise<void> {
  await AsyncStorage.setItem(AUDIO_PROGRESS_STORAGE_KEY, JSON.stringify(map)).catch(() => {});
}

let memoryMap: TvAudioProgressMap | null = null;
let hydrated = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_MS = 5000;

async function ensureHydrated(): Promise<TvAudioProgressMap> {
  if (hydrated && memoryMap) return memoryMap;
  memoryMap = await readMap();
  hydrated = true;
  return memoryMap;
}

function scheduleFlush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushAudioProgressNow();
  }, FLUSH_MS);
}

export async function flushAudioProgressNow(): Promise<void> {
  if (!hydrated || !memoryMap) return;
  await writeMap(memoryMap);
}

export async function loadAudioProgressEntry(id: string): Promise<TvAudioProgressEntry | null> {
  const map = await ensureHydrated();
  return map[id] ?? null;
}

export type SaveAudioProgressInput = Omit<TvAudioProgressEntry, 'updatedAt'> & { updatedAt?: number };

export async function saveAudioProgress(input: SaveAudioProgressInput): Promise<void> {
  const map = await ensureHydrated();
  const now = input.updatedAt ?? Date.now();
  const duration = input.durationSec;
  const position = input.positionSec;
  const done = duration > 0 && position / duration >= AUDIO_NEAR_END_RATIO;
  const key = input.id;

  if (done) {
    map[key] = {
      ...input,
      positionSec: 0,
      updatedAt: now,
      completedAt: map[key]?.completedAt ?? now,
    };
    scheduleFlush();
    return;
  }

  if (!Number.isFinite(position) || position < AUDIO_MIN_POSITION_SEC) {
    const prev = map[key];
    if (prev?.completedAt) {
      map[key] = { ...input, positionSec: 0, updatedAt: now, completedAt: prev.completedAt };
      scheduleFlush();
    }
    return;
  }

  map[key] = { ...input, updatedAt: now, completedAt: map[key]?.completedAt };
  scheduleFlush();
}

export function podcastProgressId(episodeNo: number): string {
  return `podcast:${episodeNo}`;
}

export function audiobookProgressId(track: string, chapterNo: number, lang: string): string {
  return `audiobook:${track}:${chapterNo}:${lang}`;
}

export function quranListenProgressId(surah: number, reciter: string): string {
  return `quran-listen:${surah}:${reciter}`;
}
