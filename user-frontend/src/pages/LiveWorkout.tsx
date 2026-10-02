import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Flame, Activity, Clock, Zap, Target, TrendingUp, Camera, Save, Check, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

declare global {
    interface Window {
        Pose: any;
        Camera: any;
    }
}

// Math utilities
const getDistance = (a: { x: number, y: number }, b: { x: number, y: number }) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

const calculateAngle = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360.0 - angle;
    return angle;
};

const calculateVerticalAngle = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dy = b.y - a.y;
    const len = getDistance(a, b);
    if (len === 0) return 0;
    const radians = Math.acos(dy / len);
    return (radians * 180.0) / Math.PI;
}

const calculateVelocity = (currentAngle: number, prevAngle: number, deltaTimeMs: number) => {
    if (deltaTimeMs === 0) return 0;
    return Math.abs(currentAngle - prevAngle) / (deltaTimeMs / 1000);
};

const MET_VALUES = {
    squat: 5.0, pushup: 8.0, lunge: 5.5,
    jumping_jack: 7.5, high_knee: 8.5, burpee: 11.0,
    plank: 3.5, situp: 4.5,
    leg_raise: 3.5, bicycle_crunch: 5.5
};

const calculateMETCalories = (met: number, weightKg: number, durationMinutes: number) => {
    return (met * 3.5 * weightKg * durationMinutes) / 200;
};

