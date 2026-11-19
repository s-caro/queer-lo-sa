/* =========================================================
   QUEER LO SA? — Trivia Night
   ========================================================= */

// ---------------- IMPOSTAZIONI ----------------
const CONFIG = {
  QUESTION_TIMER_SECONDS: 15,
  ROUNDS: 3,                // numero di set (tra un set e l'altro c'è la pausa)
  QUESTIONS_PER_ROUND: 10,  // domande per set
  BREAK_SECONDS: 10 * 60,
  // calcolati automaticamente da ROUNDS e QUESTIONS_PER_ROUND:
  TRIVIA_NIGHT_QUESTION_LIMIT: 30,
  BREAK_MILESTONES: [10, 20],
  SPIN_DURATION_MS: 5200,
  MUSIC_CATEGORY: 'Musica',
  // categorie a posizione fissa: una domanda ogni N (0 = posizione libera).
  // L'ordine conta: se due capitano sulla stessa posizione, vince la prima
  // e l'altra si sposta sul posto libero più vicino.
  FIXED: {
    'Coatta vegana': 3,
    'Chi vuol essere vegano?': 5,
    'Musica': 7,
  },
  MUSIC_DEFAULT_SECONDS: 8,
  MUSIC_REVEAL_SECONDS: 12,   // quanto suona la canzone dopo la risposta
};

const categoryMeta = {
  "Letteratura":   { color: "#2ecc71", icon: "📚" },
  "Cultura":       { color: "#ff66b2", icon: "🎨" },
  "Serie tv":      { color: "#3498db", icon: "🎬" },
  "Film":          { color: "#f1c40f", icon: "🎥" },
  "Geografia":     { color: "#e67e22", icon: "🌍" },
  "Sex toys":      { color: "#9b59b6", icon: "😽" },
  "Mate-lesbica":  { color: "#e74c3c", icon: "📊" },
  "Spettacolo":    { color: "#1abc9c", icon: "🎤" },
  "Lesbo Drama":   { color: "#e03a56", icon: "🎭" },
  "Stereotipi":    { color: "#34495e", icon: "💭" },
  "Coatta vegana": { color: "#5aa832", icon: "🌱" },
  "Chi vuol essere vegano?": { color: "#1f7a4d", icon: "🥑" },
  "Musica":        { color: "#6c5ce7", icon: "🎵" },
};
const FALLBACK_COLORS = ["#ff66b2", "#3498db", "#2ecc71", "#f1c40f", "#e67e22", "#e74c3c"];

// ---------------- STATO ----------------
let quizData = {};          // categoria -> { color, icon, q: [...] }
let wheelSlices = [];
let sessionQuestions = [];  // [{category, question}]
let askedQuestions = [];
let questionsAsked = 0;
let totalQuestions = 0;
let currentItem = null;     // {category, question}
let phase = 'wheel';        // wheel | spinning | q-intro | q-answer | q-revealed | break
let busy = false;
let rotation = 0;
let timerInterval = null;
let breakTimerInterval = null;
let answersDownloadTriggered = false;
const shownBreakMilestones = new Set();

const $ = id => document.getElementById(id);
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const metaFor = cat => quizData[cat] || categoryMeta[cat] || { color: "#f1c40f", icon: "❓" };
const isMusic = item => item && item.category === CONFIG.MUSIC_CATEGORY;
const hasSolution = item => item && !item.question.nessunaSoluzione && !!item.question.a;

/* =========================================================
   SUONI (sintetizzati, nessun file necessario)
   ========================================================= */
const Sfx = (() => {
  let ctx = null, muted = false;
  const ac = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; };
  function tone(freq, dur, type = 'sine', vol = .2, when = 0, slideTo = null) {
    if (muted) return;
    const c = ac(), t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, vol = .15, from = 400, to = 4000) {
    if (muted) return;
    const c = ac(), t = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur * .6);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * .4); g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(f).connect(g).connect(c.destination); src.start(t);
  }
  return {
    unlock: () => { try { ac(); } catch (e) {} },
    tick: () => tone(1900, .035, 'square', .05),
    whoosh: () => noise(.7, .18, 300, 3000),
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .35, 'triangle', .16, i * .09)),
    ding: () => { tone(880, .5, 'sine', .22); tone(1320, .7, 'sine', .16, .12); tone(1760, .9, 'sine', .1, .24); },
    beep: () => tone(880, .12, 'square', .07),
    buzzer: () => { tone(160, .5, 'sawtooth', .12); tone(120, .6, 'sawtooth', .1, .05); },
    pop: () => tone(600, .12, 'sine', .12, 0, 1200),
    toggle: () => (muted = !muted),
    get muted() { return muted; },
  };
})();

/* =========================================================
   EFFETTI (scintille di sfondo + coriandoli)
   ========================================================= */
