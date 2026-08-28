/* bias.fm Prototyp — alle Daten sind Platzhalter. */

/* ---------- Bias-Farbe + Theme ---------- */
(function () {
  const root = document.documentElement;
  const KEY = 'biasfm.bias', TKEY = 'biasfm.theme';
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  const saved = get(KEY);
  if (saved) root.style.setProperty('--bias', saved);
  const savedTheme = get(TKEY);
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  document.querySelectorAll('.sw').forEach(function (b) {
    if (saved) b.setAttribute('aria-pressed', String(b.dataset.c === saved));
    b.addEventListener('click', function () {
      root.style.setProperty('--bias', b.dataset.c);
      set(KEY, b.dataset.c);
      document.querySelectorAll('.sw').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });
  });

  const t = document.getElementById('theme-toggle');
  if (t) t.addEventListener('click', function () {
    const dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    const next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    set(TKEY, next);
  });
})();

/* ---------- Kalender (Platzhalter) ---------- */
const CAL = [
  { d: '2026-08-28', items: [
    { act: 'NewJeans', title: 'Titel TBA', type: 'Single', tags: ['Idol'] },
    { act: '검정치마 The Black Skirts', title: 'Titel TBA', type: 'Album', tags: ['Indie'] }
  ]},
  { d: '2026-08-31', items: [
    { act: 'SUMIN & Slom', title: 'Titel TBA', type: 'EP', tags: ['R&B', 'Prod. Slom'] }
  ]},
  { d: '2026-09-02', items: [
    { act: '(여자)아이들 (G)I-DLE', title: 'Titel TBA', type: 'Mini-Album', tags: ['Idol'] },
    { act: 'pH-1', title: 'Titel TBA', type: 'Single', tags: ['Hiphop'] }
  ]},
  { d: '2026-09-07', items: [
    { act: '윤하 YOUNHA', title: 'Titel TBA', type: 'Single', tags: ['Ballade'] }
  ]},
  { d: '2026-09-11', items: [
    { act: 'Crush', title: 'Titel TBA', type: 'Album', tags: ['R&B'] },
    { act: '다이나믹 듀오 Dynamic Duo', title: 'Titel TBA', type: 'Single', tags: ['Hiphop'] }
  ]},
  { d: '2026-09-15', items: [
    { act: 'BIBI', title: 'Titel TBA', type: 'EP', tags: ['Indie', 'Pop'] }
  ]},
  { d: '2026-09-18', items: [
    { act: 'aespa', title: 'Titel TBA', type: 'Mini-Album', tags: ['Idol'] },
    { act: '새소년 SE SO NEON', title: 'Titel TBA', type: 'Single', tags: ['Indie', 'Rock'] }
  ]},
  { d: '2026-09-24', items: [
    { act: '이하이 LEE HI', title: 'Titel TBA', type: 'Single', tags: ['R&B'] }
  ]}
];

const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MO = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

(function renderCal() {
  const el = document.getElementById('cal');
  if (!el) return;
  const today = new Date().toISOString().slice(0, 10);
  el.innerHTML = CAL.map(function (day) {
    const dt = new Date(day.d + 'T12:00:00');
    const isToday = day.d === today;
    const items = day.items.map(function (i) {
      const tags = [`<span class="tag accent">${esc(i.type)}</span>`]
        .concat(i.tags.map(t => `<span class="tag">${esc(t)}</span>`)).join('');
      return `<div class="cal-item">
        <div><span class="act">${esc(i.act)}</span> <span class="ttl">— ${esc(i.title)}</span></div>
        <div class="meta">${tags}</div>
      </div>`;
    }).join('');
    return `<div class="cal-day${isToday ? ' is-today' : ''}">
      <div class="cal-date">${WD[dt.getDay()]}<b>${dt.getDate()}</b>${MO[dt.getMonth()]}</div>
      <div class="cal-items">${items}</div>
    </div>`;
  }).join('');
})();

