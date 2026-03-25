// ── IsabelAuth (embedded) ──────────────────────────────────────────────────
const IsabelAuth = (() => {
  const SK = 'isabel_session';
  const get = k => { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } };
  const getUser = () => get(SK);
  const isAuthenticated = () => { const s = get(SK); return !!(s && s.token); };
  return { getUser, isAuthenticated };
})();

// ── State ──────────────────────────────────────────────────────────────────
let ttsEnabled = false, micEnabled = true, micActive = false;
let recognition = null, currentUtterance = null;
let conversationHistory = [];
let particlesEnabled = true;
const user = IsabelAuth.getUser();

// ── Waveform ───────────────────────────────────────────────────────────────
const BARS = 18;
const waveform = document.getElementById('waveform');
for (let i = 0; i < BARS; i++) {
  const b = document.createElement('div');
  b.className = 'wave-bar';
  const min = (Math.random() * .3 + .05).toFixed(2);
  const max = (Math.random() * .7 + .3).toFixed(2);
  const h = Math.round(Math.random() * 24 + 8);
  b.style.cssText = `height:${h}px;--min:${min};--max:${max};animation-delay:${(i * .05).toFixed(2)}s`;
  waveform.appendChild(b);
}

// ── Orb states ─────────────────────────────────────────────────────────────
function setOrbState(state) { // 'idle' | 'thinking' | 'talking' | 'listening'
  const orb = document.getElementById('orbCore');
  const ring = document.getElementById('statusRing');
  const lbl = document.getElementById('statusLabel');
  const wf = document.getElementById('waveform');

  orb.className = 'orb-core';
  wf.className = 'waveform';
  ring.className = 'status-ring';

  if (state === 'thinking') {
    orb.style.animation = 'orb-float 3.4s ease-in-out infinite, orb-glow 2.4s ease-in-out infinite';
    orb.style.filter = 'hue-rotate(30deg) brightness(1.2)';
    lbl.textContent = 'Thinking...';
    ring.className = 'status-ring orange';
    wf.classList.add('active');
  } else if (state === 'talking') {
    orb.className = 'orb-core talking';
    orb.style.filter = '';
    lbl.textContent = 'Speaking...';
    wf.classList.add('active', 'speaking');
  } else if (state === 'listening') {
    orb.className = 'orb-core listening';
    orb.style.filter = 'hue-rotate(-30deg)';
    lbl.textContent = 'Listening...';
    ring.className = 'status-ring cyan';
    wf.classList.add('active', 'listening');
  } else {
    orb.style.filter = '';
    lbl.textContent = user ? `Hi, ${user.firstName}! Ready` : 'Online & Ready';
    wf.classList.remove('active');
  }
}

// ── Particles ──────────────────────────────────────────────────────────────
function spawnParticle() {
  if (!particlesEnabled) return;
  const p = document.createElement('div');
  p.className = 'float-particle';
  const size = Math.random() * 4 + 2;
  const x = Math.random() * 100;
  const dur = Math.random() * 12 + 8;
  const hue = Math.random() > .5 ? '260' : '300';
  p.style.cssText = `width:${size}px;height:${size}px;left:${x}%;bottom:-20px;background:hsl(${hue},80%,70%);opacity:.5;animation-duration:${dur}s;animation-delay:${Math.random()*5}s`;
  document.getElementById('particles').appendChild(p);
  setTimeout(() => p.remove(), (dur + 5) * 1000);
}
setInterval(spawnParticle, 1200);
for (let i = 0; i < 6; i++) setTimeout(spawnParticle, i * 400);

function toggleParticles() {
  particlesEnabled = !particlesEnabled;
  document.getElementById('tglParticles').classList.toggle('on', particlesEnabled);
}

// ── Panel switching ────────────────────────────────────────────────────────
function switchPanel(name) {
  ['chat', 'settings', 'roadmap'].forEach(p => {
    document.getElementById('panel-' + p).style.display = p === name ? 'block' : 'none';
    document.getElementById('tab-' + p).className = 'ptab' + (p === name ? ' active' : '');
  });
  document.getElementById('miniInputArea').style.display = name === 'chat' ? 'block' : 'none';
  if (name === 'roadmap') animateProgress();
}

