import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Switch } from '../components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { DoorOpen, Plus, Edit2, Trash2, Users, Clock, Flame, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../services/api'

interface Room {
    id: number;
    name: string;
    max_participants: number;
    current_participants: number;
    duration_limit: number;
    min_calorie_goal: number;
    max_calorie_goal: number;
    is_active: boolean;
}

export default function RoomManagement(): JSX.Element {
    const [rooms, setRooms] = useState<Room[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [formData, setFormData] = useState({ name: '', max_participants: 20, duration_limit: 30, min_calorie_goal: 100, max_calorie_goal: 300 })

    useEffect(() => {
        fetchRooms()
    }, [])

    const fetchRooms = async () => {
        try {
            setLoading(true)
            const response = await api.get('/admin/rooms')
            setRooms(response.data.rooms || [])
        } catch (error) {
            console.error('Failed to fetch rooms:', error)
            setRooms([])
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (): Promise<void> => {
        try {
            if (editingRoom) {
                const response = await api.put(`/admin/rooms/${editingRoom.id}`, formData)
                setRooms(prev => prev.map(r => r.id === editingRoom.id ? response.data.room : r))
            } else {
                const response = await api.post('/admin/rooms', formData)
                setRooms(prev => [...prev, response.data.room])
            }
            setDialogOpen(false)
            setEditingRoom(null)
            setFormData({ name: '', max_participants: 20, duration_limit: 30, min_calorie_goal: 100, max_calorie_goal: 300 })
        } catch (error) {
            console.error('Failed to save room:', error)
        }
    }

    const openEditDialog = (room: Room): void => {
        setEditingRoom(room)
        setFormData({
            name: room.name,
            max_participants: room.max_participants,
            duration_limit: room.duration_limit,
            min_calorie_goal: room.min_calorie_goal,
            max_calorie_goal: room.max_calorie_goal
        })
        setDialogOpen(true)
    }

    const deleteRoom = async (id: number): Promise<void> => {
        try {
            await api.delete(`/admin/rooms/${id}`)
            setRooms(prev => prev.filter(r => r.id !== id))
        } catch (error) {
            console.error('Failed to delete room:', error)
        }
    }

    const toggleRoom = async (id: number, currentState: boolean): Promise<void> => {
        try {
            await api.put(`/admin/rooms/${id}`, { is_active: !currentState })
            setRooms(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentState } : r))
        } catch (error) {
            console.error('Failed to toggle room:', error)
        }
    }

    const totalRooms = rooms.length
    const activeRooms = rooms.filter(r => r.is_active).length
    const totalParticipants = rooms.reduce((sum, r) => sum + (r.current_participants || 0), 0)

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3"><DoorOpen className="w-8 h-8 text-primary" />Room Management</h1>
                    <p className="text-muted-foreground">Manage workout sessions and group challenges</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" onClick={() => { setEditingRoom(null); setFormData({ name: '', max_participants: 20, duration_limit: 30, min_calorie_goal: 100, max_calorie_goal: 300 }) }}>
                            <Plus className="w-4 h-4" />Create Room
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingRoom ? 'Edit Room' : 'Create New Room'}</DialogTitle>
                            <DialogDescription>Configure the workout session settings</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Room Name</Label>
                                <Input id="name" placeholder="e.g., Morning HIIT Challenge" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="max_participants">Max Participants</Label>
                                    <Input id="max_participants" type="number" value={formData.max_participants} onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration_limit">Duration (min)</Label>
                                    <Input id="duration_limit" type="number" value={formData.duration_limit} onChange={(e) => setFormData(prev => ({ ...prev, duration_limit: parseInt(e.target.value) }))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min_calorie_goal">Min Calorie Goal</Label>
                                    <Input id="min_calorie_goal" type="number" value={formData.min_calorie_goal} onChange={(e) => setFormData(prev => ({ ...prev, min_calorie_goal: parseInt(e.target.value) }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_calorie_goal">Max Calorie Goal</Label>
                                    <Input id="max_calorie_goal" type="number" value={formData.max_calorie_goal} onChange={(e) => setFormData(prev => ({ ...prev, max_calorie_goal: parseInt(e.target.value) }))} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit}>{editingRoom ? 'Save Changes' : 'Create Room'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="stat-card">
                    <CardContent className="p-4 flex items-center gap-3">
                        <DoorOpen className="w-8 h-8 text-primary" />
                        <div><p className="text-sm text-muted-foreground">Total Rooms</p><p className="text-2xl font-bold">{totalRooms}</p></div>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Clock className="w-8 h-8 text-green-500" />
                        <div><p className="text-sm text-muted-foreground">Active Rooms</p><p className="text-2xl font-bold">{activeRooms}</p></div>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-500" />
                        <div><p className="text-sm text-muted-foreground">Total Participants</p><p className="text-2xl font-bold">{totalParticipants}</p></div>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-card">
                <CardHeader><CardTitle>All Rooms</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rooms.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <DoorOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No rooms created yet</p>
                                    <p className="text-sm mt-2">Click "Create Room" to add your first workout room</p>
                                </div>
                            ) : (
                                rooms.map((room, index) => (
                                    <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="p-4 rounded-lg border border-border bg-secondary/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium">{room.name}</h3>
                                                <Badge variant={room.is_active ? 'success' : 'secondary'}>{room.is_active ? 'Active' : 'Inactive'}</Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {room.current_participants || 0}/{room.max_participants}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {room.duration_limit} min</span>
                                                <span className="flex items-center gap-1"><Flame className="w-4 h-4" /> {room.min_calorie_goal}-{room.max_calorie_goal} kcal</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch checked={room.is_active} onCheckedChange={() => toggleRoom(room.id, room.is_active)} />
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(room)}><Edit2 className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteRoom(room.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
