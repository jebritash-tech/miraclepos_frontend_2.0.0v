<!-- modules/faq/faq.vue -->
<template>
  <div class="faq-page" dir="rtl">

    <!-- ============================================================
         Header
         ============================================================ -->
    <div class="faq-header">
      <div class="header-icon">
        <i class="fas fa-question-circle"></i>
      </div>
      <div class="header-text">
        <h1>الأسئلة الشائعة</h1>
        <p>دليل شامل لكل ما قد تحتاج معرفته عن نظام MiraclePOS</p>
      </div>
    </div>

    <!-- ============================================================
         Search + Stats
         ============================================================ -->
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ابحث عن سؤال... (مثال: وردية، تسعير، إرجاع، PIN)"
          class="search-input"
        >
        <button v-if="searchQuery" @click="searchQuery = ''" class="search-clear">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="search-stats">
        <span class="stat-badge">
          <strong>{{ filteredFaqs.length }}</strong> نتيجة
        </span>
      </div>
    </div>

    <!-- ============================================================
         Category tabs
         ============================================================ -->
    <div class="categories-bar">
      <button
        @click="activeCategory = 'all'"
        class="cat-btn"
        :class="{ active: activeCategory === 'all' }"
      >
        <i class="fas fa-th-large"></i>
        الكل
        <span class="cat-count">{{ totalFaqs }}</span>
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="activeCategory = cat.id"
        class="cat-btn"
        :class="{ active: activeCategory === cat.id }"
        :style="activeCategory === cat.id ? { '--cat-color': cat.color } : {}"
      >
        <i :class="cat.icon"></i>
        {{ cat.label }}
        <span class="cat-count">{{ countByCategory(cat.id) }}</span>
      </button>
    </div>

    <!-- ============================================================
         FAQ List
         ============================================================ -->
    <div v-if="filteredFaqs.length === 0" class="empty-state">
      <i class="fas fa-search"></i>
      <h3>لا توجد نتائج</h3>
      <p>جرّب كلمات بحث مختلفة أو اختر تصنيفاً آخر</p>
    </div>

    <div v-else class="faq-list">
      <!-- Group by category if 'all' -->
      <template v-if="activeCategory === 'all'">
        <div
          v-for="cat in categoriesWithResults"
          :key="cat.id"
          class="faq-group"
        >
          <div class="group-header" :style="{ '--cat-color': cat.color }">
            <i :class="cat.icon"></i>
            <h2>{{ cat.label }}</h2>
            <span class="group-count">{{ cat.items.length }}</span>
          </div>

          <div class="group-items">
            <FaqItem
              v-for="item in cat.items"
              :key="item.id"
              :item="item"
              :is-open="openItem === item.id"
              @toggle="toggleItem(item.id)"
            />
          </div>
        </div>
      </template>

      <!-- Flat list when specific category selected -->
      <template v-else>
        <FaqItem
          v-for="item in filteredFaqs"
          :key="item.id"
          :item="item"
          :is-open="openItem === item.id"
          @toggle="toggleItem(item.id)"
        />
      </template>
    </div>

    <!-- ============================================================
         Footer note
         ============================================================ -->
    <div class="footer-note">
      <i class="fas fa-info-circle"></i>
      <div>
        <strong>لم تجد ما تبحث عنه؟</strong>
        <p>
          إذا واجهت مشكلة لم تُذكر هنا، تواصل مع الدعم الفني مع ذكر:
          <span class="chips">
            <span class="chip">رقم الفاتورة</span>
            <span class="chip">رقم الوردية</span>
            <span class="chip">نص رسالة الخطأ</span>
            <span class="chip">وقت المشكلة</span>
          </span>
        </p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, defineComponent, h } from 'vue';

/* ============================================================
   Local Component: FaqItem (Accordion)
   ============================================================ */
const FaqItem = defineComponent({
  name: 'FaqItem',
  props: {
    item:    { type: Object, required: true },
    isOpen:  { type: Boolean, default: false },
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    return () => h('div', {
      class: ['faq-item', { open: props.isOpen }],
    }, [
      h('button', {
        class: 'faq-question',
        onClick: () => emit('toggle'),
        type: 'button',
      }, [
        h('span', { class: 'q-icon' }, [
          h('i', { class: 'fas fa-question' }),
        ]),
        h('span', { class: 'q-text', innerHTML: props.item.question }),
        h('span', { class: 'q-toggle' }, [
          h('i', { class: props.isOpen ? 'fas fa-chevron-up' : 'fas fa-chevron-down' }),
        ]),
      ]),

      props.isOpen
        ? h('div', { class: 'faq-answer' }, [
            h('div', { class: 'a-content', innerHTML: props.item.answer }),
            props.item.tags?.length
              ? h('div', { class: 'a-tags' },
                  props.item.tags.map(t => h('span', { class: 'a-tag' }, [
                    h('i', { class: 'fas fa-tag' }),
                    ' ' + t,
                  ]))
                )
              : null,
          ])
        : null,
    ]);
  },
});

/* ============================================================
   Categories
   ============================================================ */
const categories = [
  { id: 'getting-started', label: 'البدء السريع',    icon: 'fas fa-rocket',          color: '#3b82f6' },
  { id: 'auth',            label: 'الدخول والأمان',  icon: 'fas fa-shield-alt',       color: '#8b5cf6' },
  { id: 'shifts',          label: 'الورديات',         icon: 'fas fa-cash-register',   color: '#059669' },
  { id: 'pos',             label: 'نقطة البيع',       icon: 'fas fa-shopping-cart',   color: '#0ea5e9' },
  { id: 'sales',           label: 'المبيعات',         icon: 'fas fa-receipt',         color: '#10b981' },
  { id: 'refunds',         label: 'الإرجاعات',        icon: 'fas fa-undo',            color: '#ef4444' },
  { id: 'inventory',       label: 'المخزون',          icon: 'fas fa-boxes',           color: '#f59e0b' },
  { id: 'pricing',         label: 'التسعير',          icon: 'fas fa-tags',            color: '#a855f7' },
  { id: 'purchases',       label: 'المشتريات',        icon: 'fas fa-truck',           color: '#06b6d4' },
  { id: 'expenses',        label: 'المصروفات',        icon: 'fas fa-money-bill',      color: '#f97316' },
  { id: 'debts',           label: 'الديون',           icon: 'fas fa-hand-holding-usd', color: '#dc2626' },
  { id: 'offline',         label: 'بدون إنترنت',      icon: 'fas fa-wifi-slash',      color: '#64748b' },
  { id: 'reports',         label: 'التقارير',         icon: 'fas fa-chart-line',      color: '#0891b2' },
  { id: 'backup',          label: 'النسخ الاحتياطي',  icon: 'fas fa-database',        color: '#4f46e5' },
  { id: 'troubleshooting', label: 'حل المشاكل',       icon: 'fas fa-tools',           color: '#db2777' },
];

/* ============================================================
   FAQ Data
   ============================================================ */
