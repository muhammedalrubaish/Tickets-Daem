import { supabase } from '../lib/supabase';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0; 

async function getComplaints() {
  try {
    // 1. Insert directly into Supabase
    // Temporary seed check
    const { data: checkData } = await supabase
      .from('tickets')
      .select('id')
      .eq('ticket_number', 'IM4525764')
      .limit(1);
    
    if (!checkData || checkData.length === 0) {
      console.log('🌱 Seeding 55 tickets...');
      const nameMap: Record<string, string> = {
        "محمد": "محمد الربيش",
        "البراء": "البراء النصيان",
        "عبدالرحمن": "عبدالرحمن العمري",
        "عزام": "عزام الحربي",
        "صالح": "صالح الغصن",
        "طارق": "طارق الهدياني",
        "ثامر": "ثامر المنصور"
      };
      const rawTickets = [
        { number: "IM4525764", name: "محمد" },
        { number: "IM4524790", name: "البراء" },
        { number: "IM4526017", name: "عبدالرحمن" },
        { number: "IM4527420", name: "عزام" },
        { number: "IM4526026", name: "طارق" },
        { number: "IM4528542", name: "ثامر" },
        { number: "IM4525603", name: "صالح" },
        { number: "IM4516014", name: "محمد" },
        { number: "IM4526034", name: "البراء" },
        { number: "IM4526045", name: "عبدالرحمن" },
        { number: "IM4526062", name: "عزام" },
        { number: "IM4526068", name: "صالح" },
        { number: "IM4526081", name: "طارق" },
        { number: "IM4526090", name: "ثامر" },
        { number: "IM4526126", name: "محمد" },
        { number: "IM4526219", name: "البراء" },
        { number: "IM4527171", name: "عبدالرحمن" },
        { number: "IM4527567", name: "عزام" },
        { number: "IM4527605", name: "صالح" },
        { number: "IM4527526", name: "طارق" },
        { number: "IM4525073", name: "ثامر" },
        { number: "IM4527618", name: "محمد" },
        { number: "IM4526020", name: "البراء" },
        { number: "IM4526884", name: "عبدالرحمن" },
        { number: "IM4525490", name: "عزام" },
        { number: "IM4526564", name: "صالح" },
        { number: "IM4525675", name: "طارق" },
        { number: "IM4527150", name: "ثامر" },
        { number: "IM4528573", name: "محمد" },
        { number: "IM4528443", name: "البراء" },
        { number: "IM4528361", name: "عبدالرحمن" },
        { number: "IM4528151", name: "عزام" },
        { number: "IM4527556", name: "صالح" },
        { number: "IM4529071", name: "طارق" },
        { number: "IM4528511", name: "ثامر" },
        { number: "IM4528400", name: "محمد" },
        { number: "IM4528218", name: "البراء" },
        { number: "IM4528174", name: "عبدالرحمن" },
        { number: "IM4528172", name: "عزام" },
        { number: "IM4524726", name: "صالح" },
        { number: "IM4529481", name: "طارق" },
        { number: "IM4524967", name: "ثامر" },
        { number: "IM4525007", name: "محمد" },
        { number: "IM4525183", name: "البراء" },
        { number: "IM4527619", name: "عبدالرحمن" },
        { number: "IM4527674", name: "عزام" },
        { number: "IM4530170", name: "صالح" },
        { number: "IM4529778", name: "طارق" },
        { number: "IM4529455", name: "ثامر" },
        { number: "IM4526848", name: "محمد" },
        { number: "IM4529533", name: "البراء" },
        { number: "IM4530084", name: "عبدالرحمن" },
        { number: "IM4528060", name: "عزام" },
        { number: "IM4528741", name: "صالح" },
        { number: "IM4530478", name: "طارق" }
      ];
      const todayDate = new Date().toISOString().split('T')[0];
      const ticketsToInsert = rawTickets.map(t => ({
        ticket_number: t.number.trim(),
        category_type: "غير محدد",
        status: "قيد المعالجة",
        solution: "بلاغ جديد",
        reception_date: todayDate,
        receiver: nameMap[t.name] || "غير محدد"
      }));
      await supabase.from('tickets').insert(ticketsToInsert);
      console.log('🌱 Seeding complete.');
    }

    // Supabase يعيد 1000 سجل كحد أقصى في الطلب الواحد
    // لذا نجلب البيانات على دفعات لضمان الحصول على الأرشيف الكامل
    let allData: any[] = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .gte('reception_date', '2026-04-04')
        .order('reception_date', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('Supabase error:', error);
        break;
      }

      if (!data || data.length === 0) break;
      
      allData = allData.concat(data);
      
      // إذا جلبنا أقل من الحد، يعني وصلنا لنهاية البيانات
      if (data.length < batchSize) break;
      
      from += batchSize;
    }

    return allData.map(ticket => ({
      id: ticket.notion_id || ticket.id || ticket.ticket_number,
      statusPageId: ticket.notion_id,
      number: ticket.ticket_number || 'غير محدد',
      type: ticket.category_type || 'غير محدد',
      status: ticket.status || 'غير محدد',
      solution: ticket.solution || 'غير محدد',
      date: ticket.reception_date || 'غير محدد',
      receiver: ticket.receiver || 'غير محدد',
      createdAt: ticket.created_at
    }));
  } catch (err) {
    console.error('Fetch error:', err);
    return [];
  }
}

export default async function Home() {
  const complaints = await getComplaints();
  return <DashboardClient complaints={complaints} />;
}
