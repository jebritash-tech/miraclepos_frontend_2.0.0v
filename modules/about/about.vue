<!-- modules/about/about.vue -->
<template>
  <div class="about-page" dir="rtl">

    <!-- ============================================================
         Hero Header
         ============================================================ -->
    <div class="hero">
      <div class="hero-icon">
        <i class="fas fa-prescription-bottle-medical"></i>
      </div>
      <div class="hero-text">
        <h1>MiraclePOS</h1>
        <p>نظام متكامل لإدارة الصيدليات</p>
        <div class="hero-badges">
          <span class="badge badge-version">
            <i class="fas fa-code-branch"></i>
            الإصدار 2.0.0 Stable
          </span>
          <span class="badge badge-status">
            <i class="fas fa-circle"></i>
            نظام نشط
          </span>
        </div>
      </div>
    </div>

    <!-- ============================================================
         نظرة عامة
         ============================================================ -->
    <div class="card">
      <h2 class="section-title">
        <i class="fas fa-info-circle"></i>
        نظرة عامة
      </h2>
      <p class="description">
        <strong>MiraclePOS</strong> هو حل تقني متكامل صُمِّم خصيصاً
        لتحويل إدارة الصيدليات من الطرق التقليدية إلى الإدارة الرقمية الذكية.
        يعمل النظام بكفاءة حتى <strong>بدون اتصال بالإنترنت</strong>،
        ويوفّر أدوات تحليلية متقدمة لاتخاذ قرارات تجارية مبنية على بيانات حقيقية.
      </p>
    </div>

    <!-- ============================================================
         المميزات
         ============================================================ -->
    <div class="card">
      <h2 class="section-title">
        <i class="fas fa-star"></i>
        المميزات الرئيسية
      </h2>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon" style="background: #eff6ff; color: #3b82f6;">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div>
            <h3>نقطة بيع فائقة السرعة</h3>
            <p>واجهة مصممة للسرعة مع اختصارات لوحة مفاتيح احترافية.</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon" style="background: #ecfdf5; color: #059669;">
            <i class="fas fa-boxes"></i>
          </div>
          <div>
            <h3>إدارة ذكية للمخزون</h3>
            <p>تنبيهات استباقية لنواقص الأدوية وتواريخ الصلاحية.</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon" style="background: #faf5ff; color: #7c3aed;">
            <i class="fas fa-chart-line"></i>
          </div>
          <div>
            <h3>تقارير وتحليلات</h3>
            <p>تقارير مالية دقيقة قابلة للطباعة والتصدير.</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon" style="background: #fef3c7; color: #d97706;">
            <i class="fas fa-wifi-slash"></i>
          </div>
          <div>
            <h3>العمل بدون إنترنت</h3>
            <p>النظام يعمل بكامل طاقته Offline ويُزامن تلقائياً.</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon" style="background: #fef2f2; color: #dc2626;">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div>
            <h3>أمان متقدم</h3>
            <p>نظام PIN للعمليات الحساسة + سجل تدقيق كامل.</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon" style="background: #f0fdf4; color: #16a34a;">
            <i class="fas fa-database"></i>
          </div>
          <div>
            <h3>نسخ احتياطي تلقائي</h3>
            <p>حماية يومية للبيانات مع دعم MySQL و PostgreSQL.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================
         القوانين والوثائق القانونية
         ============================================================ -->
    <div class="card card-legal">
      <h2 class="section-title">
        <i class="fas fa-gavel"></i>
        الوثائق القانونية والسياسات
      </h2>
      <p class="description-small">
        نلتزم بالشفافية الكاملة. يُرجى الاطلاع على الوثائق التالية
        لفهم حقوقك والتزاماتك عند استخدام النظام.
      </p>

      <div class="legal-links">
        <a href="legal/terms.html" target="_blank" class="legal-link legal-terms">
          <div class="legal-icon">
            <i class="fas fa-file-contract"></i>
          </div>
          <div class="legal-content">
            <h3>شروط الاستخدام</h3>
            <p>الشروط والأحكام المنظمة لاستخدام النظام</p>
          </div>
          <div class="legal-arrow">
            <i class="fas fa-external-link-alt"></i>
          </div>
        </a>

        <a href="legal/privacy.html" target="_blank" class="legal-link legal-privacy">
          <div class="legal-icon">
            <i class="fas fa-user-shield"></i>
          </div>
          <div class="legal-content">
            <h3>سياسة الخصوصية</h3>
            <p>كيف نحمي بياناتك وبيانات عملائك</p>
          </div>
          <div class="legal-arrow">
            <i class="fas fa-external-link-alt"></i>
          </div>
        </a>

        <a href="legal/eula.html" target="_blank" class="legal-link legal-eula">
          <div class="legal-icon">
            <i class="fas fa-file-signature"></i>
          </div>
          <div class="legal-content">
            <h3>اتفاقية الترخيص (EULA)</h3>
            <p>شروط ترخيص استخدام البرنامج</p>
          </div>
          <div class="legal-arrow">
            <i class="fas fa-external-link-alt"></i>
          </div>
        </a>
      </div>
    </div>

    <!-- ============================================================
         الدعم والمساعدة
         ============================================================ -->
    <div class="card">
      <h2 class="section-title">
        <i class="fas fa-headset"></i>
        الدعم والمساعدة
      </h2>
      <div class="support-links">
        <a href="faq.html" target="_blank" class="support-link">
          <div class="support-icon" style="background: #eff6ff; color: #3b82f6;">
            <i class="fas fa-question-circle"></i>
          </div>
          <div class="support-content">
            <h3>الأسئلة الشائعة</h3>
            <p>إجابات لأكثر من 60 سؤالاً حول استخدام النظام</p>
          </div>
          <i class="fas fa-chevron-left support-arrow"></i>
        </a>

        <a href="mailto:support@miraclepos.test" class="support-link">
          <div class="support-icon" style="background: #fef2f2; color: #dc2626;">
            <i class="fas fa-envelope"></i>
          </div>
          <div class="support-content">
            <h3>الدعم الفني</h3>
            <p>jebritash@gmail.com</p>
          </div>
          <i class="fas fa-chevron-left support-arrow"></i>
        </a>

        <a href="tel:0907722829" class="support-link">
          <div class="support-icon" style="background: #ecfdf5; color: #059669;">
            <i class="fas fa-phone"></i>
          </div>
          <div class="support-content">
            <h3>الهاتف</h3>
            <p>0907722829</p>
          </div>
          <i class="fas fa-chevron-left support-arrow"></i>
        </a>
      </div>
    </div>

    <!-- ============================================================
         معلومات النظام
         ============================================================ -->
    <div class="card">
      <h2 class="section-title">
        <i class="fas fa-microchip"></i>
        معلومات النظام
      </h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">الإصدار</span>
          <span class="info-value">2.0.0 Stable</span>
        </div>
        <div class="info-item">
          <span class="info-label">البيئة</span>
          <span class="info-value" :class="environmentClass">
            {{ environmentLabel }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">قاعدة البيانات</span>
          <span class="info-value">MySQL / PostgreSQL</span>
        </div>
        <div class="info-item">
          <span class="info-label">PHP</span>
          <span class="info-value">8.2+</span>
        </div>
        <div class="info-item">
          <span class="info-label">Laravel</span>
          <span class="info-value">11.x</span>
        </div>
        <div class="info-item">
          <span class="info-label">المتصفح</span>
          <span class="info-value">{{ browserInfo }}</span>
        </div>
      </div>
    </div>

    <!-- ============================================================
         Footer
         ============================================================ -->
    <div class="footer">
      <div class="footer-brand">
        <i class="fas fa-prescription-bottle-medical"></i>
        <span><strong>MiraclePOS</strong> v2.0.0</span>
      </div>
      <p class="footer-copy">
        © {{ currentYear }} — جميع الحقوق محفوظة.
        <br>
        تم التطوير لدعم كفاءة الصيدليات المتقدمة.
      </p>
      <div class="footer-links">
        <a href="legal/terms.html" target="_blank">الشروط</a>
        <span>•</span>
        <a href="legal/privacy.html" target="_blank">الخصوصية</a>
        <span>•</span>
        <a href="faq.html" target="_blank">الدعم</a>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';

/* ============================================================
   Dynamic info
   ============================================================ */
const currentYear = computed(() => new Date().getFullYear());

const environmentLabel = computed(() => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.test')) {
    return 'تطوير';
  }
  return 'إنتاج';
});

