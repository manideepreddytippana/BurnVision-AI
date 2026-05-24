import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
    AlertTriangle,
    BarChart3,
    Brain,
    CheckCircle2,
    Droplets,
    Flame,
    Info,
    Lightbulb,
    Loader2,
    RefreshCw,
    Sparkles,
    TrendingUp,
    Utensils,
} from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import AIInsightCard from '../components/AIInsightCard'
import api from '../services/api'

interface DerivedMetrics {
    bmi?: number;
    bmi_category?: string;
    max_heart_rate?: number;
    heart_rate_percentage?: number;
    heart_rate_zone?: string;
    intensity_level?: string;
    effort_score?: number;
    temperature_category?: string;
    heat_stress?: boolean;
    hr_per_minute?: number;
    calories_per_minute?: number;
    workout_load?: number;
    age_group?: string;
    height_category?: string;
    fitness_level?: string;
    risk_flag?: boolean;
    workout_type_predicted?: string;
}

interface PredictionData {
    id: number;
    created_at: string;
    predicted_calories: number;
    model_type: string;
    confidence_score?: number;
    duration?: number;
    session_duration?: number;
    heart_rate?: number;
    avg_heart_rate?: number;
    body_temp?: number;
    age: number;
    weight: number;
    height: number;
    gender: string;
    workout_type?: string;
    exercise_name?: string;
    derived_metrics?: DerivedMetrics;
    recommendation?: string | null;
    prediction_type?: 'standard' | 'advanced';
}

interface ShapData {
    feature: string;
    value: number;
    positive: boolean;
}

interface PredictionExplanation {
    id: number;
    date: string;
    predicted: number;
    confidence: number;
    explanation: string;
    factors: string[];
    modelType: string;
    suggestions: string[];
    aiInsights: SarvamInsightPayload | null;
}

interface MainPredictionData {
    prediction_id: number;
    prediction_type?: 'standard' | 'advanced';
    predicted_calories: number;
    confidence_score?: number;
    model_type: string;
    gender: string;
    age: number;
    height: number;
    weight: number;
    duration: number;
    heart_rate: number;
    body_temp: number | null;
    workout_type?: string;
    exercise_name?: string;
    derived_metrics?: DerivedMetrics;
    created_at?: string | null;
}

interface SarvamPredictionInsightRow {
    id: number;
    prediction_id: number;
    user_id: number;
    prediction_type: 'standard' | 'advanced';
    main_prediction_data: MainPredictionData;
    ai_insights: SarvamInsightPayload | null;
    created_at?: string;
    updated_at?: string;
}

interface SarvamStructuredInsights {
    workout_anomalies: string[];
    behavioral_anomalies: string[];
    overtraining_detection: string[];
    nutrition_recommendations: string[];
    hydration_tracking: string[];
    progress_tracking: string[];
    smart_recommendation_engine: string[];
    personalization_factor: string;
}

interface SarvamInsightPayload {
    provider: string;
    model: string;
    generated_at?: string;
    success: boolean;
    structured: SarvamStructuredInsights;
    raw_text?: string;
    error?: string | null;
}

const EMPTY_STRUCTURED_INSIGHTS: SarvamStructuredInsights = {
    workout_anomalies: [],
    behavioral_anomalies: [],
    overtraining_detection: [],
    nutrition_recommendations: [],
    hydration_tracking: [],
    progress_tracking: [],
    smart_recommendation_engine: [],
    personalization_factor: 'No personalization signals were detected yet.',
}

const toStringList = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return []
    }
    return value
        .map((entry) => String(entry).trim())
        .filter((entry) => entry.length > 0)
}

