import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import {
    Calculator,
    Camera,
    Lightbulb,
    Bell,
    BarChart3,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    type LucideIcon
} from 'lucide-react'

interface FeatureCard {
    id: string;
    number: string;
    tag: string;
    eyebrow: string;
    displayTitleLine1: string;
    displayTitleLine2: string;
    titleLine1?: string;
    heroWord?: string;
    titleLine3?: string;
    watermark: string;
    description: string;
    image: string;
    imagePosition?: string;
    href: string;
    actionText: string;
    icon: LucideIcon;
    accentColor: string;
    tags: string[];
    hudBadge: string;
    hudMetric: string;
}

const features: FeatureCard[] = [
    {
        id: 'form-analysis',
        number: '1',
        tag: 'COMPUTER VISION',
        eyebrow: 'REAL-TIME SKELETAL AI',
        displayTitleLine1: 'EXERCISE FORM',
        displayTitleLine2: 'ANALYSIS',
        titleLine1: 'EXERCISE',
        heroWord: 'FORM',
        titleLine3: 'ANALYSIS',
        watermark: 'POSE AI',
        description: 'Subtle computer vision tracks 33 anatomical landmarks at 30 FPS. Real-time kinematic angle calculations for knees, hips, and shoulders ensure biomechanically optimal repetitions.',
        image: '/features/feature_form_analysis.jpg',
        imagePosition: '95% center',
        href: '/workout',
        actionText: 'START FORM ANALYSIS',
        icon: Camera,
        accentColor: '#10b981',
        tags: ['30 FPS STREAM', '33 JOINTS', 'SUB-DEGREE ACCURACY'],
        hudBadge: 'INFERENCE: 30 FPS',
        hudMetric: 'ANGLE ACCURACY: 99.4%',
    },
    {
        id: 'mistake-detection',
        number: '2',
        tag: 'COACHING AI',
        eyebrow: 'BIOMECHANIC PROTECTION',
        displayTitleLine1: 'MISTAKE DETECTION &',
        displayTitleLine2: 'FORM SUGGESTIONS',
        titleLine1: 'MISTAKE DETECTION &',
        heroWord: 'FORM',
        titleLine3: 'SUGGESTIONS',
        watermark: 'PROTECT',
        description: 'Instantly identifies biomechanical errors like knee valgus collapse, rounded thoracic spine, or uneven bar tilt, delivering corrective cues before joint strain leads to injury.',
        image: '/features/feature_mistakes.jpg',
        imagePosition: '97% center',
        href: '/workout',
        actionText: 'TRY COACHING DEMO',
        icon: AlertCircle,
        accentColor: '#f59e0b',
        tags: ['ZERO-DELAY ALERTS', 'JOINT GUARD', 'KINEMATIC AUDIO'],
        hudBadge: 'POSTURE: NEUTRAL',
        hudMetric: 'INJURY RISK: 0.0%',
    },
    {
        id: 'notifications-alerts',
        number: '3',
        tag: 'SMART ALERTS',
        eyebrow: 'PROACTIVE MONITORING',
        displayTitleLine1: 'NOTIFICATIONS &',
        displayTitleLine2: 'SMART ALERTS',
        titleLine1: 'NOTIFICATIONS &',
        heroWord: 'SMART',
        titleLine3: 'ALERTS',
        watermark: 'DISPATCH',
        description: 'Stay on track with intelligent alerts for upcoming workouts, weekly calorie targets, form improvement milestones, and optimal cardiovascular recovery windows.',
        image: '/features/feature_alerts.jpg',
        href: '/alerts',
        actionText: 'CONFIGURE ALERTS',
        icon: Bell,
        accentColor: '#8b5cf6',
        tags: ['STREAK MILESTONES', 'FATIGUE ALERTS', 'MULTI-DEVICE PUSH'],
        hudBadge: 'DISPATCH: ACTIVE',
        hudMetric: 'SYNCED: 100%',
    },
    {
        id: 'progress-analytics',
        number: '4',
        tag: 'DATA ANALYTICS',
        eyebrow: 'PROGRESS INTELLIGENCE',
        displayTitleLine1: 'DAILY PROGRESS &',
        displayTitleLine2: 'CALORIE ANALYTICS',
        titleLine1: 'DAILY PROGRESS &',
        heroWord: 'CALORIE',
        titleLine3: 'ANALYTICS',
        watermark: 'ANALYTICS',
        description: 'Analyze daily caloric burn across dates with streak metrics, rolling 7-day volume trends, and one-click medical-grade PDF fitness summary generation.',
        image: '/features/feature_analytics.jpg',
        href: '/stats',
        actionText: 'VIEW ANALYTICS',
        icon: BarChart3,
        accentColor: '#06b6d4',
        tags: ['PDF EXPORT', '7-DAY ROLLING AVG', 'HEATMAP TRACKING'],
        hudBadge: 'RECORDS: 10K+ LOGS',
        hudMetric: 'REPORT: GENERATED',
    },
    {
        id: 'calorie-engine',
        number: '5',
        tag: 'MACHINE LEARNING',
        eyebrow: 'NEURAL METABOLIC MODEL',
        displayTitleLine1: 'ML CALORIE',
        displayTitleLine2: 'PREDICTOR ENGINE',
        titleLine1: 'ML CALORIE',
        heroWord: 'PREDICTOR',
        titleLine3: 'ENGINE',
        watermark: 'NEURAL',
        description: 'Trained on empirical metabolic exercise datasets, our gradient-boosted neural models predict continuous energy expenditure with 99.2% statistical accuracy.',
        image: '/features/feature_calorie.jpg',
        href: '/calorie-predict',
        actionText: 'PREDICT CALORIES',
        icon: Calculator,
        accentColor: '#f43f5e',
        tags: ['99.2% ACCURACY', 'GRADIENT BOOSTED', 'METABOLIC PROFILING'],
        hudBadge: 'MODEL: V4.2 NEURAL',
        hudMetric: 'R² SCORE: 0.992',
    },
    {
        id: 'ai-insights',
        number: '6',
        tag: 'HEALTH INSIGHTS',
        eyebrow: 'CONTEXTUAL AI COACH',
        displayTitleLine1: 'ADAPTIVE HEALTH',
        displayTitleLine2: 'RECOVERY INSIGHTS',
        titleLine1: 'ADAPTIVE HEALTH',
        heroWord: 'RECOVERY',
        titleLine3: 'INSIGHTS',
        watermark: 'INSIGHTS',
        description: 'Context-aware coaching algorithms synthesize recovery scores, strain indices, and daily exercise recommendations tailored directly to your training history.',
        image: '/features/feature_insights.jpg',
        href: '/insights',
        actionText: 'EXPLORE INSIGHTS',
        icon: Lightbulb,
        accentColor: '#6366f1',
        tags: ['RECOVERY SCORING', 'STRAIN MATRIX', 'TAILORED PLANS'],
        hudBadge: 'READINESS: 94%',
        hudMetric: 'RECOVERY: OPTIMAL',
    }
]

