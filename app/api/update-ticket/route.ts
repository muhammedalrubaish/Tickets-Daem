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
      // 1. معالجة وتصحيح صفحة قاعدة البيانات الرئيسية (Main Database Page)
      console.log('Searching Notion main DB for ticket number:', number);
      const mainSearch = await notion.databases.query({
        database_id: databaseId!,
        filter: {
          property: 'Name',
          title: { equals: number }
        }
      });

      if (mainSearch.results.length > 0) {
        mainTicketId = mainSearch.results[0].id;
        console.log('Found main Notion page ID:', mainTicketId);
      } else {
        console.log('Ticket not found in Notion main DB. Creating a new page...');
        const newPage = await notion.pages.create({
          parent: { database_id: databaseId! },
          properties: {
            'Name': { title: [{ text: { content: number } }] }
          }
        });
        mainTicketId = newPage.id;
        console.log('Successfully created missing ticket in Notion main DB with ID:', mainTicketId);
      }

      // 2. معالجة وتصحيح صفحة قاعدة بيانات الحالات (Status Database Page) إذا كانت مفعلة
      if (statusDbId) {
        console.log('Searching Notion status DB for ticket number:', number);
        const statusSearch = await notion.databases.query({
          database_id: statusDbId,
          filter: {
            property: 'Name',
            title: { equals: number }
          }
        });

        if (statusSearch.results.length > 0) {
          ticketId = statusSearch.results[0].id;
          console.log('Found status Notion page ID:', ticketId);
        } else {
          console.log('Ticket not found in Notion status DB. Creating a new page...');
          const properties: any = {
            'Name': { title: [{ text: { content: number } }] }
          };
          if (solution !== undefined) {
            properties['الحالة'] = { select: { name: solution } };
          }
          const newStatusPage = await notion.pages.create({
            parent: { database_id: statusDbId },
            properties: properties
          });
          ticketId = newStatusPage.id;
          console.log('Successfully created missing ticket in Notion status DB with ID:', ticketId);
        }
      } else {
        // إذا لم تكن هناك قاعدة بيانات حالات منفصلة، تكون صفحة الحالة هي نفسها صفحة البيانات الرئيسية
        ticketId = mainTicketId;
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
        console.error('Failed to update solution property on page:', ticketId, updateError);
        throw updateError;
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
