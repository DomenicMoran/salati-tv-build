import { useCallback, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AmbientGlow } from '@/components/AmbientGlow';
import { AufstellungDiagramm } from '@/components/AufstellungDiagramm';
import { FocusCard } from '@/components/FocusCard';
import { useBedienungSichtbar } from '@/lib/bedienungSichtbar';
import {
  AUFSTELLUNGEN,
  GEBET_GEMEINSAM_REGELN,
  GEBET_GEMEINSAM_SECTIONS,
  type AufstellungsKonstellation,
  type GebetGemeinsamRegel,
  type GebetGemeinsamSection,
  type Sicherheitsgrad,
} from '@/data/gebetGemeinsam';
import { useTranslation } from '@/lib/i18n';
import { textFaktor } from '@/lib/versSeiten';
import type { Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

// "Gemeinsam beten" (Dschamāʿa) am Fernseher — reines Betrachten aus der
// Ferne, keine Texteingabe, D-Pad + OK genuegen.
//
// WARUM EIN BLAETTERBUCH UND KEINE SCROLL-LISTE: Auf dem Handy stehen alle 13
// Regeln + 5 Diagramme untereinander in EINER ScrollView — auf drei Metern
// Sitzabstand waere das eine unlesbare Textwand, und eine Bildlaufleiste
// braucht auf dem Fernseher ohnehin den Fokus, den hier die Bedienleiste hat
// (dasselbe Argument wie beim Koran-Leser, s. lib/versSeiten.ts). Deshalb: EIN
// Element je Bildschirmseite (ein Diagramm ODER eine Regel), gross gesetzt,
// mit ⏮/⏭ geblaettert. Eine Kapitel-Leiste erlaubt den Sprung zu einer Gruppe,
// ohne sich mit Vor/Zurueck durch alle 18 Seiten zu arbeiten.
//
// Sicherheitsgrad, Rechtsschule UND Quelle bleiben auf JEDER Regel-Seite
// sichtbar (Auftrag, Requirement 4) — nicht hinter einem "mehr anzeigen"
// versteckt: eine praktische Empfehlung (`grad === 'empfehlung'`) darf auf dem
// Fernseher genauso wenig wie auf dem Handy wie eine Rechtsnorm aussehen.

type DiagrammKarte = {
  art: 'diagramm';
  gruppe: 'diagramme';
  konstellation: AufstellungsKonstellation;
};
type RegelKarte = {
  art: 'regel';
  gruppe: GebetGemeinsamSection;
  regel: GebetGemeinsamRegel;
};
type Karte = DiagrammKarte | RegelKarte;

const KARTEN: Karte[] = [
  ...AUFSTELLUNGEN.map((konstellation): DiagrammKarte => ({ art: 'diagramm', gruppe: 'diagramme', konstellation })),
  ...GEBET_GEMEINSAM_SECTIONS.flatMap((gruppe) =>
    GEBET_GEMEINSAM_REGELN[gruppe].map((regel): RegelKarte => ({ art: 'regel', gruppe, regel })),
  ),
];

/** Kapitel-Leiste: "Diagramme" zuerst, dann die drei Regel-Abschnitte in
 *  derselben Reihenfolge wie auf dem Handy. */
const GRUPPEN = ['diagramme', ...GEBET_GEMEINSAM_SECTIONS] as const;

function ersteKarteVon(gruppe: (typeof GRUPPEN)[number]): number {
  const i = KARTEN.findIndex((k) => k.gruppe === gruppe);
  return i === -1 ? 0 : i;
}

const GRAD_GLYPH: Record<Sicherheitsgrad, string> = {
  anerkannt: '✓',
  strittig: '⇄',
  empfehlung: '✦',
};

export function GebetGemeinsamScreen() {
  const { t, rtl } = useTranslation();
  const theme = useTheme();
  const { height, width } = useWindowDimensions();
  const bedienungSichtbar = useBedienungSichtbar();
  const [index, setIndex] = useState(0);
  const karte = KARTEN[index];

  const gehe = useCallback((delta: number) => {
    setIndex((i) => Math.max(0, Math.min(KARTEN.length - 1, i + delta)));
  }, []);

  const [buehne, setBuehne] = useState({ w: 0, h: 0 });
  const misstBuehne = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setBuehne((alt) => (Math.abs(alt.w - w) < 1 && Math.abs(alt.h - h) < 1 ? alt : { w, h }));
  }, []);

  const s = useMemo(() => makeStyles(height, width, rtl, theme), [height, width, rtl, theme]);

  return (
    <View style={s.root}>
      <AmbientGlow color={theme.accent} size={Math.min(width, height) * 1.1} top={-height * 0.3} left={-width * 0.12} />
      <AmbientGlow
        color={theme.glowRing}
        size={Math.min(width, height) * 1.2}
        bottom={-height * 0.35}
        right={-width * 0.12}
        intensity={0.12}
      />

      <View style={s.header}>
        <Text style={s.titel} numberOfLines={1}>
          {t('home.gebetGemeinsam')}
        </Text>
        <Text style={s.seite} numberOfLines={1}>
          {t('gebetGemeinsam.seite', { n: index + 1, total: KARTEN.length })}
        </Text>
      </View>

      <View style={s.kapitelRow}>
        {GRUPPEN.map((gruppe, i) => {
          const aktiv = karte.gruppe === gruppe;
          return (
            <FocusCard
              key={gruppe}
              hasTVPreferredFocus={i === 0}
              onPress={() => setIndex(ersteKarteVon(gruppe))}
              style={[s.kapitelChip, aktiv && s.kapitelAktiv]}>
              <Text style={[s.kapitelLabel, aktiv && s.kapitelLabelAktiv]} numberOfLines={1}>
                {t(`gebetGemeinsam.sections.${gruppe}`)}
              </Text>
            </FocusCard>
          );
        })}
      </View>

      <View style={s.buehne} onLayout={misstBuehne}>
        {karte.art === 'diagramm' ? (
          <DiagrammAnsicht konstellation={karte.konstellation} t={t} s={s} theme={theme} />
        ) : (
          <RegelAnsicht regel={karte.regel} gruppe={karte.gruppe} t={t} s={s} buehne={buehne} />
        )}
      </View>

      <View style={[s.controls, !bedienungSichtbar && s.verborgen]}>
        <FocusCard onPress={() => gehe(-1)} style={s.ctrl}>
          <Text style={s.ctrlGlyph}>⏮</Text>
        </FocusCard>
        <FocusCard onPress={() => gehe(1)} style={s.ctrl}>
          <Text style={s.ctrlGlyph}>⏭</Text>
        </FocusCard>
      </View>
      <Text style={[s.hint, !bedienungSichtbar && s.verborgen]} numberOfLines={1}>
        {t('gebetGemeinsam.controlHint')}
      </Text>
      <Text style={s.footer} numberOfLines={2}>
        {t('gebetGemeinsam.footerHinweis')}
      </Text>
    </View>
  );
}

