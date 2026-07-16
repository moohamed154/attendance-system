# Student Attendance & Center Management System

A production-ready, lightning-fast web application for managing student attendance, subscriptions, and daily center operations.

## Features

- **Blazing Fast Attendance**: Assistants can tap "Present/Absent/Late" with zero loading screens (optimistic UI).
- **Role-Based Access**: 
  - **Admin**: Full access to stats, financials, students, sessions, and reports.
  - **Assistant**: Mobile-optimized view strictly for taking today's attendance.
- **Financials**: Track student monthly fees, pending revenues, and one-click payment toggles.
- **Progressive Web App (PWA)**: Installable on iOS/Android home screens. Works offline (partially via service workers caching).
- **Reports & Exporting**: Visual charts via Recharts, and 1-click export to Excel (.xlsx) or PDF.
- **Dockerized**: Easy to deploy with Docker and Docker Compose.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Database**: PostgreSQL (via Docker Compose)
- **ORM**: Prisma v7
- **UI & Styling**: Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Auth**: Custom JWT (HttpOnly Cookies, bcrypt)
- **Forms & Validation**: React Hook Form, Zod

## Getting Started Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Database**
   ```bash
   docker compose up -d
   ```

3. **Initialize Database Schema**
   ```bash
   npx prisma db push
   # OR
   npx prisma migrate dev
   ```

4. **Seed the Database** (Creates default admin and assistant accounts)
   ```bash
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000)

## Default Accounts (from seed)

- **Admin**: `admin` / `admin123`
- **Assistant**: `assistant` / `assistant123`

## Production Deployment

This project includes a standalone `Dockerfile`.

1. Build the image:
   ```bash
   docker build -t attendance-system .
   ```
2. Run the image (Ensure `DATABASE_URL` and `JWT_SECRET` are provided):
   ```bash
   docker run -p 3000:3000 -e DATABASE_URL=postgresql://user:pass@host/db -e JWT_SECRET=your_secret attendance-system
   ```