const parseSarvamRecommendation = (recommendation: unknown): SarvamInsightPayload | null => {
    if (!recommendation) {
        return null
    }

    let parsed: any = recommendation
    if (typeof recommendation === 'string') {
        try {
            parsed = JSON.parse(recommendation)
        } catch {
            return null
        }
    }

    if (!parsed || typeof parsed !== 'object') {
        return null
    }

    const structuredRaw = parsed.structured && typeof parsed.structured === 'object' ? parsed.structured : {}
    const structured: SarvamStructuredInsights = {
        workout_anomalies: toStringList(structuredRaw.workout_anomalies),
        behavioral_anomalies: toStringList(structuredRaw.behavioral_anomalies),
        overtraining_detection: toStringList(structuredRaw.overtraining_detection),
        nutrition_recommendations: toStringList(structuredRaw.nutrition_recommendations),
        hydration_tracking: toStringList(structuredRaw.hydration_tracking),
        progress_tracking: toStringList(structuredRaw.progress_tracking),
        smart_recommendation_engine: toStringList(structuredRaw.smart_recommendation_engine),
        personalization_factor: String(structuredRaw.personalization_factor || EMPTY_STRUCTURED_INSIGHTS.personalization_factor),
    }

    return {
        provider: String(parsed.provider || 'sarvam-ai'),
        model: String(parsed.model || 'sarvam-m'),
        generated_at: parsed.generated_at ? String(parsed.generated_at) : undefined,
        success: Boolean(parsed.success),
        structured,
        raw_text: parsed.raw_text ? String(parsed.raw_text) : undefined,
        error: parsed.error ? String(parsed.error) : null,
    }
}

const buildSarvamSessionSummary = (aiInsights: SarvamInsightPayload | null): string[] => {
    if (!aiInsights || !aiInsights.success) {
        return []
    }

    const structured = aiInsights.structured
    const riskSignal =
        structured.workout_anomalies[0] ||
        structured.behavioral_anomalies[0] ||
        'No major anomaly signal detected in this session.'

    const recoverySignal =
        structured.overtraining_detection[0] ||
        structured.hydration_tracking[0] ||
        structured.nutrition_recommendations[0] ||
        'Recovery signal is stable; maintain hydration and sleep quality.'

    const actionSignal =
        structured.smart_recommendation_engine[0] ||
        structured.progress_tracking[0] ||
        (structured.personalization_factor && structured.personalization_factor !== EMPTY_STRUCTURED_INSIGHTS.personalization_factor
            ? structured.personalization_factor
            : 'Continue current plan with small weekly progression in duration or intensity.')

    return [
        `Risk: ${riskSignal}`,
        `Recovery: ${recoverySignal}`,
        `Action Plan: ${actionSignal}`,
    ]
}