const environmentClass = computed(() => {
  return environmentLabel.value === 'إنتاج' ? 'env-production' : 'env-dev';
});

const browserInfo = computed(() => {
  const ua = navigator.userAgent;

  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    const v = ua.match(/Chrome\/(\d+)/)?.[1];
    return `Chrome ${v || ''}`;
  }
  if (ua.includes('Firefox')) {
    const v = ua.match(/Firefox\/(\d+)/)?.[1];
    return `Firefox ${v || ''}`;
  }
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    const v = ua.match(/Version\/(\d+)/)?.[1];
    return `Safari ${v || ''}`;
  }
  if (ua.includes('Edg')) {
    const v = ua.match(/Edg\/(\d+)/)?.[1];
    return `Edge ${v || ''}`;
  }
  return 'غير معروف';
});
</script>

<style scoped>
.about-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 60px;
  font-family: 'Cairo', system-ui, -apple-system, sans-serif;
  color: #1e293b;
}

/* ============================================================
   Hero
   ============================================================ */
.hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
  border-radius: 20px;
  color: #fff;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.25);
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
}
.hero-icon {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.hero-text {
  flex: 1;
  position: relative;
  z-index: 1;
}
.hero-text h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}
.hero-text > p {
  font-size: 15px;
  margin: 0 0 12px;
  opacity: 0.9;
}
.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.badge i { font-size: 10px; }
.badge-status i { color: #86efac; animation: pulse 2s infinite; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

/* ============================================================
   Card
   ============================================================ */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 20px;
  transition: 0.2s;
}
.card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}
.section-title i {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #eff6ff;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.description {
  font-size: 14.5px;
  line-height: 1.9;
  color: #475569;
  margin: 0;
}
.description strong {
  color: #1e293b;
  font-weight: 800;
}
.description-small {
  font-size: 13.5px;
  color: #64748b;
  margin: 0 0 18px;
  line-height: 1.7;
}