function DiagrammAnsicht({
  konstellation,
  t,
  s,
  theme,
}: {
  konstellation: AufstellungsKonstellation;
  t: (key: string, params?: Record<string, string | number>) => string;
  s: ReturnType<typeof makeStyles>;
  theme: Theme;
}) {
  // Die Diagrammflaeche bekommt ihre exakte Hoehe per `onLayout` statt einer
  // geschaetzten Quote der Buehnenhoehe (frueher `hoehe * 0.62`): Titel und
  // Beschreibung schwanken in der Zeilenzahl je Uebersetzung, ein fester
  // Anteil traf die reale Resthoehe nie zuverlaessig — bei drei/vier Reihen
  // ragte das Diagramm dadurch oben in den Titel und unten aus der Buehne,
  // die `overflow: 'hidden'` (s. `buehne`-Style) beides symmetrisch abschnitt.
  // `diagrammWrap` bekommt deshalb `flex: 1` (volle Buehnenhoehe), Titel und
  // Beschreibung behalten ihre natuerliche Hoehe, und NUR der Rest darunter
  // (`diagrammFlaeche`, ebenfalls `flex: 1`) liefert per Messung die exakte
  // verfuegbare Hoehe fuer `AufstellungDiagramm`, das seinerseits streng
  // darauf deckelt (s. Kopfkommentar der Komponente).
  const [diagrammHoehe, setDiagrammHoehe] = useState(0);
  const misstDiagrammFlaeche = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setDiagrammHoehe((alt) => (Math.abs(alt - h) < 1 ? alt : h));
  }, []);

  return (
    <View style={s.diagrammWrap}>
      <Text style={s.regelTitel} numberOfLines={2}>
        {t(konstellation.titelKey)}
      </Text>
      <Text style={s.diagrammBeschreibung} numberOfLines={3}>
        {t(konstellation.beschreibungKey)}
      </Text>
      <View style={s.diagrammFlaeche} onLayout={misstDiagrammFlaeche}>
        {diagrammHoehe > 0 && (
          <AufstellungDiagramm
            reihen={konstellation.reihen}
            imamLabel={t('gebetGemeinsam.legende.imam')}
            mannLabel={t('gebetGemeinsam.legende.mann')}
            frauLabel={t('gebetGemeinsam.legende.frau')}
            qiblaLabel={t('gebetGemeinsam.legende.qibla')}
            theme={theme}
            hoehe={diagrammHoehe}
          />
        )}
      </View>
    </View>
  );
}