/* ---------- Charts (Platzhalter) ---------- */
const CHARTS = {
  'Alle': [
    { t: 'Ditto', h: '', a: 'NewJeans', p: 12840, d: 2 },
    { t: '밤양갱', h: 'Bam Yanggaeng', a: 'BIBI', p: 11602, d: -1 },
    { t: 'Your Home', h: '', a: 'SUMIN & Slom', p: 9877, d: 4 },
    { t: 'Antifreeze', h: '', a: '검정치마 The Black Skirts', p: 8410, d: 0 },
    { t: 'TOMBOY', h: '', a: '(여자)아이들 (G)I-DLE', p: 7995, d: -2 },
    { t: '사건의 지평선', h: 'Event Horizon', a: '윤하 YOUNHA', p: 7233, d: 1 },
    { t: 'Rush Hour', h: '', a: 'Crush feat. j-hope', p: 6104, d: null },
    { t: '밤편지', h: 'Through the Night', a: '아이유 IU', p: 5877, d: -3 },
    { t: '죽일 놈', h: 'Guilty', a: '다이나믹 듀오 Dynamic Duo', p: 4990, d: 6 },
    { t: '롤린', h: "Rollin'", a: '브레이브걸스 Brave Girls', p: 4402, d: -1 }
  ],
  'Indie': [
    { t: 'Antifreeze', h: '', a: '검정치마 The Black Skirts', p: 8410, d: 1 },
    { t: '밤양갱', h: 'Bam Yanggaeng', a: 'BIBI', p: 6602, d: 0 },
    { t: '난춘', h: 'Nanchun', a: '새소년 SE SO NEON', p: 5120, d: 3 },
    { t: 'Ordinary Story', h: '', a: '검정치마 The Black Skirts', p: 3880, d: -1 },
    { t: '한강에서', h: 'At the Han River', a: 'HYUKOH', p: 3401, d: null }
  ],
  'Hiphop / R&B': [
    { t: 'Your Home', h: '', a: 'SUMIN & Slom', p: 9877, d: 2 },
    { t: 'Rush Hour', h: '', a: 'Crush feat. j-hope', p: 6104, d: 0 },
    { t: '죽일 놈', h: 'Guilty', a: '다이나믹 듀오 Dynamic Duo', p: 4990, d: 4 },
    { t: 'Nerdy Love', h: '', a: 'pH-1 feat. 백예린', p: 3766, d: -2 },
    { t: '누구 없소', h: 'Nugu Eobso', a: '이하이 LEE HI', p: 3210, d: 1 }
  ],
  'Idol': [
    { t: 'Ditto', h: '', a: 'NewJeans', p: 12840, d: 0 },
    { t: 'TOMBOY', h: '', a: '(여자)아이들 (G)I-DLE', p: 7995, d: 1 },
    { t: '롤린', h: "Rollin'", a: '브레이브걸스 Brave Girls', p: 4402, d: -1 },
    { t: 'Spicy', h: '', a: 'aespa', p: 4188, d: 2 },
    { t: 'Cupid', h: '', a: 'FIFTY FIFTY', p: 3944, d: null }
  ],
  'Produzenten': [
    { t: 'Slom', h: '', a: '84 Credits · produced, arranged', p: 21400, d: 1 },
    { t: 'GRAY', h: '', a: '112 Credits · produced, written', p: 18220, d: 0 },
    { t: '250', h: '', a: '39 Credits · produced', p: 15980, d: 3 },
    { t: 'Cha Cha Malone', h: '', a: '57 Credits · produced', p: 9140, d: -1 },
    { t: 'FRNK', h: '', a: '46 Credits · produced, written', p: 7702, d: null }
  ]
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

(function renderCharts() {
  const tabsEl = document.getElementById('chart-tabs');
  const listEl = document.getElementById('chart');
  if (!tabsEl || !listEl) return;
  const names = Object.keys(CHARTS);

  function draw(name) {
    listEl.innerHTML = CHARTS[name].map(function (r, i) {
      const delta = r.d === null
        ? '<span class="delta new">NEU</span>'
        : r.d === 0 ? '<span class="delta" style="color:var(--fg-dim)">–</span>'
        : r.d > 0 ? `<span class="delta up">▲${r.d}</span>`
        : `<span class="delta down">▼${Math.abs(r.d)}</span>`;
      const han = r.h ? ` <span class="han">${esc(r.h)}</span>` : '';
      return `<a class="chart-row" href="#charts">
        <span class="rank">${i + 1}</span>
        <span><span class="tr-title">${esc(r.t)}${han}</span><br><span class="tr-artist">${esc(r.a)}</span></span>
        <span class="plays">${r.p.toLocaleString('de-DE')}<br>${delta}</span>
      </a>`;
    }).join('');
  }

  tabsEl.innerHTML = names.map((n, i) =>
    `<button class="tab" role="tab" aria-selected="${i === 0}">${esc(n)}</button>`).join('');

  tabsEl.addEventListener('click', function (e) {
    const b = e.target.closest('.tab');
    if (!b) return;
    [...tabsEl.children].forEach(x => x.setAttribute('aria-selected', String(x === b)));
    draw(b.textContent);
  });

  draw(names[0]);
})();

/* ---------- Donut ---------- */
(function donut() {
  const arc = document.getElementById('donut-arc');
  const val = document.getElementById('donut-val');
  if (!arc || !val) return;
  const target = 39, C = 251.3;
  let shown = false;
  const run = function () {
    if (shown) return; shown = true;
    let n = 0;
    const iv = setInterval(function () {
      n += 1;
      if (n >= target) { n = target; clearInterval(iv); }
      arc.style.transition = 'stroke-dashoffset .05s linear';
      arc.setAttribute('stroke-dashoffset', String(C - C * n / 100));
      val.textContent = n + '%';
    }, 18);
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(e => { if (e.isIntersecting) run(); });
    }, { threshold: .4 }).observe(arc.closest('.donut'));
  } else run();
})();

/* ---------- Demo-Formulare ---------- */
(function forms() {
  const wl = document.getElementById('waitlist');
  if (wl) wl.addEventListener('submit', function (e) {
    e.preventDefault();
    const note = document.getElementById('waitlist-note');
    note.textContent = 'Angekommen — im Prototyp. Es gibt noch kein Backend, deine Adresse wird nirgends gespeichert.';
    note.style.color = 'var(--bias)';
    wl.reset();
  });

  const pf = document.getElementById('puz-form');
  if (pf) pf.addEventListener('submit', function (e) {
    e.preventDefault();
    const note = document.getElementById('puz-note');
    note.textContent = 'Demo — im Prototyp gibt es noch keine Auflösung.';
    note.style.color = 'var(--bias)';
    pf.reset();
  });
})();
