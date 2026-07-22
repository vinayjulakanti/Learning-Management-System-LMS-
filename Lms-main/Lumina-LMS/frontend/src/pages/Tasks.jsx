import React, { useEffect, useState } from 'react';
import { TasksAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Tasks() {
  const { user } = useAuth();
  const isTeacher = (String(user?.role || '').toLowerCase() === 'teacher');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    student: '',
    course: '',
    dueDate: '',
    priority: 'medium'
  });
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadTasks();
    if (isTeacher) {
      loadStudentsAndCourses();
    }
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await TasksAPI.list();
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsAndCourses = async () => {
    try {
      // In a real app, you'd fetch students and courses from APIs
      // For now, using sample data
      setStudents([
        { _id: 'student1', name: 'John Doe', email: 'john@example.com' },
        { _id: 'student2', name: 'Jane Smith', email: 'jane@example.com' }
      ]);
      setCourses([
        { _id: 'course1', title: 'Mathematics' },
        { _id: 'course2', title: 'Science' }
      ]);
    } catch (e) {
      console.error('Failed to load students/courses:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.student || !formData.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editingTask) {
        await TasksAPI.update(editingTask._id, formData);
      } else {
        await TasksAPI.create(formData);
      }
      await loadTasks();
      setShowCreateForm(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        student: '',
        course: '',
        dueDate: '',
        priority: 'medium'
      });
      setError('');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      student: task.student._id,
      course: task.course?._id || '',
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      priority: task.priority
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    setLoading(true);
    try {
      await TasksAPI.delete(taskId);
      await loadTasks();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async (taskId) => {
    setLoading(true);
    try {
      await TasksAPI.submit(taskId);
      await loadTasks();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#ef4444',
      'urgent': '#dc2626'
    };
    return colors[priority] || '#64748b';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'in-progress': '#3b82f6',
      'completed': '#10b981',
      'overdue': '#dc2626'
    };
    return colors[status] || '#64748b';
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      
      <div className="card" style={{maxWidth:1200, margin:'24px auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
          <h2 style={{marginTop:0, marginBottom:0}}>📝 Tasks</h2>
          {isTeacher && (
            <button 
              className="btn primary"
              onClick={() => {
                setShowCreateForm(true);
                setEditingTask(null);
                setFormData({
                  title: '',
                  description: '',
                  student: '',
                  course: '',
                  dueDate: '',
                  priority: 'medium'
                });
              }}
            >
              ➕ Assign New Task
            </button>
          )}
        </div>

        {error && <div className="alert danger" style={{marginBottom:16}}>{error}</div>}

        {/* Create/Edit Task Form */}
        {showCreateForm && (
          <div style={{
            background:'var(--color-bg)',
            padding:20,
            borderRadius:12,
            marginBottom:24
          }}>
            <h3 style={{marginTop:0, marginBottom:16}}>
              {editingTask ? 'Edit Task' : 'Assign New Task'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:16, marginBottom:16}}>
                <div>
                  <label>Task Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Complete Assignment 3"
                    required
                  />
                </div>
                <div>
                  <label>Student *</label>
                  <select
                    value={formData.student}
                    onChange={(e) => setFormData({...formData, student: e.target.value})}
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Course</label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div style={{marginBottom:16}}>
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Task description and instructions"
                  rows={4}
                  required
                />
              </div>

              <div style={{display:'flex', gap:8}}>
                <button 
                  type="submit" 
                  className="btn primary" 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingTask ? 'Update Task' : 'Assign Task')}
                </button>
                <button 
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTask(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        {loading ? (
          <div style={{textAlign:'center', padding:40}}>
            <div className="muted">Loading tasks...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{textAlign:'center', padding:40, background:'var(--color-bg)', borderRadius:12}}>
            <div style={{fontSize:48, marginBottom:16}}>📝</div>
            <div className="muted" style={{fontSize:16}}>
              {isTeacher ? 'No tasks assigned yet' : 'No tasks assigned to you'}
            </div>
            <div className="muted" style={{fontSize:14, marginTop:8}}>
              {isTeacher ? 'Click "Assign New Task" to create your first task' : 'Your teacher will assign tasks here'}
            </div>
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px'}}>
            {tasks.map(task => (
              <div key={task._id} style={{
                border:'1px solid var(--border)',
                borderRadius:12,
                padding:20,
                background:'var(--panel)',
                transition:'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }} className="task-card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:12}}>
                  <div style={{flex:1, marginRight: '16px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap: 'wrap'}}>
                      <h4 style={{margin:0, color:'var(--text)', fontSize: '1.05rem'}}>{task.title}</h4>
                      <span style={{
                        background:getPriorityColor(task.priority),
                        color:'white',
                        padding:'2px 8px',
                        borderRadius:12,
                        fontSize:10,
                        fontWeight:600,
                        textTransform:'capitalize'
                      }}>
                        {task.priority}
                      </span>
                      {isOverdue(task.dueDate) && task.status !== 'completed' && (
                        <span style={{
                          background:'#dc2626',
                          color:'white',
                          padding:'2px 8px',
                          borderRadius:12,
                          fontSize:10,
                          fontWeight:600
                        }}>
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p style={{margin:'0 0 12px 0', color:'var(--muted)', fontSize:14, lineHeight: 1.5}}>
                      {task.description}
                    </p>
                    <div style={{display:'flex', flexWrap: 'wrap', gap:'12px', fontSize:12, color:'var(--muted)'}}>
                      <span style={{ background: 'var(--bg)', padding: '4px 8px', borderRadius: '6px' }}>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                      {task.course && <span style={{ background: 'var(--bg)', padding: '4px 8px', borderRadius: '6px' }}>📚 {task.course.title}</span>}
                      <span style={{ background: 'var(--bg)', padding: '4px 8px', borderRadius: '6px' }}>👤 {isTeacher ? task.student.name : task.teacher.name}</span>
                    </div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:12}}>
                    <span style={{
                      background:getStatusColor(task.status),
                      color:'white',
                      padding:'4px 8px',
                      borderRadius:6,
                      fontSize:12,
                      fontWeight:600,
                      textTransform:'capitalize'
                    }}>
                      {task.status.replace('-', ' ')}
                    </span>
                    <div style={{display:'flex', gap:4}}>
                      {isTeacher ? (
                        <>
                          <button 
                            className="btn"
                            onClick={() => handleEdit(task)}
                            style={{padding:'4px 8px', fontSize:12}}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn"
                            onClick={() => handleDelete(task._id)}
                            style={{padding:'4px 8px', fontSize:12, background:'#fee2e2', color:'#dc2626', border:'none'}}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        task.status !== 'completed' && (
                          <button 
                            className="btn primary"
                            onClick={() => handleSubmitTask(task._id)}
                            disabled={loading}
                            style={{padding:'4px 12px', fontSize:12}}
                          >
                            Submit
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .task-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
