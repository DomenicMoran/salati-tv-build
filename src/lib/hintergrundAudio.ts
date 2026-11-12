import { useSyncExternalStore } from 'react';
import { createVideoPlayer, type VideoPlayer } from 'expo-video';

import {
  AUDIO_MIN_POSITION_SEC,
  flushAudioProgressNow,
  loadAudioProgressEntry,
  saveAudioProgress,
  type TvAudioProgressEntry,
  type TvAudioProgressKind,
} from '@/lib/audioProgress';

// Koran-Wiedergabe, die den Bildschirmwechsel ueberlebt.
//
// WARUM ES DIESE DATEI GIBT (Nutzerbefund 2026-08-16): der Ton haing an
// `useVideoPlayer()` INNERHALB von AudioNowPlaying, und dieser Baustein hing
// im Rezitatoren-Bildschirm. Wer zur Gebetsuhr wechselte, haengte damit den
// Spieler aus — die Rezitation brach mitten im Vers ab. Genau das, wofuer ein
// Fernseher da ist ("Koran laufen lassen, vorne die Uhr"), war nicht moeglich.
//
// Der Spieler liegt jetzt NEBEN dem Baum, nicht darin — dasselbe Muster wie
// lib/settings.ts und lib/pairing.ts, und aus demselben Grund: Zustand, der
// laenger lebt als ein Bildschirm, darf nicht an dessen Lebensdauer haengen.
//
// expo-video dient weiterhin als reine Ton-Maschine: es wird nie eine
// `VideoView` gemountet, der native ExoPlayer spielt trotzdem weiter.

export interface LaufendesStueck {
  uri: string;
  title: string;
  subtitle?: string;
  /** Uebersetzungs-Schluessel der Zeile ueber dem Titel (z. B. "Rezitation"). */
  kickerKey?: string;
  coverUrl?: string;
  loop: boolean;
  /** Woher es gestartet wurde — der Hinweis-Streifen verlinkt zurueck. */
  quelle: 'reciters' | 'radio' | 'podcasts' | 'quran' | 'audiobooks';
}

export interface AudioFortschrittRef {
  id: string;
  kind: TvAudioProgressKind;
  meta?: TvAudioProgressEntry['meta'];
}

interface Zustand {
  stueck: LaufendesStueck | null;
  spielt: boolean;
  /** 'loading' | 'readyToPlay' | 'error' — durchgereicht von expo-video. */
  status: string;
}

let spieler: VideoPlayer | null = null;
let zustand: Zustand = { stueck: null, spielt: false, status: 'idle' };
const hoerer = new Set<() => void>();
/**
 * Was am Ende des Stuecks geschehen soll.
 *
 * Gebraucht vom Koran-Leser (lib/leseSitzung.ts): ein Vers ist eine eigene
 * Datei, und wer die Sure hoert, will danach den naechsten Vers hoeren — auch
 * dann, wenn der Lese-Bildschirm gar nicht mehr offen ist. Genau daran
 * scheiterte es bisher: die Weiterschaltung hing im Bildschirm, also endete
 * die Rezitation beim Wechsel zur Uhr nach dem laufenden Vers.
 *
 * Ein Modul-Wert und kein Feld von `LaufendesStueck`: er gehoert zur
 * WIEDERGABE, nicht zur Beschreibung des Stuecks, und wird beim naechsten
 * `abspielen` ohnehin neu gesetzt.
 */
let beiEnde: (() => void) | null = null;
let fortschrittAktiv: AudioFortschrittRef | null = null;
let pendingSeekSec: number | null = null;
let persistTimer: ReturnType<typeof setInterval> | null = null;

function stopPersistTimer(): void {
  if (persistTimer) {
    clearInterval(persistTimer);
    persistTimer = null;
  }
}

function persistPositionNow(): void {
  if (!spieler || !fortschrittAktiv) return;
  try {
    const positionSec = spieler.currentTime ?? 0;
    const durationSec = spieler.duration ?? 0;
    void saveAudioProgress({
      kind: fortschrittAktiv.kind,
      id: fortschrittAktiv.id,
      positionSec,
      durationSec,
      meta: fortschrittAktiv.meta,
    });
  } catch {
    /* Spieler gerade freigegeben */
  }
}

function startPersistTimer(): void {
  stopPersistTimer();
  if (!fortschrittAktiv) return;
  persistTimer = setInterval(persistPositionNow, 5000);
}

function melden() {
  for (const h of [...hoerer]) h();
}

function abonnieren(h: () => void) {
  hoerer.add(h);
  return () => {
    hoerer.delete(h);
  };
}

function lesen(): Zustand {
  return zustand;
}

/** Der laufende Stand ausserhalb von React (lib/leseSitzung.ts fragt, ob das
 *  Stueck noch ihr eigenes ist). */
