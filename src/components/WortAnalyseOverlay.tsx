import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { FocusCard } from '@/components/FocusCard';
import { useTranslation } from '@/lib/i18n';
import type { MorphologieStand } from '@/lib/useMorphologieSurah';
import { wortAnalyseAnzeige } from '@/lib/wortAnalyseAnzeige';
import {
  morphWortImVers,
  versWoerter,
  wortartLabel,
} from '@/lib/wortAnalyseKurz';
import { useTheme } from '@/lib/useTheme';
import type { Theme } from '@/lib/theme';

export function WortAnalyseOverlay({
  sichtbar,
  schliessen,
  surah,
  ayah,
  wortPosition,
  readerArabisch,
  morphologie,
}: {
  sichtbar: boolean;
  schliessen: () => void;
  surah: number;
  ayah: number;
  /** 1-basierte Wortposition im Vers. */
  wortPosition: number;
  readerArabisch: string;
  morphologie: MorphologieStand;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { height, width } = useWindowDimensions();
  const s = styles(height, width, theme);

  if (!sichtbar) return null;

  const morph = morphWortImVers(morphologie.datei, ayah, wortPosition);
  const verseWords = versWoerter(morphologie.datei, ayah);
  const anzeige = wortAnalyseAnzeige(morph, readerArabisch, verseWords, (key, vars) =>
    t(key, vars),
  );

  return (
    <View style={s.backdrop} testID="wort-analyse-overlay">
      <View style={s.panel}>
        <Text style={s.title}>{t('reader.wordAnalysis.title')}</Text>
        <Text style={s.fundstelle}>
          {t('reader.wordAnalysis.fundstelle', { surah, ayah, position: wortPosition })}
        </Text>

        {morphologie.laedt ? (
          <Text style={s.muted}>{t('common.loading')}</Text>
        ) : morphologie.fehler ? (
          <Text style={s.error}>{t('reader.wordAnalysis.loadError')}</Text>
        ) : !morphologie.datei ? (
          <Text style={s.muted}>{t('reader.wordAnalysis.surahNoData')}</Text>
        ) : !anzeige ? (
          <Text style={s.muted}>{t('reader.wordAnalysis.morphologyNoData')}</Text>
        ) : (
          <ScrollView style={s.scroll} contentContainerStyle={s.scrollInhalt}>
            <Text style={s.arabisch}>{anzeige.arabisch}</Text>
            <Zeile label={t('reader.wordAnalysis.rootLabel')} wert={anzeige.root ?? t('reader.wordAnalysis.rootNone')} />
            <Zeile label={t('reader.wordAnalysis.lemmaLabel')} wert={anzeige.lemma} />
            <Zeile
              label={t('reader.wordAnalysis.wortartTitle')}
              wert={wortartLabel(anzeige.wortart, (key) => t(key))}
            />
            <Zeile label={t('reader.wordAnalysis.posLabel')} wert={anzeige.stemPos} />

            {anzeige.fragmente.length > 0 ? (
              <Abschnitt titel={t('reader.wordAnalysis.fragmentsTitle')} testID="wort-analyse-fragmente">
                {anzeige.fragmente.map((frag, i) => (
                  <View key={`${frag.text}-${i}`} style={s.fragmentKarte}>
                    <Text style={s.fragmentText}>{frag.text}</Text>
                    <Text style={s.fragmentMeta}>
                      {frag.kindLabel} · {frag.pos}
                    </Text>
                    {frag.merkmale.map((m) => (
                      <Text key={m} style={s.fragmentMerkmal}>
                        {m}
                      </Text>
                    ))}
                  </View>
                ))}
              </Abschnitt>
            ) : null}

            <Abschnitt titel={t('reader.wordAnalysis.syntaxTitle')} testID="wort-analyse-syntax">
              {anzeige.syntax ? (
                <>
                  <Text style={s.syntaxRolle}>{anzeige.syntax.rolle}</Text>
                  <Text style={s.syntaxAr}>{anzeige.syntax.rolleAr}</Text>
                  {anzeige.syntax.bezug ? (
                    <Text style={s.syntaxBezug}>{anzeige.syntax.bezug}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={s.mutedKlein}>{t('reader.wordAnalysis.syntaxNone')}</Text>
              )}
            </Abschnitt>

            {anzeige.stammMerkmale.length > 0 ? (
              <Abschnitt titel={t('reader.wordAnalysis.stemTraitsTitle')}>
                {anzeige.stammMerkmale.map((zeile) => (
                  <Text key={zeile} style={s.bullet}>
                    · {zeile}
                  </Text>
                ))}
              </Abschnitt>
            ) : null}

            <Text style={s.lexikonCta}>
              {anzeige.root
                ? t('reader.wordAnalysis.lexikonCtaRoot', { root: anzeige.root })
                : t('reader.wordAnalysis.lexikonCta')}
            </Text>
          </ScrollView>
        )}

        <FocusCard hasTVPreferredFocus onPress={schliessen} style={s.schliessen}>
          <Text style={s.schliessenText}>{t('reader.wordAnalysis.closeButton')}</Text>
        </FocusCard>
        <Text style={s.hint}>{t('reader.wordAnalysis.closeHint')}</Text>
      </View>
    </View>
  );
}

function Zeile({ label, wert }: { label: string; wert: string }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', marginTop: 2 }}>{wert}</Text>
    </View>
  );
}

function Abschnitt({
  titel,
  testID,
  children,
}: {
  titel: string;
  testID?: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: 18 }} testID={testID}>
      <Text style={{ color: theme.accent, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>{titel}</Text>
      {children}
    </View>
  );
}

function styles(h: number, w: number, theme: Theme) {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.72)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: clamp(w * 0.08, 32, 120),
      zIndex: 20,
    },
    panel: {
      width: '100%',
      maxWidth: 720,
      maxHeight: h * 0.78,
      backgroundColor: theme.card,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: theme.accent,
      padding: clamp(h * 0.03, 18, 36),
    },
    title: { color: theme.accent, fontSize: clamp(h * 0.04, 22, 36), fontWeight: '800' },
    fundstelle: { color: theme.textMuted, fontSize: clamp(h * 0.028, 14, 22), marginTop: 6 },
    scroll: { marginTop: 14, maxHeight: h * 0.5 },
    scrollInhalt: { paddingBottom: 8 },
    arabisch: {
      color: theme.text,
      fontSize: clamp(h * 0.055, 28, 48),
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 8,
    },
    muted: { color: theme.textMuted, fontSize: 18, marginTop: 16 },
    mutedKlein: { color: theme.textMuted, fontSize: 15 },
    error: { color: '#e07a6a', fontSize: 18, marginTop: 16 },
    fragmentKarte: {
      borderWidth: 1,
      borderColor: theme.textFaint,
      borderRadius: 12,
      padding: 10,
      marginBottom: 8,
      backgroundColor: theme.surface,
    },
    fragmentText: { color: theme.text, fontSize: 22, fontWeight: '700', textAlign: 'right' },
    fragmentMeta: { color: theme.textMuted, fontSize: 13, marginTop: 4 },
    fragmentMerkmal: { color: theme.text, fontSize: 14, marginTop: 3 },
    syntaxRolle: { color: theme.text, fontSize: 18, fontWeight: '700' },
    syntaxAr: { color: theme.accent, fontSize: 20, marginTop: 4, textAlign: 'right' },
    syntaxBezug: { color: theme.textMuted, fontSize: 14, marginTop: 6 },
    bullet: { color: theme.text, fontSize: 15, marginTop: 2 },
    lexikonCta: {
      color: theme.textFaint,
      fontSize: 13,
      marginTop: 16,
      textAlign: 'center',
      lineHeight: 18,
    },
    schliessen: {
      marginTop: 18,
      alignSelf: 'center',
      paddingHorizontal: clamp(w * 0.04, 28, 56),
      paddingVertical: clamp(h * 0.018, 12, 20),
    },
    schliessenText: { color: theme.text, fontSize: clamp(h * 0.032, 16, 26), fontWeight: '700' },
    hint: { color: theme.textFaint, fontSize: 14, textAlign: 'center', marginTop: 8 },
  });
}
