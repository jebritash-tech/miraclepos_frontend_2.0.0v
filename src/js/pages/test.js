import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useBranchStore } from '../stores/index.js';

const pinia = createPinia();
const app = createApp({
  setup() {
    const store = useBranchStore();
    store.fetchBranches();
    return { store };
  },
  template: `<div>عدد الفروع: {{ store.branches.length }}</div>`
});
app.use(pinia);
app.mount('#app');