function animateProgress() {
  document.querySelectorAll('.progress-fill').forEach((bar, i) => {
    setTimeout(() => {
      bar.style.width = bar.dataset.width + '%';
    }, i * 120);
  });
}

// ── Voice selection ────────────────────────────────────────────────────────
function populateVoices() {
  const sel = document.getElementById('voiceSelect');
  const voices = window.speechSynthesis?.getVoices() || [];
  voices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    sel.appendChild(opt);
  });
  const saved = localStorage.getItem('isabel_voice');
  if (saved) sel.value = saved;
}
window.speechSynthesis?.addEventListener('voiceschanged', populateVoices);
setTimeout(populateVoices, 500);

function saveVoice() {
  localStorage.setItem('isabel_voice', document.getElementById('voiceSelect').value);
}

// ── API Key ────────────────────────────────────────────────────────────────
function getApiKey() { return localStorage.getItem('isabel_api_key') || ''; }
function saveApiKey() {
  const key = document.getElementById('apiInp').value.trim();
  if (!key) return;
  localStorage.setItem('isabel_api_key', key);
  document.getElementById('apiInp').value = '';
  addMiniMessage('assistant', '✓ API key saved! AI responses are now enabled.');
}
// Pre-fill if exists
const existingKey = getApiKey();
if (existingKey) document.getElementById('apiInp').placeholder = 'Key saved ✓ (paste to update)';

// ── TTS ────────────────────────────────────────────────────────────────────
function toggleTTS() {
  ttsEnabled = !ttsEnabled;
  document.getElementById('ttsBtn').classList.toggle('active', ttsEnabled);
  document.getElementById('tglTTS').classList.toggle('on', ttsEnabled);
  if (!ttsEnabled) stopSpeaking();
}
function toggleTTSSetting() {
  toggleTTS();
}

