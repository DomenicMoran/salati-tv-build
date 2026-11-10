import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { FocusCard } from '@/components/FocusCard';
import { gviewUrl } from '@/lib/pdfGview';
import type { Theme } from '@/lib/theme';

type Props = {
  theme: Theme;
  title: string;
  pdfUrl: string;
  onClose: () => void;
  openInBrowserLabel: string;
  viewerErrorLabel: string;
};

type PdfLoadStrategy = 'direct' | 'gview';

function remotePdfUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    return /\.pdf(\?|$)/i.test(`${parsed.pathname}${parsed.search}`);
  } catch {
    return false;
  }
}

export function PdfInAppView({ theme, title, pdfUrl, onClose, openInBrowserLabel, viewerErrorLabel }: Props) {
  const [failed, setFailed] = useState(false);
  const [strategy, setStrategy] = useState<PdfLoadStrategy>(() =>
    Platform.OS === 'android' && remotePdfUrl(pdfUrl) ? 'direct' : 'gview',
  );

  const sourceUri = useMemo(() => (strategy === 'gview' ? gviewUrl(pdfUrl) : pdfUrl), [pdfUrl, strategy]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const handleViewerError = () => {
    if (strategy === 'direct') {
      setStrategy('gview');
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <View style={styles.fehler}>
        <Text style={[styles.titel, { color: theme.text }]}>{title}</Text>
        <Text style={{ color: theme.textMuted }}>{viewerErrorLabel}</Text>
        <FocusCard onPress={() => void Linking.openURL(pdfUrl).catch(() => {})} style={styles.karte}>
          <Text style={{ color: theme.accent }}>{openInBrowserLabel}</Text>
        </FocusCard>
        <FocusCard onPress={onClose} style={styles.karte}>
          <Text style={{ color: theme.text }}>←</Text>
        </FocusCard>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <Text style={[styles.titel, { color: theme.text }]}>{title}</Text>
      <WebView
        source={{ uri: sourceUri }}
        style={styles.webview}
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        onError={handleViewerError}
        onHttpError={handleViewerError}
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith('http://') || req.url.startsWith('https://')) return true;
          if (req.url.startsWith('about:')) return true;
          return false;
        }}
      />
      <FocusCard onPress={onClose} style={styles.zurueck}>
        <Text style={{ color: theme.text }}>←</Text>
      </FocusCard>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, gap: 12, padding: 16 },
  titel: { fontSize: 22, fontWeight: '600' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  zurueck: { padding: 16, alignSelf: 'flex-start' },
  fehler: { flex: 1, gap: 16, padding: 24, justifyContent: 'center' },
  karte: { padding: 16 },
});