const faqs = [
  /* ============================================================
     GETTING STARTED
     ============================================================ */
  {
    id: 'gs-what',
    cat: 'getting-started',
    question: 'ما هو MiraclePOS؟',
    answer: `MiraclePOS هو نظام متكامل لإدارة الصيدليات يعمل عبر المتصفح. يشمل:<br>
      • <strong>نقطة بيع (POS)</strong> سريعة تعمل حتى بدون إنترنت<br>
      • <strong>إدارة مخزون</strong> متعددة الفروع مع تتبع الدفعات والصلاحية<br>
      • <strong>محرك تسعير</strong> ذكي (نسب، مبالغ ثابتة، معامل ضرب)<br>
      • <strong>تقارير مالية</strong> شاملة قابلة للطباعة والتصدير<br>
      • <strong>نسخ احتياطي</strong> تلقائي يومي<br>
      • <strong>نظام PIN</strong> للعمليات الحساسة<br>
      • <strong>سجل تدقيق (Audit Log)</strong> لكل الحركات`,
    tags: ['نظرة عامة'],
  },
  {
    id: 'gs-requirements',
    cat: 'getting-started',
    question: 'ما المتطلبات التشغيلية للنظام؟',
    answer: `• <strong>للسيرفر:</strong> PHP 8.2+، MySQL 8+ أو PostgreSQL 14+، Composer، PHP extensions (zip، mbstring، pdo).<br>
      • <strong>للمتصفح:</strong> Chrome / Edge / Firefox حديث. يُفضّل تثبيت التطبيق كـ PWA للعمل بدون إنترنت.<br>
      • <strong>للطباعة:</strong> طابعة حرارية 80mm أو 58mm.<br>
      • <strong>للجهاز:</strong> ذاكرة 2GB+ وشاشة 1024×768 على الأقل.`,
    tags: ['المتطلبات'],
  },
  {
    id: 'gs-users',
    cat: 'getting-started',
    question: 'ما الفرق بين حساب المدير (Admin) وحساب الكاشير (Cashier)؟',
    answer: `<strong>المدير (Admin):</strong> يصل لكل شيء — إدارة الأدوية، المشتريات، التقارير، الإعدادات، الرواتب، المستخدمين، إلخ.<br><br>
      <strong>الكاشير (Cashier):</strong> يصل لـ:<br>
      • فتح وإغلاق الورديات<br>
      • نقطة البيع (بيع، إرجاع)<br>
      • المصروفات والسحوبات وسداد الديون<br>
      • عرض آخر الفواتير<br>
      <em>لا يمكنه:</em> تعديل الأسعار، إدارة الأدوية، عرض التقارير المالية، إدارة المستخدمين.`,
    tags: ['الصلاحيات'],
  },
  {
    id: 'gs-default-users',
    cat: 'getting-started',
    question: 'ما بيانات الدخول الافتراضية؟',
    answer: `في نسخة التطوير (بعد <code>migrate:fresh</code>):<br>
      • <strong>مدير:</strong> <code>admin@pharmacy.test</code><br>
      • <strong>كاشير:</strong> <code>cashier@pharmacy.test</code><br>
      <em>يجب تغيير كلمات المرور بعد أول تسجيل دخول في الإنتاج.</em>`,
    tags: ['دخول'],
  },

  /* ============================================================
     AUTHENTICATION
     ============================================================ */
  {
    id: 'auth-login',
    cat: 'auth',
    question: 'كيف أسجل الدخول؟',
    answer: `1. افتح رابط النظام<br>
      2. أدخل البريد الإلكتروني وكلمة المرور<br>
      3. اضغط "دخول"<br><br>
      عند أول دخول، يُخزَّن حسابك محلياً ليتمكن من الدخول Offline لاحقاً بدون إنترنت.`,
    tags: ['دخول'],
  },
  {
    id: 'auth-offline',
    cat: 'auth',
    question: 'هل يمكنني الدخول بدون إنترنت؟',
    answer: `نعم، بشرط:<br>
      • أنك سجّلت الدخول مرة واحدة <strong>بإنترنت</strong> سابقاً<br>
      • نفس الجهاز ونفس المتصفح<br>
      • نفس البريد وكلمة المرور<br><br>
      النظام يتحقق محلياً من كلمة المرور (hash) ويعمل بكامل طاقته Offline.`,
    tags: ['Offline'],
  },
  {
    id: 'auth-forgot',
    cat: 'auth',
    question: 'نسيت كلمة المرور، ماذا أفعل؟',
    answer: `1. في صفحة الدخول، اضغط "نسيت كلمة المرور؟"<br>
      2. أدخل بريدك الإلكتروني<br>
      3. سيصلك رابط لإعادة التعيين<br>
      4. اضغط الرابط وأدخل كلمة مرور جديدة<br><br>
      ⚠️ لو لم يصل البريد، تحقق من:<br>
      • إعدادات البريد في <code>.env</code><br>
      • مجلد Spam<br>
      • تواصل مع المدير لإعادة التعيين يدوياً.`,
    tags: ['استعادة'],
  },
  {
    id: 'auth-pin-what',
    cat: 'auth',
    question: 'ما هو نظام PIN؟ وكيف أفعّله؟',
    answer: `<strong>PIN</strong> = رمز من 4 أرقام يُطلب قبل العمليات الحساسة (سحب نقدي، إضافة مصروف، سداد دين، فتح/إغلاق وردية).<br><br>
      <strong>التفعيل (من قِبل المدير):</strong><br>
      1. الإعدادات ← PIN<br>
      2. فعّل "تفعيل نظام PIN"<br>
      3. اختر العمليات المحمية<br>
      4. كل مستخدم يضع PIN خاص به من: الإعدادات ← المستخدمون.`,
    tags: ['PIN', 'أمان'],
  },
  {
    id: 'auth-pin-lockout',
    cat: 'auth',
    question: 'أدخلت PIN خطأً عدة مرات والحساب مقفل، ما الحل؟',
    answer: `بعد <strong>5 محاولات فاشلة</strong> (افتراضياً)، يُقفل الحساب لمدة <strong>5 دقائق</strong>.<br><br>
      <strong>الحل:</strong><br>
      • انتظر 5 دقائق ثم حاول مرة أخرى<br>
      • أو تواصل مع المدير لمسح العداد يدوياً (من السجلات)<br><br>
      ⚠️ كل محاولة فاشلة تُسجَّل في <strong>Audit Log</strong> كنوع تحذيري.`,
    tags: ['PIN', 'أمان'],
  },

  /* ============================================================
     SHIFTS
     ============================================================ */
  {
    id: 'sh-open',
    cat: 'shifts',
    question: 'كيف أفتح وردية جديدة؟',
    answer: `1. سجّل الدخول<br>
      2. سيتم توجيهك لصفحة "فتح الوردية" تلقائياً<br>
      3. أدخل <strong>الرصيد الافتتاحي</strong> (المبلغ الموجود فعلاً في الدرج)<br>
      4. اضغط "فتح الوردية والانتقال للبيع"<br><br>
      ✅ بعد الفتح، يتحول تلقائياً إلى شاشة نقطة البيع.`,
    tags: ['وردية'],
  },
  {
    id: 'sh-close',
    cat: 'shifts',
    question: 'كيف أغلق الوردية؟',
    answer: `1. في POS، اضغط "مالية" (الزر الأصفر)<br>
      2. اختر "إنهاء الوردية"<br>
      3. راجع "الرصيد المحاسبي" (المحسوب تلقائياً)<br>
      4. اعدّ النقود في الدرج، وأدخل المبلغ الفعلي<br>
      5. سيعرض الفرق: مطابق / عجز / زيادة<br>
      6. اضغط "إنهاء الوردية"<br><br>
      ✅ يُطبع تقرير الإغلاق تلقائياً، ثم تُسجَّل خروج.`,
    tags: ['وردية'],
  },
  {
    id: 'sh-calc',
    cat: 'shifts',
    question: 'ما معادلة "الرصيد المحاسبي"؟',
    answer: `<code>الرصيد المحاسبي = الرصيد الافتتاحي + المبيعات النقدية + سداد الديون − السحوبات − المصروفات − المرتجعات</code><br><br>
      • <strong>سداد الديون</strong>: يُضاف لأن النقد دخل الدرج فعلاً.<br>
      • <strong>المرتجعات</strong>: تُخصم لأن النقد خرج للعميل.<br>
      • <strong>المبيعات البنكية</strong>: لا تظهر في الدرج.`,
    tags: ['وردية', 'محاسبة'],
  },
  {
    id: 'sh-offline-open',
    cat: 'shifts',
    question: 'فتحت وردية بدون إنترنت — ماذا يحدث؟',
    answer: `عند فتح وردية وأنت Offline:<br>
      1. يُنشأ معرّف محلي: <code>offline-XXXXXXXX</code><br>
      2. تُخزَّن محلياً في المتصفح<br>
      3. تعمل بكامل طاقتها<br>
      4. عند عودة الإنترنت، تُرسَل للخادم تلقائياً ويُستبدل المعرّف المحلي بمعرّف السيرفر<br><br>
      ⚠️ لا تمسح بيانات المتصفح وأنت Offline — ستفقد الوردية.`,
    tags: ['وردية', 'Offline'],
  },
  {
    id: 'sh-multi-offline',
    cat: 'shifts',
    question: 'فتحت ورديتين بدون إنترنت — كيف تُزامَن؟',
    answer: `النظام يُزامن بالترتيب الصحيح:<br>
      1. مزامنة فتح الوردية الأولى<br>
      2. مزامنة عملياتها المالية (فواتير، مصروفات، إلخ)<br>
      3. مزامنة إغلاقها<br>
      4. ثم ينتقل للوردية الثانية بنفس الترتيب<br><br>
      ✅ لا تُدخل أي عملية بين الورديتين — الترتيب مضمون.`,
    tags: ['وردية', 'Offline', 'مزامنة'],
  },
  {
    id: 'sh-sync-fail',
    cat: 'shifts',
    question: 'ظهرت رسالة "فشلت بعض العمليات في المزامنة" — ماذا أفعل؟',
    answer: `1. راجع قائمة العمليات الفاشلة الظاهرة<br>
      2. اقرأ <strong>سبب الفشل</strong> لكل عملية<br>
      3. الحلول الشائعة:<br>
      • <strong>"الكمية غير كافية"</strong>: ألغِ العملية وأعد البيع بكمية أقل<br>
      • <strong>"الوردية مغلقة"</strong>: تواصل مع المدير<br>
      • <strong>"PIN خطأ"</strong>: أعد المحاولة من POS<br>
      4. لجذف العمليات الفاشلة: اضغط "حذف كل العمليات الفاشلة"<br><br>
      ✅ زر الفتح يُعطَّل أثناء المزامنة، مع شريط تقدم.`,
    tags: ['مزامنة', 'مشاكل'],
  },

  /* ============================================================
     POS
     ============================================================ */
  {
    id: 'pos-search',
    cat: 'pos',
    question: 'كيف أبحث عن دواء؟',
    answer: `طرق البحث:<br>
      • <strong>بالاسم:</strong> اكتب أول حروف اسم الدواء<br>
      • <strong>بالباركود:</strong> مرّر الماسح الضوئي أو اكتب الرقم<br>
      • <strong>بالاسم العلمي:</strong> مثال: "Paracetamol"<br><br>
      تظهر النتائج مع الأسعار المتاحة، واضغط على السعر لإضافته للسلة.`,
    tags: ['POS'],
  },
  {
    id: 'pos-multi-price',
    cat: 'pos',
    question: 'ظهرت نافذة "هذا الدواء له أسعار متعددة" — ما معنى ذلك؟',
    answer: `معنى ذلك أن لديك <strong>دفعات متعددة</strong> من نفس الدواء بأسعار بيع مختلفة (بسبب شرائها بأسعار شراء مختلفة).<br><br>
      <strong>الحل:</strong><br>
      • اختر الدفعة الصحيحة يدوياً<br>
      • أو اضغط "الأقدم صلاحية (FIFO)" لاختيار الأقرب انتهاءً<br><br>
      <strong>لمنع التكرار:</strong> توحّد سياسة التسعير أو عدّل أسعار الدفعات من لوحة المدير.`,
    tags: ['POS', 'تسعير'],
  },
  {
    id: 'pos-stock-error',
    cat: 'pos',
    question: 'ظهر "⚠️ الكمية غير كافية" — ما معنى ذلك؟',
    answer: `رسالة تفصيلية تُظهر:<br>
      • <strong>المتاح</strong> (المخزون الفعلي)<br>
      • <strong>المطلوب</strong> (ما تحاول بيعه)<br>
      • <strong>النقص</strong> (الفرق)<br><br>
      <strong>الحل:</strong><br>
      • قلّل الكمية<br>
      • أو تحقق من المخزون في صفحة المخزون<br>
      • إن كان المخزون خاطئاً، عدّله من لوحة المدير.`,
    tags: ['POS', 'مخزون'],
  },
  {
    id: 'pos-payment',
    cat: 'pos',
    question: 'كيف أختار طريقة الدفع (نقدي/بنكي)؟',
    answer: `في أسفل السلة:<br>
      • <strong>نقدي</strong>: لا يحتاج بيانات إضافية<br>
      • <strong>بنكي</strong>: تُفتح نافذة لإدخال:<br>
        - اسم البنك<br>
        - رقم التحويل<br>
        - تاريخ التحويل<br>
        - ملاحظات<br><br>
      ✅ البنكي لا يؤثر على "الرصيد المحاسبي" للدرج.`,
    tags: ['POS', 'دفع'],
  },
  {
    id: 'pos-fefo',
    cat: 'pos',
    question: 'ما هو FEFO؟',
    answer: `<strong>FEFO</strong> = First Expiry, First Out — الأقرب انتهاءً أولاً.<br><br>
      عند وجود عدة دفعات لنفس الدواء، يُفضّل بيع الأقرب لتاريخ الانتهاء أولاً لتقليل الخسائر.<br><br>
      ✅ في POS، زر "الأقدم صلاحية" يطبّق FEFO تلقائياً.`,
    tags: ['POS', 'مخزون'],
  },

  /* ============================================================
     SALES
     ============================================================ */
  {
    id: 'sales-print',
    cat: 'sales',
    question: 'كيف أطبع فاتورة؟',
    answer: `• <strong>تلقائياً:</strong> بعد إتمام البيع، تُطبع الفاتورة إذا كان الإعداد مفعّلاً<br>
      • <strong>يدوياً:</strong> من "آخر المبيعات" → تفاصيل الفاتورة → زر "إعادة طباعة"<br><br>
      <strong>الإعدادات:</strong> الإعدادات ← الطباعة (تفعيل، عرض الورق 80mm أو 58mm).`,
    tags: ['مبيعات', 'طباعة'],
  },
  {
    id: 'sales-reprint',
    cat: 'sales',
    question: 'هل يمكنني إعادة طباعة فاتورة قديمة؟',
    answer: `نعم:<br>
      1. من العمود الأيسر في POS، اختر الفاتورة من "آخر المبيعات"<br>
      2. اضغط "تفاصيل"<br>
      3. اضغط زر "إعادة طباعة الفاتورة"<br><br>
      ⚠️ يجب أن يكون خيار "السماح بإعادة الطباعة" مفعّلاً في الإعدادات.`,
    tags: ['مبيعات', 'طباعة'],
  },
  {
    id: 'sales-detail',
    cat: 'sales',
    question: 'كيف أرى تفاصيل فاتورة سابقة؟',
    answer: `من POS، اضغط على أي فاتورة في "آخر المبيعات" لعرض:<br>
      • الأصناف والكميات<br>
      • الأسعار<br>
      • طريقة الدفع<br>
      • المبلغ المُرجَع (إن وُجد)<br>
      • المبلغ المتبقي القابل للإرجاع لكل صنف`,
    tags: ['مبيعات'],
  },

  /* ============================================================
     REFUNDS
     ============================================================ */
  {
    id: 'refunds-partial',
    cat: 'refunds',
    question: 'كيف أُرجع جزءاً من فاتورة؟',
    answer: `1. من "آخر المبيعات"، اضغط على الفاتورة<br>
      2. اضغط "تفاصيل / إرجاع"<br>
      3. في الجدول، حدّد الكمية المرتجعة لكل صنف<br>
      4. اضغط "إرجاع" بجانب الصنف<br>
      5. تأكيد → يُسجَّل الإرجاع<br><br>
      ✅ يمكن إرجاع أكثر من صنف في نفس الفاتورة بعمليات متتالية.`,
    tags: ['إرجاع'],
  },
  {
    id: 'refunds-full',
    cat: 'refunds',
    question: 'كيف أُرجع فاتورة كاملة؟',
    answer: `1. افتح تفاصيل الفاتورة<br>
      2. في كل صنف، أدخل الكمية الكاملة المرتجعة<br>
      3. اضغط "إرجاع" لكل صنف على حدة<br><br>
      💡 يُفضّل إرجاع الأصناف بالترتيب — بعد إرجاع صنف، يتحدث الحد الأقصى تلقائياً.`,
    tags: ['إرجاع'],
  },
  {
    id: 'refunds-already',
    cat: 'refunds',
    question: 'ظهر "تم إرجاع هذا الصنف بالكامل مسبقاً" — ماذا يعني؟',
    answer: `هذا الصنف تم إرجاعه بالكامل بالفعل، أو أنك تحاول إرجاع كمية أكبر من المتاح.<br><br>
      <strong>تحقق من:</strong><br>
      • عمود "الحد الأقصى" لكل صنف (الكمية المتبقية القابلة للإرجاع)<br>
      • "المبلغ المتبقي" في أعلى الفاتورة<br><br>
      إن كان الرقم غير متوقع، راجع Audit Log.`,
    tags: ['إرجاع', 'مشاكل'],
  },
  {
    id: 'refunds-closed-shift',
    cat: 'refunds',
    question: 'هل يمكن إرجاع فاتورة من وردية مغلقة؟',
    answer: `نعم! النظام يدعم هذا.<br><br>
      عند الإرجاع من وردية مغلقة:<br>
      • يُحدَّث الرصيد المحاسبي للوردية المغلقة تلقائياً<br>
      • يُسجَّل الإرجاع في Audit Log<br>
      • يؤثر على تقارير تلك الفترة<br><br>
      هذا مفيد عند مزامنة إرجاعات متأخرة بعد إغلاق الوردية.`,
    tags: ['إرجاع', 'وردية'],
  },

  /* ============================================================
     INVENTORY
     ============================================================ */
  {
    id: 'inv-add-med',
    cat: 'inventory',
    question: 'كيف أضيف دواء جديداً؟',
    answer: `1. الإدارة ← كتالوج الأدوية<br>
      2. املأ الاسم والتصنيف ونوع الدواء (محلي/مستورد)<br>
      3. أضف الوحدات (علبة، شريط، حبة) مع المعاملات<br>
      4. حدّد الوحدة الأساسية (عادية القطعة)<br>
      5. احفظ<br><br>
      ⚠️ لا يمكن إدخال كمية أو سعر هنا — ذلك يتم عند <strong>الشراء</strong>.`,
    tags: ['مخزون'],
  },
  {
    id: 'inv-units',
    cat: 'inventory',
    question: 'ما معنى "معامل" الوحدة؟',
    answer: `المعامل = عدد القطع في هذه الوحدة.<br><br>
      مثال:<br>
      • قطعة: <code>factor=1</code> (الوحدة الأساسية)<br>
      • شريط: <code>factor=10</code> (10 قطع)<br>
      • علبة: <code>factor=20</code> (20 قطعة)`,
    tags: ['مخزون', 'وحدات'],
  },
  {
    id: 'inv-batches',
    cat: 'inventory',
    question: 'ما هي "الدفعة" (Batch)؟',
    answer: `الدفعة = كمية من الدواء استُلمت في عملية شراء واحدة، لها:<br>
      • رقم الدفعة (Batch Number)<br>
      • تاريخ الصلاحية<br>
      • سعر الشراء<br>
      • الكمية المتبقية<br><br>
      ✅ تتبع الدفعات يسمح بـ FEFO ومعرفة الربح الفعلي لكل دفعة.`,
    tags: ['مخزون'],
  },
  {
    id: 'inv-low-stock',
    cat: 'inventory',
    question: 'كيف أعرف الأدوية منخفضة المخزون؟',
    answer: `• في لوحة المدير: بطاقة "منخفض المخزون" + تنبيهات<br>
      • في صفحة المخزون: فلتر "منخفض"<br>
      • يُحسب: الكمية ≤ الحد الأدنى (minimum_quantity)<br><br>
      يمكن ضبط الحد الأدنى لكل دواء.`,
    tags: ['مخزون', 'تقارير'],
  },
  {
    id: 'inv-expiry',
    cat: 'inventory',
    question: 'كيف أتعرف على الأدوية قريبة الانتهاء؟',
    answer: `• في لوحة المدير: تنبيهات "قرب الانتهاء" (خلال 60 يوماً)<br>
      • في POS: عند إضافة الدواء، الدفعة الأقرب انتهاءً تُعلَّم باللون الأحمر<br>
      • الدفعات منتهية الصلاحية تظهر بشكل خاص.`,
    tags: ['مخزون', 'صلاحية'],
  },
  {
    id: 'inv-delete-batch',
    cat: 'inventory',
    question: 'لماذا لا يمكنني حذف دفعة؟',
    answer: `لا يمكن حذف دفعة إذا:<br>
      • <strong>تم البيع منها</strong> — حذفها سيُفسد التقارير<br>
      • <strong>تم إرجاع إليها</strong> — نفس السبب<br><br>
      <strong>البديل:</strong><br>
      • عدّل الكمية يدوياً<br>
      • أو استخدم "تنظيف المخزون" (يُمنع إذا كانت مرتبطة بمبيعات)<br><br>
      ✅ النظام يعرض سبب المنع بوضوح.`,
    tags: ['مخزون', 'مشاكل'],
  },

  /* ============================================================
     PRICING
     ============================================================ */
  {
    id: 'pricing-rules',
    cat: 'pricing',
    question: 'كيف يعمل محرك التسعير؟',
    answer: `يُحسب سعر البيع تلقائياً من سعر الشراء + قاعدة تسعير.<br><br>
      <strong>أنواع القواعد:</strong><br>
      • <code>percentage</code>: نسبة (مثال: 40%)<br>
      • <code>fixed</code>: مبلغ ثابت (مثال: +100)<br>
      • <code>multiply</code>: معامل (مثال: ×2.5)<br><br>
      <strong>التطبيق الهرمي (الأولوية):</strong><br>
      1. قاعدة خاصة بالدفعة<br>
      2. markup مخصص للدفعة<br>
      3. قاعدة خاصة بالدواء<br>
      4. القاعدة الافتراضية العامة`,
    tags: ['تسعير'],
  },
  {
    id: 'pricing-rounding',
    cat: 'pricing',
    question: 'ما معنى "التقريب" (Rounding)؟',
    answer: `التقريب يضبط سعر البيع النهائي لأقرب مضاعف:<br><br>
      • <code>none</code>: بدون تقريب<br>
      • <code>up</code>: لأعلى (مثال: 345 → 400 إذا unit=100)<br>
      • <code>down</code>: لأدنى (مثال: 345 → 300)<br>
      • <code>nearest</code>: الأقرب (مثال: 345 → 300، 355 → 400)<br><br>
      <strong>unit</strong> = مضاعف التقريب (100، 50، 5، ...).`,
    tags: ['تسعير'],
  },
  {
    id: 'pricing-lock',
    cat: 'pricing',
    question: 'كيف أقفل سعر دفعة معينة؟',
    answer: `1. كتالوج الأدوية ← افتح الدواء ← قسم التسعير<br>
      2. بجانب الدفعة، اضغط 🔒<br>
      3. أدخل السعر الجديد + <strong>سبباً إلزامياً</strong><br>
      4. احفظ<br><br>
      ✅ السعر المقفل <strong>لا يُغيَّر</strong> عند إعادة الحساب الشامل.<br>
      ✅ لفتح القفل: اضغط 🔓.`,
    tags: ['تسعير'],
  },
  {
    id: 'pricing-diff',
    cat: 'pricing',
    question: 'لماذا يختلف سعر البيع عن النسبة المتوقعة؟',
    answer: `السبب الأغلب: <strong>التقريب</strong>.<br><br>
      مثال: سعر الشراء = 250، القاعدة 40%، التقريب up 100:<br>
      <code>250 × 1.4 = 350 → يُقرَّب لأعلى = 400</code><br>
      النسبة الفعلية = 60% وليس 40%!<br><br>
      ✅ هذا سلوك طبيعي في الأسعار الصغيرة.<br>
      <strong>الحل:</strong> قلّل وحدة التقريب أو ألغِه.`,
    tags: ['تسعير'],
  },
  {
    id: 'pricing-bulk',
    cat: 'pricing',
    question: 'كيف أعيد حساب كل الأسعار؟',
    answer: `1. لوحة المدير ← محرك التسعير<br>
      2. اضغط "إعادة حساب شاملة"<br>
      3. اختر الفلاتر (المستورد فقط، بها مخزون، تجاوز المقفل)<br>
      4. أدخل <strong>سبباً</strong><br>
      5. عاين النتائج قبل التنفيذ<br>
      6. اضغط "تنفيذ"<br><br>
      ⚠️ الأسعار المقفلة يدوياً <strong>لن تتغير</strong>.`,
    tags: ['تسعير'],
  },

  /* ============================================================
     PURCHASES
     ============================================================ */
  {
    id: 'purchases-create',
    cat: 'purchases',
    question: 'كيف أُدخل فاتورة شراء جديدة؟',
    answer: `1. الإدارة ← شراء مخزون<br>
      2. املأ: المورد، الفرع، رقم الفاتورة، التاريخ<br>
      3. لكل صنف: ابحث عن الدواء، اختر الوحدة، أدخل الكمية والسعر<br>
      4. أضف رقم الدفعة وتاريخ الصلاحية<br>
      5. كرّر لباقي الأصناف<br>
      6. راجع الإجمالي والصافي<br>
      7. احفظ<br><br>
      ✅ تُنشأ الدفعات تلقائياً، وتُحسب أسعار البيع تلقائياً.`,
    tags: ['مشتريات'],
  },
  {
    id: 'purchases-batch',
    cat: 'purchases',
    question: 'ما الذي يحدث عند حفظ فاتورة شراء؟',
    answer: `1. إنشاء سجل <code>Purchase</code><br>
      2. لكل صنف: إنشاء <code>PurchaseItem</code><br>
      3. لكل صنف: إنشاء <code>MedicineBatch</code> (دفعة جديدة)<br>
      4. تحديث المخزون (<code>inventories</code>)<br>
      5. توليد الأسعار (<code>medicine_prices</code>) حسب قاعدة التسعير<br>
      6. تسجيل الحركة في <code>inventory_movements</code><br>
      7. تسجيل العملية في Audit Log`,
    tags: ['مشتريات', 'مخزون'],
  },
  {
    id: 'purchases-delete',
    cat: 'purchases',
    question: 'لماذا لا يمكنني حذف فاتورة شراء؟',
    answer: `لأن دفعاتها <strong>تم البيع منها</strong> أو <strong>تم الإرجاع إليها</strong>.<br><br>
      <strong>البديل:</strong><br>
      • لا تحذف الفاتورة — احتفظ بها للسجل<br>
      • عدّل الكميات يدوياً إن كان هناك خطأ<br>
      • إن لم يتم البيع منها، يمكن الحذف بأمان.`,
    tags: ['مشتريات', 'مشاكل'],
  },

  /* ============================================================
     EXPENSES
     ============================================================ */
  {
    id: 'expenses-admin',
    cat: 'expenses',
    question: 'ما الفرق بين مصروف الأدمن ومصروف الوردية؟',
    answer: `<strong>مصروف الوردية (من POS):</strong><br>
      • مرتبط بور دية مفتوحة<br>
      • يُخصم من "الرصيد المحاسبي" للدرج<br>
      • يؤثر على تقارير الوردية<br><br>
      <strong>مصروف الأدمن (من لوحة التحكم):</strong><br>
      • <strong>غير مرتبط بأي وردية</strong> (<code>shift_id = null</code>)<br>
      • لا يؤثر على تقارير الورديات<br>
      • يظهر في التقارير المالية كبند منفصل`,
    tags: ['مصروفات'],
  },
  {
    id: 'expenses-add-admin',
    cat: 'expenses',
    question: 'كيف أضيف مصروفاً إدارياً؟',
    answer: `1. لوحة المدير ← المصروفات<br>
      2. اضغط "مصروف إداري جديد"<br>
      3. أدخل البيان والمبلغ والملاحظات<br>
      4. احفظ<br><br>
      ✅ لن يُسجَّل على أي وردية — سيبقى مستقلاً في التقارير.`,
    tags: ['مصروفات'],
  },
  {
    id: 'expenses-view',
    cat: 'expenses',
    question: 'كيف أفرز مصروفات الورديات والإدارية؟',
    answer: `في صفحة المصروفات، اضغط التبويبات:<br>
      • <strong>الكل</strong>: كل المصروفات<br>
      • <strong>الورديات</strong>: المرتبطة بور ديات فقط<br>
      • <strong>إدارية</strong>: غير المرتبطة بأي وردية<br><br>
      ✅ كل تبويب يُظهر الإجمالي والعدد الخاص به.`,
    tags: ['مصروفات'],
  },

  /* ============================================================
     DEBTS
     ============================================================ */
  {
    id: 'debts-what',
    cat: 'debts',
    question: 'ما أنواع الديون في النظام؟',
    answer: `ثلاثة أنواع:<br><br>
      <strong>1) دين مخصص (Admin):</strong> يُنشأ يدوياً من صفحة الديون<br>
      <strong>2) سحب من الدرج:</strong> يُنشأ تلقائياً عند "سحب نقدي" من POS<br>
      <strong>3) دين فاتورة:</strong> عند البيع الآجل (غير مفعّل حالياً)`,
    tags: ['ديون'],
  },
  {
    id: 'debts-withdrawal',
    cat: 'debts',
    question: 'لماذا عند كل "سحب نقدي" يُنشأ دين؟',
    answer: `لأن السحب من الدرج = دين على الموظف.<br><br>
      • المبلغ خرج من الدرج<br>
      • يجب أن يُسدَّد لاحقاً<br>
      • يظهر في صفحة الديون تلقائياً<br><br>
      ✅ عند السداد، يُوزَّع المبلغ تلقائياً (FIFO) على الديون المعلّقة.`,
    tags: ['ديون', 'وردية'],
  },
  {
    id: 'debts-payment',
    cat: 'debts',
    question: 'كيف أسدّد ديناً من POS؟',
    answer: `1. "مالية" ← "سداد دين"<br>
      2. سيعرض <strong>قائمة الديون المعلّقة</strong><br>
      3. اختر:<br>
      • <strong>توزيع تلقائي (FIFO)</strong>: يُسدَّد الأقدم أولاً<br>
      • <strong>دين محدد</strong>: اضغط على الدين<br>
      4. أدخل المبلغ<br>
      5. احفظ<br><br>
      ✅ النقد يدخل الدرج، ويُحدَّث الرصيد المحاسبي.`,
    tags: ['ديون'],
  },
  {
    id: 'debts-not-showing',
    cat: 'debts',
    question: 'سحبت مبلغاً لكنه لا يظهر في الديون — لماذا؟',
    answer: `هناك سببان محتملان:<br><br>
      <strong>1) كنت Offline:</strong> العملية في الطابور، لم تُزامَن بعد. افتح الصفحة وأنت Online لتتم المزامنة تلقائياً.<br><br>
      <strong>2) فشل المزامنة:</strong> راجع لوحة "العمليات الفاشلة" — قد يكون السبب:<br>
      • PIN خطأ<br>
      • الوردية مغلقة<br>
      • مشكلة شبكة`,
    tags: ['ديون', 'مشاكل'],
  },

  /* ============================================================
     OFFLINE
     ============================================================ */
  {
    id: 'offline-what',
    cat: 'offline',
    question: 'ما الذي يعمل Offline وما الذي لا يعمل؟',
    answer: `<strong>يعمل Offline:</strong><br>
      ✅ البيع (نقدي/بنكي)<br>
      ✅ الإرجاع<br>
      ✅ فتح وإغلاق وردية<br>
      ✅ المصروفات والسحوبات وسداد الديون<br>
      ✅ PIN<br><br>
      <strong>لا يعمل Offline:</strong><br>
      ❌ إضافة أدوية جديدة<br>
      ❌ تعديل أسعار<br>
      ❌ التقارير المالية (تحتاج سيرفر)<br>
      ❌ النسخ الاحتياطي`,
    tags: ['Offline'],
  },
  {
    id: 'offline-sync',
    cat: 'offline',
    question: 'متى تُزامَن العمليات Offline؟',
    answer: `تُزامَن تلقائياً في الحالات التالية:<br>
      • فور عودة الإنترنت<br>
      • عند فتح صفحة "فتح الوردية"<br>
      • عند فتح POS<br>
      • عند الضغط "مزامنة" يدوياً<br><br>
      ✅ شريط تقدم يوضّح العملية الجارية.`,
    tags: ['Offline', 'مزامنة'],
  },
  {
    id: 'offline-clear-cache',
    cat: 'offline',
    question: 'هل يمكنني مسح بيانات المتصفح؟',
    answer: `⚠️ <strong>لا</strong> إذا كنت Offline أو لديك عمليات معلّقة!<br><br>
      مسح بيانات المتصفح = فقدان:<br>
      • الورديات المفتوحة Offline<br>
      • العمليات غير المُزامَنة<br>
      • إعدادات PIN<br><br>
      <strong>البديل:</strong><br>
      • تأكد من المزامنة أولاً (لا يوجد عمليات في الطابور)<br>
      • ثم يمكنك مسح البيانات بأمان.`,
    tags: ['Offline', 'تحذير'],
  },

  /* ============================================================
     REPORTS
     ============================================================ */
  {
    id: 'reports-financial',
    cat: 'reports',
    question: 'كيف أفتح التقارير المالية؟',
    answer: `لوحة المدير ← التقارير المالية<br><br>
      يمكنك:<br>
      • اختيار الفترة (يومي/أسبوعي/شهري/سنوي/مخصص)<br>
      • اختيار الفرع (كل الفروع أو فرع محدد)<br>
      • عرض كل المؤشرات (مبيعات، أرباح، مصروفات، سحوبات، ...)<br>
      • طباعة أو تصدير Excel`,
    tags: ['تقارير'],
  },
  {
    id: 'reports-branch',
    cat: 'reports',
    question: 'كيف أُفلتر التقرير بفرع معين؟',
    answer: `في أعلى صفحة التقارير، اختر الفرع من قائمة "الفرع".<br><br>
      ✅ كل الأرقام (مبيعات، مصروفات، رواتب، سحوبات) ستُفلتر حسب الفرع.<br>
      ✅ اسم الفرع يظهر في:<br>
      • بطاقة "الفترة" أعلى التقرير<br>
      • الطباعة<br>
      • اسم ملف Excel المُصدَّر.`,
    tags: ['تقارير'],
  },
  {
    id: 'reports-payment-status',
    cat: 'reports',
    question: 'ما معنى "مسدّد / جزئي / غير مسدّد" في تقرير السحوبات؟',
    answer: `<strong>مسدّد</strong> (أخضر): تم سداد كل المبلغ<br>
      <strong>جزئي</strong> (أصفر): سُدِّد جزء، ويظهر <code>المدفوع / الإجمالي</code><br>
      <strong>غير مسدّد</strong> (أحمر): لم يُسدَّد بعد<br><br>
      ✅ يُحدَّث تلقائياً عند كل سداد جديد.`,
    tags: ['تقارير'],
  },
  {
    id: 'reports-export',
    cat: 'reports',
    question: 'كيف أصدّر تقريراً لـ Excel؟',
    answer: `في أسفل صفحة التقارير:<br>
      • <strong>طباعة</strong>: يفتح نافذة الطباعة<br>
      • <strong>تصدير Excel</strong>: يُنزّل ملف CSV يفتح في Excel<br><br>
      ✅ الملف يحتوي كل التفاصيل (رؤوس، مؤشرات، جداول).`,
    tags: ['تقارير'],
  },

  /* ============================================================
     BACKUP
     ============================================================ */
  {
    id: 'backup-auto',
    cat: 'backup',
    question: 'هل يوجد نسخ احتياطي تلقائي؟',
    answer: `نعم، النسخ الاحتياطي يُنشأ:<br>
      • <strong>تلقائياً</strong> كل يوم الساعة 23:59 (إذا كان الـ scheduler يعمل)<br>
      • <strong>يدوياً</strong> من صفحة النسخ الاحتياطي<br><br>
      ✅ يُحتفظ بآخر 30 يوماً، والأقدم يُحذف تلقائياً.`,
    tags: ['نسخ احتياطي'],
  },
  {
    id: 'backup-manual',
    cat: 'backup',
    question: 'كيف أُنشئ نسخة احتياطية الآن؟',
    answer: `1. الإعدادات ← النسخ الاحتياطي<br>
      2. اضغط "إنشاء نسخة الآن"<br>
      3. انتظر حتى تنتهي العملية<br>
      4. ستظهر النسخة في القائمة مع الحجم والتاريخ<br><br>
      <strong>التنزيل:</strong> اضغط ⬇ بجانب النسخة لحفظها على جهازك.`,
    tags: ['نسخ احتياطي'],
  },
  {
    id: 'backup-restore',
    cat: 'backup',
    question: 'كيف أستعيد نسخة احتياطية؟',
    answer: `⚠️ <strong>عملية خطيرة</strong> — تستبدل كل البيانات الحالية.<br><br>
      1. الإعدادات ← النسخ الاحتياطي<br>
      2. اضغط زر 🔄 (استعادة) بجانب النسخة<br>
      3. تأكيد أول + اكتب كلمة "استعادة"<br>
      4. سترى شاشة تحميل أثناء الاستعادة<br>
      5. ✅ يتم إنشاء نسخة أمان تلقائياً قبل الاستعادة<br><br>
      💡 إذا فشلت، يمكنك استعادة نسخة الأمان.`,
    tags: ['نسخ احتياطي'],
  },
  {
    id: 'backup-driver',
    cat: 'backup',
    question: 'هل يدعم النظام PostgreSQL و MySQL؟',
    answer: `نعم!<br>
      • <strong>MySQL 8+</strong>: يستخدم <code>mysqldump</code><br>
      • <strong>PostgreSQL 14+</strong>: يستخدم <code>pg_dump</code><br><br>
      النظام يكتشف نوع قاعدة البيانات تلقائياً من <code>.env</code>.<br><br>
      ⚠️ لا يمكن استعادة نسخة MySQL في PostgreSQL (والعكس). النظام يمنع ذلك.`,
    tags: ['نسخ احتياطي'],
  },

  /* ============================================================
     TROUBLESHOOTING
     ============================================================ */
  {
    id: 'ts-no-open-shift',
    cat: 'troubleshooting',
    question: 'ظهر "لا توجد وردية مفتوحة" — ماذا أفعل؟',
    answer: `<strong>الأسباب:</strong><br>
      1. لم تفتح وردية بعد ← افتح وردية جديدة<br>
      2. أغلقت الوردية وأنت Offline ← انتظر المزامنة<br>
      3. مشكلة في المزامنة ← راجع "العمليات الفاشلة"<br><br>
      <strong>الحل:</strong> اذهب إلى صفحة "فتح الوردية" وأعد الدخول.`,
    tags: ['مشاكل'],
  },
  {
    id: 'ts-sync-stuck',
    cat: 'troubleshooting',
    question: 'المزامنة عالقة ولا تنتهي — ماذا أفعل؟',
    answer: `1. <strong>لا تُغلق الصفحة</strong> — انتظر دقيقتين<br>
      2. إن استمرت المشكلة:<br>
      • تحقق من سرعة الإنترنت<br>
      • أعد تحميل الصفحة (ستُستأنف المزامنة تلقائياً)<br>
      • افتح Console (F12) — قد يكون هناك خطأ واضح<br>
      3. إن فشلت عمليات معينة — راجع قائمة الفاشلة<br><br>
      💡 النظام <strong>لا يُكرر</strong> العمليات — كل عملية تُزامَن مرة واحدة.`,
    tags: ['مشاكل', 'مزامنة'],
  },
  {
    id: 'ts-price-locked',
    cat: 'troubleshooting',
    question: 'لماذا السعر لا يتغير بعد إعادة حساب شامل؟',
    answer: `السبب: السعر <strong>مقفل يدوياً</strong>.<br><br>
      • عند قفل سعر، لا يتغير أبداً حتى تفتحه<br>
      • لهذا لا يمكن أن تخسره<br><br>
      <strong>التحقق:</strong><br>
      • في كتالوج الأدوية، الدفعة المقفلة لها شارة 🔒 بنفسجية<br>
      • راجع "سبب القفل" أسفل البطاقة<br><br>
      <strong>لفتح القفل:</strong> اضغط 🔓 — سيُعاد الحساب تلقائياً.`,
    tags: ['مشاكل', 'تسعير'],
  },
  {
    id: 'ts-print-fail',
    cat: 'troubleshooting',
    question: 'الفاتورة لا تُطبع — ماذا أفعل؟',
    answer: `1. تحقق من تفعيل الطباعة في الإعدادات<br>
      2. تحقق من اتصال الطابعة<br>
      3. جرّب "إعادة طباعة" يدوياً من تفاصيل الفاتورة<br>
      4. إن لم تعمل:<br>
      • افتح Console (F12) — راجع الأخطاء<br>
      • تحقق من إعداد "عرض الورق" (80mm أو 58mm)<br>
      • أعد تشغيل الطابعة والمتصفح`,
    tags: ['مشاكل', 'طباعة'],
  },
  {
    id: 'ts-general',
    cat: 'troubleshooting',
    question: 'ظهرت رسالة خطأ غير مفهومة — ماذا أفعل؟',
    answer: `1. <strong>صوّر الشاشة</strong> أو انسخ نص الخطأ<br>
      2. افتح Console (F12) واستخرج السجل<br>
      3. جرّب:<br>
      • إعادة تحميل الصفحة<br>
      • مسح الـ Cache من Ctrl+Shift+R<br>
      • تجربة متصفح آخر<br>
      4. راجع Audit Log (إذا كان لديك وصول)<br>
      5. تواصل مع الدعم مع:<br>
      • لقطة الشاشة<br>
      • سجل Console<br>
      • وقت المشكلة`,
    tags: ['مشاكل'],
  },
];

