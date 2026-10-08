// src/js/services/tourManager.js

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

class TourManager {
  constructor() {
    this.driverInstance = null;
    this.currentTour = null;
    this.isActive = false;
    this.tabSwitcher = null;
  }

  // ===== تسجيل دالة تبديل التبويب =====
  setTabSwitcher(fn) {
    this.tabSwitcher = fn;
  }

  // ===== تشغيل جولة (عامة) =====

  // ===== تشغيل جولة (عامة) =====
 startTour(tourName, steps) {
  if (localStorage.getItem(`tour_${tourName}_completed`) === 'true') {
    this.showToast('لقد أكملت هذه الجولة بالفعل', 'info');
    return;
  }

  const initialized = this.initialize(steps);
  if (initialized) {
    this.currentTour = tourName;
    this.driverInstance.drive(); // ← تغيير هنا
  }
}

  // ===== تهيئة الـ Driver =====
// ===== تهيئة الـ Driver =====
initialize(steps) {
  try {
    this.driverInstance = driver({
      showProgress: true,
      allowClose: false,
      nextBtnText: 'التالي',
      prevBtnText: 'السابق',
      doneBtnText: 'إنهاء',
      progressText: 'خطوة {{current}} من {{total}}',
      onNext: () => {
        const currentStep = this.driverInstance.getCurrentStep();
        if (currentStep && currentStep.tab && this.tabSwitcher) {
          this.tabSwitcher(currentStep.tab);
        }
      },
      onPrevious: () => {},
      onClose: () => { this.isActive = false; },
      onDone: () => {
        this.isActive = false;
        localStorage.setItem(`tour_${this.currentTour}_completed`, 'true');
        this.showToast('تم الانتهاء من الجولة', 'success');
      }
    });

    // تعيين الخطوات باستخدام الطريقة الصحيحة (حسب الإصدار)
    if (typeof this.driverInstance.setSteps === 'function') {
      this.driverInstance.setSteps(steps);
    } else if (typeof this.driverInstance.steps === 'function') {
      this.driverInstance.steps(steps);
    } else {
      // في الإصدارات الجديدة جداً قد تكون steps خاصية وليست دالة
      this.driverInstance.steps = steps;
    }

    return true;
  } catch (error) {
    console.error('❌ فشل تهيئة الجولة:', error);
    this.showToast('حدث خطأ أثناء تهيئة الجولة', 'error');
    return false;
  }
}
  // ===== إعادة تعيين جولة معينة =====
  resetTour(tourName) {
    localStorage.removeItem(`tour_${tourName}_completed`);
    this.showToast(`تم إعادة تعيين جولة ${tourName}`, 'info');
  }

  // ===== Reset All =====
  resetAllTours() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('tour_'));
    keys.forEach(k => localStorage.removeItem(k));
    this.showToast('تم إعادة تعيين جميع الجولات', 'info');
  }

  // ===== Toast =====
  showToast(message, type = 'info') {
    const event = new CustomEvent('miraclepos:toast', { detail: { message, type } });
    window.dispatchEvent(event);
  }

  // ================================================================
  // 1. الجولة الرئيسية (نظرة عامة)
  // ================================================================
// ================================================================
// 1. الجولة الرئيسية (نظرة عامة) - معدلة لتشمل جميع الأقسام
// ================================================================
  // ================================================================
  // 1. الجولة الرئيسية (نظرة عامة) — معدّلة لتشمل كل العناصر
  // ================================================================
