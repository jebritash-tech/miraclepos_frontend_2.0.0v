import axios from 'axios';

import {
    API_BASE
} from '../config.js';

const ShiftService = {
    
    async getAll(filters = {}) {

        const res = await axios.get(

            `${API_BASE}`+ "/shifts",

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

        return res.data;

    },

    async get(id) {

        const res = await axios.get(

            `${API_BASE}`+ "/shifts/" + id,
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
    async show(id){

        const res = await axios.get(

            `${API_BASE}` + "/shifts/" + id,
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

};

export default ShiftService;