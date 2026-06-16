// نسمح بطلبات Fetch المباشرة من منصة داعم الحكومية (لتشغيل سكربت داعم بلس عبر Bookmarklet بدون إضافة متصفح)
const ALLOWED_ORIGINS = [
  'https://daem.momah.gov.sa',
  'https://daem.momra.gov.sa',
  'https://daem.momrauh.gov.sa',
];

export function getCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
