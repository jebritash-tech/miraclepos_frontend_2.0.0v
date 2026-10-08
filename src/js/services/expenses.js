
import axios from 'axios';

import {
    API_BASE
} from '../config.js';
const ExpenseService = {

    async getAll(filters = {}) {
        return (
            await axios.get(
                `${API_BASE}` + "/expenses",
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

    async show(id) {
        return (
            await axios.get(
                `${API_BASE}` + "/expenses/" + id,
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

    async create(data) {
        return (
            await axios.post(
                `${API_BASE}` + "/expenses",
                data,
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

export default ExpenseService;