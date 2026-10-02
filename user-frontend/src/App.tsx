import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/ui/toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import LiveWorkout from './pages/LiveWorkout'
import Profile from './pages/Profile'
import Insights from './pages/Insights'
import Alerts from './pages/Alerts'
import ExerciseStats from './pages/ExerciseStats'
import CaloriePrediction from './pages/CaloriePrediction'
import AdvancedCaloriePrediction from './pages/AdvancedCaloriePrediction'
import AllPredictions from './pages/AllPredictions'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import ModelMetrics from './pages/ModelMetrics'
import RealtimeInsights from './pages/RealtimeInsights'
import ProtectedRoute from './components/ProtectedRoute'
import { PageTitle } from './components/ui/PageTitle'
import { LoadingBar } from './components/ui/LoadingBar'

function App(): JSX.Element {
    return (
        <ThemeProvider defaultTheme="dark">
            <AuthProvider>
                <ToastProvider>
                <Router>
                    <PageTitle />
                    <LoadingBar />
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/workout" element={<LiveWorkout />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/insights" element={<Insights />} />
                            <Route path="/alerts" element={<Alerts />} />
                            <Route path="/stats" element={<ExerciseStats />} />
                            <Route path="/calorie-predict" element={<CaloriePrediction />} />
                            <Route path="/advanced-calorie-predict" element={<AdvancedCaloriePrediction />} />
                            <Route path="/all-predictions" element={<AllPredictions />} />
                            <Route path="/model-metrics" element={<ModelMetrics />} />
                            <Route path="/realtime-insights" element={<RealtimeInsights />} />
                        </Route>
                    </Routes>
                </Router>
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
