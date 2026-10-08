import axios from 'axios';

import {
    API_BASE
} from '../config.js';

const SalaryService = {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    async dashboard() {

        const { data } = await axios.get(

            `${API_BASE}`+`/salaries/dashboard`,
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
    | Load
    |--------------------------------------------------------------------------
    */

    async load(filters = {}) {

        const { data } = await axios.get(

            `${API_BASE}`+`/salaries`,

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

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Generate Monthly Salaries
    |--------------------------------------------------------------------------
    */

    async generate(month, year) {

        const { data } = await axios.post(

            `${API_BASE}`+`/salaries/generate`,

            {

                month,

                year

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

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    async create(payload) {

        const { data } = await axios.post(

            `${API_BASE}`+`/salaries`,

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

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    async update(id, payload) {

        const { data } = await axios.put(

            `${API_BASE}`+`/salaries/${id}`,

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

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Find
    |--------------------------------------------------------------------------
    */

    async find(id) {

        const { data } = await axios.get(

            `${API_BASE}`+`salaries/${id}`,

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
    | Pay
    |--------------------------------------------------------------------------
    */

    async pay(id, payload) {

        const { data } = await axios.post(

            `${API_BASE}`+`/salaries/${id}/pay`,

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

        return data;

    },

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    async delete(id) {

        const { data } = await axios.delete(

            `${API_BASE}`+`/salaries/${id}`,
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
    | Employees
    |--------------------------------------------------------------------------
    */

    async employees() {

        const { data } = await axios.get(

            `${API_BASE}`+`/employees`,
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

    }

};

export default SalaryService;