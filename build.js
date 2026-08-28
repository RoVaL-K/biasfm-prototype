/* Baut konzept.html aus handover.md. Ausgabe wird eingecheckt,
   damit Cloudflare Pages ohne Build-Step deployen kann. */
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const SRC = path.join(__dirname, 'handover.md');
const OUT = path.join(__dirname, 'konzept.html');

function slug(s) {
  return 's-' + s.replace(/&amp;/g, 'und').replace(/&[a-z#0-9]+;/g, ' ').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const toc = [];
const renderer = new marked.Renderer();
const baseHeading = renderer.heading.bind(renderer);
renderer.heading = function (token) {
  const text = this.parser.parseInline(token.tokens);
  const plain = text.replace(/<[^>]+>/g, '');
  const id = slug(plain);
  if (token.depth === 2) toc.push({ id, text: plain });
  if (token.depth === 1) return `<h1>${text}</h1>\n`;
  return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
};
const baseTable = renderer.table.bind(renderer);
renderer.table = function (token) {
  return '<div class="table-scroll">' + baseTable(token) + '</div>';
};

const md = fs.readFileSync(SRC, 'utf8');
const body = marked.parse(md, { renderer, gfm: true });

const tocHtml = toc.map(t => `<a href="#${t.id}">${t.text}</a>`).join('\n        ');

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Konzept — bias.fm</title>
<meta name="description" content="Handover v2: Konzept, Datenquellen-Analyse, Roadmap und offene Entscheidungen der Musik-Plattform bias.fm.">
<meta name="robots" content="noindex">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='13' fill='%23ff4d6d'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>

<nav class="nav">
  <div class="wrap nav-in">
    <a class="logo" href="index.html"><span class="dot"></span>bias.fm</a>
    <div class="nav-links">
      <a href="index.html#charts">Charts</a>
      <a href="index.html#kalender">Kalender</a>
      <a href="konzept.html" aria-current="page">Konzept</a>
    </div>
    <div class="nav-right">
      <button class="btn btn-ghost" id="theme-toggle" title="Hell / Dunkel" aria-label="Farbschema wechseln">◐</button>
      <a class="btn" href="index.html">Zur Landing</a>
    </div>
  </div>
</nav>

<div class="wrap doc-layout">
  <aside class="toc" aria-label="Inhaltsverzeichnis">
    <div class="lbl">Inhalt</div>
    ${tocHtml}
  </aside>

  <article class="doc">
    <div class="doc-meta">
      <span class="pill accent">Handover v2</span>
      <span class="pill">Stand 28. August 2026</span>
      <span class="pill">Konzeptphase</span>
    </div>
${body}
  </article>
</div>

<footer>
  <div class="wrap foot-in">
    <span><span class="status-dot"></span>Internes Konzeptdokument · nicht öffentlich verlinken</span>
    <div class="foot-links">
      <a href="index.html">Landing</a>
      <a href="handover.md">Markdown-Quelle</a>
    </div>
  </div>
</footer>

<script>
(function () {
  var root = document.documentElement;
  try { var t = localStorage.getItem('biasfm.theme'); if (t) root.setAttribute('data-theme', t);
        var b = localStorage.getItem('biasfm.bias'); if (b) root.style.setProperty('--bias', b); } catch (e) {}
  var btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', function () {
    var dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    var next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('biasfm.theme', next); } catch (e) {}
  });

  var links = [].slice.call(document.querySelectorAll('.toc a'));
  var heads = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  function spy() {
    var best = 0;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i] && heads[i].getBoundingClientRect().top <= 120) best = i;
    }
    links.forEach(function (a, i) { a.classList.toggle('active', i === best); });
  }
  var tick = false;
  addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { spy(); tick = false; });
  }, { passive: true });
  spy();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log('konzept.html gebaut — ' + toc.length + ' Abschnitte, ' + html.length + ' Bytes');
