import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import {
    LayoutDashboard,
    Camera,
    User,
    Lightbulb,
    Bell,
    BarChart3,
    LogOut,
    Menu,
    X,
    Flame,
    Calculator,
    History,
    Brain,
    Dumbbell,
    Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import LogoutModal from './LogoutModal'

interface NavItem {
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}

const navItems: NavItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/workout', icon: Camera, label: 'Live Workout' },
    { path: '/realtime-insights', icon: Activity, label: 'Realtime Insights' },
    { path: '/stats', icon: BarChart3, label: 'Statistics' },
    { path: '/calorie-predict', icon: Calculator, label: 'Calorie Predict' },
    { path: '/advanced-calorie-predict', icon: Dumbbell, label: 'Advanced Predict' },
    { path: '/insights', icon: Lightbulb, label: 'AI Insights' },
    { path: '/all-predictions', icon: History, label: 'All Predictions' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/model-metrics', icon: Brain, label: 'Model Metrics' },
    { path: '/profile', icon: User, label: 'Profile' },
]

export default function Layout(): JSX.Element {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [unreadAlerts, setUnreadAlerts] = useState(0)
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    useEffect(() => {
        fetchUnreadCount()
    }, [])

    const fetchUnreadCount = async () => {
        try {
            let response = await api.get('/alerts/total-count')
            let count = response.data.total_count || 0

            if (count === 0) {
                try {
                    
                    const sessionsRes = await api.get('/workout/sessions?limit=20')
                    const sessions = sessionsRes.data.sessions || []

                    if (sessions.length > 0) {
                        const generatedAlerts = generateAlertsFromSessions(sessions)

                        if (generatedAlerts.length > 0) {
                            await api.post('/alerts/sync', { alerts: generatedAlerts })
                            response = await api.get('/alerts/total-count')
                            count = response.data.total_count || 0
                        }
                    }
                } catch (err) {
                }
            }

            setUnreadAlerts(count)
        } catch (error) {
            console.error('Failed to fetch alerts count:', error)
        }
    }

    const generateAlertsFromSessions = (sessions: any[]) => {
        const alerts: any[] = []
        if (sessions.length === 0) return alerts

        const latestSession = sessions[0]
        const recentSessions = sessions.slice(0, 7)
        const avgCalories = recentSessions.reduce((sum: number, s: any) => sum + s.total_calories, 0) / recentSessions.length

        const sessionDates = sessions.slice(0, 5).map((s: any) => new Date(s.session_date).toDateString())
        const uniqueDates = new Set(sessionDates)
        if (uniqueDates.size >= 5) {
            alerts.push({
                alert_type: 'overtraining',
                severity: 'warning',
                message: `You've worked out ${uniqueDates.size} days in a row! Your muscles need recovery time.`,
                suggestion: 'Take a rest day or do light stretching/yoga for active recovery.',
                is_read: false
            })
        }

        if (latestSession.form_score < 60) {
            alerts.push({
                alert_type: 'injury_risk',
                severity: 'critical',
                message: `Your last workout had a form score of ${latestSession.form_score.toFixed(0)}%, which increases injury risk.`,
                suggestion: 'Review exercise tutorials and focus on form over reps.',
                is_read: false
            })
        }

        const maxCalories = Math.max(...sessions.map((s: any) => s.total_calories))
        if (latestSession.total_calories === maxCalories && latestSession.total_calories > 100) {
            alerts.push({
                alert_type: 'achievement',
                severity: 'success',
                message: `You burned ${latestSession.total_calories.toFixed(0)} calories - your best ever!`,
                suggestion: 'Celebrate and maintain this momentum!',
                is_read: false
            })
        }

        if (latestSession.total_calories < avgCalories * 0.6 && avgCalories > 50) {
            alerts.push({
                alert_type: 'fatigue',
                severity: 'warning',
                message: `Your last session burned less than usual.`,
                suggestion: 'Check if you got enough sleep and nutrition.',
                is_read: false
            })
        }

        return alerts
    }

    const handleLogout = (): void => {
        setShowLogoutModal(true)
    }

    const confirmLogout = (): void => {
        setShowLogoutModal(false)
        logout()
        navigate('/login')
    }

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className="min-h-screen bg-background flex relative overflow-hidden">
            <div className="bg-orb bg-orb-1" />
            <div className="bg-orb bg-orb-2" />
            <div className="bg-orb bg-orb-3" />
            <div className="bg-orb bg-orb-4" />

            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center gap-3 cursor-pointer " onClick={() => navigate("/")}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <Flame className="w-6 h-6 text-white" />
                            </div>
                            <div style={{ cursor: "pointer" }}>
                                <h1 className="text-xl font-bold gradient-text">BurnVision</h1>
                                <p className="text-xs text-muted-foreground">Smart Fitness</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => `sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'active bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar>
                                <AvatarFallback className="bg-primary/20 text-primary">
                                    {user?.name ? getInitials(user.name) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="gap-2 border-white/20 hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors group"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 group-hover:text-white" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
                <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-card/80 backdrop-blur border-b border-border flex items-center px-4 lg:px-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden mr-2"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>

                    <div className="flex-1" />

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative group hover:bg-primary hover:text-primary transition " onClick={() => navigate('/alerts')}>
                            <Bell className="w-5 h-5 group-hover:text-white" />
                            {unreadAlerts > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                                </span>
                            )}
                        </Button>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6 mt-16">
                    <Outlet />
                </main>
            </div>

            <LogoutModal
                isOpen={showLogoutModal}
                onCancel={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
            />
        </div>
    )
}
