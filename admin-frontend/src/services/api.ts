import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem('adminAccessToken')
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error: AxiosError) => Promise.reject(error)
)

api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('adminAccessToken')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api

export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getRooms: () => api.get('/admin/rooms'),
    createRoom: (data: Record<string, unknown>) => api('/admin/rooms', data),
    updateRoom: (id: number, data: Record<string, unknown>) => api.put(`/admin/rooms/${id}`, data),
    deleteRoom: (id: number) => api.delete(`/admin/rooms/${id}`),
    getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
    getUser: (id: number) => api.get(`/admin/users/${id}`),
    deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
    getAlerts: (params?: Record<string, unknown>) => api.get('/admin/alerts', { params }),
    notifyOwner: (id: number) => api.post(`/admin/alerts/${id}/notify-owner`),
}
