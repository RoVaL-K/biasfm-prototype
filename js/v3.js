// bias.fm Improvement V3 interaction layer.
// The V3 layer is deliberately additive: it keeps the existing prototype
// modules usable while giving the product real routes, collections and a
// moderation-aware community surface.
(function (root) {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const data = () => root.BIAS_DATA || {artists: [], songs: [], producers: []};
  const api = (path, options) => root.biasApi?.request ? root.biasApi.request(path, options) : Promise.reject(new Error('Die Serververbindung ist noch nicht eingerichtet.'));
  const read = (key, fallback) => { try { const parsed = JSON.parse(localStorage.getItem(key) || 'null'); return parsed == null ? fallback : parsed; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const entity = id => data().artists?.find(item => item.id === id) || data().people?.find(item => item.id === id) || data().producers?.find(item => item.id === id);
  const song = id => data().songs?.find(item => item.id === id);
  const artistForSong = item => entity(item?.artistId) || {name: item?.artistName || 'Unbekannter Artist', id: item?.artistId || ''};
  const cover = (title, artist, large = false) => root.biasUI?.cover ? root.biasUI.cover(title, artist, large) : `<span class="artwork" aria-label="Cover: ${esc(title)} von ${esc(artist)}"></span>`;
  const icon = name => ({arrow:'→',back:'←',chevron:'›',plus:'+',pin:'⌖',heart:'♥',save:'♡',shield:'◇'}[name] || '•');
  const formHeaders = {'Content-Type': 'application/json'};
  const norm = value => root.biasCore?.normalize ? root.biasCore.normalize(String(value || '')) : String(value || '').toLocaleLowerCase('und').normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '');
  const sceneMatch = (genres, scene) => {
    if (!scene || scene === 'Alle') return true;
    const text = (genres || []).join(' ');
    if (scene === 'Indie / Rock') return /indie|rock|band/i.test(text);
    if (scene === 'K-R&B / Soul') return /r&b|soul/i.test(text);
    if (scene === 'K-Hiphop') return /hiphop|hip hop/i.test(text);
    return /idol|pop/i.test(text);
  };
  const artistGenresForSong = item => [...(item?.genres || []), ...(artistForSong(item)?.genres || [])];
  const popularity = item => Number(item?.communityCount || item?.monthlyListeners || item?.totalScrobbles || item?.plays || item?.playcount || 0);
  const releaseTracksFor = item => {
    if (!item) return [];
    const releaseKey = norm(item.album || item.title);
    return (data().songs || []).filter(track => track.artistId === item.artistId && norm(track.album || track.title) === releaseKey);
  };
  const durationSeconds = value => {
    const parts = String(value || '').split(':').map(Number);
    if (parts.length !== 2 || !parts.every(Number.isFinite)) return 0;
    return Math.max(0, parts[0] * 60 + parts[1]);
  };
  const formatDuration = value => value ? `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}` : '—';
  const xpCostAnchors = [[1,100],[10,500],[25,1500],[50,4000],[75,8000],[100,12000]];
  const xpCost = level => { const value = Math.max(1, Math.min(100, Number(level) || 1)); for (let index = 1; index < xpCostAnchors.length; index += 1) { const [rightLevel, rightCost] = xpCostAnchors[index]; const [leftLevel, leftCost] = xpCostAnchors[index - 1]; if (value <= rightLevel) return Math.round(leftCost + (rightCost - leftCost) * ((value - leftLevel) / (rightLevel - leftLevel))); } return xpCostAnchors[xpCostAnchors.length - 1][1]; };
  const xpThreshold = level => { const value = Math.max(1, Math.min(100, Number(level) || 1)); let total = 0; for (let current = 1; current < value; current += 1) total += xpCost(current); return total; };
  const levelForXpV3 = amount => { let level = 1; const value = Math.max(0, Number(amount) || 0); while (level < 100 && value >= xpThreshold(level + 1)) level += 1; return level; };

  const seedGroups = [
    {id:'seed-krnb', name:'K-R&B after dark', description:'Korean R&B, Soul, Alternative R&B und Producer-Credits.', visibility:'public', joinMode:'request', memberCount:4219, seed:true},
    {id:'seed-indie', name:'Indie Seoul', description:'Indie, Band-Sound und Releases abseits der großen Playlists.', visibility:'public', joinMode:'open', memberCount:1186, seed:true},
    {id:'seed-cologne', name:'Bonn / Cologne · Korean Music', description:'Gemeinsam Konzerte, Releases und Platten in der Region entdecken.', visibility:'public', joinMode:'request', memberCount:304, seed:true}
  ];
  const localGroups = () => read('biasfm_v3_groups', []).concat(seedGroups).filter((group, index, all) => all.findIndex(item => item.id === group.id) === index);
  const localPosts = () => read('biasfm_v3_posts', {});

  function v3Card(entityData, type = 'artist') {
    const artist = type === 'artist' ? entityData : artistForSong(entityData);
    const href = type === 'artist' ? `#artist/${encodeURIComponent(artist.id)}` : `#release/${encodeURIComponent(entityData.id)}`;
    const title = type === 'artist' ? artist.name : entityData.album || entityData.title;
    const releaseTracks = type === 'release' ? releaseTracksFor(entityData) : [];
    const subtitle = type === 'artist' ? `${artist.hangul || ''} · ${(artist.genres || []).slice(0, 2).join(' · ')}` : `${entityData.artistName || artist.name} · ${entityData.releaseYear || ''} · ${releaseTracks.length || 1} ${releaseTracks.length === 1 ? 'Track' : 'Tracks'}`;
    const description = type === 'artist' ? artist.bio : `${(entityData.genres || []).slice(0, 3).join(' · ')} · ${releaseTracks.length || 1} ${releaseTracks.length === 1 ? 'Track' : 'Tracks'} mit Credits`;
    return `<a class="v3-discover-card" href="${href}">${cover(title, artist.name, true)}<span class="v3-card-kicker">${type === 'artist' ? (artist.type === 'solo' ? 'SOLO-ACT' : 'ARTIST') : 'RELEASE'}</span><h3>${esc(title)}</h3><p>${esc(subtitle)}</p><small>${esc(String(description || '').slice(0, 120))}${description?.length > 120 ? '…' : ''}</small><span class="v3-card-link">Profil öffnen ${icon('arrow')}</span></a>`;
  }

  function renderDiscover(container) {
    const state = root.biasV3.discover;
    const q = norm(state.query || '');
    const tabs = [['artists','Artists & Credits'],['releases','Releases'],['genres','Genres']];
    let artists = [...(data().artists || [])];
    let songs = [...(data().songs || [])];
    if (state.type === 'producer') {
      artists = (data().producers || []).map(item => ({...item, type:'producer', genres:item.roles || ['Producer']}));
      songs = songs.filter(item => (item.credits?.producers || []).length > 0);
    } else if (state.type !== 'Alle') {
      artists = artists.filter(item => item.type === state.type);
      songs = songs.filter(item => artistForSong(item)?.type === state.type);
    }
    artists = artists.filter(item => sceneMatch(item.genres, state.scene));
    songs = songs.filter(item => sceneMatch(artistGenresForSong(item), state.scene));
    if (state.genre !== 'Alle') {
      const genre = norm(state.genre);
      artists = artists.filter(item => (item.genres || []).some(g => norm(g).includes(genre)));
      songs = songs.filter(item => artistGenresForSong(item).some(g => norm(g).includes(genre)));
    }
    if (state.period !== 'Alle') {
      const year = item => Number(item.debutYear || item.releaseYear || 0);
      artists = artists.filter(item => state.period === 'Seit 2025' ? year(item) >= 2025 : state.period === '2020–2024' ? year(item) >= 2020 && year(item) <= 2024 : year(item) > 0 && year(item) < 2020);
      songs = songs.filter(item => state.period === 'Seit 2025' ? Number(item.releaseYear || 0) >= 2025 : state.period === '2020–2024' ? Number(item.releaseYear || 0) >= 2020 && Number(item.releaseYear || 0) <= 2024 : Number(item.releaseYear || 0) > 0 && Number(item.releaseYear || 0) < 2020);
    }
    if (q) {
      artists = artists.filter(item => [item.name, item.hangul, item.romanized, item.agency, ...(item.aliases || []), ...(item.roles || [])].some(value => norm(value).includes(q)));
      songs = songs.filter(item => [item.title, item.hangulTitle, item.artistName, item.album, ...(item.credits?.producers || [])].some(value => norm(value).includes(q)));
    }
    const profile = root.biasStore?.profile || {};
    const favoriteIds = new Set((profile.favoriteArtists || profile.biasLine || []).filter(Boolean));
    const favoriteGenres = new Set([...favoriteIds].flatMap(id => entity(id)?.genres || []).map(norm));
    const tasteSignal = item => {
      const artistId = item.artistId || item.id;
      const artist = item.artistId ? artistForSong(item) : item;
      const genres = [...(item.genres || []), ...(artist?.genres || [])].map(norm);
      let score = favoriteIds.has(artistId) ? 22 : 0;
      score += genres.filter(genre => [...favoriteGenres].some(favorite => favorite && (genre.includes(favorite) || favorite.includes(genre)))).length * 6;
      return score;
    };
    const artistRelevance = item => {
      const fields = [item.name, item.hangul, item.romanized, item.agency, ...(item.aliases || []), ...(item.genres || [])].map(norm);
      const exact = q && fields.some(value => value === q) ? 80 : 0;
      const starts = q && fields.some(value => value.startsWith(q)) ? 30 : 0;
      const match = q && fields.some(value => value.includes(q)) ? 15 : 0;
      const freshness = Number(item.debutYear || item.releaseYear || 0) * .25;
      const quality = item.isStub ? -20 : 0;
      return exact + starts + match + freshness + Math.log10(1 + popularity(item)) * 4 + quality + tasteSignal(item);
    };
    const songRelevance = item => {
      const fields = [item.title, item.hangulTitle, item.artistName, item.album, ...(item.genres || []), ...(item.credits?.producers || [])].map(norm);
      const exact = q && fields.some(value => value === q) ? 80 : 0;
      const starts = q && fields.some(value => value.startsWith(q)) ? 30 : 0;
      const match = q && fields.some(value => value.includes(q)) ? 15 : 0;
      const freshness = Number(item.releaseYear || 0) * .25;
      return exact + starts + match + freshness + Math.log10(1 + popularity(item)) * 4 + tasteSignal(item);
    };
    if (state.sort === 'A–Z') { artists.sort((a, b) => String(a.name).localeCompare(String(b.name))); songs.sort((a, b) => String(a.title).localeCompare(String(b.title))); }
    else if (state.sort === 'Meiste Credits') { artists.sort((a, b) => (b.associatedProducers || []).length - (a.associatedProducers || []).length); songs.sort((a, b) => (b.credits?.producers || []).length - (a.credits?.producers || []).length); }
    else if (state.sort === 'Neu erschienen' || state.sort === 'Zuletzt angekündigt') { artists.sort((a, b) => Number(b.releaseYear || b.debutYear || 0) - Number(a.releaseYear || a.debutYear || 0)); songs.sort((a, b) => Number(b.releaseYear || 0) - Number(a.releaseYear || 0)); }
    else if (state.sort === 'Beliebt' || state.sort === 'Beliebt in der Community') { artists.sort((a, b) => popularity(b) - popularity(a)); songs.sort((a, b) => popularity(b) - popularity(a)); }
    else if (state.sort === 'Meiste Releases') { artists.sort((a, b) => (data().songs || []).filter(songItem => songItem.artistId === b.id).length - (data().songs || []).filter(songItem => songItem.artistId === a.id).length); }
    else if (state.sort === 'Meiste Mitglieder') { artists.sort((a, b) => (b.members || []).length - (a.members || []).length); }
    else { artists.sort((a, b) => artistRelevance(b) - artistRelevance(a)); songs.sort((a, b) => songRelevance(b) - songRelevance(a)); }
    const source = state.tab === 'releases' ? songs : artists;
    const pageSize = Math.max(25, Math.min(250, Number(state.pageSize) || 100));
    const pageCount = Math.max(1, Math.ceil(source.length / pageSize));
    const page = Math.min(Math.max(1, Number(state.page) || 1), pageCount);
    state.page = page;
    const pages = source.slice((page - 1) * pageSize, page * pageSize);
    const total = source.length;
    const relevanceNote = favoriteIds.size ? 'Relevanz: deine Favoriten-Tags, gemeinsame Credits und Neuheit.' : 'Relevanz: Editorial-Fokus, Tags, Credits und Neuheit; noch nicht personalisiert.';
    container.innerHTML = `<div class="view-catalog v3-discover"><div class="view-header v3-view-header"><div><p class="hero-eyebrow">DISCOVER · KATALOG</p><h1 class="view-title">Entdecken</h1><p class="view-subtitle">Artists, Releases und die Menschen hinter der Musik — mit nachvollziehbaren Quellen und Rollen.</p></div><div class="v3-discover-search"><label class="sr-only" for="v3-discover-search">Katalog durchsuchen</label><input id="v3-discover-search" class="chart-search-input" type="search" value="${esc(state.query)}" placeholder="Artist, Release, Label oder Credit …"></div></div><div class="v3-tabbar" role="tablist">${tabs.map(([id,label]) => `<button role="tab" type="button" data-v3-tab="${id}" data-tab="${id}" aria-selected="${state.tab === id}">${label}</button>`).join('')}</div><div class="v3-discover-toolbar"><div class="v3-discover-filter-shell"><button type="button" class="btn btn-ghost v3-mobile-filter-toggle" data-v3-filter-toggle aria-expanded="false">Filter <span aria-hidden="true">⌄</span></button><div class="v3-filter-row" data-v3-filter-sheet><div class="v3-filter-sheet-head"><strong>Filter</strong><button type="button" class="btn btn-ghost btn-sm" data-v3-filter-close>Fertig</button></div><label>Szene<select id="v3-scene" class="select-input"><option>Alle</option><option ${state.scene === 'Idol' ? 'selected' : ''}>Idol</option><option ${state.scene === 'K-R&B / Soul' ? 'selected' : ''}>K-R&B / Soul</option><option ${state.scene === 'K-Hiphop' ? 'selected' : ''}>K-Hiphop</option><option ${state.scene === 'Indie / Rock' ? 'selected' : ''}>Indie / Rock</option></select></label><label>Genre<select id="v3-genre" class="select-input"><option>Alle</option>${['Idol','R&B','Hiphop','Indie','Rock','Ballade','OST','Electronic'].map(item => `<option ${state.genre === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label><label>Typ<select id="v3-type" class="select-input"><option>Alle</option><option value="group" ${state.type === 'group' ? 'selected' : ''}>Gruppen</option><option value="solo" ${state.type === 'solo' ? 'selected' : ''}>Solo-Acts</option><option value="band" ${state.type === 'band' ? 'selected' : ''}>Bands</option><option value="producer" ${state.type === 'producer' ? 'selected' : ''}>Producer-Rolle</option></select></label><label>Zeitraum<select id="v3-period" class="select-input"><option ${state.period === 'Alle' ? 'selected' : ''}>Alle</option><option ${state.period === 'Seit 2025' ? 'selected' : ''}>Seit 2025</option><option ${state.period === '2020–2024' ? 'selected' : ''}>2020–2024</option><option ${state.period === 'Vor 2020' ? 'selected' : ''}>Vor 2020</option></select></label><label>Pro Seite<select id="v3-page-size" class="select-input">${[25,50,100,250].map(item => `<option value="${item}" ${pageSize === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label></div></div><label class="v3-sort-control">Sortieren<select id="v3-sort" class="select-input">${['Relevanz','Neu erschienen','Zuletzt angekündigt','Beliebt in der Community','A–Z','Meiste Releases','Meiste Mitglieder','Meiste Credits'].map(item => `<option ${state.sort === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label></div><div class="v3-results-meta"><span>${total} Ergebnisse</span><span>${relevanceNote} ${pageCount > 1 ? `Seite ${page} von ${pageCount}.` : ''}</span></div>${state.tab === 'genres' ? renderGenreDirectory(q) : `<div class="catalog-grid v3-discover-grid">${pages.map(item => state.tab === 'releases' ? v3Card(item, 'release') : v3Card(item, 'artist')).join('') || '<div class="catalog-empty"><p>Keine Einträge für diesen Filter gefunden.</p></div>'}</div>${pageCount > 1 ? `<nav class="v3-pagination" aria-label="Entdecken-Seiten"><button type="button" data-v3-page="prev" ${page <= 1 ? 'disabled' : ''}>← Zurück</button><span>Seite ${page} / ${pageCount}</span><button type="button" data-v3-page="next" ${page >= pageCount ? 'disabled' : ''}>Weiter →</button></nav>` : ''}`}</div>`;
    const rerender = () => renderDiscover(container);
    const filterShell = container.querySelector('.v3-discover-filter-shell');
    const filterToggle = container.querySelector('[data-v3-filter-toggle]');
    const closeFilters = () => { filterShell?.classList.remove('is-open'); filterToggle?.setAttribute('aria-expanded', 'false'); };
    filterToggle?.addEventListener('click', () => { const open = !filterShell?.classList.contains('is-open'); filterShell?.classList.toggle('is-open', open); filterToggle.setAttribute('aria-expanded', String(open)); });
    container.querySelector('[data-v3-filter-close]')?.addEventListener('click', closeFilters);
    container.querySelector('#v3-discover-search').oninput = event => { state.query = event.target.value; state.page = 1; rerender(); container.querySelector('#v3-discover-search')?.focus(); };
    container.querySelectorAll('[data-v3-tab]').forEach(button => button.onclick = () => { state.tab = button.dataset.v3Tab; state.page = 1; rerender(); });
    [['#v3-scene','scene'],['#v3-genre','genre'],['#v3-type','type'],['#v3-period','period'],['#v3-sort','sort']].forEach(([selector,key]) => container.querySelector(selector)?.addEventListener('change', event => { state[key] = event.target.value; state.page = 1; rerender(); }));
    container.querySelector('#v3-page-size')?.addEventListener('change', event => { state.pageSize = Number(event.target.value); state.page = 1; rerender(); });
    container.querySelector('[data-v3-page="prev"]')?.addEventListener('click', () => { state.page = page - 1; rerender(); });
    container.querySelector('[data-v3-page="next"]')?.addEventListener('click', () => { state.page = page + 1; rerender(); });
  }

  function renderGenreDirectory(query) {
    const groups = new Map();
    (data().artists || []).forEach(item => (item.genres || []).forEach(genre => { if (!groups.has(genre)) groups.set(genre, []); groups.get(genre).push(item); }));
    return `<div class="v3-genre-grid">${[...groups].filter(([genre]) => !query || root.biasCore.normalize(genre).includes(query)).map(([genre, items]) => `<article class="v3-genre-card"><p class="hero-eyebrow">GENRE</p><h2>${esc(genre)}</h2><p>${items.length} Artists im kuratierten Katalog.</p><div>${items.slice(0, 8).map(item => `<a href="#artist/${encodeURIComponent(item.id)}">${esc(item.name)}</a>`).join('')}</div></article>`).join('')}</div>`;
  }

  function ratingSegments(score) {
    const value = Math.max(0, Math.min(10, Number(score) || 0));
    const full = Math.floor(value), partial = value - full >= .5 ? 1 : 0;
    const tone = value < 4 ? 'is-low' : value < 7 ? 'is-mid' : 'is-high';
    return `<span class="v3-rating-segments ${tone}" aria-hidden="true">${Array.from({length:10}, (_, index) => `<i class="${index < full ? 'is-full' : index === full && partial ? 'is-half' : ''}"></i>`).join('')}</span>`;
  }

  function reviewBodyMarkup(item) {
    const body = esc(String(item.body || '').slice(0, 5000)); if (!body) return '';
    // Keep reviews markdown-light and safe: raw HTML stays escaped while
    // explicit http(s) links become useful, non-ranking community links.
    const linked = body.replace(/(https?:\/\/[^\s<]+)/gi, match => {
      const trailing = match.match(/[),.;!?]+$/)?.[0] || '';
      const url = trailing ? match.slice(0, -trailing.length) : match;
      return `<a href="${url}" target="_blank" rel="nofollow ugc noopener">${url}</a>${trailing}`;
    });
    // Markdown-light formatting is applied after escaping, so only the two
    // deliberately supported markers can create markup. Arbitrary HTML,
    // scripts and embeds remain plain text.
    const markdown = linked
      .replace(/\*\*([^*\n]{1,200})\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]{1,200})\*([^*]|$)/g, '$1<em>$2</em>$3');
    const content = item.spoiler ? `<details class="v3-review-spoiler"><summary>Spoiler anzeigen</summary><p>${markdown}</p></details>` : `<p>${markdown}</p>`;
    return content;
  }

  function renderReviews(entityType, entityId, artistId = '') {
    const host = document.createElement('section'); host.className = 'v3-reviews settings-card'; host.innerHTML = `<div class="section-heading-row"><div><p class="hero-eyebrow">COMMUNITY · REVIEWS</p><h2>Bewertungen</h2></div><span class="v3-rating-summary">Noch nicht bewertet</span></div><p class="section-note">0,0 bis 10,0 · eine Bewertung pro Konto · maximal 5.000 Zeichen. Öffentliche Durchschnitte erscheinen ab fünf gültigen Stimmen.</p><form class="v3-review-form"><div class="v3-score-row"><label for="v3-score">Deine Bewertung <output id="v3-score-value">8,0</output></label><div class="v3-score-inputs"><input id="v3-score" type="range" min="0" max="10" step="0.1" value="8" aria-label="Bewertung als Schieberegler"><input id="v3-score-number" type="number" min="0" max="10" step="0.1" value="8.0" aria-label="Bewertung als Zahl"></div></div><textarea id="v3-review-body" maxlength="5000" placeholder="Was bleibt dir an diesem Release? (optional)"></textarea><label class="v3-check"><input type="checkbox" id="v3-review-spoiler"> Enthält Spoiler</label><button class="btn btn-accent" type="submit">Bewertung speichern</button></form><div class="v3-review-list"></div>`;
    const score = host.querySelector('#v3-score'), scoreNumber = host.querySelector('#v3-score-number'), output = host.querySelector('#v3-score-value'); const syncScore = value => { const numeric = Math.max(0, Math.min(10, Number(value) || 0)); score.value = numeric.toFixed(1); scoreNumber.value = numeric.toFixed(1); output.value = numeric.toFixed(1).replace('.', ','); output.textContent = output.value; }; score.oninput = () => syncScore(score.value); scoreNumber.oninput = () => syncScore(scoreNumber.value);
    const list = host.querySelector('.v3-review-list');
    const paint = result => { const totalCount = result.count ?? 0; const validCount = result.qualifiedCount ?? totalCount; host.querySelector('.v3-rating-summary').innerHTML = result.average == null ? (result.pending ? `Bewertung folgt · ${totalCount}` : 'Noch nicht bewertet') : `<strong>${Number(result.average).toFixed(1)} / 10</strong> · ${validCount} gültige Bewertungen ${ratingSegments(result.average)}`; list.innerHTML = (result.items || []).map(item => `<article class="v3-review"><div><strong>${esc(item.username)}</strong><span>${Number(item.score).toFixed(1)} / 10</span></div>${ratingSegments(item.score)}${reviewBodyMarkup(item)}<small>${item.edited ? 'bearbeitet · ' : ''}${new Date(item.createdAt).toLocaleDateString('de-DE')}</small><button type="button" class="text-action v3-report-review" data-review-id="${esc(item.id)}">Review melden</button></article>`).join('') || '<p class="section-note">Noch keine öffentlichen Reviews.</p>'; list.querySelectorAll('.v3-report-review').forEach(button => button.onclick = () => { if (!root.biasAccount?.authenticated) return root.biasAccount?.openAuth('login'); const reason = root.document.defaultView?.prompt?.('Warum möchtest du diese Review melden?', 'Unangemessener Inhalt'); if (!reason) return; api('api/moderation', {method:'POST', headers: formHeaders, body: JSON.stringify({action:'report', targetType:'review', targetId: button.dataset.reviewId, reason})}).then(() => root.biasApp.showToast('Review gemeldet.')).catch(error => root.biasApp.showToast(error.message)); }); };
    api(`api/reviews?entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(entityId)}`).then(paint).catch(() => paint({count: 0, items: []}));
    host.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      if (!root.biasAccount?.authenticated) { root.biasAccount?.openAuth('login'); return; }
      const payload = {entityType, entityId, artistId, score: Number(score.value), body: host.querySelector('#v3-review-body').value, spoiler: host.querySelector('#v3-review-spoiler').checked};
      try {
        await api('api/reviews', {method:'POST', headers: formHeaders, body: JSON.stringify(payload)});
        // Re-read the aggregate so edits and the five-vote qualification rule
        // are reflected immediately instead of showing an optimistic fake count.
        const aggregate = await api(`api/reviews?entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(entityId)}`);
        root.biasApp.showToast('Bewertung gespeichert.');
        paint(aggregate);
      } catch (error) { root.biasApp.showToast(error.message || 'Die Bewertung konnte nicht gespeichert werden.'); }
    };
    return host;
  }

  function renderArtist(container, id) {
    const artist = entity(id); if (!artist) return renderMissing(container, 'Artist');
    const tracks = (data().songs || []).filter(item => item.artistId === artist.id);
    container.innerHTML = `<div class="v3-detail-view"><a class="v3-back-link" href="#catalog">${icon('back')} Entdecken</a><header class="v3-entity-header">${cover(artist.name, artist.name, true)}<div><p class="hero-eyebrow">ARTIST · ${esc(artist.type === 'producer' ? 'PRODUCER-ROLLE' : artist.type === 'solo' ? 'SOLO-ACT' : 'GROUP')}</p><h1>${esc(artist.name)}</h1><p class="v3-hangul">${esc(artist.hangul || '')} · ${esc(artist.romanized || artist.realName || '')}</p><div class="v3-chip-row">${(artist.genres || []).map(item => `<span class="tag">${esc(item)}</span>`).join('')}</div><p>${esc(artist.bio || '')}</p><div class="v3-detail-actions"><button class="btn btn-accent" id="v3-follow-artist">Artist folgen</button><a class="btn btn-ghost" href="#community">Community entdecken</a></div></div></header><div class="v3-detail-columns"><main><section class="settings-card"><div class="section-heading-row"><div><p class="hero-eyebrow">KATALOG · RELEASES</p><h2>Releases &amp; Songs</h2></div><span class="section-note">${tracks.length} Einträge</span></div><div class="v3-track-list">${tracks.map(item => `<a href="#song/${encodeURIComponent(item.id)}"><span>${cover(item.title, artist.name)}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.album)} · ${item.releaseYear}</small></span><span>${icon('chevron')}</span></a>`).join('') || '<p class="section-note">Für diesen Artist sind noch keine Releases im Katalog.</p>'}</div></section><section class="settings-card"><p class="hero-eyebrow">CREDITS</p><h2>Producer &amp; Rollen</h2><div class="v3-credit-list">${(artist.associatedProducers || artist.roles || []).map(producer => `<span>${esc(entity(producer)?.name || producer)}</span>`).join('') || '<p class="section-note">Credits werden redaktionell ergänzt.</p>'}</div></section></main><aside><section class="settings-card" id="v3-artist-xp"><p class="hero-eyebrow">FAN-LEVEL</p><h2>Dein Artist-Fortschritt</h2><p class="section-note">Artist-XP bleibt getrennt von deinem Account-Level. Öffentliche Ranglisten sind opt-in und erst ab 20 echten Teilnehmern sichtbar.</p><div class="v3-progress"><span style="width:0%"></span></div><p class="section-note">Artist-XP wird nach qualifizierten Listens und hilfreichen Beiträgen aufgebaut.</p></section></aside></div></div>`;
    container.querySelector('#v3-follow-artist').onclick = async () => {
      if (!root.biasAccount?.authenticated) { root.biasAccount?.openAuth('login'); return; }
      const local = root.biasStore.toggleArtistFollow?.(artist.id);
      try {
        await api('api/follows/artists', {method: local ? 'POST' : 'DELETE', headers: formHeaders, body: JSON.stringify({artistId: artist.id})});
      } catch (error) {
        // Roll back the optimistic store update when the server rejects it;
        // a validation/auth failure must never look like a successful follow.
        root.biasStore.toggleArtistFollow?.(artist.id);
        root.biasApp.showToast(error.message || 'Die Follow-Änderung konnte nicht gespeichert werden.');
        return;
      }
      container.querySelector('#v3-follow-artist').textContent = local ? '✓ Folge ich' : 'Artist folgen';
    };
    if (root.biasAccount?.authenticated) { const artistKey = artist.mbid ? `artist:${artist.mbid}` : `artist:${artist.id}`; api(`api/xp?artist=${encodeURIComponent(artistKey)}`).then(result => { const card = container.querySelector('#v3-artist-xp'); if (!card) return; const xp = Number(result.artistXp?.[artistKey] || 0); const level = levelForXpV3(xp); const next = xpThreshold(Math.min(100, level + 1)); const current = xpThreshold(level); card.querySelector('h2').textContent = `Level ${level}`; card.querySelector('.v3-progress span').style.width = `${Math.min(100, Math.max(0, ((xp - current) / Math.max(1, next - current)) * 100))}%`; const note = card.querySelector('.section-note:last-child'); if (note) note.textContent = result.leaderboard?.available ? `Opt-in-Rangliste: ${result.leaderboard.participantCount} Teilnehmer.` : `Opt-in-Rangliste ab 20 Teilnehmern · derzeit ${result.leaderboard?.participantCount || 0}.`; }).catch(() => {}); }
  }

  function renderSong(container, id, release = false) {
    const item = song(id); if (!item) return renderMissing(container, release ? 'Release' : 'Song'); const artist = artistForSong(item);
    const matchingReleaseTracks = release ? releaseTracksFor(item) : [];
    const releaseTracks = release ? (matchingReleaseTracks.length ? matchingReleaseTracks : [item]) : [item];
    const releaseCredits = [...new Set(releaseTracks.flatMap(track => track.credits?.producers || []))];
    const totalReleaseSeconds = releaseTracks.reduce((total, track) => total + durationSeconds(track.duration), 0);
    const releaseTracklist = release ? `<section class="settings-card v3-release-tracklist"><div class="section-heading-row"><div><p class="hero-eyebrow">RELEASE · TRACKLIST</p><h2>Tracks</h2></div><span class="section-note">${releaseTracks.length} ${releaseTracks.length === 1 ? 'Track' : 'Tracks'} · ${totalReleaseSeconds ? `Gesamtlänge ${formatDuration(totalReleaseSeconds)}` : 'Längen werden ergänzt'}</span></div><div class="v3-release-track-rows">${releaseTracks.map((track, index) => `<a class="v3-release-track-row${track.id === item.id ? ' is-current' : ''}" href="#song/${encodeURIComponent(track.id)}"><span class="v3-release-track-number">${String(index + 1).padStart(2, '0')}</span><span class="v3-release-track-art">${cover(track.title, artist.name)}</span><span class="v3-release-track-copy"><strong>${esc(track.title)}</strong><small>${esc(track.hangulTitle || '')}${track.hangulTitle && track.artistName ? ' · ' : ''}${esc(track.artistName || artist.name)}</small></span><span class="v3-release-track-duration">${esc(track.duration || '—')}</span><span class="v3-release-track-arrow" aria-hidden="true">${icon('chevron')}</span></a>`).join('')}</div></section>` : '';
    const pageTitle = release ? (item.album || item.title) : item.title;
    const pageSubtitle = release ? `${releaseTracks.length} ${releaseTracks.length === 1 ? 'Track' : 'Tracks'} · <a href="#artist/${encodeURIComponent(artist.id)}">${esc(artist.name)}</a>` : `${esc(item.hangulTitle || '')} · <a href="#artist/${encodeURIComponent(artist.id)}">${esc(artist.name)}</a>`;
    const releaseMeta = release ? `<span>${releaseTracks.length} ${releaseTracks.length === 1 ? 'Track' : 'Tracks'}</span>` : '';
    const releaseKind = release ? 'release' : 'song';
    container.innerHTML = `<div class="v3-detail-view"><a class="v3-back-link" href="#catalog">${icon('back')} Entdecken</a><header class="v3-release-header">${cover(item.album || item.title, artist.name, true)}<div><p class="hero-eyebrow">${release ? 'RELEASE' : 'SONG'} · ${item.releaseYear || ''}</p><h1>${esc(pageTitle)}</h1><p class="v3-hangul">${pageSubtitle}</p><div class="v3-chip-row">${(item.genres || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}${releaseMeta ? `<span class="tag tag-muted">${releaseMeta}</span>` : ''}</div><div class="v3-detail-actions"><button class="btn btn-ghost" data-v3-save="saved">${icon('save')} Merken</button><button class="btn btn-ghost" data-v3-save="favorite">${icon('heart')} Favourite</button><button class="btn btn-accent" data-v3-list-add>＋ Zu Liste</button></div><div class="v3-item-stats" data-v3-item-stats aria-live="polite"><span>Öffentliche Signale werden geladen …</span></div><p class="section-note">Covers und Providerlinks werden nur angezeigt, wenn das Matching eindeutig ist. bias.fm crawlt keine Anbieter.</p></div></header><div class="v3-detail-columns"><main>${releaseTracklist}<section id="v3-item-lists" class="settings-card v3-item-lists" aria-live="polite"><div class="section-heading-row"><div><p class="hero-eyebrow">SAMMLUNGEN · COMMUNITY</p><h2>In öffentlichen Listen</h2></div></div><p class="section-note">Öffentliche Listen werden geladen …</p></section><section class="settings-card"><p class="hero-eyebrow">CREDITS</p><h2>Credits &amp; Quellen</h2><dl class="v3-detail-facts"><div><dt>Artist</dt><dd>${esc(artist.name)}</dd></div><div><dt>Album / Release</dt><dd>${esc(item.album || 'Einzelrelease')}</dd></div><div><dt>Producer</dt><dd>${esc(releaseCredits.join(' · ') || 'Noch nicht zugeordnet')}</dd></div></dl><div class="import-actions"><a class="btn btn-ghost" href="${esc(item.links?.spotify || `https://open.spotify.com/search/${encodeURIComponent(`${artist.name} ${item.title}`)}`)}" target="_blank" rel="noopener">Spotify öffnen ↗</a><a class="btn btn-ghost" href="${esc(item.links?.apple || `https://music.apple.com/search?term=${encodeURIComponent(`${artist.name} ${item.title}`)}`)}" target="_blank" rel="noopener">Apple Music ↗</a></div></section></main><aside id="v3-review-host"></aside></div></div>`;
    const itemStats = container.querySelector('[data-v3-item-stats]');
    if (itemStats) api(`api/lists?item_key=${encodeURIComponent(item.id)}&item_type=${encodeURIComponent(release ? 'release' : 'song')}`).then(result => {
      const favoriteCount = Number(result.favoriteCount || 0); const listCount = Number(result.listCount || 0);
      itemStats.innerHTML = `<span>${favoriteCount.toLocaleString('de-DE')} öffentliche Favourite${favoriteCount === 1 ? '' : 's'}</span><span>${listCount.toLocaleString('de-DE')} öffentliche${listCount === 1 ? 'r' : ''} Liste${listCount === 1 ? '' : 'n'}</span>`;
      const itemLists = container.querySelector('#v3-item-lists');
      if (itemLists) itemLists.innerHTML = itemListsMarkup(result, item.id, release ? 'release' : 'song');
      container.querySelectorAll('[data-v3-save]').forEach(button => { const kind = button.dataset.v3Save; const active = kind === 'favorite' ? result.viewer?.favorite : result.viewer?.saved; if (active) button.classList.add('is-active'); if (active) button.innerHTML = `${icon(kind === 'favorite' ? 'heart' : 'save')} ${kind === 'favorite' ? 'Favourite gespeichert' : 'Gemerkt'}`; });
    }).catch(() => { if (itemStats) itemStats.innerHTML = '<span>Öffentliche Sammlungszahlen werden nach Verfügbarkeit angezeigt.</span>'; const itemLists = container.querySelector('#v3-item-lists'); if (itemLists) itemLists.innerHTML = '<p class="section-note">Öffentliche Listen sind momentan nicht verfügbar.</p>'; });
    const review = renderReviews(release ? 'release' : 'song', item.id, artist.id); container.querySelector('#v3-review-host').appendChild(review);
    container.querySelectorAll('[data-v3-save]').forEach(button => button.onclick = async () => {
      if (!root.biasAccount?.authenticated) { root.biasAccount?.openAuth('login'); return; }
      const kind = button.dataset.v3Save;
      const payload = {action: kind === 'favorite' ? 'favorite' : 'save', itemKey: item.id, itemType: releaseKind, title: release ? item.album : item.title, artistName: artist.name};
      let remote = true;
      try {
        await api('api/lists', {method:'POST',headers:formHeaders,body:JSON.stringify(payload)});
      } catch (error) {
        // Keep a local fallback only for a transient outage. Validation and
        // auth errors must never look like a successful save.
        if (error?.status && error.status < 500) { root.biasApp.showToast(error.message || 'Der Eintrag konnte nicht gespeichert werden.'); return; }
        remote = false;
        const items = read('biasfm_v3_saved', []);
        if (!items.some(saved => saved.itemKey === item.id && saved.kind === kind)) { items.unshift({...payload, kind}); write('biasfm_v3_saved', items); }
      }
      root.biasApp.showToast(`${kind === 'favorite' ? 'Als Favourite gespeichert.' : 'Für später gemerkt.'}${remote ? '' : ' Lokal gespeichert; Server nicht erreichbar.'}`);
    });
    container.querySelector('[data-v3-list-add]').onclick = () => { root.biasV3.lists.pending = {kind: release ? 'release' : 'song', entityId: item.id, title: release ? (item.album || item.title) : item.title, artistName: artist.name}; root.biasApp.navigateTo('lists'); };
  }

  function renderMissing(container, label) { container.innerHTML = `<div class="v3-empty-view"><p class="hero-eyebrow">${esc(label.toUpperCase())}</p><h1>Eintrag nicht gefunden</h1><p>Dieser Eintrag ist noch nicht im kanonischen bias.fm-Katalog. Unaufgelöste Plays bleiben als Stub erhalten, bis die Redaktion sie zuordnen kann.</p><a class="btn btn-accent" href="#catalog">Zurück zu Entdecken</a></div>`; }

  function renderCommunity(container) {
    const state = root.biasV3.community;
    if (state.groupId) return renderGroup(container, state.groupId);
    const mine = state.mode === 'mine';
    const sourceGroups = mine ? (state.remoteMine || []) : (state.remoteGroups || []);
    const local = mine ? localGroups().filter(group => String(group.id).startsWith('local-')) : localGroups();
    const groups = [...sourceGroups, ...local].filter((group, index, all) => all.findIndex(item => item.id === group.id) === index).filter(group => !state.query || `${group.name} ${group.description}`.toLowerCase().includes(state.query.toLowerCase()));
    const empty = mine ? '<div class="v3-empty-view"><h2>Noch keiner Gruppe beigetreten</h2><p>Entdecke eine Gruppe und stelle eine Beitrittsanfrage.</p></div>' : '<div class="v3-empty-view"><h2>Keine Gruppe gefunden</h2><p>Gründe einen neuen kuratierten Raum.</p></div>';
    container.innerHTML = `<div class="v3-community-view"><div class="view-header v3-view-header"><div><p class="hero-eyebrow">COMMUNITY · MODERIERT</p><h1 class="view-title">${mine ? 'Meine Gruppen' : 'Gemeinsam entdecken'}</h1><p class="view-subtitle">Entdeckbare, request-basierte Gruppen mit Pinboard und geteilten Musikobjekten. Livechat bleibt geschlossen, bis Moderation und Verifikation bereit sind.</p></div><button class="btn btn-accent" data-v3-create>＋ Gruppe gründen</button></div><div class="v3-community-toolbar"><div class="v3-tabbar"><button type="button" data-v3-discover class="${mine ? '' : 'is-active'}">Gruppen entdecken</button><button type="button" data-v3-mine class="${mine ? 'is-active' : ''}">Meine Gruppen</button><button type="button" data-v3-guides>Guides <span class="pill pill-muted">später</span></button></div><input class="chart-search-input" id="v3-community-search" type="search" value="${esc(state.query)}" placeholder="Artist, Genre, Stadt oder Interesse …"></div><section class="v3-community-notice"><span class="v3-notice-icon">${icon('shield')}</span><div><strong>Launch-sicherer Community-Start</strong><p>Pinboard, Join Requests und Links zuerst. Keine öffentlichen DMs, Datei-Uploads oder unmoderierten Echtzeitfeeds.</p></div></section><div class="v3-group-grid">${groups.map(group => `<article class="v3-group-card"><div class="v3-group-cover">${esc(group.name.slice(0, 2).toUpperCase())}</div><p class="hero-eyebrow">${group.seed ? 'VORSCHAU · KONZEPT' : group.joinMode === 'request' ? 'REQUEST-ONLY' : 'ÖFFENTLICH'}</p><h2>${esc(group.name)}</h2><p>${esc(group.description)}</p><div class="v3-group-meta"><span>${Number(group.memberCount || 0).toLocaleString('de-DE')} Mitglieder</span><span>${group.seed ? 'Beispielinhalt' : group.joinMode === 'request' ? 'Anfrage erforderlich' : 'Offener Beitritt'}</span></div><a class="btn btn-ghost" href="#community/${encodeURIComponent(group.id)}">${group.seed ? 'Vorschau ansehen' : 'Gruppe ansehen'} ${icon('arrow')}</a></article>`).join('') || empty}</div><div id="v3-create-panel" hidden></div></div>`;
    container.querySelector('#v3-community-search').oninput = event => { state.query = event.target.value; renderCommunity(container); container.querySelector('#v3-community-search')?.focus(); };
    container.querySelector('[data-v3-create]').onclick = () => { if (!root.biasAccount?.authenticated) return root.biasAccount?.openAuth('login'); showCreateGroup(container); };
    container.querySelector('[data-v3-guides]').onclick = () => root.biasApp.showToast('Guides kommen nach der Contributor- und Moderationsfreigabe.');
    container.querySelector('[data-v3-discover]').onclick = () => { state.mode = 'discover'; renderCommunity(container); };
    container.querySelector('[data-v3-mine]').onclick = () => {
      if (!root.biasAccount?.authenticated) return root.biasAccount?.openAuth('login');
      state.mode = 'mine'; state.mineLoaded = false; renderCommunity(container);
    };
    if (mine && !state.mineLoaded) {
      state.mineLoaded = true;
      api('api/community?mine=1').then(result => { state.remoteMine = result.groups || []; renderCommunity(container); }).catch(error => { state.remoteMine = []; root.biasApp.showToast(error.message || 'Meine Gruppen sind momentan nicht verfügbar.'); });
    } else if (!mine) {
      api('api/community').then(result => { if (result.groups?.length && !state.loaded) { state.loaded = true; state.remoteGroups = result.groups; renderCommunity(container); } }).catch(() => {});
    }
  }

  function showCreateGroup(container) {
    const panel = container.querySelector('#v3-create-panel'); panel.hidden = false; panel.innerHTML = `<form class="v3-create-form settings-card"><div class="section-heading-row"><div><p class="hero-eyebrow">NEUE GRUPPE</p><h2>Kuratierten Raum gründen</h2></div><button type="button" class="btn btn-ghost" data-v3-close>Schließen</button></div><label>Name<input class="text-input" name="name" minlength="3" maxlength="80" required placeholder="K-R&B after dark"></label><label>Beschreibung<textarea class="text-input" name="description" maxlength="500" required placeholder="Worum geht es in dieser Gruppe?"></textarea></label><div class="v3-filter-row"><label>Sichtbarkeit<select class="select-input" name="visibility"><option value="public">Öffentlich</option><option value="unlisted">Unlisted</option><option value="private">Privat</option></select></label><label>Beitritt<select class="select-input" name="joinMode"><option value="request">Anfrage erforderlich</option><option value="open">Offen</option></select></label></div><p class="section-note">Öffentliche Grundinfos sind auffindbar. Beiträge und Mitglieder werden nach Beitritt sichtbar.</p><button class="btn btn-accent" type="submit">Gruppe erstellen</button></form>`;
    panel.querySelector('[data-v3-close]').onclick = () => { panel.hidden = true; };
    panel.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      const form = new FormData(event.target);
      const group = {id:`local-${Date.now()}`, name:form.get('name'), description:form.get('description'), visibility:form.get('visibility'), joinMode:form.get('joinMode'), memberCount:1};
      let remote = true;
      try {
        const result = await api('api/community',{method:'POST',headers:formHeaders,body:JSON.stringify({name:group.name,description:group.description,visibility:group.visibility,joinMode:group.joinMode})});
        Object.assign(group,result.group || {});
      } catch (error) {
        if (error?.status && error.status < 500) { root.biasApp.showToast(error.message || 'Die Gruppe konnte nicht erstellt werden.'); return; }
        remote = false;
      }
      const saved = read('biasfm_v3_groups', []); saved.unshift(group); write('biasfm_v3_groups', saved); root.biasV3.community.groupId = group.id; renderCommunity(container); root.biasApp.showToast(`Gruppe ${remote ? 'erstellt' : 'lokal vorgemerkt; Server nicht erreichbar'}.`);
    };
  }

  function showJoinRequestForm(container, group, inviteTokenValue = '') {
    const host = container.querySelector('#v3-join-form'); if (!host) return;
    if (!root.biasAccount?.authenticated) { root.biasAccount?.openAuth('login'); return; }
    const profile = root.biasStore.profile || {};
    const privacy = root.biasStore.privacySettings || profile.privacy || {};
    const favorites = privacy.favorites === 'public' ? ((profile.favoriteArtists || profile.biasLine || []).slice(0, 5).map(id => entity(id)?.name).filter(Boolean).join(' · ') || 'Noch keine Favoriten öffentlich sichtbar.') : 'Favoriten sind für dieses Profil nicht öffentlich sichtbar.';
    host.hidden = false;
    const inviteMode = Boolean(inviteTokenValue);
    host.innerHTML = `<form class="v3-join-form settings-card"><div class="section-heading-row"><div><p class="hero-eyebrow">${inviteMode ? 'EINLADUNG' : 'BEITRITTSANFRAGE'}</p><h2>${inviteMode ? 'Einladung annehmen' : group.joinMode === 'request' ? 'Beitritt anfragen' : 'Gruppe beitreten'}</h2></div><button type="button" class="btn btn-ghost btn-sm" data-v3-close>Schließen</button></div><div class="v3-join-profile">${avatarMarkupV3(profile)}<div><strong>${esc(profile.username || 'musikfan')}</strong><p>${esc(privacy.profile === 'private' ? 'Dieses Profil ist privat.' : favorites)}</p></div></div>${inviteMode ? '<p class="section-note">Du wurdest direkt in diese private Gruppe eingeladen. Mit der Annahme wird dein Mitgliedsstatus aktiviert.</p>' : '<label>Nachricht an das Moderatorenteam <span class="section-note">optional · maximal 300 Zeichen</span><textarea class="text-input" name="message" maxlength="300" placeholder="Ich möchte wegen … beitreten"></textarea></label><p class="section-note">Nur Avatar, Username und nach deinen Einstellungen sichtbare Angaben werden angezeigt.</p>'}<div class="v3-form-actions"><button type="submit" class="btn btn-accent">${inviteMode ? 'Einladung annehmen' : 'Anfrage senden'}</button></div></form>`;
    host.querySelector('[data-v3-close]').onclick = () => { host.hidden = true; };
    host.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const submit = event.target.querySelector('[type="submit"]'); submit.disabled = true;
      try {
        const result = await api('api/community', {method:'POST', headers:formHeaders, body:JSON.stringify(inviteMode ? {action:'accept-invite', groupId:group.id, inviteToken:inviteTokenValue} : {action:'join', groupId:group.id, message:new FormData(event.target).get('message')})});
        root.biasV3.community.memberships[group.id] = {status:result.status, role:'member'};
        if (result.status === 'active') { root.biasV3.community.canViewPosts[group.id] = true; root.biasV3.community.inviteValid[group.id] = false; }
        delete root.biasV3.community.loadedGroups?.[`${group.id}:${inviteTokenValue}`];
        root.biasApp.showToast(result.status === 'pending' ? 'Beitrittsanfrage gesendet.' : 'Du bist jetzt Mitglied.');
        host.hidden = true; renderGroup(container, group.id);
      } catch (error) { root.biasApp.showToast(error.message || 'Die Anfrage konnte gerade nicht gespeichert werden.'); submit.disabled = false; }
    };
  }

  function renderGroup(container, groupId) {
    const state = root.biasV3.community;
    const inviteTokenValue = state.inviteTokens?.[groupId] || '';
    let group = [...(state.remoteGroups || []), ...localGroups()].find(item => item.id === groupId);
    if (!group) {
      const lookupKey = `${groupId}:${inviteTokenValue}`;
      state.lookupPending ||= {};
      if (!state.lookupPending[lookupKey]) {
        state.lookupPending[lookupKey] = true;
        container.innerHTML = '<div class="v3-empty-view"><p>Gruppe wird geladen …</p></div>';
        const inviteQuery = inviteTokenValue ? `&invite=${encodeURIComponent(inviteTokenValue)}` : '';
        api(`api/community?group=${encodeURIComponent(groupId)}${inviteQuery}`).then(result => {
          if (!result.group) throw new Error('Gruppe nicht gefunden.');
          state.remoteGroups = [...(state.remoteGroups || []), result.group];
          state.memberships[groupId] = result.membership;
          state.canViewPosts[groupId] = result.canViewPosts !== false;
          state.inviteValid[groupId] = result.inviteValid === true;
          state.posts[groupId] = result.posts || [];
          state.members[groupId] = result.members || [];
          state.joinRequests[groupId] = result.joinRequests || [];
          state.moderationLog[groupId] = result.moderationLog || [];
          renderGroup(container, groupId);
        }).catch(error => { state.lookupPending[lookupKey] = false; renderMissing(container, error.message || 'Community-Gruppe'); });
      }
      return;
    }
    const preview = Boolean(group.seed);
    const membership = preview ? null : (state.memberships?.[groupId] || (String(group.id).startsWith('local-') ? {status:'active', role:'owner'} : null));
    const inviteValid = Boolean(!preview && inviteTokenValue && state.inviteValid?.[groupId]);
    // A directory card must never briefly reveal a private pinboard while its
    // detail request is still in flight. Only an accepted membership (or the
    // local owner fallback) can render posts before the server confirms it.
    const canViewPosts = preview ? false : (state.canViewPosts?.[groupId] ?? (membership?.status === 'active'));
    const posts = state.posts?.[groupId] || localPosts()[groupId] || [];
    const visiblePosts = canViewPosts ? posts : [];
    const joinLabel = preview ? 'Vorschau' : membership?.status === 'active' ? 'Mitglied' : membership?.status === 'pending' ? 'Anfrage ausstehend' : inviteValid ? 'Einladung annehmen' : group.joinMode === 'request' ? 'Beitritt anfragen' : 'Beitreten';
    const canInvite = !preview && membership?.status === 'active' && ['owner', 'moderator'].includes(membership.role);
    const canModerate = canInvite;
    const joinRequests = state.joinRequests?.[groupId] || [];
    const moderationLog = state.moderationLog?.[groupId] || [];
    const members = state.members?.[groupId] || (String(group.id).startsWith('local-') && root.biasAccount?.profile ? [{userId:'local-owner', username:root.biasAccount.profile.username || 'musikfan', role:'owner', status:'active', avatarUrl:'', profilePrivate:false}] : []);
    const visibilityLabel = group.visibility === 'private' ? 'PRIVAT' : group.visibility === 'unlisted' ? 'UNLISTED' : group.joinMode === 'request' ? 'ÖFFENTLICH · REQUEST' : 'ÖFFENTLICH · OFFEN';
    container.innerHTML = `<div class="v3-group-detail"><a class="v3-back-link" href="#community">${icon('back')} Alle Gruppen</a><header class="v3-group-detail-header"><div class="v3-group-cover large">${esc(group.name.slice(0, 2).toUpperCase())}</div><div><p class="hero-eyebrow">${preview ? 'PRODUKTVORSCHAU' : visibilityLabel}</p><h1>${esc(group.name)}</h1><p>${esc(group.description)}</p><span class="section-note">${Number(group.memberCount || 0).toLocaleString('de-DE')} Mitglieder</span></div><div class="v3-group-header-actions"><button class="btn btn-accent" id="v3-join-group" ${preview || membership?.status ? 'disabled' : ''}>${joinLabel}</button>${canInvite ? '<button class="btn btn-ghost" id="v3-create-invite">Einladung erstellen</button>' : ''}</div></header><div id="v3-join-form" hidden></div><div class="v3-community-tabs"><button type="button" data-v3-pinboard class="is-active">Pinboard</button><button type="button" data-v3-chat>Chat <span class="pill pill-muted">später</span></button><button type="button" data-v3-playlists>Playlists &amp; Listen</button><button type="button" data-v3-guides>Guides <span class="pill pill-muted">später</span></button><button type="button" data-v3-members ${canViewPosts ? "" : "disabled"}>Mitglieder</button></div><section class="v3-community-notice"><strong>Moderierte Gruppe</strong><p>${preview ? 'Diese Beispielgruppe zeigt die geplante Community-Struktur. Echte Gruppen werden nach dem Launch über verifizierte Konten eröffnet.' : inviteValid ? 'Du hast eine gültige Einladung. Nach der Annahme werden Pinboard und Mitglieder sichtbar.' : membership?.status === 'pending' ? 'Deine Beitrittsanfrage wartet auf Moderation.' : canViewPosts ? 'Beiträge können gemeldet, entfernt und angepinnt werden. Current-Track-Karten benötigen später ein ausdrückliches Activity-Opt-in.' : 'Grundinfos sind öffentlich. Pinboard und Mitglieder werden nach bestätigtem Beitritt sichtbar.'}</p></section><section id="v3-members-panel" class="settings-card v3-members-panel" hidden><div class="section-heading-row"><div><p class="hero-eyebrow">GRUPPE · MITGLIEDER</p><h2>Mitglieder</h2></div><span class="section-note">${members.length} sichtbar</span></div>${canViewPosts ? (members.map(member => `<article class="v3-member-row"><div class="v3-post-avatar">${member.avatarUrl ? `<img src="${esc(member.avatarUrl)}" alt="" loading="lazy">` : esc(String(member.username || 'MF').slice(0, 2).toUpperCase())}</div><div><strong>${esc(member.username || 'Mitglied')}</strong><small>${member.role === 'owner' ? 'Owner' : member.role === 'moderator' ? 'Moderator' : 'Mitglied'}${member.profilePrivate ? ' · Profil privat' : ''}${member.status !== 'active' ? ` · ${esc(member.status)}` : ''}</small></div></article>`).join('') || '<p class="section-note">Noch keine Mitglieder geladen.</p>') : '<p class="section-note">Die Mitgliederliste wird nach deinem bestätigten Beitritt sichtbar.</p>'}</section><section class="v3-pinboard"><div class="section-heading-row"><div><p class="hero-eyebrow">PINBOARD</p><h2>Geteilte Musik</h2></div><button class="btn btn-ghost" id="v3-share-post" ${preview ? 'disabled' : ''}>＋ Beitrag</button></div><div id="v3-post-form" hidden></div><div class="v3-post-list">${visiblePosts.map(post => `<article class="v3-post"><div class="v3-post-avatar">${esc((post.author || 'MF').slice(0, 2).toUpperCase())}</div><div><strong>${esc(post.author || 'Mitglied')}</strong><small>${esc(post.createdAt || 'gerade eben')}</small><p>${esc(post.body)}</p>${post.linkUrl ? `<a href="${esc(post.linkUrl)}" target="_blank" rel="noopener nofollow ugc">Geteilten Link öffnen ↗</a>` : ''}<div class="v3-post-actions"><button type="button" class="text-action" data-v3-report-post="${esc(post.id || '')}">Melden</button><button type="button" class="text-action" data-v3-block-user="${esc(post.userId || '')}">Blockieren</button></div></div></article>`).join('') || `<div class="v3-empty-view"><h2>${canViewPosts ? 'Noch kein Pinboard' : 'Pinboard nach Beitritt'}</h2><p>${canViewPosts ? 'Teile einen bias.fm-Artist, Release, Song oder eine Playlist.' : 'Tritt der Gruppe bei, um moderierte Beiträge zu sehen und selbst zu teilen.'}</p></div>`}</div></section></div>`;
    if (canModerate) {
      const panel = root.document.createElement('section');
      panel.className = 'settings-card v3-moderation-panel';
      panel.dataset.v3Moderation = 'true';
      panel.innerHTML = `<div class="section-heading-row"><div><p class="hero-eyebrow">MODERATION</p><h2>Gruppenverwaltung</h2></div><span class="pill pill-muted">${joinRequests.length} offen</span></div>${joinRequests.length ? `<div class="v3-join-request-list">${joinRequests.map(item => `<article class="v3-join-request"><div><strong>${esc(item.username || 'Mitglied')}</strong><p>${esc(item.message || 'Keine Nachricht hinterlegt.')}</p><small>${esc(item.createdAt || '')}</small></div><div class="v3-moderation-actions"><button type="button" class="btn btn-accent btn-sm" data-v3-request="${esc(item.id)}" data-v3-decision="approve">Annehmen</button><button type="button" class="btn btn-ghost btn-sm" data-v3-request="${esc(item.id)}" data-v3-decision="reject">Ablehnen</button></div></article>`).join('')}</div>` : '<p class="section-note">Keine offenen Beitrittsanfragen.</p>'}${members.length ? `<div class="v3-member-management"><div class="section-heading-row"><div><p class="hero-eyebrow">ROLLEN &amp; SICHERHEIT</p><h3>Mitglieder verwalten</h3></div></div>${members.map(member => { const manageable = member.role !== 'owner' && !(member.role === 'moderator' && membership.role !== 'owner'); const action = member.status === 'banned' ? 'unban' : member.status === 'active' ? 'mute' : 'unban'; return `<article class="v3-member-row"><div class="v3-post-avatar">${member.avatarUrl ? `<img src="${esc(member.avatarUrl)}" alt="" loading="lazy">` : esc(String(member.username || 'MF').slice(0, 2).toUpperCase())}</div><div class="v3-member-copy"><strong>${esc(member.username || 'Mitglied')}</strong><small>${member.role === 'owner' ? 'Owner' : member.role === 'moderator' ? 'Moderator' : 'Mitglied'} · ${esc(member.status || 'active')}</small></div>${manageable ? `<div class="v3-moderation-actions"><button type="button" class="btn btn-ghost btn-sm" data-v3-member-action="${esc(action)}" data-v3-member-id="${esc(member.userId)}">${action === 'mute' ? '24 h stummschalten' : 'Entsperren'}</button>${action === 'mute' ? `<button type="button" class="btn btn-ghost btn-sm" data-v3-member-action="remove" data-v3-member-id="${esc(member.userId)}">Entfernen</button><button type="button" class="btn btn-ghost btn-sm" data-v3-member-action="ban" data-v3-member-id="${esc(member.userId)}">Sperren</button>` : ''}</div>` : ''}</article>`; }).join('')}</div>` : ''}<details class="v3-modlog"><summary>Moderationslog anzeigen</summary>${moderationLog.length ? `<ul>${moderationLog.slice(0, 20).map(item => `<li><strong>${esc(item.action)}</strong> · ${esc(item.target_type || item.targetId || '')} · ${esc(item.created_at || item.createdAt || '')}${item.reason ? ` · ${esc(item.reason)}` : ''}</li>`).join('')}</ul>` : '<p class="section-note">Noch keine Moderationsaktionen.</p>'}</details>`;
      container.querySelector('.v3-pinboard')?.before(panel);
      panel.querySelectorAll('[data-v3-request]').forEach(button => button.onclick = async () => {
        button.disabled = true;
        try {
          await api('api/community', {method:'POST', headers:formHeaders, body:JSON.stringify({action:'moderate-request', groupId, requestId:button.dataset.v3Request, decision:button.dataset.v3Decision})});
          delete state.loadedGroups?.[loadedKey];
          renderGroup(container, groupId);
        } catch (error) { root.biasApp.showToast(error.message || 'Die Beitrittsanfrage konnte nicht verarbeitet werden.'); button.disabled = false; }
      });
    }
    if (canModerate) {
      container.querySelectorAll('.v3-post').forEach(postElement => {
        const postId = postElement.querySelector('[data-v3-report-post]')?.dataset.v3ReportPost;
        const actions = postElement.querySelector('.v3-post-actions');
        if (!postId || !actions) return;
        actions.insertAdjacentHTML('beforeend', `<button type="button" class="text-action" data-v3-pin-post="${esc(postId)}">Anpinnen</button><button type="button" class="text-action" data-v3-remove-post="${esc(postId)}">Entfernen</button>`);
      });
      container.querySelectorAll('[data-v3-pin-post]').forEach(button => button.onclick = async () => {
        try { await api('api/community', {method:'POST', headers:formHeaders, body:JSON.stringify({action:'pin', groupId, postId:button.dataset.v3PinPost})}); delete state.loadedGroups?.[loadedKey]; renderGroup(container, groupId); }
        catch (error) { root.biasApp.showToast(error.message || 'Der Beitrag konnte nicht angepinnt werden.'); }
      });
      container.querySelectorAll('[data-v3-remove-post]').forEach(button => button.onclick = async () => {
        try { await api('api/community', {method:'POST', headers:formHeaders, body:JSON.stringify({action:'moderate-post', groupId, postId:button.dataset.v3RemovePost, decision:'remove', reason:'Moderationsentscheidung'})}); delete state.loadedGroups?.[loadedKey]; renderGroup(container, groupId); }
        catch (error) { root.biasApp.showToast(error.message || 'Der Beitrag konnte nicht entfernt werden.'); }
      });
      container.querySelectorAll('[data-v3-member-action]').forEach(button => button.onclick = async () => {
        const action = button.dataset.v3MemberAction; const userId = button.dataset.v3MemberId;
        if (!action || !userId) return;
        if (action === 'ban' && !root.document.defaultView?.confirm?.('Dieses Mitglied wirklich sperren?')) return;
        button.disabled = true;
        try { await api('api/community', {method:'POST', headers:formHeaders, body:JSON.stringify({action:'moderate-member', groupId, userId, decision:action, hours:24, reason:'Moderationsentscheidung'})}); delete state.loadedGroups?.[loadedKey]; renderGroup(container, groupId); }
        catch (error) { root.biasApp.showToast(error.message || 'Die Mitgliederentscheidung konnte nicht gespeichert werden.'); button.disabled = false; }
      });
    }
    container.querySelector('#v3-join-group').onclick = () => { if (preview) return root.biasApp.showToast('Diese Gruppe ist eine Vorschau und noch nicht beitretbar.'); showJoinRequestForm(container, group, inviteValid ? inviteTokenValue : ''); };
    container.querySelector('[data-v3-chat]').onclick = () => root.biasApp.showToast('Livechat wird nach Moderations- und Verifikationsfreigabe aktiviert.');
    container.querySelector('[data-v3-playlists]').onclick = () => root.biasApp.navigateTo('lists');
    container.querySelector('[data-v3-guides]').onclick = () => root.biasApp.showToast('Guides folgen mit Contributor-Rechten und Versionshistorie.');
    container.querySelector('[data-v3-members]')?.addEventListener('click', event => {
      const panel = container.querySelector('#v3-members-panel'); const pinboard = container.querySelector('.v3-pinboard'); const pinboardTab = container.querySelector('[data-v3-pinboard]'); if (!panel || !pinboard) return;
      const showing = !panel.hidden; panel.hidden = showing; pinboard.hidden = !showing; event.currentTarget.classList.toggle('is-active', !showing); pinboardTab?.classList.toggle('is-active', showing);
    });
    container.querySelector('#v3-share-post').onclick = () => { if (preview) return root.biasApp.showToast('Beiträge sind in der Beispielansicht deaktiviert.'); if (!root.biasAccount?.authenticated) return root.biasAccount?.openAuth('login'); if (membership?.status !== 'active') return root.biasApp.showToast('Tritt der Gruppe zuerst bei, um zu posten.'); showPostForm(container, group); };
    container.querySelector('#v3-create-invite')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const result = await api('api/community', {method:'POST', headers:formHeaders, body:JSON.stringify({action:'invite', groupId:group.id, expiresInDays:7, maxUses:1})});
        const inviteUrl = result.invite?.url || '';
        if (inviteUrl && root.navigator?.clipboard?.writeText) await root.navigator.clipboard.writeText(inviteUrl);
        root.biasApp.showToast(inviteUrl ? 'Einladungslink erstellt und kopiert.' : 'Einladungslink erstellt.');
      } catch (error) { root.biasApp.showToast(error.message || 'Der Einladungslink konnte nicht erstellt werden.'); }
      finally { button.disabled = false; }
    });
    container.querySelectorAll('[data-v3-report-post]').forEach(button => button.onclick = () => { if (!root.biasAccount?.authenticated) return root.biasAccount?.openAuth('login'); const reason = root.document.defaultView?.prompt?.('Warum möchtest du diesen Beitrag melden?', 'Unangemessener Inhalt'); if (!reason) return; api('api/moderation', {method:'POST', headers: formHeaders, body: JSON.stringify({action:'report', targetType:'community_post', targetId: button.dataset.v3ReportPost, reason})}).then(() => root.biasApp.showToast('Beitrag gemeldet.')).catch(error => root.biasApp.showToast(error.message)); });
    container.querySelectorAll('[data-v3-block-user]').forEach(button => button.onclick = () => { if (!root.biasAccount?.authenticated) return root.biasAccount?.openAuth('login'); const target = button.dataset.v3BlockUser; if (!target) return root.biasApp.showToast('Für diesen Eintrag ist kein Blockziel verfügbar.'); api('api/moderation', {method:'POST', headers: formHeaders, body: JSON.stringify({action:'block', userId: target})}).then(() => root.biasApp.showToast('Mitglied blockiert.')).catch(error => root.biasApp.showToast(error.message)); });
    const loadedGroups = state.loadedGroups || (state.loadedGroups = {});
    const loadedKey = `${groupId}:${inviteTokenValue}`;
    if (!preview && !loadedGroups[loadedKey]) {
      loadedGroups[loadedKey] = true;
      const inviteQuery = inviteTokenValue ? `&invite=${encodeURIComponent(inviteTokenValue)}` : '';
      api(`api/community?group=${encodeURIComponent(groupId)}${inviteQuery}`).then(result => { if (result.posts) { state.posts = {...state.posts, [groupId]: result.posts}; state.members[groupId] = result.members || []; state.memberships[groupId] = result.membership; state.canViewPosts[groupId] = result.canViewPosts !== false; state.inviteValid[groupId] = result.inviteValid === true; state.joinRequests[groupId] = result.joinRequests || []; state.moderationLog[groupId] = result.moderationLog || []; renderGroup(container, groupId); } }).catch(() => {});
    }
  }

  function showPostForm(container, group) {
    const host = container.querySelector('#v3-post-form'); host.hidden = false; host.innerHTML = `<form class="v3-post-form"><textarea class="text-input" name="body" maxlength="5000" required placeholder="Teile einen Gedanken oder einen Musiklink …"></textarea><input class="text-input" name="linkUrl" type="url" placeholder="Optionaler Link (Spotify, Apple Music, bias.fm …)"><div><button type="button" class="btn btn-ghost" data-v3-close>Abbrechen</button><button class="btn btn-accent" type="submit">Posten</button></div></form>`;
    host.querySelector('[data-v3-close]').onclick = () => { host.hidden = true; };
    host.querySelector('form').onsubmit = async event => { event.preventDefault(); if (!root.biasAccount?.authenticated) { root.biasAccount?.openAuth('login'); return; } const form = new FormData(event.target); const post = {id:`local-post-${Date.now()}`, body:form.get('body'),linkUrl:form.get('linkUrl'),author:root.biasAccount.profile.username,createdAt:'gerade eben'}; try { const result = await api('api/community',{method:'POST',headers:formHeaders,body:JSON.stringify({action:'post',groupId:group.id,body:post.body,linkUrl:post.linkUrl})}); Object.assign(post, result.post || {}); } catch (error) { root.biasApp.showToast(error.message || 'Der Beitrag konnte nicht gespeichert werden.'); return; } const all = localPosts(); all[group.id] = [post, ...(all[group.id] || [])]; write('biasfm_v3_posts', all); root.biasV3.community.posts = {...root.biasV3.community.posts, [group.id]: all[group.id]}; root.biasV3.community.groupId = group.id; renderCommunity(container); };
  }

  function renderSharedList(container, shareSlug) {
    const local = read('biasfm_v3_lists', []).find(item => item.shareSlug === shareSlug || item.share_slug === shareSlug);
    const paint = list => { if (!list) return renderMissing(container, 'Liste'); const items = list.items || []; container.innerHTML = `<div class="v3-lists-view"><a class="v3-back-link" href="#lists">${icon('back')} Meine Listen</a><header class="v3-release-header"><div class="v3-group-cover large">☷</div><div><p class="hero-eyebrow">GETEILTE LISTE · ${esc(list.visibility || 'public')}</p><h1>${esc(list.title)}</h1><p>${esc(list.description || 'Eine kuratierte Sammlung aus der bias.fm-Community.')}</p><span class="section-note">${items.length} Einträge · geteilt über bias.fm</span></div></header><section class="settings-card v3-shared-list-items"><div class="section-heading-row"><div><p class="hero-eyebrow">TRACKLISTE</p><h2>Gespeicherte Einträge</h2></div><span class="section-note">Quelle bleibt beim Originalanbieter</span></div>${items.map(item => { const target = item.kind === 'release' ? 'release' : item.kind === 'artist' ? 'artist' : 'song'; return `<div class="v3-saved-track"><span><strong>${esc(item.title || item.entityId || 'Eintrag')}</strong><small>${esc(item.artistName || '')}</small></span>${item.entityId ? `<a class="btn btn-ghost btn-sm" href="#${target}/${encodeURIComponent(item.entityId)}">Öffnen ${icon('arrow')}</a>` : ''}</div>`; }).join('') || '<p class="section-note">Diese Liste enthält noch keine Einträge.</p>'}</section></div>`; };
    if (local) paint(local);
    api(`api/lists?share=${encodeURIComponent(shareSlug)}`).then(result => paint(result.list)).catch(() => { if (!local) paint(null); });
  }

  function normalizeUserList(item) {
    if (!item || typeof item !== 'object') return null;
    const items = Array.isArray(item.items) ? item.items : [];
    const rawCount = item.itemCount ?? item.item_count;
    const parsedCount = Number(rawCount);
    const itemCount = Number.isFinite(parsedCount) ? Math.max(0, parsedCount, items.length) : items.length;
    return {...item, shareSlug: item.shareSlug || item.share_slug || '', itemCount, items};
  }

  function mergeUserLists(remote, local) {
    const merged = [];
    const indexByIdentity = new Map();
    const add = raw => {
      const item = normalizeUserList(raw);
      if (!item) return;
      const identity = item.id ? `id:${item.id}` : item.shareSlug ? `share:${item.shareSlug}` : '';
      const existingIndex = identity ? indexByIdentity.get(identity) : undefined;
      if (existingIndex === undefined) {
        const copy = {...item, items: [...item.items]};
        merged.push(copy);
        if (identity) indexByIdentity.set(identity, merged.length - 1);
        return;
      }
      const existing = merged[existingIndex];
      const seen = new Set(existing.items.map(entry => `${entry?.kind || 'song'}:${entry?.entityId || ''}`));
      existing.items.push(...item.items.filter(entry => {
        const key = `${entry?.kind || 'song'}:${entry?.entityId || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
      existing.itemCount = Math.max(existing.itemCount, item.itemCount, existing.items.length);
      if (!existing.description && item.description) existing.description = item.description;
      if (!existing.shareSlug && item.shareSlug) existing.shareSlug = item.shareSlug;
    };
    (Array.isArray(remote) ? remote : []).forEach(add);
    (Array.isArray(local) ? local : []).forEach(add);
    return merged;
  }

  function profileListsMarkup(lists) {
    const items = mergeUserLists(lists, []);
    if (!items.length) return `<div class="v3-profile-list-empty"><span class="v3-profile-list-empty-icon" aria-hidden="true">☷</span><div><h3>Deine Sammlung wartet</h3><p>Erstelle Listen mit Songs und Releases, die du behalten oder mit anderen teilen möchtest.</p></div><a class="btn btn-ghost btn-sm" href="#lists">Liste erstellen ${icon('arrow')}</a></div>`;
    const visible = items.slice(0, 3);
    const cards = visible.map(item => {
      const visibility = item.visibility || 'private';
      const visibilityLabel = {public:'öffentlich', followers:'nur Follower', private:'privat', unlisted:'unlisted'}[visibility] || visibility;
      const count = Number(item.itemCount ?? item.items.length ?? 0);
      const preview = item.items.slice(0, 3).map((entry, index) => { const safeEntry = entry && typeof entry === 'object' ? entry : {}; return `<div class="v3-profile-list-preview-row"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${esc(safeEntry.title || safeEntry.entityId || 'Eintrag')}</strong><small>${esc(safeEntry.artistName || (safeEntry.kind === 'release' ? 'Release' : 'Song'))}</small></div></div>`; }).join('') || '<p class="section-note">Noch keine Einträge. Füge Songs oder Releases von ihren Detailseiten hinzu.</p>';
      const shareSlug = item.shareSlug;
      const action = shareSlug && ['public', 'unlisted'].includes(visibility) ? `<a class="btn btn-ghost btn-sm" href="#lists/${encodeURIComponent(shareSlug)}">Liste öffnen ${icon('arrow')}</a>` : `<a class="btn btn-ghost btn-sm" href="#lists">Liste bearbeiten ${icon('arrow')}</a>`;
      return `<article class="v3-profile-list-card"><div class="v3-profile-list-meta"><span class="hero-eyebrow">${esc(visibilityLabel)}</span><span>${count.toLocaleString('de-DE')} ${count === 1 ? 'Eintrag' : 'Einträge'}</span></div><h3>${esc(item.title || 'Unbenannte Liste')}</h3><p>${esc(item.description || 'Eine kuratierte Sammlung aus deiner bias.fm-Sammlung.')}</p><div class="v3-profile-list-preview">${preview}</div><div class="v3-profile-list-actions">${action}</div></article>`;
    }).join('');
    const remaining = items.length - visible.length;
    return `${cards}${remaining > 0 ? `<a class="v3-profile-list-more" href="#lists">Weitere ${remaining.toLocaleString('de-DE')} ${remaining === 1 ? 'Liste' : 'Listen'} anzeigen ${icon('arrow')}</a>` : ''}`;
  }

  function profileListCountLabel(count) {
    const value = Math.max(0, Number(count) || 0);
    return `${value} ${value === 1 ? 'Liste' : 'Listen'}`;
  }

  function publicListRowMarkup(list) {
    const shareSlug = list.shareSlug || list.share_slug || '';
    const target = shareSlug ? `#lists/${encodeURIComponent(shareSlug)}` : '#lists';
    const count = Math.max(0, Number(list.itemCount ?? list.item_count ?? 0) || 0);
    return `<article class="v3-item-list-row"><span class="v3-item-list-icon" aria-hidden="true">☷</span><div class="v3-item-list-copy"><h3>${esc(list.title || 'Unbenannte Liste')}</h3><p>${esc(list.description || 'Eine öffentliche Sammlung aus der bias.fm-Community.')}</p><small>${count.toLocaleString('de-DE')} ${count === 1 ? 'Eintrag' : 'Einträge'}</small></div><a class="btn btn-ghost btn-sm" href="${target}">Öffnen ${icon('arrow')}</a></article>`;
  }

  function itemListsMarkup(result, itemKey, itemType) {
    const lists = (Array.isArray(result?.lists) ? result.lists : []).map(normalizeUserList).filter(Boolean);
    const total = Math.max(Number(result?.listCount || 0) || 0, lists.length);
    const itemLabel = itemType === 'release' ? 'Release' : itemType === 'artist' ? 'Artist' : 'Song';
    if (!total) return `<div class="v3-item-lists-empty"><span class="v3-item-list-icon" aria-hidden="true">☷</span><div><strong>Noch in keiner öffentlichen Liste</strong><p>Sei der Erste und füge diesen ${itemLabel} zu deiner eigenen Liste hinzu.</p></div></div>`;
    const more = Math.max(0, Number(result?.listMoreCount ?? total - lists.length) || 0);
    const allHref = `#lists?item_key=${encodeURIComponent(itemKey)}&item_type=${encodeURIComponent(itemType)}`;
    return `<div class="section-heading-row"><div><p class="hero-eyebrow">SAMMLUNGEN · COMMUNITY</p><h2>In öffentlichen Listen</h2><p class="section-note">Andere Mitglieder haben diesen ${itemLabel} in ihren Sammlungen gespeichert.</p></div><span class="pill pill-muted">${total.toLocaleString('de-DE')}</span></div><div class="v3-item-list-rows">${lists.map(publicListRowMarkup).join('')}</div>${more ? `<a class="v3-item-list-more" href="${allHref}">Weitere ${more.toLocaleString('de-DE')} ${more === 1 ? 'Liste' : 'Listen'} ${icon('arrow')}</a>` : ''}`;
  }

  function renderItemListDirectory(container, itemKey, itemType) {
    const source = itemType === 'artist' ? entity(itemKey) : song(itemKey);
    const itemLabel = itemType === 'release' ? 'Release' : itemType === 'artist' ? 'Artist' : 'Song';
    const itemTitle = itemType === 'artist' ? source?.name : itemType === 'release' ? source?.album || source?.title : source?.title;
    const backTarget = itemType === 'artist' ? `#artist/${encodeURIComponent(itemKey)}` : `#${itemType === 'release' ? 'release' : 'song'}/${encodeURIComponent(itemKey)}`;
    container.innerHTML = `<div class="v3-lists-view v3-item-list-directory"><a class="v3-back-link" href="${backTarget}">${icon('back')} Zurück zum ${itemLabel}</a><div class="view-header v3-view-header"><div><p class="hero-eyebrow">COMMUNITY · SAMMLUNGEN</p><h1 class="view-title">Listen mit ${esc(itemTitle || itemKey)}</h1><p class="view-subtitle">Öffentliche bias.fm-Listen, in denen dieser ${itemLabel} vorkommt.</p></div><a class="btn btn-ghost" href="#lists">Meine Listen ${icon('arrow')}</a></div><section class="settings-card v3-item-lists"><div class="section-heading-row"><div><p class="hero-eyebrow">ÖFFENTLICHE LISTEN</p><h2>Community-Sammlungen</h2></div><span class="pill pill-muted" data-v3-item-list-count>…</span></div><div class="v3-item-list-directory-body" data-v3-item-list-directory-body><p class="section-note">Öffentliche Listen werden geladen …</p></div></section></div>`;
    const body = container.querySelector('[data-v3-item-list-directory-body]');
    const count = container.querySelector('[data-v3-item-list-count]');
    const paint = result => {
      const lists = (Array.isArray(result?.lists) ? result.lists : []).map(normalizeUserList).filter(Boolean);
      const total = Math.max(Number(result?.listCount || 0) || 0, lists.length);
      if (count) count.textContent = total.toLocaleString('de-DE');
      if (body) body.innerHTML = lists.length ? `<div class="v3-item-list-rows">${lists.map(publicListRowMarkup).join('')}</div>${result?.nextOffset !== null && result?.nextOffset !== undefined ? '<p class="section-note">Weitere Listen werden nach und nach ergänzt.</p>' : ''}` : '<div class="v3-item-lists-empty"><span class="v3-item-list-icon" aria-hidden="true">☷</span><div><strong>Noch keine öffentliche Liste</strong><p>Diese Sammlung kann als Erste:r öffentlich angelegt werden.</p></div></div>';
    };
    api(`api/lists?item_key=${encodeURIComponent(itemKey)}&item_type=${encodeURIComponent(itemType)}&all=1`).then(paint).catch(() => { if (body) body.innerHTML = '<p class="section-note">Öffentliche Listen sind momentan nicht verfügbar.</p>'; });
  }

  function renderLists(container) {
    const state = root.biasV3.lists; const route = routeFromHash(); const shareSlug = route.id && !route.params.has('item_key') ? route.id : ''; if (shareSlug) return renderSharedList(container, shareSlug);
    const itemKey = route.params.get('item_key'); const itemType = route.params.get('item_type'); if (itemKey && ['artist', 'release', 'song'].includes(itemType)) return renderItemListDirectory(container, itemKey, itemType);
    const localData = read('biasfm_v3_lists', []); const local = (Array.isArray(localData) ? localData : []).map(normalizeUserList).filter(Boolean); const pending = state.pending;
    const paint = lists => { const items = lists || []; container.innerHTML = `<div class="v3-lists-view"><div class="view-header v3-view-header"><div><p class="hero-eyebrow">PROFIL · SAMMLUNG</p><h1 class="view-title">Meine Listen</h1><p class="view-subtitle">Jahreslisten, nächtliche Songs, K-R&amp;B-Einstiege — unbegrenzt viele private oder geteilte Listen.</p></div><button class="btn btn-accent" id="v3-new-list">＋ Liste erstellen</button></div>${pending ? `<div class="v3-community-notice" id="v3-pending-list-item"><strong>${icon('plus')} ${esc(pending.title)}</strong><p>${esc(pending.artistName)} · Wähle eine Liste, in der dieser Eintrag gespeichert werden soll.</p></div>` : ''}<div class="v3-community-notice"><strong>Vier Sichtbarkeiten</strong><p>Öffentlich, nur Follower, privat oder unlisted mit Share-Link. Kollaborative Listen kommen erst mit klaren Editrechten.</p></div><div class="v3-list-grid">${items.map(item => `<article class="v3-list-card" data-list-id="${esc(item.id || '')}"><p class="hero-eyebrow">${esc(item.visibility || 'private')}</p><h2>${esc(item.title)}</h2><p>${esc(item.description || 'Noch keine Beschreibung.')}</p><span>${Number(item.itemCount ?? item.items?.length ?? 0)} Einträge</span><div class="v3-list-actions">${pending ? `<button type="button" class="btn btn-accent btn-sm" data-v3-add-list="${esc(item.id || '')}">Hier speichern</button>` : ''}${item.shareSlug && ['public','unlisted'].includes(item.visibility) ? `<a class="btn btn-ghost btn-sm" href="#lists/${encodeURIComponent(item.shareSlug)}">Teilen ${icon('arrow')}</a>` : ''}</div></article>`).join('') || '<div class="v3-empty-view"><h2>Deine erste Liste wartet</h2><p>Speichere Releases und Songs aus ihren Detailseiten.</p></div>'}</div><div id="v3-list-form" hidden></div></div>`;
      container.querySelector('#v3-new-list').onclick = () => { if (!root.biasAccount?.authenticated) return root.biasAccount?.openAuth('login'); const host = container.querySelector('#v3-list-form'); host.hidden = false; host.innerHTML = `<form class="v3-create-form settings-card"><h2>Neue Liste</h2><label>Titel<input name="title" class="text-input" maxlength="120" required placeholder="Songs für nachts"></label><label>Beschreibung<textarea name="description" class="text-input" maxlength="500"></textarea></label><label>Sichtbarkeit<select name="visibility" class="select-input"><option value="private">Privat</option><option value="public">Öffentlich</option><option value="followers">Nur Follower</option><option value="unlisted">Unlisted</option></select></label><button class="btn btn-accent">Liste speichern</button></form>`; host.querySelector('form').onsubmit = async event => { event.preventDefault(); const form = new FormData(event.target); const list = {id:`local-list-${Date.now()}`,title:String(form.get('title') || ''),description:String(form.get('description') || ''),visibility:String(form.get('visibility') || 'private'),items:[],itemCount:0,shareSlug:`${slugForShare(listTitle(form.get('title')))}-${Math.random().toString(36).slice(2, 7)}`}; let remote = true; try { const result = await api('api/lists',{method:'POST',headers:formHeaders,body:JSON.stringify({action:'create-list',title:list.title,description:list.description,visibility:list.visibility})}); Object.assign(list, result.list || {}); } catch (error) { if (error?.status && error.status < 500) { root.biasApp.showToast(error.message || 'Die Liste konnte nicht erstellt werden.'); return; } remote = false; } const lists = read('biasfm_v3_lists', []); lists.unshift(list); write('biasfm_v3_lists', lists); renderLists(container); root.biasApp.showToast(`Liste ${remote ? 'erstellt' : 'lokal gespeichert; Server nicht erreichbar'}.`); }; };
      container.querySelectorAll('[data-v3-add-list]').forEach(button => button.onclick = async () => { const list = items.find(item => String(item.id) === button.dataset.v3AddList); if (!list || !pending) return; let remote = true; try { await api('api/lists',{method:'POST',headers:formHeaders,body:JSON.stringify({action:'add-item',listId:list.id,kind:pending.kind || 'song',entityId:pending.entityId,title:pending.title,artistName:pending.artistName})}); } catch (error) { if (error?.status && error.status < 500) { root.biasApp.showToast(error.message || 'Der Eintrag konnte nicht gespeichert werden.'); return; } remote = false; } const stored = read('biasfm_v3_lists', []); const target = stored.find(item => String(item.id) === String(list.id)); if (target) { target.items = target.items || []; if (!target.items.some(item => item.entityId === pending.entityId)) target.items.push({...pending}); target.itemCount = target.items.length; write('biasfm_v3_lists', stored); } state.pending = null; renderLists(container); root.biasApp.showToast(`Zur Liste hinzugefügt${remote ? '.' : ' (lokal; Server nicht erreichbar).'}`); });
    };
    paint(local);
    if (root.biasAccount?.authenticated) api('api/lists').then(result => { const remote = (result.lists || []).map(normalizeUserList).filter(Boolean); if (!remote.length) return; paint(mergeUserLists(remote, local)); }).catch(() => {});
  }

  function listTitle(value) { return String(value || 'liste').slice(0, 120); }
  function slugForShare(value) { return listTitle(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54) || 'liste'; }

  function renderSupport(container) {
    container.innerHTML = `<div class="v3-support-view"><div class="view-header v3-view-header"><div><p class="hero-eyebrow">BIAS.FM · SUPPORT</p><h1 class="view-title">Support bias.fm</h1><p class="view-subtitle">Unterstützung finanziert Katalogpflege, Quellenprüfung und Moderation — nie XP, Ranking oder Review-Sichtbarkeit.</p></div></div><section class="v3-support-grid"><article class="v3-support-card is-featured"><p class="hero-eyebrow">JETZT MÖGLICH</p><h2>Einmalige Unterstützung</h2><p>Eine ruhige Donation-Option kommt zuerst. Die Zahlungsanbindung wird erst nach Provider-, Rechts- und Datenschutzprüfung aktiviert.</p><button class="btn btn-accent" id="v3-support-interest" data-tier="donation">Interesse vormerken</button><small id="v3-support-status">Keine Zahlungsdaten werden hier erfasst.</small></article><article class="v3-support-card"><p class="hero-eyebrow">SPÄTER</p><h2>Supporter</h2><strong>1,49 € / Monat · 14,99 € / Jahr</strong><p>Profilrahmen, erweiterte private Stats und eine Vorschlags-Queue — kosmetisch/komfortorientiert.</p><span class="pill pill-muted">Zahlungsanbieter fehlt noch</span></article><article class="v3-support-card"><p class="hero-eyebrow">SPÄTER</p><h2>Premium</h2><strong>3,49 € / Monat · 34,99 € / Jahr</strong><p>Mehr Kosmetik, Beta-Zugriff und zusätzliche Filter. Keine gekaufte Reviewposition und keine Datenbearbeitung ohne Editorial-Review.</p><span class="pill pill-muted">Noch nicht buchbar</span></article></section><section class="v3-support-wall settings-card"><h2>Supporter Wall</h2><p>Nur opt-in, alphabetisch oder nach Dauer — nie nach gezahltem Betrag. Sichtbarkeit bleibt jederzeit abschaltbar.</p></section></div>`;
    container.querySelector('#v3-support-interest').onclick = async button => { if (!root.biasAccount?.authenticated) { root.biasAccount?.openAuth('login'); return; } const tier = button.currentTarget.dataset.tier; button.currentTarget.disabled = true; try { await api('api/support',{method:'POST',headers:formHeaders,body:JSON.stringify({tier,wallVisible:false})}); container.querySelector('#v3-support-status').textContent = 'Vormerkung gespeichert. Sobald ein geprüfter Zahlungsweg bereitsteht, informieren wir dich in der Inbox.'; root.biasApp.showToast('Support-Interesse gespeichert.'); } catch (error) { container.querySelector('#v3-support-status').textContent = error.message || 'Die Vormerkung konnte nicht gespeichert werden.'; root.biasApp.showToast(error.message || 'Die Vormerkung konnte nicht gespeichert werden.'); } finally { button.currentTarget.disabled = false; } };
  }

  function renderProfileV3(container) {
    const profile = root.biasStore.profile || {}; const ult = entity(profile.ultBiasArtist); const favorites = (profile.favoriteArtists || profile.biasLine || []).map(entity).filter(Boolean).slice(0, 10); const privacy = root.biasStore.privacySettings || profile.privacy || {};
    const savedTracks = [...(root.biasApp?.likedSongs || [])].map(id => song(id)).filter(Boolean);
    const localListData = read('biasfm_v3_lists', []); const localLists = (Array.isArray(localListData) ? localListData : []).map(normalizeUserList).filter(Boolean);
    const favoriteMarkup = favorites.map((item, index) => `<a class="favorite-artist-card${index >= 5 ? ' v3-favorite-extra' : ''}"${index >= 5 ? ' hidden' : ''} href="#artist/${encodeURIComponent(item.id)}">${cover(item.name, item.name)}<span>${esc(item.name)}</span><small>${esc((item.genres || []).slice(0,2).join(' · '))}</small></a>`).join('');
    const favoriteMore = favorites.length > 5 ? '<button type="button" class="btn btn-ghost v3-profile-favorites-more" data-v3-favorites-more aria-expanded="false">Mehr anzeigen</button>' : '';
    container.innerHTML = `<div class="view-profile v3-profile"><div class="view-header v3-view-header"><div><p class="hero-eyebrow">PROFIL · DEIN MUSIKGESCHMACK</p><h1 class="view-title">Mein Profil</h1><p class="view-subtitle">Eine ruhige Karte für Identität, Live Listening und Favoriten.</p></div><div class="header-actions"><a class="btn btn-accent" href="#settings">Profil bearbeiten ✎</a><a class="btn btn-ghost" href="#lists">Meine Listen</a></div></div><div class="v3-profile-grid"><section class="v3-profile-identity profile-display"><div class="profile-identity-row">${avatarMarkupV3(profile)}<div><h2>${esc(profile.username || 'musikfan')}</h2><p class="profile-handle-note">${root.biasAccount?.authenticated ? 'Zentrales Konto' : 'Lokal auf diesem Gerät'}</p></div></div><p class="profile-bio-v2">${esc(profile.bio || 'Musik, die bleibt. Dein Geschmack hat hier Platz.')}</p><dl class="profile-facts-v2"><div><dt>Favourite Artist</dt><dd>${esc(ult?.name || favorites[0]?.name || 'Noch offen')}</dd></div><div><dt>Privacy</dt><dd>${privacy.activity === 'public' ? 'Live Activity öffentlich' : 'Live Activity privat'}</dd></div></dl><div class="v3-profile-actions"><a class="btn btn-ghost" href="#stats">Stats ansehen ${icon('arrow')}</a><a class="btn btn-ghost" href="#saved">Gemerkt ${icon('arrow')}</a></div></section><section class="v3-profile-activity"><section id="profile-listening" class="settings-card profile-listening-card" aria-live="polite"></section><section class="settings-card v3-xp-card"><div class="section-heading-row"><div><p class="hero-eyebrow">ACCOUNT XP</p><h2>Level 1</h2></div><span class="v3-xp-value">0 XP</span></div><div class="v3-progress"><span style="width:12%"></span></div><p class="section-note">XP entsteht durch Rätsel, hilfreiche Reviews und bestätigte Vorschläge — nicht durch Geld oder Follow-Spam.</p><label class="v3-check v3-xp-optin"><input type="checkbox" id="v3-leaderboard-optin" ${root.biasAccount?.authenticated ? '' : 'disabled'}> Artist-Leaderboards freiwillig freigeben</label><p class="section-note v3-xp-optin-note">Nur dein Username und dein Artist-XP werden gezeigt; mindestens 20 Teilnehmer sind nötig.</p></section></section><section class="v3-profile-visual"><section class="settings-card v3-profile-art">${cover(ult?.name || profile.username || 'bias.fm', ult?.name || 'bias.fm', true)}</section><section class="settings-card"><div class="section-heading-row"><div><p class="hero-eyebrow">DEINE AUSWAHL</p><h2>Favourite Artists</h2></div><span class="pill pill-muted">${favorites.length} / 10</span></div><div class="favorite-artist-grid">${favoriteMarkup || '<p class="section-note">Wähle bis zu zehn Artists in deiner Profilbearbeitung.</p>'}</div>${favoriteMore}</section></section></div><section id="v3-profile-lists" class="settings-card v3-profile-lists"><div class="section-heading-row"><div><p class="hero-eyebrow">PROFIL · SAMMLUNG</p><h2>Meine Listen</h2><p class="section-note">Songs und Releases, die du gesammelt hast — privat, für Follower oder mit der Community geteilt.</p></div><div class="v3-profile-list-heading-actions"><span class="pill pill-muted" data-v3-profile-list-count>${profileListCountLabel(localLists.length)}</span><a class="btn btn-ghost btn-sm" href="#lists">Alle Listen ${icon('arrow')}</a></div></div><div class="v3-profile-list-grid" data-v3-profile-lists>${profileListsMarkup(localLists)}</div></section>${savedTracks.length ? `<section class="settings-card v3-saved-tracks"><div class="section-heading-row"><div><p class="hero-eyebrow">PRIVATE SAMMLUNG</p><h2>Gemerkt</h2></div><span class="pill pill-muted">${savedTracks.length}</span></div>${savedTracks.map(track => `<div class="v3-saved-track"><span>${esc(track.title)} · ${esc(track.artistName)}</span><button class="btn btn-ghost btn-sm" data-favorite-remove="${esc(track.id)}">Entfernen</button></div>`).join('')}</section>` : ''}<section id="v3-remote-saved" class="settings-card v3-saved-tracks" hidden></section><section class="settings-card v3-privacy-summary"><strong>Privatsphäre respektiert</strong><p>${privacy.showNowPlaying === false ? 'Dein aktueller Titel wird nicht angezeigt.' : privacy.activity === 'public' ? 'Live Listening ist für andere sichtbar.' : 'Live Listening bleibt nur für dich sichtbar.'} Ändere das jederzeit in den Profileinstellungen.</p></section></div>`;
    const favoritesMore = container.querySelector('[data-v3-favorites-more]');
    favoritesMore?.addEventListener('click', () => {
      const expanded = favoritesMore.getAttribute('aria-expanded') === 'true';
      container.querySelectorAll('.v3-favorite-extra').forEach(item => { item.hidden = expanded; });
      favoritesMore.setAttribute('aria-expanded', String(!expanded));
      favoritesMore.textContent = expanded ? 'Mehr anzeigen' : 'Weniger anzeigen';
    });
    const profileListsCard = container.querySelector('#v3-profile-lists');
    const profileListsHost = profileListsCard?.querySelector('[data-v3-profile-lists]');
    const profileListCount = profileListsCard?.querySelector('[data-v3-profile-list-count]');
    const paintProfileLists = remoteLists => {
      const lists = mergeUserLists(remoteLists, localLists);
      if (profileListsHost) profileListsHost.innerHTML = profileListsMarkup(lists);
      if (profileListCount) profileListCount.textContent = profileListCountLabel(lists.length);
    };
    paintProfileLists(localLists);
    const reviewsCard = root.document.createElement('section');
    reviewsCard.className = 'settings-card v3-profile-reviews';
    reviewsCard.innerHTML = `<div class="section-heading-row"><div><p class="hero-eyebrow">PROFIL · REVIEWS</p><h2>Meine Reviews</h2></div><span class="section-note">Nur für dich</span></div><div class="v3-profile-review-list"><p class="section-note">Deine Reviews werden geladen …</p></div>`;
    container.querySelector('.v3-profile')?.appendChild(reviewsCard);
    if (root.biasAccount?.authenticated) api('api/reviews?mine=1').then(result => { const list = reviewsCard.querySelector('.v3-profile-review-list'); if (!list) return; list.innerHTML = (result.items || []).map(item => `<article class="v3-profile-review"><div><strong>${Number(item.score).toFixed(1)} / 10</strong><small>${esc(item.entityType)} · ${esc(item.entityId)}</small></div>${ratingSegments(item.score)}${reviewBodyMarkup(item)}<a class="text-action" href="#${item.entityType === 'release' ? 'release' : 'song'}/${encodeURIComponent(item.entityId)}">Öffnen ${icon('arrow')}</a></article>`).join('') || '<p class="section-note">Du hast noch keine Review geschrieben.</p>'; }).catch(() => { const list = reviewsCard.querySelector('.v3-profile-review-list'); if (list) list.innerHTML = '<p class="section-note">Deine Reviews sind momentan nicht verfügbar.</p>'; });
    const remoteSavedCard = container.querySelector('#v3-remote-saved');
    if (root.biasAccount?.authenticated && remoteSavedCard) api('api/lists').then(result => {
      paintProfileLists(result.lists || []);
      const localKeys = new Set(savedTracks.map(item => `saved:${item.id}`));
      const items = (result.saved || []).map(item => ({itemKey: item.item_key, itemType: item.item_type, title: item.title, artistName: item.artist_name, kind: item.kind, createdAt: item.created_at})).filter(item => !localKeys.has(`${item.kind}:${item.itemKey}`));
      if (!items.length) return;
      remoteSavedCard.hidden = false;
      remoteSavedCard.innerHTML = `<div class="section-heading-row"><div><p class="hero-eyebrow">ZENTRALE SAMMLUNG</p><h2>Gemerkt &amp; Favourites</h2></div><span class="pill pill-muted">${items.length}</span></div>${items.map(item => `<div class="v3-saved-track"><span><strong>${item.kind === 'favorite' ? '♥ ' : '♡ '}${esc(item.title || item.itemKey)}</strong><small>${esc(item.artistName || '')} · ${item.kind === 'favorite' ? 'Favourite' : 'privat gemerkt'}</small></span><button class="btn btn-ghost btn-sm" data-v3-remote-remove="${esc(item.itemKey)}" data-v3-remote-kind="${esc(item.kind)}">Entfernen</button></div>`).join('')}`;
      remoteSavedCard.querySelectorAll('[data-v3-remote-remove]').forEach(button => button.onclick = async () => { try { await api('api/lists', {method:'POST', headers:formHeaders, body:JSON.stringify({action:button.dataset.v3RemoteKind === 'favorite' ? 'unfavorite' : 'unsave', itemKey:button.dataset.v3RemoteRemove})}); renderProfileV3(container); } catch (error) { root.biasApp.showToast(error.message || 'Eintrag konnte nicht entfernt werden.'); } });
    }).catch(() => {});
    if (root.biasConnections) root.biasConnections.mount(container, false);
    container.querySelectorAll('[data-favorite-remove]').forEach(button => button.onclick = () => { root.biasApp.toggleLike(button.dataset.favoriteRemove); renderProfileV3(container); });
    const leaderboardOptIn = container.querySelector('#v3-leaderboard-optin');
    leaderboardOptIn?.addEventListener('change', async event => {
      if (!root.biasAccount?.authenticated) { event.target.checked = false; root.biasAccount?.openAuth('login'); return; }
      const nextValue = event.target.checked;
      event.target.disabled = true;
      try { await api('api/xp', {method:'POST', headers:formHeaders, body:JSON.stringify({leaderboardOptIn: nextValue})}); root.biasApp.showToast(nextValue ? 'Artist-Ranglisten aktiviert.' : 'Artist-Ranglisten deaktiviert.'); }
      catch (error) { event.target.checked = !nextValue; root.biasApp.showToast(error.message || 'Die Einstellung konnte nicht gespeichert werden.'); }
      finally { event.target.disabled = false; }
    });
    api('api/xp').then(result => { const card = container.querySelector('.v3-xp-card'); if (!card) return; card.querySelector('h2').textContent = `Level ${result.level}`; card.querySelector('.v3-xp-value').textContent = `${Number(result.accountXp).toLocaleString('de-DE')} XP`; const previous = xpThreshold(result.level); const current = Math.max(0, Math.min(100, ((Number(result.accountXp) - previous) / Math.max(1, Number(result.nextLevelXp) - previous)) * 100)); card.querySelector('.v3-progress span').style.width = `${current}%`; const optin = card.querySelector('#v3-leaderboard-optin'); if (optin) optin.checked = Boolean(result.leaderboardOptIn); }).catch(() => {});
  }

  function avatarMarkupV3(profile) { const source = profile.avatarData || profile.avatarUrl; return `<span class="avatar-v2 avatar-header profile-avatar-v2">${source ? `<img src="${esc(source)}" alt="" loading="lazy">` : `<span>${esc(String(profile.username || 'MF').slice(0, 2).toUpperCase())}</span>`}</span>`; }

  function patchLanding() {
    const original = root.biasHomeView?.render; if (!original || original._v3) return;
    const render = function (container) { clearInterval(root.biasHomeView._timer); clearInterval(this._v3Timer); original.call(this, container); clearInterval(root.biasHomeView._timer); root.biasHomeView._timer = null; const preview = container.querySelector('.feature-preview'); if (!preview) return; const progress = root.document.createElement('div'); progress.className = 'v3-preview-progress'; progress.setAttribute('aria-hidden', 'true'); progress.innerHTML = '<span></span>'; preview.insertBefore(progress, preview.querySelector('.preview-tabs')); let paused = false; let index = 0; const tabs = [...preview.querySelectorAll('[data-preview-index]')]; const bar = progress.firstElementChild; const restart = () => { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = 'v3-preview-progress 7s linear forwards'; }; const show = next => { index = next; tabs[index]?.click(); restart(); }; const reduced = root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; const timer = reduced ? null : setInterval(() => { if (!paused && !root.document?.hidden) show((index + 1) % tabs.length); }, 7000); preview.addEventListener('mouseenter', () => { paused = true; bar.style.animationPlayState = 'paused'; }); preview.addEventListener('mouseleave', () => { paused = false; bar.style.animationPlayState = 'running'; }); preview.addEventListener('focusin', () => { paused = true; bar.style.animationPlayState = 'paused'; }); preview.addEventListener('focusout', () => { paused = false; bar.style.animationPlayState = 'running'; }); tabs.forEach((tab, i) => tab.addEventListener('click', () => { index = i; restart(); })); restart(); this._v3Timer = timer; };
    render._v3 = true; root.biasHomeView.render = render;
  }

  function patchCalendar() {
    const view = root.biasCalendarView; if (!view || view._v3) return;
    view.activeGenres = Array.isArray(view.activeGenres) ? view.activeGenres : [];
    view.activeReleaseType = view.activeReleaseType || 'Alle';
    const originalRender = view.render.bind(view);
    const originalFiltered = view.filteredComebacks.bind(view);
    const originalCalendarEntries = view.calendarEntries.bind(view);
    const originalUpdate = view.updateTimeline.bind(view);
    const originalReset = view.resetFilters?.bind(view);
    const genreMatches = (item, genre) => {
      const text = (item.genres || []).join(' ');
      if (genre === 'Idol Pop') return /idol|pop/i.test(text);
      if (genre === 'K-R&B / Soul') return /r&b|soul/i.test(text);
      if (genre === 'K-Hiphop') return /hiphop|hip hop/i.test(text);
      if (genre === 'Indie / Rock') return /indie|rock|band/i.test(text);
      if (genre === 'Electronic / Club') return /electronic|club|house/i.test(text);
      if (genre === 'Ballad / OST') return /ballad|ballade|ost/i.test(text);
      return true;
    };
    const typeMatches = (item, type) => {
      if (!type || type === 'Alle') return true;
      const value = String(item.type || '').toLowerCase();
      if (type === 'Single') return /single|digital/.test(value);
      if (type === 'EP') return /\bep\b|mini/.test(value);
      if (type === 'Album') return /album|full/.test(value);
      if (type === 'OST') return /ost|soundtrack/.test(value);
      if (type === 'Mixtape') return /mixtape|mix tape/.test(value);
      return value.includes(String(type).toLowerCase());
    };
    const enhanceCalendar = (container, calendar) => {
      if (!container || calendar.viewMode !== 'calendar') return;
      const entries = calendar.calendarEntries();
      container.querySelectorAll('[data-day]').forEach(day => {
        const dayItems = entries.filter(item => item.date === day.dataset.day);
        day.setAttribute('tabindex', '0');
        if (!dayItems.length || day.querySelector('.v3-calendar-popover')) return;
        day.insertAdjacentHTML('beforeend', `<span class="v3-calendar-popover" role="tooltip"><strong>${esc(new Date(`${day.dataset.day}T12:00:00Z`).toLocaleDateString('de-DE', {weekday:'long', day:'numeric', month:'long', timeZone:'UTC'}))}</strong>${dayItems.slice(0, 3).map(item => `<span><b>${esc(item.act)}</b><small>${esc(item.title)} · ${esc(item.type || 'Release')}</small></span>`).join('')}${dayItems.length > 3 ? `<small class="v3-calendar-more">+${dayItems.length - 3} weitere Releases</small>` : ''}</span>`);
      });
    };
    const applyV3Filters = items => items.filter(item => (!view.activeGenres.length || view.activeGenres.some(genre => genreMatches(item, genre))) && typeMatches(item, view.activeReleaseType));
    view.filteredComebacks = function () { return applyV3Filters(originalFiltered()); };
    view.calendarEntries = function () { return applyV3Filters(originalCalendarEntries()); };
    view.updateTimeline = function () { originalUpdate(); enhanceCalendar(root.document?.getElementById('timeline-container'), this); };
    if (originalReset) view.resetFilters = function () { this.activeGenres = []; this.activeReleaseType = 'Alle'; originalReset(); this.render(root.document?.getElementById('main-content')); };
    view.render = function (container) {
      originalRender(container);
      const bar = container.querySelector('.view-calendar .filter-bar');
      if (!bar || bar.querySelector('#v3-radar-genre-menu')) return;
      container.querySelector('#cal-genre-tabs')?.setAttribute('hidden', '');
      const menu = root.document.createElement('details');
      menu.id = 'v3-radar-genre-menu'; menu.className = 'v3-radar-genre-menu';
      const selected = this.activeGenres || [];
      const options = ['Idol Pop','K-R&B / Soul','K-Hiphop','Indie / Rock','Electronic / Club','Ballad / OST'];
      menu.innerHTML = `<summary>${selected.length ? `${selected.length} Genres` : 'Alle Musik'} <span aria-hidden="true">⌄</span></summary><div class="v3-radar-genre-popover"><strong>Genre</strong><label><input type="checkbox" data-v3-genre="all" ${selected.length ? '' : 'checked'}> Alle Musik</label>${options.map(option => `<label><input type="checkbox" data-v3-genre="${esc(option)}" ${selected.includes(option) ? 'checked' : ''}> ${esc(option)}</label>`).join('')}<div class="v3-radar-genre-actions"><button type="button" class="btn btn-ghost btn-sm" data-v3-clear>Alle löschen</button><button type="button" class="btn btn-accent btn-sm" data-v3-apply>Anwenden</button></div></div>`;
      bar.appendChild(menu);
      const all = menu.querySelector('[data-v3-genre="all"]');
      const boxes = [...menu.querySelectorAll('[data-v3-genre]')].filter(input => input !== all);
      all.onchange = () => { if (all.checked) boxes.forEach(input => { input.checked = false; }); };
      boxes.forEach(input => input.onchange = () => { if (input.checked) all.checked = false; if (!boxes.some(box => box.checked)) all.checked = true; });
      menu.querySelector('[data-v3-clear]').onclick = () => { all.checked = true; boxes.forEach(input => { input.checked = false; }); };
      menu.querySelector('[data-v3-apply]').onclick = () => { this.activeGenres = boxes.filter(input => input.checked).map(input => input.dataset.v3Genre); this.activeGenre = 'Alle'; menu.open = false; this.render(container); };
      const type = root.document.createElement('label');
      type.className = 'v3-radar-type-filter';
      type.innerHTML = `<span>Release-Typ</span><select id="v3-radar-release-type" class="select-input"><option ${this.activeReleaseType === 'Alle' ? 'selected' : ''}>Alle</option>${['Single','EP','Album','OST','Mixtape'].map(option => `<option ${this.activeReleaseType === option ? 'selected' : ''}>${option}</option>`).join('')}</select>`;
      bar.appendChild(type);
      type.querySelector('select').onchange = event => { this.activeReleaseType = event.target.value; this.render(container); };
      enhanceCalendar(container.querySelector('#timeline-container'), this);
    };
    view._v3 = true;
  }

  function patchCharts() {
    const view = root.biasChartsView; if (!view || view._v3) return; const original = view.render.bind(view); view.render = function (container) { original(container); if (this.source !== 'live') return; const rows = container.querySelectorAll('.live-chart-row'); rows.forEach((row, index) => { const first = row.querySelector('b'); const item = this.liveResult?.items?.[index]; if (first && !row.querySelector('.v3-live-cover')) { const title = row.querySelector('strong')?.textContent || 'Signal'; const artist = row.querySelector('.live-chart-artist')?.textContent || 'Last.fm'; const coverUrl = /^https:\/\//i.test(String(item?.coverUrl || '')) ? item.coverUrl : ''; const slot = row.querySelector('.live-chart-cover-slot'); if (slot) slot.insertAdjacentHTML('beforeend', `<span class="v3-live-cover">${coverUrl ? `<img src="${esc(coverUrl)}" alt="" loading="lazy" width="40" height="40">` : esc(title.slice(0, 2).toUpperCase())}</span>`); row.setAttribute('data-cover-state', item?.coverState || 'neutral-fallback'); row.setAttribute('aria-label', `${index + 1}. ${title} von ${artist}.${coverUrl ? ' Gematchtes Katalog-Cover.' : ' Neutrales Fallback-Cover.'}`); } }); }; view._v3 = true;
  }

  function patchHeader() {
    document.querySelectorAll('.desktop-nav, .drawer-nav').forEach(nav => { if (!nav.querySelector('[data-route="community"]')) nav.insertAdjacentHTML('beforeend', '<a href="#community" class="nav-link drawer-link" data-route="community">Community</a>'); });
  }

  function patchAccountMenu() {
    const doc = root.document; if (!doc) return;
    const menu = doc.querySelector('#account-menu .account-dropdown');
    if (!menu || menu.querySelector('[data-v3-account="lists"]')) return;
    const nav = menu.querySelector('.account-dropdown-nav');
    if (nav) nav.insertAdjacentHTML('beforeend', `<a class="account-menu-item" role="menuitem" data-v3-account="lists" href="#lists"><span class="account-menu-icon">☷</span><span class="account-menu-label">Meine Listen</span><span class="account-menu-arrow">›</span></a>`);
    const divider = menu.querySelector('.account-menu-divider');
    if (divider) divider.insertAdjacentHTML('beforebegin', `<a class="account-menu-item account-menu-support" role="menuitem" data-v3-account="support" href="#support"><span class="account-menu-icon">✦</span><span class="account-menu-label">Support bias.fm</span><span class="account-menu-arrow">›</span></a>`);
  }

  function patchSecuritySettings(container) {
    const doc = root.document; const form = container?.querySelector?.('#profile-edit-form');
    if (!doc || !form || form.querySelector('[data-v3-security]')) return;
    const section = doc.createElement('section');
    section.className = 'profile-edit-section v3-security-section';
    section.dataset.v3Security = 'true';
    section.innerHTML = `<h2>6. Konto-Sicherheit</h2><div class="v3-verification-status" role="status" aria-live="polite">E-Mail-Status wird geprüft …</div><button type="button" class="btn btn-ghost" data-v3-send-verification>Bestätigungs-E-Mail senden</button><p class="section-note">Eine bestätigte E-Mail schützt Gruppenbeiträge und hilft bei der Kontowiederherstellung. Der Link ist 30 Minuten gültig.</p>`;
    const saveBar = form.querySelector('.form-save-bar');
    if (saveBar) form.insertBefore(section, saveBar); else form.appendChild(section);
    const status = section.querySelector('.v3-verification-status');
    const button = section.querySelector('[data-v3-send-verification]');
    const paint = result => {
      if (!root.biasAccount?.authenticated) {
        status.textContent = 'Melde dich an, um deine E-Mail-Adresse zu bestätigen.';
        button.textContent = 'Anmelden';
        return;
      }
      if (result.verified) { status.textContent = 'E-Mail-Adresse bestätigt.'; button.hidden = true; return; }
      status.textContent = result.configured ? 'E-Mail-Adresse noch nicht bestätigt.' : 'E-Mail-Versand ist auf diesem Server noch nicht konfiguriert.';
      button.disabled = !result.configured;
    };
    if (root.biasAccount?.authenticated) api('api/auth/verification').then(paint).catch(() => { status.textContent = 'E-Mail-Status momentan nicht verfügbar.'; }); else paint({verified:false, configured:false});
    button.onclick = async () => {
      if (!root.biasAccount?.authenticated) { root.biasAccount?.openAuth('login'); return; }
      button.disabled = true;
      try { const result = await api('api/auth/verification', {method:'POST', headers:formHeaders}); status.textContent = result.message || 'Bestätigungs-E-Mail angefordert.'; }
      catch (error) { status.textContent = error.message || 'Die Anfrage konnte nicht verarbeitet werden.'; }
      finally { button.disabled = false; }
    };
  }

  function routeFromHash() {
    const raw = String(root.location?.hash || '').replace(/^#/, '');
    const [path, query = ''] = raw.split('?');
    const parts = path.split('/');
    return {route: parts[0] || '', id: decodeURIComponent(parts[1] || ''), params: new URLSearchParams(query)};
  }

  function installRoutes() {
    const app = root.biasApp; if (!app || app._v3Installed) return; app._v3Installed = true; const originalInit = app.init.bind(app); app.init = function () { originalInit(); patchHeader(); patchAccountMenu(); this.views.catalog = {render: renderDiscover}; this.views.entdecken = {render: renderDiscover}; this.views.community = {render: container => { const route = routeFromHash(); root.biasV3.community.groupId = route.id; root.biasV3.community.inviteTokens[route.id] = route.params.get('invite') || ''; renderCommunity(container); }}; this.views.artist = {render: container => renderArtist(container, routeFromHash().id)}; this.views.release = {render: container => renderSong(container, routeFromHash().id, true)}; this.views.song = {render: container => renderSong(container, routeFromHash().id, false)}; this.views.lists = {render: renderLists}; this.views.support = {render: renderSupport}; this.views.profile = {render: renderProfileV3}; const settingsView = this.views.settings; if (settingsView && !settingsView._v3) { const originalSettingsRender = settingsView.render.bind(settingsView); settingsView.render = container => { originalSettingsRender(container); patchSecuritySettings(container); }; settingsView._v3 = true; } const hashRoute = routeFromHash().route; if (this.views[hashRoute]) this.navigateTo(hashRoute, false); const Observer = root.MutationObserver; if (Observer) { const observer = new Observer(() => { try { patchAccountMenu(); patchSecuritySettings(root.document?.querySelector('#main-content')); } catch {} }); const target = root.document?.body; if (target) observer.observe(target, {childList:true, subtree:true}); } };
  }

  root.biasV3 = {discover:{tab:'artists',query:'',scene:'Alle',genre:'Alle',type:'Alle',period:'Alle',sort:'Relevanz',pageSize:100}, community:{groupId:'',query:'',mode:'discover',loaded:false,mineLoaded:false,remoteMine:[],posts:{},members:{},loadedGroups:{},memberships:{},canViewPosts:{},joinRequests:{},moderationLog:{},inviteTokens:{},inviteValid:{},lookupPending:{}}, lists:{}};
  patchLanding(); patchCalendar(); patchCharts(); installRoutes();
})(window);
