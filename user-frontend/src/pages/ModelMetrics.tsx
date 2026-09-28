import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
    BarChart2,
    Award,
    Crosshair,
    TrendingUp,
    Target,
    Loader2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

import api from '../services/api'

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

export default function ModelMetrics(): JSX.Element {
    const { token } = useAuth()
    const [modelComparison, setModelComparison] = useState<ModelComparisonData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (token) {
            fetchModelComparison()
        }
    }, [token])

    const fetchModelComparison = async () => {
        try {
            const response = await api.get('/calorie-predict/models/comparison')
            setModelComparison(response.data)
        } catch (err) {
            console.error('Failed to fetch model comparison:', err)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!modelComparison) {
        return (
            <div className="flex items-center justify-center h-screen text-muted-foreground">
                Failed to load model metrics.
            </div>
        )
    }

    const bestR2 = modelComparison.models.reduce((max, m) => Math.max(max, m.r2_score), 0)
    const bestMAE = modelComparison.models.reduce((min, m) => Math.min(min, m.mae), 999)
    const bestAccuracy = modelComparison.models.reduce((max, m) => Math.max(max, m.accuracy_percentage), 0)
    const bestPrecision = modelComparison.models.reduce((max, m) => Math.max(max, m.precision), 0)

    return (
        <div className="min-h-screen relative space-y-6 pb-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h1 className="text-4xl font-bold gradient-text mb-2">Model Performance Analytics</h1>
                <p className="text-muted-foreground">Deep dive into ML model accuracy, precision, and error metrics</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="glass-card border-white/10 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-primary" />
                            Comparative Analysis
                        </CardTitle>
                        <CardDescription>
                            Comparing performance across different machine learning algorithms
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Key Metrics Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="w-5 h-5 text-green-500" />
                                    <span className="text-sm text-muted-foreground">Best R² Score</span>
                                </div>
                                <div className="text-3xl font-bold text-green-400">
                                    {bestR2.toFixed(4)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Top performing model score</p>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm text-muted-foreground">Lowest MAE</span>
                                </div>
                                <div className="text-3xl font-bold text-blue-400">
                                    ±{bestMAE.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Min. calories error margin</p>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Crosshair className="w-5 h-5 text-purple-500" />
                                    <span className="text-sm text-muted-foreground">Best Accuracy</span>
                                </div>
                                <div className="text-3xl font-bold text-purple-400">
                                    {bestAccuracy.toFixed(1)}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Predictions within 5% range</p>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-5 h-5 text-orange-500" />
                                    <span className="text-sm text-muted-foreground">Best Precision</span>
                                </div>
                                <div className="text-3xl font-bold text-orange-400">
                                    {(bestPrecision * 100).toFixed(1)}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Highest consistency score</p>
                            </div>
                        </div>

                        {/* Model Comparison Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* R² Score Comparison */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-green-500" />
                                    R² Score by Model
                                </h4>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={modelComparison.metrics.r2_scores}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="model"
                                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                                            angle={-15}
                                            textAnchor="end"
                                            height={50}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                color: 'hsl(var(--foreground))'
                                            }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            cursor={false}
                                            formatter={(value: number) => [value.toFixed(4), 'R² Score']}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="url(#greenGradient)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <defs>
                                            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22c55e" />
                                                <stop offset="100%" stopColor="#16a34a" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Accuracy Comparison */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                    <Crosshair className="w-4 h-4 text-purple-500" />
                                    Accuracy by Model (%)
                                </h4>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={modelComparison.metrics.accuracy_values}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="model"
                                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                                            angle={-15}
                                            textAnchor="end"
                                            height={50}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                color: 'hsl(var(--foreground))'
                                            }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            cursor={false}
                                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="url(#purpleGradient)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <defs>
                                            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#a855f7" />
                                                <stop offset="100%" stopColor="#7c3aed" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Precision Comparison */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-orange-500" />
                                    Precision by Model (%)
                                </h4>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={modelComparison.metrics.precision_values}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="model"
                                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                                            angle={-15}
                                            textAnchor="end"
                                            height={50}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                color: 'hsl(var(--foreground))'
                                            }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            cursor={false}
                                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Precision']}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="url(#orangeGradient)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <defs>
                                            <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f97316" />
                                                <stop offset="100%" stopColor="#ea580c" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* MAE Comparison */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-blue-500" />
                                    Mean Absolute Error (calories)
                                </h4>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={modelComparison.metrics.mae_values}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="model"
                                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                                            angle={-15}
                                            textAnchor="end"
                                            height={50}
                                        />
                                        <YAxis
                                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                color: 'hsl(var(--foreground))'
                                            }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            cursor={false}
                                            formatter={(value: number) => [`±${value.toFixed(2)} cal`, 'MAE']}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="url(#blueGradient)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <defs>
                                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#2563eb" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Model Details Table */}
                        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 mt-8">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="text-left p-4 font-semibold text-muted-foreground">Model</th>
                                        <th className="text-center p-4 font-semibold text-muted-foreground">R² Score</th>
                                        <th className="text-center p-4 font-semibold text-muted-foreground">MAE</th>
                                        <th className="text-center p-4 font-semibold text-muted-foreground">RMSE</th>
                                        <th className="text-center p-4 font-semibold text-muted-foreground">Accuracy</th>
                                        <th className="text-center p-4 font-semibold text-muted-foreground">Precision</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modelComparison.models.map((model, idx) => (
                                        <tr
                                            key={model.id}
                                            className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx === 0 ? 'bg-green-500/5' : ''}`}
                                        >
                                            <td className="p-4 font-medium flex items-center gap-2">
                                                {idx === 0 && <Award className="w-3 h-3 text-green-500" />}
                                                {model.name}
                                            </td>
                                            <td className="text-center p-4 text-green-400 font-mono">{model.r2_score.toFixed(4)}</td>
                                            <td className="text-center p-4 text-blue-400 font-mono">±{model.mae.toFixed(2)}</td>
                                            <td className="text-center p-4 text-cyan-400 font-mono">{model.rmse.toFixed(2)}</td>
                                            <td className="text-center p-4 text-purple-400 font-mono">{model.accuracy_percentage.toFixed(1)}%</td>
                                            <td className="text-center p-4 text-orange-400 font-mono">{(model.precision * 100).toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
