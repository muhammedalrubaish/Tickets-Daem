import { Client } from "@notionhq/client";
import { supabase } from "./supabase";

const notion = new Client({ auth: process.env.NOTION_SECRET });

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";
const NOTION_STATUS_DATABASE_ID = process.env.NOTION_STATUS_DATABASE_ID || "";

// دالة تحويل الحالات الخاصة في نويشن إلى حالة "بانتظار المستفيد" في الموقع
function mapNotionStatus(status: string): string {
  const targetStatuses = [
    "بانتظار الموظف",
    "بانتظار المكتب الهندسي",
    "بانتظار الأمانة",
    "بانتظار البلدية"
  ];
  if (targetStatuses.includes(status)) {
    return "بانتظار المستفيد";
  }
  return status;
}

/**
 * تحديث الحالة/الحل المقترح/تاريخ الاستحقاق في نويشن للبلاغ المحدد
 */
export async function updateNotionTicket(ticketNumber: string, solution?: string, dueDate?: string) {
  if (!ticketNumber || ticketNumber === "غير محدد") return;
  console.log(`[Notion Sync] Updating ticket ${ticketNumber} with solution: ${solution}, dueDate: ${dueDate}`);

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
        const updateProps: any = {};
        if (solution !== undefined) {
          updateProps["الحل المقترح"] = {
            select: solution ? { name: solution } : null,
          };
        }
        if (Object.keys(updateProps).length > 0) {
          await notion.pages.update({
            page_id: page.id,
            properties: updateProps,
          });
          console.log(`[Notion Sync] Updated database_id ${NOTION_DATABASE_ID} for page ${page.id}`);
        }
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Failed to update NOTION_DATABASE_ID:`, err.message);
    }
  }

  // 2. تحديث قاعدة بيانات الحالات (NOTION_STATUS_DATABASE_ID) -> حقل 'الحالة' و 'Due Date'
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
        const updateProps: any = {};
        if (solution !== undefined) {
          updateProps["الحالة"] = {
            select: solution ? { name: solution } : null,
          };
        }
        if (dueDate !== undefined) {
          updateProps["Due Date"] = {
            date: dueDate ? { start: dueDate } : null,
          };
        }
        
        if (Object.keys(updateProps).length > 0) {
          await notion.pages.update({
            page_id: page.id,
            properties: updateProps,
          });
          console.log(`[Notion Sync] Updated status_database_id ${NOTION_STATUS_DATABASE_ID} for page ${page.id}`);
        }
      }
    } catch (err: any) {
      console.error(`[Notion Sync Error] Failed to update NOTION_STATUS_DATABASE_ID:`, err.message);
    }
  }
}

/**
 * إنشاء صفحة بلاغ جديدة في قاعدة بيانات الحالات في نويشن
 */
export async function createNotionTicket(
  ticketNumber: string,
  category: string,
  receiver: string,
  date: string,
  reportText: string,
  phoneNumber: string
) {
  if (!NOTION_STATUS_DATABASE_ID) return;
  console.log(`[Notion Sync] Creating ticket page in Notion: ${ticketNumber}`);
  try {
    const response = await notion.pages.create({
      parent: { database_id: NOTION_STATUS_DATABASE_ID },
      properties: {
        "Name": {
          title: [
            {
              text: {
                content: ticketNumber
              }
            }
          ]
        },
        "نوع التصنيف": {
          select: category ? { name: category } : null
        },
        "المستقبل": {
          select: receiver ? { name: receiver } : null
        },
        "الحالة": {
          select: { name: "قيد الحل" }
        },
        "Due Date": {
          date: date ? { start: date } : null
        },
        "سبب البلاغ": {
          rich_text: [
            {
              text: {
                content: reportText || ""
              }
            }
          ]
        },
        "رقم الجوال": {
          phone_number: phoneNumber || null
        }
      }
    });
    console.log(`[Notion Sync] Created Notion page: ${response.id}`);
    return response.id;
  } catch (err: any) {
    console.error(`[Notion Sync Error] Failed to create Notion page:`, err.message);
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

        const rawSolution = page.properties["الحل المقترح"]?.select?.name || "لم يتم الحل";
        const solution = mapNotionStatus(rawSolution);
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

        const rawSolution = page.properties["الحالة"]?.select?.name;
        if (!rawSolution) continue;
        const solution = mapNotionStatus(rawSolution);

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