export function zustandLesen(): Zustand {
  return zustand;
}

/** Der laufende Stand. `null` bei `stueck` heisst: es laeuft nichts. */
export function useHintergrundAudio(): Zustand {
  return useSyncExternalStore(abonnieren, lesen, lesen);
}

/**
 * Der native Spieler — nur fuer den Vollbild-Baustein, der Fortschritt und
 * Lautstaerke braucht. Wer nur wissen will, was laeuft, nimmt den Haken oben.
 */
export function spielerHolen(): VideoPlayer | null {
  return spieler;
}

function spielerAufbauen(uri: string, loop: boolean): VideoPlayer {
  const p = createVideoPlayer(uri);
  p.loop = loop;
  p.addListener('playToEnd', () => beiEnde?.());
  p.addListener('playingChange', (e) => {
    zustand = { ...zustand, spielt: e.isPlaying };
    melden();
    if (e.isPlaying) startPersistTimer();
    else {
      stopPersistTimer();
      persistPositionNow();
      void flushAudioProgressNow();
    }
  });
  p.addListener('statusChange', (e) => {
    zustand = { ...zustand, status: e.status };
    melden();
    if (e.status === 'readyToPlay' && pendingSeekSec != null) {
      try {
        p.currentTime = pendingSeekSec;
      } catch {
        /* ignore */
      }
      pendingSeekSec = null;
    }
  });
  return p;
}

/**
 * Startet ein Stueck. Laeuft bereits dasselbe, passiert nichts — sonst
 * begaenne die Rezitation bei jedem Betreten des Bildschirms von vorn.
 */
export function abspielen(
  stueck: LaufendesStueck,
  optionen?: { beiEnde?: () => void; fortschritt?: AudioFortschrittRef },
): void {
  // Der Ende-Rueckruf gilt fuer die LAUFENDE Wiedergabe und wird deshalb auch
  // dann nachgezogen, wenn dieselbe Adresse weiterlaeuft.
  beiEnde = optionen?.beiEnde ?? null;
  if (spieler && zustand.stueck?.uri === stueck.uri) {
    // Gleiche Quelle: nur die Beschriftung nachziehen (z. B. anderer Titel
    // nach einem Sprachwechsel) und weiterlaufen lassen.
    if (optionen?.fortschritt) fortschrittAktiv = optionen.fortschritt;
    zustand = { ...zustand, stueck };
    melden();
    if (!zustand.spielt) spieler.play();
    return;
  }
  pendingSeekSec = null;
  fortschrittAktiv = optionen?.fortschritt ?? null;
  if (fortschrittAktiv) {
    void loadAudioProgressEntry(fortschrittAktiv.id).then((entry) => {
      if (!entry || entry.positionSec < AUDIO_MIN_POSITION_SEC) return;
      pendingSeekSec = entry.positionSec;
      if (spieler && zustand.stueck?.uri === stueck.uri && zustand.status === 'readyToPlay') {
        try {
          spieler.currentTime = pendingSeekSec;
        } catch {
          /* ignore */
        }
        pendingSeekSec = null;
      }
    });
  }
  spieler?.release();
  stopPersistTimer();
  spieler = spielerAufbauen(stueck.uri, stueck.loop);
  zustand = { stueck, spielt: false, status: 'loading' };
  melden();
  spieler.play();
}

export function umschalten(): void {
  if (!spieler) return;
  if (zustand.spielt) spieler.pause();
  else spieler.play();
}

/**
 * Dasselbe Stueck noch einmal von vorn.
 *
 * Fuer „Vers wiederholen" (lib/leseSitzung.ts): am Ende der Datei steht der
 * Spieler auf der letzten Sekunde, ein blosses `play()` wuerde also nichts
 * mehr abspielen.
 */
export function vonVorn(): void {
  if (!spieler) return;
  try {
    spieler.currentTime = 0;
    spieler.play();
  } catch {
    /* ein Spieler, der gerade freigegeben wurde, darf hier nichts reissen */
  }
}

export function pausieren(): void {
  if (zustand.spielt) spieler?.pause();
}

/** Beendet die Wiedergabe und gibt den Spieler frei. */
export function beenden(): void {
  beiEnde = null;
  stopPersistTimer();
  persistPositionNow();
  void flushAudioProgressNow();
  fortschrittAktiv = null;
  pendingSeekSec = null;
  spieler?.release();
  spieler = null;
  zustand = { stueck: null, spielt: false, status: 'idle' };
  melden();
}

/** Nur fuer Tests: setzt alles auf den Ausgangszustand zurueck. */
export function zuruecksetzenFuerTest(): void {
  beiEnde = null;
  fortschrittAktiv = null;
  pendingSeekSec = null;
  stopPersistTimer();
  spieler = null;
  zustand = { stueck: null, spielt: false, status: 'idle' };
  hoerer.clear();
}