function RegelAnsicht({
  regel,
  gruppe,
  t,
  s,
  buehne,
}: {
  regel: GebetGemeinsamRegel;
  gruppe: GebetGemeinsamSection;
  t: (key: string, params?: Record<string, string | number>) => string;
  s: ReturnType<typeof makeStyles>;
  buehne: { w: number; h: number };
}) {
  const text = t(regel.textKey);
  // Regeln reichen von einem Satz (amin) bis zu fuenf (mahramUndKhilwa) —
  // ein fester Schriftgrad waere fuer die kurzen zu klein und liefe bei den
  // langen aus dem Kasten. `textFaktor` (schon fuer die Uebersetzung im
  // Koran-Leser gebaut) schrumpft genau so weit, wie die Buehne es verlangt.
  const textBreite = Math.max(0, buehne.w - s.regelTextPolster * 2);
  const textHoehe = Math.max(0, buehne.h * 0.5);
  const faktor = textFaktor({
    text,
    breite: textBreite,
    hoehe: textHoehe,
    fontSize: s.regelTextGroesse,
    lineHeight: s.regelTextZeile,
  });

  return (
    <View style={s.regelWrap}>
      <Text style={s.regelSektion} numberOfLines={1}>
        {t(`gebetGemeinsam.sections.${gruppe}`)}
      </Text>
      <Text style={s.regelTitel} numberOfLines={2}>
        {t(regel.titelKey)}
      </Text>
      <View style={s.badgeRow}>
        <View style={s.gradBadge}>
          <Text style={s.gradGlyph}>{GRAD_GLYPH[regel.grad]}</Text>
          <Text style={s.gradLabel} numberOfLines={1}>
            {t(`gebetGemeinsam.grad.${regel.grad}`)}
          </Text>
        </View>
        <Text style={s.madhhabLabel} numberOfLines={1}>
          {t(`gebetGemeinsam.madhhab.${regel.madhhab}`)}
        </Text>
      </View>
      <Text
        style={[
          s.regelText,
          { fontSize: s.regelTextGroesse * faktor, lineHeight: s.regelTextZeile * faktor },
        ]}>
        {text}
      </Text>
      {/* KEIN numberOfLines: manche Quellenangaben nennen mehrere Belege
          (z.B. "Quran 7:204; Sahih al-Bukhari 756; Sahih Muslim 394") — eine
          abgeschnittene Quelle waere hier schlimmer als eine zweizeilige,
          Requirement 4 verlangt die VOLLSTAENDIGE Angabe sichtbar. */}
      {regel.source ? (
        <Text style={s.quelle}>
          {t('gebetGemeinsam.quelle')}: {regel.source}
        </Text>
      ) : null}
    </View>
  );
}

