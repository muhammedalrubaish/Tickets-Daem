(function() {
  if (window.__daemPlusInjected) {
    try { alert('داعم بلس مفعّل بالفعل على هذه الصفحة ✅'); } catch (e) {}
    return;
  }
  window.__daemPlusInjected = true;

// ============================================================
// داعم بلس - نسخة البوكماركلت (Bookmarklet Injection Version)
// نفس منطق content.js الأصلي، لكن بدل واجهات الإضافة (chrome.storage/chrome.runtime)
// نستخدم localStorage مباشرة + fetch مباشر (CORS مفعّل على السيرفر لهذا الغرض)
// ============================================================
let websiteTickets = [];
let listWarningDismissed = false;
let lastMismatchedIds = "";

let currentLoggedUserKey = 'alrubaish';
let currentLoggedUserArabic = 'محمد الربيش';

const DAEMPLUS_API_BASE = "https://tickets-daem.vercel.app";
const DAEMPLUS_LS_PREFIX = "__daemplus_";

function safeGetStorage(keys, callback) {
  try {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const result = {};
    keyList.forEach((k) => {
      const raw = localStorage.getItem(DAEMPLUS_LS_PREFIX + k);
      if (raw !== null) {
        try { result[k] = JSON.parse(raw); } catch (e) { result[k] = raw; }
      }
    });
    callback(result);
  } catch (e) {
    callback({});
  }
}

function safeSetStorage(data, callback) {
  try {
    Object.keys(data).forEach((k) => {
      localStorage.setItem(DAEMPLUS_LS_PREFIX + k, JSON.stringify(data[k]));
    });
    if (callback) callback();
  } catch (e) {}
}

function safeRemoveStorage(keys, callback) {
  try {
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach((k) => localStorage.removeItem(DAEMPLUS_LS_PREFIX + k));
    if (callback) callback();
  } catch (e) {}
}

async function daemplusFetchTickets() {
  try {
    const response = await fetch(DAEMPLUS_API_BASE + "/api/tickets-json");
    if (response.ok) return await response.json();
  } catch (e) { console.error("daemplus fetchTickets error", e); }
  return null;
}

async function daemplusCreateTicket(ticketData) {
  try {
    const response = await fetch(DAEMPLUS_API_BASE + "/api/create-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticketData)
    });
    if (response.ok) return { success: true };
    return { success: false, error: await response.text() };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function daemplusUpdateTicketDate(ticketNumber, date) {
  try {
    const response = await fetch(DAEMPLUS_API_BASE + "/api/update-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: ticketNumber, date: date })
    });
    if (response.ok) return { success: true };
    return { success: false, error: await response.text() };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function daemplusCorrectSpelling(text) {
  try {
    const response = await fetch(DAEMPLUS_API_BASE + "/api/correct-spelling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (response.ok) {
      const data = await response.json();
      return { success: true, correctedText: data.correctedText, errorCount: data.errorCount || 0 };
    }
    return { success: false, error: await response.text() };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function safeSendMessage(message, callback) {
  const respond = (res) => { if (callback) callback(res); };
  try {
    if (message.action === "FETCH_TICKETS") {
      daemplusFetchTickets().then((data) => respond({ tickets: data }));
    } else if (message.action === "CREATE_TICKET") {
      daemplusCreateTicket(message.data).then(respond);
    } else if (message.action === "UPDATE_TICKET_DATE") {
      daemplusUpdateTicketDate(message.data.ticketNumber, message.data.date).then(respond);
    } else if (message.action === "CORRECT_SPELLING") {
      daemplusCorrectSpelling(message.data.text).then(respond);
    } else {
      respond(null);
    }
  } catch (e) {
    respond(null);
  }
}

try {
  safeGetStorage(['daemUserKey', 'daemUserArabic'], (result) => {
    if (result.daemUserKey) currentLoggedUserKey = result.daemUserKey;
    if (result.daemUserArabic) currentLoggedUserArabic = result.daemUserArabic;
  });
} catch (e) {}

const EMPLOYEES = [
  {
    key: 'alnesayan',
    arabic: 'البراء النصيان',
    username: 'a.alnesayan',
    names: ['البراء النصيان', 'البراء علي ابراهيم النصيان', 'alnesayan', 'al-nesayan', 'albaraa', 'a.alnesayan']
  },
  {
    key: 'alowaid',
    arabic: 'عبدالله العويد',
    username: 'aalowaid',
    names: ['عبدالله العويد', 'عبدالله عبدالعزيز محمد العويد', 'alowaid', 'al-owaid', 'aalowaid']
  },
  {
    key: 'alamri',
    arabic: 'عبدالرحمن العمري',
    username: 'af.alamri',
    names: ['عبدالرحمن العمري', 'عبدالرحمن فهيد العمري', 'alamri', 'al-amri', 'af.alamri']
  },
  {
    key: 'alharbi',
    arabic: 'عزام الحربي',
    username: 'azz.alharbi',
    names: ['عزام الحربي', 'عزام أحمد محمد الفريدي الحربي', 'alharbi', 'al-harbi', 'azz.alharbi']
  },
  {
    key: 'alrubaish',
    arabic: 'محمد الربيش',
    username: 'mialrubaish',
    names: ['محمد الربيش', 'محمد إبراهيم محمد الربيش', 'alrubaish', 'al-rubaish', 'mialrubaish', 'ed Ibrahem alrubaish', 'Mohammed Ibrahem alrubaish', 'edrubaish', 'mialrubaish@qassim.gov.sa']
  },
  {
    key: 'alghosen',
    arabic: 'صالح الغصن',
    username: 's.alghosen',
    names: ['صالح الغصن', 'صالح عبدالعزيز صالح الغصن', 'alghosen', 'al-ghosen', 's.alghosen']
  },
  {
    key: 'alhedyani',
    arabic: 'طارق الهدياني',
    username: 't.alhedyani',
    names: ['طارق الهدياني', 'طارق عبدالعزيز عبدالله الهدياني', 'alhedyani', 'al-hedyani', 't.alhedyani']
  },
  {
    key: 'almansour',
    arabic: 'ثامر المنصور',
    username: 't.almansour',
    names: ['ثامر المنصور', 'ثامر عبدالله محمد المنصور', 'almansour', 'al-mansour', 't.almansour']
  }
];

function findEmployeeByName(nameStr) {
  if (!nameStr) return null;
  const cleanName = nameStr.trim().toLowerCase();
  for (const emp of EMPLOYEES) {
    for (const variant of emp.names) {
      const cleanVariant = variant.toLowerCase();
      if (cleanName.includes(cleanVariant) || cleanVariant.includes(cleanName)) {
        return emp;
      }
    }
  }
  const parts = cleanName.split(/\s+/);
  for (const part of parts) {
    if (part.length < 3) continue;
    if (['ibrahem', 'mohammed', 'abdullah'].includes(part)) continue;
    for (const emp of EMPLOYEES) {
      for (const variant of emp.names) {
        const cleanVariant = variant.toLowerCase();
        if (cleanVariant.includes(part)) {
          return emp;
        }
      }
    }
  }
  return null;
}

function isMyTaskListActive() {
  function checkDoc(doc) {
    if (!doc) return false;
    
    // 1. تفقد القوائم المنسدلة (select) المعتادة
    const selects = doc.querySelectorAll('select');
    for (const select of selects) {
      if (select.selectedIndex !== -1) {
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption) {
          const optText = selectedOption.text.replace(/\s+/g, ' ').trim();
          if (optText.includes('قائمة المهام الخاصة بي') || optText.includes('المهام الخاصة بي')) {
            return true;
          }
        }
      }
    }
    
    // 2. تفقد حقول الإدخال (Inputs) - مهم جداً لمنصة Remedy/Daem
    const inputs = doc.querySelectorAll('input');
    for (const input of inputs) {
      const val = (input.value || '').trim();
      if (val.includes('قائمة المهام الخاصة بي') || val.includes('المهام الخاصة بي')) {
        return true;
      }
    }
    
    // 3. تفقد العناصر النصية بشكل عام وسريع بدون layout thrashing
    if (doc.body) {
      const bodyText = doc.body.innerText || '';
      if (bodyText.includes('قائمة المهام الخاصة بي') || bodyText.includes('المهام الخاصة بي')) {
        // فحص سريع ومحدد للعناصر النشطة فقط مثل القوائم المخصصة
        const dropdowns = doc.querySelectorAll('.selection, .dropdown, [role="combobox"], div[id*="select"]');
        for (const el of dropdowns) {
          const txt = (el.innerText || '').trim();
          if (txt.includes('قائمة المهام الخاصة بي') || txt.includes('المهام الخاصة بي')) {
            return true;
          }
        }
        
        // إذا كان النص موجوداً ولم نجد قائمة مخصصة، نكتفي بمطابقته كدليل كافٍ
        return true;
      }
    }
    return false;
  }

  // فحص المستند الحالي
  if (checkDoc(document)) return true;

  // فحص المستند الرئيسي (Top window) لدعم وجود الجدول داخل إطار (Iframe)
  try {
    if (window.top && window.top.document && window.top.document !== document) {
      if (checkDoc(window.top.document)) return true;
    }
  } catch (e) {}

  // فحص كافة الإطارات الأخرى المتصلة
  try {
    if (window.top && window.top.frames) {
      for (let i = 0; i < window.top.frames.length; i++) {
        try {
          const frameDoc = window.top.frames[i].document;
          if (frameDoc && frameDoc !== document) {
            if (checkDoc(frameDoc)) return true;
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  return false;
}

// جلب البيانات عبر الخلفية لتجاوز CORS
async function syncFromWebsite() {
  safeSendMessage({ action: "FETCH_TICKETS" }, (response) => {
    if (response && response.tickets) {
      const resData = response.tickets;
      websiteTickets = Array.isArray(resData) ? resData : (resData.tickets || []);
      
      // تحديث نص زر التوزيع ديناميكياً بعد انتهاء جلب البيانات
      const nextEmployee = getLeastReceiver();
      updateSubmitButtonText(nextEmployee);
    }
  });
}

// جلب البيانات بـ Promise للاستخدام المتزامن/اللحظي
function fetchTicketsPromise() {
  return new Promise((resolve) => {
    safeSendMessage({ action: "FETCH_TICKETS" }, (response) => {
      if (response && response.tickets) {
        const resData = response.tickets;
        const tickets = Array.isArray(resData) ? resData : (resData.tickets || []);
        resolve(tickets);
      } else {
        resolve([]);
      }
    });
  });
}

function highlightTickets() {
  const allRows = document.querySelectorAll('tr');
  if (allRows.length === 0) return;

  // البحث عن عمود المهندس ديناميكياً
  let engineerColIdx = -1;
  const headers = document.querySelectorAll('th');
  headers.forEach((th, idx) => {
    const thText = th.innerText.trim();
    if (thText.includes('المهندس') || thText.includes('Engineer')) {
      engineerColIdx = idx;
    }
  });
  if (engineerColIdx === -1) {
    engineerColIdx = 4; // القيمة الافتراضية
  }

  let currentCounts = { new: 0, recent: 0, old: 0, veryOld: 0, unassigned: 0, notSolved: 0 };
  let foundAny = false;
  let mismatchedList = [];

  allRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return;

    // البحث الديناميكي عن خلية رقم التذكرة
    let targetCell = null;
    let ticketId = null;
    for (let i = 0; i < cells.length; i++) {
      const cellText = cells[i].innerText.trim();
      const match = cellText.match(/IM\d{5,9}/);
      if (match) {
        targetCell = cells[i];
        ticketId = match[0];
        break;
      }
    }

    if (!targetCell) return;

    // تنظيف التلوين ومؤشرات النقل السابقة
    targetCell.classList.remove('daem-cell-new', 'daem-cell-old', 'daem-cell-very-old', 'daem-cell-recent', 'daem-cell-unassigned', 'daem-cell-not-solved', 'daem-cell-mismatch');
    const oldIndicators = row.querySelectorAll('.daem-transfer-indicator');
    oldIndicators.forEach(ind => ind.remove());
    targetCell.style.borderRight = '';

    if (ticketId) {
      const myTicket = websiteTickets.find(t => {
          const n = String(t.number || "").trim();
          return n.includes(ticketId) || ticketId.includes(n);
      });

      if (myTicket) {
        foundAny = true;
        const status = (myTicket.solution || "").trim();

        // حساب ما إذا كانت التذكرة متأخرة لأكثر من أسبوع
        const isNew = status === 'بلاغ جديد' || status === 'غير محدد' || status === '';
        let isLate = false;
        if (isNew && myTicket.date && myTicket.date !== 'غير محدد') {
          try {
            const ticketDate = new Date(myTicket.date);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            if (ticketDate < oneWeekAgo) {
              isLate = true;
            }
          } catch (e) {}
        }

        if (isLate) {
          targetCell.classList.add('daem-cell-unassigned');
          currentCounts.unassigned++;
        } else if (status === 'بلاغ جديد') {
          targetCell.classList.add('daem-cell-new');
          currentCounts.new++;
        } else if (status === 'بانتظار المستفيد') {
          targetCell.classList.add('daem-cell-recent');
          currentCounts.recent++;
        } else if (status === 'لدى الوزارة') {
          targetCell.classList.add('daem-cell-very-old');
          currentCounts.veryOld++;
        } else if (status === 'مشكلة عامة') {
          targetCell.classList.add('daem-cell-old');
          currentCounts.old++;
        } else if (status === 'لم يتم الحل') {
          targetCell.classList.add('daem-cell-not-solved');
          currentCounts.notSolved++;
        }
      }
    }
  });

  // إزالة لوحة تنبيهات القائمة العائمة (لأن التنبيه يظهر فقط في الصفحة التفصيلية للبلاغ)
  updateListWarningPanel([]);

  // لا نحدث العداد إلا إذا وجدنا بلاغات ملونة فعلاً في هذا الإطار
  if (foundAny) {
    safeSetStorage({ daemCounts: currentCounts });
  }
}

function updateListWarningPanel(mismatchedList) {
  // تجنب الإطارات الصغيرة
  if (window.innerWidth < 500 || window.innerHeight < 400) {
    return;
  }

  let panel = document.getElementById('daem-list-warning-panel');
  
  if (mismatchedList.length === 0) {
    if (panel) {
      panel.remove();
    }
    return;
  }

  const currentIds = mismatchedList.map(item => item.id).sort().join(',');
  if (currentIds !== lastMismatchedIds) {
    listWarningDismissed = false; // إعادة ضبط الإغلاق عند تغير قائمة البلاغات المخالفة
    lastMismatchedIds = currentIds;
  }

  if (listWarningDismissed) {
    if (panel) {
      panel.remove();
    }
    return;
  }

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'daem-list-warning-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '30px';
    panel.style.right = '30px';
    panel.style.width = '320px';
    panel.style.backgroundColor = '#78350f'; // كهرماني داكن
    panel.style.border = '2px solid #f59e0b';
    panel.style.borderRadius = '16px';
    panel.style.boxShadow = '0 15px 35px rgba(0,0,0,0.5)';
    panel.style.zIndex = '999999';
    panel.style.fontFamily = 'Cairo, Arial, sans-serif';
    panel.style.direction = 'rtl';
    panel.style.padding = '15px';
    panel.style.color = '#fef3c7';
    panel.style.transition = 'all 0.3s ease';
    
    // منع إغلاق اللوحة عند النقر عليها بالخطأ
    panel.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.body.appendChild(panel);
  }

  let listItemsHtml = mismatchedList.map(item => `
    <div style="background-color: rgba(0,0,0,0.25); border-radius: 8px; padding: 10px; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
      <span>رقم البلاغ: <strong style="color: #ffffff; text-decoration: underline;">${item.id}</strong></span>
      <span style="color: #fef3c7; font-weight: bold; background-color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 11px;">👤 ${item.dbEmp}</span>
    </div>
  `).join('');

  panel.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(254, 243, 199, 0.2); padding-bottom: 8px; margin-bottom: 10px;">
      <span style="font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 6px;">
        ⚠️ تنبيه: بلاغات مسندة لزملاء آخرين
      </span>
      <button id="btn-close-list-warning" style="background: transparent; border: none; color: #fef3c7; cursor: pointer; font-weight: bold; font-size: 14px; padding: 2px 6px; transition: color 0.2s;">✕</button>
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto; padding-right: 2px;">
      ${listItemsHtml}
    </div>
  `;

  // ربط زر الإغلاق
  document.getElementById('btn-close-list-warning').addEventListener('click', (e) => {
    e.stopPropagation();
    listWarningDismissed = true;
    panel.remove();
  });
}

// ==========================================
// ميزات لوحة تحكم عائمة ذكية (🚀 داعم بلس Premium)
// ==========================================

function findJournalUpdatesElement() {
  // 1. البحث باستخدام التسمية "تحديثات دفتر اليومية"
  const labels = Array.from(document.querySelectorAll('label, span, td, div, label-form'));
  for (const label of labels) {
    const txt = (label.innerText || '').trim();
    if (txt === 'تحديثات دفتر اليومية:' || txt === 'تحديثات دفتر اليومية' || txt.includes('دفتر اليومية') || txt.includes('Journal Updates')) {
      let parent = label.parentElement;
      while (parent && parent !== document.body) {
        // البحث عن textarea أولاً داخل نفس الحاوية
        const textarea = parent.querySelector('textarea');
        if (textarea && (textarea.readOnly || textarea.disabled || textarea.value.includes('Asia/Riyadh'))) {
          return textarea;
        }
        // إذا لم يكن textarea، نبحث عن حاوية div أو pre تحتوي على نصوص التحديثات
        const scrollableDivs = Array.from(parent.querySelectorAll('div, pre, td'));
        for (const div of scrollableDivs) {
          const val = div.innerText || '';
          if (val.includes('Asia/Riyadh') || val.includes('--') || /\d{2}\/\d{2}/.test(val)) {
            return div;
          }
        }
        parent = parent.parentElement;
      }
    }
  }

  // 2. البحث العام عن أي عنصر يحتوي على علامات التحديثات التاريخية (مثل Asia/Riyadh أو Contractor)
  const candidates = Array.from(document.querySelectorAll('textarea, div, pre, td'));
  for (const el of candidates) {
    const val = el.tagName === 'TEXTAREA' ? (el.value || '') : (el.innerText || '');
    if (val.includes('Asia/Riyadh') || val.includes('Contractor') || (val.includes('--') && /\d{2}\/\d{2}/.test(val))) {
      // نضمن ألا يكون هذا هو حقل الكتابة النشط للمستخدم
      if (el.tagName === 'TEXTAREA') {
        if (el.readOnly || el.disabled) {
          return el;
        }
      } else {
        // تجنب الحاويات الضخمة مثل body أو html
        if (el.tagName !== 'BODY' && el.tagName !== 'HTML' && val.length < 5000) {
          return el;
        }
      }
    }
  }
  return null;
}

let lastFocusedElement = null;
document.addEventListener('focusin', (e) => {
  const el = e.target;
  if (el && (
    el.tagName === 'TEXTAREA' || 
    (el.tagName === 'INPUT' && ['text', 'search', 'url', 'tel', 'email'].includes(el.type)) || 
    el.contentEditable === 'true' || 
    el.getAttribute('contenteditable') === 'true'
  )) {
    lastFocusedElement = el;
  }
});

function getEditableValue(el) {
  if (!el) return "";
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    return el.value || "";
  }
  return el.innerText || "";
}

function setEditableValue(el, val) {
  if (!el) return;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    el.value = val;
  } else {
    el.innerText = val;
  }
}

function findActiveInput() {
  // 1. استخدام آخر حقل تم التركيز عليه من قبل المستخدم
  if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
    return lastFocusedElement;
  }

  // 2. البحث عن أي حقل textarea نشط ومرئي ومفتوح للكتابة
  const textareas = Array.from(document.querySelectorAll('textarea'));
  const editableTextareas = textareas.filter(ta => !ta.readOnly && !ta.disabled && ta.style.display !== 'none');
  if (editableTextareas.length > 0) {
    for (const ta of editableTextareas) {
      const name = (ta.name || '').toLowerCase();
      const id = (ta.id || '').toLowerCase();
      if (name.includes('update') || name.includes('resolution') || name.includes('sol') || id.includes('update') || id.includes('resolution') || name.includes('desc') || id.includes('desc')) {
        return ta;
      }
    }
    return editableTextareas[0];
  }

  // 3. البحث في عناصر contenteditable
  const contentEditables = Array.from(document.querySelectorAll('[contenteditable="true"]'));
  if (contentEditables.length > 0) {
    return contentEditables[0];
  }

  // 4. البحث في حقول الإدخال النصية (input) المفتوحة للكتابة
  const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
  const editableInputs = inputs.filter(inp => !inp.readOnly && !inp.disabled && inp.style.display !== 'none');
  if (editableInputs.length > 0) {
    return editableInputs[0];
  }

  // 5. البحث داخل أي iframe في الصفحة
  const iframes = Array.from(document.querySelectorAll('iframe'));
  for (const iframe of iframes) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        const subTextareas = Array.from(iframeDoc.querySelectorAll('textarea'));
        const subEditable = subTextareas.filter(ta => !ta.readOnly && !ta.disabled && ta.style.display !== 'none');
        if (subEditable.length > 0) return subEditable[0];

        const subEditables = Array.from(iframeDoc.querySelectorAll('[contenteditable="true"]'));
        if (subEditables.length > 0) return subEditables[0];

        const subInputs = Array.from(iframeDoc.querySelectorAll('input[type="text"]'));
        const subEditableInputs = subInputs.filter(inp => !inp.readOnly && !inp.disabled && inp.style.display !== 'none');
        if (subEditableInputs.length > 0) return subEditableInputs[0];
      }
    } catch (e) {
      // قد يفشل بسبب سياسة المنشأ المشترك (cross-origin)
    }
  }

  return null;
}


function findAssigneeInput() {
  const labels = Array.from(document.querySelectorAll('label, span, td, div'));
  for (const label of labels) {
    const txt = (label.innerText || '').trim();
    if (txt === 'المستقبل' || txt === 'المستقبل:' || txt === 'Assignee' || txt.includes('Assignee')) {
      let parent = label.parentElement;
      while (parent && parent !== document.body) {
        const input = parent.querySelector('input[type="text"], select');
        if (input) return input;
        parent = parent.parentElement;
      }
    }
  }
  
  let el = document.querySelector('input[name*="assignee"], input[id*="assignee"], input[name*="receiver"], input[id*="receiver"]');
  if (el) return el;
  return null;
}

function extractLatestUpdate(fullText) {
  if (!fullText) return '';
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
  let latestLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // تحديد ما إذا كان السطر يمثل ترويسة/بيانات وصفية (اسم الموظف، التوقيت، المنطقة الزمنية)
    const isHeader = line.includes('Asia/Riyadh') || line.includes('|') || line.includes('--') || /\d{2}\/\d{2}\/\d{2}/.test(line) || line.includes('Contractor');
    
    if (isHeader) {
      if (latestLines.length > 0) {
        // إذا كنا قد جمعنا أسطر التحديث الأول ووصلنا للترويسة التالية، نتوقف هنا
        break;
      }
      continue;
    }
    latestLines.push(line);
  }
  
  return latestLines.join('\n').trim();
}

function getTicketNumber() {
  const titleMatch = document.title.match(/IM\d{5,10}/);
  if (titleMatch) return titleMatch[0];

  const inputs = Array.from(document.querySelectorAll('input'));
  for (const input of inputs) {
    const val = (input.value || '').trim();
    const match = val.match(/^IM\d{5,10}$/);
    if (match) return match[0];
  }

  return '';
}

function getClassification() {
  // 1. البحث عن خلية تحتوي على نص "التصنيف" والتقاط حقل الإدخال في الخلية المجاورة (سواء السابقة أو التالية)
  const cells = Array.from(document.querySelectorAll('td, label, span'));
  for (const cell of cells) {
    const txt = (cell.innerText || '').trim();
    if (txt === 'التصنيف:' || txt === 'التصنيف' || txt === 'Category:' || txt === 'Category') {
      let cellTd = cell;
      while (cellTd && cellTd.tagName !== 'TD' && cellTd !== document.body) {
        cellTd = cellTd.parentElement;
      }
      
      if (cellTd && cellTd.tagName === 'TD') {
        let input = null;
        
        // تفقد الخلية السابقة (تخطيط RTL المعتاد)
        const prevTd = cellTd.previousElementSibling;
        if (prevTd) {
          input = prevTd.querySelector('input[type="text"], select');
        }
        
        // تفقد الخلية التالية (في حال كان التخطيط LTR أو معكوساً برمجياً)
        if (!input) {
          const nextTd = cellTd.nextElementSibling;
          if (nextTd) {
            input = nextTd.querySelector('input[type="text"], select');
          }
        }
        
        if (input && input.value && input.value.trim() !== '') {
          const val = input.value.trim();
          if (val.toLowerCase() !== 'incident') {
            return val;
          }
        }
      }
    }
  }

  // 2. البحث البديل: إعطاء الأولوية لـ subcategory أو product.type (لأنها تعني التصنيف الفعلي)
  const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
  for (const input of inputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if (
      (name.includes('subcategory') || id.includes('subcategory') || name.includes('product') || id.includes('product')) && 
      !name.includes('group') && !id.includes('group')
    ) {
      if (input.value && input.value.trim() !== '') {
        return input.value.trim();
      }
    }
  }

  // 3. كخيار أخير: حقل category بشرط ألا تكون قيمته incident أو group
  for (const input of inputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if (
      (name.includes('category') || id.includes('category')) && 
      !name.includes('group') && !id.includes('group') && 
      !name.includes('type') && !id.includes('type')
    ) {
      const val = (input.value || '').trim();
      if (val !== '' && val.toLowerCase() !== 'incident') {
        return val;
      }
    }
  }
  return '';
}

function normalizeCategory(rawCategory) {
  if (!rawCategory) return "أخرى";
  
  const cleanCategories = [
    "الرخص التجارية", "الرخص الإنشائية", "بلدي أعمال", "مسار منصة الحفريات", 
    "التقرير المساحي", "الإدارة الذكية للنظافة", "خدمة المواعيد الالكترونية", 
    "الشهادات الصحية", "خدمة مرافق إيواء", "مستشارك بلدي", "نظام الصلاحيات", 
    "تطبيق بلدي", "شكوى المستفيد منصة بلدي", "منصة الرقابة الموحدة (ممثل)", 
    "لوحة التحكم", "خدمة الدمج والتجزئة", "خدمة تحديث الصكوك", 
    "خدمة اعتماد المخططات الخاصة", "تصنيف مقدمي خدمات المدن", "الهوية العقارية", 
    "شكوى المستفيد بلدي 940", "خدمة الفرص الاستثمارية", "خدمة السكن الجماعي", 
    "خدمة السكن الجماعي للأفراد", "صفحة بلدي", "GIS Web Portal", "رمز الاستجابة", 
    "إكرام الموتى", "التشوه البصري", "امتثال", "رقابة الصحي والأسواق", 
    "الخرائط الجغرافية", "صوت العميل", "نظام المتاجر المتنقلة", 
    "شؤون البلدية والقروية والإسكان", "Investment Opportunities", 
    "امتثال المباني", "منصة رسم تقديم منتجات التبغ", "فاتورة سداد آلياً"
  ];

  // 1. مطابقة مباشرة جزئية
  const matched = cleanCategories.find(cat => 
    rawCategory.includes(cat) || cat.includes(rawCategory)
  );
  if (matched) return matched;

  // 2. مطابقة مرنة للكلمات الدلالية الرئيسية
  const lowerRaw = rawCategory.toLowerCase();
  
  if (lowerRaw.includes('digging') || lowerRaw.includes('حفريات')) return 'مسار منصة الحفريات';
  if (lowerRaw.includes('commercial') || lowerRaw.includes('تجارية')) return 'الرخص التجارية';
  if (lowerRaw.includes('building') || lowerRaw.includes('إنشائية')) return 'الرخص الإنشائية';
  if (lowerRaw.includes('survey') || lowerRaw.includes('مساحي')) return 'التقرير المساحي';
  if (lowerRaw.includes('business') || lowerRaw.includes('أعمال')) return 'بلدي أعمال';
  if (lowerRaw.includes('complaint') || lowerRaw.includes('شكوى')) {
    if (lowerRaw.includes('940')) return 'شكوى المستفيد بلدي 940';
    return 'شكوى المستفيد منصة بلدي';
  }
  if (lowerRaw.includes('hygiene') || lowerRaw.includes('صحي') || lowerRaw.includes('أسواق')) return 'رقابة الصحي والأسواق';
  if (lowerRaw.includes('clean') || lowerRaw.includes('نظافة')) return 'الإدارة الذكية للنظافة';
  if (lowerRaw.includes('health') || lowerRaw.includes('شهادة صحية') || lowerRaw.includes('شهادات صحية')) return 'الشهادات الصحية';
  if (lowerRaw.includes('appointment') || lowerRaw.includes('مواعيد')) return 'خدمة المواعيد الالكترونية';
  if (lowerRaw.includes('investment') || lowerRaw.includes('استثمار')) return 'خدمة الفرص الاستثمارية';
  if (lowerRaw.includes('housing') || lowerRaw.includes('سكن جماعي')) return 'خدمة السكن الجماعي';
  
  return "أخرى";
}

// حساب الموظف الذي عليه الدور حسب نفس خوارزمية التوزيع باللوحة الرئيسية
function getLeastReceiver() {
  const priorityOrder = [
    { name: 'البراء النصيان', user: 'a.alnesayan' },
    { name: 'محمد الربيش', user: 'mialrubaish' },
    { name: 'عبدالرحمن العمري', user: 'af.alamri' },
    { name: 'عزام الحربي', user: 'azz.alharbi' },
    { name: 'صالح الغصن', user: 's.alghosen' },
    { name: 'طارق الهدياني', user: 't.alhedyani' },
    { name: 'ثامر المنصور', user: 't.almansour' }
  ];

  const counts = {};
  priorityOrder.forEach(emp => {
    counts[emp.name] = 0;
  });

  const baseTickets = websiteTickets.filter(t => 
    t.date && 
    t.date >= '2026-04-04' && 
    t.type !== 'تحديث نظام' && 
    t.type !== 'تحديثات النظام' &&
    !(t.number && t.number.includes('📢'))
  );

  baseTickets.forEach(t => {
    const receiver = (t.receiver || '').trim();
    if (!receiver || receiver === 'غير محدد') return;

    const matched = priorityOrder.find(p => 
      receiver.includes(p.name.split(' ')[0]) || 
      p.name.includes(receiver.split(' ')[0])
    );

    if (matched) {
      counts[matched.name]++;
    }
  });

  let bestCandidate = priorityOrder[0];
  let minCount = counts[bestCandidate.name];

  for (const emp of priorityOrder) {
    if (counts[emp.name] < minCount) {
      minCount = counts[emp.name];
      bestCandidate = emp;
    }
  }

  return bestCandidate;
}

// تحديث نص زر التوزيع بناءً على الموظف المستلم
function updateSubmitButtonText(nextEmployee) {
  const btnCopy = document.getElementById('btn-copy-new-ticket');
  if (!btnCopy) return;
  const isRobaish = nextEmployee && (nextEmployee.name.includes('محمد الربيش') || nextEmployee.name.includes('الربيش'));
  btnCopy.innerText = isRobaish ? '🔗 إسناد البلاغ تلقائياً لـ Notion والترتيب' : '🔗 إسناد البلاغ تلقائياً لـ Supabase والترتيب';
}

// إدراج نص ولصقه وتنبيه المستخدم
function insertTextToField(text) {
  const activeInput = findActiveInput();
  if (activeInput) {
    activeInput.value = text;
    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    activeInput.dispatchEvent(new Event('change', { bubbles: true }));
    activeInput.focus();
    showFloatingNotification("تم نسخ النص ولصقه بنجاح! ⚡");
  } else {
    navigator.clipboard.writeText(text).catch(() => {});
    showFloatingNotification("تعذر اللصق التلقائي؛ تم نسخ النص للحافظة! 📋");
  }
}

function showFloatingNotification(msg) {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '100px';
  toast.style.right = '30px';
  toast.style.backgroundColor = '#10b981';
  toast.style.color = '#fff';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '10px';
  toast.style.fontFamily = 'Cairo, sans-serif';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = 'bold';
  toast.style.boxShadow = '0 10px 25px rgba(16,185,129,0.3)';
  toast.style.zIndex = '999999';
  toast.style.direction = 'rtl';
  toast.style.transition = 'all 0.3s ease';
  toast.innerText = msg;
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// إنشاء وحقن لوحة التحكم العائمة في الصفحة
function injectFloatingPanel() {

  // تجنب تكرار حقن اللوحة في النافذة الرئيسية (Parent) إذا كان هناك إطار داخلي (Iframe) يحتوي على تفاصيل البلاغ
  if (window === window.top && document.querySelector('iframe')) {
    const existingPanel = document.getElementById('daem-premium-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    return;
  }

  // نتأكد من أننا في الصفحة التفصيلية للتذكرة (وليس قائمة البحث أو الصفحات الأخرى)
  const ticketId = getTicketNumber();
  const existingPanel = document.getElementById('daem-premium-panel');
  
  if (!ticketId) {
    if (existingPanel) {
      existingPanel.remove();
    }
    return;
  }

  if (existingPanel) {
    const savedId = existingPanel.getAttribute('data-ticket-id');
    if (savedId === ticketId) {
      return;
    } else {
      existingPanel.remove();
    }
  }

  const panel = document.createElement('div');
  panel.id = 'daem-premium-panel';
  panel.setAttribute('data-ticket-id', ticketId);
  panel.style.position = 'fixed';
  panel.style.bottom = '30px';
  panel.style.right = '30px';
  panel.style.width = '300px';
  panel.style.backgroundColor = '#0f172a';
  panel.style.border = '2px solid #10b981';
  panel.style.borderRadius = '16px';
  panel.style.boxShadow = '0 15px 35px rgba(0,0,0,0.5)';
  panel.style.zIndex = '999998';
  panel.style.fontFamily = 'Cairo, Arial, sans-serif';
  panel.style.direction = 'rtl';
  panel.style.overflow = 'hidden';
  panel.style.transition = 'width 0.3s ease, height 0.3s ease, background-color 0.3s ease';

  // حساب الموظف الذي عليه الدور تلقائياً ومواءمة نص الزر
  const nextEmployee = getLeastReceiver();
  const isRobaish = nextEmployee && (nextEmployee.name.includes('محمد الربيش') || nextEmployee.name.includes('الربيش'));
  const dynamicBtnText = isRobaish ? '🔗 إسناد البلاغ تلقائياً لـ Notion والترتيب' : '🔗 إسناد البلاغ تلقائياً لـ Supabase والترتيب';

  // قالب واجهة المستخدم
  panel.innerHTML = `
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 12px; display: flex; align-items: center; justify-content: space-between; color: white; cursor: pointer; user-select: none;" id="daem-panel-header">
      <span style="font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px; pointer-events: none;">
        🚀 داعم بلس Premium
      </span>
      <span id="daem-panel-toggle" style="font-size: 16px; font-weight: bold;">−</span>
    </div>
    
    <div id="daem-panel-body" style="padding: 15px; display: flex; flex-direction: column; gap: 10px; transition: all 0.3s ease;">
      <!-- تفاصيل مدة فتح البلاغ -->
      <div id="daem-panel-ticket-info" style="background-color: #1e293b; border-radius: 8px; padding: 10px; border: 1px solid #334155; font-size: 12px; color: #cbd5e1; display: flex; flex-direction: column; gap: 5px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>رقم البلاغ:</span>
          <span style="color: #06b6d4;">${ticketId}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>مدة فتح البلاغ:</span>
          <span id="daem-panel-duration-value" style="color: #10b981; font-weight: bold;">🕒 جاري حساب المدة...</span>
        </div>
        <!-- تنبيه تحويل البلاغ للموظف الحالي والمفترض لزميل آخر (داخل صندوق معلومات البلاغ) -->
        <div id="daem-panel-transfer-warning" style="margin-top: 5px; background-color: #78350f; border: 1px solid #f59e0b; border-radius: 6px; padding: 8px; font-size: 11px; color: #fef3c7; display: none; align-items: center; gap: 6px; font-weight: bold; line-height: 1.4;">
          ⚠️ تم تحويل البلاغ لك (المفترض عند عبدالرحمن العمري)
        </div>
      </div>

      <!-- مفتاح التبديل للجهة المستهدفة -->
      <div style="display: flex; background-color: #1e293b; border-radius: 8px; padding: 3px; border: 1px solid #334155;">
        <button id="target-beneficiary" style="flex: 1; background-color: #10b981; color: white; border: none; padding: 6px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; transition: all 0.2s;">
          👤 المستفيد
        </button>
        <button id="target-office" style="flex: 1; background: transparent; color: #94a3b8; border: none; padding: 6px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; transition: all 0.2s;">
          🏢 المكتب الهندسي
        </button>
      </div>

      <!-- زر دمج آخر تحديث -->
      <button id="btn-copy-latest" style="background-color: #1e293b; color: #f8fafc; border: 1px solid #334155; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: right; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; font-size: 12px;">
        📋 دمج وتحديث البلاغ
      </button>
      <!-- زر إغلاق لعدم الرد -->
      <button id="btn-close-no-reply" style="background-color: #1e293b; color: #f8fafc; border: 1px solid #334155; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: right; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; font-size: 12px;">
        ❌ إغلاق لعدم الرد
      </button>

      <!-- زر تمت المعالجة -->
      <button id="btn-solved-feedback" style="background-color: #1e293b; color: #f8fafc; border: 1px solid #334155; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: right; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; font-size: 12px;">
        ✅ تمت المعالجة بالإفادة
      </button>

      <!-- زر تصحيح الإملاء -->
      <button id="btn-correct-spelling" style="background-color: #7c3aed; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: right; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; font-size: 12px;">
        ✨ تصحيح النص إملائياً
      </button>

      <!-- زر نسخ البيانات لإنشاء بلاغ جديد -->
      <button id="btn-copy-new-ticket" style="background-color: #06b6d4; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: right; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; font-size: 12px;">
        ${dynamicBtnText}
      </button>

      <!-- زر اختياري لتعبئة البيانات المنسوخة (يظهر فقط إذا كان هناك بيانات مخزنة) -->
      <button id="btn-fill-copied" style="background-color: #f59e0b; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: right; display: none; align-items: center; gap: 8px; transition: all 0.2s ease; font-size: 12px;">
        📥 تعبئة وإسناد البلاغ المنسوخ
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  // تحديث تنبيه تحويل البلاغ فوراً بعد الحقن
  updatePanelTransferWarning();

  const isDashboard = window.location.href.includes('tickets-daem.vercel.app') || 
                      window.location.href.includes('localhost');
  const btnCopy = document.getElementById('btn-copy-new-ticket');
  if (isDashboard && btnCopy) {
    btnCopy.style.display = 'none';
  }

  // أنماط تحسين تفاعل الأزرار
  const style = document.createElement('style');
  style.innerHTML = `
    #daem-premium-panel button:hover {
      filter: brightness(1.15) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2) !important;
    }
    #daem-premium-panel button:active {
      transform: translateY(0px) !important;
    }
  `;
  document.head.appendChild(style);

  // إدارة حالة الجهة المستهدفة بالتبديل
  let targetType = 'beneficiary'; // beneficiary or office
  
  const btnBeneficiary = document.getElementById('target-beneficiary');
  const btnOffice = document.getElementById('target-office');

  safeGetStorage(['daemTargetType'], (result) => {
    if (result && result.daemTargetType) {
      targetType = result.daemTargetType;
      updateTargetUI();
    }
  });

  function updateTargetUI() {
    if (targetType === 'beneficiary') {
      btnBeneficiary.style.backgroundColor = '#10b981';
      btnBeneficiary.style.color = 'white';
      btnOffice.style.backgroundColor = 'transparent';
      btnOffice.style.color = '#94a3b8';
    } else {
      btnOffice.style.backgroundColor = '#10b981';
      btnOffice.style.color = 'white';
      btnBeneficiary.style.backgroundColor = 'transparent';
      btnBeneficiary.style.color = '#94a3b8';
    }
  }

  btnBeneficiary.addEventListener('click', () => {
    targetType = 'beneficiary';
    safeSetStorage({ daemTargetType: 'beneficiary' });
    updateTargetUI();
  });

  btnOffice.addEventListener('click', () => {
    targetType = 'office';
    safeSetStorage({ daemTargetType: 'office' });
    updateTargetUI();
  });

  // منطق تصغير وتكبير اللوحة وسحبها
  const header = document.getElementById('daem-panel-header');
  const body = document.getElementById('daem-panel-body');
  const toggleBtn = document.getElementById('daem-panel-toggle');
  
  let isCollapsed = false;
  let isDragging = false;
  let hasMoved = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  // استرجاع موضع اللوحة المحفوظ مع التحقق من الحدود لمنع خروجها عن الشاشة
  safeGetStorage(['panelPosition'], (result) => {
    if (result && result.panelPosition) {
      let savedX = result.panelPosition.x; // left
      let savedY = result.panelPosition.y; // top
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const panelWidth = 300;
      const panelHeight = isCollapsed ? 45 : 350;
      
      // التأكد من بقاء الموضع داخل حدود الشاشة المرئية تماماً
      let x = Math.max(10, Math.min(savedX, viewportWidth - panelWidth - 10));
      let y = Math.max(10, Math.min(savedY, viewportHeight - panelHeight - 10));
      
      panel.style.bottom = 'auto';
      panel.style.right = 'auto';
      panel.style.left = x + 'px';
      panel.style.top = y + 'px';
    }
  });

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('mousemove', drag);

  function dragStart(e) {
    if (e.target.id === 'daem-panel-toggle') return;
    
    const rect = panel.getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;
    
    isDragging = true;
    hasMoved = false;
  }

  function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    
    const rect = panel.getBoundingClientRect();
    safeSetStorage({ panelPosition: { x: rect.left, y: rect.top } });
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    let x = e.clientX - initialX;
    let y = e.clientY - initialY;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = panel.offsetWidth || 300;
    const panelHeight = panel.offsetHeight || 350;
    
    // تقييد الحركة داخل أبعاد الشاشة لمنع الخروج نهائياً
    x = Math.max(10, Math.min(x, viewportWidth - panelWidth - 10));
    y = Math.max(10, Math.min(y, viewportHeight - panelHeight - 10));
    
    panel.style.bottom = 'auto';
    panel.style.right = 'auto';
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
    
    hasMoved = true;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  header.addEventListener('click', (e) => {
    // إذا تحركت اللوحة (حدث سحب)، نمنع تكبير/تصغير اللوحة
    if (hasMoved) {
      hasMoved = false;
      return;
    }
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      body.style.display = 'none';
      panel.style.width = '180px';
      toggleBtn.innerText = '+';
    } else {
      body.style.display = 'flex';
      panel.style.width = '300px';
      toggleBtn.innerText = '−';
    }
  });

  // حدث: دمج آخر تحديث
  document.getElementById('btn-copy-latest').addEventListener('click', () => {
    const journalEl = findJournalUpdatesElement();
    if (!journalEl) {
      showFloatingNotification("لم يتم العثور على صندوق التحديثات بالصفحة! ⚠️");
      return;
    }
    const rawText = journalEl.value || '';
    const lastUpdateText = extractLatestUpdate(rawText);
    
    if (!lastUpdateText) {
      showFloatingNotification("لا توجد تحديثات سابقة لنسخها! ⚠️");
      return;
    }

    const suffix = targetType === 'beneficiary' ? 'المستفيد' : 'المكتب الهندسي';
    const formatted = `${lastUpdateText}\nوإفادة ${suffix} بذلك`;
    insertTextToField(formatted);
  });

  // حدث: إغلاق لعدم الرد
  document.getElementById('btn-close-no-reply').addEventListener('click', () => {
    const suffix = targetType === 'beneficiary' ? 'المستفيد' : 'المكتب الهندسي';
    insertTextToField(`لم يتم الرد من قبل ${suffix}`);
  });

  // حدث: تمت المعالجة بالإفادة
  document.getElementById('btn-solved-feedback').addEventListener('click', () => {
    const suffix = targetType === 'beneficiary' ? 'المستفيد' : 'المكتب الهندسي';
    insertTextToField(`تمت المعالجة بناءً على إفادة ${suffix}`);
  });


  // حدث: نسخ البيانات وإنشاء البلاغ في الموقع تلقائياً في الخلفية
  document.getElementById('btn-copy-new-ticket').addEventListener('click', async () => {
    const ticketId = getTicketNumber();
    const category = getClassification() || "أخرى";

    if (!ticketId) {
      showFloatingNotification("فشل تحديد رقم التذكرة بالصفحة! ⚠️");
      return;
    }

    showFloatingNotification("جاري التحقق من بيانات التوزيع اللحظية... ⏳");

    // محاولة جلب البيانات لحظياً مع وجود مؤقت ومحاولات متكررة في حال عدم اكتمال الجلب
    let tickets = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
      tickets = await fetchTicketsPromise();
      if (tickets && tickets.length > 0) {
        websiteTickets = tickets;
        break;
      }
      if (attempt < 3) {
        showFloatingNotification(`لم يتم جلب البيانات بعد، لحظات من وقتك وجاري المحاولة... ⏳ (محاولة ${attempt}/3)`);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }

    if (!tickets || tickets.length === 0) {
      showFloatingNotification("عذراً، تعذر جلب البيانات اللحظية للتوزيع. يرجى المحاولة بعد قليل! ⚠️");
      return;
    }

    // حساب الموظف الذي عليه الدور تلقائياً بعد التحقق من البيانات اللحظية
    const nextEmployee = getLeastReceiver();
    updateSubmitButtonText(nextEmployee);

    // نسخ النص للحافظة كدعم للمستخدم
    const clipboardText = `رقم التذكرة: ${ticketId}\nالتصنيف: ${category}\nالموظف المستلم: ${nextEmployee.name} (${nextEmployee.user})`;
    navigator.clipboard.writeText(clipboardText).catch(() => {});

    // تنسيق التاريخ بتوقيت الرياض YYYY-MM-DD
    const localDate = new Date();
    const offset = 3 * 60; // UTC+3
    const localTime = new Date(localDate.getTime() + (localDate.getTimezoneOffset() + offset) * 60000);
    const dateStr = localTime.toISOString().split('T')[0];

    showFloatingNotification("جاري حفظ البلاغ الجديد وتوزيعه بالدور... ⏳");

    safeGetStorage(['daemRole'], (result) => {
      const role = result.daemRole || 'support';
      const phoneNumber = extractPhone();
      const reportText = extractReportText();

      const apiData = {
        date: dateStr,
        receiver: nextEmployee.name,
        ticketNumber: ticketId,
        type: normalizeCategory(category),
        solution: 'بلاغ جديد',
        phoneNumber: phoneNumber,
        reportText: reportText,
        role: role
      };

      // إرسال الطلب للخلفية لحفظ البلاغ في قاعدة بيانات الموقع مباشرة دون فتح أي نافذة
      safeSendMessage({ action: "CREATE_TICKET", data: apiData }, (response) => {
        if (response && response.success) {
          showFloatingNotification(`تم حفظ البلاغ (${ticketId}) وإسناده للموظف (${nextEmployee.name}) بنجاح! 🚀`);
        } else {
          showFloatingNotification(`فشل حفظ البلاغ تلقائياً: ${response?.error || 'خطأ غير معروف'} ⚠️`);
        }
      });
    });
  });

  // حدث: تصحيح النص إملائياً
  document.getElementById('btn-correct-spelling').addEventListener('click', () => {
    const activeInput = findActiveInput();
    if (!activeInput) {
      showFloatingNotification("لم يتم العثور على حقل كتابة نشط لتصحيحه! ⚠️");
      return;
    }
    const currentText = getEditableValue(activeInput).trim();
    if (!currentText) {
      showFloatingNotification("الرجاء كتابة نص أولاً في حقل الكتابة لتصحيحه! ⚠️");
      return;
    }

    showFloatingNotification("جاري تصحيح النص بالذكاء الاصطناعي... 🪄");

    safeSendMessage({
      action: "CORRECT_SPELLING",
      data: { text: currentText }
    }, (response) => {
      if (response && response.success) {
        const corrected = response.correctedText;
        if (corrected === currentText) {
          showFloatingNotification("لم يتم العثور على أي أخطاء إملائية؛ النص سليم! ✅");
        } else {
          // عرض نافذة تأكيد للمراجعة قبل الاستبدال
          showCorrectionConfirmationModal(currentText, corrected, activeInput);
        }
      } else {
        showFloatingNotification(`فشل تصحيح النص: ${response?.error || 'خطأ غير معروف'} ⚠️`);
      }
    });
  });

  // تفقد صلاحية المستخدم لإخفاء أو إظهار أزرار الإسناد التلقائي وإنشاء البلاغات
  safeGetStorage(['daemRole'], (result) => {
    const role = result.daemRole || 'support';
    const btnCopy = document.getElementById('btn-copy-new-ticket');
    const btnFill = document.getElementById('btn-fill-copied');
    const isDashboard = window.location.href.includes('tickets-daem.vercel.app') || 
                        window.location.href.includes('localhost');

    if (role === 'admin') {
      if (btnCopy && !isDashboard) btnCopy.style.display = 'flex';
      checkCopiedTicketData();
    } else {
      if (btnCopy) btnCopy.style.display = 'none';
      if (btnFill) btnFill.style.display = 'none';
    }
  });
}

function checkCopiedTicketData() {
  const isDashboard = window.location.href.includes('tickets-daem.vercel.app') || 
                      window.location.href.includes('localhost');
  const btn = document.getElementById('btn-fill-copied');
  
  if (!isDashboard) {
    if (btn) btn.style.display = 'none';
    return;
  }

  safeGetStorage(['copiedTicketInfo', 'daemRole'], (result) => {
    const role = result.daemRole || 'support';
    if (role === 'support') {
      if (btn) btn.style.display = 'none';
      return;
    }

    if (result.copiedTicketInfo && btn) {
      const data = result.copiedTicketInfo;
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - data.timestamp < oneHour) {
        btn.style.display = 'flex';
        btn.innerText = `📥 تعبئة وإسناد (${data.ticketId} ➔ ${data.nextEmployee.name.split(' ')[0]})`;
        
        const newBtn = btn.cloneNode(true);
        btn.replaceWith(newBtn);
        newBtn.addEventListener('click', () => {
          fillTicketDataToForm(data);
        });
      }
    }
  });
}

// مراقبة تغيير الصلاحية لتحديث الأزرار حياً في التبويبات النشطة
try {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        if (changes.daemUserKey) {
          currentLoggedUserKey = changes.daemUserKey.newValue || 'alrubaish';
        }
        if (changes.daemUserArabic) {
          currentLoggedUserArabic = changes.daemUserArabic.newValue || 'محمد الربيش';
        }
        if (changes.daemRole) {
          const role = changes.daemRole.newValue || 'support';
          const btnCopy = document.getElementById('btn-copy-new-ticket');
          const btnFill = document.getElementById('btn-fill-copied');
          if (role === 'support') {
            if (btnCopy) btnCopy.style.display = 'none';
            if (btnFill) btnFill.style.display = 'none';
          } else {
            const isDashboard = window.location.href.includes('tickets-daem.vercel.app') || 
                                window.location.href.includes('localhost');
            if (btnCopy && !isDashboard) btnCopy.style.display = 'flex';
            checkCopiedTicketData();
          }
        }
      }
    });
  }
} catch (e) {}

function fillTicketDataToForm(data) {
  let filledAny = false;

  // 1. تعبئة حقل التصنيف
  const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
  for (const input of inputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if (name.includes('category') || name.includes('class') || id.includes('category') || id.includes('class')) {
      input.value = data.category;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      filledAny = true;
    }
  }

  // 2. تعبئة حقل "المستقبل" أو "التعيين" باسم الموظف الذي عليه الدور
  const assigneeInput = findAssigneeInput();
  if (assigneeInput) {
    assigneeInput.value = data.nextEmployee.user; // استخدام اسم المستخدم (a.alnesayan, mialrubaish, إلخ)
    assigneeInput.dispatchEvent(new Event('input', { bubbles: true }));
    assigneeInput.dispatchEvent(new Event('change', { bubbles: true }));
    filledAny = true;
  }

  // 3. تعبئة تفاصيل/رقم البلاغ القديم في حقل الوصف/الحديثة
  const descriptionField = findActiveInput();
  if (descriptionField) {
    descriptionField.value = `بلاغ مرتبط بالبلاغ رقم: ${data.ticketId}\nالتصنيف: ${data.category}\nمسند إلى: ${data.nextEmployee.name}`;
    descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
    descriptionField.dispatchEvent(new Event('change', { bubbles: true }));
    filledAny = true;
  }

  if (filledAny) {
    showFloatingNotification(`تمت تعبئة البيانات وإسنادها للموظف (${data.nextEmployee.name}) بنجاح! 📥`);
  } else {
    navigator.clipboard.writeText(`رقم البلاغ السابق: ${data.ticketId}\nالتصنيف: ${data.category}\nالمستلم: ${data.nextEmployee.name} (${data.nextEmployee.user})`).then(() => {
      showFloatingNotification("تعذر التحديد التلقائي للحقول. تم نسخ البيانات لتلصقها يدوياً! 📋");
    });
  }
}

// إعداد الهوية والصلاحية لأول مرة فقط (بدلاً من صفحة تسجيل الدخول الخاصة بالإضافة)
function ensureDaemPlusIdentity() {
  safeGetStorage(['daemRole', 'daemUserKey', 'daemUserArabic'], (result) => {
    if (result.daemRole) {
      currentLoggedUserKey = result.daemUserKey || currentLoggedUserKey;
      currentLoggedUserArabic = result.daemUserArabic || currentLoggedUserArabic;
      return;
    }
    let chosenKey = currentLoggedUserKey;
    let chosenArabic = currentLoggedUserArabic;
    try {
      const input = window.prompt('داعم بلس 🚀\nاكتب اسمك (أو اتركه فارغاً لاستخدام الإعدادات الافتراضية):', currentLoggedUserArabic);
      if (input && input.trim()) {
        const typed = input.trim();
        const match = EMPLOYEES.find((e) =>
          e.arabic === typed || e.names.some((n) => n.toLowerCase() === typed.toLowerCase())
        );
        if (match) {
          chosenKey = match.key;
          chosenArabic = match.arabic;
        } else {
          chosenArabic = typed;
        }
      }
    } catch (e) {}
    currentLoggedUserKey = chosenKey;
    currentLoggedUserArabic = chosenArabic;
    safeSetStorage({ daemRole: 'admin', daemUserKey: chosenKey, daemUserArabic: chosenArabic });
  });
}
ensureDaemPlusIdentity();

// تشغيل الحقن والمراقبة
syncFromWebsite();
setInterval(syncFromWebsite, 60000);
setInterval(highlightTickets, 2000);


// محاولة الحقن فوراً وبشكل دوري لدعم التحديثات الديناميكية (AJAX/iFrames)
setTimeout(injectFloatingPanel, 1500);
setInterval(injectFloatingPanel, 3000);

let daemAutoFilled = false;
function autoFillOnWebsiteNewPage() {
  if (daemAutoFilled) return;
  
  const isTargetPage = window.location.href.includes('tickets-daem.vercel.app/new') || 
                       window.location.href.includes('tickets-daem.vercel.app/create') ||
                       window.location.href.includes('localhost:3000/new') ||
                       window.location.href.includes('localhost:3000/create');
                       
  if (isTargetPage) {
    const ticketInput = document.getElementById('ticketNumber');
    if (!ticketInput) return; // النموذج لم يتم تحميله بعد في الصفحة
    
    safeGetStorage(['copiedTicketInfo'], (result) => {
      if (result && result.copiedTicketInfo) {
        const data = result.copiedTicketInfo;
        const fiveMinutes = 5 * 60 * 1000;
        
        // التحقق من أن البيانات حديثة (خلال آخر 5 دقائق) لتجنب تكرار التعبئة
        if (Date.now() - data.timestamp < fiveMinutes) {
          daemAutoFilled = true;
          
          // 1. رقم البلاغ
          ticketInput.value = data.ticketId;
          ticketInput.dispatchEvent(new Event('input', { bubbles: true }));
          ticketInput.dispatchEvent(new Event('change', { bubbles: true }));

          // 2. المستقبل (الموظف)
          const nameInput = document.getElementById('name');
          if (nameInput) {
            const options = Array.from(nameInput.options);
            const matchedOpt = options.find(opt => 
              opt.text.includes(data.nextEmployee.name) || 
              data.nextEmployee.name.includes(opt.text)
            );
            if (matchedOpt) {
              nameInput.value = matchedOpt.value;
              nameInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }

          // 3. التصنيف (Custom Select)
          const categoryLabel = document.querySelector('label[htmlFor="serviceType"]');
          if (categoryLabel && data.category) {
            const wrapper = categoryLabel.parentElement.querySelector('[class*="customSelectWrapper"]');
            if (wrapper) {
              const trigger = wrapper.querySelector('[class*="customSelectTrigger"]');
              if (trigger) {
                trigger.click();
                setTimeout(() => {
                  const options = Array.from(wrapper.querySelectorAll('[class*="customOption"]'));
                  const matchedOption = options.find(opt => {
                    const optText = opt.innerText.trim();
                    return optText.includes(data.category) || data.category.includes(optText);
                  });
                  if (matchedOption) {
                    matchedOption.click();
                  } else {
                    const otherOpt = options.find(opt => opt.innerText.includes('أخرى'));
                    if (otherOpt) otherOpt.click();
                  }
                }, 200);
              }
            }
          }

          // 4. الحفظ التلقائي بعد وقت كافٍ لاكتمال تعبئة الحقول والخيارات
          setTimeout(() => {
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) {
              submitBtn.click();
            }
          }, 800);

          safeRemoveStorage(['copiedTicketInfo']);
          showFloatingNotification("تمت تعبئة تفاصيل البلاغ وحفظه تلقائياً! ⚡");
        }
      }
    });
  }
}
// تشغيل التعبئة التلقائية عند تحميل الصفحة
setTimeout(autoFillOnWebsiteNewPage, 1000);
setInterval(autoFillOnWebsiteNewPage, 2000);
setInterval(checkAndAutoUpdateMinistryDate, 5000);
setInterval(checkOpenedByEmployee, 3000);
setInterval(checkTicketDescriptionSpelling, 4000);

// ==========================================================
// وظائف استخلاص البيانات والتصحيح الإملائي وتحديث الوزارة
// ==========================================
function queryAllInPage(selector) {
  let elements = [];
  
  function recurse(doc) {
    if (!doc) return;
    try {
      const found = doc.querySelectorAll(selector);
      elements = elements.concat(Array.from(found));
      
      const frames = doc.querySelectorAll('iframe, frame');
      for (const frame of frames) {
        try {
          const frameDoc = frame.contentDocument || frame.contentWindow.document;
          if (frameDoc) {
            recurse(frameDoc);
          }
        } catch (e) {
          // ignore cross-origin errors
        }
      }
    } catch (e) {
      // ignore
    }
  }
  
  recurse(document);
  return elements;
}

function extractValue(labels) {
  const allElements = queryAllInPage('div, span, label, td, th, p, b, input, textarea');
  for (let el of allElements) {
    const text = el.innerText ? el.innerText.trim() : "";
    const val = el.value ? el.value.trim() : "";
    
    if (labels.some(label => text.includes(label) || val.includes(label))) {
      let foundValue = "";
      if (text.includes(':')) {
        let parts = text.split(':');
        if (parts[1] && parts[1].trim().length > 1) foundValue = parts[1].trim();
      }
      if (!foundValue) {
        let sibling = el.nextElementSibling;
        while (sibling) {
          const input = sibling.querySelector('input, textarea') || (['INPUT', 'TEXTAREA'].includes(sibling.tagName) ? sibling : null);
          if (input && input.value) {
            foundValue = input.value;
            break;
          }
          if (sibling.innerText && sibling.innerText.trim().length > 1) {
            foundValue = sibling.innerText.trim();
            break;
          }
          sibling = sibling.nextElementSibling;
        }
      }
      if (!foundValue && (el.tagName === 'TD' || el.tagName === 'TH' || el.parentElement.tagName === 'TD')) {
        let cell = el.tagName === 'TD' ? el : el.parentElement;
        
        let nextCell = cell.nextElementSibling;
        if (nextCell) {
          const input = nextCell.querySelector('input, textarea');
          foundValue = input ? input.value : nextCell.innerText.trim();
        }

        if (!foundValue) {
          let prevCell = cell.previousElementSibling;
          if (prevCell) {
            const input = prevCell.querySelector('input, textarea');
            foundValue = input ? input.value : prevCell.innerText.trim();
          }
        }
      }
      if (foundValue && foundValue.length > 1) return foundValue;
    }
  }
  return "";
}

function extractPhone() {
  const fromLabel = extractValue(["جوال المواطن", "رقم الجوال", "الهاتف"]);
  if (fromLabel && fromLabel.length >= 9) return fromLabel;

  const bodyText = document.body.innerText;
  const phoneRegex = /(05\d{8}|(?<!\d)5\d{8}(?!\d))/g;
  const matches = bodyText.match(phoneRegex);
  if (matches) {
    return matches[0];
  }
  return "";
}

function extractReportText() {
  const textareas = queryAllInPage('textarea');
  for (let ta of textareas) {
    if (ta.readOnly || ta.disabled) {
      if (ta.value.length > 20) return ta.value;
    }
  }
  for (let ta of textareas) {
    if (ta.value.length > 20 && !ta.value.includes('Asia/Riyadh')) return ta.value;
  }
  return extractValue(["نص البلاغ", "تفاصيل البلاغ", "الوصف"]);
}

function detectMinistryUpdateToday() {
  const journalEl = findJournalUpdatesElement();
  if (!journalEl) return false;
  
  const rawText = journalEl.tagName === 'TEXTAREA' ? (journalEl.value || '') : (journalEl.innerText || '');
  
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  
  const format1 = `${dd}/${mm}/${yyyy}`;
  const format2 = `${yyyy}-${mm}-${dd}`;
  const format3 = `${yyyy}/${mm}/${dd}`;
  
  const lines = rawText.split('\n');
  for (const line of lines) {
    const hasMinistry = line.includes('الوزارة') || line.includes('وزارة') || line.includes('Ministry');
    const hasToday = line.includes(format1) || line.includes(format2) || line.includes(format3);
    if (hasMinistry && hasToday) {
      return true;
    }
  }
  return false;
}

function checkAndAutoUpdateMinistryDate() {
  safeGetStorage(['daemRole'], (result) => {
    const role = result.daemRole || 'support';
    if (role !== 'admin') return; 
    
    const ticketId = getTicketNumber();
    if (!ticketId) return;
    
    if (!window.daemProcessedMinistryTickets) {
      window.daemProcessedMinistryTickets = {};
    }
    if (window.daemProcessedMinistryTickets[ticketId]) return;
    
    if (detectMinistryUpdateToday()) {
      window.daemProcessedMinistryTickets[ticketId] = true;
      
      const today = new Date();
      const offset = 3 * 60; // UTC+3
      const localTime = new Date(today.getTime() + (today.getTimezoneOffset() + offset) * 60000);
      const todayStr = localTime.toISOString().split('T')[0];
      
      safeSendMessage({
        action: "UPDATE_TICKET_DATE",
        data: {
          ticketNumber: ticketId,
          date: todayStr
        }
      }, (response) => {
        if (response && response.success) {
          showFloatingNotification("تم تحديث تاريخ البلاغ في نوشن تلقائياً! 📅");
        }
      });
    }
  });
}function showCorrectionConfirmationModal(original, corrected, inputElement) {
  const modal = document.createElement('div');
  modal.id = 'daem-spelling-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999999';
  modal.style.fontFamily = 'Cairo, sans-serif';
  modal.style.direction = 'rtl';

  modal.innerHTML = `
    <div style="background-color: #1e293b; border: 2px solid #10b981; border-radius: 16px; width: 450px; padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 15px; color: white;">
      <div style="font-weight: bold; font-size: 16px; color: #10b981; border-bottom: 1px solid #334155; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
        🪄 مراجعة وتصحيح النص الإملائي
      </div>
      
      <div>
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 5px;">النص الأصلي:</div>
        <div style="background-color: #0f172a; padding: 10px; border-radius: 8px; font-size: 12px; border: 1px solid #334155; line-height: 1.5; color: #cbd5e1; max-height: 80px; overflow-y: auto;">
          ${original}
        </div>
      </div>
      
      <div>
        <div style="font-size: 11px; color: #10b981; margin-bottom: 5px;">النص المصحح المقترح:</div>
        <div style="background-color: #0f172a; padding: 10px; border-radius: 8px; font-size: 13px; border: 1px solid #10b981; line-height: 1.5; font-weight: bold; max-height: 120px; overflow-y: auto;">
          ${corrected}
        </div>
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 10px;">
        <button id="btn-spelling-confirm" style="flex: 2; background-color: #10b981; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: Cairo; font-size: 12px; transition: all 0.2s;">
          ${(inputElement && inputElement.tagName) ? 'استبدال وتحديث الحقل ✏️' : 'نسخ النص المصحح للحافظة 📋'}
        </button>
        <button id="btn-spelling-cancel" style="flex: 1; background-color: #334155; color: #cbd5e1; border: 1px solid #475569; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: Cairo; font-size: 12px; transition: all 0.2s;">
          إلغاء ❌
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('btn-spelling-confirm').addEventListener('click', () => {
    if (inputElement && inputElement.tagName) {
      setEditableValue(inputElement, corrected);
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      inputElement.focus();
      showFloatingNotification("تم استبدال النص وتصحيحه بنجاح! ⚡");
    } else {
      navigator.clipboard.writeText(corrected).then(() => {
        showFloatingNotification("تم نسخ النص المصحح للحافظة بنجاح! 📋");
      }).catch(() => {
        showFloatingNotification("فشل نسخ النص؛ يرجى تحديده ونسخه يدوياً. ⚠️");
      });
    }
    modal.remove();
  });


  document.getElementById('btn-spelling-cancel').addEventListener('click', () => {
    modal.remove();
  });
}

// ==========================================
// فحص وتنبيه البلاغات المرفوعة من قبل موظفينا
// ==========================================

const EMPLOYEE_IDENTIFIERS = [
  'a.alnesayan', 'aalowaid', 'af.alamri', 'azz.alharbi', 'mialrubaish', 's.alghosen', 't.alhedyani', 't.almansour',
  'alnesayan', 'alowaid', 'alamri', 'alharbi', 'mialrubaish', 'alghosen', 'alhedyani', 'almansour',
  'البراء النصيان', 'عبدالله العويد', 'عبدالرحمن العمري', 'عزام الحربي', 'محمد الربيش', 'صالح الغصن', 'طارق الهدياني', 'ثامر المنصور',
  'البراء علي ابراهيم النصيان', 'عبدالله عبدالعزيز محمد العويد', 'عبدالرحمن فهيد العمري', 'عزام أحمد محمد الفريدي الحربي',
  'محمد إبراهيم محمد الربيش', 'صالح عبدالعزيز صالح الغصن', 'طارق عبدالعزيز عبدالله الهدياني', 'ثامر عبدالله محمد المنصور'
];

function extractOpenedByValue() {
  const allElements = queryAllInPage('div, span, label, td, th, p, b, input');
  for (let el of allElements) {
    const text = el.innerText ? el.innerText.trim() : "";
    if (text === 'فتح بواسطة:' || text === 'فتح بواسطة' || text.includes('Opened by') || text.includes('Opened By')) {
      let foundValue = "";
      
      // 1. إذا كان يحتوي على نقطتين وقيمة
      if (text.includes(':')) {
        let parts = text.split(':');
        if (parts[1] && parts[1].trim().length > 1) {
          foundValue = parts[1].trim();
        }
      }
      
      // 2. البحث في الأشقاء التاليين والسابقين
      if (!foundValue) {
        let sibling = el.nextElementSibling;
        while (sibling) {
          const input = sibling.querySelector('input') || (sibling.tagName === 'INPUT' ? sibling : null);
          if (input && input.value) {
            foundValue = input.value;
            break;
          }
          const textVal = sibling.innerText ? sibling.innerText.trim() : "";
          if (textVal && textVal.length > 1 && textVal !== 'i' && textVal !== 'ℹ️' && textVal !== 'ℹ') {
            foundValue = textVal;
            break;
          }
          sibling = sibling.nextElementSibling;
        }
      }

      if (!foundValue) {
        let sibling = el.previousElementSibling;
        while (sibling) {
          const input = sibling.querySelector('input') || (sibling.tagName === 'INPUT' ? sibling : null);
          if (input && input.value) {
            foundValue = input.value;
            break;
          }
          const textVal = sibling.innerText ? sibling.innerText.trim() : "";
          if (textVal && textVal.length > 1 && textVal !== 'i' && textVal !== 'ℹ️' && textVal !== 'ℹ') {
            foundValue = textVal;
            break;
          }
          sibling = sibling.previousElementSibling;
        }
      }
      
      // 3. البحث في الخلية المجاورة
      if (!foundValue && (el.tagName === 'TD' || el.tagName === 'TH' || el.parentElement.tagName === 'TD')) {
        let cell = el.tagName === 'TD' ? el : el.parentElement;
        
        let nextCell = cell.nextElementSibling;
        if (nextCell) {
          const input = nextCell.querySelector('input');
          if (input && input.value) {
            foundValue = input.value;
          } else {
            foundValue = nextCell.innerText ? nextCell.innerText.trim() : "";
          }
        }

        if (!foundValue) {
          let prevCell = cell.previousElementSibling;
          if (prevCell) {
            const input = prevCell.querySelector('input');
            if (input && input.value) {
              foundValue = input.value;
            } else {
              foundValue = prevCell.innerText ? prevCell.innerText.trim() : "";
            }
          }
        }
      }
      
      if (foundValue) {
        foundValue = foundValue.replace(/[iℹ️ℹ]/g, '').trim();
        return foundValue;
      }
    }
  }
  return "";
}

function checkOpenedByEmployee() {
  const openedByRaw = extractOpenedByValue().trim();
  if (!openedByRaw) return;
  const openedBy = openedByRaw.toLowerCase();

  // منع تكرار إظهار التنبيه لنفس البلاغ في نفس الجلسة
  const ticketId = getTicketNumber();
  if (ticketId) {
    if (!window.daemOpenedByAlertedTickets) {
      window.daemOpenedByAlertedTickets = {};
    }
    if (window.daemOpenedByAlertedTickets[ticketId]) return;
  }

  const matches = EMPLOYEE_IDENTIFIERS.some(id => {
    const cleanId = id.trim().toLowerCase();
    return openedBy === cleanId || openedBy.includes(cleanId) || cleanId.includes(openedBy);
  });

  if (matches) {
    if (ticketId) {
      window.daemOpenedByAlertedTickets[ticketId] = true;
    }
    showOpenedByNotification(`⚠️ تنبيه: تم رفع هذا البلاغ من قبل موظفينا (${openedByRaw})!`);
  }
}

function showOpenedByNotification(msg) {
  if (document.getElementById('daem-openedby-alert')) return;

  const alertDiv = document.createElement('div');
  alertDiv.id = 'daem-openedby-alert';
  alertDiv.style.position = 'fixed';
  alertDiv.style.bottom = '100px';
  alertDiv.style.left = '30px';
  alertDiv.style.backgroundColor = '#d97706'; // برتقالي تحذيري مميز
  alertDiv.style.color = '#ffffff';
  alertDiv.style.padding = '14px 24px';
  alertDiv.style.borderRadius = '12px';
  alertDiv.style.fontFamily = 'Cairo, sans-serif';
  alertDiv.style.fontSize = '14px';
  alertDiv.style.fontWeight = 'bold';
  alertDiv.style.boxShadow = '0 10px 30px rgba(217, 119, 6, 0.4)';
  alertDiv.style.zIndex = '999999';
  alertDiv.style.direction = 'rtl';
  alertDiv.style.display = 'flex';
  alertDiv.style.alignItems = 'center';
  alertDiv.style.gap = '10px';
  alertDiv.style.border = '2px solid #f59e0b';
  alertDiv.style.transition = 'all 0.3s ease';

  alertDiv.innerHTML = `
    <span>📢</span>
    <span>${msg}</span>
    <button id="btn-close-openedby-alert" style="background: transparent; border: none; color: white; cursor: pointer; font-weight: bold; margin-right: 15px; font-size: 14px;">✕</button>
  `;

  document.body.appendChild(alertDiv);
  
  document.getElementById('btn-close-openedby-alert').addEventListener('click', () => {
    alertDiv.remove();
  });
}

// ==========================================
// الفحص التلقائي والتنبيه عند وجود أخطاء إملائية بالوصف
// ==========================================

function checkTicketDescriptionSpelling() {
  const ticketId = getTicketNumber();
  if (!ticketId) return;

  if (!window.daemCheckedSpellingTickets) {
    window.daemCheckedSpellingTickets = {};
  }
  if (window.daemCheckedSpellingTickets[ticketId]) return;

  const text = extractReportText();
  if (!text || text.length < 10) return;

  // تحديد أن التذكرة جاري فحصها لمنع التكرار
  window.daemCheckedSpellingTickets[ticketId] = true;

  safeSendMessage({
    action: "CORRECT_SPELLING",
    data: { text: text }
  }, (response) => {
    if (response && response.success && response.errorCount > 0) {
      showSpellingAlert(response.errorCount, text, response.correctedText);
    }
  });
}

function showSpellingAlert(errorCount, originalText, correctedText) {
  if (document.getElementById('daem-spelling-alert')) return;

  const alertDiv = document.createElement('div');
  alertDiv.id = 'daem-spelling-alert';
  alertDiv.style.position = 'fixed';
  alertDiv.style.bottom = '170px'; // موضوعة فوق تنبيه فتح بواسطة لتفادي التداخل
  alertDiv.style.left = '30px';
  alertDiv.style.backgroundColor = '#7c3aed'; // لغز بنفسجي مميز
  alertDiv.style.color = '#ffffff';
  alertDiv.style.padding = '14px 24px';
  alertDiv.style.borderRadius = '12px';
  alertDiv.style.fontFamily = 'Cairo, sans-serif';
  alertDiv.style.fontSize = '14px';
  alertDiv.style.fontWeight = 'bold';
  alertDiv.style.boxShadow = '0 10px 30px rgba(124, 58, 237, 0.4)';
  alertDiv.style.zIndex = '999999';
  alertDiv.style.direction = 'rtl';
  alertDiv.style.display = 'flex';
  alertDiv.style.alignItems = 'center';
  alertDiv.style.gap = '15px';
  alertDiv.style.border = '2px solid #a78bfa';
  alertDiv.style.transition = 'all 0.3s ease';

  alertDiv.innerHTML = `
    <span>🪄</span>
    <span>هل تريد تصحيح الأخطاء الإملائية؟ (تم اكتشاف ${errorCount} كلمة خاطئة في تفاصيل البلاغ)</span>
    <button id="btn-spelling-alert-correct" style="background-color: #10b981; border: none; color: white; padding: 6px 12px; cursor: pointer; font-family: Cairo; font-weight: bold; font-size: 12px; border-radius: 6px;">✏️ تصحيح النص</button>
    <button id="btn-close-spelling-alert" style="background: transparent; border: none; color: white; cursor: pointer; font-weight: bold; font-size: 14px;">✕</button>
  `;

  document.body.appendChild(alertDiv);

  document.getElementById('btn-spelling-alert-correct').addEventListener('click', () => {
    const activeInput = findActiveInput();
    showCorrectionConfirmationModal(originalText, correctedText, activeInput);
    alertDiv.remove();
  });

  document.getElementById('btn-close-spelling-alert').addEventListener('click', () => {
    alertDiv.remove();
  });
}

// ==========================================================
// وظائف حساب الفرق الزمني للبلاغات (تاريخ وقت متاح)
// ==========================================================

function cleanDateString(rawStr) {
  if (!rawStr) return "";
  const matches = rawStr.match(/(\d{1,4}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}:\d{2}(?::\d{2})?)/g);
  return matches ? matches.join(' ') : "";
}

function parseTicketDate(dateStr) {
  if (!dateStr) return null;
  
  // Extract date component
  const dateMatch = dateStr.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!dateMatch) return null;
  
  // Extract time component (optional)
  const timeMatch = dateStr.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  
  const first = parseInt(dateMatch[1], 10);
  const second = parseInt(dateMatch[2], 10);
  
  let year, month, day;
  if (first > 1000) {
    year = first;
    month = second - 1;
    day = parseInt(dateMatch[3], 10);
  } else {
    // format is DD/MM/YY or MM/DD/YY
    year = parseInt(dateMatch[3], 10);
    if (year < 100) year += 2000;
    
    // assume MM/DD/YY first
    month = first - 1;
    day = second;
    if (month > 11) {
      month = second - 1;
      day = first;
    }
  }
  
  let hour = 0, minute = 0, secondVal = 0;
  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10);
    minute = parseInt(timeMatch[2], 10);
    if (timeMatch[3]) {
      secondVal = parseInt(timeMatch[3], 10);
    }
  }
  
  let parsedDate = new Date(year, month, day, hour, minute, secondVal);
  
  // If parsed date is in the future, try swapping day and month
  const now = new Date();
  if (parsedDate > now) {
    month = second - 1;
    day = first;
    parsedDate = new Date(year, month, day, hour, minute, secondVal);
  }
  
  return parsedDate;
}

function calculateDateDifference(ticketDate) {
  const now = new Date();
  const diffTime = now - ticketDate;
  if (diffTime < 0) return 0; // في حال وجود فرق طفيف بالثواني
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function formatElapsedArabic(days) {
  if (days === 0) return "اليوم";
  if (days === 1) return "منذ يوم";
  if (days === 2) return "منذ يومين";
  
  if (days < 7) {
    return `منذ ${days} أيام`;
  }
  
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  
  if (days < 30) {
    let weekStr = "";
    if (weeks === 1) weekStr = "أسبوع";
    else if (weeks === 2) weekStr = "أسبوعين";
    else weekStr = `${weeks} أسابيع`;
    
    let dayStr = "";
    if (remainingDays === 1) dayStr = "ويوم";
    else if (remainingDays === 2) dayStr = "ويومين";
    else if (remainingDays > 2) dayStr = `و ${remainingDays} أيام`;
    
    return `منذ ${weekStr} ${dayStr}`.trim();
  }
  
  const months = Math.floor(days / 30);
  const remainingDaysInMonth = days % 30;
  
  let monthStr = "";
  if (months === 1) monthStr = "شهر";
  else if (months === 2) monthStr = "شهرين";
  else if (months >= 3 && months <= 10) monthStr = `${months} أشهر`;
  else monthStr = `${months} شهراً`;
  
  let dayStr = "";
  if (remainingDaysInMonth === 1) dayStr = "ويوم";
  else if (remainingDaysInMonth === 2) dayStr = "ويومين";
  else if (remainingDaysInMonth > 2) dayStr = `و ${remainingDaysInMonth} يوماً`;
  
  return `منذ ${monthStr} ${dayStr}`.trim();
}

function extractDateFromContainer(container) {
  // 1. البحث عن جميع حقول إدخال input والتأكد من تطابق محتواها مع نمط تاريخ
  const inputs = container.querySelectorAll('input');
  for (const input of inputs) {
    if (input && input.value) {
      const val = input.value.trim();
      if (val && (/\d{2}[\/-]\d{2}/.test(val) || /\d{4}[\/-]\d{2}/.test(val))) {
        return { element: input, value: cleanDateString(val) };
      }
    }
  }
  
  // 2. البحث عن أي عنصر نصي يحتوي على نمط تاريخ
  const candidates = container.querySelectorAll('td, div, span, font, b, label');
  for (const cand of candidates) {
    // استبدال جميع الفراغات بما فيها غير المكسورة \u00a0 بفراغ عادي
    const txt = (cand.innerText || '').replace(/\s+/g, ' ').trim();
    if (txt && (/\d{2}[\/-]\d{2}/.test(txt) || /\d{4}[\/-]\d{2}/.test(txt))) {
      // نضمن ألا يكون هذا النص هو العنوان الرئيسي أو النص الطويل
      if (txt.length < 100) {
        const cleaned = cleanDateString(txt);
        if (cleaned) {
          return { element: cand, value: cleaned };
        }
      }
    }
  }
  return null;
}

function findAvailableTimeElement() {
  const allElements = queryAllInPage('div, span, label, td, th, p, b, label-form, font');
  const DATE_LABELS = [
    'وقت متاح', 'تاريخ ووقت متاح', 'تاريخ استقبال البلاغ', 'تاريخ البلاغ', 'تاريخ الإبلاغ', 
    'تاريخ التسجيل', 'تاريخ التقديم', 'تاريخ الإنشاء', 'تاريخ الإسناد',
    'open time', 'available time', 'alert time', 'submit date', 'reported date', 'created date', 'create date', 'open date'
  ];
  
  for (let el of allElements) {
    const text = el.innerText ? el.innerText.replace(/\s+/g, ' ').trim() : "";
    const textLower = text.toLowerCase();
    
    const matched = DATE_LABELS.some(label => text === label || text === (label + ':') || text.includes(label) || textLower.includes(label));
    if (matched) {
      // محاولة 1: العثور على أقرب حاوية سطر (TR) والبحث بداخلها
      let container = el.closest('tr');
      if (!container) {
        // محاولة 2: الصعود للأعلى للبحث عن حاوية سطر نموذج أو عنصر أب نشط
        let temp = el.parentElement;
        for (let i = 0; i < 4 && temp; i++) {
          const tagName = temp.tagName;
          if (tagName === 'TR' || temp.classList.contains('row') || temp.classList.contains('form-group')) {
            container = temp;
            break;
          }
          temp = temp.parentElement;
        }
      }

      if (container) {
        const data = extractDateFromContainer(container);
        if (data) return data;
      }

      // محاولة 3: البحث في الأشقاء التاليين مباشرة
      let sibling = el.nextElementSibling;
      while (sibling) {
        const data = extractDateFromContainer(sibling);
        if (data) return data;
        sibling = sibling.nextElementSibling;
      }
      
      // محاولة 4: البحث في الخلايا المجاورة داخل الجدول (TD السابق والتالي)
      let parent = el.parentElement;
      if (parent && parent.tagName === 'TD') {
        let nextTd = parent.nextElementSibling;
        if (nextTd) {
          const data = extractDateFromContainer(nextTd);
          if (data) return data;
        }
        let prevTd = parent.previousElementSibling;
        if (prevTd) {
          const data = extractDateFromContainer(prevTd);
          if (data) return data;
        }
      }
    }
  }
  return null;
}

// فحص وتحديث حالة تنبيه تحويل البلاغ لموظف آخر في اللوحة العائمة
function updatePanelTransferWarning() {
  try {
    const panel = document.getElementById('daem-premium-panel');
    if (!panel) return;
    
    const warningDiv = document.getElementById('daem-panel-transfer-warning');
    if (!warningDiv) return;
    
    const ticketId = panel.getAttribute('data-ticket-id');
    if (!ticketId) {
      warningDiv.style.display = 'none';
      return;
    }
    
    if (!websiteTickets || websiteTickets.length === 0) {
      warningDiv.style.display = 'none';
      return;
    }
    
    const myTicket = websiteTickets.find(t => {
      const n = String(t.number || t.ticketNumber || t.ticket_number || "").trim();
      return n.includes(ticketId) || ticketId.includes(n);
    });
    
    if (!myTicket) {
      warningDiv.style.display = 'none';
      return;
    }
    
    const dbReceiver = (myTicket.receiver || "").trim();
    if (dbReceiver && dbReceiver !== 'غير حدد' && dbReceiver !== 'غير محدد') {
      const dbEmp = findEmployeeByName(dbReceiver);
      // إذا كان الموظف في قاعدة البيانات ليس هو الموظف المسجل دخوله حالياً
      if (dbEmp && dbEmp.key !== currentLoggedUserKey) {
        warningDiv.style.display = 'flex';
        warningDiv.innerHTML = `⚠️ تم تحويل البلاغ لك (المفترض عند ${dbEmp.arabic})`;
        return;
      }
    }
    
    warningDiv.style.display = 'none';
  } catch (e) {
    console.error("Daem Plus Transfer Warning Error:", e);
  }
}

function updateAvailableTimeDisplay() {
  try {
    // تحديث تنبيه تحويل البلاغ أولاً وبشكل مستقل لضمان عمله حتى لو لم يتم العثور على تاريخ فتح البلاغ بالصفحة
    updatePanelTransferWarning();

    const timeData = findAvailableTimeElement();
    if (!timeData) return;
    
    const { element, value } = timeData;
    if (!value) return;
    
    let badge = document.getElementById('daem-available-time-badge');
    const panelDurationValue = document.getElementById('daem-panel-duration-value');
    
    // إذا كانت الشارة واللوحة العائمة كلاهما محدثين بالفعل بالقيمة الحالية، نتخطى التحديث
    const isPanelUpdated = panelDurationValue && !panelDurationValue.innerText.includes('جاري') && panelDurationValue.innerText !== '';
    if (badge && badge.getAttribute('data-original-value') === value && isPanelUpdated) {
      return; // كلاهما محدث، لا داعي للتحديث
    }
    
    let ticketDate = parseTicketDate(value);
    if (!ticketDate || isNaN(ticketDate.getTime())) {
      return;
    }
    
    const diffDays = calculateDateDifference(ticketDate);
    const durationText = formatElapsedArabic(diffDays);
    
    // تحديد لون الشارة بناءً على عمر البلاغ
    let bgColor = '#10b981'; // أخضر للبلاغات الجديدة
    let textColor = '#ffffff';
    
    if (diffDays >= 30) {
      bgColor = '#e11d48'; // وردي/أحمر داكن لأكثر من شهر
    } else if (diffDays >= 7) {
      bgColor = '#ea580c'; // برتقالي لأكثر من أسبوع
    } else if (diffDays >= 3) {
      bgColor = '#f59e0b'; // أصفر/خردلي لأكثر من 3 أيام
    } else if (diffDays > 0) {
      bgColor = '#3b82f6'; // أزرق لأكثر من يوم
    }
    
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'daem-available-time-badge';
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '4px';
      badge.style.marginRight = '8px';
      badge.style.marginLeft = '8px';
      badge.style.padding = '4px 10px';
      badge.style.borderRadius = '20px';
      badge.style.fontSize = '12px';
      badge.style.fontWeight = 'bold';
      badge.style.fontFamily = 'Cairo, sans-serif';
      badge.style.whiteSpace = 'nowrap';
      badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
      badge.style.transition = 'all 0.3s ease';
      badge.style.verticalAlign = 'middle';
      
      // إدراج الشارة خلف العنصر مباشرة
      element.after(badge);
    }
    
    badge.style.backgroundColor = bgColor;
    badge.style.color = textColor;
    badge.innerHTML = `🕒 ${durationText}`;
    badge.setAttribute('data-original-value', value);

    // تحديث اللوحة العائمة حياً بالتوازي
    if (panelDurationValue) {
      panelDurationValue.innerText = durationText;
      panelDurationValue.style.color = bgColor;
    }
  } catch (e) {
    console.error("Daem Plus Available Time Error:", e);
  }
}

// تفعيل وظيفة حساب المدة وجدولتها
setTimeout(updateAvailableTimeDisplay, 2000);
setInterval(updateAvailableTimeDisplay, 3000);

// تفعيل وظيفة تحديث تنبيه تحويل البلاغ بشكل مستقل ودوري
setTimeout(updatePanelTransferWarning, 2500);
setInterval(updatePanelTransferWarning, 3000);

})();
