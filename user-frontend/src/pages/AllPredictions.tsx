import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import {
    History,
    Calendar,
    Flame,
    Heart,
    Thermometer,
    Scale,
    Timer,
    Target,
    TrendingUp,
    Zap,
    User,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    CheckCircle2,
    Activity,
    Award,
    Crosshair,
    Brain,
    ArrowLeft,
    ArrowRight,
    Dumbbell,
    Droplets,
    Shield,
    Star,
    Layers
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

import api from '../services/api'

interface DerivedMetrics {
    bmi: number
    bmi_category: string
    max_heart_rate: number
    hr_percentage: number
    hr_zone: {
        zone: number
        label: string
        range: string
    }
    intensity_level: string
    effort_score: number
    temp_category: string
    heat_stress_flag: boolean
    hr_per_minute: number
    calories_per_minute: number
    workout_load: number
    age_group: string
    height_category: string
    fitness_level: string
    risk_flag: boolean
    workout_type_predicted: string
}

interface Prediction {
    id: number
    user_id: number
    gender: string
    age: number
    height: number
    weight: number
    duration?: number
    heart_rate?: number
    body_temp?: number
    resting_heart_rate?: number
    avg_heart_rate?: number
    workout_type?: string
    exercise_name?: string
    session_duration?: number
    sets?: number
    reps?: number
    difficulty_level?: string
    experience_level?: number
    water_intake?: number
    workout_frequency?: number
    predicted_calories: number
    confidence_score: number
    model_type: string
    train_split: number
    derived_metrics: any
    created_at: string
    prediction_type?: string
}

const MODEL_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    'ensemble': { label: 'Ensemble', icon: Brain },
    'random_forest': { label: 'Random Forest', icon: TrendingUp },
    'xgboost': { label: 'XGBoost', icon: Zap },
    'lightgbm': { label: 'LightGBM', icon: Activity },
    'linear_regression': { label: 'Linear Regression', icon: Target }
}