interface CardItemProps {
    feature: FeatureCard;
    index: number;
    stackOffset: number;
    progress: MotionValue<number>;
    isMobile: boolean;
    onCardClick: (index: number) => void;
    navigate: (href: string) => void;
}

function getClosingKeyframes(index: number, stackOffset: number) {
    if (index === 0) {
        return {
            input: [0, 1],
            output: ['0px', '0px']
        }
    }

    const inputPoints = [0, 0.72]
    const outputPoints = ['0px', '0px']

    const stepTimings = [
        { end: 0.77, minIndex: 5 },
        { end: 0.82, minIndex: 4 },
        { end: 0.87, minIndex: 3 },
        { end: 0.92, minIndex: 2 },
        { end: 1.00, minIndex: 1 },
    ]

    let currentShift = 0
    for (const step of stepTimings) {
        if (index >= step.minIndex) {
            currentShift += 1
        }
        inputPoints.push(step.end)
        outputPoints.push(`-${currentShift * stackOffset}px`)
    }

    return { input: inputPoints, output: outputPoints }
}

function CardItem({
    feature,
    index,
    stackOffset,
    progress,
    isMobile,
    onCardClick,
    navigate
}: CardItemProps): JSX.Element {

    const arrivalStart = index === 0 ? 0 : 0.02 + (index - 1) * 0.14
    const arrivalEnd = index === 0 ? 0 : 0.02 + index * 0.14

    const arrivalY = useTransform(
        progress,
        index === 0 ? [0, 1] : [0, arrivalStart, arrivalEnd, 1],
        index === 0 ? ['0vh', '0vh'] : ['100vh', '100vh', '0vh', '0vh'],
        { clamp: true }
    )

    const closingKeyframes = useMemo(
        () => getClosingKeyframes(index, stackOffset),
        [index, stackOffset]
    )

    const closingY = useTransform(
        progress,
        closingKeyframes.input,
        closingKeyframes.output,
        { clamp: true }
    )

    const topOffset = index * stackOffset
    const Icon = feature.icon

    return (
        <motion.div
            id={`feature-card-${index}`}
            style={{
                position: 'absolute',
                top: `${topOffset}px`,
                left: 0,
                right: 0,
                zIndex: 10 + index,
                y: arrivalY,
            }}
            className="w-full select-none"
        >
            <motion.div
                style={{
                    y: closingY
                }}
                className="w-full"
            >
                <div
                    onClick={() => onCardClick(index)}
                    className="relative rounded-xl md:rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-600 shadow-[0_-2px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] transition-shadow duration-300"
                >
                <div className="grid grid-cols-1 md:grid-cols-12 w-full">
                    <div className="md:col-span-6 relative overflow-hidden min-h-[220px] sm:min-h-[380px] md:min-h-[530px] bg-slate-950 group/img">
                        <img
                            src={feature.image}
                            alt={`${feature.displayTitleLine1} ${feature.displayTitleLine2}`}
                            style={{ objectPosition: feature.imagePosition || 'center' }}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    </div>

                    <div className="md:col-span-6 bg-[#0c0d12] border-t md:border-t-0 md:border-l border-white/[0.08] text-white p-5 sm:p-8 md:p-12 flex flex-col justify-between relative overflow-hidden min-h-[340px] sm:min-h-[500px] md:min-h-[540px]">
                        <div
                            className="absolute -top-12 -left-12 w-96 h-96 rounded-full pointer-events-none blur-[100px] opacity-20 dark:opacity-25"
                            style={{
                                background: `radial-gradient(circle, ${feature.accentColor} 0%, transparent 70%)`
                            }}
                        />

                        <div className="absolute -right-24 sm:-right-20 top-1/2 -translate-y-1/2 w-80 sm:w-96 lg:w-[420px] h-80 sm:h-96 lg:h-[420px] pointer-events-none select-none opacity-20 dark:opacity-25 overflow-visible">
                            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="200" cy="200" r="185" stroke={`url(#gauge-grad-${index})`} strokeWidth="1.5" strokeDasharray="4 8" />
                                <circle cx="200" cy="200" r="160" stroke={`url(#gauge-grad-${index})`} strokeWidth="2.5" strokeDasharray="300 220" />
                                <circle cx="200" cy="200" r="135" stroke={`url(#gauge-grad-${index})`} strokeWidth="1" strokeDasharray="2 6" opacity="0.6" />
                                <circle cx="200" cy="200" r="90" stroke={`url(#gauge-grad-${index})`} strokeWidth="1.5" strokeDasharray="50 35" opacity="0.8" />
                                <circle cx="200" cy="200" r="45" stroke={`url(#gauge-grad-${index})`} strokeWidth="1" opacity="0.4" />
                                <line x1="200" y1="10" x2="200" y2="40" stroke={`url(#gauge-grad-${index})`} strokeWidth="2" />
                                <line x1="200" y1="360" x2="200" y2="390" stroke={`url(#gauge-grad-${index})`} strokeWidth="2" />
                                <line x1="10" y1="200" x2="40" y2="200" stroke={`url(#gauge-grad-${index})`} strokeWidth="2" />
                                <line x1="360" y1="200" x2="390" y2="200" stroke={`url(#gauge-grad-${index})`} strokeWidth="2" />
                                <defs>
                                    <linearGradient id={`gauge-grad-${index}`} x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                                        <stop offset="60%" stopColor={feature.accentColor} stopOpacity="0.6" />
                                        <stop offset="100%" stopColor={feature.accentColor} stopOpacity="0.1" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3.5 sm:mb-4">
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: feature.accentColor }}
                                />
                                <span
                                    className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] uppercase"
                                    style={{ color: feature.accentColor }}
                                >
                                    {feature.eyebrow}
                                </span>
                            </div>

                            <h3 className="tracking-tight font-extrabold mb-4 select-none font-heading leading-tight">
                                <span className="block text-xl sm:text-2xl lg:text-[1.85rem] font-extrabold text-white tracking-tight leading-tight opacity-95">
                                    {feature.titleLine1 || feature.displayTitleLine1}
                                </span>
                                <span className="block text-3xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-extrabold tracking-tight leading-[0.92] my-1 bg-gradient-to-r bg-clip-text text-transparent filter drop-shadow-[0_2px_24px_rgba(99,102,241,0.25)]"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, #ffffff 15%, ${feature.accentColor} 85%)`
                                    }}
                                >
                                    {feature.heroWord || feature.displayTitleLine2}
                                </span>
                                {feature.titleLine3 && (
                                    <span className="block text-xl sm:text-2xl lg:text-[1.85rem] font-extrabold text-white tracking-tight leading-tight opacity-95">
                                        {feature.titleLine3}
                                    </span>
                                )}
                            </h3>

                            <p className="text-[14px] sm:text-[16px] text-slate-400 leading-relaxed max-w-lg mb-4 sm:mb-6 font-normal">
                                {feature.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-2">
                                {feature.tags.map((tag, tagIdx) => (
                                    <span
                                        key={tagIdx}
                                        className="px-3.5 py-1.5 rounded-full text-xs font-mono font-medium tracking-wide text-slate-300 border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-white/20 transition-colors"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="relative z-10 mt-auto">
                            <div
                                className="h-px w-full my-4 sm:my-6"
                                style={{
                                    background: `linear-gradient(to right, rgba(255,255,255,0.2), ${feature.accentColor}50, transparent)`
                                }}
                            />

                            <div className="flex items-center justify-between">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(feature.href)
                                    }}
                                    className="relative group inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 active:scale-[0.98] cursor-pointer"
                                    style={{
                                        boxShadow: `0 0 28px -4px ${feature.accentColor}80, 0 8px 20px -6px rgba(0,0,0,0.6)`
                                    }}
                                >
                                    <span>{feature.actionText}</span>
                                    <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </motion.div>
        </motion.div>
    )
}

