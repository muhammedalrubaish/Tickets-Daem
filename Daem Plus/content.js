// منطق تلوين خلية "رقم التذكرة" v20 - الاستقرار النهائي
let websiteTickets = [];

// جلب البيانات عبر الخلفية لتجاوز CORS
async function syncFromWebsite() {
  chrome.runtime.sendMessage({ action: "FETCH_TICKETS" }, (response) => {
    if (response && response.tickets) {
      websiteTickets = response.tickets;
    }
  });
}

function highlightTickets() {
  const allRows = document.querySelectorAll('tr');
  if (allRows.length === 0) return;

  let currentCounts = { new: 0, recent: 0, old: 0, veryOld: 0, unassigned: 0 };
  let foundAny = false;

  allRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return;

    // العمود الأول يحتوي عادة على رقم التذكرة
    const targetCell = cells[0];
    const text = targetCell.innerText.trim();
    const idMatch = text.match(/IM\d{5,9}/);
    const ticketId = idMatch ? idMatch[0] : null;

    // تنظيف التلوين
    targetCell.classList.remove('daem-cell-new', 'daem-cell-old', 'daem-cell-very-old', 'daem-cell-recent', 'daem-cell-unassigned');

    if (ticketId) {
      const myTicket = websiteTickets.find(t => {
          const n = String(t.number || "").trim();
          return n.includes(ticketId) || ticketId.includes(n);
      });

      if (myTicket) {
        foundAny = true;
        const status = myTicket.solution || "";
        const receiver = (myTicket.receiver || "").trim();

        if (receiver === "" || receiver === "غير محدد") {
            targetCell.classList.add('daem-cell-unassigned');
            currentCounts.unassigned++;
        } else if (status.includes('بلاغ جديد')) {
            targetCell.classList.add('daem-cell-recent');
            currentCounts.recent++;
        } else if (status.includes('تم الحل')) {
            targetCell.classList.add('daem-cell-new');
            currentCounts.new++;
        } else if (status.includes('لدى الوزارة')) {
            targetCell.classList.add('daem-cell-very-old');
            currentCounts.veryOld++;
        } else {
            targetCell.classList.add('daem-cell-old');
            currentCounts.old++;
        }
      }
    }
  });

  // لا نحدث العداد إلا إذا وجدنا بلاغات ملونة فعلاً في هذا الإطار
  if (foundAny) {
    chrome.storage.local.set({ daemCounts: currentCounts });
  }
}

syncFromWebsite();
setInterval(syncFromWebsite, 60000);
setInterval(highlightTickets, 2000);
