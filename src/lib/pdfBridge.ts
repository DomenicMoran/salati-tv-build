export type TvPdfOutlineItem = {
  title: string;
  depth: number;
  page?: number;
};

export type TvPdfBridgeOutbound =
  | { type: 'load'; pdfUrl: string; page?: number; theme?: 'day' | 'night' | 'sepia'; zoom?: number }
  | { type: 'goToPage'; page: number };

export type TvPdfBridgeInbound =
  | { type: 'ready'; page: number; pageCount: number; ttfpMs: number; shell?: boolean }
  | { type: 'pagechange'; page: number; pageCount: number }
  | { type: 'outline'; items: TvPdfOutlineItem[] }
  | { type: 'error'; code: string; message: string };

export function parseTvPdfBridgeInbound(raw: string | null | undefined): TvPdfBridgeInbound | null {
  if (raw == null || raw.trim() === '') return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const o = parsed as Record<string, unknown>;
    const type = o.type;
    if (type === 'outline') {
      const raw = o.items;
      const items: TvPdfOutlineItem[] = [];
      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (!item || typeof item !== 'object') continue;
          const row = item as Record<string, unknown>;
          const title = typeof row.title === 'string' ? row.title : '';
          const depth = typeof row.depth === 'number' ? Math.max(0, Math.floor(row.depth)) : 0;
          const page = typeof row.page === 'number' && row.page >= 1 ? Math.floor(row.page) : undefined;
          if (title) items.push({ title, depth, page });
        }
      }
      return { type: 'outline', items };
    }
    if (type === 'ready' || type === 'pagechange') {
      const page = o.page;
      const pageCount = o.pageCount;
      if (typeof page !== 'number' || typeof pageCount !== 'number') return null;
      if (type === 'ready') {
        return {
          type: 'ready',
          page: Math.floor(page),
          pageCount: Math.floor(pageCount),
          ttfpMs: typeof o.ttfpMs === 'number' ? Math.floor(o.ttfpMs) : 0,
          shell: o.shell === true,
        };
      }
      return { type: 'pagechange', page: Math.floor(page), pageCount: Math.floor(pageCount) };
    }
    if (type === 'error') {
      return {
        type: 'error',
        code: typeof o.code === 'string' ? o.code : 'unknown',
        message: typeof o.message === 'string' ? o.message : '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeTvPdfBridgeOutbound(message: TvPdfBridgeOutbound): string {
  return JSON.stringify(message);
}