export default function AllPredictions(): JSX.Element {
    const { token } = useAuth()
    const [predictions, setPredictions] = useState<Prediction[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [activeTab, setActiveTab] = useState<'all' | 'basic' | 'advanced'>('all')

    useEffect(() => {
        if (token) {
            fetchPredictions()
        }
    }, [token, currentPage])

    const fetchPredictions = async () => {
        setIsLoading(true)
        try {
            // Fetch basic predictions
            const basicRes = await api.get(
                `/calorie-predict/history?page=${currentPage}&per_page=10`
            )
            const basicData = basicRes.data
            const basicPredictions = (basicData.predictions || []).map((p: any) => ({
                ...p,
                prediction_type: 'basic'
            }))

            // Fetch advanced predictions
            const advRes = await api.get(
                `/advanced-calorie-predict/history?page=${currentPage}&per_page=10`
            )
            const advData = advRes.data
            const advPredictions = (advData.predictions || []).map((p: any) => ({
                ...p,
                prediction_type: 'advanced'
            }))

            // Merge and sort by date
            const allPredictions = [...basicPredictions, ...advPredictions]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            setPredictions(allPredictions)
            setTotal((basicData.total || 0) + (advData.total || 0))
            setTotalPages(Math.max(basicData.pages || 1, advData.pages || 1))
        } catch (err) {
            console.error('Failed to fetch predictions:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getModelInfo = (modelType: string) => {
        return MODEL_LABELS[modelType] || { label: modelType, icon: Target }
    }

    return (
        <div className="min-h-screen relative">
            {/* Background */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    background: `
                        radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 60%),
                        linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background)) 100%)
                    `
                }}
            />

            {/* Content */}
            <div className="relative z-10 space-y-6 pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">All Predictions</h1>
                        <p className="text-muted-foreground">
                            View all your calorie burn predictions ({total} total)
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeTab === 'all' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setActiveTab('basic')}
                                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeTab === 'basic' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Basic
                            </button>
                            <button
                                onClick={() => setActiveTab('advanced')}
                                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeTab === 'advanced' ? 'bg-pink-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Advanced
                            </button>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground px-3">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/50"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </motion.div>

                {/* Predictions List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <Card className="glass-card border-white/10 backdrop-blur-xl">
                            <CardContent className="py-16 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading predictions...</p>
                            </CardContent>
                        </Card>
                    ) : predictions.length === 0 ? (
                        <Card className="glass-card border-white/10 backdrop-blur-xl">
                            <CardContent className="py-16 text-center">
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                                    <History className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No Predictions Yet</h3>
                                <p className="text-muted-foreground">
                                    Start making calorie predictions to see them here
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        predictions
                            .filter(p => activeTab === 'all' || p.prediction_type === activeTab)
                            .map((prediction, index) => {
                                const isAdvanced = prediction.prediction_type === 'advanced'
                                const uniqueId = `${prediction.prediction_type}-${prediction.id}`
                                const isExpanded = expandedId === uniqueId
                                const ModelIcon = getModelInfo(prediction.model_type).icon

                                return (
                                    <motion.div
                                        key={prediction.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className="glass-card border-white/10 backdrop-blur-xl overflow-hidden">
                                            {/* Collapsed Header */}
                                            <div
                                                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                                onClick={() => toggleExpand(uniqueId)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAdvanced ? 'bg-gradient-to-br from-pink-500/30 to-amber-500/30' : 'bg-gradient-to-br from-primary/30 to-accent/30'}`}>
                                                            {isAdvanced ? <Dumbbell className="w-6 h-6 text-pink-500" /> : <Flame className="w-6 h-6 text-primary" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl font-bold gradient-text">
                                                                    {prediction.predicted_calories}
                                                                </span>
                                                                <span className="text-muted-foreground">kcal</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {formatDate(prediction.created_at)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Timer className="w-3 h-3" />
                                                                    {isAdvanced ? prediction.session_duration : prediction.duration} min
                                                                </span>
                                                                {isAdvanced && prediction.workout_type && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Dumbbell className="w-3 h-3" />
                                                                        {prediction.workout_type}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        {/* Type Badge */}
                                                        <div className={`hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${isAdvanced
                                                            ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                                                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                            }`}>
                                                            {isAdvanced ? <Dumbbell className="w-3 h-3" /> : <Flame className="w-3 h-3" />}
                                                            {isAdvanced ? 'Advanced' : 'Basic'}
                                                        </div>
                                                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
                                                            <ModelIcon className="w-4 h-4 text-primary" />
                                                            <span className="text-sm">{getModelInfo(prediction.model_type).label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {(prediction.confidence_score * 100).toFixed(1)}%
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
                                                {isExpanded && prediction.derived_metrics && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="border-t border-white/10 p-4 space-y-6">
                                                            {/* Input Parameters */}
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-3">Input Parameters</h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <User className="w-3 h-3" />
                                                                            Gender
                                                                        </div>
                                                                        <p className="font-medium capitalize">{prediction.gender}</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <User className="w-3 h-3" />
                                                                            Age
                                                                        </div>
                                                                        <p className="font-medium">{prediction.age} years</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Scale className="w-3 h-3" />
                                                                            Height
                                                                        </div>
                                                                        <p className="font-medium">{prediction.height} {isAdvanced ? 'm' : 'cm'}</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Scale className="w-3 h-3" />
                                                                            Weight
                                                                        </div>
                                                                        <p className="font-medium">{prediction.weight} kg</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Timer className="w-3 h-3" />
                                                                            Duration
                                                                        </div>
                                                                        <p className="font-medium">{isAdvanced ? prediction.session_duration : prediction.duration} min</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Heart className="w-3 h-3 text-red-500" />
                                                                            {isAdvanced ? 'Avg HR' : 'Heart Rate'}
                                                                        </div>
                                                                        <p className="font-medium">{isAdvanced ? prediction.avg_heart_rate : prediction.heart_rate} bpm</p>
                                                                    </div>
                                                                    {!isAdvanced && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                <Scale className="w-3 h-3 text-orange-500" />
                                                                                Body Temp
                                                                            </div>
                                                                            <p className="font-medium">{prediction.body_temp}°C</p>
                                                                        </div>
                                                                    )}
                                                                    {isAdvanced && prediction.resting_heart_rate && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                <Heart className="w-3 h-3 text-red-400" />
                                                                                Rest HR
                                                                            </div>
                                                                            <p className="font-medium">{prediction.resting_heart_rate} bpm</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Advanced Extra Params */}
                                                                {isAdvanced && (
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-3">
                                                                        {prediction.workout_type && (
                                                                            <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                    <Dumbbell className="w-3 h-3 text-pink-500" />
                                                                                    Workout Type
                                                                                </div>
                                                                                <p className="font-medium">{prediction.workout_type}</p>
                                                                            </div>
                                                                        )}
                                                                        {prediction.exercise_name && (
                                                                            <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                    <Star className="w-3 h-3 text-amber-500" />
                                                                                    Exercise
                                                                                </div>
                                                                                <p className="font-medium text-xs">{prediction.exercise_name}</p>
                                                                            </div>
                                                                        )}
                                                                        {prediction.sets && (
                                                                            <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                    <Layers className="w-3 h-3" />
                                                                                    Sets × Reps
                                                                                </div>
                                                                                <p className="font-medium">{prediction.sets} × {prediction.reps}</p>
                                                                            </div>
                                                                        )}
                                                                        {prediction.difficulty_level && (
                                                                            <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                    <Zap className="w-3 h-3 text-yellow-500" />
                                                                                    Difficulty
                                                                                </div>
                                                                                <p className="font-medium">{prediction.difficulty_level}</p>
                                                                            </div>
                                                                        )}
                                                                        {prediction.water_intake && (
                                                                            <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                    <Droplets className="w-3 h-3 text-cyan-500" />
                                                                                    Water
                                                                                </div>
                                                                                <p className="font-medium">{prediction.water_intake}L</p>
                                                                            </div>
                                                                        )}
                                                                        {prediction.workout_frequency && (
                                                                            <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                    <Calendar className="w-3 h-3" />
                                                                                    Frequency
                                                                                </div>
                                                                                <p className="font-medium">{prediction.workout_frequency} d/wk</p>
                                                                            </div>
                                                                        )}
                                                                        {prediction.experience_level && (
                                                                            <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                                    <Shield className="w-3 h-3 text-purple-500" />
                                                                                    Experience
                                                                                </div>
                                                                                <p className="font-medium">Level {prediction.experience_level}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Derived Metrics */}
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-3">Derived Metrics</h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                                                    {/* BMI */}
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Scale className="w-3 h-3 text-blue-500" />
                                                                            BMI
                                                                        </div>
                                                                        <p className="text-xl font-bold">{prediction.derived_metrics.bmi}</p>
                                                                        <p className={`text-xs ${prediction.derived_metrics.bmi_category === 'Normal' ? 'text-green-500' :
                                                                            prediction.derived_metrics.bmi_category === 'Overweight' ? 'text-yellow-500' : 'text-red-500'
                                                                            }`}>
                                                                            {prediction.derived_metrics.bmi_category}
                                                                        </p>
                                                                    </div>

                                                                    {/* Heart Rate Zone */}
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Heart className="w-3 h-3 text-red-500" />
                                                                            HR Zone
                                                                        </div>
                                                                        <p className="text-xl font-bold">Zone {prediction.derived_metrics.hr_zone?.zone || '-'}</p>
                                                                        <p className="text-xs text-primary">{prediction.derived_metrics.hr_zone?.label || '-'}</p>
                                                                    </div>

                                                                    {/* Intensity */}
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Zap className="w-3 h-3 text-yellow-500" />
                                                                            Intensity
                                                                        </div>
                                                                        <p className={`text-xl font-bold ${prediction.derived_metrics.intensity_level === 'High' ? 'text-red-500' :
                                                                            prediction.derived_metrics.intensity_level === 'Moderate' ? 'text-yellow-500' : 'text-green-500'
                                                                            }`}>
                                                                            {prediction.derived_metrics.intensity_level}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">Effort: {prediction.derived_metrics.effort_score}</p>
                                                                    </div>

                                                                    {/* Temperature / Recovery */}
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            {isAdvanced ? <Shield className="w-3 h-3 text-cyan-500" /> : <Thermometer className="w-3 h-3 text-orange-500" />}
                                                                            {isAdvanced ? 'Recovery' : 'Temperature'}
                                                                        </div>
                                                                        {isAdvanced ? (
                                                                            <>
                                                                                <p className="text-xl font-bold text-cyan-400">{prediction.derived_metrics.recovery_score ?? '-'}%</p>
                                                                                <p className={`text-xs ${prediction.derived_metrics.hydration_status === 'Good' ? 'text-green-500' : 'text-yellow-500'}`}>
                                                                                    Hydration: {prediction.derived_metrics.hydration_status || '-'}
                                                                                </p>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <p className="text-xl font-bold">{prediction.derived_metrics.temp_category}</p>
                                                                                {prediction.derived_metrics.heat_stress_flag && (
                                                                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                                                                        <AlertTriangle className="w-3 h-3" />
                                                                                        Heat Stress
                                                                                    </p>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {/* Fitness Level */}
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Award className="w-3 h-3 text-purple-500" />
                                                                            Fitness Level
                                                                        </div>
                                                                        {(() => {
                                                                            const fitnessVal = prediction.derived_metrics.fitness_level || prediction.derived_metrics.fitness_label || '-'
                                                                            return (
                                                                                <p className={`text-xl font-bold ${fitnessVal === 'Advanced' ? 'text-green-500' :
                                                                                    fitnessVal === 'Intermediate' ? 'text-blue-500' : 'text-yellow-500'
                                                                                    }`}>
                                                                                    {fitnessVal}
                                                                                </p>
                                                                            )
                                                                        })()}
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {prediction.derived_metrics.workout_type_predicted || prediction.derived_metrics.difficulty_level || ''}
                                                                        </p>
                                                                    </div>

                                                                    {/* Demographics */}
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <User className="w-3 h-3 text-cyan-500" />
                                                                            Demographics
                                                                        </div>
                                                                        <p className="text-sm font-medium">{prediction.derived_metrics.age_group}</p>
                                                                        <p className="text-xs text-muted-foreground">{prediction.derived_metrics.height_category}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Performance Metrics */}
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Metrics</h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <p className="text-xs text-muted-foreground">Calories/min</p>
                                                                        <p className="text-lg font-bold text-primary">{prediction.derived_metrics.calories_per_minute}</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <p className="text-xs text-muted-foreground">{isAdvanced ? 'Cal/hr' : 'HR/min'}</p>
                                                                        <p className="text-lg font-bold">{isAdvanced ? prediction.derived_metrics.calories_per_hour : prediction.derived_metrics.hr_per_minute}</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <p className="text-xs text-muted-foreground">Workout Load</p>
                                                                        <p className="text-lg font-bold">{prediction.derived_metrics.workout_load}</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <p className="text-xs text-muted-foreground">Max HR</p>
                                                                        <p className="text-lg font-bold">{prediction.derived_metrics.max_heart_rate} bpm</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Model Info */}
                                                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm">
                                                                    <ModelIcon className="w-4 h-4" />
                                                                    {getModelInfo(prediction.model_type).label}
                                                                </div>
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm">
                                                                    <Target className="w-4 h-4" />
                                                                    Train Split: {(prediction.train_split * 100).toFixed(0)}%
                                                                </div>
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    Confidence: {(prediction.confidence_score * 100).toFixed(1)}%
                                                                </div>
                                                                {prediction.derived_metrics.risk_flag && (
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-sm">
                                                                        <AlertTriangle className="w-4 h-4" />
                                                                        Risk Alert
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Card>
                                    </motion.div>
                                )
                            })
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                        <Button
                            variant="outline"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="hover:bg-purple-400/20 hover:text-purple-300 hover:border-purple-400/50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number
                                if (totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                } else {
                                    pageNum = currentPage - 2 + i
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                        size="icon"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`hover:bg-purple-400/20 hover:text-purple-300 hover:border-purple-400/50 ${currentPage === pageNum ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                        </div>
                        <Button
                            variant="outline"
                            disabled={currentPage >= totalPages}
                            className="hover:bg-purple-400/20 hover:text-purple-300 hover:border-purple-400/50"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
