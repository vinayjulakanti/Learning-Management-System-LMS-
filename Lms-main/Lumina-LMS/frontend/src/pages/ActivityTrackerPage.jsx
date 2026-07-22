import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActivityAPI } from '../api/client';
import { Link } from 'react-router-dom';

// MonthGrid for activity heatmap calendar (same style as dashboard but using grey fallback)
const MonthGrid = ({ monthName, monthIndex, year, timeData }) => {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const numDays = new Date(year, monthIndex + 1, 0).getDate();

  const getLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, dateStr: null, seconds: 0 });
  }
  for (let d = 1; d <= numDays; d++) {
    const date = new Date(year, monthIndex, d);
    const dateStr = getLocalDateString(date);
    const seconds = timeData[dateStr] || 0;
    cells.push({ day: d, dateStr, seconds });
  }
  while (cells.length < 35) {
    cells.push({ day: null, dateStr: null, seconds: 0 });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
      <div style={{
        display: 'grid',
        gridTemplateRows: 'repeat(7, 12px)',
        gridAutoFlow: 'column',
        gridGap: '4px',
        height: '108px'
      }}>
        {cells.map((cell, idx) => {
          if (cell.day === null) {
            return <div key={idx} style={{ width: '12px', height: '12px', backgroundColor: 'transparent' }} />;
          }

          let bgColor = 'var(--color-day-empty)'; // Theme-responsive gray day boxes
          if (cell.seconds > 0) {
            if (cell.seconds < 900) bgColor = '#E0F2FE';      // < 15 mins
            else if (cell.seconds < 3600) bgColor = '#7DD3FC'; // 15m - 1h
            else if (cell.seconds < 7200) bgColor = '#0284C7'; // 1h - 2h
            else bgColor = '#0369A1';                         // > 2h
          }

          const hrs = (cell.seconds / 3600).toFixed(2);
          const mins = Math.round((cell.seconds % 3600) / 60);
          const title = `${cell.dateStr}: ${Math.floor(cell.seconds / 3600)}h ${mins}m (${hrs} hrs)`;

          return (
            <div 
              key={idx} 
              title={title}
              style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: bgColor, 
                borderRadius: '2.5px',
                transition: 'all 0.15s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            />
          );
        })}
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '800', marginTop: '4px' }}>{monthName}</span>
    </div>
  );
};