function speak(text) {
  if (!window.speechSynthesis) return;
  stopSpeaking();
  const plain = text.replace(/<[^>]+>/g, '').replace(/[*_`#>]/g, ' ');
  const utt = new SpeechSynthesisUtterance(plain);
  utt.rate = 1.05; utt.pitch = 1.1;

  const selVoice = document.getElementById('voiceSelect').value;
  const voices = window.speechSynthesis.getVoices();
  const voice = selVoice
    ? voices.find(v => v.name === selVoice)
    : voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Google UK English Female'));
  if (voice) utt.voice = voice;

  utt.onstart = () => setOrbState('talking');
  utt.onend = () => { setOrbState('idle'); currentUtterance = null; };
  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
}
function stopSpeaking() {
  window.speechSynthesis?.cancel();
  currentUtterance = null;
  setOrbState('idle');
}

function toggleSpeak() {
  if (currentUtterance) { stopSpeaking(); return; }
  greetUser();
}

// ── STT ────────────────────────────────────────────────────────────────────
let micSetting = true;
function toggleMicSetting() {
  micSetting = !micSetting;
  document.getElementById('tglMic').classList.toggle('on', micSetting);
}

function toggleMic() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    addMiniMessage('assistant', '⚠️ Speech recognition is not supported in this browser. Try Chrome or Edge.');
    return;
  }
  if (micActive) { recognition?.stop(); return; }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    micActive = true;
    setOrbState('listening');
    document.getElementById('micBtn').classList.add('active');
    document.getElementById('micLabel').textContent = 'Stop';
    document.getElementById('miniMicBtn').classList.add('on');
    document.getElementById('miniInput').placeholder = '🎤 Listening...';
  };
  recognition.onresult = e => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('miniInput').value = transcript;
    if (e.results[e.results.length - 1].isFinal) {
      recognition.stop();
      setTimeout(sendMiniMessage, 200);
    }
  };
  recognition.onend = () => {
    micActive = false;
    setOrbState('idle');
    document.getElementById('micBtn').classList.remove('active');
    document.getElementById('micLabel').textContent = 'Listen';
    document.getElementById('miniMicBtn').classList.remove('on');
    document.getElementById('miniInput').placeholder = 'Talk to Isabel...';
  };
  recognition.onerror = () => recognition.onend();
  recognition.start();
}

// ── Mini Chat ──────────────────────────────────────────────────────────────
function addMiniMessage(role, content) {
  const msgs = document.getElementById('miniMessages');
  const isAI = role === 'assistant';
  const initials = user ? (user.firstName?.[0] || '') + (user.lastName?.[0] || '') : '?';

  const row = document.createElement('div');
  row.className = `mini-row ${isAI ? 'ai' : 'user'}`;
  row.innerHTML = `
    <div class="mini-av ${isAI ? 'ai' : 'u'}">${isAI ? '✦' : (initials || '👤')}</div>
    <div class="mini-bubble">${isAI ? formatText(content) : escHtml(content)}</div>
  `;
  msgs.appendChild(row);
  // Scroll
  const panel = document.getElementById('panel-chat');
  panel.scrollTop = panel.scrollHeight;

  conversationHistory.push({ role, content });
}

function showMiniTyping() {
  const msgs = document.getElementById('miniMessages');
  const el = document.createElement('div');
  el.className = 'mini-row ai'; el.id = 'miniTyping';
  el.innerHTML = `<div class="mini-av ai">✦</div><div class="mini-bubble"><div class="mini-dots"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(el);
  document.getElementById('panel-chat').scrollTop = msgs.scrollHeight;
  setOrbState('thinking');
}
function removeMiniTyping() { document.getElementById('miniTyping')?.remove(); }

async function sendMiniMessage() {
  const input = document.getElementById('miniInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = ''; miniResize(input);

  addMiniMessage('user', text);
  document.getElementById('miniSend').disabled = true;
  showMiniTyping();

  const apiKey = getApiKey();
  if (!apiKey) {
    removeMiniTyping();
    setOrbState('idle');
    const msg = `I need an API key to respond! Go to **Settings** tab and paste your Anthropic API key to activate me fully. 🔑`;
    addMiniMessage('assistant', msg);
    if (ttsEnabled) speak(msg.replace(/\*\*/g,''));
    document.getElementById('miniSend').disabled = false;
    return;
  }

  // Build API messages
  const apiMsgs = conversationHistory.slice(-12).map(m => ({ role: m.role, content: m.content }));

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: `You are Isabel, a warm and witty AI virtual assistant with a glowing orb avatar. You're on your Virtual Avatar page — keep responses SHORT (2-4 sentences max), conversational, and engaging. Show personality. ${user ? `The user's name is ${user.firstName}.` : ''}`,
        messages: apiMsgs
      })
    });

    removeMiniTyping();
    if (res.ok) {
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I couldn't respond right now, sorry!";
      addMiniMessage('assistant', reply);
      if (ttsEnabled) speak(reply);
    } else {
      const err = await res.json().catch(() => ({}));
      const msg = res.status === 401
        ? 'Invalid API key. Please check in Settings.'
        : `Error ${res.status}: ${err.error?.message || 'Please try again.'}`;
      addMiniMessage('assistant', `⚠️ ${msg}`);
    }
  } catch {
    removeMiniTyping();
    addMiniMessage('assistant', '⚠️ Network error. Make sure you\'re on HTTPS or localhost.');
  }

  setOrbState('idle');
  document.getElementById('miniSend').disabled = false;
}

function handleMiniKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMiniMessage(); }
}
function miniResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 80) + 'px'; }

function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function formatText(t) {
  return t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\n/g,'<br>');
}

// ── Greet user ─────────────────────────────────────────────────────────────
function greetUser() {
  const greetings = [
    `Hey${user ? ', ' + user.firstName : ''}! I'm Isabel, your AI assistant. How can I help you today?`,
    `Hello! I'm Isabel. I'm here and ready to chat, answer questions, or just have a conversation!`,
    `Hi there${user ? ', ' + user.firstName : ''}! What would you like to explore today? I'm all ears!`,
    `Greetings! I'm Isabel AI. Ask me anything — I love a good challenge!`,
  ];
  const msg = greetings[Math.floor(Math.random() * greetings.length)];
  addMiniMessage('assistant', msg);
  if (ttsEnabled) speak(msg);
  else {
    setOrbState('talking');
    setTimeout(() => setOrbState('idle'), 2000);
  }
}

// ── Init ───────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  setOrbState('idle');
  // Auto greet if setting on
  setTimeout(() => {
    if (document.getElementById('tglGreet').classList.contains('on')) {
      if (ttsEnabled) greetUser();
    }
  }, 1000);
});