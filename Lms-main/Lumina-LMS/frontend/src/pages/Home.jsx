import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const bubblesContainerRef = useRef(null);

  useEffect(() => {
    if (user) {
      nav('/dashboard');
    }
  }, [user, nav]);

  // PWA Install / Download State Hooks
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [showInstallBtn, setShowInstallBtn] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  useEffect(() => {
    // Create floating bubbles
    const container = document.getElementById('bubbles-container');
    if (!container) return;

    const bubbleCount = 50;
    const colors = [
      { start: '#3B82F6', end: '#60A5FA' }, // Electric Blue
      { start: '#06B6D4', end: '#22D3EE' }, // Cyan
      { start: '#8B5CF6', end: '#A78BFA' }, // Purple
      { start: '#6366F1', end: '#818CF8' }, // Indigo
      { start: '#10B981', end: '#34D399' }, // Emerald
      { start: 'rgba(255,255,255,0.2)', end: 'rgba(255,255,255,0.3)' } // White
    ];

    const bubbles = [];
    let keyframesCSS = '';

    for (let i = 0; i < bubbleCount; i++) {
      const bubble = document.createElement('div');
      const size = Math.random() * 74 + 6; // 6px to 80px
      const color = colors[Math.floor(Math.random() * colors.length)];
      const opacity = Math.random() * 0.25 + 0.1; // 10% to 35%
      const duration = Math.random() * 20 + 15; // 15-35s
      const delay = Math.random() * 10;
      const startX = Math.random() * 100;
      const driftX1 = Math.random() * 40 - 20;
      const driftX2 = Math.random() * 40 - 20;
      
      // Generate unique	keyframe for each bubble
      keyframesCSS += `
        @keyframes floatBubble${i} {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: ${opacity};
          }
          50% {
            transform: translateY(-50vh) translateX(${driftX1}px);
          }
          90% {
            opacity: ${opacity};
          }
          100% {
            transform: translateY(-110vh) translateX(${driftX2}px);
            opacity: 0;
          }
        }
      `;
      
      bubble.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${startX}%;
        bottom: -${size}px;
        background: radial-gradient(circle at 30% 30%, ${color.start}, ${color.end});
        border-radius: 50%;
        opacity: ${opacity};
        filter: blur(${size > 30 ? '2px' : '0px'});
        box-shadow: ${size > 30 ? `0 0 ${size/2}px ${color.start}40` : 'none'};
        animation: floatBubble${i} ${duration}s ease-in-out ${delay}s infinite;
        pointer-events: none;
      `;
      
      container.appendChild(bubble);
      bubbles.push(bubble);
    }

    // Inject dynamic keyframes
    const styleSheet = document.createElement('style');
    styleSheet.textContent = keyframesCSS;
    document.head.appendChild(styleSheet);

    // Mouse interaction
    const handleMouseMove = (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      bubbles.forEach(bubble => {
        const rect = bubble.getBoundingClientRect();
        const bubbleX = rect.left + rect.width / 2;
        const bubbleY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - bubbleX, 2) + Math.pow(mouseY - bubbleY, 2)
        );
        
        if (distance < 150) {
          const angle = Math.atan2(bubbleY - mouseY, bubbleX - mouseX);
          const force = (150 - distance) / 150;
          const moveX = Math.cos(angle) * force * 30;
          const moveY = Math.sin(angle) * force * 30;
          
          bubble.style.transform = `translate(${moveX}px, ${moveY}px)`;
          bubble.style.opacity = Math.min(parseFloat(bubble.style.opacity) + 0.2, 0.5);
        } else {
          bubble.style.transform = 'translate(0, 0)';
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      bubbles.forEach(bubble => bubble.remove());
      if (styleSheet && styleSheet.parentNode) {
        styleSheet.parentNode.removeChild(styleSheet);
      }
    };
  }, []);

  return (
    <div style={{ 
      height: '100vh', 
      background: 'linear-gradient(to bottom, #081120 0%, #0B172A 50%, #111827 100%)',
      display: 'flex', 
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Bubbles originate from here now */}
      <div id="bubbles-container" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}></div>

      {/* Navbar for Landing Page */}
      <header className="glass" style={{
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(8, 17, 32, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #FF6B6B, #FFD700)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '16px',
            boxShadow: '0 4px 14px rgba(255, 107, 107, 0.4)'
          }}>
            LM
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.03em' }}>
            <span style={{ color: '#FF6B6B' }}>LUM</span><span style={{ color: '#FFD700' }}>INA</span>
          </span>
        </div>
        <div>
          <Link to="/login" className="btn primary" style={{ marginRight: '16px', backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}>Log In</Link>
          <Link to="/register" className="btn primary" style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}>Start Free Trial</Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '100px 24px 100px',
        position: 'relative'
      }}>
        {/* Radial Glow Behind Hero */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Floating Bubbles Container Moved to Grid */}

        <div style={{ textAlign: 'center', maxWidth: '800px', zIndex: 10 }}>
          <div className="fade-in-up stagger-1" style={{ 
            display: 'inline-block', 
            padding: '6px 16px', 
            background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.3)', 
            borderRadius: '9999px',
            color: '#60A5FA',
            fontWeight: '600',
            fontSize: '0.85rem',
            marginBottom: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
          }}>
            ✨ The Next Generation Learning Platform
          </div>
          
          <h1 className="fade-in-up stagger-2" style={{ 
            fontSize: 'clamp(3rem, 8vw, 5rem)', 
            fontWeight: '900', 
            lineHeight: 1.1, 
            marginBottom: '24px',
            letterSpacing: '-0.04em',
            color: '#ffffff'
          }}>
            Unlock Your <br/>
            Learning Platform
          </h1>
          
          <p className="fade-in stagger-3" style={{ 
            fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', 
            color: '#94a3b8', 
            marginBottom: '48px',
            maxWidth: '600px',
            margin: '0 auto 48px',
            lineHeight: 1.6
          }}>
            Lumina LMS combines intuitive design, powerful analytics, and seamless collaboration to elevate the educational experience for students and educators alike.
          </p>

          <div className="scale-in stagger-4" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn primary" style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: '12px' }}>
              Create an Account
            </Link>
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick} 
                className="btn primary" 
                style={{ 
                  padding: '16px 32px', 
                  fontSize: '1.1rem', 
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                📥 Download App
              </button>
            )}
          </div>
        </div>

        {/* Features Preview Grid */}
        <div style={{ 
          position: 'relative',
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '24px', 
          width: '100%', 
          maxWidth: '1100px', 
          marginTop: '100px',
          zIndex: 10
        }}>
          {[
            { icon: '📚', title: 'Interactive Courses', desc: 'Engaging multimedia lessons and structured curriculums designed for modern learning.' },
            { icon: '📊', title: 'Real-time Analytics', desc: 'Track progress, identify knowledge gaps, and optimize study strategies instantly.' },
            { icon: '💬', title: 'Peer Collaboration', desc: 'Connect with classmates through built-in discussion boards and group projects.' }
          ].map((feature, i) => (
            <div key={i} className={`card fade-in-up stagger-${5 + i}`} style={{ 
              padding: '32px', 
              textAlign: 'left', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start',
              background: 'rgba(17, 24, 39, 0.8)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                marginBottom: '16px', 
                background: 'rgba(59, 130, 246, 0.15)', 
                width: '64px', 
                height: '64px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderRadius: '16px' 
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#ffffff' }}>{feature.title}</h3>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>{feature.desc}</p>
            </div>
          ))}
        </div>

      </main>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }
        .fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .stagger-1 { animation-delay: 0.2s !important; opacity: 0; }
        .stagger-2 { animation-delay: 0.4s !important; opacity: 0; }
        .stagger-3 { animation-delay: 0.6s !important; opacity: 0; }
        .stagger-4 { animation-delay: 0.8s !important; opacity: 0; }
        .stagger-5 { animation-delay: 1.0s !important; opacity: 0; }
        .stagger-6 { animation-delay: 1.2s !important; opacity: 0; }
        .stagger-7 { animation-delay: 1.4s !important; opacity: 0; }
      `}</style>
    </div>
  );
}
