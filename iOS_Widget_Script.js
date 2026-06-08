// Icon: 📱
// Scriptable Widget for Baladi Unit (وحدة بلدي)
// Developer: Antigravity AI
// Description: Displays real-time ticket statistics on iPhone Home Screen.

// ⚠️ استبدل الرابط أدناه برابط موقعك الفعلي على Netlify أو Vercel
const BASE_URL = "https://balaghat-unit.netlify.app"; // ضع رابط موقعك هنا
const API_URL = `${BASE_URL}/api/widget-stats`;

let data = await fetchStats();

if (config.runsInWidget) {
  let widget = await createWidget(data);
  Script.setWidget(widget);
  Script.complete();
} else {
  // عند تشغيل السكربت داخل التطبيق مباشرة، يعرض معاينة للويدجت
  let widget = await createWidget(data);
  await widget.presentMedium();
}

// دالة جلب البيانات من الـ API
async function fetchStats() {
  try {
    let req = new Request(API_URL);
    req.method = "GET";
    req.headers = { "Content-Type": "application/json" };
    let res = await req.loadJSON();
    if (res && res.success) {
      return res;
    }
  } catch (e) {
    console.log("Error fetching stats: " + e);
  }
  
  // بيانات تجريبية في حال فشل الاتصال بالخادم
  return {
    success: false,
    stats: { total: 0, new: 0, waiting: 0, unsolved: 0, solved: 0 },
    latest: []
  };
}

// دالة تصميم وبناء الويدجت
async function createWidget(data) {
  let widget = new ListWidget();
  
  // إعدادات الخلفية (تدرج لوني فخم متناسق مع هوية بلدي الداكنة)
  let gradient = new LinearGradient();
  gradient.colors = [new Color("#0f172a"), new Color("#1e293b")]; // داكن فاخر
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  widget.padding = new Rect(12, 12, 12, 12);

  // عند الضغط على الويدجت يفتح لوحة التحكم مباشرة
  widget.url = BASE_URL;

  // --- الهيدر (العنوان والشعار) ---
  let headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();
  
  // العنوان
  let titleText = headerStack.addText("📊 إحصائيات بلاغات بلدي");
  titleText.font = Font.boldSystemFont(14);
  titleText.textColor = new Color("#ffffff");
  
  headerStack.addSpacer();
  
  // مؤشر الحالة العامة
  let statusBadge = headerStack.addStack();
  statusBadge.backgroundColor = data.success ? new Color("#10b981", 0.2) : new Color("#ef4444", 0.2);
  statusBadge.cornerRadius = 4;
  statusBadge.padding = new Rect(2, 6, 2, 6);
  let statusText = statusBadge.addText(data.success ? "متصل" : "أوفلاين");
  statusText.font = Font.boldSystemFont(9);
  statusText.textColor = data.success ? new Color("#10b981") : new Color("#ef4444");

  widget.addSpacer(8);

  // --- صف المؤشرات الرقمية (الكرت الذكي) ---
  let statsStack = widget.addStack();
  statsStack.layoutHorizontally();
  statsStack.spacing = 6;

  // كرت الإجمالي
  addStatCard(statsStack, "الإجمالي", data.stats.total.toString(), "#f8fafc");
  // كرت البلاغات الجديدة
  addStatCard(statsStack, "جديد", data.stats.new.toString(), "#8b5cf6");
  // كرت معلق/لم يحل
  addStatCard(statsStack, "غير محلول", data.stats.unsolved.toString(), "#ef4444");
  // كرت تم الحل
  addStatCard(statsStack, "تم الحل", data.stats.solved.toString(), "#10b981");

  widget.addSpacer(10);

  // --- قسم آخر البلاغات المستلمة ---
  let sectionTitle = widget.addText("🕒 آخر التحديثات:");
  sectionTitle.font = Font.boldSystemFont(11);
  sectionTitle.textColor = new Color("#94a3b8");
  
  widget.addSpacer(4);

  let latestTickets = data.latest || [];
  if (latestTickets.length === 0) {
    let emptyText = widget.addText(data.success ? "لا توجد بلاغات مسجلة حالياً" : "يرجى التحقق من اتصال الإنترنت ورابط الـ API");
    emptyText.font = Font.systemFont(10);
    emptyText.textColor = new Color("#64748b");
  } else {
    // عرض آخر تذكرتين لتوفير المساحة في الويدجت المتوسط (Medium)
    let displayList = latestTickets.slice(0, 2);
    for (let ticket of displayList) {
      let row = widget.addStack();
      row.layoutHorizontally();
      row.centerAlignContent();
      row.spacing = 4;

      // رقم التذكرة
      let numText = row.addText(`🎫 ${ticket.number}`);
      numText.font = Font.boldSystemFont(10);
      numText.textColor = new Color("#ffffff");

      row.addSpacer(6);

      // نوع البلاغ
      let typeText = row.addText(ticket.type);
      typeText.font = Font.systemFont(10);
      typeText.textColor = new Color("#cbd5e1");
      typeText.lineLimit = 1;

      row.addSpacer();

      // حالة البلاغ
      let stateBadge = row.addStack();
      let stateColor = getStatusColor(ticket.status);
      stateBadge.backgroundColor = new Color(stateColor, 0.15);
      stateBadge.cornerRadius = 4;
      stateBadge.padding = new Rect(1, 4, 1, 4);
      
      let stateText = stateBadge.addText(ticket.status);
      stateText.font = Font.boldSystemFont(8);
      stateText.textColor = new Color(stateColor);

      widget.addSpacer(3);
    }
  }

  return widget;
}

// دالة مساعدة لإنشاء كرت إحصائي مصغر
function addStatCard(parent, title, value, colorHex) {
  let card = parent.addStack();
  card.layoutVertically();
  card.backgroundColor = new Color("#1e293b", 0.6);
  card.cornerRadius = 6;
  card.padding = new Rect(6, 6, 6, 6);
  card.centerAlignContent();
  
  let valText = card.addText(value);
  valText.font = Font.boldSystemFont(15);
  valText.textColor = new Color(colorHex);
  valText.textOpacity = 0.95;

  let titleText = card.addText(title);
  titleText.font = Font.systemFont(8);
  titleText.textColor = new Color("#94a3b8");
  titleText.textOpacity = 0.8;
}

// دالة مساعدة لتلوين الحالات
function getStatusColor(status) {
  switch (status) {
    case 'بلاغ جديد': return '#8b5cf6';
    case 'بانتظار المستفيد': return '#ec4899';
    case 'لدى الوزارة': return '#f59e0b';
    case 'مشكلة عامة': return '#0ea5e9';
    case 'لم يتم الحل': return '#ef4444';
    case 'تم الحل': return '#10b981';
    case 'مجاز': return '#6b7280';
    default: return '#3b82f6';
  }
}