/* ============================================================
   State
   ============================================================ */
const searchQuery    = ref('');
const activeCategory = ref('all');
const openItem       = ref(null);

/* ============================================================
   Computed
   ============================================================ */
const totalFaqs = computed(() => faqs.length);

const filteredFaqs = computed(() => {
  let list = faqs;

  // Filter by category
  if (activeCategory.value !== 'all') {
    list = list.filter(f => f.cat === activeCategory.value);
  }

  // Filter by search
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(f => {
      const haystack = (f.question + ' ' + f.answer + ' ' + (f.tags || []).join(' ')).toLowerCase();
      return haystack.includes(q);
    });
  }

  return list;
});

const categoriesWithResults = computed(() => {
  return categories
    .map(cat => ({
      ...cat,
      items: filteredFaqs.value.filter(f => f.cat === cat.id),
    }))
    .filter(cat => cat.items.length > 0);
});

/* ============================================================
   Methods
   ============================================================ */
const countByCategory = (catId) => faqs.filter(f => f.cat === catId).length;

const toggleItem = (id) => {
  openItem.value = openItem.value === id ? null : id;
};
</script>

<style scoped>
.faq-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 60px;
  font-family: 'Cairo', system-ui, -apple-system, sans-serif;
}

/* ============================================================
   Header
   ============================================================ */
