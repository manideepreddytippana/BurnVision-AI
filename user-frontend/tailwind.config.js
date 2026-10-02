/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Inter', 'sans-serif'],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                success: {
                    DEFAULT: "hsl(142, 76%, 36%)",
                    foreground: "hsl(0, 0%, 100%)",
                },
                warning: {
                    DEFAULT: "hsl(38, 92%, 50%)",
                    foreground: "hsl(0, 0%, 0%)",
                },
                info: {
                    DEFAULT: "hsl(199, 89%, 48%)",
                    foreground: "hsl(0, 0%, 100%)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
                "pulse-glow": {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" },
                    "50%": { boxShadow: "0 0 40px rgba(139, 92, 246, 0.6)" },
                },
                "slide-in": {
                    from: { transform: "translateX(-100%)", opacity: 0 },
                    to: { transform: "translateX(0)", opacity: 1 },
                },
                "fade-up": {
                    from: { transform: "translateY(20px)", opacity: 0 },
                    to: { transform: "translateY(0)", opacity: 1 },
                },
                "counter-spin": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "pulse-glow": "pulse-glow 2s infinite",
                "slide-in": "slide-in 0.5s ease-out",
                "fade-up": "fade-up 0.5s ease-out",
                "counter-spin": "counter-spin 3s linear infinite",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "hero-gradient": "linear-gradient(135deg, hsl(263, 70%, 50%) 0%, hsl(199, 89%, 48%) 100%)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
