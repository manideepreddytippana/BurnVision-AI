import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function Login(): JSX.Element {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const result = await login(email, password)

        if (result.success) {
            navigate('/dashboard')
        } else {
            setError(result.error || 'Login failed')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-[#f8fafc] dark:bg-[#07080e] selection:bg-purple-500 selection:text-white font-sans relative overflow-x-hidden transition-colors duration-300">
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

            {/* Top Bar: Brand Logo at TOP LEFT, ThemeToggle at Top-Right */}
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

            {/* Centered Form Card (18px radius, soft layered shadow, 40px padding) */}
            <div className="w-full max-w-[480px] sm:max-w-[500px] bg-white dark:bg-[#111320] rounded-[18px] p-6 sm:p-10 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(15,23,42,0.04)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-white/[0.08] relative z-10 transition-all">
                
                {/* Form Heading */}
                <div className="mb-6">
                    <h2 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight text-[#0a2540] dark:text-white leading-tight font-heading">
                        Welcome Back
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Sign in to your BurnVision account to continue.
                    </p>
                </div>

                {/* Error Banner */}
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

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="email"
                                type="email"
                                required
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    if (error) setError('')
                                }}
                                className="w-full h-[50px] rounded-[12px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161928] text-slate-900 dark:text-white pl-11 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#0a2540] focus:ring-2 focus:ring-[#0a2540]/15 dark:focus:border-purple-500 dark:focus:ring-purple-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    if (error) setError('')
                                }}
                                className="w-full h-[50px] rounded-[12px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161928] text-slate-900 dark:text-white pl-11 pr-11 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#0a2540] focus:ring-2 focus:ring-[#0a2540]/15 dark:focus:border-purple-500 dark:focus:ring-purple-500/20 transition-all"
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
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full h-[50px] rounded-[12px] font-semibold text-white bg-[#0a2540] hover:bg-black dark:bg-white dark:text-[#0a2540] dark:hover:bg-slate-100 shadow-[0_10px_25px_-5px_rgba(10,37,64,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(10,37,64,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white dark:border-[#0a2540] border-t-transparent rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer: Don't have an account? Sign up */}
                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-white/10 text-center text-sm text-slate-500 dark:text-slate-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-[#0a2540] dark:text-white hover:underline font-bold">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    )
}
