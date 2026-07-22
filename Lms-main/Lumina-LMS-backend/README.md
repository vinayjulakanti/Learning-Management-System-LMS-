# Lumina LMS

A lightweight Learning Management System consisting of a React frontend and a Node/Express backend.

---

## Team

- Team Name: <NOVANEX>
- Members:
  1.J Vinay Kumar
  2.P Venkata Sai Jayanth
  3.K Rohith
  4.B Sathish

Update this section with your actual details before submitting.

---

## How to push this project to GitHub (step by step)

1) Install Git
- Download and install from https://git-scm.com/downloads

2) Create a public repository
- Go to https://github.com and create a new repo (e.g., `Lumina-LMS`). Leave it empty (no README/.gitignore/license) if possible.

3) Initialize and push (from this folder)
```powershell
# From: c:\Users\vinay\OneDrive\Desktop\project\my-backend
# Set your identity (one time)
git config user.name "<your name>"
git config user.email "<your email>"

# Ignore heavy/private files
echo node_modules/>>.gitignore
echo dist/>>.gitignore
echo build/>>.gitignore
echo logs/>>.gitignore
echo *.log>>.gitignore
echo .env>>.gitignore
echo .env.*>>.gitignore

# Commit and push
git add -A
git commit -m "Initial commit"
# If remote not set yet:
# git remote add origin https://github.com/<your-username>/Lumina-LMS.git
# If remote has content already, first pull with rebase
# git pull --rebase origin main

git push -u origin main
```

If push is rejected because the remote has existing commits, run:
```powershell
git pull --rebase origin main
git push -u origin main
```

If you truly need to overwrite remote (not recommended):
```powershell
git push --force-with-lease origin main
```

---

## How to run locally

### Prerequisites
- Node.js 18+ and npm 9+
- MongoDB (local or cloud e.g., MongoDB Atlas)

### Backend (this folder)
1) Install deps
```bash
npm install
```
2) Environment
Create `.env` (do not commit it):
```
PORT=3002
MONGO_URI=mongodb://localhost:27017/lumina
JWT_SECRET=replace_me
CLIENT_ORIGIN=http://localhost:3001
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```
3) Start server
```bash
npm run dev     # with nodemon
# or
npm start
```
Server runs at `http://localhost:3002`.

### Frontend
From `c:\Users\vinay\OneDrive\Desktop\project\frontend`:
```bash
npm install
npm start
```
App runs at `http://localhost:3001`.

---

## Deployment options

- Netlify (frontend): connect the `frontend/` folder, build command `npm run build`, publish `build/`.
- Vercel (frontend): import from GitHub, framework React, build `npm run build`.
- Render / Railway / Fly.io (backend): deploy Node server, set environment variables from `.env`, add a MongoDB addon or connect Atlas.
- OnRender quick start (backend):
  - New Web Service → Connect GitHub repo → Root: `my-backend/`
  - Build command: `npm install`
  - Start command: `node server.js` (or `npm start`)
  - Add env vars from `.env`

---

## Project overview

- Authentication: Email/password, Google OAuth
- Roles: Student, Teacher, Admin
- Core features:
  - Courses, Enrollments
  - Assignments, Submissions, Grades
  - Notifications
  - Timetable, Holidays, Attendance, Project announcements
- Tech stack:
  - Frontend: React
  - Backend: Node/Express, MongoDB

---

## License
Add your preferred license (e.g., MIT) here.
