# BurnVision AI

Where fitness tracking, calorie intelligence, and AI insights meet.

BurnVision AI is a full-stack fitness platform built to help users track workouts, predict calories, review performance, and act on intelligent insights. It also includes a dedicated admin portal for operational control and monitoring.

Status  React  Flask  MySQL

## What is BurnVision AI?

BurnVision AI is an end-to-end workout and calorie management platform designed for both everyday users and administrators.

Whether you're logging a workout, reviewing calorie predictions, or managing platform activity, BurnVision AI brings the experience together in one place.

- Users can track workouts, view insights, and explore calorie prediction tools
- Admins get visibility into users, rooms, alerts, and system-level management
- The backend centralizes authentication, analytics, motion processing, and AI-assisted services

## Why BurnVision AI?

Most fitness platforms stop at tracking. BurnVision AI goes further with prediction, analysis, and role-based control.

- Fast - Vite-powered frontends with instant development feedback
- Secure - JWT authentication, password hashing, CORS protection, and protected routes
- Responsive - Built for mobile, tablet, and desktop workflows
- Insightful - Workout analytics, calorie prediction, motion-related services, and AI support
- Scalable - Flask + SQLAlchemy architecture with MySQL persistence and Docker deployment

## Table of Contents

- Overview
- Tech Stack
- Architecture
- Features
- User Flows
- API Endpoints
- Access Points
- Getting Started
- Project Structure
- Optional Nginx

## Overview

BurnVision AI is organized as a small monorepo:

- `backend/` - Flask API, authentication, database models, AI services, and route blueprints
- `user-frontend/` - User-facing React app for workouts, predictions, insights, and profile management
- `admin-frontend/` - Admin React app for dashboard monitoring, user management, alerts, and settings
- `docker-compose.yml` - Local orchestration for MySQL, backend, and both frontends

## Tech Stack

### Frontend

| Technology | Version | Purpose |
| --- | --- | --- |
| React | 18 | Component-based UI |
| TypeScript | Latest | Typed application logic |
| Vite | Latest | Fast build tool and dev server |
| Tailwind CSS | Latest | Utility-first styling |
| React Router | Latest | Client-side routing |
| Axios | Latest | API communication |
| Framer Motion | Latest | Motion and transitions |
| Recharts | Latest | Data visualization |

### Backend

| Technology | Version | Purpose |
| --- | --- | --- |
| Python | 3.13+ | Runtime language |
| Flask | Latest | Web framework |
| Flask-SQLAlchemy | Latest | ORM and database integration |
| Flask-JWT-Extended | Latest | Token-based authentication |
| Flask-CORS | Latest | Cross-origin access |
| MySQL | 8 | Relational database |
| Gunicorn | Latest | Production application server |

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        USER FRONTEND  :3000                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  React + TS  │  │   Vite App   │  │ Tailwind + Motion + API  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ JWT / HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN FRONTEND  :3001                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  React + TS  │  │   Vite App   │  │ Admin dashboard pages    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FLASK BACKEND  :5000                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  auth        │  │  workout     │  │  predictions / AI        │  │
│  │  profile     │  │  motion      │  │  alerts / stats / coach  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
│                 Flask + SQLAlchemy + JWT + CORS                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         MYSQL DATABASE                              │
│               Users · workouts · predictions · alerts               │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

### User Experience

- Workout tracking and activity management
- Calorie prediction and advanced calorie prediction tools
- Real-time insights and performance analytics
- Profile and authentication flows
- Alerts and explanation services

### Admin Experience

- Dashboard overview and operational monitoring
- User management
- Alert review and control
- Room and settings management

### Platform Services

- JWT-based authentication
- MySQL persistence via SQLAlchemy
- AI-related services and prediction endpoints
- CORS-enabled frontend/backend communication
- Dockerized local development and deployment

## User Flows

### For Users

Sign in -> Track workout -> Review insights -> Check calorie predictions -> Manage profile -> Monitor progress

### For Admins

Sign in -> Open dashboard -> Review users and alerts -> Manage rooms and settings -> Monitor platform activity

## API Endpoints

The backend exposes these main API groups:

| Area | Base Path | Purpose |
| --- | --- | --- |
| Auth | `/api/auth` | Login, registration, token flows |
| Profile | `/api/profile` | User profile management |
| Workout | `/api/workout` | Workout-related operations |
| Prediction | `/api/prediction` | Prediction workflows |
| Motion | `/api/motion` | Motion and movement analysis |
| Explanation | `/api/explanation` | Model and result explanations |
| Alerts | `/api/alerts` | Alert management |
| Admin | `/api/admin` | Admin operations |
| Coach | `/api/coach` | Coaching and guidance services |
| Stats | `/api/stats` | Analytics and statistics |
| Calorie Prediction | `/api/calorie-predict` | Standard calorie prediction |
| Advanced Calorie Prediction | `/api/advanced-calorie-predict` | Enhanced prediction workflows |
| AI | `/api/ai` | AI-assisted features |

Health check:

- `GET /api/health`

## Access Points

| Label | URL | Description |
| --- | --- | --- |
| User UI | http://localhost:3000 | Main user application |
| Admin UI | http://localhost:3001 | Admin application |
| API | http://localhost:5000/api/ | REST API base |
| Health | http://localhost:5000/api/health | Service health check |

## Getting Started

### Prerequisites

- Python
- Node.js
- MySQL
- Docker and Docker Compose for the easiest full-stack run

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python run.py
```

The backend uses environment variables such as:

- `DATABASE_URL`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `JWT_ACCESS_TOKEN_EXPIRES`
- `JWT_REFRESH_TOKEN_EXPIRES`
- `SARVAM_AI_API_KEY`
- `SARVAM_AI_MODEL`
- `SARVAM_AI_TIMEOUT`

### User Frontend Setup

```bash
cd user-frontend
npm install
npm run dev
```

### Admin Frontend Setup

```bash
cd admin-frontend
npm install
npm run dev
```

### Docker Setup

```bash
docker compose up --build
```

This starts:

- MySQL on port `3307`
- Backend on port `5000`
- User frontend on port `3000`
- Admin frontend on port `3001`

## Project Structure

```text
BurnVision AI/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models.py
│   │   └── __init__.py
│   ├── run.py
│   └── requirements.txt
├── user-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── admin-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── types/
│   └── package.json
└── docker-compose.yml
```

## Optional Nginx

Nginx is already included in both frontend Docker images for production-style static serving and API proxying. You do not need it for local development, but if you deploy with Docker, keep the existing `nginx.conf` files in place.

## Notes

- The backend creates database tables on startup through SQLAlchemy.
- The frontends are configured to talk to the backend at `http://localhost:5000` in Docker.
- The admin app is served under the `/admin` base path when built for production.
