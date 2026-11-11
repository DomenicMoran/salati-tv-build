import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const FILES = ['index.html', 'viewer.mjs', 'pdf.min.mjs', 'pdf.worker.min.mjs'] as const;

const modules: Record<(typeof FILES)[number], number> = {
  'index.html': require('../../assets/pdf-reader/index.html'),
  'viewer.mjs': require('../../assets/pdf-reader/viewer.mjs'),
  'pdf.min.mjs': require('../../assets/pdf-reader/pdf.min.mjs'),
  'pdf.worker.min.mjs': require('../../assets/pdf-reader/pdf.worker.min.mjs'),
};

let ready: Promise<string> | null = null;

export function resolveTvPdfReaderShellUri(): Promise<string> {
  if (!ready) {
    ready = (async () => {
      const root = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!root) throw new Error('tv_pdf_no_cache');
      const dir = `${root}salati-pdf-reader-tv/`;
      const marker = `${dir}.ready`;
      if ((await FileSystem.getInfoAsync(marker)).exists) return `${dir}index.html`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      for (const name of FILES) {
        const asset = Asset.fromModule(modules[name]);
        await asset.downloadAsync();
        const from = asset.localUri;
        if (!from) throw new Error(`tv_pdf_asset:${name}`);
        await FileSystem.copyAsync({ from, to: `${dir}${name}` });
      }
      await FileSystem.writeAsStringAsync(marker, '1');
      return `${dir}index.html`;
    })();
  }
  return ready;
}
