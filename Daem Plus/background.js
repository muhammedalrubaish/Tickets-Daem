// الخدمة الخلفية لتجاوز مشاكل CORS v1
const DASHBOARD_API = "https://tickets-daem.vercel.app/api/tickets-json";

// وظيفة جلب البيانات من الموقع (تتجاوز CORS لأنها تعمل في الخلفية)
async function fetchTickets() {
    try {
        const response = await fetch(DASHBOARD_API);
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.error("Error fetching tickets in background:", error);
    }
    return null;
}

// الاستماع لطلبات المحتوى (content script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FETCH_TICKETS") {
        fetchTickets().then(data => sendResponse({ tickets: data }));
        return true; // إخبار المتصفح بأن الاستجابة غير متزامنة
    }
});
