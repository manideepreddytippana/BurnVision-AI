import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
    Flame,
    Camera,
    BarChart3,
    Calculator,
    Lightbulb,
    Bell,
    User,
    History,
    ArrowRight,
    Zap,
    Target,
    TrendingUp,
    CheckCircle2,
    Shield,
    Sparkles,
    Menu,
    X
} from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import BurnVisionFeaturesCarousel from '../components/BurnVisionFeaturesCarousel'

const stats = [
    { value: '99%', label: 'Accuracy', gradient: 'from-[#a855f7] to-[#6366f1]', glowColor: '#a855f7' },
    { value: '10K+', label: 'Workouts Tracked', gradient: 'from-[#2dd4bf] to-[#22c55e]', glowColor: '#2dd4bf' },
    { value: '500+', label: 'Active Users', gradient: 'from-[#f97316] to-[#facc15]', glowColor: '#f97316' },
    { value: '24/7', label: 'AI Support', gradient: 'from-[#f472b6] to-[#ef4444]', glowColor: '#f472b6' },
]

const benefits = [
    'Real-time pose detection with 33-point tracking',
    'Advanced machine learning calorie predictions',
    'Personalized AI-powered fitness insights',
    'Comprehensive workout analytics and trends',
    'Smart alerts for overtraining prevention',
    'Secure and private data handling',
]

