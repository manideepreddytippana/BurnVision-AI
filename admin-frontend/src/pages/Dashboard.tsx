import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Users, Activity, Flame, AlertTriangle, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { motion } from 'framer-motion'
import api from '../services/api'

interface DashboardStats {
    total_users: number;
    total_workouts: number;
    total_calories: number;
    active_alerts: number;
}

interface WeeklyActivity {
    day: string;
    workouts: number;
}

interface FitnessLevel {
    name: string;
    count: number;
    percentage: number;
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps): JSX.Element {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="h-full">
            <Card className="stat-card overflow-hidden h-full">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-base font-medium text-muted-foreground">{title}</p>
                            <p className="text-3xl font-bold mt-1">{value}</p>
                            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    {trend && (
                        <div className="mt-4 flex items-center gap-1 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-green-500">{trend}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b']

export default function Dashboard(): JSX.Element {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        total_users: 0,
        total_workouts: 0,
        total_calories: 0,
        active_alerts: 0
    })
    const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([])
    const [fitnessLevels, setFitnessLevels] = useState<FitnessLevel[]>([])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // Fetch main dashboard stats
            const statsRes = await api.get('/admin/dashboard')
            setStats({
                total_users: statsRes.data.total_users || 0,
                total_workouts: statsRes.data.total_workouts || 0,
                total_calories: statsRes.data.total_calories || 0,
                active_alerts: statsRes.data.active_alerts || 0
            })

            // Fetch weekly activity
            const activityRes = await api.get('/admin/dashboard/weekly-activity')
            setWeeklyActivity(activityRes.data.activity || [])

            // Fetch fitness levels distribution
            const levelsRes = await api.get('/admin/dashboard/fitness-levels')
            setFitnessLevels(levelsRes.data.fitness_levels || [])

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
            // Set default data if fetch fails
            setWeeklyActivity([
                { day: 'Mon', workouts: 0 },
                { day: 'Tue', workouts: 0 },
                { day: 'Wed', workouts: 0 },
                { day: 'Thu', workouts: 0 },
                { day: 'Fri', workouts: 0 },
                { day: 'Sat', workouts: 0 },
                { day: 'Sun', workouts: 0 }
            ])
            setFitnessLevels([
                { name: 'Beginner', count: 0, percentage: 25 },
                { name: 'Intermediate', count: 0, percentage: 25 },
                { name: 'Advanced', count: 0, percentage: 25 },
                { name: 'Athlete', count: 0, percentage: 25 }
            ])
        } finally {
            setLoading(false)
        }
    }

    const formatCalories = (calories: number): string => {
        if (calories >= 1000000) return `${(calories / 1000000).toFixed(1)}M`
        if (calories >= 1000) return `${(calories / 1000).toFixed(1)}K`
        return calories.toFixed(1)
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">System overview and analytics - Real-time data</p>
            </motion.div>

            {/* Stats Grid - Real Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.total_users}
                    subtitle="Registered users"
                    icon={Users}
                    color="bg-gradient-to-br from-blue-500 to-cyan-500"
                />
                <StatCard
                    title="Total Workouts"
                    value={stats.total_workouts}
                    subtitle="Sessions by all users"
                    icon={Activity}
                    color="bg-gradient-to-br from-green-500 to-emerald-500"
                />
                <StatCard
                    title="Calories Burned"
                    value={formatCalories(stats.total_calories)}
                    subtitle="Platform total"
                    icon={Flame}
                    color="bg-gradient-to-br from-orange-500 to-red-500"
                />
                <StatCard
                    title="Active Alerts"
                    value={stats.active_alerts}
                    subtitle="Needs attention"
                    icon={AlertTriangle}
                    color="bg-gradient-to-br from-yellow-500 to-orange-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Weekly Activity Data */}
                <Card className="glass-card h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Weekly Activity</CardTitle>
                        <p className="text-sm text-muted-foreground">Workouts per day (last 7 days)</p>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="h-64 sm:h-80 w-full">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyActivity}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                                        <YAxis stroke="hsl(var(--muted-foreground))" />
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                                        <Bar dataKey="workouts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* User fitness levels data based on calories */}
                <Card className="glass-card h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>User Fitness Levels</CardTitle>
                        <p className="text-sm text-muted-foreground">Based on total calories burned</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="h-64 sm:h-80 w-full">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={fitnessLevels.filter(level => level.count > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={fitnessLevels.filter(level => level.count > 0).length === 1 ? 0 : 5}
                                            dataKey="count"
                                            stroke={fitnessLevels.filter(level => level.count > 0).length === 1 ? 'transparent' : 'grey'}
                                        >
                                            {fitnessLevels.filter(level => level.count > 0).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[fitnessLevels.findIndex(l => l.name === entry.name) % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#22c55e]" /><span>Beginner (&lt;100 cal)</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]" /><span>Intermediate (100-500)</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#a855f7]" /><span>Advanced (500-2000)</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f59e0b]" /><span>Athlete (&gt;2000)</span></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-card border-primary/30">
                <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-primary">Note:</strong> All statistics are updated in real-time based on user workout sessions.
                        Fitness levels are calculated based on total calories burned by each user.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
