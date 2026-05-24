import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const TOTAL_FRAMES = 240;
const SCROLL_HEIGHT_MULTIPLIER = 6; 

const framePaths = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return `/pushups/ezgif-frame-${num}.jpg`;
});



export default function CinematicScrollytelling() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [hasRenderError, setHasRenderError] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const rafRef = useRef<number>(0);
    const currentFrameRef = useRef(0);

    useEffect(() => {
        let loadedCount = 0;
        const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

        const onImageLoad = () => {
            loadedCount++;
            setLoadProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100));
            if (loadedCount === TOTAL_FRAMES) {
                imagesRef.current = images;
                setImagesLoaded(true);
                drawFrame(0);
            }
        };

        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = framePaths[i];
            img.onload = onImageLoad;
            img.onerror = onImageLoad; 
            images[i] = img;
        }

        return () => {
            images.forEach(img => {
                img.onload = null;
                img.onerror = null;
            });
        };
    }, []);

    const drawFrame = useCallback((frameIndex: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = imagesRef.current[frameIndex];
        if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;

      
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || (window.innerHeight - 72);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (dpr !== 1) {
            ctx.scale(dpr, dpr);
        }

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = w / h;
        let drawW, drawH, drawX, drawY;

        if (canvasRatio > imgRatio) {
            drawW = w;
            drawH = w / imgRatio;
            drawX = 0;
            drawY = (h - drawH) / 2;
        } else {
            drawH = h;
            drawW = h * imgRatio;
            drawX = (w - drawW) / 2;
            drawY = 0;
        }

        try {
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } catch {
            setHasRenderError(true);
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const containerTop = rect.top;
            const containerHeight = rect.height;
            const viewH = window.innerHeight;

            const rawProgress = -containerTop / (containerHeight - viewH);
            const progress = Math.max(0, Math.min(1, rawProgress));

            setScrollProgress(progress);

            const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)));

            if (frameIndex !== currentFrameRef.current && imagesRef.current.length > 0 && !hasRenderError) {
                currentFrameRef.current = frameIndex;
                cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(() => drawFrame(frameIndex));
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        const handleResize = () => {
            if (imagesRef.current.length > 0) {
                drawFrame(currentFrameRef.current);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(rafRef.current);
        };
    }, [drawFrame, hasRenderError, imagesLoaded]);

    const phases = useMemo(() => {
        const p = scrollProgress;
        return {
            arrival: {
                active: p >= 0 && p <= 0.22,
                opacity: p <= 0.15 ? 1 : Math.max(0, 1 - (p - 0.15) / 0.07),
                blur: p <= 0.15 ? 0 : (p - 0.15) * 60,
            },
            momentum: {
                active: p >= 0.18 && p <= 0.47,
                opacity:
                    p < 0.2
                        ? (p - 0.18) / 0.02
                        : p > 0.42
                            ? Math.max(0, 1 - (p - 0.42) / 0.05)
                            : 1,
                blur: p > 0.42 ? (p - 0.42) * 40 : 0,
            },
            antigravity: {
                active: p >= 0.43 && p <= 0.72,
                opacity:
                    p < 0.45
                        ? (p - 0.43) / 0.02
                        : p > 0.67
                            ? Math.max(0, 1 - (p - 0.67) / 0.05)
                            : 1,
                wordProgress: p >= 0.45 && p <= 0.7 ? (p - 0.45) / 0.25 : 0,
            },
            peak: {
                active: p >= 0.68 && p <= 0.92,
                opacity:
                    p < 0.7
                        ? (p - 0.68) / 0.02
                        : p > 0.88
                            ? Math.max(0, 1 - (p - 0.88) / 0.04)
                            : 1,
                blur: p > 0.88 ? (p - 0.88) * 30 : 0,
                bloom: p >= 0.7 && p <= 0.9 ? (p - 0.7) / 0.2 : 0,
            },
            resolution: {
                active: p >= 0.88,
                opacity: p < 0.9 ? (p - 0.88) / 0.02 : 1,
            },
            grain: 0.04 + p * 0.03,
            vignette: 0.3 + p * 0.2,
            warmth: Math.min(1, p * 1.3),
            motionBlur: p >= 0.7 && p <= 0.9 ? (p - 0.7) * 5 : 0,
            lensFlare:
                p < 0.2 ? p * 2 :
                    p < 0.5 ? 0.4 + (p - 0.2) * 1.5 :
                        p < 0.8 ? 0.85 :
                            0.85 - (p - 0.8) * 2,
            desaturate: p >= 0.45 && p <= 0.7 ? Math.min(0.5, (p - 0.45) * 2) : 0,
        };
    }, [scrollProgress]);

    if (hasRenderError) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className="cinematic-scroll-container"
            style={{ height: `${SCROLL_HEIGHT_MULTIPLIER * 100}vh` }}
        >
            {/* Loading overlay */}
            {!imagesLoaded && (
                <div className="cinematic-loader">
                    <div className="cinematic-loader-inner">
                        <div className="cinematic-loader-bar">
                            <div
                                className="cinematic-loader-fill"
                                style={{ width: `${loadProgress}%` }}
                            />
                        </div>
                        <p className="cinematic-loader-text">
                            {loadProgress < 100 ? `Loading... ${loadProgress}%` : 'Initializing...'}
                        </p>
                    </div>
                </div>
            )}

            <div className="cinematic-sticky">
                <canvas
                    ref={canvasRef}
                    className="cinematic-canvas"
                    style={{
                        filter: `
              saturate(${1 - phases.desaturate})
              contrast(${1 + phases.warmth * 0.08})
              brightness(${1 + phases.peak.bloom * 0.15})
              blur(${phases.motionBlur}px)
            `,
                    }}
                />

                <div
                    className="cinematic-grain"
                    style={{ opacity: phases.grain }}
                />

                <div
                    className="cinematic-warm-overlay"
                    style={{ opacity: 0.08 + phases.warmth * 0.12 }}
                />

                <div
                    className="cinematic-vignette"
                    style={{
                        background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${phases.vignette}) 100%)`,
                    }}
                />

                <div
                    className="cinematic-lens-flare"
                    style={{
                        opacity: phases.lensFlare * 0.6,
                        transform: `translate(-50%, -50%) scale(${1 + phases.lensFlare * 0.5})`,
                    }}
                />

                {scrollProgress <= 0.28 && (
                    <div
                        className="cinematic-intro-text"
                        style={{
                            opacity: scrollProgress <= 0.2 ? 1 : Math.max(0, 1 - (scrollProgress - 0.2) / 0.08),
                        }}
                    >
                        <h2 className="cinematic-intro-headline">Let's burn some calories</h2>
                        <p className="cinematic-intro-sub">Join us</p>
                    </div>
                )}

                {phases.momentum.active && (
                    <div className="cinematic-particles" style={{ opacity: phases.momentum.opacity * 0.7 }}>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div
                                key={i}
                                className="cinematic-particle"
                                style={{
                                    left: `${10 + Math.random() * 80}%`,
                                    top: `${10 + Math.random() * 80}%`,
                                    animationDelay: `${i * 0.3}s`,
                                    animationDuration: `${3 + Math.random() * 4}s`,
                                    width: `${2 + Math.random() * 3}px`,
                                    height: `${2 + Math.random() * 3}px`,
                                }}
                            />
                        ))}
                    </div>
                )}

                {phases.antigravity.active && (
                    <div
                        className="cinematic-volumetric-glow"
                        style={{
                            opacity: phases.antigravity.opacity * 0.5,
                            transform: `scale(${1 + phases.antigravity.wordProgress * 0.5})`,
                        }}
                    />
                )}

                {phases.peak.active && (
                    <div
                        className="cinematic-sun-bloom"
                        style={{
                            opacity: phases.peak.bloom * 0.7,
                            transform: `translate(-50%, -50%) scale(${1 + phases.peak.bloom * 2})`,
                        }}
                    />
                )}


                {phases.resolution.active && (
                    <div
                        className="cinematic-text-center"
                        style={{
                            opacity: phases.resolution.opacity,
                        }}
                    >
                        <h2 className="cinematic-headline cinematic-headline-final">Keep Moving.</h2>
                        <div className="cinematic-cta-area">
                            <span className="cinematic-cta-text">Begin your journey</span>
                            <div className="cinematic-cta-line" />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
