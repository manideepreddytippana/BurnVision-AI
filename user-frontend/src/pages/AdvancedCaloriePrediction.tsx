import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
    Calculator,
    Activity,
    Heart,
    Scale,
    Timer,
    TrendingUp,
    Zap,
    Target,
    User,
    Flame,
    Brain,
    History,
    ChevronDown,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    BarChart2,
    Award,
    Crosshair,
    Dumbbell,
    Droplets,
    Calendar,
    Shield,
    Star,
    Layers
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { useNavigate } from 'react-router-dom'

const rawBase = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '') : ''
const API_URL = rawBase ? `${rawBase}/api` : '/api'

interface AdvancedDerivedMetrics {
    bmi: number
    bmi_category: string
    estimated_fat_percentage: number
    lean_mass_kg: number
    max_heart_rate: number
    heart_rate_reserve: number
    hr_percentage: number
    pct_hrr: number
    hr_zone: {
        zone: number
        label: string
        range: string
    }
    intensity_level: string
    effort_score: number
    total_volume: number
    calories_per_minute: number
    calories_per_hour: number
    workout_load: number
    age_group: string
    height_category: string
    fitness_label: string
    recovery_score: number
    hydration_status: string
    risk_flag: boolean
    overtraining_risk: boolean
    workout_type: string
    exercise_name: string
    difficulty_level: string
}

interface PredictionResult {
    predicted_calories: number
    confidence_score: number
    model_type: string
    derived_metrics: AdvancedDerivedMetrics
    prediction_id: number
    model_performance?: ModelPerformance
    ai_insights?: SarvamInsightPayload
}

interface SarvamStructuredInsights {
    workout_anomalies: string[]
    behavioral_anomalies: string[]
    overtraining_detection: string[]
    nutrition_recommendations: string[]
    hydration_tracking: string[]
    progress_tracking: string[]
    smart_recommendation_engine: string[]
    personalization_factor: string
}

interface SarvamInsightPayload {
    provider: string
    model: string
    generated_at: string
    success: boolean
    structured: SarvamStructuredInsights
    raw_text?: string
    error?: string | null
}

interface ModelPerformance {
    r2_score: number
    mae: number
    rmse?: number
    accuracy_percentage?: number
    precision?: number
    error_std?: number
    models_used?: string[]
}

interface PredictionHistory {
    id: number
    predicted_calories: number
    model_type: string
    created_at: string
    gender: string
    age: number
    session_duration: number
    workout_type: string
    exercise_name: string
}

interface ModelInfo {
    name: string
    available: boolean
    metrics?: {
        r2_score?: number
        mae?: number
        train_split?: number
    }
}

interface ModelComparisonData {
    models: {
        id: string
        name: string
        r2_score: number
        mae: number
        rmse: number
        accuracy_percentage: number
        precision: number
    }[]
    metrics: {
        r2_scores: { model: string; value: number }[]
        mae_values: { model: string; value: number }[]
        accuracy_values: { model: string; value: number }[]
        precision_values: { model: string; value: number }[]
    }
}

const MODEL_OPTIONS = [
    { value: 'ensemble', label: 'Ensemble (Best)', icon: Brain },
    { value: 'random_forest', label: 'Random Forest', icon: TrendingUp },
    { value: 'xgboost', label: 'XGBoost', icon: Zap },
    { value: 'lightgbm', label: 'LightGBM', icon: Activity },
    { value: 'linear_regression', label: 'Linear Regression', icon: Target }
]

const WORKOUT_TYPES = ['Cardio', 'Strength', 'HIIT', 'Yoga']

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

const EXPERIENCE_LEVELS = [
    { value: '1', label: 'Beginner (1)' },
    { value: '2', label: 'Intermediate (2)' },
    { value: '3', label: 'Advanced (3)' }
]

