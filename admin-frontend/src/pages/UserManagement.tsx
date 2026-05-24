import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Users, Search, Trash2, Flame, Activity, Loader2, Pencil, X, Save, Eye, Calendar, Ruler, Scale, User as UserIcon, AlertTriangle, List, Dumbbell, Timer, Target, Zap, CheckCircle2, ChevronDown, Clock, Award, Brain } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

interface User {
    id: number;
    name: string;
    email: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    bmi?: number;
    fitness_level: string;
    total_sessions: number;
    total_calories_burned: number;
    created_at: string;
}

interface EditUserForm {
    name: string;
    email: string;
    age: number | '';
    gender: string;
    height: number | '';
    weight: number | '';
    fitness_level: string;
}

interface SessionData {
    id: number;
    session_date: string;
    total_calories: number;
    squat_reps: number;
    pushup_reps: number;
    lunge_reps: number;
    jumping_jack_reps: number;
    high_knee_reps: number;
    burpee_reps: number;
    plank_seconds: number;
    situp_reps: number;
    leg_raise_reps: number;
    bicycle_crunch_reps: number;
    total_reps: number;
    form_score: number;
    active_minutes: number;
    exercises_done: string;
    squat_calories: number;
    pushup_calories: number;
    lunge_calories: number;
    jumping_jack_calories: number;
    high_knee_calories: number;
    burpee_calories: number;
    plank_calories: number;
    situp_calories: number;
    leg_raise_calories: number;
    bicycle_crunch_calories: number;
}

interface PredictionData {
    id: number;
    prediction_type: 'standard' | 'advanced';
    predicted_calories: number;
    confidence_score: number;
    model_type: string;
    gender?: string;
    age?: number;
    height?: number;
    weight?: number;
    duration?: number;
    heart_rate?: number;
    body_temp?: number;
    workout_type?: string;
    exercise_name?: string;
    session_duration?: number;
    difficulty_level?: string;
    train_split?: number;
    created_at: string;
}

