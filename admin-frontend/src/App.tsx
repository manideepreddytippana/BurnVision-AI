import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import RoomManagement from './pages/RoomManagement'
import UserManagement from './pages/UserManagement'
import AlertsOverview from './pages/AlertsOverview'
import Settings from './pages/Settings'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

function App(): JSX.Element {
    return (
        <AuthProvider>
            <Router basename="/admin">
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Login />} />

                    <Route element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/rooms" element={<RoomManagement />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/alerts" element={<AlertsOverview />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App