// ================================================================
// 1. الجولة الرئيسية — مطابقة للترتيب الفعلي للقائمة الجانبية
// ================================================================
createMainTour() {
  return [
    /* ============================================================
       نقطة البداية: القائمة الجانبية بالكامل
       ============================================================ */
    {
      element: '.sidebar',
      popover: {
        title: '🏥 مرحباً بك في MiraclePos',
        description: 'هذه هي القائمة الجانبية التي تحتوي على جميع أقسام النظام. سنأخذك في جولة سريعة عليها بالترتيب.',
        side: 'right',
        align: 'start'
      }
    },

    /* ============================================================
       المجموعة 1: الرئيسية (mainTabs)
       ============================================================ */
    {
      element: '.sidebar ul li:nth-child(1)',
      popover: {
        title: '1️⃣ 📊 الرئيسية',
        description: 'نظرة عامة سريعة على أداء الصيدلية: المؤشرات الرئيسية، التنبيهات الذكية، والرسوم البيانية.',
        side: 'right',
        align: 'start'
      },
      tab: 'overview'
    },

    /* ============================================================
       المجموعة 2: إدارة المخزون (inventoryTabs)
       ============================================================ */
    {
      element: '.sidebar ul li:nth-child(2)',
      popover: {
        title: '2️⃣ 💊 إدارة الأدوية',
        description: 'إضافة وتعديل الأدوية في الكاتالوج، تحديد وحدات البيع والمعاملات، وربط قواعد التسعير.',
        side: 'right',
        align: 'start'
      },
      tab: 'medicine'
    },
    {
      element: '.sidebar ul li:nth-child(3)',
      popover: {
        title: '3️⃣ 🛒 المشتريات',
        description: 'تسجيل فواتير شراء جديدة من الموردين، وإدارة المخزون عبر الدفعات وتواريخ الصلاحية.',
        side: 'right',
        align: 'start'
      },
      tab: 'purchases'
    },
    {
      element: '.sidebar ul li:nth-child(4)',
      popover: {
        title: '4️⃣ 📦 الجرد',
        description: 'متابعة المخزون الفعلي، إجراء عمليات الجرد اليدوي، وتعديل الكميات عند وجود فروقات.',
        side: 'right',
        align: 'start'
      },
      tab: 'stocktaking'
    },

    /* ============================================================
       المجموعة 3: المالية (financeTabs)
       ============================================================ */
    {
      element: '.sidebar ul li:nth-child(5)',
      popover: {
        title: '5️⃣ ⏰ الورديات',
        description: 'إدارة ورديات العمل، متابعة الحركة النقدية (الفتح/الإغلاق)، وتحليل أداء الموظفين.',
        side: 'right',
        align: 'start'
      },
      tab: 'shifts'
    },
    {
      element: '.sidebar ul li:nth-child(6)',
      popover: {
        title: '6️⃣ 💳 الديون',
        description: 'متابعة ديون العملاء والموظفين، المبالغ المدفوعة والمتبقية، وسجل السداد الكامل.',
        side: 'right',
        align: 'start'
      },
      tab: 'debts'
    },
    {
      element: '.sidebar ul li:nth-child(7)',
      popover: {
        title: '7️⃣ 💸 المصروفات',
        description: 'تسجيل ومتابعة المصروفات التشغيلية اليومية (كهرباء، ماء، صيانة، إيجار...).',
        side: 'right',
        align: 'start'
      },
      tab: 'expenses'
    },
    {
      element: '.sidebar ul li:nth-child(8)',
      popover: {
        title: '8️⃣ 💰 الرواتب',
        description: 'إدارة رواتب الموظفين، احتساب الإضافات والخصومات، وصرف الرواتب نقداً أو بنكياً.',
        side: 'right',
        align: 'start'
      },
      tab: 'salaries'
    },
    {
      element: '.sidebar ul li:nth-child(9)',
      popover: {
        title: '9️⃣ ⚙️ محرك الأسعار',
        description: 'إدارة قواعد التسعير، تحديد نسب الربح، ومحاكاة الأسعار تلقائياً حسب قاعدة كل دواء.',
        side: 'right',
        align: 'start'
      },
      tab: 'pricing'
    },
    {
      element: '.sidebar ul li:nth-child(10)',
      popover: {
        title: '🔟 📈 التقارير المالية',
        description: '⚠️ قسم مهم للمحاسب! تقارير شاملة قابلة للطباعة والتصدير حسب الفرع والفترة الزمنية.',
        side: 'right',
        align: 'start'
      },
      tab: 'financial_reports'
    },

    /* ============================================================
       المجموعة 4: الإدارة العامة (generalTabs)
       ============================================================ */
    {
      element: '.sidebar ul li:nth-child(11)',
      popover: {
        title: '1️⃣1️⃣ 🏢 الفروع',
        description: 'إضافة وتعديل فروع الصيدلية وإدارة بياناتها وعناوينها.',
        side: 'right',
        align: 'start'
      },
      tab: 'branches'
    },
    {
      element: '.sidebar ul li:nth-child(12)',
      popover: {
        title: '1️⃣2️⃣ 🏷️ التصنيفات',
        description: 'إدارة تصنيفات الأدوية (مسكنات، مضادات حيوية، فيتامينات...) لتسهيل البحث والتنظيم.',
        side: 'right',
        align: 'start'
      },
      tab: 'categories'
    },
    {
      element: '.sidebar ul li:nth-child(13)',
      popover: {
        title: '1️⃣3️⃣ 🚚 الموردين',
        description: 'إدارة بيانات الموردين (الاسم، الهاتف، البريد) — ضروري عند تسجيل فواتير الشراء.',
        side: 'right',
        align: 'start'
      },
      tab: 'suppliers'
    },
    {
      element: '.sidebar ul li:nth-child(14)',
      popover: {
        title: '1️⃣4️⃣ 👤 المستخدمين',
        description: 'إدارة حسابات الموظفين: تحديد الصلاحيات، الرواتب، الفروع، وأرقام PIN.',
        side: 'right',
        align: 'start'
      },
      tab: 'users'
    },

    /* ============================================================
       المجموعة 5: التحليلات والدعم (supportTabs)
       ============================================================ */
    {
      element: '.sidebar ul li:nth-child(15)',
      popover: {
        title: '1️⃣5️⃣ 📊 التحليلات',
        description: 'لوحة تحليلات متقدمة تعرض مؤشرات الأداء والرسوم البيانية لدعم القرار (تحليل ABC، التوقعات...).',
        side: 'right',
        align: 'start'
      },
      tab: 'analytics'
    },
    {
      element: '.sidebar ul li:nth-child(16)',
      popover: {
        title: '1️⃣6️⃣ 📋 سجل التدقيق',
        description: '⚠️ ميزة أمنية مهمة! سجل كامل لكل العمليات الحساسة (تغيير أسعار، سحوبات، إلغاءات).',
        side: 'right',
        align: 'start'
      },
      tab: 'audit_log'
    },
    {
      element: '.sidebar ul li:nth-child(17)',
      popover: {
        title: '1️⃣7️⃣ 💾 النسخ الاحتياطي',
        description: '⚠️ مهم جداً! إنشاء وإدارة النسخ الاحتياطية لقاعدة البيانات. احرص على تفعيلها دورياً.',
        side: 'right',
        align: 'start'
      },
      tab: 'backup_settings'
    },
    {
      element: '.sidebar ul li:nth-child(18)',
      popover: {
        title: '1️⃣8️⃣ ⚙️ الإعدادات',
        description: 'ضبط إعدادات الصيدلية (الاسم، الشعار، العنوان)، إعدادات الطباعة، نظام PIN، والأمان.',
        side: 'right',
        align: 'start'
      },
      tab: 'settings'
    },
    {
      element: '.sidebar ul li:nth-child(19)',
      popover: {
        title: '1️⃣9️⃣ 📖 دليل الاستخدام',
        description: 'دليل شامل لاستخدام النظام — مرجع سريع للموظفين الجدد والقدامى.',
        side: 'right',
        align: 'start'
      },
      tab: 'guide'
    },
    {
      element: '.sidebar ul li:nth-child(20)',
      popover: {
        title: '2️⃣0️⃣ ℹ️ حول النظام',
        description: 'معلومات عن الإصدار، المطورين، الوثائق القانونية، والدعم الفني.',
        side: 'right',
        align: 'start'
      },
      tab: 'about'
    },

    /* ============================================================
       نقطة النهاية: زر الجولة العائم
       ============================================================ */
    {
      element: '.tour-floating-btn',
      popover: {
        title: '🧭 زر الجولة الإرشادية',
        description: 'يمكنك العودة إلى هذه الجولة في أي وقت من خلال هذا الزر العائم. جولة موفقة! 🎉',
        side: 'top',
        align: 'start'
      }
    }
  ];
}
  // ================================================================
  // 2. جولة إدارة الأدوية (باستخدام المعرفات)
  // ================================================================
  createMedicineTour() {
    return [
      {
        element: '.bg-white.rounded-2xl:first-child',
        popover: {
          title: '📝 إضافة دواء جديد',
          description: 'هنا يمكنك إضافة دواء جديد إلى الكاتالوج.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[placeholder="اسم الدواء"]',
        popover: {
          title: '📛 اسم الدواء',
          description: 'أدخل الاسم التجاري للدواء (مثال: Panadol).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[placeholder="الباركود الأساسي"]',
        popover: {
          title: '📷 الباركود',
          description: 'الباركود الرئيسي للدواء. يمكنك مسحه باستخدام ماسح الباركود.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'select:has(option[value=""])',
        popover: {
          title: '📂 التصنيف',
          description: 'اختر التصنيف المناسب للدواء (مسكنات، مضادات حيوية، فيتامينات...)',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#pricing-rule-select',
        popover: {
          title: '📊 قاعدة التسعير',
          description: '⚠️ هذا حقل مهم! يحدد كيفية حساب سعر البيع تلقائياً (نسبة، مبلغ ثابت، ضرب). اتركها افتراضية إن لم يحتج الدواء إلى قاعدة خاصة.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#units-section-title',
        popover: {
          title: '📦 وحدات البيع',
          description: 'هنا يتم تعريف وحدات البيع للدواء (علبة، شريط، قطعة).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#unit-factor-input',
        popover: {
          title: '🔢 معامل الوحدة (Factor)',
          description: '⚠️ هذا حقل مهم جداً! يحدد عدد الوحدات الصغرى في الوحدة الكبرى. مثال: إذا كانت العلبة تحتوي على 10 اشرطة وكل شريط به 10 حبات فمعامل العلبة= 100 ومعامل الشريط = 10. هذا يساعد النظام في تحويل الكميات تلقائياً أثناء البيع.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#save-medicine-btn',
        popover: {
          title: '💾 حفظ الدواء',
          description: 'بعد إدخال جميع البيانات، اضغط هنا لحفظ الدواء في الكاتالوج.',
          side: 'top',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 3. جولة المشتريات (باستخدام المعرفات)
  // ================================================================
  createPurchaseTour() {
    return [
      {
        element: '.bg-white.rounded-2xl:first-child',
        popover: {
          title: '📋 فاتورة شراء جديدة',
          description: 'املأ بيانات الفاتورة الأساسية مثل المورد والفرع وتاريخ الشراء.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'select:has(option[value=""])',
        popover: {
          title: '🏢 المورد',
          description: 'اختر المورد الذي ستشتري منه الأدوية.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.lg\\:col-span-4 input',
        popover: {
          title: '🔍 البحث عن دواء',
          description: 'ابحث عن الدواء الذي تريد شراءه عن طريق الاسم أو الباركود.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.lg\\:col-span-2 select',
        popover: {
          title: '📦 وحدة الشراء',
          description: 'اختر الوحدة التي ستشتري بها (علبة، شريط، قطعة).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#lot-input',
        popover: {
          title: '🏷️ رقم التشغيلة (LOT)',
          description: 'رقم التشغيلة الخاص بالدفعة من المورد. يساعد في تتبع المنتج.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[type="date"]',
        popover: {
          title: '📅 تاريخ الصلاحية (EXP)',
          description: 'تاريخ انتهاء صلاحية الدفعة. سيتم تنبيهك عند اقتراب تاريخ الصلاحية.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#save-purchase-btn',
        popover: {
          title: '💾 حفظ الفاتورة',
          description: 'بعد إضافة جميع الأصناف، اضغط هنا لحفظ الفاتورة وتحديث المخزون.',
          side: 'top',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 4. جولة الجرد (باستخدام المعرفات)
  // ================================================================
  createInventoryTour() {
    return [
      {
        element: '.grid.grid-cols-2.lg\\:grid-cols-4.gap-5',
        popover: {
          title: '📊 إحصائيات المخزون',
          description: 'نظرة سريعة على إجمالي الأصناف، المخزون المنخفض، النافد، وآخر تاريخ جرد.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#inventory-filters-section',
        popover: {
          title: '🔍 البحث والفلترة',
          description: 'ابحث عن صنف معين أو قم بتصفية النتائج حسب الفرع أو الحالة (منخفض، نافد، منتهي الصلاحية).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#inventory-table',
        popover: {
          title: '📋 جدول المخزون',
          description: 'يعرض جميع الأصناف مع الكميات المتوفرة والحد الأدنى وحالة المخزون.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.text-blue-600.hover\\:text-blue-800',
        popover: {
          title: '✏️ تعديل المخزون',
          description: 'انقر هنا لتعديل كمية الصنف يدوياً. أدخل الكمية الفعلية وسيحسب النظام الفرق تلقائياً.',
          side: 'right',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 5. جولة التحليلات (باستخدام المعرفات)
  // ================================================================
  createAnalyticsTour() {
    return [
      {
        element: '.flex.flex-col.md\\:flex-row.justify-between',
        popover: {
          title: '📈 مركز ذكاء الصيدلية',
          description: 'هنا يمكنك رؤية مؤشرات الأداء الرئيسية واختيار الفرع لعرض بياناته.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.grid.grid-cols-2.sm\\:grid-cols-2.lg\\:grid-cols-4.gap-4',
        popover: {
          title: '📊 مركز القرارات اليومية',
          description: 'يعرض هذا القسم أهم التنبيهات: الأصناف منخفضة المخزون، وقرب انتهاء الصلاحية، وصحة المخزون، ورأس المال المجمد.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4.xl\\:grid-cols-5.gap-4',
        popover: {
          title: '📊 المؤشرات الرئيسية',
          description: 'هذه البطاقات تعرض مبيعات وأرباح اليوم والأسبوع والشهر، بالإضافة إلى قيمة المخزون ومتوسط الفاتورة.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.grid.lg\\:grid-cols-2.gap-6:first-of-type',
        popover: {
          title: '📈 الرسوم البيانية',
          description: 'تعرض هذه المخططات تطور المبيعات والأرباح والنمو الشهري.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.grid.lg\\:grid-cols-3.gap-6',
        popover: {
          title: '📊 تحليلات إضافية',
          description: 'توزيع المخزون، تحليل الموردين، وساعات الذروة للمبيعات.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#top-profit-table',
        popover: {
          title: '🏆 الأعلى ربحية',
          description: 'هذا الجدول يعرض الأدوية الأكثر ربحية، مما يساعد في اتخاذ قرارات التسعير والترويج.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#purchase-plan-table',
        popover: {
          title: '📋 خطة الشراء المقترحة (ERP)',
          description: 'بناءً على متوسط الاستهلاك اليومي، يقترح النظام كميات الطلب المثلى للحفاظ على المخزون وتجنب النفاد.',
          side: 'bottom',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 6. جولة الفروع (باستخدام المعرفات)
  // ================================================================
  createBranchesTour() {
    return [
      {
        element: '.bg-white.rounded-xl.shadow-sm.border:first-child',
        popover: {
          title: '🏢 إضافة فرع جديد',
          description: 'أدخل اسم الفرع والموقع لإضافته إلى النظام.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[placeholder="اسم الفرع (مثال: الفرع الرئيسي)"]',
        popover: {
          title: '📛 اسم الفرع',
          description: 'اكتب اسماً مميزاً للفرع ليسهل التعرف عليه.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[placeholder="الموقع أو العنوان"]',
        popover: {
          title: '📍 الموقع',
          description: 'أدخل العنوان التفصيلي للفرع.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-emerald-600.hover\\:bg-emerald-700',
        popover: {
          title: '💾 حفظ الفرع',
          description: 'انقر هنا لحفظ بيانات الفرع الجديد.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '.border.border-slate-200.rounded-xl.overflow-hidden',
        popover: {
          title: '📋 قائمة الفروع',
          description: 'هنا تظهر جميع الفروع المسجلة، ويمكنك تعديل أو حذف أي منها.',
          side: 'bottom',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 7. جولة التصنيفات (باستخدام المعرفات)
  // ================================================================
  createCategoriesTour() {
    return [
      {
        element: '.bg-white.rounded-2xl.shadow-sm.border:first-child',
        popover: {
          title: '🏷️ إضافة تصنيف جديد',
          description: 'أضف تصنيفاً للأدوية مثل "مسكنات"، "مضادات حيوية"، "فيتامينات".',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[placeholder="اسم التصنيف"]',
        popover: {
          title: '📛 اسم التصنيف',
          description: 'اكتب اسماً واضحاً للتصنيف.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-emerald-600.hover\\:bg-emerald-700',
        popover: {
          title: '💾 حفظ التصنيف',
          description: 'احفظ التصنيف ليصبح متاحاً في قائمة التصنيفات عند إضافة الأدوية.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '.bg-white.rounded-2xl.shadow-sm.border:last-child',
        popover: {
          title: '📋 قائمة التصنيفات',
          description: 'ستظهر التصنيفات المضافة هنا، ويمكنك تعديلها أو حذفها.',
          side: 'bottom',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 8. جولة الديون (باستخدام المعرفات)
  // ================================================================
  createDebtsTour() {
    return [
      {
        element: '.flex.flex-col.sm\\:flex-row.justify-between',
        popover: {
          title: '💳 إدارة الديون',
          description: 'متابعة ديون العملاء، المبالغ المدفوعة، والمتبقي وسجل السداد.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-blue-600.hover\\:bg-blue-700',
        popover: {
          title: '➕ تسجيل دين جديد',
          description: 'اضغط هنا لفتح نموذج إضافة دين جديد للعميل.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-white.rounded-2xl.shadow-sm.border:first-of-type',
        popover: {
          title: '📋 جدول الديون',
          description: 'يعرض جميع الديون مع حالة كل دين (مدفوع، جزئي، غير مدفوع).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-white.rounded-2xl.shadow-sm.border:last-of-type',
        popover: {
          title: '🔍 تفاصيل الدين',
          description: 'عند اختيار دين معين، ستظهر تفاصيله هنا مع سجل المدفوعات.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-emerald-600.hover\\:bg-emerald-700',
        popover: {
          title: '💰 سداد الدين',
          description: 'يمكنك إضافة دفعة جديدة لتسجيل سداد جزئي أو كلي للدين. انقر على زر "سداد" في الجدول أو داخل تفاصيل الدين.',
          side: 'bottom',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 9. جولة المصروفات (باستخدام المعرفات)
  // ================================================================
  createExpensesTour() {
    return [
      {
        element: '.flex.flex-col.sm\\:flex-row.justify-between',
        popover: {
          title: '💸 إدارة المصروفات',
          description: 'متابعة المصروفات التشغيلية مثل الإيجار، الفواتير، والرواتب الإضافية.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-rose-600.hover\\:bg-rose-700',
        popover: {
          title: '➕ إضافة مصروف جديد',
          description: 'اضغط لفتح نموذج إضافة مصروف.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-white.rounded-2xl.shadow-sm.border:last-of-type',
        popover: {
          title: '📋 جدول المصروفات',
          description: 'يعرض جميع المصروفات مع التفاصيل: البيان، المبلغ، المسؤول، التاريخ، والملاحظات.',
          side: 'bottom',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 10. جولة الرواتب (باستخدام المعرفات)
  // ================================================================
  createSalariesTour() {
    return [
      {
        element: '.flex.items-center.justify-between',
        popover: {
          title: '💰 إدارة الرواتب',
          description: 'إدارة رواتب الموظفين وصرفها.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#salary-stats-section',
        popover: {
          title: '📊 إحصائيات الرواتب',
          description: 'تعرض إجمالي الرواتب، المدفوع، المتبقي، وعدد الرواتب.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#salary-filters-section',
        popover: {
          title: '🔍 فلاتر البحث',
          description: 'يمكنك تصفية الرواتب حسب الشهر والسنة والحالة (مدفوع/غير مدفوع).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-white.rounded-xl.shadow.overflow-hidden',
        popover: {
          title: '📋 جدول الرواتب',
          description: 'يعرض جميع رواتب الموظفين مع التفاصيل (الأساسي، الإضافات، الخصومات، الصافي).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#salary-edit-btn',
        popover: {
          title: '✏️ تعديل الراتب',
          description: 'يمكنك تعديل الإضافات والخصومات لكل راتب (زر التعديل في الجدول).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#salary-pay-btn',
        popover: {
          title: '💰 صرف الراتب',
          description: 'تسجيل عملية صرف الراتب (نقدي أو بنكي) مع إدخال البيانات المطلوبة (زر الصرف في الجدول).',
          side: 'bottom',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 11. جولة الورديات (باستخدام المعرفات)
  // ================================================================
  createShiftsTour() {
    return [
      {
        element: '.space-y-6:first-of-type',
        popover: {
          title: '⏰ إدارة الورديات',
          description: 'متابعة ورديات العمل، الحركة النقدية، والأداء العام.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4.gap-6',
        popover: {
          title: '📊 إحصائيات الورديات',
          description: 'تعرض عدد الورديات المفتوحة والمغلقة، المبيعات النقدية، والرصيد المتوقع.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#shifts-filters-section',
        popover: {
          title: '🔍 فلاتر البحث',
          description: 'ابحث عن وردية معينة حسب اسم الموظف، الحالة، أو الفترة الزمنية.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#shifts-table',
        popover: {
          title: '📋 جدول الورديات',
          description: 'يعرض جميع الورديات مع تفاصيل الفتح والإغلاق والمبالغ النقدية والفرق.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#shift-details-section',
        popover: {
          title: '🔍 تفاصيل الوردية',
          description: 'عند اختيار وردية من الجدول، تظهر تفاصيلها الكاملة هنا: المبيعات، المصروفات، السحوبات، والرصيد النهائي.',
          side: 'bottom',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 12. جولة الموردين (باستخدام المعرفات)
  // ================================================================
  createSuppliersTour() {
    return [
      {
        element: '.bg-white.rounded-2xl.shadow-sm.border:first-of-type',
        popover: {
          title: '🚚 إضافة مورد جديد',
          description: 'أدخل بيانات المورد (الاسم، الهاتف، البريد الإلكتروني).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[placeholder="اسم المورد"]',
        popover: {
          title: '📛 اسم المورد',
          description: 'اكتب اسم المورد (شركة أو فرد).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[placeholder="رقم الهاتف"]',
        popover: {
          title: '📞 رقم الهاتف',
          description: 'رقم التواصل مع المورد.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[placeholder="البريد الإلكتروني"]',
        popover: {
          title: '✉️ البريد الإلكتروني',
          description: 'البريد الإلكتروني للمورد (اختياري).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-emerald-600.hover\\:bg-emerald-700',
        popover: {
          title: '💾 حفظ المورد',
          description: 'احفظ المورد لتظهر بياناته في قائمة الموردين ويمكن استخدامه في فواتير الشراء.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '.bg-white.rounded-2xl.shadow-sm.border:last-of-type',
        popover: {
          title: '📋 قائمة الموردين',
          description: 'جميع الموردين المسجلين، ويمكنك تعديل أو حذف أي منهم.',
          side: 'bottom',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 13. جولة المستخدمين (باستخدام المعرفات)
  // ================================================================
  createUsersTour() {
    return [
      {
        element: '.bg-white.p-6.rounded-xl.shadow.mb-8',
        popover: {
          title: '👤 إضافة مستخدم جديد',
          description: 'أدخل بيانات الموظف الجديد (الاسم، البريد، كلمة المرور، الراتب، الدور، والفرع).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[placeholder="اسم الموظف"]',
        popover: {
          title: '📛 اسم الموظف',
          description: 'الاسم الكامل للموظف.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[type="email"][placeholder="البريد الإلكتروني"]',
        popover: {
          title: '✉️ البريد الإلكتروني',
          description: 'البريد الإلكتروني الذي سيستخدمه الموظف لتسجيل الدخول.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[type="password"][placeholder="كلمة المرور"]',
        popover: {
          title: '🔑 كلمة المرور',
          description: 'كلمة مرور قوية لحساب الموظف.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[placeholder="الراتب الأساسي"]',
        popover: {
          title: '💰 الراتب الأساسي',
          description: 'الراتب الشهري الأساسي للموظف.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'select:has(option[value="cashier"])',
        popover: {
          title: '👔 الدور',
          description: 'حدد صلاحيات الموظف: مدير (صلاحية كاملة) أو صيدلي (صلاحيات محدودة).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'select:has(option[value=""])',
        popover: {
          title: '🏢 الفرع',
          description: 'اختر الفرع الذي سيعمل فيه الموظف.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-emerald-600.hover\\:bg-emerald-700',
        popover: {
          title: '💾 حفظ المستخدم',
          description: 'احفظ المستخدم ليتمكن من الدخول إلى النظام.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '.bg-white.rounded-2xl.shadow-sm.border:last-of-type',
        popover: {
          title: '📋 قائمة المستخدمين',
          description: 'جميع المستخدمين المسجلين، ويمكنك تعديل أو حذف أي منهم.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-amber-50.hover\\:bg-amber-100',
        popover: {
          title: '✏️ تعديل المستخدم',
          description: 'تعديل بيانات الموظف (الاسم، البريد، الراتب، الدور، الفرع) ويمكنك تغيير كلمة المرور اختيارياً.',
          side: 'bottom',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // 14. جولة محرك الأسعار (باستخدام المعرفات)
  // ================================================================
  createPricingTour() {
    return [
      {
        element: '.flex.items-center.justify-between',
        popover: {
          title: '⚙️ محرك الأسعار',
          description: 'إدارة قواعد التسعير ومحاكاة الأسعار.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-white.rounded-xl.shadow.p-6:first-of-type',
        popover: {
          title: '📝 إضافة قاعدة تسعير جديدة',
          description: 'أدخل اسم القاعدة، النوع (نسبة، مبلغ ثابت، ضرب)، القيمة، والترتيب. يمكنك أيضاً تفعيل التقريب وتعيينها كقاعدة افتراضية.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'select:has(option[value="percentage"])',
        popover: {
          title: '📊 نوع القاعدة',
          description: 'اختر نوع القاعدة: نسبة مئوية، مبلغ ثابت، أو عملية ضرب.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'input[type="number"]:nth-of-type(1)',
        popover: {
          title: '🔢 القيمة',
          description: 'أدخل القيمة الرقمية للقاعدة (مثال: 40 لنسبة 40%، أو 5 لمبلغ ثابت 5).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.grid.grid-cols-4.gap-4.mt-4',
        popover: {
          title: '🔄 التقريب (Rounding)',
          description: 'حدد سياسة التقريب (بدون، أقرب، لأعلى، لأسفل) ووحدة التقريب (مثل 1، 5، 10).',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-blue-600.hover\\:bg-blue-700',
        popover: {
          title: '💾 حفظ القاعدة',
          description: 'احفظ القاعدة لتظهر في جدول القواعد ويمكن تطبيقها على الأدوية.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '.bg-white.rounded-xl.shadow.overflow-hidden',
        popover: {
          title: '📋 جدول قواعد التسعير',
          description: 'يعرض جميع القواعد مع إمكانية البحث، التعديل، التفعيل/الإيقاف، والحذف.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.bg-white.rounded-xl.shadow.p-6:last-of-type',
        popover: {
          title: '🧪 محاكاة السعر',
          description: 'ابحث عن دواء، أدخل سعر الشراء، ثم اضغط "تشغيل" لمعرفة سعر البيع المقترح حسب القواعد المطبقة.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.relative input[type="text"]',
        popover: {
          title: '🔍 البحث عن دواء',
          description: 'ابحث عن الدواء الذي تريد محاكاة سعره.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#simulate-btn',
        popover: {
          title: '⚡ تشغيل المحاكاة',
          description: 'اضغط هنا لحساب سعر البيع المقترح بناءً على قاعدة التسعير الخاصة بالدواء.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#simulation-results',
        popover: {
          title: '📊 نتائج المحاكاة',
          description: 'ستظهر هنا تفاصيل السعر المحسوب: السعر قبل وبعد التقريب، والربح المتوقع ونسبته.',
          side: 'bottom',
          align: 'start'
        }
      }
    ];
  }

  // ================================================================
  // دالة مساعدة للحصول على خطوات الجولة حسب الاسم
  // ================================================================
  getTourSteps(tourName) {
    switch (tourName) {
      case 'main': return this.createMainTour();
      case 'medicine': return this.createMedicineTour();
      case 'purchases': return this.createPurchaseTour();
      case 'inventory': return this.createInventoryTour();
      case 'analytics': return this.createAnalyticsTour();
      case 'branches': return this.createBranchesTour();
      case 'categories': return this.createCategoriesTour();
      case 'debts': return this.createDebtsTour();
      case 'expenses': return this.createExpensesTour();
      case 'salaries': return this.createSalariesTour();
      case 'shifts': return this.createShiftsTour();
      case 'suppliers': return this.createSuppliersTour();
      case 'users': return this.createUsersTour();
      case 'pricing': return this.createPricingTour();
      default: return this.createMainTour();
    }
  }

  // ===== بدء جولة مع تمرير الاسم فقط =====
  startTourByName(tourName) {
    const steps = this.getTourSteps(tourName);
    this.startTour(tourName, steps);
  }
}

export default new TourManager();
