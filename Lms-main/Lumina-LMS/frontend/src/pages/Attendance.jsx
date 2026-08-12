import React, { useEffect, useMemo, useState } from 'react';
import { AttendanceAPI, CoursesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Attendance(){
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const isTeacher = role === 'teacher';

  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [roster, setRoster] = useState([]); // students for selected course
  const [loading, setLoading] = useState(false);
  const [studentCourse, setStudentCourse] = useState('');
  const [error, setError] = useState('');
  const [statuses, setStatuses] = useState({}); // studentId -> 'present' | 'absent'
  const [myStatus, setMyStatus] = useState(''); // for student view (by date)
  const [summary, setSummary] = useState([]); // student subject-wise summary

  const loadCourses = async () => {
    if (!isTeacher) return;
    try {
      const { data } = await CoursesAPI.list();
      const cs = data.courses || [];
      setCourses(cs);
      if (!selectedCourse && cs.length) setSelectedCourse(cs[0]._id);
    } catch (e) { setError(e?.response?.data?.message || 'Failed to load courses'); }
  };

  const loadRosterAndAttendance = async () => {
    if (!isTeacher || !selectedCourse || !date) return;
    setLoading(true); 
    setError('');
    
    try {
      console.log('Loading roster and attendance for course:', selectedCourse, 'date:', date);
      
      // Always load roster
      const { data: r } = await CoursesAPI.roster(selectedCourse);
      const students = (r.students || []).filter(Boolean);
      console.log('Loaded roster:', students.length, 'students');
      setRoster(students);
      
      // Try to load existing attendance, but ignore errors (backend may not implement it yet)
      try {
        console.log('Loading existing attendance for course:', selectedCourse, 'date:', date);
        const { data: a } = await AttendanceAPI.listByDate(date, selectedCourse);
        console.log('Attendance data response:', a);
        
        const map = {};
        const attendanceRecords = a.records || a.attendance || [];
        console.log('Processing attendance records:', attendanceRecords.length);
        
        attendanceRecords.forEach(rec => { 
          if (rec.student?._id) {
            map[rec.student._id] = rec.status;
            console.log('Set attendance for student:', rec.student._id, 'status:', rec.status);
          }
        });
        
        setStatuses(map);
        console.log('Final attendance map:', map);
      } catch (attendanceError) {
        console.error('Error loading attendance:', attendanceError);
        setStatuses({});
      }
    } catch (e) {
      console.error('Error loading roster:', e);
      setError(e?.response?.data?.message || 'Failed to load roster');
    } finally { 
      setLoading(false);
    }
  };

  const loadMy = async () => {
  if (isTeacher) return;

  try {
    // Attendance for selected date
    const { data } = await AttendanceAPI.myForDate(date);

    setMyStatus(
      String(data?.status || '').toLowerCase()
    );

    // Get all attendance records
    const { data: allData } = await AttendanceAPI.myAll();

    const records = Array.isArray(allData?.records)
      ? allData.records
      : [];

    console.log('Student attendance records:', records);

    setSummary(records);

  } catch (error) {
    console.error('Error loading student attendance:', error);
    setMyStatus('');
    setSummary([]);
  }
};

  const loadSummary = async () => {
    if (isTeacher) return;
    try {
      const { data } = await AttendanceAPI.mySummary();
      setSummary(Array.isArray(data?.summary) ? data.summary : []);
    } catch (_) { setSummary([]); }
  };

  useEffect(()=>{ loadCourses(); /* eslint-disable-next-line */ }, [isTeacher]);
  useEffect(()=>{ loadRosterAndAttendance(); /* eslint-disable-next-line */ }, [selectedCourse, date]);
  useEffect(()=>{ loadMy(); /* eslint-disable-next-line */ }, [date, role]);

  const setFor = async (studentId, status) => {
    const prev = statuses[studentId];
    setStatuses(old => ({ ...old, [studentId]: status }));
    
    try {
      console.log('Setting attendance:', { date, courseId: selectedCourse, studentId, status });
      console.log('API call parameters:', date, selectedCourse, studentId, status);
      
      // Validate required fields before API call
      if (!date || !selectedCourse || !studentId || !status) {
        console.error('Missing required fields for attendance update');
        alert('Missing required fields: date, course, student, and status are required');
        setStatuses(old => ({ ...old, [studentId]: prev }));
        return;
      }
      
      // Validate course and student IDs
      if (!selectedCourse || selectedCourse === 'undefined' || selectedCourse === 'null') {
        console.error('Invalid course ID:', selectedCourse);
        alert('Invalid course selected. Please select a valid course.');
        setStatuses(old => ({ ...old, [studentId]: prev }));
        return;
      }
      
      if (!studentId || studentId === 'undefined' || studentId === 'null') {
        console.error('Invalid student ID:', studentId);
        alert('Invalid student selected.');
        setStatuses(old => ({ ...old, [studentId]: prev }));
        return;
      }
      
      console.log('Making API call to update attendance...');
      const response = await AttendanceAPI.setStatus(date, selectedCourse, studentId, status);
      console.log('Attendance update response:', response);
      
      // Show success feedback
      const successMsg = `Attendance marked as ${status.toUpperCase()} for student`;
      alert(successMsg);
      
      // Refresh the roster to show updated attendance
      setTimeout(() => {
        loadRosterAndAttendance();
      }, 500);
      
    } catch (e) {
      console.error('Attendance update error:', e);
      console.error('Error details:', {
        message: e?.message,
        response: e?.response,
        status: e?.response?.status,
        data: e?.response?.data,
        config: e?.config
      });
      
      // Revert on failure and inform politely
      setStatuses(old => ({ ...old, [studentId]: prev }));
      
      let errorMsg = 'Failed to update attendance';
      if (e?.response?.data?.message) {
        errorMsg = e.response.data.message;
      } else if (e?.response?.status === 400) {
        errorMsg = 'Invalid attendance data. Please check all fields.';
      } else if (e?.response?.status === 403) {
        errorMsg = 'You do not have permission to update attendance.';
      } else if (e?.response?.status === 404) {
        errorMsg = 'Student or course not found. Please refresh the page.';
      } else if (e?.response?.status === 500) {
        errorMsg = 'Server error. Please try again later.';
      } else if (e?.code === 'NETWORK_ERROR') {
        errorMsg = 'Network error. Please check your connection.';
      } else if (e?.message) {
        errorMsg = e.message;
      }
      
      alert(errorMsg);
    }
  };
  const publishAttendance = async () => {
  try {
    await AttendanceAPI.publish({
      courseId: selectedCourse,
      date,
    });

    alert("✅ Attendance Published Successfully");

    loadRosterAndAttendance();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to publish attendance");
  }
};

const saveDraft = () => {
  alert("✅ Attendance Saved");
};
const studentCourseAttendance = useMemo(() => {
  if (isTeacher) return [];

  const grouped = {};

  summary.forEach((record) => {

    // Try all possible course formats
    const courseObject =
      typeof record.course === 'object'
        ? record.course
        : null;

    const courseId =
      record.courseId ||
      courseObject?._id ||
      record.course?._id;

    if (!courseId) return;

    const id = String(courseId);

    if (!grouped[id]) {
      grouped[id] = {
        courseId: id,
        courseTitle:
          record.courseTitle ||
          courseObject?.title ||
          courseObject?.name ||
          'Course',

        present: 0,
        absent: 0,
        total: 0
      };
    }

    // If backend already gives summary values
    if (
      record.presents !== undefined ||
      record.total !== undefined
    ) {
      grouped[id].present = Number(
        record.presents || 0
      );

      grouped[id].total = Number(
        record.total || 0
      );

      grouped[id].absent = Math.max(
        0,
        grouped[id].total -
          grouped[id].present
      );

      return;
    }

    // Otherwise process individual attendance record
    const status =
      String(record.status || '').toLowerCase();

    if (status === 'present') {
      grouped[id].present += 1;
    }

    if (status === 'absent') {
      grouped[id].absent += 1;
    }

    grouped[id].total += 1;
  });

  return Object.values(grouped).map((course) => ({
    ...course,

    percentage:
      course.total > 0
        ? Math.round(
            (course.present / course.total) * 100
          )
        : 0
  }));

}, [summary, isTeacher]);

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="card" style={{maxWidth:980, margin:'24px auto', padding:16}}>
        <div className="row" style={{alignItems:'center', gap:12}}>
          <h2 style={{margin:'0 8px 0 0'}}>Attendance</h2>
          <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
          {isTeacher && (
            <>
              <label className="muted" style={{marginLeft:8}}>Course</label>
              <select value={selectedCourse} onChange={(e)=>setSelectedCourse(e.target.value)}>
                {courses.map(c => (<option key={c._id} value={c._id}>{c.title}</option>))}
              </select>
            </>
          )}
        </div>

        {error && <div className="alert danger" style={{marginTop:12}}>{error}</div>}

        {isTeacher ? (
          <div style={{marginTop:12}}>
            {loading ? (
              <div className="card">Loading roster…</div>
            ) : roster.length === 0 ? (
              <div className="muted">No students enrolled in this course.</div>
            ) : (
              <div className="list">
  {roster.map((s) => (
    <div
      key={s._id}
      className="row"
      style={{ alignItems: "center", gap: 8 }}
    >
      <div style={{ minWidth: 220 }}>
        <div style={{ fontWeight: 600 }}>{s.name}</div>
        <div className="muted small">
          Roll no: {s.rollNo || "N/A"}
        </div>
      </div>

      <div
        className="tag"
        style={{ marginLeft: "auto" }}
      >
        {(statuses[s._id] || "").toUpperCase() || "—"}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          className="btn"
          onClick={() => setFor(s._id, "present")}
        >
          Present ✅
        </button>

        <button
          className="btn"
          onClick={() => setFor(s._id, "absent")}
        >
          Absent ❌
        </button>
      </div>
    </div>
  ))}

  {/* Buttons */}

  <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      gap: 15,
      marginTop: 25,
    }}
  >
    <button
      className="btn"
      onClick={saveDraft}
    >
      💾 Save
    </button>

    <button
      className="btn primary"
      onClick={publishAttendance}
    >
      📢 Publish
    </button>
  </div>
</div>
            )}
          </div>
        ) : (
  <div style={{ marginTop: 20 }}>

    {/* Student Attendance Header */}
    <div
      style={{
        background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
        borderRadius: 20,
        padding: "28px",
        color: "white",
        marginBottom: 20,
        boxShadow: "0 10px 30px rgba(37, 99, 235, 0.18)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap"
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              opacity: 0.85,
              marginBottom: 6
            }}
          >
            STUDENT ATTENDANCE
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 28
            }}
          >
            Attendance Overview
          </h2>

          <div
            style={{
              marginTop: 8,
              opacity: 0.9
            }}
          >
            {user?.name}
            {user?.rollNo ? ` • Roll No: ${user.rollNo}` : ""}
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.14)",
            padding: "12px 18px",
            borderRadius: 12,
            backdropFilter: "blur(8px)"
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Selected Date
          </div>

          <div style={{ fontWeight: 600 }}>
            {new Date(date).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>


    {/* Today's Attendance */}
    <div
      className="card"
      style={{
        marginBottom: 20,
        padding: 24,
        borderRadius: 18
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 15
        }}
      >
        <div>
          <div className="muted small">
            TODAY'S ATTENDANCE
          </div>

          <h3 style={{ margin: "5px 0" }}>
            {new Date(date).toLocaleDateString()}
          </h3>
        </div>

        <div
          style={{
            padding: "10px 18px",
            borderRadius: 30,
            fontWeight: 700,
            fontSize: 14,
            background:
              myStatus === "present"
                ? "#dcfce7"
                : myStatus === "absent"
                ? "#fee2e2"
                : "#f3f4f6",
            color:
              myStatus === "present"
                ? "#166534"
                : myStatus === "absent"
                ? "#991b1b"
                : "#374151"
          }}
        >
          {myStatus === "present"
            ? "✓ PRESENT"
            : myStatus === "absent"
            ? "✕ ABSENT"
            : "NOT MARKED"}
        </div>
      </div>
    </div>


    {/* Overall Attendance */}
    <div
      className="card"
      style={{
        marginBottom: 20,
        padding: 24,
        borderRadius: 18
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 30,
          flexWrap: "wrap"
        }}
      >

        {/* Circular Percentage */}
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: "50%",
            background:
              summary.length === 0
                ? "#e5e7eb"
                : `conic-gradient(
                    #2563eb ${Math.round(
                      summary.reduce(
                        (total, item) =>
                          total + Number(item.presents || 0),
                        0
                      ) /
                      Math.max(
                        summary.reduce(
                          (total, item) =>
                            total + Number(item.total || 0),
                          0
                        ),
                        1
                      ) *
                      100
                    )}%,
                    #e5e7eb 0
                  )`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: "50%",
              background: "var(--panel)",
              display: "grid",
              placeItems: "center",
              textAlign: "center"
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#2563eb"
                }}
              >
                {summary.length > 0
                  ? Math.round(
                      (summary.reduce(
                        (total, item) =>
                          total + Number(item.presents || 0),
                        0
                      ) /
                        Math.max(
                          summary.reduce(
                            (total, item) =>
                              total + Number(item.total || 0),
                            0
                          ),
                          1
                        )) *
                        100
                    )
                  : 0}
                %
              </div>

              <div className="muted small">
                Overall
              </div>
            </div>
          </div>
        </div>


        {/* Overall Statistics */}
        <div style={{ flex: 1, minWidth: 250 }}>
          <div className="muted small">
            OVERALL ATTENDANCE
          </div>

          <h2 style={{ margin: "5px 0 15px" }}>
            Attendance Summary
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(120px,1fr))",
              gap: 10
            }}
          >

            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#eff6ff"
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#2563eb"
                }}
              >
                {summary.reduce(
                  (total, item) =>
                    total + Number(item.total || 0),
                  0
                )}
              </div>

              <div className="muted small">
                Total Classes
              </div>
            </div>


            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#f0fdf4"
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#16a34a"
                }}
              >
                {summary.reduce(
                  (total, item) =>
                    total + Number(item.presents || 0),
                  0
                )}
              </div>

              <div className="muted small">
                Present
              </div>
            </div>


            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#fef2f2"
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#dc2626"
                }}
              >
                {summary.reduce(
                  (total, item) =>
                    total +
                    (Number(item.total || 0) -
                      Number(item.presents || 0)),
                  0
                )}
              </div>

              <div className="muted small">
                Absent
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>


    {/* Subject-wise Attendance */}
    <div
      className="card"
      style={{
        padding: 24,
        borderRadius: 18
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20
        }}
      >
        <div>
          <div className="muted small">
            SUBJECT PERFORMANCE
          </div>

          <h3 style={{ margin: "5px 0" }}>
            📚 Subject-wise Attendance
          </h3>
        </div>

        <div className="tag">
          {summary.length} Subjects
        </div>
      </div>


      {summary.length === 0 ? (
        <div className="muted">
          No attendance records yet.
        </div>
      ) : (

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(280px,1fr))",
            gap: 16
          }}
        >

          {summary.map((item) => {

            const percentage = Number(
              item.percentage || 0
            );

            const present =
              Number(item.presents || 0);

            const total =
              Number(item.total || 0);

            const absent =
              Math.max(0, total - present);

            const status =
              percentage >= 75
                ? "Good"
                : percentage >= 60
                ? "Warning"
                : "Low";

            return (
              <div
                key={String(
                  item.courseId ||
                  item.courseTitle
                )}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: 18,
                  background: "var(--panel)",
                  boxShadow:
                    "0 4px 14px rgba(0,0,0,0.05)"
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 18
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16
                      }}
                    >
                      {item.courseTitle || "Course"}
                    </div>

                    <div className="muted small">
                      {present} present / {total} classes
                    </div>
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        percentage >= 75
                          ? "#16a34a"
                          : percentage >= 60
                          ? "#d97706"
                          : "#dc2626"
                    }}
                  >
                    {percentage}%
                  </div>
                </div>


                {/* Progress */}
                <div
                  style={{
                    height: 10,
                    background: "#e5e7eb",
                    borderRadius: 10,
                    overflow: "hidden",
                    marginBottom: 14
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, percentage)
                      )}%`,
                      height: "100%",
                      background:
                        percentage >= 75
                          ? "#22c55e"
                          : percentage >= 60
                          ? "#f59e0b"
                          : "#ef4444",
                      borderRadius: 10,
                      transition:
                        "width 0.4s ease"
                    }}
                  />
                </div>


                {/* Stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3,1fr)",
                    gap: 8
                  }}
                >

                  <div
                    style={{
                      textAlign: "center",
                      padding: 9,
                      borderRadius: 10,
                      background: "#f0fdf4"
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#16a34a"
                      }}
                    >
                      {present}
                    </div>

                    <div
                      className="small"
                      style={{
                        color: "#166534"
                      }}
                    >
                      Present
                    </div>
                  </div>


                  <div
                    style={{
                      textAlign: "center",
                      padding: 9,
                      borderRadius: 10,
                      background: "#fef2f2"
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#dc2626"
                      }}
                    >
                      {absent}
                    </div>

                    <div
                      className="small"
                      style={{
                        color: "#991b1b"
                      }}
                    >
                      Absent
                    </div>
                  </div>


                  <div
                    style={{
                      textAlign: "center",
                      padding: 9,
                      borderRadius: 10,
                      background: "#f3f4f6"
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700
                      }}
                    >
                      {total}
                    </div>

                    <div className="muted small">
                      Total
                    </div>
                  </div>

                </div>


                {/* Attendance status */}
                <div
                  style={{
                    marginTop: 14,
                    textAlign: "center",
                    padding: 7,
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      percentage >= 75
                        ? "#dcfce7"
                        : percentage >= 60
                        ? "#fef3c7"
                        : "#fee2e2",
                    color:
                      percentage >= 75
                        ? "#166534"
                        : percentage >= 60
                        ? "#92400e"
                        : "#991b1b"
                  }}
                >
                  {percentage >= 75
                    ? "✓ Attendance is good"
                    : percentage >= 60
                    ? "⚠ Attendance needs attention"
                    : "✕ Low attendance"}
                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>

  </div>
)}
      </div>
    </div>
  );
}
