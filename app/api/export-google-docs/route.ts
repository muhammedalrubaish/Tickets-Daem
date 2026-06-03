import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Expected env variables:
// GOOGLE_SERVICE_ACCOUNT_KEY - base64‑encoded JSON key for a service account with Drive & Docs scopes
// Alternatively, set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN for OAuth2.

const SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive.file'];

/**
 * Initialize Google Auth client.
 * Prefer a service account for simplicity; fall back to OAuth2 if env vars are set.
 */
function getAuthClient() {
  // Try OAuth2 first (uses user's personal drive quota)
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
    const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    return oauth2;
  }
  // Fallback to Service Account
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const key = JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8'));
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: SCOPES,
    });
  }
  throw new Error('Google credentials not configured');
}

export async function POST(req: Request) {
  try {
    const { tickets } = await req.json();
    if (!Array.isArray(tickets)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const auth = await getAuthClient();
    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1️⃣ Create a blank Google Doc
    const createRes = await docs.documents.create({
      requestBody: {
        title: 'تقارير البلاغات',
      },
    });
    const documentId = createRes.data.documentId;
    if (!documentId) throw new Error('Failed to create document');

    // 2️⃣ Build table rows (header + data)
    const header = ['رقم البلاغ', 'اسم المستقبل', 'الحالة / الحلول المقترحة', 'تاريخ استقبال البلاغ'];
    const rows = tickets.map((t: any) => [
      t.number ?? t.id?.toString() ?? '',
      t.receiver ?? '',
      t.solution ?? '',
      t.date ?? '',
    ]);

    // Build the request body for batchUpdate to insert a table
    const requests: any[] = [];
    requests.push({
      insertTable: {
        rows: header.length ? rows.length + 1 : rows.length,
        columns: header.length,
        location: { index: 1 }, // after the start of document
      },
    });

    // Fill header cells
    header.forEach((text, col) => {
      requests.push({
        insertText: {
          text,
          location: { index: 2 + col }, // first row cells
        },
      });
    });

    // Fill data cells (starting after header row)
    let cellIndex = 2 + header.length; // after header cells
    rows.forEach((row) => {
      row.forEach((cellText: string) => {
        requests.push({
          insertText: {
            text: cellText,
            location: { index: cellIndex },
          },
        });
        cellIndex += 1;
      });
    });

    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });

    // 3️⃣ Get shareable link (drive.permissions.create + export URL)
    await drive.permissions.create({
      fileId: documentId,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
    });
    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    return NextResponse.json({ url: docUrl });
  } catch (error: any) {
    console.error('Export error', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
