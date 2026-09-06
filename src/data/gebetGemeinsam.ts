// SPIEGELKOPIE von apps/mobile/src/features/gebet-gemeinsam/daten.ts.
//
// apps/tv ist ein eigenstaendiges pnpm-Projekt (eigenes Lockfile, eigener
// EAS-Build); ein Import ueber die App-Grenze waere im Metro-Bundle nicht
// aufloesbar. Deshalb liegt das Datenmodell hier als Kopie — und
// `gebetGemeinsam.parity.test.ts` vergleicht beide Dateien Zeichen fuer
// Zeichen (Kopf ausgenommen), damit die Kopie nicht still auseinanderlaeuft.
// NICHT einseitig aendern: erst die Handy-Datei, dann hierher kopieren.
//
// "Gemeinsam beten" (Dschamāʿa) — Aufstellung + Verhaltensregeln im
// Gemeinschaftsgebet. Rein deklaratives Datenmodell, KEINE eigene Text-
// Lokalisierung hier: alle sichtbaren Strings (Titel, Fließtext, Labels)
// liegen als i18n-Schlüssel im Teilbaum `gebetGemeinsam` von
// src/locales/*.json (14 Sprachen) — genau wie in der Handy-Datei.
//
// SORGFALTSPFLICHT (religiöse Rechtsaussagen — s. Kopfkommentar der
// Handy-Datei und OFFEN.md daneben): Jede `GebetGemeinsamRegel` trägt DREI
// getrennte Metadaten, die die Anzeige im TV-Screen sichtbar auseinanderhält
// (s. src/screens/GebetGemeinsamScreen.tsx):
//   - `grad` (Sicherheitsgrad): "anerkannt" = von allen großen Rechtsschulen
//     inhaltlich getragen; "strittig" = Rechtsschulen kommen zu
//     unterschiedlichen Schlüssen; "empfehlung" = praktischer Hinweis ohne
//     Rechtsnormcharakter (darf NIE wie eine Regel aussehen — auf dem
//     Fernseher genauso wenig wie auf dem Handy).
//   - `madhhab`: grobe Einordnung für ein Chip in der UI.
//   - `source`: Primärbeleg im Repo-Format, `null` NUR bei grad
//     "empfehlung". Recherche-Einschränkungen und bewusst ausgelassenes
//     Material stehen in der Handy-Datei OFFEN.md — hier nicht dupliziert.
//
// WICHTIG: Vor Store-Launch religiös gegenprüfen (gleiches Verfahren wie bei
// der Handy-Fassung).

export type Sicherheitsgrad = 'anerkannt' | 'strittig' | 'empfehlung';

/** Grobe Einordnung für ein Chip in der UI — s. Kopfkommentar. */
export type MadhhabHinweis = 'alle' | 'hanafi' | 'verschieden';

export interface GebetGemeinsamRegel {
  id: string;
  /** i18n-Key, Teilbaum `gebetGemeinsam.regeln.<id>.titel`. */
  titelKey: string;
  /** i18n-Key, Teilbaum `gebetGemeinsam.regeln.<id>.text`. */
  textKey: string;
  grad: Sicherheitsgrad;
  madhhab: MadhhabHinweis;
  /** Primärbeleg(e), Repo-Format ("Quran 2:144", "Sahih al-Bukhari 699").
   *  `null` nur bei grad === 'empfehlung'. */
  source: string | null;
}

export const GEBET_GEMEINSAM_SECTIONS = ['aufstellung', 'rezitation', 'mahram'] as const;
export type GebetGemeinsamSection = (typeof GEBET_GEMEINSAM_SECTIONS)[number];

export const GEBET_GEMEINSAM_REGELN: Record<GebetGemeinsamSection, GebetGemeinsamRegel[]> = {
  aufstellung: [
    {
      id: 'imamMitEinemMitbeter',
      titelKey: 'gebetGemeinsam.regeln.imamMitEinemMitbeter.titel',
      textKey: 'gebetGemeinsam.regeln.imamMitEinemMitbeter.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Sahih al-Bukhari 699',
    },
    {
      id: 'abDreiPersonen',
      titelKey: 'gebetGemeinsam.regeln.abDreiPersonen.titel',
      textKey: 'gebetGemeinsam.regeln.abDreiPersonen.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Sahih Muslim 3006',
    },
    {
      id: 'frauZuHause',
      titelKey: 'gebetGemeinsam.regeln.frauZuHause.titel',
      textKey: 'gebetGemeinsam.regeln.frauZuHause.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Sahih al-Bukhari 727',
    },
    {
      id: 'familienrunde',
      titelKey: 'gebetGemeinsam.regeln.familienrunde.titel',
      textKey: 'gebetGemeinsam.regeln.familienrunde.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Sahih al-Bukhari 727',
    },
    {
      id: 'reihenSchliessen',
      titelKey: 'gebetGemeinsam.regeln.reihenSchliessen.titel',
      textKey: 'gebetGemeinsam.regeln.reihenSchliessen.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Sahih al-Bukhari 723',
    },
    {
      id: 'besteReihen',
      titelKey: 'gebetGemeinsam.regeln.besteReihen.titel',
      textKey: 'gebetGemeinsam.regeln.besteReihen.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Sahih Muslim 440',
    },
    {
      id: 'qiblaAusrichtung',
      titelKey: 'gebetGemeinsam.regeln.qiblaAusrichtung.titel',
      textKey: 'gebetGemeinsam.regeln.qiblaAusrichtung.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Quran 2:144',
    },
  ],
  rezitation: [
    {
      id: 'lauteUndLeiseGebete',
      titelKey: 'gebetGemeinsam.regeln.lauteUndLeiseGebete.titel',
      textKey: 'gebetGemeinsam.regeln.lauteUndLeiseGebete.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Quran 17:110',
    },
    {
      id: 'verhaltenBeiLauterRezitation',
      titelKey: 'gebetGemeinsam.regeln.verhaltenBeiLauterRezitation.titel',
      textKey: 'gebetGemeinsam.regeln.verhaltenBeiLauterRezitation.text',
      grad: 'strittig',
      madhhab: 'verschieden',
      source: 'Quran 7:204; Sahih al-Bukhari 756; Sahih Muslim 394',
    },
    {
      id: 'amin',
      titelKey: 'gebetGemeinsam.regeln.amin.titel',
      textKey: 'gebetGemeinsam.regeln.amin.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Sahih al-Bukhari 780',
    },
    {
      id: 'rabbanaUndTakbir',
      titelKey: 'gebetGemeinsam.regeln.rabbanaUndTakbir.titel',
      textKey: 'gebetGemeinsam.regeln.rabbanaUndTakbir.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Sahih al-Bukhari 789',
    },
    {
      id: 'rhythmusEmpfehlung',
      titelKey: 'gebetGemeinsam.regeln.rhythmusEmpfehlung.titel',
      textKey: 'gebetGemeinsam.regeln.rhythmusEmpfehlung.text',
      grad: 'empfehlung',
      madhhab: 'alle',
      source: null,
    },
  ],
  mahram: [
    {
      id: 'mahramUndKhilwa',
      titelKey: 'gebetGemeinsam.regeln.mahramUndKhilwa.titel',
      textKey: 'gebetGemeinsam.regeln.mahramUndKhilwa.text',
      grad: 'anerkannt',
      madhhab: 'alle',
      source: 'Sahih al-Bukhari 5233',
    },
  ],
};

