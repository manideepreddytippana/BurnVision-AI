import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export function LoadingBar() {
    const location = useLocation()
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        setIsLoading(true)
        setProgress(30)

        const timer1 = setTimeout(() => setProgress(70), 100)
        const timer2 = setTimeout(() => {
            setProgress(100)
            setTimeout(() => {
                setIsLoading(false)
                setProgress(0)
            }, 100)
        }, 100)

        window.scrollTo(0, 0)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
        }
    }, [location.pathname]) // Trigger on path change

    return (
        <AnimatePresence>
            {isLoading && (
                <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-transparent pointer-events-none">
                    <motion.div
                        initial={{ width: '0%', opacity: 1 }}
                        animate={{ width: `${progress}%`, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ ease: "easeInOut", duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    />
                </div>
            )}
        </AnimatePresence>
    )
}