const Fx = (() => {
  const cv = $('fx-canvas'), ctx = cv.getContext('2d');
  const COLORS = ['#D52D00', '#FF9A56', '#FFFFFF', '#D362A4', '#A30262', '#f1c40f', '#2ecc71', '#3498db'];
  let W, H, dpr, parts = [], sparkles = [];
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
  }
  resize(); addEventListener('resize', resize);
  for (let i = 0; i < 28; i++) sparkles.push({ x: Math.random(), y: Math.random(), r: Math.random() * 2 + 1, s: Math.random() * .0004 + .0001, p: Math.random() * 6.28 });

  function burst(x, y, n = 120, spread = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (Math.random() * 9 + 4) * spread;
      parts.push({
        x: x * dpr, y: y * dpr, vx: Math.cos(a) * v * dpr, vy: (Math.sin(a) * v - 6) * dpr,
        w: (Math.random() * 8 + 6) * dpr, h: (Math.random() * 5 + 4) * dpr,
        rot: Math.random() * 6, vr: (Math.random() - .5) * .4,
        c: COLORS[(Math.random() * COLORS.length) | 0], life: 1, heart: Math.random() < .18,
      });
    }
  }
  function rain(n = 160) {
    for (let i = 0; i < n; i++) parts.push({
      x: Math.random() * W, y: -Math.random() * H * .5, vx: (Math.random() - .5) * 2 * dpr, vy: (Math.random() * 3 + 2) * dpr,
      w: (Math.random() * 8 + 6) * dpr, h: (Math.random() * 5 + 4) * dpr, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
      c: COLORS[(Math.random() * COLORS.length) | 0], life: 1.6, heart: Math.random() < .2,
    });
  }
  function heart(x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y + s * .3);
    ctx.bezierCurveTo(x, y, x - s * .5, y, x - s * .5, y + s * .3);
    ctx.bezierCurveTo(x - s * .5, y + s * .6, x, y + s * .8, x, y + s);
    ctx.bezierCurveTo(x, y + s * .8, x + s * .5, y + s * .6, x + s * .5, y + s * .3);
    ctx.bezierCurveTo(x + s * .5, y, x, y, x, y + s * .3); ctx.fill();
  }
  function loop(t) {
    ctx.clearRect(0, 0, W, H);
    // scintille leggere
    for (const s of sparkles) {
      s.y -= s.s; if (s.y < -0.02) { s.y = 1.02; s.x = Math.random(); }
      const a = .25 + .25 * Math.sin(t * .002 + s.p);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r * dpr, 0, 6.28); ctx.fill();
    }
    // coriandoli
    parts = parts.filter(p => p.life > 0 && p.y < H + 40);
    for (const p of parts) {
      p.vy += .25 * dpr; p.vx *= .985; p.vy *= .985;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .006;
      ctx.save(); ctx.globalAlpha = Math.min(1, p.life * 1.5); ctx.fillStyle = p.c;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (p.heart) heart(0, -p.w / 2, p.w * 1.3);
      else { ctx.scale(1, Math.cos(p.rot * 2)); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      ctx.restore();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return { burst, rain };
})();

/* =========================================================
   MUSICA — anteprime da iTunes (30 s) o file locali
   ========================================================= */
