import '@fortawesome/fontawesome-free/css/all.min.css';
import '../../css/app.css';

import {
    createApp,
    ref,
    onMounted,
    onUnmounted
} from 'vue';

import axios from 'axios';

import { API_BASE } from '../config.js';

import '../pwa.js';

// ✅ المصدر 1: localStorage (auth.js)
import {
    cacheUser as cacheUserAuth,
    getCachedUser as getCachedUserAuth,
} from '../auth.js';

// ✅ المصدر 2: IndexedDB (offline-db.js)
import {
    cacheUser as cacheUserIDB,
    getCachedUser as getCachedUserIDB,
} from '../offline-db.js';


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/
const EULA_VERSION = '1.0.0';
const EULA_KEY = 'miraclepos_eula_acceptance';


/*
|--------------------------------------------------------------------------
| Helper: حفظ المستخدم في كلا المصدرين
|--------------------------------------------------------------------------
*/
async function cacheUserEverywhere(user) {
    if (!user) return false;

    let ok1 = false, ok2 = false;

    try {
        await cacheUserAuth(user);
        ok1 = true;
    } catch (e) {
        console.warn('❌ cacheUserAuth failed:', e);
    }

    try {
        await cacheUserIDB(user);
        ok2 = true;
    } catch (e) {
        console.warn('❌ cacheUserIDB failed:', e);
    }

    console.log('💾 cacheUserEverywhere:', { localStorage: ok1, indexedDB: ok2 });
    return ok1 && ok2;
}

/*
|--------------------------------------------------------------------------
| Helper: قراءة المستخدم من أي مصدر متاح
|--------------------------------------------------------------------------
*/
async function readCachedUser() {
    try {
        const u = await getCachedUserAuth();
        if (u?.id) return u;
    } catch (e) {}

    try {
        const u = await getCachedUserIDB();
        if (u?.id) return u;
    } catch (e) {}

    return null;
}


/*
|--------------------------------------------------------------------------
| Helper: هل يحتاج المستخدم لرؤية EULA؟
|--------------------------------------------------------------------------
| نرجع true في الحالات التالية:
|   - لم يوافق أبداً
|   - وافق على إصدار قديم
|   - وافق بدون تفعيل "لا تعرض مجدداً"
|--------------------------------------------------------------------------
*/
function needsEulaAcceptance() {
    try {
        const raw = localStorage.getItem(EULA_KEY);
        if (!raw) return true;

        const acceptance = JSON.parse(raw);
        if (!acceptance?.accepted) return true;
        if (acceptance.version !== EULA_VERSION) return true;
        if (acceptance.dont_show_again !== true) return true;

        return false;
    } catch (e) {
        console.warn('Failed to read EULA acceptance:', e);
        return true;
    }
}


/*
|--------------------------------------------------------------------------
| Helper: المسار حسب الدور
|--------------------------------------------------------------------------
*/
function destinationFor(role) {
    if (role === 'admin') return 'admin.html';

    // ✅ كل الأدوار غير الإدارية → shift.html
    // (cashier, pharmacist, صيدلي, أي دور آخر غير admin)
    if (role && role !== 'admin') return 'shift.html';

    return 'login.html';
}


/*
|--------------------------------------------------------------------------
| Password Hash
|--------------------------------------------------------------------------
*/
async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}


