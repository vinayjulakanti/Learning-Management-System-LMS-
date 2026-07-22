import React from 'react';

export default function About(){
  return (
    <div className="container" style={{padding:24}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="card" style={{maxWidth:900, margin:'0 auto'}}>
        <h2 style={{marginTop:0}}>About Us</h2>
        <p className="muted">Lumina LMS is a modern, lightweight learning platform that helps institutes deliver courses, manage assignments, track attendance, and communicate with students in one place.</p>
        <p className="muted">Our mission is to make teaching and learning simple and effective. Teachers can create courses and assignments, review submissions, award grades, and share announcements. Students get a clean view of their enrollments, deadlines, notifications, grades, timetable, holidays, and project updates.</p>
        <div style={{marginTop:12}}>
          <ul>
            <li>Courses with descriptions, content, and enrollments</li>
            <li>Assignments, file submissions, and feedback loop</li>
            <li>Grades with teacher view and student visibility</li>
            <li>Notifications for updates, plus mark-read and delete</li>
            <li>Timetable and Holidays published by teachers</li>
            <li>Attendance and Project announcements</li>
          </ul>
        </div>
        <p className="muted" style={{marginTop:12}}>Lumina LMS supports secure authentication (email/password and Google OAuth), role-based access (student/teacher/admin), and a responsive UI designed to work on desktops and mobiles.</p>
      </div>
    </div>
  );
}
