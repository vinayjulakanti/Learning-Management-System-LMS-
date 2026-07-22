import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container">
      <div className="card" style={{maxWidth: 520, margin: '40px auto', textAlign:'center'}}>
        <h2>Page Not Found</h2>
        <p className="muted">The page you are looking for does not exist.</p>
        <div style={{display:'flex', gap:10, justifyContent:'center'}}>
          <Link to="/" className="btn">Go Home</Link>
          <Link to="/courses" className="btn primary">Browse Courses</Link>
        </div>
      </div>
    </div>
  );
}
