import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api'

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem('accessToken')
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                        headers: { Authorization: `Bearer ${refreshToken}` }
                    })

                    const { access_token } = response.data
                    localStorage.setItem('accessToken', access_token)

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${access_token}`
                    }
                    return api(originalRequest)
                } catch {
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                    window.location.href = '/login'
                }
            }
        }

        return Promise.reject(error)
    }
)

export default api

export const authAPI = {
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
    register: (data: Record<string, unknown>) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
}

export const profileAPI = {
    get: () => api.get('/profile'),
    update: (data: Record<string, unknown>) => api.put('/profile', data),
}

export const workoutAPI = {
    start: (data?: Record<string, unknown>) => api.post('/workout/start', data),
    end: (id: number, data: Record<string, unknown>) => api.post(`/workout/${id}/end`, data),
    getAll: (params?: Record<string, unknown>) => api.get('/workout', { params }),
    getById: (id: number) => api.get(`/workout/${id}`),
    addFrame: (id: number, data: Record<string, unknown>) => api.post(`/workout/${id}/frames`, data),
}

export const predictionAPI = {
    predict: (data: Record<string, unknown>) => api.post('/prediction', data),
    getExplanation: (id: number) => api.get(`/prediction/${id}/explanation`),
    getHistory: (params?: Record<string, unknown>) => api.get('/prediction/history', { params }),
}

export const motionAPI = {
    analyze: (landmarks: unknown[]) => api.post('/motion/analyze', { landmarks }),
    getFormFeedback: (landmarks: unknown[], exerciseType: string) =>
        api.post('/motion/form-feedback', { landmarks, exercise_type: exerciseType }),
    calculateCalories: (sequence: unknown[], weight: number, duration: number) =>
        api.post('/motion/calorie-mapping', { sequence, weight, duration }),
}

export const alertsAPI = {
    getAll: (params?: Record<string, unknown>) => api.get('/alerts', { params }),
    markAsRead: (id: number) => api.put(`/alerts/${id}/read`),
    getUnreadCount: () => api.get('/alerts/unread-count'),
    delete: (id: number) => api.delete(`/alerts/${id}`),
}

export const statsAPI = {
    getDashboard: (days?: number) => api.get('/stats/dashboard', { params: { days } }),
    getCalorieTrends: (days?: number) => api.get('/stats/calorie-trends', { params: { days } }),
    getExerciseComparison: () => api.get('/stats/exercise-comparison'),
    exportPDF: (days?: number) => api.get('/stats/export-pdf', { params: { days }, responseType: 'blob' }),
}

export const coachAPI = {
    getRecommendations: () => api.get('/coach/recommendations'),
    suggestWorkout: (data: Record<string, unknown>) => api.post('/coach/suggest-workout', data),
    getIntensityAdvice: () => api.get('/coach/intensity-advice'),
    getRestRecommendation: () => api.get('/coach/rest-recommendation'),
}
