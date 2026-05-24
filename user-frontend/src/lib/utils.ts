import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}

export function formatCalories(calories: number): string {
    if (calories >= 1000) {
        return `${(calories / 1000).toFixed(1)}k`
    }
    return calories.toFixed(0)
}

export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date)
}

interface BMICategory {
    label: string;
    color: string;
}

export function calculateBMI(weight: number, heightCm: number): number {
    const heightM = heightCm / 100
    return weight / (heightM * heightM)
}

export function getBMICategory(bmi: number): BMICategory {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-yellow-500' }
    if (bmi < 25) return { label: 'Normal', color: 'text-green-500' }
    if (bmi < 30) return { label: 'Overweight', color: 'text-orange-500' }
    return { label: 'Obese', color: 'text-red-500' }
}

export function getAlertSeverityColor(severity: string): string {
    switch (severity) {
        case 'critical':
            return 'bg-red-500/20 text-red-500 border-red-500/50'
        case 'warning':
            return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'
        case 'info':
            return 'bg-blue-500/20 text-blue-500 border-blue-500/50'
        case 'success':
            return 'bg-green-500/20 text-green-500 border-green-500/50'
        default:
            return 'bg-gray-500/20 text-gray-500 border-gray-500/50'
    }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null
            func(...args)
        }

        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(later, wait)
    }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => {
                inThrottle = false
            }, limit)
        }
    }
}
