import { supabase } from '../../lib/supabase';
import IndicatorsTV from './IndicatorsTV';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getComplaints() {
  try {
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
      if (error || !data || data.length === 0) break;
      allData = allData.concat(data);
      if (data.length < batchSize) break;
      from += batchSize;
    }
    return allData.map(t => ({
      id: t.notion_id || t.id || t.ticket_number,
      number: t.ticket_number || 'غير محدد',
      type: t.category_type || 'غير محدد',
      status: t.status || 'غير محدد',
      solution: t.solution || 'غير محدد',
      date: t.reception_date || 'غير محدد',
      receiver: t.receiver || 'غير محدد',
    }));
  } catch {
    return [];
  }
}

export default async function IndicatorsPage() {
  const complaints = await getComplaints();
  return <IndicatorsTV initialComplaints={complaints} />;
}
