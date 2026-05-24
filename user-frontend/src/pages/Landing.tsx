import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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
    Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import CinematicScrollytelling from '../components/CinematicScrollytelling'
import LogoutModal from '../components/LogoutModal'

interface Feature {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    href: string;
    color: string;
}

const features: Feature[] = [
    {
        icon: Calculator,
        title: 'Calorie Prediction',
        description: 'Advanced ML models predict your calorie burn with high accuracy.',
        href: '/calorie-predict',
        color: 'from-emerald-500 to-teal-500'
    },
    {
        icon: Camera,
        title: 'Live Workout',
        description: 'AI-powered real-time pose detection and calorie tracking during your workout sessions.',
        href: '/workout',
        color: 'from-purple-500 to-pink-500'
    },
    {
        icon: Lightbulb,
        title: 'AI Insights',
        description: 'Personalized recommendations powered by artificial intelligence.',
        href: '/insights',
        color: 'from-yellow-500 to-orange-500'
    },
    {
        icon: Bell,
        title: 'Smart Alerts',
        description: 'Intelligent notifications for overtraining, achievements, and more.',
        href: '/alerts',
        color: 'from-red-500 to-rose-500'
    },
    {
        icon: BarChart3,
        title: 'Statistics',
        description: 'Comprehensive analytics and progress tracking with beautiful visualizations.',
        href: '/stats',
        color: 'from-cyan-500 to-blue-500'
    },
    {
        icon: History,
        title: 'All Predictions',
        description: 'View your complete prediction history with detailed breakdowns.',
        href: '/all-predictions',
        color: 'from-orange-500 to-amber-500'
    }

]

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

