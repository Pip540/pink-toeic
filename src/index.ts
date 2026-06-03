import { renderChatUI } from './ui';
import { renderAdminUI } from './admin';

export interface Env {
  CONTENT: R2Bucket;
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  ACCESS_CODE: string;
  ACCESS_GATE: string;
  FREE_QUESTION_LIMIT: string;
  WORKER_NAME: string;
  WORKER_GREETING: string;
  RESEND_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  TEACHER_PASSWORD: string;
  ADMIN_PASSWORD: string;
  DASHBOARD_PASSWORD: string;
  MASTER_PASSWORD: string;
  TURNSTILE_SECRET: string;
  CHAT_RATE_LIMITER: { limit: (options: { key: string }) => Promise<{ success: boolean }> };
}

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } };

interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

interface ChatRequest {
  messages: Message[];
  profile: Record<string, string>;
  turnstile_token?: string;
}

interface ManifestEntry {
  id: string;
  title: string;
  keywords: string[];
}

const CORS = {
  'Access-Control-Allow-Origin': 'https://pink.asiaconnect.uk',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin',
};

const SECURITY = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      const gate = env.ACCESS_GATE === 'true';
      const limit = parseInt(env.FREE_QUESTION_LIMIT) || 10;
      return new Response(renderChatUI(env.WORKER_NAME, env.WORKER_GREETING, gate, limit), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...CORS, ...SECURITY },
      });
    }

    if (request.method === 'GET' && url.pathname === '/teacher') {
      return new Response(renderTeacherUI(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...SECURITY },
      });
    }

    if (request.method === 'GET' && url.pathname === '/admin') {
      return new Response(renderAdminUI(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'no-store', ...SECURITY },
      });
    }

    if (request.method === 'POST' && url.pathname === '/admin-auth') {
      return handleAdminAuth(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/admin-stats') {
      return handleAdminStats(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/upload') {
      return handleUpload(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/verify') {
      return handleVerify(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/feedback') {
      return handleFeedback(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/teacher-feedback') {
      return handleTeacherFeedback(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/speak') {
      return handleSpeak(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/review') {
      return handleReview(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/terms') {
      return new Response(renderTermsPage(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=86400', ...SECURITY },
      });
    }

    if (request.method === 'GET' && url.pathname === '/privacy') {
      return new Response(renderPrivacyPage(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=86400', ...SECURITY },
      });
    }

    if (request.method === 'POST' && url.pathname === '/chat') {
      return handleChat(request, env, ctx);
    }

    // PWA — Web App Manifest
    if (request.method === 'GET' && url.pathname === '/manifest.json') {
      const manifest = {
        name: 'Pink TOEIC',
        short_name: 'Pink',
        description: 'TOEIC score coaching with Pink — powered by Asia Connect',
        start_url: '/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#f472b6',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      };
      return new Response(JSON.stringify(manifest), {
        headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=86400', ...CORS },
      });
    }

    // PWA — Service Worker
    if (request.method === 'GET' && url.pathname === '/sw.js') {
      const sw = `
const CACHE = 'pink-toeic-v1';
const PRECACHE = ['/', '/manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});`;
      return new Response(sw, {
        headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' },
      });
    }

    // Jenny avatar
    if (request.method === 'GET' && url.pathname === '/jenny.png') {
      const obj = await env.CONTENT.get('jenny.png');
      if (!obj) return new Response('Not found', { status: 404 });
      return new Response(obj.body, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' },
      });
    }

    // PWA — Icons (served from R2)
    if (request.method === 'GET' && (url.pathname === '/icon-192.png' || url.pathname === '/icon-512.png' || url.pathname === '/apple-touch-icon.png')) {
      const key = url.pathname.slice(1);
      const obj = await env.CONTENT.get(key);
      if (!obj) return new Response('Not found', { status: 404 });
      return new Response(obj.body, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' },
      });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
    ctx.waitUntil(
      env.DB.prepare('DELETE FROM sessions WHERE timestamp < ?').bind(cutoff).run()
    );
  },
};

// ── Teacher UI ─────────────────────────────────────────────────────────────────

function renderTeacherUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pink — Tutor Upload</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#121212;color:#f0f0f0;font-family:'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
    .box{background:#1a1a1a;border:1px solid #f472b6;border-radius:12px;padding:2rem;width:100%;max-width:420px}
    h1{color:#f472b6;font-size:1.4rem;margin-bottom:0.4rem}
    .sub{color:#888;font-size:0.82rem;margin-bottom:1.5rem}
    label{display:block;font-size:0.82rem;color:#ccc;margin-bottom:0.35rem}
    input{width:100%;background:#0f0f0f;border:1px solid #333;border-radius:6px;color:#fff;padding:0.65rem;font-size:0.9rem;margin-bottom:1rem;font-family:inherit}
    input[type=file]{padding:0.5rem}
    button{width:100%;background:#f472b6;color:#121212;border:none;border-radius:8px;padding:0.8rem;font-size:1rem;font-weight:700;cursor:pointer}
    button:hover{background:#f9a8d4}
    button:disabled{background:#555;cursor:default}
    #result{margin-top:1.5rem;padding:1rem;background:#0f0f0f;border:1px solid #2a2a2a;border-radius:8px;display:none;text-align:center}
    #result h2{color:#f472b6;font-size:0.9rem;margin-bottom:0.5rem}
    #code{font-size:2.2rem;font-weight:900;color:#f472b6;letter-spacing:0.12em}
    #result p{color:#aaa;margin-top:0.5rem;font-size:0.78rem}
    #wa-btn{display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-top:1rem;width:100%;background:#25D366;color:#fff;border:none;border-radius:8px;padding:0.75rem;font-size:0.95rem;font-weight:700;cursor:pointer;text-decoration:none}
    #wa-btn:hover{background:#1ebe5d}
    #err{margin-top:0.75rem;color:#f55;font-size:0.82rem;display:none}
    .fb-section{margin-top:2rem;padding-top:1.5rem;border-top:1px solid #333}
    .fb-section h3{color:#f472b6;font-size:0.9rem;margin-bottom:0.5rem}
    #fb-msg{width:100%;background:#0f0f0f;border:1px solid #333;border-radius:6px;color:#fff;padding:0.65rem;font-size:0.88rem;font-family:inherit;resize:vertical;min-height:80px;margin-bottom:0.75rem}
    #fb-btn{background:transparent;color:#f472b6;border:1px solid #f472b6;font-size:0.88rem;padding:0.65rem}
    #fb-btn:hover{background:rgba(244,114,182,0.08)}
    #fb-status{margin-top:0.5rem;font-size:0.8rem;display:none}
  </style>
</head>
<body>
  <div class="box">
    <h1>Pink — Tutor Upload</h1>
    <p class="sub">Upload a learning resource or exercise sheet. Share the code with your students. Expires in 7 days.</p>
    <form id="form">
      <label>Tutor Password</label>
      <input type="password" id="pw" placeholder="Enter password" required/>
      <label>Document or Image</label>
      <input type="file" id="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required/>
      <button type="submit" id="btn">Upload &amp; Get Code</button>
    </form>
    <div id="result">
      <h2>Classroom Code</h2>
      <div id="code"></div>
      <p>Share this code with your students.<br/>It expires in 7 days automatically.</p>
      <a id="wa-btn" href="#" target="_blank">Share via WhatsApp</a>
    </div>
    <div id="err"></div>
    <div class="fb-section">
      <h3>Tutor Feedback</h3>
      <p class="sub" style="margin-bottom:0.75rem">Questions, issues or suggestions? Let us know.</p>
      <textarea id="fb-msg" placeholder="Your message..."></textarea>
      <button id="fb-btn" type="button">Send Feedback</button>
      <div id="fb-status"></div>
    </div>
  </div>
  <script>
    document.getElementById('form').onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn');
      btn.textContent = 'Uploading...'; btn.disabled = true;
      const fd = new FormData();
      fd.append('password', document.getElementById('pw').value);
      fd.append('file', document.getElementById('file').files[0]);
      try {
        const res = await fetch('/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.ok) {
          document.getElementById('code').textContent = data.code;
          document.getElementById('result').style.display = 'block';
          document.getElementById('err').style.display = 'none';
          const msg = encodeURIComponent('Your classroom code for Pink TOEIC Coach is: ' + data.code + ' — go to https://pink.asiaconnect.uk and enter the code to get started.');
          document.getElementById('wa-btn').href = 'https://wa.me/?text=' + msg;
        } else {
          document.getElementById('err').textContent = data.error || 'Upload failed.';
          document.getElementById('err').style.display = 'block';
        }
      } catch {
        document.getElementById('err').textContent = 'Upload failed. Please try again.';
        document.getElementById('err').style.display = 'block';
      }
      btn.textContent = 'Upload & Get Code'; btn.disabled = false;
    };

    document.getElementById('fb-btn').onclick = async () => {
      const msg = document.getElementById('fb-msg').value.trim();
      const status = document.getElementById('fb-status');
      if (!msg) { status.style.display='block'; status.style.color='#f55'; status.textContent='Please enter a message.'; return; }
      const btn = document.getElementById('fb-btn');
      btn.textContent = 'Sending...'; btn.disabled = true;
      try {
        const res = await fetch('/teacher-feedback', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: msg }) });
        const data = await res.json();
        status.style.display = 'block';
        if (data.ok) { status.style.color='#5a5'; status.textContent='Feedback sent. Thank you!'; document.getElementById('fb-msg').value=''; }
        else { status.style.color='#f55'; status.textContent='Failed to send. Please try again.'; }
      } catch { status.style.color='#f55'; status.textContent='Failed to send. Please try again.'; }
      btn.textContent = 'Send Feedback'; btn.disabled = false;
    };
  </script>
</body>
</html>`;
}

// ── Teacher Upload Handler ─────────────────────────────────────────────────────

async function handleUpload(request: Request, env: Env): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid form data' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const password = formData.get('password') as string;
  if (!password || password !== env.TEACHER_PASSWORD) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid password' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const file = formData.get('file') as unknown as File;
  if (!file) {
    return new Response(JSON.stringify({ ok: false, error: 'No file provided' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024;
  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ ok: false, error: 'File type not allowed. Use PDF, JPG, PNG or WebP.' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ ok: false, error: 'File too large. Maximum size is 5 MB.' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = 'PNK-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const arrayBuffer = await file.arrayBuffer();
  const expiresAt = String(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await env.CONTENT.put(`classroom/${code}`, arrayBuffer, {
    httpMetadata: { contentType: file.type },
    customMetadata: { expiresAt, contentType: file.type },
  });

  return new Response(JSON.stringify({ ok: true, code }), {
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ── Access Code Verification ───────────────────────────────────────────────────

async function handleVerify(request: Request, env: Env): Promise<Response> {
  let body: { code: string };
  try {
    body = await request.json() as { code: string };
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
  const ok = !!(body.code && body.code.trim().toLowerCase() === (env.ACCESS_CODE || '').trim().toLowerCase());
  return new Response(JSON.stringify({ ok }), {
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ── Feedback Handler ───────────────────────────────────────────────────────────

async function handleFeedback(request: Request, env: Env): Promise<Response> {
  let body: { message: string };
  try {
    body = await request.json() as { message: string };
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
  if (!body.message?.trim()) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
  const timestamp = new Date().toISOString();
  const key = `feedback/${Date.now()}.json`;
  await env.CONTENT.put(key, JSON.stringify({ message: body.message.trim(), timestamp }), {
    httpMetadata: { contentType: 'application/json' },
  });

  if (env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pink TOEIC <onboarding@resend.dev>',
        to: ['dodecahedron108@gmail.com'],
        subject: 'New Feedback — Pink TOEIC',
        text: `${body.message.trim()}\n\n— Sent at ${timestamp}`,
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ── Teacher Feedback Handler ───────────────────────────────────────────────────

async function handleTeacherFeedback(request: Request, env: Env): Promise<Response> {
  let body: { message: string };
  try {
    body = await request.json() as { message: string };
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
  if (!body.message?.trim()) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
  const timestamp = new Date().toISOString();
  if (env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pink TOEIC <onboarding@resend.dev>',
        to: ['dodecahedron108@gmail.com'],
        subject: 'New Tutor Feedback — Pink TOEIC',
        text: `${body.message.trim()}\n\n— Sent at ${timestamp}`,
      }),
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ── Review / Daily Summary Email ──────────────────────────────────────────────

async function handleReview(request: Request, env: Env): Promise<Response> {
  let body: { subject?: string; text: string };
  try {
    body = await request.json() as { subject?: string; text: string };
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
  if (!body.text?.trim()) {
    return new Response(JSON.stringify({ ok: false, error: 'No text' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
  if (env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pink TOEIC <onboarding@resend.dev>',
        to: ['dodecahedron108@gmail.com'],
        subject: body.subject || 'Daily Review — Pink TOEIC',
        text: body.text.trim(),
      }),
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ── Terms of Service ─────────────────────────────────────────────────────────

function renderTermsPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pink TOEIC — Terms of Service</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#121212;color:#c8d8e8;font-family:'Segoe UI',system-ui,sans-serif;padding:2rem 1.5rem;max-width:740px;margin:0 auto;line-height:1.7}
    h1{color:#f472b6;font-size:1.5rem;margin-bottom:0.3rem}
    .meta{color:#888;font-size:0.82rem;margin-bottom:2.5rem}
    h2{color:#c8d8e8;font-size:1rem;font-weight:700;margin-top:2rem;margin-bottom:0.6rem;border-bottom:1px solid #333;padding-bottom:0.4rem}
    p,li{font-size:0.9rem;color:#aab8c8;margin-bottom:0.6rem}
    ul{padding-left:1.4rem;margin-bottom:0.75rem}
    strong{color:#c8d8e8}
    a{color:#f472b6;text-decoration:none}
    a:hover{text-decoration:underline}
    footer{margin-top:3rem;padding-top:1.5rem;border-top:1px solid #333;font-size:0.78rem;color:#888}
  </style>
</head>
<body>
  <h1>Pink TOEIC — Terms of Service</h1>
  <p class="meta">Operated by Asia Connect (Netizen 9) &nbsp;|&nbsp; Last updated: April 2026 &nbsp;|&nbsp; <a href="/">Back to Pink</a></p>
  <h2>1. The Service</h2>
  <p>Pink is an AI-powered TOEIC exam coaching platform. It is intended for individual learners preparing for the TOEIC Listening and Reading test. The service is provided on a best efforts basis. We do not guarantee any specific score outcome.</p>
  <h2>2. Access</h2>
  <p>Access may require a code provided by your institution or employer. Access codes must not be shared outside your authorised group.</p>
  <h2>3. Acceptable Use</h2>
  <p>You may use the service only for your own personal exam preparation. You must not use automated tools, bots, or scripts to interact with the service.</p>
  <h2>4. Data and Privacy</h2>
  <p>We collect limited session data: selected language, classroom code (if any) and session timestamp. We do not store the content of your conversations with Pink. See our <a href="/privacy">Privacy Notice</a>.</p>
  <h2>5. Governing Law</h2>
  <p>These Terms are governed by the laws of England and Wales.</p>
  <h2>6. Contact</h2>
  <p><a href="mailto:dodecahedron108@gmail.com">dodecahedron108@gmail.com</a></p>
  <footer><p>&copy; 2026 Asia Connect. All rights reserved. &nbsp;|&nbsp; <a href="/">Back to Pink</a> &nbsp;|&nbsp; <a href="/privacy">Privacy Notice</a></p></footer>
</body>
</html>`;
}

// ── Privacy Notice ─────────────────────────────────────────────────────────────

function renderPrivacyPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pink TOEIC — Privacy Notice</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#121212;color:#c8d8e8;font-family:'Segoe UI',system-ui,sans-serif;padding:2rem 1.5rem;max-width:740px;margin:0 auto;line-height:1.7}
    h1{color:#f472b6;font-size:1.5rem;margin-bottom:0.3rem}
    .meta{color:#888;font-size:0.82rem;margin-bottom:2rem}
    h2{color:#c8d8e8;font-size:1rem;font-weight:700;margin-top:2rem;margin-bottom:0.6rem;border-bottom:1px solid #333;padding-bottom:0.4rem}
    p,li{font-size:0.9rem;color:#aab8c8;margin-bottom:0.6rem}
    ul{padding-left:1.4rem;margin-bottom:0.75rem}
    strong{color:#c8d8e8}
    a{color:#f472b6;text-decoration:none}
    a:hover{text-decoration:underline}
    .highlight{background:#1a1a1a;border-left:3px solid #f472b6;padding:0.75rem 1rem;border-radius:0 8px 8px 0;margin-bottom:1rem}
    .highlight p{margin-bottom:0}
    footer{margin-top:3rem;padding-top:1.5rem;border-top:1px solid #333;font-size:0.78rem;color:#888}
  </style>
</head>
<body>
  <h1>Pink TOEIC — Privacy Notice</h1>
  <p class="meta">Asia Connect (Netizen 9) &nbsp;|&nbsp; April 2026 &nbsp;|&nbsp; <a href="/">Back to Pink</a></p>
  <div class="highlight"><p>This notice explains in plain language what information Pink TOEIC collects and what your rights are.</p></div>
  <h2>What We Collect</h2>
  <ul>
    <li>The language you chose</li>
    <li>Your classroom code, if your trainer gave you one</li>
    <li>The date and time you had a session</li>
    <li>A random device identifier with no name attached</li>
  </ul>
  <h2>What We Do NOT Collect</h2>
  <div class="highlight"><p><strong>We do not store your chat messages.</strong> Once your session with Pink ends, the conversation is gone.</p></div>
  <p>We also do not collect your name, email, student ID, or any other identifying information.</p>
  <h2>Third-Party Services</h2>
  <ul>
    <li><strong>Cloudflare</strong> — hosting</li>
    <li><strong>Anthropic</strong> — AI. Your messages are sent to them for replies but not stored</li>
    <li><strong>ElevenLabs</strong> — voice. Text is sent for audio generation only</li>
    <li><strong>Resend</strong> — email, for feedback notifications only</li>
  </ul>
  <h2>Your Rights Under GDPR (UK and EU Users)</h2>
  <ul>
    <li><strong>Right to access</strong> — you can ask us what information we hold</li>
    <li><strong>Right to correction</strong> — you can ask us to correct any wrong information</li>
    <li><strong>Right to deletion</strong> — you can ask us to delete your information</li>
    <li><strong>Right to complain</strong> — you can complain to your national data protection authority</li>
  </ul>

  <h2>Your Rights Under Vietnamese Law (Nguoi dung Viet Nam)</h2>
  <p>If you are located in Vietnam, you have the following rights under Vietnam's Personal Data Protection Law (effective 1 January 2026):</p>
  <ul>
    <li><strong>Right to know</strong> — you have the right to know what personal data we collect and how we use it</li>
    <li><strong>Right to consent</strong> — we will only collect your data with your explicit consent</li>
    <li><strong>Right to access</strong> — you can ask us what information we hold about you</li>
    <li><strong>Right to correction</strong> — you can ask us to correct any inaccurate information</li>
    <li><strong>Right to deletion</strong> — you can ask us to delete your information at any time</li>
    <li><strong>Right to restrict processing</strong> — you can ask us to stop using your data while a complaint is reviewed</li>
    <li><strong>Right to complain</strong> — you may complain to Vietnam's Ministry of Public Security, Department of Cybersecurity and Hi-tech Crime Prevention (A05)</li>
  </ul>
  <p><strong>Cross-border data transfer:</strong> Your session data is processed by Cloudflare (USA/EU) and Anthropic (USA). By using Pink TOEIC you consent to this transfer. Your conversation content is never stored — only anonymous session metadata is retained.</p>
  <p>To exercise any of these rights, contact: <a href="mailto:dodecahedron108@gmail.com">dodecahedron108@gmail.com</a></p>
  <footer><p>&copy; 2026 Netizen9. All rights reserved. &nbsp;|&nbsp; <a href="/">Back to Pink</a> &nbsp;|&nbsp; <a href="/terms">Terms of Service</a></p></footer>
</body>
</html>`;
}

// ── ElevenLabs TTS Handler ─────────────────────────────────────────────────────

async function handleSpeak(request: Request, env: Env): Promise<Response> {
  let body: { text: string; access_code?: string };
  try {
    body = await request.json() as { text: string; access_code?: string };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
  if (env.ACCESS_GATE === 'true') {
    const provided = (body.access_code || '').trim().toLowerCase();
    const expected = (env.ACCESS_CODE || '').trim().toLowerCase();
    if (!provided || provided !== expected) {
      return new Response(JSON.stringify({ error: 'Subscribers only' }), {
        status: 403, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
  }
  if (!body.text?.trim()) {
    return new Response(JSON.stringify({ error: 'No text' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const clean = body.text
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '')
    .replace(/"/g, '')
    .replace(/\u2014|\u2013/g, ' ').replace(/\u2026/g, ' ').replace(/\u00A0/g, ' ')
    .split('\n').filter(line => {
      const t = line.trim();
      return t.length > 0 && !/[^\x00-\x7F]/.test(t) && !t.startsWith('(');
    }).join(' ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/#+\s*/g, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\u2022\s*/g, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, ', ')
    .replace(/\u2026/g, ', ')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/&amp;/g, 'and')
    .replace(/&lt;/g, '')
    .replace(/&gt;/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\.\.\./g, ' ')
    .replace(/\./g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 2500)
    .trim();

  const elevenRes = await fetch('https://api.elevenlabs.io/v1/text-to-speech/SEWXl8lPSO01tdGbWECX', {
    method: 'POST',
    headers: {
      'xi-api-key': env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: clean,
      model_id: 'eleven_turbo_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.95 },
    }),
  });

  if (!elevenRes.ok) {
    const errText = await elevenRes.text();
    return new Response(JSON.stringify({ error: 'TTS failed', status: elevenRes.status, detail: errText }), {
      status: 502, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  return new Response(elevenRes.body, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', ...CORS },
  });
}

// ── Chat Handler ───────────────────────────────────────────────────────────────

async function handleChat(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  const rawBody = await request.text();
  let parsedBody: ChatRequest;
  try { parsedBody = JSON.parse(rawBody) as ChatRequest; } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${encodeURIComponent(env.TURNSTILE_SECRET)}&response=${encodeURIComponent(parsedBody.turnstile_token || '')}`,
  });
  const tsData = await tsRes.json() as { success: boolean };
  if (!tsData.success) {
    return new Response(JSON.stringify({ error: 'Bot verification failed. Please refresh the page and try again.' }), {
      status: 403, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const { success } = await env.CHAT_RATE_LIMITER.limit({ key: ip });
  if (!success) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const body = parsedBody;
  const { messages, profile } = body;
  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'No messages provided' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
  const lastMsg = [...messages].reverse().find(m => m.role === 'user');
  const lastText = typeof lastMsg?.content === 'string' ? lastMsg.content : '';
  if (lastText.length > 4000) {
    return new Response(JSON.stringify({ error: 'Message too long. Please keep your message under 4,000 characters.' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  // Server-side daily cap: 10 questions per device per day
  const studentId = (profile.student_id || '').trim();
  if (studentId) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const row = await env.DB.prepare(
      'SELECT COUNT(*) as c FROM sessions WHERE student_id = ? AND timestamp >= ?'
    ).bind(studentId, todayStart.getTime()).first<{ c: number }>();
    if (row && (row.c as number) >= 10) {
      return new Response(JSON.stringify({ error: "You've reached today's limit of 10 questions. Come back tomorrow!" }), {
        status: 429, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  const rawContent = lastUserMessage?.content ?? '';
  const query = typeof rawContent === 'string' ? rawContent :
    (rawContent.find((b): b is { type: 'text'; text: string } => b.type === 'text')?.text ?? '');

  const context = await getContext(env.CONTENT, query);

  // Inject classroom file if code provided
  const classroomCode = (profile.classroom_code || '').trim().toUpperCase();
  if (classroomCode) {
    const obj = await env.CONTENT.get(`classroom/${classroomCode}`);
    if (obj) {
      const meta = obj.customMetadata || {};
      const expiresAt = parseInt(meta.expiresAt || '0');
      if (expiresAt > Date.now()) {
        const contentType = meta.contentType || 'image/jpeg';
        const arrayBuffer = await obj.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i += 8192) {
          binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        }
        const base64 = btoa(binary);
        const docBlock = contentType === 'application/pdf'
          ? { type: 'document', source: { type: 'base64', media_type: contentType, data: base64 } }
          : { type: 'image', source: { type: 'base64', media_type: contentType, data: base64 } };

        const firstUserIdx = messages.findIndex(m => m.role === 'user');
        if (firstUserIdx !== -1 && typeof messages[firstUserIdx].content === 'string') {
          messages[firstUserIdx] = {
            role: 'user',
            content: [docBlock as ContentBlock, { type: 'text', text: messages[firstUserIdx].content as string || 'Please help me with this.' }],
          };
        }
      }
    }
  }

  // Prompt caching — static knowledge base cached, dynamic profile block per user
  const cachedBlock = {
    type: 'text' as const,
    text: context
      ? `## TOEIC Knowledge Base\nUse the following as your primary reference for TOEIC coaching, exam structure, question patterns and teaching strategies:\n\n${context}`
      : `## TOEIC Knowledge Base\nNo specific content loaded. Use your knowledge of the TOEIC exam structure, Parts 1-7, question patterns and exam strategies.`,
    cache_control: { type: 'ephemeral' as const },
  };
  const dynamicBlock = {
    type: 'text' as const,
    text: buildSystemPrompt(env.WORKER_NAME, profile),
  };

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'pdfs-2024-09-25,prompt-caching-2024-07-31',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      stream: true,
      system: [cachedBlock, dynamicBlock],
      messages,
    }),
  });

  if (!anthropicResponse.ok) {
    const err = await anthropicResponse.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 502, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const country = (request as Request & { cf?: { country?: string } }).cf?.country || 'Unknown';
  const sessionId = profile.session_id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const lang = profile.language || 'Vietnamese';
  const now = Date.now();
  ctx.waitUntil(
    env.DB.prepare(
      'INSERT INTO sessions (session_id, country, language, classroom_code, timestamp, created_at, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(sessionId, country, lang, profile.classroom_code || '', now, new Date().toISOString(), profile.student_id || '').run().catch(() => {})
  );

  return new Response(anthropicResponse.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...CORS,
    },
  });
}

// ── R2 Context Retrieval ───────────────────────────────────────────────────────

async function getContext(bucket: R2Bucket, _query: string): Promise<string> {
  const manifestObj = await bucket.get('manifest.json');
  if (!manifestObj) return '';

  let manifest: ManifestEntry[];
  try {
    manifest = await manifestObj.json() as ManifestEntry[];
  } catch {
    return '';
  }

  const texts = await Promise.all(
    manifest.map(async (entry) => {
      const obj = await bucket.get(entry.id);
      if (!obj) return '';
      const text = await obj.text();
      return `### ${entry.title}\n${text}`;
    })
  );

  return texts.filter(Boolean).join('\n\n');
}

// ── Admin Auth ────────────────────────────────────────────────────────────────

async function handleAdminAuth(request: Request, env: Env): Promise<Response> {
  let body: { password: string };
  try { body = await request.json() as { password: string }; }
  catch { return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } }); }
  const ok = !!(body.password && body.password === env.ADMIN_PASSWORD);
  return new Response(JSON.stringify({ ok }), { headers: { 'Content-Type': 'application/json', ...CORS } });
}

function checkAdminAuth(request: Request, env: Env): boolean {
  return request.headers.get('X-Admin-Password') === env.ADMIN_PASSWORD;
}

// ── Admin Stats ───────────────────────────────────────────────────────────────

async function handleAdminStats(request: Request, env: Env): Promise<Response> {
  if (!checkAdminAuth(request, env)) {
    return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { 'Content-Type': 'application/json', ...CORS } });
  }
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [total, today, uniqueStudents, codesUsed, byCountry, byLanguage] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as n FROM sessions').first<{ n: number }>(),
      env.DB.prepare('SELECT COUNT(*) as n FROM sessions WHERE timestamp >= ?').bind(todayStart.getTime()).first<{ n: number }>(),
      env.DB.prepare("SELECT COUNT(DISTINCT student_id) as n FROM sessions").first<{ n: number }>(),
      env.DB.prepare("SELECT COUNT(DISTINCT classroom_code) as n FROM sessions WHERE classroom_code != ''").first<{ n: number }>(),
      env.DB.prepare('SELECT country, COUNT(*) as count FROM sessions GROUP BY country ORDER BY count DESC LIMIT 10').all(),
      env.DB.prepare('SELECT language, COUNT(*) as count FROM sessions GROUP BY language ORDER BY count DESC LIMIT 10').all(),
    ]);
    return new Response(JSON.stringify({
      ok: true,
      total: total?.n ?? 0,
      today: today?.n ?? 0,
      uniqueStudents: uniqueStudents?.n ?? 0,
      codesUsed: codesUsed?.n ?? 0,
      byCountry: byCountry.results,
      byLanguage: byLanguage.results,
    }), { headers: { 'Content-Type': 'application/json', ...CORS } });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } });
  }
}

// ── System Prompt ──────────────────────────────────────────────────────────────

function buildSystemPrompt(name: string, profile: Record<string, string>): string {
  const lang = profile.language || 'Vietnamese';
  const currentScore = profile.current_score || 'unknown';
  const targetScore = profile.target_score || 'not set';
  const deadline = profile.deadline || 'not specified';
  const weakArea = profile.weak_area || 'both Listening and Reading';
  const userName = profile.name ? `The student's name is ${profile.name}.` : '';

  return `You are ${name}, a focused and efficient TOEIC exam score coach. Your only goal is to raise the student's TOEIC score as fast as possible. You diagnose weak spots, run targeted drills, explain traps clearly and adapt to the student's exact level and deadline.

## Formatting Rule — IMPORTANT
Write in plain, conversational English. Do not use markdown formatting — no asterisks, no bold, no bullet dashes, no horizontal dividers (--- or ***), no heading symbols (#). Use short paragraphs and plain sentences only. This is a mobile chat interface — clean plain text looks best.

## Language Rule — IMPORTANT
You are coaching in English. Write every sentence in English first, then immediately provide the ${lang} translation in parentheses on the next line.

Format every response like this:
English sentence here.
(${lang} translation here.)

Next English sentence here.
(${lang} translation here.)

Do this for EVERY sentence without exception. The student is a beginner and needs to understand every word you say. Never skip the translation. Never write a block of English without a translation below it.

TOEIC exam questions and answer options must also follow this pattern — write the question in English, then the ${lang} translation below in parentheses.

## Exception — Explanation Request
If the student writes "please explain" or asks IN ${lang}, respond fully in ${lang} for that one reply only. Return to the English + translation format for the next message.

## The Student
${userName}
- Current TOEIC score: ${currentScore}
- Target TOEIC score: ${targetScore}
- Deadline: ${deadline}
- Weakest area: ${weakArea}

## TOEIC Exam Structure
LISTENING — 495 points, 4 parts:
- Part 1 (6 questions): Photographs — choose the best sentence describing a picture. Train: action verbs, prepositions, visual traps.
- Part 2 (25 questions): Question-Response — choose the best reply. The biggest score swing area. Train: listen for function not keywords, indirect replies, question type recognition.
- Part 3 (39 questions): Short Conversations — 3 questions per dialogue. Train: read questions before listening, catch purpose/problem/next step.
- Part 4 (30 questions): Short Talks — announcements and monologues. Train: same as Part 3.

READING — 495 points, 3 parts:
- Part 5 (30 questions): Incomplete Sentences — grammar and vocabulary. Train: identify blank type first (grammar/vocabulary/collocation), fast elimination.
- Part 6 (16 questions): Text Completion — fill blanks in emails/memos. Train: sentence connection, tense consistency, paragraph context.
- Part 7 (54 questions): Reading Comprehension — emails, notices, articles, double/triple passages. Train: scan first, locate evidence, recognise paraphrasing, manage time aggressively.

## Your 5 Coaching Modes

DIAGNOSTIC MODE: Give 5-7 quick questions across different parts. Identify the biggest score leaks. Finish with a clear statement like "Your main losses are in Part 2 and Part 5. Let's fix those first."

DRILL MODE: Generate targeted practice questions by part. After each answer say: why the correct answer is right, why the wrong options are traps and what pattern was missed. Use real TOEIC-style question formats.

STRATEGY MODE: Teach exam tactics, not just English. Examples: in Part 2, listen for the function of the question, not keywords. In Parts 3 and 4, read answer choices before the audio starts. In Part 5, identify the blank type in under 5 seconds. In Part 7, scan for names, dates, numbers and purpose before reading in full. Skip and return instead of dying on one question.

REVIEW MODE: Recall repeated mistakes from earlier in the conversation. Start each session with "Earlier you struggled with indirect replies in Part 2. Let's run a few more of those now."

SIMULATION MODE: Run a timed mini mock section. Tell the student how many questions and how much time. Afterwards give a score estimate, the top 2-3 weaknesses and the next practice prescription.

## Teaching Guidelines
- Score-first: every drill and explanation must connect directly to gaining marks
- Explain traps clearly — TOEIC traps are predictable and repeatable
- Adapt difficulty: if the student succeeds, increase speed or difficulty; if failing, narrow the drill
- Keep sessions short and concentrated — 20 to 30 minutes is the target
- End every session with: what improved, what still leaks marks and tomorrow's focus
- Tone: calm, exact, brisk, encouraging but never waffy
- Do not say "let me know if you need help" — always end with a question or the next drill`;
}