export default function UserManagement(): JSX.Element {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [fitnessFilter, setFitnessFilter] = useState('all')

    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editForm, setEditForm] = useState<EditUserForm>({
        name: '',
        email: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        fitness_level: ''
    })
    const [saving, setSaving] = useState(false)

    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [viewUser, setViewUser] = useState<User | null>(null)

    const [sessionsModalOpen, setSessionsModalOpen] = useState(false)
    const [userSessions, setUserSessions] = useState<SessionData[]>([])
    const [loadingSessions, setLoadingSessions] = useState(false)
    const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null)
    const [sessionUser, setSessionUser] = useState<User | null>(null)

    const [predictionsModalOpen, setPredictionsModalOpen] = useState(false)
    const [userPredictions, setUserPredictions] = useState<PredictionData[]>([])
    const [loadingPredictions, setLoadingPredictions] = useState(false)
    const [expandedPredictionId, setExpandedPredictionId] = useState<number | null>(null)
    const [predictionUser, setPredictionUser] = useState<User | null>(null)

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await api.get('/admin/users')
            setUsers(response.data.users || [])
        } catch (error) {
            console.error('Failed to fetch users:', error)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    const fetchUserSessions = async (user: User) => {
        setSessionUser(user)
        setSessionsModalOpen(true)
        setLoadingSessions(true)
        try {
            const response = await api.get(`/admin/users/${user.id}/sessions`)
            setUserSessions(response.data.sessions || [])
        } catch (error) {
            console.error('Failed to fetch user sessions:', error)
            setUserSessions([])
        } finally {
            setLoadingSessions(false)
        }
    }

    const fetchUserPredictions = async (user: User) => {
        setPredictionUser(user)
        setPredictionsModalOpen(true)
        setLoadingPredictions(true)
        try {
            const response = await api.get(`/admin/users/${user.id}/predictions`)
            setUserPredictions(response.data.predictions || [])
        } catch (error) {
            console.error('Failed to fetch user predictions:', error)
            setUserPredictions([])
        } finally {
            setLoadingPredictions(false)
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
        const matchesFitness = fitnessFilter === 'all' || user.fitness_level === fitnessFilter
        return matchesSearch && matchesFitness
    })

    const deleteUser = async (): Promise<void> => {
        if (!userToDelete) return

        setDeleting(true)
        try {
            await api.delete(`/admin/users/${userToDelete.id}`)
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
            setDeleteModalOpen(false)
            setUserToDelete(null)
        } catch (error) {
            console.error('Failed to delete user:', error)
        } finally {
            setDeleting(false)
        }
    }

    const openDeleteModal = (user: User) => {
        setUserToDelete(user)
        setDeleteModalOpen(true)
    }

    const closeDeleteModal = () => {
        setDeleteModalOpen(false)
        setUserToDelete(null)
    }

    const openEditModal = (user: User) => {
        setSelectedUser(user)
        setEditForm({
            name: user.name || '',
            email: user.email || '',
            age: user.age || '',
            gender: user.gender || '',
            height: user.height || '',
            weight: user.weight || '',
            fitness_level: user.fitness_level || 'beginner'
        })
        setEditModalOpen(true)
    }

    const closeEditModal = () => {
        setEditModalOpen(false)
        setSelectedUser(null)
        setEditForm({
            name: '',
            email: '',
            age: '',
            gender: '',
            height: '',
            weight: '',
            fitness_level: ''
        })
    }

    const handleEditFormChange = (field: keyof EditUserForm, value: string | number) => {
        setEditForm(prev => ({ ...prev, [field]: value }))
    }

    const openViewModal = (user: User) => {
        setViewUser(user)
        setViewModalOpen(true)
    }

    const closeViewModal = () => {
        setViewModalOpen(false)
        setViewUser(null)
    }

    const saveUserChanges = async () => {
        if (!selectedUser) return

        setSaving(true)
        try {
            const payload: Record<string, unknown> = {
                name: editForm.name,
                email: editForm.email,
                gender: editForm.gender,
                fitness_level: editForm.fitness_level
            }

            if (editForm.age !== '') payload.age = Number(editForm.age)
            if (editForm.height !== '') payload.height = Number(editForm.height)
            if (editForm.weight !== '') payload.weight = Number(editForm.weight)

            const response = await api.put(`/admin/users/${selectedUser.id}`, payload)

            // Update local state with the updated user
            setUsers(prev => prev.map(u =>
                u.id === selectedUser.id ? { ...u, ...response.data.user } : u
            ))

            closeEditModal()
        } catch (error) {
            console.error('Failed to update user:', error)
        } finally {
            setSaving(false)
        }
    }

    const getFitnessColor = (level: string): 'default' | 'secondary' | 'success' | 'warning' | 'info' => {
        switch (level) {
            case 'beginner': return 'info'
            case 'intermediate': return 'default'
            case 'advanced': return 'success'
            case 'athlete': return 'warning'
            default: return 'default'
        }
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold flex items-center gap-3"><Users className="w-8 h-8 text-primary" />User Management</h1>
                <p className="text-muted-foreground">View and manage registered platform users</p>
            </motion.div>

            <Card className="glass-card">
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <Select value={fitnessFilter} onValueChange={setFitnessFilter}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Fitness Level" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                                <SelectItem value="athlete">Athlete</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredUsers.map((user, index) => (
                                <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="p-4 rounded-lg border border-border bg-secondary/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium">{user.name}</h3>
                                            <Badge variant={getFitnessColor(user.fitness_level || 'beginner')}>{user.fitness_level || 'beginner'}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-lg font-bold flex items-center gap-1"><Activity className="w-4 h-4 text-blue-500" /> {user.total_sessions || 0}</p>
                                            <p className="text-xs text-muted-foreground">workouts</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> {user.total_calories_burned.toFixed(1)}</p>
                                            <p className="text-xs text-muted-foreground">calories</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => openViewModal(user)} className="hover:bg-yellow-500/20">
                                            <Eye className="w-4 h-4 text-yellow-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => fetchUserSessions(user)} className="hover:bg-purple-500/20" title="Workout History">
                                            <List className="w-4 h-4 text-purple-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => fetchUserPredictions(user)} className="hover:bg-teal-500/20" title="Prediction History">
                                            <Brain className="w-4 h-4 text-teal-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(user)} className="hover:bg-primary/20">
                                            <Pencil className="w-4 h-4 text-primary" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteModal(user)} className="hover:bg-red-500/20">
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                            {filteredUsers.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>{users.length === 0 ? 'No registered users yet' : 'No users match your search'}</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Pencil className="w-5 h-5 text-primary" />
                            Edit User Details
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => handleEditFormChange('name', e.target.value)}
                                placeholder="Enter name"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => handleEditFormChange('email', e.target.value)}
                                placeholder="Enter email"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-age">Age</Label>
                                <Input
                                    id="edit-age"
                                    type="number"
                                    value={editForm.age}
                                    onChange={(e) => handleEditFormChange('age', e.target.value ? Number(e.target.value) : '')}
                                    placeholder="Age"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-gender">Gender</Label>
                                <Select value={editForm.gender} onValueChange={(value) => handleEditFormChange('gender', value)}>
                                    <SelectTrigger id="edit-gender">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-height">Height (cm)</Label>
                                <Input
                                    id="edit-height"
                                    type="number"
                                    value={editForm.height}
                                    onChange={(e) => handleEditFormChange('height', e.target.value ? Number(e.target.value) : '')}
                                    placeholder="Height in cm"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-weight">Weight (kg)</Label>
                                <Input
                                    id="edit-weight"
                                    type="number"
                                    value={editForm.weight}
                                    onChange={(e) => handleEditFormChange('weight', e.target.value ? Number(e.target.value) : '')}
                                    placeholder="Weight in kg"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-fitness">Fitness Level</Label>
                            <Select value={editForm.fitness_level} onValueChange={(value) => handleEditFormChange('fitness_level', value)}>
                                <SelectTrigger id="edit-fitness">
                                    <SelectValue placeholder="Select fitness level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                    <SelectItem value="athlete">Athlete</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={closeEditModal} disabled={saving}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button onClick={saveUserChanges} disabled={saving} className="bg-primary hover:bg-primary/90">
                            {saving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Eye className="w-5 h-5 text-blue-500" />
                            User Details
                        </DialogTitle>
                    </DialogHeader>

                    {viewUser && (
                        <div className="space-y-4 py-4">
                            <div className="text-center pb-4 border-b border-border">
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                                    <UserIcon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold">{viewUser.name}</h3>
                                <p className="text-muted-foreground">{viewUser.email}</p>
                                <Badge variant={getFitnessColor(viewUser.fitness_level || 'beginner')} className="mt-2">
                                    {viewUser.fitness_level || 'beginner'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <Calendar className="w-4 h-4" />
                                        Age
                                    </div>
                                    <p className="font-semibold">{viewUser.age || 'Not set'} {viewUser.age ? 'years' : ''}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <UserIcon className="w-4 h-4" />
                                        Gender
                                    </div>
                                    <p className="font-semibold capitalize">{viewUser.gender || 'Not set'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <Ruler className="w-4 h-4" />
                                        Height
                                    </div>
                                    <p className="font-semibold">{viewUser.height ? `${viewUser.height} cm` : 'Not set'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                        <Scale className="w-4 h-4" />
                                        Weight
                                    </div>
                                    <p className="font-semibold">{viewUser.weight ? `${viewUser.weight} kg` : 'Not set'}</p>
                                </div>
                            </div>

                            {viewUser.bmi && (
                                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
                                    <p className="text-sm text-muted-foreground">BMI</p>
                                    <p className="text-2xl font-bold text-primary">{viewUser.bmi.toFixed(1)}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                                    <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                    <p className="text-2xl font-bold">{viewUser.total_sessions || 0}</p>
                                    <p className="text-xs text-muted-foreground">Total Workouts</p>
                                </div>
                                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                                    <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                                    <p className="text-2xl font-bold">{viewUser.total_calories_burned.toFixed(1)}</p>
                                    <p className="text-xs text-muted-foreground">Calories Burned</p>
                                </div>
                            </div>

                            <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border">
                                Joined: {viewUser.created_at ? new Date(viewUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeViewModal} className="w-full">
                            <X className="w-4 h-4 mr-2" />
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={sessionsModalOpen} onOpenChange={setSessionsModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Activity className="w-5 h-5 text-primary" />
                            Workout History - {sessionUser?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 my-4">
                        {loadingSessions ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : userSessions.length > 0 ? (
                            <div className="space-y-3">
                                {userSessions.map((session, index) => {
                                    const isExpanded = expandedSessionId === session.id
                                    const caloriesPerMinute = session.active_minutes > 0
                                        ? (session.total_calories / session.active_minutes).toFixed(2)
                                        : '0'
                                    const repsPerMinute = session.active_minutes > 0
                                        ? (session.total_reps / session.active_minutes).toFixed(1)
                                        : '0'
                                    return (
                                        <motion.div
                                            key={session.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="rounded-xl border border-border bg-secondary/30 overflow-hidden"
                                        >
                                            <div
                                                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                                onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                                                            <Dumbbell className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold gradient-text">
                                                                    {session.total_calories.toFixed(1)}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground">kcal</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(session.session_date).toLocaleDateString()}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Timer className="w-3 h-3" />
                                                                    {session.active_minutes.toFixed(1)} min
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {session.form_score.toFixed(0)}%
                                                        </div>
                                                        <motion.div
                                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        </motion.div>
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="border-t border-white/10 p-4 space-y-5 bg-black/20">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-3">Session Overview</h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Flame className="w-3 h-3 text-orange-500" />
                                                                            Total Calories
                                                                        </div>
                                                                        <p className="text-xl font-bold text-orange-400">{session.total_calories.toFixed(1)}</p>
                                                                        <p className="text-xs text-muted-foreground">kcal burned</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Clock className="w-3 h-3 text-blue-500" />
                                                                            Duration
                                                                        </div>
                                                                        <p className="text-xl font-bold text-blue-400">{session.active_minutes.toFixed(1)}</p>
                                                                        <p className="text-xs text-muted-foreground">minutes</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Target className="w-3 h-3 text-purple-500" />
                                                                            Total Reps
                                                                        </div>
                                                                        <p className="text-xl font-bold text-purple-400">{session.total_reps}</p>
                                                                        <p className="text-xs text-muted-foreground">repetitions</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Award className="w-3 h-3 text-green-500" />
                                                                            Form Score
                                                                        </div>
                                                                        <p className="text-xl font-bold text-green-400">{session.form_score.toFixed(0)}%</p>
                                                                        <p className="text-xs text-muted-foreground">accuracy</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Dumbbell className="w-3 h-3 text-cyan-500" />
                                                                            Exercises
                                                                        </div>
                                                                        <p className="text-sm font-bold text-cyan-400">{session.exercises_done || 'Mixed'}</p>
                                                                        <p className="text-xs text-muted-foreground">workout</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-3">Exercise Breakdown</h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    {/* Squats */}
                                                                    {session.squat_reps > 0 && (
                                                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                                                        <Target className="w-4 h-4 text-green-500" />
                                                                                    </div>
                                                                                    <span className="font-medium">Squats</span>
                                                                                </div>
                                                                                <Badge variant="success">{session.squat_reps} reps</Badge>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground">Calories</span>
                                                                                <span className="font-medium text-orange-400">{session.squat_calories.toFixed(1)} kcal</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Pushups */}
                                                                    {session.pushup_reps > 0 && (
                                                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                                                        <Zap className="w-4 h-4 text-blue-500" />
                                                                                    </div>
                                                                                    <span className="font-medium">Pushups</span>
                                                                                </div>
                                                                                <Badge variant="info">{session.pushup_reps} reps</Badge>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground">Calories</span>
                                                                                <span className="font-medium text-orange-400">{session.pushup_calories.toFixed(1)} kcal</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Lunges */}
                                                                    {session.lunge_reps > 0 && (
                                                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                                                        <Target className="w-4 h-4 text-purple-500" />
                                                                                    </div>
                                                                                    <span className="font-medium">Lunges</span>
                                                                                </div>
                                                                                <Badge className="bg-purple-500/20 text-purple-400">{session.lunge_reps} reps</Badge>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground">Calories</span>
                                                                                <span className="font-medium text-orange-400">{session.lunge_calories?.toFixed(1) || 0} kcal</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Jumping Jacks */}
                                                                    {session.jumping_jack_reps > 0 && (
                                                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                                                                        <Zap className="w-4 h-4 text-yellow-500" />
                                                                                    </div>
                                                                                    <span className="font-medium">Jumping Jacks</span>
                                                                                </div>
                                                                                <Badge className="bg-yellow-500/20 text-yellow-400">{session.jumping_jack_reps} reps</Badge>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground">Calories</span>
                                                                                <span className="font-medium text-orange-400">{session.jumping_jack_calories?.toFixed(1) || 0} kcal</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* High Knees */}
                                                                    {session.high_knee_reps > 0 && (
                                                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                                                                        <Target className="w-4 h-4 text-orange-500" />
                                                                                    </div>
                                                                                    <span className="font-medium">High Knees</span>
                                                                                </div>
                                                                                <Badge className="bg-orange-500/20 text-orange-400">{session.high_knee_reps} reps</Badge>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground">Calories</span>
                                                                                <span className="font-medium text-orange-400">{session.high_knee_calories?.toFixed(1) || 0} kcal</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Burpees */}
                                                                    {session.burpee_reps > 0 && (
                                                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                                                                        <Zap className="w-4 h-4 text-red-500" />
                                                                                    </div>
                                                                                    <span className="font-medium">Burpees</span>
                                                                                </div>
                                                                                <Badge className="bg-red-500/20 text-red-400">{session.burpee_reps} reps</Badge>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground">Calories</span>
                                                                                <span className="font-medium text-orange-400">{session.burpee_calories?.toFixed(1) || 0} kcal</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Plank */}
                                                                    {session.plank_seconds > 0 && (
                                                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                                                                        <Timer className="w-4 h-4 text-cyan-500" />
                                                                                    </div>
                                                                                    <span className="font-medium">Plank</span>
                                                                                </div>
                                                                                <Badge className="bg-cyan-500/20 text-cyan-400">{session.plank_seconds.toFixed(0)}s</Badge>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground">Calories</span>
                                                                                <span className="font-medium text-orange-400">{session.plank_calories?.toFixed(1) || 0} kcal</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Sit-ups */}
                                                                    {session.situp_reps > 0 && (
                                                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                                                        <Target className="w-4 h-4 text-indigo-500" />
                                                                                    </div>
                                                                                    <span className="font-medium">Sit-ups</span>
                                                                                </div>
                                                                                <Badge className="bg-indigo-500/20 text-indigo-400">{session.situp_reps} reps</Badge>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground">Calories</span>
                                                                                <span className="font-medium text-orange-400">{session.situp_calories?.toFixed(1) || 0} kcal</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Leg Raises */}
                                                                    {session.leg_raise_reps > 0 && (
                                                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                                                                        <Target className="w-4 h-4 text-pink-500" />
                                                                                    </div>
                                                                                    <span className="font-medium">Leg Raises</span>
                                                                                </div>
                                                                                <Badge className="bg-pink-500/20 text-pink-400">{session.leg_raise_reps} reps</Badge>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground">Calories</span>
                                                                                <span className="font-medium text-orange-400">{session.leg_raise_calories?.toFixed(1) || 0} kcal</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Bicycle Crunches */}
                                                                    {session.bicycle_crunch_reps > 0 && (
                                                                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                                                                        <Target className="w-4 h-4 text-rose-500" />
                                                                                    </div>
                                                                                    <span className="font-medium">Bicycle Crunches</span>
                                                                                </div>
                                                                                <Badge className="bg-rose-500/20 text-rose-400">{session.bicycle_crunch_reps} reps</Badge>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground">Calories</span>
                                                                                <span className="font-medium text-orange-400">{session.bicycle_crunch_calories?.toFixed(1) || 0} kcal</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Performance Metrics */}
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Metrics</h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <p className="text-xs text-muted-foreground">Calories/min</p>
                                                                        <p className="text-lg font-bold text-primary">{caloriesPerMinute}</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5">
                                                                        <p className="text-xs text-muted-foreground">Reps/min</p>
                                                                        <p className="text-lg font-bold">{repsPerMinute}</p>
                                                                    </div>
                                                                    {session.squat_calories > 0 && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Squat Cal</p>
                                                                            <p className="text-lg font-bold text-green-400">{session.squat_calories.toFixed(1)}</p>
                                                                        </div>
                                                                    )}
                                                                    {session.pushup_calories > 0 && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Pushup Cal</p>
                                                                            <p className="text-lg font-bold text-blue-400">{session.pushup_calories.toFixed(1)}</p>
                                                                        </div>
                                                                    )}
                                                                    {session.lunge_calories > 0 && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Lunge Cal</p>
                                                                            <p className="text-lg font-bold text-purple-400">{session.lunge_calories.toFixed(1)}</p>
                                                                        </div>
                                                                    )}
                                                                    {session.jumping_jack_calories > 0 && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">JJ Cal</p>
                                                                            <p className="text-lg font-bold text-yellow-400">{session.jumping_jack_calories.toFixed(1)}</p>
                                                                        </div>
                                                                    )}
                                                                    {session.high_knee_calories > 0 && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">High Knee Cal</p>
                                                                            <p className="text-lg font-bold text-orange-400">{session.high_knee_calories.toFixed(1)}</p>
                                                                        </div>
                                                                    )}
                                                                    {session.burpee_calories > 0 && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Burpee Cal</p>
                                                                            <p className="text-lg font-bold text-red-400">{session.burpee_calories.toFixed(1)}</p>
                                                                        </div>
                                                                    )}
                                                                    {session.plank_calories > 0 && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Plank Cal</p>
                                                                            <p className="text-lg font-bold text-cyan-400">{session.plank_calories.toFixed(1)}</p>
                                                                        </div>
                                                                    )}
                                                                    {session.situp_calories > 0 && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Situp Cal</p>
                                                                            <p className="text-lg font-bold text-indigo-400">{session.situp_calories.toFixed(1)}</p>
                                                                        </div>
                                                                    )}
                                                                    {session.leg_raise_calories > 0 && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Leg Raise Cal</p>
                                                                            <p className="text-lg font-bold text-pink-400">{session.leg_raise_calories.toFixed(1)}</p>
                                                                        </div>
                                                                    )}
                                                                    {session.bicycle_crunch_calories > 0 && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">BC Cal</p>
                                                                            <p className="text-lg font-bold text-rose-400">{session.bicycle_crunch_calories.toFixed(1)}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Session Info  */}
                                                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {new Date(session.session_date).toLocaleDateString('en-US', {
                                                                        weekday: 'long',
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    })}
                                                                </div>
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm">
                                                                    <Clock className="w-4 h-4" />
                                                                    {new Date(session.session_date).toLocaleTimeString('en-US', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </div>
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    Form Score: {session.form_score.toFixed(0)}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No workout sessions found for this user</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSessionsModalOpen(false)} className="w-full">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={predictionsModalOpen} onOpenChange={setPredictionsModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Brain className="w-5 h-5 text-teal-500" />
                            Prediction History - {predictionUser?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 my-4">
                        {loadingPredictions ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : userPredictions.length > 0 ? (
                            <div className="space-y-3">
                                {userPredictions.map((prediction, index) => {
                                    const isExpanded = expandedPredictionId === prediction.id
                                    return (
                                        <motion.div
                                            key={`${prediction.prediction_type}-${prediction.id}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="rounded-xl border border-border bg-secondary/30 overflow-hidden"
                                        >
                                            <div
                                                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                                onClick={() => setExpandedPredictionId(isExpanded ? null : prediction.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${prediction.prediction_type === 'advanced' ? 'bg-gradient-to-br from-teal-500/30 to-cyan-500/30' : 'bg-gradient-to-br from-violet-500/30 to-purple-500/30'}`}>
                                                            <Brain className={`w-5 h-5 ${prediction.prediction_type === 'advanced' ? 'text-teal-500' : 'text-violet-500'}`} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold gradient-text">
                                                                    {prediction.predicted_calories?.toFixed(1) || '0'}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground">kcal predicted</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {prediction.created_at ? new Date(prediction.created_at).toLocaleDateString() : 'N/A'}
                                                                </span>
                                                                <Badge className={`text-[10px] px-1.5 py-0 ${prediction.prediction_type === 'advanced' ? 'bg-teal-500/20 text-teal-400' : 'bg-violet-500/20 text-violet-400'}`}>
                                                                    {prediction.prediction_type}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {((prediction.confidence_score || 0) * 100).toFixed(0)}%
                                                        </div>
                                                        <motion.div
                                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        </motion.div>
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="border-t border-white/10 p-4 space-y-5 bg-black/20">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-3">Prediction Overview</h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Flame className="w-3 h-3 text-orange-500" />
                                                                            Predicted Calories
                                                                        </div>
                                                                        <p className="text-xl font-bold text-orange-400">{prediction.predicted_calories?.toFixed(1) || '0'}</p>
                                                                        <p className="text-xs text-muted-foreground">kcal</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Target className="w-3 h-3 text-blue-500" />
                                                                            Confidence
                                                                        </div>
                                                                        <p className="text-xl font-bold text-blue-400">{((prediction.confidence_score || 0) * 100).toFixed(1)}%</p>
                                                                        <p className="text-xs text-muted-foreground">accuracy</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Zap className="w-3 h-3 text-purple-500" />
                                                                            Model
                                                                        </div>
                                                                        <p className="text-sm font-bold text-purple-400 capitalize">{prediction.model_type?.replace('_', ' ') || 'N/A'}</p>
                                                                        <p className="text-xs text-muted-foreground">algorithm</p>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                                            <Award className="w-3 h-3 text-green-500" />
                                                                            Train Split
                                                                        </div>
                                                                        <p className="text-xl font-bold text-green-400">{prediction.train_split ? `${(prediction.train_split * 100).toFixed(0)}%` : '80%'}</p>
                                                                        <p className="text-xs text-muted-foreground">train ratio</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Input Parameters */}
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-3">Input Parameters</h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                                    {prediction.gender && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Gender</p>
                                                                            <p className="text-sm font-bold capitalize">{prediction.gender}</p>
                                                                        </div>
                                                                    )}
                                                                    {prediction.age && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Age</p>
                                                                            <p className="text-sm font-bold">{prediction.age} yrs</p>
                                                                        </div>
                                                                    )}
                                                                    {prediction.height && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Height</p>
                                                                            <p className="text-sm font-bold">{prediction.height} {prediction.prediction_type === 'advanced' ? 'm' : 'cm'}</p>
                                                                        </div>
                                                                    )}
                                                                    {prediction.weight && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Weight</p>
                                                                            <p className="text-sm font-bold">{prediction.weight} kg</p>
                                                                        </div>
                                                                    )}
                                                                    {(prediction.duration || prediction.session_duration) && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Duration</p>
                                                                            <p className="text-sm font-bold">{prediction.duration || prediction.session_duration} min</p>
                                                                        </div>
                                                                    )}
                                                                    {prediction.heart_rate && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Heart Rate</p>
                                                                            <p className="text-sm font-bold">{prediction.heart_rate} bpm</p>
                                                                        </div>
                                                                    )}
                                                                    {prediction.body_temp && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Body Temp</p>
                                                                            <p className="text-sm font-bold">{prediction.body_temp}°C</p>
                                                                        </div>
                                                                    )}
                                                                    {prediction.workout_type && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Workout Type</p>
                                                                            <p className="text-sm font-bold capitalize">{prediction.workout_type}</p>
                                                                        </div>
                                                                    )}
                                                                    {prediction.exercise_name && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Exercise</p>
                                                                            <p className="text-sm font-bold capitalize">{prediction.exercise_name}</p>
                                                                        </div>
                                                                    )}
                                                                    {prediction.difficulty_level && (
                                                                        <div className="p-3 rounded-lg bg-white/5">
                                                                            <p className="text-xs text-muted-foreground">Difficulty</p>
                                                                            <p className="text-sm font-bold capitalize">{prediction.difficulty_level}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Timestamp */}
                                                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {prediction.created_at ? new Date(prediction.created_at).toLocaleDateString('en-US', {
                                                                        weekday: 'long',
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    }) : 'Unknown date'}
                                                                </div>
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm">
                                                                    <Clock className="w-4 h-4" />
                                                                    {prediction.created_at ? new Date(prediction.created_at).toLocaleTimeString('en-US', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    }) : 'Unknown time'}
                                                                </div>
                                                                <Badge className={`${prediction.prediction_type === 'advanced' ? 'bg-teal-500/20 text-teal-400' : 'bg-violet-500/20 text-violet-400'}`}>
                                                                    {prediction.prediction_type === 'advanced' ? 'Advanced Prediction' : 'Standard Prediction'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No predictions found for this user</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPredictionsModalOpen(false)} className="w-full">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Delete User
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-lg font-medium mb-2">Are you sure you want to delete this user?</p>
                            {userToDelete && (
                                <div className="p-3 rounded-lg bg-secondary/50 border border-border mt-4">
                                    <p className="font-semibold">{userToDelete.name}</p>
                                    <p className="text-sm text-muted-foreground">{userToDelete.email}</p>
                                </div>
                            )}
                            <p className="text-sm text-muted-foreground mt-4">
                                This action cannot be undone. All user data, workout sessions, and statistics will be permanently deleted.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="flex-1  hover:bg-blue-600 hover:text-white" onClick={closeDeleteModal} disabled={deleting} >
                            No
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteUser}
                            disabled={deleting}
                            className="flex-1 bg-red-500 hover:bg-red-600"
                        >
                            {deleting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