const Music = (() => {
  const cache = new Map();   // song -> Promise<{url, artwork}>
  let audio = null, stopTimer = null, progRaf = null;
  let cbCount = 0;

  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  function jsonp(url, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const name = `__itunes_cb_${Date.now()}_${cbCount++}`;
      const script = document.createElement('script');
      const timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, timeout);
      function cleanup() { clearTimeout(timer); delete window[name]; script.remove(); }
      window[name] = data => { cleanup(); resolve(data); };
      script.onerror = () => { cleanup(); reject(new Error('network')); };
      script.src = `${url}&callback=${name}`;
      document.head.appendChild(script);
    });
  }

  async function searchItunes(song, country) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(song.cerca || `${song.artista} ${song.titolo}`)}&media=music&entity=song&limit=15&country=${country}`;
    const data = await jsonp(url);
    const results = (data.results || []).filter(r => r.previewUrl);
    if (!results.length) return null;
    const t = norm(song.titolo), a = norm(song.artista).split(' ')[0];
    const best = results.find(r => norm(r.trackName).startsWith(t) && norm(r.artistName).includes(a))
              || results.find(r => norm(r.trackName).includes(t))
              || results[0];
    return { url: best.previewUrl, artwork: (best.artworkUrl100 || '').replace('100x100bb', '600x600bb') };
  }

  const resolved = new Map(); // song -> {url, artwork} già trovato (accesso immediato)

  // link già salvati in data/musica.js: disponibili subito, senza cercare su iTunes
  function saved(song) {
    if (song.audio) return { url: song.audio, artwork: song.copertina || '' };
    if (song.anteprima && !song._anteprimaRotta) return { url: song.anteprima, artwork: song.copertina || '' };
    return null;
  }
  function forget(song) {               // il link salvato non funziona più: si cerca dal vivo
    song._anteprimaRotta = true;
    resolved.delete(song); cache.delete(song);
  }

  function lookup(song) {
    const sv = saved(song);
    if (sv) { resolved.set(song, sv); return Promise.resolve(sv); }
    if (resolved.has(song)) return Promise.resolve(resolved.get(song));
    if (cache.has(song)) return cache.get(song);
    const p = (async () => {
      return (await searchItunes(song, 'IT').catch(() => null)) || (await searchItunes(song, 'US'));
    })().then(info => { if (!info) throw new Error('not found'); resolved.set(song, info); return info; });
    p.catch(() => cache.delete(song));
    cache.set(song, p);
    return p;
  }
  const known = song => saved(song) || resolved.get(song) || null;

  // Un unico lettore audio, riusato per tutte le canzoni: sui telefoni (iPhone in
  // particolare) un lettore "sbloccato" da un tocco può poi suonare altre canzoni.
  const player = new Audio();
  player.preload = 'auto';
  player.setAttribute('playsinline', '');
  let token = 0, unlocked = false;
  const SILENT = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAA';

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    if (!player.getAttribute('src')) {
      player.src = SILENT;
      const p = player.play(); if (p && p.catch) p.catch(() => {});
    }
  }

  function fadeTo(target, ms, then) {
    clearInterval(player._fade);
    const start = player.volume, t0 = performance.now();
    player._fade = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      try { player.volume = Math.max(0, Math.min(1, start + (target - start) * k)); } catch (e) {}
      if (k >= 1) { clearInterval(player._fade); then && then(); }
    }, 30);
  }

  function stop(fadeMs = 400) {
    clearTimeout(stopTimer); cancelAnimationFrame(progRaf);
    if (!audio) return;
    audio = null;
    const my = ++token;
    fadeTo(0, fadeMs, () => { if (my === token) player.pause(); });
  }

  // suona [start, start+seconds] dell'url. DA CHIAMARE SUBITO NEL TOCCO/CLIC.
  function play(url, start, seconds, { onEnd, onProgress, onError } = {}) {
    clearTimeout(stopTimer); cancelAnimationFrame(progRaf); clearInterval(player._fade);
    const my = ++token;
    audio = url;
    if (player.getAttribute('src') !== url) player.src = url;
    player.muted = start > 0;          // niente "pezzetto" dall'inizio prima del salto
    try { player.volume = 1; } catch (e) {}
    const pr = player.play();          // subito, dentro il gesto dell'utente
    if (pr && pr.catch) pr.catch(err => {
      if (my !== token || (err && err.name === 'AbortError')) return;
      console.warn('play()', err);
      audio = null;
      onError && onError(err);
    });

    let started = false;
    const onMediaError = () => {
      if (my !== token) return;
      audio = null;
      const code = player.error ? player.error.code : '?';
      onError && onError(Object.assign(new Error('media'), { name: 'MediaError' + code, media: true }));
    };
    player.addEventListener('error', onMediaError, { once: true });
    const run = () => {
      if (my !== token || started) return;
      started = true;
      if (start > 0) {
        try { player.currentTime = start; } catch (e) {}
        player.addEventListener('seeked', () => { if (my === token) player.muted = false; }, { once: true });
        setTimeout(() => { if (my === token) player.muted = false; }, 700);
      } else if (player.currentTime > 0.5) {
        try { player.currentTime = 0; } catch (e) {}
      }
      const t0 = performance.now();
      const step = () => {
        if (my !== token) return;
        const k = Math.min(1, (performance.now() - t0) / (seconds * 1000));
        onProgress && onProgress(k);
        if (k < 1) progRaf = requestAnimationFrame(step);
      };
      progRaf = requestAnimationFrame(step);
      stopTimer = setTimeout(() => {
        if (my !== token) return;
        fadeTo(0, 600, () => { if (my !== token) return; player.pause(); audio = null; onEnd && onEnd(); });
      }, Math.max(0, seconds * 1000 - 600));
    };
    if (player.readyState >= 1) run();
    else {
      player.addEventListener('loadedmetadata', run, { once: true });
      // rete lenta: se dopo 12 s non è partito niente, segnalo il problema
      setTimeout(() => { if (my === token && !started) { audio = null; player.pause(); onError && onError(new Error('timeout')); } }, 12000);
    }
  }

  return { lookup, known, forget, play, stop, unlock, get playing() { return !!audio; }, get el() { return player; } };
})();

/* =========================================================
   DATI E SESSIONE
   ========================================================= */
function normalizeQuizData(rawData) {
  return Object.fromEntries(Object.entries(rawData).map(([category, questions], index) => {
    const meta = categoryMeta[category] || { color: FALLBACK_COLORS[index % FALLBACK_COLORS.length], icon: "❓" };
    return [category, { color: meta.color, icon: meta.icon, q: questions }];
  }));
}

function buildTriviaNightSubset(rawData) {
  const N = CONFIG.TRIVIA_NIGHT_QUESTION_LIMIT;
  const fixed = Object.entries(CONFIG.FIXED).filter(([, n]) => n > 0);
  const pools = Object.fromEntries(Object.entries(rawData)
    .filter(([, qs]) => Array.isArray(qs) && qs.length > 0)
    .map(([c, qs]) => [c, shuffle(qs)]));
  const total = Object.values(pools).reduce((s, q) => s + q.length, 0);
  const target = Math.min(N, total);
  const slots = new Array(target).fill(null);

  // 1) posizioni fisse: es. Coatta vegana ogni 3, Chi vuol essere vegano? ogni 5, Musica ogni 7
  const nearestFree = pos => {
    for (let d = 0; d < target; d++) {
      if (pos + d < target && !slots[pos + d]) return pos + d;
      if (pos - d >= 0 && !slots[pos - d]) return pos - d;
    }
    return -1;
  };
  for (const [cat, every] of fixed) {
    if (!pools[cat]) continue;
    for (let i = every - 1; i < target && pools[cat].length; i += every) {
      const p = nearestFree(i);
      if (p >= 0) slots[p] = { category: cat, question: pools[cat].pop() };
    }
  }

  // 2) le altre domande: equilibrate tra le categorie (a giri)
  const fixedCats = fixed.map(([c]) => c);
  const others = Object.keys(pools).filter(c => !fixedCats.includes(c));
  const free = slots.reduce((n, s) => n + (s ? 0 : 1), 0);
  const picks = [];
  while (picks.length < free) {
    const order = shuffle(others).filter(c => pools[c].length);
    if (!order.length) break;
    for (const c of order) { if (picks.length >= free) break; picks.push({ category: c, question: pools[c].pop() }); }
  }

  // 3) le divido tra i set (separati dalle pause), senza ripetere la categoria nello stesso set
  const bounds = [0, ...CONFIG.BREAK_MILESTONES.filter(m => m < target), target];
  const sets = bounds.slice(0, -1).map((start, k) => {
    const idx = [];
    for (let i = start; i < bounds[k + 1]; i++) if (!slots[i]) idx.push(i);
    return { idx, items: [] };
  });
  // prima le categorie con più domande, così le loro copie finiscono in set diversi
  const groups = Object.values(picks.reduce((g, p) => ((g[p.category] = g[p.category] || []).push(p), g), {}));
  shuffle(groups).sort((a, b) => b.length - a.length).forEach(group => {
    for (const p of group) {
      const open = sets.filter(st => st.items.length < st.idx.length);
      if (!open.length) break;
      const fresh = open.filter(st => !st.items.some(x => x.category === p.category));
      const pool = fresh.length ? fresh : open;
      const best = Math.max(...pool.map(st => st.idx.length - st.items.length));
      const choices = pool.filter(st => st.idx.length - st.items.length === best);
      choices[Math.floor(Math.random() * choices.length)].items.push(p);
    }
  });

  // 4) dentro ogni set, ordine casuale evitando due categorie uguali di fila
  for (const st of sets) {
    let best = null;
    for (let tries = 0; tries < 60; tries++) {
      const order = shuffle(st.items);
      st.idx.forEach((pos, k) => (slots[pos] = order[k]));
      const ok = slots.every((s, i) => !s || !slots[i + 1] || s.category !== slots[i + 1].category);
      if (ok) { best = order; break; }
    }
  }
  // se mancano domande vegane, riempio i buchi
  const leftovers = Object.values(pools).flat();
  return slots.map(s => s || (leftovers.length ? { category: '?', question: leftovers.pop() } : null)).filter(Boolean);
}

function initializeQuiz(rawData) {
  quizData = normalizeQuizData(rawData);
  wheelSlices = Object.keys(quizData);
  sessionQuestions = buildTriviaNightSubset(rawData);
  totalQuestions = sessionQuestions.length;
  questionsAsked = 0;
  shownBreakMilestones.clear();
  askedQuestions = sessionQuestions.map(item => ({
    category: item.category,
    question: item.question.q,
    answer: hasSolution(item)
      ? item.question.a + (isMusic(item) ? `  (${item.question.titolo} — ${item.question.artista})` : '')
      : '(la dà Coatta Vegana) — opzioni: ' + item.question.o.join(' / '),
  }));
  console.log('Domande della serata:', sessionQuestions);

  buildWheelLights();
  drawWheel();
  updateQuestionCounter(false);

  // pre-carica le anteprime musicali della serata
  sessionQuestions.filter(isMusic).forEach(item => Music.lookup(item.question).catch(() => {}));
}

/* =========================================================
   RUOTA
   ========================================================= */
function buildWheelLights() {
  const box = $('wheel-lights'); box.innerHTML = '';
  const N = 24;
  for (let i = 0; i < N; i++) {
    const s = document.createElement('span');
    const a = (i / N) * Math.PI * 2;
    s.style.left = `${50 + Math.cos(a) * 50}%`;
    s.style.top = `${50 + Math.sin(a) * 50}%`;
    s.style.animationDelay = `${(i % 2) * .175}s`;
    box.appendChild(s);
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function drawWheel() {
  const canvas = $('wheel-canvas'), ctx = canvas.getContext('2d');
  const S = canvas.width, R = S / 2;
  ctx.clearRect(0, 0, S, S);
  if (!wheelSlices.length) return;
  const slice = (2 * Math.PI) / wheelSlices.length;

  wheelSlices.forEach((cat, i) => {
    const { color, icon } = metaFor(cat);
    ctx.save();
    ctx.translate(R, R);
    ctx.rotate(i * slice);
    const grad = ctx.createRadialGradient(0, 0, R * .15, 0, 0, R);
    grad.addColorStop(0, shade(color, 60)); grad.addColorStop(.7, color); grad.addColorStop(1, shade(color, -30));
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, 0, slice); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4; ctx.stroke();

    // testo, ridimensionato per stare nello spicchio
    ctx.rotate(slice / 2);
    const label = `${cat.toUpperCase()}`;
    const maxW = R * .62;
    const fit = (txt, start, min) => {
      let sz = start; ctx.font = `700 ${sz}px Fredoka, Arial, sans-serif`;
      while (ctx.measureText(txt).width > maxW && sz > min) { sz -= 1; ctx.font = `700 ${sz}px Fredoka, Arial, sans-serif`; }
      return sz;
    };
    // nomi lunghi: su due righe invece di rimpicciolirli troppo
    let lines = [label];
    if (fit(label, 40, 18) < 30 && label.includes(' ')) {
      const words = label.split(' ');
      let best = null;
      for (let k = 1; k < words.length; k++) {
        const a = words.slice(0, k).join(' '), b = words.slice(k).join(' ');
        const w = Math.max(a.length, b.length);
        if (!best || w < best.w) best = { w, l: [a, b] };
      }
      lines = best.l;
    }
    const size = Math.min(...lines.map(l => fit(l, lines.length > 1 ? 34 : 40, 18)));
    ctx.font = `700 ${size}px Fredoka, Arial, sans-serif`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#fff';
    const lh = size * 1.05;
    lines.forEach((l, k) => ctx.fillText(l, R * .86, (k - (lines.length - 1) / 2) * lh));
    ctx.font = `${46}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(icon, R * .935, 0);
    ctx.restore();
  });
}