export default function AdvancedCaloriePrediction(): JSX.Element {
    const { token } = useAuth()
    const navigate = useNavigate()

    // Form state - Personal Details
    const [gender, setGender] = useState('Male')
    const [age, setAge] = useState('')
    const [weight, setWeight] = useState('')
    const [height, setHeight] = useState('')

    // Fitness Data
    const [restingHeartRate, setRestingHeartRate] = useState('')
    const [avgHeartRate, setAvgHeartRate] = useState('')

    // Workout Details
    const [workoutType, setWorkoutType] = useState('Cardio')
    const [exerciseName, setExerciseName] = useState('')
    const [sessionDuration, setSessionDuration] = useState('')
    const [sets, setSets] = useState('')
    const [reps, setReps] = useState('')
    const [difficultyLevel, setDifficultyLevel] = useState('Intermediate')

    // Experience
    const [experienceLevel, setExperienceLevel] = useState('2')

    // Lifestyle
    const [waterIntake, setWaterIntake] = useState('')
    const [workoutFrequency, setWorkoutFrequency] = useState('')

    // Model state
    const [selectedModel, setSelectedModel] = useState('ensemble')
    const [trainSplit, setTrainSplit] = useState(80)
    const [availableModels, setAvailableModels] = useState<Record<string, ModelInfo>>({})
    const [exerciseNames, setExerciseNames] = useState<string[]>([])

    // Results state
    const [prediction, setPrediction] = useState<PredictionResult | null>(null)
    const [history, setHistory] = useState<PredictionHistory[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isEvaluatingWithSarvam, setIsEvaluatingWithSarvam] = useState(false)
    const [isTraining, setIsTraining] = useState(false)
    const [error, setError] = useState('')
    const [showHistory, setShowHistory] = useState(false)

    // Model comparison state
    const [modelComparison, setModelComparison] = useState<ModelComparisonData | null>(null)

    // Input field refs for focus navigation
    const advAgeRef = useRef<HTMLInputElement>(null)
    const advWeightRef = useRef<HTMLInputElement>(null)
    const advHeightRef = useRef<HTMLInputElement>(null)
    const restingHrRef = useRef<HTMLInputElement>(null)
    const avgHrRef = useRef<HTMLInputElement>(null)
    const sessionDurRef = useRef<HTMLInputElement>(null)
    const setsRef = useRef<HTMLInputElement>(null)
    const repsRef = useRef<HTMLInputElement>(null)
    const waterRef = useRef<HTMLInputElement>(null)
    const freqRef = useRef<HTMLInputElement>(null)

    const inputRefs = [advAgeRef, advWeightRef, advHeightRef, restingHrRef, avgHrRef, sessionDurRef, setsRef, repsRef, waterRef, freqRef]

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const nextRef = inputRefs[currentIndex + 1]
            if (nextRef?.current) {
                nextRef.current.focus()
            }
        }
    }



    useEffect(() => {
        if (token) {
            fetchModels()
            fetchHistory()
            fetchModelComparison()
        }
    }, [token])

    const fetchModels = async () => {
        try {
            const response = await fetch(`${API_URL}/advanced-calorie-predict/models`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            setAvailableModels(data.models || {})
            setExerciseNames(data.exercise_names || [])
            if (data.exercise_names && data.exercise_names.length > 0 && !exerciseName) {
                setExerciseName(data.exercise_names[0])
            }
        } catch (err) {
            console.error('Failed to fetch advanced models:', err)
        }
    }

    const fetchHistory = async () => {
        try {
            const response = await fetch(`${API_URL}/advanced-calorie-predict/history?per_page=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            setHistory(data.predictions || [])
        } catch (err) {
            console.error('Failed to fetch advanced history:', err)
        }
    }

    const fetchModelComparison = async () => {
        try {
            const response = await fetch(`${API_URL}/advanced-calorie-predict/models/comparison`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            setModelComparison(data)
        } catch (err) {
            console.error('Failed to fetch advanced model comparison:', err)
        }
    }

    const handlePredict = async () => {
        setError('')
        setIsLoading(true)
        setIsEvaluatingWithSarvam(false)

        try {
            const response = await fetch(`${API_URL}/advanced-calorie-predict/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gender,
                    age: parseInt(age),
                    weight: parseFloat(weight),
                    height: parseFloat(height),
                    resting_heart_rate: parseFloat(restingHeartRate),
                    avg_heart_rate: parseFloat(avgHeartRate),
                    workout_type: workoutType,
                    exercise_name: exerciseName,
                    session_duration: parseFloat(sessionDuration),
                    sets: parseFloat(sets),
                    reps: parseFloat(reps),
                    difficulty_level: difficultyLevel,
                    experience_level: parseFloat(experienceLevel),
                    water_intake: parseFloat(waterIntake),
                    workout_frequency: parseFloat(workoutFrequency),
                    model_type: selectedModel,
                    train_split: trainSplit / 100
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Prediction failed')
            }

            await new Promise((resolve) => setTimeout(resolve, 1200))
            setPrediction(data)
            setIsLoading(false)
            fetchHistory()

            setIsEvaluatingWithSarvam(true)

            try {
                const aiResponse = await fetch(`${API_URL}/ai/advanced-evaluate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        prediction_id: data.prediction_id
                    })
                })

                const aiData = await aiResponse.json()
                if (!aiResponse.ok) {
                    throw new Error(aiData.error || 'Sarvam AI evaluation failed')
                }

                if (aiData.ai_insights) {
                    setPrediction((prev) => {
                        if (!prev) {
                            return prev
                        }
                        return {
                            ...prev,
                            ai_insights: aiData.ai_insights
                        }
                    })
                }
            } catch (aiErr: any) {
                setError(aiErr.message || 'Calories predicted, but AI insights could not be generated')
            } finally {
                setIsEvaluatingWithSarvam(false)
            }

            if (trainSplit !== 80) {
                try {
                    await fetch(`${API_URL}/advanced-calorie-predict/cleanup-custom`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    setTrainSplit(80)
                    fetchModelComparison()
                } catch (cleanupErr) {
                    console.error('Failed to cleanup custom models:', cleanupErr)
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to make prediction')
            setIsLoading(false)
            setIsEvaluatingWithSarvam(false)
        }
    }



    const handleTrain = async () => {
        if (selectedModel === 'ensemble') {
            setError('Cannot train ensemble directly. Select a specific model.')
            return
        }

        setIsTraining(true)
        setError('')

        try {
            const response = await fetch(`${API_URL}/advanced-calorie-predict/train`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    model_type: selectedModel,
                    train_split: trainSplit / 100
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Training failed')
            }

            fetchModels()
        } catch (err: any) {
            setError(err.message || 'Failed to train model')
        } finally {
            setIsTraining(false)
        }
    }

    const isFormValid = age && height && weight && restingHeartRate && avgHeartRate &&
        sessionDuration && sets && reps && waterIntake && workoutFrequency && exerciseName

    return (
        <div className="min-h-screen relative">
            {/* Background */}
            <div
                className="fixed inset-0 z-0 advanced-page-background"
            />

            {/* Content */}
            <div className="relative z-10 space-y-6 pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold gradient-text mb-2">Advanced Calorie Burn Prediction</h1>
                    <p className="text-muted-foreground">Comprehensive workout analysis with detailed fitness metrics</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Input Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1"
                    >
                        <Card className="glass-card border-foreground/10 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-pink-500" />
                                    Advanced Input Parameters
                                </CardTitle>
                                <CardDescription>Enter comprehensive workout details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* ===== PERSONAL DETAILS ===== */}
                                <div className="space-y-1">
                                    <h3 className="text-sm font-semibold text-pink-400 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Personal Details
                                    </h3>
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={gender === 'Male' ? 'default' : 'outline'}
                                            className={`flex-1 ${gender === 'Male' ? 'text-white hover:text-white' : 'hover:text-foreground'}`}
                                            onClick={() => setGender('Male')}
                                        >
                                            Male
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={gender === 'Female' ? 'default' : 'outline'}
                                            className={`flex-1 ${gender === 'Female' ? 'text-white hover:text-white' : 'hover:text-foreground'}`}
                                            onClick={() => setGender('Female')}
                                        >
                                            Female
                                        </Button>
                                    </div>
                                </div>

                                {/* Age */}
                                <div className="space-y-2">
                                    <Label htmlFor="adv-age" className="flex items-center gap-2">
                                        <User className="w-4 h-4" /> Age (years)
                                    </Label>
                                    <Input
                                        id="adv-age"
                                        ref={advAgeRef}
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        onKeyDown={(e) => handleInputKeyDown(e, 0)}
                                        placeholder="30"
                                        min="10"
                                        max="80"
                                    />
                                </div>

                                {/* Weight */}
                                <div className="space-y-2">
                                    <Label htmlFor="adv-weight" className="flex items-center gap-2">
                                        <Scale className="w-4 h-4" /> Weight (kg)
                                    </Label>
                                    <Input
                                        id="adv-weight"
                                        ref={advWeightRef}
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        onKeyDown={(e) => handleInputKeyDown(e, 1)}
                                        placeholder="70"
                                        min="30"
                                        max="200"
                                    />
                                </div>

                                {/* Height */}
                                <div className="space-y-2">
                                    <Label htmlFor="adv-height" className="flex items-center gap-2">
                                        <Scale className="w-4 h-4" /> Height (m)
                                    </Label>
                                    <Input
                                        id="adv-height"
                                        ref={advHeightRef}
                                        type="number"
                                        step="0.01"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                        onKeyDown={(e) => handleInputKeyDown(e, 2)}
                                        placeholder="1.70"
                                        min="1.0"
                                        max="2.5"
                                    />
                                </div>

                                {/* ===== FITNESS DATA ===== */}
                                <div className="space-y-1 pt-3 border-t border-foreground/10">
                                    <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                                        <Heart className="w-4 h-4" /> Fitness Data
                                    </h3>
                                </div>

                                {/* Resting Heart Rate */}
                                <div className="space-y-2">
                                    <Label htmlFor="resting-hr" className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-400" /> Resting Heart Rate (bpm)
                                    </Label>
                                    <Input
                                        id="resting-hr"
                                        ref={restingHrRef}
                                        type="number"
                                        value={restingHeartRate}
                                        onChange={(e) => setRestingHeartRate(e.target.value)}
                                        onKeyDown={(e) => handleInputKeyDown(e, 3)}
                                        placeholder="65"
                                        min="40"
                                        max="120"
                                    />
                                </div>

                                {/* Average Heart Rate */}
                                <div className="space-y-2">
                                    <Label htmlFor="avg-hr" className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-500" /> Average Heart Rate (bpm)
                                    </Label>
                                    <Input
                                        id="avg-hr"
                                        ref={avgHrRef}
                                        type="number"
                                        value={avgHeartRate}
                                        onChange={(e) => setAvgHeartRate(e.target.value)}
                                        onKeyDown={(e) => handleInputKeyDown(e, 4)}
                                        placeholder="140"
                                        min="60"
                                        max="220"
                                    />
                                </div>

                                {/* ===== WORKOUT DETAILS ===== */}
                                <div className="space-y-1 pt-3 border-t border-foreground/10">
                                    <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                                        <Dumbbell className="w-4 h-4" /> Workout Details
                                    </h3>
                                </div>

                                {/* Workout Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="workout-type">Workout Type</Label>
                                    <select
                                        id="workout-type"
                                        aria-label="Workout Type"
                                        title="Workout Type"
                                        value={workoutType}
                                        onChange={(e) => setWorkoutType(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-background border border-foreground/10 text-foreground"
                                    >
                                        {WORKOUT_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Exercise Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="exercise-name">Exercise Name</Label>
                                    <select
                                        id="exercise-name"
                                        aria-label="Exercise Name"
                                        title="Exercise Name"
                                        value={exerciseName}
                                        onChange={(e) => setExerciseName(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-background border border-foreground/10 text-foreground"
                                    >
                                        {exerciseNames.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Session Duration */}
                                <div className="space-y-2">
                                    <Label htmlFor="session-dur" className="flex items-center gap-2">
                                        <Timer className="w-4 h-4" /> Session Duration (minutes)
                                    </Label>
                                    <Input
                                        id="session-dur"
                                        ref={sessionDurRef}
                                        type="number"
                                        value={sessionDuration}
                                        onChange={(e) => setSessionDuration(e.target.value)}
                                        onKeyDown={(e) => handleInputKeyDown(e, 5)}
                                        placeholder="60"
                                        min="5"
                                        max="300"
                                    />
                                </div>

                                {/* Sets & Reps */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="sets" className="flex items-center gap-2">
                                            <Layers className="w-4 h-4" /> Sets
                                        </Label>
                                        <Input
                                            id="sets"
                                            ref={setsRef}
                                            type="number"
                                            value={sets}
                                            onChange={(e) => setSets(e.target.value)}
                                            onKeyDown={(e) => handleInputKeyDown(e, 6)}
                                            placeholder="4"
                                            min="1"
                                            max="20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reps" className="flex items-center gap-2">
                                            <Layers className="w-4 h-4" /> Reps
                                        </Label>
                                        <Input
                                            id="reps"
                                            ref={repsRef}
                                            type="number"
                                            value={reps}
                                            onChange={(e) => setReps(e.target.value)}
                                            onKeyDown={(e) => handleInputKeyDown(e, 7)}
                                            placeholder="12"
                                            min="1"
                                            max="100"
                                        />
                                    </div>
                                </div>

                                {/* Difficulty Level */}
                                <div className="space-y-2">
                                    <Label htmlFor="difficulty-level">Difficulty Level</Label>
                                    <select
                                        id="difficulty-level"
                                        aria-label="Difficulty Level"
                                        title="Difficulty Level"
                                        value={difficultyLevel}
                                        onChange={(e) => setDifficultyLevel(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-background border border-foreground/10 text-foreground"
                                    >
                                        {DIFFICULTY_LEVELS.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* ===== EXPERIENCE ===== */}
                                <div className="space-y-1 pt-3 border-t border-foreground/10">
                                    <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                                        <Star className="w-4 h-4" /> Experience
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="experience-level">Experience Level</Label>
                                    <select
                                        id="experience-level"
                                        aria-label="Experience Level"
                                        title="Experience Level"
                                        value={experienceLevel}
                                        onChange={(e) => setExperienceLevel(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-background border border-foreground/10 text-foreground"
                                    >
                                        {EXPERIENCE_LEVELS.map(level => (
                                            <option key={level.value} value={level.value}>{level.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* ===== LIFESTYLE ===== */}
                                <div className="space-y-1 pt-3 border-t border-foreground/10">
                                    <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                                        <Droplets className="w-4 h-4" /> Lifestyle
                                    </h3>
                                </div>

                                {/* Water Intake */}
                                <div className="space-y-2">
                                    <Label htmlFor="water" className="flex items-center gap-2">
                                        <Droplets className="w-4 h-4 text-cyan-400" /> Water Intake (liters)
                                    </Label>
                                    <Input
                                        id="water"
                                        ref={waterRef}
                                        type="number"
                                        step="0.1"
                                        value={waterIntake}
                                        onChange={(e) => setWaterIntake(e.target.value)}
                                        onKeyDown={(e) => handleInputKeyDown(e, 8)}
                                        placeholder="2.0"
                                        min="0.5"
                                        max="6"
                                    />
                                </div>

                                {/* Workout Frequency */}
                                <div className="space-y-2">
                                    <Label htmlFor="freq" className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Workout Frequency (days/week)
                                    </Label>
                                    <Input
                                        id="freq"
                                        ref={freqRef}
                                        type="number"
                                        value={workoutFrequency}
                                        onChange={(e) => setWorkoutFrequency(e.target.value)}
                                        onKeyDown={(e) => handleInputKeyDown(e, 9)}
                                        placeholder="4"
                                        min="1"
                                        max="7"
                                    />
                                </div>

                                {/* ===== ML MODEL ===== */}
                                <div className="space-y-2 pt-4 border-t border-foreground/10">
                                    <Label htmlFor="ml-model">ML Model</Label>
                                    <select
                                        id="ml-model"
                                        aria-label="ML Model"
                                        title="ML Model"
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-background border border-foreground/10 text-foreground"
                                    >
                                        {MODEL_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Train Split */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="train-split">Training Data: {trainSplit}%</Label>
                                        <span className="text-xs text-muted-foreground">Default: 80%</span>
                                    </div>
                                    <input
                                        id="train-split"
                                        aria-label="Training Data Split"
                                        title="Training Data Split"
                                        type="range"
                                        min="50"
                                        max="90"
                                        value={trainSplit}
                                        onChange={(e) => setTrainSplit(parseInt(e.target.value))}
                                        className="w-full accent-primary"
                                    />
                                    {trainSplit !== 80 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={handleTrain}
                                            disabled={isTraining || selectedModel === 'ensemble'}
                                        >
                                            {isTraining ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Training...</>
                                            ) : (
                                                'Train with Custom Split'
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/20 text-destructive text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                {/* Predict Button */}
                                <Button
                                    className="w-full bg-gradient-to-r from-pink-500 to-amber-500 hover:opacity-90 text-white"
                                    onClick={handlePredict}
                                    disabled={!isFormValid || isLoading || isEvaluatingWithSarvam}
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Predicting...</>
                                    ) : isEvaluatingWithSarvam ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating with AI...</>
                                    ) : (
                                        <><Flame className="w-4 h-4 mr-2" /> Predict Calories (Advanced)</>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* History */}
                        <Card className="glass-card border-foreground/10 backdrop-blur-xl mt-4">
                            <CardHeader
                                className="cursor-pointer"
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <History className="w-5 h-5 text-pink-500" />
                                        Recent Advanced Predictions
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                                </CardTitle>
                            </CardHeader>
                            {showHistory && (
                                <CardContent className="space-y-2">
                                    {history.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No advanced predictions yet</p>
                                    ) : (
                                        history.map(item => (
                                            <div key={item.id} className="p-3 rounded-lg bg-foreground/5 flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{item.predicted_calories} kcal</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.model_type} • {new Date(item.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm text-muted-foreground">
                                                    <p>{item.workout_type} • {item.exercise_name}</p>
                                                    <p>{item.session_duration} min</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    </motion.div>

                    {/* Results Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-4"
                    >
                        {(isLoading || isEvaluatingWithSarvam) ? (
                            <Card className="glass-card border-foreground/10 backdrop-blur-xl h-full flex items-center justify-center min-h-[400px]">
                                <CardContent className="text-center py-16">
                                    {/* Violet Circular Loading Bar */}
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative w-24 h-24">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                {/* Background circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="none"
                                                    stroke="rgba(139, 92, 246, 0.2)"
                                                    strokeWidth="8"
                                                />
                                                {/* Animated progress circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="none"
                                                    stroke="url(#violetGradientAdv)"
                                                    strokeWidth="8"
                                                    strokeLinecap="round"
                                                    strokeDasharray="141.37 282.74"
                                                    className="advanced-spinner"
                                                    style={{
                                                        transformOrigin: '50px 50px',
                                                        animation: 'spin 2s linear infinite'
                                                    }}
                                                />
                                                <defs>
                                                    <linearGradient id="violetGradientAdv" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#a78bfa" />
                                                        <stop offset="50%" stopColor="#8b5cf6" />
                                                        <stop offset="100%" stopColor="#7c3aed" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">
                                                {isLoading ? 'Analyzing Workout' : 'Evaluating with AI...'}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {isLoading
                                                    ? 'Processing advanced fitness metrics with AI...'
                                                    : 'Generating advanced anomaly detection and personalized coaching insights...'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : prediction ? (
                            <>
                                {/* Main Prediction Card */}
                                <Card className="glass-card border-foreground/10 backdrop-blur-xl overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-amber-500/20 opacity-50" />
                                    <CardContent className="relative p-8 text-center">
                                        <h2 className="text-lg text-muted-foreground mb-2">Predicted Calories Burned</h2>
                                        <div className="text-7xl font-bold gradient-text mb-2">
                                            {prediction.predicted_calories}
                                        </div>
                                        <p className="text-xl text-muted-foreground mb-4">kcal</p>
                                        <div className="flex items-center justify-center gap-4 flex-wrap">
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/10">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                <span>Confidence: {(prediction.confidence_score * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="px-4 py-2 rounded-full bg-foreground/10">
                                                Model: {prediction.model_type}
                                            </div>
                                            <div className="px-4 py-2 rounded-full bg-pink-500/20 text-pink-300">
                                                <Dumbbell className="w-4 h-4 inline mr-1" />
                                                {prediction.derived_metrics.workout_type} • {prediction.derived_metrics.exercise_name}
                                            </div>
                                        </div>
                                        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                                            <Button
                                                variant="outline"
                                                className="hover:text-foreground"
                                                onClick={() => navigate('/insights')}
                                            >
                                                View AI Insights
                                            </Button>
                                            {prediction.ai_insights?.success && (
                                                <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Sarvam AI insights attached to this advanced prediction
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {/* BMI Card */}
                                    <Card className="glass-card border-foreground/10 backdrop-blur-xl">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Scale className="w-4 h-4 text-blue-500" />
                                                Body Mass Index
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">{prediction.derived_metrics.bmi}</div>
                                            <p className={`text-sm ${prediction.derived_metrics.bmi_category === 'Normal' ? 'text-green-500' :
                                                prediction.derived_metrics.bmi_category === 'Overweight' ? 'text-yellow-500' :
                                                    'text-red-500'
                                                }`}>
                                                {prediction.derived_metrics.bmi_category}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Fat: ~{prediction.derived_metrics.estimated_fat_percentage}% | Lean: {prediction.derived_metrics.lean_mass_kg}kg
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Heart Rate Zone */}
                                    <Card className="glass-card border-foreground/10 backdrop-blur-xl">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Heart className="w-4 h-4 text-red-500" />
                                                Heart Rate Zone
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">Zone {prediction.derived_metrics.hr_zone.zone}</div>
                                            <p className="text-sm text-primary">{prediction.derived_metrics.hr_zone.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {prediction.derived_metrics.hr_percentage}% max HR | HRR: {prediction.derived_metrics.pct_hrr}%
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Intensity Level */}
                                    <Card className="glass-card border-foreground/10 backdrop-blur-xl">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-yellow-500" />
                                                Workout Intensity
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`text-3xl font-bold ${prediction.derived_metrics.intensity_level === 'High' ? 'text-red-500' :
                                                prediction.derived_metrics.intensity_level === 'Moderate' ? 'text-yellow-500' :
                                                    'text-green-500'
                                                }`}>
                                                {prediction.derived_metrics.intensity_level}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Effort Score: {prediction.derived_metrics.effort_score}</p>
                                            <p className="text-xs text-muted-foreground">Volume: {prediction.derived_metrics.total_volume} reps</p>
                                        </CardContent>
                                    </Card>

                                    {/* Performance */}
                                    <Card className="glass-card border-foreground/10 backdrop-blur-xl">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-green-500" />
                                                Performance Metrics
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-sm"><span className="text-muted-foreground">Cal/min:</span> {prediction.derived_metrics.calories_per_minute}</p>
                                            <p className="text-sm"><span className="text-muted-foreground">Cal/hr:</span> {prediction.derived_metrics.calories_per_hour}</p>
                                            <p className="text-sm"><span className="text-muted-foreground">Load:</span> {prediction.derived_metrics.workout_load}</p>
                                        </CardContent>
                                    </Card>

                                    {/* Recovery & Hydration */}
                                    <Card className="glass-card border-foreground/10 backdrop-blur-xl">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-cyan-500" />
                                                Recovery & Hydration
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold text-cyan-400">{prediction.derived_metrics.recovery_score}%</div>
                                            <p className={`text-sm ${prediction.derived_metrics.hydration_status === 'Good' ? 'text-green-500' : 'text-yellow-500'}`}>
                                                Hydration: {prediction.derived_metrics.hydration_status}
                                            </p>
                                            {prediction.derived_metrics.overtraining_risk && (
                                                <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                                                    <AlertTriangle className="w-3 h-3" /> Overtraining Risk
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Fitness Assessment */}
                                    <Card className="glass-card border-foreground/10 backdrop-blur-xl">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Target className="w-4 h-4 text-purple-500" />
                                                Fitness Assessment
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`text-2xl font-bold ${prediction.derived_metrics.fitness_label === 'Advanced' ? 'text-green-500' :
                                                prediction.derived_metrics.fitness_label === 'Intermediate' ? 'text-blue-500' :
                                                    'text-yellow-500'
                                                }`}>
                                                {prediction.derived_metrics.fitness_label}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {prediction.derived_metrics.difficulty_level} difficulty
                                            </p>
                                            {prediction.derived_metrics.risk_flag && (
                                                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                                                    <AlertTriangle className="w-3 h-3" /> Risk Alert
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Demographics */}
                                    <Card className="glass-card border-foreground/10 backdrop-blur-xl">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <User className="w-4 h-4 text-cyan-500" />
                                                Demographics
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-1">
                                            <p className="text-sm"><span className="text-muted-foreground">Age Group:</span> {prediction.derived_metrics.age_group}</p>
                                            <p className="text-sm"><span className="text-muted-foreground">Height:</span> {prediction.derived_metrics.height_category}</p>
                                            <p className="text-sm"><span className="text-muted-foreground">Max HR:</span> {prediction.derived_metrics.max_heart_rate} bpm</p>
                                            <p className="text-sm"><span className="text-muted-foreground">HR Reserve:</span> {prediction.derived_metrics.heart_rate_reserve} bpm</p>
                                        </CardContent>
                                    </Card>
                                </div>



                                {/* Model Performance Section */}
                                {modelComparison && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="mt-6"
                                    >
                                        <Card className="glass-card border-foreground/10 backdrop-blur-xl">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <BarChart2 className="w-5 h-5 text-pink-500" />
                                                    Advanced Model Performance Metrics
                                                </CardTitle>
                                                <CardDescription>
                                                    Comprehensive ML model comparison with R² score, accuracy, and precision
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Key Metrics Summary */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Award className="w-5 h-5 text-green-500" />
                                                            <span className="text-sm text-muted-foreground">R² Score</span>
                                                        </div>
                                                        <div className="text-3xl font-bold text-green-400">
                                                            {prediction.model_performance?.r2_score?.toFixed(4) ||
                                                                modelComparison.models.reduce((max, m) => Math.max(max, m.r2_score), 0).toFixed(4)}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">Best in class accuracy</p>
                                                    </div>

                                                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Target className="w-5 h-5 text-blue-500" />
                                                            <span className="text-sm text-muted-foreground">MAE</span>
                                                        </div>
                                                        <div className="text-3xl font-bold text-blue-400">
                                                            ±{prediction.model_performance?.mae?.toFixed(2) ||
                                                                modelComparison.models.reduce((min, m) => Math.min(min, m.mae), 999).toFixed(2)}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">Calories error margin</p>
                                                    </div>

                                                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Crosshair className="w-5 h-5 text-purple-500" />
                                                            <span className="text-sm text-muted-foreground">Accuracy</span>
                                                        </div>
                                                        <div className="text-3xl font-bold text-purple-400">
                                                            {prediction.model_performance?.accuracy_percentage?.toFixed(1) ||
                                                                modelComparison.models.reduce((max, m) => Math.max(max, m.accuracy_percentage), 0).toFixed(1)}%
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">Within 5% tolerance</p>
                                                    </div>

                                                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <TrendingUp className="w-5 h-5 text-orange-500" />
                                                            <span className="text-sm text-muted-foreground">Precision</span>
                                                        </div>
                                                        <div className="text-3xl font-bold text-orange-400">
                                                            {((prediction.model_performance?.precision ||
                                                                modelComparison.models.reduce((max, m) => Math.max(max, m.precision), 0)) * 100).toFixed(1)}%
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">Prediction consistency</p>
                                                    </div>
                                                </div>

                                                {/* Model Comparison Charts */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* R² Score */}
                                                    <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                                                        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                                            <Award className="w-4 h-4 text-green-500" />
                                                            R² Score by Model
                                                        </h4>
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <BarChart data={modelComparison.metrics.r2_scores}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                                <XAxis dataKey="model" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                                                                <YAxis domain={['auto', 'auto']} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                                                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} cursor={false} formatter={(value: number) => [value.toFixed(4), 'R² Score']} />
                                                                <Bar dataKey="value" fill="url(#advGreenGradient)" radius={[4, 4, 0, 0]} />
                                                                <defs>
                                                                    <linearGradient id="advGreenGradient" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor="#22c55e" />
                                                                        <stop offset="100%" stopColor="#16a34a" />
                                                                    </linearGradient>
                                                                </defs>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>

                                                    {/* Accuracy */}
                                                    <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                                                        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                                            <Crosshair className="w-4 h-4 text-purple-500" />
                                                            Accuracy by Model (%)
                                                        </h4>
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <BarChart data={modelComparison.metrics.accuracy_values}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                                <XAxis dataKey="model" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                                                                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                                                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} cursor={false} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']} />
                                                                <Bar dataKey="value" fill="url(#advPurpleGradient)" radius={[4, 4, 0, 0]} />
                                                                <defs>
                                                                    <linearGradient id="advPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor="#a855f7" />
                                                                        <stop offset="100%" stopColor="#7c3aed" />
                                                                    </linearGradient>
                                                                </defs>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>

                                                    {/* Precision */}
                                                    <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                                                        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                                            <TrendingUp className="w-4 h-4 text-orange-500" />
                                                            Precision by Model (%)
                                                        </h4>
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <BarChart data={modelComparison.metrics.precision_values}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                                <XAxis dataKey="model" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                                                                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                                                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} cursor={false} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Precision']} />
                                                                <Bar dataKey="value" fill="url(#advOrangeGradient)" radius={[4, 4, 0, 0]} />
                                                                <defs>
                                                                    <linearGradient id="advOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor="#f97316" />
                                                                        <stop offset="100%" stopColor="#ea580c" />
                                                                    </linearGradient>
                                                                </defs>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>

                                                    {/* MAE */}
                                                    <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                                                        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                                            <Target className="w-4 h-4 text-blue-500" />
                                                            Mean Absolute Error (calories)
                                                        </h4>
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <BarChart data={modelComparison.metrics.mae_values}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                                <XAxis dataKey="model" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                                                                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                                                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} cursor={false} formatter={(value: number) => [`±${value.toFixed(2)} cal`, 'MAE']} />
                                                                <Bar dataKey="value" fill="url(#advBlueGradient)" radius={[4, 4, 0, 0]} />
                                                                <defs>
                                                                    <linearGradient id="advBlueGradient" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor="#3b82f6" />
                                                                        <stop offset="100%" stopColor="#2563eb" />
                                                                    </linearGradient>
                                                                </defs>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                {/* Model Details Table */}
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-foreground/10">
                                                                <th className="text-left p-3 text-muted-foreground">Model</th>
                                                                <th className="text-center p-3 text-muted-foreground">R² Score</th>
                                                                <th className="text-center p-3 text-muted-foreground">MAE</th>
                                                                <th className="text-center p-3 text-muted-foreground">RMSE</th>
                                                                <th className="text-center p-3 text-muted-foreground">Accuracy</th>
                                                                <th className="text-center p-3 text-muted-foreground">Precision</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {modelComparison.models.map((model, idx) => (
                                                                <tr
                                                                    key={model.id}
                                                                    className={`border-b border-foreground/5 ${idx === 0 ? 'bg-green-500/10' : ''}`}
                                                                >
                                                                    <td className="p-3 font-medium">{model.name}</td>
                                                                    <td className="text-center p-3 text-green-400">{model.r2_score.toFixed(4)}</td>
                                                                    <td className="text-center p-3 text-blue-400">±{model.mae.toFixed(2)}</td>
                                                                    <td className="text-center p-3 text-cyan-400">{model.rmse.toFixed(2)}</td>
                                                                    <td className="text-center p-3 text-purple-400">{model.accuracy_percentage.toFixed(1)}%</td>
                                                                    <td className="text-center p-3 text-orange-400">{(model.precision * 100).toFixed(1)}%</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </>
                        ) : (
                            /* Empty State */
                            <Card className="glass-card border-foreground/10 backdrop-blur-xl h-full flex items-center justify-center min-h-[400px]">
                                <CardContent className="text-center py-16">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-amber-500/20 flex items-center justify-center mx-auto mb-6">
                                        <Dumbbell className="w-10 h-10 text-pink-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Advanced Prediction Ready</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Enter your comprehensive workout parameters including personal details,
                                        fitness data, workout specifics, and lifestyle factors for an advanced
                                        calorie burn prediction with detailed metrics.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
