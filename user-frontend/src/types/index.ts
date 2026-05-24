// User types
export interface User {
    id: number;
    email: string;
    name: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    bmi?: number;
    fitness_level?: string;
    is_admin?: boolean;
    created_at?: string;
}

// Auth types
export interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
    isAuthenticated: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    fitness_level?: string;
}

// Workout types
export interface Workout {
    id: number;
    user_id: number;
    room_id?: number;
    start_time: string;
    end_time?: string;
    total_calories: number;
    form_quality_score?: number;
    environment?: string;
    context_factors?: Record<string, unknown>;
    exercise_type?: string;
    duration?: number;
}

// Prediction types
export interface Prediction {
    id: number;
    workout_id?: number;
    user_id: number;
    predicted_calories: number;
    confidence_score: number;
    shap_values?: Record<string, number>;
    explanation?: string;
    created_at: string;
}

// Alert types
export interface Alert {
    id: number;
    user_id: number;
    alert_type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    suggestion?: string;
    is_read: boolean;
    owner_notified: boolean;
    created_at: string;
}

// Coach types
export interface Recommendation {
    id: number;
    type: string;
    title: string;
    description: string;
    priority: string;
    action: string;
}

// Stats types
export interface ExerciseData {
    id: number;
    name: string;
    date: string;
    calories: number;
    duration: number;
    formScore: number;
    type: string;
}

// Component prop types
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

// Chart data types
export interface ChartDataPoint {
    date: string;
    calories: number;
    [key: string]: string | number;
}

export interface ShapDataPoint {
    feature: string;
    value: number;
    positive: boolean;
}
