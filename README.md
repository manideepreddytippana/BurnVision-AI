# BurnVision AI ⚡

> **Intelligent Full-Stack Fitness Platform with Computer Vision Pose Tracking, Dual-Tier ML Calorie Prediction, Explainable AI, and Generative LLM Coaching.**

![Python](https://img.shields.io/badge/Python-3.12%20%7C%203.13-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![Pytest](https://img.shields.io/badge/Tests-64%20Passed-brightgreen?style=flat&logo=pytest&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Core Engines & Services](#core-engines--services)
  - [1. Real-Time Computer Vision Workout Tracking](#1-real-time-computer-vision-workout-tracking)
  - [2. Dual-Tier Calorie Prediction ML Engine](#2-dual-tier-calorie-prediction-ml-engine)
  - [3. Explainable AI (XAI) & SHAP Attributions](#3-explainable-ai-xai--shap-attributions)
  - [4. Generative AI Coaching (Sarvam AI)](#4-generative-ai-coaching-sarvam-ai)
  - [5. Enterprise Security Hardening](#5-enterprise-security-hardening)
- [Database Schema & Models](#database-schema--models)
- [API Reference](#api-reference)
- [Access Points](#access-points)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quickstart with Docker Compose](#quickstart-with-docker-compose)
  - [Native Local Development](#native-local-development)
  - [Database Migrations](#database-migrations)
  - [Running Tests](#running-tests)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Admin Portal Walkthrough](#admin-portal-walkthrough)
- [Production Deployment](#production-deployment)

---

## Overview

**BurnVision AI** is a state-of-the-art fitness and biometric analytics platform designed for everyday athletes, fitness enthusiasts, and gym/platform administrators. Unlike traditional logging apps, BurnVision AI pairs real-time camera-based pose estimation with dual-tier machine learning models, physiologic calorie validation, Explainable AI (XAI), and generative LLM coaching.

BurnVision AI is architected as an enterprise-grade monorepo containing:
- **`backend/`**: A hardened Flask REST API powered by SQLAlchemy ORM, Alembic migrations, Marshmallow schema validation, Flask-Limiter, and ML/LLM services.
- **`user-frontend/`**: A reactive React 18 + TypeScript + Vite single-page application (SPA) featuring live webcam workout tracking, dynamic charts, prediction studios, and personal analytics.
- **`admin-frontend/`**: An administrative dashboard SPA for user lifecycle management, lockout overrides, room controls, system alerts, and platform metrics.
- **`docker-compose.yml` & `render.yaml`**: Full-stack multi-container local orchestration and cloud deployment blueprints.

---

## Key Features

### For Users
- 📹 **Live Camera Workout Tracker**: Real-time pose landmark detection, rep counter, form quality evaluation, velocity analysis, and audio/visual cues for 10 distinct bodyweight & HIIT exercises.
- ⚡ **Standard Calorie Prediction Studio**: Instant energy expenditure forecasting based on biometric profile (age, gender, height, weight, duration, heart rate, body temperature) across multiple ML algorithms.
- 🎯 **Advanced Calorie Prediction Studio**: Precision multi-factor prediction incorporating resting BPM, average BPM, workout type, exercise name, sets, reps, difficulty, experience level, water intake, and frequency.
- 🧪 **Interactive Model Training & Custom Splits**: On-the-fly model re-training with custom train/test splits (e.g., 70/30, 80/20) and real-time performance evaluation ($R^2$, MAE, MSE, RMSE, Explained Variance).
- 🔍 **Explainable AI (XAI)**: Visual breakdown of how biometrics and biomechanics mathematically drove calorie predictions using feature attribution.
- 🤖 **Sarvam AI Intelligent Fitness Coach**: Large Language Model evaluation delivering structured anomaly detection, overtraining warnings, hydration advice, and custom progression roadmaps.
- 📊 **Comprehensive Analytics & PDF Export**: Detailed volume breakdowns, weekly calorie trends, exercise comparisons, and downloadable workout summary PDF reports.
- 🛡️ **Personal Health Alerts**: Automated warning signals for fatigue accumulation, overtraining risk, and form degradation.

### For Administrators
- 📊 **Executive Overview Dashboard**: High-level platform health indicators, total user counts, active rooms, weekly activity charts, and fitness level distributions.
- 👥 **User Directory & Account Controls**: In-depth inspection of user profiles, workout histories, and prediction logs, with the ability to edit roles or instantly clear security lockouts.
- 🚪 **Group & Room Management**: Create and configure virtual workout rooms with participant limits, duration caps, and min/max calorie burn goals.
- 🚨 **System Alerts & Notifications**: Centralized feed of critical platform events with the capability to notify user owners or dismiss resolved alerts.
- ⚙️ **Operational Settings**: System-level configuration controls and service status monitoring.

---

## System Architecture

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│                             USER FRONTEND (:3000)                             │
│       React 18 · TypeScript · Vite · Tailwind CSS · MediaPipe Pose Vision     │
│   ┌───────────────────┬──────────────────────┬────────────────────────────┐   │
│   │ Live Workout Cam  │  Calorie Predictors  │  Stats & PDF Analytics     │   │
│   └───────────────────┴──────────────────────┴────────────────────────────┘   │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │ JWT Auth / REST API
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                             ADMIN FRONTEND (:3001)                            │
│          React 18 · TypeScript · Vite · Tailwind CSS · Radix UI · Recharts    │
│   ┌───────────────────┬──────────────────────┬────────────────────────────┐   │
│   │ System Dashboard  │  User & Lockout Mgmt │  Room & Alert Operations   │   │
│   └───────────────────┴──────────────────────┴────────────────────────────┘   │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │ JWT Auth / Admin API
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                              FLASK API (:5000)                                │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │ Security Middleware: RateLimiter · SecurityHeaders · LockoutService   │   │
│   │ Schema Validation: Marshmallow Schemas · Error Handlers · TokenBlock  │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│   ┌───────────────┬────────────────┬─────────────────┬────────────────────┐   │
│   │ /api/auth     │ /api/workout   │ /api/stats      │ /api/admin         │   │
│   │ /api/profile  │ /api/motion    │ /api/coach      │ /api/alerts        │   │
│   │ /api/predict  │ /api/ai        │ /api/cal-pred   │ /api/adv-cal-pred  │   │
│   └───────────────┴────────────────┴─────────────────┴────────────────────┘   │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │ ML / AI Engine: Scikit-Learn · XGBoost · LightGBM · Sarvam AI LLM     │   │
│   │ Biomechanical Validation: MET-based Calorie Recalculation Engine      │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │ SQLAlchemy ORM + Alembic
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           MYSQL DATABASE (:3307 / :3306)                      │
│   Users · Workouts · LiveSessions · Statistics · Predictions · Alerts · Rooms │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Applications (`user-frontend` & `admin-frontend`)
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | 18.2 | Component-based UI rendering |
| **TypeScript** | 5.9 | Static type checking and interface contracts |
| **Vite** | 7.3 | Rapid HMR development server and optimized production build |
| **Tailwind CSS** | 3.4 | Utility-first design system with responsive animations |
| **Framer Motion** | 10.16 | Declarative UI animations and transitions |
| **Recharts** | 2.10 | Composable data visualization charts |
| **Radix UI** | Latest | Accessible unstyled primitives (Dialogs, Tabs, Tooltips, Toasts) |
| **Lucide React** | 0.300 | Vector icon set |
| **Axios** | 1.6 | Promise-based HTTP client with interceptors |
| **jsPDF / AutoTable** | Latest | Client-side athletic analytics report PDF generation |

### Backend API (`backend`)
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Python** | 3.12 / 3.13 | High-performance core runtime |
| **Flask** | 3.1 | Microframework powering the RESTful API |
| **SQLAlchemy** | 2.x | Python SQL toolkit and Object Relational Mapper |
| **Flask-Migrate** | 4.x | Database schema versioning with Alembic |
| **Flask-JWT-Extended**| 4.7 | Stateless JWT token issuance and blocklist revocation |
| **Flask-Limiter** | 3.10 | Multi-tier distributed request rate limiting |
| **Flask-CORS** | 5.0 | Fine-grained Cross-Origin Resource Sharing control |
| **Marshmallow** | 3.26 | Strict input serialization, schema validation, and sanitization |
| **Bcrypt** | 4.3 | Salted password hashing |
| **Gunicorn** | 23.0 | WSGI production application server |

### Machine Learning, AI & Data Science
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Scikit-Learn** | 1.6 | Linear Regression, Random Forest, metrics ($R^2$, MAE, RMSE) |
| **XGBoost** | 2.1 | Gradient boosted decision trees for non-linear calorie regression |
| **LightGBM** | 4.6 | Fast, distributed, high-efficiency gradient boosting |
| **Pandas & NumPy** | Latest | Dataset ingestion, feature engineering, and matrix operations |
| **Sarvam AI REST API**| Cloud | Generative fitness coaching insights, anomaly detection, and advice |
| **Custom XAI Engine**| Native | Biometric feature importance and SHAP value calculation |

---

## Repository Structure

```text
BurnVision-AI/
├── .env.example                     # Root environment configuration template
├── docker-compose.yml               # Multi-container local orchestration (DB, API, Frontends)
├── render.yaml                      # Render Infrastructure-as-Code deployment blueprint
├── README.md                        # Project documentation
│
├── backend/                         # Flask REST API and ML engine
│   ├── main.py                      # Application entry point
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Backend Docker container definition
│   ├── Procfile                     # Process file for web deploy
│   ├── .env.example                 # Backend environment variable blueprint
│   │
│   ├── app/
│   │   ├── __init__.py              # App factory, CORS, JWT hooks, blueprints registration
│   │   ├── models.py                # 14 SQLAlchemy ORM database models
│   │   ├── rate_limiter.py          # Flask-Limiter configuration and tier definitions
│   │   │
│   │   ├── routes/                  # REST Blueprint Controllers
│   │   │   ├── admin.py             # Admin dashboard, users, rooms, alerts
│   │   │   ├── advanced_calorie_prediction.py # Multi-factor ML prediction & training
│   │   │   ├── ai.py                # AI evaluation and insights endpoints
│   │   │   ├── alerts.py            # Notification lifecycle and sync
│   │   │   ├── auth.py              # Register, login, admin-login, refresh, logout
│   │   │   ├── calorie_prediction.py# Standard biometric ML prediction & training
│   │   │   ├── coach.py             # AI workout suggestions and intensity advice
│   │   │   ├── explanation.py       # Explainable AI (SHAP) endpoints
│   │   │   ├── motion.py            # Landmark analysis and form feedback
│   │   │   ├── prediction.py        # Legacy prediction workflows
│   │   │   ├── profile.py           # User profile and biometric settings
│   │   │   ├── stats.py             # Dashboard stats, calorie trends, PDF export
│   │   │   └── workout.py           # Live session tracking, rep saving, insights
│   │   │
│   │   ├── services/                # Business logic, ML, and security services
│   │   │   ├── account_lockout_service.py     # Progressive brute-force protection
│   │   │   ├── advanced_calorie_ml_service.py # 15-feature ML regression service
│   │   │   ├── ai_coach.py                    # Rule-based coaching recommendations
│   │   │   ├── anomaly_detection.py           # Fatigue and overtraining detection
│   │   │   ├── calorie_ml_service.py          # 7-feature standard ML regression
│   │   │   ├── calorie_predictor.py           # Calorie prediction helper
│   │   │   ├── calorie_validation_service.py  # MET-based physiological validation
│   │   │   ├── data_preprocessor.py           # Encoding and feature transformation
│   │   │   ├── eda_analysis.py                # Dataset exploratory statistics
│   │   │   ├── motion_analysis.py             # Joint angles and pose quality
│   │   │   ├── password_policy_service.py     # NIST-aligned password strength engine
│   │   │   ├── sarvam_ai_service.py           # Sarvam AI LLM integration
│   │   │   └── xai_service.py                 # SHAP feature attribution engine
│   │   │
│   │   ├── schemas/                 # Marshmallow API payload validation schemas
│   │   │   ├── admin.py, ai.py, alerts.py, auth.py, coach.py
│   │   │   ├── explanation.py, motion.py, prediction.py, profile.py, workout.py
│   │   │
│   │   ├── middleware/              # Security and error middlewares
│   │   │   ├── error_handlers.py    # Centralized HTTP and validation error handling
│   │   │   └── security_headers.py  # CSP, HSTS, X-Frame-Options, X-Content-Type
│   │   │
│   │   ├── caloriedset/             # Training datasets (15,000+ workout records)
│   │   │   └── calorie-burnt-15k/
│   │   │       ├── raw_calories.csv
│   │   │       ├── raw_exercise.csv
│   │   │       └── workout_data.csv (10MB athletic feature dataset)
│   │   │
│   │   ├── eda_reports/             # Precomputed EDA JSON reports
│   │   └── migrations/              # Alembic database migration scripts
│   │
│   └── tests/                       # Pytest test suite (64 automated tests)
│       ├── test_account_lockout_service.py
│       ├── test_calorie_validation_service.py
│       ├── test_logout_blocklist.py
│       ├── test_password_policy_service.py
│       ├── test_request_limits.py
│       └── test_security_headers.py
│
├── user-frontend/                   # User-facing React + TypeScript application
│   ├── src/
│   │   ├── pages/                   # Application Views
│   │   │   ├── Landing.tsx          # Hero landing page
│   │   │   ├── Login.tsx            # Authentication with lockout messaging
│   │   │   ├── Register.tsx         # Registration with password strength gauge
│   │   │   ├── Dashboard.tsx        # Personal activity dashboard
│   │   │   ├── LiveWorkout.tsx      # Real-time computer vision workout camera
│   │   │   ├── CaloriePrediction.tsx# Standard ML prediction tool
│   │   │   ├── AdvancedCaloriePrediction.tsx # 15-factor ML prediction tool
│   │   │   ├── AllPredictions.tsx   # History and model comparison
│   │   │   ├── ModelMetrics.tsx     # ML model benchmarks ($R^2$, MAE, RMSE)
│   │   │   ├── RealtimeInsights.tsx # Live workout session analytics
│   │   │   ├── Insights.tsx         # Sarvam AI LLM personalized coaching
│   │   │   ├── ExerciseStats.tsx    # Historical statistics and PDF report export
│   │   │   ├── Alerts.tsx           # Health and overtraining notifications
│   │   │   └── Profile.tsx          # Biometrics (height, weight, age, BMI)
│   │   ├── components/              # Modular UI components & layout wrappers
│   │   ├── contexts/                # AuthContext & global state
│   │   └── services/                # Axios API services
│   ├── package.json
│   ├── vite.config.js
│   └── nginx.conf                   # Production Nginx reverse proxy config
│
└── admin-frontend/                  # Admin portal React + TypeScript application
    ├── src/
    │   ├── pages/
    │   │   ├── Login.tsx            # Admin authentication
    │   │   ├── Dashboard.tsx        # High-level platform health & stats
    │   │   ├── UserManagement.tsx   # User records, lockouts, workout histories
    │   │   ├── RoomManagement.tsx   # Workout room configuration & limits
    │   │   ├── AlertsOverview.tsx   # System-wide alert control center
    │   │   └── Settings.tsx         # Platform configurations
    │   ├── components/              # Shared admin components
    │   └── contexts/                # Admin AuthContext
    ├── package.json
    ├── vite.config.js
    └── nginx.conf                   # Production Nginx reverse proxy config
```

---

## Core Engines & Services

### 1. Real-Time Computer Vision Workout Tracking

The live workout module (`LiveWorkout.tsx` & `workout.py`) connects to the user's webcam and leverages pose estimation to capture 33 skeletal landmarks in real time. It calculates key joint angles, velocity, and repetition boundaries for 10 exercises:

| Exercise | Primary Joint Analyzed | Repetition Trigger Angle Range | MET Value |
| :--- | :--- | :--- | :--- |
| **Squat** | Hip, Knee | $70^\circ - 120^\circ$ | 5.0 |
| **Pushup** | Shoulder, Elbow | $70^\circ - 170^\circ$ | 8.0 |
| **Lunge** | Knee, Hip | Depth transition | 5.5 |
| **Jumping Jack** | Shoulder, Arm Spread | Wide abduction / return | 7.5 |
| **High Knee** | Hip, Knee Elevation | Thigh parallel to ground | 8.5 |
| **Burpee** | Full Body Kinematics | Multi-stage ground transition | 11.0 |
| **Plank** | Core, Spine Neutrality | Isometric hold duration (seconds) | 3.5 |
| **Situp** | Hip, Spine Flexion | Complete abdominal curl | 4.5 |
| **Leg Raise** | Hip Flexion | Lower abdominal leg elevation | 3.5 |
| **Bicycle Crunch**| Opposite Elbow-to-Knee | Alternating rotational extension | 5.5 |

During sessions, the system tracks:
- **Cadence & Consistency**: Repetition pacing and smooth joint trajectory.
- **Form Quality Score (0–100%)**: Deviation from optimal biomechanical angles.
- **Active Minutes**: Pure movement duration excluding idle time.

---

### 2. Dual-Tier Calorie Prediction ML Engine

BurnVision AI features two distinct Machine Learning pipelines trained on real fitness datasets:

#### Pipeline A: Standard Prediction (`CalorieMLService`)
- **Dataset**: `raw_exercise.csv` + `raw_calories.csv` (15,000+ samples).
- **Features (7)**: `Gender`, `Age`, `Height (cm)`, `Weight (kg)`, `Duration (min)`, `Heart_Rate (bpm)`, `Body_Temp (°C)`.
- **Target**: `Calories Burned`.

#### Pipeline B: Advanced Athletic Prediction (`AdvancedCalorieMLService`)
- **Dataset**: `workout_data.csv` (Detailed multi-attribute fitness dataset).
- **Features (15)**: `Age`, `Gender`, `Weight (kg)`, `Height (m)`, `Resting_BPM`, `Avg_BPM`, `Workout_Type`, `Exercise_Name`, `Session_Duration (hours)`, `Sets`, `Reps`, `Difficulty_Level`, `Experience_Level`, `Water_Intake (L)`, `Workout_Frequency (days/wk)`.
- **Target**: `Calories Burned`.

#### Supported Algorithms
1. **Linear Regression**: Baseline interpretable model.
2. **Random Forest Regressor**: 100 decision trees capturing non-linear interactions.
3. **XGBoost Regressor**: Gradient-boosted decision trees with regularization.
4. **LightGBM Regressor**: Fast, leaf-wise gradient boosting.
5. **Ensemble Regressor**: Weighted blend of all individual models for maximal generalization.

Users can train custom models on demand with user-selected split ratios (e.g. 70/30, 80/20) and evaluate $R^2$ scores, MAE, MSE, RMSE, and Explained Variance directly in the UI.

---

### 3. Explainable AI (XAI) & SHAP Attributions

Instead of operating as a black box, the XAI engine calculates feature importance and SHAP-inspired attributions. It explains how individual factors contributed to the final calorie burn calculation:
- Positive/Negative impact of high Heart Rate vs. resting levels.
- Impact of session duration and workout intensity.
- Influence of user body mass and form execution quality.

---

### 4. Generative AI Coaching (Sarvam AI)

BurnVision AI integrates with **Sarvam AI** (`sarvam-105b` / `sarvam-m`) via `SarvamAIService` to provide natural language coaching and structured evaluations. Every completed session is processed into a structured JSON payload containing:
- `workout_anomalies`: Unusual exertion or pacing anomalies.
- `behavioral_anomalies`: Inconsistent workout schedule warnings.
- `overtraining_detection`: Fatigue markers indicating insufficient rest.
- `nutrition_recommendations`: Post-workout macronutrient suggestions.
- `hydration_tracking`: Water replacement targets based on intensity and duration.
- `progress_tracking`: Longitudinal improvements in volume and consistency.
- `smart_recommendation_engine`: Suggested upcoming sessions.

---

## Database Schema & Models

The relational database layer consists of 14 SQLAlchemy models managed with Alembic migrations:

| Model | Table | Purpose |
| :--- | :--- | :--- |
| `User` | `users` | User credentials, hashed password, biometrics (age, gender, height, weight, BMI), admin flag, failed login attempts, lockout timestamp |
| `TokenBlocklist` | `token_blocklist` | JTI unique identifiers of revoked JWT access and refresh tokens |
| `Room` | `rooms` | Group workout rooms with participant limits, duration limits, and target calorie goals |
| `Workout` | `workouts` | High-level workout records, environment, exercise type, start/end times, context factors |
| `LiveWorkoutSession` | `live_workout_sessions` | Detailed rep counts and calorie burns across all 10 tracked exercises, form score, consistency, and active duration |
| `LiveWorkoutSessionSuggestion` | `live_workout_sessions_suggestions` | AI-generated summary and recommendations linked to specific live sessions |
| `ExerciseStatistics` | `exercise_statistics` | Aggregated career totals per user: total reps per exercise, total sessions, cumulative calories, average form score |
| `MotionFrame` | `motion_frames` | Raw skeletal joint angle captures and velocities recorded during sessions |
| `Prediction` | `predictions` | General prediction records with confidence score and SHAP attributions |
| `CaloriePrediction` | `calorie_predictions` | Records generated by the Standard ML prediction pipeline |
| `CaloriePredictionExplanation` | `calorie_predictions_explanations` | Sarvam AI LLM evaluations linked to standard predictions |
| `AdvancedCaloriePrediction` | `advanced_calorie_predictions` | Records generated by the 15-factor Advanced ML prediction pipeline |
| `AdvancedCaloriePredictionExplanation` | `advanced_calorie_predictions_explanations`| Sarvam AI LLM evaluations linked to advanced predictions |
| `Alert` | `alerts` | Health notifications (overtraining, fatigue, injury risk) with read status and admin notification tracking |

---

## API Reference

The backend exposes 13 functional blueprints prefixing `/api`:

### Authentication & Profile (`/api/auth`, `/api/profile`)
| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account | Auth |
| `POST` | `/api/auth/login` | Authenticate user, return access + refresh tokens | Auth |
| `POST` | `/api/auth/admin-login` | Authenticate an admin user | Auth |
| `POST` | `/api/auth/refresh` | Issue fresh access token using refresh token | Auth |
| `GET` | `/api/auth/me` | Fetch current authenticated user's profile | Read |
| `POST` | `/api/auth/logout` | Revoke active access and refresh tokens | Write |
| `GET` | `/api/profile` | Get detailed user biometrics & profile | Read |
| `PUT` | `/api/profile` | Update profile information and recalculate BMI | Write |

### Workouts & Live Sessions (`/api/workout`)
| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/workout/start` | Initialize a new workout session | Write |
| `POST` | `/api/workout/<id>/end` | Finalize workout with MET calorie validation | Write |
| `POST` | `/api/workout/session/save` | Save live webcam session with 10 exercise rep breakdown | Compute |
| `GET` | `/api/workout/live-sessions` | Retrieve list of user's past live workout sessions | Read |
| `GET` | `/api/workout/realtime-insights` | Fetch dynamic workout insights and feedback | Read |
| `GET` | `/api/workout/statistics` | Fetch career aggregated exercise statistics | Read |
| `GET` | `/api/workout/calorie-trends` | Fetch chronological calorie expenditure trends | Read |
| `GET` | `/api/workout/compare-sessions` | Compare metrics across different workouts | Read |
| `GET` | `/api/workout/` | List general workouts | Read |
| `GET` | `/api/workout/<id>` | Get single workout details | Read |
| `DELETE`| `/api/workout/<id>` | Delete a workout record | Write |
| `POST` | `/api/workout/<id>/motion-frame` | Stream pose landmark frame | Write |

### Calorie Prediction & Custom Training (`/api/calorie-predict`, `/api/advanced-calorie-predict`)
| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/calorie-predict/models` | List available standard models & metrics | Read |
| `GET` | `/api/calorie-predict/model-comparison` | Compare standard models ($R^2$, MAE, RMSE) | Read |
| `POST` | `/api/calorie-predict/predict` | Predict calories using standard model | Compute |
| `POST` | `/api/calorie-predict/train` | Re-train standard model with custom split | Compute |
| `GET` | `/api/calorie-predict/history` | List user's standard prediction history | Read |
| `GET` | `/api/calorie-predict/<id>` | Get standard prediction details | Read |
| `GET` | `/api/advanced-calorie-predict/models` | List available advanced models & metrics | Read |
| `GET` | `/api/advanced-calorie-predict/model-comparison` | Compare advanced models ($R^2$, MAE, RMSE) | Read |
| `POST` | `/api/advanced-calorie-predict/predict` | Predict calories using advanced 15-factor model | Compute |
| `POST` | `/api/advanced-calorie-predict/train` | Re-train advanced model with custom split | Compute |
| `GET` | `/api/advanced-calorie-predict/history` | List user's advanced prediction history | Read |
| `GET` | `/api/advanced-calorie-predict/<id>` | Get advanced prediction details | Read |

### AI, Coaching, Motion & Stats (`/api/ai`, `/api/coach`, `/api/motion`, `/api/stats`, `/api/alerts`)
| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/evaluate-prediction` | Sarvam AI LLM evaluation of standard prediction | Compute |
| `POST` | `/api/ai/evaluate-advanced-prediction`| Sarvam AI LLM evaluation of advanced prediction | Compute |
| `GET` | `/api/ai/prediction-insights` | Fetch latest standard AI coaching insights | Read |
| `GET` | `/api/ai/advanced-prediction-insights`| Fetch latest advanced AI coaching insights | Read |
| `GET` | `/api/coach/recommendations` | Get personalized routine recommendations | Read |
| `POST` | `/api/coach/suggest-workout` | Get targeted workout suggestions based on goals | Compute |
| `POST` | `/api/motion/analyze` | Analyze skeletal landmarks and calculate angles | Compute |
| `POST` | `/api/motion/form-feedback` | Get real-time form correction suggestions | Read |
| `GET` | `/api/stats/dashboard` | Aggregated dashboard KPI statistics | Read |
| `GET` | `/api/stats/calorie-trends` | Long-term trend analysis | Read |
| `GET` | `/api/stats/exercise-comparison`| Side-by-side exercise volume breakdown | Read |
| `GET` | `/api/stats/export-pdf` | Generate and stream PDF performance report | Compute |
| `GET` | `/api/alerts/` | Fetch active user alerts | Read |
| `PUT` | `/api/alerts/<id>/read` | Mark alert as read | Write |
| `DELETE`| `/api/alerts/<id>` | Delete an alert | Write |

### Admin Operations (`/api/admin`)
| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard-stats` | System health, users, active rooms, alerts | Admin |
| `GET` | `/api/admin/weekly-activity` | Platform-wide weekly workout volume | Admin |
| `GET` | `/api/admin/fitness-levels` | User population fitness level distribution | Admin |
| `GET` | `/api/admin/rooms` | List all workout rooms | Admin |
| `POST` | `/api/admin/rooms` | Create a new workout room | Admin |
| `PUT` | `/api/admin/rooms/<id>` | Update room rules and limits | Admin |
| `DELETE`| `/api/admin/rooms/<id>` | Remove a room | Admin |
| `GET` | `/api/admin/users` | List all users with lockout status | Admin |
| `GET` | `/api/admin/users/<id>` | Get detailed user record | Admin |
| `PUT` | `/api/admin/users/<id>` | Update user role or profile | Admin |
| `DELETE`| `/api/admin/users/<id>` | Delete a user account | Admin |
| `GET` | `/api/admin/users/<id>/sessions` | View user's workout history | Admin |
| `GET` | `/api/admin/users/<id>/predictions`| View user's prediction history | Admin |
| `POST` | `/api/admin/users/<id>/unlock` | Unlock a locked user account | Admin |
| `GET` | `/api/admin/alerts` | List all platform alerts | Admin |
| `POST` | `/api/admin/alerts/<id>/notify` | Send alert reminder to user owner | Admin |
| `DELETE`| `/api/admin/alerts/<id>` | Dismiss an alert | Admin |

### Health Check
- `GET /api/health`: Exempt from rate limits, returns `{"status": "healthy", "version": "1.0.0"}`.

---

## Access Points

| Component | Default URL | Description |
| :--- | :--- | :--- |
| **User Application** | `http://localhost:3000` | Main client UI for workouts and predictions |
| **Admin Portal** | `http://localhost:3001/admin` | Management portal for platform operations |
| **Backend REST API** | `http://localhost:5000/api` | REST API base route |
| **API Health Check** | `http://localhost:5000/api/health` | Live service health check |
| **MySQL Database** | `localhost:3307` (Docker) / `3306` (Native) | Relational persistence service |

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.x` or higher
- **Python**: `3.12.x` or `3.13.x`
- **MySQL**: `8.0+` (or Docker)
- **Docker & Docker Compose**: Recommended for quick one-line startup

---

### Quickstart with Docker Compose

The easiest way to spin up the entire platform (MySQL, Backend, User Frontend, and Admin Frontend) is Docker Compose:

```bash
# 1. Clone repository
git clone https://github.com/manideepreddytippana/BurnVision-AI.git
cd BurnVision-AI

# 2. Copy root environment variables
cp .env.example .env

# 3. Build and launch all containers
docker compose up --build
```

This launches:
- **MySQL 8.0** on port `3307` (mapped internally to `3306`).
- **Flask Backend** on port `5000`.
- **User Frontend** on port `3000`.
- **Admin Frontend** on port `3001`.

---

### Native Local Development

#### 1. Database Setup
Ensure MySQL is running locally and create the database:
```sql
CREATE DATABASE calorie_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment file
cp .env.example .env
# Edit .env with your MySQL credentials and SECRET_KEY

# Run database migrations
flask db upgrade

# Start Flask development server
flask run --port=5000
```

#### 3. User Frontend Setup
```bash
cd user-frontend
npm install
npm run dev
# Running at http://localhost:3000
```

#### 4. Admin Frontend Setup
```bash
cd admin-frontend
npm install
npm run dev
# Running at http://localhost:3001/admin
```

---

### Database Migrations

BurnVision AI uses **Flask-Migrate** (Alembic) to version-control the database schema:

```bash
cd backend

# Apply pending migrations to the database
flask db upgrade

# Generate a new migration after editing models.py
flask db migrate -m "Describe your schema changes"

# Roll back the previous migration
flask db downgrade
```

---

### Running Tests

The test suite validates security headers, account lockout thresholds, password policy scoring, request payload limits, JWT token blocklist revocation, and MET calorie validation:

```bash
cd backend
python -m pytest -v
```

Output:
```text
tests/test_account_lockout_service.py ......                             [  9%]
tests/test_calorie_validation_service.py ............................    [ 53%]
tests/test_logout_blocklist.py ...                                       [ 57%]
tests/test_password_policy_service.py .........                          [ 71%]
tests/test_request_limits.py ..                                          [ 75%]
tests/test_security_headers.py ................                          [100%]

============================== 64 passed in 12.75s ==============================
```

---

## Environment Variables Configuration

### Backend (`backend/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `FLASK_APP` | `main.py` | Flask entry point file |
| `FLASK_ENV` | `development` | Environment mode (`development` / `production`) |
| `PORT` | `5000` | Port for the backend service |
| `SECRET_KEY` | *(Required)* | Flask session signing secret key |
| `JWT_SECRET_KEY` | *(Required)* | JWT signing key |
| `JWT_ACCESS_TOKEN_EXPIRES` | `3600` | Access token lifetime in seconds (1 hour) |
| `JWT_REFRESH_TOKEN_EXPIRES` | `2592000` | Refresh token lifetime in seconds (30 days) |
| `DATABASE_URL` | `mysql+pymysql://root:password@localhost:3306/calorie_ai` | SQLAlchemy connection URI |
| `SARVAM_API_KEY` | *(Optional)* | Sarvam AI API subscription key |
| `SARVAM_AI_MODEL` | `sarvam-105b` | Model name for Sarvam AI LLM evaluations |
| `SARVAM_AI_TIMEOUT` | `200` | API request timeout in seconds |
| `RATE_LIMIT_ENABLED` | `true` | Enable or disable Flask-Limiter |
| `RATE_LIMIT_STORAGE_URI` | `memory://` | Storage URI for rate limiter (`redis://...` for production) |
| `RATE_LIMIT_AUTH` | `5 per minute; 20 per hour` | Authentication endpoint limits |
| `RATE_LIMIT_COMPUTE` | `10 per minute; 100 per hour`| ML and AI evaluation limits |
| `RATE_LIMIT_WRITE` | `30 per minute; 300 per hour`| Session saving and update limits |
| `RATE_LIMIT_READ` | `60 per minute; 1000 per hour`| Read queries limit |
| `MAX_CONTENT_LENGTH_MB` | `1` | Max payload size limit in MB (prevents DoS) |
| `SECURITY_HEADERS_ENABLED` | `true` | Toggle security headers middleware |
| `CORS_ALLOWED_ORIGINS` | *(Optional)* | Comma-separated list of additional allowed CORS domains |

### Frontends (`user-frontend/.env` & `admin-frontend/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:5000` | Base URL pointing to the Flask API |

---

## Admin Portal Walkthrough

1. **Accessing the Portal**: Navigate to `http://localhost:3001/admin/login` and log in with an administrator account (`is_admin = True`).
2. **Dashboard Overview**: Monitor platform metrics including total active users, live rooms, system alerts, and weekly exercise frequency.
3. **User Management**:
   - Inspect user biometrics, calculated BMI, and career statistics.
   - Review past live workout sessions and prediction histories.
   - If an account is locked due to repeated invalid login attempts, administrators can unlock it immediately using the **Unlock Account** action.
4. **Room Controls**: Create, edit, activate, or archive group workout rooms with custom participant caps and calorie goals.
5. **Alerts Feed**: Review critical overtraining or injury risk alerts across all users and trigger email or in-app notifications.

---

## Production Deployment

### Render Deployment (`render.yaml`)

BurnVision AI is configured for one-click deployment to **Render** using the included `render.yaml` specification:

- **Backend Web Service**:
  - Runtime: Python 3.12.9
  - Build command: `pip install -r requirements.txt && flask db upgrade`
  - Start command: `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 main:app`
- **User Frontend Static Site**:
  - Build command: `npm install && npm run build`
  - Publish directory: `./dist`
  - SPA Rewrites: `/* -> /index.html`
- **Admin Frontend Static Site**:
  - Build command: `npm install && npm run build`
  - Publish directory: `./dist`
  - SPA Rewrites: `/* -> /index.html`

### Production Nginx Reverse Proxy
Both frontend Dockerfiles incorporate pre-configured `nginx.conf` files that:
- Serve static SPA assets with cache headers and gzip compression.
- Support HTML5 pushState routing via `try_files $uri $uri/ /index.html`.
- Proxy `/api/` traffic cleanly to the backend container.

---
