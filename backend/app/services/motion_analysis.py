import numpy as np
from typing import Dict, Any, List

class MotionAnalysisService:
    """
    Service for analyzing pose landmarks and calculating motion metrics.
    Works with MediaPipe pose data from the frontend.
    """
    
    
    LANDMARKS = {
        'nose': 0,
        'left_shoulder': 11,
        'right_shoulder': 12,
        'left_elbow': 13,
        'right_elbow': 14,
        'left_wrist': 15,
        'right_wrist': 16,
        'left_hip': 23,
        'right_hip': 24,
        'left_knee': 25,
        'right_knee': 26,
        'left_ankle': 27,
        'right_ankle': 28
    }
    
    
    EXERCISE_PATTERNS = {
        'squat': {
            'key_joints': ['left_knee', 'right_knee', 'left_hip', 'right_hip'],
            'knee_angle_range': (70, 120)
        },
        'pushup': {
            'key_joints': ['left_elbow', 'right_elbow', 'left_shoulder', 'right_shoulder'],
            'elbow_angle_range': (70, 170)
        },
        'jumping_jack': {
            'key_joints': ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
            'arm_spread_detection': True
        }
    }
    
    def __init__(self):
        self.previous_landmarks = None
        self.frame_count = 0
    
    def analyze_pose(self, landmarks: List[Dict]) -> Dict[str, Any]:
        """
        Analyze pose landmarks and extract metrics.
        
        Args:
            landmarks: List of {x, y, z, visibility} for each landmark
            
        Returns:
            Analysis results including joint angles, velocity, form score
        """
        if not landmarks or len(landmarks) < 33:
            return {
                'joint_angles': {},
                'velocity': 0,
                'form_score': 0,
                'detected_exercise': None
            }
        
        
        joint_angles = self._calculate_joint_angles(landmarks)
        
        
        velocity = self._calculate_velocity(landmarks)
        
        
        form_score = self._assess_form_quality(landmarks, joint_angles)
        
        
        detected_exercise = self._detect_exercise(joint_angles)
        
        
        self.previous_landmarks = landmarks
        self.frame_count += 1
        
        return {
            'joint_angles': joint_angles,
            'velocity': velocity,
            'form_score': form_score,
            'detected_exercise': detected_exercise
        }
    
    def _calculate_joint_angles(self, landmarks: List[Dict]) -> Dict[str, float]:
        """Calculate angles for major joints"""
        angles = {}
        
        
        angles['left_elbow'] = self._calculate_angle(
            landmarks[self.LANDMARKS['left_shoulder']],
            landmarks[self.LANDMARKS['left_elbow']],
            landmarks[self.LANDMARKS['left_wrist']]
        )
        
        
        angles['right_elbow'] = self._calculate_angle(
            landmarks[self.LANDMARKS['right_shoulder']],
            landmarks[self.LANDMARKS['right_elbow']],
            landmarks[self.LANDMARKS['right_wrist']]
        )
        
        
        angles['left_knee'] = self._calculate_angle(
            landmarks[self.LANDMARKS['left_hip']],
            landmarks[self.LANDMARKS['left_knee']],
            landmarks[self.LANDMARKS['left_ankle']]
        )
        
        
        angles['right_knee'] = self._calculate_angle(
            landmarks[self.LANDMARKS['right_hip']],
            landmarks[self.LANDMARKS['right_knee']],
            landmarks[self.LANDMARKS['right_ankle']]
        )
        
        
        angles['left_hip'] = self._calculate_angle(
            landmarks[self.LANDMARKS['left_shoulder']],
            landmarks[self.LANDMARKS['left_hip']],
            landmarks[self.LANDMARKS['left_knee']]
        )
        
        angles['right_hip'] = self._calculate_angle(
            landmarks[self.LANDMARKS['right_shoulder']],
            landmarks[self.LANDMARKS['right_hip']],
            landmarks[self.LANDMARKS['right_knee']]
        )
        
        return angles
    
    def _calculate_angle(self, point1: Dict, point2: Dict, point3: Dict) -> float:
        """Calculate angle between three points (in degrees)"""
        try:
            a = np.array([point1['x'], point1['y']])
            b = np.array([point2['x'], point2['y']])
            c = np.array([point3['x'], point3['y']])
            
            ba = a - b
            bc = c - b
            
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
            angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
            
            return round(np.degrees(angle), 1)
        except:
            return 0.0
    
    def _calculate_velocity(self, landmarks: List[Dict]) -> float:
        """Calculate movement velocity between frames"""
        if self.previous_landmarks is None:
            return 0.0
        
        total_distance = 0
        key_points = ['left_wrist', 'right_wrist', 'left_ankle', 'right_ankle']
        
        for point_name in key_points:
            idx = self.LANDMARKS[point_name]
            current = landmarks[idx]
            previous = self.previous_landmarks[idx]
            
            distance = np.sqrt(
                (current['x'] - previous['x']) ** 2 +
                (current['y'] - previous['y']) ** 2
            )
            total_distance += distance
        
        return round(total_distance / len(key_points), 4)
    
    def _assess_form_quality(self, landmarks: List[Dict], angles: Dict[str, float]) -> float:
        """Assess overall form quality (0-100)"""
        score = 100.0
        
        
        elbow_diff = abs(angles.get('left_elbow', 90) - angles.get('right_elbow', 90))
        knee_diff = abs(angles.get('left_knee', 180) - angles.get('right_knee', 180))
        hip_diff = abs(angles.get('left_hip', 180) - angles.get('right_hip', 180))
        
        
        if elbow_diff > 15:
            score -= min(elbow_diff - 15, 15)
        if knee_diff > 10:
            score -= min(knee_diff - 10, 15)
        if hip_diff > 10:
            score -= min(hip_diff - 10, 10)
        
        
        left_shoulder = landmarks[self.LANDMARKS['left_shoulder']]
        right_shoulder = landmarks[self.LANDMARKS['right_shoulder']]
        shoulder_tilt = abs(left_shoulder['y'] - right_shoulder['y'])
        
        if shoulder_tilt > 0.05:
            score -= min(shoulder_tilt * 100, 10)
        
        return round(max(0, min(100, score)), 1)
    
    def _detect_exercise(self, angles: Dict[str, float]) -> str:
        """Detect current exercise based on joint angles"""
        knee_avg = (angles.get('left_knee', 180) + angles.get('right_knee', 180)) / 2
        elbow_avg = (angles.get('left_elbow', 180) + angles.get('right_elbow', 180)) / 2
        hip_avg = (angles.get('left_hip', 180) + angles.get('right_hip', 180)) / 2
        
        
        if 70 < knee_avg < 130 and hip_avg < 140:
            return 'squat'
        
        
        if 70 < elbow_avg < 170:
            return 'pushup'
        
        
        if abs(angles.get('left_knee', 180) - angles.get('right_knee', 180)) > 40:
            return 'lunge'
        
        return 'general'
    
    def get_form_feedback(self, landmarks: List[Dict], exercise_type: str) -> Dict[str, Any]:
        """Generate real-time form feedback"""
        analysis = self.analyze_pose(landmarks)
        angles = analysis['joint_angles']
        
        messages = []
        corrections = []
        
        if exercise_type == 'squat':
            knee_avg = (angles.get('left_knee', 180) + angles.get('right_knee', 180)) / 2
            
            if knee_avg > 140:
                messages.append("Go lower - bend your knees more")
                corrections.append({'joint': 'knees', 'direction': 'down'})
            elif knee_avg < 60:
                messages.append("Don't go too deep - protect your knees")
                corrections.append({'joint': 'knees', 'direction': 'up'})
            else:
                messages.append("Good depth!")
        
        elif exercise_type == 'pushup':
            elbow_avg = (angles.get('left_elbow', 180) + angles.get('right_elbow', 180)) / 2
            
            if elbow_avg > 160:
                messages.append("Lower your body more")
                corrections.append({'joint': 'elbows', 'direction': 'down'})
            elif elbow_avg < 70:
                messages.append("Great range of motion!")
        
        
        if abs(angles.get('left_knee', 180) - angles.get('right_knee', 180)) > 20:
            messages.append("Keep both sides balanced")
            corrections.append({'joint': 'balance', 'direction': 'center'})
        
        return {
            'messages': messages if messages else ["Form looks good!"],
            'score': analysis['form_score'],
            'corrections': corrections
        }
    
    def calculate_calories(self, motion_sequence: List[Dict], weight: float, duration: float) -> Dict[str, Any]:
        """Calculate calories from motion sequence"""
        if not motion_sequence:
            return {'calories': 0, 'met_value': 1.0, 'intensity': 'low', 'breakdown': {}}
        
        
        velocities = []
        for i in range(1, len(motion_sequence)):
            self.previous_landmarks = motion_sequence[i-1].get('landmarks', [])
            current_landmarks = motion_sequence[i].get('landmarks', [])
            if current_landmarks:
                vel = self._calculate_velocity(current_landmarks)
                velocities.append(vel)
        
        avg_velocity = np.mean(velocities) if velocities else 0
        
        
        if avg_velocity < 0.01:
            met_value = 2.0  
            intensity = 'low'
        elif avg_velocity < 0.03:
            met_value = 5.0  
            intensity = 'moderate'
        elif avg_velocity < 0.06:
            met_value = 8.0  
            intensity = 'high'
        else:
            met_value = 12.0  
            intensity = 'very_high'
        
        
        duration_hours = duration / 3600
        calories = met_value * weight * duration_hours
        
        return {
            'calories': round(calories, 1),
            'met_value': met_value,
            'intensity': intensity,
            'breakdown': {
                'avg_velocity': round(avg_velocity, 4),
                'frames_analyzed': len(motion_sequence),
                'duration_minutes': round(duration / 60, 1)
            }
        }
