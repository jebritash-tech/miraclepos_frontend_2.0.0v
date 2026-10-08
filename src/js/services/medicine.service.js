import axios from 'axios';

import {
    API_BASE
} from '../config.js';

import MedicineUnitService
    from '../services/medicineUnit.service.js';
const MedicineService = {

    async getAll(filters = {},with_units) {

        const res = await axios.get(

            `${API_BASE}` + "/medicines",
            {
                headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
                },
                params: { _ts: Date.now() }  // ← cache buster
            },
            {

                params: filters

            }

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

            `${API_BASE}` + "/medicines/" + id,
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

 async save(data) {
        if (data.id) {
            const res = await axios.put(
                `${API_BASE}` + "/medicines/" + data.id,
                data,
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

        const res = await axios.post(
            `${API_BASE}` + "/medicines",
            data,
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
    async update(id, data) {

        const res = await axios.put(

            `${API_BASE}` + "/medicines/" + id,

            data,
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

    async delete(id) {

        return axios.delete(

            `${API_BASE}` + "/medicines/" + id,
            {
                headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
                },
                params: { _ts: Date.now() }  // ← cache buster
            },

        );

    },

    async getUnits(medicineId = null) {

        let url = `${API_BASE}` + "/medicine-units";

        if (medicineId) {

            url += "?medicine_id=" + medicineId;

        }

        const res = await axios.get(url,
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

    }

};

export default MedicineService;