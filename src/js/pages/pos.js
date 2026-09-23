// ═══════════════════════════════════════════════════════════════════
// ✅ إصلاح مشكلة global قبل أي import (مهم جداً لـ simple-peer)
// ═══════════════════════════════════════════════════════════════════
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
    window.global = window;
}

import '@fortawesome/fontawesome-free/css/all.min.css';
import '../../css/app.css';
import { playSound } from '../sounds.js';
import {
    createApp,
    ref,
    computed,
    reactive,
    onMounted,
    onUnmounted,
    nextTick
} from 'vue';

import * as Vue from 'vue';
import { watch } from 'vue';
import axios from 'axios';

import { API_BASE } from '../config.js';
import { printInvoice, safePrintInvoice, getPrintSettings, setPrintServerSettings } from '../utils/thermalPrinter.js';

import {
    db,
    getPendingSales,
    saveOfflineSale,
    removeOfflineSale,
    countPendingSales,
    updatePendingSalesShiftId,
    getPendingRefunds,
    saveOfflineRefund,
    removeOfflineRefund,
    countPendingRefunds,
    cacheMedicines,
    getCachedMedicines,
    reduceMedicineStock,
    cacheUser,
    getCachedUser,
    saveRefundOffline,
} from '../offline-db.js';

import '../pwa.js';

import {
    getCurrentShiftForPOS,
    closeCurrentShiftFromPOS,
    updateShiftAfterPOSOperation,
    syncPendingShiftEvents,
    syncPendingShiftFinanceOperations,
    runFullSync,
    syncProgress,
    enqueueShiftFinanceOperation,
    getShiftMapping,
    getCachedShift,
    saveCachedShift,
    getPendingShiftFinanceOperations,
    savePendingShiftFinanceOperations,
    applyPOSOperationToLocalShift,
    recalculateExpectedCash,
    cacheSaleDetails,
    getCachedSaleDetails,
    getLocalOpenShift,
} from './shift.js';

import {
    settings as pharmacySettings,
    loadSettings,
    refreshSettings,
} from '../settings.js';
import QRCode from 'qrcode';
import Peer from 'peerjs';

/*
|--------------------------------------------------------------------------
| Stock Validation Helper
|--------------------------------------------------------------------------
*/
function validateCartStock(cartItems, medicines) {
    const issues = [];

    for (const item of cartItems) {
        const medicine = medicines.find(m => Number(m.id) === Number(item.medicine_id));

        if (!medicine) {
            issues.push({
                name: item.name,
                reason: 'الدواء غير موجود في قاعدة البيانات المحلية',
                requested: item.quantity_base,
                available: 0,
            });
            continue;
        }

        const batch = medicine.batches?.find(b => Number(b.id) === Number(item.batch_id));

        if (!batch) {
            issues.push({
                name: item.name,
                reason: 'الدفعة المحددة غير موجودة',
                requested: item.quantity_base,
                available: 0,
            });
            continue;
        }

        const available = Number(batch.remaining_quantity || 0);
        const requested = Number(item.quantity_base || item.quantity || 0);

        if (available < requested) {
            issues.push({
                name: item.name,
                reason: `المخزون غير كافٍ — المتاح: ${available} قطعة، المطلوب: ${requested} قطعة`,
                requested,
                available,
                shortfall: requested - available,
            });
        }
    }

    return issues;
}

/*
|--------------------------------------------------------------------------
| Persistent Peer ID Helpers
|--------------------------------------------------------------------------
*/
const PEER_ID_STORAGE_KEY = 'miraclepos_peer_id';
const PEER_ID_EXPIRY_KEY = 'miraclepos_peer_id_expiry';
const PEER_ID_TTL = 7 * 24 * 60 * 60 * 1000;

function getOrCreatePersistentPeerId() {
    try {
        const storedId = localStorage.getItem(PEER_ID_STORAGE_KEY);
        const storedExpiry = localStorage.getItem(PEER_ID_EXPIRY_KEY);

        if (storedId && storedExpiry && Date.now() < Number(storedExpiry)) {
            console.log('📡 Using stored Peer ID:', storedId);
            return storedId;
        }
    } catch (e) {
        console.warn('تعذر قراءة Peer ID المحفوظ:', e);
    }

    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'miraclepos-';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
        localStorage.setItem(PEER_ID_STORAGE_KEY, result);
        localStorage.setItem(PEER_ID_EXPIRY_KEY, String(Date.now() + PEER_ID_TTL));
    } catch (e) {}

    console.log('📡 Generated new Peer ID:', result);
    return result;
}

function clearPersistentPeerId() {
    try {
        localStorage.removeItem(PEER_ID_STORAGE_KEY);
        localStorage.removeItem(PEER_ID_EXPIRY_KEY);
    } catch (e) {}
}

/*
|--------------------------------------------------------------------------
| SimplePeer Dynamic Loader — يحل مشكلة global نهائياً
|--------------------------------------------------------------------------
*/
let SimplePeerModule = null;
/*
|--------------------------------------------------------------------------
| SimplePeer Loader — محلي بالكامل (يعمل Offline)
|--------------------------------------------------------------------------
*/
let SimplePeerConstructor = null;

