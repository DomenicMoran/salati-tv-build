import { Linking, StyleSheet, Text, View } from 'react-native';

import { FocusCard } from '@/components/FocusCard';
import {
  AUTHOR_MEMOIR_AMAZON_URL,
  AUTHOR_MEMOIR_BOD_URL,
  AUTHOR_MEMOIR_EBOOK_PRICE_EUR,
  AUTHOR_MEMOIR_ISBN,
  AUTHOR_MEMOIR_PRINT_PRICE_EUR,
  AUTHOR_MEMOIR_RELEASE_DATE,
} from '@/lib/authorBook';
import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/lib/useTheme';

export function AuthorBookSettingsSection() {
  const { t } = useTranslation();
  const theme = useTheme();

  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.eyebrow, { color: theme.textMuted }]}>{t('authorBook.eyebrow').toUpperCase()}</Text>
      <Text style={[styles.title, { color: theme.text }]}>{t('authorBook.title')}</Text>
      <View style={[styles.bodyCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.body, { color: theme.text }]}>{t('authorBook.body')}</Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {t('authorBook.meta', {
            printPrice: AUTHOR_MEMOIR_PRINT_PRICE_EUR,
            releaseDate: AUTHOR_MEMOIR_RELEASE_DATE,
            isbn: AUTHOR_MEMOIR_ISBN,
          })}
        </Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {t('authorBook.ebookNote', { ebookPrice: AUTHOR_MEMOIR_EBOOK_PRICE_EUR })}
        </Text>
      </View>
      <View style={styles.grid}>
        <FocusCard onPress={() => open(AUTHOR_MEMOIR_BOD_URL)} style={styles.card}>
          <Text style={[styles.cardLabel, { color: theme.text }]} numberOfLines={2}>
            {t('authorBook.ctaBod')}
          </Text>
        </FocusCard>
        <FocusCard onPress={() => open(AUTHOR_MEMOIR_AMAZON_URL)} style={styles.card}>
          <Text style={[styles.cardLabel, { color: theme.textMuted }]} numberOfLines={2}>
            {t('authorBook.ctaAmazon')}
          </Text>
        </FocusCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16, paddingBottom: 48 },
  eyebrow: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '700' },
  bodyCard: { borderRadius: 12, padding: 16, gap: 10 },
  body: { fontSize: 16, lineHeight: 24 },
  meta: { fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { minWidth: 220, flex: 1, padding: 16, justifyContent: 'center' },
  cardLabel: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
});