.faq-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 32px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  border-radius: 20px;
  margin-bottom: 24px;
  color: #fff;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.25);
}
.header-icon {
  width: 72px; height: 72px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  font-size: 34px;
  flex-shrink: 0;
}
.header-text h1 {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}
.header-text p {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

/* ============================================================
   Search bar
   ============================================================ */
.search-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.search-input-wrap {
  flex: 1;
  min-width: 280px;
  position: relative;
}
.search-input-wrap > i {
  position: absolute;
  top: 50%;
  right: 18px;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 16px;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 16px 52px 16px 52px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-family: inherit;
  font-size: 15px;
  background: #fff;
  transition: 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
.search-clear {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  width: 32px; height: 32px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: 0.15s;
}
.search-clear:hover { background: #e2e8f0; color: #334155; }

.search-stats {
  display: flex;
  align-items: center;
}
.stat-badge {
  padding: 10px 18px;
  background: #ecfdf5;
  color: #065f46;
  border: 1.5px solid #a7f3d0;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
}
.stat-badge strong {
  font-size: 16px;
  margin-left: 4px;
}

/* ============================================================
   Categories bar
   ============================================================ */
.categories-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}
.cat-btn {
  padding: 9px 16px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: 0.15s;
}
.cat-btn:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}
.cat-btn.active {
  background: var(--cat-color, #3b82f6);
  border-color: var(--cat-color, #3b82f6);
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}
.cat-btn i { font-size: 12px; }
.cat-count {
  background: rgba(0, 0, 0, 0.08);
  color: inherit;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  margin-right: 2px;
}
.cat-btn.active .cat-count {
  background: rgba(255, 255, 255, 0.25);
}

/* ============================================================
   FAQ groups (when "all")
   ============================================================ */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.faq-group { margin-bottom: 4px; }
.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, var(--cat-color, #3b82f6) 0%, transparent 100%);
  border-radius: 12px;
  color: #fff;
}
.group-header i { font-size: 18px; }
.group-header h2 {
  font-size: 16px;
  font-weight: 800;
  margin: 0;
  flex: 1;
}
.group-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
}
.group-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ============================================================
   FAQ item (accordion)
   ============================================================ */
.faq-item {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  transition: 0.2s;
}
.faq-item:hover {
  border-color: #cbd5e1;
}
.faq-item.open {
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.12);
}

.faq-question {
  width: 100%;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: right;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  transition: 0.15s;
}
.faq-question:hover {
  background: #f8fafc;
}
.q-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: #eff6ff;
  color: #3b82f6;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.faq-item.open .q-icon {
  background: #3b82f6;
  color: #fff;
}
.q-text {
  flex: 1;
  line-height: 1.5;
}
.q-toggle {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  flex-shrink: 0;
}
.faq-item.open .q-toggle {
  color: #3b82f6;
}