export const ALL_GEBET_GEMEINSAM_REGELN: GebetGemeinsamRegel[] = GEBET_GEMEINSAM_SECTIONS.flatMap(
  (section) => GEBET_GEMEINSAM_REGELN[section],
);

// ─────────────────────────────────────────────────────────────────────────
// Aufstellungs-Diagramme
//
// Rein strukturelle Beschreibung (KEIN Text): jede Konstellation ist eine
// Liste von Reihen von vorn (Imam) nach hinten, jede Reihe eine Liste von
// Rollen in Anzeige-Reihenfolge. Alle Betenden blicken zur Qibla (oben im
// Diagramm) — "rechts" ist für Imam UND Diagramm dieselbe Seite, weil beide
// in dieselbe Richtung blicken (kein Spiegeln nötig).
//
// Sonderfall `imamMitEinemMitbeter`: der einzige Mitbeter steht NICHT in
// einer eigenen Reihe, sondern in DERSELBEN Reihe wie der Imam, rechts neben
// ihm — genau der Fall aus Regel `imamMitEinemMitbeter`. Ab drei Personen
// bilden alle Mitbetenden eine eigene Reihe dahinter (Regel `abDreiPersonen`).
// ─────────────────────────────────────────────────────────────────────────

export type AufstellungsRolle = 'imam' | 'mann' | 'frau';

export interface AufstellungsKonstellation {
  id: string;
  titelKey: string;
  beschreibungKey: string;
  reihen: AufstellungsRolle[][];
}

export const AUFSTELLUNGEN: AufstellungsKonstellation[] = [
  {
    id: 'zweiPersonen',
    titelKey: 'gebetGemeinsam.konstellationen.zweiPersonen.titel',
    beschreibungKey: 'gebetGemeinsam.konstellationen.zweiPersonen.beschreibung',
    reihen: [['imam', 'mann']],
  },
  {
    id: 'imamEhefrau',
    titelKey: 'gebetGemeinsam.konstellationen.imamEhefrau.titel',
    beschreibungKey: 'gebetGemeinsam.konstellationen.imamEhefrau.beschreibung',
    reihen: [['imam'], ['frau']],
  },
  {
    id: 'dreiPersonen',
    titelKey: 'gebetGemeinsam.konstellationen.dreiPersonen.titel',
    beschreibungKey: 'gebetGemeinsam.konstellationen.dreiPersonen.beschreibung',
    reihen: [['imam'], ['mann', 'mann']],
  },
  {
    id: 'familienrunde',
    titelKey: 'gebetGemeinsam.konstellationen.familienrunde.titel',
    beschreibungKey: 'gebetGemeinsam.konstellationen.familienrunde.beschreibung',
    reihen: [['imam'], ['mann', 'mann'], ['frau', 'frau']],
  },
  {
    id: 'groessereGruppe',
    titelKey: 'gebetGemeinsam.konstellationen.groessereGruppe.titel',
    beschreibungKey: 'gebetGemeinsam.konstellationen.groessereGruppe.beschreibung',
    reihen: [
      ['imam'],
      ['mann', 'mann', 'mann', 'mann'],
      ['mann', 'mann', 'mann', 'mann'],
      ['frau', 'frau', 'frau', 'frau'],
    ],
  },
];

/** Querverweise auf bereits vorhandene, geprüfte Inhalte — hier NICHT
 *  dupliziert, sondern im Screen als Links dargestellt. */
export const GEBET_GEMEINSAM_QUERVERWEISE = {
  studyFreitagsUndMoscheeEtikette: { course: 'fiqh-ibadat', lesson: 'fiqh-13' } as const,
  studySutraDesImams: { course: 'fiqh-ibadat', lesson: 'fiqh-11' } as const,
};