export default function ActivityTrackerPage() {
  const { user } = useAuth();
  const isTeacher = useMemo(() => {
    const r = String(user?.role || '').toLowerCase();
    return r === 'teacher' || r === 'admin';
  }, [user]);

  // Student State
  const [summary, setSummary] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);

  // Admin State
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminReport, setAdminReport] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [err, setErr] = useState('');

  // Fetch Student Summary
  const fetchStudentSummary = async () => {
    setStudentLoading(true);
    try {
      const { data } = await ActivityAPI.mySummary();
      setSummary(data);
    } catch (e) {
      console.error(e);
      setErr('Failed to load activity summary');
    } finally {
      setStudentLoading(false);
    }
  };

  // Fetch Admin Student List
  const fetchStudents = async () => {
    try {
      const { data } = await ActivityAPI.adminStudents(search);
      setStudents(data.students || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isTeacher) {
      fetchStudentSummary();
    } else {
      fetchStudents();
    }
  }, [isTeacher]);

  const handleSearchStudents = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleFetchReport = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStudentId) {
      alert('Please select a student first');
      return;
    }
    setAdminLoading(true);
    setErr('');
    try {
      const { data } = await ActivityAPI.adminReport(selectedStudentId, startDate, endDate);
      setAdminReport(data);
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to load report');
    } finally {
      setAdminLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const report = isTeacher ? adminReport : summary;
    if (!report || !report.dailySummary || report.dailySummary.length === 0) {
      alert('No data available to export');
      return;
    }

    const headers = ['Date', 'First Login', 'Last Logout', 'Active Hours', 'Session Count', 'Courses Accessed', 'Lessons Visited'];
    const rows = report.dailySummary.map(row => [
      row.date,
      new Date(row.firstLoginTime).toLocaleTimeString(),
      new Date(row.lastLogoutTime).toLocaleTimeString(),
      (row.activeDuration / 3600).toFixed(2),
      row.sessionCount,
      (row.coursesAccessed || []).join('; '),
      (row.lessonsVisited || []).join('; ')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const studentName = isTeacher ? adminReport?.student?.name : user?.name;
    link.setAttribute("download", `Lumina_LMS_Activity_${studentName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF (Native print layout window)
  const handleExportPDF = () => {
    const report = isTeacher ? adminReport : summary;
    if (!report) {
      alert('No data to export');
      return;
    }

    const studentName = isTeacher ? report.student?.name : user?.name;
    const studentEmail = isTeacher ? report.student?.email : user?.email;
    const regNo = isTeacher ? (report.student?.rollNo || 'N/A') : (user?.rollNo || 'N/A');
    const totalHours = isTeacher ? report.totalActiveHours : report.aggregates?.lifetimeActiveHours;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Learning Activity Report - ${studentName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: white; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; }
          .meta-info { font-size: 14px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .summary-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 30px; font-size: 16px; font-weight: bold; color: #1e3a8a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; font-size: 14px; }
          th { background: #f1f5f9; font-weight: bold; }
          .timeline { margin-top: 40px; }
          .timeline-title { font-size: 18px; font-weight: bold; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          .log-item { display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 8px 0; font-size: 13px; }
          .btn-print { background: #2563eb; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; float: right; }
          @media print { .btn-print { display: none; } }
        </style>
      </head>
      <body>
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        <div class="header">
          <div>
            <div class="title">Lumina LMS Learning Activity Report</div>
            <div style="font-size: 14px; color: #64748b; margin-top: 4px;">System-generated tracking audit</div>
          </div>
          <div style="text-align: right; font-size: 14px; color: #64748b;">
            Date: ${new Date().toLocaleDateString()}
          </div>
        </div>

        <div class="meta-info">
          <div><strong>Student Name:</strong> ${studentName}</div>
          <div><strong>Email:</strong> ${studentEmail}</div>
          <div><strong>Register Number / ID:</strong> ${regNo}</div>
          <div><strong>Report Range:</strong> ${startDate || 'Lifetime'} ${endDate ? `to ${endDate}` : ''}</div>
        </div>

        <div class="summary-card">
          📈 Total Active Learning Duration: ${totalHours} Hours
        </div>

        <h3>Daily summaries</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>First Login</th>
              <th>Last Logout</th>
              <th>Active Hours</th>
              <th>Sessions Count</th>
            </tr>
          </thead>
          <tbody>
            ${report.dailySummary.map(row => `
              <tr>
                <td>${row.date}</td>
                <td>${new Date(row.firstLoginTime).toLocaleTimeString()}</td>
                <td>${new Date(row.lastLogoutTime).toLocaleTimeString()}</td>
                <td>${(row.activeDuration / 3600).toFixed(2)} hrs</td>
                <td>${row.sessionCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="timeline">
          <div class="timeline-title">Recent Activity Logs</div>
          ${(report.timelineToday || report.logs || []).slice(0, 50).map(log => `
            <div class="log-item">
              <div>
                <strong>${log.activityType.toUpperCase().replace('_', ' ')}</strong> 
                ${log.courseId ? `| Course ID: ${log.courseId}` : ''}
              </div>
              <div style="color: #64748b;">${new Date(log.timestamp).toLocaleString()}</div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Convert seconds to readable format
  const formatTime = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.round((secs % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();

  // Helper to map daily summaries to heatmap input format
  const heatmapData = useMemo(() => {
    const timeData = {};
    const report = isTeacher ? adminReport : summary;
    if (report && report.dailySummary) {
      report.dailySummary.forEach(day => {
        timeData[day.date] = day.activeDuration;
      });
    }
    return timeData;
  }, [summary, adminReport, isTeacher]);

  return (
    <div className="container" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      
      {/* Title block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '0.05em' }}>
          {isTeacher ? 'STUDENT ACTIVITY AUDITOR' : 'LEARNING ACTIVITY DASHBOARD'}
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn" onClick={() => isTeacher ? handleFetchReport() : fetchStudentSummary()} style={{ borderRadius: '6px' }}>
            🔄 Refresh
          </button>
          {((!isTeacher && summary) || (isTeacher && adminReport)) && (
            <>
              <button className="btn primary" onClick={handleExportCSV} style={{ borderRadius: '6px' }}>
                📊 Export CSV
              </button>
              <button className="btn" onClick={handleExportPDF} style={{ borderRadius: '6px' }}>
                🖨️ PDF Report
              </button>
            </>
          )}
        </div>
      </div>

      {err && <div className="alert danger" style={{ marginBottom: '20px' }}>{err}</div>}

      {/* STUDENT INTERFACE */}
      {!isTeacher && (
        studentLoading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading activity data...</div>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Aggregates Grid */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
              {[
                { title: "Today's Active Time", value: formatTime(summary?.aggregates?.todayActiveSeconds || 0), desc: "Time active in portal today", color: '#3b82f6', class: 'dashboard-card-grad-blue' },
                { title: "Weekly Active Time", value: formatTime(summary?.aggregates?.weekActiveSeconds || 0), desc: "This week's learning hours", color: '#8b5cf6', class: 'dashboard-card-grad-purple' },
                { title: "Monthly Active Time", value: formatTime(summary?.aggregates?.monthActiveSeconds || 0), desc: "This month's learning hours", color: '#10b981', class: 'dashboard-card-grad-green' },
                { title: "Lifetime Learning Time", value: formatTime(summary?.aggregates?.lifetimeActiveSeconds || 0), desc: "Total active study hours", color: '#f59e0b', class: 'dashboard-card-grad-orange' },
              ].map((card, i) => (
                <div key={i} className={`card hover-lift ${card.class}`} style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px', position: 'relative', overflow: 'hidden' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '800', color: 'var(--text)', letterSpacing: '0.05em' }}>{card.title}</span>
                    <h3 style={{ margin: '8px 0 4px 0', fontSize: '1.8rem', fontWeight: '900', color: 'var(--text)' }}>{card.value}</h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600' }}>{card.desc}</span>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${card.color}, transparent)` }} />
                </div>
              ))}
            </div>

            {/* Heatmap Calendar Card */}
            <div className="card" style={{ padding: '24px', background: 'var(--panel)', border: '1px solid var(--border)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>
                📅 Learning Calendar Heatmap
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin' }}>
                {months.map((mName, mIdx) => (
                  <MonthGrid key={mIdx} monthName={mName} monthIndex={mIdx} year={currentYear} timeData={heatmapData} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600' }}>
                <span>Less</span>
                <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-day-empty)', borderRadius: '2.5px' }} />
                <div style={{ width: '12px', height: '12px', backgroundColor: '#E0F2FE', borderRadius: '2.5px' }} />
                <div style={{ width: '12px', height: '12px', backgroundColor: '#7DD3FC', borderRadius: '2.5px' }} />
                <div style={{ width: '12px', height: '12px', backgroundColor: '#0284C7', borderRadius: '2.5px' }} />
                <div style={{ width: '12px', height: '12px', backgroundColor: '#0369A1', borderRadius: '2.5px' }} />
                <span>More</span>
              </div>
            </div>

            {/* Split Grid: Daily summaries & Timeline */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Daily Summary */}
              <div className="card" style={{ padding: '24px', background: 'var(--panel)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)' }}>📊 Daily summaries</h3>
                <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 8px', color: 'var(--text)', fontWeight: '700' }}>Date</th>
                        <th style={{ padding: '10px 8px', color: 'var(--text)', fontWeight: '700' }}>Sessions</th>
                        <th style={{ padding: '10px 8px', color: 'var(--text)', fontWeight: '700' }}>Active time</th>
                        <th style={{ padding: '10px 8px', color: 'var(--text)', fontWeight: '700' }}>Courses accessed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary?.dailySummary?.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 8px', fontSize: '0.85rem' }}>{row.date}</td>
                          <td style={{ padding: '10px 8px', fontSize: '0.85rem' }}>{row.sessionCount}</td>
                          <td style={{ padding: '10px 8px', fontSize: '0.85rem', fontWeight: '700' }}>{formatTime(row.activeDuration)}</td>
                          <td style={{ padding: '10px 8px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                            {row.coursesAccessed?.join(', ') || 'None'}
                          </td>
                        </tr>
                      ))}
                      {(!summary?.dailySummary || summary.dailySummary.length === 0) && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No activities logged yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Today's Timeline */}
              <div className="card" style={{ padding: '24px', background: 'var(--panel)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)' }}>⚡ Today's Activity Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
                  {summary?.timelineToday?.map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg)', borderRadius: '8px', borderLeft: '3px solid var(--primary)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>
                          {log.activityType.toUpperCase().replace('_', ' ')}
                        </div>
                        {log.courseId && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>Course ID: {log.courseId}</div>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  {(!summary?.timelineToday || summary.timelineToday.length === 0) && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                      No activity logs recorded today. Start browsing courses to trigger logs!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* ADMIN / INSTRUCTOR AUDIT VIEW */}
      {isTeacher && (
        <div style={{ display: 'grid', gap: '24px' }}>
          
          {/* Controls Bar Card */}
          <div className="card" style={{ padding: '24px', background: 'var(--panel)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.1rem', fontWeight: '800' }}>Search Student Account</h3>
            
            <form onSubmit={handleSearchStudents} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Student Name or Email" 
                style={{ flex: 1, minWidth: '220px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} 
              />
              <button className="btn primary" type="submit">Search</button>
            </form>

            <form onSubmit={handleFetchReport} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>Select Student</label>
                <select 
                  value={selectedStudentId} 
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  required
                >
                  <option value="">-- Choose Account --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>End Date</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} 
                />
              </div>

              <button className="btn primary" type="submit" style={{ padding: '11px', borderRadius: '6px' }}>Generate Report</button>
            </form>
          </div>

          {/* Admin Report Display */}
          {adminLoading ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Compiling activity report...</div>
          ) : (
            adminReport && (
              <div style={{ display: 'grid', gap: '24px' }}>
                
                {/* Aggregates */}
                <div className="card" style={{ padding: '24px', background: 'var(--panel)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderLeft: '4px solid var(--primary)' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '800', color: 'var(--muted)' }}>Target Student Audit</span>
                    <h3 style={{ margin: '4px 0', fontSize: '1.5rem', fontWeight: '900', color: 'var(--text)' }}>{adminReport.student?.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{adminReport.student?.email} | Register No: {adminReport.student?.rollNo || 'N/A'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '800', color: 'var(--muted)' }}>Total Learning Hours</span>
                    <h2 style={{ margin: '4px 0 0 0', fontSize: '2.2rem', fontWeight: '900', color: 'var(--primary)' }}>{adminReport.totalActiveHours} hrs</h2>
                  </div>
                </div>

                {/* Heatmap Calendar Card */}
                <div className="card" style={{ padding: '24px', background: 'var(--panel)', border: '1px solid var(--border)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>
                    📅 Student Learning Heatmap
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin' }}>
                    {months.map((mName, mIdx) => (
                      <MonthGrid key={mIdx} monthName={mName} monthIndex={mIdx} year={currentYear} timeData={heatmapData} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600' }}>
                    <span>Less</span>
                    <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-day-empty)', borderRadius: '2.5px' }} />
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#E0F2FE', borderRadius: '2.5px' }} />
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#7DD3FC', borderRadius: '2.5px' }} />
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#0284C7', borderRadius: '2.5px' }} />
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#0369A1', borderRadius: '2.5px' }} />
                    <span>More</span>
                  </div>
                </div>

                {/* Daily Summary & Audit Trail */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                  {/* Daily Summary Table */}
                  <div className="card" style={{ padding: '24px', background: 'var(--panel)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)' }}>📊 Daily Report Breakdown</h3>
                    <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '10px 8px', color: 'var(--text)', fontWeight: '700' }}>Date</th>
                            <th style={{ padding: '10px 8px', color: 'var(--text)', fontWeight: '700' }}>Sessions</th>
                            <th style={{ padding: '10px 8px', color: 'var(--text)', fontWeight: '700' }}>Active time</th>
                            <th style={{ padding: '10px 8px', color: 'var(--text)', fontWeight: '700' }}>Courses accessed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminReport.dailySummary?.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px 8px', fontSize: '0.85rem' }}>{row.date}</td>
                              <td style={{ padding: '10px 8px', fontSize: '0.85rem' }}>{row.sessionCount}</td>
                              <td style={{ padding: '10px 8px', fontSize: '0.85rem', fontWeight: '700' }}>{formatTime(row.activeDuration)}</td>
                              <td style={{ padding: '10px 8px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                                {row.coursesAccessed?.join(', ') || 'None'}
                              </td>
                            </tr>
                          ))}
                          {(!adminReport.dailySummary || adminReport.dailySummary.length === 0) && (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No activities logged for this student.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Audit Trail Logs */}
                  <div className="card" style={{ padding: '24px', background: 'var(--panel)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)' }}>🛡️ Detailed Audit Trail (Logs)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
                      {adminReport.logs?.map((log, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg)', borderRadius: '8px', borderLeft: '3px solid var(--warning)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>
                              {log.activityType.toUpperCase().replace('_', ' ')}
                            </div>
                            {log.courseId && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>Course ID: {log.courseId}</div>}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'right' }}>
                            <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                            <div style={{ marginTop: '2px', fontSize: '0.72rem' }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      ))}
                      {(!adminReport.logs || adminReport.logs.length === 0) && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                          No activity logs found matching current date criteria.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )
          )}
        </div>
      )}

    </div>
  );
}
