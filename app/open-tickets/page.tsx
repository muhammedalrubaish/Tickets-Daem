'use client';

import { useEffect, useState } from 'react';
import '../globals.css';
import {
  getStoredTicketIds,
  saveTicketIds,
  getNewTicketIds,
  showNotification,
  checkNotificationFrequency
} from '@/lib/notifications';

interface OpenTicket {
  ticketId: string;
  engineer: string;
  category: string;
  subject: string;
  modifiedDate: string;
  url?: string;
}

export default function OpenTicketsPage() {
  const [tickets, setTickets] = useState<OpenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 ثانية
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [previousTickets, setPreviousTickets] = useState<string[]>([]);

  // تسجيل Service Worker وطلب إذن الإشعارات
  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
        }
      } catch (err) {
        console.error('Service Worker registration failed:', err);
      }
    };

    registerServiceWorker();
  }, []);

  // طلب إذن الإشعارات
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setError('المتصفح لا يدعم الإشعارات');
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      return;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          showLocalNotification(
            'تم تفعيل الإشعارات',
            'سيتم إشعارك بالتذاكر الجديدة'
          );
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
      }
    }
  };

  // عرض إشعار محلي
  const showLocalNotification = (title: string, body: string) => {
    showNotification(title, {
      body,
      tag: 'open-tickets',
      requireInteraction: false
    });
  };

  // جلب التذاكر المفتوحة
  const fetchOpenTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/fetch-open-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const newTickets = data.tickets || [];
        setTickets(newTickets);
        setLastCheckTime(new Date());

        // فحص التذاكر الجديدة
        const currentTicketIds = newTickets.map((t: OpenTicket) => t.ticketId);
        const storedIds = previousTickets.length > 0 ? previousTickets : getStoredTicketIds();
        const addedTickets = getNewTicketIds(currentTicketIds, storedIds);

        if (addedTickets.length > 0 && notificationsEnabled) {
          // التحقق من تكرار الإشعارات (لا تزيد عن مرة واحدة في الدقيقة)
          if (checkNotificationFrequency('open_tickets_new', 60000)) {
            showLocalNotification(
              'تذاكر جديدة',
              `تم اكتشاف ${addedTickets.length} تذكرة جديدة: ${addedTickets.slice(0, 2).join(', ')}${addedTickets.length > 2 ? '...' : ''}`
            );
          }
        }

        // حفظ معرفات التذاكر الحالية
        saveTicketIds(currentTicketIds);
        setPreviousTickets(currentTicketIds);
      } else {
        setError(data.error || 'فشل في جلب التذاكر');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  // جلب التذاكر عند التحميل الأول
  useEffect(() => {
    // تحميل البيانات المحفوظة
    const storedTickets = getStoredTicketIds();
    if (storedTickets.length > 0) {
      setPreviousTickets(storedTickets);
    }

    // التحقق من إذن الإشعارات
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }

    // جلب التذاكر
    fetchOpenTickets();
  }, []);

  // إعادة الجلب على فترات محددة
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOpenTickets();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, notificationsEnabled, previousTickets]);

  return (
    <div style={{ direction: 'rtl', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>التذاكر المفتوحة</h1>

      {/* قسم الإعدادات */}
      <div style={styles.settingsPanel}>
        <div style={styles.settingsRow}>
          <button
            onClick={requestNotificationPermission}
            style={{
              ...styles.button,
              backgroundColor: notificationsEnabled ? '#4CAF50' : '#2196F3'
            }}
          >
            {notificationsEnabled ? '✓ الإشعارات مفعلة' : 'تفعيل الإشعارات'}
          </button>

          <button
            onClick={fetchOpenTickets}
            disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: '#FF9800',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'جاري التحديث...' : 'تحديث الآن'}
          </button>

          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            style={styles.select}
          >
            <option value={10000}>كل 10 ثوان</option>
            <option value={30000}>كل 30 ثانية</option>
            <option value={60000}>كل دقيقة</option>
            <option value={300000}>كل 5 دقائق</option>
            <option value={600000}>كل 10 دقائق</option>
          </select>
        </div>

        {lastCheckTime && (
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
            آخر تحديث: {lastCheckTime.toLocaleTimeString('ar-SA')}
          </p>
        )}
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div style={styles.errorBox}>
          <strong>خطأ:</strong> {error}
        </div>
      )}

      {/* عدد التذاكر */}
      <div style={styles.statsBox}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>إجمالي التذاكر المفتوحة:</span>
          <span style={styles.statValue}>{tickets.length}</span>
        </div>
      </div>

      {/* جدول التذاكر */}
      {tickets.length > 0 ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>معرف التذكرة</th>
                <th style={styles.th}>الموضوع</th>
                <th style={styles.th}>الفئة</th>
                <th style={styles.th}>المهندس</th>
                <th style={styles.th}>تاريخ التعديل</th>
                <th style={styles.th}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.ticketId} style={styles.row}>
                  <td style={styles.td}>
                    <a
                      href={ticket.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.link}
                    >
                      {ticket.ticketId}
                    </a>
                  </td>
                  <td style={styles.td}>{ticket.subject}</td>
                  <td style={styles.td}>{ticket.category}</td>
                  <td style={styles.td}>{ticket.engineer}</td>
                  <td style={styles.td}>{ticket.modifiedDate}</td>
                  <td style={styles.td}>
                    <a
                      href={ticket.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.actionButton}
                    >
                      فتح
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading ? (
        <div style={styles.emptyBox}>
          <p>لا توجد تذاكر مفتوحة في الوقت الحالي</p>
        </div>
      ) : null}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  settingsPanel: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ddd'
  },
  settingsRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'opacity 0.3s'
  },
  select: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    border: '1px solid #ef5350'
  },
  statsBox: {
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    border: '1px solid #64b5f6'
  },
  statItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1976d2'
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '5px',
    border: '1px solid #ddd'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white'
  },
  headerRow: {
    backgroundColor: '#1976d2',
    color: 'white'
  },
  th: {
    padding: '15px',
    textAlign: 'right',
    fontWeight: 'bold',
    borderBottom: '1px solid #ddd'
  },
  row: {
    borderBottom: '1px solid #ddd',
    transition: 'backgroundColor 0.2s'
  },
  td: {
    padding: '12px 15px',
    textAlign: 'right'
  },
  link: {
    color: '#1976d2',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '12px',
    display: 'inline-block'
  },
  emptyBox: {
    backgroundColor: '#f5f5f5',
    padding: '40px',
    textAlign: 'center',
    borderRadius: '5px',
    border: '1px solid #ddd',
    color: '#666'
  }
};
