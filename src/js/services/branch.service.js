import api from '../api.js';
import axios from 'axios';

import {
    API_BASE
} from '../config.js';


const BranchService = {

    async getAll() {

        const res = await axios.get(

            `${API_BASE}` + "/branches",
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

            `${API_BASE}` + "/branches/" + id

        );

        return res.data;

    }

};

export default BranchService;