function spinWheel() {
  if (busy || phase !== 'wheel' || allQuestionsUsed()) return;
  phase = 'spinning'; busy = true;

  const next = sessionQuestions[questionsAsked];
  const idxs = wheelSlices.map((c, i) => c === next.category ? i : -1).filter(i => i >= 0);
  const targetIndex = idxs[Math.floor(Math.random() * idxs.length)];
  const sliceDeg = 360 / wheelSlices.length;
  // piccola variazione dentro lo spicchio per non fermarsi sempre al centro
  const jitter = (Math.random() - .5) * sliceDeg * .6;
  const targetCenter = targetIndex * sliceDeg + sliceDeg / 2 + jitter;
  const targetOffset = ((270 - targetCenter) % 360 + 360) % 360;

  const start = rotation;
  const current = ((rotation % 360) + 360) % 360;
  const needed = ((targetOffset - current) % 360 + 360) % 360;
  const end = rotation + 360 * (5 + Math.floor(Math.random() * 3)) + needed;

  const wrap = $('wheel-wrap'), canvas = $('wheel-canvas'), pointer = $('pointer');
  wrap.classList.add('spinning');
  document.documentElement.style.setProperty('--cat', metaFor(next.category).color);

  // prepara in anticipo l'audio se la prossima è musicale
  if (isMusic(next)) prepareMusic(next);

  const t0 = performance.now(), D = CONFIG.SPIN_DURATION_MS;
  let lastSlice = null;
  const ease = t => 1 - Math.pow(1 - t, 4);
  function frame(now) {
    const t = Math.min(1, (now - t0) / D);
    rotation = start + (end - start) * ease(t);
    canvas.style.transform = `rotate(${rotation}deg)`;
    const local = ((270 - rotation) % 360 + 360) % 360;
    const s = Math.floor(local / sliceDeg);
    if (lastSlice !== null && s !== lastSlice) {
      Sfx.tick();
      pointer.classList.remove('tick'); void pointer.offsetWidth; pointer.classList.add('tick');
    }
    lastSlice = s;
    if (t < 1) requestAnimationFrame(frame);
    else onWheelLanded(next);
  }
  requestAnimationFrame(frame);
}

