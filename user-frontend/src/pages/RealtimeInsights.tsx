import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, CheckCircle2, Flame, Loader2, RefreshCw, Sparkles, Target, Timer } from 'lucide-react'
import api from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

interface SessionData {
    id: number
    session_date?: string
    created_at?: string
    exercises_done?: string
    total_calories?: number
    total_reps?: number
    active_minutes?: number
    form_score?: number
    consistency?: number
    cadence?: number
    [key: string]: unknown
}

interface AISuggestionsPayload {
    provider?: string
    model?: string
    generated_at?: string
    success?: boolean
    error?: string | null
}

interface RealtimeInsightItem {
    id: number
    live_workout_session_id: number
    calorie_prediction_explanation_id?: number | null
    session_data: SessionData
    ai_suggestions: AISuggestionsPayload
    summary_points: string[]
    created_at?: string
}

const REP_FIELDS = [
    { key: 'squat_reps', label: 'Squats' },
    { key: 'pushup_reps', label: 'Pushups' },
    { key: 'lunge_reps', label: 'Lunges' },
    { key: 'jumping_jack_reps', label: 'Jumping Jacks' },
    { key: 'high_knee_reps', label: 'High Knees' },
    { key: 'burpee_reps', label: 'Burpees' },
    { key: 'plank_seconds', label: 'Plank (s)' },
    { key: 'situp_reps', label: 'Sit-Ups' },
    { key: 'leg_raise_reps', label: 'Leg Raises' },
    { key: 'bicycle_crunch_reps', label: 'Bicycle Crunches' },
]

const CALORIE_FIELDS = [
    { key: 'squat_calories', label: 'Squat' },
    { key: 'pushup_calories', label: 'Pushup' },
    { key: 'lunge_calories', label: 'Lunge' },
    { key: 'jumping_jack_calories', label: 'Jumping Jack' },
    { key: 'high_knee_calories', label: 'High Knee' },
    { key: 'burpee_calories', label: 'Burpee' },
    { key: 'plank_calories', label: 'Plank' },
    { key: 'situp_calories', label: 'Sit-Up' },
    { key: 'leg_raise_calories', label: 'Leg Raise' },
    { key: 'bicycle_crunch_calories', label: 'Bicycle Crunch' },
]

export default function RealtimeInsights(): JSX.Element {
    const [insights, setInsights] = useState<RealtimeInsightItem[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchRealtimeInsights = async () => {
        try {
            const response = await api.get('/workout/realtime-insights?limit=100')
            setInsights(response.data.insights || [])
        } catch (error) {
            console.error('Failed to fetch realtime insights:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRealtimeInsights()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-center justify-between gap-4"
            >
                <div className="w-full text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center md:justify-start gap-2 md:gap-3">
                        <Activity className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                        Realtime Insights
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mt-1 md:mt-0">
                        All camera workout sessions with AI suggestions from backend.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={async () => {
                        setRefreshing(true)
                        await fetchRealtimeInsights()
                        setRefreshing(false)
                    }}
                    disabled={refreshing}
                    className="gap-2 group hover:text-foreground w-full md:w-auto"
                >
                    {refreshing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 group-hover:text-foreground" />
                    )}
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
            </motion.div>

            {insights.length === 0 ? (
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>No realtime insights yet</CardTitle>
                        <CardDescription>Save a live workout session to generate AI suggestions.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="space-y-4">
                    {insights.map((item, index) => {
                        const session = item.session_data || {}
                        const reps = REP_FIELDS.filter((field) => Number(session[field.key] || 0) > 0)
                        const calories = CALORIE_FIELDS.filter((field) => Number(session[field.key] || 0) > 0)
                        const createdAt = session.created_at || item.created_at || session.session_date

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className="space-y-4"
                            >
                                <Card className="glass-card border-foreground/10 backdrop-blur-xl">
                                    <CardHeader>
                                        <CardTitle className="flex flex-wrap items-center gap-2">
                                            <Flame className="w-5 h-5 text-orange-500" />
                                            Session #{item.live_workout_session_id}
                                            <Badge variant="outline">{String(session.exercises_done || 'mixed')}</Badge>
                                        </CardTitle>
                                        <CardDescription className="flex flex-wrap gap-3 items-center">
                                            {createdAt && <span>{new Date(String(createdAt)).toLocaleString()}</span>}
                                            <span>Total: {Number(session.total_calories || 0).toFixed(1)} cal</span>
                                            <span>Reps: {Number(session.total_reps || 0)}</span>
                                            <span>Minutes: {Number(session.active_minutes || 0).toFixed(1)}</span>
                                            {item.calorie_prediction_explanation_id ? (
                                                <span>Linked Prediction Insight: #{item.calorie_prediction_explanation_id}</span>
                                            ) : (
                                                <span>Linked Prediction Insight: None</span>
                                            )}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                                <p className="text-xs text-muted-foreground uppercase">Form Score</p>
                                                <p className="text-lg font-bold">{Number(session.form_score || 0).toFixed(0)}%</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                                <p className="text-xs text-muted-foreground uppercase">Consistency</p>
                                                <p className="text-lg font-bold">{Number(session.consistency || 0).toFixed(0)}%</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                                <p className="text-xs text-muted-foreground uppercase">Cadence</p>
                                                <p className="text-lg font-bold">{Number(session.cadence || 0).toFixed(0)}</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                                <p className="text-xs text-muted-foreground uppercase">Active Time</p>
                                                <p className="text-lg font-bold flex items-center gap-1">
                                                    <Timer className="w-4 h-4" />
                                                    {Number(session.active_minutes || 0).toFixed(1)}m
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-3 rounded-lg bg-secondary/20 border border-border">
                                                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-primary" /> Realtime Exercise Data
                                                </p>
                                                <div className="space-y-1">
                                                    {reps.length > 0 ? reps.map((field) => (
                                                        <div key={`reps-${item.id}-${field.key}`} className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">{field.label}</span>
                                                            <span>{Number(session[field.key] || 0)}</span>
                                                        </div>
                                                    )) : <p className="text-sm text-muted-foreground">No rep activity recorded.</p>}
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-lg bg-secondary/20 border border-border">
                                                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Flame className="w-4 h-4 text-orange-500" /> Calorie Breakdown
                                                </p>
                                                <div className="space-y-1">
                                                    {calories.length > 0 ? calories.map((field) => (
                                                        <div key={`cal-${item.id}-${field.key}`} className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">{field.label}</span>
                                                            <span>{Number(session[field.key] || 0).toFixed(2)} cal</span>
                                                        </div>
                                                    )) : <p className="text-sm text-muted-foreground">No calorie components recorded.</p>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
                                                <Sparkles className="w-4 h-4" /> AI Suggestions
                                            </p>
                                            {item.summary_points && item.summary_points.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {item.summary_points.map((point, idx) => (
                                                        <li key={`summary-${item.id}-${idx}`} className="text-sm text-muted-foreground flex items-start gap-2">
                                                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500" />
                                                            <span>{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No AI summary points available for this session.</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
