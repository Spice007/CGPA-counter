import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://cgpa-counter-production.up.railway.app/api',
});

// Add a request interceptor to include JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    register: (data: any) => api.post('/auth/register', data),
    login: (data: any) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
};

export const courseService = {
    getCourses: (params?: { session?: string; semester?: string }) => api.get('/courses', { params }),
    addCourse: (data: any) => api.post('/courses', data),
    updateCourse: (id: string, data: any) => api.put(`/courses/${id}`, data),
    deleteCourse: (id: string) => api.delete(`/courses/${id}`),
};

export const resultService = {
    getResults: () => api.get('/results'),
    getLevels: () => api.get('/results/levels'),
    calculateGPA: (data: { session: string; semester: string }) => api.post('/results/calculate', data),
    getCGPA: () => api.get('/results/cgpa'),
};

export const userService = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data: any) => api.put('/users/profile', data),
};

export default api;