/* ============================================================
   Features grid
   ============================================================ */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.feature-item {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 12px;
  transition: 0.15s;
}
.feature-item:hover {
  background: #f1f5f9;
  transform: translateY(-1px);
}
.feature-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}
.feature-item h3 {
  font-size: 14px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 3px;
}
.feature-item p {
  font-size: 12.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

/* ============================================================
   Legal links
   ============================================================ */
.card-legal {
  background: linear-gradient(135deg, #fffbeb 0%, #fefce8 100%);
  border-color: #fde68a;
}
.card-legal .section-title i {
  background: #fef3c7;
  color: #d97706;
}
.card-legal .section-title {
  color: #78350f;
}

.legal-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.legal-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #fff;
  border: 1.5px solid #fde68a;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: 0.2s;
}
.legal-link:hover {
  transform: translateX(-4px);
  border-color: #f59e0b;
  box-shadow: 0 6px 20px rgba(217, 119, 6, 0.12);
}
.legal-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  flex-shrink: 0;
}
.legal-terms   .legal-icon { background: #eff6ff; color: #3b82f6; }
.legal-privacy .legal-icon { background: #ecfdf5; color: #059669; }
.legal-eula    .legal-icon { background: #faf5ff; color: #7c3aed; }

.legal-content { flex: 1; }
.legal-content h3 {
  font-size: 14.5px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 3px;
}
.legal-content p {
  font-size: 12.5px;
  color: #64748b;
  margin: 0;
}
.legal-arrow {
  color: #94a3b8;
  font-size: 13px;
  flex-shrink: 0;
  transition: 0.15s;
}
.legal-link:hover .legal-arrow {
  color: #d97706;
  transform: translateX(-3px);
}

/* ============================================================
   Support links
   ============================================================ */
.support-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.support-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: 0.2s;
}
.support-link:hover {
  background: #fff;
  border-color: #cbd5e1;
  transform: translateX(-3px);
}
.support-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}
.support-content { flex: 1; }
.support-content h3 {
  font-size: 14px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 2px;
}
.support-content p {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  font-family: 'Courier New', monospace;
}
.support-arrow {
  color: #cbd5e1;
  font-size: 14px;
  flex-shrink: 0;
}

/* ============================================================
   Info grid
   ============================================================ */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.info-item {
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  border-right: 3px solid #e2e8f0;
}
.info-label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.info-value {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #1e293b;
  font-family: 'Courier New', monospace;
}
.env-production {
  color: #059669 !important;
}
.env-dev {
  color: #d97706 !important;
}

/* ============================================================
   Footer
   ============================================================ */
.footer {
  text-align: center;
  padding: 32px 20px;
  margin-top: 20px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}
.footer-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 8px;
}
.footer-brand i {
  color: #3b82f6;
  font-size: 20px;
}
.footer-copy {
  font-size: 12.5px;
  color: #64748b;
  margin: 0 0 14px;
  line-height: 1.8;
}
.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: #cbd5e1;
}
.footer-links a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 700;
  transition: 0.15s;
}
.footer-links a:hover {
  color: #1e40af;
  text-decoration: underline;
}

/* ============================================================
   Responsive
   ============================================================ */
@media (max-width: 640px) {
  .about-page { padding: 16px 10px 40px; }
  .hero { padding: 22px 18px; gap: 16px; flex-direction: column; text-align: center; }
  .hero-icon { width: 68px; height: 68px; font-size: 32px; }
  .hero-text h1 { font-size: 24px; }
  .hero-badges { justify-content: center; }
  .card { padding: 18px 20px; }
  .section-title { font-size: 15px; }
  .features-grid { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr; }
  .legal-link,
  .support-link { padding: 12px 14px; gap: 12px; }
  .legal-icon,
  .support-icon { width: 38px; height: 38px; font-size: 15px; }
}
</style>
