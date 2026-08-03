import React, { useEffect, useState } from "react";
import { TimetableAPI, CoursesAPI } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Timetable() {
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState("");
const { user } = useAuth();

const isTeacher =
  user?.role === "teacher" || user?.role === "admin";
  const [day, setDay] = useState("Monday");
  const [subject, setSubject] = useState("");
  const [faculty, setFaculty] = useState("");
  const [room, setRoom] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);
  useEffect(() => {
  if (isTeacher) {
    loadTimetable();
  } else {
    loadStudentTimetable();
  }
}, [course, isTeacher]);
async function loadStudentTimetable() {
  try {
    const { data } = await TimetableAPI.myTimetable();
    setRows(data.timetable || []);
  } catch (err) {
    console.log(err);
  }
}

  async function loadCourses() {
    const { data } = await CoursesAPI.list();
    setCourses(data.courses || []);

    if (data.courses.length)
      setCourse(data.courses[0]._id);
  }
  async function loadTimetable() {
  if (!course) return;

  try {
    const { data } = await TimetableAPI.get(course);
    setRows(data.timetable || []);
  } catch (err) {
    console.log(err);
  }
}

  async function save() {
    try {
      await TimetableAPI.save({
        course,
        day,
        subject,
        faculty,
        room,
        startTime,
        endTime,
      });

      alert("Timetable Saved");

loadTimetable();
    } catch (err) {
      console.log(err);
      alert("Failed");
    }
  }
async function deleteRow(id) {
  try {
    await TimetableAPI.delete(id);

    alert("Deleted");

    loadTimetable();

  } catch (err) {
    console.log(err);

    alert("Delete failed");
  }
}
  return (
    <div className="container">

      <h2>
  {isTeacher ? "Teacher Timetable" : "Current Timetable"}
</h2>

      {isTeacher && (
  <>
    <select value={course} onChange={(e) => setCourse(e.target.value)}>
      {courses.map((c) => (
        <option key={c._id} value={c._id}>
          {c.title}
        </option>
      ))}
    </select>

    <br /><br />

    <select value={day} onChange={(e) => setDay(e.target.value)}>
      <option>Monday</option>
      <option>Tuesday</option>
      <option>Wednesday</option>
      <option>Thursday</option>
      <option>Friday</option>
    </select>

    <br /><br />

    <input
      placeholder="Subject"
      value={subject}
      onChange={(e) => setSubject(e.target.value)}
    />

    <br /><br />

    <input
      placeholder="Faculty"
      value={faculty}
      onChange={(e) => setFaculty(e.target.value)}
    />

    <br /><br />

    <input
      placeholder="Room"
      value={room}
      onChange={(e) => setRoom(e.target.value)}
    />

    <br /><br />

    <input
      type="time"
      value={startTime}
      onChange={(e) => setStartTime(e.target.value)}
    />

    <input
      type="time"
      value={endTime}
      onChange={(e) => setEndTime(e.target.value)}
    />

    <br /><br />

    <button onClick={save}>
      Save Timetable
    </button>

    <hr />
  </>
)}
      <hr />



<table
  border="1"
  cellPadding="10"
  style={{ marginTop: 20, width: "100%" }}
>
  <thead>
    <tr>
      <th>Day</th>
      <th>Subject</th>
      <th>Faculty</th>
      <th>Room</th>
      <th>Time</th>
{isTeacher && <th>Action</th>}
    </tr>
  </thead>

  <tbody>
    {rows.map((item) => (
      <tr key={item._id}>
        <td>{item.day}</td>
        <td>{item.subject}</td>
        <td>{item.faculty}</td>
        <td>{item.room}</td>
        <td>
  {item.startTime} - {item.endTime}
</td>

{isTeacher && (
  <td>
    <button onClick={() => deleteRow(item._id)}>
      Delete
    </button>
  </td>
)}
      </tr>
    ))}
  </tbody>
</table>

    </div>
  );
}