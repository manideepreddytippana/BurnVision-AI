import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Bell, AlertTriangle, Info, Check, Send, X, Loader2, RefreshCw, Activity, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../services/api'

interface Alert {
    id: number;
    user_id: number;
    user?: {
        name: string;
        email: string;
    };
    alert_type: string;
    severity: 'critical' | 'warning' | 'info' | 'success';
    message: string;
    suggestion?: string;
    is_read: boolean;
    owner_notified: boolean;
    created_at: string;
}

export default function AlertsOverview(): JSX.Element {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')
    const [clearingAll, setClearingAll] = useState(false)

    useEffect(() => {
        fetchAlerts()
    }, [])

    const fetchAlerts = async () => {
        try {
            setLoading(true)
            const response = await api.get('/admin/alerts')
            setAlerts(response.data.alerts || [])
        } catch (error) {
            console.error('Failed to fetch alerts:', error)
            setAlerts([])
        } finally {
            setLoading(false)
        }
    }

    const filteredAlerts = alerts.filter(a => filter === 'all' || a.severity === filter)

    const markAsRead = async (id: number): Promise<void> => {
        try {
            await api.put(`/admin/alerts/${id}/read`)
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
        } catch (error) {
            console.error('Failed to mark alert as read:', error)
        }
    }

    const notifyOwner = async (id: number): Promise<void> => {
        try {
            await api.post(`/admin/alerts/${id}/notify-owner`)
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, owner_notified: true } : a))
        } catch (error) {
            console.error('Failed to notify owner:', error)
        }
    }

    const dismissAlert = async (id: number): Promise<void> => {
        try {
            await api.delete(`/admin/alerts/${id}`)
            setAlerts(prev => prev.filter(a => a.id !== id))
        } catch (error) {
            console.error('Failed to dismiss alert:', error)
        }
    }

    const clearAllAlerts = async (): Promise<void> => {
        if (alerts.length === 0) return
        if (!window.confirm('Clear all alerts? They will remain hidden until users log new workouts.')) return

        try {
            setClearingAll(true)
            await api.delete('/admin/alerts/clear-all')
            setAlerts([])
        } catch (error) {
            console.error('Failed to clear all alerts:', error)
        } finally {
            setClearingAll(false)
        }
    }

    const getSeverityIcon = (severity: string): JSX.Element => {
        switch (severity) {
            case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
            case 'success': return <Activity className="w-5 h-5 text-green-500" />
            default: return <Info className="w-5 h-5 text-blue-500" />
        }
    }

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        return date.toLocaleDateString()
    }

    const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_read).length
    const warningCount = alerts.filter(a => a.severity === 'warning' && !a.is_read).length
    const infoCount = alerts.filter(a => a.severity === 'info' && !a.is_read).length

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3"><Bell className="w-8 h-8 text-primary" />Alerts Overview</h1>
                    <p className="text-muted-foreground">System-wide health alerts and notifications for all users</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={clearAllAlerts} disabled={clearingAll || alerts.length === 0}>
                        {clearingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        {clearingAll ? 'Clearing...' : 'Clear All'}
                    </Button>
                    <Button variant="outline" onClick={fetchAlerts} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={`stat-card cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilter('all')}>
                    <CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Alerts</div><div className="text-2xl font-bold">{alerts.length}</div></CardContent>
                </Card>
                <Card className={`stat-card border-red-500/50 cursor-pointer transition-all ${filter === 'critical' ? 'ring-2 ring-red-500' : ''}`} onClick={() => setFilter('critical')}>
                    <CardContent className="p-4"><div className="text-sm text-red-500">Critical</div><div className="text-2xl font-bold text-red-500">{criticalCount}</div></CardContent>
                </Card>
                <Card className={`stat-card border-yellow-500/50 cursor-pointer transition-all ${filter === 'warning' ? 'ring-2 ring-yellow-500' : ''}`} onClick={() => setFilter('warning')}>
                    <CardContent className="p-4"><div className="text-sm text-yellow-500">Warning</div><div className="text-2xl font-bold text-yellow-500">{warningCount}</div></CardContent>
                </Card>
                <Card className={`stat-card border-blue-500/50 cursor-pointer transition-all ${filter === 'info' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setFilter('info')}>
                    <CardContent className="p-4"><div className="text-sm text-blue-500">Info</div><div className="text-2xl font-bold text-blue-500">{infoCount}</div></CardContent>
                </Card>
            </div>

            <div className="flex gap-2 mb-4">
                {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
                    <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
                ))}
            </div>

            <Card className="glass-card">
                <CardHeader><CardTitle>Alert List</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAlerts.map((alert, index) => (
                                <motion.div key={alert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`p-4 rounded-lg border bg-secondary/30 ${!alert.is_read ? 'border-primary/50' : 'border-border'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="font-medium">{alert.user?.name || 'Unknown User'}</span>
                                                <span className="text-sm text-muted-foreground">({alert.user?.email || 'No email'})</span>
                                                <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'warning' : 'info'}>{alert.alert_type?.replace('_', ' ') || 'alert'}</Badge>
                                                {!alert.is_read && <Badge variant="outline" className="text-xs">New</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                                            {alert.suggestion && (
                                                <p className="text-xs text-primary mt-1">💡 {alert.suggestion}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-2">{formatTimeAgo(alert.created_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!alert.is_read && (
                                                <Button variant="ghost" size="icon" onClick={() => markAsRead(alert.id)} title="Mark as read" className="hover:bg-green-500/20">
                                                    <Check className="w-4 h-4 text-green-500" />
                                                </Button>
                                            )}
                                            {!alert.owner_notified && (
                                                <Button variant="ghost" size="icon" onClick={() => notifyOwner(alert.id)} title="Notify user" className="hover:bg-blue-500/20">
                                                    <Send className="w-4 h-4 text-blue-500" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => dismissAlert(alert.id)} title="Dismiss" className="hover:bg-red-500/20">
                                                <X className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {filteredAlerts.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>{alerts.length === 0 ? 'No alerts in the system' : 'No alerts match the selected filter'}</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