const formatTime = (decimalMinutes: number) => {
    const totalSeconds = Math.floor(decimalMinutes * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

type DetectedExercise = 'squat' | 'pushup' | 'lunge' | 'jumping_jack' | 'high_knee' | 'burpee' | 'plank' | 'situp' | 'leg_raise' | 'bicycle_crunch' | 'detecting';

type WorkoutMode = 'auto' | 'select';

const EXERCISE_LIST: { value: DetectedExercise; label: string; color: string }[] = [
    { value: 'squat', label: 'Squats', color: 'bg-green-500' },
    { value: 'pushup', label: 'Pushups', color: 'bg-blue-500' },
    { value: 'lunge', label: 'Lunges', color: 'bg-purple-500' },
    { value: 'jumping_jack', label: 'Jumping Jacks', color: 'bg-yellow-500' },
    { value: 'high_knee', label: 'High Knees', color: 'bg-orange-500' },
    { value: 'burpee', label: 'Burpees', color: 'bg-red-500' },
    { value: 'plank', label: 'Plank', color: 'bg-cyan-500' },
    { value: 'situp', label: 'Sit-Ups', color: 'bg-indigo-500' },
    { value: 'leg_raise', label: 'Leg Raises', color: 'bg-pink-500' },
    { value: 'bicycle_crunch', label: 'Bicycle Crunches', color: 'bg-rose-500' },
];

interface Metrics {
    // Rep counts for all exercises
    squatReps: number;
    pushupReps: number;
    lungeReps: number;
    jumpingJackReps: number;
    highKneeReps: number;
    burpeeReps: number;
    plankSeconds: number;

    situpReps: number;
    legRaiseReps: number;
    bicycleCrunchReps: number;
    // Current state
    currentExercise: DetectedExercise;
    state: 'UP' | 'DOWN' | 'FIX FORM' | 'IDLE' | 'HOLD';
    feedback: string;
    // Performance metrics
    efficiencyScore: number;
    consistency: number;
    cadence: number;
    motionSpeed: number;
    symmetry: number;
    // Angle tracking
    leftKneeAngle: number;
    rightKneeAngle: number;
    leftHipAngle: number;
    rightHipAngle: number;
    torsoAngle: number;
    leftElbowAngle: number;
    rightElbowAngle: number;
    plankAngle: number;
    // Calories for each exercise
    squatCalories: number;
    pushupCalories: number;
    lungeCalories: number;
    jumpingJackCalories: number;
    highKneeCalories: number;
    burpeeCalories: number;
    plankCalories: number;

    situpCalories: number;
    legRaiseCalories: number;
    bicycleCrunchCalories: number;
    totalCalories: number;
    burnRate: number;
    activeMinutes: number;
}

interface LastSession {
    // Reps for all exercises
    squatReps: number;
    pushupReps: number;
    lungeReps: number;
    jumpingJackReps: number;
    highKneeReps: number;
    burpeeReps: number;
    plankSeconds: number;

    situpReps: number;
    legRaiseReps: number;
    bicycleCrunchReps: number;
    // Calories for all exercises
    squatCalories: number;
    pushupCalories: number;
    lungeCalories: number;
    jumpingJackCalories: number;
    highKneeCalories: number;
    burpeeCalories: number;
    plankCalories: number;

    situpCalories: number;
    legRaiseCalories: number;
    bicycleCrunchCalories: number;
    // Totals
    totalCalories: number;
    burnRate: number;
    activeMinutes: number;
    exercisesDone: string;
}

interface PastSession {
    id: number;
    session_date: string;
    total_calories: number;
    squat_reps: number;
    pushup_reps: number;
    total_reps: number;
    active_minutes: number;
    exercises_done: string;
}

// Complete 33-point MediaPipe Pose Landmarks
const POSE_LANDMARKS = {
    // Face landmarks (0-10)
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    MOUTH_LEFT: 9,
    MOUTH_RIGHT: 10,
    // Upper body landmarks (11-16)
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    // Hand landmarks (17-22)
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_THUMB: 21,
    RIGHT_THUMB: 22,
    // Lower body landmarks (23-28)
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
    // Foot landmarks (29-32)
    LEFT_HEEL: 29,
    RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31,
    RIGHT_FOOT_INDEX: 32,
};

const LiveWorkout = () => {
    const { user } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraRef = useRef<any>(null);
    const poseRef = useRef<any>(null);

    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [bodyWeight, setBodyWeight] = useState<number>(user?.weight || 75);
    const [isSaving, setIsSaving] = useState(false);
    const [sessionSaved, setSessionSaved] = useState(false);
    const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
    const [lastSession, setLastSession] = useState<LastSession | null>(null);
    const [lastSessionSuggestions, setLastSessionSuggestions] = useState<string[]>([]);
    const [isAiSuggestionsLoading, setIsAiSuggestionsLoading] = useState(false);

    // Workout mode: 'auto' for auto-detect all, 'select' for specific exercise
    const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('auto');
    const [selectedExercise, setSelectedExercise] = useState<DetectedExercise>('squat');
    const workoutModeRef = useRef<WorkoutMode>('auto');
    const selectedExerciseRef = useRef<DetectedExercise>('squat');

    const activeTimeRef = useRef(0);
    const sessionStartTimeRef = useRef<Date | null>(null);
    const formScoreRef = useRef({ totalScore: 0, repCount: 0 });
    const lastConfirmedExerciseRef = useRef<{ exercise: DetectedExercise; consecutiveFrames: number }>({ exercise: 'detecting', consecutiveFrames: 0 });
    const isMonitoringRef = useRef(false);
    const bodyWeightRef = useRef(75);

    const internalMetricsRef = useRef<Metrics>({
        // Reps
        squatReps: 0,
        pushupReps: 0,
        lungeReps: 0,
        jumpingJackReps: 0,
        highKneeReps: 0,
        burpeeReps: 0,
        plankSeconds: 0,

        situpReps: 0,
        legRaiseReps: 0,
        bicycleCrunchReps: 0,
        // State
        currentExercise: 'detecting',
        state: 'IDLE',
        feedback: 'Press Start',
        // Performance
        efficiencyScore: 100,
        consistency: 100,
        cadence: 0,
        motionSpeed: 0,
        symmetry: 100,
        // Angles
        leftKneeAngle: 180,
        rightKneeAngle: 180,
        leftHipAngle: 180,
        rightHipAngle: 180,
        torsoAngle: 0,
        leftElbowAngle: 180,
        rightElbowAngle: 180,
        plankAngle: 180,
        // Calories
        squatCalories: 0,
        pushupCalories: 0,
        lungeCalories: 0,
        jumpingJackCalories: 0,
        highKneeCalories: 0,
        burpeeCalories: 0,
        plankCalories: 0,

        situpCalories: 0,
        legRaiseCalories: 0,
        bicycleCrunchCalories: 0,
        totalCalories: 0,
        burnRate: 0,
        activeMinutes: 0,
    });

    const [metrics, setMetrics] = useState<Metrics>(internalMetricsRef.current);

    const logicState = useRef({
        squat: { phase: 'UP' as 'UP' | 'DOWN', repStartTime: 0, minAngleInRep: 180, repDurations: [] as number[], prevAngle: 180, totalDuration: 0 },
        pushup: { phase: 'UP' as 'UP' | 'DOWN', repStartTime: 0, minAngleInRep: 180, repDurations: [] as number[], prevAngle: 180, totalDuration: 0 },
        lunge: { phase: 'UP' as 'UP' | 'DOWN', repStartTime: 0, minAngleInRep: 180, repDurations: [] as number[], prevAngle: 180, totalDuration: 0 },
        jumping_jack: { phase: 'CLOSED' as 'OPEN' | 'CLOSED', repStartTime: 0, repDurations: [] as number[], totalDuration: 0 },
        high_knee: { lastKnee: 'none' as 'left' | 'right' | 'none', repStartTime: 0, totalDuration: 0 },
        burpee: { phase: 'STANDING' as 'STANDING' | 'SQUAT' | 'PLANK' | 'RETURNING', repStartTime: 0, totalDuration: 0 },
        plank: { isHolding: false, holdStartTime: 0, totalDuration: 0 },

        situp: { phase: 'DOWN' as 'UP' | 'DOWN', repStartTime: 0, minAngleInRep: 180, repDurations: [] as number[], totalDuration: 0 },
        leg_raise: { phase: 'DOWN' as 'UP' | 'DOWN', repStartTime: 0, minAngleInRep: 180, repDurations: [] as number[], totalDuration: 0 },
        bicycle_crunch: { lastSide: 'none' as 'left' | 'right' | 'none', repStartTime: 0, totalDuration: 0 },
        lastFrameTime: 0,
    });

    useEffect(() => { fetchPastSessions(); }, []);
    useEffect(() => { isMonitoringRef.current = isMonitoring; }, [isMonitoring]);
    useEffect(() => { bodyWeightRef.current = bodyWeight; }, [bodyWeight]);
    useEffect(() => { if (user?.weight) setBodyWeight(user.weight); }, [user]);
    useEffect(() => { workoutModeRef.current = workoutMode; }, [workoutMode]);
    useEffect(() => { selectedExerciseRef.current = selectedExercise; }, [selectedExercise]);

    const fetchPastSessions = async () => {
        try {
            const response = await api.get('/workout/sessions?limit=5');
            setPastSessions(response.data.sessions || []);
        } catch (error) {
            console.error('Failed to fetch past sessions:', error);
        }
    };

    const hasAnyActivity = (m: Metrics) => {
        return m.totalCalories > 0 || m.squatReps > 0 || m.pushupReps > 0 ||
            m.lungeReps > 0 || m.jumpingJackReps > 0 || m.highKneeReps > 0 ||
            m.burpeeReps > 0 || m.plankSeconds > 0 ||
            m.situpReps > 0 || m.legRaiseReps > 0 || m.bicycleCrunchReps > 0;
    };

    const saveWorkoutSession = async () => {
        const current = internalMetricsRef.current;

        // Only save if there's actual activity
        if (!hasAnyActivity(current)) {
            return;
        }

        // Show last-session content immediately so AI Suggestions can load in-place.
        const exercises = [];
        if (current.squatReps > 0) exercises.push('Squats');
        if (current.pushupReps > 0) exercises.push('Pushups');
        if (current.lungeReps > 0) exercises.push('Lunges');
        if (current.jumpingJackReps > 0) exercises.push('Jumping Jacks');
        if (current.highKneeReps > 0) exercises.push('High Knees');
        if (current.burpeeReps > 0) exercises.push('Burpees');
        if (current.plankSeconds > 0) exercises.push('Plank');
        if (current.situpReps > 0) exercises.push('Sit-Ups');
        if (current.legRaiseReps > 0) exercises.push('Leg Raises');
        if (current.bicycleCrunchReps > 0) exercises.push('Bicycle Crunches');

        setLastSession({
            // All reps
            squatReps: current.squatReps,
            pushupReps: current.pushupReps,
            lungeReps: current.lungeReps,
            jumpingJackReps: current.jumpingJackReps,
            highKneeReps: current.highKneeReps,
            burpeeReps: current.burpeeReps,
            plankSeconds: current.plankSeconds,

            situpReps: current.situpReps,
            legRaiseReps: current.legRaiseReps,
            bicycleCrunchReps: current.bicycleCrunchReps,
            // All calories
            squatCalories: current.squatCalories,
            pushupCalories: current.pushupCalories,
            lungeCalories: current.lungeCalories,
            jumpingJackCalories: current.jumpingJackCalories,
            highKneeCalories: current.highKneeCalories,
            burpeeCalories: current.burpeeCalories,
            plankCalories: current.plankCalories,

            situpCalories: current.situpCalories,
            legRaiseCalories: current.legRaiseCalories,
            bicycleCrunchCalories: current.bicycleCrunchCalories,
            // Totals
            totalCalories: current.totalCalories,
            burnRate: current.burnRate,
            activeMinutes: current.activeMinutes,
            exercisesDone: exercises.join(', ') || 'None'
        });

        setIsSaving(true);
        setIsAiSuggestionsLoading(true);
        setLastSessionSuggestions([]);

        try {
            const response = await api.post('/workout/session/save', {
                start_time: sessionStartTimeRef.current?.toISOString(),
                weight: bodyWeight,
                // Calories
                squat_calories: current.squatCalories,
                pushup_calories: current.pushupCalories,
                lunge_calories: current.lungeCalories,
                jumping_jack_calories: current.jumpingJackCalories,
                high_knee_calories: current.highKneeCalories,
                burpee_calories: current.burpeeCalories,
                plank_calories: current.plankCalories,
                situp_calories: current.situpCalories,
                leg_raise_calories: current.legRaiseCalories,
                bicycle_crunch_calories: current.bicycleCrunchCalories,
                total_calories: current.totalCalories,
                // Reps
                squat_reps: current.squatReps,
                pushup_reps: current.pushupReps,
                lunge_reps: current.lungeReps,
                jumping_jack_reps: current.jumpingJackReps,
                high_knee_reps: current.highKneeReps,
                burpee_reps: current.burpeeReps,
                plank_seconds: current.plankSeconds,
                situp_reps: current.situpReps,
                leg_raise_reps: current.legRaiseReps,
                bicycle_crunch_reps: current.bicycleCrunchReps,
                // Performance
                form_score: current.efficiencyScore,
                consistency: current.consistency,
                cadence: current.cadence,
                active_minutes: current.activeMinutes
            });

            const aiSummary = response.data?.ai_summary;
            setLastSessionSuggestions(Array.isArray(aiSummary) ? aiSummary : []);

            setSessionSaved(true);
            setTimeout(() => setSessionSaved(false), 3000);

            // Refresh past sessions
            await fetchPastSessions();
        } catch (error) {
            console.error('Failed to save workout session:', error);
        } finally {
            setIsAiSuggestionsLoading(false);
            setIsSaving(false);
        }
    };

    const toggleMonitoring = async () => {
        if (isMonitoring) {
            setIsMonitoring(false);

            // Save session to backend
            await saveWorkoutSession();

            // Reset all exercise metrics
            internalMetricsRef.current = {
                ...internalMetricsRef.current,
                squatReps: 0, pushupReps: 0, lungeReps: 0, jumpingJackReps: 0,
                highKneeReps: 0, burpeeReps: 0, plankSeconds: 0,
                situpReps: 0, legRaiseReps: 0, bicycleCrunchReps: 0,
                squatCalories: 0, pushupCalories: 0, lungeCalories: 0, jumpingJackCalories: 0,
                highKneeCalories: 0, burpeeCalories: 0, plankCalories: 0,
                situpCalories: 0, legRaiseCalories: 0, bicycleCrunchCalories: 0,
                totalCalories: 0, burnRate: 0, activeMinutes: 0,
                feedback: "Session Saved!",
                state: 'IDLE'
            };
            setMetrics(internalMetricsRef.current);

            // Reset all exercise logic states
            activeTimeRef.current = 0;
            formScoreRef.current = { totalScore: 0, repCount: 0 };
            lastConfirmedExerciseRef.current = { exercise: 'detecting', consecutiveFrames: 0 };
            Object.keys(logicState.current).forEach(key => {
                if (key !== 'lastFrameTime' && typeof logicState.current[key as keyof typeof logicState.current] === 'object') {
                    const state = logicState.current[key as keyof typeof logicState.current] as any;
                    if (state.totalDuration !== undefined) state.totalDuration = 0;
                    if (state.repDurations) state.repDurations = [];
                }
            });

            if (cameraRef.current) {
                const stream = videoRef.current?.srcObject as MediaStream;
                if (stream) stream.getTracks().forEach(track => track.stop());
            }
        } else {
            setIsMonitoring(true);
            sessionStartTimeRef.current = new Date();
            formScoreRef.current = { totalScore: 0, repCount: 0 };
            lastConfirmedExerciseRef.current = { exercise: 'detecting', consecutiveFrames: 0 };

            // Reset all logic states
            Object.keys(logicState.current).forEach(key => {
                if (key !== 'lastFrameTime' && typeof logicState.current[key as keyof typeof logicState.current] === 'object') {
                    const state = logicState.current[key as keyof typeof logicState.current] as any;
                    if (state.totalDuration !== undefined) state.totalDuration = 0;
                    if (state.repDurations) state.repDurations = [];
                }
            });

            const modeText = workoutMode === 'select'
                ? `Selected: ${EXERCISE_LIST.find(e => e.value === selectedExercise)?.label || selectedExercise}`
                : 'Auto-Detect Mode';
            updateMetricsState({ feedback: `Loading AI... (${modeText})`, state: 'IDLE' });

            if (!poseRef.current) {
                await initMediaPipe();
            } else {
                startCamera();
            }
        }
    };

    const updateMetricsState = (newValues: Partial<Metrics>) => {
        internalMetricsRef.current = { ...internalMetricsRef.current, ...newValues };
        setMetrics(internalMetricsRef.current);
    };

    const initMediaPipe = async () => {
        const loadScript = (src: string) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) { resolve(true); return; }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        };

        try {
            await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
            await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

            const checkPose = setInterval(() => {
                if (window.Pose && window.Camera) {
                    clearInterval(checkPose);

                    const pose = new window.Pose({
                        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
                    });

                    pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
                    pose.onResults(onResults);
                    poseRef.current = pose;
                    setIsModelLoaded(true);
                    startCamera();
                }
            }, 100);
        } catch (error) {
            console.error("Failed to load MediaPipe", error);
            updateMetricsState({ feedback: "Error loading AI" });
        }
    };

    const startCamera = () => {
        if (videoRef.current && window.Camera && poseRef.current) {
            const camera = new window.Camera(videoRef.current, {
                onFrame: async () => { if (videoRef.current && poseRef.current) await poseRef.current.send({ image: videoRef.current }); },
                width: 640,
                height: 480,
            });
            camera.start();
            cameraRef.current = camera;
        }
    };

    const onResults = (results: any) => {
        if (!canvasRef.current || !videoRef.current || !results.poseLandmarks) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        const landmarks = results.poseLandmarks;
        const getPoint = (index: number) => ({ x: landmarks[index].x * w, y: landmarks[index].y * h, visibility: landmarks[index].visibility });

        const lShoulder = getPoint(POSE_LANDMARKS.LEFT_SHOULDER);
        const rShoulder = getPoint(POSE_LANDMARKS.RIGHT_SHOULDER);
        const lElbow = getPoint(POSE_LANDMARKS.LEFT_ELBOW);
        const rElbow = getPoint(POSE_LANDMARKS.RIGHT_ELBOW);
        const lWrist = getPoint(POSE_LANDMARKS.LEFT_WRIST);
        const rWrist = getPoint(POSE_LANDMARKS.RIGHT_WRIST);
        const lHip = getPoint(POSE_LANDMARKS.LEFT_HIP);
        const rHip = getPoint(POSE_LANDMARKS.RIGHT_HIP);
        const lKnee = getPoint(POSE_LANDMARKS.LEFT_KNEE);
        const rKnee = getPoint(POSE_LANDMARKS.RIGHT_KNEE);
        const lAnkle = getPoint(POSE_LANDMARKS.LEFT_ANKLE);
        const rAnkle = getPoint(POSE_LANDMARKS.RIGHT_ANKLE);

        const now = Date.now();
        const globalState = logicState.current;

        const hasPerson = lShoulder.visibility > 0.5 && rHip.visibility > 0.5;
        if (isMonitoringRef.current && hasPerson) {
            if (globalState.lastFrameTime > 0) {
                const dt = (now - globalState.lastFrameTime) / 1000;
                if (dt < 1.0) activeTimeRef.current += dt;
            }
        }
        globalState.lastFrameTime = now;

        const lKneeAng = calculateAngle(lHip, lKnee, lAnkle);
        const rKneeAng = calculateAngle(rHip, rKnee, rAnkle);
        const lHipAng = calculateAngle(lShoulder, lHip, lKnee);
        const rHipAng = calculateAngle(rShoulder, rHip, rKnee);
        const torsoLean = (calculateVerticalAngle(lShoulder, lHip) + calculateVerticalAngle(rShoulder, rHip)) / 2;
        const lElbowAng = calculateAngle(lShoulder, lElbow, lWrist);
        const rElbowAng = calculateAngle(rShoulder, rElbow, rWrist);
        const lPlankAng = calculateAngle(lShoulder, lHip, lAnkle);
        const rPlankAng = calculateAngle(rShoulder, rHip, rAnkle);
        const avgPlank = (lPlankAng + rPlankAng) / 2;

        const logicInput = {
            lKneeAng, rKneeAng, lHipAng, rHipAng, torsoLean, lElbowAng, rElbowAng, avgPlank,
            lShoulder, rShoulder, lElbow, rElbow, lWrist, rWrist, lHip, rHip, lKnee, rKnee, lAnkle, rAnkle,
            w, h
        };

        let detected: DetectedExercise = 'detecting';
        const currentEx = internalMetricsRef.current.currentExercise;
        const mode = workoutModeRef.current;
        const selected = selectedExerciseRef.current;

        // If in select mode, only process the selected exercise
        if (mode === 'select' && selected !== 'detecting') {
            detected = selected;
        } else {
            // Auto-detect mode - determine exercise based on body position
            if (torsoLean < 45) {
                // Upright position - could be squat, lunge, jumping jack, high knee
                const ankleDistance = Math.abs(lAnkle.x - rAnkle.x) / w;
                const kneeHeightDiff = Math.abs(lKnee.y - rKnee.y) / h;
                const armSpread = (Math.abs(lWrist.x - lShoulder.x) + Math.abs(rWrist.x - rShoulder.x)) / w;
                const handsUp = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y;

                if (ankleDistance > 0.25 && handsUp && armSpread > 0.3) {
                    detected = 'jumping_jack';
                } else if (kneeHeightDiff > 0.1) {
                    // One knee higher - could be lunge or high knee
                    const highKnee = (lKnee.y < lHip.y) || (rKnee.y < rHip.y);
                    if (highKnee) {
                        detected = 'high_knee';
                    } else {
                        detected = 'lunge';
                    }
                } else {
                    // Neutral standing position - keep the last exercise rather than defaulting to squat
                    const avgKneeAngle = (lKneeAng + rKneeAng) / 2;
                    if (avgKneeAngle < 150) {
                        // Actively bending knees - this is a squat
                        detected = 'squat';
                    } else {
                        // Standing upright - keep current exercise or use last confirmed
                        detected = currentEx !== 'detecting' ? currentEx : lastConfirmedExerciseRef.current.exercise;
                    }
                }
            } else if (torsoLean > 60) {
                // Horizontal position - could be pushup or plank
                if (avgPlank > 150 && avgPlank < 210) {
                    const avgElbow = (lElbowAng + rElbowAng) / 2;
                    if (avgElbow > 150) {
                        detected = 'plank';
                    } else {
                        detected = 'pushup';
                    }
                } else {
                    detected = 'pushup';
                }
            } else if (torsoLean > 45 && torsoLean < 60) {
                // Could be situp, leg raise, bicycle crunch, or burpee transition
                const shouldersLow = lShoulder.y > lHip.y || rShoulder.y > rHip.y;
                if (shouldersLow) {
                    // Lying down exercises
                    const legAngle = calculateAngle(lShoulder, lHip, lAnkle);
                    if (legAngle < 120) {
                        detected = 'leg_raise';
                    } else {
                        detected = 'situp';
                    }
                } else if (currentEx === 'burpee') {
                    detected = 'burpee';
                } else {
                    detected = currentEx !== 'detecting' ? currentEx : 'detecting';
                }
            } else if (currentEx !== 'detecting') {
                detected = currentEx;
            }
        }

        // Sticky exercise logic: prevent rapid flickering between exercises
        const lastConfirmed = lastConfirmedExerciseRef.current;
        if (detected !== 'detecting') {
            if (detected !== lastConfirmed.exercise) {
                lastConfirmed.consecutiveFrames++;
                // Require 15+ consecutive frames (~0.5s at 30fps) to confirm exercise switch
                if (lastConfirmed.consecutiveFrames >= 15 || lastConfirmed.exercise === 'detecting') {
                    lastConfirmed.exercise = detected;
                    lastConfirmed.consecutiveFrames = 0;
                } else {
                    // Not enough frames yet, keep the last confirmed exercise
                    detected = lastConfirmed.exercise;
                }
            } else {
                lastConfirmed.consecutiveFrames = 0;
            }
        }

        // Process the detected exercise
        switch (detected) {
            case 'squat': processSquatLogic(logicInput); break;
            case 'pushup': processPushupLogic(logicInput); break;
            case 'lunge': processLungeLogic(logicInput); break;
            case 'jumping_jack': processJumpingJackLogic(logicInput); break;
            case 'high_knee': processHighKneeLogic(logicInput); break;
            case 'burpee': processBurpeeLogic(logicInput); break;
            case 'plank': processPlankLogic(logicInput); break;

            case 'situp': processSitupLogic(logicInput); break;
            case 'leg_raise': processLegRaiseLogic(logicInput); break;
            case 'bicycle_crunch': processBicycleCrunchLogic(logicInput); break;
            default: updateMetrics('detecting', logicInput, "Assume Position", 0, 'IDLE');
        }

        drawSkeleton(ctx, landmarks, w, h, detected, logicInput);
        ctx.restore();
    };

    const processSquatLogic = (data: any) => {
        const now = Date.now();
        const globalState = logicState.current;
        const sqState = globalState.squat;
        const avgKneeAngle = (data.lKneeAng + data.rKneeAng) / 2;
        const velocity = calculateVelocity(avgKneeAngle, sqState.prevAngle, now - globalState.lastFrameTime);

        sqState.prevAngle = avgKneeAngle;
        let feedback = "";
        let formValid = true;

        if (data.torsoLean > 50) { feedback = "Too much lean!"; formValid = false; }
        else if (Math.abs(data.lKneeAng - data.rKneeAng) > 15) feedback = "Even out legs";

        if (sqState.phase === 'UP') {
            if (avgKneeAngle > 160) feedback = "Squat Ready";
            if (avgKneeAngle < 150 && formValid) {
                if (data.lHipAng < 165 || data.rHipAng < 165) { sqState.phase = 'DOWN'; sqState.repStartTime = now; sqState.minAngleInRep = avgKneeAngle; }
                else feedback = "Bend hips";
            }
        } else if (sqState.phase === 'DOWN') {
            if (avgKneeAngle < sqState.minAngleInRep) sqState.minAngleInRep = avgKneeAngle;
            if (avgKneeAngle > 90) feedback = "Go Deeper"; else feedback = "Good Depth!";
            if (avgKneeAngle > 150) {
                if (sqState.minAngleInRep <= 90) {
                    // Calculate form score: depth + posture + symmetry
                    let score = 100;
                    // Depth penalty
                    if (sqState.minAngleInRep > 80) score -= 10;
                    if (sqState.minAngleInRep > 90) score -= 40;
                    // Torso lean penalty (graduated)
                    if (data.torsoLean > 30) score -= Math.min(20, Math.round((data.torsoLean - 30) * 1));
                    // Knee symmetry penalty
                    const kneeDiff = Math.abs(data.lKneeAng - data.rKneeAng);
                    if (kneeDiff > 10) score -= Math.min(15, Math.round((kneeDiff - 10) * 1.5));
                    finishRep('squat', now, Math.max(0, score));
                    feedback = "Squat +1";
                }
                else feedback = "Not deep enough";
                sqState.phase = 'UP';
            }
        }
        updateMetrics('squat', data, feedback, velocity, sqState.phase);
    };

    const processPushupLogic = (data: any) => {
        const now = Date.now();
        const globalState = logicState.current;
        const puState = globalState.pushup;
        const avgElbow = (data.lElbowAng + data.rElbowAng) / 2;
        const velocity = calculateVelocity(avgElbow, puState.prevAngle, now - globalState.lastFrameTime);

        puState.prevAngle = avgElbow;
        let feedback = "";
        let formValid = true;

        if (data.avgPlank < 150) { feedback = "Hips Sagging"; formValid = false; }
        else if (data.avgPlank > 210) { feedback = "Hips too high"; formValid = false; }

        if (puState.phase === 'UP') {
            if (avgElbow > 160 && formValid) feedback = "Pushup Ready";
            if (avgElbow < 160 && formValid) { puState.phase = 'DOWN'; puState.repStartTime = now; puState.minAngleInRep = avgElbow; }
        } else if (puState.phase === 'DOWN') {
            if (avgElbow < puState.minAngleInRep) puState.minAngleInRep = avgElbow;
            if (avgElbow > 90) feedback = "Lower..."; else feedback = "Good Depth!";
            if (avgElbow > 150) {
                if (puState.minAngleInRep <= 90 && formValid) {
                    // Calculate form score: depth + plank alignment + elbow symmetry
                    let score = 100;
                    // Depth penalty
                    if (puState.minAngleInRep > 80) score -= 10;
                    if (puState.minAngleInRep > 90) score -= 40;
                    // Plank alignment penalty (how far from 180°)
                    const plankDeviation = Math.abs(data.avgPlank - 180);
                    if (plankDeviation > 10) score -= Math.min(20, Math.round((plankDeviation - 10) * 1));
                    // Elbow symmetry penalty
                    const elbowDiff = Math.abs(data.lElbowAng - data.rElbowAng);
                    if (elbowDiff > 10) score -= Math.min(15, Math.round((elbowDiff - 10) * 1.5));
                    finishRep('pushup', now, Math.max(0, score));
                    feedback = "Pushup +1";
                }
                else if (!formValid) feedback = "Fix hips";
                else feedback = "Go Lower";
                puState.phase = 'UP';
            }
        }
        updateMetrics('pushup', data, feedback, velocity, puState.phase);
    };

    // New exercise: Lunges
    const processLungeLogic = (data: any) => {
        const now = Date.now();
        const luState = logicState.current.lunge;
        const frontKnee = Math.min(data.lKneeAng, data.rKneeAng);
        const velocity = calculateVelocity(frontKnee, luState.prevAngle, now - logicState.current.lastFrameTime);
        luState.prevAngle = frontKnee;

        let feedback = "";
        if (luState.phase === 'UP') {
            if (frontKnee > 150) feedback = "Lunge Ready";
            if (frontKnee < 130) { luState.phase = 'DOWN'; luState.repStartTime = now; luState.minAngleInRep = frontKnee; }
        } else if (luState.phase === 'DOWN') {
            if (frontKnee < luState.minAngleInRep) luState.minAngleInRep = frontKnee;
            if (frontKnee > 100) feedback = "Go Deeper"; else feedback = "Good Depth!";
            if (frontKnee > 140) {
                if (luState.minAngleInRep <= 100) {
                    // Form score: depth + torso lean
                    let score = 100;
                    if (luState.minAngleInRep > 85) score -= 10;
                    if (luState.minAngleInRep > 95) score -= 30;
                    if (data.torsoLean > 25) score -= Math.min(20, Math.round((data.torsoLean - 25) * 1));
                    finishRepGeneric('lunge', now, Math.max(0, score));
                    feedback = "Lunge +1";
                }
                else feedback = "Not deep enough";
                luState.phase = 'UP';
            }
        }
        updateMetrics('lunge', data, feedback, velocity, luState.phase);
    };

    // New exercise: Jumping Jacks
    const processJumpingJackLogic = (data: any) => {
        const now = Date.now();
        const jjState = logicState.current.jumping_jack;
        const ankleDistance = Math.abs(data.lAnkle.x - data.rAnkle.x) / data.w;
        const handsUp = data.lWrist.y < data.lShoulder.y && data.rWrist.y < data.rShoulder.y;

        let feedback = "";
        const isOpen = ankleDistance > 0.25 && handsUp;

        if (jjState.phase === 'CLOSED') {
            feedback = "Jump!";
            if (isOpen) { jjState.phase = 'OPEN'; jjState.repStartTime = now; }
        } else if (jjState.phase === 'OPEN') {
            feedback = "Good! Close!";
            if (!isOpen && ankleDistance < 0.15) {
                // Form score: arm extension + leg spread
                let score = 100;
                // Wider spread is better (0.25 threshold, ideal > 0.35)
                if (ankleDistance < 0.30) score -= 15;
                // Arms not fully up
                const leftArmUp = (data.lShoulder.y - data.lWrist.y) / data.h;
                const rightArmUp = (data.rShoulder.y - data.rWrist.y) / data.h;
                const avgArmExtension = (leftArmUp + rightArmUp) / 2;
                if (avgArmExtension < 0.1) score -= 20;
                else if (avgArmExtension < 0.15) score -= 10;
                finishRepGeneric('jumping_jack', now, Math.max(0, score));
                feedback = "Jumping Jack +1";
                jjState.phase = 'CLOSED';
            }
        }
        updateMetrics('jumping_jack', data, feedback, 0, 'IDLE');
    };

    // New exercise: High Knees
    const processHighKneeLogic = (data: any) => {
        const now = Date.now();
        const hkState = logicState.current.high_knee;
        const leftUp = data.lKnee.y < data.lHip.y;
        const rightUp = data.rKnee.y < data.rHip.y;

        let feedback = "Lift knees high!";
        if (leftUp && hkState.lastKnee !== 'left') {
            hkState.lastKnee = 'left';
            // Form score: knee height relative to hip
            const kneeHeight = (data.lHip.y - data.lKnee.y) / data.h;
            let score = 100;
            if (kneeHeight < 0.05) score -= 30;
            else if (kneeHeight < 0.08) score -= 15;
            if (data.torsoLean > 25) score -= Math.min(15, Math.round((data.torsoLean - 25) * 1));
            finishRepGeneric('high_knee', now, Math.max(0, score));
            feedback = "Left +1";
        } else if (rightUp && hkState.lastKnee !== 'right') {
            hkState.lastKnee = 'right';
            const kneeHeight = (data.rHip.y - data.rKnee.y) / data.h;
            let score = 100;
            if (kneeHeight < 0.05) score -= 30;
            else if (kneeHeight < 0.08) score -= 15;
            if (data.torsoLean > 25) score -= Math.min(15, Math.round((data.torsoLean - 25) * 1));
            finishRepGeneric('high_knee', now, Math.max(0, score));
            feedback = "Right +1";
        } else if (!leftUp && !rightUp) {
            hkState.lastKnee = 'none';
        }
        updateMetrics('high_knee', data, feedback, 0, 'IDLE');
    };

    // New exercise: Burpees (state machine)
    const processBurpeeLogic = (data: any) => {
        const now = Date.now();
        const buState = logicState.current.burpee;
        const avgKnee = (data.lKneeAng + data.rKneeAng) / 2;

        let feedback = "";
        if (buState.phase === 'STANDING') {
            if (data.torsoLean < 30 && avgKnee > 150) feedback = "Start: Drop down!";
            if (avgKnee < 120) { buState.phase = 'SQUAT'; buState.repStartTime = now; feedback = "Squat! Now plank!"; }
        } else if (buState.phase === 'SQUAT') {
            if (data.torsoLean > 60) { buState.phase = 'PLANK'; feedback = "Plank! Now back up!"; }
        } else if (buState.phase === 'PLANK') {
            if (data.torsoLean < 50) { buState.phase = 'RETURNING'; feedback = "Jump up!"; }
        } else if (buState.phase === 'RETURNING') {
            if (data.torsoLean < 30 && avgKnee > 150) {
                // Form score: squat depth + finishing posture
                let score = 100;
                if (avgKnee < 160) score -= 10; // not fully standing
                if (data.torsoLean > 15) score -= Math.min(15, Math.round((data.torsoLean - 15) * 1));
                finishRepGeneric('burpee', now, Math.max(0, score));
                feedback = "Burpee +1";
                buState.phase = 'STANDING';
            }
        }
        updateMetrics('burpee', data, feedback, 0, 'IDLE');
    };

    // New exercise: Plank (time-based)
    const processPlankLogic = (data: any) => {
        const now = Date.now();
        const plState = logicState.current.plank;
        const goodForm = data.avgPlank > 165 && data.avgPlank < 195;

        let feedback = "";
        if (goodForm) {
            if (!plState.isHolding) {
                plState.isHolding = true;
                plState.holdStartTime = now;
                feedback = "Plank started!";
            } else {
                const holdTime = (now - plState.holdStartTime) / 1000;
                plState.totalDuration = holdTime;
                feedback = `Hold: ${holdTime.toFixed(1)}s`;
                // Update plank seconds in metrics
                updateMetricsState({ plankSeconds: internalMetricsRef.current.plankSeconds + 0.03 }); // ~30fps
                // Update form score for plank every 5 seconds (body alignment quality)
                if (Math.floor(holdTime) % 5 === 0 && holdTime > 0) {
                    const plankDeviation = Math.abs(data.avgPlank - 180);
                    let plankScore = 100;
                    if (plankDeviation > 5) plankScore -= Math.min(30, Math.round(plankDeviation * 2));
                    // Reward longer holds
                    if (holdTime > 30) plankScore = Math.min(100, plankScore + 5);
                    if (holdTime > 60) plankScore = Math.min(100, plankScore + 5);
                    formScoreRef.current.totalScore += Math.max(0, plankScore);
                    formScoreRef.current.repCount += 1;
                    const avgScore = formScoreRef.current.repCount > 0
                        ? Math.round(formScoreRef.current.totalScore / formScoreRef.current.repCount) : 100;
                    updateMetricsState({ efficiencyScore: avgScore });
                }
            }
        } else {
            if (plState.isHolding) {
                plState.isHolding = false;
                feedback = "Form broken!";
            } else {
                if (data.avgPlank < 165) feedback = "Lift hips!";
                else if (data.avgPlank > 195) feedback = "Lower hips!";
            }
        }
        updateMetrics('plank', data, feedback, 0, 'HOLD');
    };

    // New exercise: Sit-ups
    const processSitupLogic = (data: any) => {
        const now = Date.now();
        const suState = logicState.current.situp;
        const hipFlexion = calculateAngle(data.lShoulder, data.lHip, data.lKnee);

        let feedback = "";
        if (suState.phase === 'DOWN') {
            if (hipFlexion > 140) feedback = "Sit-up Ready";
            if (hipFlexion < 120) { suState.phase = 'UP'; suState.repStartTime = now; suState.minAngleInRep = hipFlexion; }
        } else if (suState.phase === 'UP') {
            if (hipFlexion < suState.minAngleInRep) suState.minAngleInRep = hipFlexion;
            if (hipFlexion > 90) feedback = "Go higher!"; else feedback = "Good!";
            if (hipFlexion > 130) {
                if (suState.minAngleInRep <= 90) {
                    // Form score: how high they come up (lower angle = better)
                    let score = 100;
                    if (suState.minAngleInRep > 75) score -= 10;
                    if (suState.minAngleInRep > 85) score -= 25;
                    finishRepGeneric('situp', now, Math.max(0, score));
                    feedback = "Sit-up +1";
                }
                suState.phase = 'DOWN';
            }
        }
        updateMetrics('situp', data, feedback, 0, suState.phase);
    };

    // New exercise: Leg Raises
    const processLegRaiseLogic = (data: any) => {
        const now = Date.now();
        const lrState = logicState.current.leg_raise;
        const legAngle = calculateAngle(data.lShoulder, data.lHip, data.lAnkle);

        let feedback = "";
        if (lrState.phase === 'DOWN') {
            if (legAngle > 150) feedback = "Raise legs!";
            if (legAngle < 120) { lrState.phase = 'UP'; lrState.repStartTime = now; lrState.minAngleInRep = legAngle; }
        } else if (lrState.phase === 'UP') {
            if (legAngle < lrState.minAngleInRep) lrState.minAngleInRep = legAngle;
            if (legAngle > 100) feedback = "Higher!"; else feedback = "Good height!";
            if (legAngle > 140) {
                if (lrState.minAngleInRep <= 100) {
                    // Form score: how high legs go (lower angle = better)
                    let score = 100;
                    if (lrState.minAngleInRep > 80) score -= 10;
                    if (lrState.minAngleInRep > 90) score -= 25;
                    finishRepGeneric('leg_raise', now, Math.max(0, score));
                    feedback = "Leg Raise +1";
                }
                lrState.phase = 'DOWN';
            }
        }
        updateMetrics('leg_raise', data, feedback, 0, lrState.phase);
    };

    // New exercise: Bicycle Crunches
    const processBicycleCrunchLogic = (data: any) => {
        const now = Date.now();
        const bcState = logicState.current.bicycle_crunch;
        const leftElbowToRightKnee = getDistance(data.lElbow, data.rKnee) / data.h;
        const rightElbowToLeftKnee = getDistance(data.rElbow, data.lKnee) / data.h;

        let feedback = "Twist!";
        if (leftElbowToRightKnee < 0.15 && bcState.lastSide !== 'left') {
            bcState.lastSide = 'left';
            // Form score: closer elbow-to-knee = better twist
            let score = 100;
            if (leftElbowToRightKnee > 0.10) score -= 15;
            if (leftElbowToRightKnee > 0.12) score -= 10;
            finishRepGeneric('bicycle_crunch', now, Math.max(0, score));
            feedback = "Left +1";
        } else if (rightElbowToLeftKnee < 0.15 && bcState.lastSide !== 'right') {
            bcState.lastSide = 'right';
            let score = 100;
            if (rightElbowToLeftKnee > 0.10) score -= 15;
            if (rightElbowToLeftKnee > 0.12) score -= 10;
            finishRepGeneric('bicycle_crunch', now, Math.max(0, score));
            feedback = "Right +1";
        } else if (leftElbowToRightKnee > 0.25 && rightElbowToLeftKnee > 0.25) {
            bcState.lastSide = 'none';
        }
        updateMetrics('bicycle_crunch', data, feedback, 0, 'IDLE');
    };

    // Generic rep finish function for new exercises
    const finishRepGeneric = (type: DetectedExercise, now: number, formScore: number = 85) => {
        const stateMap: { [key: string]: any } = {
            lunge: logicState.current.lunge,
            jumping_jack: logicState.current.jumping_jack,
            high_knee: logicState.current.high_knee,
            burpee: logicState.current.burpee,

            situp: logicState.current.situp,
            leg_raise: logicState.current.leg_raise,
            bicycle_crunch: logicState.current.bicycle_crunch,
        };

        const state = stateMap[type];
        if (!state) return;

        const duration = state.repStartTime ? (now - state.repStartTime) / 1000 : 1;
        if (duration < 0.3) return;

        state.totalDuration = (state.totalDuration || 0) + duration;
        if (state.repDurations) {
            state.repDurations.push(duration);
            if (state.repDurations.length > 5) state.repDurations.shift();
        }

        // Update running average form score
        formScoreRef.current.totalScore += formScore;
        formScoreRef.current.repCount += 1;
        const avgFormScore = Math.round(formScoreRef.current.totalScore / formScoreRef.current.repCount);

        // Calculate consistency from rep durations
        let consistency = 100;
        if (state.repDurations && state.repDurations.length > 1) {
            const avgDur = state.repDurations.reduce((a: number, b: number) => a + b, 0) / state.repDurations.length;
            consistency = Math.max(0, Math.round(100 - (Math.abs(duration - avgDur) * 10)));
        }

        const currentMetrics = internalMetricsRef.current;

        // Update the specific rep count + form score
        const updates: Partial<Metrics> = {
            efficiencyScore: avgFormScore,
            consistency: consistency,
        };
        switch (type) {
            case 'lunge': updates.lungeReps = currentMetrics.lungeReps + 1; break;
            case 'jumping_jack': updates.jumpingJackReps = currentMetrics.jumpingJackReps + 1; break;
            case 'high_knee': updates.highKneeReps = currentMetrics.highKneeReps + 1; break;
            case 'burpee': updates.burpeeReps = currentMetrics.burpeeReps + 1; break;

            case 'situp': updates.situpReps = currentMetrics.situpReps + 1; break;
            case 'leg_raise': updates.legRaiseReps = currentMetrics.legRaiseReps + 1; break;
            case 'bicycle_crunch': updates.bicycleCrunchReps = currentMetrics.bicycleCrunchReps + 1; break;
        }
        updateMetricsState(updates);
    };

    const finishRep = (type: 'squat' | 'pushup', now: number, formScore: number) => {
        const state = type === 'squat' ? logicState.current.squat : logicState.current.pushup;

        const duration = (now - state.repStartTime) / 1000;
        if (duration < 0.5) return;

        state.totalDuration += duration;
        state.repDurations.push(duration);
        if (state.repDurations.length > 5) state.repDurations.shift();
        const avgDuration = state.repDurations.reduce((a, b) => a + b, 0) / state.repDurations.length;
        const cadence = avgDuration > 0 ? 60 / avgDuration : 0;

        // Update running average form score
        formScoreRef.current.totalScore += formScore;
        formScoreRef.current.repCount += 1;
        const avgFormScore = Math.round(formScoreRef.current.totalScore / formScoreRef.current.repCount);

        const currentMetrics = internalMetricsRef.current;

        updateMetricsState({
            squatReps: type === 'squat' ? currentMetrics.squatReps + 1 : currentMetrics.squatReps,
            pushupReps: type === 'pushup' ? currentMetrics.pushupReps + 1 : currentMetrics.pushupReps,
            cadence: Math.round(cadence),
            efficiencyScore: avgFormScore,
            consistency: Math.round(100 - (Math.abs(duration - avgDuration) * 10))
        });

        state.minAngleInRep = 180;
    };

    const updateMetrics = (type: DetectedExercise, data: any, feedback: string, velocity: number, phase: 'UP' | 'DOWN' | 'IDLE' | 'HOLD') => {
        const activeMinutes = activeTimeRef.current / 60;

        // Calculate time spent on each exercise
        const squatTime = logicState.current.squat.totalDuration / 60;
        const pushupTime = logicState.current.pushup.totalDuration / 60;
        const lungeTime = logicState.current.lunge.totalDuration / 60;
        const jjTime = logicState.current.jumping_jack.totalDuration / 60;
        const hkTime = logicState.current.high_knee.totalDuration / 60;
        const burpeeTime = logicState.current.burpee.totalDuration / 60;
        const plankTime = logicState.current.plank.totalDuration / 60;

        const situpTime = logicState.current.situp.totalDuration / 60;
        const lrTime = logicState.current.leg_raise.totalDuration / 60;
        const bcTime = logicState.current.bicycle_crunch.totalDuration / 60;

        // Calculate calories for each exercise
        const squatCalories = calculateMETCalories(MET_VALUES.squat, bodyWeightRef.current, squatTime);
        const pushupCalories = calculateMETCalories(MET_VALUES.pushup, bodyWeightRef.current, pushupTime);
        const lungeCalories = calculateMETCalories(MET_VALUES.lunge, bodyWeightRef.current, lungeTime);
        const jumpingJackCalories = calculateMETCalories(MET_VALUES.jumping_jack, bodyWeightRef.current, jjTime);
        const highKneeCalories = calculateMETCalories(MET_VALUES.high_knee, bodyWeightRef.current, hkTime);
        const burpeeCalories = calculateMETCalories(MET_VALUES.burpee, bodyWeightRef.current, burpeeTime);
        const plankCalories = calculateMETCalories(MET_VALUES.plank, bodyWeightRef.current, plankTime);

        const situpCalories = calculateMETCalories(MET_VALUES.situp, bodyWeightRef.current, situpTime);
        const legRaiseCalories = calculateMETCalories(MET_VALUES.leg_raise, bodyWeightRef.current, lrTime);
        const bicycleCrunchCalories = calculateMETCalories(MET_VALUES.bicycle_crunch, bodyWeightRef.current, bcTime);

        const totalCalories = squatCalories + pushupCalories + lungeCalories + jumpingJackCalories +
            highKneeCalories + burpeeCalories + plankCalories +
            situpCalories + legRaiseCalories + bicycleCrunchCalories;
        const burnRate = activeMinutes > 0 ? totalCalories / activeMinutes : 0;

        updateMetricsState({
            currentExercise: type,
            state: phase === 'IDLE' ? 'IDLE' : phase,
            feedback,
            leftKneeAngle: Math.round(data.lKneeAng || 0),
            rightKneeAngle: Math.round(data.rKneeAng || 0),
            leftHipAngle: Math.round(data.lHipAng || 0),
            rightHipAngle: Math.round(data.rHipAng || 0),
            torsoAngle: Math.round(data.torsoLean || 0),
            leftElbowAngle: Math.round(data.lElbowAng || 0),
            rightElbowAngle: Math.round(data.rElbowAng || 0),
            plankAngle: Math.round(data.avgPlank || 0),
            motionSpeed: Math.round(velocity),
            symmetry: type === 'squat' || type === 'lunge'
                ? Math.round(100 - Math.abs((data.lKneeAng || 0) - (data.rKneeAng || 0)))
                : Math.round(100 - Math.abs((data.lElbowAng || 0) - (data.rElbowAng || 0))),
            activeMinutes: parseFloat(activeMinutes.toFixed(2)),
            // All exercise calories
            squatCalories: parseFloat(squatCalories.toFixed(2)),
            pushupCalories: parseFloat(pushupCalories.toFixed(2)),
            lungeCalories: parseFloat(lungeCalories.toFixed(2)),
            jumpingJackCalories: parseFloat(jumpingJackCalories.toFixed(2)),
            highKneeCalories: parseFloat(highKneeCalories.toFixed(2)),
            burpeeCalories: parseFloat(burpeeCalories.toFixed(2)),
            plankCalories: parseFloat(plankCalories.toFixed(2)),

            situpCalories: parseFloat(situpCalories.toFixed(2)),
            legRaiseCalories: parseFloat(legRaiseCalories.toFixed(2)),
            bicycleCrunchCalories: parseFloat(bicycleCrunchCalories.toFixed(2)),
            totalCalories: parseFloat(totalCalories.toFixed(2)),
            burnRate: parseFloat(burnRate.toFixed(2))
        });
    };

    const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any, w: number, h: number, type: DetectedExercise, angles: any) => {
        // Helper to draw a line between two landmarks with optional glow effect
        const drawLine = (idx1: number, idx2: number, color: string, width: number, glow: boolean = false) => {
            const p1 = landmarks[idx1]; const p2 = landmarks[idx2];
            if (p1?.visibility > 0.5 && p2?.visibility > 0.5) {
                ctx.save();
                if (glow) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                }
                ctx.beginPath();
                ctx.moveTo(p1.x * w, p1.y * h);
                ctx.lineTo(p2.x * w, p2.y * h);
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.restore();
            }
        };

        // Helper to draw a landmark point with gradient and glow
        const drawPoint = (idx: number, color: string, radius: number, glow: boolean = false) => {
            const p = landmarks[idx];
            if (p && p.visibility > 0.3) {
                const x = p.x * w;
                const y = p.y * h;
                ctx.save();
                if (glow) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 12;
                }
                // Outer glow ring
                ctx.beginPath();
                ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fill();
                // Inner fill with gradient
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                gradient.addColorStop(1, color);
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.restore();
            }
        };

        // Helper to draw angle overlay
        const drawAngleOverlay = (idx1: number, idx2: number, idx3: number, angle: number, color: string) => {
            const p1 = landmarks[idx1]; const p2 = landmarks[idx2]; const p3 = landmarks[idx3];
            if (p1?.visibility > 0.5 && p2?.visibility > 0.5 && p3?.visibility > 0.5) {
                const x = p2.x * w; const y = p2.y * h;
                ctx.save();
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x, y, 25, 0, 2 * Math.PI);
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.4;
                ctx.lineWidth = 12;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
                ctx.restore();
                // Angle text with background
                const text = `${Math.round(angle)}°`;
                ctx.font = "bold 14px 'Inter', sans-serif";
                const tm = ctx.measureText(text);
                ctx.fillStyle = "rgba(0,0,0,0.8)";
                ctx.beginPath();
                ctx.roundRect(x - (tm.width + 12) / 2, y - 48, tm.width + 12, 22, 6);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.fillText(text, x - tm.width / 2, y - 32);
            }
        };

        // Color palette for 33-point tracking
        const colors = {
            face: '#06b6d4',       // Cyan for face
            torso: '#8b5cf6',      // Purple for torso
            leftArm: '#22c55e',    // Green for left arm
            rightArm: '#10b981',   // Emerald for right arm
            leftHand: '#f59e0b',   // Amber for left hand
            rightHand: '#eab308',  // Yellow for right hand
            leftLeg: '#f97316',    // Orange for left leg
            rightLeg: '#fb923c',   // Light orange for right leg
            leftFoot: '#ec4899',   // Pink for left foot
            rightFoot: '#f472b6',  // Light pink for right foot
            highlight: '#ffffff',  // White for highlights
        };

        // ===== DRAW ALL 33 POINTS =====

        // 1. Draw base skeleton connections (all 33 landmark connections)
        // Face connections
        [[0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10]].forEach(c =>
            drawLine(c[0], c[1], colors.face, 2)
        );

        // Torso connections
        [[11, 12], [11, 23], [12, 24], [23, 24]].forEach(c =>
            drawLine(c[0], c[1], colors.torso, 3, true)
        );

        // Left arm connections
        [[11, 13], [13, 15]].forEach(c =>
            drawLine(c[0], c[1], colors.leftArm, 3)
        );

        // Right arm connections
        [[12, 14], [14, 16]].forEach(c =>
            drawLine(c[0], c[1], colors.rightArm, 3)
        );

        // Left hand connections (wrist to fingers)
        [[15, 17], [15, 19], [15, 21], [17, 19]].forEach(c =>
            drawLine(c[0], c[1], colors.leftHand, 2)
        );

        // Right hand connections
        [[16, 18], [16, 20], [16, 22], [18, 20]].forEach(c =>
            drawLine(c[0], c[1], colors.rightHand, 2)
        );

        // Left leg connections
        [[23, 25], [25, 27]].forEach(c =>
            drawLine(c[0], c[1], colors.leftLeg, 3)
        );

        // Right leg connections
        [[24, 26], [26, 28]].forEach(c =>
            drawLine(c[0], c[1], colors.rightLeg, 3)
        );

        // Left foot connections
        [[27, 29], [29, 31], [27, 31]].forEach(c =>
            drawLine(c[0], c[1], colors.leftFoot, 2)
        );

        // Right foot connections
        [[28, 30], [30, 32], [28, 32]].forEach(c =>
            drawLine(c[0], c[1], colors.rightFoot, 2)
        );

        // 2. Draw all 33 landmark points
        // Face points (0-10)
        drawPoint(0, colors.face, 6, true); // Nose
        [1, 2, 3].forEach(i => drawPoint(i, colors.face, 3)); // Left eye
        [4, 5, 6].forEach(i => drawPoint(i, colors.face, 3)); // Right eye
        drawPoint(7, colors.face, 4); // Left ear
        drawPoint(8, colors.face, 4); // Right ear
        drawPoint(9, colors.face, 3); // Mouth left
        drawPoint(10, colors.face, 3); // Mouth right

        // Upper body points (11-16)
        drawPoint(11, colors.leftArm, 7, true); // Left shoulder
        drawPoint(12, colors.rightArm, 7, true); // Right shoulder
        drawPoint(13, colors.leftArm, 5); // Left elbow
        drawPoint(14, colors.rightArm, 5); // Right elbow
        drawPoint(15, colors.leftArm, 5); // Left wrist
        drawPoint(16, colors.rightArm, 5); // Right wrist

        // Hand points (17-22)
        drawPoint(17, colors.leftHand, 3); // Left pinky
        drawPoint(18, colors.rightHand, 3); // Right pinky
        drawPoint(19, colors.leftHand, 3); // Left index
        drawPoint(20, colors.rightHand, 3); // Right index
        drawPoint(21, colors.leftHand, 3); // Left thumb
        drawPoint(22, colors.rightHand, 3); // Right thumb

        // Lower body points (23-28)
        drawPoint(23, colors.leftLeg, 7, true); // Left hip
        drawPoint(24, colors.rightLeg, 7, true); // Right hip
        drawPoint(25, colors.leftLeg, 6); // Left knee
        drawPoint(26, colors.rightLeg, 6); // Right knee
        drawPoint(27, colors.leftLeg, 5); // Left ankle
        drawPoint(28, colors.rightLeg, 5); // Right ankle

        // Foot points (29-32)
        drawPoint(29, colors.leftFoot, 4); // Left heel
        drawPoint(30, colors.rightFoot, 4); // Right heel
        drawPoint(31, colors.leftFoot, 4); // Left foot index
        drawPoint(32, colors.rightFoot, 4); // Right foot index

        // 3. Draw exercise-specific overlays and highlights
        const exerciseColor = EXERCISE_LIST.find(e => e.value === type)?.color.replace('bg-', '') || 'green-500';
        const highlightColor = exerciseColor.includes('green') ? '#4ade80' :
            exerciseColor.includes('blue') ? '#60a5fa' :
                exerciseColor.includes('purple') ? '#a855f7' :
                    exerciseColor.includes('yellow') ? '#facc15' :
                        exerciseColor.includes('orange') ? '#fb923c' :
                            exerciseColor.includes('red') ? '#ef4444' :
                                exerciseColor.includes('cyan') ? '#22d3ee' :
                                    exerciseColor.includes('teal') ? '#2dd4bf' :
                                        exerciseColor.includes('indigo') ? '#818cf8' :
                                            exerciseColor.includes('pink') ? '#f472b6' :
                                                exerciseColor.includes('rose') ? '#fb7185' : '#ffffff';

        if (type === 'squat') {
            // Highlight legs with glow
            [[23, 25], [25, 27], [24, 26], [26, 28]].forEach(c => drawLine(c[0], c[1], highlightColor, 6, true));
            // Highlight feet
            [[27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32]].forEach(c => drawLine(c[0], c[1], highlightColor, 4, true));
            // Angle overlays
            drawAngleOverlay(23, 25, 27, angles.lKneeAng, '#facc15');
            drawAngleOverlay(24, 26, 28, angles.rKneeAng, '#facc15');
            drawAngleOverlay(11, 23, 25, angles.lHipAng, '#60a5fa');
            drawAngleOverlay(12, 24, 26, angles.rHipAng, '#60a5fa');
        } else if (type === 'pushup') {
            // Highlight arms
            [[11, 13], [13, 15], [12, 14], [14, 16]].forEach(c => drawLine(c[0], c[1], highlightColor, 6, true));
            // Highlight hands
            [[15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22]].forEach(c => drawLine(c[0], c[1], highlightColor, 4, true));
            // Highlight torso alignment
            [[11, 23], [23, 27], [12, 24], [24, 28]].forEach(c => drawLine(c[0], c[1], '#facc15', 4));
            drawAngleOverlay(11, 13, 15, angles.lElbowAng, '#facc15');
            drawAngleOverlay(12, 14, 16, angles.rElbowAng, '#facc15');
            drawAngleOverlay(11, 23, 27, angles.lHipAng || angles.avgPlank, '#60a5fa');
        } else if (type === 'lunge') {
            [[23, 25], [25, 27], [24, 26], [26, 28]].forEach(c => drawLine(c[0], c[1], highlightColor, 6, true));
            [[27, 29], [29, 31], [28, 30], [30, 32]].forEach(c => drawLine(c[0], c[1], highlightColor, 4, true));
            drawAngleOverlay(23, 25, 27, angles.lKneeAng, highlightColor);
            drawAngleOverlay(24, 26, 28, angles.rKneeAng, highlightColor);
        } else if (type === 'jumping_jack' || type === 'high_knee') {
            // Full body highlight for cardio
            [[23, 25], [25, 27], [24, 26], [26, 28]].forEach(c => drawLine(c[0], c[1], highlightColor, 6, true));
            [[11, 13], [13, 15], [12, 14], [14, 16]].forEach(c => drawLine(c[0], c[1], highlightColor, 5, true));
            // Highlight feet
            [[27, 31], [28, 32]].forEach(c => drawLine(c[0], c[1], highlightColor, 4, true));
        } else if (type === 'plank') {
            [[11, 23], [23, 27], [12, 24], [24, 28]].forEach(c => drawLine(c[0], c[1], highlightColor, 6, true));
            // Highlight hands for plank position
            [[15, 17], [15, 19], [16, 18], [16, 20]].forEach(c => drawLine(c[0], c[1], highlightColor, 4, true));
            // Highlight feet
            [[27, 31], [28, 32]].forEach(c => drawLine(c[0], c[1], highlightColor, 4, true));
            drawAngleOverlay(11, 23, 27, angles.avgPlank || angles.lHipAng, highlightColor);
        } else if (type === 'situp' || type === 'leg_raise' || type === 'bicycle_crunch') {
            [[11, 23], [23, 25], [12, 24], [24, 26]].forEach(c => drawLine(c[0], c[1], highlightColor, 6, true));
            [[25, 27], [26, 28]].forEach(c => drawLine(c[0], c[1], highlightColor, 4, true));
            drawAngleOverlay(11, 23, 25, angles.lHipAng, highlightColor);
        } else if (type === 'burpee') {
            // Full body highlight for burpees
            [[11, 13], [13, 15], [12, 14], [14, 16]].forEach(c => drawLine(c[0], c[1], highlightColor, 5, true));
            [[23, 25], [25, 27], [24, 26], [26, 28]].forEach(c => drawLine(c[0], c[1], highlightColor, 5, true));
            [[11, 23], [12, 24]].forEach(c => drawLine(c[0], c[1], highlightColor, 4, true));
            // Hands and feet
            [[15, 19], [16, 20], [27, 31], [28, 32]].forEach(c => drawLine(c[0], c[1], highlightColor, 4, true));
        } else {
            // Default - show key angles for detection mode
            drawAngleOverlay(23, 25, 27, angles.lKneeAng, 'rgba(255,255,255,0.8)');
            drawAngleOverlay(11, 13, 15, angles.lElbowAng, 'rgba(255,255,255,0.8)');
        }

        // 4. Draw landmark count indicator
        const visibleCount = landmarks.filter((l: any) => l?.visibility > 0.3).length;
        ctx.save();
        ctx.font = "bold 12px 'Inter', sans-serif";
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(w - 110, 10, 100, 28, 6);
        ctx.fill();
        ctx.fillStyle = visibleCount >= 25 ? '#4ade80' : visibleCount >= 15 ? '#facc15' : '#ef4444';
        ctx.fillText(`📍 ${visibleCount}/33 points`, w - 100, 29);
        ctx.restore();
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <Camera className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    Live Workout
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">AI-powered real-time fitness analysis with <span className="text-primary font-medium">33-point body tracking</span></p>

                {/* Workout Mode Selector */}
                <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <Label className="text-sm">Mode:</Label>
                        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
                            <Button
                                variant={workoutMode === 'auto' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setWorkoutMode('auto')}
                                disabled={isMonitoring}
                                className={`text-xs h-8 ${workoutMode === 'auto' ? 'text-white hover:text-white' : 'hover:text-foreground'}`}
                            >
                                Auto-Detect All
                            </Button>
                            <Button
                                variant={workoutMode === 'select' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setWorkoutMode('select')}
                                disabled={isMonitoring}
                                className={`text-xs ${workoutMode === 'select' ? 'text-white hover:text-white' : 'hover:text-foreground'}`}
                            >
                                Select Exercise
                            </Button>
                        </div>
                    </div>

                    {workoutMode === 'select' && (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="liveworkout-exercise-select" className="text-sm">Exercise:</Label>
                            <select
                                id="liveworkout-exercise-select"
                                aria-label="Exercise"
                                title="Exercise"
                                value={selectedExercise}
                                onChange={(e) => setSelectedExercise(e.target.value as DetectedExercise)}
                                disabled={isMonitoring}
                                className="bg-secondary/50 rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {EXERCISE_LIST.map(ex => (
                                    <option key={ex.value} value={ex.value}>{ex.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Camera Feed */}
                <div className="lg:col-span-2">
                    <Card className="glass-card overflow-hidden">
                        <CardContent className="p-0 relative">
                            <div className="live-workout-camera-frame relative bg-black w-full min-h-[350px] lg:min-h-[500px]">
                                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-60" playsInline autoPlay muted />
                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" width={640} height={480} />

                                {!isMonitoring && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                                        <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground mb-2">Camera Paused</p>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {workoutMode === 'select'
                                                ? `Selected: ${EXERCISE_LIST.find(e => e.value === selectedExercise)?.label}`
                                                : 'Mode: Auto-Detect All Exercises'}
                                        </p>
                                        <Button variant="gradient" onClick={toggleMonitoring} className="gap-2">
                                            <Activity className="w-5 h-5" />
                                            Start Workout
                                        </Button>
                                    </div>
                                )}

                                <div className="absolute top-4 left-4 space-y-2 z-10">
                                    {/* Dynamic Exercise Badges */}
                                    <div className="flex flex-wrap gap-2 max-w-md">
                                        {workoutMode === 'select' ? (
                                            // In select mode, show only selected exercise badge
                                            <Badge className={`text-sm md:text-lg px-3 py-1 md:px-4 md:py-2 ${EXERCISE_LIST.find(e => e.value === selectedExercise)?.color || 'bg-primary'}/90 text-white`}>
                                                <Target className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                                {EXERCISE_LIST.find(e => e.value === selectedExercise)?.label}: {
                                                    selectedExercise === 'squat' ? metrics.squatReps :
                                                        selectedExercise === 'pushup' ? metrics.pushupReps :
                                                            selectedExercise === 'lunge' ? metrics.lungeReps :
                                                                selectedExercise === 'jumping_jack' ? metrics.jumpingJackReps :
                                                                    selectedExercise === 'high_knee' ? metrics.highKneeReps :
                                                                        selectedExercise === 'burpee' ? metrics.burpeeReps :
                                                                            selectedExercise === 'plank' ? `${metrics.plankSeconds.toFixed(1)}s` :
                                                                                selectedExercise === 'situp' ? metrics.situpReps :
                                                                                    selectedExercise === 'leg_raise' ? metrics.legRaiseReps :
                                                                                        selectedExercise === 'bicycle_crunch' ? metrics.bicycleCrunchReps : 0
                                                }
                                            </Badge>
                                        ) : (
                                            // In auto mode, show badges for exercises with reps > 0
                                            <>
                                                {metrics.squatReps > 0 && <Badge className="text-sm px-3 py-1 bg-green-500/90 text-white"><Target className="w-3 h-3 mr-1" />Squats: {metrics.squatReps}</Badge>}
                                                {metrics.pushupReps > 0 && <Badge className="text-sm px-3 py-1 bg-blue-500/90 text-white"><Target className="w-3 h-3 mr-1" />Pushups: {metrics.pushupReps}</Badge>}
                                                {metrics.lungeReps > 0 && <Badge className="text-sm px-3 py-1 bg-purple-500/90 text-white"><Target className="w-3 h-3 mr-1" />Lunges: {metrics.lungeReps}</Badge>}
                                                {metrics.jumpingJackReps > 0 && <Badge className="text-sm px-3 py-1 bg-yellow-500/90 text-white"><Target className="w-3 h-3 mr-1" />JJ: {metrics.jumpingJackReps}</Badge>}
                                                {metrics.highKneeReps > 0 && <Badge className="text-sm px-3 py-1 bg-orange-500/90 text-white"><Target className="w-3 h-3 mr-1" />HK: {metrics.highKneeReps}</Badge>}
                                                {metrics.burpeeReps > 0 && <Badge className="text-sm px-3 py-1 bg-red-500/90 text-white"><Target className="w-3 h-3 mr-1" />Burpees: {metrics.burpeeReps}</Badge>}
                                                {metrics.plankSeconds > 0 && <Badge className="text-sm px-3 py-1 bg-cyan-500/90 text-white"><Target className="w-3 h-3 mr-1" />Plank: {metrics.plankSeconds.toFixed(0)}s</Badge>}
                                                {metrics.situpReps > 0 && <Badge className="text-sm px-3 py-1 bg-indigo-500/90 text-white"><Target className="w-3 h-3 mr-1" />Sit-ups: {metrics.situpReps}</Badge>}
                                                {metrics.legRaiseReps > 0 && <Badge className="text-sm px-3 py-1 bg-pink-500/90 text-white"><Target className="w-3 h-3 mr-1" />LR: {metrics.legRaiseReps}</Badge>}
                                                {metrics.bicycleCrunchReps > 0 && <Badge className="text-sm px-3 py-1 bg-rose-500/90 text-white"><Target className="w-3 h-3 mr-1" />BC: {metrics.bicycleCrunchReps}</Badge>}
                                            </>
                                        )}
                                    </div>
                                    <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur ${metrics.feedback.includes("Good") || metrics.feedback.includes("+1") ? 'bg-green-500/90' : 'bg-orange-500/90'}`}>
                                        <p className="text-[10px] md:text-xs uppercase opacity-80">
                                            {metrics.currentExercise === 'detecting' ? 'Detecting...' : EXERCISE_LIST.find(e => e.value === metrics.currentExercise)?.label || metrics.currentExercise}
                                        </p>
                                        <p className="text-lg md:text-xl font-bold">{metrics.feedback}</p>
                                    </div>
                                </div>

                                {isMonitoring && (
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                        <Badge variant="secondary" className="text-sm md:text-lg px-3 py-1 md:px-4 md:py-2"><Clock className="w-3 h-3 md:w-4 md:h-4 mr-2" />{formatTime(metrics.activeMinutes)}</Badge>
                                        <Badge variant="destructive" className="text-sm md:text-lg px-3 py-1 md:px-4 md:py-2"><Flame className="w-3 h-3 md:w-4 md:h-4 mr-2" />{metrics.totalCalories.toFixed(1)} kcal</Badge>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 flex justify-center gap-4">
                                <Button variant={isMonitoring ? 'destructive' : 'gradient'} size="lg" className="gap-2 w-full md:w-auto" onClick={toggleMonitoring} disabled={isSaving}>
                                    {isSaving ? (<><Save className="w-5 h-5 animate-spin" />Saving...</>) : sessionSaved ? (<><Check className="w-5 h-5" />Session Saved!</>) : isMonitoring ? (<>Stop & Save Session</>) : (<><Activity className="w-5 h-5" />Start Workout</>)}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Panel */}
                <div className="space-y-4">
                    <Card className="glass-card">
                        <CardHeader className="pb-2"><CardTitle className="text-lg">Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="weight">Your Weight (kg)</Label>
                                <Input id="weight" type="number" value={bodyWeight} onChange={(e) => setBodyWeight(Number(e.target.value))} disabled={isMonitoring} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Current Session OR Last Session */}
                    <Card className="glass-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-500" />
                                {isMonitoring ? 'Current Session' : 'Last Session'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isMonitoring ? (
                                <>
                                    {/* Dynamic exercise reps display - shows exercises being done in real-time */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {metrics.squatReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                                <p className="text-2xl font-bold text-green-400">{metrics.squatReps}</p>
                                                <p className="text-xs text-muted-foreground">Squats</p>
                                            </div>
                                        )}
                                        {metrics.pushupReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                <p className="text-2xl font-bold text-blue-400">{metrics.pushupReps}</p>
                                                <p className="text-xs text-muted-foreground">Pushups</p>
                                            </div>
                                        )}
                                        {metrics.lungeReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                                <p className="text-2xl font-bold text-purple-400">{metrics.lungeReps}</p>
                                                <p className="text-xs text-muted-foreground">Lunges</p>
                                            </div>
                                        )}
                                        {metrics.jumpingJackReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                                <p className="text-2xl font-bold text-yellow-400">{metrics.jumpingJackReps}</p>
                                                <p className="text-xs text-muted-foreground">Jumping Jacks</p>
                                            </div>
                                        )}
                                        {metrics.highKneeReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                                <p className="text-2xl font-bold text-orange-400">{metrics.highKneeReps}</p>
                                                <p className="text-xs text-muted-foreground">High Knees</p>
                                            </div>
                                        )}
                                        {metrics.burpeeReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                                <p className="text-2xl font-bold text-red-400">{metrics.burpeeReps}</p>
                                                <p className="text-xs text-muted-foreground">Burpees</p>
                                            </div>
                                        )}
                                        {metrics.plankSeconds > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                                <p className="text-2xl font-bold text-cyan-400">{metrics.plankSeconds.toFixed(1)}s</p>
                                                <p className="text-xs text-muted-foreground">Plank Hold</p>
                                            </div>
                                        )}

                                        {metrics.situpReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                                <p className="text-2xl font-bold text-indigo-400">{metrics.situpReps}</p>
                                                <p className="text-xs text-muted-foreground">Sit-Ups</p>
                                            </div>
                                        )}
                                        {metrics.legRaiseReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                                                <p className="text-2xl font-bold text-pink-400">{metrics.legRaiseReps}</p>
                                                <p className="text-xs text-muted-foreground">Leg Raises</p>
                                            </div>
                                        )}
                                        {metrics.bicycleCrunchReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                                <p className="text-2xl font-bold text-rose-400">{metrics.bicycleCrunchReps}</p>
                                                <p className="text-xs text-muted-foreground">Bicycle Crunches</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Show message when no exercises detected yet */}
                                    {metrics.squatReps === 0 && metrics.pushupReps === 0 && metrics.lungeReps === 0 &&
                                        metrics.jumpingJackReps === 0 && metrics.highKneeReps === 0 && metrics.burpeeReps === 0 &&
                                        metrics.plankSeconds === 0 && metrics.situpReps === 0 &&
                                        metrics.legRaiseReps === 0 && metrics.bicycleCrunchReps === 0 && (
                                            <div className="text-center py-4 text-muted-foreground">
                                                <p className="text-sm">Start exercising to see your reps here!</p>
                                                <p className="text-xs mt-1">Your exercise will be auto-detected</p>
                                            </div>
                                        )}

                                    {/* Calorie breakdown */}
                                    <div className="space-y-2">
                                        {metrics.squatCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Squat Burn</span><span>{metrics.squatCalories.toFixed(2)} cal</span></div>}
                                        {metrics.pushupCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pushup Burn</span><span>{metrics.pushupCalories.toFixed(2)} cal</span></div>}
                                        {metrics.lungeCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Lunge Burn</span><span>{metrics.lungeCalories.toFixed(2)} cal</span></div>}
                                        {metrics.jumpingJackCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Jumping Jack Burn</span><span>{metrics.jumpingJackCalories.toFixed(2)} cal</span></div>}
                                        {metrics.highKneeCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">High Knee Burn</span><span>{metrics.highKneeCalories.toFixed(2)} cal</span></div>}
                                        {metrics.burpeeCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Burpee Burn</span><span>{metrics.burpeeCalories.toFixed(2)} cal</span></div>}
                                        {metrics.plankCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plank Burn</span><span>{metrics.plankCalories.toFixed(2)} cal</span></div>}

                                        {metrics.situpCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sit-Up Burn</span><span>{metrics.situpCalories.toFixed(2)} cal</span></div>}
                                        {metrics.legRaiseCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Leg Raise Burn</span><span>{metrics.legRaiseCalories.toFixed(2)} cal</span></div>}
                                        {metrics.bicycleCrunchCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bicycle Crunch Burn</span><span>{metrics.bicycleCrunchCalories.toFixed(2)} cal</span></div>}

                                        {metrics.totalCalories > 0 && (
                                            <>
                                                <div className="h-px bg-border my-2" />
                                                <div className="flex justify-between"><span className="font-medium">Total Burned</span><span className="text-xl font-bold text-orange-400">{metrics.totalCalories.toFixed(2)} cal</span></div>
                                                <p className="text-xs text-muted-foreground text-right">Rate: {metrics.burnRate.toFixed(2)} cal/min</p>
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : lastSession ? (
                                <>
                                    <p className="text-sm text-muted-foreground mb-2">Exercises: <span className="text-foreground">{lastSession.exercisesDone}</span></p>

                                    {/* Dynamic exercise reps display for last session */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {lastSession.squatReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                                <p className="text-2xl font-bold text-green-400">{lastSession.squatReps}</p>
                                                <p className="text-xs text-muted-foreground">Squats</p>
                                            </div>
                                        )}
                                        {lastSession.pushupReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                <p className="text-2xl font-bold text-blue-400">{lastSession.pushupReps}</p>
                                                <p className="text-xs text-muted-foreground">Pushups</p>
                                            </div>
                                        )}
                                        {lastSession.lungeReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                                <p className="text-2xl font-bold text-purple-400">{lastSession.lungeReps}</p>
                                                <p className="text-xs text-muted-foreground">Lunges</p>
                                            </div>
                                        )}
                                        {lastSession.jumpingJackReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                                <p className="text-2xl font-bold text-yellow-400">{lastSession.jumpingJackReps}</p>
                                                <p className="text-xs text-muted-foreground">Jumping Jacks</p>
                                            </div>
                                        )}
                                        {lastSession.highKneeReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                                <p className="text-2xl font-bold text-orange-400">{lastSession.highKneeReps}</p>
                                                <p className="text-xs text-muted-foreground">High Knees</p>
                                            </div>
                                        )}
                                        {lastSession.burpeeReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                                <p className="text-2xl font-bold text-red-400">{lastSession.burpeeReps}</p>
                                                <p className="text-xs text-muted-foreground">Burpees</p>
                                            </div>
                                        )}
                                        {lastSession.plankSeconds > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                                <p className="text-2xl font-bold text-cyan-400">{lastSession.plankSeconds.toFixed(1)}s</p>
                                                <p className="text-xs text-muted-foreground">Plank Hold</p>
                                            </div>
                                        )}

                                        {lastSession.situpReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                                <p className="text-2xl font-bold text-indigo-400">{lastSession.situpReps}</p>
                                                <p className="text-xs text-muted-foreground">Sit-Ups</p>
                                            </div>
                                        )}
                                        {lastSession.legRaiseReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                                                <p className="text-2xl font-bold text-pink-400">{lastSession.legRaiseReps}</p>
                                                <p className="text-xs text-muted-foreground">Leg Raises</p>
                                            </div>
                                        )}
                                        {lastSession.bicycleCrunchReps > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                                <p className="text-2xl font-bold text-rose-400">{lastSession.bicycleCrunchReps}</p>
                                                <p className="text-xs text-muted-foreground">Bicycle Crunches</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Calorie breakdown for last session */}
                                    <div className="space-y-2 mt-2">
                                        {lastSession.squatCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Squat Burn</span><span>{lastSession.squatCalories.toFixed(2)} cal</span></div>}
                                        {lastSession.pushupCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pushup Burn</span><span>{lastSession.pushupCalories.toFixed(2)} cal</span></div>}
                                        {lastSession.lungeCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Lunge Burn</span><span>{lastSession.lungeCalories.toFixed(2)} cal</span></div>}
                                        {lastSession.jumpingJackCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Jumping Jack Burn</span><span>{lastSession.jumpingJackCalories.toFixed(2)} cal</span></div>}
                                        {lastSession.highKneeCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">High Knee Burn</span><span>{lastSession.highKneeCalories.toFixed(2)} cal</span></div>}
                                        {lastSession.burpeeCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Burpee Burn</span><span>{lastSession.burpeeCalories.toFixed(2)} cal</span></div>}
                                        {lastSession.plankCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plank Burn</span><span>{lastSession.plankCalories.toFixed(2)} cal</span></div>}

                                        {lastSession.situpCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sit-Up Burn</span><span>{lastSession.situpCalories.toFixed(2)} cal</span></div>}
                                        {lastSession.legRaiseCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Leg Raise Burn</span><span>{lastSession.legRaiseCalories.toFixed(2)} cal</span></div>}
                                        {lastSession.bicycleCrunchCalories > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bicycle Crunch Burn</span><span>{lastSession.bicycleCrunchCalories.toFixed(2)} cal</span></div>}

                                        <div className="h-px bg-border my-2" />
                                        <div className="flex justify-between"><span className="font-medium">Total Burned</span><span className="text-xl font-bold text-orange-400">{lastSession.totalCalories.toFixed(2)} cal</span></div>
                                        <p className="text-xs text-muted-foreground text-right">Duration: {formatTime(lastSession.activeMinutes)}</p>
                                    </div>

                                    {isAiSuggestionsLoading && (
                                        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Lightbulb className="w-4 h-4 text-primary" />
                                                <p className="text-sm font-medium text-primary">AI Suggestions</p>
                                            </div>
                                            <div className="w-full h-[3px] rounded-full overflow-hidden bg-secondary/50">
                                                <motion.div
                                                    initial={{ x: '-120%' }}
                                                    animate={{ x: ['-120%', '260%'] }}
                                                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                                                    className="h-full w-2/5 bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">Analyzing your session with AI...</p>
                                        </div>
                                    )}

                                    {!isAiSuggestionsLoading && lastSessionSuggestions.length > 0 && (
                                        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Lightbulb className="w-4 h-4 text-primary" />
                                                <p className="text-sm font-medium text-primary">AI Suggestions</p>
                                            </div>
                                            <ul className="space-y-1">
                                                {lastSessionSuggestions.map((item, idx) => (
                                                    <li key={`session-suggestion-${idx}`} className="text-sm text-muted-foreground">{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">No sessions yet. Start a workout!</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Exercise Metrics */}
                    <Card className="glass-card">
                        <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" />{metrics.currentExercise === 'detecting' ? 'Detecting...' : `${({
                            squat: 'Squat', pushup: 'Pushup', lunge: 'Lunge', jumping_jack: 'Jumping Jack',
                            high_knee: 'High Knee', burpee: 'Burpee', plank: 'Plank', situp: 'Sit-up',
                            leg_raise: 'Leg Raise', bicycle_crunch: 'Bicycle Crunch'
                        } as Record<string, string>)[metrics.currentExercise] || metrics.currentExercise} Metrics`}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <MetricCard label="Form Score" value={metrics.efficiencyScore} unit="%" good={metrics.efficiencyScore > 80} />
                                <MetricCard label="Consistency" value={metrics.consistency} unit="%" good={metrics.consistency > 80} />
                                <MetricCard label="Cadence" value={metrics.cadence} unit=" rpm" />
                                <MetricCard label="Motion Speed" value={metrics.motionSpeed} unit="°/s" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Sessions */}
                    {pastSessions.length > 0 && (
                        <Card className="glass-card">
                            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Recent Sessions</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {pastSessions.map((session) => (
                                        <div key={session.id} className="p-3 rounded-lg bg-secondary/30 border border-border flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium">{new Date(session.session_date).toLocaleDateString()}</p>
                                                <p className="text-xs text-muted-foreground">{session.exercises_done || 'Mixed'} • {session.total_reps} reps</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-orange-400">{session.total_calories.toFixed(1)} cal</p>
                                                <p className="text-xs text-muted-foreground">{session.active_minutes.toFixed(1)}m</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, unit, good = true }: { label: string; value: number; unit: string; good?: boolean }) => (
    <div className="p-3 rounded-lg bg-secondary/30 border border-border">
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <p className={`text-xl font-bold ${good ? 'text-green-400' : 'text-red-400'}`}>{value}<span className="text-sm text-muted-foreground ml-0.5">{unit}</span></p>
    </div>
);

export default LiveWorkout;
