// تحديث الأرقام في الواجهة بسلاسة v2
function updateUI(counts) {
    if (!counts) return;
    document.getElementById('count-new').textContent = counts.new || 0;
    document.getElementById('count-recent').textContent = counts.recent || 0;
    document.getElementById('count-old').textContent = counts.old || 0;
    document.getElementById('count-very-old').textContent = counts.veryOld || 0;
    document.getElementById('count-unassigned').textContent = counts.unassigned || 0;
}

// قراءة البيانات فور فتح القائمة من التخزين المحلي
chrome.storage.local.get(['daemCounts'], function(result) {
    if (result.daemCounts) {
        updateUI(result.daemCounts);
    }
});

// مراقبة التغييرات في التخزين لتحديث الواجهة لحظياً
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.daemCounts) {
        updateUI(changes.daemCounts.newValue);
    }
});
