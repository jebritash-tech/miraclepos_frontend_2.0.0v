import axios from 'axios';

import { API_BASE } from '../config.js';


const PurchaseService = {

    async save(payload) {

        const res = await axios.post(

            `${API_BASE}` + "/purchases",

            payload,
            {
                headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
                },
                params: { _ts: Date.now() }  // ← cache buster
            },

        );

        return res.data;

    },

    async getAll(filters = {}) {

        const res = await axios.get(

            `${API_BASE}` + "/purchases",

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

        );

        const data = res.data;

        if (Array.isArray(data))
            return data;

        if (Array.isArray(data.data))
            return data.data;

        return [];

    },

    async get(id) {

        const res = await axios.get(

            `${API_BASE}`+ "/purchases/" + id,
            {
                headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
                },
                params: { _ts: Date.now() }  // ← cache buster
            },

        );

        return res.data;

    }

};

export default PurchaseService;