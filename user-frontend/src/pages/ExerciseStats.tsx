import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { BarChart3, List, GitCompare, TrendingUp, Download, Flame, Activity, Target, Calendar, Lightbulb, ChevronDown, Clock, Dumbbell, Timer, Award, Zap, CheckCircle2, X, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import jsPDF from 'jspdf'

interface SessionData {
    id: number;
    session_date: string;
    total_calories: number;
    squat_reps: number;
    pushup_reps: number;
    lunge_reps: number;
    jumping_jack_reps: number;
    high_knee_reps: number;
    burpee_reps: number;
    plank_seconds: number;

    situp_reps: number;
    leg_raise_reps: number;
    bicycle_crunch_reps: number;
    total_reps: number;
    form_score: number;
    active_minutes: number;
    exercises_done: string;
    squat_calories: number;
    pushup_calories: number;
    lunge_calories: number;
    jumping_jack_calories: number;
    high_knee_calories: number;
    burpee_calories: number;
    plank_calories: number;

    situp_calories: number;
    leg_raise_calories: number;
    bicycle_crunch_calories: number;
}

interface StatsSummary {
    total_calories: number;
    total_sessions: number;
    total_reps: number;
    total_squat_reps: number;
    total_pushup_reps: number;
    avg_form_score: number;
}

interface TrendData {
    date: string;
    calories: number;
}

interface CompareData {
    date: string;
    stats: {
        total_calories: number;
        total_reps: number;
        squat_reps: number;
        pushup_reps: number;
        sessions_count: number;
        avg_form_score: number;
        total_minutes: number;
    };
    sessions: SessionData[];
}

export default function ExerciseStats(): JSX.Element {
    const [sessions, setSessions] = useState<SessionData[]>([])
    const [stats, setStats] = useState<StatsSummary>({ total_calories: 0, total_sessions: 0, total_reps: 0, total_squat_reps: 0, total_pushup_reps: 0, avg_form_score: 0 })
    const [trends, setTrends] = useState<TrendData[]>([])
    const [activeTab, setActiveTab] = useState('list')
    const [loading, setLoading] = useState(true)

    // Comparison state
    const [date1, setDate1] = useState('')
    const [date2, setDate2] = useState('')
    const [compareResult, setCompareResult] = useState<{ date1: CompareData; date2: CompareData; suggestions: string[] } | null>(null)
    const [comparing, setComparing] = useState(false)

    // Expanded session state
    const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null)

    // Export PDF Modal state
    const [showExportModal, setShowExportModal] = useState(false)
    const [exportStartDate, setExportStartDate] = useState('')
    const [exportEndDate, setExportEndDate] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch all sessions
            const sessionsRes = await api.get('/workout/sessions?limit=50')
            setSessions(sessionsRes.data.sessions || [])

            // Fetch statistics
            const statsRes = await api.get('/workout/statistics')
            setStats(statsRes.data.statistics || { total_calories: 0, total_sessions: 0, total_reps: 0, total_squat_reps: 0, total_pushup_reps: 0, avg_form_score: 0 })

            // Fetch trends for last 30 days
            const trendsRes = await api.get('/workout/trends/calories?days=30')
            const trendsData = (trendsRes.data.trends || []).map((t: any) => ({
                date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                calories: t.calories
            }))
            setTrends(trendsData)
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCompare = async () => {
        if (!date1 || !date2) return

        setComparing(true)
        try {
            const res = await api.get(`/workout/compare?date1=${date1}&date2=${date2}`)
            setCompareResult(res.data)
        } catch (error) {
            console.error('Failed to compare:', error)
        } finally {
            setComparing(false)
        }
    }

    // Filter sessions by export date range
    const filteredExportSessions = useMemo(() => {
        if (!exportStartDate || !exportEndDate) return []

        const startDate = new Date(exportStartDate)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(exportEndDate)
        endDate.setHours(23, 59, 59, 999)

        return sessions.filter(session => {
            const sessionDate = new Date(session.session_date)
            return sessionDate >= startDate && sessionDate <= endDate
        }).sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
    }, [sessions, exportStartDate, exportEndDate])

    // Generate PDF for a single session
    const generateSingleSessionPDF = (session: SessionData) => {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()

        // Header
        doc.setFillColor(99, 102, 241) // Primary purple
        doc.rect(0, 0, pageWidth, 40, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('BurnVision', 20, 25)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text('Workout Session Report', 20, 35)

        // Session Date
        doc.setTextColor(60, 60, 60)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        const sessionDate = new Date(session.session_date)
        doc.text(`Session: ${sessionDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`, 20, 55)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text(`Time: ${sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, 20, 63)

        // Divider
        doc.setDrawColor(200, 200, 200)
        doc.line(20, 70, pageWidth - 20, 70)

        // Session Overview
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(99, 102, 241)
        doc.text('Session Overview', 20, 82)

        let yPos = 92
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)

        const overviewData = [
            ['Total Calories', `${session.total_calories.toFixed(1)} kcal`],
            ['Duration', `${session.active_minutes.toFixed(1)} minutes`],
            ['Total Reps', `${session.total_reps}`],
            ['Form Score', `${session.form_score.toFixed(0)}%`],
            ['Exercises', session.exercises_done || 'Mixed Workout']
        ]

        overviewData.forEach(([label, value]) => {
            doc.setFont('helvetica', 'normal')
            doc.text(label + ':', 25, yPos)
            doc.setFont('helvetica', 'bold')
            doc.text(value, 100, yPos)
            yPos += 10
        })

        // Exercise Breakdown
        yPos += 10
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(99, 102, 241)
        doc.text('Exercise Breakdown', 20, yPos)

        yPos += 12
        doc.setFontSize(11)
        doc.setTextColor(60, 60, 60)

        // Squats
        doc.setFont('helvetica', 'bold')
        doc.text('Squats:', 25, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(`${session.squat_reps} reps | ${session.squat_calories.toFixed(1)} kcal`, 70, yPos)

        yPos += 10
        // Pushups
        doc.setFont('helvetica', 'bold')
        doc.text('Pushups:', 25, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(`${session.pushup_reps} reps | ${session.pushup_calories.toFixed(1)} kcal`, 70, yPos)

        // Performance Metrics
        yPos += 20
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(99, 102, 241)
        doc.text('Performance Metrics', 20, yPos)

        yPos += 12
        doc.setFontSize(11)
        doc.setTextColor(60, 60, 60)

        const caloriesPerMin = session.active_minutes > 0 ? (session.total_calories / session.active_minutes).toFixed(2) : '0'
        const repsPerMin = session.active_minutes > 0 ? (session.total_reps / session.active_minutes).toFixed(1) : '0'

        const metricsData = [
            ['Calories/min', caloriesPerMin],
            ['Reps/min', repsPerMin],
            ['Squat Calories', session.squat_calories.toFixed(1)],
            ['Pushup Calories', session.pushup_calories.toFixed(1)]
        ]

        metricsData.forEach(([label, value]) => {
            doc.setFont('helvetica', 'normal')
            doc.text(label + ':', 25, yPos)
            doc.setFont('helvetica', 'bold')
            doc.text(value, 100, yPos)
            yPos += 10
        })

        // Footer
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text(`Generated by BurnVision on ${new Date().toLocaleDateString()}`, 20, 280)

        // Save
        doc.save(`BurnVision_Session_${sessionDate.toISOString().split('T')[0]}.pdf`)
    }

    // Generate PDF for multiple sessions - Full details like individual session PDF
    const generateBulkPDF = () => {
        if (filteredExportSessions.length === 0) return

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()

        // Cover Page - Header
        doc.setFillColor(99, 102, 241)
        doc.rect(0, 0, pageWidth, 60, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(32)
        doc.setFont('helvetica', 'bold')
        doc.text('BurnVision', 20, 30)

        doc.setFontSize(16)
        doc.setFont('helvetica', 'normal')
        doc.text('Workout Sessions Report', 20, 45)

        // Date Range Info
        doc.setTextColor(60, 60, 60)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`Date Range: ${new Date(exportStartDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })} - ${new Date(exportEndDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })}`, 20, 80)

        // Summary Stats Box
        doc.setFillColor(245, 245, 255)
        doc.rect(15, 90, pageWidth - 30, 60, 'F')
        doc.setDrawColor(99, 102, 241)
        doc.rect(15, 90, pageWidth - 30, 60, 'S')

        const totalCalories = filteredExportSessions.reduce((sum, s) => sum + s.total_calories, 0)
        const totalReps = filteredExportSessions.reduce((sum, s) => sum + s.total_reps, 0)
        const totalSquatReps = filteredExportSessions.reduce((sum, s) => sum + s.squat_reps, 0)
        const totalPushupReps = filteredExportSessions.reduce((sum, s) => sum + s.pushup_reps, 0)
        const avgFormScore = filteredExportSessions.reduce((sum, s) => sum + s.form_score, 0) / filteredExportSessions.length
        const totalMinutes = filteredExportSessions.reduce((sum, s) => sum + s.active_minutes, 0)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(99, 102, 241)
        doc.text('Summary Statistics', 25, 102)

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)

        // Left column
        doc.text(`Total Sessions: ${filteredExportSessions.length}`, 25, 115)
        doc.text(`Total Calories: ${totalCalories.toFixed(1)} kcal`, 25, 125)
        doc.text(`Total Duration: ${totalMinutes.toFixed(1)} min`, 25, 135)

        // Right column
        doc.text(`Total Reps: ${totalReps}`, 110, 115)
        doc.text(`Squats: ${totalSquatReps} | Pushups: ${totalPushupReps}`, 110, 125)
        doc.text(`Average Form Score: ${avgFormScore.toFixed(0)}%`, 110, 135)

        // Table of Contents
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(99, 102, 241)
        doc.text('Sessions Included:', 20, 165)

        let tocY = 175
        filteredExportSessions.forEach((session, index) => {
            if (tocY > 270) {
                doc.addPage()
                tocY = 20
            }
            const sessionDate = new Date(session.session_date)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(60, 60, 60)
            doc.text(`${index + 1}. ${sessionDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            })} - ${session.total_calories.toFixed(1)} kcal, ${session.total_reps} reps, ${session.form_score.toFixed(0)}% form`, 25, tocY)
            tocY += 8
        })

        // Individual Session Pages (same format as single session PDF)
        filteredExportSessions.forEach((session, index) => {
            doc.addPage()

            // Session Header
            doc.setFillColor(99, 102, 241)
            doc.rect(0, 0, pageWidth, 40, 'F')

            doc.setTextColor(255, 255, 255)
            doc.setFontSize(20)
            doc.setFont('helvetica', 'bold')
            doc.text(`Session ${index + 1} of ${filteredExportSessions.length}`, 20, 20)

            doc.setFontSize(12)
            doc.setFont('helvetica', 'normal')
            doc.text('Workout Session Report', 20, 32)

            // Session Date
            const sessionDate = new Date(session.session_date)
            doc.setTextColor(60, 60, 60)
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text(`${sessionDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`, 20, 55)

            doc.setFontSize(12)
            doc.setFont('helvetica', 'normal')
            doc.text(`Time: ${sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, 20, 65)

            // Divider
            doc.setDrawColor(200, 200, 200)
            doc.line(20, 72, pageWidth - 20, 72)

            // Session Overview Section
            doc.setFillColor(245, 245, 255)
            doc.rect(15, 78, pageWidth - 30, 58, 'F')  // Reduced height

            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(99, 102, 241)
            doc.text('Session Overview', 20, 88)

            let yPos = 98
            doc.setFontSize(10)
            doc.setTextColor(60, 60, 60)

            const overviewData = [
                ['Total Calories', `${session.total_calories.toFixed(1)} kcal`],
                ['Duration', `${session.active_minutes.toFixed(1)} minutes`],
                ['Total Reps', `${session.total_reps}`],
                ['Form Score', `${session.form_score.toFixed(0)}%`],
                ['Exercises', session.exercises_done || 'Mixed Workout']
            ]

            overviewData.forEach(([label, value]) => {
                doc.setFont('helvetica', 'normal')
                doc.text(label + ':', 25, yPos)
                doc.setFont('helvetica', 'bold')
                doc.text(value, 80, yPos)
                yPos += 8  // Reduced spacing
            })

            // Exercise Breakdown Section - Dynamic exercises
            yPos = 145  // Adjusted position
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(99, 102, 241)
            doc.text('Exercise Breakdown', 20, yPos)
            yPos += 10

            // Build dynamic exercise list
            const exercises: { name: string; reps: string; calories: string; color: [number, number, number] }[] = []
            if (session.squat_reps > 0) exercises.push({ name: 'Squats', reps: `${session.squat_reps} reps`, calories: `${session.squat_calories?.toFixed(1) || 0} kcal`, color: [34, 197, 94] })
            if (session.pushup_reps > 0) exercises.push({ name: 'Pushups', reps: `${session.pushup_reps} reps`, calories: `${session.pushup_calories?.toFixed(1) || 0} kcal`, color: [59, 130, 246] })
            if (session.lunge_reps > 0) exercises.push({ name: 'Lunges', reps: `${session.lunge_reps} reps`, calories: `${session.lunge_calories?.toFixed(1) || 0} kcal`, color: [147, 51, 234] })
            if (session.jumping_jack_reps > 0) exercises.push({ name: 'Jumping Jacks', reps: `${session.jumping_jack_reps} reps`, calories: `${session.jumping_jack_calories?.toFixed(1) || 0} kcal`, color: [234, 179, 8] })
            if (session.high_knee_reps > 0) exercises.push({ name: 'High Knees', reps: `${session.high_knee_reps} reps`, calories: `${session.high_knee_calories?.toFixed(1) || 0} kcal`, color: [249, 115, 22] })
            if (session.burpee_reps > 0) exercises.push({ name: 'Burpees', reps: `${session.burpee_reps} reps`, calories: `${session.burpee_calories?.toFixed(1) || 0} kcal`, color: [239, 68, 68] })
            if (session.plank_seconds > 0) exercises.push({ name: 'Plank', reps: `${session.plank_seconds?.toFixed(0) || 0}s`, calories: `${session.plank_calories?.toFixed(1) || 0} kcal`, color: [6, 182, 212] })
            if (session.situp_reps > 0) exercises.push({ name: 'Sit-ups', reps: `${session.situp_reps} reps`, calories: `${session.situp_calories?.toFixed(1) || 0} kcal`, color: [99, 102, 241] })
            if (session.leg_raise_reps > 0) exercises.push({ name: 'Leg Raises', reps: `${session.leg_raise_reps} reps`, calories: `${session.leg_raise_calories?.toFixed(1) || 0} kcal`, color: [236, 72, 153] })
            if (session.bicycle_crunch_reps > 0) exercises.push({ name: 'Bicycle Crunches', reps: `${session.bicycle_crunch_reps} reps`, calories: `${session.bicycle_crunch_calories?.toFixed(1) || 0} kcal`, color: [244, 63, 94] })

            // Draw exercise boxes in 2-column grid
            const boxWidth = (pageWidth - 35) / 2
            const boxHeight = 28  // Reduced from 35
            exercises.forEach((ex, idx) => {
                const col = idx % 2
                const row = Math.floor(idx / 2)
                const xPos = 15 + col * (boxWidth + 5)
                const boxY = yPos + row * (boxHeight + 3)  // Reduced gap from 5 to 3

                // Skip if we're going off page
                if (boxY > 250) return

                doc.setFillColor(250, 250, 255)
                doc.rect(xPos, boxY, boxWidth, boxHeight, 'F')
                doc.setDrawColor(...ex.color)
                doc.rect(xPos, boxY, boxWidth, boxHeight, 'S')

                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(...ex.color)
                doc.text(ex.name, xPos + 5, boxY + 10)

                doc.setFontSize(9)
                doc.setTextColor(60, 60, 60)
                doc.setFont('helvetica', 'normal')
                doc.text(`${ex.reps} | ${ex.calories}`, xPos + 5, boxY + 20)
            })

            // Performance Metrics Section
            yPos = 155 + Math.ceil(exercises.length / 2) * 31 + 8  // Adjusted calculation
            if (yPos < 200) yPos = 200  // Lower minimum position

            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(99, 102, 241)
            doc.text('Performance Metrics', 20, yPos)

            yPos += 12
            doc.setFontSize(10)
            doc.setTextColor(60, 60, 60)

            const caloriesPerMin = session.active_minutes > 0 ? (session.total_calories / session.active_minutes).toFixed(2) : '0'
            const repsPerMin = session.active_minutes > 0 ? (session.total_reps / session.active_minutes).toFixed(1) : '0'

            // Metrics in grid format - more compact
            doc.setFillColor(250, 250, 255)
            doc.rect(15, yPos - 3, (pageWidth - 30) / 2 - 5, 20, 'F')
            doc.setFont('helvetica', 'normal')
            doc.text('Calories/min:', 25, yPos + 4)
            doc.setFont('helvetica', 'bold')
            doc.text(caloriesPerMin, 25, yPos + 13)

            doc.setFillColor(250, 250, 255)
            doc.rect(15 + (pageWidth - 30) / 2, yPos - 3, (pageWidth - 30) / 2 - 5, 20, 'F')
            doc.setFont('helvetica', 'normal')
            doc.text('Reps/min:', 25 + (pageWidth - 30) / 2, yPos + 4)
            doc.setFont('helvetica', 'bold')
            doc.text(repsPerMin, 25 + (pageWidth - 30) / 2, yPos + 13)

            yPos += 24
            doc.setFillColor(250, 250, 255)
            doc.rect(15, yPos - 3, (pageWidth - 30) / 2 - 5, 20, 'F')
            doc.setFont('helvetica', 'normal')
            doc.text('Total Calories:', 25, yPos + 4)
            doc.setFont('helvetica', 'bold')
            doc.text(`${session.total_calories.toFixed(1)} kcal`, 25, yPos + 13)

            doc.setFillColor(250, 250, 255)
            doc.rect(15 + (pageWidth - 30) / 2, yPos - 3, (pageWidth - 30) / 2 - 5, 20, 'F')
            doc.setFont('helvetica', 'normal')
            doc.text('Total Reps:', 25 + (pageWidth - 30) / 2, yPos + 4)
            doc.setFont('helvetica', 'bold')
            doc.text(`${session.total_reps}`, 25 + (pageWidth - 30) / 2, yPos + 13)

            // Footer
            doc.setFontSize(10)
            doc.setTextColor(150, 150, 150)
            doc.setFont('helvetica', 'normal')
            doc.text(`Generated by BurnVision on ${new Date().toLocaleDateString()}`, 20, 280)
            doc.text(`Page ${index + 2} of ${filteredExportSessions.length + 1}`, pageWidth - 50, 280)
        })

        // Save
        doc.save(`BurnVision_Sessions_${exportStartDate}_to_${exportEndDate}.pdf`)
        setShowExportModal(false)
    }

    const handleExportPDF = () => {
        // Set default dates to last 30 days
        const today = new Date()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        setExportEndDate(today.toISOString().split('T')[0])
        setExportStartDate(thirtyDaysAgo.toISOString().split('T')[0])
        setShowExportModal(true)
    }

    // Set default dates for comparison
    useEffect(() => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        setDate2(today.toISOString().split('T')[0])
        setDate1(yesterday.toISOString().split('T')[0])
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        Exercise Statistics
                    </h1>
                    <p className="text-muted-foreground">Track and compare your workout performance</p>
                </div>
                <Button
                    variant="outline"
                    className="gap-2 border-white/20 hover:bg-transparent hover:border-white/60 transition-colors"
                    onClick={handleExportPDF}
                >
                    <Download className="w-4 h-4" />
                    Export PDF
                </Button>
            </motion.div>

            {/* Summary Cards - Real totals */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="stat-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Flame className="w-8 h-8 text-orange-500" />
                            <div>
                                <p className="text-base text-muted-foreground">Total Calories</p>
                                <p className="text-2xl font-bold">{stats.total_calories.toFixed(1)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-500" />
                            <div>
                                <p className="text-base text-muted-foreground">Total Workouts</p>
                                <p className="text-2xl font-bold">{stats.total_sessions}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Target className="w-8 h-8 text-purple-500" />
                            <div>
                                <p className="text-base text-muted-foreground">Total Reps</p>
                                <p className="text-2xl font-bold">{stats.total_reps}</p>
                                <p className="text-sm text-muted-foreground">{stats.total_squat_reps} squats + {stats.total_pushup_reps} pushups</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-green-500" />
                            <div>
                                <p className="text-base text-muted-foreground">Avg Form</p>
                                <p className="text-2xl font-bold">{stats.avg_form_score.toFixed(0)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" />Sessions</TabsTrigger>
                    <TabsTrigger value="compare" className="gap-2"><GitCompare className="w-4 h-4" />Compare</TabsTrigger>
                    <TabsTrigger value="trends" className="gap-2"><TrendingUp className="w-4 h-4" />Trends</TabsTrigger>
                </TabsList>

                {/* Sessions Tab - All sessions list */}
                <TabsContent value="list" className="mt-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                All Workout Sessions ({sessions.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {sessions.length > 0 ? (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                    {sessions.map((session, index) => {
                                        const isExpanded = expandedSessionId === session.id
                                        const caloriesPerMinute = session.active_minutes > 0
                                            ? (session.total_calories / session.active_minutes).toFixed(2)
                                            : '0'
                                        const repsPerMinute = session.active_minutes > 0
                                            ? (session.total_reps / session.active_minutes).toFixed(1)
                                            : '0'

                                        return (
                                            <motion.div
                                                key={session.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="rounded-xl border border-border bg-secondary/30 overflow-hidden"
                                            >
                                                {/* Collapsed Header - Clickable */}
                                                <div
                                                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                                    onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                                                                <Dumbbell className="w-6 h-6 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-2xl font-bold gradient-text">
                                                                        {session.total_calories.toFixed(1)}
                                                                    </span>
                                                                    <span className="text-muted-foreground">kcal</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {new Date(session.session_date).toLocaleDateString('en-US', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Timer className="w-3 h-3" />
                                                                        {session.active_minutes.toFixed(1)} min
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <div className="hidden md:flex items-center gap-2 flex-wrap max-w-md">
                                                                {session.squat_reps > 0 && (
                                                                    <Badge variant="success" className="gap-1">
                                                                        <Target className="w-3 h-3" />
                                                                        {session.squat_reps} squats
                                                                    </Badge>
                                                                )}
                                                                {session.pushup_reps > 0 && (
                                                                    <Badge variant="info" className="gap-1">
                                                                        <Zap className="w-3 h-3" />
                                                                        {session.pushup_reps} pushups
                                                                    </Badge>
                                                                )}
                                                                {session.lunge_reps > 0 && (
                                                                    <Badge className="gap-1 bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                                        <Target className="w-3 h-3" />
                                                                        {session.lunge_reps} lunges
                                                                    </Badge>
                                                                )}
                                                                {session.jumping_jack_reps > 0 && (
                                                                    <Badge className="gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                                                        <Zap className="w-3 h-3" />
                                                                        {session.jumping_jack_reps} JJ
                                                                    </Badge>
                                                                )}
                                                                {session.high_knee_reps > 0 && (
                                                                    <Badge className="gap-1 bg-orange-500/20 text-orange-400 border-orange-500/30">
                                                                        <Target className="w-3 h-3" />
                                                                        {session.high_knee_reps} HK
                                                                    </Badge>
                                                                )}
                                                                {session.burpee_reps > 0 && (
                                                                    <Badge className="gap-1 bg-red-500/20 text-red-400 border-red-500/30">
                                                                        <Zap className="w-3 h-3" />
                                                                        {session.burpee_reps} burpees
                                                                    </Badge>
                                                                )}
                                                                {session.plank_seconds > 0 && (
                                                                    <Badge className="gap-1 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                                                        <Timer className="w-3 h-3" />
                                                                        {session.plank_seconds.toFixed(0)}s plank
                                                                    </Badge>
                                                                )}

                                                                {session.situp_reps > 0 && (
                                                                    <Badge className="gap-1 bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                                                                        <Target className="w-3 h-3" />
                                                                        {session.situp_reps} sit-ups
                                                                    </Badge>
                                                                )}
                                                                {session.leg_raise_reps > 0 && (
                                                                    <Badge className="gap-1 bg-pink-500/20 text-pink-400 border-pink-500/30">
                                                                        <Target className="w-3 h-3" />
                                                                        {session.leg_raise_reps} LR
                                                                    </Badge>
                                                                )}
                                                                {session.bicycle_crunch_reps > 0 && (
                                                                    <Badge className="gap-1 bg-rose-500/20 text-rose-400 border-rose-500/30">
                                                                        <Target className="w-3 h-3" />
                                                                        {session.bicycle_crunch_reps} BC
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                {session.form_score.toFixed(0)}%
                                                            </div>
                                                            <motion.div
                                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                transition={{ duration: 0.3 }}
                                                            >
                                                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Content */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="border-t border-white/10 p-4 space-y-5">
                                                                {/* Session Overview */}
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Session Overview</h4>
                                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                                        <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                <Flame className="w-3 h-3 text-orange-500" />
                                                                                Total Calories
                                                                            </div>
                                                                            <p className="text-xl font-bold text-orange-400">{session.total_calories.toFixed(1)}</p>
                                                                            <p className="text-xs text-muted-foreground">kcal burned</p>
                                                                        </div>
                                                                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                <Clock className="w-3 h-3 text-blue-500" />
                                                                                Duration
                                                                            </div>
                                                                            <p className="text-xl font-bold text-blue-400">{session.active_minutes.toFixed(1)}</p>
                                                                            <p className="text-xs text-muted-foreground">minutes</p>
                                                                        </div>
                                                                        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                <Target className="w-3 h-3 text-purple-500" />
                                                                                Total Reps
                                                                            </div>
                                                                            <p className="text-xl font-bold text-purple-400">{session.total_reps}</p>
                                                                            <p className="text-xs text-muted-foreground">repetitions</p>
                                                                        </div>
                                                                        <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                <Award className="w-3 h-3 text-green-500" />
                                                                                Form Score
                                                                            </div>
                                                                            <p className="text-xl font-bold text-green-400">{session.form_score.toFixed(0)}%</p>
                                                                            <p className="text-xs text-muted-foreground">accuracy</p>
                                                                        </div>
                                                                        <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                <Dumbbell className="w-3 h-3 text-cyan-500" />
                                                                                Exercises
                                                                            </div>
                                                                            <p className="text-sm font-bold text-cyan-400">{session.exercises_done || 'Mixed'}</p>
                                                                            <p className="text-xs text-muted-foreground">workout</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Exercise Breakdown */}
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Exercise Breakdown</h4>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                        {/* Squats */}
                                                                        {session.squat_reps > 0 && (
                                                                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                                                            <Target className="w-4 h-4 text-green-500" />
                                                                                        </div>
                                                                                        <span className="font-medium">Squats</span>
                                                                                    </div>
                                                                                    <Badge variant="success">{session.squat_reps} reps</Badge>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-muted-foreground">Calories</span>
                                                                                    <span className="font-medium text-orange-400">{session.squat_calories.toFixed(1)} kcal</span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Pushups */}
                                                                        {session.pushup_reps > 0 && (
                                                                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                                                            <Zap className="w-4 h-4 text-blue-500" />
                                                                                        </div>
                                                                                        <span className="font-medium">Pushups</span>
                                                                                    </div>
                                                                                    <Badge variant="info">{session.pushup_reps} reps</Badge>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-muted-foreground">Calories</span>
                                                                                    <span className="font-medium text-orange-400">{session.pushup_calories.toFixed(1)} kcal</span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Lunges */}
                                                                        {session.lunge_reps > 0 && (
                                                                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                                                            <Target className="w-4 h-4 text-purple-500" />
                                                                                        </div>
                                                                                        <span className="font-medium">Lunges</span>
                                                                                    </div>
                                                                                    <Badge className="bg-purple-500/20 text-purple-400">{session.lunge_reps} reps</Badge>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-muted-foreground">Calories</span>
                                                                                    <span className="font-medium text-orange-400">{session.lunge_calories?.toFixed(1) || 0} kcal</span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Jumping Jacks */}
                                                                        {session.jumping_jack_reps > 0 && (
                                                                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                                                                            <Zap className="w-4 h-4 text-yellow-500" />
                                                                                        </div>
                                                                                        <span className="font-medium">Jumping Jacks</span>
                                                                                    </div>
                                                                                    <Badge className="bg-yellow-500/20 text-yellow-400">{session.jumping_jack_reps} reps</Badge>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-muted-foreground">Calories</span>
                                                                                    <span className="font-medium text-orange-400">{session.jumping_jack_calories?.toFixed(1) || 0} kcal</span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* High Knees */}
                                                                        {session.high_knee_reps > 0 && (
                                                                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                                                                            <Target className="w-4 h-4 text-orange-500" />
                                                                                        </div>
                                                                                        <span className="font-medium">High Knees</span>
                                                                                    </div>
                                                                                    <Badge className="bg-orange-500/20 text-orange-400">{session.high_knee_reps} reps</Badge>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-muted-foreground">Calories</span>
                                                                                    <span className="font-medium text-orange-400">{session.high_knee_calories?.toFixed(1) || 0} kcal</span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Burpees */}
                                                                        {session.burpee_reps > 0 && (
                                                                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                                                                            <Zap className="w-4 h-4 text-red-500" />
                                                                                        </div>
                                                                                        <span className="font-medium">Burpees</span>
                                                                                    </div>
                                                                                    <Badge className="bg-red-500/20 text-red-400">{session.burpee_reps} reps</Badge>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-muted-foreground">Calories</span>
                                                                                    <span className="font-medium text-orange-400">{session.burpee_calories?.toFixed(1) || 0} kcal</span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Plank */}
                                                                        {session.plank_seconds > 0 && (
                                                                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                                                                            <Timer className="w-4 h-4 text-cyan-500" />
                                                                                        </div>
                                                                                        <span className="font-medium">Plank</span>
                                                                                    </div>
                                                                                    <Badge className="bg-cyan-500/20 text-cyan-400">{session.plank_seconds.toFixed(0)}s</Badge>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-muted-foreground">Calories</span>
                                                                                    <span className="font-medium text-orange-400">{session.plank_calories?.toFixed(1) || 0} kcal</span>
                                                                                </div>
                                                                            </div>
                                                                        )}



                                                                        {/* Sit-ups */}
                                                                        {session.situp_reps > 0 && (
                                                                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                                                            <Target className="w-4 h-4 text-indigo-500" />
                                                                                        </div>
                                                                                        <span className="font-medium">Sit-ups</span>
                                                                                    </div>
                                                                                    <Badge className="bg-indigo-500/20 text-indigo-400">{session.situp_reps} reps</Badge>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-muted-foreground">Calories</span>
                                                                                    <span className="font-medium text-orange-400">{session.situp_calories?.toFixed(1) || 0} kcal</span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Leg Raises */}
                                                                        {session.leg_raise_reps > 0 && (
                                                                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                                                                            <Target className="w-4 h-4 text-pink-500" />
                                                                                        </div>
                                                                                        <span className="font-medium">Leg Raises</span>
                                                                                    </div>
                                                                                    <Badge className="bg-pink-500/20 text-pink-400">{session.leg_raise_reps} reps</Badge>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-muted-foreground">Calories</span>
                                                                                    <span className="font-medium text-orange-400">{session.leg_raise_calories?.toFixed(1) || 0} kcal</span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Bicycle Crunches */}
                                                                        {session.bicycle_crunch_reps > 0 && (
                                                                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                                                                            <Target className="w-4 h-4 text-rose-500" />
                                                                                        </div>
                                                                                        <span className="font-medium">Bicycle Crunches</span>
                                                                                    </div>
                                                                                    <Badge className="bg-rose-500/20 text-rose-400">{session.bicycle_crunch_reps} reps</Badge>
                                                                                </div>
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-muted-foreground">Calories</span>
                                                                                    <span className="font-medium text-orange-400">{session.bicycle_crunch_calories?.toFixed(1) || 0} kcal</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Performance Metrics */}
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Metrics</h4>
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Calories/min</p>
                                                                            <p className="text-lg font-bold text-primary">{caloriesPerMinute}</p>
                                                                        </div>
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Reps/min</p>
                                                                            <p className="text-lg font-bold">{repsPerMinute}</p>
                                                                        </div>
                                                                        {session.squat_calories > 0 && (
                                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                                <p className="text-xs text-muted-foreground">Squat Cal</p>
                                                                                <p className="text-lg font-bold text-green-400">{session.squat_calories.toFixed(1)}</p>
                                                                            </div>
                                                                        )}
                                                                        {session.pushup_calories > 0 && (
                                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                                <p className="text-xs text-muted-foreground">Pushup Cal</p>
                                                                                <p className="text-lg font-bold text-blue-400">{session.pushup_calories.toFixed(1)}</p>
                                                                            </div>
                                                                        )}
                                                                        {session.lunge_calories > 0 && (
                                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                                <p className="text-xs text-muted-foreground">Lunge Cal</p>
                                                                                <p className="text-lg font-bold text-purple-400">{session.lunge_calories.toFixed(1)}</p>
                                                                            </div>
                                                                        )}
                                                                        {session.jumping_jack_calories > 0 && (
                                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                                <p className="text-xs text-muted-foreground">JJ Cal</p>
                                                                                <p className="text-lg font-bold text-yellow-400">{session.jumping_jack_calories.toFixed(1)}</p>
                                                                            </div>
                                                                        )}
                                                                        {session.high_knee_calories > 0 && (
                                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                                <p className="text-xs text-muted-foreground">High Knee Cal</p>
                                                                                <p className="text-lg font-bold text-orange-400">{session.high_knee_calories.toFixed(1)}</p>
                                                                            </div>
                                                                        )}
                                                                        {session.burpee_calories > 0 && (
                                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                                <p className="text-xs text-muted-foreground">Burpee Cal</p>
                                                                                <p className="text-lg font-bold text-red-400">{session.burpee_calories.toFixed(1)}</p>
                                                                            </div>
                                                                        )}
                                                                        {session.plank_calories > 0 && (
                                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                                <p className="text-xs text-muted-foreground">Plank Cal</p>
                                                                                <p className="text-lg font-bold text-cyan-400">{session.plank_calories.toFixed(1)}</p>
                                                                            </div>
                                                                        )}

                                                                        {session.situp_calories > 0 && (
                                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                                <p className="text-xs text-muted-foreground">Situp Cal</p>
                                                                                <p className="text-lg font-bold text-indigo-400">{session.situp_calories.toFixed(1)}</p>
                                                                            </div>
                                                                        )}
                                                                        {session.leg_raise_calories > 0 && (
                                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                                <p className="text-xs text-muted-foreground">Leg Raise Cal</p>
                                                                                <p className="text-lg font-bold text-pink-400">{session.leg_raise_calories.toFixed(1)}</p>
                                                                            </div>
                                                                        )}
                                                                        {session.bicycle_crunch_calories > 0 && (
                                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                                <p className="text-xs text-muted-foreground">BC Cal</p>
                                                                                <p className="text-lg font-bold text-rose-400">{session.bicycle_crunch_calories.toFixed(1)}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Session Info Footer */}
                                                                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm">
                                                                        <Calendar className="w-4 h-4" />
                                                                        {new Date(session.session_date).toLocaleDateString('en-US', {
                                                                            weekday: 'long',
                                                                            year: 'numeric',
                                                                            month: 'long',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm">
                                                                        <Clock className="w-4 h-4" />
                                                                        {new Date(session.session_date).toLocaleTimeString('en-US', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                        Form Score: {session.form_score.toFixed(0)}%
                                                                    </div>

                                                                    {/* Download Individual Session PDF */}
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="ml-auto gap-2 border-white/20 hover:bg-transparent hover:border-white/60 transition-colors"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            generateSingleSessionPDF(session)
                                                                        }}
                                                                    >
                                                                        <FileText className="w-4 h-4" />
                                                                        Download PDF
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No workout sessions yet</p>
                                    <p className="text-sm">Complete a Live Workout to see your data here!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Compare Tab - Date comparison */}
                <TabsContent value="compare" className="mt-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Compare Sessions by Date
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Date Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="date1" className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-white" />
                                        Start Date
                                    </Label>
                                    <Input id="date1" type="date" value={date1} onChange={(e) => setDate1(e.target.value)} className="bg-white/5 dark-date-picker" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date2" className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-white" />
                                        End Date
                                    </Label>
                                    <Input id="date2" type="date" value={date2} onChange={(e) => setDate2(e.target.value)} className="bg-white/5 dark-date-picker" />
                                </div>
                                <Button onClick={handleCompare} disabled={comparing || !date1 || !date2} className="gap-2">
                                    <GitCompare className="w-4 h-4" />
                                    {comparing ? 'Comparing...' : 'Compare'}
                                </Button>
                            </div>

                            {/* Comparison Results */}
                            {compareResult && (
                                <div className="space-y-6">
                                    {/* Stats Comparison */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="border-blue-500/30">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg text-blue-400">{new Date(compareResult.date1.date).toLocaleDateString()}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="flex justify-between"><span className="text-muted-foreground">Calories</span><span className="font-bold">{compareResult.date1.stats.total_calories.toFixed(1)} kcal</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Total Reps</span><span className="font-bold">{compareResult.date1.stats.total_reps}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Sessions</span><span className="font-bold">{compareResult.date1.stats.sessions_count}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Avg Form</span><span className="font-bold">{compareResult.date1.stats.avg_form_score.toFixed(0)}%</span></div>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-green-500/30">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg text-green-400">{new Date(compareResult.date2.date).toLocaleDateString()}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="flex justify-between"><span className="text-muted-foreground">Calories</span><span className="font-bold">{compareResult.date2.stats.total_calories.toFixed(1)} kcal</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Total Reps</span><span className="font-bold">{compareResult.date2.stats.total_reps}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Sessions</span><span className="font-bold">{compareResult.date2.stats.sessions_count}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Avg Form</span><span className="font-bold">{compareResult.date2.stats.avg_form_score.toFixed(0)}%</span></div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Radar Chart Comparison */}
                                    {(compareResult.date1.stats.total_calories > 0 || compareResult.date2.stats.total_calories > 0) && (
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart data={[
                                                    { metric: 'Calories', A: compareResult.date1.stats.total_calories, B: compareResult.date2.stats.total_calories },
                                                    { metric: 'Reps', A: compareResult.date1.stats.total_reps * 5, B: compareResult.date2.stats.total_reps * 5 },
                                                    { metric: 'Form', A: compareResult.date1.stats.avg_form_score, B: compareResult.date2.stats.avg_form_score },
                                                    { metric: 'Sessions', A: compareResult.date1.stats.sessions_count * 20, B: compareResult.date2.stats.sessions_count * 20 },
                                                ]}>
                                                    <PolarGrid stroke="hsl(var(--border))" />
                                                    <PolarAngleAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" />
                                                    <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                                                    <Radar name={compareResult.date1.date} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                                    <Radar name={compareResult.date2.date} dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Suggestions */}
                                    <Card className="border-primary/30">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                                Suggestions to Improve
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {compareResult.suggestions.map((suggestion, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-primary">•</span>
                                                        <span>{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {!compareResult && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Select two dates and click Compare to see your progress</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Trends Tab - Line chart with dates */}
                <TabsContent value="trends" className="mt-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Daily Calorie Burn Trend (Last 30 Days)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {trends.length > 0 ? (
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trends}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                                            <YAxis stroke="hsl(var(--muted-foreground))" />
                                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                                            <Line type="monotone" dataKey="calories" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No trend data available yet</p>
                                    <p className="text-sm">Complete more workouts to see trends!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Export PDF Modal */}
            <AnimatePresence>
                {showExportModal && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                            onClick={() => setShowExportModal(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <Card className="glass-card border-white/10 backdrop-blur-xl shadow-2xl w-full max-w-xl mx-auto">
                                <CardHeader className="relative pb-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-4 top-4"
                                        onClick={() => setShowExportModal(false)}
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                                            <Download className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Export to PDF</h3>
                                            <p className="text-sm text-muted-foreground font-normal">Select date range for export</p>
                                        </div>
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-5">
                                    {/* Date Range Inputs */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="exportStartDate" className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-white" />
                                                Start Date
                                            </Label>
                                            <Input
                                                id="exportStartDate"
                                                type="date"
                                                value={exportStartDate}
                                                onChange={(e) => setExportStartDate(e.target.value)}
                                                className="bg-white/5 dark-date-picker"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exportEndDate" className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-white" />
                                                End Date
                                            </Label>
                                            <Input
                                                id="exportEndDate"
                                                type="date"
                                                value={exportEndDate}
                                                onChange={(e) => setExportEndDate(e.target.value)}
                                                className="bg-white/5 dark-date-picker"
                                            />
                                        </div>
                                    </div>

                                    {/* Sessions Count Display */}
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-white/10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                                    <Activity className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Sessions Found</p>
                                                    <p className="text-3xl font-bold gradient-text">
                                                        {filteredExportSessions.length}
                                                    </p>
                                                </div>
                                            </div>
                                            {filteredExportSessions.length > 0 && (
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Total Calories</p>
                                                    <p className="text-lg font-bold text-orange-400">
                                                        {filteredExportSessions.reduce((sum, s) => sum + s.total_calories, 0).toFixed(1)} kcal
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* No sessions message */}
                                    {exportStartDate && exportEndDate && filteredExportSessions.length === 0 && (
                                        <div className="text-center py-3 text-muted-foreground">
                                            <p className="text-sm">No sessions found in this date range</p>
                                        </div>
                                    )}

                                    {/* Download Button */}
                                    <Button
                                        className="w-full gap-2 btn-primary"
                                        disabled={filteredExportSessions.length === 0}
                                        onClick={generateBulkPDF}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Download {filteredExportSessions.length} Session{filteredExportSessions.length !== 1 ? 's' : ''} as PDF
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