function onWheelLanded(item) {
  const wrap = $('wheel-wrap');
  wrap.classList.remove('spinning'); wrap.classList.add('landed');
  const meta = metaFor(item.category);

  setTimeout(() => {
    // rivelazione categoria
    $('cat-reveal-icon').textContent = meta.icon;
    $('cat-reveal-name').textContent = item.category.toUpperCase();
    const cr = $('cat-reveal');
    cr.classList.remove('show'); void cr.offsetWidth; cr.classList.add('show');
    Sfx.fanfare();
    setTimeout(() => Fx.burst(innerWidth / 2, innerHeight / 2, 90, 1.1), 350);

    setTimeout(() => {
      transitionTo('screen-question', () => {
        wrap.classList.remove('landed');
        cr.classList.remove('show');
        presentQuestion(questionsAsked);
      });
    }, 1150);
  }, 900);
}

function allQuestionsUsed() { return questionsAsked >= totalQuestions; }

function updateWheelFinishState() {
  const done = allQuestionsUsed();
  $('wheel-finish-message').classList.toggle('visible', done);
  $('screen-wheel').classList.toggle('wheel-finished', done);
  if (done) setTimeout(() => Fx.rain(220), 900);
}

/* =========================================================
   TRANSIZIONI
   ========================================================= */
function transitionTo(targetId, midway, done) {
  busy = true;
  const wipe = $('wipe');
  wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go');
  Sfx.whoosh();
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => {
      s.style.transition = 'none';
      s.classList.toggle('active', s.id === targetId);
    });
    midway && midway();
    void document.body.offsetWidth;
    document.querySelectorAll('.screen').forEach(s => (s.style.transition = ''));
  }, 490);
  setTimeout(() => { wipe.classList.remove('go'); busy = false; done && done(); }, 1060);
}

/* =========================================================
   DOMANDA
   ========================================================= */
function presentQuestion(index) {
  const item = sessionQuestions[index];
  currentItem = item;
  questionsAsked = index + 1;
  const meta = metaFor(item.category);
  document.documentElement.style.setProperty('--cat', meta.color);

  const screen = $('screen-question');
  screen.classList.toggle('is-music', isMusic(item));

  // categoria (riavvia l'animazione)
  const pill = $('category-title');
  pill.textContent = `${meta.icon} ${item.category.toUpperCase()}`;
  pill.style.animation = 'none'; void pill.offsetWidth; pill.style.animation = '';

  // testo parola per parola
  const qt = $('question-text');
  qt.innerHTML = '';
  item.question.q.split(/\s+/).forEach((w, i) => {
    const span = document.createElement('span');
    span.className = 'w'; span.textContent = w;
    span.style.animationDelay = `${.45 + i * .055}s`;
    qt.appendChild(span); qt.appendChild(document.createTextNode(' '));
  });

  $('options-container').innerHTML = '';
  $('host-answer').classList.remove('show');
  resetTimerDisplay();
  updateQuestionCounter(true);

  if (isMusic(item)) resetMusicStage(item);
  phase = 'q-intro';
}

function showOptions() {
  const container = $('options-container');
  container.innerHTML = '';
  currentItem.question.o.forEach((opt, i) => {
    const div = document.createElement('div');
    div.className = 'option';
    div.textContent = opt;
    div.style.animationDelay = `${i * .12}s`;
    container.appendChild(div);
    setTimeout(() => Sfx.pop(), i * 120);
  });
  phase = 'q-answer';

  if (isMusic(currentItem)) playMusicQuestion();
  else startTimer();
}

function revealAnswer() {
  if (phase !== 'q-answer') return;
  clearInterval(timerInterval);
  $('timer-container').classList.remove('hurry');
  if (!hasSolution(currentItem)) {
    // nessuna risposta evidenziata: la soluzione la dà Coatta Vegana a voce
    const hb = $('host-answer');
    hb.classList.remove('show'); void hb.offsetWidth; hb.classList.add('show');
    Sfx.fanfare();
    phase = 'q-revealed';
    return;
  }
  let correctEl = null;
  document.querySelectorAll('.option').forEach(o => {
    if (o.textContent === currentItem.question.a) { o.classList.add('correct'); correctEl = o; }
    else o.classList.add('dimmed');
  });
  Sfx.ding();
  if (correctEl) {
    const r = correctEl.getBoundingClientRect();
    setTimeout(() => Fx.burst(r.left + r.width / 2, r.top + r.height / 2, 110, .9), 150);
  }
  if (isMusic(currentItem)) revealMusic();
  phase = 'q-revealed';
}

function backToWheelOrBreak() {
  Music.stop(700);
  clearInterval(timerInterval);

  if (allQuestionsUsed() && !answersDownloadTriggered) {
    answersDownloadTriggered = true;
    downloadSessionAnswersFile();
  }
  if (shouldShowBreak()) {
    shownBreakMilestones.add(questionsAsked);
    startBreakScreen();
    return;
  }
  transitionTo('screen-wheel', () => { updateWheelFinishState(); phase = 'wheel'; });
}

function updateQuestionCounter(animate) {
  const c = $('question-counter');
  c.textContent = `${questionsAsked}/${totalQuestions}`;
  if (animate) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
}

/* ---------- TIMER ---------- */
function resetTimerDisplay() {
  clearInterval(timerInterval);
  const tc = $('timer-container');
  tc.classList.remove('hurry', 'timeout'); tc.classList.add('idle');
  $('timer-text').textContent = CONFIG.QUESTION_TIMER_SECONDS;
  const bar = $('timer-bar');
  bar.style.transition = 'none'; bar.style.strokeDashoffset = 282.6;
  document.querySelector('.timer-circle-bg').style.fill = '#2ecc71';
}

