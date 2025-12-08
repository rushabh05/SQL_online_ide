import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const sessionAPI = {
    // Create a new session, optionally linked to a user
    createSession: async (userId?: string | null) => {
        const response = await api.post('/session/create', { 
            user_id: userId || null 
        });
        return response.data;
    },

    // Restore an existing session, optionally linking to a user
    restoreSession: async (sessionId: string, userId?: string | null) => {
        const response = await api.post('/session/restore', { 
            session_id: sessionId,
            user_id: userId || null
        });
        return response.data;
    },

    // Get session for a specific user (returns their linked session if exists)
    getUserSession: async (userId: string) => {
        const response = await api.get(`/session/user/${userId}`);
        return response.data;
    },

    getSessionInfo: async (sessionId: string) => {
        const response = await api.get(`/session/${sessionId}`);
        return response.data;
    },

    getSessionTables: async (sessionId: string) => {
        const response = await api.get(`/session/${sessionId}/tables`);
        return response.data;
    },

    deleteSession: async (sessionId: string) => {
        const response = await api.delete(`/session/${sessionId}`);
        return response.data;
    },
};

export const uploadAPI = {
    uploadCSV: async (sessionId: string, file: File) => {
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('file', file);

        const response = await api.post('/upload/csv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    listTables: async (sessionId: string) => {
        const response = await api.get(`/upload/tables/${sessionId}`);
        return response.data;
    },

    deleteTable: async (sessionId: string, tableName: string) => {
        const response = await api.delete(`/upload/table/${sessionId}/${tableName}`);
        return response.data;
    },

    generateSampleTable: async (sessionId: string, tableName: string, rowCount: number) => {
        const response = await api.post('/upload/generate-sample', {
            session_id: sessionId,
            table_name: tableName,
            row_count: rowCount,
        });
        return response.data;
    },
};

export const queryAPI = {
    executeQuery: async (sessionId: string, sql: string) => {
        const response = await api.post('/query/execute', {
            session_id: sessionId,
            sql,
        });
        return response.data;
    },

    explainQuery: async (sessionId: string, sql: string) => {
        const response = await api.post('/query/explain', {
            session_id: sessionId,
            sql,
        });
        return response.data;
    },

    downloadResults: async (sessionId: string, sql: string) => {
        const response = await api.post('/query/download', {
            session_id: sessionId,
            sql,
        }, {
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'query_results.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // Save user's current query to Firestore for cross-device persistence
    saveUserQuery: async (userId: string, query: string) => {
        const response = await api.post('/query/save-query', {
            user_id: userId,
            query,
        });
        return response.data;
    },

    // Get user's saved query from Firestore
    getUserQuery: async (userId: string) => {
        const response = await api.get(`/query/user-query/${userId}`);
        return response.data;
    },

    // Delete user's saved query
    deleteUserQuery: async (userId: string) => {
        const response = await api.delete(`/query/user-query/${userId}`);
        return response.data;
    },
};

export default api;
