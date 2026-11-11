import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/lib/i18n';
import { legalBlock } from '@/lib/legalFromMobile';
import { useTheme } from '@/lib/useTheme';

function Section({ label, body }: { label: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label.toUpperCase()}</Text>
      <View style={[styles.body, { backgroundColor: theme.card }]}>
        <Text style={[styles.bodyText, { color: theme.text }]}>{body}</Text>
      </View>
    </View>
  );
}

const DATENSCHUTZ_SECTIONS: [string, string][] = [
  ['controllerSection', 'controllerText'],
  ['noCollectionSection', 'noCollectionText'],
  ['locationSection', 'locationText'],
  ['notificationsSection', 'notificationsText'],
  ['thirdPartySection', 'thirdPartyText'],
  ['ownInfraSection', 'ownInfraText'],
  ['aiSection', 'aiText'],
  ['storageSection', 'storageText'],
  ['syncSection', 'syncText'],
  ['legalBasisSection', 'legalBasisText'],
  ['retentionSection', 'retentionText'],
  ['transferSection', 'transferText'],
  ['rightsSection', 'rightsText'],
  ['cookiesSection', 'cookiesText'],
  ['changesSection', 'changesText'],
];

export function DatenschutzSettingsSection() {
  const { locale } = useTranslation();
  const block = legalBlock(locale, 'datenschutz');
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={[styles.docTitle, { color: theme.text }]}>{block.title}</Text>
      <Text style={[styles.sub, { color: theme.textMuted }]}>{block.subtitle}</Text>
      <Text style={[styles.sub, { color: theme.textMuted }]}>{block.lastUpdated}</Text>
      <View style={[styles.intro, { backgroundColor: theme.cardActive }]}>
        <Text style={[styles.bodyText, { color: theme.text }]}>{block.intro}</Text>
      </View>
      {DATENSCHUTZ_SECTIONS.map(([labelKey, textKey]) => (
        <Section key={labelKey} label={block[labelKey]} body={block[textKey]} />
      ))}
    </ScrollView>
  );
}

export function ImpressumSettingsSection() {
  const { locale } = useTranslation();
  const b = legalBlock(locale, 'impressum');
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={[styles.docTitle, { color: theme.text }]}>{b.title}</Text>
      <Text style={[styles.sub, { color: theme.textMuted }]}>{b.subtitle}</Text>
      <Section
        label={b.providerSection}
        body={`${b.company}: ${b.companyValue}\n${b.owner}: ${b.ownerValue}\n${b.address}: ${b.addressValue}`}
      />
      <Section
        label={b.contactSection}
        body={`${b.phone}: +49 30 767 645 46\n${b.email}: salati@domenicmoran.de\n${b.website}: salati.pro`}
      />
      <Section label={b.taxSection} body={`${b.smallBusiness}: ${b.smallBusinessValue}`}
      />
      <Section label={b.responsibleSection} body={b.responsibleText} />
      <Section label={b.disputeSection} body={b.disputeVsbgText} />
      <Section
        label={b.liabilitySection}
        body={`${b.liabilityContentTitle}\n${b.liabilityContentText}\n\n${b.liabilityLinksTitle}\n${b.liabilityLinksText}\n\n${b.copyrightTitle}\n${b.copyrightText}`}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 48, gap: 16 },
  docTitle: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: 16, lineHeight: 22, marginBottom: 6 },
  intro: { borderRadius: 12, padding: 16, marginBottom: 4 },
  section: { gap:  8 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  body: { borderRadius: 12, padding: 16 },
  bodyText: { fontSize: 16, lineHeight: 24 },
});
