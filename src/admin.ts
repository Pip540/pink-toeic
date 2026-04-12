export function renderAdminUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Asia Connect — Pink Admin Portal</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#121212;color:#f0f0f0;font-family:'Segoe UI',sans-serif;min-height:100vh}
    #login-screen{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1.5rem}
    .login-box{background:#1a1a1a;border:1px solid #f472b6;border-radius:14px;padding:2.5rem 2rem;width:100%;max-width:380px;text-align:center}
    .login-box h1{color:#f472b6;font-size:1.4rem;margin-bottom:0.3rem}
    .login-box p{color:#777;font-size:0.82rem;margin-bottom:2rem}
    .login-box input{width:100%;background:#0f0f0f;border:1px solid #333;border-radius:8px;color:#fff;padding:0.75rem;font-size:0.95rem;margin-bottom:0.5rem;font-family:inherit;text-align:center}
    .login-box button{width:100%;background:#f472b6;color:#121212;border:none;border-radius:8px;padding:0.8rem;font-size:1rem;font-weight:700;cursor:pointer}
    .login-box button:hover{background:#f9a8d4}
    #login-err{color:#f55;font-size:0.82rem;margin-top:0.75rem;display:none}
    #portal{display:none;flex-direction:column;min-height:100vh}
    .topbar{background:#1a1a1a;border-bottom:1px solid #2a2a2a;padding:0.9rem 1.5rem;display:flex;align-items:center;justify-content:space-between}
    .topbar h1{color:#f472b6;font-size:1.1rem;font-weight:700}
    .logout-btn{background:transparent;color:#777;border:1px solid #333;border-radius:6px;padding:0.35rem 0.85rem;font-size:0.8rem;cursor:pointer}
    .logout-btn:hover{color:#f472b6;border-color:#f472b6}
    .tabs{background:#181818;border-bottom:1px solid #2a2a2a;display:flex;padding:0 1.5rem}
    .tab{padding:0.85rem 1.4rem;font-size:0.88rem;font-weight:600;color:#777;cursor:pointer;border-bottom:3px solid transparent}
    .tab:hover{color:#f472b6}
    .tab.active{color:#f472b6;border-bottom-color:#f472b6}
    .content{flex:1;padding:1.5rem;max-width:900px;width:100%;margin:0 auto}
    .panel{display:none}
    .panel.active{display:block}
    .card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:1.5rem;margin-bottom:1.25rem}
    .card h2{color:#f472b6;font-size:1rem;font-weight:700;margin-bottom:0.75rem}
    .card p,.card li{color:#aaa;font-size:0.88rem;line-height:1.65;margin-bottom:0.4rem}
    .card ul{padding-left:1.2rem;margin-bottom:0.5rem}
    .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:1.25rem}
    .stat{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:1.25rem;text-align:center}
    .stat .val{font-size:2rem;font-weight:700;color:#f472b6}
    .stat .lbl{font-size:0.75rem;color:#777;margin-top:0.25rem}
    table{width:100%;border-collapse:collapse;font-size:0.85rem}
    th{text-align:left;padding:0.5rem 0.75rem;color:#777;border-bottom:1px solid #2a2a2a;font-weight:600}
    td{padding:0.5rem 0.75rem;border-bottom:1px solid #1a1a1a;color:#ccc}
    #stats-loading{color:#777;font-size:0.85rem;padding:1rem 0}
  </style>
</head>
<body>

<div id="login-screen">
  <div class="login-box">
    <h1>Pink Admin</h1>
    <p>Asia Connect — TOEIC Coach Admin Portal</p>
    <input type="password" id="pw-input" placeholder="Admin password"/>
    <button id="login-btn">Sign In</button>
    <div id="login-err">Incorrect password.</div>
  </div>
</div>

<div id="portal">
  <div class="topbar">
    <h1>Pink — Admin Portal</h1>
    <button class="logout-btn" id="logout-btn">Sign out</button>
  </div>
  <div class="tabs">
    <div class="tab active" data-tab="analytics">Analytics</div>
    <div class="tab" data-tab="info">Platform Info</div>
  </div>
  <div class="content">

    <div class="panel active" id="tab-analytics">
      <div id="stats-loading">Loading analytics...</div>
      <div id="stats-content" style="display:none">
        <div class="stat-grid" id="stat-grid"></div>
        <div class="card">
          <h2>Sessions by Language</h2>
          <table><thead><tr><th>Language</th><th>Sessions</th></tr></thead><tbody id="lang-table"></tbody></table>
        </div>
        <div class="card">
          <h2>Sessions by Country</h2>
          <table><thead><tr><th>Country</th><th>Sessions</th></tr></thead><tbody id="country-table"></tbody></table>
        </div>
      </div>
    </div>

    <div class="panel" id="tab-info">
      <div class="card">
        <h2>Platform</h2>
        <p>Agent: Pink — TOEIC Score Coach</p>
        <p>Platform: Asia Connect (Netizen 9)</p>
        <p>Access code: PINK2026</p>
        <p>Daily limit: 10 questions per device</p>
        <p>Languages: 15 (Vietnamese default)</p>
        <p>Model: claude-sonnet-4-6</p>
        <p>Voice: Cynthia (ElevenLabs)</p>
      </div>
      <div class="card">
        <h2>Data Handling</h2>
        <p>No conversation content is stored. Session analytics only: language, country, classroom code, timestamp, anonymous device ID.</p>
        <p>Analytics are retained for 12 months then automatically deleted.</p>
        <p>Governed by the laws of England and Wales.</p>
      </div>
    </div>

  </div>
</div>

<script>
  var pw = '';

  document.getElementById('login-btn').onclick = async function() {
    var input = document.getElementById('pw-input').value.trim();
    var err = document.getElementById('login-err');
    var btn = document.getElementById('login-btn');
    btn.textContent = '...'; btn.disabled = true;
    try {
      var res = await fetch('/admin-auth', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ password: input }) });
      var data = await res.json();
      if (data.ok) {
        pw = input;
        err.style.display = 'none';
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('portal').style.display = 'flex';
        loadStats();
      } else {
        err.style.display = 'block';
      }
    } catch { err.style.display = 'block'; }
    btn.textContent = 'Sign In'; btn.disabled = false;
  };

  document.getElementById('pw-input').onkeydown = function(e) { if (e.key === 'Enter') document.getElementById('login-btn').onclick(); };
  document.getElementById('logout-btn').onclick = function() { location.reload(); };

  document.querySelectorAll('.tab').forEach(function(tab) {
    tab.onclick = function() {
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    };
  });

  async function loadStats() {
    try {
      var res = await fetch('/admin-stats', { headers: { 'X-Admin-Password': pw } });
      var data = await res.json();
      if (!data.ok) return;
      document.getElementById('stats-loading').style.display = 'none';
      document.getElementById('stats-content').style.display = 'block';

      var grid = document.getElementById('stat-grid');
      grid.innerHTML =
        stat(data.total, 'Total Sessions') +
        stat(data.today, 'Today') +
        stat(data.uniqueStudents, 'Unique Students') +
        stat(data.codesUsed, 'Classroom Codes Used');

      var langTbl = document.getElementById('lang-table');
      langTbl.innerHTML = (data.byLanguage || []).map(function(r) {
        return '<tr><td>' + r.language + '</td><td>' + r.count + '</td></tr>';
      }).join('');

      var ctryTbl = document.getElementById('country-table');
      ctryTbl.innerHTML = (data.byCountry || []).map(function(r) {
        return '<tr><td>' + r.country + '</td><td>' + r.count + '</td></tr>';
      }).join('');
    } catch { document.getElementById('stats-loading').textContent = 'Failed to load analytics.'; }
  }

  function stat(val, lbl) {
    return '<div class="stat"><div class="val">' + (val || 0) + '</div><div class="lbl">' + lbl + '</div></div>';
  }
</script>
</body>
</html>`;
}
