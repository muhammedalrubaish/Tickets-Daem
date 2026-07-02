// popup.js - Manifest V3 compliant script for Daem Plus popup
const iframe = document.getElementById('daem-iframe');

// الاستماع للرسائل القادمة من موقع Vercel لحفظ حالة الصلاحيات والتصحيح الإملائي
// أمان: لا يتم تخزين كلمة المرور نهائياً في الإضافة حتى لا تنكشف عند مشاركتها
window.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SET_ROLE') {
    if (event.data.role) {
      chrome.storage.local.set({
        daemRole: event.data.role,
        daemUsername: event.data.username || '',
        daemUserKey: event.data.userKey || '',
        daemUserArabic: event.data.userArabic || ''
      });
      // إزالة أي كلمة مرور مخزنة من إصدارات سابقة
      chrome.storage.local.remove(['daemPassword']);
    } else {
      chrome.storage.local.remove(['daemRole', 'daemPassword', 'daemUsername', 'daemUserKey', 'daemUserArabic']);
    }
  }

  if (event.data && event.data.action === 'SET_SPELLING') {
    chrome.storage.local.set({
      daemSpellingEnabled: event.data.enabled !== false
    });
  }
});

// تحديث رابط الإطار ليشمل رقم الإصدار والصلاحية وحالة التصحيح الإملائي (بدون كلمة المرور)
function updateIframeSrc() {
  try {
    chrome.storage.local.get(['daemRole', 'daemUsername', 'daemUserKey', 'daemUserArabic', 'daemSpellingEnabled'], (result) => {
      const role = (result && result.daemRole) ? result.daemRole : '';
      const user = (result && result.daemUsername) ? result.daemUsername : '';
      const spelling = (result && result.daemSpellingEnabled !== false) ? 'true' : 'false';
      const version = chrome.runtime.getManifest().version;

      const targetSrc = "https://tickets-daem.vercel.app/extension-popup?v=" + version + "&role=" + role + "&spelling=" + spelling;

      // منع التكرار اللانهائي للتحديث
      if (iframe && iframe.src !== targetSrc && iframe.src !== targetSrc + "/") {
        iframe.src = targetSrc;
      }
    });
  } catch (e) {
    console.error("Failed to read chrome storage/manifest:", e);
  }
}

// تشغيل التحديث عند الجاهزية
document.addEventListener('DOMContentLoaded', updateIframeSrc);