function makeStyles(h: number, w: number, rtl: boolean, theme: Theme) {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const ctrl = clamp(h * 0.09, 50, 92);
  const regelTextGroesse = clamp(h * 0.042, 20, 40);
  const regelTextZeile = clamp(h * 0.062, 30, 58);
  return Object.assign(
    StyleSheet.create({
      root: { flex: 1, overflow: 'hidden', paddingHorizontal: clamp(w * 0.06, 40, 120), paddingVertical: clamp(h * 0.035, 18, 44) },
      header: { flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' },
      titel: { color: theme.accent, fontSize: clamp(h * 0.038, 18, 30), fontWeight: '700', flexShrink: 1 },
      seite: { color: theme.textMuted, fontSize: clamp(h * 0.03, 14, 24), flexShrink: 0 },
      kapitelRow: { flexDirection: rtl ? 'row-reverse' : 'row', gap: clamp(w * 0.012, 10, 20), marginTop: clamp(h * 0.02, 10, 20) },
      kapitelChip: { paddingHorizontal: clamp(w * 0.016, 14, 28), paddingVertical: clamp(h * 0.014, 8, 16), alignItems: 'center', justifyContent: 'center' },
      kapitelAktiv: { borderColor: theme.accent, borderWidth: 2, backgroundColor: theme.cardActive },
      kapitelLabel: { color: theme.textMuted, fontSize: clamp(h * 0.026, 13, 20), fontWeight: '600' },
      kapitelLabelAktiv: { color: theme.accent },
      buehne: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
      diagrammWrap: { width: '100%', height: '100%', flex: 1, alignItems: 'center', gap: clamp(h * 0.012, 6, 14) },
      diagrammFlaeche: { width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' },
      diagrammBeschreibung: { color: theme.textMuted, fontSize: clamp(h * 0.028, 14, 24), textAlign: 'center', maxWidth: w * 0.8, lineHeight: clamp(h * 0.038, 18, 32) },
      regelWrap: { width: '100%', alignItems: rtl ? 'flex-end' : 'flex-start', gap: clamp(h * 0.014, 8, 16) },
      regelSektion: { color: theme.textFaint, fontSize: clamp(h * 0.024, 12, 18), fontWeight: '700', letterSpacing: rtl ? 0 : 2, textTransform: 'uppercase' },
      regelTitel: { color: theme.accent, fontSize: clamp(h * 0.05, 24, 44), fontWeight: '800', textAlign: rtl ? 'right' : 'left' },
      badgeRow: { flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: clamp(w * 0.014, 10, 22) },
      gradBadge: { flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, paddingHorizontal: clamp(w * 0.012, 10, 18), paddingVertical: clamp(h * 0.01, 6, 12), borderRadius: 999, backgroundColor: theme.accentSoft },
      gradGlyph: { color: theme.accent, fontSize: clamp(h * 0.026, 13, 20), fontWeight: '800' },
      gradLabel: { color: theme.accent, fontSize: clamp(h * 0.024, 12, 19), fontWeight: '700' },
      madhhabLabel: { color: theme.textMuted, fontSize: clamp(h * 0.024, 12, 19) },
      regelText: { color: theme.text, textAlign: rtl ? 'right' : 'left' },
      quelle: { color: theme.textFaint, fontSize: clamp(h * 0.024, 12, 19), fontStyle: 'italic' },
      controls: { flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'center', alignItems: 'center', gap: clamp(w * 0.02, 16, 30), marginTop: clamp(h * 0.014, 8, 16) },
      ctrl: { width: ctrl, height: ctrl, borderRadius: ctrl / 2, alignItems: 'center', justifyContent: 'center' },
      ctrlGlyph: { color: theme.text, fontSize: clamp(ctrl * 0.36, 18, 34), fontWeight: '700' },
      verborgen: { opacity: 0 },
      hint: { color: theme.textFaint, fontSize: clamp(h * 0.024, 12, 19), textAlign: 'center', marginTop: clamp(h * 0.01, 6, 12) },
      footer: { color: theme.textFaint, fontSize: clamp(h * 0.02, 11, 16), textAlign: 'center', marginTop: clamp(h * 0.012, 6, 14) },
    }),
    { regelTextGroesse, regelTextZeile, regelTextPolster: clamp(w * 0.01, 8, 20) },
  );
}