.faq-answer {
  padding: 0 20px 22px 20px;
  background: #fafbfc;
  border-top: 1px solid #f1f5f9;
  animation: slideDown 0.25s ease;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.a-content {
  padding: 18px 0 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.9;
}
.a-content :deep(strong) { color: #1e293b; font-weight: 800; }
.a-content :deep(code) {
  background: #f1f5f9;
  color: #7c3aed;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  direction: ltr;
  display: inline-block;
}
.a-content :deep(br) { line-height: 2; }

.a-tags {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.a-tag {
  padding: 4px 10px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.a-tag i { font-size: 9px; opacity: 0.7; }

/* ============================================================
   Empty state
   ============================================================ */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #94a3b8;
}
.empty-state i {
  font-size: 56px;
  margin-bottom: 16px;
  display: block;
  color: #cbd5e1;
}
.empty-state h3 {
  font-size: 18px;
  font-weight: 800;
  color: #475569;
  margin: 0 0 6px;
}
.empty-state p {
  font-size: 14px;
  margin: 0;
}

/* ============================================================
   Footer note
   ============================================================ */
.footer-note {
  display: flex;
  gap: 16px;
  padding: 20px 24px;
  margin-top: 32px;
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-radius: 14px;
  color: #78350f;
}
.footer-note > i {
  font-size: 26px;
  color: #d97706;
  flex-shrink: 0;
  margin-top: 2px;
}
.footer-note strong {
  font-size: 14px;
  font-weight: 800;
  display: block;
  margin-bottom: 4px;
}
.footer-note p {
  font-size: 13px;
  margin: 0;
  line-height: 1.7;
}
.chips {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.chip {
  display: inline-block;
  padding: 3px 10px;
  background: #fff;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: #92400e;
}

/* ============================================================
   Responsive
   ============================================================ */
@media (max-width: 640px) {
  .faq-page { padding: 16px 10px 40px; }
  .faq-header { padding: 20px; gap: 14px; }
  .header-icon { width: 54px; height: 54px; font-size: 24px; }
  .header-text h1 { font-size: 20px; }
  .header-text p { font-size: 12.5px; }
  .faq-question { padding: 14px 16px; font-size: 14px; }
  .a-content { font-size: 13.5px; }
  .cat-btn { font-size: 12px; padding: 7px 12px; }
}
</style>