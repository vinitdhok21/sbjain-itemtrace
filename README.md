# SBJain ItemTrace — College Lost & Found Management Platform

SBJain ItemTrace is an intelligent, full-stack Lost & Found management system built specifically for SB Jain Institute of Technology, Management and Research students, staff, and campus administration.

---

## 📌 Problem Statement

On university campuses, lost items—such as student ID cards, calculators, headphones, notebooks, and keys—frequently end up displaced across classrooms, labs, cafeterias, and auditoriums. Traditional WhatsApp groups or notice boards are noisy, lack structure, offer no automated matching, and provide zero verification.

**SBJain ItemTrace** solves this by providing:
- Structured lost and found item reporting with campus-specific locations and photo uploads.
- An automated **Smart Matching Engine** that calculates similarity scores between lost and found reports using category matching and keyword Jaccard similarity.
- Secure, in-app **private chat** restricted to verified participants.
- Real-time and email-based notification workflows.
- Granular report lifecycle tracking (`active`, `claimed`, `returned`, `closed`).
- A centralized **Admin Console** for campus staff moderation.

---

## 🚀 Key Features

### 1. Authentication & Profiles
- College student registration and login powered by Supabase Auth.
- Role-based authorization (`student` vs `admin`).
- Safe session persistence with real-time auth state synchronization.

### 2. Lost & Found Reporting
- Fast report creation for both **Lost** and **Found** items.
- Pre-configured SB Jain campus locations (Main Building, Labs, Library, Canteen, Workshop, Sports Ground, etc.).
- Image uploads powered by Supabase Storage with client-side 5MB size and format validation (`JPG`, `PNG`, `WEBP`).
- Future date restriction preventing invalid historical entries.

### 3. Smart Matching Algorithm
- Automated real-time matching between complementary reports (Lost ↔ Found).
- Dynamic scoring combining category alignment (40%), location proximity (25%), date range proximity (15%), and tokenized text Jaccard similarity (20%).
- Match threshold highlighting (High confidence match alerts).

### 4. Secure Chat & Handover Coordination
- Private peer-to-peer messaging between reporters of matched items.
- Participant authorization enforced at both UI and PostgreSQL Row Level Security (RLS) layers.
- Inactive report lock: conversations become read-only once either item transitions to `claimed`, `returned`, or `closed`.

### 5. Notifications & Alerts
- Real-time in-app notification center via Supabase Realtime WebSocket subscriptions.
- Non-blocking asynchronous email alerts powered by Nodemailer with deduplication cache and console simulation mode when SMTP credentials are not supplied.
- Direct admin notification dispatch for campus moderation.

### 6. Administrative Management
- Dedicated Admin Console accessible to `dhokvinit@gmail.com` and authorized administrators.
- Live campus metrics dashboard (Total Reports, Active Traces, Resolved Items, Resolution Rate).
- Searchable user directory with instant role inspection.
- Moderation tools to review and close problematic or resolved reports.

### 7. Accessibility & UI/UX Polish
- Accessible modal dialogs (`role="dialog"`, `aria-modal="true"`, Escape key handling).
- Reusable UI components: `LoadingSpinner`, `PageLoader`, `EmptyState`, `ErrorState`, `ImageWithFallback`, and `ButtonLoader`.
- Debounced search inputs (400ms) for high-performance browsing.
- Error Boundary protecting against unexpected runtime crashes.
- Dedicated 404 Not Found screen and smooth scroll restoration.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router 6, Tailwind CSS, Lucide React Icons |
| **Backend API** | Node.js, Express, Nodemailer, Helmet, Express Rate Limit, CORS |
| **Database & Auth** | Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS) |
| **Storage & Realtime** | Supabase Storage (`item-images` bucket), Supabase Realtime Channels |

---

## 📁 Project Structure

```
sb-jainn-item-trace-2.0/
├── backend/
│   ├── config/
│   │   └── environment.js          # Centralized env loader & validator
│   ├── controllers/
│   │   ├── emailController.js      # Alert endpoints logic
│   │   └── healthController.js     # Health & readiness handlers
│   ├── middleware/
│   │   ├── errorMiddleware.js      # Centralized 404 & error handlers
│   │   └── rateLimiter.js          # Express rate limiting
│   ├── routes/
│   │   ├── emailRoutes.js          # Email alert API endpoints
│   │   └── healthRoutes.js         # Health check endpoints (/api/health, /api/ready)
│   ├── services/
│   │   └── emailService.js         # Nodemailer service with simulation fallback
│   ├── supabase_stage*.sql         # Database migrations and schema definitions
│   ├── server.js                   # Express application entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI & Layout components
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── ButtonLoader.jsx
│   │   │   ├── ConfirmationModal.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   ├── ImageWithFallback.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── MatchCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── PageLoader.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ScrollToTop.jsx
│   │   ├── context/                # Context providers (Auth, Notifications)
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── hooks/                  # Custom React hooks (useDebounce)
│   │   ├── pages/                  # Route views
│   │   │   ├── AdminActivityPage.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── AdminReportsPage.jsx
│   │   │   ├── AdminUsersPage.jsx
│   │   │   ├── BrowseItemsPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── ConversationsPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EditReportPage.jsx
│   │   │   ├── ItemDetailsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── MyReportsPage.jsx
│   │   │   ├── NotFoundPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ReportFoundPage.jsx
│   │   │   └── ReportLostPage.jsx
│   │   ├── services/               # Client-side API & Supabase services
│   │   │   ├── adminService.js
│   │   │   ├── chatService.js
│   │   │   ├── emailAlertService.js
│   │   │   ├── itemService.js
│   │   │   ├── matchingService.js
│   │   │   ├── notificationService.js
│   │   │   └── storageService.js
│   │   ├── utils/                  # Validation, error, & env helpers
│   │   │   ├── envCheck.js
│   │   │   ├── errorUtils.js
│   │   │   └── validation.js
│   │   ├── App.jsx                 # Routing configuration
│   │   ├── main.jsx                # React DOM entry
│   │   └── index.css               # Design system & Tailwind styling
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── README.md
```