export default function Landing(): JSX.Element {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    const handleLogout = (): void => {
        setShowLogoutModal(true)
    }

    const confirmLogout = (): void => {
        setShowLogoutModal(false)
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-background relative">
            {/* Ambient Glow Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/3 -right-40 w-80 h-80 bg-accent/15 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                            <Flame className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold gradient-text">BurnVision</h1>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-foreground/70 hover:text-foreground transition-colors">Features</a>
                        <a href="#benefits" className="text-foreground/70 hover:text-foreground transition-colors">Benefits</a>
                        <a href="#stats" className="text-foreground/70 hover:text-foreground transition-colors">Stats</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Button
                                    variant="ghost"
                                    className="text-foreground/70 hover:text-foreground hover:bg-transparent"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Dashboard
                                </Button>
                                <Button
                                    variant="outline"
                                    className="hover:bg-transparent hover:border-gray-600"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    className="text-foreground/70 hover:text-foreground hover:border hover:border-gray-600 hover:bg-transparent"
                                    onClick={() => navigate('/login')}
                                >
                                    Sign In
                                </Button>
                                <Button
                                    className="rounded-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6"
                                    onClick={() => navigate('/register')}
                                >
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Cinematic Scrollytelling Hero Experience */}
            <CinematicScrollytelling />

            {/* Hero Section */}
            <section className="relative pt-4 pb-20 px-6">
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

                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                            Transform Your
                            <span className="text-white block"><span className="text-[#db2777]">Fit</span>ness Journey</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                            Track calories in real-time with AI-powered pose detection.
                            Get personalized insights and achieve your fitness goals faster.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                className="text-lg px-8 py-6 shadow-lg shadow-primary/25 rounded-full group bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                                onClick={() => navigate(user ? '/dashboard' : '/register')}
                            >
                                {user ? 'Go to Dashboard' : 'Start Free Today'}
                                <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1.5" />
                            </Button>
                            <Button
                                size="lg"
                                className="text-lg px-8 py-6 rounded-full bg-[#10b981] hover:bg-[#059669] text-white"
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
                        className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                    >
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="relative text-center p-6 md:p-8 rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a]/50 hover:border-[#3a3a3a] transition-colors overflow-hidden"
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
                                <div className="text-[#9ca3af] font-medium text-sm md:text-base">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                            Powerful <span className="text-[#7c3aed]">Features</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Everything you need to track, analyze, and improve your fitness journey.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >

                                <Card
                                    onClick={() => navigate(feature.href)}
                                    className="h-full glass-card border-white/10 backdrop-blur-xl hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer group"
                                >
                                    <CardHeader>
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                            <feature.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <CardTitle className="group-hover:text-primary transition-colors text-xl">
                                            {feature.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed mb-6">
                                            {feature.description}
                                        </p>
                                        <div className="flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all">
                                            Learn more
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-24 px-6 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                                Why Choose <span className="text-[#10b981]">BurnVision?</span>
                            </h2>
                            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                                Built with cutting-edge AI technology to provide you with the most accurate
                                and insightful fitness tracking experience available.
                            </p>

                            <div className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-foreground font-medium">{benefit}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative"
                        >
                            <div className="glass-card p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />

                                <div className="relative space-y-6">
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <Zap className="w-10 h-10 text-primary" />
                                        <div>
                                            <h4 className="font-bold text-lg">Real-time Processing</h4>
                                            <p className="text-muted-foreground text-sm">Instant calorie calculations as you exercise</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/5 border border-accent/10">
                                        <TrendingUp className="w-10 h-10 text-accent" />
                                        <div>
                                            <h4 className="font-bold text-lg">Progress Tracking</h4>
                                            <p className="text-muted-foreground text-sm">Visualize your fitness journey over time</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                        <Shield className="w-10 h-10 text-emerald-500" />
                                        <div>
                                            <h4 className="font-bold text-lg">Privacy First</h4>
                                            <p className="text-muted-foreground text-sm">Your data is encrypted and secure</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="glass-card p-12 text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-accent/[0.02] to-primary/[0.02]" />
                        <div className="relative">
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
                                Ready to Transform Your Fitness?
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                                Join thousands of users who are already achieving their fitness goals with BurnVision.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    size="lg"
                                    className="text-lg px-8 py-6 shadow-lg shadow-primary/25 rounded-full group bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                                    onClick={() => navigate(user ? '/dashboard' : '/register')}
                                >
                                    {user ? 'Go to Dashboard' : 'Get Started Free'}
                                    <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1.5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer - 100xdevs style exact */}
            <footer className="bg-[#000000] relative overflow-hidden">
                {/* Top section with logo, links, and social */}
                <div className="max-w-6xl mx-auto px-8 py-16">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-12">
                        {/* Logo - Left */}
                        <div className="flex justify-center items-center">
                            <span className="text-xl font-semibold tracking-tight">
                                <span className="text-white">Calorie</span>
                                <span className="text-[#ef4444]">AI</span>
                            </span>
                        </div>

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
                        <div className="flex flex-col items-end gap-3">
                            {/* Social Icons */}
                            <div className="flex items-center gap-2">
                                {/* YouTube */}
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-lg border border-[#333333] flex items-center justify-center text-white hover:border-[#555555] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                    </svg>
                                </a>
                                {/* Twitter/X */}
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-lg border border-[#333333] flex items-center justify-center text-white hover:border-[#555555] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                                {/* Instagram */}
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-lg border border-[#333333] flex items-center justify-center text-white hover:border-[#555555] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                {/* LinkedIn */}
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-lg border border-[#333333] flex items-center justify-center text-white hover:border-[#555555] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                            </div>
                            {/* Copyright */}
                            <p className="text-sm text-[#6b7280]">
                                © 2026 BurnVision. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Large Brand Text at Bottom */}
                <div className="relative h-44 md:h-60 lg:h-72 overflow-hidden flex items-end justify-center">
                    {/* Large text with gradient fade - matching 100xDevs exactly */}
                    <h2
                        className="text-[7rem] md:text-[12rem] lg:text-[16rem] font-black leading-none tracking-tight select-none"
                        style={{
                            background: 'linear-gradient(to bottom, #bbc0ca9f 0%, #374151 20%, #090c0fff 70%, transparent 85%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            transform: 'translateY(35%)',
                            marginBottom: '140px'
                        }}
                    >
                        BurnVision
                    </h2>
                </div>
            </footer>

            {/* Logout Confirmation Modal */}
            <LogoutModal
                isOpen={showLogoutModal}
                onCancel={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
            />
        </div>
    )
}
