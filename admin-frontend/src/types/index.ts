// Admin types
export interface AdminUser {
    id: number;
    email: string;
    name: string;
    is_admin: boolean;
}

export interface AuthContextType {
    user: AdminUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
}

export interface Room {
    id: number;
    name: string;
    maxParticipants: number;
    currentParticipants: number;
    durationLimit: number;
    minCalorieGoal: number;
    maxCalorieGoal: number;
    isActive: boolean;
    createdAt: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    fitnessLevel: string;
    totalWorkouts: number;
    totalCalories: number;
    joinDate: string;
    status: 'active' | 'inactive';
}

export interface Alert {
    id: number;
    user: { name: string; email: string };
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
    isRead: boolean;
    ownerNotified: boolean;
}
