import { Client } from "@notionhq/client";
import { supabase } from "./supabase";

const notion = new Client({ auth: process.env.NOTION_SECRET });

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";
const NOTION_STATUS_DATABASE_ID = process.env.NOTION_STATUS_DATABASE_ID || "";

/**
 * تحديث الحالة/الحل المقترح في نويشن للبلاغ المحدد
 */
export async function updateNotionTicket(ticketNumber: string, solution: string) {
  if (!ticketNumber || ticketNumber === "غير محدد") return;
  console.log(`[Notion Sync] Updating ticket ${ticketNumber} to solution: ${solution}`);

  // 1. تحديث قاعدة بيانات توزيع البلاغات (NOTION_DATABASE_ID) -> حقل 'الحل المقترح'
  if (NOTION_DATABASE_ID) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter: {
          property: "Name",
          title: {
            equals: ticketNumber,
          },
        },
      });

      for (const page of response.results) {
        await notion.pages.update({
          page_id: page.id,
          properties: {
            "الحل المقترح": {
              select: solution ? { name: solution } : null,
            },
          },
        });
        console.log(`[Notion Sync] Updated database_id ${NOTION_DATABASE_ID} for page ${page.id}`);
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Failed to update NOTION_DATABASE_ID:`, err.message);
    }
  }

  // 2. تحديث قاعدة بيانات الحالات (NOTION_STATUS_DATABASE_ID) -> حقل 'الحالة'
  if (NOTION_STATUS_DATABASE_ID) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_STATUS_DATABASE_ID,
        filter: {
          property: "Name",
          title: {
            equals: ticketNumber,
          },
        },
      });

      for (const page of response.results) {
        await notion.pages.update({
          page_id: page.id,
          properties: {
            "الحالة": {
              select: solution ? { name: solution } : null,
            },
          },
        });
        console.log(`[Notion Sync] Updated status_database_id ${NOTION_STATUS_DATABASE_ID} for page ${page.id}`);
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Failed to update NOTION_STATUS_DATABASE_ID:`, err.message);
    }
  }
}

/**
 * جلب آخر التعديلات من Notion وتحديثها في Supabase
 */
export async function syncRecentNotionChanges() {
  console.log("[Notion Sync] Starting sync of recent Notion changes...");
  
  // سنقوم بجلب التحديثات التي تمت في الساعتين الأخيرتين
  const sinceTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // 1. مزامنة قاعدة البيانات الأولى (داعم - توزيع البلاغات)
  if (NOTION_DATABASE_ID) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter: {
          timestamp: "last_edited_time",
          last_edited_time: {
            on_or_after: sinceTime,
          },
        },
      });

      console.log(`[Notion Sync] Found ${response.results.length} recently edited pages in NOTION_DATABASE_ID`);

      for (const page of response.results as any[]) {
        const ticketNumber = page.properties.Name?.title?.[0]?.plain_text;
        if (!ticketNumber || !ticketNumber.startsWith("IM")) continue;

        const solution = page.properties["الحل المقترح"]?.select?.name || "لم يتم الحل";
        const receiver = page.properties["المستقبل"]?.select?.name || "غير محدد";
        const categoryType = page.properties["نوع التصنيف"]?.select?.name || "أخرى";
        const receptionDate = page.properties["تاريخ استقبال البلاغ"]?.date?.start || null;

        // تحديث في Supabase
        const updateData: any = {
          solution,
          receiver,
          category_type: categoryType,
          status: (solution === "تم الحل") ? "إغلاق" : "قيد المعالجة"
        };
        if (receptionDate) {
          updateData.reception_date = receptionDate;
        }

        const { error } = await supabase
          .from("tickets")
          .update(updateData)
          .eq("ticket_number", ticketNumber);

        if (error) {
          console.error(`[Notion Sync Error] Failed to update Supabase ticket ${ticketNumber}:`, error.message);
        } else {
          console.log(`[Notion Sync] Synced ticket ${ticketNumber} from NOTION_DATABASE_ID to Supabase`);
        }
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Error syncing NOTION_DATABASE_ID:`, err.message);
    }
  }

  // 2. مزامنة قاعدة البيانات الثانية (داعم - الحالات)
  if (NOTION_STATUS_DATABASE_ID) {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_STATUS_DATABASE_ID,
        filter: {
          timestamp: "last_edited_time",
          last_edited_time: {
            on_or_after: sinceTime,
          },
        },
      });

      console.log(`[Notion Sync] Found ${response.results.length} recently edited pages in NOTION_STATUS_DATABASE_ID`);

      for (const page of response.results as any[]) {
        const ticketNumber = page.properties.Name?.title?.[0]?.plain_text;
        if (!ticketNumber || !ticketNumber.startsWith("IM")) continue;

        const solution = page.properties["الحالة"]?.select?.name;
        if (!solution) continue;

        const { error } = await supabase
          .from("tickets")
          .update({
            solution,
            status: (solution === "تم الحل") ? "إغلاق" : "قيد المعالجة"
          })
          .eq("ticket_number", ticketNumber);

        if (error) {
          console.error(`[Notion Sync Error] Failed to update Supabase ticket ${ticketNumber} from status DB:`, error.message);
        } else {
          console.log(`[Notion Sync] Synced ticket ${ticketNumber} status (${solution}) from NOTION_STATUS_DATABASE_ID to Supabase`);
        }
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Error syncing NOTION_STATUS_DATABASE_ID:`, err.message);
    }
  }
}