export default function BurnVisionFeaturesCarousel(): JSX.Element {
    const navigate = useNavigate()
    const [activeIndex, setActiveIndex] = useState(0)
    const [, setDeckStatus] = useState<'stacking' | 'closing' | 'closed'>('stacking')
    const [isMobile, setIsMobile] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile, { passive: true })
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Track scroll progress of the entire container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    })

    // Physics spring smoothing: snappy, swift, and silky smooth with speed
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 135,
        damping: 22,
        mass: 0.28,
        restDelta: 0.0001
    })

    // Update active index and deck status based on smooth progress
    useEffect(() => {
        return smoothProgress.on('change', (progress) => {
            if (progress < 0.72) {
                setDeckStatus('stacking')
                if (progress < 0.16) setActiveIndex(0)
                else if (progress < 0.30) setActiveIndex(1)
                else if (progress < 0.44) setActiveIndex(2)
                else if (progress < 0.58) setActiveIndex(3)
                else if (progress < 0.72) setActiveIndex(4)
                else setActiveIndex(5)
            } else if (progress < 1.00) {
                setDeckStatus('closing')
                if (progress < 0.77) setActiveIndex(4)
                else if (progress < 0.82) setActiveIndex(3)
                else if (progress < 0.87) setActiveIndex(2)
                else if (progress < 0.92) setActiveIndex(1)
                else setActiveIndex(0)
            } else {
                setDeckStatus('closed')
                setActiveIndex(0)
            }
        })
    }, [smoothProgress])

    // Smooth scroll to card
    const scrollToCard = useCallback((targetIndex: number) => {
        if (!containerRef.current) return
        const containerRect = containerRef.current.getBoundingClientRect()
        const containerTop = window.scrollY + containerRect.top
        const totalHeight = containerRef.current.offsetHeight - window.innerHeight

        // Calculated target progress for card in Phase 1
        const targetProgress = targetIndex === 0 ? 0.01 : 0.02 + targetIndex * 0.14
        const targetY = containerTop + targetProgress * totalHeight

        window.scrollTo({
            top: Math.max(0, targetY),
            behavior: 'smooth'
        })
    }, [])

    const nextCard = useCallback(() => {
        const next = Math.min(features.length - 1, activeIndex + 1)
        scrollToCard(next)
    }, [activeIndex, scrollToCard])

    const prevCard = useCallback(() => {
        const prev = Math.max(0, activeIndex - 1)
        scrollToCard(prev)
    }, [activeIndex, scrollToCard])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
                nextCard()
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
                prevCard()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [nextCard, prevCard])

    const stackOffset = isMobile ? 18 : 22

    return (
        <section
            id="features"
            ref={containerRef}
            // Dedicated scroll track height: swift, snappy, effortless travel with zero dead zone
            className="relative w-full h-[340vh] select-none scroll-mt-28 md:scroll-mt-32"
        >
            {/* Header - What's happening / See the latest from BurnVision (Scrolls up normally) */}
            <div className="w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-4 sm:pb-6 z-10 flex flex-col justify-start">
                <div className="max-w-7xl xl:max-w-[1360px] 2xl:max-w-[1400px] mx-auto w-full">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-[4.5rem] xl:text-[5.25rem] font-extrabold tracking-tight text-[#0a2540] dark:text-white leading-[1.02] font-heading">
                                What's happening
                            </h2>
                            <h3 className="text-2xl sm:text-5xl md:text-6xl lg:text-[3.75rem] xl:text-[4.25rem] font-extrabold tracking-tight text-[#0a2540] dark:text-white leading-[1.05] font-heading mt-2 sm:mt-2">
                                See the latest from BurnVision.
                            </h3>
                        </div>

                        {/* Carousel Navigation Arrows */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 pb-1">
                            <button
                                onClick={prevCard}
                                disabled={activeIndex === 0}
                                aria-label="Previous card"
                                className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-slate-800 dark:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
                            >
                                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                            </button>
                            <button
                                onClick={nextCard}
                                disabled={activeIndex === features.length - 1}
                                aria-label="Next card"
                                className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-slate-800 dark:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
                            >
                                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pinned Sticky Stage: Anchors the cards deck */}
            <div className="sticky top-[70px] sm:top-[90px] w-full px-4 sm:px-6 lg:px-8 pb-4 sm:pb-8 z-10 flex flex-col justify-start">
                <div className="max-w-7xl xl:max-w-[1360px] 2xl:max-w-[1400px] mx-auto w-full">
                    {/* Cards Stacking Deck Stage */}
                    {/* Accommodates all stacked rims (5 * 22px = 110px) + expanded card height = ~650px+ */}
                    <div className="relative w-full h-[670px] sm:h-[680px] md:h-[690px] lg:h-[700px]">
                        {features.map((feature, index) => (
                            <CardItem
                                key={feature.id}
                                feature={feature}
                                index={index}
                                stackOffset={stackOffset}
                                progress={smoothProgress}
                                isMobile={isMobile}
                                onCardClick={scrollToCard}
                                navigate={navigate}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export { BurnVisionFeaturesCarousel as StackedFeaturesCards }
