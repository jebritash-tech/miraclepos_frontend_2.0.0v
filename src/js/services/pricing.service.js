import axios from 'axios';

import {
    API_BASE
} from '../config.js';

const PricingService = {

    async regenerateCurrent() {

        const { data } = await axios.post(

            `${API_BASE}`+`/price-engine/regenerate-current`,
                {
                    headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                params: { _ts: Date.now() }  // ← cache buster
            },

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Rules
    |--------------------------------------------------------------------------
    */

    async loadRules() {

        const { data } = await axios.get(

            `${API_BASE}`+`/price-engine/rules`

        );

        return data.data || data.rules || data;

    },

    async createRule(payload) {

        const { data } = await axios.post(

            `${API_BASE}`+`/price-engine/rules`,

            payload

        );

        return data;

    },

    async updateRule(id, payload) {

        const { data } = await axios.put(

            `${API_BASE}`+`/price-engine/rules/${id}`,

            payload

        );

        return data;

    },

    async deleteRule(id) {

        const { data } = await axios.delete(

            `${API_BASE}`+`/price-engine/rules/${id}`

        );

        return data;

    },

    async toggleRule(id) {

        const { data } = await axios.post(

            `${API_BASE}`+`/price-engine/rules/${id}/toggle`

        );

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Simulation
    |--------------------------------------------------------------------------
    */

    async simulate(payload) {

        const { data } = await axios.post(

            `${API_BASE}`+`/price-engine/simulate`,

            payload

        );

        return data.result || data;

    },

    /*
    |--------------------------------------------------------------------------
    | Medicines
    |--------------------------------------------------------------------------
    */

    async loadMedicines() {

        const { data } = await axios.get(

            `${API_BASE}`+`/medicines`

        );

        return data.data || data;

    },

    async assignRule(
        medicineId,
        pricingRuleId
    ) {

        const { data } = await axios.patch(

            `${API_BASE}`+`/medicines/${medicineId}/pricing-rule`,

            {
                pricing_rule_id:
                    pricingRuleId
                        ? Number(pricingRuleId)
                        : null
            }

        );

        return data;

    },

        /*
    |--------------------------------------------------------------------------
    | Bulk Recalculation — Details & Custom Apply
    |--------------------------------------------------------------------------
    */

    async bulkRecalculateDetails(filters = {}) {
        const { data } = await axios.post(
            `${API_BASE}/pricing/bulk-recalculate/details`,
            filters,
            {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                params: { _ts: Date.now() }
            }
        );
        return data;
    },

    async bulkRecalculateApplyCustom(filters, overrides, reason) {
        const { data } = await axios.post(
            `${API_BASE}/pricing/bulk-recalculate/apply-custom`,
            {
                ...filters,
                reason: reason,
                overrides: overrides,
            },
            {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                params: { _ts: Date.now() }
            }
        );
        return data;
    },

};

export default PricingService;