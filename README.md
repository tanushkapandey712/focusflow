# FocusFlow

AI-powered study productivity platform that helps students manage syllabus progress, focus sessions, goals, and analytics across devices in real time.

---

## Live Demo

[FocusFlow Live](https://focusflow-ten-murex.vercel.app/)

---

## Overview

FocusFlow is a full-stack productivity platform designed for students who struggle with scattered study tracking, inconsistent focus, and lack of progress visibility.

The platform combines:
- syllabus management
- focus sessions
- analytics
- goal tracking
- multi-device sync

into a single responsive system.

---

## Features

### Authentication
- Email/password authentication
- Email verification
- Forgot password & reset password
- Secure protected routes
- Multi-device login support

### Syllabus Management
- AI-assisted syllabus parsing
- Subject → Unit → Topic hierarchy
- Collapsible syllabus structure
- Progress tracking
- Real-time synced syllabus data

### Focus System
- Focus/Pomodoro timer
- Session tracking
- Timer persistence & recovery
- Study history

### Goals & Productivity
- Goal creation and tracking
- Productivity monitoring
- Study consistency support

### Analytics
- Session analytics
- Productivity insights
- Study statistics
- Progress visualization

### Cloud Sync
- Supabase-powered backend
- Real-time multi-device synchronization
- Cloud persistence
- Row Level Security (RLS)

### UX
- Responsive design
- Mobile-friendly interface
- Smooth loading states
- Multi-page architecture

---

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS

### Backend & Database
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Realtime

### Deployment
- Vercel

### Other Tools & Libraries
- React Router
- Context API / State Management
- Chart libraries
- Lucide Icons

---

## Architecture

FocusFlow uses Supabase as the source of truth for synced user data.

### Key architecture decisions:
- Cloud-first persistence
- Real-time synchronization
- Protected routes with auth hydration
- Row Level Security for user isolation
- Local storage only for temporary UI state
- Multi-device session support

---

## Challenges Faced

- Implementing reliable multi-device sync
- Managing realtime state updates across devices
- Preventing localStorage from conflicting with cloud state
- Structuring nested syllabus relationships
- Handling authentication hydration without UI flicker
- Designing scalable Supabase tables and RLS policies
- Maintaining responsive UX across devices

---

## What I Learned

Through building FocusFlow, I learned:
- Full-stack application architecture
- Authentication workflows
- Realtime database synchronization
- State management
- Row Level Security (RLS)
- Cloud persistence
- Deployment workflows
- Responsive UI/UX design
- Debugging production-like sync issues

---

## AI-Assisted Development

FocusFlow was developed using an AI-assisted workflow for:
- architecture brainstorming
- debugging
- UI/UX iteration
- Supabase integration guidance
- feature ideation
- code refactoring support

All major implementation decisions, integration testing, debugging, feature planning, and system architecture were handled and verified manually.

---

## Future Improvements

- AI-generated study plans
- Smart productivity recommendations
- Offline sync support
- Calendar integrations
- Collaborative study rooms
- Native mobile application

---

## Local Setup

Clone the repository:

```bash
git clone <your-repository-link>
cd focusflow
