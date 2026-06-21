import { google } from 'googleapis';
import { supabase } from './supabase';

// ملف Google Sheets في مجلد "وحدة بلدي" على Drive
const SPREADSHEET_ID = '15mi4U05HLTa-Y8MaOg_eiTgyOJnr0L3nN0N8att1H68';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

function getAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
    const oauth2 = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID.trim(),
      GOOGLE_CLIENT_SECRET.trim()
    );
    oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN.trim() });
    return oauth2;
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const key = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
    );
    return new google.auth.GoogleAuth({ credentials: key, scopes: SCOPES });
  }
  throw new Error('Google credentials not configured');
}

export async function syncTicketsToGoogleSheets(): Promise<void> {
  const { GOOGLE_CLIENT_ID, GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;
  if (!GOOGLE_CLIENT_ID && !GOOGLE_SERVICE_ACCOUNT_KEY) return;

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('ticket_number, receiver, category_type, status, solution, reception_date')
      .order('reception_date', { ascending: false });

    if (error) throw error;

    const headers = [
      'رقم البلاغ',
      'المستقبل',
      'التصنيف',
      'الحالة',
      'الحل المقترح',
      'تاريخ الاستقبال',
    ];

    const rows = (tickets || []).map((t: any) => [
      t.ticket_number || '',
      t.receiver || '',
      t.category_type || '',
      t.status || '',
      t.solution || '',
      t.reception_date || '',
    ]);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:F',
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values: [headers, ...rows] },
    });

    // تنسيق صف العناوين (خلفية زرقاء + خط أبيض عريض)
    const sheetRes = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties.sheetId',
    });
    const sheetId = sheetRes.data.sheets?.[0]?.properties?.sheetId ?? 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.13, green: 0.37, blue: 0.73 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 6 },
            },
          },
        ],
      },
    });

  } catch (err) {
    console.error('[GoogleSheets] Sync failed:', err);
  }
}
