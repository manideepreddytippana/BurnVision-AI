import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    // Base path for the app - served from /admin/
    base: '/admin/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3001,
        host: true,
        allowedHosts: true,
        // Handle SPA routing - return index.html for all routes
        middlewareMode: false,
    },
    // Enable SPA fallback for dev server
    appType: 'spa',
})
