import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { FocusCard } from '@/components/FocusCard';
import { Icon } from '@/components/Icon';
import { useTranslation } from '@/lib/i18n';
import { umschalten, useHintergrundAudio } from '@/lib/hintergrundAudio';
import type { Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

/**
 * Wie viel Hoehe der Streifen braucht (Karte + Luft darueber) — unabhaengig
 * davon, ob gerade etwas laeuft.
 *
 * Bildschirmbefund 2026-09-05: der Streifen schwebte absolut ueber dem
 * Startmenue. Auf einem Fernseher gibt es keinen Bildlauf wie am Handy — die
 * Kacheln fuellen die Buehne bis zum Rand, und eine schwebende Leiste am
 * unteren Rand landet damit zwangslaeufig auf der letzten Kachelreihe. Die
 * Quiz-Kachel und ihre Unterzeile lagen dadurch teilweise unter „LAEUFT IM
 * HINTERGRUND ...".
 *
 * Die Loesung: Bildschirme, die den Streifen zeigen koennen, reservieren
 * diese Flaeche in ihrem eigenen Layout IMMER — ob gerade etwas laeuft oder
 * nicht. Nur so bleibt das Raster stabil, wenn die Wiedergabe waehrend der
 * Menuenutzung startet oder endet (sonst spraenge die letzte Kachelreihe samt
 * Fokus in genau dem Moment).
 *
 * `kompakt` ist die einzeilige Fassung (Icon + Titel, keine eigene
 * „LAEUFT IM HINTERGRUND"-Zeile): Die Gebetsuhr hat schon eine Fusszeile,
 * eine Vers-Karte und (je nach Einstellung) Jumua-/Wetterhinweis dicht
 * gestapelt — die volle Karte passte dort nicht mehr, ohne dass sie selbst
 * am unteren Bildschirmrand abgeschnitten wurde (Geraetetest auf
 * salati_tv_36, 540 dp).
 */
export function streifenPlatz(h: number, kompakt = false) {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  if (kompakt) {
    const padV = clamp(h * 0.01, 6, 12);
    const symbol = Math.round(clamp(h * 0.03, 16, 28));
    const textFont = clamp(h * 0.026, 12, 20);
    const textHoehe = textFont * 1.2;
    const karte = padV * 2 + Math.max(symbol, textHoehe);
    const abstandOben = clamp(h * 0.012, 6, 16);
    return karte + abstandOben;
  }
  const padV = clamp(h * 0.014, 8, 20);
  const symbol = Math.round(clamp(h * 0.035, 18, 34));
  const kickerFont = clamp(h * 0.022, 11, 18);
  const titelFont = clamp(h * 0.032, 15, 26);
  // 1.2 ~ Standard-Zeilenhoehe von RN-Text ohne eigenes `lineHeight`.
  const textHoehe = kickerFont * 1.2 + 2 + titelFont * 1.2;
  const karte = padV * 2 + Math.max(symbol, textHoehe);
  const abstandOben = clamp(h * 0.015, 8, 24);
  return karte + abstandOben;
}

/**
 * Schmaler Streifen: was gerade im Hintergrund laeuft.
 *
 * Seit die Wiedergabe den Bildschirmwechsel ueberlebt (lib/hintergrundAudio.ts)
 * kann Koran laufen, waehrend vorne die Gebetsuhr steht. Ohne einen sichtbaren
 * Hinweis waere das aber ein Ton aus dem Nichts: der Nutzer saehe die Uhr, hoerte
 * eine Rezitation und haette keinen Weg, sie anzuhalten, ohne den Bereich zu
 * suchen, aus dem sie kam.
 *
 * Bewusst KEIN Fokusanker (`hasTVPreferredFocus`): auf der Uhr soll der Fokus
 * dort bleiben, wo der Bildschirm ihn hinlegt. Wer den Streifen bedienen will,
 * steuert mit dem Steuerkreuz nach unten — er ist die letzte fokussierbare
 * Stelle des Bildschirms und damit ohne Suchen erreichbar.
 *
 * Reiht sich seit dem obigen Befund in den NORMALEN FLUSS des aufrufenden
 * Bildschirms ein (dessen Layout reserviert die Flaeche ueber `streifenPlatz`)
 * statt frei ueber dem Inhalt zu schweben. Laeuft nichts, bleibt die reservierte
 * Flaeche leer — sie verschwindet nicht, sonst wuerde das Raster darueber genau
 * beim Start/Ende der Wiedergabe springen.
 */
export function HintergrundStreifen({ kompakt = false }: { kompakt?: boolean } = {}) {
  const { stueck, spielt } = useHintergrundAudio();
  const { width, height } = useWindowDimensions();
  const { t, rtl } = useTranslation();
  const theme = useTheme();
  const s = useMemo(
    () => makeStyles(width, height, rtl, theme, kompakt),
    [width, height, rtl, theme, kompakt],
  );

  return (
    <View style={s.wrap}>
      {stueck ? (
        <FocusCard onPress={umschalten} style={s.karte}>
          <View style={s.reihe}>
            <Icon name={spielt ? 'pause' : 'play'} size={s.symbolGroesse} color={theme.accent} />
            {kompakt ? (
              <Text style={s.kompaktTitel} numberOfLines={1}>
                {stueck.title}
                {stueck.subtitle ? ` · ${stueck.subtitle}` : ''}
              </Text>
            ) : (
              <View style={s.textBlock}>
                <Text style={s.kicker} numberOfLines={1}>
                  {t(spielt ? 'player.laeuftImHintergrund' : 'player.pausiert')}
                </Text>
                <Text style={s.titel} numberOfLines={1}>
                  {stueck.title}
                  {stueck.subtitle ? ` · ${stueck.subtitle}` : ''}
                </Text>
              </View>
            )}
          </View>
        </FocusCard>
      ) : null}
    </View>
  );
}

function makeStyles(w: number, h: number, rtl: boolean, theme: Theme, kompakt: boolean) {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const symbol = Math.round(clamp(kompakt ? h * 0.03 : h * 0.035, kompakt ? 16 : 18, kompakt ? 28 : 34));
  // Dieselbe Formel wie in `streifenPlatz` — die Karte darf nicht hoeher
  // ausfallen, als die aufrufenden Bildschirme reserviert haben.
  const padVKarte = kompakt ? clamp(h * 0.01, 6, 12) : clamp(h * 0.014, 8, 20);
  return Object.assign(
    StyleSheet.create({
      // Feste Hoehe aus `streifenPlatz` — reserviert, egal ob `stueck` gesetzt
      // ist. `justifyContent: 'flex-end'` schiebt die Karte an den unteren Rand
      // dieser Flaeche und laesst den Rest oben als Abstand zum Inhalt darueber
      // frei, statt einen eigenen `marginTop` zu brauchen.
      wrap: {
        height: streifenPlatz(h, kompakt),
        justifyContent: 'flex-end',
        alignItems: rtl ? 'flex-end' : 'flex-start',
      },
      karte: {
        paddingHorizontal: clamp(w * 0.018, 14, 30),
        paddingVertical: padVKarte,
        maxWidth: '70%',
      },
      reihe: {
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: clamp(w * 0.012, 10, 20),
      },
      textBlock: { flexShrink: 1, alignItems: rtl ? 'flex-end' : 'flex-start' },
      kicker: {
        color: theme.textFaint,
        fontSize: clamp(h * 0.022, 11, 18),
        letterSpacing: rtl ? 0 : 2,
        textTransform: 'uppercase',
      },
      titel: {
        color: theme.text,
        fontSize: clamp(h * 0.032, 15, 26),
        fontWeight: '600',
        marginTop: 2,
        textAlign: rtl ? 'right' : 'left',
      },
      kompaktTitel: {
        flexShrink: 1,
        color: theme.text,
        fontSize: clamp(h * 0.026, 12, 20),
        fontWeight: '600',
        textAlign: rtl ? 'right' : 'left',
      },
    }),
    { symbolGroesse: symbol },
  );
}
