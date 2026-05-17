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

    // البحث الذاتي عن معرفات نويشن إذا كانت مفقودة (Self-Healing)
    if (number && (!ticketId || !mainTicketId)) {
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
        if (!mainTicketId) mainTicketId = foundMainId;
        if (!ticketId && !statusDbId) ticketId = foundMainId;
      }
    }

    // إذا كانت هناك قاعدة بيانات للحالات وكنا نفتقد لمعرف صفحة الحالة، نبحث عنها
    if (statusDbId && number && (!ticketId || ticketId === mainTicketId)) {
      console.log('Searching Notion status DB for ticket number:', number);
      const statusSearch = await notion.databases.query({
        database_id: statusDbId,
        filter: {
          property: 'Name',
          title: { equals: number }
        }
      });

      if (statusSearch.results.length > 0) {
        const foundStatusId = statusSearch.results[0].id;
        console.log('Found status Notion page ID:', foundStatusId);
        ticketId = foundStatusId;
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
        // إذا كان لدينا معرف صالح، نحاول التحديث مباشرة
        if (ticketId) {
          await notion.pages.update({
            page_id: ticketId,
            properties: properties,
          });
        } else {
          // إذا لم يكن هناك معرف ولكن لدينا رقم البلاغ (وقاعدة بيانات الحالات مفعلة)
          throw new Error('No status page ID');
        }
      } catch (updateError: any) {
        // إذا فشل التحديث أو لم نملك معرفاً، وكان لدينا قاعدة بيانات حالات، نحاول البحث أو الإنشاء
        if (statusDbId && number) {
          console.log('Page update failed or missing ID, attempting to find/create in status DB for ticket:', number);
          
          // البحث عن السجل برقم البلاغ
          const searchRes = await notion.databases.query({
            database_id: statusDbId,
            filter: {
              property: 'Name',
              title: { equals: number }
            }
          });

          if (searchRes.results.length > 0) {
            ticketId = searchRes.results[0].id;
            // السجل موجود، تحديثه
            await notion.pages.update({
              page_id: ticketId,
              properties: properties,
            });
          } else {
            // السجل غير موجود، إنشاؤه
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
