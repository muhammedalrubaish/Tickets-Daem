import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

const notion = new Client({ auth: process.env.NOTION_SECRET });

export async function POST(req: Request) {
  try {
    let { ticketId, solution, status, receiver, mainTicketId, number } = await req.json();

    // تنظيف المدخلات من النصوص 'null' أو 'undefined'
    if (ticketId === 'null' || ticketId === 'undefined') ticketId = undefined;
    if (mainTicketId === 'null' || mainTicketId === 'undefined') mainTicketId = undefined;

    const databaseId = process.env.NOTION_DATABASE_ID;
    const statusDbId = process.env.NOTION_STATUS_DATABASE_ID;

    // البحث الذاتي عن معرف نويشن الحقيقي برقم البلاغ (Self-Healing)
    // هذا البحث إلزامي لضمان عدم إرسال معرفات Supabase UUID إلى نويشن نهائياً ولتحديث السجلات القديمة تلقائياً
    if (number) {
      console.log('Searching Notion main DB for ticket number:', number);
      const mainSearch = await notion.databases.query({
        database_id: databaseId!,
        filter: {
          property: 'Name',
          title: { equals: number }
        }
      });

      if (mainSearch.results.length > 0) {
        const foundMainId = mainSearch.results[0].id;
        console.log('Found main Notion page ID:', foundMainId);
        mainTicketId = foundMainId;
        ticketId = foundMainId;
      } else {
        // إذا لم يكن السجل موجوداً في نويشن نهائياً (مثلاً بلاغ قديم أو مستورد مسبقاً)، نقوم بإنشائه تلقائياً كميزة ترقيع وإصلاح ذاتي كاملة!
        console.log('Ticket not found in Notion. Creating a new page for it...');
        const newPage = await notion.pages.create({
          parent: { database_id: databaseId! },
          properties: {
            'Name': { title: [{ text: { content: number } }] }
          }
        });
        const foundMainId = newPage.id;
        mainTicketId = foundMainId;
        ticketId = foundMainId;
        console.log('Successfully created missing ticket in Notion with ID:', foundMainId);
      }
    }

    // إذا لم نجد المعرف بعد كل محاولات البحث
    if (!ticketId && !statusDbId && !mainTicketId) {
      return NextResponse.json({ error: 'Ticket ID or Number is required' }, { status: 400 });
    }

    // 1. تحديث الحالة في نويشن
    if (solution !== undefined) {
      const properties: any = {};
      const targetProp = statusDbId ? 'الحالة' : 'الحل المقترح';
      properties[targetProp] = {
        select: { name: solution }
      };

      try {
        if (ticketId) {
          await notion.pages.update({
            page_id: ticketId,
            properties: properties,
          });
        }
      } catch (updateError: any) {
        // إذا فشل التحديث أو لم نملك معرفاً، وكان لدينا قاعدة بيانات حالات، نحاول البحث أو الإنشاء
        if (statusDbId && number) {
          console.log('Page update failed, attempting to find/create in status DB for ticket:', number);
          
          const searchRes = await notion.databases.query({
            database_id: statusDbId,
            filter: {
              property: 'Name',
              title: { equals: number }
            }
          });

          if (searchRes.results.length > 0) {
            ticketId = searchRes.results[0].id;
            await notion.pages.update({
              page_id: ticketId,
              properties: properties,
            });
          } else {
            const newPage = await notion.pages.create({
              parent: { database_id: statusDbId },
              properties: {
                'Name': { title: [{ text: { content: number } }] },
                'الحالة': { select: { name: solution } }
              }
            });
            ticketId = newPage.id;
          }
        } else {
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

    // حفظ الـ notion_id الحقيقي المكتشف في Supabase حتى لا يكون null مستقبلاً!
    if (mainTicketId) {
      updateData.notion_id = mainTicketId;
    }

    if (Object.keys(updateData).length > 0) {
      if (number) {
        // نحدث باستخدام رقم البلاغ لضمان إصلاح وتحديث السجل حتى لو كان notion_id في Supabase هو null!
        await supabase
          .from('tickets')
          .update(updateData)
          .eq('ticket_number', number);
      } else {
        // خيار بديل باستخدام المعرف
        const targetId = mainTicketId || ticketId;
        if (targetId) {
          await supabase
            .from('tickets')
            .update(updateData)
            .eq('notion_id', targetId);
        }
      }
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
