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
  commercial: { id: 'commercial', label: 'الالطلبات التجارية', color: '#22c55e', glow: 'rgba(34,197,94,0.3)', icon: '🏪' },
  construction: { id: 'construction', label: 'الالطلبات الإنشائية', color: '#f97316', glow: 'rgba(249,115,22,0.3)', icon: '🏗️' },
  housing: { id: 'housing', label: 'طلبات السكن الجماعي', color: '#a855f7', glow: 'rgba(168,85,247,0.3)', icon: '🏢' },
  agency: { id: 'agency', label: 'طلبات عن الوكالة', color: '#06b6d4', glow: 'rgba(6,182,212,0.3)', icon: '💼' },
  other: { id: 'other', label: 'طلبات أخرى', color: '#7d8590', glow: 'rgba(125,133,144,0.3)', icon: '📋' }
};

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
      count: row.total
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
      {/* الشريط العلوي */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <img src="/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png" alt="شعار بلدي" className={styles.logo} />
          <div>
            <h1 className={styles.title}>شاشة مؤشرات البلديات الفرعية</h1>
            <p className={styles.subtitle}>تجميع الإحصائيات وتحليل المعاملات قيد الإجراء حسب ملف الأكسل</p>
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
        <div className={styles.kpiCard} style={{ '--kpi-color': 'var(--foreground)' } as React.CSSProperties}>
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiTitle}>إجمالي الطلبات</span>
            <span className={styles.kpiIcon}>📋</span>
          </div>
          <div className={styles.kpiNumber}>{kpis.total}</div>
        </div>
        <div className={styles.kpiCard} style={{ '--kpi-color': CATEGORIES.commercial.color } as React.CSSProperties}>
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiTitle}>{CATEGORIES.commercial.label}</span>
            <span className={styles.kpiIcon}>{CATEGORIES.commercial.icon}</span>
          </div>
          <div className={styles.kpiNumber}>{kpis.commercial}</div>
        </div>
        <div className={styles.kpiCard} style={{ '--kpi-color': CATEGORIES.construction.color } as React.CSSProperties}>
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiTitle}>{CATEGORIES.construction.label}</span>
            <span className={styles.kpiIcon}>{CATEGORIES.construction.icon}</span>
          </div>
          <div className={styles.kpiNumber}>{kpis.construction}</div>
        </div>
        <div className={styles.kpiCard} style={{ '--kpi-color': CATEGORIES.housing.color } as React.CSSProperties}>
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiTitle}>{CATEGORIES.housing.label}</span>
            <span className={styles.kpiIcon}>{CATEGORIES.housing.icon}</span>
          </div>
          <div className={styles.kpiNumber}>{kpis.housing}</div>
        </div>
        <div className={styles.kpiCard} style={{ '--kpi-color': CATEGORIES.agency.color } as React.CSSProperties}>
          <div className={styles.kpiCardHeader}>
            <span className={styles.kpiTitle}>{CATEGORIES.agency.label}</span>
            <span className={styles.kpiIcon}>{CATEGORIES.agency.icon}</span>
          </div>
          <div className={styles.kpiNumber}>{kpis.agency}</div>
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
            <svg width="200" height="200" viewBox="0 0 200 200">
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
                
                {/* Bars */}
                {barChartData.list.map((d, index) => {
                  const barWidth = 28;
                  const spacing = (380 - barChartData.list.length * barWidth) / (barChartData.list.length + 1);
                  const x = 50 + index * (barWidth + spacing) + spacing;
                  const height = (d.count / barChartData.maxCount) * 150;
                  const y = 170 - height;
                  
                  return (
                    <g key={d.name}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        fill={hoveredBar === d.fullName ? 'var(--primary)' : 'var(--border)'}
                        stroke={hoveredBar === d.fullName ? 'var(--primary)' : 'var(--border)'}
                        strokeWidth="1"
                        rx="4"
                        className={styles.barChartRect}
                        onMouseEnter={(e) => {
                          setHoveredBar(d.fullName);
                          setTooltip({
                            active: true,
                            x: e.clientX,
                            y: e.clientY,
                            title: d.fullName,
                            content: [
                              { label: 'إجمالي الطلبات', val: `${d.count} معاملة` }
                            ]
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
