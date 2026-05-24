import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { LayoutDashboard, DoorOpen, Users, Bell, Settings, LogOut, Menu, X, Shield } from 'lucide-react'
import api from '../services/api'
import LogoutModal from './LogoutModal'

interface NavItem {
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}

const navItems: NavItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/rooms', icon: DoorOpen, label: 'Room Management' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout(): JSX.Element {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [alertsCount, setAlertsCount] = useState(0)
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    useEffect(() => {
        fetchAlertsCount()
    }, [])

    const fetchAlertsCount = async () => {
        try {
            const response = await api.get('/admin/alerts/total-count')
            setAlertsCount(response.data.total_count || 0)
        } catch (error) {
            console.error('Failed to fetch alerts count:', error)
        }
    }

    const handleLogout = (): void => {
        setShowLogoutModal(true)
    }

    const confirmLogout = (): void => {
        setShowLogoutModal(false)
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-background flex relative overflow-hidden">
            <div className="bg-orb bg-orb-1" />
            <div className="bg-orb bg-orb-2" />
            <div className="bg-orb bg-orb-3" />
            <div className="bg-orb bg-orb-4" />

            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center gap-3" onClick={() => navigate('/')}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-green-400 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div style={{ cursor: "pointer" }}>
                                <h1 className="text-xl font-bold gradient-text">BurnVision</h1>
                                <p className="text-xs text-muted-foreground">Admin Panel</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
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
                        <p className="text-sm font-medium mb-2">{user?.name}</p>
                        <p className="text-xs text-muted-foreground mb-4">{user?.email}</p>
                        <Button variant="outline" className="gap-2 border-white/20 hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors group" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 group-hover:text-white" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
                <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-card/80 backdrop-blur border-b border-border flex items-center px-4 lg:px-6">
                    <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative group hover:bg-primary hover:text-primary transition"
                            onClick={() => navigate('/alerts')}>
                            <Bell className="w-5 h-5 group-hover:text-black" />
                            {alertsCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] rounded-full flex items-center justify-center text-white">
                                    {alertsCount > 9 ? '9+' : alertsCount}
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
