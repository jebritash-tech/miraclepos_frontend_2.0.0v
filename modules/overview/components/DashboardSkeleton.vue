<!-- modules/overview/components/DashboardSkeleton.vue -->
<template>
  <div class="space-y-6 animate-pulse">
    <!-- Skeleton للبطاقات الأربع -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div v-for="i in 4" :key="i" class="bg-white p-6 rounded-2xl border border-slate-200/80">
        <div class="flex items-center justify-between">
          <div class="h-4 bg-slate-200 rounded w-20"></div>
          <div class="w-12 h-12 bg-slate-200 rounded-xl"></div>
        </div>
        <div class="h-8 bg-slate-200 rounded w-28 mt-4"></div>
        <div class="h-3 bg-slate-200 rounded w-16 mt-3"></div>
      </div>
    </div>

    <!-- Skeleton للصف الثاني (مخطط + قائمة) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 h-72">
        <div class="h-6 bg-slate-200 rounded w-40 mb-6"></div>
        <div class="w-full h-48 bg-slate-100 rounded-xl"></div>
      </div>
      <div class="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 h-72">
        <div class="h-6 bg-slate-200 rounded w-32 mb-6"></div>
        <div class="space-y-4">
          <div v-for="j in 4" :key="j" class="flex items-center gap-3">
            <div class="w-7 h-7 bg-slate-200 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-slate-200 rounded w-3/4"></div>
              <div class="h-3 bg-slate-200 rounded w-1/2 mt-1"></div>
            </div>
            <div class="h-6 bg-slate-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton للتنبيهات -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 h-48">
        <div class="h-6 bg-slate-200 rounded w-32 mb-6"></div>
        <div class="space-y-3">
          <div v-for="k in 2" :key="k" class="h-16 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
      <div class="bg-slate-800 p-6 rounded-2xl h-48">
        <div class="h-6 bg-slate-600 rounded w-36 mb-6"></div>
        <div class="h-16 bg-slate-700 rounded-xl"></div>
      </div>
    </div>

    <!-- Skeleton للجداول -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-for="l in 2" :key="l" class="bg-white p-6 rounded-2xl border border-slate-200/80 h-64">
        <div class="h-6 bg-slate-200 rounded w-40 mb-6"></div>
        <div class="space-y-4">
          <div v-for="m in 3" :key="m" class="flex items-center justify-between">
            <div class="h-4 bg-slate-200 rounded w-16"></div>
            <div class="h-4 bg-slate-200 rounded w-24"></div>
            <div class="h-4 bg-slate-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>