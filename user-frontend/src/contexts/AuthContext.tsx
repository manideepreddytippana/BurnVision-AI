import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import api from '../services/api'
import type { User, AuthContextType, RegisterData } from '../types'

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'))
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async (): Promise<void> => {
        const storedToken = localStorage.getItem('accessToken')
        if (storedToken) {
            try {
                const response = await api.get('/auth/me')
                setUser(response.data.user)
                setToken(storedToken)
            } catch {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                setToken(null)
            }
        }
        setLoading(false)
    }

    const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setError(null)
            const response = await api.post('/auth/login', { email, password })
            const { access_token, refresh_token, user: userData } = response.data

            localStorage.setItem('accessToken', access_token)
            localStorage.setItem('refreshToken', refresh_token)
            setToken(access_token)
            setUser(userData)

            return { success: true }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string }
            const message = error.response?.data?.message || error.message || 'Login failed'
            setError(message)
            return { success: false, error: message }
        }
    }, [])

    const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
        try {
            setError(null)
            const response = await api.post('/auth/register', data)
            const { access_token, refresh_token, user: userData } = response.data

            localStorage.setItem('accessToken', access_token)
            localStorage.setItem('refreshToken', refresh_token)
            setToken(access_token)
            setUser(userData)

            return { success: true }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string }
            const message = error.response?.data?.message || error.message || 'Registration failed'
            setError(message)
            return { success: false, error: message }
        }
    }, [])

    const logout = useCallback((): void => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setToken(null)
        setUser(null)
    }, [])

    const updateProfile = useCallback(async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await api.put('/profile', data)
            setUser(response.data.user)
            return { success: true }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string }
            const message = error.response?.data?.message || error.message || 'Update failed'
            return { success: false, error: message }
        }
    }, [])

    const value: AuthContextType = {
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
