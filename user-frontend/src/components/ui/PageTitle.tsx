import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const titles: Record<string, string> = {
    '/': 'BurnVision - Real-Time Fitness Tracking & Calorie Burn Prediction',
    '/login': 'Login',
    '/register': 'Create Account',
    '/dashboard': 'Fitness Overview',
    '/workout': 'Real Time Tracking',
    '/profile': 'My Profile',
    '/insights': 'Fitness Insights',
    '/alerts': 'Health Alerts',
    '/stats': 'Workout Statistics - Track and compare your workout performance',
    '/calorie-predict': 'Calorie Prediction',
    '/advanced-calorie-predict': 'Advanced Calorie Prediction',
    '/realtime-insights': 'Realtime Workout Insights',
    '/all-predictions': 'Prediction History',
    '/model-metrics': 'Model Metrics'
}

export function PageTitle() {
    const location = useLocation()

    useEffect(() => {
        const path = location.pathname
        const title = titles[path] || 'BurnVision'
        document.title = title
    }, [location])

    return null
}
