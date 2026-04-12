
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

  var FREE_LIMIT     = 10;
  var ACCESS_GATE    = true;
  var DAILY_LIMIT    = 10;

  var name     = "Pink";
  var greeting = "Hello! I'm Pink — your TOEIC score coach. Tell me your current score, your target, and your deadline. Let's find your weak spots and fix them fast.";
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

      if (ACCESS_GATE && localStorage.getItem(UNLOCK_KEY) !== 'true') {
        document.getElementById('lang-overlay').style.display = 'none';
        document.getElementById('access-overlay').style.display = 'flex';
        return;
      }
      showChat();
      return;
    }

    if (storedLang) {
      document.getElementById('lang-overlay').style.display = 'none';
      document.getElementById('overlay').style.display = 'flex';
    } else {
      document.getElementById('lang-overlay').style.display = 'flex';
    }
  }

  // ── Language Modal ─────────────────────────────────────────────────────────────

  document.getElementById('btn-lang-confirm').onclick = function() {
    language = document.getElementById('lang-select').value;
    localStorage.setItem(LANGUAGE_KEY, language);
    document.getElementById('lang-overlay').style.display = 'none';
    document.getElementById('overlay').style.display = 'flex';
    try { applyFormTranslations(language); } catch(e) { console.error('applyFormTranslations error:', e); }
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

    if (ACCESS_GATE && localStorage.getItem(UNLOCK_KEY) !== 'true') {
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
        localStorage.setItem(UNLOCK_KEY, 'true');
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
    msg.textContent = 'You have reached your 10 question limit for today. Come back tomorrow to continue training.';
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
    fetch('/speak', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: text }) })
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
          messages: history.slice(-20),
          profile: Object.assign({}, profile, { session_id: sessionId }),
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
          var lines = buffer.split('
');
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

  document.getElementById('btn-feedback-open').onclick = function() {
    document.getElementById('feedback-overlay').style.display = 'flex';
  };
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