{/* Interactive 3D Showcase Card with Perspective Tilt & 3D Layered Bars */}
function ThreeDimensionalBenefitsCard(): JSX.Element {
    const cardX = useMotionValue(0)
    const cardY = useMotionValue(0)

    const rotateX = useSpring(useTransform(cardY, [-0.5, 0.5], [8, -8]), { stiffness: 280, damping: 28 })
    const rotateY = useSpring(useTransform(cardX, [-0.5, 0.5], [-8, 8]), { stiffness: 280, damping: 28 })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        cardX.set(x)
        cardY.set(y)
    }

    const handleMouseLeave = () => {
        cardX.set(0)
        cardY.set(0)
    }

    return (
        <div 
            style={{ perspective: 1200 }} 
            className="w-full relative group/3d"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className="p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl relative overflow-hidden space-y-4 md:space-y-5 bg-[#0f1118]/85 backdrop-blur-2xl border border-white/[0.12] border-t-white/[0.25] border-b-black/70 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.18)] transition-shadow duration-300"
            >
                {/* 3D Specular Sheen Gradient that adds physical curvature */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-40 select-none"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 40%, transparent 70%)',
                    }}
                />

                {/* Feature Tile 1: Real-time Processing (Purple) */}
                <motion.div
                    style={{
                        transform: 'translateZ(30px)',
                        transformStyle: 'preserve-3d',
                    }}
                    className="p-4 md:p-5 rounded-2xl bg-purple-500/[0.05] hover:bg-purple-500/[0.09] backdrop-blur-md border border-purple-500/25 border-t-white/20 border-b-black/40 shadow-sm md:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.14)] hover:-translate-y-1 transition-all duration-300 group"
                >
                    <div className="flex items-start md:items-center gap-4 w-full" style={{ transform: 'translateZ(15px)' }}>
                        {/* 40px Icon in Purple */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl shrink-0 flex items-center justify-center bg-purple-500/15 border border-purple-500/30 border-t-white/25 text-purple-400 shadow-inner group-hover:scale-105 group-hover:bg-purple-500/25 transition-all duration-300">
                            <Zap className="w-5 h-5 md:w-6 md:h-6 text-purple-400 fill-purple-400/20" />
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-3 md:gap-4">
                            <div>
                                <h4 className="font-bold md:font-extrabold text-base md:text-lg text-white group-hover:text-purple-200 transition-colors tracking-tight font-heading">
                                    Real-time Processing
                                </h4>
                                <p className="text-slate-300/85 text-sm leading-relaxed mt-0.5 md:mt-0">
                                    Instant sub-second calorie & kinematic calculations as you exercise
                                </p>
                            </div>
                            
                            {/* Live Badge */}
                            <div 
                                style={{ transform: 'translateZ(18px)' }}
                                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 md:py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 border-t-white/20 text-[10px] md:text-xs font-mono font-bold text-purple-300 self-start md:self-auto shrink-0"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                                <span>30 FPS LIVE</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Feature Tile 2: Progress Tracking (Cyan) - Staggered */}
                <motion.div
                    style={{
                        transform: 'translateZ(30px)',
                        transformStyle: 'preserve-3d',
                    }}
                    className="p-4 md:p-5 rounded-2xl bg-cyan-500/[0.05] hover:bg-cyan-500/[0.09] backdrop-blur-md border border-cyan-500/25 border-t-white/20 border-b-black/40 shadow-sm md:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.14)] hover:-translate-y-1 transition-all duration-300 md:translate-x-3 group"
                >
                    <div className="flex items-start md:items-center gap-4 w-full" style={{ transform: 'translateZ(15px)' }}>
                        {/* 40px Icon in Cyan */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl shrink-0 flex items-center justify-center bg-cyan-500/15 border border-cyan-500/30 border-t-white/25 text-cyan-400 shadow-inner group-hover:scale-105 group-hover:bg-cyan-500/25 transition-all duration-300">
                            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-3 md:gap-4">
                            <div>
                                <h4 className="font-bold md:font-extrabold text-base md:text-lg text-white group-hover:text-cyan-200 transition-colors tracking-tight font-heading">
                                    Progress Tracking
                                </h4>
                                <p className="text-slate-300/85 text-sm leading-relaxed mt-0.5 md:mt-0">
                                    Continuous trend modeling and metabolic milestone synthesis
                                </p>
                            </div>

                            {/* Sparkline Metric Badge */}
                            <div 
                                style={{ transform: 'translateZ(18px)' }}
                                className="hidden md:inline-flex items-center gap-2 px-3 py-1 md:py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 border-t-white/20 text-[10px] md:text-xs font-mono font-bold text-cyan-300 self-start md:self-auto shrink-0"
                            >
                                <svg className="w-8 h-3 stroke-cyan-400 fill-none" viewBox="0 0 32 12">
                                    <path d="M0 10 L8 7 L16 9 L24 3 L32 1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>+18.4%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Feature Tile 3: Privacy First (Green) */}
                <motion.div
                    style={{
                        transform: 'translateZ(30px)',
                        transformStyle: 'preserve-3d',
                    }}
                    className="p-4 md:p-5 rounded-2xl bg-emerald-500/[0.05] hover:bg-emerald-500/[0.09] backdrop-blur-md border border-emerald-500/25 border-t-white/20 border-b-black/40 shadow-sm md:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.14)] hover:-translate-y-1 transition-all duration-300 group"
                >
                    <div className="flex items-start md:items-center gap-4 w-full" style={{ transform: 'translateZ(15px)' }}>
                        {/* 40px Icon in Green */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl shrink-0 flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 border-t-white/25 text-emerald-400 shadow-inner group-hover:scale-105 group-hover:bg-emerald-500/25 transition-all duration-300">
                            <Shield className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 fill-emerald-400/20" />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-3 md:gap-4">
                            <div>
                                <h4 className="font-bold md:font-extrabold text-base md:text-lg text-white group-hover:text-emerald-200 transition-colors tracking-tight font-heading">
                                    Privacy First
                                </h4>
                                <p className="text-slate-300/85 text-sm leading-relaxed mt-0.5 md:mt-0">
                                    On-device kinematic edge compute with zero video recording
                                </p>
                            </div>

                            {/* Security Badge */}
                            <div 
                                style={{ transform: 'translateZ(18px)' }}
                                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 md:py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 border-t-white/20 text-[10px] md:text-xs font-mono font-bold text-emerald-300 self-start md:self-auto shrink-0"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>AES-256 E2EE</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

export default function Landing(): JSX.Element {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Disable body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [mobileMenuOpen])

    return (
        <div className="min-h-screen bg-[#fbf8f5] dark:bg-background relative transition-colors duration-500">
            {/* Atmospheric Background Blending Orbs (Extracted from project: bg-orb-1 Amber, bg-orb-2 Rose, bg-orb-4 Cyan, bg-orb-3 Emerald) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {/* Light Mode: Warm Orb Blend matching reference image */}
                {/* Top-Left Rose/Blush Glow (from project bg-orb-2: hsla(303, 95%, 48%) / hsla(330, 80%, 60%)) */}
                <div
                    className="absolute -top-32 -left-28 w-[580px] sm:w-[720px] h-[580px] sm:h-[720px] rounded-full blur-[140px] opacity-70 dark:opacity-0 transition-opacity duration-500"
                    style={{
                        background: 'radial-gradient(circle, hsla(330, 85%, 62%, 0.22) 0%, hsla(303, 95%, 48%, 0.12) 50%, transparent 75%)'
                    }}
                />

                {/* Top-Right Warm Amber/Orange Glow (from project bg-orb-1: hsla(29, 84%, 48%)) */}
                <div
                    className="absolute -top-24 -right-28 w-[620px] sm:w-[780px] h-[620px] sm:h-[780px] rounded-full blur-[160px] opacity-75 dark:opacity-0 transition-opacity duration-500"
                    style={{
                        background: 'radial-gradient(circle, hsla(29, 88%, 56%, 0.24) 0%, hsla(38, 90%, 50%, 0.14) 55%, transparent 75%)'
                    }}
                />

                {/* Top-Center Warm Diffusion Bridge (blending rose and amber smoothly across the header) */}
                <div
                    className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[450px] rounded-full blur-[150px] opacity-60 dark:opacity-0 transition-opacity duration-500"
                    style={{
                        background: 'radial-gradient(ellipse at center, hsla(20, 90%, 65%, 0.15) 0%, hsla(330, 80%, 65%, 0.08) 50%, transparent 80%)'
                    }}
                />

                {/* Mid-Right Subtle Cyan Depth (from project bg-orb-4: hsla(189, 95%, 46%)) */}
                <div
                    className="absolute top-[42%] -right-36 w-[500px] h-[500px] rounded-full blur-[160px] opacity-40 dark:opacity-0 transition-opacity duration-500"
                    style={{
                        background: 'radial-gradient(circle, hsla(189, 95%, 46%, 0.12) 0%, transparent 70%)'
                    }}
                />

                {/* Lower-Left Subtle Emerald Depth (from project bg-orb-3: hsla(130, 90%, 55%)) */}
                <div
                    className="absolute top-[68%] -left-36 w-[520px] h-[520px] rounded-full blur-[160px] opacity-35 dark:opacity-0 transition-opacity duration-500"
                    style={{
                        background: 'radial-gradient(circle, hsla(130, 90%, 55%, 0.10) 0%, transparent 70%)'
                    }}
                />

                {/* Dark Mode: Existing Atmospheric Orbs (Preserved 100%) */}
                <div className="hidden dark:block absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="hidden dark:block absolute top-1/3 -right-40 w-80 h-80 bg-accent/15 rounded-full blur-3xl" />
                <div className="hidden dark:block absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>

            {/* SVG Filter for BurnVision Liquid Glass Refraction Effect */}
            <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
                <defs>
                    <filter id="burnvision-liquid-warp" x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.015 0.04" numOctaves="3" result="warpNoise" />
                        <feDisplacementMap in="SourceGraphic" in2="warpNoise" scale="9" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
            </svg>

            {/* Morphing Navbar - BurnVision Liquid Capsule Style */}
            <div
                className={`fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-500 ease-out ${
                    scrolled
                        ? 'pt-4 sm:pt-5 px-3 sm:px-6'
                        : 'pt-0 px-0'
                }`}
            >
                <header
                    className={`w-full pointer-events-auto transition-all duration-500 ease-out relative ${
                        scrolled
                            ? 'max-w-[780px] rounded-full burnvision-liquid-glass py-2 px-3 sm:px-4 pl-4 sm:pl-5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]'
                            : 'max-w-full rounded-none bg-white/60 dark:bg-[#0a0b12]/60 backdrop-blur-xl backdrop-saturate-150 border-b border-black/[0.06] dark:border-white/[0.08] shadow-xs py-3.5 sm:py-4 px-4 sm:px-8 lg:px-12'
                    }`}
                >
                    {/* BurnVision Liquid Glass Specular Meniscus & Lens Distortion Underlay */}
                    {scrolled && (
                        <>
                            <div className="absolute inset-0 rounded-full burnvision-liquid-lens opacity-60 pointer-events-none" />
                            <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-b from-white/40 via-white/[0.04] to-transparent dark:from-white/20 dark:via-transparent dark:to-transparent border-t border-white/80 dark:border-white/30" />
                        </>
                    )}

                    <div className="relative z-10 flex items-center justify-between">
                        {/* Standalone Brand Logo & Text (Adaptive: grey_logo.png in Light, light_logo.png in Dark) */}
                        <div
                            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none transition-transform duration-300 hover:scale-[1.02] active:scale-95 shrink-0"
                            onClick={() => navigate('/')}
                        >
                            {/* Light Theme Logo */}
                            <img
                                src="/grey_logo.png"
                                alt="BurnVision"
                                className={`object-contain block dark:hidden transition-all duration-300 ${
                                    scrolled ? 'h-7 sm:h-8 w-auto' : 'h-8 sm:h-9 w-auto'
                                }`}
                            />
                            {/* Dark Theme Logo */}
                            <img
                                src="/light_logo.png"
                                alt="BurnVision"
                                className={`object-contain hidden dark:block transition-all duration-300 ${
                                    scrolled ? 'h-7 sm:h-8 w-auto' : 'h-8 sm:h-9 w-auto'
                                }`}
                            />
                            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540] dark:text-white font-heading">
                                BurnVision
                            </span>
                        </div>

                        {/* BurnVision Navigation Links (Clean uppercase tracking) */}
                        <nav className={`hidden md:flex items-center transition-all ${
                            scrolled
                                ? 'gap-6 lg:gap-8 absolute left-1/2 -translate-x-1/2'
                                : 'gap-1 p-1 rounded-full border border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.03] absolute left-1/2 -translate-x-1/2'
                        }`}>
                            <a
                                href="#features"
                                className={`font-semibold tracking-[0.12em] uppercase transition-colors duration-200 ${
                                    scrolled
                                        ? 'text-[11px] sm:text-xs text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                                        : 'text-xs lg:text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3.5 py-1.5 rounded-full hover:bg-white dark:hover:bg-white/10 hover:shadow-xs'
                                }`}
                            >
                                Features
                            </a>
                            <a
                                href="#benefits"
                                className={`font-semibold tracking-[0.12em] uppercase transition-colors duration-200 ${
                                    scrolled
                                        ? 'text-[11px] sm:text-xs text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                                        : 'text-xs lg:text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3.5 py-1.5 rounded-full hover:bg-white dark:hover:bg-white/10 hover:shadow-xs'
                                }`}
                            >
                                Benefits
                            </a>
                            <a
                                href="#stats"
                                className={`font-semibold tracking-[0.12em] uppercase transition-colors duration-200 ${
                                    scrolled
                                        ? 'text-[11px] sm:text-xs text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                                        : 'text-xs lg:text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3.5 py-1.5 rounded-full hover:bg-white dark:hover:bg-white/10 hover:shadow-xs'
                                }`}
                            >
                                Stats
                            </a>
                        </nav>

                        {/* BurnVision Right Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {user ? (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className={`hidden md:flex rounded-full font-semibold transition-all duration-300 bg-slate-950 hover:bg-black text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md active:scale-95 items-center gap-1.5 ${
                                        scrolled
                                            ? 'text-xs px-3.5 sm:px-4 py-1.5 sm:py-2 tracking-wide uppercase'
                                            : 'text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5'
                                    }`}
                                >
                                    <span>Dashboard</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/register')}
                                    className={`relative group hidden md:inline-flex items-center gap-1.5 rounded-full font-semibold transition-all duration-300 bg-slate-950 hover:bg-black text-white dark:bg-white dark:text-slate-950 shadow-[0_4px_14px_rgba(0,0,0,0.25)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 border border-white/20 hover:border-[#db2777]/60 hover:shadow-[0_4px_22px_rgba(219,39,119,0.38)] overflow-hidden ${
                                        scrolled
                                            ? 'text-xs px-3.5 sm:px-4 py-1.5 sm:py-2 tracking-wide uppercase'
                                            : 'text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5'
                                    }`}
                                >
                                    {/* Liquid Wave ) Flow from Left to Right in Fit (#db2777) Color */}
                                    <span 
                                        className="absolute -top-[60%] -bottom-[60%] -left-[50px] w-[180%] -translate-x-full group-hover:translate-x-[50px] transition-transform duration-700 ease-out pointer-events-none"
                                        style={{
                                            backgroundColor: '#db2777',
                                            borderRadius: '0 100% 100% 0',
                                        }}
                                    />
                                    <span className="relative z-10 transition-colors duration-300 dark:group-hover:text-white">Get Started</span>
                                    <ArrowRight className="relative z-10 w-3.5 h-3.5 transition-all duration-200 group-hover:translate-x-0.5 dark:group-hover:text-white" />
                                </button>
                            )}

                            {/* Mobile Menu Toggle Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden w-8 h-8 rounded-full flex items-center justify-center border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all duration-200"
                                aria-label="Toggle mobile menu"
                            >
                                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                </header>
            </div>

            {/* Mobile Full-Screen Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden fixed inset-0 z-40 bg-white/95 dark:bg-[#07080e]/95 flex flex-col pt-28 px-6 pb-8 overflow-y-auto"
                    >
                        <nav className="flex flex-col items-center gap-6 mt-4">
                            <a
                                href="#features"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-3xl text-center font-normal tracking-tight text-slate-900 dark:text-white hover:text-[#db2777] dark:hover:text-[#db2777] transition-colors"
                            >
                                Features
                            </a>
                            <a
                                href="#benefits"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-3xl text-center font-normal tracking-tight text-slate-900 dark:text-white hover:text-[#db2777] dark:hover:text-[#db2777] transition-colors"
                            >
                                Benefits
                            </a>
                            <a
                                href="#stats"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-3xl text-center font-normal tracking-tight text-slate-900 dark:text-white hover:text-[#db2777] dark:hover:text-[#db2777] transition-colors"
                            >
                                Stats
                            </a>
                        </nav>

                        <div className="mt-auto pt-8 flex flex-col gap-4">
                            {!user ? (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false)
                                        navigate('/register')
                                    }}
                                    className="w-full py-4 rounded-[1.25rem] font-bold text-lg bg-[#0a2540] hover:bg-black text-white dark:bg-white dark:text-[#0a2540] dark:hover:bg-slate-100 flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all"
                                >
                                    Get Started <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false)
                                        navigate('/dashboard')
                                    }}
                                    className="w-full py-4 rounded-[1.25rem] font-bold text-lg bg-[#0a2540] hover:bg-black text-white dark:bg-white dark:text-[#0a2540] dark:hover:bg-slate-100 flex items-center justify-center shadow-xl active:scale-[0.98] transition-all"
                                >
                                    Dashboard
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <section className="relative pt-28 sm:pt-32 md:pt-36 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                            <Sparkles className="w-4 h-4" />
                            AI-Powered Fitness Tracking
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight font-heading">
                            Transform Your
                            <span className="text-foreground block"><span className="text-[#db2777]">Fit</span>ness Journey</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                            Track calories in real-time with AI-powered pose detection.
                            Get personalized insights and achieve your fitness goals faster.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 shadow-lg shadow-primary/25 rounded-full group bg-primary hover:bg-primary/90 text-primary-foreground relative overflow-hidden transition-all duration-300 hover:shadow-[0_6px_25px_rgba(219,39,119,0.35)]"
                                onClick={() => navigate(user ? '/dashboard' : '/register')}
                            >
                                {/* Liquid Wave ) Flow from Left to Right in Fit (#db2777) Color */}
                                <span 
                                    className="absolute -top-[60%] -bottom-[60%] -left-[50px] w-[180%] -translate-x-full group-hover:translate-x-[50px] transition-transform duration-500 ease-out pointer-events-none"
                                    style={{
                                        backgroundColor: '#db2777',
                                        borderRadius: '0 100% 100% 0',
                                    }}
                                />
                                <span className="relative z-10 flex items-center">
                                    {user ? 'Go to Dashboard' : 'Start Free Today'}
                                    <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1.5" />
                                </span>
                            </Button>
                            <Button
                                size="lg"
                                className="text-lg px-8 py-6 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border shadow-sm"
                                onClick={() => navigate('/workout')}
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Try Live Workout
                            </Button>
                        </div>
                    </motion.div>

                    {/* Hero Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        id="stats"
                        className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 scroll-mt-28 md:scroll-mt-32"
                    >
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="relative text-center p-6 md:p-8 rounded-2xl border border-border bg-card/50 hover:border-foreground/20 transition-colors overflow-hidden backdrop-blur-sm shadow-sm"
                            >
                                {/* Animated glowing top border */}
                                <div
                                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-3/4 glow-slow-pulse"
                                    style={{
                                        background: `linear-gradient(90deg, transparent 0%, ${stat.glowColor} 50%, transparent 100%)`,
                                        boxShadow: `0 0 20px 2px ${stat.glowColor}40, 0 0 40px 4px ${stat.glowColor}20`,
                                    }}
                                />
                                <div className={`text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                                    {stat.value}
                                </div>
                                <div className="text-muted-foreground font-medium text-sm md:text-base">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section - BurnVision Interactive Carousel */}
            <BurnVisionFeaturesCarousel />

            {/* Redesigned 'Why Choose BurnVision?' Section */}
            <section
                id="benefits"
                className="py-32 sm:py-36 px-6 lg:px-12 relative overflow-hidden bg-[#07080b] text-white selection:bg-cyan-500/30 scroll-mt-28 md:scroll-mt-32"
            >
                {/* Subtle vertical panel columns and top spotlight matching reference image */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-25 select-none"
                    style={{
                        backgroundImage: `
                            radial-gradient(ellipse 80% 45% at 50% 0%, rgba(255,255,255,0.1), transparent 75%),
                            repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 96px)
                        `,
                        backgroundSize: '100% 100%, 96px 100%'
                    }}
                />

                {/* Subtle Grain Texture Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.035] select-none mix-blend-screen"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                    }}
                />

                {/* Subdued Ambient Background Lights */}
                <div className="absolute top-1/4 -left-32 w-[400px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[180px] pointer-events-none" />
                <div className="absolute top-1/3 left-1/3 -translate-x-1/2 w-[450px] h-[300px] bg-purple-500/[0.03] rounded-full blur-[180px] pointer-events-none" />
                <div className="absolute bottom-10 -right-20 w-[420px] h-[420px] bg-cyan-500/[0.04] rounded-full blur-[180px] pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-12 gap-16 lg:gap-14 xl:gap-20 items-center">
                        {/* LEFT COLUMN: Staggered Fade-Up Entrance */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-80px' }}
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
                                }
                            }}
                            className="lg:col-span-6 xl:col-span-6 flex flex-col"
                        >
                            {/* Heading: Matching font style of Transform Your Fitness Journey */}
                            <motion.h2
                                variants={{
                                    hidden: { opacity: 0, y: 30 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
                                }}
                                className="tracking-tight font-extrabold mb-6 select-none leading-tight font-heading"
                            >
                                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-[68px] xl:text-[76px] font-extrabold text-white tracking-tight leading-[0.98]">
                                    Why Choose
                                </span>
                                <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[84px] font-extrabold tracking-tight leading-[0.92] mt-1 bg-gradient-to-r from-[#10b981] via-[#06b6d4] to-[#a855f7] bg-clip-text text-transparent">
                                    BurnVision?
                                </span>
                            </motion.h2>

                            {/* Muted intro paragraph - brightened to text-slate-200/90 for clean white readability */}
                            <motion.p
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                                }}
                                className="text-[17px] sm:text-[18px] text-slate-200/90 leading-relaxed font-normal mb-10 max-w-[480px]"
                            >
                                Built with cutting-edge AI technology to provide you with the most accurate
                                and insightful fitness tracking experience available.
                            </motion.p>

                            {/* Six checklist items into a two-column grid with bright white text and emerald check icons */}
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.08, delayChildren: 0.2 }
                                    }
                                }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5"
                            >
                                {benefits.map((benefit, index) => (
                                    <motion.div
                                        key={index}
                                        variants={{
                                            hidden: { opacity: 0, y: 15 },
                                            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                                        }}
                                        className="flex items-start gap-3.5 group"
                                    >
                                        {/* 28px Check Icon Container */}
                                        <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-500/25 transition-all duration-200">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <span className="text-sm sm:text-[15px] text-white/90 font-medium leading-snug pt-0.5 group-hover:text-white transition-colors">
                                            {benefit}
                                        </span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>

                        {/* RIGHT COLUMN: Interactive 3D Card with 3D Layered Feature Bars */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="lg:col-span-6 xl:col-span-6 relative"
                        >
                            <ThreeDimensionalBenefitsCard />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 sm:py-28 px-6 relative overflow-hidden bg-transparent">
                {/* Ambient Glows for CTA in both light and dark mode */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/[0.08] dark:bg-primary/[0.04] rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute top-1/2 right-1/4 w-[300px] h-[250px] bg-accent/[0.08] dark:bg-accent/[0.03] rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="burnvision-liquid-glass-card p-10 sm:p-14 md:p-16 rounded-3xl text-center relative overflow-hidden shadow-xl dark:shadow-2xl backdrop-blur-2xl"
                    >
                        <div className="relative z-10">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900 dark:text-white leading-tight font-heading">
                                Ready to Transform Your Fitness?
                            </h2>
                            <p className="text-lg sm:text-xl text-slate-600 dark:text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed font-normal">
                                Join thousands of users who are already achieving their fitness goals with BurnVision.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    size="lg"
                                    className="text-lg px-8 py-6 shadow-xl shadow-primary/25 rounded-full group bg-primary hover:bg-primary/90 text-primary-foreground font-semibold relative overflow-hidden transition-all duration-300 hover:shadow-[0_6px_25px_rgba(219,39,119,0.35)]"
                                    onClick={() => navigate(user ? '/dashboard' : '/register')}
                                >
                                    {/* Liquid Wave ) Flow from Left to Right in Fit (#db2777) Color */}
                                    <span 
                                        className="absolute -top-[60%] -bottom-[60%] -left-[50px] w-[180%] -translate-x-full group-hover:translate-x-[50px] transition-transform duration-500 ease-out pointer-events-none"
                                        style={{
                                            backgroundColor: '#db2777',
                                            borderRadius: '0 100% 100% 0',
                                        }}
                                    />
                                    <span className="relative z-10 flex items-center">
                                        {user ? 'Go to Dashboard' : 'Get Started Free'}
                                        <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1.5" />
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer - Seamless Transparent Fade matching above section */}
            <footer className="relative overflow-hidden bg-gradient-to-b from-transparent via-background/50 to-background">
                {/* Top section with logo, links, and social */}
                <div className="max-w-6xl mx-auto px-8 py-16 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-end gap-12">

                        {/* Center Links - Stacked vertically */}
                        {/* <div className="flex flex-col gap-4">
                            <a
                                href="#"
                                className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] hover:opacity-80 transition-opacity font-medium text-base"
                            >
                                Terms & Conditions
                            </a>
                            <a
                                href="#"
                                className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] hover:opacity-80 transition-opacity font-medium text-base"
                            >
                                Privacy Policy
                            </a>
                            <a
                                href="#"
                                className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] hover:opacity-80 transition-opacity font-medium text-base"
                            >
                                Refund & Cancellation
                            </a>
                        </div> */}

                        {/* Right side - Social icons and copyright */}
                        <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto mt-8 md:mt-0">
                            {/* Social Icons */}
                            <div className="flex items-center gap-2">
                                {/* YouTube */}
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:border-foreground/30 hover:bg-foreground/5 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                    </svg>
                                </a>
                                {/* Twitter/X */}
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:border-foreground/30 hover:bg-foreground/5 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                                {/* Instagram */}
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:border-foreground/30 hover:bg-foreground/5 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                {/* LinkedIn */}
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:border-foreground/30 hover:bg-foreground/5 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                            </div>
                            {/* Copyright */}
                            <p className="text-sm text-muted-foreground">
                                © 2026 BurnVision. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Large Brand Text at Bottom */}
                <div className="relative h-24 sm:h-32 md:h-48 lg:h-64 overflow-hidden flex items-center justify-center mt-10">
                    <h2
                        className="text-[16vw] sm:text-[8rem] md:text-[11rem] lg:text-[15rem] font-black leading-none tracking-tight select-none text-foreground opacity-90"
                    >
                        BurnVision
                    </h2>
                </div>
            </footer>
        </div>
    )
}
