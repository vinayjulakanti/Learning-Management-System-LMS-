import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function OAuthCallback(){
  const [params] = useSearchParams();
  const nav = useNavigate();

  useEffect(()=>{
    const token = params.get('token');
    if (token) {
      sessionStorage.setItem('token', token);
      nav('/');
    } else {
      nav('/login');
    }
  }, [params, nav]);

  return (
    <div className="container" style={{padding:24}}>
      <div className="card">Signing you in…</div>
    </div>
  );
}
