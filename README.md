# Lumina LMS - Premium Learning Management System

Lumina LMS is an enterprise-grade, high-performance, and visually stunning Learning Management System (LMS) built with React (frontend) and Node/Express/Mongoose (backend). It features role-isolated dashboards, real-time activity tracking, automated notifications, interactive SVG analytics, and native mobile compilation readiness via Capacitor.

---

## Key Features

- **Dynamic Isolated Dashboards**: Fully custom dashboards tailored separately for **Students** and **Instructors/Admins** to maximize productivity and space layout usage (supporting 1920px+ viewports).
- **Automated Notification Center**: Real-time sliding toast notifications and sound cues for events like assignment releases, grades awarded, security warnings, and announcements.
- **Active Habit Tracking**: High-performance, idle-aware activity tracker measuring study durations per student with interactive calendars and heatmaps.
- **Grades & Submissions Auditor**: Instant grading panel for teachers and feedback viewer for students.
- **Content Manager**: Flexible page layout builder for course pages, schedules, and custom HTML content sections.
- **Dark & Light Mode Integration**: High-contrast, glassmorphism theme components toggling instantly from the header controls.

---

## Tech Stack

- **Frontend**: React (18.2.0), React Router DOM (v6), Axios, Lucide Icons, Custom Inline SVG charts (optimized for mobile).
- **Backend**: Node.js, Express.js (v5), Mongoose (MongoDB ORM), JWT Authentication, Bcrypt.
- **Mobile Integration**: Capacitor CLI/Core (Android packaging wrapper).

---

## Folder Structure

```text
Lms/
├── README.md                  # Master documentation file
├── .gitignore                 # Root version control filter
├── .env.example               # Configuration template
└── Lms-main/
    ├── Lumina-LMS/            # React frontend application
    │   ├── src/               # Component and page code
    │   └── package.json       # Frontend scripts & dependencies
    └── Lumina-LMS-backend/    # Express REST API backend server
        ├── src/               # Routers, models, and middleware
        └── server.js          # API entryway script
```

---

## Installation & Setup

### 1. Database Requirement
- Install and start MongoDB locally on port `27017` or obtain a valid MongoDB connection string.

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd Lms-main/Lumina-LMS-backend
   ```
2. Create a `.env` file based on `.env.example` and configure your credentials:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/lms_db
   JWT_SECRET=your_jwt_secret_key
   ```
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd Lms-main/Lumina-LMS/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local server:
   ```bash
   npm start
   ```
   The site will load automatically at **http://localhost:3000**.

---

## Android Packaging via Capacitor

To compile the React web application into a native Android APK:

1. Navigate to the frontend folder (`Lms-main/Lumina-LMS/frontend`).
2. Build the production React bundle:
   ```bash
   npm run build
   ```
3. Sync the compiled static assets into the Android native layout:
   ```bash
   npx cap sync
   ```
4. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
5. Inside Android Studio, build the APK or sign the bundle:
   - Go to **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
