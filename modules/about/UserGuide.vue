<!-- modules/about/UserGuide.vue -->
<template>
  <div class="p-8 max-w-4xl mx-auto" dir="rtl">
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div class="border-b border-slate-100 p-6 bg-gradient-to-l from-blue-50 to-white">
        <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <i class="fas fa-book-open text-blue-600"></i>
          دليل استخدام النظام
        </h2>
        <p class="text-slate-500 mt-1">دليل سريع لمساعدتك في البدء مع نظام إدارة الصيدلية</p>
      </div>

      <div class="p-6 space-y-8">
        <!-- قسم 1: إدارة الأدوية -->
        <section>
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <span class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">1</span>
            إدارة الأدوية
          </h3>
          <ul class="space-y-2 text-slate-600 pr-8 list-disc">
            <li><strong>إضافة دواء:</strong> اضغط على "حفظ الدواء" بعد ملء البيانات. يجب تحديد وحدة أساسية واحدة على الأقل.</li>
            <li><strong>البحث:</strong> استخدم مربع البحث للعثور على دواء بالاسم أو الباركود.</li>
            <li><strong>التعديل والحذف:</strong> استخدم الأزرار في عمود "إجراءات" لتعديل أو حذف أي دواء.</li>
          </ul>
        </section>

        <!-- قسم 2: المشتريات -->
        <section>
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
            إدارة المشتريات
          </h3>
          <ul class="space-y-2 text-slate-600 pr-8 list-disc">
            <li><strong>اختر المورد والفرع:</strong> حدد المورد والفرع المستهدف في أعلى الصفحة.</li>
            <li><strong>إضافة صنف:</strong> ابحث عن الدواء، اختر الوحدة، أدخل الكمية والسعر، ثم اضغط "إضافة الصنف".</li>
            <li><strong>حفظ الفاتورة:</strong> بعد إضافة جميع الأصناف، اضغط "حفظ الفاتورة".</li>
          </ul>
        </section>

        <!-- قسم 3: الفروع -->
        <section>
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <span class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">3</span>
            إدارة الفروع
          </h3>
          <ul class="space-y-2 text-slate-600 pr-8 list-disc">
            <li><strong>إضافة فرع:</strong> أدخل اسم الفرع والموقع ثم اضغط "إضافة فرع".</li>
            <li><strong>التعديل والحذف:</strong> استخدم الأزرار في عمود "إجراءات" لتعديل أو حذف أي فرع.</li>
          </ul>
        </section>

        <!-- قسم 4: التنقل -->
        <section>
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <span class="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm">4</span>
            التنقل في النظام
          </h3>
          <ul class="space-y-2 text-slate-600 pr-8 list-disc">
            <li>استخدم <strong>القائمة الجانبية</strong> للتنقل بين الأقسام المختلفة.</li>
            <li>اضغط على <strong>"جولة إرشادية"</strong> للحصول على شرح تفاعلي لكل صفحة.</li>
            <li>زر <strong>"تسجيل الخروج"</strong> موجود في أسفل القائمة الجانبية.</li>
          </ul>
        </section>

        <!-- قسم 5: نصائح سريعة -->
        <section class="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 class="text-lg font-bold text-blue-800 flex items-center gap-2 mb-2">
            <i class="fas fa-lightbulb text-yellow-500"></i>
            نصائح سريعة
          </h3>
          <ul class="space-y-1 text-blue-700 pr-8 list-disc">
            <li>جميع التغييرات تُحفظ تلقائياً عند الضغط على "حفظ".</li>
            <li>يمكنك تحديث أي صفحة بالضغط على زر "تحديث" الموجود في أعلى كل قسم.</li>
            <li>في حالة عدم الاتصال بالإنترنت، يعمل النظام في وضع Offline ويُزامن البيانات تلقائياً عند عودة الاتصال.</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
// هذا المكون ثابت، يمكن إضافته كـ tab جديد في القائمة الجانبية
</script>