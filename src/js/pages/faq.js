import '@fortawesome/fontawesome-free/css/all.min.css';
import '../../css/app.css';

import { createApp } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';
import FaqPage from '../../../modules/faq/faq.vue';

import '../pwa.js';

/* ============================================================
   Auth
   ============================================================ */
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/* ============================================================
   Mount
   ============================================================ */
const app = createApp(FaqPage);

// منع ازدواج mount عند الاستيراد المتعدد
const existing = document.querySelector('#app')._vue_app_;
if (existing) existing.unmount();

app.mount('#app');