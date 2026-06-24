"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import styles from './municipalities.module.css';

// 13 Records matching the user's template image exactly for demonstration
const DEMO_DATA = [
  // بلدية الديرة الفرعية (1 سكن جماعي)
  { "البلدية": "بلدية الديرة الفرعية", "نوع الطلب": "ترخيص سكن جماعي للأفراد", "رقم الطلب": "481001", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/10/26 8:00:00 AM", "اسم مالك الرخصة": "شركة الإسكان الجماعي" },
  // بلدية الصفراء الفرعية (1 تجاري، 1 إنشائي، 1 سكن جماعي)
  { "البلدية": "بلدية الصفراء الفرعية", "نوع الطلب": "إصدار ترخيص فتح محل 24 ساعة", "رقم الطلب": "48275223436", "حالة الطلب": "مراقب الرخص التجارية", "تاريخ انشاء الطلب": "6/17/26 1:07:20 PM", "اسم الموظف": "خالد علي عبدالرحمن القريعان", "اسم مالك الرخصة": "صيدلية زيد عبدالله زيد الدخيل الطبية" },
  { "البلدية": "بلدية الصفراء الفرعية", "نوع الطلب": "إصدار رخصة بناء إنشائية", "رقم الطلب": "482001", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/15/26 9:00:00 AM", "اسم مالك الرخصة": "عبدالله محمد الصالح" },
  { "البلدية": "بلدية الصفراء الفرعية", "نوع الطلب": "ترخيص سكن جماعي للأفراد", "رقم الطلب": "482002", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/14/26 10:00:00 AM", "اسم مالك الرخصة": "مؤسسة الضيافة السكنية" },
  // بلدية شمال بريدة (1 إنشائي، 1 سكن جماعي)
  { "البلدية": "بلدية شمال بريدة", "نوع الطلب": "إصدار رخصة بناء إنشائية", "رقم الطلب": "483001", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/12/26 11:00:00 AM", "اسم مالك الرخصة": "صالح علي الصالح" },
  { "البلدية": "بلدية شمال بريدة", "نوع الطلب": "ترخيص سكن جماعي للأفراد", "رقم الطلب": "483002", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/11/26 2:00:00 PM", "اسم مالك الرخصة": "شركة نماء العقارية" },
  // بلدية جنوب بريدة (2 إنشائي)
  { "البلدية": "بلدية جنوب بريدة", "نوع الطلب": "إصدار رخصة بناء إنشائية", "رقم الطلب": "484001", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/16/26 3:00:00 PM", "اسم مالك الرخصة": "حمد ابراهيم العبيد" },
  { "البلدية": "بلدية جنوب بريدة", "نوع الطلب": "إصدار رخصة بناء إنشائية", "رقم الطلب": "484002", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/16/26 4:30:00 PM", "اسم مالك الرخصة": "يوسف عبدالرحمن الحربي" },
  // بلدية عنيزة (3 إنشائي)
  { "البلدية": "بلدية عنيزة", "نوع الطلب": "إصدار رخصة بناء إنشائية", "رقم الطلب": "485001", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/13/26 9:00:00 AM", "اسم مالك الرخصة": "خالد بن صالح القاضي" },
  { "البلدية": "بلدية عنيزة", "نوع الطلب": "إصدار رخصة بناء إنشائية", "رقم الطلب": "485002", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/14/26 1:00:00 PM", "اسم مالك الرخصة": "شركة عنيزة للتطوير" },
  { "البلدية": "بلدية عنيزة", "نوع الطلب": "إصدار رخصة بناء إنشائية", "رقم الطلب": "485003", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/15/26 10:00:00 AM", "اسم مالك الرخصة": "سليمان عبدالرحمن المطرودي" },
  // بلدية قبة (1 تجاري)
  { "البلدية": "بلدية قبة", "نوع الطلب": "تجديد رخصة تجارية محلات", "رقم الطلب": "48275202316", "حالة الطلب": "استقبال الرخص التجارية", "تاريخ انشاء الطلب": "6/16/26 7:54:54 PM", "اسم مالك الرخصة": "مؤسسة الفن الاخير للسيارات" },
  // بلدية عقلة الصقور (1 إنشائي)
  { "البلدية": "بلدية عقلة الصقور", "نوع الطلب": "إصدار رخصة بناء إنشائية", "رقم الطلب": "486001", "حالة الطلب": "تحت الإجراء عند البلدية", "تاريخ انشاء الطلب": "6/16/26 11:30:00 AM", "اسم مالك الرخصة": "سعود مقبل الحربي" }
];

const CATEGORIES = {
  commercial: { id: 'commercial', label: 'الطلبات التجارية', color: '#81ff3a', glow: 'rgba(129,255,58,0.2)', icon: '🏪' },
  construction: { id: 'construction', label: 'الطلبات الإنشائية', color: '#4ade80', glow: 'rgba(74,222,128,0.2)', icon: '🏗️' },
  housing: { id: 'housing', label: 'طلبات السكن الجماعي', color: '#22c55e', glow: 'rgba(34,197,94,0.2)', icon: '🏢' },
  agency: { id: 'agency', label: 'طلبات عن الوكالة', color: '#15803d', glow: 'rgba(21,128,61,0.2)', icon: '💼' },
  other: { id: 'other', label: 'طلبات أخرى', color: '#759982', glow: 'rgba(117,153,130,0.2)', icon: '📋' }
};

// مكون مخصص لتحريك الأعداد والعد التصاعدي بشكل جمالي عند فتح الصفحة
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.floor(value);
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    // Animate over 800ms
    const duration = 800; 
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.max(Math.abs(Math.floor(duration / range)), 12);
    
    const timer = setInterval(() => {
      current += increment;
      setDisplayValue(current);
      if (current === end) {
        clearInterval(timer);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function MunicipalitiesPage() {
  const [dataSourceType, setDataSourceType] = useState<'demo' | 'excel'>('demo');
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Chart interaction states
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ active: boolean; x: number; y: number; title: string; content: any[] }>({
    active: false,
    x: 0,
    y: 0,
    title: '',
    content: []
  });

  // Load cached excel data on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('cached_municipalities_records');
      const cachedName = localStorage.getItem('cached_municipalities_filename');
      if (cached) {
        setExcelData(JSON.parse(cached));
        setExcelFileName(cachedName || 'ملف الأكسل المحفوظ');
        setDataSourceType('excel');
      }
    } catch (err) {
      console.error('Failed to load cached records:', err);
    }
  }, []);

  // Parse Excel file helper
  const parseExcelFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("الملف فارغ أو غير مقروء");
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (json.length === 0) {
          throw new Error("لا توجد بيانات مقروءة في الصفحة الأولى من ملف الأكسل.");
        }
        
        setExcelData(json);
        setExcelFileName(file.name);
        setDataSourceType('excel');
        
        // Cache to LocalStorage
        localStorage.setItem('cached_municipalities_records', JSON.stringify(json));
        localStorage.setItem('cached_municipalities_filename', file.name);
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء معالجة ملف الأكسل.");
      }
    };
    reader.onerror = () => {
      setError("خطأ في قراءة ملف الأكسل.");
    };
    reader.readAsArrayBuffer(file);
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parseExcelFile(file);
      } else {
        setError("يرجى سحب وإفلات ملف أكسل فقط (.xlsx أو .xls)");
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseExcelFile(e.target.files[0]);
    }
  };

  const handleResetToDemo = () => {
    setDataSourceType('demo');
    setError(null);
  };

  const handleClearExcelCache = () => {
    localStorage.removeItem('cached_municipalities_records');
    localStorage.removeItem('cached_municipalities_filename');
    setExcelData([]);
    setExcelFileName('');
    setDataSourceType('demo');
    setError(null);
  };

  // Select active records depending on source type
  const rawRecords = useMemo(() => {
    return dataSourceType === 'demo' ? DEMO_DATA : excelData;
  }, [dataSourceType, excelData]);

  // Classification Logic based on "نوع الطلب"
  const classifiedRecords = useMemo(() => {
    return rawRecords.map((record, index) => {
      const type = record["نوع الطلب"] || "";
      const t = String(type).toLowerCase();
      
      let category = 'other';
      if (t.includes('تجاري') || t.includes('محل') || t.includes('تجارية')) {
        category = 'commercial';
      } else if (t.includes('بناء') || t.includes('إنشائي') || t.includes('إنشائية') || t.includes('ترميم') || t.includes('هدم') || t.includes('تسوير') || t.includes('ملحق')) {
        category = 'construction';
      } else if (t.includes('سكن') || t.includes('جماعي')) {
        category = 'housing';
      } else if (t.includes('وكالة') || t.includes('الوكالة')) {
        category = 'agency';
      }

      return {
        ...record,
        id: record["رقم الطلب"] || `row-${index}`,
        classifiedCategory: category,
        municipality: record["البلدية"] || "غير محدد",
        status: record["حالة الطلب"] || "قيد المراجعة",
        days: Number(record["عدد الابام"] || record["عدد الايام"] || 0)
      };
    });
  }, [rawRecords]);

  // List of all unique Municipalities, Statuses for dropdowns
  const municipalitiesList = useMemo(() => {
    const list = new Set<string>();
    classifiedRecords.forEach(r => {
      if (r.municipality) list.add(r.municipality);
    });
    return Array.from(list).sort();
  }, [classifiedRecords]);

  const statusesList = useMemo(() => {
    const list = new Set<string>();
    classifiedRecords.forEach(r => {
      if (r.status) list.add(r.status);
    });
    return Array.from(list).sort();
  }, [classifiedRecords]);

  // Filter records based on user search & drop-downs
  const filteredRecords = useMemo(() => {
    return classifiedRecords.filter(r => {
      const matchQuery = searchQuery ? (
        (r["رقم الطلب"] && String(r["رقم الطلب"]).includes(searchQuery)) ||
        (r["نوع الطلب"] && String(r["نوع الطلب"]).includes(searchQuery)) ||
        (r["البلدية"] && String(r["البلدية"]).includes(searchQuery)) ||
        (r["اسم مالك الرخصة"] && String(r["اسم مالك الرخصة"]).includes(searchQuery)) ||
        (r["اسم الموظف"] && String(r["اسم الموظف"]).includes(searchQuery))
      ) : true;

      const matchMuni = selectedMunicipality === 'all' ? true : r.municipality === selectedMunicipality;
      const matchCat = selectedCategory === 'all' ? true : r.classifiedCategory === selectedCategory;
      const matchStatus = selectedStatus === 'all' ? true : r.status === selectedStatus;

      return matchQuery && matchMuni && matchCat && matchStatus;
    });
  }, [classifiedRecords, searchQuery, selectedMunicipality, selectedCategory, selectedStatus]);

  // Calculate aggregated stats by Municipality (matching the user table structure)
  const municipalitySummaryTable = useMemo(() => {
    const map: Record<string, any> = {};
    
    // Initialize map with all unique municipalities in the filtered set
    classifiedRecords.forEach(r => {
      const muni = r.municipality;
      if (!map[muni]) {
        map[muni] = {
          municipality: muni,
          commercial: 0,
          construction: 0,
          housing: 0,
          agency: 0,
          other: 0,
          total: 0
        };
      }
    });

    // Populate counts based on classified records
    classifiedRecords.forEach(r => {
      const muni = r.municipality;
      const cat = r.classifiedCategory;
      if (map[muni]) {
        map[muni][cat]++;
        map[muni].total++;
      }
    });

    const arr = Object.values(map).sort((a, b) => a.municipality.localeCompare(b.municipality));

    const totals = {
      municipality: 'الإجمالي',
      commercial: 0,
      construction: 0,
      housing: 0,
      agency: 0,
      other: 0,
      total: 0
    };

    arr.forEach(item => {
      totals.commercial += item.commercial;
      totals.construction += item.construction;
      totals.housing += item.housing;
      totals.agency += item.agency;
      totals.other += item.other;
      totals.total += item.total;
    });

    return { rows: arr, totals };
  }, [classifiedRecords]);

  // Dynamic KPI Counts
  const kpis = useMemo(() => {
    const counts = { total: 0, commercial: 0, construction: 0, housing: 0, agency: 0, other: 0 };
    classifiedRecords.forEach(r => {
      counts.total++;
      if (counts[r.classifiedCategory as keyof typeof counts] !== undefined) {
        counts[r.classifiedCategory as keyof typeof counts]++;
      }
    });
    return counts;
  }, [classifiedRecords]);

  // Status breakdown calculations
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    classifiedRecords.forEach(r => {
      if (r.status) {
        map[r.status] = (map[r.status] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [classifiedRecords]);

  // Donut Chart Math Calculations
  const donutChartSegments = useMemo(() => {
    const data = [
      { count: kpis.commercial, ...CATEGORIES.commercial },
      { count: kpis.construction, ...CATEGORIES.construction },
      { count: kpis.housing, ...CATEGORIES.housing },
      { count: kpis.agency, ...CATEGORIES.agency },
    ].filter(s => s.count > 0);

    const total = data.reduce((sum, s) => sum + s.count, 0) || 1;
    let accumulatedPercentage = 0;

    return data.map(s => {
      const percentage = (s.count / total) * 100;
      const result = {
        ...s,
        percentage,
        startPercent: accumulatedPercentage
      };
      accumulatedPercentage += percentage;
      return result;
    });
  }, [kpis]);

  // Bar Chart Math Calculations (Requests by Municipality)
  const barChartData = useMemo(() => {
    const list = municipalitySummaryTable.rows.map(row => ({
      name: row.municipality.replace("بلدية ", ""),
      fullName: row.municipality,
      count: row.total,
      commercial: row.commercial,
      construction: row.construction,
      housing: row.housing,
      agency: row.agency,
      other: row.other
    })).filter(item => item.count > 0);
    
    const maxCount = Math.max(...list.map(d => d.count), 5);
    return { list, maxCount };
  }, [municipalitySummaryTable]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMunicipality('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  // Export current table to CSV
  const handleExportCSV = () => {
    const headers = 'البلدية,الطلبات التجارية,الالطلبات الإنشائية,طلبات السكن الجماعي,طلبات عن الوكالة,الإجمالي\n';
    const rows = municipalitySummaryTable.rows.map(r =>
      `"${r.municipality}","${r.commercial}","${r.construction}","${r.housing}","${r.agency}","${r.total}"`
    ).join('\n');
    const totals = `"الإجمالي","${municipalitySummaryTable.totals.commercial}","${municipalitySummaryTable.totals.construction}","${municipalitySummaryTable.totals.housing}","${municipalitySummaryTable.totals.agency}","${municipalitySummaryTable.totals.total}"`;

    const bom = '\uFEFF';
    const blob = new Blob([bom + headers + rows + '\n' + totals], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `إحصائيات_البلديات_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      {/* Dynamic Animated Glow Blobs Background */}
      <div className={styles.bgBlobs}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        <div className={styles.blob3}></div>
      </div>
      {/* الشريط العلوي */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <span style={{ fontSize: '1.8rem', marginRight: '6px' }}>📊</span>
          <div>
            <h1 className={styles.title}>Power UI - مؤشرات البلديات</h1>
            <p className={styles.subtitle}>تجميع وتحليل المعاملات قيد الإجراء بالتنسيق الداكن الفاخر</p>
          </div>
        </div>

        <div className={styles.controls}>
          <a href="/" className={styles.btn} style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
            العودة للرئيسية &larr;
          </a>
        </div>
      </header>

      {/* Excel Drag & Drop Upload Zone */}
      <div className={styles.excelLoaderCard}>
        <div 
          className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".xlsx, .xls"
            onChange={handleFileInputChange}
          />
          <span className={styles.dropzoneIcon}>📥</span>
          <span className={styles.dropzoneText}>اسحب وأفلت ملف الأكسل هنا أو اضغط للاختيار</span>
          <span className={styles.dropzoneSubtext}>الملف المطلوب: "الطلبات التجارية تحت الاجراء عند البلدية.xlsx"</span>
        </div>

        <div className={styles.loaderInfo}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>مصدر البيانات الحالي: </span>
            {dataSourceType === 'demo' ? (
              <span className={styles.sourceBadge}>البيانات النموذجية الافتراضية (مطابقة لصورة النموذج)</span>
            ) : (
              <span className={styles.sourceBadgeExcel}>ملف أكسل: {excelFileName}</span>
            )}
          </div>
          <div className={styles.controls} style={{ gap: '6px' }}>
            {dataSourceType === 'excel' && (
              <button className={styles.btn} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={handleClearExcelCache}>
                🗑️ حذف الملف وذاكرة التخزين
              </button>
            )}
            <button className={styles.btn} onClick={handleResetToDemo}>
              🔄 العودة للبيانات النموذجية
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          ⚠️ <strong>خطأ في القراءة:</strong> {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        {/* إجمالي الطلبات */}
        <div className={styles.kpiCard} style={{ '--kpi-color': 'var(--primary)', '--kpi-glow': 'rgba(74, 222, 128, 0.1)' } as React.CSSProperties}>
          {/* Circular Gauge */}
          <div className={styles.kpiCircularContainer}>
            <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6.5" />
              <circle
                cx="48"
                cy="48"
                r="38"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="6.5"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={0}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className={styles.kpiCircularValue}>
              <span className={styles.kpiIconMicro}>📋</span>
              <div className={styles.kpiCircularNumber}><AnimatedNumber value={kpis.total} /></div>
              <div className={styles.kpiCircularLabel}>إجمالي الطلبات</div>
              <div className={styles.kpiCircularPercent} style={{ color: 'var(--primary)' }}>100%</div>
            </div>
          </div>
        </div>

        {/* الطلبات التجارية */}
        <div className={styles.kpiCard} style={{ '--kpi-color': CATEGORIES.commercial.color, '--kpi-glow': CATEGORIES.commercial.glow } as React.CSSProperties}>
          {/* Circular Gauge */}
          {(() => {
            const percentage = kpis.total > 0 ? (kpis.commercial / kpis.total) * 100 : 0;
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            return (
              <div className={styles.kpiCircularContainer}>
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6.5" />
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke={CATEGORIES.commercial.color}
                    strokeWidth="6.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div className={styles.kpiCircularValue}>
                  <span className={styles.kpiIconMicro}>{CATEGORIES.commercial.icon}</span>
                  <div className={styles.kpiCircularNumber} style={{ color: CATEGORIES.commercial.color }}><AnimatedNumber value={kpis.commercial} /></div>
                  <div className={styles.kpiCircularLabel}>{CATEGORIES.commercial.label}</div>
                  <div className={styles.kpiCircularPercent} style={{ color: CATEGORIES.commercial.color }}>
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* الطلبات الإنشائية */}
        <div className={styles.kpiCard} style={{ '--kpi-color': CATEGORIES.construction.color, '--kpi-glow': CATEGORIES.construction.glow } as React.CSSProperties}>
          {/* Circular Gauge */}
          {(() => {
            const percentage = kpis.total > 0 ? (kpis.construction / kpis.total) * 100 : 0;
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            return (
              <div className={styles.kpiCircularContainer}>
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6.5" />
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke={CATEGORIES.construction.color}
                    strokeWidth="6.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div className={styles.kpiCircularValue}>
                  <span className={styles.kpiIconMicro}>{CATEGORIES.construction.icon}</span>
                  <div className={styles.kpiCircularNumber} style={{ color: CATEGORIES.construction.color }}><AnimatedNumber value={kpis.construction} /></div>
                  <div className={styles.kpiCircularLabel}>{CATEGORIES.construction.label}</div>
                  <div className={styles.kpiCircularPercent} style={{ color: CATEGORIES.construction.color }}>
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* طلبات السكن الجماعي */}
        <div className={styles.kpiCard} style={{ '--kpi-color': CATEGORIES.housing.color, '--kpi-glow': CATEGORIES.housing.glow } as React.CSSProperties}>
          {/* Circular Gauge */}
          {(() => {
            const percentage = kpis.total > 0 ? (kpis.housing / kpis.total) * 100 : 0;
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            return (
              <div className={styles.kpiCircularContainer}>
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6.5" />
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke={CATEGORIES.housing.color}
                    strokeWidth="6.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div className={styles.kpiCircularValue}>
                  <span className={styles.kpiIconMicro}>{CATEGORIES.housing.icon}</span>
                  <div className={styles.kpiCircularNumber} style={{ color: CATEGORIES.housing.color }}><AnimatedNumber value={kpis.housing} /></div>
                  <div className={styles.kpiCircularLabel}>{CATEGORIES.housing.label}</div>
                  <div className={styles.kpiCircularPercent} style={{ color: CATEGORIES.housing.color }}>
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* طلبات عن الوكالة */}
        <div className={styles.kpiCard} style={{ '--kpi-color': CATEGORIES.agency.color, '--kpi-glow': CATEGORIES.agency.glow } as React.CSSProperties}>
          {/* Circular Gauge */}
          {(() => {
            const percentage = kpis.total > 0 ? (kpis.agency / kpis.total) * 100 : 0;
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            return (
              <div className={styles.kpiCircularContainer}>
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6.5" />
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke={CATEGORIES.agency.color}
                    strokeWidth="6.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div className={styles.kpiCircularValue}>
                  <span className={styles.kpiIconMicro}>{CATEGORIES.agency.icon}</span>
                  <div className={styles.kpiCircularNumber} style={{ color: CATEGORIES.agency.color }}><AnimatedNumber value={kpis.agency} /></div>
                  <div className={styles.kpiCircularLabel}>{CATEGORIES.agency.label}</div>
                  <div className={styles.kpiCircularPercent} style={{ color: CATEGORIES.agency.color }}>
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.dashboardGrid}>
        {/* Donut Chart: Requests by Category */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <h3 className={styles.chartTitle}>📈 نسبة الطلبات حسب التصنيف</h3>
          </div>
          <div className={styles.svgContainer}>
            <div className={styles.donutGlow}></div>
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ zIndex: 1, position: 'relative' }}>
              <circle cx="100" cy="100" r="85" fill="none" stroke="var(--border)" strokeWidth="18" style={{ opacity: 0.2 }} />
              {donutChartSegments.map((segment) => {
                const radius = 85;
                const circumference = 2 * Math.PI * radius;
                const strokeDasharray = `${(segment.percentage * circumference) / 100} ${circumference}`;
                const strokeDashoffset = `${- (segment.startPercent * circumference) / 100}`;
                
                return (
                  <circle
                    key={segment.id}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 100 100)"
                    className={styles.donutSegment}
                    style={{
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      filter: hoveredCategory === segment.id ? 'brightness(1.2)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      setHoveredCategory(segment.id);
                      setTooltip({
                        active: true,
                        x: e.clientX,
                        y: e.clientY,
                        title: segment.label,
                        content: [
                          { label: 'عدد الطلبات', val: `${segment.count} طلب` },
                          { label: 'النسبة المئوية', val: `${segment.percentage.toFixed(1)}%` }
                        ]
                      });
                    }}
                    onMouseMove={(e) => {
                      setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
                    }}
                    onMouseLeave={() => {
                      setHoveredCategory(null);
                      setTooltip(prev => ({ ...prev, active: false }));
                    }}
                  />
                );
              })}
            </svg>
            <div className={styles.donutCenterText}>
              <span className={styles.donutCenterVal}>
                {hoveredCategory 
                  ? (donutChartSegments.find(s => s.id === hoveredCategory)?.count || 0) 
                  : kpis.total}
              </span>
              <span className={styles.donutCenterLabel}>
                {hoveredCategory 
                  ? (donutChartSegments.find(s => s.id === hoveredCategory)?.label || "") 
                  : "إجمالي الطلبات"}
              </span>
            </div>
          </div>
          <div className={styles.chartLegend}>
            {donutChartSegments.map((segment) => (
              <div 
                key={segment.id} 
                className={styles.legendItem}
                onMouseEnter={() => setHoveredCategory(segment.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{ cursor: 'pointer' }}
              >
                <span className={styles.legendColor} style={{ backgroundColor: segment.color }}></span>
                <span>{segment.label} ({segment.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Requests by Municipality */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <h3 className={styles.chartTitle}>🏢 إجمالي المعاملات لكل بلدية فرعية</h3>
          </div>
          <div className={styles.svgContainer}>
            {barChartData.list.length === 0 ? (
              <div className={styles.noDataMsg}>لا تتوفر بيانات للبلديات النشطة.</div>
            ) : (
              <svg width="100%" height="220" viewBox="0 0 450 220" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                  const y = 20 + r * 150;
                  const val = Math.round(barChartData.maxCount * (1 - r));
                  return (
                    <g key={idx}>
                      <line x1="45" y1={y} x2="430" y2={y} className={styles.chartGridLine} />
                      <text x="35" y={y + 4} textAnchor="end" className={styles.chartLabelText}>{val}</text>
                    </g>
                  );
                })}
                
                {/* Bars (Stacked Columns matching the Power UI style) */}
                {barChartData.list.map((d, index) => {
                  const barWidth = 28;
                  const spacing = (380 - barChartData.list.length * barWidth) / (barChartData.list.length + 1);
                  const x = 50 + index * (barWidth + spacing) + spacing;
                  
                  return (
                    <g key={d.name}>
                      {/* Stacked segments loop */}
                      {(() => {
                        const categoriesOrder = [
                          { key: 'agency', color: CATEGORIES.agency.color },
                          { key: 'housing', color: CATEGORIES.housing.color },
                          { key: 'construction', color: CATEGORIES.construction.color },
                          { key: 'commercial', color: CATEGORIES.commercial.color },
                          { key: 'other', color: CATEGORIES.other.color }
                        ];
                        
                        let currentY = 170;
                        return categoriesOrder.map((catInfo) => {
                          const catValue = d[catInfo.key as keyof typeof d] as number || 0;
                          if (catValue === 0) return null;
                          const height = (catValue / barChartData.maxCount) * 150;
                          currentY -= height;
                          
                          return (
                            <rect
                              key={catInfo.key}
                              x={x}
                              y={currentY}
                              width={barWidth}
                              height={height}
                              fill={catInfo.color}
                              opacity={hoveredBar === d.fullName ? 1 : 0.85}
                              stroke="rgba(0, 0, 0, 0.15)"
                              strokeWidth="1"
                              className={styles.barChartRect}
                              style={{ transition: 'all 0.2s' } as React.CSSProperties}
                              onMouseEnter={(e) => {
                                setHoveredBar(d.fullName);
                                setTooltip({
                                  active: true,
                                  x: e.clientX,
                                  y: e.clientY,
                                  title: d.fullName,
                                  content: [
                                    { label: CATEGORIES.commercial.label, val: `${d.commercial} طلب` },
                                    { label: CATEGORIES.construction.label, val: `${d.construction} طلب` },
                                    { label: CATEGORIES.housing.label, val: `${d.housing} طلب` },
                                    { label: CATEGORIES.agency.label, val: `${d.agency} طلب` },
                                    { label: CATEGORIES.other.label, val: `${d.other} طلب` },
                                    { label: 'الإجمالي', val: `${d.count} معاملة` }
                                  ].filter(item => !item.val.startsWith('0'))
                                });
                              }}
                              onMouseMove={(e) => {
                                setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
                              }}
                              onMouseLeave={() => {
                                setHoveredBar(null);
                                setTooltip(prev => ({ ...prev, active: false }));
                              }}
                            />
                          );
                        });
                      })()}
                      <text
                        x={x + barWidth / 2}
                        y="190"
                        textAnchor="middle"
                        className={styles.chartLabelText}
                        transform={`rotate(-20, ${x + barWidth / 2}, 190)`}
                        style={{ fontSize: '9px' }}
                      >
                        {d.name}
                      </text>
                    </g>
                  );
                })}
                <line x1="45" y1="170" x2="430" y2="170" className={styles.chartAxisLine} />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate Summary Table (User Template Recreation) */}
      <div className={styles.summaryTableCard}>
        <div className={styles.summaryTableHeader}>
          <h2>📊 جدول إحصائيات المعاملات قيد الإجراء بالبلديات (النموذج المرفق)</h2>
          <button className={styles.btnPrimary} onClick={handleExportCSV}>
            📥 تصدير الجدول إلى CSV
          </button>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.styledTable}>
            <thead>
              <tr>
                <th>طلبات عن الوكالة</th>
                <th>طلبات السكن الجماعي</th>
                <th>الطلبات الإنشائية</th>
                <th>الطلبات التجارية</th>
                <th>البلدية</th>
              </tr>
            </thead>
            <tbody>
              {municipalitySummaryTable.rows.map((row) => (
                <tr key={row.municipality}>
                  {/* طلبات عن الوكالة */}
                  <td className={row.agency > 0 ? styles.cellHighlight : styles.cellEmpty} style={{ '--cell-color': CATEGORIES.agency.color } as React.CSSProperties}>
                    {row.agency || ""}
                  </td>
                  {/* طلبات السكن الجماعي */}
                  <td className={row.housing > 0 ? styles.cellHighlight : styles.cellEmpty} style={{ '--cell-color': CATEGORIES.housing.color } as React.CSSProperties}>
                    {row.housing || ""}
                  </td>
                  {/* الطلبات الإنشائية */}
                  <td className={row.construction > 0 ? styles.cellHighlight : styles.cellEmpty} style={{ '--cell-color': CATEGORIES.construction.color } as React.CSSProperties}>
                    {row.construction || ""}
                  </td>
                  {/* الطلبات التجارية */}
                  <td className={row.commercial > 0 ? styles.cellHighlight : styles.cellEmpty} style={{ '--cell-color': CATEGORIES.commercial.color } as React.CSSProperties}>
                    {row.commercial || ""}
                  </td>
                  {/* البلدية */}
                  <td style={{ fontWeight: 700, textAlign: 'right', background: 'rgba(0,0,0,0.02)' }}>{row.municipality}</td>
                </tr>
              ))}
              
              {/* Total Row */}
              <tr className={styles.styledTable + ' ' + styles.totalRow}>
                <td>{municipalitySummaryTable.totals.agency}</td>
                <td>{municipalitySummaryTable.totals.housing}</td>
                <td>{municipalitySummaryTable.totals.construction}</td>
                <td>{municipalitySummaryTable.totals.commercial}</td>
                <td>الإجمالي</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters and Detailed Raw Data list */}
      <div className={styles.controlsCard}>
        <div className={styles.chartCardHeader} style={{ marginBottom: 4 }}>
          <h3 className={styles.chartTitle} style={{ margin: 0 }}>🔍 تصفية وبحث الطلبات التفصيلية</h3>
        </div>
        <div className={styles.controlsRow}>
          <input
            type="text"
            placeholder="ابحث برقم الطلب، المالك، أو نوع الخدمة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select
            value={selectedMunicipality}
            onChange={(e) => setSelectedMunicipality(e.target.value)}
          >
            <option value="all">كل البلديات الفرعية ({municipalitiesList.length})</option>
            {municipalitiesList.map(muni => (
              <option key={muni} value={muni}>{muni}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">كل التصنيفات</option>
            {Object.values(CATEGORIES).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">كل الحالات ({statusesList.length})</option>
            {statusesList.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <button className={styles.clearBtn} onClick={handleResetFilters}>
            ❌ تهيئة التصفية
          </button>
        </div>

        {/* Detailed List */}
        <div className={styles.detailsHeader}>
          <h3>📑 قائمة الطلبات التفصيلية المصفاة</h3>
          <span className={styles.badgeCount}>{filteredRecords.length} طلب</span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>البلدية</th>
                <th>التصنيف</th>
                <th>نوع الطلب</th>
                <th>مالك الرخصة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, fontSize: '12px', color: 'var(--primary)' }}>{r["رقم الطلب"]}</td>
                  <td>{r.municipality}</td>
                  <td>
                    <span 
                      className={styles.statusBadge} 
                      style={{ 
                        backgroundColor: `${CATEGORIES[r.classifiedCategory as keyof typeof CATEGORIES]?.color}15`, 
                        color: CATEGORIES[r.classifiedCategory as keyof typeof CATEGORIES]?.color,
                        border: `1px solid ${CATEGORIES[r.classifiedCategory as keyof typeof CATEGORIES]?.color}30`
                      }}
                    >
                      {CATEGORIES[r.classifiedCategory as keyof typeof CATEGORIES]?.label}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '13px' }}>{r["نوع الطلب"]}</td>
                  <td style={{ fontSize: '13px' }}>{r["اسم مالك الرخصة"] || "—"}</td>
                  <td>
                    <span className={styles.statusBadge} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.noDataMsg}>
                    لا توجد نتائج تطابق خيارات التصفية الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Hover Tooltip for SVG elements */}
      {tooltip.active && (
        <div 
          className={`${styles.chartTooltip} ${styles.chartTooltipActive}`}
          style={{ 
            left: `${tooltip.x}px`, 
            top: `${tooltip.y}px` 
          }}
        >
          <span className={styles.tooltipTitle}>{tooltip.title}</span>
          {tooltip.content.map((row, idx) => (
            <div key={idx} className={styles.tooltipRow}>
              <span style={{ color: 'var(--text-muted)' }}>{row.label}:</span>
              <span style={{ fontWeight: 700 }}>{row.val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