---

## 💻 Local Installation & Setup

### Prerequisites
- Node.js (v18 or newer)
- Free Supabase project ([supabase.com](https://supabase.com))

### 1. Clone & Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

---

## 🔐 Environment Variables

### Backend Configuration (`backend/.env`)
Create `backend/.env` based on `backend/.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=dhokvinit@gmail.com
EMAIL_FROM="SBJain ItemTrace" <dhokvinit@gmail.com>

# Optional SMTP Settings (If omitted, emails log cleanly in terminal simulation mode)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Supabase Credentials (Backend only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Frontend Configuration (`frontend/.env`)
Create `frontend/.env` based on `frontend/.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_BACKEND_URL=http://localhost:5000
```

> ⚠️ **Security Notice:** Never expose `SUPABASE_SERVICE_ROLE_KEY` or `SMTP_PASS` in the frontend directory or `.env` files.

---

## 🗄️ Supabase Setup & Migrations

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the migration scripts in the `backend/` directory in sequence:
   - `supabase_schema.sql` (Profiles & base triggers)
   - `supabase_schema_items.sql` (Items table & RLS policies)
   - `supabase_storage_setup.sql` (Storage bucket `item-images` & upload policies)
   - `supabase_schema_chat.sql` (Conversations, messages & participant security)
   - `supabase_schema_notifications.sql` (Notifications & realtime trigger)
   - `supabase_stage13_inactive_chat_patch.sql` (Inactive item restrictions)
   - `supabase_stage15_report_management.sql` (Report deletion & lifecycle)
   - `supabase_stage16_email_alerts.sql` (Email logs table)
   - `supabase_stage17_admin.sql` (Admin role, `is_admin()` function & policies)
   - `supabase_stage19_performance_security.sql` (Performance composite indexes)
3. Under **Storage**, ensure the `item-images` bucket exists and is set to **Public**.
4. Under **Authentication > URL Configuration**, add `http://localhost:5173` to allowed redirect URLs.

---

## ▶️ Running the Application

1. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   *Backend will run at `http://localhost:5000`.*

2. **Start Frontend Client:**
   ```bash
   cd frontend
   npm run dev
   ```
   *Frontend will run at `http://localhost:5173`.*

---

## 🌐 Production Deployment Guide

### A. Database (Supabase)
1. Verify all SQL migrations are applied in your production Supabase instance.
2. In Supabase Dashboard -> **Authentication > URL Configuration**, add your production frontend domain (e.g. `https://sbjain-itemtrace.vercel.app`) to Site URL and Redirect URLs.

### B. Backend Deployment (Render / Railway)
1. Deploy the `backend/` directory as a Node.js web service.
2. Set Environment Variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `CLIENT_URL=https://your-frontend-domain.vercel.app`
   - `ADMIN_EMAIL=dhokvinit@gmail.com`
   - `SUPABASE_URL=...`
   - `SUPABASE_ANON_KEY=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
   - (Optional) `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
3. Health check endpoint to monitor: `https://your-backend-service.onrender.com/api/health`.

### C. Frontend Deployment (Vercel / Netlify)
1. Deploy the `frontend/` directory.
2. Build Settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set Environment Variables:
   - `VITE_SUPABASE_URL=https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`
   - `VITE_BACKEND_URL=https://your-backend-service.onrender.com`

---

## 📋 Pre-Deployment & Post-Deployment Checklist

- [x] Frontend production build succeeds (`npm run build`).
- [x] Backend starts and `/api/health` returns status `healthy`.
- [x] CORS restricted to client origin.
- [x] Helmet security headers active.
- [x] Rate limiting active on general and email endpoints.
- [x] Supabase Row Level Security (RLS) active on all tables.
- [x] Storage bucket `item-images` accepts uploads up to 5MB (`JPG`, `PNG`, `WEBP`).
- [x] Inactive item chat locks functioning as expected.
- [x] Single realtime notification subscription active without memory leaks.
- [x] Administrator console secured for `dhokvinit@gmail.com`.
- [x] Responsive layout verified across mobile, tablet, and desktop viewports.

---

## 📄 License & Attribution

Developed for **SB Jain Institute of Technology, Management and Research**.
Project Lead & Administrator: `dhokvinit@gmail.com`.
