import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';

import type { AufstellungsRolle } from '@/data/gebetGemeinsam';
import type { Theme } from '@/lib/theme';

// SVG-Diagramm einer Gebets-Aufstellung (Dschamāʿa) fuer den Fernseher.
//
// Kein Import und keine Kopie der Handy-Komponente
// (features/gebet-gemeinsam/AufstellungDiagramm.tsx): sie zeichnet fuer ein
// Handydisplay aus 30cm Abstand (Slot 68px, Labelgroesse 9px). Auf drei
// Metern Sitzabstand waere das nicht zu lesen. Die STRUKTUR-Daten
// (`AufstellungsRolle`, `reihen`) sind dieselben — nur die Zeichnung ist neu,
// mit Massen relativ zur verfuegbaren Buehnenhoehe (`hoehe`-Prop), wie es auf
// dem Fernseher ueberall sonst auch gehalten wird (s. ClockScreen-Kommentar).
//
// Barrierefreiheit fuer Farbsehschwaeche: Rollen unterscheiden sich NICHT nur
// ueber Farbe, sondern ueber Form (Kreis/Quadrat/Raute), Linienstil
// (durchgezogen/gestrichelt) UND eine Beschriftung unter jeder Form — genau
// wie auf dem Handy. Der Imam ist zusaetzlich groesser und traegt ein
// Sternsymbol.
//
// WARUM DIE BESCHRIFTUNGEN NICHT IN `SvgText` STEHEN: react-native-svg
// zeichnet Text ueber eine eigene Glyph-Engine ohne Schriftformung
// (Shaping/Ligaturen) fuer komplexe Schriften. Arabisch, Urdu, Persisch und
// Paschtu sind kursive Verbundschriften — jedes Zeichen sieht je nach
// Nachbarn anders aus (Anfangs-/Mittel-/Endform). Ohne Shaping zerfaellt das
// Wort in isolierte Einzelzeichen, die zudem falsch (von links nach rechts)
// aneinandergereiht werden — genau der Fehler, der am Geraet auftrat
// ("القبلة" als lose Buchstaben statt Verbundschrift). Das native `Text`
// nutzt dagegen die System-Textengine (Android Layout/HarfBuzz bzw. iOS
// CoreText), die diese Schriften korrekt formt — dieselbe Engine, mit der
// alle Regelseiten in diesem Screen bereits fehlerfrei Arabisch anzeigen.
// Deshalb: das SVG zeichnet NUR die Formen (Kreis/Quadrat/Raute/Pfeil), jede
// Beschriftung liegt als `Text`-Overlay exakt an derselben Pixelposition
// darueber (dafuer bekommt `Svg` eine feste Pixelbreite statt "100%" — sonst
// waere die Overlay-Position vom SVG-eigenen Skalierungsfaktor abhaengig).
interface Props {
  reihen: AufstellungsRolle[][];
  imamLabel: string;
  mannLabel: string;
  frauLabel: string;
  qiblaLabel: string;
  theme: Theme;
  /** Verfuegbare Hoehe der Buehne — alle Masse skalieren relativ dazu, und
   *  die Gesamthoehe wird strikt darauf gedeckelt (nichts darf abgeschnitten
   *  werden, auch nicht bei vier Reihen — s. Kopfkommentar Screen). */
  hoehe: number;
}

interface Person {
  x: number;
  y: number;
  r: number;
  rolle: AufstellungsRolle;
  label: string;
  key: string;
}

