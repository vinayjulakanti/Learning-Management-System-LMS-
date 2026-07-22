import React, { useEffect, useState } from 'react';
import { ContentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Sample holiday data
  const sampleHolidays = [
    {
      id: 1,
      title: 'Republic Day',
      date: '2024-01-26',
      type: 'National Holiday',
      description: 'Celebration of the Indian Constitution'
    },
    {
      id: 2,
      title: 'Holi Festival',
      date: '2024-03-25',
      type: 'Cultural Holiday',
      description: 'Festival of colors and joy'
    },
    {
      id: 3,
      title: 'Summer Break',
      date: '2024-05-15',
      type: 'School Holiday',
      description: 'Summer vacation begins'
    },
    {
      id: 4,
      title: 'Independence Day',
      date: '2024-08-15',
      type: 'National Holiday',
      description: 'India\'s Independence Day celebration'
    },
    {
      id: 5,
      title: 'Diwali',
      date: '2024-11-01',
      type: 'Cultural Holiday',
      description: 'Festival of lights'
    },
    {
      id: 6,
      title: 'Winter Break',
      date: '2024-12-25',
      type: 'School Holiday',
      description: 'Winter vacation begins'
    }
  ];

  // Sample announcements
  const sampleAnnouncements = [
    {
      id: 1,
      title: 'New Course Launch',
      message: 'We are excited to announce the launch of our new Advanced Web Development course!',
      date: '2024-01-20',
      type: 'announcement',
      priority: 'high'
    },
    {
      id: 2,
      title: 'System Maintenance',
      message: 'The LMS platform will be under maintenance on January 28, 2024 from 2:00 AM to 6:00 AM.',
      date: '2024-01-18',
      type: 'system',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Exam Schedule Released',
      message: 'The final examination schedule for the current semester has been released. Please check your student portal.',
      date: '2024-01-15',
      type: 'academic',
      priority: 'high'
    },
    {
      id: 4,
      title: 'Workshop Opportunity',
      message: 'Free workshop on "Career Development" organized by the placement cell on February 5, 2024.',
      date: '2024-01-12',
      type: 'event',
      priority: 'low'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Try to load holidays from API
        try {
          const { data } = await ContentAPI.get('holidays');
          // Process API data if available
        } catch (e) {
          // Use sample data if API fails
          setHolidays(sampleHolidays);
        }
        
        // Load announcements (sample data for now)
        setAnnouncements(sampleAnnouncements);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getMessageIcon = (type) => {
    const icons = {
      'National Holiday': '🇮🇳',
      'Cultural Holiday': '🎉',
      'School Holiday': '🏫',
      'announcement': '📢',
      'system': '⚙️',
      'academic': '📚',
      'event': '🎯'
    };
    return icons[type] || '📄';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#dc2626',
      'medium': '#f59e0b',
      'low': '#10b981'
    };
    return colors[priority] || '#64748b';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const allMessages = [
    ...holidays.map(holiday => ({
      ...holiday,
      type: 'holiday',
      icon: getMessageIcon(holiday.type),
      priority: 'medium'
    })),
    ...announcements
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) {
    return (
      <div className="container" style={{padding:16}}>
        <div className="card" style={{maxWidth:900, margin:'24px auto', textAlign:'center', padding:40}}>
          <div style={{fontSize:48, marginBottom:16}}>💬</div>
          <div className="muted">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      
      <div className="card" style={{maxWidth:900, margin:'24px auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
        <h2 style={{marginTop:0, marginBottom:24}}>📬 Messages & Announcements</h2>
        
        {/* Message Categories */}
        <div style={{display:'flex', gap:12, marginBottom:24, flexWrap:'wrap'}}>
          <div style={{
            background:'var(--primary)',
            color:'white',
            padding:'8px 16px',
            borderRadius:20,
            fontSize:14,
            fontWeight:600
          }}>
            All Messages ({allMessages.length})
          </div>
          <div style={{
            background:'var(--color-bg)',
            color:'var(--text)',
            padding:'8px 16px',
            borderRadius:20,
            fontSize:14,
            fontWeight:600
          }}>
            🎉 Holidays ({holidays.length})
          </div>
          <div style={{
            background:'var(--color-bg)',
            color:'var(--text)',
            padding:'8px 16px',
            borderRadius:20,
            fontSize:14,
            fontWeight:600
          }}>
            📢 Announcements ({announcements.length})
          </div>
        </div>

        {/* Messages List */}
        <div style={{display:'grid', gap:12}}>
          {allMessages.map(message => (
            <div 
              key={message.id}
              style={{
                border:'1px solid var(--border)',
                borderRadius:12,
                padding:16,
                background:'var(--panel)',
                cursor:'pointer',
                transition:'all 0.2s ease',
                display:'flex',
                alignItems:'start',
                gap:16
              }}
              className="message-card"
              onClick={() => setSelectedMessage(message)}
            >
              <div style={{
                width:48,
                height:48,
                borderRadius:'50%',
                background:'var(--color-bg)',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                fontSize:20,
                flexShrink:0
              }}>
                {message.icon}
              </div>
              
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                  <div style={{fontWeight:600, fontSize:16, color:'var(--text)'}}>
                    {message.title}
                  </div>
                  {message.priority && (
                    <div style={{
                      background:getPriorityColor(message.priority),
                      color:'white',
                      padding:'2px 6px',
                      borderRadius:4,
                      fontSize:10,
                      fontWeight:600,
                      textTransform:'uppercase'
                    }}>
                      {message.priority}
                    </div>
                  )}
                </div>
                
                <div style={{color:'var(--muted)', fontSize:14, marginBottom:4, lineHeight:1.4}}>
                  {message.description || message.message}
                </div>
                
                <div style={{display:'flex', alignItems:'center', gap:12, fontSize:12, color:'var(--muted)'}}>
                  <span>📅 {formatDate(message.date)}</span>
                  {message.type === 'holiday' && (
                    <span>🏷️ {message.type}</span>
                  )}
                  {message.type !== 'holiday' && (
                    <span>🏷️ {message.type}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div style={{
            position:'fixed',
            top:0,
            left:0,
            right:0,
            bottom:0,
            background:'rgba(0,0,0,0.5)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            zIndex:1000,
            padding:16
          }}>
            <div style={{
              background:'var(--panel)',
              borderRadius:16,
              padding:24,
              maxWidth:600,
              width:'100%',
              maxHeight:'80vh',
              overflowY:'auto'
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:16}}>
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <div style={{
                    width:48,
                    height:48,
                    borderRadius:'50%',
                    background:'var(--color-bg)',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    fontSize:20
                  }}>
                    {selectedMessage.icon}
                  </div>
                  <div>
                    <div style={{fontWeight:600, fontSize:18, color:'var(--text)'}}>
                      {selectedMessage.title}
                    </div>
                    <div style={{color:'var(--muted)', fontSize:14}}>
                      {formatDate(selectedMessage.date)}
                    </div>
                  </div>
                </div>
                <button 
                  className="btn"
                  onClick={() => setSelectedMessage(null)}
                  style={{padding:8, borderRadius:8}}
                >
                  ✕
                </button>
              </div>
              
              <div style={{
                background:'var(--color-bg)',
                padding:16,
                borderRadius:8,
                marginBottom:16,
                lineHeight:1.6
              }}>
                {selectedMessage.description || selectedMessage.message}
              </div>
              
              {selectedMessage.type === 'holiday' && (
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  <span style={{
                    background:'var(--primary)',
                    color:'white',
                    padding:'4px 8px',
                    borderRadius:6,
                    fontSize:12
                  }}>
                    {selectedMessage.type}
                  </span>
                  <span style={{
                    background:'var(--color-bg)',
                    color:'var(--text)',
                    padding:'4px 8px',
                    borderRadius:6,
                    fontSize:12
                  }}>
                    {selectedMessage.type === 'holiday' ? selectedMessage.type : selectedMessage.type}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .message-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
      `}</style>
    </div>
  );
}
