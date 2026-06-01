export function renderChatUI(name: string, greeting: string, accessGate: boolean, freeLimit: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <meta name="theme-color" content="#121212"/>
  <script>
    var turnstileToken = '';
    var tsRendered = false;
    function waitForTurnstile() {
      if (window.turnstile && !tsRendered) {
        tsRendered = true;
        window.turnstile.render('#cf-turnstile', {
          sitekey: '0x4AAAAAADcmXESejsluEa9b',
          callback: function(t) { turnstileToken = t; },
          'refresh-expired': 'auto',
          theme: 'dark'
        });
      } else if (!tsRendered) {
        setTimeout(waitForTurnstile, 200);
      }
    }
    document.addEventListener('DOMContentLoaded', function() { setTimeout(waitForTurnstile, 500); });
  </script>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
  <title>${name} — TOEIC Score Coach</title>
  <link rel="manifest" href="/manifest.json"/>
  <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{
      --black:#121212;
      --pink:#f472b6;
      --pink-dark:#db2777;
      --pink-muted:#f9a8d4;
      --bg:#121212;
      --card:#1a1a1a;
      --border:#2a2a2a;
      --text:#f0f0f0;
      --muted:#888888;
      --font:'IBM Plex Mono',monospace;
    }
    html,body{height:100%;overflow:hidden}
    body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:14px}

    /* ── overlays ── */
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:100;padding:1rem}
    .overlay-box{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;width:100%;max-width:400px;max-height:90vh;overflow-y:auto}
    .overlay-box h2{color:var(--pink);font-size:1.1rem;margin-bottom:0.4rem}
    .overlay-box p{color:var(--muted);font-size:0.78rem;margin-bottom:1.2rem;line-height:1.5}
    label{display:block;font-size:0.75rem;color:var(--muted);margin-bottom:0.3rem;margin-top:0.9rem}
    select,input{width:100%;background:#0f0f0f;border:1px solid var(--border);border-radius:6px;color:var(--text);padding:0.6rem 0.8rem;font-size:0.88rem;font-family:var(--font);appearance:none;-webkit-appearance:none}
    select:focus,input:focus{outline:none;border-color:var(--pink)}
    .btn-primary{display:block;width:100%;background:var(--pink);color:#121212;border:none;border-radius:8px;padding:0.85rem;font-size:0.95rem;font-weight:700;font-family:var(--font);cursor:pointer;margin-top:1.4rem;letter-spacing:0.02em}
    .btn-primary:hover{background:var(--pink-muted)}

    /* ── language modal ── */
    #lang-overlay .overlay-box h2{margin-bottom:1rem}
    #lang-select{margin-bottom:0}

    /* ── topbar ── */
    #topbar{background:var(--card);border-bottom:1px solid var(--border);padding:0.75rem 1rem;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
    #topbar-left{display:flex;align-items:center;gap:0.75rem}
    #topbar-avatar{width:36px;height:36px;background:var(--pink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;color:#121212;flex-shrink:0}
    #topbar-name{font-weight:700;font-size:0.95rem;color:var(--pink)}
    #topbar-sub{font-size:0.72rem;color:var(--muted)}
    #topbar-actions{display:flex;gap:0.5rem;align-items:center}
    .btn-topbar{background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:0.72rem;font-family:var(--font);padding:0.3rem 0.6rem;cursor:pointer}
    .btn-topbar:hover{border-color:var(--pink);color:var(--pink)}
    #btn-reset{background:var(--pink);border-color:var(--pink);color:#121212;font-weight:700;padding:0.35rem 0.85rem}

    /* ── chat screen ── */
    #chat-screen{display:none;flex-direction:column;height:100%;overflow:hidden}
    #messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.75rem}
    #messages::-webkit-scrollbar{width:4px}
    #messages::-webkit-scrollbar-track{background:transparent}
    #messages::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

    /* ── bubbles ── */
    .msg-row{display:flex}
    .msg-row.user{justify-content:flex-end}
    .msg-row.assistant{justify-content:flex-start}
    .bubble{max-width:80%;padding:0.7rem 0.9rem;border-radius:12px;font-size:0.88rem;line-height:1.6}
    .msg-row.user .bubble{background:var(--pink-dark);color:#fff;border-bottom-right-radius:3px}
    .msg-row.assistant .bubble{background:var(--card);border:1px solid var(--border);color:var(--text);border-bottom-left-radius:3px}
    .btn-speak{display:block;background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--muted);font-family:var(--font);font-size:0.68rem;padding:0.2rem 0.5rem;cursor:pointer;margin-top:0.4rem}
    .btn-speak:hover,.btn-speak.speaking{border-color:var(--pink);color:var(--pink)}

    /* ── milestone ── */
    .milestone{text-align:center;font-size:0.72rem;color:var(--pink);padding:0.4rem 0;opacity:0.8}

    /* ── input area ── */
    #input-area{padding:0.75rem 1rem;border-top:1px solid var(--border);display:flex;gap:0.5rem;flex-shrink:0;background:var(--bg)}
    #user-input{flex:1;background:#0f0f0f;border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font);font-size:0.88rem;padding:0.6rem 0.8rem;resize:none;min-height:42px;max-height:120px;overflow-y:auto;line-height:1.5}
    #user-input:focus{outline:none;border-color:var(--pink)}
    #btn-send{background:var(--pink);border:none;border-radius:8px;color:#121212;font-weight:700;font-family:var(--font);font-size:0.88rem;padding:0.6rem 1rem;cursor:pointer;flex-shrink:0;height:42px}
    #btn-send:hover{background:var(--pink-muted)}
    #btn-send:disabled{background:#444;cursor:default}

    /* ── day limit banner ── */
    #limit-banner{display:none;background:#1a0a0a;border:1px solid #f55;border-radius:8px;padding:0.75rem 1rem;margin:0.5rem 1rem;font-size:0.8rem;color:#f88;text-align:center}

    /* ── access gate ── */
    #access-overlay .overlay-box p{margin-bottom:1rem}
    #access-input{margin-bottom:0.5rem}
    #access-error{font-size:0.78rem;color:#f55;margin-top:0.4rem;display:none}

    /* ── feedback modal ── */
    #feedback-overlay textarea{width:100%;background:#0f0f0f;border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--font);font-size:0.85rem;padding:0.65rem;resize:vertical;min-height:100px;margin-top:0.5rem}
    #feedback-overlay textarea:focus{outline:none;border-color:var(--pink)}
    #feedback-status{font-size:0.8rem;margin-top:0.5rem;display:none}
    .btn-secondary{display:block;width:100%;background:transparent;border:1px solid var(--pink);color:var(--pink);border-radius:8px;padding:0.75rem;font-size:0.88rem;font-family:var(--font);cursor:pointer;margin-top:0.75rem}
    .btn-secondary:hover{background:rgba(244,114,182,0.08)}

    /* ── typing indicator ── */
    #typing{display:none;padding:0 1rem 0.5rem;color:var(--muted);font-size:0.75rem}

    /* ── daily limit notice ── */
    #daily-limit-msg{display:none;padding:1rem;text-align:center;color:var(--muted);font-size:0.82rem}

    /* ── floating feedback button ── */
    #btn-float-feedback{position:fixed;bottom:1.25rem;right:1.25rem;z-index:200;background:var(--pink);border:none;border-radius:8px;color:#121212;font-family:var(--font);font-size:0.8rem;font-weight:700;padding:0.55rem 1.1rem;cursor:pointer;box-shadow:0 4px 18px rgba(244,114,182,0.5)}
    #btn-float-feedback:hover{background:var(--pink-muted)}
  </style>
</head>
<body>

<!-- Language Modal -->
<div id="lang-overlay" class="overlay">
  <div class="overlay-box">
    <img src="/jenny.png" alt="Jenny" style="width:140px;height:140px;object-fit:cover;object-position:top;border-radius:50%;display:block;margin:0 auto 1.25rem;box-shadow:0 0 40px rgba(255,61,160,0.3);border:2px solid rgba(255,61,160,0.4);" />
    <h2>${name}</h2>
    <p>TOEIC Score Coach — choose your language to begin</p>
    <select id="lang-select">
      <option value="Vietnamese">Tieng Viet (Vietnamese)</option>
      <option value="English">English</option>
      <option value="Khmer">Phasa Khmer (Khmer)</option>
      <option value="Thai">Phasa Thai (Thai)</option>
      <option value="Tagalog">Tagalog (Filipino)</option>
      <option value="Indonesian">Bahasa Indonesia</option>
      <option value="Malay">Bahasa Melayu (Malay)</option>
      <option value="Mandarin">Zhongwen (Mandarin)</option>
      <option value="Korean">Hangugeo (Korean)</option>
      <option value="Japanese">Nihongo (Japanese)</option>
      <option value="Hindi">Hindi</option>
      <option value="French">Francais (French)</option>
      <option value="Spanish">Espanol (Spanish)</option>
      <option value="German">Deutsch (German)</option>
      <option value="Russian">Russkiy (Russian)</option>
    </select>
    <button class="btn-primary" id="btn-lang-confirm">Continue</button>
    <p style="font-size:0.65rem;color:var(--muted);text-align:center;margin-top:1rem;line-height:1.5">Pink is not affiliated with or endorsed by ETS or any examination body. TOEIC is a registered trademark of ETS.</p>
  </div>
</div>

<!-- Profile Form -->
<div id="overlay" class="overlay" style="display:none">
  <div class="overlay-box">
    <button id="btn-back-lang" style="background:none;border:none;color:var(--muted);font-size:0.78rem;font-family:var(--font);cursor:pointer;padding:0;margin-bottom:0.75rem;display:block">&#8592; Change language</button>
    <h2 id="form-heading">Before we begin</h2>
    <p id="form-subtitle">I'm ${name}, your TOEIC score coach. Tell me about your goal so I can target your weakest spots first.</p>
    <label id="label-name">Your name (optional)</label>
    <input type="text" id="input-name" autocomplete="off"/>
    <label id="label-current">Current TOEIC score</label>
    <select id="input-current">
      <option value="" id="current-default">— select your score —</option>
      <option value="Not sure yet">Not sure yet</option>
      <option value="Under 300">Under 300</option>
      <option value="300-400">300 to 400</option>
      <option value="400-500">400 to 500</option>
      <option value="500-600">500 to 600</option>
      <option value="600-700">600 to 700</option>
      <option value="700-800">700 to 800</option>
      <option value="800+">800 or above</option>
    </select>
    <label id="label-target">Target TOEIC score</label>
    <select id="input-target">
      <option value="" id="target-default">— select your target —</option>
      <option value="450 (graduation)">450 — graduation</option>
      <option value="550">550</option>
      <option value="600 (good graduate)">600 — good graduate</option>
      <option value="700">700</option>
      <option value="750">750</option>
      <option value="800">800</option>
      <option value="850+">850 or above</option>
      <option value="900+">900 or above</option>
    </select>
    <label id="label-deadline">Study deadline</label>
    <select id="input-deadline">
      <option value="" id="deadline-default">— select deadline —</option>
      <option value="1 month">1 month</option>
      <option value="2 months">2 months</option>
      <option value="3 months">3 months</option>
      <option value="6 months">6 months</option>
      <option value="Flexible">Flexible</option>
    </select>
    <label id="label-weak">Weakest area</label>
    <select id="input-weak">
      <option value="" id="weak-default">— select area —</option>
      <option value="Listening">Listening</option>
      <option value="Reading">Reading</option>
      <option value="Both equally">Both equally</option>
    </select>
    <label id="label-classroom">Classroom Code (optional — from your trainer)</label>
    <input type="text" id="input-classroom" autocomplete="off" style="text-transform:uppercase"/>
    <button class="btn-primary" id="btn-start">Start with ${name}</button>
    <p style="font-size:0.7rem;color:var(--muted);text-align:center;margin-top:0.75rem" id="privacy-note">This information never leaves your device</p>
  </div>
</div>

<!-- Access Gate -->
<div id="access-overlay" class="overlay" style="display:none">
  <div class="overlay-box">
    <h2>Access Code Required</h2>
    <p>Enter your access code to continue with ${name}.</p>
    <input type="text" id="access-input" placeholder="Enter code" style="text-transform:uppercase" autocomplete="off"/>
    <div id="access-error">Invalid code. Please try again.</div>
    <button class="btn-primary" id="btn-access">Unlock</button>
  </div>
</div>

<!-- Feedback Modal -->
<div id="feedback-overlay" class="overlay" style="display:none">
  <div class="overlay-box">
    <h2 id="feedback-title">Feedback</h2>
    <p>Questions, issues or suggestions? Let us know.</p>
    <textarea id="feedback-text" placeholder="Your message..."></textarea>
    <div id="feedback-status"></div>
    <button class="btn-primary" id="btn-feedback-send">Send</button>
    <button class="btn-secondary" id="btn-feedback-close">Cancel</button>
  </div>
</div>

<!-- Floating Feedback Button -->
<button id="btn-float-feedback">Feedback</button>

<!-- Chat Screen -->
<div id="chat-screen">
  <div id="topbar">
    <div id="topbar-left">
      <div id="topbar-avatar">P</div>
      <div>
        <div id="topbar-name">${name}</div>
        <div id="topbar-sub">TOEIC Score Coach</div>
      </div>
    </div>
    <div id="topbar-actions">
      <button class="btn-topbar" id="btn-feedback-open">Feedback</button>
      <button class="btn-topbar" id="btn-reset">Reset</button>
    </div>
  </div>
  <div id="limit-banner"></div>
  <div id="messages"></div>
  <div id="typing">Pink is thinking...</div>
  <div id="daily-limit-msg"></div>
  <div id="input-area">
    <textarea id="user-input" rows="1" placeholder="Type your message..."></textarea>
    <button id="btn-send">Send</button>
  </div>
</div>

<script>
(function() {
  var PROFILE_KEY    = 'pink-profile';
  var HISTORY_KEY    = 'pink-history';
  var LANGUAGE_KEY   = 'pink-language';
  var UNLOCK_KEY     = 'pink-unlocked';
  var COUNT_KEY      = 'pink-qcount';
  var LIFETIME_KEY   = 'pink-lifetime-questions';
  var STUDENT_ID_KEY = 'pink-student-id';
  var DAY_KEY        = 'pink-day';
  var DAY_COUNT_KEY  = 'pink-day-count';

  var FREE_LIMIT     = ${freeLimit};
  var ACCESS_GATE    = ${accessGate};
  var DAILY_LIMIT    = 10;

  var name     = ${JSON.stringify(name)};
  var greeting = ${JSON.stringify(greeting)};
  var language = localStorage.getItem(LANGUAGE_KEY) || 'Vietnamese';
  var profile  = {};
  var history  = [];
  var sessionId = '';
  var isStreaming = false;

  var FORM_T = {
    'Vietnamese':  { h:'Truoc khi bat dau', sub:'Toi la ' + name + ', huan luyen vien TOEIC cua ban. Cho toi biet muc tieu de toi tap trung vao diem yeu cua ban truoc.', name:'Ten cua ban (khong bat buoc)', current:'Diem TOEIC hien tai', currentD:'— chon diem cua ban —', target:'Muc tieu TOEIC', targetD:'— chon muc tieu —', deadline:'Thoi han on thi', deadlineD:'— chon thoi han —', weak:'Ky nang yeu nhat', weakD:'— chon ky nang —', code:'Ma lop hoc (khong bat buoc)', btn:'Bat dau voi ' + name, privacy:'Thong tin nay khong roi khoi thiet bi cua ban', topbarSub:'Huan luyen vien TOEIC', placeholder:'Nhap tin nhan cua ban...', feedback:'Phan hoi', reset:'Dat lai', m5:'5 cau hoi — dang tien bo', m10:'10 cau hoi — tiep tuc co gang', m10l:'Tiep tuc nao!', m25l:'Tien bo tot!', m50l:'Nua chang duong!', m100l:'100 cau hoi!' },
    'English':     { h:'Before we begin', sub:'I am ' + name + ', your TOEIC score coach. Tell me your goal so I can target your weakest spots first.', name:'Your name (optional)', current:'Current TOEIC score', currentD:'— select your score —', target:'Target TOEIC score', targetD:'— select your target —', deadline:'Study deadline', deadlineD:'— select deadline —', weak:'Weakest area', weakD:'— select area —', code:'Classroom Code (optional)', btn:'Start with ' + name, privacy:'This information never leaves your device', topbarSub:'TOEIC Score Coach', placeholder:'Type your message...', feedback:'Feedback', reset:'Reset', m5:'5 questions — making progress', m10:'10 questions — keep going', m10l:'Keep it up!', m25l:'Great progress!', m50l:'Halfway to 100!', m100l:'100 questions!' },
    'Khmer':       { h:'MunពីYeungចាប់ផ្ដើម', sub:'Khnom keu ' + name + ' - kouch kanleng TOEIC robos anak.', name:'Chmoh anak (bat buoc te)', current:'Koddam TOEIC ban srei', currentD:'— chrenhas koddam —', target:'Koddam TOEIC chet mun', targetD:'— chrenhas koted —', deadline:'Kamnot rien sot', deadlineD:'— chrenhas kamnot —', weak:'Ky nang khlean jong', weakD:'— chrenhas ky nang —', code:'Leh bangrien (bat buoc te)', btn:'Chdap yeung chea moy nig ' + name, privacy:'Peal yeung min dak cheny pis krupkreng anak te', topbarSub:'Kouch TOEIC', placeholder:'Sresevachoun anak...', feedback:'Yok del yubuol', reset:'Tva sarey chet', m5:'5 sual — kamnot doem', m10:'10 sual — bantoan beunh', m10l:'Bantoan beunh!', m25l:'Chnah lae!', m50l:'Pisach phneak!', m100l:'100 sual!' },
    'Thai':        { h:'Kon reum ton', sub:'Chan chue ' + name + ' — TOEIC coach khong khun.', name:'Chue khong khun (mai bangkhab)', current:'Khaen TOEIC patcuban', currentD:'— lueak khaen —', target:'Khaen TOEIC thi tong kan', targetD:'— lueak penghai —', deadline:'Kamnoet kan sueksa', deadlineD:'— lueak wan thi —', weak:'Cud on', weakD:'— lueak cud on —', code:'Rahat Hong Rian (mai bangkhab)', btn:'Reum ton gab ' + name, privacy:'Khomun mai ok cak upakorn', topbarSub:'TOEIC Score Coach', placeholder:'Phim khwam khid khong khun...', feedback:'Khomun yon klab', reset:'Reset', m5:'5 khamtham', m10:'10 khamtham', m10l:'Cheering!', m25l:'Kaona yok!', m50l:'Khreung thang!', m100l:'100 khamtham!' },
    'Tagalog':     { h:'Bago magsimula', sub:'Ako si ' + name + ' — ang iyong TOEIC coach.', name:'Iyong pangalan (opsyonal)', current:'Kasalukuyang TOEIC score', currentD:'— pumili ng score —', target:'Target na TOEIC score', targetD:'— pumili ng target —', deadline:'Takdang panahon', deadlineD:'— pumili ng takda —', weak:'Pinakamahina', weakD:'— pumili ng lugar —', code:'Classroom Code (opsyonal)', btn:'Magsimula kay ' + name, privacy:'Hindi lumalabas ang impormasyon sa device', topbarSub:'TOEIC Score Coach', placeholder:'I-type ang mensahe...', feedback:'Feedback', reset:'I-reset', m5:'5 tanong', m10:'10 tanong', m10l:'Magpatuloy!', m25l:'Mahusay!', m50l:'Kalagitnaan!', m100l:'100 tanong!' },
    'Indonesian':  { h:'Sebelum kita mulai', sub:'Saya ' + name + ' — pelatih TOEIC Anda.', name:'Nama Anda (opsional)', current:'Skor TOEIC saat ini', currentD:'— pilih skor —', target:'Target skor TOEIC', targetD:'— pilih target —', deadline:'Batas waktu belajar', deadlineD:'— pilih waktu —', weak:'Area terlemah', weakD:'— pilih area —', code:'Kode Kelas (opsional)', btn:'Mulai dengan ' + name, privacy:'Informasi ini tidak meninggalkan perangkat Anda', topbarSub:'Pelatih TOEIC', placeholder:'Ketik pesan Anda...', feedback:'Masukan', reset:'Reset', m5:'5 pertanyaan', m10:'10 pertanyaan', m10l:'Lanjutkan!', m25l:'Bagus sekali!', m50l:'Setengah jalan!', m100l:'100 pertanyaan!' },
    'Malay':       { h:'Sebelum kita mula', sub:'Saya ' + name + ' — jurulatih TOEIC anda.', name:'Nama anda (pilihan)', current:'Markah TOEIC semasa', currentD:'— pilih markah —', target:'Sasaran markah TOEIC', targetD:'— pilih sasaran —', deadline:'Tarikh akhir belajar', deadlineD:'— pilih tarikh —', weak:'Kawasan paling lemah', weakD:'— pilih kawasan —', code:'Kod Kelas (pilihan)', btn:'Mula dengan ' + name, privacy:'Maklumat ini tidak keluar dari peranti', topbarSub:'Jurulatih TOEIC', placeholder:'Taip mesej anda...', feedback:'Maklum balas', reset:'Set semula', m5:'5 soalan', m10:'10 soalan', m10l:'Teruskan!', m25l:'Bagus!', m50l:'Separuh jalan!', m100l:'100 soalan!' },
    'Mandarin':    { h:'Kaishi qian', sub:'Wo shi ' + name + ' — nin de TOEIC peilian jiaolian.', name:'Nin de mingzi (kexuan)', current:'Dangqian TOEIC chengji', currentD:'— xuanze chengji —', target:'Mubiao TOEIC chengji', targetD:'— xuanze mubiao —', deadline:'Xuexi jixian', deadlineD:'— xuanze jixian —', weak:'Zui ruode lingyu', weakD:'— xuanze lingyu —', code:'Ketang daima (kexuan)', btn:'Yu ' + name + ' kaishi', privacy:'Zhe xie xinxi bu hui likaini de shebei', topbarSub:'TOEIC Chengji Jiaolian', placeholder:'Shuru nin de xiaoxi...', feedback:'Fankui', reset:'Zhongzhi', m5:'5 ge wenti', m10:'10 ge wenti', m10l:'Jixu jiayou!', m25l:'Feichang hao!', m50l:'Yi ban lucheng!', m100l:'100 ge wenti!' },
    'Korean':      { h:'Sijak hagi jeon', sub:'Jeoneun ' + name + ' — dangsinui TOEIC kochu imnida.', name:'Ireume (seontaek)', current:'Hyeonjae TOEIC jeonsu', currentD:'— jeonsu seontaek —', target:'Mupyo TOEIC jeonsu', targetD:'— mupyo seontaek —', deadline:'Gongbu gibhan', deadlineD:'— gibhan seontaek —', weak:'Gajang yakhan buya', weakD:'— buya seontaek —', code:'Gyosil kodu (seontaek)', btn:name + '(wa)gwa sijak', privacy:'I jeongboneun gigie namji aneumnida', topbarSub:'TOEIC Score Coach', placeholder:'Messiji iphyeokk...', feedback:'Peedbeck', reset:'Chosigi', m5:'5 jilmun', m10:'10 jilmun', m10l:'Gyesok!', m25l:'Jal hagoisseo!', m50l:'Baneum walli!', m100l:'100 jilmun!' },
    'Japanese':    { h:'Hajimeru mae ni', sub:'Watashi wa ' + name + ' — anata no TOEIC coach desu.', name:'Onamae (ninii)', current:'Genzai no TOEIC sukoa', currentD:'— sukoa wo erabu —', target:'Mokuhyo TOEIC sukoa', targetD:'— mokuhyo wo erabu —', deadline:'Gakushuu no shimekiri', deadlineD:'— shimekiri wo erabu —', weak:'Mottomo yowai bunya', weakD:'— bunya wo erabu —', code:'Kyoshitsu kodo (ninii)', btn:name + ' to hajimeru', privacy:'Kono joho wa debaisu ni todomari masu', topbarSub:'TOEIC Sukoa Kochi', placeholder:'Messeeji wo nyuuryoku...', feedback:'Fiidoubakku', reset:'Risetto', m5:'5 shitsumon', m10:'10 shitsumon', m10l:'Tsuzukete!', m25l:'Subarashii!', m50l:'Nakaba!', m100l:'100 shitsumon!' },
    'Hindi':       { h:'Shuru karne se pehle', sub:'Main ' + name + ' hoon — aapka TOEIC coach.', name:'Aapka naam (vaikalpik)', current:'Vartaman TOEIC score', currentD:'— score chunein —', target:'Lakshya TOEIC score', targetD:'— lakshya chunein —', deadline:'Adhyayan ki antim tithi', deadlineD:'— tithi chunein —', weak:'Sabse kamzor kshetra', weakD:'— kshetra chunein —', code:'Kaksha kode (vaikalpik)', btn:name + ' ke saath shuru karein', privacy:'Yeh jaankari aapke device se bahar nahi jaati', topbarSub:'TOEIC Score Coach', placeholder:'Apna sandesh type karein...', feedback:'Prtikrya', reset:'Reset', m5:'5 prashn', m10:'10 prashn', m10l:'Jaari rakhein!', m25l:'Bahut acha!', m50l:'Aadha raasta!', m100l:'100 prashn!' },
    'French':      { h:'Avant de commencer', sub:'Je suis ' + name + ' — votre coach TOEIC.', name:'Votre nom (facultatif)', current:'Score TOEIC actuel', currentD:'— choisir le score —', target:'Score TOEIC cible', targetD:'— choisir la cible —', deadline:'Echeance', deadlineD:'— choisir echeance —', weak:'Point faible', weakD:'— choisir zone —', code:'Code de classe (facultatif)', btn:'Commencer avec ' + name, privacy:'Ces informations restent sur votre appareil', topbarSub:'Coach TOEIC', placeholder:'Tapez votre message...', feedback:'Commentaires', reset:'Reinitialiser', m5:'5 questions', m10:'10 questions', m10l:'Continuez!', m25l:'Excellent!', m50l:'A mi-chemin!', m100l:'100 questions!' },
    'Spanish':     { h:'Antes de empezar', sub:'Soy ' + name + ' — tu coach de TOEIC.', name:'Tu nombre (opcional)', current:'Puntuacion actual TOEIC', currentD:'— seleccionar puntuacion —', target:'Puntuacion objetivo TOEIC', targetD:'— seleccionar objetivo —', deadline:'Fecha limite', deadlineD:'— seleccionar fecha —', weak:'Area mas debil', weakD:'— seleccionar area —', code:'Codigo de clase (opcional)', btn:'Empezar con ' + name, privacy:'Esta informacion no sale de tu dispositivo', topbarSub:'Coach TOEIC', placeholder:'Escribe tu mensaje...', feedback:'Comentarios', reset:'Reiniciar', m5:'5 preguntas', m10:'10 preguntas', m10l:'Sigue adelante!', m25l:'Excelente!', m50l:'A mitad de camino!', m100l:'100 preguntas!' },
    'German':      { h:'Bevor wir beginnen', sub:'Ich bin ' + name + ' — dein TOEIC-Coach.', name:'Dein Name (optional)', current:'Aktueller TOEIC-Score', currentD:'— Score auswahlen —', target:'Ziel-TOEIC-Score', targetD:'— Ziel auswahlen —', deadline:'Lernfrist', deadlineD:'— Frist auswahlen —', weak:'Schwachste Bereich', weakD:'— Bereich auswahlen —', code:'Klassencode (optional)', btn:'Mit ' + name + ' starten', privacy:'Diese Informationen bleiben auf deinem Gerat', topbarSub:'TOEIC Score Coach', placeholder:'Nachricht eingeben...', feedback:'Feedback', reset:'Zurucksetzen', m5:'5 Fragen', m10:'10 Fragen', m10l:'Weitermachen!', m25l:'Ausgezeichnet!', m50l:'Halbzeit!', m100l:'100 Fragen!' },
    'Russian':     { h:'Pered nachalom', sub:'Ya ' + name + ' — vash TOEIC-trener.', name:'Vashe imya (neobyzatelno)', current:'Tekushchiy ball TOEIC', currentD:'— vybrat ball —', target:'Tselevoy ball TOEIC', targetD:'— vybrat tsel —', deadline:'Srok podgotovki', deadlineD:'— vybrat srok —', weak:'Samaya slabaya oblast', weakD:'— vybrat oblast —', code:'Kod klassa (neobyzatelno)', btn:'Nachat s ' + name, privacy:'Eta informatsiya ostaetsya na vashom ustroystve', topbarSub:'TOEIC Score Coach', placeholder:'Vvedite soobshcheniye...', feedback:'Otzyv', reset:'Sbros', m5:'5 voprosov', m10:'10 voprosov', m10l:'Prodolzhay!', m25l:'Otlichno!', m50l:'Polviny puti!', m100l:'100 voprosov!' }
  };

  function applyFormTranslations(lang) {
    var t = FORM_T[lang] || FORM_T['English'];
    document.getElementById('form-heading').textContent = t.h;
    document.getElementById('form-subtitle').textContent = t.sub;
    document.getElementById('label-name').textContent = t.name;
    document.getElementById('label-current').textContent = t.current;
    document.getElementById('current-default').textContent = t.currentD;
    document.getElementById('label-target').textContent = t.target;
    document.getElementById('target-default').textContent = t.targetD;
    document.getElementById('label-deadline').textContent = t.deadline;
    document.getElementById('deadline-default').textContent = t.deadlineD;
    document.getElementById('label-weak').textContent = t.weak;
    document.getElementById('weak-default').textContent = t.weakD;
    document.getElementById('label-classroom').textContent = t.code;
    document.getElementById('btn-start').textContent = t.btn;
    document.getElementById('privacy-note').textContent = t.privacy;
    document.getElementById('topbar-sub').textContent = t.topbarSub;
    document.getElementById('user-input').placeholder = t.placeholder;
    document.getElementById('btn-feedback-open').textContent = t.feedback;
    document.getElementById('btn-reset').textContent = t.reset;
  }

  function getStudentId() {
    var id = localStorage.getItem(STUDENT_ID_KEY);
    if (!id) {
      id = 'stu-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(STUDENT_ID_KEY, id);
    }
    return id;
  }

  function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function getDailyCount() {
    var today = getTodayStr();
    if (localStorage.getItem(DAY_KEY) !== today) {
      localStorage.setItem(DAY_KEY, today);
      localStorage.setItem(DAY_COUNT_KEY, '0');
    }
    return parseInt(localStorage.getItem(DAY_COUNT_KEY) || '0');
  }

  function incrementDailyCount() {
    var c = getDailyCount() + 1;
    localStorage.setItem(DAY_COUNT_KEY, String(c));
    return c;
  }

  function isDailyLimitReached() {
    return getDailyCount() >= DAILY_LIMIT;
  }

  // ── Boot ──────────────────────────────────────────────────────────────────────

  function boot() {
    var storedLang = localStorage.getItem(LANGUAGE_KEY);
    if (storedLang) {
      language = storedLang;
      applyFormTranslations(language);
    }

    var stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      try { profile = JSON.parse(stored); } catch { profile = {}; }
    }

    var storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) {
      try { history = JSON.parse(storedHistory); } catch { history = []; }
    }

    sessionId = Date.now() + '-' + Math.random().toString(36).slice(2, 6);

    // Skip language + profile if already set
    if (profile && profile.language && (profile.current_score || profile.weak_area)) {
      language = profile.language;
      applyFormTranslations(language);

      if (ACCESS_GATE && !localStorage.getItem(UNLOCK_KEY)) {
        document.getElementById('lang-overlay').style.display = 'none';
        document.getElementById('access-overlay').style.display = 'flex';
        return;
      }
      showChat();
      return;
    }

    // Profile incomplete — always start at language screen
    document.getElementById('lang-overlay').style.display = 'flex';
  }

  // ── Language Modal ─────────────────────────────────────────────────────────────

  document.getElementById('btn-lang-confirm').onclick = function() {
    language = document.getElementById('lang-select').value;
    localStorage.setItem(LANGUAGE_KEY, language);
    document.getElementById('lang-overlay').style.display = 'none';
    document.getElementById('overlay').style.display = 'flex';
    try { applyFormTranslations(language); } catch(e) { console.error('applyFormTranslations error:', e); }
  };

  document.getElementById('btn-back-lang').onclick = function() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('lang-overlay').style.display = 'flex';
    localStorage.removeItem(LANGUAGE_KEY);
  };

  // ── Profile Form ──────────────────────────────────────────────────────────────

  document.getElementById('btn-start').onclick = function() {
    var current = document.getElementById('input-current').value;
    var target = document.getElementById('input-target').value;
    var weak = document.getElementById('input-weak').value;

    if (!current) {
      document.getElementById('input-current').focus();
      return;
    }
    if (!target) {
      document.getElementById('input-target').focus();
      return;
    }
    if (!weak) {
      document.getElementById('input-weak').focus();
      return;
    }

    profile = {
      name: document.getElementById('input-name').value.trim(),
      current_score: current,
      target_score: target,
      deadline: document.getElementById('input-deadline').value || 'Flexible',
      weak_area: weak,
      language: language,
      classroom_code: document.getElementById('input-classroom').value.trim().toUpperCase(),
      student_id: getStudentId(),
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    if (ACCESS_GATE && !localStorage.getItem(UNLOCK_KEY)) {
      document.getElementById('overlay').style.display = 'none';
      document.getElementById('access-overlay').style.display = 'flex';
      return;
    }

    document.getElementById('overlay').style.display = 'none';
    showChat();
  };

  // ── Access Gate ───────────────────────────────────────────────────────────────

  document.getElementById('btn-access').onclick = async function() {
    var code = document.getElementById('access-input').value.trim();
    if (!code) return;
    var btn = document.getElementById('btn-access');
    btn.textContent = '...'; btn.disabled = true;
    try {
      var res = await fetch('/verify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ code: code }) });
      var data = await res.json();
      if (data.ok) {
        localStorage.setItem(UNLOCK_KEY, code);
        document.getElementById('access-overlay').style.display = 'none';
        showChat();
      } else {
        document.getElementById('access-error').style.display = 'block';
      }
    } catch {
      document.getElementById('access-error').style.display = 'block';
    }
    btn.textContent = 'Unlock'; btn.disabled = false;
  };

  document.getElementById('access-input').onkeydown = function(e) {
    if (e.key === 'Enter') document.getElementById('btn-access').onclick();
  };

  // ── Show Chat ─────────────────────────────────────────────────────────────────

  function showChat() {
    document.getElementById('chat-screen').style.display = 'flex';

    // Show daily limit if reached
    if (isDailyLimitReached()) {
      showDailyLimitMessage();
      return;
    }

    // Restore history
    if (history.length > 0) {
      history.forEach(function(m) {
        if (m.role === 'assistant') {
          appendBubble('assistant', m.rawText || m.content);
        } else {
          appendBubble('user', typeof m.content === 'string' ? m.content : '');
        }
      });
      scrollToBottom();
    } else {
      // First time — show greeting
      appendBubble('assistant', greeting);
    }
  }

  function showDailyLimitMessage() {
    document.getElementById('user-input').disabled = true;
    document.getElementById('btn-send').disabled = true;
    var msg = document.getElementById('daily-limit-msg');
    msg.style.display = 'block';
    msg.innerHTML = 'You have reached your 10 question limit for today. Come back tomorrow to continue training.<br><br>Enjoying Pink? We are still testing — hit the <strong style="color:var(--pink)">Feedback</strong> button and let us know how it went.';
  }

  // ── Message Bubbles ───────────────────────────────────────────────────────────

  function formatMd(text) {
    var NL = String.fromCharCode(10);
    var BT = String.fromCharCode(96);
    var s = text.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
    s = s.split('***').join('');
    s = s.split('**').join('');
    s = s.split('*').join('');
    s = s.split('___').join('');
    s = s.split('---').join('');
    s = s.split(BT).join('');
    s = s.split(NL + '### ').join(NL);
    s = s.split(NL + '## ').join(NL);
    s = s.split(NL + '# ').join(NL);
    if (s.slice(0, 4) === '### ') s = s.slice(4);
    else if (s.slice(0, 3) === '## ') s = s.slice(3);
    else if (s.slice(0, 2) === '# ') s = s.slice(2);
    s = s.split(NL + '- ').join(NL + '• ');
    s = s.split(NL + '* ').join(NL + '• ');
    s = s.split(NL).join('<br>');
    return s;
  }

  function appendBubble(role, text) {
    var msgs = document.getElementById('messages');
    var row = document.createElement('div');
    row.className = 'msg-row ' + role;

    var wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = role === 'user' ? 'flex-end' : 'flex-start';
    wrap.style.maxWidth = '80%';

    var bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = formatMd(text);

    wrap.appendChild(bubble);

    if (role === 'assistant') {
      var sb = document.createElement('button');
      sb.className = 'btn-speak';
      sb.textContent = 'Listen';
      sb.onclick = (function(t) { return function() { speakText(sb, t); }; })(text);
      wrap.appendChild(sb);
    }

    row.appendChild(wrap);
    msgs.appendChild(row);
    scrollToBottom();
    return { row: row, bubble: bubble, wrap: wrap };
  }

  function appendStreaming() {
    var msgs = document.getElementById('messages');
    var row = document.createElement('div');
    row.className = 'msg-row assistant';

    var wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'flex-start';
    wrap.style.maxWidth = '80%';

    var bubble = document.createElement('div');
    bubble.className = 'bubble';

    wrap.appendChild(bubble);
    row.appendChild(wrap);
    msgs.appendChild(row);
    scrollToBottom();
    return { bubble: bubble, wrap: wrap };
  }

  function appendMilestone(text) {
    var msgs = document.getElementById('messages');
    var div = document.createElement('div');
    div.className = 'milestone';
    div.textContent = text;
    msgs.appendChild(div);
    scrollToBottom();
  }

  function scrollToBottom() {
    var msgs = document.getElementById('messages');
    msgs.scrollTop = msgs.scrollHeight;
  }

  function checkMilestones(count) {
    var t = FORM_T[language] || FORM_T['English'];
    var milestones = { 5: t.m5, 10: t.m10, 25: t.m25l, 50: t.m50l, 100: t.m100l };
    if (milestones[count]) appendMilestone(milestones[count]);
  }

  // ── TTS ───────────────────────────────────────────────────────────────────────

  function speakText(btn, text) {
    if (btn.classList.contains('speaking')) {
      if (window._pinkAudio) { window._pinkAudio.pause(); window._pinkAudio = null; }
      btn.classList.remove('speaking'); btn.textContent = 'Listen'; return;
    }
    if (window._pinkAudio) { window._pinkAudio.pause(); window._pinkAudio = null; }
    document.querySelectorAll('.btn-speak.speaking').forEach(function(b) { b.classList.remove('speaking'); b.textContent = 'Listen'; });
    btn.textContent = 'Loading...';
    fetch('/speak', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: text, access_code: localStorage.getItem(UNLOCK_KEY) || '' }) })
      .then(function(r) { return r.blob(); })
      .then(function(blob) {
        var url = URL.createObjectURL(blob);
        var audio = new Audio(url);
        window._pinkAudio = audio;
        btn.classList.add('speaking'); btn.textContent = 'Stop';
        audio.onended = function() { btn.classList.remove('speaking'); btn.textContent = 'Listen'; URL.revokeObjectURL(url); };
        audio.onerror = function() { btn.classList.remove('speaking'); btn.textContent = 'Listen'; };
        audio.play();
      })
      .catch(function() { btn.textContent = 'Listen'; });
  }

  // ── Send Message ──────────────────────────────────────────────────────────────

  async function sendMessage() {
    var input = document.getElementById('user-input');
    var text = input.value.trim();
    if (!text || isStreaming) return;
    if (!turnstileToken) return;

    if (isDailyLimitReached()) {
      showDailyLimitMessage();
      return;
    }

    isStreaming = true;
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('btn-send').disabled = true;
    document.getElementById('typing').style.display = 'block';

    appendBubble('user', text);

    var userMsg = { role: 'user', content: text };
    history.push(userMsg);

    var { bubble, wrap } = appendStreaming();
    var fullText = '';
    var streamDone = false;

    try {
      var res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.slice(-20).map(function(m) { return { role: m.role, content: m.content }; }),
          profile: Object.assign({}, profile, { session_id: sessionId }),
          turnstile_token: turnstileToken,
        }),
      });

      if (!res.ok) {
        var errData = await res.json();
        bubble.textContent = errData.error || 'Something went wrong. Please try again.';
        history.pop();
        streamDone = true;
      } else {
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';

        while (true) {
          var _a = await reader.read();
          var done = _a.done;
          var value = _a.value;
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          var lines = buffer.split(String.fromCharCode(10));
          buffer = lines.pop();
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line.startsWith('data: ')) continue;
            var data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              var parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.type === 'text_delta') {
                fullText += parsed.delta.text;
                bubble.innerHTML = formatMd(fullText);
                scrollToBottom();
              }
            } catch {}
          }
        }
        streamDone = true;
      }
    } catch (err) {
      bubble.textContent = 'Connection error. Please try again.';
      history.pop();
      streamDone = true;
    }

    if (streamDone && fullText) {
      // Add speak button now that we have full text
      var sb = document.createElement('button');
      sb.className = 'btn-speak';
      sb.textContent = 'Listen';
      sb.onclick = (function(t) { return function() { speakText(sb, t); }; })(fullText);
      wrap.appendChild(sb);

      var assistantMsg = { role: 'assistant', content: fullText, rawText: fullText };
      history.push(assistantMsg);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40)));

      var dailyCount = incrementDailyCount();
      var lifetimeCount = parseInt(localStorage.getItem(LIFETIME_KEY) || '0') + 1;
      localStorage.setItem(LIFETIME_KEY, String(lifetimeCount));
      checkMilestones(lifetimeCount);

      if (isDailyLimitReached()) {
        showDailyLimitMessage();
      }
    }

    document.getElementById('typing').style.display = 'none';
    document.getElementById('btn-send').disabled = false;
    isStreaming = false;
    scrollToBottom();
  }

  document.getElementById('btn-send').onclick = sendMessage;

  document.getElementById('user-input').onkeydown = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  document.getElementById('user-input').oninput = function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  };

  // ── Feedback ──────────────────────────────────────────────────────────────────

  function openFeedback() { document.getElementById('feedback-overlay').style.display = 'flex'; }
  document.getElementById('btn-feedback-open').onclick = openFeedback;
  document.getElementById('btn-float-feedback').onclick = openFeedback;
  document.getElementById('btn-feedback-close').onclick = function() {
    document.getElementById('feedback-overlay').style.display = 'none';
  };
  document.getElementById('btn-feedback-send').onclick = async function() {
    var msg = document.getElementById('feedback-text').value.trim();
    var status = document.getElementById('feedback-status');
    if (!msg) return;
    var btn = document.getElementById('btn-feedback-send');
    btn.textContent = 'Sending...'; btn.disabled = true;
    try {
      var res = await fetch('/feedback', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: msg }) });
      var data = await res.json();
      status.style.display = 'block';
      if (data.ok) {
        status.style.color = '#5a5';
        status.textContent = 'Sent. Thank you!';
        document.getElementById('feedback-text').value = '';
        setTimeout(function() { document.getElementById('feedback-overlay').style.display = 'none'; status.style.display = 'none'; }, 1500);
      } else {
        status.style.color = '#f55';
        status.textContent = 'Failed to send. Try again.';
      }
    } catch {
      status.style.color = '#f55';
      status.textContent = 'Failed to send. Try again.';
    }
    btn.textContent = 'Send'; btn.disabled = false;
  };

  // ── Reset ─────────────────────────────────────────────────────────────────────

  document.getElementById('btn-reset').onclick = function() {
    if (!confirm('Reset your profile and chat history?')) return;
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(LANGUAGE_KEY);
    localStorage.removeItem(COUNT_KEY);
    localStorage.removeItem(LIFETIME_KEY);
    localStorage.removeItem(DAY_KEY);
    localStorage.removeItem(DAY_COUNT_KEY);
    location.reload();
  };

  // ── PWA Service Worker ────────────────────────────────────────────────────────

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  }

  // ── Start ─────────────────────────────────────────────────────────────────────

  boot();
})();
</script>
<div id="cf-turnstile" style="position:fixed;left:-9999px;top:-9999px"></div>
</body>
</html>`;
}
