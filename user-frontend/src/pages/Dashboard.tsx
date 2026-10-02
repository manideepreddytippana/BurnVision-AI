import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Flame, Activity, Clock, TrendingUp, Target, Lightbulb } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface DashboardStats {
    totalCalories: number;
    totalWorkouts: number;
    totalReps: number;
    avgFormScore: number;
}

interface RecentSession {
    id: number;
    session_date: string;
    total_calories: number;
    squat_reps: number;
    pushup_reps: number;
    total_reps: number;
    active_minutes: number;
    exercises_done: string;
    form_score: number;
}

interface TrendData {
    date: string;
    calories: number;
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps): JSX.Element {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="h-full">
            <Card className="stat-card overflow-hidden h-full min-h-[140px]">
                <CardContent className="p-6 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-base font-medium text-muted-foreground">{title}</p>
                            <p className="text-3xl font-bold mt-1">{value}</p>
                            <p className="text-sm text-muted-foreground mt-1 min-h-[20px]">{subtitle}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

export default function Dashboard(): JSX.Element {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        totalCalories: 0,
        totalWorkouts: 0,
        totalReps: 0,
        avgFormScore: 0
    })
    const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
    const [chartData, setChartData] = useState<TrendData[]>([])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // Fetch user statistics
            const statsResponse = await api.get('/workout/statistics')
            const userStats = statsResponse.data.statistics || {}

            setStats({
                totalCalories: userStats.total_calories || 0,
                totalWorkouts: userStats.total_sessions || 0,
                totalReps: userStats.total_reps || 0,
                avgFormScore: userStats.avg_form_score || 0
            })

            // Fetch recent sessions
            const sessionsResponse = await api.get('/workout/sessions?limit=5')
            setRecentSessions(sessionsResponse.data.sessions || [])

            // Fetch calorie trends for last 7 days
            const trendsResponse = await api.get('/workout/trends/calories?days=7')
            const trends = trendsResponse.data.trends || []

            // Format for chart
            const formattedTrends = trends.map((t: any) => ({
                date: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
                calories: t.calories
            }))
            setChartData(formattedTrends)

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
            // Set empty data
            setChartData([
                { date: 'Mon', calories: 0 },
                { date: 'Tue', calories: 0 },
                { date: 'Wed', calories: 0 },
                { date: 'Thu', calories: 0 },
                { date: 'Fri', calories: 0 },
                { date: 'Sat', calories: 0 },
                { date: 'Sun', calories: 0 },
            ])
        } finally {
            setLoading(false)
        }
    }

    const formScore = Math.round(stats.avgFormScore) || 85

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight text-[#0a2540] dark:text-white font-heading">
                    Welcome back, {user?.name || 'User'}!
                </h1>
                <p className="text-muted-foreground">Here's your fitness overview from your workout sessions.</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Calories Burned"
                    value={stats.totalCalories.toFixed(1)}
                    subtitle="Sum of all sessions"
                    icon={Flame}
                    color="bg-gradient-to-br from-orange-500 to-red-500"
                />
                <StatCard
                    title="Total Workouts"
                    value={stats.totalWorkouts}
                    subtitle="Completed sessions"
                    icon={Activity}
                    color="bg-gradient-to-br from-blue-500 to-cyan-500"
                />
                <StatCard
                    title="Total Reps"
                    value={stats.totalReps}
                    subtitle=""
                    icon={Target}
                    color="bg-gradient-to-br from-purple-500 to-pink-500"
                />
                <StatCard
                    title="Avg Form Score"
                    value={`${formScore}%`}
                    subtitle="Average quality"
                    icon={TrendingUp}
                    color="bg-gradient-to-br from-green-500 to-emerald-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass-card lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-primary" />
                            Calorie Burn Trend (Last 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                                        <YAxis stroke="hsl(var(--muted-foreground))" />
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                                        <Line type="monotone" dataKey="calories" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        {stats.totalWorkouts === 0 && !loading && (
                            <p className="text-center text-muted-foreground mt-4">
                                No workout data yet. Start a Live Workout to see your stats!
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Form Quality</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="hsl(var(--secondary))" strokeWidth="8" fill="none" />
                                <circle cx="50" cy="50" r="40" stroke="url(#gradient)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${formScore * 2.51} 251`} />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                                        <stop offset="100%" stopColor="hsl(var(--accent))" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold">{formScore}%</span>
                            </div>
                        </div>
                        <p className="mt-4 text-muted-foreground text-center">
                            {formScore >= 80 ? 'Excellent form quality!' : formScore >= 60 ? 'Good form, keep improving!' : 'Focus on your form'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Workouts & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Recent Workouts (5 Sessions)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentSessions.length > 0 ? (
                            recentSessions.map((session) => (
                                <div key={session.id} className="p-4 rounded-lg bg-secondary/30 border border-border">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium">{session.exercises_done || 'Mixed Workout'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(session.session_date).toLocaleDateString()} • {session.active_minutes.toFixed(1)} min
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                {session.squat_reps > 0 && <Badge variant="success">{session.squat_reps} squats</Badge>}
                                                {session.pushup_reps > 0 && <Badge variant="info">{session.pushup_reps} pushups</Badge>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-orange-400">{session.total_calories.toFixed(1)}</p>
                                            <p className="text-xs text-muted-foreground">kcal burned</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No workouts yet</p>
                                <p className="text-sm">Start your first Live Workout!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-primary" />
                            Overall Tracking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="font-medium">Workout Consistency</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {stats.totalWorkouts >= 5
                                    ? `Great job! You've completed ${stats.totalWorkouts} sessions.`
                                    : "Try to complete more workouts to build consistency."}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                            <p className="font-medium">Total Reps Achievement</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {stats.totalReps >= 100
                                    ? `Amazing! You've completed ${stats.totalReps} total reps!`
                                    : `You've done ${stats.totalReps} reps so far. Keep pushing!`}
                            </p>
                        </div>
                        {stats.totalCalories > 0 && (
                            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <p className="font-medium">Calorie Burn</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    You've burned {stats.totalCalories.toFixed(1)} calories total.
                                    {stats.totalWorkouts > 0 && ` Average: ${(stats.totalCalories / stats.totalWorkouts).toFixed(1)} per session.`}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
