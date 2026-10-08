import axios from 'axios';

import {
    API_BASE
} from '../config.js';
const DebtService = {

    async getAll(filters = {}) {

        const response = await axios.get(
             `${API_BASE}` +'/debts',
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

        return response.data;
    },


    async show(id) {

        const response = await axios.get(
             `${API_BASE}` +'/debts/' + id,
            {
                headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
                },
                params: { _ts: Date.now() }  // ← cache buster
            },
        );

        return response.data;
    },


    async pay(id, amount) {

        const response = await axios.post(
            `${API_BASE}`+'/debts/' + id + '/payment',
            {
                amount: amount
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

        return response.data;
    },


    async create(data) {

        const response = await axios.post(
            `${API_BASE}` + '/debts',
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

        return response.data;
    }

};


export default DebtService;