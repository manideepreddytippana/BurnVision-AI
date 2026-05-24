import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { User, Scale, Ruler, Activity, Save, Check, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface ProfileData {
    name: string;
    email: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    fitness_level: string;
}

export default function Profile(): JSX.Element {
    const { user, updateProfile } = useAuth()
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState<ProfileData>({
        name: '',
        email: '',
        age: 0,
        gender: '',
        height: 0,
        weight: 0,
        fitness_level: ''
    })

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                age: user.age || 0,
                gender: user.gender || 'male',
                height: user.height || 170,
                weight: user.weight || 70,
                fitness_level: user.fitness_level || 'beginner'
            })
        }
    }, [user])

    const handleInputChange = (field: keyof ProfileData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setSaved(false)
        setError('')
    }

    const calculateBMI = (): number => {
        if (formData.height && formData.weight) {
            const heightM = formData.height / 100
            return formData.weight / (heightM * heightM)
        }
        return 0
    }

    const getBMICategory = (bmi: number): { label: string; color: string } => {
        if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' }
        if (bmi < 25) return { label: 'Normal', color: 'text-green-400' }
        if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400' }
        return { label: 'Obese', color: 'text-red-400' }
    }

    const handleSaveChanges = async () => {
        setLoading(true)
        setError('')

        try {
            // Call the API to update profile
            const response = await api.put('/profile', {
                name: formData.name,
                age: formData.age,
                gender: formData.gender,
                height: formData.height,
                weight: formData.weight,
                fitness_level: formData.fitness_level
            })

            // Update the auth context with new user data
            if (response.data.user) {
                updateProfile(response.data.user)
            }

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err: any) {
            console.error('Failed to update profile:', err)
            setError(err.response?.data?.message || 'Failed to save changes')
        } finally {
            setLoading(false)
        }
    }

    const bmi = calculateBMI()
    const bmiCategory = getBMICategory(bmi)

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <User className="w-8 h-8 text-primary" />
                    Profile Settings
                </h1>
                <p className="text-muted-foreground">Manage your personal information and fitness preferences</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="opacity-60"
                                    />
                                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        value={formData.age || ''}
                                        onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                                        placeholder="Your age"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={formData.gender} onValueChange={(v) => handleInputChange('gender', v)}>
                                        <SelectTrigger id="gender">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Physical Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="height" className="flex items-center gap-2">
                                        <Ruler className="w-4 h-4" />
                                        Height (cm)
                                    </Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        value={formData.height || ''}
                                        onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || 0)}
                                        placeholder="Height in cm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="weight" className="flex items-center gap-2">
                                        <Scale className="w-4 h-4" />
                                        Weight (kg)
                                    </Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        value={formData.weight || ''}
                                        onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                                        placeholder="Weight in kg"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fitness" className="flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Fitness Level
                                </Label>
                                <Select value={formData.fitness_level} onValueChange={(v) => handleInputChange('fitness_level', v)}>
                                    <SelectTrigger id="fitness">
                                        <SelectValue placeholder="Select fitness level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                        <SelectItem value="athlete">Athlete</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {error && (
                                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}

                            <Button
                                variant="gradient"
                                className="w-full gap-2"
                                onClick={handleSaveChanges}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : saved ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Changes Saved!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>BMI Calculator</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" stroke="hsl(var(--secondary))" strokeWidth="8" fill="none" />
                                    <circle
                                        cx="50" cy="50" r="40"
                                        stroke="url(#bmiGradient)"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={`${Math.min(bmi * 5, 251)} 251`}
                                    />
                                    <defs>
                                        <linearGradient id="bmiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="hsl(var(--primary))" />
                                            <stop offset="100%" stopColor="hsl(var(--accent))" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold">{bmi.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">BMI</span>
                                </div>
                            </div>
                            <Badge className={`mt-4 ${bmiCategory.color === 'text-green-400' ? 'bg-green-500/20' : bmiCategory.color === 'text-yellow-400' ? 'bg-yellow-500/20' : bmiCategory.color === 'text-blue-400' ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                                <span className={bmiCategory.color}>{bmiCategory.label}</span>
                            </Badge>
                            <div className="mt-4 text-sm text-muted-foreground space-y-1 w-full">
                                <div className="flex justify-between"><span>Underweight:</span><span>&lt; 18.5</span></div>
                                <div className="flex justify-between"><span>Normal:</span><span>18.5 - 24.9</span></div>
                                <div className="flex justify-between"><span>Overweight:</span><span>25 - 29.9</span></div>
                                <div className="flex justify-between"><span>Obese:</span><span>&gt;= 30</span></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                                <span className="text-muted-foreground">Height</span>
                                <span className="font-bold">{formData.height} cm</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                                <span className="text-muted-foreground">Weight</span>
                                <span className="font-bold">{formData.weight} kg</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                                <span className="text-muted-foreground">Fitness Level</span>
                                <Badge variant="outline" className="capitalize">{formData.fitness_level}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