/*
|--------------------------------------------------------------------------
| Login Page
|--------------------------------------------------------------------------
*/
createApp({

   template: `

        <div class="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/30 flex items-center justify-center p-4 sm:p-6">

            <div class="w-full max-w-md">

                <!-- ✅ بطاقة تسجيل الدخول -->
                <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

                    <!-- Header -->
                    <div class="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 sm:px-8 py-8 text-center relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>

                        <div class="relative z-10">
                            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                               <img src="icons/icon-192.png" alt="Logo" class="w-16 h-16">
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Miracle<span class="text-emerald-200">POS</span>
                            </h1>
                            <p class="text-emerald-100 text-xs sm:text-sm mt-1.5 font-medium">نظام إدارة الصيدليات</p>
                        </div>
                    </div>

                    <!-- Body -->
                    <div class="px-6 sm:px-8 py-8">

                       <!-- ✅ Overlay تسجيل الدخول -->
                    <transition
                        enter-active-class="transition-opacity duration-200"
                        enter-from-class="opacity-0"
                        enter-to-class="opacity-100"
                        leave-active-class="transition-opacity duration-200"
                        leave-from-class="opacity-100"
                        leave-to-class="opacity-0"
                    >
                        <div
                            v-if="loginInProgress"
                            class="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6"
                        >
                            <div class="text-center max-w-sm">
                                <div class="relative w-24 h-24 mx-auto mb-6">
                                    <div class="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
                                    <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
                                    <div class="absolute inset-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <i class="fas fa-sign-in-alt text-emerald-400 text-3xl"></i>
                                    </div>
                                </div>

                                <h2 class="text-xl font-black text-white mb-2">جاري تسجيل الدخول...</h2>
                                <p class="text-sm text-slate-300 mb-4">يتم التحقق من بياناتك، الرجاء الانتظار</p>

                                <div class="flex items-center justify-center gap-1.5 mt-6">
                                    <div class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                                    <div class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
                                    <div class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
                                </div>
                            </div>
                        </div>
                    </transition>

                    <!-- ✅ Overlay عدم الاتصال -->
                    <div v-if="showOfflineOverlay"
                        class="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <div class="text-center max-w-sm w-full">
                            <div class="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                <i class="fas fa-wifi text-red-400 text-4xl"></i>
                            </div>
                            <h2 class="text-2xl font-black text-white mb-3">لا يوجد اتصال بالإنترنت</h2>
                            <p class="text-slate-300 text-sm mb-8 leading-relaxed">
                                يجب تسجيل الدخول مرة واحدة بالإنترنت
                                قبل استخدام النظام دون اتصال.
                            </p>
                            <button
                                type="button"
                                @click="updateConnectionState"
                                class="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/25 active:scale-95"
                            >
                                <i class="fas fa-sync-alt mr-2"></i>
                                إعادة المحاولة
                            </button>
                        </div>
                    </div>

                        <!-- Login Form -->
                        <div v-if="!showReset">

                            <div class="mb-6 text-center">
                                <h2 class="text-xl sm:text-2xl font-black text-slate-800">تسجيل الدخول</h2>
                                <p class="text-xs text-slate-500 mt-1">أدخل بياناتك للوصول إلى النظام</p>
                            </div>

                            <form @submit.prevent="login" class="space-y-5">

                                <!-- Email -->
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">
                                        <i class="fas fa-envelope text-emerald-600 text-xs ml-1"></i>
                                        البريد الإلكتروني
                                    </label>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <i class="fas fa-user text-slate-300 text-sm"></i>
                                        </div>
                                        <input
                                            v-model.trim="form.email"
                                            type="email"
                                            autocomplete="username"
                                            placeholder="example@miraclepos.test"
                                            required
                                            :disabled="loginInProgress"
                                            class="w-full p-3.5 pr-11 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                    </div>
                                </div>

                                <!-- Password -->
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">
                                        <i class="fas fa-lock text-emerald-600 text-xs ml-1"></i>
                                        كلمة المرور
                                    </label>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <i class="fas fa-key text-slate-300 text-sm"></i>
                                        </div>
                                        <input
                                            v-model="form.password"
                                            type="password"
                                            autocomplete="current-password"
                                            placeholder="••••••••"
                                            required
                                            :disabled="loginInProgress"
                                            class="w-full p-3.5 pr-11 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                    </div>
                                </div>

                                <!-- Submit -->
                                <button
                                    type="submit"
                                    :disabled="loginInProgress"
                                    class="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-emerald-300 disabled:to-emerald-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                                >
                                    <i v-if="loginInProgress" class="fas fa-spinner fa-spin"></i>
                                    <i v-else class="fas fa-sign-in-alt"></i>
                                    <span>{{ loginInProgress ? 'جاري الدخول...' : 'دخول' }}</span>
                                </button>

                            </form>

                            <!-- Forgot Password -->
                            <div class="mt-6 text-center">
                                <button
                                    type="button"
                                    @click="showReset = true"
                                    :disabled="loginInProgress"
                                    class="text-sm text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
                                >
                                    <i class="fas fa-question-circle text-xs ml-1"></i>
                                    نسيت كلمة المرور؟
                                </button>
                            </div>

                        </div>

                        <!-- Password Reset -->
                        <div v-else>

                            <div class="mb-6 text-center">
                                <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                    <i class="fas fa-unlock-alt text-blue-600 text-xl"></i>
                                </div>
                                <h2 class="text-xl font-black text-slate-800">استعادة كلمة المرور</h2>
                                <p class="text-xs text-slate-500 mt-2 leading-relaxed">
                                    أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين
                                </p>
                            </div>

                            <form @submit.prevent="sendResetLink" class="space-y-5">

                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">
                                        <i class="fas fa-envelope text-blue-600 text-xs ml-1"></i>
                                        البريد الإلكتروني
                                    </label>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <i class="fas fa-at text-slate-300 text-sm"></i>
                                        </div>
                                        <input
                                            v-model.trim="resetEmail"
                                            type="email"
                                            autocomplete="email"
                                            placeholder="example@miraclepos.test"
                                            :disabled="loading"
                                            class="w-full p-3.5 pr-11 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm disabled:opacity-60"
                                        >
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    :disabled="loading"
                                    class="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                                >
                                    <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                                    <i v-else class="fas fa-paper-plane"></i>
                                    <span>{{ loading ? 'جاري الإرسال...' : 'إرسال الرابط' }}</span>
                                </button>

                            </form>

                            <div class="mt-6 text-center">
                                <button
                                    type="button"
                                    @click="showReset = false"
                                    :disabled="loading"
                                    class="text-sm text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
                                >
                                    <i class="fas fa-arrow-right text-xs ml-1"></i>
                                    عودة لتسجيل الدخول
                                </button>
                            </div>

                        </div>

                    </div>

                    <!-- Footer -->
                    <div class="bg-slate-50 border-t border-slate-100 px-6 py-4 text-center">
                        <p class="text-[10px] text-slate-400">
                            MiraclePOS v2.0 — جميع الحقوق محفوظة © 2026
                        </p>
                    </div>

                </div>

                <!-- Additional Links -->
                <div class="mt-6 text-center">
                    <p class="text-[10px] text-slate-400">
                        بالمتابعة، أنت توافق على
                        <a href="legal/eula.html" class="text-emerald-600 hover:underline">شروط الاستخدام</a>
                        و
                        <a href="legal/privacy.html" class="text-emerald-600 hover:underline">سياسة الخصوصية</a>
                    </p>
                </div>

            </div>

        </div>

        `,

    setup() {
        const form = ref({ email: '', password: '' });
        const loading = ref(false);
        const loginInProgress = ref(false);   // ✅ نُقل هنا
        const showReset = ref(false);
        const resetEmail = ref('');
        const showOfflineOverlay = ref(false);

        const updateConnectionState = async () => {
            const cachedUser = await readCachedUser();
            showOfflineOverlay.value = !navigator.onLine && !cachedUser;
        };

        const login = async () => {
            if (loginInProgress.value) {
                console.log('⏸️ محاولة دخول مكررة — تجاهل');
                return;
            }

            if (!form.value.email || !form.value.password) {
                alert('أدخل البريد الإلكتروني وكلمة المرور');
                return;
            }

            loginInProgress.value = true;
            loading.value = true;


            try {

                /*
                |--------------------------------------------------------------------------
                | Offline Login
                |--------------------------------------------------------------------------
                */

                if (!navigator.onLine) {

                    const cachedUser = await readCachedUser();

                    if (!cachedUser) {
                        throw new Error('يجب تسجيل الدخول مرة واحدة بالإنترنت أولاً');
                    }

                    const cachedEmail = String(cachedUser.email || '').trim().toLowerCase();
                    const enteredEmail = String(form.value.email || '').trim().toLowerCase();

                    if (!cachedEmail || cachedEmail !== enteredEmail) {
                        throw new Error('هذا الحساب غير محفوظ على الجهاز');
                    }

                    const enteredPasswordHash = await hashPassword(form.value.password);
                    const cachedPasswordHash = String(cachedUser.offline_password_hash || '');

                    if (!cachedPasswordHash) {
                        throw new Error('بيانات الدخول المحلية غير مكتملة. يجب تسجيل الدخول بالإنترنت مرة واحدة لتحديث بيانات الحساب.');
                    }

                    if (enteredPasswordHash !== cachedPasswordHash) {
                        throw new Error('كلمة المرور غير صحيحة');
                    }

                    localStorage.setItem('user', JSON.stringify(cachedUser));
                    localStorage.setItem('offline_mode', 'true');

                    // ✅ فحص EULA (نفس المنطق للأونلاين والأوفلاين)
                    if (needsEulaAcceptance()) {
                        const destination = destinationFor(cachedUser.role);
                        window.location.href = `legal/eula.html?redirect=${encodeURIComponent(destination)}`;
                        return;
                    }

                    // ✅ التوجيه للوجهة
                    window.location.href = destinationFor(cachedUser.role);

                    return;
                }


                /*
                |--------------------------------------------------------------------------
                | Online Login
                |--------------------------------------------------------------------------
                */

                const response = await axios.post(
                    `${API_BASE}/login`,
                    {
                        email: form.value.email,
                        password: form.value.password
                    }
                );


                if (!response.data || !response.data.user || !response.data.token) {
                    throw new Error('استجابة تسجيل الدخول من الخادم غير مكتملة');
                }


                const passwordHash = await hashPassword(form.value.password);


                const cachedUser = {
                    ...response.data.user,
                    offline_password_hash: passwordHash,
                    cached_at: new Date().toISOString()
                };


                /*
                |--------------------------------------------------------------------------
                | ✅ الحفظ في كلا المصدرين
                |--------------------------------------------------------------------------
                */

                await cacheUserEverywhere(cachedUser);


                /*
                |--------------------------------------------------------------------------
                | Token + User in localStorage
                |--------------------------------------------------------------------------
                */

                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(cachedUser));

                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

                localStorage.removeItem('offline_mode');


                /*
                |--------------------------------------------------------------------------
                | ✅ فحص EULA قبل التوجيه
                |--------------------------------------------------------------------------
                */

                const destination = destinationFor(cachedUser.role);

                if (needsEulaAcceptance()) {
                    window.location.href = `legal/eula.html?redirect=${encodeURIComponent(destination)}`;
                    return;
                }

                // ✅ التوجيه للوجهة حسب الدور
                window.location.href = destination;

                    } catch (error) {
                console.error('Login Error:', error);
                alert(
                    error?.response?.data?.message
                    || error?.message
                    || 'خطأ في بيانات الدخول'
                );
            } finally {
                loginInProgress.value = false;
                loading.value = false;
            }

        };


        /*
        |--------------------------------------------------------------------------
        | Password Reset
        |--------------------------------------------------------------------------
        */

        const sendResetLink = async () => {

            if (!resetEmail.value) {
                alert('أدخل البريد الإلكتروني');
                return;
            }

            loading.value = true;

            try {

                await axios.post(
                    `${API_BASE}/forgot-password`,
                    { email: resetEmail.value }
                );

                alert('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني');

                showReset.value = false;

            }

            catch (error) {

                console.error('Password reset error:', error);

                alert(
                    error?.response?.data?.message
                    || 'تعذر إرسال الرابط، تأكد من البريد الإلكتروني'
                );

            }

            finally {
                loading.value = false;
            }

        };


        /*
        |--------------------------------------------------------------------------
        | Lifecycle
        |--------------------------------------------------------------------------
        */

        onMounted(async () => {
            await updateConnectionState();
            window.addEventListener('online', updateConnectionState);
            window.addEventListener('offline', updateConnectionState);
        });

        onUnmounted(() => {
            window.removeEventListener('online', updateConnectionState);
            window.removeEventListener('offline', updateConnectionState);
        });

        return {
            form,
            loading,
            loginInProgress,
            showReset,
            resetEmail,
            showOfflineOverlay,
            login,
            sendResetLink,
            updateConnectionState
        };

    }

}).mount('#app');