function startTimer() {
  clearInterval(timerInterval);
  const T = CONFIG.QUESTION_TIMER_SECONDS;
  let timeLeft = T;
  const tc = $('timer-container'), bar = $('timer-bar'), text = $('timer-text'), bg = document.querySelector('.timer-circle-bg');
  tc.classList.remove('idle', 'hurry', 'timeout');
  text.textContent = timeLeft;
  bar.style.transition = 'none'; bar.style.strokeDashoffset = 282.6; bg.style.fill = '#2ecc71';
  setTimeout(() => (bar.style.transition = 'stroke-dashoffset 1s linear'), 20);

  timerInterval = setInterval(() => {
    timeLeft--;
    text.textContent = timeLeft;
    bar.style.strokeDashoffset = 282.6 - ((T - timeLeft) / T) * 282.6;
    bg.style.fill = `rgb(${Math.round((T - timeLeft) / T * 255)}, ${Math.round(timeLeft / T * 205)}, 60)`;
    if (timeLeft <= 5 && timeLeft > 0) { tc.classList.add('hurry'); Sfx.beep(); }
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      text.textContent = '0';
      tc.classList.remove('hurry'); void tc.offsetWidth; tc.classList.add('timeout');
      Sfx.buzzer();
    }
  }, 1000);
}

/* ---------- MUSICA nella domanda ---------- */
function prepareMusic(item) {
  const p = Music.lookup(item.question);
  p.catch(err => console.warn('Audio non disponibile:', err));
  return p;
}
// chiama fn(info) SUBITO se la canzone è già stata trovata (così il telefono
// considera la riproduzione parte del tocco), altrimenti appena è pronta
function withSong(item, fn, fail) {
  const info = Music.known(item.question);
  if (info) return fn(info, true);
  prepareMusic(item).then(info => fn(info, false)).catch(err => fail && fail(err));
}

function buildEq() {
  const eq = $('eq'); eq.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.style.setProperty('--h', `${40 + Math.random() * 60}%`);
    s.style.animationDuration = `${.3 + Math.random() * .4}s`;
    s.style.animationDelay = `${-Math.random()}s`;
    eq.appendChild(s);
  }
}

function setMusicPlaying(on) {
  $('vinyl').classList.toggle('playing', on);
  $('eq').classList.toggle('playing', on);
}

function resetMusicStage(item) {
  buildEq();
  setMusicPlaying(false);
  $('vinyl-label').innerHTML = '<span>♪</span>';
  $('snippet-progress').style.width = '0';
  $('song-reveal').textContent = ''; $('song-reveal').classList.remove('show');
  $('music-status').textContent = '🎧 Tocca per ascoltare';
  prepareMusic(item);
}

function playMusicQuestion(isReplay = false) {
  const item = currentItem, song = item.question;
  const seconds = song.durata || CONFIG.MUSIC_DEFAULT_SECONDS;
  let timerStarted = isReplay;
  const startTimerOnce = () => { if (!timerStarted && phase === 'q-answer') { timerStarted = true; startTimer(); } };

  $('music-status').textContent = '⏳ Carico la canzone…';
  withSong(item, (info, immediate) => {
    if (currentItem !== item || phase === 'q-revealed') return;
    $('music-status').textContent = '🎶 In ascolto…';
    setMusicPlaying(true);
    Music.play(info.url, song.inizio || 0, seconds, {
      onProgress: k => ($('snippet-progress').style.width = `${k * 100}%`),
      onEnd: () => {
        setMusicPlaying(false);
        if (phase === 'q-answer') $('music-status').textContent = 'Tempo di rispondere! (tocca il disco per riascoltare)';
        startTimerOnce();
      },
      onError: err => {
        setMusicPlaying(false);
        if (err && err.media && !song.audio) { Music.forget(song); prepareMusic(item); }
        if (phase === 'q-answer') $('music-status').textContent = `👆 Tocca il disco per far partire la canzone (${err && err.name || 'errore'})`;
      },
    });
  }, err => {
    $('music-status').textContent = `⚠️ Canzone non trovata (${err && err.message || 'rete'}). Tocca il disco per riprovare`;
    showToast('Anteprima audio non trovata per questa canzone');
    startTimerOnce();
  });
}

function revealMusic() {
  const song = currentItem.question;
  const sr = $('song-reveal');
  sr.innerHTML = `${escapeHtml(song.titolo)}<small>${escapeHtml(song.artista)}</small>`;
  sr.classList.remove('show'); void sr.offsetWidth; sr.classList.add('show');
  $('music-status').textContent = '';
  withSong(currentItem, info => {
    if (info.artwork) $('vinyl-label').innerHTML = `<img src="${info.artwork}" alt="">`;
    setMusicPlaying(true);
    Music.play(info.url, song.inizio || 0, CONFIG.MUSIC_REVEAL_SECONDS, {
      onProgress: k => ($('snippet-progress').style.width = `${k * 100}%`),
      onEnd: () => setMusicPlaying(false),
      onError: () => setMusicPlaying(false),
    });
  });
}

function replayMusic() {
  if (!isMusic(currentItem) || phase !== 'q-answer') return;
  playMusicQuestion(true);
}

/* =========================================================
   PAUSA
   ========================================================= */
function shouldShowBreak() {
  return CONFIG.BREAK_MILESTONES.includes(questionsAsked) && !shownBreakMilestones.has(questionsAsked);
}
const formatBreakTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function buildHearts() {
  const box = $('floating-hearts'); box.innerHTML = '';
  const icons = ['💖', '🧡', '🤍', '💗', '💜', '✨', '🌈'];
  for (let i = 0; i < 22; i++) {
    const s = document.createElement('span');
    s.textContent = icons[i % icons.length];
    s.style.left = `${Math.random() * 100}%`;
    s.style.fontSize = `${1.2 + Math.random() * 2}rem`;
    s.style.animationDuration = `${9 + Math.random() * 10}s`;
    s.style.animationDelay = `${-Math.random() * 18}s`;
    box.appendChild(s);
  }
}

function startBreakScreen() {
  clearInterval(breakTimerInterval);
  let timeLeft = CONFIG.BREAK_SECONDS;
  $('break-timer').textContent = formatBreakTime(timeLeft);
  buildHearts();
  transitionTo('screen-break', () => { phase = 'break'; document.body.classList.add('on-break'); });
  breakTimerInterval = setInterval(() => {
    timeLeft--;
    $('break-timer').textContent = formatBreakTime(Math.max(0, timeLeft));
    if (timeLeft <= 0) endBreak();
  }, 1000);
}

