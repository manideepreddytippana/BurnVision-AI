import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Settings as SettingsIcon, AlertTriangle, Bell, Database, Save } from 'lucide-react'
import { motion } from 'framer-motion'

interface SettingsState {
    fatigueThreshold: number;
    overtrainingDays: number;
    injuryRiskThreshold: number;
    emailNotifications: boolean;
    pushNotifications: boolean;
    autoBackup: boolean;
    dataRetention: number;
    maxConcurrentSessions: number;
}

export default function Settings(): JSX.Element {
    const [settings, setSettings] = useState<SettingsState>({
        fatigueThreshold: 75,
        overtrainingDays: 5,
        injuryRiskThreshold: 80,
        emailNotifications: true,
        pushNotifications: false,
        autoBackup: true,
        dataRetention: 90,
        maxConcurrentSessions: 10
    })
    const [saved, setSaved] = useState(false)

    const handleSave = (): void => {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold flex items-center gap-3"><SettingsIcon className="w-8 h-8 text-primary" />Settings</h1>
                <p className="text-muted-foreground">Configure platform settings and thresholds</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" />Alert Thresholds</CardTitle>
                        <CardDescription>Configure when health alerts are triggered</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fatigueThreshold">Fatigue Alert (%)</Label>
                                <Input id="fatigueThreshold" type="number" min="50" max="100" value={settings.fatigueThreshold} onChange={(e) => setSettings(prev => ({ ...prev, fatigueThreshold: parseInt(e.target.value) }))} />
                                <p className="text-xs text-muted-foreground">Trigger when form drops below this %</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="overtrainingDays">Overtraining Days</Label>
                                <Input id="overtrainingDays" type="number" min="3" max="14" value={settings.overtrainingDays} onChange={(e) => setSettings(prev => ({ ...prev, overtrainingDays: parseInt(e.target.value) }))} />
                                <p className="text-xs text-muted-foreground">Consecutive days before warning</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="injuryRiskThreshold">Injury Risk (%)</Label>
                                <Input id="injuryRiskThreshold" type="number" min="50" max="100" value={settings.injuryRiskThreshold} onChange={(e) => setSettings(prev => ({ ...prev, injuryRiskThreshold: parseInt(e.target.value) }))} />
                                <p className="text-xs text-muted-foreground">Risk score to trigger alert</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Notification Settings</CardTitle>
                        <CardDescription>Configure how notifications are sent</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="emailNotifications">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Send critical alerts via email</p>
                            </div>
                            <Switch id="emailNotifications" checked={settings.emailNotifications} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="pushNotifications">Push Notifications</Label>
                                <p className="text-sm text-muted-foreground">Send alerts to mobile devices</p>
                            </div>
                            <Switch id="pushNotifications" checked={settings.pushNotifications} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: checked }))} />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-blue-500" />System Settings</CardTitle>
                        <CardDescription>Configure system behavior</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="autoBackup">Automatic Backup</Label>
                                <p className="text-sm text-muted-foreground">Backup data daily</p>
                            </div>
                            <Switch id="autoBackup" checked={settings.autoBackup} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dataRetention">Data Retention (days)</Label>
                                <Input id="dataRetention" type="number" min="30" max="365" value={settings.dataRetention} onChange={(e) => setSettings(prev => ({ ...prev, dataRetention: parseInt(e.target.value) }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxConcurrentSessions">Max Concurrent Sessions</Label>
                                <Input id="maxConcurrentSessions" type="number" min="1" max="100" value={settings.maxConcurrentSessions} onChange={(e) => setSettings(prev => ({ ...prev, maxConcurrentSessions: parseInt(e.target.value) }))} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="flex items-center gap-4">
                <Button onClick={handleSave} className="gap-2"><Save className="w-4 h-4" />Save Settings</Button>
                {saved && <span className="text-green-500 text-sm">✓ Settings saved successfully</span>}
            </div>
        </div>
    )
}
