export function gviewUrl(pdfUrl: string): string {
  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(pdfUrl)}`;
}
