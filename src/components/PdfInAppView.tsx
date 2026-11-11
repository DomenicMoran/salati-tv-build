import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTVEventHandler } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { FocusCard } from '@/components/FocusCard';
import { parseTvPdfBridgeInbound, serializeTvPdfBridgeOutbound, type TvPdfOutlineItem } from '@/lib/pdfBridge';
import { resolveTvPdfReaderShellUri } from '@/lib/pdfReaderShell';
import type { Theme } from '@/lib/theme';

type Props = {
  theme: Theme;
  title: string;
  pdfUrl: string;
  onClose: () => void;
  openInBrowserLabel: string;
  viewerErrorLabel: string;
  tocLabel?: string;
};

export function PdfInAppView({
  theme,
  title,
  pdfUrl,
  onClose,
  openInBrowserLabel,
  viewerErrorLabel,
  tocLabel = 'Inhalt',
}: Props) {
  const webRef = useRef<WebView>(null);
  const [shellUri, setShellUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [shellReady, setShellReady] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [outline, setOutline] = useState<TvPdfOutlineItem[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const loadedRef = useRef(false);

  const post = useCallback((payload: Parameters<typeof serializeTvPdfBridgeOutbound>[0]) => {
    webRef.current?.postMessage(serializeTvPdfBridgeOutbound(payload));
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tocOpen) {
        setTocOpen(false);
        return true;
      }
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose, tocOpen]);

  useEffect(() => {
    void resolveTvPdfReaderShellUri()
      .then(setShellUri)
      .catch(() => setFailed(true));
  }, []);

  const postLoad = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    post({ type: 'load', pdfUrl: pdfUrl.trim(), theme: 'night', zoom: 1.2 });
  }, [pdfUrl, post]);

  useEffect(() => {
    if (shellReady) postLoad();
  }, [shellReady, postLoad]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    const msg = parseTvPdfBridgeInbound(event.nativeEvent.data);
    if (!msg) return;
    if (msg.type === 'ready' && msg.shell) {
      setShellReady(true);
      return;
    }
    if (msg.type === 'ready' || msg.type === 'pagechange') {
      setPage(msg.page);
      setPageCount(msg.pageCount);
    }
    if (msg.type === 'outline') setOutline(msg.items);
    if (msg.type === 'error') setFailed(true);
  }, []);

  const pagePrev = useCallback(() => {
    if (page <= 1) return;
    post({ type: 'goToPage', page: page - 1 });
  }, [page, post]);

  const pageNext = useCallback(() => {
    if (pageCount < 1 || page >= pageCount) return;
    post({ type: 'goToPage', page: page + 1 });
  }, [page, pageCount, post]);

  useTVEventHandler((evt) => {
    if (!evt || tocOpen) return;
    const type = evt.eventType;
    if (type === 'left') pagePrev();
    if (type === 'right') pageNext();
    if (type === 'up' || type === 'down') {
      /* Fokus bleibt auf Steuerleiste */
    }
  });

  const jumpOutline = useCallback(
    (item: TvPdfOutlineItem) => {
      if (item.page != null && item.page >= 1) {
        post({ type: 'goToPage', page: item.page });
      }
      setTocOpen(false);
    },
    [post],
  );

  if (failed || !shellUri) {
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
      {pageCount > 0 ? (
        <Text style={{ color: theme.textMuted }}>
          {page} / {pageCount}
        </Text>
      ) : null}
      <WebView
        ref={webRef}
        source={{ uri: shellUri }}
        style={styles.webview}
        originWhitelist={['*']}
        onMessage={onMessage}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        setSupportMultipleWindows={false}
      />
      {tocOpen ? (
        <View style={[styles.tocPanel, { backgroundColor: theme.card }]}>
          <Text style={[styles.tocTitle, { color: theme.text }]}>{tocLabel}</Text>
          <ScrollView style={styles.tocScroll}>
            {outline.length === 0 ? (
              <Text style={{ color: theme.textMuted }}>—</Text>
            ) : (
              outline.map((item, idx) => (
                <FocusCard
                  key={`${item.title}-${idx}`}
                  onPress={() => jumpOutline(item)}
                  style={styles.tocItem}
                  disabled={item.page == null}>
                  <Text style={{ color: theme.text, paddingStart: item.depth * 12 }}>
                    {item.title}
                    {item.page != null ? ` (${item.page})` : ''}
                  </Text>
                </FocusCard>
              ))
            )}
          </ScrollView>
          <FocusCard onPress={() => setTocOpen(false)} style={styles.karte} hasTVPreferredFocus>
            <Text style={{ color: theme.text }}>←</Text>
          </FocusCard>
        </View>
      ) : null}
      <View style={styles.steuerung}>
        <FocusCard onPress={pagePrev} style={styles.karte} disabled={page <= 1}>
          <Text style={{ color: theme.text }}>◀</Text>
        </FocusCard>
        <FocusCard onPress={pageNext} style={styles.karte} disabled={pageCount > 0 && page >= pageCount}>
          <Text style={{ color: theme.text }}>▶</Text>
        </FocusCard>
        <FocusCard onPress={() => setTocOpen((v) => !v)} style={styles.karte}>
          <Text style={{ color: theme.text }}>{tocLabel}</Text>
        </FocusCard>
        <FocusCard onPress={onClose} style={styles.karte}>
          <Text style={{ color: theme.text }}>←</Text>
        </FocusCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, gap: 12, padding: 16 },
  titel: { fontSize: 22, fontWeight: '600' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  steuerung: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  fehler: { flex: 1, gap: 16, padding: 24, justifyContent: 'center' },
  karte: { padding: 16 },
  tocPanel: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    gap: 12,
    zIndex: 4,
  },
  tocTitle: { fontSize: 20, fontWeight: '600' },
  tocScroll: { flex: 1 },
  tocItem: { padding: 12, marginBottom: 4 },
});
