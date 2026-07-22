import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Feedback() {
  const { user } = useAuth();
  const [form, setForm] = useState({ 
    subject: '', 
    message: '', 
    category: 'general',
    priority: 'medium',
    rating: 5
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Sample feedback history
  const sampleFeedbackHistory = [
    {
      id: 1,
      subject: 'Course Content Improvement',
      category: 'academic',
      priority: 'medium',
      rating: 4,
      message: 'The course content is good but could use more practical examples.',
      date: '2024-01-15',
      status: 'resolved',
      response: 'Thank you for your feedback! We have added more practical examples to the course.'
    },
    {
      id: 2,
      subject: 'Platform Performance',
      category: 'technical',
      priority: 'high',
      rating: 2,
      message: 'The platform is slow during peak hours.',
      date: '2024-01-10',
      status: 'in-progress',
      response: 'We are working on optimizing the server performance. Thank you for your patience.'
    },
    {
      id: 3,
      subject: 'Mobile App Request',
      category: 'feature',
      priority: 'low',
      rating: 5,
      message: 'Please develop a mobile app for better accessibility.',
      date: '2024-01-05',
      status: 'pending',
      response: null
    }
  ];

  useEffect(() => {
    setFeedbackHistory(sampleFeedbackHistory);
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 1000));
      
      // Add to history
      const newFeedback = {
        id: feedbackHistory.length + 1,
        ...form,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        response: null
      };
      
      setFeedbackHistory([newFeedback, ...feedbackHistory]);
      setSent(true);
      setForm({ subject: '', message: '', category: 'general', priority: 'medium', rating: 5 });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'in-progress': '#3b82f6',
      'resolved': '#10b981'
    };
    return colors[status] || '#64748b';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'academic': '📚',
      'technical': '⚙️',
      'feature': '✨',
      'general': '💬'
    };
    return icons[category] || '📄';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#dc2626',
      'medium': '#f59e0b',
      'low': '#10b981'
    };
    return colors[priority] || '#64748b';
  };

  const StarRating = ({ rating, onChange }) => {
    return (
      <div style={{display:'flex', gap:4}}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange('rating', star)}
            style={{
              background:'none',
              border:'none',
              fontSize:20,
              cursor:'pointer',
              color: star <= rating ? '#fbbf24' : '#d1d5db'
            }}
          >
            {star <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      
      <div className="card" style={{maxWidth:900, margin:'24px auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
          <h2 style={{marginTop:0, marginBottom:0}}>📝 Feedback</h2>
          <button 
            className="btn"
            onClick={() => setShowHistory(!showHistory)}
            style={{padding:'8px 16px', borderRadius:8}}
          >
            {showHistory ? 'Hide History' : 'Show History'} ({feedbackHistory.length})
          </button>
        </div>

        {!sent ? (
          <form className="form" onSubmit={onSubmit}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:16, marginBottom:16}}>
              <div>
                <label>Category</label>
                <select 
                  name="category" 
                  value={form.category} 
                  onChange={onChange}
                  style={{padding:8, borderRadius:6, border:'1px solid var(--border)', width:'100%'}}
                >
                  <option value="general">💬 General</option>
                  <option value="academic">📚 Academic</option>
                  <option value="technical">⚙️ Technical</option>
                  <option value="feature">✨ Feature Request</option>
                </select>
              </div>
              
              <div>
                <label>Priority</label>
                <select 
                  name="priority" 
                  value={form.priority} 
                  onChange={onChange}
                  style={{padding:8, borderRadius:6, border:'1px solid var(--border)', width:'100%'}}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
            </div>

            <label>Subject</label>
            <input 
              name="subject" 
              value={form.subject} 
              onChange={onChange} 
              placeholder="Brief description of your feedback" 
              required 
              style={{marginBottom:16}}
            />

            <label>Rating</label>
            <div style={{marginBottom:16}}>
              <StarRating rating={form.rating} onChange={onChange} />
            </div>

            <label>Message</label>
            <textarea 
              name="message" 
              rows={6} 
              value={form.message} 
              onChange={onChange} 
              placeholder="Please provide detailed feedback..." 
              required 
              style={{marginBottom:16}}
            />

            <button 
              className="btn primary" 
              disabled={loading}
              style={{padding:'12px 24px', borderRadius:8}}
            >
              {loading ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </form>
        ) : (
          <div style={{
            background:'#ecfdf5',
            border:'1px solid #10b981',
            color:'#065f46',
            borderRadius:12,
            padding:20,
            textAlign:'center'
          }}>
            <div style={{fontSize:48, marginBottom:16}}>✅</div>
            <div style={{fontSize:18, fontWeight:600, marginBottom:8}}>
              Thank you for your feedback!
            </div>
            <div style={{marginBottom:16}}>
              We appreciate your input and will review it shortly.
            </div>
            <button 
              className="btn primary"
              onClick={() => setSent(false)}
              style={{padding:'8px 16px', borderRadius:8}}
            >
              Submit Another Feedback
            </button>
          </div>
        )}
      </div>

      {/* Feedback History */}
      {showHistory && (
        <div className="card" style={{maxWidth:900, margin:'0 auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <h3 style={{marginTop:0, marginBottom:20}}>📋 Feedback History</h3>
          
          {feedbackHistory.length === 0 ? (
            <div style={{textAlign:'center', padding:40, background:'var(--color-bg)', borderRadius:12}}>
              <div style={{fontSize:48, marginBottom:16}}>📝</div>
              <div className="muted" style={{fontSize:16}}>No feedback submitted yet</div>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'2px solid var(--border)'}}>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Date</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Category</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Subject</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Priority</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Rating</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Status</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackHistory.map(feedback => (
                    <tr key={feedback.id} style={{borderBottom:'1px solid var(--border)'}}>
                      <td style={{padding:12, color:'var(--text)'}}>{feedback.date}</td>
                      <td style={{padding:12}}>
                        <span style={{
                          background:'var(--color-bg)',
                          padding:'4px 8px',
                          borderRadius:6,
                          fontSize:12
                        }}>
                          {getCategoryIcon(feedback.category)} {feedback.category}
                        </span>
                      </td>
                      <td style={{padding:12, color:'var(--text)', maxWidth:200}}>
                        <div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                          {feedback.subject}
                        </div>
                      </td>
                      <td style={{padding:12}}>
                        <span style={{
                          background:getPriorityColor(feedback.priority),
                          color:'white',
                          padding:'4px 8px',
                          borderRadius:6,
                          fontSize:12,
                          fontWeight:600
                        }}>
                          {feedback.priority}
                        </span>
                      </td>
                      <td style={{padding:12}}>
                        <div style={{color:feedback.rating >= 4 ? '#10b981' : feedback.rating >= 3 ? '#f59e0b' : '#dc2626'}}>
                          {'⭐'.repeat(feedback.rating)}
                        </div>
                      </td>
                      <td style={{padding:12}}>
                        <span style={{
                          background:getStatusColor(feedback.status),
                          color:'white',
                          padding:'4px 8px',
                          borderRadius:6,
                          fontSize:12,
                          fontWeight:600
                        }}>
                          {feedback.status}
                        </span>
                      </td>
                      <td style={{padding:12, color:'var(--text)', maxWidth:250}}>
                        <div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:14}}>
                          {feedback.response || 'No response yet'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
