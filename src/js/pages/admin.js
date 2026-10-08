// src/js/pages/admin.js
import { createApp } from 'vue';
import App from './admin.vue'; // استيراد المكون الرئيسي
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../../css/app.css'; // استيراد الأنماط العامة

// =====================================

import pinia from '../stores/index.js'; 
// إعدادات Axios وغيرها من التهيئة العامة
import axios from 'axios';
import { API_BASE } from '../config.js';

// تأكد من أن التوكن موجود
const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// إنشاء وتثبيت تطبيق Vue
const app = createApp(App)
app.use(pinia); // <-- تفعيل Pinia
app.mount('#app');