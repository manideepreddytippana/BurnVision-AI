import { useState, FormEvent, ChangeEvent, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Mail,
    Lock,
    User,
    Calendar,
    Ruler,
    Scale,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    Check,
    Sparkles,
    Flame,
    Award,
    ChevronDown,
    HelpCircle
} from 'lucide-react'
import type { RegisterData } from '../types'

export default function Register(): JSX.Element {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
    const [formData, setFormData] = useState<RegisterData>({
        email: '',
        password: '',
        name: '',
        age: undefined,
        gender: undefined,
        height: undefined,
        weight: undefined,
        fitness_level: 'beginner'
    })
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [step1Errors, setStep1Errors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({})

    const { register } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value
        }))
        // Clear error as user types
        if (step1Errors[name as keyof typeof step1Errors]) {
            setStep1Errors(prev => ({ ...prev, [name]: undefined }))
        }
        if (error) setError('')
    }

    // Password strength computation (0 - 4)
    const passwordStrength = useMemo(() => {
        const p = formData.password || ''
        if (!p) return 0
        let score = 0
        if (p.length >= 6) score += 1
        if (p.length >= 10) score += 1
        if (/[0-9]|[^A-Za-z0-9]/.test(p)) score += 1
        if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1
        return score
    }, [formData.password])

    const strengthLabel = useMemo(() => {
        switch (passwordStrength) {
            case 1: return { text: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400' }
            case 2: return { text: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' }
            case 3: return { text: 'Good', color: 'bg-indigo-500', textColor: 'text-indigo-600 dark:text-indigo-400' }
            case 4: return { text: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' }
            default: return { text: 'Too short', color: 'bg-slate-200 dark:bg-slate-700', textColor: 'text-slate-400' }
        }
    }, [passwordStrength])

    // Validate Step 1 before proceeding
    const handleNextStep1 = () => {
        const errors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {}
        if (!formData.name.trim()) {
            errors.name = 'Please enter your full name'
        }
        if (!formData.email.trim()) {
            errors.email = 'Please enter your email'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address'
        }
        if (!formData.password) {
            errors.password = 'Password is required'
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters'
        }
        if (formData.password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match'
        }

        if (Object.keys(errors).length > 0) {
            setStep1Errors(errors)
            return
        }

        setStep1Errors({})
        setError('')
        setCurrentStep(2)
    }

    // Step 2 Proceed to Step 3
    const handleNextStep2 = () => {
        setError('')
        setCurrentStep(3)
    }

    // Final Submission on Step 3
    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()
        setError('')

        if (formData.password !== confirmPassword) {
            setError('Passwords do not match')
            setCurrentStep(1)
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            setCurrentStep(1)
            return
        }

        setLoading(true)
        const result = await register(formData)

        if (result.success) {
            navigate('/dashboard')
        } else {
            setError(result.error || 'Registration failed. Please check your details.')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 pt-24 sm:pt-28 pb-12 bg-[#f8fafc] dark:bg-[#07080e] selection:bg-purple-500 selection:text-white font-sans relative overflow-x-hidden transition-colors duration-300">
            {/* Ambient Blurred Glow Orbs */}
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-400/10 dark:bg-purple-500/15 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-400/10 dark:bg-cyan-500/15 blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-indigo-400/5 dark:bg-indigo-500/10 blur-[140px] pointer-events-none" />

            {/* Subtle Geometric Dot Grid Overlay */}
            <div 
                className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, #000000 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Top Bar: Brand Logo at TOP LEFT of Registration Page, Utilities at Top-Right */}
            <header className="absolute top-0 left-0 right-0 px-2.5 sm:px-4 py-4 sm:py-5 flex items-center justify-between z-20">
                <Link to="/" className="inline-flex items-center gap-2.5 group">
                    <img
                        src="/grey_logo.png"
                        alt="BurnVision"
                        className="h-8 sm:h-9 w-auto object-contain block dark:hidden transition-transform duration-200 group-hover:scale-105"
                    />
                    <img
                        src="/light_logo.png"
                        alt="BurnVision"
                        className="h-8 sm:h-9 w-auto object-contain hidden dark:block transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540] dark:text-white font-heading">
                        BurnVision
                    </span>
                </Link>

                <div className="flex items-center gap-3.5">
                    <ThemeToggle />
                </div>
            </header>

            {/* Centered 540px Form Card (18px radius, soft layered shadow, 40px padding) */}
            <div className="w-full max-w-[540px] bg-white dark:bg-[#111320] rounded-[18px] p-6 sm:p-10 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(15,23,42,0.04)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-white/[0.08] relative z-10 transition-all my-auto translate-y-3 sm:translate-y-6 mb-8">
                    
                    {/* Card Header: Step label & Progress Bar */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#0a2540] dark:text-white mb-2">
                            <span>Step {currentStep} of 3</span>
                            <span className="text-slate-400 dark:text-slate-500 font-medium normal-case tracking-normal">
                                {currentStep === 1 && 'Account details'}
                                {currentStep === 2 && 'Body measurements'}
                                {currentStep === 3 && 'Fitness experience'}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#0a2540] dark:bg-white rounded-full"
                                initial={false}
                                animate={{
                                    width: currentStep === 1 ? '33.33%' : currentStep === 2 ? '66.66%' : '100%'
                                }}
                                transition={{ duration: 0.35, ease: 'easeInOut' }}
                            />
                        </div>
                    </div>

                    {/* Form Heading: 'Create Account' in Dark Navy (#0a2540) */}
                    <div className="mb-6">
                        <h2 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight text-[#0a2540] dark:text-white leading-tight font-heading">
                            Create Account
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {currentStep === 1 && 'Enter your credentials to secure your BurnVision account.'}
                            {currentStep === 2 && 'Calibrate your physical metrics for accurate calorie predictions.'}
                            {currentStep === 3 && 'Choose your baseline level so our AI tailors workouts to you.'}
                        </p>
                    </div>

                    {/* Backend / Global Error Banner */}
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3.5 mb-5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2.5"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {/* Step Form Container */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {/* ========================================================
                                STEP 1: ACCOUNT (Name, Email, Password, Confirm Password)
                               ======================================================== */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.22 }}
                                    className="space-y-4"
                                >
                                    {/* Full Name */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                required
                                                placeholder="Ram"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className={`w-full h-[50px] rounded-[12px] border ${
                                                    step1Errors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'
                                                } bg-white dark:bg-[#161928] text-slate-900 dark:text-white pl-11 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                                            />
                                        </div>
                                        {step1Errors.name && (
                                            <p className="text-xs text-rose-500 mt-1">{step1Errors.name}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="burnvision@gmail.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full h-[50px] rounded-[12px] border ${
                                                    step1Errors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'
                                                } bg-white dark:bg-[#161928] text-slate-900 dark:text-white pl-11 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                                            />
                                        </div>
                                        {step1Errors.email && (
                                            <p className="text-xs text-rose-500 mt-1">{step1Errors.email}</p>
                                        )}
                                    </div>

                                    {/* Password + Strength Meter */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                Password
                                            </label>
                                            {formData.password && (
                                                <span className={`text-xs font-semibold ${strengthLabel.textColor}`}>
                                                    {strengthLabel.text}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                placeholder="At least 6 characters"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className={`w-full h-[50px] rounded-[12px] border ${
                                                    step1Errors.password ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'
                                                } bg-white dark:bg-[#161928] text-slate-900 dark:text-white pl-11 pr-11 text-sm placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {/* Password Strength Meter Bar */}
                                        {formData.password && (
                                            <div className="pt-1 space-y-1">
                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {[1, 2, 3, 4].map(idx => (
                                                        <div
                                                            key={idx}
                                                            className={`h-1 rounded-full transition-colors duration-300 ${
                                                                passwordStrength >= idx
                                                                    ? strengthLabel.color
                                                                    : 'bg-slate-200 dark:bg-white/10'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {step1Errors.password && (
                                            <p className="text-xs text-rose-500 mt-1">{step1Errors.password}</p>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                Confirm Password
                                            </label>
                                            {confirmPassword && (
                                                <span className={`text-xs font-medium ${
                                                    formData.password === confirmPassword ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' : 'text-rose-500'
                                                }`}>
                                                    {formData.password === confirmPassword ? (
                                                        <>
                                                            <Check className="w-3 h-3 stroke-[3]" /> Passwords match
                                                        </>
                                                    ) : (
                                                        'Passwords do not match'
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                placeholder="Repeat password"
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value)
                                                    if (step1Errors.confirmPassword) {
                                                        setStep1Errors(prev => ({ ...prev, confirmPassword: undefined }))
                                                    }
                                                }}
                                                className={`w-full h-[50px] rounded-[12px] border ${
                                                    step1Errors.confirmPassword ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'
                                                } bg-white dark:bg-[#161928] text-slate-900 dark:text-white pl-11 pr-11 text-sm placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {step1Errors.confirmPassword && (
                                            <p className="text-xs text-rose-500 mt-1">{step1Errors.confirmPassword}</p>
                                        )}
                                    </div>

                                    {/* Step 1 Continue Button */}
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={handleNextStep1}
                                            className="group relative w-full h-[50px] rounded-[12px] font-semibold text-white bg-[#0a2540] hover:bg-black dark:bg-white dark:text-[#0a2540] dark:hover:bg-slate-100 shadow-[0_10px_25px_-5px_rgba(10,37,64,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(10,37,64,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <span>Continue</span>
                                            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ========================================================
                                STEP 2: BODY STATS (2x2 Grid: Age, Gender, Height, Weight)
                               ======================================================== */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.22 }}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                                        {/* Age */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="age" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                Age
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    id="age"
                                                    name="age"
                                                    type="number"
                                                    min="10"
                                                    max="120"
                                                    placeholder="25"
                                                    value={formData.age || ''}
                                                    onChange={handleChange}
                                                    className="w-full h-[50px] rounded-[12px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161928] text-slate-900 dark:text-white pl-10 pr-12 text-sm placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">
                                                    yrs
                                                </span>
                                            </div>
                                        </div>

                                        {/* Gender */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="gender" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                Gender
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                <select
                                                    id="gender"
                                                    name="gender"
                                                    value={formData.gender || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value || undefined }))}
                                                    className="w-full h-[50px] rounded-[12px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161928] text-slate-900 dark:text-white pl-10 pr-9 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="" disabled>Select</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Height with 'cm' Suffix */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="height" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                Height
                                            </label>
                                            <div className="relative">
                                                <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    id="height"
                                                    name="height"
                                                    type="number"
                                                    min="100"
                                                    max="250"
                                                    placeholder="175"
                                                    value={formData.height || ''}
                                                    onChange={handleChange}
                                                    className="w-full h-[50px] rounded-[12px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161928] text-slate-900 dark:text-white pl-10 pr-12 text-sm placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">
                                                    cm
                                                </span>
                                            </div>
                                        </div>

                                        {/* Weight with 'kg' Suffix */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="weight" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                Weight
                                            </label>
                                            <div className="relative">
                                                <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    id="weight"
                                                    name="weight"
                                                    type="number"
                                                    min="30"
                                                    max="300"
                                                    placeholder="70"
                                                    value={formData.weight || ''}
                                                    onChange={handleChange}
                                                    className="w-full h-[50px] rounded-[12px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161928] text-slate-900 dark:text-white pl-10 pr-12 text-sm placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">
                                                    kg
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                                        These values calibrate metabolic rate (BMR) and joint kinematic load formulas. You can change these anytime in your profile.
                                    </p>

                                    {/* Step 2 Back & Continue Buttons */}
                                    <div className="pt-2 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(1)}
                                            className="h-[50px] px-5 rounded-[12px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            <span>Back</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextStep2}
                                            className="flex-1 group relative h-[50px] rounded-[12px] font-semibold text-white bg-[#0a2540] hover:bg-black dark:bg-white dark:text-[#0a2540] dark:hover:bg-slate-100 shadow-[0_10px_25px_-5px_rgba(10,37,64,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(10,37,64,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <span>Continue</span>
                                            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ========================================================
                                STEP 3: FITNESS LEVEL (3 Selectable Cards) & SUBMISSION
                               ======================================================== */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.22 }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Select Your Fitness Level
                                        </label>

                                        {/* 3 Selectable Cards for Beginner, Intermediate, Advanced */}
                                        <div className="space-y-2.5">
                                            {[
                                                {
                                                    id: 'beginner',
                                                    title: 'Beginner',
                                                    desc: 'Starting fitness journey or returning after a break (0–1 workouts/wk)',
                                                    icon: Sparkles,
                                                    iconColor: 'text-amber-500 bg-amber-500/10'
                                                },
                                                {
                                                    id: 'intermediate',
                                                    title: 'Intermediate',
                                                    desc: 'Consistently active with good baseline endurance (2–4 workouts/wk)',
                                                    icon: Flame,
                                                    iconColor: 'text-purple-500 bg-purple-500/10'
                                                },
                                                {
                                                    id: 'advanced',
                                                    title: 'Advanced',
                                                    desc: 'High performance or experienced athletic routines (5+ workouts/wk)',
                                                    icon: Award,
                                                    iconColor: 'text-cyan-500 bg-cyan-500/10'
                                                }
                                            ].map((level) => {
                                                const isSelected = (formData.fitness_level || 'beginner') === level.id
                                                const IconComp = level.icon
                                                return (
                                                    <div
                                                        key={level.id}
                                                        onClick={() => setFormData(prev => ({ ...prev, fitness_level: level.id }))}
                                                        className={`w-full p-3.5 sm:p-4 rounded-[16px] border-2 transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                                                            isSelected
                                                                ? 'border-[#0a2540] bg-slate-50/80 dark:border-purple-600 dark:bg-purple-950/20 ring-2 ring-[#0a2540]/10 shadow-xs'
                                                                : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-[#161928]'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3.5">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${level.iconColor}`}>
                                                                <IconComp className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                                                                    {level.title}
                                                                </h4>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                                                    {level.desc}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Radio Selection Indicator */}
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                                            isSelected
                                                                ? 'border-[#0a2540] bg-[#0a2540] dark:border-purple-600 dark:bg-purple-600 text-white'
                                                                : 'border-slate-300 dark:border-white/20 bg-transparent'
                                                        }`}>
                                                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Terms Note */}
                                    <p className="text-xs text-center text-slate-400 dark:text-slate-500 pt-2">
                                        By creating an account, you agree to our{' '}
                                        <a href="#terms" onClick={(e) => e.preventDefault()} className="text-[#0a2540] dark:text-purple-400 hover:underline font-semibold">
                                            Terms of Service
                                        </a>{' '}
                                        and{' '}
                                        <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-[#0a2540] dark:text-purple-400 hover:underline font-semibold">
                                            Privacy Policy
                                        </a>.
                                    </p>

                                    {/* Navigation & Submit Button */}
                                    <div className="pt-1 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(2)}
                                            className="h-[50px] px-5 rounded-[12px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            <span>Back</span>
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 group relative h-[50px] rounded-[12px] font-semibold text-white bg-[#0a2540] hover:bg-black dark:bg-white dark:text-[#0a2540] dark:hover:bg-slate-100 shadow-[0_10px_25px_-5px_rgba(10,37,64,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(10,37,64,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white dark:border-[#0a2540] border-t-transparent rounded-full animate-spin" />
                                                    <span>Creating account...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <span>Create Account</span>
                                                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    {/* Footer: Already have an account? Sign in */}
                    <div className="mt-8 pt-5 border-t border-slate-100 dark:border-white/10 text-center text-sm text-slate-500 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#0a2540] dark:text-white hover:underline font-bold">
                            Sign in
                        </Link>
                    </div>
                </div>
        </div>
    )
}