async function loadSimplePeer() {
    if (SimplePeerConstructor) return SimplePeerConstructor;

    // 1. إذا كان من السكريبت المحلي في HTML
    if (typeof window.SimplePeer === 'function') {
        SimplePeerConstructor = window.SimplePeer;
        console.log('✅ SimplePeer ready (from local script)');
        return SimplePeerConstructor;
    }

    // 2. انتظر تحميل السكريبت (حتى 5 ثوانٍ)
    console.log('⏳ Waiting for SimplePeer from local script...');

    const found = await new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 50 × 100ms = 5s

        const interval = setInterval(() => {
            attempts++;

            if (typeof window.SimplePeer === 'function') {
                clearInterval(interval);
                resolve(true);
                return;
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                resolve(false);
            }
        }, 100);
    });

    if (found && typeof window.SimplePeer === 'function') {
        SimplePeerConstructor = window.SimplePeer;
        console.log('✅ SimplePeer ready (after wait)');
        return SimplePeerConstructor;
    }

    // 3. حل أخير: تحميل من المسار المحلي (إذا لم يُحمّل السكريبت)
    console.log('⚠️ SimplePeer not found — trying local file...');

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/simplepeer.min.js'; // ✅ مسار محلي
        script.async = true;

        const timeout = setTimeout(() => {
            reject(new Error(
                'مكتبة الاتصال اليدوي غير متوفرة. تأكد من وجود simplepeer.min.js في المشروع.'
            ));
        }, 10000);

        script.onload = () => {
            clearTimeout(timeout);
            if (typeof window.SimplePeer === 'function') {
                SimplePeerConstructor = window.SimplePeer;
                console.log('✅ SimplePeer loaded from local file');
                resolve(SimplePeerConstructor);
            } else {
                reject(new Error('الملف المحلي لم يُعرّف window.SimplePeer'));
            }
        };

        script.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('فشل تحميل الملف المحلي simplepeer.min.js'));
        };

        document.head.appendChild(script);
    });
}
const app = createApp({

    template: `
    <!-- ═══════════════════════════════════════════════════════════
         الشريط العلوي
         ═══════════════════════════════════════════════════════════ -->
    <nav class="bg-gradient-to-r from-slate-800 to-blue-800 text-white shadow-xl px-3 sm:px-4 md:px-6 py-2 md:py-3 sticky top-0 z-40">
        <div class="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
            <!-- الشعار -->
            <div class="flex items-center gap-2 md:gap-3 flex-shrink-0">
                <div class="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
                    <img v-if="pharmacySettings['pharmacy.logo_url'] && !logoFailed" :src="pharmacySettings['pharmacy.logo_url']" @error="logoFailed = true" alt="شعار الصيدلية" class="w-full h-full object-contain" />
                    <i v-else class="fas fa-prescription-bottle-medical text-xl md:text-3xl text-emerald-300"></i>
                </div>
                <div class="hidden sm:block">
                    <div class="text-lg md:text-2xl font-extrabold tracking-tight">MiraclePOS</div>
                </div>
            </div>

            <!-- إحصائيات الوردية -->
            <div class="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 justify-center flex-wrap order-3 md:order-2 w-full md:w-auto">
                <div class="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl px-2 sm:px-3 md:px-4 py-1 md:py-2 text-center min-w-[80px] sm:min-w-[100px] border border-white/20">
                    <div class="text-[9px] md:text-[10px] text-blue-200">💵 الدرج</div>
                    <div class="text-sm sm:text-base md:text-xl font-bold" :class="Number(shift?.expected_cash || 0)>=0 ? 'text-emerald-200' : 'text-red-300'">
                        {{ Number(shift?.expected_cash || 0).toLocaleString() }}
                    </div>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl px-2 sm:px-3 md:px-4 py-1 md:py-2 text-center min-w-[70px] sm:min-w-[90px]">
                    <div class="text-[9px] md:text-[10px] text-blue-200">💰 نقدي</div>
                    <div class="text-sm sm:text-base md:text-lg font-bold">{{ Number(shift?.cash_sales || 0).toLocaleString() }}</div>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl px-2 sm:px-3 md:px-4 py-1 md:py-2 text-center min-w-[70px] sm:min-w-[90px]">
                    <div class="text-[9px] md:text-[10px] text-blue-200">💳 بطاقة</div>
                    <div class="text-sm sm:text-base md:text-lg font-bold">{{ Number(shift?.card_sales || 0).toLocaleString() }}</div>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl px-2 sm:px-3 md:px-4 py-1 md:py-2 text-center min-w-[65px] sm:min-w-[80px]">
                    <div class="text-[9px] md:text-[10px] text-blue-200">🧾 الفواتير</div>
                    <div class="text-sm sm:text-base md:text-lg font-bold">{{ shift?.sales_count || 0 }}</div>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl px-2 sm:px-3 md:px-4 py-1 md:py-2 text-center min-w-[80px] sm:min-w-[100px] border border-white/30">
                    <div class="text-[9px] md:text-[10px] text-blue-200">الوردية</div>
                    <div class="font-bold text-xs sm:text-sm">{{ shift?.status=='open' ? '🟢 مفتوحة' : '🔴 مغلقة' }}</div>
                </div>
            </div>

            <!-- الأزرار -->
            <div class="flex items-center gap-1.5 md:gap-3 flex-shrink-0 order-2 md:order-3">
                <div class="relative">
                    <button @click="showFinanceMenu=!showFinanceMenu" class="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold px-2.5 sm:px-3 md:px-4 py-2 md:py-2.5 rounded-xl shadow-lg transition flex items-center gap-1 md:gap-2 text-xs sm:text-sm md:text-base">
                        <i class="fas fa-coins"></i>
                        <span class="hidden sm:inline">مالية</span>
                    </button>

                    <!-- Overlay لإغلاق القائمة عند النقر خارجها (للموبايل) -->
                    <div v-if="showFinanceMenu" 
                        @click="showFinanceMenu=false" 
                        class="fixed inset-0 z-40 md:hidden"></div>

                    <!-- القائمة المنسدلة -->
                    <transition
                        enter-active-class="transition ease-out duration-200"
                        enter-from-class="opacity-0 scale-95"
                        enter-to-class="opacity-100 scale-100"
                        leave-active-class="transition ease-in duration-150"
                        leave-from-class="opacity-100 scale-100"
                        leave-to-class="opacity-0 scale-95"
                    >
                        <div v-if="showFinanceMenu" 
                            class="absolute mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-200
                                    w-64
                                    left-0 md:left-0
                                    max-w-[calc(100vw-1rem)] md:max-w-none">
                            
                            <!-- Header للموبايل -->
                            <div class="md:hidden px-4 py-2.5 bg-gradient-to-l from-yellow-50 to-amber-50 border-b border-amber-200 flex items-center justify-between">
                                <span class="font-bold text-amber-800 text-sm flex items-center gap-2">
                                    <i class="fas fa-coins text-amber-600"></i>
                                    العمليات المالية
                                </span>
                                <button @click="showFinanceMenu=false" class="text-slate-400 hover:text-slate-600 p-1">
                                    <i class="fas fa-times text-sm"></i>
                                </button>
                            </div>

                            <button @click="showFinanceMenu=false;openExpenseModal()" 
                                    class="w-full text-right px-4 py-3 hover:bg-blue-50 text-gray-700 flex items-center gap-3 text-sm md:text-base transition-colors">
                                <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-receipt text-red-500 text-sm"></i>
                                </div>
                                <span class="flex-1">إضافة مصروف</span>
                            </button>
                            
                            <button @click="showFinanceMenu=false;openWithdrawModal()" 
                                    class="w-full text-right px-4 py-3 hover:bg-blue-50 text-gray-700 flex items-center gap-3 text-sm md:text-base transition-colors">
                                <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-hand-holding-usd text-orange-500 text-sm"></i>
                                </div>
                                <span class="flex-1">سحب نقدي</span>
                            </button>
                            
                            <button @click="showFinanceMenu=false;openDebtPaymentModal()" 
                                    class="w-full text-right px-4 py-3 hover:bg-blue-50 text-gray-700 flex items-center gap-3 text-sm md:text-base transition-colors">
                                <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-hand-holding-heart text-green-500 text-sm"></i>
                                </div>
                                <span class="flex-1">سداد دين</span>
                            </button>
                            
                            <hr class="border-slate-100">
                            
                            <button @click="showFinanceMenu=false;loadShift()" 
                                    class="w-full text-right px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold flex items-center gap-3 text-sm md:text-base transition-colors">
                                <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-door-closed text-red-600 text-sm"></i>
                                </div>
                                <span class="flex-1">إنهاء الوردية</span>
                            </button>
                        </div>
                    </transition>
                </div>

                <div v-if="currentUser" class="hidden lg:block bg-white/10 backdrop-blur-sm rounded-xl px-3 md:px-4 py-1.5 md:py-2 text-right border border-white/20">
                    <div class="font-bold text-xs md:text-sm">{{ currentUser.name }}</div>
                    <div class="text-[10px] text-blue-200">{{ currentUser.branch?.name || '' }}</div>
                </div>
                <button @click="logout" class="bg-red-600 hover:bg-red-700 rounded-xl px-2.5 md:px-4 py-2 md:py-2.5 shadow-lg transition">
                    <i class="fas fa-sign-out-alt text-base md:text-lg"></i>
                </button>
            </div>
        </div>
    </nav>

    <!-- شريط تقدم المزامنة -->
    <div v-if="syncProgress.active" class="bg-blue-50 border-b-2 border-blue-300 shadow-sm px-3 md:px-6 py-2 md:py-3">
        <div class="flex items-center gap-2 md:gap-3">
            <i class="fas fa-sync-alt fa-spin text-blue-600 text-base md:text-xl"></i>
            <div class="flex-1">
                <div class="flex items-center justify-between mb-1 gap-2">
                    <span class="font-bold text-blue-900 text-xs md:text-sm truncate">جاري المزامنة...</span>
                    <span class="text-[10px] md:text-xs font-mono text-blue-700 bg-white px-2 py-0.5 rounded flex-shrink-0">
                        {{ syncProgress.current }} / {{ syncProgress.total }}
                    </span>
                </div>
                <div class="w-full bg-blue-100 rounded-full h-1.5 md:h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300"
                         :style="{ width: (syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0) + '%' }">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="!isOnline" class="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-2 md:p-3 mx-3 md:mx-6 mt-2 rounded shadow-sm flex items-center gap-2 text-sm md:text-base">
        <i class="fas fa-wifi-slash"></i> النظام يعمل حالياً بدون اتصال بالإنترنت
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         شريط التبويبات (للموبايل والتابلت فقط)
         ═══════════════════════════════════════════════════════════ -->
    <div class="lg:hidden sticky top-[56px] md:top-[68px] z-30 bg-white border-b-2 border-slate-200 shadow-sm">
        <div class="flex">
            <button 
                @click="activeTab='recent'"
                class="flex-1 py-3 px-2 text-center font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 sm:gap-2"
                :class="activeTab === 'recent' ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50' : 'text-slate-500 hover:bg-slate-50'"
            >
                <i class="fas fa-history"></i>
                <span>الأخيرة</span>
                <span v-if="offlineSalesCount > 0" class="bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {{ offlineSalesCount }}
                </span>
            </button>
            <button 
                @click="activeTab='search'"
                class="flex-1 py-3 px-2 text-center font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 sm:gap-2"
                :class="activeTab === 'search' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'"
            >
                <i class="fas fa-search"></i>
                <span>البحث</span>
            </button>
            <button 
                @click="activeTab='cart'"
                class="flex-1 py-3 px-2 text-center font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 sm:gap-2 relative"
                :class="activeTab === 'cart' ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-50'"
            >
                <i class="fas fa-shopping-cart"></i>
                <span>السلة</span>
                <span v-if="cart.length > 0" class="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {{ cart.length }}
                </span>
            </button>
        </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         المحتوى الرئيسي
         ═══════════════════════════════════════════════════════════ -->
    <div class="flex-1 overflow-hidden p-2 sm:p-3 md:p-4 lg:p-6 bg-slate-100">
        
        <!-- تخطيط الكمبيوتر: 3 أعمدة -->
        <div class="hidden lg:flex gap-6 h-[calc(100vh-180px)]">

            <aside class="w-1/5 min-w-[200px] bg-white rounded-2xl shadow-lg border border-slate-200 p-4 overflow-y-auto">
                <div v-if="offlineSalesCount > 0" class="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                    <i class="fas fa-clock"></i> {{ offlineSalesCount }} فاتورة بانتظار المزامنة
                </div>
                <div v-if="pendingRefundsCount > 0" class="bg-red-50 border border-red-200 text-red-700 p-2 rounded mb-2 flex items-center gap-2 text-sm">
                    <i class="fas fa-undo-alt"></i> {{ pendingRefundsCount }} إرجاع بانتظار المزامنة
                </div>
                <h3 class="font-bold text-slate-700 mb-4 border-b pb-2 flex items-center gap-2">
                    <i class="fas fa-history text-blue-500"></i> آخر المبيعات
                </h3>
                <div v-for="sale in recentSales" :key="sale.id" class="p-3 border-b hover:bg-slate-50 rounded-lg transition">
                    <div class="flex justify-between items-center gap-2">
                        <div class="min-w-0 flex-1">
                            <p class="text-xs text-slate-500 truncate">#{{ sale.id }} - {{ sale.created_at?.substring(0, 10) }}</p>
                            <p class="text-emerald-600 font-bold">{{ sale.total_amount }} ج.س</p>
                        </div>
                        <button @click="viewSaleDetails(sale)" class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 whitespace-nowrap flex-shrink-0">
                            {{ sale.is_refunded ? 'تفاصيل' : 'تفاصيل / إرجاع' }}
                        </button>
                    </div>
                    <span v-if="sale.is_refunded" class="text-xs text-gray-400 font-bold italic">تم الإرجاع</span>
                </div>
                <div v-if="recentSales.length === 0" class="text-center text-slate-400 py-8">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p class="text-sm">لا توجد مبيعات حديثة</p>
                </div>
            </aside>

            <main class="flex-1 flex flex-col gap-4 min-w-0">
                <div class="flex gap-3 items-stretch">
                    <div class="relative flex-1 min-w-0">
                        <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <i class="fas fa-search text-slate-400"></i>
                        </div>
                        <input 
                            type="text" 
                            v-model="search" 
                            placeholder="ابحث عن دواء بالاسم أو الباركود..." 
                            ref="searchInput"
                            @keydown.enter.prevent="handleBarcodeSearch"
                            class="w-full p-4 pr-12 rounded-2xl border-2 border-blue-300 shadow-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-center text-lg bg-white transition"
                        >
                        <div v-if="search.trim() && filteredMedicines.length > 0" 
                             class="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto z-30">
                            <div v-for="med in filteredMedicines" :key="med.id" class="p-4 hover:bg-blue-50 transition border-b border-slate-100 last:border-b-0">
                                <div class="flex justify-between items-start mb-2 gap-2">
                                    <div class="min-w-0 flex-1">
                                        <h4 class="font-bold text-slate-800 text-base truncate">{{ med.name }}</h4>
                                        <p v-if="med.scientific_name" class="text-xs text-slate-500 truncate">{{ med.scientific_name }}</p>
                                    </div>
                                    <span class="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                                        متبقي: <span class="font-semibold text-emerald-600">{{ med.batches[0]?.remaining_quantity || 0 }}</span>
                                    </span>
                                </div>
                                <div v-if="med.batches && med.batches[0] && med.batches[0].prices" class="flex flex-wrap gap-2 mt-2">
                                    <button 
                                        v-for="priceRecord in med.batches[0].prices" 
                                        :key="priceRecord.id"
                                        @click.stop="addToCart(med, priceRecord); search = ''"
                                        class="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 text-xs font-bold px-4 py-1.5 rounded-full transition flex items-center gap-2 shadow-sm"
                                    >
                                        <span>{{ priceRecord.unit?.name || 'وحدة' }}</span>
                                        <span class="bg-white/80 text-emerald-900 px-2 py-0.5 rounded-full text-[10px]">
                                            {{ priceRecord.sell_price }} ج.س
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        @click="openPhoneScanner"
                        class="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl px-5 shadow-lg transition-all hover:scale-105 flex items-center gap-2 font-bold flex-shrink-0 self-stretch"
                        title="استخدم هاتفك كجهاز باركود"
                    >
                        <i class="fas fa-mobile-alt text-2xl"></i>
                        <span>مسح بالهاتف</span>
                    </button>
                </div>

                <div v-if="!search.trim()" class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 flex-1 flex items-center justify-center text-slate-400">
                    <div class="text-center">
                        <i class="fas fa-prescription text-6xl text-blue-200 mb-3"></i>
                        <p>ابحث عن دواء وأضفه إلى الفاتورة</p>
                    </div>
                </div>
            </main>

            <aside class="w-1/3 min-w-[280px] bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col">
                <div class="p-4 border-b bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-2xl flex justify-between items-center">
                    <span class="font-bold text-slate-700 text-lg flex items-center gap-2">
                        <i class="fas fa-shopping-cart text-emerald-600"></i> 
                        سلة التسوق
                        <span v-if="cart.length > 0" class="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {{ cart.length }}
                        </span>
                    </span>
                    <button @click="clearCart" v-if="cart.length > 0" class="text-xs text-red-500 hover:text-red-700 hover:underline transition">
                        <i class="fas fa-trash-alt"></i> إفراغ
                    </button>
                </div>

                <div v-if="cartStockIssues.length > 0" class="m-3 p-3 bg-red-50 border-2 border-red-300 rounded-xl">
                    <div class="flex items-start gap-2 text-red-800 text-xs">
                        <i class="fas fa-exclamation-triangle mt-0.5 text-red-600"></i>
                        <div>
                            <div class="font-bold mb-1">مشاكل مخزون في السلة</div>
                            <ul class="list-disc list-inside space-y-0.5">
                                <li v-for="(issue, i) in cartStockIssues" :key="i">
                                    {{ issue.name }} — {{ issue.reason }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="flex-1 p-4 overflow-y-auto">
                    <div 
                        v-for="(item, index) in cart" 
                        :key="index"
                        class="flex justify-between items-center py-3 border-b border-slate-100 transition rounded-lg"
                        :class="{ 'bg-red-50 border-red-200': itemHasStockIssue(item) }"
                    >
                        <div class="flex-1 min-w-0 pr-2">
                            <p class="font-bold text-sm text-slate-700 truncate">
                                {{ item.name }} 
                                <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{{ item.unit }}</span>
                                <i v-if="itemHasStockIssue(item)" class="fas fa-exclamation-circle text-red-500 ml-1"></i>
                            </p>
                            <div class="flex items-center gap-2 mt-1">
                                <button @click="updateQuantity(index, -1)" class="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-full hover:bg-slate-300 transition">−</button>
                                <span class="text-sm font-bold w-8 text-center">{{ item.quantity }}</span>
                                <button @click="updateQuantity(index, 1)" class="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-full hover:bg-slate-300 transition">+</button>
                            </div>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <p class="font-bold text-emerald-700 whitespace-nowrap">{{ (item.selling_price * item.quantity).toFixed(2) }} ج.س</p>
                            <button @click="removeFromCart(index)" class="text-red-400 hover:text-red-600 text-[10px] transition">
                                <i class="fas fa-times-circle"></i> حذف
                            </button>
                        </div>
                    </div>
                    <div v-if="cart.length === 0" class="text-center text-slate-400 py-10">
                        <i class="fas fa-box-open text-4xl mb-2"></i>
                        <p>السلة فارغة</p>
                    </div>
                </div>

                <div class="p-4 border-t bg-slate-50 rounded-b-2xl">
                    <div class="mb-4 flex items-center justify-between flex-wrap gap-2">
                        <span class="text-sm font-medium">طريقة التحصيل:</span>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-1 text-sm cursor-pointer">
                                <input type="radio" value="cash" v-model="payment.method" @change="changePaymentMethod">
                                نقدي
                            </label>
                            <label class="flex items-center gap-1 text-sm cursor-pointer">
                                <input type="radio" value="bank" v-model="payment.method" @change="changePaymentMethod">
                                بنكي
                            </label>
                        </div>
                    </div>
                    <div v-if="payment.method==='bank' && payment.bank.reference_number" 
                         class="mb-3 text-green-700 bg-green-100 rounded-lg p-2 text-sm flex items-center gap-2">
                        <i class="fas fa-university"></i>
                        <span class="truncate">{{ payment.bank.bank_name }} - {{ payment.bank.reference_number }}</span>
                    </div>
                    <div class="flex justify-between text-2xl font-bold mb-4">
                        <span>الإجمالي:</span>
                        <span class="text-emerald-700">{{ cartTotal.toFixed(2) }} ج.س</span>
                    </div>
                    <button 
                        :disabled="cart.length === 0 || cartStockIssues.length > 0 || savingSale" 
                        @click="checkout" 
                        class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                    >
                        <i :class="savingSale ? 'fas fa-spinner fa-spin' : 'fas fa-check-circle'"></i>
                        {{ savingSale ? 'جاري حفظ الفاتورة...' : 'إتمام الدفع' }}
                    </button>
                    <div v-if="cartStockIssues.length > 0" class="mt-2 text-xs text-red-600 text-center">
                        <i class="fas fa-info-circle"></i> لا يمكن إتمام البيع — راجع مشاكل المخزون
                    </div>
                </div>
            </aside>
        </div>

        <!-- تخطيط الموبايل والتابلت -->
        <div class="lg:hidden h-[calc(100dvh-160px)]">

            <div 
                v-show="activeTab === 'recent'"
                class="bg-white rounded-2xl shadow-lg border border-slate-200 p-3 sm:p-4 h-full overflow-y-auto"
            >
                <div v-if="offlineSalesCount > 0" class="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-xl mb-3 text-sm flex items-center gap-2">
                    <i class="fas fa-clock"></i> {{ offlineSalesCount }} فاتورة بانتظار المزامنة
                </div>
                <div v-if="pendingRefundsCount > 0" class="bg-red-50 border border-red-200 text-red-700 p-2 rounded mb-3 flex items-center gap-2 text-sm">
                    <i class="fas fa-undo-alt"></i> {{ pendingRefundsCount }} إرجاع بانتظار المزامنة
                </div>
                <h3 class="font-bold text-slate-700 mb-3 border-b pb-2 flex items-center gap-2">
                    <i class="fas fa-history text-blue-500"></i> آخر المبيعات
                </h3>
                <div v-for="sale in recentSales" :key="sale.id" class="p-3 border-b border-slate-100 hover:bg-slate-50 rounded-lg transition">
                    <div class="flex justify-between items-center gap-2">
                        <div class="min-w-0 flex-1">
                            <p class="text-xs text-slate-500 truncate">#{{ sale.id }} - {{ sale.created_at?.substring(0, 10) }}</p>
                            <p class="text-emerald-600 font-bold">{{ sale.total_amount }} ج.س</p>
                        </div>
                        <button @click="viewSaleDetails(sale)" class="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-200 whitespace-nowrap flex-shrink-0">
                            {{ sale.is_refunded ? 'تفاصيل' : 'تفاصيل / إرجاع' }}
                        </button>
                    </div>
                    <span v-if="sale.is_refunded" class="text-[10px] text-gray-400 font-bold italic">تم الإرجاع</span>
                </div>
                <div v-if="recentSales.length === 0" class="text-center text-slate-400 py-12">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p class="text-sm">لا توجد مبيعات حديثة</p>
                </div>
            </div>

            <div 
                v-show="activeTab === 'search'"
                class="flex flex-col gap-3 h-full"
            >
                <div class="flex gap-2 items-stretch flex-shrink-0">
                    <div class="relative flex-1 min-w-0">
                        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <i class="fas fa-search text-slate-400"></i>
                        </div>
                        <input 
                            type="text" 
                            v-model="search" 
                            placeholder="ابحث عن دواء..." 
                            ref="searchInput"
                            @keydown.enter.prevent="handleBarcodeSearch"
                            class="w-full p-3.5 pr-10 rounded-2xl border-2 border-blue-300 shadow-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-center text-base bg-white transition"
                        >
                    </div>
                    <button
                        @click="openPhoneScanner"
                        class="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl px-3 sm:px-4 shadow-lg transition flex items-center gap-2 font-bold flex-shrink-0 self-stretch"
                        title="مسح بالهاتف"
                    >
                        <i class="fas fa-mobile-alt text-xl sm:text-2xl"></i>
                    </button>
                </div>

                <div class="flex-1 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-y-auto">
                    <template v-if="search.trim() && filteredMedicines.length > 0">
                        <div v-for="med in filteredMedicines" :key="med.id" class="p-3 sm:p-4 hover:bg-blue-50 transition border-b border-slate-100 last:border-b-0">
                            <div class="flex justify-between items-start mb-2 gap-2">
                                <div class="min-w-0 flex-1">
                                    <h4 class="font-bold text-slate-800 text-sm sm:text-base truncate">{{ med.name }}</h4>
                                    <p v-if="med.scientific_name" class="text-[10px] sm:text-xs text-slate-500 truncate">{{ med.scientific_name }}</p>
                                </div>
                                <span class="text-[10px] sm:text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                                    متبقي: <span class="font-semibold text-emerald-600">{{ med.batches[0]?.remaining_quantity || 0 }}</span>
                                </span>
                            </div>
                            <div v-if="med.batches && med.batches[0] && med.batches[0].prices" class="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                <button 
                                    v-for="priceRecord in med.batches[0].prices" 
                                    :key="priceRecord.id"
                                    @click.stop="addToCart(med, priceRecord); search = ''"
                                    class="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full transition flex items-center gap-1.5 shadow-sm"
                                >
                                    <span>{{ priceRecord.unit?.name || 'وحدة' }}</span>
                                    <span class="bg-white/80 text-emerald-900 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px]">
                                        {{ priceRecord.sell_price }} ج.س
                                    </span>
                                </button>
                            </div>
                        </div>
                    </template>
                    <template v-else-if="search.trim() && filteredMedicines.length === 0">
                        <div class="text-center text-slate-400 py-12">
                            <i class="fas fa-search-minus text-4xl mb-3"></i>
                            <p class="text-sm">لا توجد نتائج مطابقة</p>
                        </div>
                    </template>
                    <template v-else>
                        <div class="text-center text-slate-400 py-12">
                            <i class="fas fa-prescription text-5xl sm:text-6xl text-blue-200 mb-3"></i>
                            <p class="text-sm sm:text-base">ابحث عن دواء وأضفه إلى الفاتورة</p>
                            <p class="text-[10px] sm:text-xs mt-2 text-slate-300">أو استخدم زر "مسح بالهاتف"</p>
                        </div>
                    </template>
                </div>
            </div>

            <div 
                    v-show="activeTab === 'cart'"
                    class="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col h-full max-h-[calc(100dvh-180px)]"
                >
                <div class="p-3 sm:p-4 border-b bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-2xl flex justify-between items-center">
                    <span class="font-bold text-slate-700 text-base sm:text-lg flex items-center gap-2">
                        <i class="fas fa-shopping-cart text-emerald-600"></i> 
                        سلة التسوق
                        <span v-if="cart.length > 0" class="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {{ cart.length }}
                        </span>
                    </span>
                    <button @click="clearCart" v-if="cart.length > 0" class="text-xs text-red-500 hover:text-red-700 hover:underline transition">
                        <i class="fas fa-trash-alt"></i> إفراغ
                    </button>
                </div>

                <div v-if="cartStockIssues.length > 0" class="m-2 sm:m-3 p-2 sm:p-3 bg-red-50 border-2 border-red-300 rounded-xl">
                    <div class="flex items-start gap-2 text-red-800 text-[10px] sm:text-xs">
                        <i class="fas fa-exclamation-triangle mt-0.5 text-red-600"></i>
                        <div>
                            <div class="font-bold mb-1">مشاكل مخزون في السلة</div>
                            <ul class="list-disc list-inside space-y-0.5">
                                <li v-for="(issue, i) in cartStockIssues" :key="i">
                                    {{ issue.name }} — {{ issue.reason }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="flex-1 min-h-0 p-2 sm:p-4 overflow-y-auto">
                    <div 
                        v-for="(item, index) in cart" 
                        :key="index"
                        class="flex justify-between items-center py-2.5 sm:py-3 px-2 border-b border-slate-100 transition rounded-lg"
                        :class="{ 'bg-red-50 border-red-200': itemHasStockIssue(item) }"
                    >
                        <div class="flex-1 min-w-0 pr-2">
                            <p class="font-bold text-xs sm:text-sm text-slate-700 truncate">
                                {{ item.name }} 
                                <span class="text-[10px] sm:text-xs bg-slate-100 text-slate-600 px-1.5 sm:px-2 py-0.5 rounded-full">{{ item.unit }}</span>
                                <i v-if="itemHasStockIssue(item)" class="fas fa-exclamation-circle text-red-500 ml-1"></i>
                            </p>
                            <div class="flex items-center gap-1.5 sm:gap-2 mt-1">
                                <button @click="updateQuantity(index, -1)" class="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center bg-slate-200 rounded-full hover:bg-slate-300 transition text-base sm:text-sm font-bold">−</button>
                                <span class="text-sm font-bold w-8 text-center">{{ item.quantity }}</span>
                                <button @click="updateQuantity(index, 1)" class="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center bg-slate-200 rounded-full hover:bg-slate-300 transition text-base sm:text-sm font-bold">+</button>
                            </div>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <p class="font-bold text-emerald-700 text-sm sm:text-base whitespace-nowrap">{{ (item.selling_price * item.quantity).toFixed(2) }} ج.س</p>
                            <button @click="removeFromCart(index)" class="text-red-400 hover:text-red-600 text-[10px] transition">
                                <i class="fas fa-times-circle"></i> حذف
                            </button>
                        </div>
                    </div>
                    <div v-if="cart.length === 0" class="text-center text-slate-400 py-12">
                        <i class="fas fa-box-open text-4xl mb-3"></i>
                        <p class="text-sm sm:text-base">السلة فارغة</p>
                        <button 
                            @click="activeTab='search'"
                            class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition"
                        >
                            <i class="fas fa-search"></i> ابحث عن دواء
                        </button>
                    </div>
                </div>

                <div class="p-3 sm:p-4 border-t bg-slate-50 rounded-b-2xl flex-shrink-0">
                    <div class="mb-3 flex items-center justify-between flex-wrap gap-2">
                        <span class="text-xs sm:text-sm font-medium">طريقة التحصيل:</span>
                        <div class="flex gap-3 sm:gap-4">
                            <label class="flex items-center gap-1 text-xs sm:text-sm cursor-pointer">
                                <input type="radio" value="cash" v-model="payment.method" @change="changePaymentMethod">
                                نقدي
                            </label>
                            <label class="flex items-center gap-1 text-xs sm:text-sm cursor-pointer">
                                <input type="radio" value="bank" v-model="payment.method" @change="changePaymentMethod">
                                بنكي
                            </label>
                        </div>
                    </div>
                    <div v-if="payment.method==='bank' && payment.bank.reference_number" 
                         class="mb-2 sm:mb-3 text-green-700 bg-green-100 rounded-lg p-2 text-[10px] sm:text-sm flex items-center gap-2">
                        <i class="fas fa-university"></i>
                        <span class="truncate">{{ payment.bank.bank_name }} - {{ payment.bank.reference_number }}</span>
                    </div>
                    <div class="flex justify-between text-lg sm:text-2xl font-bold mb-3 sm:mb-4">
                        <span>الإجمالي:</span>
                        <span class="text-emerald-700">{{ cartTotal.toFixed(2) }} ج.س</span>
                    </div>
                    <button 
                        :disabled="cart.length === 0 || cartStockIssues.length > 0 || savingSale" 
                        @click="checkout" 
                        class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                    >
                        <i :class="savingSale ? 'fas fa-spinner fa-spin' : 'fas fa-check-circle'"></i>
                        {{ savingSale ? 'جاري الحفظ...' : 'إتمام الدفع' }}
                    </button>
                    <div v-if="cartStockIssues.length > 0" class="mt-2 text-[10px] sm:text-xs text-red-600 text-center">
                        <i class="fas fa-info-circle"></i> راجع مشاكل المخزون
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- زر السلة العائم -->
    <button 
        v-if="cart.length > 0 && activeTab !== 'cart'"
        @click="activeTab='cart'"
        class="lg:hidden fixed bottom-4 left-4 z-40 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-full shadow-2xl px-4 sm:px-5 py-3 flex items-center gap-2 sm:gap-3 font-bold hover:scale-105 transition-transform"
    >
        <div class="relative">
            <i class="fas fa-shopping-cart text-lg sm:text-xl"></i>
            <span class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {{ cart.length }}
            </span>
        </div>
        <span class="text-xs sm:text-sm">{{ cartTotal.toFixed(2) }} ج.س</span>
    </button>

    <!-- ═══════════════════════════════════════════════════════════
         المودالات
         ═══════════════════════════════════════════════════════════ -->

    <!-- مودال اختيار الدفعة -->
    <div v-if="showBatchSelector" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99998] flex items-center justify-center p-3 sm:p-4">
        <div class="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
            <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-5 flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-exclamation-triangle text-amber-600 text-lg"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-amber-900 text-sm sm:text-base">تنبيه: هذا الدواء له أسعار متعددة</h3>
                    <p class="text-xs sm:text-sm text-amber-800 mt-1">
                        يوجد دفعات بنفس الدواء بأسعار مختلفة. اختر الدفعة الصحيحة.
                    </p>
                </div>
            </div>

            <div class="mb-3 sm:mb-4 pb-3 border-b border-slate-200">
                <h2 class="text-lg sm:text-xl font-bold text-slate-800">{{ pendingBatchMedicine?.name }}</h2>
                <p class="text-xs sm:text-sm text-slate-500 mt-1">{{ availableBatches.length }} دفعة متاحة</p>
            </div>

            <div class="space-y-3 max-h-[50vh] overflow-y-auto">
                <div v-for="(batch, idx) in availableBatches" :key="batch.id" @click="selectBatch(batch)"
                     class="border-2 rounded-2xl p-3 sm:p-4 cursor-pointer transition relative overflow-hidden"
                     :class="{
                         'border-purple-400 bg-purple-50/60 hover:border-purple-600': batch.is_locked,
                         'border-red-200 bg-red-50/40 hover:border-red-500': !batch.is_locked && batch.expires_in_days !== null && batch.expires_in_days <= 30,
                         'border-slate-200 hover:border-blue-500 hover:bg-blue-50': !batch.is_locked && (batch.expires_in_days === null || batch.expires_in_days > 30),
                     }">
                    <div v-if="batch.is_locked" class="absolute top-0 right-0 bottom-0 w-1.5 bg-gradient-to-b from-purple-500 to-purple-600"></div>
                    <div class="flex justify-between items-start mb-2 gap-2">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-mono px-2 py-1 rounded">#{{ batch.batch_number || batch.id }}</span>
                            <span v-if="batch.is_locked" class="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <i class="fas fa-lock text-[8px]"></i> سعر مقفل
                            </span>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <div class="text-xl sm:text-2xl font-black" :class="batch.is_locked ? 'text-purple-700' : 'text-emerald-600'">{{ batch.sell_price }}</div>
                            <div class="text-[10px] text-slate-500">ج.س / {{ batch.unit_name }}</div>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
                        <div>
                            <div class="text-slate-500">المتبقي</div>
                            <div class="font-bold text-slate-700">{{ batch.remaining_packs }} {{ batch.unit_name }}</div>
                        </div>
                        <div>
                            <div class="text-slate-500">الصلاحية</div>
                            <div class="font-bold" :class="batch.expires_in_days <= 30 ? 'text-red-600' : 'text-slate-700'">
                                <span v-if="batch.expires_in_days === null">—</span>
                                <span v-else-if="batch.expires_in_days < 0">منتهية!</span>
                                <span v-else>{{ Math.floor(batch.expires_in_days) }} يوم</span>
                            </div>
                        </div>
                        <div>
                            <div class="text-slate-500">سعر الشراء</div>
                            <div class="font-bold text-slate-700">{{ batch.buy_price }}</div>
                        </div>
                    </div>
                    <div v-if="batch.is_locked && batch.lock_reason" class="mt-3 pt-3 border-t border-purple-200 text-[10px] sm:text-[11px] text-purple-800 flex items-start gap-1.5">
                        <i class="fas fa-info-circle mt-0.5"></i>
                        <span>سبب القفل: {{ batch.lock_reason }}</span>
                    </div>
                </div>
            </div>

            <div class="flex gap-2 sm:gap-3 mt-5 sm:mt-6 pt-4 border-t border-slate-200">
                <button @click="closeBatchSelector" class="flex-1 py-2.5 sm:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-sm sm:text-base">
                    <i class="fas fa-times"></i> إلغاء
                </button>
                <button @click="selectFirstBatchFifo" class="flex-1 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition text-sm sm:text-base">
                    <i class="fas fa-clock"></i> الأقدم (FIFO)
                </button>
            </div>
        </div>
    </div>

    <!-- مودال إغلاق الوردية -->
    <div v-if="showCloseShift" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-3 sm:p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-4 sm:p-6 border-t-4 border-red-500 max-h-[95vh] overflow-y-auto">
            <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center flex items-center justify-center gap-2">
                <i class="fas fa-door-closed text-red-500"></i> إغلاق الوردية
            </h2>
            <div class="space-y-2 sm:space-y-3 text-sm sm:text-lg">
                <div class="flex justify-between"><span>الرصيد الافتتاحي</span><b>{{ Number(shift.opening_cash || 0).toLocaleString() }}</b></div>
                <div class="flex justify-between text-green-600"><span>المبيعات النقدية</span><b>+ {{ Number((shift.cash_sales || 0) - (shift.debts_amount || 0)).toLocaleString() }}</b></div>
                <div class="flex justify-between text-green-600"><span>سداد الديون</span><b>+ {{ Number(shift.debts_amount || 0).toLocaleString() }}</b></div>
                <div class="flex justify-between text-red-600"><span>السحوبات</span><b>- {{ Number(shift.withdraw_amount || 0).toLocaleString() }}</b></div>
                <div class="flex justify-between text-red-600"><span>المصروفات</span><b>- {{ Number(shift.expenses_amount || 0).toLocaleString() }}</b></div>
                <div class="flex justify-between text-red-600"><span>المرتجعات</span><b>- {{ Number(shift.refund_amount || 0).toLocaleString() }}</b></div>
                <hr class="my-3">
                <div class="flex justify-between text-lg sm:text-xl font-bold">
                    <span>الرصيد المحاسبي</span>
                    <span :class="accountingBalance>=0 ? 'text-emerald-600' : 'text-red-600'">
                        {{ accountingBalance.toLocaleString() }}
                    </span>
                </div>
            </div>
            <div class="mt-4 sm:mt-6">
                <label class="block mb-2 font-semibold text-sm sm:text-base">💵 الرصيد الفعلي بعد عدّ الدرج</label>
                <input v-model="closingCash" type="number" class="w-full border-2 rounded-xl p-3 text-center text-lg sm:text-xl focus:ring-2 focus:ring-blue-200 outline-none">
            </div>
            <div class="mt-4 sm:mt-6 rounded-xl p-3 sm:p-4" 
                 :class="closingCash === '' || closingCash === null ? 'bg-gray-100' : difference == 0 ? 'bg-green-100' : difference < 0 ? 'bg-red-100' : 'bg-yellow-100'">
                <template v-if="closingCash === '' || closingCash === null">
                    <div class="text-gray-600 text-sm sm:text-lg font-bold">أدخل الرصيد الفعلي لحساب العجز أو الزيادة</div>
                </template>
                <template v-else-if="difference == 0">
                    <div class="text-green-700 text-base sm:text-xl font-bold flex items-center gap-2"><i class="fas fa-check-circle"></i> الصندوق مطابق</div>
                </template>
                <template v-else-if="difference < 0">
                    <div class="text-red-700 text-base sm:text-xl font-bold flex items-center gap-2"><i class="fas fa-exclamation-triangle"></i> عجز {{ Math.abs(difference).toLocaleString() }} جنيه</div>
                </template>
                <template v-else>
                    <div class="text-yellow-700 text-base sm:text-xl font-bold flex items-center gap-2"><i class="fas fa-coins"></i> زيادة {{ difference.toLocaleString() }} جنيه</div>
                </template>
            </div>
            <div class="flex gap-2 sm:gap-3 mt-6 sm:mt-8">
                <button @click="confirmCloseShift" class="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-bold transition text-sm sm:text-base">إنهاء الوردية</button>
                <button @click="showCloseShift=false" class="flex-1 bg-gray-300 hover:bg-gray-400 rounded-xl py-3 font-bold transition text-sm sm:text-base">إلغاء</button>
            </div>
        </div>
    </div>

    <!-- مودال إضافة مصروف -->
    <div v-if="showExpenseModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-3 sm:p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 border-t-4 border-amber-500 max-h-[95vh] overflow-y-auto">
            <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center flex items-center justify-center gap-2">
                <i class="fas fa-receipt text-amber-500"></i> إضافة مصروف
            </h2>
            <div class="space-y-3 sm:space-y-4">
                <input v-model="expense.title" type="text" placeholder="اسم المصروف" class="w-full border rounded-xl p-3 focus:ring-2 focus:ring-amber-200 outline-none text-sm sm:text-base">
                <input v-model="expense.amount" type="number" placeholder="المبلغ" class="w-full border rounded-xl p-3 focus:ring-2 focus:ring-amber-200 outline-none text-sm sm:text-base">
                <textarea v-model="expense.notes" placeholder="ملاحظات" rows="3" class="w-full border rounded-xl p-3 focus:ring-2 focus:ring-amber-200 outline-none text-sm sm:text-base"></textarea>
                <div class="flex justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                    <button @click="showExpenseModal=false" class="px-4 sm:px-6 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 transition font-bold text-sm sm:text-base">إلغاء</button>
                    <button @click="saveExpense" :disabled="expenseLoading" 
                            class="px-4 sm:px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition font-bold disabled:bg-gray-400 text-sm sm:text-base">
                        {{ expenseLoading ? 'جاري الحفظ...' : 'حفظ' }}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- مودال التحويل البنكي -->
    <div v-if="showBankModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-3 sm:p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 border-t-4 border-blue-500 max-h-[95vh] overflow-y-auto">
            <h3 class="font-bold text-base sm:text-lg mb-4 flex items-center gap-2"><i class="fas fa-university text-blue-500"></i> بيانات التحويل البنكي</h3>
            <div class="space-y-3 sm:space-y-4">
                <div><label class="block mb-1 text-xs sm:text-sm">البنك</label><input v-model="payment.bank.bank_name" class="w-full border rounded-xl p-2 focus:ring-2 focus:ring-blue-200 outline-none text-sm sm:text-base" placeholder="بنك الخرطوم"></div>
                <div><label class="block mb-1 text-xs sm:text-sm">رقم التحويل</label><input v-model="payment.bank.reference_number" class="w-full border rounded-xl p-2 focus:ring-2 focus:ring-blue-200 outline-none text-sm sm:text-base"></div>
                <div><label class="block mb-1 text-xs sm:text-sm">تاريخ التحويل</label><input type="date" v-model="payment.bank.transfer_date" class="w-full border rounded-xl p-2 focus:ring-2 focus:ring-blue-200 outline-none text-sm sm:text-base"></div>
                <div><label class="block mb-1 text-xs sm:text-sm">المبلغ</label><input type="number" v-model="payment.bank.amount" class="w-full border rounded-xl p-2 bg-gray-100 text-sm sm:text-base" readonly></div>
                <div><label class="block mb-1 text-xs sm:text-sm">ملاحظات</label><textarea rows="3" v-model="payment.bank.notes" class="w-full border rounded-xl p-2 focus:ring-2 focus:ring-blue-200 outline-none text-sm sm:text-base"></textarea></div>
            </div>
            <div class="flex justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button @click="closeBankModal" class="px-4 sm:px-6 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 transition font-bold text-sm sm:text-base">إلغاء</button>
                <button @click="saveBankPayment" class="px-4 sm:px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition font-bold text-sm sm:text-base">حفظ</button>
            </div>
        </div>
    </div>

    <!-- مودال سداد دين -->
    <div v-if="showDebtPaymentModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-3 sm:p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 border-t-4 border-blue-500 max-h-[90vh] overflow-y-auto">
            <h2 class="text-lg sm:text-2xl font-bold mb-4 sm:mb-5 flex items-center gap-2">
                <i class="fas fa-hand-holding-heart text-blue-500"></i> سداد دين
            </h2>

            <div class="mb-4 sm:mb-5">
                <div class="flex items-center justify-between mb-3">
                    <label class="block text-xs sm:text-sm font-bold text-slate-700">الديون المتاحة</label>
                    <span v-if="!loadingDebts" class="text-[10px] sm:text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full font-bold">
                        {{ pendingDebts.length }} دين
                    </span>
                </div>

                <div v-if="loadingDebts" class="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 text-center text-slate-500 text-xs sm:text-sm">
                    <i class="fas fa-spinner fa-spin ml-1"></i> جاري تحميل الديون...
                </div>

                <div v-else-if="pendingDebts.length === 0" class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <i class="fas fa-check-circle text-emerald-600 text-2xl mb-2 block"></i>
                    <div class="font-bold text-emerald-800 text-xs sm:text-sm">لا توجد ديون معلقة</div>
                    <div class="text-[10px] sm:text-xs text-emerald-600 mt-1">كل ديونك مسدّدة</div>
                </div>

                <div v-else class="space-y-2 max-h-52 sm:max-h-64 overflow-y-auto">
                    <div @click="selectedDebtId = null"
                        class="p-2.5 sm:p-3 border-2 rounded-xl cursor-pointer transition-all"
                        :class="selectedDebtId === null ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'">
                        <div class="flex items-center gap-3">
                            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                :class="selectedDebtId === null ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'">
                                <i v-if="selectedDebtId === null" class="fas fa-check text-white text-xs"></i>
                            </div>
                            <div class="flex-1">
                                <div class="font-bold text-xs sm:text-sm text-slate-800">
                                    <i class="fas fa-magic text-emerald-600"></i> توزيع تلقائي (FIFO)
                                </div>
                                <div class="text-[10px] sm:text-xs text-slate-500 mt-0.5">سداد الأقدم تلقائياً حسب الترتيب</div>
                            </div>
                        </div>
                    </div>

                    <div v-for="d in pendingDebts" :key="d.id" @click="selectedDebtId = d.id"
                        class="p-2.5 sm:p-3 border-2 rounded-xl cursor-pointer transition-all"
                        :class="selectedDebtId === d.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'">
                        <div class="flex items-start gap-3">
                            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                                :class="selectedDebtId === d.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'">
                                <i v-if="selectedDebtId === d.id" class="fas fa-check text-white text-xs"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded"
                                        :class="d.source === 'employee' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">
                                        {{ d.source_label }}
                                    </span>
                                    <span class="text-[10px] text-slate-400 font-mono">#{{ d.id }}</span>
                                </div>
                                <div v-if="d.notes" class="text-[10px] sm:text-xs text-slate-500 mt-1 truncate">{{ d.notes }}</div>
                                <div class="text-[10px] text-slate-400 mt-1">{{ d.created_at?.substring(0, 16).replace('T', ' ') }}</div>
                            </div>
                            <div class="text-left flex-shrink-0">
                                <div class="font-bold text-rose-600 text-xs sm:text-sm font-mono">{{ d.remaining_amount.toLocaleString() }}</div>
                                <div class="text-[10px] text-slate-400 font-mono">من {{ d.total_amount.toLocaleString() }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-3 pt-4 border-t border-slate-200">
                <div>
                    <label class="block text-[10px] sm:text-xs font-bold text-slate-600 mb-1.5">المبلغ</label>
                    <input v-model.number="debtPayment.amount" type="number" min="0.01"
                        :max="selectedDebtId ? (pendingDebts.find(d => d.id === selectedDebtId)?.remaining_amount || 0) : null"
                        placeholder="أدخل المبلغ..."
                        class="w-full border-2 rounded-xl p-3 focus:ring-2 focus:ring-blue-200 outline-none text-base sm:text-lg font-bold text-center font-mono">
                </div>
                <div>
                    <label class="block text-[10px] sm:text-xs font-bold text-slate-600 mb-1.5">ملاحظات (اختياري)</label>
                    <textarea v-model="debtPayment.notes" rows="2" placeholder="مثال: سداد دفعة أولى..."
                        class="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-200 outline-none text-xs sm:text-sm"></textarea>
                </div>
            </div>

            <div class="flex gap-2 sm:gap-3 mt-5">
                <button @click="saveDebtPayment" :disabled="!debtPayment.amount || debtPayment.amount <= 0"
                    class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl p-3 font-bold transition flex items-center justify-center gap-2 text-sm sm:text-base">
                    <i class="fas fa-check"></i> حفظ
                </button>
                <button @click="closeDebtPaymentModal" class="flex-1 bg-gray-200 hover:bg-gray-300 rounded-xl p-3 font-bold transition text-sm sm:text-base">إلغاء</button>
            </div>
        </div>
    </div>

    <!-- مودال سحب نقدي -->
    <div v-if="showWithdrawModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-3 sm:p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 border-t-4 border-orange-500">
            <h2 class="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2"><i class="fas fa-hand-holding-usd text-orange-500"></i> سحب نقدي</h2>
            <div class="space-y-3 sm:space-y-4">
                <input v-model="withdraw.amount" type="number" placeholder="المبلغ" class="w-full border rounded-xl p-3 focus:ring-2 focus:ring-orange-200 outline-none text-sm sm:text-base">
                <textarea v-model="withdraw.reason" placeholder="سبب السحب" class="w-full border rounded-xl p-3 focus:ring-2 focus:ring-orange-200 outline-none text-sm sm:text-base"></textarea>
            </div>
            <div class="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button @click="saveWithdraw" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-3 font-bold transition text-sm sm:text-base">حفظ</button>
                <button @click="closeWithdrawModal" class="flex-1 bg-gray-200 hover:bg-gray-300 rounded-xl p-3 font-bold transition text-sm sm:text-base">إلغاء</button>
            </div>
        </div>
    </div>

    <!-- مودال تفاصيل الفاتورة -->
    <div v-if="showSaleDetailModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-3 sm:p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative">
            <button @click="closeSaleDetail" class="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-xl sm:text-2xl"></i>
            </button>
            <h3 class="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 pl-8">تفاصيل الفاتورة #{{ selectedSale?.id }}</h3>
            <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                <p><span class="text-gray-500">التاريخ:</span> {{ saleDetails?.created_at?.substring(0,10) }}</p>
                <p><span class="text-gray-500">الإجمالي:</span> {{ saleDetails?.total_amount }} ج.س</p>
                <p><span class="text-gray-500">تم إرجاع:</span> {{ saleDetails?.total_refunded || 0 }} ج.س</p>
                <p><span class="text-gray-500">المتبقي:</span> {{ (saleDetails?.total_amount || 0) - (saleDetails?.total_refunded || 0) }} ج.س</p>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full mt-3 sm:mt-4 border-collapse text-xs sm:text-sm">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="p-2 text-right">#</th>
                            <th class="p-2 text-right">الدواء</th>
                            <th class="p-2 text-right">الكمية</th>
                            <th class="p-2 text-right">سعر الوحدة</th>
                            <th class="p-2 text-right">الوحدة</th>
                            <th class="p-2 text-right">الإجمالي</th>
                            <th class="p-2 text-right">إرجاع</th>
                            <th class="p-2 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(item, index) in refundItems" :key="item.key" class="border-b" :class="item.max <= 0 ? 'opacity-50' : ''">
                        <td class="p-2">{{ index + 1 }}</td>
                        <td class="p-2">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span>{{ item.name }}</span>
                                <span v-if="item.unit_label" class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{{ item.unit_label }}</span>
                            </div>
                        </td>
                        <td class="p-2">{{ item.original_qty }}</td>
                        <td class="p-2">{{ item.price }}</td>
                        <td class="p-2">{{ (item.price * item.original_qty).toFixed(2) }}</td>
                        <td class="p-2">
                            <template v-if="item.max > 0">
                                <input type="number" v-model.number="item.quantity" min="0" :max="item.max" class="w-16 sm:w-20 border rounded p-1 text-center text-xs sm:text-sm">
                                <span class="text-[10px] text-gray-500 block">الحد: {{ item.max }}</span>
                            </template>
                            <span v-else class="text-[10px] text-gray-400 font-bold italic">تم إرجاعه</span>
                        </td>
                        <td class="p-2">
                            <button v-if="item.max > 0" @click="refundLineItem(index)" :disabled="isRefundProcessing"
                                    class="text-[10px] sm:text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-2 sm:px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap">
                                إرجاع
                            </button>
                        </td>
                    </tr>
                </tbody>
                </table>
            </div>
            <div class="mt-5 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button @click="closeSaleDetail" class="px-4 sm:px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold transition text-sm sm:text-base order-2 sm:order-1">إغلاق</button>
                <button v-if="printSettings.allowReprint" @click="reprintInvoice" :disabled="isRefundProcessing"
                        class="px-4 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2">
                    <i class="fas fa-print"></i> إعادة طباعة
                </button>
            </div>
        </div>
    </div>

    <!-- PIN Modal -->
    <div v-if="showPinModal" class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-4">
        <div class="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-sm text-center shadow-2xl">
            <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-400 text-white flex items-center justify-center text-xl sm:text-2xl mb-4">
                <i class="fas fa-lock"></i>
            </div>
            <h2 class="text-lg sm:text-xl font-bold text-slate-800 mb-1">أدخل PIN الخاص بك</h2>
            <p class="text-slate-500 text-xs sm:text-sm mb-5 sm:mb-6">{{ pinHint || 'PIN من 4 أرقام' }}</p>
            <div class="flex justify-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div v-for="i in 4" :key="i"
                     :class="['w-4 h-4 rounded-full border-2 transition-all',
                              pinInput.length >= i ? 'bg-purple-500 border-purple-500 scale-110' : 'border-slate-300',
                              pinError ? 'border-red-500' : '']"></div>
            </div>
            <div v-if="pinError" class="text-red-600 text-xs sm:text-sm mb-4 bg-red-50 rounded-lg p-2">
                <i class="fas fa-exclamation-circle"></i> {{ pinError }}
            </div>
            <div class="grid grid-cols-3 gap-2 mb-4">
                <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" @click="addPinDigit(String(n))" :disabled="pinVerifying"
                        class="h-12 sm:h-14 border-2 border-slate-200 rounded-xl text-lg sm:text-xl font-bold text-slate-700 hover:bg-purple-50 hover:border-purple-400 transition disabled:opacity-40">
                    {{ n }}
                </button>
                <button @click="clearPin" :disabled="pinVerifying" class="h-12 sm:h-14 border-2 border-red-200 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition disabled:opacity-40">
                    <i class="fas fa-times"></i>
                </button>
                <button @click="addPinDigit('0')" :disabled="pinVerifying" class="h-12 sm:h-14 border-2 border-slate-200 rounded-xl text-lg sm:text-xl font-bold text-slate-700 hover:bg-purple-50 transition disabled:opacity-40">0</button>
                <button @click="removePinDigit" :disabled="pinVerifying" class="h-12 sm:h-14 border-2 border-amber-200 rounded-xl text-amber-600 bg-amber-50 hover:bg-amber-100 transition disabled:opacity-40">
                    <i class="fas fa-backspace"></i>
                </button>
            </div>
            <button @click="cancelPin" :disabled="pinVerifying" class="w-full text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-bold py-2 rounded-lg transition">إلغاء</button>
        </div>
    </div>

    <!-- Phone Scanner Modal -->
    <div v-if="showScannerModal" 
        class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-4"
        @click.self="closePhoneScanner">
        
        <div class="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl text-center max-h-[95vh] overflow-y-auto">
            
            <div v-if="scannerStatus === 'detecting'">
                <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-2xl sm:text-3xl mb-4">
                    <i class="fas fa-search"></i>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-slate-800 mb-3">جاري التحضير...</h2>
                <div class="w-10 h-10 sm:w-12 sm:h-12 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>

            <template v-if="scannerStatus === 'online-mode' || (scannerStatus === 'connected' && scannerMode === 'peerjs')">
                <div class="mb-4 sm:mb-5">
                    <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-2xl sm:text-3xl mb-3">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <h2 class="text-xl sm:text-2xl font-bold text-slate-800">امسح بالهاتف</h2>
                    <p class="text-slate-500 text-xs sm:text-sm mt-1">
                        <i class="fas fa-wifi text-emerald-600"></i>
                        متصل بالإنترنت — وضع تلقائي
                    </p>
                </div>

                <div class="mb-4">
                    <div v-if="scannerStatus === 'online-mode'" 
                        class="inline-flex items-center gap-2 bg-amber-50 border-2 border-amber-200 text-amber-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold">
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        في انتظار الاتصال...
                    </div>
                    <div v-else-if="scannerStatus === 'connected'" 
                        class="inline-flex items-center gap-2 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        متصل — جاهز للمسح
                    </div>
                </div>

                <div v-if="scannerQrData" 
                    class="bg-slate-50 rounded-2xl p-3 sm:p-5 mb-4 inline-block border-4 border-slate-200"
                    :class="scannerStatus === 'connected' ? 'opacity-30' : ''">
                    <img :src="scannerQrData" alt="QR" class="w-48 sm:w-64 h-48 sm:h-64 mx-auto">
                </div>

                <div v-if="scannerLastCode" 
                    class="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 mb-4">
                    <div class="text-[10px] sm:text-xs text-emerald-600 font-bold mb-1">
                        <i class="fas fa-check-circle"></i> آخر باركود
                    </div>
                    <div class="text-emerald-800 font-mono text-xs sm:text-sm break-all">{{ scannerLastCode }}</div>
                    <div class="text-[10px] sm:text-xs text-emerald-600 mt-1">
                        <i class="fas fa-bullseye"></i> مسحات: {{ scannerScanCount }}
                    </div>
                </div>

                <div class="bg-slate-50 rounded-xl p-3 sm:p-4 text-right text-[10px] sm:text-xs space-y-1.5">
                    <div class="flex items-start gap-2">
                        <span class="bg-emerald-100 text-emerald-700 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                        <span class="text-slate-600">تأكد أن الهاتف والكمبيوتر على نفس الـ WiFi</span>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="bg-emerald-100 text-emerald-700 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                        <span class="text-slate-600">امسح الرمز بكاميرا الهاتف</span>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="bg-emerald-100 text-emerald-700 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">3</span>
                        <span class="text-slate-600">اسمح بالوصول للكاميرا → ابدأ المسح</span>
                    </div>
                </div>

                <button 
                    @click="regeneratePeerId"
                    class="text-[10px] sm:text-xs text-slate-500 hover:text-slate-700 mt-3 underline">
                    <i class="fas fa-sync"></i> تغيير معرّف الجهاز
                </button>
            </template>

            <template v-if="scannerStatus === 'offline-mode' || scannerStatus === 'waiting-answer' || (scannerStatus === 'connected' && scannerMode === 'manual')">
                <div class="mb-4 sm:mb-5">
                    <div class="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center text-2xl sm:text-3xl mb-3">
                        <i class="fas fa-wifi-slash"></i>
                    </div>
                    <h2 class="text-xl sm:text-2xl font-bold text-slate-800">الاتصال اليدوي</h2>
                    <p class="text-slate-500 text-xs sm:text-sm mt-1">
                        <i class="fas fa-info-circle text-orange-600"></i>
                        لا يوجد إنترنت — الوضع اليدوي
                    </p>
                </div>

                <div v-if="scannerManualStep === 1" class="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 sm:p-5 mb-4">
                    <h3 class="font-bold text-orange-900 mb-2 flex items-center justify-center gap-2 text-sm sm:text-base">
                        <i class="fas fa-qrcode"></i> الخطوة 1 من 3
                    </h3>
                    <p class="text-xs sm:text-sm text-orange-800 mb-4">
                        امسح هذا الرمز بكاميرا الهاتف
                    </p>

                    <!-- ✅ الحالة 1: QR جاهز -->
                    <div v-if="scannerQrData" 
                        class="bg-white rounded-xl p-2 sm:p-3 inline-block border-2 border-orange-300">
                        <img :src="scannerQrData" alt="Offer QR" class="w-56 sm:w-72 h-56 sm:h-72 mx-auto">
                    </div>

                    <!-- ✅ الحالة 2: QR لم يُولّد بعد — رسالة انتظار -->
                    <div v-else class="bg-white rounded-xl p-8 inline-block border-2 border-orange-300 min-w-[240px]">
                        <div class="text-center">
                            <div class="w-10 h-10 mx-auto border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-3"></div>
                            <p class="text-xs text-orange-700 font-bold">جاري توليد الرمز...</p>
                        </div>
                    </div>

                    <p class="text-[10px] sm:text-xs text-orange-700 mt-3">
                        <i class="fas fa-mobile-alt"></i>
                        سيفتح الهاتف صفحة الماسح
                    </p>
                </div>

                <div v-if="scannerManualStep === 2" class="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-5 mb-4">
                    <h3 class="font-bold text-blue-900 mb-2 flex items-center justify-center gap-2 text-sm sm:text-base">
                        <i class="fas fa-camera"></i> الخطوة 2 من 3
                    </h3>
                    <p class="text-xs sm:text-sm text-blue-800 mb-4">
                        امسح QR الظاهر على شاشة الهاتف
                    </p>

                    <div id="answerReader" class="rounded-xl overflow-hidden mb-3" style="min-height: 200px;"></div>

                    <p class="text-[10px] sm:text-xs text-blue-700">
                        <i class="fas fa-info-circle"></i>
                        قد يحتاج الهاتف ثانيتين لتوليد الرمز
                    </p>

                    <button 
                        @click="startAnswerScanner"
                        v-if="!answerScanner"
                        class="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm">
                        <i class="fas fa-camera"></i> ابدأ المسح
                    </button>
                </div>

                <div v-if="scannerManualStep === 3" class="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 mb-4">
                    <h3 class="font-bold text-emerald-900 mb-2 flex items-center justify-center gap-2 text-sm sm:text-base">
                        <i class="fas fa-check-double"></i> تم الاتصال!
                    </h3>
                    <p class="text-xs sm:text-sm text-emerald-800 mb-3">
                        ابدأ مسح الباركود من الهاتف
                    </p>
                </div>

                <div v-if="scannerLastCode" 
                    class="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 mb-4">
                    <div class="text-[10px] sm:text-xs text-emerald-600 font-bold mb-1">
                        <i class="fas fa-check-circle"></i> آخر باركود
                    </div>
                    <div class="text-emerald-800 font-mono text-xs sm:text-sm break-all">{{ scannerLastCode }}</div>
                    <div class="text-[10px] sm:text-xs text-emerald-600 mt-1">
                        <i class="fas fa-bullseye"></i> مسحات: {{ scannerScanCount }}
                    </div>
                </div>
            </template>

            <div v-if="scannerStatus === 'error'" class="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                <i class="fas fa-exclamation-triangle text-red-600 text-xl sm:text-2xl mb-2 block"></i>
                <div class="font-bold text-red-800 text-sm sm:text-base">{{ scannerError }}</div>
            </div>

            <button 
                @click="closePhoneScanner"
                class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 sm:py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 mt-2 text-sm sm:text-base">
                <i class="fas fa-times"></i> إغلاق
            </button>
        </div>
    </div>

    <!-- Alert Modal -->
    <div v-if="alert.show"
        class="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[100000] px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl transition-all duration-300 max-w-md mx-2"
        :class="{
            'bg-emerald-50 border-2 border-emerald-300 text-emerald-800': alert.type === 'success',
            'bg-red-50 border-2 border-red-300 text-red-800': alert.type === 'error',
            'bg-amber-50 border-2 border-amber-300 text-amber-800': alert.type === 'warning',
            'bg-blue-50 border-2 border-blue-300 text-blue-800': alert.type === 'info'
        }">
        <div class="flex items-center gap-3">
            <i :class="{
                'fas fa-check-circle text-emerald-500 text-lg sm:text-xl': alert.type === 'success',
                'fas fa-exclamation-circle text-red-500 text-lg sm:text-xl': alert.type === 'error',
                'fas fa-exclamation-triangle text-amber-500 text-lg sm:text-xl': alert.type === 'warning',
                'fas fa-info-circle text-blue-500 text-lg sm:text-xl': alert.type === 'info'
            }"></i>
            <span class="font-bold text-xs sm:text-sm flex-1">{{ alert.message }}</span>
            <button @click="hideAlert" class="text-slate-400 hover:text-slate-700 transition">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>
    <footer class="hidden lg:block text-center p-2 sm:p-3 text-slate-400 border-t bg-white text-[10px] sm:text-xs">
        <p>MiraclePOS v2.0 | إدارة الصيدليات</p>
    </footer>
`,

    setup() {
        const { ref, reactive, computed, onMounted, onUnmounted, nextTick } = Vue;

        const logoFailed = ref(false);
        const token = localStorage.getItem('token');

        // Responsive: تبويب نشط للموبايل والتابلت
        const activeTab = ref('search');

        axios.defaults.headers.common['Accept'] = 'application/json';
        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

        axios.interceptors.request.use(config => {
            config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            config.headers['Pragma'] = 'no-cache';
            config.headers['Expires'] = '0';
            if (config.method === 'get' && !config.params) {
                config.params = {};
            }
            if (config.method === 'get' && config.params) {
                config.params._ts = Date.now();
            }
            return config;
        }, error => Promise.reject(error));

        axios.interceptors.response.use(
            response => response,
            error => {
                if (!error.response) return Promise.reject(error);
                if (error.response.status === 401) return Promise.reject(error);
                const serverMessage = error.response.data?.message;
                if (serverMessage) showAlert(serverMessage, 'error');
                return Promise.reject(error);
            }
        );

        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const showBatchSelector = ref(false);
        const availableBatches = ref([]);
        const pendingBatchMedicine = ref(null);
        const pendingBatchPriceRecord = ref(null);

        const selectBatch = (batch) => {
            proceedAddToCart(pendingBatchMedicine.value, pendingBatchPriceRecord.value, batch);
            closeBatchSelector();
        };

        const selectFirstBatchFifo = () => {
            if (availableBatches.value.length > 0) {
                selectBatch(availableBatches.value[0]);
            }
        };

        const closeBatchSelector = () => {
            showBatchSelector.value = false;
            availableBatches.value = [];
            pendingBatchMedicine.value = null;
            pendingBatchPriceRecord.value = null;
            focusSearch();
        };

        let alertTimer = null;

        const showAlert = (message, type = 'info') => {
            alert.message = message;
            alert.type = type;
            alert.show = true;

            if (type === 'success') {
                playSound('success');
            } else if (type === 'error') {
                playSound('error');
            }

            if (alertTimer) clearTimeout(alertTimer);
            alertTimer = setTimeout(() => {
                alert.show = false;
            }, 4000);
        };

        const showPinModal = ref(false);
        const pinInput = ref('');
        const pinError = ref('');
        const pinHint = ref('');
        const pinAction = ref('');
        const pinVerifying = ref(false);
        const activeCashier = ref(null);

        const showScannerModal = ref(false);
        const scannerQrData = ref('');
        const scannerStatus = ref('detecting');
        const scannerLastCode = ref('');
        const scannerError = ref('');
        const scannerScanCount = ref(0);
        const scannerMode = ref('');
        const scannerManualStep = ref(1);

        let phonePeer = null;
        let phoneConnection = null;
        let phoneSimplePeer = null;
        let scannerTimeout = null;
        let answerScanner = null;
        let pinResolve = null;

        try {
            const stored = localStorage.getItem('miraclepos_active_cashier');
            if (stored) activeCashier.value = JSON.parse(stored);
        } catch (e) {}

        const requirePin = (action = 'shift_open', hint = '') => {
            return new Promise(async (resolve) => {
                try {
                    const res = await axios.get(`${API_BASE}/settings/public`);
                    const s = res.data;
                    if (!s['pin.enabled']) return resolve({ status: 'skipped' });

                    const actionMap = {
                        'shift_open':   'pin.on_shift_open',
                        'shift_close':  'pin.on_shift_close',
                        'withdraw':     'pin.on_withdraw',
                        'void_sale':    'pin.on_void_sale',
                        'price_change': 'pin.on_price_change',
                        'every_sale':   'pin.on_every_sale',
                        'expense':      'pin.on_expense',
                        'debt_payment': 'pin.on_debt_payment',
                    };

                    const settingKey = actionMap[action];
                    if (!settingKey || !s[settingKey]) return resolve({ status: 'skipped' });
                } catch (e) {
                    console.warn('تعذر قراءة إعدادات PIN:', e);
                    return resolve({ status: 'skipped' });
                }

                if (!activeCashier.value?.id) return resolve({ status: 'no_cashier' });

                pinInput.value = '';
                pinError.value = '';
                pinHint.value = hint;
                pinAction.value = action;
                pinVerifying.value = false;
                showPinModal.value = true;

                pinResolve = (user) => {
                    resolve(user ? { status: 'success', user } : { status: 'cancelled' });
                };
            });
        };

        const addPinDigit = (d) => {
            if (pinVerifying.value || pinInput.value.length >= 4) return;
            pinError.value = '';
            pinInput.value += d;
            if (pinInput.value.length === 4) {
                setTimeout(verifyPin, 150);
            }
        };

        const removePinDigit = () => {
            if (pinVerifying.value) return;
            pinInput.value = pinInput.value.slice(0, -1);
            pinError.value = '';
        };

        const clearPin = () => {
            if (pinVerifying.value) return;
            pinInput.value = '';
            pinError.value = '';
        };

        const verifyPin = async () => {
            if (pinVerifying.value) return;
            pinVerifying.value = true;
            try {
                const res = await axios.post(`${API_BASE}/pin/verify`, {
                    pin: pinInput.value,
                    user_id: activeCashier.value.id,
                });
                if (res.data.valid) {
                    showPinModal.value = false;
                    pinInput.value = '';
                    pinError.value = '';
                    pinVerifying.value = false;
                    if (pinResolve) {
                        pinResolve(res.data.user);
                        pinResolve = null;
                    }
                    showAlert(`✅ مرحباً ${res.data.user.name}`, 'success');
                }
            } catch (e) {
                pinVerifying.value = false;
                pinError.value = e.response?.data?.message || 'PIN غير صحيح';
                pinInput.value = '';
                playSound('error');
            }
        };

        const cancelPin = () => {
            if (pinVerifying.value) return;
            showPinModal.value = false;
            pinInput.value = '';
            pinError.value = '';
            if (pinResolve) {
                pinResolve(null);
                pinResolve = null;
            }
        };

        const printSettings = ref(getPrintSettings());

        const selectedSale = ref(null);
        const showSaleDetailModal = ref(false);
        const saleDetails = ref(null);
        const refundItems = ref([]);
        const pendingRefundsCount = ref(0);
        const isRefundProcessing = ref(false);

        const getPendingRefundedQtyMap = (financeOps, saleId) => {
            const map = {};
            for (const op of financeOps) {
                if (op.type === 'refund' && !op.synced && op.sale_id === saleId) {
                    for (const it of (op.items || [])) {
                        const key = `${it.medicine_batch_id}::${it.medicine_unit_id || 'default'}`;
                        map[key] = (map[key] || 0) + Number(it.quantity || 0);
                    }
                }
            }
            return map;
        };

        const buildRefundItemsFromSaleDetails = (details, refundedMap) => {
            return (details.items || []).map(item => {
                const medicineBatchId = item.medicine_batch_id ?? item.batch?.id;
                const medicineUnitId  = item.medicine_unit_id ?? null;
                const key = `${medicineBatchId}::${medicineUnitId || 'default'}`;
                const alreadyRefunded = refundedMap[key] || 0;
                const baseMax = item.remaining_quantity_for_refund ?? item.quantity ?? 0;

                return {
                    key,
                    medicine_batch_id: medicineBatchId,
                    medicine_unit_id:  medicineUnitId,
                    sale_item_id:      item.id,
                    name:        item.batch?.medicine?.name || item.medicine_name || 'دواء',
                    unit_label: item.unit || item.unit_info?.name || 'وحدة',
                    quantity:     0,
                    max:          Math.max(0, baseMax - alreadyRefunded),
                    original_qty: item.quantity || 0,
                    price:        item.price || 0,
                };
            });
        };

        const viewSaleDetails = async (sale) => {
            if (!isOnline.value) {
                try {
                    const financeOps = await getPendingShiftFinanceOperations(currentUser.value.id);
                    const op = financeOps.find(op => op.operation_id === sale.id || op.id === sale.id);

                    if (op && op.type === 'sale') {
                        const saleId = op.operation_id || op.id;
                        const refundedMap = getPendingRefundedQtyMap(financeOps, saleId);

                        saleDetails.value = {
                            id: saleId,
                            total_amount: op.amount || 0,
                            payment_method: op.payment_method || 'cash',
                            created_at: op.created_at,
                            total_refunded: 0,
                            items: op.items || []
                        };

                        selectedSale.value = { ...sale, payment_method: op.payment_method || 'cash' };

                        refundItems.value = (op.items || []).map((item, idx) => {
                            const medicineBatchId = item.medicine_batch_id;
                            const medicineUnitId = item.medicine_unit_id || null;
                            const originalQty = item.quantity || 1;
                            const key = `${medicineBatchId}::${medicineUnitId || 'default'}`;
                            const alreadyRefunded = refundedMap[key] || 0;

                            return {
                                key,
                                medicine_batch_id: medicineBatchId,
                                medicine_unit_id:  medicineUnitId,
                                sale_item_id:      item.sale_item_id || null,
                                name:        item.medicine_name || 'دواء',
                                unit_label:  item.unit || 'وحدة',
                                quantity:     0,
                                max:          Math.max(0, originalQty - alreadyRefunded),
                                original_qty: originalQty,
                                price:        item.price || 0,
                            };
                        });

                        showSaleDetailModal.value = true;
                        return;
                    }

                    const cached = getCachedSaleDetails(currentUser.value.id, sale.id);
                    if (cached) {
                        const refundedMap = getPendingRefundedQtyMap(financeOps, sale.id);
                        saleDetails.value = cached;
                        selectedSale.value = { ...sale, payment_method: cached.payment_method || sale.payment_method };
                        refundItems.value = buildRefundItemsFromSaleDetails(cached, refundedMap);
                        showSaleDetailModal.value = true;
                        return;
                    }

                    showAlert('هذه الفاتورة لم تُفتح من قبل أثناء الاتصال، فلا تتوفر تفاصيلها في وضع عدم الاتصال', 'error');
                    return;

                } catch (error) {
                    console.error('خطأ في جلب التفاصيل محلياً:', error);
                    showAlert('تعذر تحميل تفاصيل الفاتورة', 'error');
                    return;
                }
            }

            try {
                const response = await axios.get(`${API_BASE}/sales/${sale.id}/details`, {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });

                saleDetails.value = response.data;
                selectedSale.value = { ...sale, payment_method: response.data.payment_method || sale.payment_method };

                if (currentUser.value?.id) {
                    cacheSaleDetails(currentUser.value.id, sale.id, response.data);
                }

                let refundedMap = {};
                if (currentUser.value?.id) {
                    try {
                        const financeOps = await getPendingShiftFinanceOperations(currentUser.value.id);
                        refundedMap = getPendingRefundedQtyMap(financeOps, sale.id);
                    } catch (e) {
                        console.warn('تعذر قراءة الإرجاعات المحلية المعلقة:', e);
                    }
                }

                refundItems.value = buildRefundItemsFromSaleDetails(saleDetails.value, refundedMap);
                showSaleDetailModal.value = true;

            } catch (error) {
                console.error('خطأ في جلب التفاصيل:', error);
                showAlert(error.response?.data?.message || 'تعذر تحميل تفاصيل الفاتورة', 'error');
            }
        };

        const refundLineItem = async (index) => {
            if (isRefundProcessing.value) return;

            const item = refundItems.value[index];
            if (!item || item.max <= 0) return;

            const quantity = Number(item.quantity || 0);
            if (quantity <= 0) {
                showAlert('يرجى تحديد كمية الإرجاع لهذا الصنف', 'error');
                return;
            }
            if (quantity > item.max) {
                showAlert(`الكمية المرتجعة تتجاوز الكمية المتاحة (الحد الأقصى: ${item.max})`, 'error');
                return;
            }

            const refundAmount = item.price * quantity;
            const paymentMethod = selectedSale.value.payment_method || 'cash';

            isRefundProcessing.value = true;

            try {
                const operation = {
                    type: 'refund',
                    amount: refundAmount,
                    original_payment_method: paymentMethod,
                    sale_id: selectedSale.value.id,
                    items: [{
                        medicine_batch_id: item.medicine_batch_id,
                        medicine_unit_id:  item.medicine_unit_id,
                        quantity,
                        unit:              item.unit_label,
                    }],
                    reason: `إرجاع ${item.name} (${item.unit_label || ''})`,
                    shift_id: shift.value?.server_shift_id || shift.value?.id,
                    local_shift_id: shift.value?.local_shift_id || shift.value?.id,
                    branch_id: currentUser.value?.branch_id,
                    user_id: currentUser.value?.id,
                    created_at: new Date().toISOString(),
                    synced: false
                };

                const queued = enqueueShiftFinanceOperation(currentUser.value.id, operation);
                if (!queued) {
                    showAlert('فشل حفظ الإرجاع محلياً', 'error');
                    isRefundProcessing.value = false;
                    return;
                }

                if (shift.value) {
                    const updatedShift = applyPOSOperationToLocalShift(shift.value, operation);
                    shift.value = { ...updatedShift };
                    if (currentUser.value?.id) {
                        saveCachedShift(currentUser.value.id, shift.value);
                    }
                }

                item.max = Math.max(0, item.max - quantity);
                item.quantity = 0;
                if (saleDetails.value) {
                    saleDetails.value.total_refunded = (saleDetails.value.total_refunded || 0) + refundAmount;
                }

                if (!navigator.onLine) {
                    await refreshOfflineCount();
                    await loadRecentSales();
                    playSound('success');
                    showAlert('✅ تم حفظ الإرجاع محلياً', 'success');
                    isRefundProcessing.value = false;
                    return;
                }

                try {
                    await syncPendingShiftFinanceOperations();
                    await refreshCurrentShift();
                    showAlert('تم إرجاع الصنف بنجاح', 'success');
                } catch (error) {
                    console.error('❌ Refund error:', error);
                    showAlert(error.response?.data?.message || 'فشل إرجاع الصنف', 'error');
                    await refreshCurrentShift();
                }

                await loadRecentSales();
                await loadMedicines();
                await refreshOfflineCount();

            } catch (error) {
                console.error('❌ Item refund error:', error);
                showAlert('حدث خطأ أثناء إرجاع الصنف', 'error');
            } finally {
                isRefundProcessing.value = false;
            }
        };

        const reprintInvoice = () => {
            if (!saleDetails.value) {
                showAlert('لا توجد فاتورة مفتوحة للطباعة', 'error');
                return;
            }
            try {
                safePrintInvoice(saleDetails.value, { force: true });
            } catch (e) {
                console.error('خطأ في الطباعة:', e);
                showAlert('تعذر فتح نافذة الطباعة', 'error');
            }
        };

        const closeSaleDetail = () => {
            showSaleDetailModal.value = false;
            saleDetails.value = null;
            refundItems.value = [];
            selectedSale.value = null;
        };

        const currentUser = ref(null);
        const isOnline = ref(navigator.onLine);

        const updateOnlineState = () => {
            isOnline.value = navigator.onLine;
        };

        const alert = reactive({
            show: false,
            type: 'info',
            message: ''
        });

        const hideAlert = () => {
            alert.show = false;
            alert.message = '';
        };

        const isLoading = ref(false);
        const savingSale = ref(false);
        const search = ref('');
        const searchInput = ref(null);

        const focusSearch = () => {
            setTimeout(() => {
                if (!searchInput.value) return;
                if (window.innerWidth >= 1024 || activeTab.value === 'search') {
                    searchInput.value.focus();
                }
            }, 50);
        };

        const allMedicines = ref([]);
        const usingCachedMedicines = ref(false);

        const normalizeMedicine = (medicine) => {
            const med = { ...medicine };
            med.units = Array.isArray(med.units) ? med.units : [];
            med.batches = Array.isArray(med.batches) ? med.batches : [];
            med.name = med.name || '';
            med.scientific_name = med.scientific_name || '';

            med.batches = med.batches.map(batch => {
                const normalizedBatch = { ...batch };
                normalizedBatch.prices = Array.isArray(normalizedBatch.prices) ? normalizedBatch.prices : [];
                normalizedBatch.prices = normalizedBatch.prices.map(price => {
                    const unitId = Number(price.unit_id);
                    const unit = med.units.find(u => Number(u.unit_id) === unitId || Number(u.id) === unitId);
                    return { ...price, unit: unit?.unit || price.unit || null };
                });
                return normalizedBatch;
            });
            return med;
        };

        const normalizeMedicinesResponse = (response) => {
            let data = response?.data ?? response;
            if (data && !Array.isArray(data)) {
                data = data.data ?? data.medicines ?? data.items ?? [];
            }
            if (!Array.isArray(data)) return [];
            return data.map(normalizeMedicine);
        };

        const saveMedicinesToCache = async (medicines) => {
            if (!Array.isArray(medicines)) return false;
            try {
                await cacheMedicines(medicines);
                return true;
            } catch (error) {
                console.warn('تعذر تحديث Cache الأدوية:', error);
                return false;
            }
        };

        const loadMedicines = async () => {
            if (isOnline.value) {
                try {
                    const branchId = currentUser.value?.branch_id;
                    const response = await axios.get(`${API_BASE}/sales/medicines`, {
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        },
                        params: { branch_id: branchId, _ts: Date.now() }
                    });

                    const medicines = normalizeMedicinesResponse(response);
                    allMedicines.value = medicines;
                    await saveMedicinesToCache(medicines);
                    usingCachedMedicines.value = false;
                    return medicines;
                } catch (error) {
                    console.warn('تعذر تحميل الأدوية من الخادم، سيتم استخدام النسخة المحلية:', error);
                }
            }

            try {
                const cached = await getCachedMedicines();
                allMedicines.value = Array.isArray(cached) ? cached.map(normalizeMedicine) : [];
                usingCachedMedicines.value = true;
                return allMedicines.value;
            } catch (error) {
                console.warn('تعذر تحميل الأدوية محلياً:', error);
                allMedicines.value = [];
                return [];
            }
        };

        const filteredMedicines = computed(() => {
            const query = String(search.value || '').trim().toLowerCase();
            if (!query || !Array.isArray(allMedicines.value)) return [];

            return allMedicines.value.filter(medicine => {
                const name = String(medicine?.name || '').toLowerCase();
                const scientificName = String(medicine?.scientific_name || '').toLowerCase();
                const barcode = String(medicine?.barcode || '').toLowerCase();
                const unitBarcode = Array.isArray(medicine?.units) && medicine.units.some(
                    unit => String(unit?.barcode || '').toLowerCase().includes(query)
                );
                return name.includes(query) || scientificName.includes(query) || barcode.includes(query) || unitBarcode;
            });
        });

        const findMedicineByBarcode = (barcode) => {
            const value = String(barcode || '').trim();
            if (!value) return null;
            return allMedicines.value.find(medicine => {
                if (String(medicine?.barcode || '').trim() === value) return true;
                return Array.isArray(medicine?.units) && medicine.units.some(
                    unit => String(unit?.barcode || '').trim() === value
                );
            }) || null;
        };

        const getPriceUnit = (medicine, priceRecord) => {
            if (!medicine || !priceRecord) return null;
            const unitId = Number(priceRecord.unit_id);
            return medicine.units?.find(
                unit => Number(unit.unit_id) === unitId || Number(unit.id) === unitId
            )?.unit || priceRecord.unit || null;
        };

        const getPriceUnitName = (medicine, priceRecord) => {
            return getPriceUnit(medicine, priceRecord)?.name || 'وحدة';
        };

        const formatStockQuantity = (medicine) => {
            const batch = medicine?.batches?.[0];
            if (!batch) return '0 وحدة';
            const stock = Number(batch.remaining_quantity || 0);
            const unitConfig = medicine?.units?.[0];
            if (!unitConfig) return `${stock} وحدة`;
            const factor = Number(unitConfig.factor) > 0 ? Number(unitConfig.factor) : 1;
            const unitName = unitConfig.unit?.name || 'وحدة';
            return `${Math.floor(stock / factor)} ${unitName}`;
        };

        const cart = ref([]);

        const cartTotal = computed(() => {
            return cart.value.reduce((total, item) => {
                return total + (Number(item.selling_price || item.price || 0) * Number(item.quantity || 0));
            }, 0);
        });

        const cartStockIssues = computed(() => {
            return validateCartStock(cart.value, allMedicines.value);
        });

        const itemHasStockIssue = (item) => {
            const medicine = allMedicines.value.find(m => Number(m.id) === Number(item.medicine_id));
            if (!medicine) return true;
            const batch = medicine.batches?.find(b => Number(b.id) === Number(item.batch_id));
            if (!batch) return true;
            const available = Number(batch.remaining_quantity || 0);
            const requested = Number(item.quantity_base || item.quantity || 0);
            return available < requested;
        };

        const checkAvailableBatches = async (medicine) => {
            try {
                const res = await axios.get(
                    `${API_BASE}/medicines/${medicine.id}/available-batches`,
                    { params: { branch_id: currentUser.value?.branch_id } }
                );
                return res.data;
            } catch (e) {
                console.warn('تعذر جلب الدفعات:', e);
                return null;
            }
        };

        const addToCart = async (medicine, selectedPriceRecord = null) => {
            const batch = medicine?.batches?.[0];

            if (!batch) {
                showAlert('هذا الدواء لا يحتوي على تشغيلة متاحة', 'error');
                return;
            }

            const available = Number(batch.remaining_quantity || 0);
            if (available <= 0) {
                showAlert('هذا الدواء غير متوفر حالياً', 'error');
                return;
            }

            const batchesInfo = await checkAvailableBatches(medicine);

            if (batchesInfo?.has_multiple_prices && batchesInfo.batches.length > 1) {
                showBatchSelector.value = true;
                availableBatches.value = batchesInfo.batches;
                pendingBatchMedicine.value = medicine;
                pendingBatchPriceRecord.value = selectedPriceRecord;
                return;
            }

            proceedAddToCart(
                medicine,
                selectedPriceRecord,
                batchesInfo?.batches?.[0] || batch
            );
        };

        const proceedAddToCart = (medicine, selectedPriceRecord, batch) => {
            let priceRecord = null;

            if (batch.prices && batch.prices.length > 0) {
                if (selectedPriceRecord?.unit_id) {
                    const wantedUnitId = Number(selectedPriceRecord.unit_id);
                    priceRecord = batch.prices.find(p => Number(p.unit_id) === wantedUnitId);
                }
                if (!priceRecord) priceRecord = batch.prices[0];
            }

            if (!priceRecord) priceRecord = selectedPriceRecord;

            if (!priceRecord) {
                showAlert('لا يوجد سعر لهذا الدواء', 'error');
                return;
            }

            const price = Number(
                priceRecord.sell_price ?? priceRecord.sale_price ?? priceRecord.price ?? 0
            );

            const available = Number(batch.remaining_quantity || 0);
            if (available <= 0) {
                showAlert(`الدفعة #${batch.batch_number || batch.id} نضبت من المخزون`, 'error');
                return;
            }

            const cartKey = `${batch.id}::${priceRecord.unit_id}`;
            const existing = cart.value.find(item => item.cart_key === cartKey);

            if (existing) {
                const factor = Number(priceRecord.factor || 1);
                const tentativeBase = (existing.quantity + 1) * factor;

                if (tentativeBase > available) {
                    const requested = tentativeBase;
                    const shortfall = requested - available;
                    showAlert(
                        `⚠️ الكمية غير كافية من "${medicine.name}":\n` +
                        `المتاح: ${available} قطعة\n` +
                        `المطلوب: ${requested} قطعة\n` +
                        `النقص: ${shortfall} قطعة`,
                        'error'
                    );
                    return;
                }

                existing.quantity++;
                existing.quantity_base = existing.quantity * factor;

                playSound('cart');

                search.value = '';
                focusSearch();
                return;
            }

            const factor = Number(priceRecord.factor || 1);

            if (factor > available) {
                showAlert(
                    `⚠️ المخزون غير كافٍ من "${medicine.name}":\n` +
                    `المتاح: ${available} قطعة\n` +
                    `المطلوب لوحدة واحدة: ${factor} قطعة`,
                    'error'
                );
                return;
            }

            cart.value.push({
                cart_key: cartKey,
                id: batch.id,
                batch_id: batch.id,
                batch_number: batch.batch_number,
                batch_expiry: batch.expiry_date,
                medicine_id: medicine.id,
                name: medicine.name,
                unit_id: priceRecord.unit_id,
                unit: getPriceUnitName(medicine, priceRecord),
                medicine_unit_id: priceRecord.unit_id,
                selling_price: price,
                unit_buy_price: Number(priceRecord.buy_price || 0),
                quantity: 1,
                quantity_base: factor,
                stock: available,
            });

            playSound('cart');

            search.value = '';
            focusSearch();
        };

        const clearCart = () => {
            cart.value = [];
            focusSearch();
        };

        const updateQuantity = (index, delta) => {
            const item = cart.value[index];
            if (!item) return;

            const next = Number(item.quantity || 0) + delta;

            if (next <= 0) {
                cart.value.splice(index, 1);
                return;
            }

            const medicine = allMedicines.value.find(m => Number(m.id) === Number(item.medicine_id));
            const batch = medicine?.batches?.find(b => Number(b.id) === Number(item.batch_id));

            if (batch) {
                const factor = Number(item.quantity_base / item.quantity) || 1;
                const tentativeBase = next * factor;
                const available = Number(batch.remaining_quantity || 0);

                if (tentativeBase > available) {
                    const shortfall = tentativeBase - available;
                    showAlert(
                        `⚠️ لا يمكن زيادة الكمية:\n` +
                        `المتاح: ${available} قطعة\n` +
                        `المطلوب: ${tentativeBase} قطعة\n` +
                        `النقص: ${shortfall} قطعة`,
                        'error'
                    );
                    return;
                }
            }

            const prevQuantity = item.quantity;
            item.quantity = next;
            item.quantity_base = next * Number(item.quantity_base / prevQuantity);

            if (delta > 0) {
                playSound('cart');
            }
        };

        const removeFromCart = (index) => {
            cart.value.splice(index, 1);
        };

        const processBarcode = (barcode) => {
            const medicine = findMedicineByBarcode(barcode);
            if (!medicine) {
                showAlert('لم يتم العثور على الدواء', 'error');
                search.value = '';
                focusSearch();
                return false;
            }

            const batch = medicine.batches?.[0];
            const priceRecord = batch?.prices?.[0];
            addToCart(medicine, priceRecord);
            return true;
        };

        const handleBarcodeSearch = () => {
            const barcode = String(search.value || '').trim();
            if (!barcode) return;
            processBarcode(barcode);
        };

        const payment = reactive({
            method: 'cash',
            bank: {
                bank_name: '',
                reference_number: '',
                transfer_date: new Date().toISOString().substring(0, 10),
                amount: 0,
                notes: ''
            }
        });

        const showBankModal = ref(false);

        const changePaymentMethod = () => {
            if (payment.method === 'bank') {
                payment.bank.amount = cartTotal.value;
                showBankModal.value = true;
            } else {
                payment.bank = {
                    bank_name: '',
                    reference_number: '',
                    transfer_date: new Date().toISOString().substring(0, 10),
                    amount: 0,
                    notes: ''
                };
            }
        };

        const closeBankModal = () => {
            payment.method = 'cash';
            payment.bank = {
                bank_name: '',
                reference_number: '',
                transfer_date: new Date().toISOString().substring(0, 10),
                amount: 0,
                notes: ''
            };
            showBankModal.value = false;
        };

        const saveBankPayment = () => {
            if (!payment.bank.bank_name) {
                showAlert('يرجى إدخال اسم البنك', 'error');
                return;
            }
            if (!payment.bank.reference_number) {
                showAlert('يرجى إدخال رقم التحويل', 'error');
                return;
            }
            showBankModal.value = false;
        };

        const shift = ref(null);
        const showCloseShift = ref(false);
        const closingCash = ref('');

        const difference = computed(() => {
            if (closingCash.value === '' || closingCash.value === null) return 0;
            return Number(closingCash.value) - Number(accountingBalance.value);
        });

        const accountingBalance = computed(() => {
            const s = shift.value;
            if (!s) return 0;
            return Number(s.expected_cash || 0);
        });

        // Phone Scanner
        const testPeerJSCloud = () => {
            return new Promise((resolve) => {
                if (!navigator.onLine) {
                    console.log('❌ testPeerJSCloud: لا يوجد إنترنت');
                    resolve(false);
                    return;
                }

                console.log('🔍 testPeerJSCloud: بدء الفحص...');
                
                let resolved = false;

                const testPeer = new Peer({ debug: 2 });  // ← debug للتشخيص

                const finish = (result) => {
                    if (resolved) return;
                    resolved = true;
                    try { testPeer.destroy(); } catch (e) {}
                    console.log('🔍 testPeerJSCloud النتيجة:', result);
                    resolve(result);
                };

                const timeout = setTimeout(() => {
                    console.warn('⏰ testPeerJSCloud: Timeout بعد 8 ثوان');
                    finish(false);
                }, 8000);  // ← زدنا من 4 إلى 8

                testPeer.on('open', (id) => {
                    console.log('✅ PeerJS Cloud يعمل، ID:', id);
                    clearTimeout(timeout);
                    finish(true);
                });

                testPeer.on('error', (err) => {
                    console.error('❌ PeerJS Cloud error:', err.type, err.message);
                    clearTimeout(timeout);
                    finish(false);
                });
            });
        };

        const openPhoneScanner = async () => {
            showScannerModal.value = true;
        
            // ✅ إذا كان الاتصال نشطاً بالفعل، لا تعيد التهيئة
            if (scannerMode.value === 'peerjs' && phonePeer && !phonePeer.destroyed) {
                console.log('♻️ Reusing existing PeerJS connection');
                scannerStatus.value = phoneConnection?.open ? 'connected' : 'online-mode';
                loadingPhoneScanner.value = false;
                return;
            }
        
            if (scannerMode.value === 'manual' && phoneSimplePeer && !phoneSimplePeer.destroyed) {
                console.log('♻️ Reusing existing SimplePeer connection');
                scannerStatus.value = phoneSimplePeer.connected ? 'connected' : 'waiting-answer';
                loadingPhoneScanner.value = false;
                return;
            }
            showScannerModal.value = true;
            scannerStatus.value = 'detecting';
            scannerError.value = '';
            scannerLastCode.value = '';
            scannerScanCount.value = 0;
            scannerQrData.value = '';
            scannerManualStep.value = 1;

            loadingPhoneScanner.value = true;

            try {
                // ═══════════════════════════════════════════════════
                // ✅ فحص سريع: إذا كان Offline، اذهب مباشرة للوضع اليدوي
                // ═══════════════════════════════════════════════════
                if (!navigator.onLine) {
                    console.log('📴 Offline detected — using Manual mode');

                    if (typeof window.SimplePeer !== 'function') {
                        scannerError.value = 'مكتبة الاتصال غير محمّلة';
                        scannerStatus.value = 'error';
                        return;
                    }

                    scannerMode.value = 'manual';
                    scannerStatus.value = 'offline-mode';
                    await startManualScanner();
                    return;
                }

                // ═══════════════════════════════════════════════════
                // Online: جرّب PeerJS Cloud مع timeout قصير
                // ═══════════════════════════════════════════════════
                console.log('🌐 Online — testing PeerJS Cloud...');

                const hasCloud = await Promise.race([
                    testPeerJSCloud(),
                    new Promise(resolve => setTimeout(() => resolve(false), 3000))
                ]);

                if (hasCloud) {
                    console.log('✅ PeerJS Cloud available — using Online mode');
                    scannerMode.value = 'peerjs';
                    scannerStatus.value = 'online-mode';
                    await startPeerJSScanner();
                } else {
                    console.warn('⚠️ PeerJS Cloud unavailable — falling back to Manual mode');
                    
                    // ✅ أظهر للمستخدم سبباً واضحاً
                    showAlert(
                        'تعذر الاتصال بـ PeerJS Cloud. سيتم استخدام الوضع اليدوي.',
                        'warning'
                    );

                    if (typeof window.SimplePeer !== 'function') {
                        scannerError.value = 'مكتبة الاتصال غير محمّلة';
                        scannerStatus.value = 'error';
                        return;
                    }

                    scannerMode.value = 'manual';
                    scannerStatus.value = 'offline-mode';
                    await startManualScanner();
                }

            } catch (error) {
                console.error('❌ Scanner init error:', error);
                scannerError.value = error.message || 'تعذر تشغيل الماسح';
                scannerStatus.value = 'error';
            } finally {
                loadingPhoneScanner.value = false;
            }
        };

        const loadingPhoneScanner = ref(false);

        const startPeerJSScanner = async () => {
            const myPeerId = getOrCreatePersistentPeerId();
            
            // ✅ استخدام BASE_URL من Vite (يدعم GitHub Pages)
            const base = import.meta.env.BASE_URL || '/';
            const scanUrl = `${window.location.origin}${base}scan.html?mode=auto&peer=${encodeURIComponent(myPeerId)}`;
            
            console.log('📡 PeerJS scan URL:', scanUrl);
            
            try {
                scannerQrData.value = await QRCode.toDataURL(scanUrl, {
                    width: 320,
                    margin: 2,
                    errorCorrectionLevel: 'M',
                });
            } catch (err) {
                console.error('QR generation error:', err);
                scannerError.value = 'تعذر توليد QR';
                scannerStatus.value = 'error';
                return;
            }

            try {
                phonePeer = new Peer(myPeerId, { debug: 1 });

                phonePeer.on('open', () => {
                    console.log('📡 PeerJS ready with persistent ID:', myPeerId);
                });

                phonePeer.on('connection', (conn) => {
                    console.log('📱 Phone connected');
                    phoneConnection = conn;
                    scannerStatus.value = 'connected';

                    conn.on('data', (data) => {
                        if (data.type === 'hello') {
                            showAlert('📱 تم الاتصال بالهاتف', 'success');
                            return;
                        }

                        if (data.type === 'barcode') {
                            const code = String(data.code || '').trim();
                            if (!code) return;

                            scannerLastCode.value = code;
                            scannerScanCount.value++;

                            try { conn.send({ type: 'ack', code }); } catch (e) {}

                            const success = handleScannedBarcode(code);
                            playSound(success ? 'cart' : 'error');
                        }
                    });

                    conn.on('close', () => {
                        scannerStatus.value = 'online-mode';
                        phoneConnection = null;
                    });
                });

                phonePeer.on('error', (err) => {
                    console.error('PeerJS error:', err);
                    if (err.type === 'unavailable-id') {
                        console.warn('⚠️ Peer ID مستخدم — سيتم توليد ID جديد');
                        clearPersistentPeerId();
                        try { phonePeer.destroy(); } catch (e) {}
                        phonePeer = null;
                        setTimeout(() => startPeerJSScanner(), 200);
                    }
                });

                if (scannerTimeout) clearTimeout(scannerTimeout);
                scannerTimeout = setTimeout(() => {
                    if (scannerStatus.value === 'online-mode') {
                        scannerError.value = 'لم يتصل أي هاتف. جرب مرة أخرى.';
                    }
                }, 5 * 60 * 1000);

            } catch (err) {
                console.error('PeerJS init error:', err);
                scannerError.value = 'تعذر تشغيل PeerJS';
                scannerStatus.value = 'error';
            }
        };

        const regeneratePeerId = () => {
            clearPersistentPeerId();

            if (phonePeer) {
                try { phonePeer.destroy(); } catch (e) {}
                phonePeer = null;
            }

            scannerQrData.value = '';
            scannerStatus.value = 'detecting';
            scannerError.value = '';

            setTimeout(() => {
                scannerStatus.value = 'online-mode';
                startPeerJSScanner();
            }, 200);
        };

        const startManualScanner = async () => {
            scannerStatus.value = 'offline-mode';

            try {
                // ✅ استخدم الـ Loader الجديد
                const SimplePeer = await loadSimplePeer();

                if (typeof SimplePeer !== 'function') {
                    throw new Error('SimplePeer ليس دالة صالحة');
                }

                phoneSimplePeer = new SimplePeer({
                    initiator: true,
                    trickle: false,
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                        ],
                    },
                });

                phoneSimplePeer.on('signal', async (data) => {
                    if (data.type === 'offer') {
                        const offerEncoded = btoa(JSON.stringify(data));

                        try {
                            scannerQrData.value = await QRCode.toDataURL(offerEncoded, {
                                width: 500,
                                margin: 1,
                                errorCorrectionLevel: 'L',
                                color: {
                                    dark: '#0f172a',
                                    light: '#ffffff',
                                },
                            });
                            scannerStatus.value = 'waiting-answer';
                        } catch (err) {
                            console.error('Offer QR error:', err);
                            scannerError.value = 'تعذر توليد QR';
                            scannerStatus.value = 'error';
                        }
                    }
                });

                phoneSimplePeer.on('connect', () => {
                    console.log('✅ Manual WebRTC connected');
                    scannerStatus.value = 'connected';
                    scannerManualStep.value = 3;

                    stopAnswerScanner();

                    showAlert('✅ تم الاتصال بالهاتف', 'success');
                });

                phoneSimplePeer.on('data', (data) => {
                    try {
                        const msg = JSON.parse(data.toString());
                        if (msg.type === 'barcode') {
                            scannerLastCode.value = msg.code;
                            scannerScanCount.value++;
                            phoneSimplePeer.send(JSON.stringify({ type: 'ack' }));

                            const success = handleScannedBarcode(msg.code);
                            playSound(success ? 'cart' : 'error');
                        }
                    } catch (e) {}
                });

                phoneSimplePeer.on('error', (err) => {
                    console.error('SimplePeer error:', err);
                    // لا نظهر خطأ هنا — قد تكون مشاكل شبكة عادية
                });

                scannerManualStep.value = 1;

            } catch (error) {
                console.error('Failed to init manual scanner:', error);

                // ✅ رسالة خطأ واضحة للمستخدم
                let userMessage = 'تعذر تشغيل الاتصال اليدوي';

                if (error.message?.includes('غير محمّلة') || error.message?.includes('CDN')) {
                    userMessage = 'الاتصال اليدوي يحتاج تحميل مكتبة. يرجى الاتصال بالإنترنت مرة واحدة.';
                } else if (error.message?.includes('مهلة')) {
                    userMessage = 'انتهت مهلة التحميل. تحقق من الإنترنت.';
                } else if (error.message?.includes('SimplePeer')) {
                    userMessage = 'تعذر تحميل مكتبة الاتصال — جرب الوضع التلقائي';
                }

                scannerError.value = userMessage;
                scannerStatus.value = 'error';
            }
        };

        const startAnswerScanner = async () => {
            scannerManualStep.value = 2;

            await nextTick();
            await new Promise(resolve => setTimeout(resolve, 300));

            try {
                answerScanner = new Html5Qrcode('answerReader', {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    verbose: false,
                });

                await answerScanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    onAnswerScanned,
                    () => {}
                );
            } catch (err) {
                console.error('Answer scanner error:', err);
                scannerError.value = 'تعذر فتح الكاميرا لمسح QR الإجابة';
            }
        };

        const onAnswerScanned = async (decodedText) => {
            try {
                const decoded = JSON.parse(atob(decodedText));

                if (phoneSimplePeer) {
                    phoneSimplePeer.signal(decoded);
                    console.log('📥 Answer received, signaling peer');
                }

                stopAnswerScanner();
                scannerManualStep.value = 3;

            } catch (err) {
                console.error('Answer parse error:', err);
                playSound('error');
            }
        };

        const stopAnswerScanner = () => {
            if (answerScanner) {
                try { answerScanner.stop(); } catch (e) {}
                answerScanner = null;
            }
        };

        const handleScannedBarcode = (barcode) => {
            const medicine = findMedicineByBarcode(barcode);

            if (!medicine) {
                showAlert(`لم يتم العثور على دواء: ${barcode}`, 'error');
                return false;
            }

            if (showBatchSelector.value) {
                showAlert('أكمل اختيار الدفعة أولاً', 'warning');
                return false;
            }

            const batch = medicine.batches?.[0];
            const priceRecord = batch?.prices?.[0];

            if (!batch || !priceRecord) {
                showAlert('الدواء غير متوفر', 'error');
                return false;
            }

            if (batch.prices && batch.prices.length > 1) {
                addToCart(medicine, priceRecord);
            } else {
                proceedAddToCart(medicine, priceRecord, batch);
            }

            focusSearch();
            return true;
        };

        // ✅ إخفاء المودال فقط — الاتصال يبقى نشطاً
        const closePhoneScanner = () => {
            console.log('👁️ Hiding scanner modal (connection stays alive)');
            showScannerModal.value = false;
        };
        
        // ✅ قطع الاتصال فعلياً — يُستدعى عند الحاجة فقط
        const destroyPhoneScanner = () => {
            console.log('🔌 Destroying scanner connection');
        
            try {
                if (scannerTimeout) {
                    clearTimeout(scannerTimeout);
                    scannerTimeout = null;
                }
        
                if (phoneConnection) {
                    try { phoneConnection.close(); } catch (e) {}
                    phoneConnection = null;
                }
        
                if (phonePeer) {
                    try { phonePeer.destroy(); } catch (e) {}
                    phonePeer = null;
                }
        
                if (phoneSimplePeer) {
                    try { phoneSimplePeer.destroy(); } catch (e) {}
                    phoneSimplePeer = null;
                }
        
                stopAnswerScanner();
            } catch (e) {
                console.warn('Cleanup error:', e);
            }
        
            showScannerModal.value = false;
            scannerStatus.value = 'detecting';
            scannerQrData.value = '';
            scannerMode.value = '';
        };
        const loadShift = async () => {
            try {
                const current = await getCurrentShiftForPOS();

                if (!current) {
                    shift.value = null;
                    showAlert('لا توجد وردية مفتوحة حالياً', 'error');
                    return null;
                }

                shift.value = { ...current };
                closingCash.value = '';
                showCloseShift.value = true;
                return shift.value;
            } catch (error) {
                console.error('POS loadShift error:', error);
                showAlert(error?.message || 'تعذر تحميل الوردية الحالية', 'error');
                return null;
            }
        };

        const refreshCurrentShift = async () => {
            try {
                const current = await getCurrentShiftForPOS();
                if (current) {
                    shift.value = { ...current };
                    if (currentUser.value?.id) {
                        saveCachedShift(currentUser.value.id, current);
                    }
                }
                return shift.value;
            } catch (error) {
                console.warn('تعذر تحديث الوردية الحالية:', error);
                return shift.value;
            }
        };

        const loadShiftSilently = async () => {
            try {
                const current = await getCurrentShiftForPOS();
                if (current) {
                    shift.value = { ...current };
                    if (currentUser.value?.id) {
                        saveCachedShift(currentUser.value.id, current);
                    }
                } else {
                    shift.value = null;
                }
                return shift.value;
            } catch (error) {
                console.warn('تعذر تحميل الوردية بصمت:', error);
                return null;
            }
        };

        const loading = ref(false);

        const confirmCloseShift = async () => {
            if (loading.value) return;

            if (!shift.value) {
                showAlert('لا توجد وردية مفتوحة لإغلاقها', 'error');
                return;
            }

            const amount = Number(closingCash.value || 0);

            if (!Number.isFinite(amount) || amount < 0) {
                showAlert('أدخل مبلغ الإغلاق بشكل صحيح', 'error');
                return;
            }

            if (!confirm('هل أنت متأكد من إغلاق الوردية الحالية؟')) return;

            loading.value = true;

            try {
                await closeCurrentShiftFromPOS(shift.value, amount, Number(accountingBalance.value));
                shift.value = null;
                delete axios.defaults.headers.common['Authorization'];

                try {
                    printInvoice({
                        id: shift.value?.id,
                        user_name: currentUser.value?.name,
                        opened_at: shift.value?.opened_at,
                        closed_at: new Date().toISOString(),
                        opening_cash: shift.value?.opening_cash,
                        cash_sales: shift.value?.cash_sales,
                        card_sales: shift.value?.card_sales,
                        debts_amount: shift.value?.debts_amount,
                        expenses_amount: shift.value?.expenses_amount,
                        withdraw_amount: shift.value?.withdraw_amount,
                        refund_amount: shift.value?.refund_amount,
                        expected_cash: accountingBalance.value,
                        closing_cash: Number(closingCash.value || 0),
                        sales_count: shift.value?.sales_count,
                    }, { autoPrint: true, width: 80 });
                } catch (e) {
                    console.warn('تعذر طباعة تقرير الإغلاق:', e);
                }

                window.location.href = 'login.html';

            } catch (error) {
                console.error('Confirm close shift error:', error);
                showAlert(
                    error?.response?.data?.message ||
                    error?.message ||
                    'تعذر إغلاق الوردية، يرجى المحاولة مرة أخرى',
                    'error'
                );
            } finally {
                loading.value = false;
            }
        };

        const showFinanceMenu = ref(false);

        const showExpenseModal = ref(false);
        const expense = ref({ title: '', amount: '', notes: '' });
        const expenseLoading = ref(false);

        const openExpenseModal = () => {
            showFinanceMenu.value = false;
            expense.value = { title: '', amount: '', notes: '' };
            showExpenseModal.value = true;
        };

        const saveExpense = async () => {
            const title = String(expense.value.title || '').trim();
            const amount = Number(expense.value.amount);

            if (!title) {
                showAlert('أدخل اسم المصروف', 'error');
                return;
            }
            if (!Number.isFinite(amount) || amount <= 0) {
                showAlert('أدخل مبلغاً صحيحاً', 'error');
                return;
            }
            if (!shift.value || shift.value.status !== 'open') {
                showAlert('لا توجد وردية مفتوحة', 'error');
                return;
            }

            const pinResult = await requirePin('expense', 'إضافة مصروف');
            if (pinResult.status === 'cancelled') {
                showAlert('تم إلغاء المصروف', 'error');
                return;
            }
            if (pinResult.status === 'no_cashier') {
                showAlert('يجب تسجيل دخول الكاشير أولاً', 'error');
                return;
            }

            expenseLoading.value = true;

            try {
                const result = await updateShiftAfterPOSOperation({
                    type: 'expense',
                    amount: amount,
                    title: title,
                    notes: String(expense.value.notes || '').trim(),
                    shift_id: shift.value?.server_shift_id || shift.value?.local_shift_id || shift.value?.id,
                    branch_id: currentUser.value?.branch_id,
                    user_id: currentUser.value?.id,
                });

                if (result?.shift) shift.value = result.shift;

                if (navigator.onLine) {
                    await syncPendingShiftFinanceOperations();
                    await refreshCurrentShift();
                    showAlert('تم حفظ المصروف ومزامنته', 'success');
                } else {
                    showAlert('تم حفظ المصروف محلياً وسيتم مزامنته عند عودة الاتصال', 'success');
                }

                expense.value = { title: '', amount: '', notes: '' };
                showExpenseModal.value = false;

            } catch (error) {
                console.error('Expense error:', error);
                showAlert(error?.response?.data?.message || error?.message || 'تعذر حفظ المصروف', 'error');
            } finally {
                expenseLoading.value = false;
            }
        };

        const showWithdrawModal = ref(false);
        const withdraw = ref({ amount: '', reason: '' });
        const withdrawLoading = ref(false);

        const openWithdrawModal = () => {
            showFinanceMenu.value = false;
            withdraw.value = { amount: '', reason: '' };
            showWithdrawModal.value = true;
        };

        const closeWithdrawModal = () => {
            showWithdrawModal.value = false;
        };

        const saveWithdraw = async () => {
            const amount = Number(withdraw.value.amount);
            const reason = String(withdraw.value.reason || '').trim();

            if (!Number.isFinite(amount) || amount <= 0) {
                showAlert('أدخل مبلغ سحب صحيح', 'error');
                return;
            }
            if (!reason) {
                showAlert('أدخل سبب السحب', 'error');
                return;
            }
            if (!shift.value || shift.value.status !== 'open') {
                showAlert('لا توجد وردية مفتوحة', 'error');
                return;
            }

            const pinResult = await requirePin('withdraw', 'سحب نقدي');
            if (pinResult.status === 'cancelled') {
                showAlert('تم إلغاء السحب', 'error');
                return;
            }
            if (pinResult.status === 'no_cashier') {
                showAlert('يجب تسجيل دخول الكاشير أولاً', 'error');
                return;
            }

            withdrawLoading.value = true;

            try {
                const result = await updateShiftAfterPOSOperation({
                    type: 'withdraw',
                    amount: Number(withdraw.value.amount),
                    reason: reason,
                    shift_id: shift.value?.server_shift_id || shift.value?.local_shift_id || shift.value?.id,
                    branch_id: currentUser.value?.branch_id,
                    user_id: currentUser.value?.id,
                });

                if (result?.shift) shift.value = result.shift;

                if (navigator.onLine) {
                    await syncPendingShiftFinanceOperations();
                    await refreshCurrentShift();
                    showAlert('تم تسجيل السحب ومزامنته', 'success');
                } else {
                    showAlert('تم حفظ السحب محلياً وسيتم مزامنته عند عودة الاتصال', 'success');
                }

                withdraw.value = { amount: '', reason: '' };
                showWithdrawModal.value = false;

            } catch (error) {
                console.error('Withdraw error:', error);
                showAlert(error?.response?.data?.message || error?.message || 'تعذر تسجيل السحب', 'error');
            } finally {
                withdrawLoading.value = false;
            }
        };

        const showDebtPaymentModal = ref(false);
        const pendingDebts = ref([]);
        const selectedDebtId = ref(null);
        const loadingDebts = ref(false);
        const debtPayment = ref({ amount: '', notes: '' });

        const loadPendingDebts = async () => {
            if (!currentUser.value?.id) return;

            loadingDebts.value = true;
            try {
                const res = await axios.get(`${API_BASE}/debts/pending-for-me`, {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    },
                    params: { _ts: Date.now() },
                });
                pendingDebts.value = res.data?.debts || [];
            } catch (e) {
                console.warn('تعذر جلب الديون المعلقة:', e);
                pendingDebts.value = [];
            } finally {
                loadingDebts.value = false;
            }
        };

        const openDebtPaymentModal = () => {
            showFinanceMenu.value = false;
            debtPayment.value = { amount: '', notes: '' };
            selectedDebtId.value = null;
            pendingDebts.value = [];
            showDebtPaymentModal.value = true;
            loadPendingDebts();
        };

        const closeDebtPaymentModal = () => {
            showDebtPaymentModal.value = false;
        };

        const saveDebtPayment = async () => {
            const amount = Number(debtPayment.value.amount);
            const notes = String(debtPayment.value.notes || '').trim();

            if (!Number.isFinite(amount) || amount <= 0) {
                showAlert('أدخل مبلغاً صحيحاً', 'error');
                return;
            }
            if (!shift.value || shift.value.status !== 'open') {
                showAlert('لا توجد وردية مفتوحة', 'error');
                return;
            }

            const pinResult = await requirePin('debt_payment', 'سداد دين');
            if (pinResult.status === 'cancelled') {
                showAlert('تم إلغاء السداد', 'error');
                return;
            }
            if (pinResult.status === 'no_cashier') {
                showAlert('يجب تسجيل دخول الكاشير أولاً', 'error');
                return;
            }

            if (selectedDebtId.value) {
                const debt = pendingDebts.value.find(d => d.id === selectedDebtId.value);
                if (debt && amount > debt.remaining_amount) {
                    showAlert(
                        `⚠️ المبلغ يتجاوز المتبقي من الدين المحدد:\n` +
                        `المتبقي: ${debt.remaining_amount.toLocaleString()} ج.س\n` +
                        `المطلوب: ${amount.toLocaleString()} ج.س`,
                        'error'
                    );
                    return;
                }
            }

            try {
                const result = await updateShiftAfterPOSOperation({
                    type: 'debt_payment',
                    amount: amount,
                    notes: notes,
                    debt_id: selectedDebtId.value,
                    shift_id: shift.value?.server_shift_id || shift.value?.local_shift_id || shift.value?.id,
                    branch_id: currentUser.value?.branch_id,
                    user_id: currentUser.value?.id,
                });

                if (result?.shift) shift.value = result.shift;

                if (navigator.onLine) {
                    await syncPendingShiftFinanceOperations();
                    await refreshCurrentShift();
                    showAlert('تم تسجيل سداد الدين ومزامنته', 'success');
                } else {
                    showAlert('تم حفظ سداد الدين محلياً وسيتم مزامنته عند عودة الاتصال', 'success');
                }

                debtPayment.value = { amount: '', notes: '' };
                selectedDebtId.value = null;
                pendingDebts.value = [];
                showDebtPaymentModal.value = false;

            } catch (error) {
                console.error('Debt payment error:', error);
                showAlert(error?.response?.data?.message || error?.message || 'تعذر تسجيل سداد الدين', 'error');
            }
        };

        const recentSales = ref([]);
        const offlineSalesCount = ref(0);

        const refreshOfflineCount = async () => {
            try {
                if (!currentUser.value?.id) {
                    offlineSalesCount.value = 0;
                    return;
                }
                const financeOps = await getPendingShiftFinanceOperations(currentUser.value.id);
                const pendingOps = financeOps.filter(op => !op.synced && !op.failed);
                const salesCount = pendingOps.filter(op => op.type === 'sale').length;
                const refundsCount = pendingOps.filter(op => op.type === 'refund').length;

                offlineSalesCount.value = salesCount + refundsCount;
            } catch (error) {
                console.warn('تعذر تحديث عدد الفواتير المعلقة:', error);
                offlineSalesCount.value = 0;
            }
        };

        const saveSaleOffline = async (payload) => {
            if (!currentUser.value?.id) {
                showAlert('لا توجد بيانات المستخدم المحلية', 'error');
                return false;
            }

            let localShift = shift.value;
            if (!localShift || !localShift.id) {
                try {
                    localShift = await getCachedShift(currentUser.value.id);
                } catch (e) {
                    console.warn('تعذر جلب الوردية من الكاش:', e);
                }
            }

            if (!localShift?.id) {
                showAlert('لا توجد وردية مفتوحة محلياً', 'error');
                return false;
            }

            const serverShiftId = localShift.server_shift_id ||
                                (Number.isFinite(Number(localShift.id)) ? Number(localShift.id) : null);
            const localShiftId = localShift.local_shift_id || localShift.id;

            const operation = {
                type: 'sale',
                amount: Number(cartTotal.value || 0),
                payment_method: payload.payment_method,
                shift_id: serverShiftId || localShiftId,
                local_shift_id: localShiftId,
                branch_id: currentUser.value.branch_id || localShift.branch_id,
                user_id: currentUser.value.id,
                created_at: new Date().toISOString(),
                items: payload.items || [],
                bank_transfer: payload.bank_transfer || null,
                synced: false
            };

            const queued = enqueueShiftFinanceOperation(currentUser.value.id, operation);
            if (!queued) {
                showAlert('فشل حفظ الفاتورة محلياً', 'error');
                return false;
            }

            if (shift.value) {
                const updatedShift = applyPOSOperationToLocalShift(shift.value, operation);
                shift.value = { ...updatedShift };
                if (currentUser.value?.id) {
                    saveCachedShift(currentUser.value.id, shift.value);
                }
            }

            for (const item of cart.value) {
                try {
                    const qty = Number(item.quantity_base || item.quantity || 1);
                    await reduceMedicineStock(item.medicine_id, qty, item.batch_id);
                } catch (error) {
                    console.warn('تعذر تحديث مخزون الدواء المحلي:', error);
                }
            }

            try {
                const cached = await getCachedMedicines();
                allMedicines.value = Array.isArray(cached) ? cached.map(normalizeMedicine) : [];
            } catch (error) {
                console.warn('تعذر تحديث الأدوية من الكاش:', error);
            }

            cart.value = [];

            playSound('checkout');

            await refreshOfflineCount();
            await loadRecentSales();

            showAlert('✅ تم حفظ الفاتورة محلياً', 'success');
            return true;
        };

        const checkout = async () => {
            if (!cart.value.length) {
                showAlert('السلة فارغة', 'error');
                return;
            }

            if (savingSale.value) {
                console.warn('⏸️ البيع قيد التنفيذ — تجاهل النقر المكرر');
                return;
            }

            const stockIssues = validateCartStock(cart.value, allMedicines.value);
            if (stockIssues.length > 0) {
                const messages = stockIssues.map(issue => `• ${issue.name}: ${issue.reason}`).join('\n');
                showAlert(`⚠️ لا يمكن إتمام البيع — مشاكل مخزون:\n${messages}`, 'error');
                return;
            }

            savingSale.value = true;

            try {
                const totalAmount = Number(cartTotal.value || 0);
                if (totalAmount <= 0) {
                    showAlert('إجمالي الفاتورة غير صحيح', 'error');
                    return;
                }

                let currentShift = shift.value;
                if (!currentShift || currentShift.status !== 'open') {
                    try {
                        currentShift = await getCachedShift(currentUser.value?.id);
                        if (currentShift && currentShift.status === 'open') {
                            shift.value = currentShift;
                        }
                    } catch (e) {
                        console.warn('تعذر جلب الوردية من الكاش:', e);
                    }
                }

                if (!currentShift || currentShift.status !== 'open') {
                    showAlert('لا توجد وردية مفتوحة حالياً', 'error');
                    return;
                }

                const serverShiftId = currentShift.server_shift_id ||
                                    (Number.isFinite(Number(currentShift.id)) ? Number(currentShift.id) : null);
                const localShiftId = currentShift.local_shift_id || currentShift.id;

                const payload = {
                    branch_id: currentUser.value?.branch_id,
                    user_id: currentUser.value?.id,
                    shift_id: serverShiftId || localShiftId,
                    payment_method: payment.method,
                    bank_transfer: payment.method === 'bank' ? { ...payment.bank } : null,
                    items: cart.value.map(item => ({
                        medicine_batch_id: item.batch_id,
                        quantity: item.quantity,
                        unit: item.unit,
                        medicine_unit_id: Number(item.medicine_unit_id),
                        quantity_base: item.quantity_base || item.quantity,
                        medicine_name: item.name,
                        price: item.selling_price
                    }))
                };

                if (!isOnline.value) {
                    await saveSaleOffline(payload);
                    return;
                }

                let saleResponse = null;

                try {
                    await updateShiftAfterPOSOperation({
                        type: 'sale',
                        amount: totalAmount,
                        payment_method: payment.method,
                        shift_id: serverShiftId || localShiftId,
                        branch_id: currentUser.value?.branch_id,
                        user_id: currentUser.value?.id,
                        created_at: new Date().toISOString(),
                        synced: true
                    });

                    saleResponse = await axios.post(`${API_BASE}/sales`, payload, {
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });

                    for (const item of cart.value) {
                        try {
                            const qty = Number(item.quantity_base || item.quantity || 1);
                            await reduceMedicineStock(item.medicine_id, qty, item.batch_id);
                        } catch (e) {
                            console.warn('تعذر خصم المخزون محلياً:', e);
                        }
                    }

                    try {
                        const cached = await getCachedMedicines();
                        allMedicines.value = Array.isArray(cached) ? cached.map(normalizeMedicine) : [];
                    } catch (e) {}

                    await refreshCurrentShift();
                    loadMedicines().catch(() => {});
                    await loadRecentSales();

                    cart.value = [];

                    playSound('checkout');

                    showAlert('تم حفظ الفاتورة بنجاح', 'success');

                    try {
                        const invoiceId =
                            saleResponse?.data?.sale?.id ||
                            saleResponse?.data?.id ||
                            `L-${Date.now().toString().slice(-6)}`;

                        const saleForPrint = {
                            id: invoiceId,
                            created_at: new Date().toISOString(),
                            total_amount: totalAmount,
                            payment_method: payment.method,
                            bank_name: payment.bank?.bank_name,
                            bank_reference: payment.bank?.reference_number,
                            user: { name: currentUser.value?.name || '' },
                            items: payload.items.map(it => ({
                                medicine_name: it.medicine_name,
                                quantity: it.quantity,
                                price: it.price,
                                unit: it.unit,
                            })),
                            total_refunded: 0,
                        };

                        safePrintInvoice(saleForPrint);
                    } catch (printError) {
                        console.warn('تعذر طباعة الفاتورة:', printError);
                    }

                } catch (error) {
                    if (!navigator.onLine) {
                        isOnline.value = false;
                        await saveSaleOffline(payload);
                        showAlert('انقطع الاتصال، تم حفظ الفاتورة محلياً', 'success');
                        return;
                    }
                    console.error('Checkout error:', error);
                    showAlert(error.response?.data?.message || 'تعذر إتمام البيع', 'error');
                    await refreshCurrentShift();
                }

            } catch (error) {
                console.error('Checkout unexpected error:', error);
                showAlert(error?.response?.data?.message || 'حدث خطأ غير متوقع أثناء إتمام البيع', 'error');
            } finally {
                savingSale.value = false;
                focusSearch();
            }
        };

        const loadRecentSales = async () => {
            try {
                let localSales = [];

                if (currentUser.value?.id) {
                    try {
                        const financeOps = await getPendingShiftFinanceOperations(currentUser.value.id);
                        const saleOps = financeOps.filter(op => op.type === 'sale' && !op.synced && !op.failed);
                        localSales = saleOps.map(op => ({
                            id: op.operation_id || op.id,
                            total_amount: op.amount || 0,
                            created_at: op.created_at || new Date().toISOString(),
                            payment_method: op.payment_method || 'cash',
                            is_refunded: false,
                            is_local: true,
                            items: op.items || [],
                            _operation: op
                        }));
                    } catch (e) {
                        console.warn('⚠️ فشل قراءة finance queue:', e);
                    }
                }

                if (!isOnline.value) {
                    recentSales.value = localSales;
                    return;
                }

                // ✅ مسار POS الجديد — يجلب مبيعات الوردية المفتوحة فقط
                const response = await axios.get(`${API_BASE}/pos/recent-sales`, {
                    params: { _ts: Date.now() },
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });

                const serverSales =
                    response.data?.recent
                    ?? response.data?.data
                    ?? (Array.isArray(response.data) ? response.data : []);

                const allSales = [...serverSales, ...localSales];
                const uniqueMap = new Map();

                for (const sale of allSales) {
                    const key = sale.id;
                    if (uniqueMap.has(key) && uniqueMap.get(key).is_local && !sale.is_local) {
                        uniqueMap.set(key, sale);
                    } else if (!uniqueMap.has(key)) {
                        uniqueMap.set(key, sale);
                    }
                }

                const uniqueSales = Array.from(uniqueMap.values());
                uniqueSales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                recentSales.value = uniqueSales;
                prefetchSaleDetailsForOffline(uniqueSales.filter(s => !s.is_local));

            } catch (error) {
                console.warn('⚠️ تعذر تحميل المبيعات:', error);
                recentSales.value = [];
            }
        };

        const prefetchSaleDetailsForOffline = (sales) => {
            if (!sales?.length || !currentUser.value?.id) return;
            const userId = currentUser.value.id;

            sales.slice(0, 50).forEach(async (sale) => {
                try {
                    const cached = getCachedSaleDetails(userId, sale.id);
                    if (cached?._cached_at && (Date.now() - new Date(cached._cached_at).getTime()) < 5 * 60 * 1000) {
                        return;
                    }
                    const response = await axios.get(`${API_BASE}/sales/${sale.id}/details`);
                    cacheSaleDetails(userId, sale.id, response.data);
                } catch (error) {
                    console.warn(`تعذر تحميل تفاصيل الفاتورة ${sale.id} مسبقاً:`, error.message);
                }
            });
        };

        watch(shift, (newVal) => {
            console.log('🔄 Shift updated:', {
                cash_sales: newVal?.cash_sales,
                expected_cash: newVal?.expected_cash,
                card_sales: newVal?.card_sales,
                refund_amount: newVal?.refund_amount
            });
        }, { deep: true });

        const initApp = async () => {
            console.log('🔄 POS: بدء تهيئة الصفحة');

            updateOnlineState();
            await loadSettings();

            setPrintServerSettings(pharmacySettings.value);
            printSettings.value = getPrintSettings();
            isLoading.value = true;
           // ═══════════════════════════════════════════════════════
            // ✅ التحقق من simple-peer (يُحمّل من HTML مسبقاً)
            // ═══════════════════════════════════════════════════════
            if (typeof window.SimplePeer === 'function') {
                console.log('✅ simple-peer ready from HTML script');
                SimplePeerConstructor = window.SimplePeer;
            } else {
                console.warn('⚠️ simple-peer غير محمّل من HTML — سيُحمّل عند الحاجة');
            }
            try {
                if (isOnline.value) {
                    try {
                        const response = await axios.get(`${API_BASE}/current-user`, {
                            params: { _ts: Date.now() },
                            headers: {
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                                'Pragma': 'no-cache',
                                'Expires': '0'
                            }
                        });
                        currentUser.value = response.data;
                        await cacheUser(response.data);
                    } catch (error) {
                        console.warn('تعذر تحديث المستخدم الحالي:', error);
                    }
                }

                if (!currentUser.value) {
                    try {
                        currentUser.value = await getCachedUser();
                    } catch (error) {
                        console.warn('تعذر قراءة المستخدم من IndexedDB:', error);
                    }

                    if (!currentUser.value?.id) {
                        try {
                            const authMod = await import('../auth.js');
                            const authUser = await authMod.getCachedUser();
                            if (authUser?.id) {
                                currentUser.value = authUser;
                                try {
                                    await cacheUser(authUser);
                                } catch (e) {}
                            }
                        } catch (error) {
                            console.warn('تعذر قراءة المستخدم من localStorage:', error);
                        }
                    }
                }

                if (!activeCashier.value?.id && currentUser.value?.id) {
                    activeCashier.value = {
                        id:   currentUser.value.id,
                        name: currentUser.value.name,
                        role: currentUser.value.role,
                    };
                    try {
                        localStorage.setItem(
                            'miraclepos_active_cashier',
                            JSON.stringify(activeCashier.value)
                        );
                    } catch (e) {}
                }

                try {
                    const settingsRes = await axios.get(`${API_BASE}/settings/public`);
                    setPrintServerSettings(settingsRes.data);
                    printSettings.value = getPrintSettings();
                } catch (e) {
                    console.warn('تعذر تحميل إعدادات الطباعة من السرفر:', e);
                }

                if (isOnline.value) {
                    try {
                        const syncResult = await runFullSync();
                        if (syncResult.total > 0) {
                            console.log(`✅ مزامنة أولية: ${syncResult.total} عملية`);
                            playSound('sync');
                        }
                    } catch (error) {
                        console.warn('تعذرت المزامنة الأولية:', error);
                    }
                }

                try {
                    await loadShiftSilently();
                } catch (error) {
                    console.error('تعذر تحميل الوردية الحالية:', error);
                    shift.value = null;
                }

                await loadMedicines();
                await refreshOfflineCount();
                await loadRecentSales();

                const pendingCount = await countPendingSales();
                if (pendingCount > 0) {
                    showAlert(`📦 يوجد ${pendingCount} فاتورة بانتظار المزامنة`, 'info');
                }

                console.log('✅ POS: اكتملت التهيئة', {
                    online: isOnline.value,
                    shift: shift.value?.id,
                    medicines: allMedicines.value.length,
                    pendingSales: pendingCount
                });

            } catch (error) {
                console.error('❌ فشل تهيئة POS:', error);
                showAlert('حدث خطأ أثناء تهيئة النظام، قد تعمل بعض الميزات بشكل محدود', 'error');
            } finally {
                isLoading.value = false;
                await nextTick();
                focusSearch();
            }
        };

        const logout = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('offline_mode');
            if (axios.defaults.headers?.common) {
                delete axios.defaults.headers.common.Authorization;
            }
            window.location.href = 'login.html';
        };

        const handleOnline = async () => {
            isOnline.value = true;
            console.log('🌐 POS: أصبح النظام Online');

            try {
                const result = await runFullSync();

                if (result.success) {
                    if (result.total > 0) {
                        playSound('sync');
                    }

                    showAlert(
                        result.total > 0
                            ? `✅ تمت مزامنة ${result.total} عملية بنجاح`
                            : '✅ لا توجد عمليات معلقة',
                        'success'
                    );
                } else {
                    showAlert('⚠️ تمت المزامنة جزئياً — تحقق من الأخطاء', 'warning');
                }

                await loadShiftSilently();
                await loadMedicines();
                await loadRecentSales();
                await refreshOfflineCount();

            } catch (error) {
                console.error('❌ خطأ في المزامنة:', error);
                showAlert('⚠️ تعذرت المزامنة الكاملة', 'error');
            }
        };

        const handleOffline = () => {
            isOnline.value = false;
            console.log('POS: النظام يعمل الآن Offline');
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateOnlineState();
                if (isOnline.value && !syncProgress.active) {
                    loadShiftSilently();
                }
            }
        };

        onMounted(async () => {
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            document.addEventListener('visibilitychange', handleVisibilityChange);

            await initApp();
            await nextTick();
            focusSearch();
        });

        onUnmounted(() => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // ✅ اقطع الاتصال فقط عند إغلاق الصفحة
            destroyPhoneScanner();
        });

        return {
            currentUser,
            isOnline,
            alert,
            showAlert,
            hideAlert,
            isLoading,
            savingSale,
            loading,
            expenseLoading,
            withdrawLoading,
            search,
            searchInput,
            filteredMedicines,
            findMedicineByBarcode,
            processBarcode,
            handleBarcodeSearch,
            focusSearch,
            allMedicines,
            usingCachedMedicines,
            formatStockQuantity,
            getPriceUnitName,
            loadMedicines,
            normalizeMedicinesResponse,
            cart,
            cartTotal,
            cartStockIssues,
            itemHasStockIssue,
            addToCart,
            proceedAddToCart,
            clearCart,
            updateQuantity,
            removeFromCart,
            checkAvailableBatches,
            showBatchSelector,
            availableBatches,
            pendingBatchMedicine,
            selectBatch,
            selectFirstBatchFifo,
            closeBatchSelector,
            payment,
            showBankModal,
            changePaymentMethod,
            closeBankModal,
            saveBankPayment,
            checkout,
            recentSales,
            offlineSalesCount,
            saveSaleOffline,
            refreshRecentSales: loadRecentSales,
            selectedSale,
            showSaleDetailModal,
            saleDetails,
            refundItems,
            viewSaleDetails,
            closeSaleDetail,
            refundLineItem,
            pendingRefundsCount,
            isRefundProcessing,
            shift,
            showCloseShift,
            closingCash,
            difference,
            accountingBalance,
            loadShift,
            confirmCloseShift,
            refreshCurrentShift,
            updateLocalShiftAfterOperation: updateShiftAfterPOSOperation,
            showFinanceMenu,
            showExpenseModal,
            openExpenseModal,
            saveExpense,
            expense,
            showWithdrawModal,
            withdraw,
            openWithdrawModal,
            closeWithdrawModal,
            saveWithdraw,
            showDebtPaymentModal,
            debtPayment,
            openDebtPaymentModal,
            closeDebtPaymentModal,
            saveDebtPayment,
            pendingDebts,
            selectedDebtId,
            loadingDebts,
            loadPendingDebts,
            handleOnline,
            handleOffline,
            logout,
            refreshOfflineCount,
            initApp,
            updateOnlineState,
            reprintInvoice,
            printSettings,
            logoFailed,
            pharmacySettings,
            showPinModal,
            pinInput,
            pinError,
            pinHint,
            pinVerifying,
            addPinDigit,
            removePinDigit,
            clearPin,
            cancelPin,
            activeCashier,
            syncProgress,

            // Responsive
            activeTab,

            // Phone Scanner
            showScannerModal,
            scannerQrData,
            scannerStatus,
            scannerLastCode,
            scannerError,
            scannerScanCount,
            scannerMode,
            scannerManualStep,
            loadingPhoneScanner,
            openPhoneScanner,
            closePhoneScanner,
            startAnswerScanner,
            regeneratePeerId,
            closePhoneScanner,      // ← إخفاء فقط
            destroyPhoneScanner,  
        };
    }
});

const existingApp = document.querySelector('#app')._vue_app_;
if (existingApp) {
    existingApp.unmount();
}
app.mount('#app');
