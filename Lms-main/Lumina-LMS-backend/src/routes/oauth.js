const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function issue(user){
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
  return token;
}

const FRONTEND = process.env.FRONTEND_BASE_URL || 'http://localhost:3001';
const BASE = process.env.OAUTH_REDIRECT_BASE || 'http://localhost:5000';

// Helper to gracefully fail when env missing
function ensureEnv(keys){
  for(const k of keys){
    if(!process.env[k]) return `${k} is not set`;
  }
  return null;
}

// GOOGLE
router.get('/google/start', (req,res)=>{
  const err = ensureEnv(['GOOGLE_CLIENT_ID']);
  if(err) return res.status(501).json({ message: `OAuth not configured: ${err}` });
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${BASE}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/google/callback', async (req,res)=>{
  try{
    const { code } = req.query;
    const err = ensureEnv(['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET']);
    if(err) return res.status(501).send(`OAuth not configured: ${err}`);
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${BASE}/api/auth/google/callback`,
      grant_type: 'authorization_code'
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
    const idToken = tokenRes.data.id_token;
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1],'base64').toString('utf8'));
    const email = (payload.email||'').toLowerCase();
    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });
    if(!user){
      user = await User.create({ name: payload.name || email, email, password: 'social_login', role: 'student', googleId: payload.sub });
    }else if(!user.googleId){
      user.googleId = payload.sub; await user.save();
    }
    const token = issue(user);
    res.redirect(`${FRONTEND}/oauth/callback?token=${token}`);
  }catch(e){
    res.status(500).send('Google OAuth failed');
  }
});

// MICROSOFT (using v2 endpoint)
router.get('/microsoft/start', (req,res)=>{
  const err = ensureEnv(['MICROSOFT_CLIENT_ID']);
  if(err) return res.status(501).json({ message: `OAuth not configured: ${err}` });
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: `${BASE}/api/auth/microsoft/callback`,
    response_mode: 'query',
    scope: 'openid email profile User.Read',
  });
  res.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`);
});

router.get('/microsoft/callback', async (req,res)=>{
  try{
    const { code } = req.query;
    const err = ensureEnv(['MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET']);
    if(err) return res.status(501).send(`OAuth not configured: ${err}`);
    const tokenRes = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      code,
      redirect_uri: `${BASE}/api/auth/microsoft/callback`,
      grant_type: 'authorization_code'
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
    const idToken = tokenRes.data.id_token;
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1],'base64').toString('utf8'));
    const email = (payload.email || payload.preferred_username || '').toLowerCase();
    let user = await User.findOne({ $or: [{ microsoftId: payload.oid || payload.sub }, { email }] });
    if(!user){
      user = await User.create({ name: payload.name || email, email, password: 'social_login', role: 'student', microsoftId: payload.oid || payload.sub });
    }else if(!user.microsoftId){
      user.microsoftId = payload.oid || payload.sub; await user.save();
    }
    const token = issue(user);
    res.redirect(`${FRONTEND}/oauth/callback?token=${token}`);
  }catch(e){
    res.status(500).send('Microsoft OAuth failed');
  }
});

module.exports = router;
