import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  LESEFORTSCHRITT_STORAGE_KEY,
  parseLesefortschritt,
  serializeLesefortschritt,
  type Lesefortschritt,
} from '@/features/bibliothek/lesefortschritt';

import { AudioNowPlaying } from '@/components/AudioNowPlaying';
import { FocusCard } from '@/components/FocusCard';
import { StateView } from '@/components/StateView';
import { VideoPlayer } from '@/components/VideoPlayer';
import { SURAHS } from '@/data/surahs';
import releasePolicy from '@/data/release-policy.json';
import { useTranslation } from '@/lib/i18n';
import type { Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

const INDEX_URL = 'https://pub-d0489c0572704285af79896edb72cbed.r2.dev/podcast/audiobooks/index.json';
const MEDIA_BASE = 'https://pub-d0489c0572704285af79896edb72cbed.r2.dev/podcast';
const HANDOUT_INDEX = 'https://pub-d0489c0572704285af79896edb72cbed.r2.dev/handouts/index.json';
const TAFSIR_BASE = 'https://pub-d0489c0572704285af79896edb72cbed.r2.dev/tafsir/de-rassoul';
const RASSOUL_CREDIT = 'Abu-r-Rida Muhammad Ibn Ahmad Ibn Rassoul (IB Verlag Islamische Bibliothek)';

interface Kapitel {
  track: string;
  chapter_no: number;
  title: string;
  lang: string;
  audio_url: string;
  video_url?: string | null;
  book_pdf_url?: string | null;
  duration_sec?: number | null;
}

interface Unterlage {
  id: string;
  title: string;
  pdf_url: string;
  visible?: boolean;
  lang?: string;
}

interface TafsirBlock {
  from: number;
  to: number;
  text: string;
}

type Ansicht =
  | { art: 'hub' }
  | { art: 'track'; track: string }
  | { art: 'buecher' }
  | { art: 'unterlagen' }
  | { art: 'rassoul' }
  | { art: 'sure'; nummer: number };

const LANGUAGE_ENDONYM: Readonly<Record<string, string>> = {
  de: 'Deutsch',
  en: 'English',
  tr: 'Türkçe',
  ar: 'العربية',
  es: 'Español',
  fr: 'Français',
  id: 'Indonesia',
  bn: 'বাংলা',
  fa: 'فارسی',
  ms: 'Melayu',
  ur: 'اردو',
  ru: 'Русский',
  sw: 'Kiswahili',
  ps: 'پښتو',
};

function kapitelErlaubt(eintrag: Kapitel): boolean {
  const lang = eintrag.lang.trim().toLowerCase().split(/[-_]/)[0] ?? '';
  if (eintrag.track === 'grammatik-hoerbuch' && releasePolicy.blockedGrammarLocales.includes(lang)) return false;
  if (eintrag.track === 'pflichtwissen' && releasePolicy.blockedPflichtwissenLocales.includes(lang)) return false;
  return typeof eintrag.audio_url === 'string' && eintrag.audio_url.trim() !== '';
}

function medienAdresse(wert: string): string {
  const roh = wert.trim();
  if (roh.startsWith('http://') || roh.startsWith('https://')) return roh;
  return `${MEDIA_BASE}/${roh.replace(/^\.\.\//, '')}`;
}

function minuten(sekunden: number | null | undefined): string {
  if (!sekunden || sekunden < 1) return '';
  const m = Math.floor(sekunden / 60);
  const s = sekunden % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function spurName(track: string, t: (key: string) => string): string {
  if (track === 'grammatik-hoerbuch') return t('audiobooks.grammar');
  if (track === 'pflichtwissen') return t('audiobooks.pflichtwissen');
  if (track === 'arabisch-kurs-1') return t('audiobooks.kurs1');
  if (track === 'arabisch-kurs-2') return t('audiobooks.kurs2');
  return track;
}

/**
 * Dieselbe öffentliche Hörbuch-, Video- und Buchliste wie die Handy-App,
 * plus der vom Autor freigegebene Tafsir und die Lernunterlagen.
 */
export function AudiobooksScreen({ onQuran }: { onQuran?: () => void }) {
  const [ansicht, setAnsicht] = useState<Ansicht>({ art: 'hub' });
  const [kapitel, setKapitel] = useState<Kapitel[] | null>(null);
  const [unterlagen, setUnterlagen] = useState<Unterlage[] | null>(null);
  const [fehler, setFehler] = useState(false);
  const [versuch, setVersuch] = useState(0);
  const [ton, setTon] = useState<Kapitel | null>(null);
  const [film, setFilm] = useState<string | null>(null);
  const [bloecke, setBloecke] = useState<TafsirBlock[] | null>(null);
  const [textFehler, setTextFehler] = useState(false);
  const [gespeichert, setGespeichert] = useState<Lesefortschritt | null>(null);
  const [inhaltSprache, setInhaltSprache] = useState(locale);
  const [scrollZielBlock, setScrollZielBlock] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const blockOffsetsRef = useRef<number[]>([]);
  const zuletztGespeicherterBlock = useRef<number | null>(null);
  const { width, height } = useWindowDimensions();
  const { t, rtl, locale } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => listenStil(width, height, rtl, theme), [width, height, rtl, theme]);

  const neu = () => {
    setFehler(false);
    setKapitel(null);
    setUnterlagen(null);
    setVersuch((n) => n + 1);
  };

  useEffect(() => {
    void AsyncStorage.getItem(LESEFORTSCHRITT_STORAGE_KEY).then((raw) => {
      setGespeichert(parseLesefortschritt(raw));
    });
  }, []);

  const speichereFortschritt = useCallback((wert: Lesefortschritt) => {
    setGespeichert(wert);
    void AsyncStorage.setItem(LESEFORTSCHRITT_STORAGE_KEY, serializeLesefortschritt(wert)).catch(() => {});
  }, []);

  const oeffneSure = useCallback(
    (nummer: number, block = 0) => {
      setScrollZielBlock(block);
      blockOffsetsRef.current = [];
      zuletztGespeicherterBlock.current = null;
      speichereFortschritt({ surah: nummer, block });
      setAnsicht({ art: 'sure', nummer });
    },
    [speichereFortschritt],
  );

  const scrollZuBlock = useCallback((blockIndex: number) => {
    const y = blockOffsetsRef.current[blockIndex];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: false });
      zuletztGespeicherterBlock.current = blockIndex;
      setScrollZielBlock(null);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (ansicht.art !== 'sure' || scrollZielBlock === null || !bloecke?.length) return;
    const indexBlock = Math.min(scrollZielBlock, bloecke.length - 1);
    if (scrollZuBlock(indexBlock)) return;
    const handle = requestAnimationFrame(() => {
      scrollZuBlock(indexBlock);
    });
    return () => cancelAnimationFrame(handle);
  }, [ansicht, bloecke, scrollZielBlock, scrollZuBlock]);

  const onScrollLeser = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (ansicht.art !== 'sure' || !bloecke?.length) return;
      const y = event.nativeEvent.contentOffset.y;
      let sichtbarerBlock = 0;
      for (let i = 0; i < blockOffsetsRef.current.length; i += 1) {
        const offset = blockOffsetsRef.current[i];
        if (typeof offset === 'number' && offset <= y + 24) {
          sichtbarerBlock = i;
        }
      }
      if (sichtbarerBlock === zuletztGespeicherterBlock.current) return;
      zuletztGespeicherterBlock.current = sichtbarerBlock;
      speichereFortschritt({ surah: ansicht.nummer, block: sichtbarerBlock });
    },
    [ansicht, bloecke, speichereFortschritt],
  );

  useEffect(() => {
    let lebendig = true;
    fetch(INDEX_URL)
      .then((antwort) => {
        if (!antwort.ok) throw new Error(String(antwort.status));
        return antwort.json() as Promise<{ entries?: Kapitel[] }>;
      })
      .then((daten) => {
        if (!lebendig) return;
        const liste = (daten.entries ?? [])
          .filter(kapitelErlaubt)
          .sort((a, b) => a.track.localeCompare(b.track) || a.lang.localeCompare(b.lang) || a.chapter_no - b.chapter_no);
        setKapitel(liste);
      })
      .catch(() => lebendig && setFehler(true));
    fetch(HANDOUT_INDEX)
      .then((antwort) => (antwort.ok ? (antwort.json() as Promise<{ handouts?: Unterlage[] }>) : { handouts: [] }))
      .then((daten) => {
        if (!lebendig) return;
        setUnterlagen((daten.handouts ?? []).filter((eintrag) => eintrag.visible !== false && eintrag.pdf_url));
      })
      .catch(() => lebendig && setUnterlagen([]));
    return () => {
      lebendig = false;
    };
  }, [locale, versuch]);

  useEffect(() => {
    if (ansicht.art !== 'sure') return;
    let lebendig = true;
    setBloecke(null);
    setTextFehler(false);
    blockOffsetsRef.current = [];
    fetch(`${TAFSIR_BASE}/${ansicht.nummer}.json`)
      .then((antwort) => {
        if (!antwort.ok) throw new Error(String(antwort.status));
        return antwort.json() as Promise<{ blocks?: TafsirBlock[] }>;
      })
      .then((daten) => lebendig && setBloecke(daten.blocks ?? []))
      .catch(() => lebendig && setTextFehler(true));
    return () => {
      lebendig = false;
    };
  }, [ansicht]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (film) {
        setFilm(null);
        return true;
      }
      if (ton) {
        setTon(null);
        return true;
      }
      if (ansicht.art === 'sure') {
        setAnsicht({ art: 'rassoul' });
        return true;
      }
      if (ansicht.art !== 'hub') {
        setAnsicht({ art: 'hub' });
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [ansicht, film, ton]);

  const buchOeffnen = (adresse: string) => {
    void Linking.openURL(medienAdresse(adresse)).catch(() => setFehler(true));
  };

  if (film) return <VideoPlayer uri={film} onEnd={() => setFilm(null)} />;
  if (ton) {
    return (
      <AudioNowPlaying
        quelle="audiobooks"
        uri={medienAdresse(ton.audio_url)}
        title={ton.title}
        subtitle={spurName(ton.track, t)}
        kickerKey="audiobooks.kicker"
      />
    );
  }
  if (fehler && !kapitel) return <StateView messageKey="audiobooks.loadError" onAction={neu} />;
  if (!kapitel) return <StateView loading onAction={neu} />;

  const sprachen = [...new Set(kapitel.map((eintrag) => eintrag.lang.trim().toLowerCase().split(/[-_]/)[0] ?? ''))].filter(Boolean).sort();
  const gewaehlteSprache = sprachen.includes(inhaltSprache) ? inhaltSprache : sprachen[0] ?? inhaltSprache;
  const sichtbar = kapitel.filter((eintrag) => (eintrag.lang.trim().toLowerCase().split(/[-_]/)[0] ?? '') === gewaehlteSprache);
  const spuren = [...new Set(sichtbar.map((eintrag) => eintrag.track))];
  const buecher = sichtbar.filter(
    (eintrag, index, liste) =>
      !!eintrag.book_pdf_url?.trim() && liste.findIndex((andere) => andere.track === eintrag.track) === index,
  );

  const weiterSure =
    gespeichert != null ? SURAHS.find((sure) => sure.n === gespeichert.surah) : undefined;

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.seite}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={32}
      onScroll={ansicht.art === 'sure' ? onScrollLeser : undefined}>
      {ansicht.art === 'hub' && (
        <>
          {gespeichert && weiterSure ? (
            <FocusCard
              onPress={() => oeffneSure(gespeichert.surah, gespeichert.block)}
              style={styles.karte}>
              <Text style={[styles.zeile, { color: theme.accent }]}>{t('bibliothek.continueReading')}</Text>
              <Text style={styles.zeile}>
                {weiterSure.n}. {weiterSure.en}
              </Text>
              <Text style={styles.meta}>{t('bibliothek.savedPlace')}</Text>
            </FocusCard>
          ) : null}
          <Text style={styles.titel}>{t('audiobooks.title')}</Text>
          {sprachen.length > 1 ? (
            <View style={styles.langReihe}>
              {sprachen.map((sprache) => (
                <FocusCard
                  key={sprache}
                  onPress={() => setInhaltSprache(sprache)}
                  style={[
                    styles.karte,
                    sprache === gewaehlteSprache
                      ? { borderWidth: 2, borderColor: theme.accent, backgroundColor: theme.cardActive }
                      : null,
                  ]}>
                  <Text style={styles.zeile}>{LANGUAGE_ENDONYM[sprache] ?? sprache.toUpperCase()}</Text>
                </FocusCard>
              ))}
            </View>
          ) : null}
          {spuren.map((spur) => (
            <FocusCard key={spur} onPress={() => setAnsicht({ art: 'track', track: spur })} style={styles.karte}>
              <Text style={styles.zeile}>{spurName(spur, t)}</Text>
              <Text style={styles.meta}>{t('audiobooks.listen')}</Text>
            </FocusCard>
          ))}
          {onQuran ? (
            <FocusCard onPress={onQuran} style={styles.karte}>
              <Text style={styles.zeile}>{t('audiobooks.quran')}</Text>
              <Text style={styles.meta}>{t('audiobooks.quranNote')}</Text>
            </FocusCard>
          ) : null}
          <FocusCard onPress={() => setAnsicht({ art: 'buecher' })} style={styles.karte}>
            <Text style={styles.zeile}>{t('audiobooks.books')}</Text>
            <Text style={styles.meta}>{t('audiobooks.book')}</Text>
          </FocusCard>
          <FocusCard onPress={() => setAnsicht({ art: 'rassoul' })} style={styles.karte}>
            <Text style={styles.zeile}>{t('audiobooks.rassoul')}</Text>
            <Text style={styles.meta}>{RASSOUL_CREDIT}</Text>
          </FocusCard>
          <FocusCard onPress={() => setAnsicht({ art: 'unterlagen' })} style={styles.karte}>
            <Text style={styles.zeile}>{t('audiobooks.handouts')}</Text>
            <Text style={styles.meta}>{t('audiobooks.book')}</Text>
          </FocusCard>
          {spuren.length === 0 ? <Text style={styles.meta}>{t('audiobooks.empty')}</Text> : null}
        </>
      )}

      {ansicht.art === 'track' &&
        sichtbar
          .filter((eintrag) => eintrag.track === ansicht.track)
          .map((eintrag) => (
            <View key={`${eintrag.track}-${eintrag.chapter_no}`} style={styles.block}>
              <Text style={styles.zeile}>
                {eintrag.chapter_no}. {eintrag.title}
              </Text>
              <FocusCard onPress={() => setTon(eintrag)} style={styles.karte}>
                <Text style={styles.meta}>
                  {t('audiobooks.listen')}
                  {minuten(eintrag.duration_sec) ? ` · ${minuten(eintrag.duration_sec)}` : ''}
                </Text>
              </FocusCard>
              {eintrag.video_url ? (
                <FocusCard onPress={() => setFilm(medienAdresse(eintrag.video_url!))} style={styles.karte}>
                  <Text style={styles.meta}>{t('audiobooks.watch')}</Text>
                </FocusCard>
              ) : null}
              {eintrag.book_pdf_url ? (
                <FocusCard onPress={() => buchOeffnen(eintrag.book_pdf_url!)} style={styles.karte}>
                  <Text style={styles.meta}>{t('audiobooks.book')}</Text>
                </FocusCard>
              ) : null}
            </View>
          ))}

      {ansicht.art === 'buecher' &&
        (buecher.length === 0 ? (
          <Text style={styles.meta}>{t('audiobooks.booksEmpty')}</Text>
        ) : (
          buecher.map((eintrag) => (
            <FocusCard key={eintrag.track} onPress={() => buchOeffnen(eintrag.book_pdf_url!)} style={styles.karte}>
              <Text style={styles.zeile}>{spurName(eintrag.track, t)}</Text>
              <Text style={styles.meta}>{t('audiobooks.book')}</Text>
            </FocusCard>
          ))
        ))}

      {ansicht.art === 'unterlagen' &&
        (unterlagen ?? [])
          .filter((eintrag) => !eintrag.lang || eintrag.lang === locale)
          .map((eintrag) => (
            <FocusCard key={eintrag.id} onPress={() => buchOeffnen(eintrag.pdf_url)} style={styles.karte}>
              <Text style={styles.zeile}>{eintrag.title}</Text>
              <Text style={styles.meta}>{t('audiobooks.book')}</Text>
            </FocusCard>
          ))}

      {ansicht.art === 'rassoul' && (
        <>
          <Text style={styles.titel}>{t('audiobooks.rassoul')}</Text>
          <Text style={styles.meta}>{RASSOUL_CREDIT}</Text>
          <Text style={styles.meta}>{t('audiobooks.rassoulGerman')}</Text>
          {SURAHS.map((sure) => (
            <FocusCard key={sure.n} onPress={() => oeffneSure(sure.n, 0)} style={styles.karte}>
              <Text style={styles.zeile}>
                {sure.n}. {sure.en}
              </Text>
              <Text style={styles.meta}>{sure.ar}</Text>
            </FocusCard>
          ))}
        </>
      )}

      {ansicht.art === 'sure' && (
        <>
          <Text style={styles.titel}>
            {ansicht.nummer}. {SURAHS.find((sure) => sure.n === ansicht.nummer)?.en}
          </Text>
          <Text style={styles.meta}>{RASSOUL_CREDIT}</Text>
          {textFehler ? <Text style={styles.meta}>{t('audiobooks.loadError')}</Text> : null}
          {!bloecke && !textFehler ? <Text style={styles.meta}>{t('audiobooks.loading')}</Text> : null}
          {bloecke?.map((block, blockIndex) => (
            <View
              key={`${block.from}-${block.to}`}
              style={styles.block}
              onLayout={(event) => {
                blockOffsetsRef.current[blockIndex] = event.nativeEvent.layout.y;
                if (scrollZielBlock != null && bloecke) {
                  const ziel = Math.min(scrollZielBlock, bloecke.length - 1);
                  if (blockIndex === ziel) scrollZuBlock(ziel);
                }
              }}>
              <Text style={styles.zeile}>
                {block.from === block.to ? String(block.from) : `${block.from}–${block.to}`}
              </Text>
              <Text style={styles.fliesstext}>{block.text}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function listenStil(breite: number, hoehe: number, rtl: boolean, theme: Theme) {
  const klemmen = (wert: number, min: number, max: number) => Math.max(min, Math.min(max, wert));
  const ausrichtung = rtl ? ('right' as const) : ('left' as const);
  return StyleSheet.create({
    seite: {
      paddingHorizontal: klemmen(breite * 0.05, 28, 80),
      paddingVertical: klemmen(hoehe * 0.05, 20, 48),
    },
    langReihe: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    titel: {
      color: theme.accent,
      fontSize: klemmen(hoehe * 0.05, 26, 44),
      fontWeight: '800',
      marginBottom: 18,
      textAlign: ausrichtung,
    },
    block: { marginBottom: 16 },
    karte: { marginBottom: 10, paddingHorizontal: 22, paddingVertical: 16 },
    zeile: {
      color: theme.text,
      fontSize: klemmen(hoehe * 0.032, 18, 28),
      fontWeight: '700',
      textAlign: ausrichtung,
    },
    meta: {
      color: theme.textMuted,
      fontSize: klemmen(hoehe * 0.024, 14, 20),
      marginTop: 4,
      textAlign: ausrichtung,
    },
    fliesstext: {
      color: theme.text,
      fontSize: klemmen(hoehe * 0.028, 16, 24),
      lineHeight: klemmen(hoehe * 0.04, 24, 34),
      marginTop: 8,
      textAlign: ausrichtung,
    },
  });
}
