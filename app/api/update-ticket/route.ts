import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

const notion = new Client({ auth: process.env.NOTION_SECRET });

export async function POST(req: Request) {
  try {
    const { ticketId, solution, status, receiver, mainTicketId, number } = await req.json();

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const databaseId = process.env.NOTION_DATABASE_ID;
    const statusDbId = process.env.NOTION_STATUS_DATABASE_ID;
    
    // 1. تحديث الحالة
    if (solution !== undefined) {
      const properties: any = {};
      const targetProp = statusDbId ? 'الحالة' : 'الحل المقترح';
      properties[targetProp] = {
        select: { name: solution }
      };

      try {
        await notion.pages.update({
          page_id: ticketId,
          properties: properties,
        });
      } catch (updateError: any) {
        // إذا فشل التحديث وكان لدينا قاعدة بيانات حالات، قد يكون السبب أن السجل غير موجود أو المعرف خاطئ
        if (statusDbId && number) {
          console.log('Page update failed, attempting to find/create in status DB for ticket:', number);
          
          // البحث عن السجل برقم البلاغ
          const searchRes = await notion.databases.query({
            database_id: statusDbId,
            filter: {
              property: 'Name',
              title: { equals: number }
            }
          });

          if (searchRes.results.length > 0) {
            // السجل موجود، تحديثه
            await notion.pages.update({
              page_id: searchRes.results[0].id,
              properties: properties,
            });
          } else {
            // السجل غير موجود، إنشاؤه
            await notion.pages.create({
              parent: { database_id: statusDbId },
              properties: {
                'Name': { title: [{ text: { content: number } }] },
                'الحالة': { select: { name: solution } }
              }
            });
          }
        } else {
          // إذا لم تكن هناك قاعدة حالات، نعيد الخطأ الأصلي
          throw updateError;
        }
      }
    }

    // 2. تحديث المستقبل في القاعدة الأساسية (إذا تم إرساله من قبل المشرف)
    if (receiver !== undefined && mainTicketId) {
      await notion.pages.update({
        page_id: mainTicketId,
        properties: {
          'المستقبل': { select: { name: receiver } }
        }
      });
    }

    // 3. تحديث Supabase للمزامنة الفورية
    const { supabase } = await import('../../../lib/supabase');
    const updateData: any = {};
    if (solution !== undefined) {
      updateData.status = solution;
      updateData.solution = solution;
    }
    if (receiver !== undefined) updateData.receiver = receiver;

    if (Object.keys(updateData).length > 0) {
      // نحدث باستخدام mainTicketId أو ticketId
      const targetId = mainTicketId || ticketId;
      await supabase
        .from('tickets')
        .update(updateData)
        .eq('notion_id', targetId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تحديث البيانات.',
      details: error?.message 
    }, { status: 500 });
  }
}
