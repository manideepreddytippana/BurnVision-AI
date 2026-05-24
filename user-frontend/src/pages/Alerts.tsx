import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Bell, AlertTriangle, Activity, Info, X, Check, Lightbulb, Clock, Zap, Moon, Loader2, TrendingUp, Heart, Flame, Target, Trophy, RefreshCw, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

interface SessionData {
    id: number;
    session_date: string;
    total_calories: number;
    squat_reps: number;
    pushup_reps: number;
    squat_calories: number;
    pushup_calories: number;
    total_reps: number;
    form_score: number;
    active_minutes: number;
    exercises_done: string;
}

interface Alert {
    id: number;
    alert_type: string;
    severity: 'critical' | 'warning' | 'info' | 'success';
    message: string;
    suggestion?: string;
    is_read: boolean;
    created_at: string;
    title?: string;
}

interface CoachRecommendation {
    id: number;
    type: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

export default function Alerts(): JSX.Element {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [recommendations, setRecommendations] = useState<CoachRecommendation[]>([])
    const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [clearingAll, setClearingAll] = useState(false)

    useEffect(() => {
        fetchAlerts()
        generateRecommendations()
    }, [])

    const fetchAlerts = async () => {
        try {
            setLoading(true)
            const sessionsResponse = await api.get('/workout/sessions?limit=20')
            const sessions: SessionData[] = sessionsResponse.data.sessions || []

            if (sessions.length > 0) {
                const generatedAlerts = generateAlertsFromSessions(sessions)

                if (generatedAlerts.length > 0) {
                    await api.post('/alerts/sync', { alerts: generatedAlerts })
                }
            }

            const alertsResponse = await api.get('/alerts')
            const dbAlerts = alertsResponse.data.alerts || []

            const alertsWithTitles = dbAlerts.map((alert: Alert) => ({
                ...alert,
                title: getAlertTitle(alert.alert_type, alert.severity)
            }))

            setAlerts(alertsWithTitles)
        } catch (error) {
            console.error('Failed to fetch alerts:', error)
            setAlerts([])
        } finally {
            setLoading(false)
        }
    }

    const generateRecommendations = async () => {
        try {
            const response = await api.get('/workout/sessions?limit=20')
            const sessions: SessionData[] = response.data.sessions || []
            if (sessions.length > 0) {
                generateRecommendationsFromSessions(sessions)
            }
        } catch (error) {
            console.error('Failed to generate recommendations:', error)
        }
    }

    const getAlertTitle = (alertType: string, severity: string): string => {
        const titles: Record<string, string> = {
            'overtraining': '⚠️ Overtraining Warning',
            'fatigue': severity === 'warning' ? '📉 Lower Than Usual' : '😴 Fatigue Detected',
            'injury_risk': '🚨 Low Form Score Alert',
            'achievement': '🏆 Achievement Unlocked!',
            'improvement': '📈 Great Progress!',
            'consistency': '🔥 Consistency Champion!',
            'rep_record': '💪 Rep Record!',
            'info': '⏱️ Workout Info'
        }
        return titles[alertType] || '📋 Alert'
    }

    const generateAlertsFromSessions = (sessions: SessionData[]): Partial<Alert>[] => {
        const generatedAlerts: Partial<Alert>[] = []

        if (sessions.length === 0) return generatedAlerts

        const latestSession = sessions[0]
        const recentSessions = sessions.slice(0, 7)

        const avgCalories = recentSessions.reduce((sum, s) => sum + s.total_calories, 0) / recentSessions.length
        const avgFormScore = recentSessions.reduce((sum, s) => sum + s.form_score, 0) / recentSessions.length

        const sessionDates = sessions.slice(0, 5).map(s => new Date(s.session_date).toDateString())
        const uniqueDates = new Set(sessionDates)
        if (uniqueDates.size >= 5) {
            generatedAlerts.push({
                alert_type: 'overtraining',
                severity: 'warning',
                message: `You've worked out ${uniqueDates.size} days in a row! Your muscles need recovery time.`,
                suggestion: 'Take a rest day or do light stretching/yoga for active recovery.',
                is_read: false
            })
        }

        if (sessions.length >= 3) {
            const recentFormScores = sessions.slice(0, 3).map(s => s.form_score)
            const formScoreTrend = recentFormScores[0] - recentFormScores[2]
            if (formScoreTrend < -10) {
                generatedAlerts.push({
                    alert_type: 'fatigue',
                    severity: 'info',
                    message: `Your form quality has dropped ${Math.abs(formScoreTrend).toFixed(1)}% over your last 3 workouts.`,
                    suggestion: 'Focus on recovery, hydration, and getting 7-8 hours of sleep.',
                    is_read: false
                })
            }
        }

        if (latestSession.form_score < 60) {
            generatedAlerts.push({
                alert_type: 'injury_risk',
                severity: 'critical',
                message: `Your last workout had a form score of ${latestSession.form_score.toFixed(1)}%, which increases injury risk.`,
                suggestion: 'Review exercise tutorials and focus on form over reps. Consider reducing intensity.',
                is_read: false
            })
        }

        const maxCalories = Math.max(...sessions.map(s => s.total_calories))
        if (latestSession.total_calories === maxCalories && latestSession.total_calories > 100) {
            generatedAlerts.push({
                alert_type: 'achievement',
                severity: 'success',
                message: `You burned ${latestSession.total_calories.toFixed(1)} calories in your last workout - your best ever!`,
                suggestion: 'Celebrate and maintain this momentum! Share your achievement!',
                is_read: false
            })
        }

        const maxReps = Math.max(...sessions.map(s => s.total_reps))
        if (latestSession.total_reps === maxReps && latestSession.total_reps > 50) {
            generatedAlerts.push({
                alert_type: 'rep_record',
                severity: 'success',
                message: `You completed ${latestSession.total_reps} total reps - a new personal record!`,
                suggestion: 'Great strength progress! Consider progressive overload for continued gains.',
                is_read: false
            })
        }

        if (sessions.length >= 5) {
            const recentAvgCalories = sessions.slice(0, 3).reduce((sum, s) => sum + s.total_calories, 0) / 3
            const olderAvgCalories = sessions.slice(3, 6).reduce((sum, s) => sum + s.total_calories, 0) / Math.min(3, sessions.slice(3, 6).length)

            if (recentAvgCalories > olderAvgCalories * 1.15) {
                generatedAlerts.push({
                    alert_type: 'improvement',
                    severity: 'success',
                    message: `Your calorie burn has increased by ${((recentAvgCalories / olderAvgCalories - 1) * 100).toFixed(1)}% compared to earlier sessions!`,
                    suggestion: 'Your fitness is improving! Keep pushing your limits.',
                    is_read: false
                })
            }
        }

        if (sessions.length >= 10) {
            generatedAlerts.push({
                alert_type: 'consistency',
                severity: 'success',
                message: `You've completed ${sessions.length} workout sessions. Consistency is key!`,
                suggestion: 'Your dedication is paying off. Keep building that habit!',
                is_read: true
            })
        }

        if (latestSession.total_calories < avgCalories * 0.6 && avgCalories > 50) {
            generatedAlerts.push({
                alert_type: 'fatigue',
                severity: 'warning',
                message: `Your last session burned ${latestSession.total_calories.toFixed(1)} kcal, which is ${((1 - latestSession.total_calories / avgCalories) * 100).toFixed(1)}% below your average.`,
                suggestion: 'Check if you got enough sleep and nutrition. Consider a light workout next time.',
                is_read: false
            })
        }

        if (latestSession.active_minutes < 10) {
            generatedAlerts.push({
                alert_type: 'info',
                severity: 'info',
                message: `Your last session was only ${latestSession.active_minutes.toFixed(1)} minutes. Aim for 20-30 min for best results.`,
                suggestion: 'Even short workouts count! Try to gradually increase duration.',
                is_read: true
            })
        }

        return generatedAlerts
    }

    const generateRecommendationsFromSessions = (sessions: SessionData[]) => {
        const generatedRecs: CoachRecommendation[] = []
        let recId = 1

        if (sessions.length === 0) {
            generatedRecs.push({
                id: recId++,
                type: 'start',
                title: 'Start Your Journey',
                description: 'Complete your first live workout to get personalized recommendations!',
                icon: Target
            })
            setRecommendations(generatedRecs)
            return
        }

        const latestSession = sessions[0]
        const avgCalories = sessions.reduce((sum, s) => sum + s.total_calories, 0) / sessions.length
        const avgFormScore = sessions.reduce((sum, s) => sum + s.form_score, 0) / sessions.length
        const avgDuration = sessions.reduce((sum, s) => sum + s.active_minutes, 0) / sessions.length
        const totalSquatReps = sessions.reduce((sum, s) => sum + s.squat_reps, 0)
        const totalPushupReps = sessions.reduce((sum, s) => sum + s.pushup_reps, 0)

        // Workout time recommendation
        const sessionsByCalories = [...sessions].sort((a, b) => b.total_calories - a.total_calories)
        const bestSession = sessionsByCalories[0]
        const bestTime = new Date(bestSession.session_date)
        const hourOfDay = bestTime.getHours()
        const timeSlot = hourOfDay < 12 ? 'morning' : hourOfDay < 17 ? 'afternoon' : 'evening'

        generatedRecs.push({
            id: recId++,
            type: 'timing',
            title: 'Optimal Workout Time',
            description: `Your best performance (${bestSession.total_calories.toFixed(1)} kcal) was in the ${timeSlot}. Schedule workouts then!`,
            icon: Clock
        })

        // Intensity recommendation
        if (avgCalories < 150) {
            generatedRecs.push({
                id: recId++,
                type: 'intensity',
                title: 'Increase Intensity',
                description: `Average burn is ${avgCalories.toFixed(1)} kcal. Try HIIT or add more reps to boost results.`,
                icon: Zap
            })
        } else if (avgCalories > 300) {
            generatedRecs.push({
                id: recId++,
                type: 'intensity',
                title: 'Great Intensity!',
                description: `Averaging ${avgCalories.toFixed(1)} kcal per session. Maintain this level for optimal results.`,
                icon: Flame
            })
        }

        // Form focus recommendation
        if (avgFormScore < 75) {
            generatedRecs.push({
                id: recId++,
                type: 'form',
                title: 'Focus on Form',
                description: `Your average form score is ${avgFormScore.toFixed(1)}%. Prioritize form over speed for better results.`,
                icon: Target
            })
        } else if (avgFormScore >= 90) {
            generatedRecs.push({
                id: recId++,
                type: 'form',
                title: 'Excellent Form!',
                description: `${avgFormScore.toFixed(1)}% average form score - keep it up! Great form reduces injury risk.`,
                icon: Trophy
            })
        }

        // Rest recommendation
        const today = new Date()
        const recentDates = sessions.slice(0, 3).map(s => {
            const d = new Date(s.session_date)
            return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
        })

        if (recentDates.filter(d => d <= 1).length >= 2) {
            generatedRecs.push({
                id: recId++,
                type: 'rest',
                title: 'Rest Day Needed',
                description: 'You\'ve been active recently. Schedule a rest day for muscle recovery.',
                icon: Moon
            })
        }

        // Duration recommendation
        if (avgDuration < 20) {
            generatedRecs.push({
                id: recId++,
                type: 'duration',
                title: 'Extend Workouts',
                description: `Average session is ${avgDuration.toFixed(1)} min. Aim for 25-30 min for optimal benefits.`,
                icon: Clock
            })
        }

        // Balance recommendation
        const squatPushupRatio = totalSquatReps / (totalPushupReps || 1)
        if (squatPushupRatio > 2) {
            generatedRecs.push({
                id: recId++,
                type: 'balance',
                title: 'Add Upper Body',
                description: 'You\'re doing more leg work. Balance with more pushups for full-body fitness.',
                icon: Activity
            })
        } else if (squatPushupRatio < 0.5) {
            generatedRecs.push({
                id: recId++,
                type: 'balance',
                title: 'Add Lower Body',
                description: 'You\'re focusing on upper body. Add more squats for balanced strength.',
                icon: Activity
            })
        }

        // Heart health recommendation
        generatedRecs.push({
            id: recId++,
            type: 'health',
            title: 'Cardio Health',
            description: `With ${sessions.length} sessions logged, your cardiovascular health is improving!`,
            icon: Heart
        })

        // Progress milestone
        const totalCaloriesBurned = sessions.reduce((sum, s) => sum + s.total_calories, 0)
        if (totalCaloriesBurned > 1000) {
            generatedRecs.push({
                id: recId++,
                type: 'milestone',
                title: `${totalCaloriesBurned.toFixed(1)} Calories Burned!`,
                description: 'Total calories burned across all sessions. Amazing progress!',
                icon: TrendingUp
            })
        }

        setRecommendations(generatedRecs.slice(0, 5))
    }

    const getTimeAgo = (dateString: string): string => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 60) return `${diffMins} minutes ago`
        if (diffHours < 24) return `${diffHours} hours ago`
        if (diffDays === 1) return 'Yesterday'
        return `${diffDays} days ago`
    }

    const getSeverityIcon = (severity: string): JSX.Element => {
        switch (severity) {
            case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
            case 'success': return <Activity className="w-5 h-5 text-green-500" />
            default: return <Info className="w-5 h-5 text-blue-500" />
        }
    }

    const filteredAlerts = alerts.filter(alert => {
        if (filter === 'unread') return !alert.is_read
        if (filter === 'critical') return alert.severity === 'critical'
        return true
    })

    const markAsRead = async (id: number): Promise<void> => {
        try {
            await api.put(`/alerts/${id}/read`)
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }

    const dismissAlert = async (id: number): Promise<void> => {
        try {
            await api.delete(`/alerts/${id}`)
            setAlerts(prev => prev.filter(a => a.id !== id))
        } catch (error) {
            console.error('Failed to dismiss alert:', error)
        }
    }

    const clearAllAlerts = async (): Promise<void> => {
        if (alerts.length === 0) return
        if (!window.confirm('Clear all alerts? They will stay hidden until a new workout is recorded.')) return

        try {
            setClearingAll(true)
            await api.delete('/alerts/all')
            setAlerts([])
        } catch (error) {
            console.error('Failed to clear all alerts:', error)
        } finally {
            setClearingAll(false)
        }
    }

    const unreadCount = alerts.filter(a => !a.is_read).length

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center md:justify-start gap-2 md:gap-3">
                        <Bell className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                        Alerts & Recommendations
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">{unreadCount} new</Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mt-1 md:mt-0">Personalized health alerts and AI coach recommendations based on your workouts</p>
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <Button
                        variant="outline"
                        onClick={clearAllAlerts}
                        disabled={clearingAll || alerts.length === 0}
                        className="gap-2 group hover:bg-red-600 hover:text-white w-full md:w-auto hover:border-red-600"
                    >
                        {clearingAll ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500 group-hover:text-white" />
                        ) : (
                            <Trash2 className="w-4 h-4 group-hover:text-white" />
                        )}
                        {clearingAll ? 'Clearing...' : 'Clear All'}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={async () => {
                            setRefreshing(true)
                            await fetchAlerts()
                            await generateRecommendations()
                            setRefreshing(false)
                        }}
                        disabled={refreshing}
                        className="gap-2 group hover:bg-violet-600 hover:text-white w-full md:w-auto hover:border-violet-600"
                    >
                        {refreshing ? (
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500 group-hover:text-white" />
                        ) : (
                            <RefreshCw className="w-4 h-4 group-hover:text-white" />
                        )}
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Alerts Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex gap-2">
                        {(['all', 'unread', 'critical'] as const).map((f) => (
                            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">
                                {f}
                            </Button>
                        ))}
                    </div>

                    <AnimatePresence>
                        {filteredAlerts.map((alert, index) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={`glass-card ${!alert.is_read ? 'border-primary/50' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-medium">{alert.title || getAlertTitle(alert.alert_type, alert.severity)}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                                                        {alert.suggestion && (
                                                            <p className="text-sm text-primary mt-2">💡 {alert.suggestion}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {!alert.is_read && (
                                                            <Button variant="ghost" size="icon" onClick={() => markAsRead(alert.id)} className="hover:bg-green-500/20">
                                                                <Check className="w-4 h-4 text-green-500" />
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" onClick={() => dismissAlert(alert.id)} className="hover:bg-red-500/20">
                                                            <X className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">{getTimeAgo(alert.created_at)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredAlerts.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No alerts to display</p>
                            <p className="text-sm">Complete more workouts to receive personalized alerts!</p>
                        </div>
                    )}
                </div>

                {/* AI Coach Recommendations */}
                <div className="space-y-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-primary" />
                                Personal Coach
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recommendations.length > 0 ? (
                                recommendations.map((rec, index) => (
                                    <motion.div
                                        key={rec.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-3 rounded-lg bg-secondary/50 border border-border"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                <rec.icon className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{rec.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Complete workouts to get AI recommendations</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
