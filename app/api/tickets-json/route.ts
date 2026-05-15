import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

const notion = new Client({ auth: process.env.NOTION_SECRET });

// ذاكرة مؤقتة لمدة 5 دقائق لتقليل الضغط
export const revalidate = 300; 

export async function GET() {
  const databaseId = process.env.NOTION_DATABASE_ID;
  const statusDbId = process.env.NOTION_STATUS_DATABASE_ID;
  if (!databaseId) return NextResponse.json({ error: 'Config error' }, { status: 500 });

  try {
    // 1. جلب البيانات الأساسية (500 بلاغ)
    let mainResults: any[] = [];
    let hasMore = true;
    let nextCursor: string | undefined = undefined;

    while (hasMore && mainResults.length < 500) {
      const response: any = await notion.databases.query({
        database_id: databaseId,
        page_size: 100,
        start_cursor: nextCursor,
        filter: {
          property: 'تاريخ استقبال البلاغ',
          date: { on_or_after: '2026-04-04' },
        },
        sorts: [{ property: 'تاريخ استقبال البلاغ', direction: 'descending' }],
      });
      mainResults = [...mainResults, ...response.results];
      hasMore = response.has_more;
      nextCursor = response.next_cursor || undefined;
    }

    // 2. جلب الحالات من القاعدة الثانية
    let statusMap = new Map<string, string>();
    let statusIdMap = new Map<string, string>();
    if (statusDbId) {
      let statusResults: any[] = [];
      let sHasMore = true;
      let sCursor: string | undefined = undefined;
      while (sHasMore && statusResults.length < 500) {
        const sRes: any = await notion.databases.query({
          database_id: statusDbId,
          page_size: 100,
          start_cursor: sCursor,
          filter: {
            property: 'Date Created',
            date: { on_or_after: '2026-04-04' },
          },
          sorts: [{ property: 'Date Created', direction: 'descending' }],
        });
        statusResults = [...statusResults, ...sRes.results];
        sHasMore = sRes.has_more;
        sCursor = sRes.next_cursor || undefined;
      }
      statusResults.forEach(page => {
        const props = page.properties;
        const num = props['Name']?.title[0]?.plain_text;
        const status = props['الحالة']?.select?.name;
        if (num && status) {
          statusMap.set(num, status);
          statusIdMap.set(num, page.id);
        }
      });
    }

    const tickets = mainResults.map((page: any) => {
      const props = page.properties;
      const getT = (n: string) => {
        const p = props[n];
        if (!p) return '';
        if (p.type === 'title') return p.title[0]?.plain_text || '';
        if (p.type === 'select') return p.select?.name || '';
        return '';
      };

      const ticketNum = getT('Name');
      return {
        id: page.id,
        statusPageId: statusIdMap.get(ticketNum), 
        number: ticketNum,
        solution: statusMap.get(ticketNum) || getT('الحل المقترح'), // الأولوية لحالة النوشن الجديدة
        receiver: getT('المستقبل'),
        date: props['تاريخ استقبال البلاغ']?.date?.start || ''
      };
    });

    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