function endBreak() {
  if (phase !== 'break') return;
  clearInterval(breakTimerInterval);
  document.body.classList.remove('on-break');
  transitionTo('screen-wheel', () => { updateWheelFinishState(); phase = 'wheel'; });
}

/* =========================================================
   COMANDI CONDUTTRICE
   ========================================================= */
function goToBreak() {
  if (busy) return;
  clearInterval(timerInterval); Music.stop();
  if (phase === 'break') return;
  shownBreakMilestones.add(questionsAsked);
  startBreakScreen();
}

function jumpToQuestion() {
  if (busy) return;
  openQuestionList();
}

function goToQuestion(num) {
  closeQuestionList();
  clearInterval(timerInterval); clearInterval(breakTimerInterval); Music.stop();
  document.body.classList.remove('on-break');
  const item = sessionQuestions[num - 1];
  if (isMusic(item)) prepareMusic(item);
  transitionTo('screen-question', () => presentQuestion(num - 1));
}

/* ---------- ELENCO DOMANDE (anteprima per la conduttrice) ---------- */
function setOf(i) {
  const ms = CONFIG.BREAK_MILESTONES;
  let k = 0; while (k < ms.length && i >= ms[k]) k++;
  return k;
}

function openQuestionList() {
  const list = $('ql-list'); list.innerHTML = '';
  let lastSet = -1;
  sessionQuestions.forEach((item, i) => {
    const set = setOf(i);
    if (set !== lastSet) {
      const h = document.createElement('h3'); h.className = 'ql-set';
      h.textContent = `Set ${set + 1}`;
      list.appendChild(h); lastSet = set;
    }
    const meta = metaFor(item.category), q = item.question;
    const card = document.createElement('div');
    card.className = 'ql-card' + (i < questionsAsked - 1 ? ' done' : '') + (i === questionsAsked - 1 ? ' current' : '');
    card.style.setProperty('--c', meta.color);
    const opts = q.o.map(o => `<li>${escapeHtml(o)}</li>`).join('');
    const song = isMusic(item) ? `<div class="ql-song"><button class="ql-play" data-i="${i}">▶ Ascolta lo spezzone</button></div>` : '';
    card.innerHTML = `
      <div class="ql-head"><span class="ql-num">${i + 1}</span><span class="ql-cat">${meta.icon} ${escapeHtml(item.category)}</span>
        <button class="ql-go" data-i="${i}">Vai ▸</button></div>
      <div class="ql-q">${escapeHtml(q.q)}</div>${song}<ul class="ql-opts">${opts}</ul>`;
    list.appendChild(card);
  });
  $('question-list').classList.add('show');
  const cur = list.querySelector('.current') || list.querySelector('.ql-card:not(.done)');
  if (cur) cur.scrollIntoView({ block: 'center' });
}

function closeQuestionList() {
  $('question-list').classList.remove('show');
  if (previewAudio) { Music.stop(200); previewAudio = null; }
}

let previewAudio = null;
$('question-list').addEventListener('click', e => {
  e.stopPropagation();
  const go = e.target.closest('.ql-go');
  if (go) return goToQuestion(+go.dataset.i + 1);
  const play = e.target.closest('.ql-play');
  if (play) {
    const item = sessionQuestions[+play.dataset.i], song = item.question;
    play.textContent = '⏳';
    withSong(item, info => {
      previewAudio = true;
      play.textContent = '▶ Ascolta lo spezzone';
      Music.play(info.url, song.inizio || 0, song.durata || CONFIG.MUSIC_DEFAULT_SECONDS, {
        onError: () => (play.textContent = '👆 Tocca di nuovo'),
      });
    }, () => (play.textContent = '⚠️ non trovata'));
    return;
  }
  if (e.target.closest('#ql-close') || e.target.id === 'question-list') closeQuestionList();
});

function toggleMenu(force) {
  document.body.classList.toggle('menu-open', force);
}

function toggleMute() {
  const m = Sfx.toggle();
  $('mute-btn').textContent = m ? '🔇' : '🔊';
  showToast(m ? 'Effetti sonori disattivati' : 'Effetti sonori attivi');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

let toastTimer = null;
function showToast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ---------- risposte ---------- */
function downloadSessionAnswersFile() {
  if (!askedQuestions.length) return;
  const txt = askedQuestions.map((e, i) => `${i + 1}. [${e.category}] ${e.question}\n   Risposta corretta: ${e.answer}`).join('\n\n');
  const url = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'risposte.txt';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* =========================================================
   INPUT
   ========================================================= */
function advance() {
  Sfx.unlock();
  if (busy) return;
  switch (phase) {
    case 'wheel': spinWheel(); break;
    case 'q-intro': showOptions(); break;
    case 'q-answer': revealAnswer(); break;
    case 'q-revealed': backToWheelOrBreak(); break;
  }
}

['pointerdown', 'touchend', 'keydown'].forEach(ev =>
  document.addEventListener(ev, () => { Music.unlock(); Sfx.unlock(); }, { capture: true, passive: true }));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { toggleMenu(false); return; }
  if ($('question-list').classList.contains('show')) { if (e.key === 'Escape') closeQuestionList(); return; }
  if ($('settings').classList.contains('show')) { if (e.key === 'Escape') closeSettings(); if (e.key === 'Enter') saveSettings(); return; }
  if (['Tab', ' ', 'Enter', 'ArrowRight'].includes(e.key)) { e.preventDefault(); advance(); }
  else if (e.key === 'r' || e.key === 'R') replayMusic();
  else if (e.key === 'm' || e.key === 'M') toggleMute();
  else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
});

document.addEventListener('click', e => {
  if (document.body.classList.contains('menu-open') && !e.target.closest('#burger')) {
    toggleMenu(false);
    if (!e.target.closest('#admin-nav')) return; // un clic fuori chiude solo il menu
  }
  if (e.target.closest('button:not(.hub)') || e.target.closest('#admin-nav') || e.target.closest('#question-list') || e.target.closest('#settings')) return;
  if (e.target.closest('#vinyl')) { replayMusic(); return; }
  advance();
});

$('download-answers-btn').addEventListener('click', e => { e.stopPropagation(); downloadSessionAnswersFile(); });