export function AufstellungDiagramm({ reihen, imamLabel, mannLabel, frauLabel, qiblaLabel, theme, hoehe }: Props) {
  const rows = reihen.length;

  // Ausgangsgroessen — wie bisher relativ zur Buehnenhoehe, aber OHNE festen
  // Mindestwert fuer formR/rowGap: bei drei oder vier Reihen darf die Form
  // kleiner werden, statt die Buehne zu sprengen (der eigentliche Fehler:
  // formR blieb bisher IMMER >= 26px, egal wie viele Reihen kamen).
  let formR = hoehe * 0.05;
  let rowGap = formR * 4.4;
  let topY = hoehe * 0.12;
  let labelSize = formR * 0.42;
  let qiblaSize = formR * 0.46;
  let bottomPad = labelSize * 1.6 + 10;

  const gesamthoehe = () => topY + Math.max(0, rows - 1) * rowGap + formR * 2 + bottomPad;

  let inhaltHoehe = gesamthoehe();
  if (hoehe > 0 && inhaltHoehe > hoehe) {
    // Passt bei dieser Reihenzahl nicht in die Buehne — alles gleichmaessig
    // herunterskalieren, bis es exakt passt, statt den Rest abzuschneiden.
    const scale = hoehe / inhaltHoehe;
    formR *= scale;
    rowGap = formR * 4.4;
    topY *= scale;
    labelSize *= scale;
    qiblaSize *= scale;
    bottomPad *= scale;
    inhaltHoehe = gesamthoehe();
  }

  const sidePad = formR * 0.8;
  const slot = formR * 2.6;
  const maxCols = Math.max(...reihen.map((r) => r.length));
  const width = Math.max(slot * 2.4, maxCols * slot + sidePad * 2);
  const svgHoehe = hoehe > 0 ? Math.min(inhaltHoehe, hoehe) : inhaltHoehe;
  const centerX = width / 2;

  const personen: Person[] = reihen.flatMap((reihe, rowIndex) => {
    const y = topY + rowIndex * rowGap + formR;
    const rowWidth = reihe.length * slot;
    const startX = centerX - rowWidth / 2 + slot / 2;
    return reihe.map((rolle, i) => ({
      x: startX + i * slot,
      y,
      r: formR,
      rolle,
      label: rolle === 'imam' ? imamLabel : rolle === 'mann' ? mannLabel : frauLabel,
      key: `${rowIndex}-${i}`,
    }));
  });

  const qiblaBoxBreite = Math.max(90, qiblaSize * 6);

  return (
    <View style={styles.wrap}>
      <View style={{ width, height: svgHoehe }}>
        <Svg width={width} height={svgHoehe} viewBox={`0 0 ${width} ${svgHoehe}`}>
          {/* Qibla-Richtung: fester Pfeil oben, dieselbe Anordnung wie auf dem Handy. */}
          <Path
            d={`M ${centerX} 2 L ${centerX + formR * 0.32} ${topY * 0.4} L ${centerX - formR * 0.32} ${topY * 0.4} Z`}
            fill={theme.accent}
          />

          {personen.map((p) => (
            <PersonForm key={p.key} rolle={p.rolle} x={p.x} y={p.y} r={p.r} theme={theme} />
          ))}
        </Svg>

        {/* Beschriftungen als natives Text-Overlay, s. Kopfkommentar. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Text
            style={{
              position: 'absolute',
              left: centerX - qiblaBoxBreite / 2,
              top: topY * 0.4 + 4,
              width: qiblaBoxBreite,
              textAlign: 'center',
              fontSize: qiblaSize,
              fontWeight: '700',
              color: theme.accent,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}>
            {qiblaLabel}
          </Text>

          {personen.map((p) => (
            <Text
              key={p.key}
              style={{
                position: 'absolute',
                left: p.x - slot / 2,
                top: p.y + p.r + 4,
                width: slot,
                textAlign: 'center',
                fontSize: labelSize,
                fontWeight: '600',
                color: theme.text,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}>
              {p.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Nur die Form (Kreis/Quadrat/Raute) plus — beim Imam — das Sternsymbol.
 *  Der Stern ist KEIN Verbundschrift-Zeichen (kein Shaping-Bedarf) und bleibt
 *  deshalb im SVG, wo er lagegenau in der Kreismitte sitzt. */
function PersonForm({
  rolle,
  x,
  y,
  r,
  theme,
}: {
  rolle: AufstellungsRolle;
  x: number;
  y: number;
  r: number;
  theme: Theme;
}) {
  const strichW = Math.max(2, r * 0.09);

  return (
    <G>
      {rolle === 'imam' && (
        <G>
          <Circle cx={x} cy={y} r={r} fill={theme.card} stroke={theme.accent} strokeWidth={strichW} />
          <SvgText x={x} y={y + r * 0.32} textAnchor="middle" fontSize={r * 0.9} fill={theme.accent}>
            ★
          </SvgText>
        </G>
      )}
      {rolle === 'mann' && (
        <Rect
          x={x - r * 0.82}
          y={y - r * 0.82}
          width={r * 1.64}
          height={r * 1.64}
          rx={r * 0.16}
          fill={theme.card}
          stroke={theme.textMuted}
          strokeWidth={strichW}
        />
      )}
      {rolle === 'frau' && (
        <Polygon
          points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`}
          fill={theme.card}
          stroke={theme.textMuted}
          strokeWidth={strichW}
          strokeDasharray={`${strichW * 1.6},${strichW * 1.2}`}
        />
      )}
    </G>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', width: '100%' },
});
