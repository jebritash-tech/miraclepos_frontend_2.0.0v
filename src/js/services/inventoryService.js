import axios from 'axios';

import {
    API_BASE
} from '../config.js';
const InventoryService = {

    async getAll(filters = {}) {
        return (
            await axios.get(
                `${API_BASE}` + "/inventories",
                {
                    params: filters
                },
                {
                    headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                    },
                    params: { _ts: Date.now() }  // ← cache buster
                },
            )
        ).data;
    },

    async adjust(payload) {
        return (
            await axios.post(
                `${API_BASE}` + "/inventories/adjust",
                payload,
                {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                    },
                    params: { _ts: Date.now() }  // ← cache buster
                },
            )
        ).data;
    }

};

export default InventoryService;