/* =========================================================
   IMPOSTAZIONI (round e domande) — salvate nel browser
   ========================================================= */
const SETTINGS_KEY = 'queerlosa-settings-v2';
const fixedId = cat => 'set-fixed-' + cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
let RAW_DATA = {};

function applySettings(st) {
  CONFIG.ROUNDS = Math.max(1, Math.min(10, st.rounds | 0 || 3));
  CONFIG.QUESTIONS_PER_ROUND = Math.max(1, Math.min(50, st.perRound | 0 || 10));
  if (st.fixed) for (const cat of Object.keys(CONFIG.FIXED))
    if (st.fixed[cat] != null) CONFIG.FIXED[cat] = Math.max(0, Math.min(20, st.fixed[cat] | 0));
  CONFIG.BREAK_SECONDS = Math.max(0, Math.round((st.breakMin ?? CONFIG.BREAK_SECONDS / 60) * 60));
  CONFIG.QUESTION_TIMER_SECONDS = Math.max(5, Math.min(120, st.timer | 0 || CONFIG.QUESTION_TIMER_SECONDS));
  CONFIG.TRIVIA_NIGHT_QUESTION_LIMIT = CONFIG.ROUNDS * CONFIG.QUESTIONS_PER_ROUND;
  CONFIG.BREAK_MILESTONES = Array.from({ length: CONFIG.ROUNDS - 1 }, (_, k) => (k + 1) * CONFIG.QUESTIONS_PER_ROUND);
}
function currentSettings() {
  return { rounds: CONFIG.ROUNDS, perRound: CONFIG.QUESTIONS_PER_ROUND, fixed: { ...CONFIG.FIXED },
           breakMin: CONFIG.BREAK_SECONDS / 60, timer: CONFIG.QUESTION_TIMER_SECONDS };
}
function loadSettings() {
  try { const st = JSON.parse(localStorage.getItem(SETTINGS_KEY)); if (st) applySettings(st); else applySettings(currentSettings()); }
  catch (e) { applySettings(currentSettings()); }
}

function openSettings() {
  if (busy) return;
  const st = currentSettings();
  $('set-rounds').value = st.rounds; $('set-per').value = st.perRound;
  $('set-fixed').innerHTML = Object.entries(st.fixed).map(([cat, n]) =>
    `<label>${metaFor(cat).icon} ${escapeHtml(cat)}: una ogni… <small>(0 = libera)</small><input id="${fixedId(cat)}" type="number" min="0" max="20" value="${n}"></label>`).join('');
  $('set-break').value = st.breakMin; $('set-timer').value = st.timer;
  updateSettingsSummary();
  $('settings').classList.add('show');
}
function closeSettings() { $('settings').classList.remove('show'); }

function readSettingsForm() {
  const fixed = {};
  for (const cat of Object.keys(CONFIG.FIXED)) { const el = $(fixedId(cat)); fixed[cat] = el ? +el.value : CONFIG.FIXED[cat]; }
  return { rounds: +$('set-rounds').value, perRound: +$('set-per').value, fixed,
           breakMin: +$('set-break').value, timer: +$('set-timer').value };
}
function updateSettingsSummary() {
  const st = readSettingsForm();
  const total = (st.rounds | 0) * (st.perRound | 0);
  const available = Object.values(RAW_DATA).reduce((n, q) => n + q.length, 0);
  let txt = `Totale: <b>${total}</b> domande in ${st.rounds | 0} set (${Math.max(0, (st.rounds | 0) - 1)} pause)`;
  const parts = [], warn = [];
  for (const [cat, n] of Object.entries(st.fixed)) {
    if (!(n > 0)) continue;
    const need = Math.floor(total / n), have = (RAW_DATA[cat] || []).length;
    parts.push(`${need} di ${cat}`);
    if (need > have) warn.push(`⚠️ Solo ${have} domande di ${cat} (ne servirebbero ${need}): i posti mancanti useranno altre categorie.`);
  }
  if (parts.length) txt += '<br>' + parts.join(' · ');
  if (total > available) txt += `<br>⚠️ Ci sono solo ${available} domande disponibili: ne userò ${available}.`;
  if (warn.length) txt += '<br>' + warn.join('<br>');
  $('set-summary').innerHTML = txt;
}

function saveSettings() {
  if (questionsAsked > 0 && !confirm('La partita è già iniziata: applicare le impostazioni e ricominciare da capo?')) return;
  const st = readSettingsForm();
  applySettings(st);
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings())); } catch (e) {}
  closeSettings();
  restartGame();
  showToast(`Nuova partita: ${CONFIG.ROUNDS} set × ${CONFIG.QUESTIONS_PER_ROUND} domande`);
}

function restartGame() {
  clearInterval(timerInterval); clearInterval(breakTimerInterval); Music.stop();
  document.body.classList.remove('on-break');
  answersDownloadTriggered = false;
  initializeQuiz(RAW_DATA);
  const toWheel = () => { updateWheelFinishState(); phase = 'wheel'; };
  if ($('screen-wheel').classList.contains('active')) toWheel();
  else transitionTo('screen-wheel', toWheel);
}

$('settings').addEventListener('click', e => {
  e.stopPropagation();
  if (e.target.id === 'settings' || e.target.closest('#set-cancel')) closeSettings();
  else if (e.target.closest('#set-save')) saveSettings();
});
$('settings').addEventListener('input', updateSettingsSummary);

/* =========================================================
   AVVIO
   ========================================================= */
(function start() {
  const raw = Object.assign({}, window.QUIZ_DATA || {});
  if (Array.isArray(window.MUSIC_DATA) && window.MUSIC_DATA.length) raw[CONFIG.MUSIC_CATEGORY] = window.MUSIC_DATA;
  if (!Object.keys(raw).length) { alert('Nessuna domanda trovata: controlla data/domande.js'); return; }
  RAW_DATA = raw;
  loadSettings();
  initializeQuiz(raw);
  // ridisegna quando il font è pronto
  document.fonts && document.fonts.ready.then(drawWheel);
})();