export default function Insights(): JSX.Element {
    const [activeTab, setActiveTab] = useState('sarvam')
    const [predictions, setPredictions] = useState<PredictionExplanation[]>([])
    const [shapData, setShapData] = useState<ShapData[]>([])
    const [sarvamInsightRows, setSarvamInsightRows] = useState<SarvamPredictionInsightRow[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchPredictions()
    }, [])

    const fetchPredictions = async () => {
        try {
            const [basicResponse, advancedResponse, standardSarvamResponse, advancedSarvamResponse] = await Promise.all([
                api.get('/calorie-predict/history?per_page=100'),
                api.get('/advanced-calorie-predict/history?per_page=100'),
                api.get('/ai/prediction-insights?per_page=100'),
                api.get('/ai/advanced-prediction-insights?per_page=100'),
            ])

            const basicPredictions: PredictionData[] = (basicResponse.data.predictions || []).map((pred: PredictionData) => ({
                ...pred,
                prediction_type: 'standard',
            }))

            const advancedPredictions: PredictionData[] = (advancedResponse.data.predictions || []).map((pred: PredictionData) => ({
                ...pred,
                prediction_type: 'advanced',
            }))

            const predictionData: PredictionData[] = [...basicPredictions, ...advancedPredictions]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            const standardSarvamData: any[] = standardSarvamResponse.data.insights || []
            const advancedSarvamData: any[] = advancedSarvamResponse.data.insights || []

            const normalizedSarvamRows: SarvamPredictionInsightRow[] = [...standardSarvamData, ...advancedSarvamData]
                .map((row) => {
                    const predictionType: 'standard' | 'advanced' =
                        row.prediction_type || row.main_prediction_data?.prediction_type || 'standard'

                    return {
                        id: Number(row.id),
                        prediction_id: Number(row.prediction_id),
                        user_id: Number(row.user_id),
                        prediction_type: predictionType,
                        main_prediction_data: row.main_prediction_data as MainPredictionData,
                        ai_insights: parseSarvamRecommendation(row.ai_insights),
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                    }
                })
                .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

            const insightByPredictionKey = new Map<string, SarvamInsightPayload | null>(
                normalizedSarvamRows.map((row) => [`${row.prediction_type}:${row.prediction_id}`, row.ai_insights])
            )

            setSarvamInsightRows(normalizedSarvamRows)

            // Transform predictions to explanations
            const explanations: PredictionExplanation[] = predictionData.map((pred) => {
                const metrics = pred.derived_metrics || {}
                const predictionType = pred.prediction_type || 'standard'
                const parsedInsight =
                    insightByPredictionKey.get(`${predictionType}:${pred.id}`) ??
                    parseSarvamRecommendation(pred.recommendation)
                const workoutDuration = pred.duration ?? pred.session_duration ?? 0
                const activeHeartRate = pred.heart_rate ?? pred.avg_heart_rate ?? 0

                // Build explanation based on actual data
                let explanation = ''
                const factors: string[] = []

                // Intensity-based explanation
                if (metrics.intensity_level) {
                    explanation += `${metrics.intensity_level} intensity workout. `
                    factors.push(metrics.intensity_level + ' Intensity')
                }

                // Heart rate zone
                if (metrics.heart_rate_zone) {
                    explanation += `Heart rate in ${metrics.heart_rate_zone} zone. `
                    factors.push(metrics.heart_rate_zone + ' HR Zone')
                }

                // Workout type
                if (metrics.workout_type_predicted) {
                    factors.push(metrics.workout_type_predicted)
                }

                if (pred.workout_type) {
                    factors.push(pred.workout_type)
                }

                if (pred.exercise_name) {
                    factors.push(pred.exercise_name)
                }

                // Fitness level
                if (metrics.fitness_level) {
                    factors.push(metrics.fitness_level + ' Fitness')
                }

                // BMI category
                if (metrics.bmi_category) {
                    factors.push('BMI: ' + metrics.bmi_category)
                }

                // Duration factor
                if (workoutDuration >= 30) {
                    factors.push('Extended Duration')
                } else if (workoutDuration >= 15) {
                    factors.push('Moderate Duration')
                }

                // Heat stress
                if (metrics.heat_stress) {
                    factors.push('Heat Stress Active')
                }

                // Effort score
                if (metrics.effort_score) {
                    explanation += `Effort score: ${metrics.effort_score.toFixed(1)}. `
                }

                // Calories per minute
                if (metrics.calories_per_minute) {
                    explanation += `Burning ${metrics.calories_per_minute.toFixed(1)} cal/min. `
                }

                if (!explanation) {
                    explanation = `Predicted calorie burn based on ${workoutDuration} min duration at ${activeHeartRate} BPM heart rate.`
                }

                // Generate per-session suggestions primarily from Sarvam insights
                const sarvamSummary = buildSarvamSessionSummary(parsedInsight)
                const suggestions: string[] = [...sarvamSummary]

                // Fallback heuristics if Sarvam summary is unavailable for this prediction
                if (suggestions.length === 0) {
                    const maxHR = 220 - pred.age
                    const hrPercentage = activeHeartRate > 0 ? (activeHeartRate / maxHR) * 100 : 0

                    if (hrPercentage < 60) {
                        suggestions.push('Increase intensity gradually to enter productive cardio zones.')
                    } else if (hrPercentage > 90) {
                        suggestions.push('Peak heart-rate zone detected; shorten high-intensity intervals and recover longer.')
                    }

                    const caloriesPerMin = metrics.calories_per_minute || (workoutDuration > 0 ? pred.predicted_calories / workoutDuration : 0)
                    if (caloriesPerMin < 5) {
                        suggestions.push(`Low burn rate (${caloriesPerMin.toFixed(1)} cal/min). Extend duration or add intervals.`)
                    } else if (caloriesPerMin >= 10) {
                        suggestions.push(`High burn rate (${caloriesPerMin.toFixed(1)} cal/min). Prioritize hydration and recovery.`)
                    }
                }

                return {
                    id: pred.id,
                    date: new Date(pred.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }),
                    predicted: Math.round(pred.predicted_calories),
                    confidence: pred.confidence_score || 0.85,
                    explanation: explanation.trim(),
                    factors: factors.slice(0, 5), // Limit to 5 factors
                    modelType: `${pred.model_type}${predictionType === 'advanced' ? ' (Advanced)' : ''}`,
                    suggestions: suggestions.slice(0, 3), // Fixed 3-line summary per prediction
                    aiInsights: parsedInsight,
                }
            })

            setPredictions(explanations)

            // Calculate feature impact from real data
            if (predictionData.length > 0) {
                calculateFeatureImpact(predictionData)
            }
        } catch (error) {
            console.error('Failed to fetch predictions:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateFeatureImpact = (predictionData: PredictionData[]) => {
        if (predictionData.length === 0) {
            setShapData([])
            return
        }

        // Calculate average values and their correlation with predicted calories
        const avgCalories = predictionData.reduce((sum, p) => sum + p.predicted_calories, 0) / predictionData.length

        // Calculate feature impacts based on actual data patterns
        const featureImpacts: ShapData[] = []

        // Heart Rate Impact
        const avgHeartRate = predictionData.reduce((sum, p) => sum + (p.heart_rate || 0), 0) / predictionData.length
        const hrImpact = ((avgHeartRate - 100) / 100) * 50 // Normalize
        featureImpacts.push({
            feature: 'Heart Rate',
            value: Math.round(Math.abs(hrImpact)),
            positive: hrImpact > 0
        })

        // Duration Impact
        const avgDuration = predictionData.reduce((sum, p) => sum + (p.duration || p.session_duration || 0), 0) / predictionData.length
        const durationImpact = (avgDuration / 30) * 40
        featureImpacts.push({
            feature: 'Duration',
            value: Math.round(Math.abs(durationImpact)),
            positive: true
        })

        // Body Weight Impact
        const avgWeight = predictionData.reduce((sum, p) => sum + p.weight, 0) / predictionData.length
        const weightImpact = ((avgWeight - 70) / 70) * 25
        featureImpacts.push({
            feature: 'Body Weight',
            value: Math.round(Math.abs(weightImpact)),
            positive: weightImpact > 0
        })

        // Age Impact (older = slightly less calories typically)
        const avgAge = predictionData.reduce((sum, p) => sum + p.age, 0) / predictionData.length
        const ageImpact = ((35 - avgAge) / 35) * 15
        featureImpacts.push({
            feature: 'Age',
            value: Math.round(Math.abs(ageImpact)),
            positive: ageImpact > 0
        })

        // Body Temperature Impact
        const avgTemp = predictionData.reduce((sum, p) => sum + (p.body_temp || 0), 0) / predictionData.length
        const tempImpact = ((avgTemp - 37) / 3) * 20
        featureImpacts.push({
            feature: 'Body Temperature',
            value: Math.round(Math.abs(tempImpact)),
            positive: tempImpact > 0
        })

        // Height Impact
        const avgHeight = predictionData.reduce((sum, p) => sum + p.height, 0) / predictionData.length
        const heightImpact = ((avgHeight - 170) / 170) * 15
        featureImpacts.push({
            feature: 'Height',
            value: Math.round(Math.abs(heightImpact)),
            positive: heightImpact > 0
        })

        // Effort Score (from derived metrics)
        const avgEffort = predictionData
            .filter(p => p.derived_metrics?.effort_score)
            .reduce((sum, p) => sum + (p.derived_metrics?.effort_score || 0), 0) /
            predictionData.filter(p => p.derived_metrics?.effort_score).length || 50
        featureImpacts.push({
            feature: 'Effort Score',
            value: Math.round((avgEffort / 100) * 35),
            positive: true
        })

        // Sort by absolute value
        featureImpacts.sort((a, b) => b.value - a.value)

        setShapData(featureImpacts)
    }

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
                        <Lightbulb className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                        AI Insights
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mt-1 md:mt-0">Understand how our AI makes predictions based on your data</p>
                </div>
                <Button
                    variant="outline"
                    onClick={async () => {
                        setRefreshing(true)
                        const startTime = Date.now()
                        await fetchPredictions()
                        const elapsed = Date.now() - startTime
                        if (elapsed < 2000) {
                            await new Promise(resolve => setTimeout(resolve, 2000 - elapsed))
                        }
                        setRefreshing(false)
                    }}
                    disabled={refreshing}
                    className="gap-2 group hover:text-black w-full md:w-auto"
                >
                    {refreshing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    ) : (
                        <RefreshCw className="w-4 h-4 group-hover:text-black" />
                    )}
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                    <TabsTrigger value="sarvam" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Insights
                    </TabsTrigger>
                    <TabsTrigger value="explanations" className="gap-2">
                        <Info className="w-4 h-4" />
                        Suggestions
                    </TabsTrigger>
                    <TabsTrigger value="shap" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Feature Impact
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sarvam" className="mt-6 space-y-4">
                    {sarvamInsightRows.length === 0 ? (
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>No Sarvam insights available yet</CardTitle>
                                <CardDescription>
                                    Make a new calorie prediction to generate Sarvam AI anomaly detection and coaching insights.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        sarvamInsightRows.map((row, index) => {
                            const aiInsights = row.ai_insights
                            const main = row.main_prediction_data
                            const displayDate = main.created_at || row.created_at

                            return (
                                <motion.div
                                    key={`${row.prediction_type}-${row.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="space-y-4"
                                >
                                    <Card className="glass-card border-white/10 backdrop-blur-xl overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-50" />
                                        <CardContent className="relative p-6 sm:p-8 text-center">
                                            <h2 className="text-lg text-muted-foreground mb-2">Predicted Calories Burned</h2>
                                            <div className="text-5xl sm:text-6xl font-bold gradient-text mb-2">
                                                {Math.round(main.predicted_calories || 0)}
                                            </div>
                                            <p className="text-lg text-muted-foreground mb-4">kcal</p>
                                            <div className="flex flex-wrap items-center justify-center gap-3">
                                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    <span>Confidence: {((main.confidence_score || 0) * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="px-4 py-2 rounded-full bg-white/10">
                                                    Model: {main.model_type}
                                                </div>
                                                <div className="px-4 py-2 rounded-full bg-white/10 text-sm">
                                                    Type: {(row.prediction_type || main.prediction_type || 'standard').toUpperCase()}
                                                </div>
                                                {displayDate && (
                                                    <div className="px-4 py-2 rounded-full bg-white/10 text-sm text-muted-foreground">
                                                        {new Date(displayDate).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {!aiInsights ? (
                                        <Card className="glass-card">
                                            <CardContent className="p-4 text-sm text-destructive flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                This prediction does not contain a valid persisted Sarvam insight payload.
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <>
                                            <Card className="glass-card">
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Sparkles className="w-5 h-5 text-primary" />
                                                        AI Fitness Coach
                                                    </CardTitle>
                                                    <CardDescription className="flex flex-wrap gap-3 items-center">
                                                        <span>Personalized Explanations</span>                                                        {aiInsights.generated_at && (
                                                            <span>
                                                                Generated: {new Date(aiInsights.generated_at).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    {aiInsights.success ? (
                                                        <div className="flex items-center gap-2 text-emerald-500 text-sm">
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-destructive text-sm">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            {aiInsights.error || 'Sarvam AI returned a fallback response.'}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <AIInsightCard
                                                    title="Workout Anomalies"
                                                    icon={AlertTriangle}
                                                    items={aiInsights.structured.workout_anomalies}
                                                    accentClass="text-rose-400"
                                                />
                                                <AIInsightCard
                                                    title="Behavioral Anomalies"
                                                    icon={Brain}
                                                    items={aiInsights.structured.behavioral_anomalies}
                                                    accentClass="text-amber-400"
                                                />
                                                <AIInsightCard
                                                    title="Overtraining Detection"
                                                    icon={Flame}
                                                    items={aiInsights.structured.overtraining_detection}
                                                    accentClass="text-orange-400"
                                                />
                                                <AIInsightCard
                                                    title="Nutrition Recommendations"
                                                    icon={Utensils}
                                                    items={aiInsights.structured.nutrition_recommendations}
                                                    accentClass="text-lime-400"
                                                />
                                                <AIInsightCard
                                                    title="Hydration Tracking"
                                                    icon={Droplets}
                                                    items={aiInsights.structured.hydration_tracking}
                                                    accentClass="text-cyan-400"
                                                />
                                                <AIInsightCard
                                                    title="Progress Tracking"
                                                    icon={TrendingUp}
                                                    items={aiInsights.structured.progress_tracking}
                                                    accentClass="text-emerald-400"
                                                />
                                                <AIInsightCard
                                                    title="Smart Recommendation Engine"
                                                    icon={Sparkles}
                                                    items={aiInsights.structured.smart_recommendation_engine}
                                                    accentClass="text-violet-400"
                                                />
                                                <Card className="glass-card border-white/10 backdrop-blur-xl h-full">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            <Lightbulb className="w-4 h-4 text-primary" />
                                                            Personalization Factor
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            {aiInsights.structured.personalization_factor || EMPTY_STRUCTURED_INSIGHTS.personalization_factor}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )
                        })
                    )}
                </TabsContent>

                <TabsContent value="shap" className="mt-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Feature Impact (Based on Your Predictions)</CardTitle>
                            <CardDescription>Shows how each feature contributes to your calorie predictions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {shapData.length > 0 ? (
                                <>
                                    <div className="h-64 md:h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={shapData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                                                <YAxis dataKey="feature" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '8px',
                                                        color: 'white'
                                                    }}
                                                    labelStyle={{ color: 'white' }}
                                                    itemStyle={{ color: 'white' }}
                                                    cursor={{ fill: 'transparent' }}
                                                />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                    {shapData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.positive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
                                        <h4 className="font-medium mb-2">Understanding Feature Impact</h4>
                                        <p className="text-sm text-muted-foreground">
                                            This chart shows how each factor in your predictions affects the calorie estimate.
                                            <span className="text-primary"> Purple bars</span> indicate factors that increase calorie burn,
                                            while <span className="text-destructive">red bars</span> decrease it. Taller bars have stronger impact.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No prediction data available</p>
                                    <p className="text-sm">Make some calorie predictions to see feature impact analysis!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="explanations" className="mt-6 space-y-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Your Prediction Explanations</CardTitle>
                            <CardDescription>Detailed breakdowns of your recent calorie predictions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {predictions.length > 0 ? (
                                predictions.map((pred, index) => (
                                    <motion.div
                                        key={pred.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-4 rounded-lg border border-border bg-secondary/30"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">{pred.date}</p>
                                                <div className="flex items-baseline gap-2 mt-1">
                                                    <span className="text-2xl font-bold gradient-text">{pred.predicted}</span>
                                                    <span className="text-muted-foreground">kcal predicted</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">Model: {pred.modelType}</p>
                                            </div>
                                            <Badge variant={pred.confidence > 0.9 ? 'success' : pred.confidence > 0.8 ? 'info' : 'warning'}>
                                                {(pred.confidence * 100).toFixed(0)}% confidence
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{pred.explanation}</p>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {pred.factors.map((factor, i) => (
                                                <Badge key={i} variant="outline">{factor}</Badge>
                                            ))}
                                        </div>

                                        {/* Improvement Suggestions */}
                                        {pred.suggestions.length > 0 && (
                                            <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-medium text-primary">Suggestions to Improve</span>
                                                </div>
                                                <ul className="space-y-1">
                                                    {pred.suggestions.map((suggestion, i) => (
                                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                            <span>{suggestion}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No predictions yet</p>
                                    <p className="text-sm">Make calorie predictions to see detailed explanations here!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
