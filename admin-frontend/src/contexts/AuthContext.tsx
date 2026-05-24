import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import api from '../services/api'
import type { AdminUser, AuthContextType } from '../types'

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
    const [user, setUser] = useState<AdminUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async (): Promise<void> => {
        const token = localStorage.getItem('adminAccessToken')
        if (token) {
            try {
                const response = await api.get('/auth/me')
                if (response.data.user.is_admin) {
                    setUser(response.data.user)
                } else {
                    localStorage.removeItem('adminAccessToken')
                }
            } catch {
                localStorage.removeItem('adminAccessToken')
            }
        }
        setLoading(false)
    }

    const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await api.post('/auth/admin/login', { email, password })
            const { access_token, user: userData } = response.data

            localStorage.setItem('adminAccessToken', access_token)
            setUser(userData)

            return { success: true }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string }
            const message = error.response?.data?.message || error.message || 'Login failed'
            return { success: false, error: message }
        }
    }, [])

    const logout = useCallback((): void => {
        localStorage.removeItem('adminAccessToken')
        setUser(null)
    }, [])

    const value: AuthContextType = {
        user,
        loading,
        login,
        logout,
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
