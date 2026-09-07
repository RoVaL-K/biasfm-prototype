// js/v2.js — Improvement V2 interaction layer
//
// This file keeps the original prototype modules small while adding the V2
// product pass: the Ocean Ink art direction, a real theme menu, richer artist
// discovery, ten favorite slots, member-aware bias selection, local follows,
// notification inbox and the account-ready header.

(function (root) {
  'use strict';

  // data.js intentionally keeps the catalog as a global lexical binding. Expose
  // the same object on window so this interaction layer can use one source too.
  if (!root.BIAS_DATA && typeof BIAS_DATA !== 'undefined') root.BIAS_DATA = BIAS_DATA;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const safeJson = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value === null ? fallback : value;
    } catch { return fallback; }
  };
  const putJson = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  };
  const catalogArtist = id => (root.BIAS_DATA?.artists || []).find(artist => artist.id === id);
  const catalogMember = id => (root.BIAS_DATA?.people || []).find(person => person.id === id);
  const catalogEntity = id => catalogArtist(id) || catalogMember(id);
  const currentPageIsTest = () => /jsdom/i.test(navigator.userAgent || '');

  const THEME_META = [
    {id: 'dark', label: 'Ocean Ink', note: 'Standard', colors: ['#081318', '#2FD3A4', '#4EA8DE']},
    {id: 'night', label: 'Seoul Night', note: 'Coral / Ink', colors: ['#17121d', '#F27669', '#E5B65A']},
    {id: 'light', label: 'Warm Paper', note: 'Paper / Seafoam', colors: ['#F2F0E8', '#167D78', '#E5B65A']},
    {id: 'holographic', label: 'Holographic Pop', note: 'Optional', colors: ['#100B1D', '#A78BFA', '#FF6FBE']},
    {id: 'jewel', label: 'Deep Jewel', note: 'Optional', colors: ['#170B15', '#D86B8A', '#E5B65A']}
  ];

  function artistLinks(artist) {
    if (!artist) return [];
    const q = encodeURIComponent(artist.name);
    const searchLinks = [
      ['youtube', 'YouTube', `https://www.youtube.com/results?search_query=${q}`],
      ['spotify', 'Spotify', `https://open.spotify.com/search/${q}`],
      ['apple', 'Apple Music', `https://music.apple.com/search?term=${q}`],
      ['namu', 'Namu Wiki', `https://namu.wiki/Search?q=${q}`],
      ['kprofiles', 'Kprofiles', `https://kprofiles.com/?s=${q}`],
      ['fandom', 'K-pop Fandom', `https://kpop.fandom.com/wiki/Special:Search?query=${q}`]
    ].map(([id, label, url]) => ({id, label, url, verificationStatus: 'suggested'}));
    const musicbrainz = artist.mbid ? [{id: 'musicbrainz', label: 'MusicBrainz', url: `https://musicbrainz.org/artist/${encodeURIComponent(artist.mbid)}`, verificationStatus: 'official'}] : [];
    return [...musicbrainz, ...searchLinks];
  }

  function ensureCatalog() {
    if (!root.BIAS_DATA) return;
    const people = [];
    (root.BIAS_DATA.artists || []).forEach(artist => {
      artist.links = artist.links || artistLinks(artist);
      artist.roles = Array.isArray(artist.roles) ? artist.roles : ['performer'];
      artist.fandomVerification = artist.fandomName ? 'editorial' : 'unknown';
      if (!Array.isArray(artist.members)) return;
      artist.members = artist.members.map((member, index) => {
        const id = member.id || `member-${artist.id}-${String(member.name).toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || index}`;
        const person = {...member, id, type: 'person', memberOf: artist.id, roles: ['performer']};
        people.push(person);
        return person;
      });
    });
    root.BIAS_DATA.people = people;
  }

  function entityName(entity) {
    return entity?.type === 'person' ? entity.name : entity?.name || '';
  }

  function entitySubtitle(entity) {
    if (!entity) return '';
    if (entity.type === 'person') {
      const group = catalogArtist(entity.memberOf);
      return `Mitglied von ${group?.name || 'einer Gruppe'}${entity.role ? ` · ${entity.role}` : ''}`;
    }
    return `${entity.hangul || ''} · ${entity.type === 'group' ? 'Gruppe' : 'Solo-Act'} · ${(entity.genres || []).slice(0, 2).join(' · ')}`;
  }

  function entityVisual(entity, large = false) {
    const name = entityName(entity) || 'bias.fm';
    const group = entity?.type === 'person' ? catalogArtist(entity.memberOf) : entity;
    return root.biasUI.cover(name, group?.name || 'bias.fm', large);
  }

  function setupLocalV2Store() {
    if (!root.biasStore) return;
    const profile = root.biasStore.profile || {};
    const favoriteArtists = Array.isArray(profile.favoriteArtists)
      ? profile.favoriteArtists.filter(Boolean).slice(0, 10)
      : (Array.isArray(profile.biasLine) ? profile.biasLine.filter(Boolean).slice(0, 10) : []);
    profile.favoriteArtists = favoriteArtists;
    profile.biasLine = favoriteArtists.slice();
    if (!Array.isArray(profile.privacy)) profile.privacy = profile.privacy && typeof profile.privacy === 'object' ? profile.privacy : {};
    if (!profile.notificationPrefs || typeof profile.notificationPrefs !== 'object') profile.notificationPrefs = {};
    if (typeof profile.avatarData !== 'string') profile.avatarData = '';

    root.biasStore.followedArtists = new Set(safeJson('biasfm_followed_artists', []).filter(id => catalogArtist(id)));
    root.biasStore.followPreferences = safeJson('biasfm_follow_preferences', {});
    root.biasStore.localNotifications = safeJson('biasfm_notifications', []).filter(item => item && item.id);
    root.biasStore.blockedUsers = new Set(safeJson('biasfm_blocked_users', []).filter(Boolean));
    root.biasStore.privacySettings = {
      profile: 'public', stats: 'private', activity: 'private', follows: 'public', favorites: 'public',
      ...(safeJson('biasfm_privacy', {}) || {}), ...(profile.privacy || {})
    };
    root.biasStore.notificationSettings = {
      release: true, announcement: false, reminder: true, social: false, product: true,
      ...(safeJson('biasfm_notification_prefs', {}) || {}), ...(profile.notificationPrefs || {})
    };

    const persistProfile = updates => {
      root.biasStore.updateProfile(updates);
      root.biasStore.profile.favoriteArtists = Array.isArray(root.biasStore.profile.favoriteArtists)
        ? root.biasStore.profile.favoriteArtists.slice(0, 10) : [];
      root.biasStore.profile.biasLine = root.biasStore.profile.favoriteArtists.slice();
    };
    root.biasStore.updateV2Profile = persistProfile;
    root.biasStore.isArtistFollowed = id => root.biasStore.followedArtists.has(id);
    root.biasStore.toggleArtistFollow = id => {
      if (!catalogArtist(id)) return false;
      const next = new Set(root.biasStore.followedArtists);
      const followed = !next.has(id);
      if (followed) next.add(id); else next.delete(id);
      root.biasStore.followedArtists = next;
      putJson('biasfm_followed_artists', [...next]);
      const artist = catalogArtist(id);
      root.biasStore.addLocalNotification({
        id: `follow-${id}-${Date.now()}`,
        kind: 'social',
        title: followed ? `${artist.name} gefolgt` : `${artist.name} nicht mehr gefolgt`,
        body: followed ? 'Release-Hinweise bleiben in deiner Inbox.' : 'Du erhältst dafür keine neuen Hinweise mehr.',
        createdAt: new Date().toISOString(), read: false
      });
      root.biasStore.emit('followChange', next);
      return followed;
    };
    root.biasStore.setFollowPreferences = (id, prefs) => {
      root.biasStore.followPreferences = {...root.biasStore.followPreferences, [id]: {...(root.biasStore.followPreferences[id] || {}), ...prefs}};
      putJson('biasfm_follow_preferences', root.biasStore.followPreferences);
    };
    root.biasStore.addLocalNotification = item => {
      const next = [{...item, id: item.id || `notice-${Date.now()}`, createdAt: item.createdAt || new Date().toISOString(), read: Boolean(item.read)}, ...root.biasStore.localNotifications].slice(0, 100);
      root.biasStore.localNotifications = next;
      putJson('biasfm_notifications', next);
      root.biasStore.emit('notificationsChange', next);
    };
    root.biasStore.getNotifications = () => root.biasStore.localNotifications.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    root.biasStore.unreadNotifications = () => root.biasStore.localNotifications.filter(item => !item.read).length;
    root.biasStore.markNotificationRead = id => {
      root.biasStore.localNotifications = root.biasStore.localNotifications.map(item => item.id === id ? {...item, read: true} : item);
      putJson('biasfm_notifications', root.biasStore.localNotifications);
      root.biasStore.emit('notificationsChange', root.biasStore.localNotifications);
    };
    root.biasStore.markAllNotificationsRead = () => {
      root.biasStore.localNotifications = root.biasStore.localNotifications.map(item => ({...item, read: true}));
      putJson('biasfm_notifications', root.biasStore.localNotifications);
      root.biasStore.emit('notificationsChange', root.biasStore.localNotifications);
    };
    root.biasStore.setPrivacySettings = values => {
      root.biasStore.privacySettings = {...root.biasStore.privacySettings, ...values};
      putJson('biasfm_privacy', root.biasStore.privacySettings);
      persistProfile({privacy: root.biasStore.privacySettings});
    };
    root.biasStore.setNotificationSettings = values => {
      root.biasStore.notificationSettings = {...root.biasStore.notificationSettings, ...values};
      putJson('biasfm_notification_prefs', root.biasStore.notificationSettings);
      persistProfile({notificationPrefs: root.biasStore.notificationSettings});
    };
    root.biasStore.blockUser = id => {
      const next = new Set(root.biasStore.blockedUsers); next.add(String(id)); root.biasStore.blockedUsers = next;
      putJson('biasfm_blocked_users', [...next]);
    };
  }

  function avatarMarkup(profile, className = '') {
    const avatar = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(profile?.avatarData || '')
      ? `<img src="${esc(profile.avatarData)}" alt="" loading="lazy">`
      : `<span>${esc(String(profile?.username || 'MF').slice(0, 2).toUpperCase())}</span>`;
    return `<span class="avatar-v2 ${className}">${avatar}</span>`;
  }

  function renderThemeMenu() {
    const menu = document.getElementById('theme-menu');
    if (!menu) return;
    const current = root.biasStore.theme;
    const meta = THEME_META.find(item => item.id === current) || THEME_META[0];
    menu.innerHTML = `<summary aria-label="Erscheinungsbild wählen"><span class="theme-swatch-stack">${meta.colors.map(color => `<i style="background:${color}"></i>`).join('')}</span><span class="theme-menu-label">Theme</span></summary><div class="theme-dropdown" role="menu"><p class="theme-dropdown-title">Erscheinungsbild</p>${THEME_META.map(item => `<button type="button" role="menuitemradio" aria-checked="${item.id === current}" class="theme-choice ${item.id === current ? 'is-active' : ''}" data-theme-choice="${item.id}"><span class="theme-choice-swatches">${item.colors.map(color => `<i style="background:${color}"></i>`).join('')}</span><span><strong>${esc(item.label)}</strong><small>${esc(item.note)}</small></span><b aria-hidden="true">${item.id === current ? '✓' : ''}</b></button>`).join('')}<p class="theme-dropdown-note">Das Produkt-Theme verändert die Oberfläche. Dein Profil-Akzent bleibt unabhängig.</p></div>`;
  }

  function headerAccountMarkup() {
    const account = root.biasAccount;
    if (account?.authenticated && account.profile) {
      const count = root.biasStore.unreadNotifications();
      return `<details class="account-menu" id="account-menu"><summary aria-label="${esc(account.profile.username)} öffnen">${avatarMarkup(account.profile, 'avatar-header')}<span class="account-name">${esc(account.profile.username)}</span><span aria-hidden="true">⌄</span></summary><div class="account-dropdown"><p class="account-dropdown-name">${esc(account.profile.username)}</p><a href="#profile">Mein Profil</a><a href="#stats">Meine Stats</a><a href="#saved">Gemerkt</a><a href="#notifications">Benachrichtigungen${count ? ` · ${Math.min(count, 9)}${count > 9 ? '+' : ''}` : ''}</a><a href="#settings">Einstellungen</a><hr><button type="button" data-action="logout-account">Abmelden</button></div></details>`;
    }
    return `<button type="button" class="header-login" data-action="open-login">Login</button>`;
  }

  function renderHeader() {
    const account = document.getElementById('account-control');
    if (account) account.innerHTML = headerAccountMarkup();
    const notify = document.getElementById('notifications-control');
    const active = Boolean(root.biasAccount?.authenticated || root.biasStore.followedArtists?.size || root.biasStore.unreadNotifications());
    if (notify) {
      notify.hidden = !active;
      notify.innerHTML = `<button type="button" class="notification-trigger" data-route="notifications" aria-label="Benachrichtigungen${root.biasStore.unreadNotifications() ? `, ${root.biasStore.unreadNotifications()} ungelesen` : ''}"><span aria-hidden="true">♢</span>${root.biasStore.unreadNotifications() ? `<b>${root.biasStore.unreadNotifications() > 9 ? '9+' : root.biasStore.unreadNotifications()}</b>` : ''}</button>`;
    }
    renderThemeMenu();
  }

  function setupHeader() {
    const oldAccount = document.querySelector('.account-menu');
    if (oldAccount && !document.getElementById('account-control')) oldAccount.outerHTML = '<div id="account-control"></div>';
    const oldTheme = document.getElementById('theme-toggle-btn');
    if (oldTheme && !document.getElementById('theme-menu')) oldTheme.outerHTML = '<details class="theme-menu" id="theme-menu"></details>';
    const actions = document.querySelector('.header-right-actions');
    if (actions && !document.getElementById('notifications-control')) {
      const holder = document.createElement('div'); holder.id = 'notifications-control'; holder.hidden = true; actions.insertBefore(holder, document.getElementById('mobile-menu-toggle'));
    }
    document.addEventListener('click', event => {
      const themeChoice = event.target.closest('[data-theme-choice]');
      if (themeChoice) {
        root.biasStore.setTheme(themeChoice.dataset.themeChoice);
        renderThemeMenu();
        document.getElementById('theme-menu')?.removeAttribute('open');
        root.biasApp.showToast(`Theme: ${THEME_META.find(item => item.id === themeChoice.dataset.themeChoice)?.label || 'gespeichert'}`);
      }
      const action = event.target.closest('[data-action="open-login"]');
      if (action) { event.preventDefault(); root.biasAccount?.openAuth('login'); }
      const logout = event.target.closest('[data-action="logout-account"]');
      if (logout) { event.preventDefault(); root.biasAccount?.logout(); }
      const route = event.target.closest('[data-route="notifications"]');
      if (route) { event.preventDefault(); root.biasApp.navigateTo('notifications'); }
    });
    root.biasStore.subscribe('profileChange', renderHeader);
    root.biasStore.subscribe('themeChange', renderThemeMenu);
    root.biasStore.subscribe('followChange', renderHeader);
    root.biasStore.subscribe('notificationsChange', renderHeader);
    root.biasStore.subscribe('notificationsChange', () => {
      if (root.biasApp?.currentRoute === 'notifications') renderNotifications(document.getElementById('main-content'));
    });
    renderHeader();
  }

  function authModal(mode = 'login') {
    const signup = mode === 'signup';
    const modal = root.biasModals.createModalContainer(`<div class="modal-header"><span class="pill pill-accent">${signup ? 'Neues Konto' : 'Willkommen zurück'}</span><h2>${signup ? 'Dein bias.fm-Konto' : 'Bei bias.fm anmelden'}</h2><p>${signup ? 'Synchronisiere Profil, Follows und Benachrichtigungen über deine Geräte.' : 'Deine lokale Profilkarte bleibt auch ohne Konto nutzbar.'}</p></div><form id="account-auth-form" class="studio-form"><label class="form-label" for="account-email">E-Mail</label><input class="text-input" id="account-email" type="email" autocomplete="email" required><label class="form-label" for="account-password">Passwort</label><input class="text-input" id="account-password" type="password" minlength="10" autocomplete="${signup ? 'new-password' : 'current-password'}" required>${signup ? '<label class="form-label" for="account-username">Username</label><input class="text-input" id="account-username" pattern="[a-z0-9_-]{3,20}" minlength="3" maxlength="20" required><p class="section-note">3–20 Kleinbuchstaben, Zahlen, - oder _.</p>' : ''}<button class="btn btn-accent" type="submit">${signup ? 'Konto erstellen' : 'Anmelden'}</button><p id="account-auth-error" class="inline-error" role="alert" hidden></p></form><div class="auth-switch"><span>${signup ? 'Schon ein Konto?' : 'Noch kein Konto?'}</span><button type="button" class="text-action" id="account-auth-switch">${signup ? 'Anmelden' : 'Konto erstellen'}</button></div><p class="section-note">Du kannst weiterhin alle lokalen Funktionen ohne Konto verwenden. Keine Newsletter und keine automatische Veröffentlichung.</p>`);
    modal.querySelector('#account-auth-switch').onclick = () => authModal(signup ? 'login' : 'signup');
    modal.querySelector('#account-auth-form').onsubmit = async event => {
      event.preventDefault();
      const error = modal.querySelector('#account-auth-error');
      const button = modal.querySelector('button[type="submit"]'); button.disabled = true; error.hidden = true;
      try {
        const payload = {email: modal.querySelector('#account-email').value.trim(), password: modal.querySelector('#account-password').value};
        if (signup) payload.username = modal.querySelector('#account-username').value.trim();
        const result = signup ? await root.biasAccount.signup(payload) : await root.biasAccount.login(payload);
        if (result) { root.biasModals.closeCurrentModal(); root.biasApp.showToast(signup ? 'Konto erstellt.' : 'Willkommen zurück.'); root.biasApp.navigateTo('profile'); }
      } catch (err) { error.textContent = err.message; error.hidden = false; }
      finally { button.disabled = false; }
    };
    modal.querySelector('#account-email').focus();
    return modal;
  }

  const account = {
    authenticated: false,
    profile: null,
    async loadRemoteState() {
      if (!this.authenticated || !root.biasApi) return;
      try {
        const [follows, notifications] = await Promise.all([
          root.biasApi.request('api/follows/artists'),
          root.biasApi.request('api/notifications')
        ]);
        const followItems = Array.isArray(follows.items) ? follows.items : [];
        root.biasStore.followedArtists = new Set(followItems.map(item => item.artistId).filter(id => catalogArtist(id)));
        root.biasStore.followPreferences = Object.fromEntries(followItems.map(item => [item.artistId, {release: item.release !== false, announcement: item.announcement === true}]));
        putJson('biasfm_followed_artists', [...root.biasStore.followedArtists]);
        putJson('biasfm_follow_preferences', root.biasStore.followPreferences);
        const remoteItems = Array.isArray(notifications.items) ? notifications.items.map(item => ({...item, remote: true})) : [];
        const localOnly = root.biasStore.localNotifications.filter(item => !remoteItems.some(remote => remote.id === item.id));
        root.biasStore.localNotifications = [...remoteItems, ...localOnly].slice(0, 100);
        putJson('biasfm_notifications', root.biasStore.localNotifications);
        root.biasStore.emit('notificationsChange', root.biasStore.localNotifications);
        root.biasStore.emit('followChange', root.biasStore.followedArtists);
      } catch {}
    },
    async refresh() {
      if (!root.biasApi || !/pages\.dev|github\.io/.test(location.hostname)) return;
      try {
        const result = await root.biasApi.request('api/auth/me');
        this.authenticated = Boolean(result.authenticated); this.profile = result.profile || null;
        if (this.authenticated && this.profile) syncProfileFromAccount(this.profile);
        if (this.authenticated) await this.loadRemoteState();
      } catch { this.authenticated = false; this.profile = null; }
      renderHeader();
    },
    openAuth(mode) { return authModal(mode); },
    async login(payload) {
      if (!root.biasApi) throw Error('Die Konto-Verbindung ist noch nicht eingerichtet.');
      const result = await root.biasApi.request('api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
      this.authenticated = true; this.profile = result.profile; syncProfileFromAccount(this.profile); await this.loadRemoteState(); renderHeader(); return result;
    },
    async signup(payload) {
      if (!root.biasApi) throw Error('Die Konto-Verbindung ist noch nicht eingerichtet.');
      const result = await root.biasApi.request('api/auth/signup', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
      this.authenticated = true; this.profile = result.profile; syncProfileFromAccount(this.profile); await this.loadRemoteState(); renderHeader(); return result;
    },
    async logout() {
      try { await root.biasApi?.request('api/auth/logout', {method: 'POST'}); } catch {}
      this.authenticated = false; this.profile = null; renderHeader(); root.biasApp.showToast('Du bist abgemeldet.');
    },
    async syncProfile() {
      if (!this.authenticated || !this.profile || !root.biasApi) return;
      try { const result = await root.biasApi.request('api/auth/profile', {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(root.biasStore.profile)}); this.profile = result.profile || this.profile; renderHeader(); }
      catch (error) { root.biasApp.showToast(`Profil lokal gespeichert: ${error.message}`); }
    },
    async followArtist(id, followed) {
      if (!this.authenticated || !root.biasApi) return;
      try { await root.biasApi.request('api/follows/artists', {method: followed ? 'POST' : 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({artistId: id, release: true, announcement: Boolean(root.biasStore.followPreferences[id]?.announcement)})}); }
      catch (error) { root.biasApp.showToast(error.message); }
    },
    async markNotificationRead(id) {
      if (!this.authenticated || !root.biasApi) return;
      try { await root.biasApi.request('api/notifications', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id})}); } catch {}
    },
    async markAllNotificationsRead() {
      if (!this.authenticated || !root.biasApi) return;
      try { await root.biasApi.request('api/notifications?all=true', {method: 'POST'}); } catch {}
    }
  };
  root.biasAccount = account;

  function syncProfileFromAccount(remote) {
    if (!remote || !root.biasStore) return;
    try {
      root.biasStore.updateProfile({
        username: remote.username || root.biasStore.profile.username,
        bio: remote.bio || '',
        avatarData: remote.avatarData || '',
        ultBiasArtist: remote.ultBiasArtist || '',
        ultBiasMember: remote.ultBiasMember || '',
        favoriteArtists: Array.isArray(remote.favoriteArtists) ? remote.favoriteArtists.slice(0, 10) : [],
        biasLine: Array.isArray(remote.favoriteArtists) ? remote.favoriteArtists.slice(0, 10) : [],
        privacy: remote.privacy || root.biasStore.privacySettings,
        notificationPrefs: remote.notificationPrefs || root.biasStore.notificationSettings
      });
    } catch {}
  }

  function renderNotifications(container) {
    const items = root.biasStore.getNotifications();
    container.innerHTML = `<div class="view-notifications"><div class="view-header"><div><p class="hero-eyebrow">Deine Inbox</p><h1 class="view-title">Benachrichtigungen</h1><p class="view-subtitle">Eine ruhige Übersicht für Follows, Releases und direkte Aktionen.</p></div>${items.some(item => !item.read) ? '<button class="btn btn-ghost" id="mark-all-notifications">Alle gelesen</button>' : ''}</div><section class="notification-inbox" aria-live="polite">${items.length ? items.map(item => `<article class="notification-item ${item.read ? '' : 'is-unread'}" data-notification-id="${esc(item.id)}"><span class="notification-icon" aria-hidden="true">${item.kind === 'release' ? '●' : item.kind === 'product' ? '✦' : '○'}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.body || '')}</p><small>${new Date(item.createdAt).toLocaleString('de-DE')}</small></div>${item.read ? '' : '<span class="notification-dot" aria-label="ungelesen"></span>'}</article>`).join('') : '<div class="notification-empty"><h2>Deine Inbox ist ruhig.</h2><p>Folge einem Artist, um relevante Release-Hinweise hier zu sammeln.</p><a class="btn btn-accent" href="#catalog">Artists entdecken →</a></div>'}</section></div>`;
    container.querySelector('#mark-all-notifications')?.addEventListener('click', () => { root.biasStore.markAllNotificationsRead(); root.biasAccount?.markAllNotificationsRead(); renderNotifications(container); });
    container.querySelectorAll('[data-notification-id]').forEach(item => item.addEventListener('click', () => { root.biasStore.markNotificationRead(item.dataset.notificationId); root.biasAccount?.markNotificationRead(item.dataset.notificationId); item.classList.remove('is-unread'); item.querySelector('.notification-dot')?.remove(); renderHeader(); }));
  }
  root.biasNotificationsView = {render: renderNotifications};

  function favoriteIds(profile) {
    return (Array.isArray(profile.favoriteArtists) ? profile.favoriteArtists : profile.biasLine || []).filter(Boolean).slice(0, 10);
  }

  function renderProfile(container) {
    const p = root.biasStore.profile || {};
    const ult = catalogArtist(p.ultBiasArtist) || catalogMember(p.ultBiasArtist);
    const ultArtist = ult?.type === 'person' ? catalogArtist(ult.memberOf) : ult;
    const favorites = favoriteIds(p).map(catalogEntity).filter(Boolean);
    const visibleFavorites = favorites.slice(0, root.biasProfileView.favoriteExpanded ? 10 : 5);
    const label = ult?.type === 'person' ? 'Ult / Lieblingsperson' : 'Ult / Lieblingsact';
    container.innerHTML = `<div class="view-profile v2-profile"><div class="view-header"><div><p class="hero-eyebrow">Fan Identity</p><h1 class="view-title">Mein Profil</h1><p class="view-subtitle">Dein Geschmack in einer ruhigen, teilbaren Karte.</p></div><div class="header-actions"><a href="#settings" class="btn btn-accent">Profil bearbeiten ✎</a>${root.biasAccount?.authenticated ? '<a href="#notifications" class="btn btn-ghost">Inbox →</a>' : ''}</div></div><section class="profile-display profile-display-v2"><div class="profile-display-copy"><div class="profile-identity-row">${avatarMarkup(p, 'profile-avatar-v2')}<div><h2>${esc(p.username || 'musikfan')}</h2><p class="profile-handle-note">${root.biasAccount?.authenticated ? 'Zentrales Konto' : 'Lokal auf diesem Gerät'}</p></div></div><p class="profile-bio-v2">${esc(p.bio || 'Musik, die bleibt. Dein Geschmack hat hier Platz.')}</p><dl class="profile-facts-v2"><div><dt>${label}</dt><dd>${esc(entityName(ult) || 'Noch offen')}${ult?.type === 'person' ? ` · ${esc(ultArtist?.name || '')}` : ''}</dd></div><div><dt>Bias</dt><dd>${esc(p.ultBiasMember || 'Optional bei Gruppen')}</dd></div></dl><div class="profile-privacy-note">${p.privacy?.profile === 'private' || root.biasStore.privacySettings?.profile === 'private' ? 'Privates Profil' : 'Profil sichtbar nach deinen Einstellungen'}</div></div><div class="profile-art-v2" aria-hidden="true">${entityVisual(ultArtist || ult || {name: p.username}, true)}</div></section><section class="profile-favorites-v2 settings-card"><div class="section-heading-row"><div><p class="hero-eyebrow">Deine Auswahl</p><h2>Favourite Artists</h2></div><span class="pill pill-muted">${favorites.length} / 10</span></div><div class="favorite-artist-grid">${visibleFavorites.map(entity => `<button type="button" class="favorite-artist-card" data-favorite-entity="${esc(entity.id)}">${entityVisual(entity)}<span>${esc(entityName(entity))}</span><small>${esc(entitySubtitle(entity))}</small></button>`).join('') || '<p class="section-note">Wähle bis zu zehn Artists oder Gruppenmitglieder in deiner Profilbearbeitung.</p>'}</div>${favorites.length > 5 ? `<button type="button" class="btn btn-ghost" id="toggle-favorite-artists">${root.biasProfileView.favoriteExpanded ? 'Weniger anzeigen ↑' : 'Mehr anzeigen ↓'}</button>` : ''}</section><div class="profile-links-row"><a class="btn btn-ghost" href="#stats">Meine Stats →</a><a class="btn btn-ghost" href="#saved">Gemerkt (${root.biasApp.likedSongs.size}) →</a><a class="btn btn-ghost" href="#notifications">Benachrichtigungen${root.biasStore.unreadNotifications() ? ` · ${root.biasStore.unreadNotifications()}` : ''} →</a></div><section id="profile-favorites" class="settings-card"></section></div>`;
    root.biasProfileView.favorites(container.querySelector('#profile-favorites'), 6);
    container.querySelector('#toggle-favorite-artists')?.addEventListener('click', () => { root.biasProfileView.favoriteExpanded = !root.biasProfileView.favoriteExpanded; renderProfile(container); });
    container.querySelectorAll('[data-favorite-entity]').forEach(button => button.addEventListener('click', () => { const entity = catalogEntity(button.dataset.favoriteEntity); if (entity?.type === 'person') root.biasModals.openMemberModal(entity.id); else root.biasModals.openArtistModal(entity?.id); }));
    if (root.biasConnections) root.biasConnections.mount(container, false);
  }

  function profileFavoriteOptions(selected) {
    const artists = (root.BIAS_DATA.artists || []).map(artist => `<button type="button" class="favorite-option ${selected.has(artist.id) ? 'is-selected' : ''}" data-favorite-id="${esc(artist.id)}">${entityVisual(artist)}<span><strong>${esc(artist.name)}</strong><small>${esc(entitySubtitle(artist))}</small></span><b aria-hidden="true">${selected.has(artist.id) ? '✓' : '+'}</b></button>`);
    const people = (root.BIAS_DATA.people || []).map(person => `<button type="button" class="favorite-option favorite-person-option ${selected.has(person.id) ? 'is-selected' : ''}" data-favorite-id="${esc(person.id)}">${entityVisual(person)}<span><strong>${esc(person.name)}</strong><small>${esc(entitySubtitle(person))}</small></span><b aria-hidden="true">${selected.has(person.id) ? '✓' : '+'}</b></button>`);
    return [...artists, ...people].join('');
  }

  function renderProfileEdit(container) {
    const p = root.biasStore.profile || {};
    const favorites = new Set(favoriteIds(p));
    const ult = catalogArtist(p.ultBiasArtist);
    root.biasProfileView.draftColor = p.accentColor || '#38bdf8';
    root.biasProfileView.draftFandom = p.fandomName || 'Eigener Profil-Akzent';
    root.biasProfileView.draftAvatar = p.avatarData || '';
    container.innerHTML = `<div class="view-profile v2-profile-edit"><div class="view-header"><div><div class="pill-row"><span class="pill pill-accent">Fan Identity</span><span class="pill pill-muted">${root.biasAccount?.authenticated ? 'Zentrales Konto' : 'Lokal gespeichert'}</span></div><h1 class="view-title">Profil bearbeiten</h1><p class="view-subtitle">Grundprofil, Musikidentität, Theme und Sichtbarkeit an einem Ort.</p></div><a href="#profile" class="btn btn-ghost">Zurück zum Profil</a></div><div class="profile-edit-layout-v2"><form id="profile-edit-form" class="settings-card"><section class="profile-edit-section"><h2>1. Grundprofil</h2><div class="avatar-upload-row"><div id="avatar-preview">${avatarMarkup(p, 'profile-avatar-upload')}</div><div><label class="btn btn-ghost" for="profile-avatar-input">Avatar auswählen</label><input id="profile-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" hidden><p class="section-note">JPG, PNG oder WebP · maximal 5 MB · quadratische Vorschau.</p><p id="avatar-upload-status" class="section-note">Lade nur Bilder hoch, die dir gehören oder die du verwenden darfst. Unzulässige Inhalte können entfernt werden.</p></div></div><label class="form-label" for="prof-username">Username</label><input id="prof-username" class="text-input" value="${esc(String(p.username || 'musikfan').toLowerCase())}" minlength="3" maxlength="20" pattern="[a-z0-9_-]{3,20}" required><label class="form-label" for="prof-bio">Bio</label><textarea id="prof-bio" class="text-input profile-bio-input" maxlength="360" rows="5" placeholder="Zeilenumbrüche bleiben erhalten.">${esc(p.bio || '')}</textarea><p class="section-note">Bis zu 360 Zeichen. HTML und Markdown werden als Text behandelt.</p></section><section class="profile-edit-section"><h2>2. Musikidentität</h2><label class="form-label" for="prof-ult-artist">Ult / Lieblingsact</label><select id="prof-ult-artist" class="select-input"><option value="">Kein Lieblingsact gewählt</option>${(root.BIAS_DATA.artists || []).map(artist => `<option value="${esc(artist.id)}" ${artist.id === p.ultBiasArtist ? 'selected' : ''}>${esc(artist.name)} (${esc(artist.hangul)})</option>`).join('')}</select><div id="member-select-group" ${ult?.members?.length ? '' : 'hidden'}><label class="form-label" for="prof-ult-member">Bias · Gruppenmitglied (optional)</label><select id="prof-ult-member" class="select-input"><option value="">Kein Bias ausgewählt</option>${(ult?.members || []).map(member => `<option value="${esc(member.id)}" ${member.id === p.biasMemberId || member.name === p.ultBiasMember ? 'selected' : ''}>${esc(member.name)} (${esc(member.hangul)})</option>`).join('')}</select><p class="section-note">Bias ist ein optionales Mitgliedsfeld und kein weiterer beliebiger Act.</p></div><label class="form-label">Favourite Artists <span class="pill pill-muted" id="favorite-count">${favorites.size} / 10</span></label><div id="favorite-artist-selector" class="favorite-option-list">${profileFavoriteOptions(favorites)}</div><p class="section-note">Artists und Gruppenmitglieder können unabhängig voneinander gewählt werden.</p></section><section class="profile-edit-section"><h2>3. Erscheinungsbild</h2><label class="form-label" for="profile-theme">Produkt-Theme</label><select id="profile-theme" class="select-input">${THEME_META.map(item => `<option value="${item.id}" ${root.biasStore.theme === item.id ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select><p class="section-note">Ocean Ink, Warm Paper und Seoul Night sind die aktiv kuratierten Swatches. Dein Profil-Akzent bleibt getrennt.</p><label class="form-label" for="profile-accent-hex">Profil-Akzent</label><div class="inline-form"><input id="profile-accent-hex" class="text-input" value="${esc(root.biasProfileView.draftColor)}" maxlength="7" pattern="#[0-9a-fA-F]{6}"><button type="button" class="btn btn-ghost" id="apply-profile-accent">Vorschau anwenden</button></div><div class="fandom-swatches-grid">${(root.BIAS_DATA.fandomColors || []).map(color => `<button type="button" class="fandom-swatch-card ${color.color.toLowerCase() === root.biasProfileView.draftColor.toLowerCase() ? 'is-active' : ''}" data-color="${color.color}" data-name="${esc(color.name)}"><span class="color-preview-circle" style="background:${color.color}"></span><span class="swatch-meta"><strong>${esc(color.name)}</strong><small>${esc(color.fandom)}</small></span></button>`).join('')}</div><p id="profile-accent-status" class="section-note" role="status">Kontrast wird geprüft …</p></section><section class="profile-edit-section"><h2>4. Privatsphäre</h2><div class="privacy-grid"><label>Profil auffindbar<select class="select-input" data-privacy="profile"><option value="public">Öffentlich</option><option value="followers">Nur eingeloggte Nutzer</option><option value="private">Privat</option></select></label><label>Aggregierte Stats<select class="select-input" data-privacy="stats"><option value="public">Öffentlich</option><option value="followers">Follower</option><option value="private">Privat</option></select></label><label>Listening Activity<select class="select-input" data-privacy="activity"><option value="private">Nur ich</option><option value="followers">Follower</option><option value="public">Öffentlich</option></select></label><label>Followlisten<select class="select-input" data-privacy="follows"><option value="public">Öffentlich</option><option value="followers">Follower</option><option value="private">Nur ich</option></select></label><label>Favourite Artists<select class="select-input" data-privacy="favorites"><option value="public">Öffentlich</option><option value="followers">Follower</option><option value="private">Privat</option></select></label></div><p class="section-note">Private Angaben werden auch serverseitig nicht in öffentlichen Antworten ausgegeben.</p></section><section class="profile-edit-section"><h2>5. Benachrichtigungen</h2><div class="notification-preferences">${[['release','Neue Releases'],['announcement','Ankündigungen'],['reminder','Gemerkte Termine'],['social','Social'],['product','Produkt & Stats']].map(([id,label]) => `<label><input type="checkbox" data-notification-pref="${id}"> ${label}</label>`).join('')}</div><p class="section-note">Keine Browser-Pushs. E-Mail bleibt auf wichtige Konto-/Sicherheitsmails begrenzt.</p></section><div class="form-save-bar"><button type="submit" class="btn btn-accent btn-lg">Änderungen speichern</button></div></form></div></div>`;
    const setPrivacy = root.biasStore.privacySettings || {};
    container.querySelectorAll('[data-privacy]').forEach(select => { select.value = setPrivacy[select.dataset.privacy] || select.querySelector('option')?.value; });
    container.querySelectorAll('[data-notification-pref]').forEach(input => { input.checked = root.biasStore.notificationSettings[input.dataset.notificationPref] !== false; });
    const artistSelect = container.querySelector('#prof-ult-artist');
    const memberGroup = container.querySelector('#member-select-group');
    const memberSelect = container.querySelector('#prof-ult-member');
    const updateMembers = () => {
      const artist = catalogArtist(artistSelect.value);
      memberGroup.hidden = !artist?.members?.length;
      memberSelect.innerHTML = `<option value="">Kein Bias ausgewählt</option>${(artist?.members || []).map(member => `<option value="${esc(member.id)}">${esc(member.name)} (${esc(member.hangul)})</option>`).join('')}`;
      if (p.biasMemberId || p.ultBiasMember) memberSelect.value = p.biasMemberId || artist?.members?.find(member => member.name === p.ultBiasMember)?.id || '';
    };
    artistSelect.onchange = updateMembers;
    container.querySelectorAll('[data-favorite-id]').forEach(button => button.addEventListener('click', () => {
      const selected = container.querySelectorAll('[data-favorite-id].is-selected');
      if (button.classList.contains('is-selected')) button.classList.remove('is-selected');
      else if (selected.length < 10) button.classList.add('is-selected');
      else { root.biasApp.showToast('Maximal 10 Favourite Artists.'); return; }
      const count = container.querySelectorAll('[data-favorite-id].is-selected').length;
      container.querySelector('#favorite-count').textContent = `${count} / 10`;
      button.querySelector('b').textContent = button.classList.contains('is-selected') ? '✓' : '+';
    }));
    const input = container.querySelector('#profile-avatar-input');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const status = container.querySelector('#avatar-upload-status');
      if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { status.textContent = 'Bitte eine JPG-, PNG- oder WebP-Datei bis 5 MB wählen.'; status.classList.add('inline-error'); input.value = ''; return; }
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          if (image.width > 2000 || image.height > 2000) { status.textContent = 'Das Ausgangsbild darf maximal 2000 × 2000 Pixel groß sein.'; status.classList.add('inline-error'); return; }
          const size = 512, canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; const ctx = canvas.getContext('2d');
          const scale = Math.max(size / image.width, size / image.height), width = image.width * scale, height = image.height * scale;
          ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
          root.biasProfileView.draftAvatar = canvas.toDataURL('image/webp', .84);
          container.querySelector('#avatar-preview').innerHTML = avatarMarkup({username: p.username, avatarData: root.biasProfileView.draftAvatar}, 'profile-avatar-upload');
          status.textContent = 'Vorschau bereit. Das Bild wird quadratisch zugeschnitten.'; status.classList.remove('inline-error');
        };
        image.onerror = () => { status.textContent = 'Die Bilddatei konnte nicht gelesen werden.'; status.classList.add('inline-error'); };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    };
    container.querySelectorAll('.fandom-swatch-card').forEach(button => button.addEventListener('click', () => root.biasProfileView.selectColor(button.dataset.color, button.dataset.name)));
    container.querySelector('#apply-profile-accent').onclick = () => { const value = container.querySelector('#profile-accent-hex').value.trim(); if (!root.biasStore.isContrastSafe(value)) { root.biasProfileView.updateAccentStatus(container, 'Diese Farbe braucht mehr Kontrast zur Produktfläche.'); return; } root.biasProfileView.selectColor(value, 'Eigener Profil-Akzent'); };
    container.querySelector('#profile-accent-hex').oninput = () => root.biasProfileView.updateAccentStatus(container);
    container.querySelector('#profile-edit-form').onsubmit = event => { event.preventDefault(); root.biasProfileView.saveProfile(); };
    updateMembers();
    root.biasProfileView.updateAccentStatus(container);
    if (root.biasConnections) root.biasConnections.mount(container, true);
  }

  function patchProfileView() {
    if (!root.biasProfileView) return;
    root.biasProfileView.favoriteExpanded = false;
    root.biasProfileView.render = renderProfile;
    root.biasProfileView.renderEdit = renderProfileEdit;
    const originalSelect = root.biasProfileView.selectColor.bind(root.biasProfileView);
    root.biasProfileView.selectColor = function (color, name) { this.draftColor = color; this.draftFandom = name; originalSelect(color, name); };
    root.biasProfileView.saveProfile = function () {
      const usernameInput = document.getElementById('prof-username');
      const username = usernameInput?.value.trim() || '';
      const bio = document.getElementById('prof-bio')?.value.slice(0, 360) || '';
      const artist = document.getElementById('prof-ult-artist')?.value || '';
      const memberId = document.getElementById('prof-ult-member')?.value || '';
      const member = catalogMember(memberId);
      const selected = [...document.querySelectorAll('[data-favorite-id].is-selected')].map(button => button.dataset.favoriteId).slice(0, 10);
      const accent = document.getElementById('profile-accent-hex')?.value.trim() || this.draftColor;
      if (!/^[a-z0-9_-]{3,20}$/.test(username)) { root.biasApp.showToast('Bitte 3–20 Kleinbuchstaben, Zahlen, - oder _ verwenden.'); usernameInput?.focus(); return; }
      if (!root.biasStore.isContrastSafe(accent)) { root.biasApp.showToast('Bitte eine Profilfarbe mit ausreichendem Kontrast wählen.'); return; }
      try {
        root.biasStore.updateV2Profile({username, bio, accentColor: accent, fandomName: this.draftFandom || 'Eigener Profil-Akzent', ultBiasArtist: artist, biasMemberId: memberId, ultBiasMember: member?.name || '', favoriteArtists: selected, biasLine: selected, avatarData: this.draftAvatar || ''});
        root.biasStore.setTheme(document.getElementById('profile-theme')?.value || 'dark');
        root.biasStore.setPrivacySettings(Object.fromEntries([...document.querySelectorAll('[data-privacy]')].map(select => [select.dataset.privacy, select.value])));
        root.biasStore.setNotificationSettings(Object.fromEntries([...document.querySelectorAll('[data-notification-pref]')].map(input => [input.dataset.notificationPref, input.checked])));
        root.biasAccount?.syncProfile();
      } catch (error) { root.biasApp.showToast(error.message); return; }
      root.biasApp.showToast('Profil gespeichert.'); root.biasApp.navigateTo('profile');
    };
  }

  function renderHomePreview(slide, index) {
    const previews = [
      {label: 'Community Charts', accent: 'Sky', html: `<div class="preview-ranking"><p class="preview-kicker">COMMUNITY · TOP 10</p>${['SUMIN · Your Home', 'BIBI · Bam Yanggaeng', 'NewJeans · Ditto'].map((item, i) => `<div><b>0${i + 1}</b><span>${esc(item)}</span><em>${i === 0 ? '▲4' : i === 1 ? 'NEW' : '—'}</em></div>`).join('')}</div>`},
      {label: 'Radar', accent: 'Coral', html: `<div class="preview-calendar"><p class="preview-kicker">RADAR · SEPTEMBER</p><div class="preview-calendar-grid">${Array.from({length: 14}, (_, i) => `<span class="${[2, 6, 11].includes(i) ? 'has-event' : ''}">${String(i + 1).padStart(2, '0')}</span>`).join('')}</div><strong>3 bestätigte Releases</strong></div>`},
      {label: 'Profil', accent: 'Seafoam', html: `<div class="preview-profile">${avatarMarkup(root.biasStore.profile, 'preview-avatar')}<div><strong>${esc(root.biasStore.profile.username || 'musikfan')}</strong><small>Favourite Artists · 5 / 10</small><span>SUMIN · BIBI · aespa</span></div></div>`},
      {label: 'Rätsel', accent: 'Gold', html: `<div class="preview-riddle"><p class="preview-kicker">DAILY #${root.biasCore.daily().dayNumber}</p><div class="preview-blur">DT</div><strong>Welcher Release ist gesucht?</strong><small>Release · Artist · Audio kommt später</small></div>`}
    ];
    return previews[index % previews.length];
  }

  function renderHome(container) {
    clearInterval(root.biasHomeView._timer);
    const daily = root.biasCore.daily();
    container.innerHTML = `<div class="view-home v2-home"><section class="landing-hero-v2"><div class="landing-hero-copy"><p class="hero-eyebrow">Koreanische Musik. Über den Bias hinaus.</p><h1 class="hero-headline">Deine Hördaten,<br><span>koreanisch kuratiert.</span></h1><p class="hero-desc">Entdecke Releases, verstehe Credits und finde heraus, wie viel Korea in deinem Hörverlauf steckt.</p><div class="hero-actions"><a class="btn btn-accent btn-lg" href="#stats">Korea-Mix berechnen →</a><p class="hero-trust">Last.fm verbinden oder Hörhistorie importieren · Kein eigener Player</p></div></div><section class="feature-preview" aria-label="bias.fm Vorschau"><div class="preview-header"><div><p class="hero-eyebrow">Eine Oberfläche für deinen Flow</p><h2 id="preview-title">Community Charts</h2></div><span class="preview-accent-dot" id="preview-accent"></span></div><div id="feature-preview-body"></div><div class="preview-tabs" role="tablist">${['Charts', 'Radar', 'Profil', 'Rätsel'].map((label, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-preview-index="${i}">${label}</button>`).join('')}</div></section></section><section class="landing-charts-v2" aria-label="Zwei Perspektiven auf Musik"><article class="chart-preview area-chart-community"><div class="sec-head"><div><p class="hero-eyebrow">Community</p><h2>Gemeinsam gehört</h2></div><span class="mono">TOP 10</span></div>${root.biasUI.chartEmpty('community')}<a href="#charts/community" class="btn btn-ghost">Methodik ansehen →</a></article><article class="chart-preview area-chart-korea"><div class="sec-head"><div><p class="hero-eyebrow">Korea / extern</p><h2>Originalquellen</h2></div><span class="mono">REFERENZEN</span></div><p>Circle, iChart und die koreanischen Plattformen bleiben klar als externe Quellen gekennzeichnet.</p><a href="#charts/korea" class="btn btn-ghost">Quellen entdecken →</a></article></section><section class="landing-secondary-grid"><article class="discovery-feature area-radar"><p class="hero-eyebrow">Radar</p><h2>Vorfreude hat einen Platz.</h2><p>Monatskalender und 14-Tage-Agenda verbinden Planung mit Release-Details.</p><a class="btn btn-ghost" href="#kalender">Zum Radar →</a></article><article class="discovery-feature area-riddle"><p class="hero-eyebrow">Daily #${daily.dayNumber}</p><h2>Release und Artist erraten.</h2><p>Gemeinsame Daily-Karte, sechs Versuche pro Modus. Audio bleibt ehrlich als spätere Option markiert.</p><a class="btn btn-ghost" href="#game">Heute mitraten →</a></article></section><section class="discover-teaser"><div><p class="hero-eyebrow">Entdecke mehr als Idols</p><h2>Artists, Producer und Credits in einem Katalog.</h2><p>Externe Wiki-Links bleiben Referenzen. Die Daten und Rollen werden im bias.fm-Katalog nachvollziehbar.</p></div><a class="btn btn-accent" href="#catalog">Entdecken →</a></section><section id="how-it-works" class="how-section" tabindex="-1"><p class="hero-eyebrow">So funktioniert bias.fm</p><h2>Musik entdecken. Zusammenhänge verstehen.</h2><div class="how-grid"><article><span>01</span><h3>Entdecken</h3><p>Idol, Indie, R&amp;B und Hiphop – mit Artists und den Menschen hinter den Credits.</p><a href="#catalog">Im Katalog stöbern →</a></article><article><span>02</span><h3>Einordnen</h3><p>Eine öffentliche Hörhistorie laden. Erkannte Künstler und nicht zugeordnete Plays bleiben klar getrennt.</p></article><article><span>03</span><h3>Behalten</h3><p>Favoriten, Termine und dein Musikprofil auf diesem Gerät speichern. Gehört wird bei deinem Streamingdienst.</p><a href="#profile">Dein Profil gestalten →</a></article></div></section></div>`;
    const body = container.querySelector('#feature-preview-body'); const title = container.querySelector('#preview-title'); const accent = container.querySelector('#preview-accent'); const tabs = [...container.querySelectorAll('[data-preview-index]')];
    const show = index => { const slide = renderHomePreview(null, index); body.innerHTML = slide.html; title.textContent = slide.label; accent.dataset.accent = slide.accent; tabs.forEach((tab, i) => { tab.classList.toggle('is-active', i === index); tab.setAttribute('aria-selected', String(i === index)); }); };
    let index = 0; show(index);
    tabs.forEach(tab => tab.addEventListener('click', () => { index = Number(tab.dataset.previewIndex); show(index); }));
    const preview = container.querySelector('.feature-preview'); let paused = false;
    const pause = () => { paused = true; }; const resume = () => { paused = false; };
    preview.addEventListener('mouseenter', pause); preview.addEventListener('mouseleave', resume); preview.addEventListener('focusin', pause); preview.addEventListener('focusout', resume);
    if (!currentPageIsTest() && !matchMedia('(prefers-reduced-motion: reduce)').matches) root.biasHomeView._timer = setInterval(() => { if (!paused) { index = (index + 1) % 4; show(index); } }, 7000);
    container.querySelector('#how-it-works')?.addEventListener('click', () => {});
  }

  function renderCatalog(container) {
    const view = root.biasCatalogView;
    const tabs = [['all', 'Artists & Credits'], ['producers', 'Producer & Credits'], ['people', 'Mitglieder'], ['releases', 'Releases'], ['labels', 'Labels'], ['genres', 'Genres'], ['indie', 'Indie & Rock'], ['idol', 'Idol Acts'], ['rnb', 'R&B & Hiphop']];
    container.innerHTML = `<div class="view-catalog v2-catalog"><div class="view-header"><div><p class="hero-eyebrow">Discover</p><h1 class="view-title">Entdecken</h1><p class="view-subtitle">Artists, Releases und die Menschen hinter der Musik.</p></div><div class="catalog-search-v2"><label class="sr-only" for="cat-search-input">Katalog durchsuchen</label><input type="search" id="cat-search-input" placeholder="Artist, Hangul, Beatmaker, Member …" value="${esc(view.searchQuery)}" class="chart-search-input"></div></div><div class="filter-bar"><div class="tag-tabs" id="cat-tabs">${tabs.map(([id, label]) => `<button class="tag-tab ${view.activeTab === id ? 'is-active' : ''}" data-tab="${id}">${label}</button>`).join('')}</div></div><div class="catalog-grid v2-catalog-grid" id="catalog-grid"></div></div>`;
    container.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { view.activeTab = button.dataset.tab; renderCatalog(container); }));
    container.querySelector('#cat-search-input').addEventListener('input', event => { view.searchQuery = event.target.value.toLowerCase(); view.updateGrid(); });
    view._v2Container = container; view.updateGrid();
  }

  function renderCatalogGrid() {
    const view = root.biasCatalogView; const grid = document.getElementById('catalog-grid'); if (!grid) return;
    const q = root.biasCore.normalize(view.searchQuery || ''); const matches = (...values) => !q || values.flat().filter(Boolean).some(value => root.biasCore.normalize(value).includes(q));
    if (view.activeTab === 'releases') { grid.innerHTML = (root.BIAS_DATA.songs || []).filter(song => matches(song.title, song.hangulTitle, song.artistName, song.album)).map(song => `<button class="release-discovery" onclick="biasModals.openSongModal('${esc(song.id)}')">${root.biasUI.cover(song.album, song.artistName, true)}<strong>${esc(song.album)}</strong><span>${esc(song.artistName)} · ${song.releaseYear}</span><small>${esc(song.title)} · Credits & Links →</small></button>`).join('') || '<p>Keine Releases gefunden.</p>'; return; }
    if (view.activeTab === 'labels' || view.activeTab === 'genres') { const groups = new Map(); (root.BIAS_DATA.artists || []).forEach(artist => { const keys = view.activeTab === 'labels' ? [artist.agency || 'Independent'] : artist.genres || []; keys.forEach(key => { if (!groups.has(key)) groups.set(key, []); groups.get(key).push(artist); }); }); grid.innerHTML = [...groups].filter(([key, artists]) => matches(key, artists.map(artist => artist.name))).map(([key, artists]) => `<article class="catalog-card"><h2>${esc(key)}</h2><p class="section-note">${artists.length} Acts im Katalog</p>${artists.map(artist => `<button class="text-action" onclick="biasModals.openArtistModal('${esc(artist.id)}')">${esc(artist.name)} →</button>`).join('<br>')}</article>`).join('') || '<p>Keine Einträge gefunden.</p>'; return; }
    let entities = [];
    if (view.activeTab !== 'producers' && view.activeTab !== 'people') (root.BIAS_DATA.artists || []).forEach(artist => { const genreMatch = view.activeTab === 'indie' ? (artist.genres || []).some(g => /Indie|Rock|Post-Punk/i.test(g)) : view.activeTab === 'idol' ? (artist.genres || []).includes('Idol') : view.activeTab === 'rnb' ? (artist.genres || []).some(g => /R&B|Hiphop/i.test(g)) : true; if (genreMatch && matches(artist.name, artist.hangul, artist.romanized, artist.aliases, artist.agency)) entities.push({type: 'artist', data: artist}); });
    if (view.activeTab === 'all' || view.activeTab === 'producers') (root.BIAS_DATA.producers || []).filter(producer => matches(producer.name, producer.hangul, producer.realName, producer.agency, producer.keyWorks)).forEach(producer => entities.push({type: 'producer', data: producer}));
    if (view.activeTab === 'people' || (q && view.activeTab === 'all')) (root.BIAS_DATA.people || []).filter(person => matches(person.name, person.hangul, person.role, entitySubtitle(person))).forEach(person => entities.push({type: 'person', data: person}));
    if (!entities.length) { grid.innerHTML = '<div class="catalog-empty"><p>Keine Einträge für diese Suche gefunden.</p></div>'; return; }
    grid.innerHTML = entities.map(entry => {
      const entity = entry.data;
      if (entry.type === 'producer') return `<article class="catalog-card producer-card"><div class="card-head-meta"><span class="pill pill-prod">Producer-Rolle</span><span class="pill pill-muted">${esc(entity.agency)}</span></div>${entityVisual(entity)}<h3 class="entity-name">${esc(entity.name)} <span class="entity-hangul">${esc(entity.hangul)}</span></h3><p class="real-name">${esc(entity.roles?.join(' · ') || 'Producer')}</p><p class="entity-bio">${esc(entity.bio.slice(0, 130))}…</p><div class="roles-chips">${(entity.roles || []).map(role => `<span class="tag accent">${esc(role)}</span>`).join('')}</div><button class="btn btn-ghost btn-sm" onclick="biasModals.openProducerModal('${esc(entity.id)}')">Credits öffnen →</button></article>`;
      if (entry.type === 'person') return `<article class="catalog-card member-card"><div class="card-head-meta"><span class="pill pill-artist">Mitglied</span><span class="pill pill-muted">${esc(catalogArtist(entity.memberOf)?.name || '')}</span></div>${entityVisual(entity)}<h3 class="entity-name">${esc(entity.name)} <span class="entity-hangul">${esc(entity.hangul)}</span></h3><p class="real-name">${esc(entitySubtitle(entity))}</p><div class="member-card-actions"><button class="btn btn-ghost btn-sm" data-member-id="${esc(entity.id)}">Als Bias</button><button class="btn btn-ghost btn-sm" data-member-favorite="${esc(entity.id)}">Favorit</button></div></article>`;
      return `<article class="catalog-card artist-card"><div class="card-head-meta"><span class="pill pill-artist">${entity.members?.length ? `${entity.members.length} Mitglieder` : 'Solo-Act'}</span><span class="pill pill-muted">${esc(entity.agency || 'Independent')}</span></div>${entityVisual(entity)}<h3 class="entity-name">${esc(entity.name)} <span class="entity-hangul">${esc(entity.hangul)}</span></h3><p class="real-name">Debüt ${entity.debutYear} · <i>${esc(entity.romanized)}</i></p><p class="entity-bio">${esc(entity.bio.slice(0, 130))}…</p><div class="roles-chips">${(entity.genres || []).slice(0, 3).map(genre => `<span class="tag">${esc(genre)}</span>`).join('')}</div><div class="catalog-card-actions"><button class="btn btn-ghost btn-sm" data-artist-links="${esc(entity.id)}">Links ↗</button><button class="btn btn-accent btn-sm" onclick="biasModals.openArtistModal('${esc(entity.id)}')">Profil öffnen →</button></div></article>`;
    }).join('');
    grid.querySelectorAll('[data-artist-links]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); const artist = catalogArtist(button.dataset.artistLinks); const existing = grid.querySelector('.links-popover'); existing?.remove(); const popover = document.createElement('div'); popover.className = 'links-popover'; popover.innerHTML = `<strong>${esc(artist.name)} · externe Referenzen</strong>${artistLinks(artist).map(link => `<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)} ↗</a>`).join('')}<small>Keine eingebetteten Wikis, keine übernommenen Texte oder Bilder.</small>`; button.closest('.catalog-card').appendChild(popover); }));
    grid.querySelectorAll('[data-member-id]').forEach(button => button.addEventListener('click', () => { const member = catalogMember(button.dataset.memberId); root.biasStore.updateV2Profile({ultBiasArtist: member.memberOf, ultBiasMember: member.name, biasMemberId: member.id}); root.biasApp.showToast(`${member.name} als Bias vorgemerkt.`); }));
    grid.querySelectorAll('[data-member-favorite]').forEach(button => button.addEventListener('click', () => { const member = catalogMember(button.dataset.memberFavorite); const next = [...new Set([...favoriteIds(root.biasStore.profile), member.id])].slice(0, 10); root.biasStore.updateV2Profile({favoriteArtists: next, biasLine: next}); root.biasApp.showToast(`${member.name} zu Favourite Artists hinzugefügt.`); }));
  }

  function patchCatalogView() { if (!root.biasCatalogView) return; root.biasCatalogView.render = renderCatalog; root.biasCatalogView.updateGrid = renderCatalogGrid; }

  function patchChartsView() {
    const view = root.biasChartsView; if (!view) return;
    const originalRender = view.render.bind(view);
    view.sourceTabs = function () { return `<div class="source-tabs" aria-label="Chart-Perspektive">${[['community', 'Community'], ['korea', 'Korea Charts'], ['global', 'Global Signals'], ['live', 'Last.fm Signals'], ['catalog', 'Songs']].map(([id, label]) => `<button class="source-tab ${this.source === id ? 'is-active' : ''}" aria-pressed="${this.source === id}" onclick="biasChartsView.switchSource('${id}')">${label}</button>`).join('')}</div>`; };
    const originalSwitch = view.switchSource.bind(view);
    view.switchSource = function (source) { this.source = source; history.replaceState(null, '', source === 'catalog' ? '#charts/catalog' : `#charts/${source}`); this.render(document.getElementById('main-content')); if (source === 'live' && !this.liveResult) this.loadLive(); };
    view.renderOverview = function (container) {
      const community = this.source === 'community';
      const sourceList = this.source === 'global' ? [
        ['spotify-global', 'Spotify Global / Korea', 'https://charts.spotify.com/'],
        ['youtube-momentum', 'YouTube Music / MV Momentum', 'https://charts.youtube.com/']
      ] : [
        ['ichart', 'Instiz iChart', 'https://instiz.net/pt'], ['circle', 'Circle Chart', 'https://circlechart.kr/'], ['melon', 'Melon', 'https://www.melon.com/chart/index.htm'], ['genie', 'Genie', 'https://www.genie.co.kr/chart/top200'], ['bugs', 'Bugs!', 'https://music.bugs.co.kr/chart'], ['vibe', 'Vibe', 'https://vibe.naver.com/chart'], ['flo', 'FLO', 'https://www.music-flo.com/browse'], ['youtube-korea', 'YouTube Music Korea', 'https://charts.youtube.com/']
      ];
      const first = sourceList[0];
      const eyebrow = community ? 'Community' : this.source === 'global' ? 'Globale Signale' : 'Korea / externe Quellen';
      const heading = community ? 'bias.fm Community Charts' : this.source === 'global' ? 'Global Signals' : 'Korea Charts';
      const sourceOptions = sourceList.map(([id, label]) => `<option value="${esc(id)}">${esc(label)}</option>`).join('');
      const chartBody = community
        ? root.biasUI.chartEmpty('community')
        : `<div class="chart-source-control"><label for="korea-chart-source">Quelle</label><select id="korea-chart-source" class="select-input">${sourceOptions}</select></div>${this.source === 'korea' ? '<div class="pak-context"><span class="pak-mark">iChart</span><div><strong>Perfect All-Kill als Kontext</strong><p>bias.fm übernimmt keine fremde Gesamtrangliste und berechnet keinen eigenen PAK-Wert.</p></div><button type="button" class="btn btn-ghost btn-sm" id="pak-help">Was bedeutet PAK?</button></div>' : '<p class="section-note">Diese Quelle wird als Original-Ranking verlinkt. Nur ausdrücklich zugelassene Datenquellen dürfen später innerhalb von bias.fm erscheinen.</p>'}`;
      const rankingLink = community ? '<span class="pill pill-muted">Noch keine Rangliste</span>' : `<a id="korea-chart-link" class="btn btn-ghost original-ranking-link" target="_blank" rel="noopener" href="${esc(first[2])}">Original-Ranking öffnen ↗</a>`;
      container.innerHTML = `<div class="view-charts v2-charts"><div class="view-header"><div><p class="hero-eyebrow">${eyebrow}</p><h1 class="view-title">Charts</h1><p class="view-subtitle">Eigene Community-Daten und Original-Rankings bleiben sauber getrennt.</p></div></div>${this.sourceTabs()}<section class="chart-source-panel ${community ? 'area-chart-community' : 'area-chart-external'}"><div class="chart-source-heading"><div><p class="hero-eyebrow">Quelle</p><h2>${heading}</h2></div>${rankingLink}</div>${chartBody}</section></div>`;
      const select = container.querySelector('#korea-chart-source'); if (select) { select.value = this.source === 'korea' ? this.koreaSource : first[0]; const update = () => { const picked = sourceList.find(item => item[0] === select.value) || first; if (this.source === 'korea') this.koreaSource = picked[0]; container.querySelector('#korea-chart-link').href = picked[2]; }; select.onchange = update; update(); }
      container.querySelector('#pak-help')?.addEventListener('click', () => root.biasModals.createModalContainer('<div class="modal-header"><span class="pill pill-accent">iChart Kontext</span><h2>Was bedeutet PAK?</h2></div><div class="modal-section"><p>Ein Perfect All-Kill bezeichnet Platz 1 in den Echtzeit-, Tages- und Wochenwertungen des Instiz iChart. Die zugrunde liegenden Plattformen und Regeln können sich ändern.</p><p class="section-note">bias.fm zeigt diese Einordnung als Kontext und übernimmt keine fremde Rangliste als eigene Wahrheit.</p><a href="https://instiz.net/pt" target="_blank" rel="noopener">Instiz iChart öffnen ↗</a></div>'));
    };
    view.render = function (container) { const routeSource = location.hash.split('/')[1]?.split('?')[0]; if (['community', 'korea', 'global', 'live', 'catalog'].includes(routeSource)) this.source = routeSource; if (['community', 'korea', 'global'].includes(this.source)) { this.renderOverview(container); return; } originalRender(container); };
    const originalUpdate = view.updateRows.bind(view);
    view.updateRows = function () { originalUpdate(); const list = document.getElementById('chart-rows-container'); if (!list) return; list.querySelectorAll('.chart-row-item').forEach(row => { const song = root.BIAS_DATA.songs.find(item => item.id === row.dataset.songId); if (!song || row.querySelector('.listen-menu')) return; const links = Object.entries(song.links || {}).filter(([, url]) => /^https:\/\//.test(url)); const menu = document.createElement('details'); menu.className = 'listen-menu'; menu.innerHTML = `<summary>Anhören ▾</summary><div>${links.map(([id, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(({spotify: 'Spotify', apple: 'Apple Music', youtubeMusic: 'YouTube Music', melon: 'Melon', bandcamp: 'Bandcamp'}[id] || id))} ↗</a>`).join('')}</div>`; row.querySelector('.col-actions')?.appendChild(menu); }); };
  }

  function patchCalendarView() {
    const view = root.biasCalendarView; if (!view) return;
    const originalUpdate = view.updateTimeline.bind(view);
    view.updateTimeline = function () { originalUpdate(); if (this.viewMode !== 'agenda') return; const controls = document.querySelector('.agenda-controls'); if (!controls || controls.querySelector('.agenda-countdown')) return; const today = root.biasCore.koreaDate(); const next = this.getAllComebacks().filter(item => item.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]; let text = 'Kein kommendes Event'; if (next) { const days = Math.round((Date.parse(`${next.date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000); text = days === 0 ? 'HEUTE' : days === 1 ? 'MORGEN' : `IN ${days} TAGEN`; } controls.insertAdjacentHTML('beforeend', `<div class="agenda-countdown" aria-label="Nächstes Release: ${esc(text)}"><span>Nächstes Event</span><strong>${esc(text)}</strong>${next ? `<small>${esc(next.act)} · ${esc(next.title)}</small>` : ''}</div>`); };
  }

  function patchGameView() {
    const view = root.biasGameView; if (!view) return;
    const labels = {release: 'Release', artist: 'Artist', audio: 'Audio', credits: 'Song Context'};
    view.choose = function (mode) { if (!labels[mode]) return; this.mode = mode; this.render(document.getElementById('main-content')); };
    view.state = function () { const date = root.biasCore.koreaDate(); const key = this.mode === 'release' ? null : `biasfm_daily_${this.mode}`; const saved = key ? safeJson(key, null) : root.biasStore.riddleState; if (saved?.date === date && Array.isArray(saved.guesses) && saved.guesses.length <= 6 && ['playing', 'won', 'lost'].includes(saved.status)) return saved; return {date, dayNumber: root.biasCore.daily().dayNumber, guesses: [], status: 'playing'}; };
    view.save = function (state) { if (this.mode === 'release') root.biasStore.updateRiddleState(state); else putJson(`biasfm_daily_${this.mode}`, state); };
    view.setup = function () { this.currentRiddle = root.biasCore.daily(); const day = this.currentRiddle.dayNumber; this.targetSong = root.BIAS_DATA.songs[(day + (this.mode === 'credits' ? 5 : 0)) % root.BIAS_DATA.songs.length]; this.targetArtist = root.BIAS_DATA.artists[(day + 3) % root.BIAS_DATA.artists.length]; };
    view.answer = function () { return this.mode === 'artist' ? this.targetArtist.name : this.mode === 'credits' ? this.targetSong.credits.producers.join(' / ') : this.targetSong.title; };
    view.clues = function () { const song = this.targetSong, artist = this.targetArtist; if (this.mode === 'artist') return [['Debüt', String(artist.debutYear)], ['Act-Typ', artist.type === 'group' ? 'Gruppe' : artist.type === 'band' ? 'Band' : 'Solo'], ['Klangräume', artist.genres.join(' · ')], ['Katalog-Releases', `${root.BIAS_DATA.songs.filter(item => item.artistId === artist.id).length} ausgewählte Songs`], ['Anfangsbuchstabe', `${artist.name[0]} …`]]; if (this.mode === 'credits') return [['Gesucht', 'Eine Song Context-Verbindung'], ['Veröffentlicht', String(song.releaseYear)], ['Artist', song.artistName], ['Klangräume', song.genres.join(' · ')], ['Format', song.album], ['Anfangsbuchstabe', `${song.credits.producers[0][0]} …`]]; return [['Veröffentlicht', String(song.releaseYear)], ['Klangräume', song.genres.join(' · ')], ['Format', song.album], ['Produktion', `${song.credits.producers.length} Credits`], ['Artist', song.artistName], ['Anfangsbuchstabe', `${song.title[0]} …`]]; };
    view.candidates = function () { if (this.mode === 'release') return root.BIAS_DATA.songs.map(song => ({name: `${song.title} - ${song.artistName}`, aliases: [song.title, song.hangulTitle, song.artistName]})); if (this.mode === 'artist') return root.BIAS_DATA.artists.map(artist => ({name: artist.name, aliases: [artist.name, artist.hangul, artist.romanized, ...(artist.aliases || [])]})); return [...new Set(root.BIAS_DATA.songs.flatMap(song => song.credits.producers))].map(name => ({name, aliases: [name]})); };
    view.render = function (container) { this.setup(); const state = this.state(), done = state.status !== 'playing', clues = this.clues(), visible = Math.min(6, state.guesses.length + 1); const isAudio = this.mode === 'audio'; const visualName = this.mode === 'artist' ? this.targetArtist.name : this.targetSong.title; const tabs = ['release', 'artist', 'audio']; container.innerHTML = `<div class="view-game v2-game"><div class="view-header"><div><p class="hero-eyebrow">Daily #${this.currentRiddle.dayNumber} · täglich um 00:00 KST</p><h1 class="view-title">Drei Wege, Musik zu erkennen.</h1><p class="view-subtitle">Release und Artist sind spielbar. Audio bleibt gesperrt, bis eine legale Quelle verfügbar ist.</p></div><button class="btn btn-ghost" id="game-help">Wie spielt man?</button></div><div class="game-mode-tabs" role="tablist">${tabs.map(mode => `<button type="button" role="tab" aria-selected="${this.mode === mode}" class="game-mode-tab ${this.mode === mode ? 'is-active' : ''} ${mode === 'audio' ? 'is-locked' : ''}" data-game-mode="${mode}">${labels[mode]}${mode === 'audio' ? ' · kommt später' : ''}</button>`).join('')}</div><section class="game-card-v2"><div class="game-card-heading"><div><p class="hero-eyebrow">${labels[this.mode]}</p><h2>${isAudio ? 'Audio-Rätsel kommt später' : this.mode === 'release' ? 'Welcher Release ist gesucht?' : 'Welcher Artist ist gesucht?'}</h2></div><span class="game-number">${done ? 'aufgelöst' : `${state.guesses.length} / 6`}</span></div>${isAudio ? '<div class="audio-locked-state"><span aria-hidden="true">♫</span><h3>Audio befindet sich in Vorbereitung.</h3><p>Wir hosten keine geschnittenen MP3s und verwenden keine veralteten Spotify-Preview-Workarounds. Ein lizenzierter Partner oder ein erlaubter Embed kommt später.</p><a href="https://soundcloud.com/" target="_blank" rel="noopener">SoundCloud als mögliche Quelle ↗</a></div>' : `<div class="game-card-layout"><div class="game-visual-v2 ${done ? 'is-revealed' : ''}">${root.biasUI.cover(visualName, this.mode === 'artist' ? 'Artist Visual' : this.targetSong.artistName, true)}</div><div class="game-question"><p class="section-note">Hinweise aus dem Katalog · keine Audio- oder Textausschnitte</p><div class="clues-list">${clues.slice(0, done ? 6 : visible).map(([label, value]) => `<div class="clue-row"><span class="clue-label">${esc(label)}</span><strong class="clue-val">${esc(value)}</strong></div>`).join('')}</div>${done ? `<div class="riddle-result-card ${state.status === 'won' ? 'is-won' : 'is-lost'}"><p class="daily-answer">${esc(this.answer())}</p><button class="btn btn-accent" id="share-daily-score">Ergebnis ohne Spoiler teilen</button></div>` : `<form id="riddle-form"><label for="riddle-input">${this.mode === 'release' ? 'Songtitel oder Artist' : 'Artist, Hangul oder Alias'}</label><input id="riddle-input" class="text-input" required maxlength="200" autocomplete="off"><div id="riddle-suggestions" class="daily-suggestions"></div><button class="btn btn-accent" type="submit">Raten</button><p class="section-note">${6 - state.guesses.length} von 6 Versuchen übrig</p></form>`}</div></div>`}<div class="guesses-history" aria-live="polite">${state.guesses.map((guess, index) => `<div class="guess-history-row"><span>${index + 1}</span><span>${esc(guess.text)}</span><strong>${guess.isCorrect ? '✓ Richtig' : '✗ Weiter raten'}</strong></div>`).join('') || '<p class="section-note">Noch kein Tipp abgegeben.</p>'}</div></section></div>`;
      container.querySelectorAll('[data-game-mode]').forEach(button => button.addEventListener('click', () => this.choose(button.dataset.gameMode)));
      container.querySelector('#game-help').onclick = () => root.biasModals.createModalContainer('<div class="modal-header"><h2>So spielst du</h2></div><div class="modal-section"><p>Release und Artist haben sechs eigene Versuche. Nach jedem Fehlversuch erscheint ein weiterer Kataloghinweis. Die Eingabe schlägt Hangul, Romanisierung und Aliase vor.</p><p>Audio bleibt sichtbar als spätere Option, bis eine dokumentierte Lizenzquelle verfügbar ist.</p></div>');
      container.querySelector('#share-daily-score')?.addEventListener('click', () => { const text = `bias.fm Daily #${this.currentRiddle.dayNumber} · ${labels[this.mode]} · ${state.status === 'won' ? state.guesses.length : 'X'}/6\n${state.guesses.map(guess => guess.isCorrect ? '🟩' : '⬛').join('')}\n${location.origin}${location.pathname}#game`; const copy = navigator.clipboard?.writeText(text); if (copy?.then) copy.then(() => root.biasApp.showToast('Score ohne Spoiler kopiert.')).catch(() => prompt('Dein Ergebnis:', text)); else prompt('Dein Ergebnis:', text); });
      const input = container.querySelector('#riddle-input'), suggestions = container.querySelector('#riddle-suggestions');
      if (input) { input.oninput = () => { const q = root.biasCore.normalize(input.value); const candidates = this.candidates().filter(candidate => candidate.aliases.some(alias => root.biasCore.normalize(alias).includes(q))).slice(0, 8); suggestions.innerHTML = q ? candidates.map(candidate => `<button type="button" class="suggestion-item" data-title="${esc(candidate.name)}">${esc(candidate.name)}</button>`).join('') : ''; }; suggestions.onclick = event => { const button = event.target.closest('[data-title]'); if (button) { input.value = button.dataset.title; suggestions.innerHTML = ''; input.focus(); } }; container.querySelector('#riddle-form').onsubmit = event => { event.preventDefault(); this.submitGuess(input.value); }; }
    };
    view.submitGuess = function (text) { text = String(text || '').trim(); if (!text || this.mode === 'audio') return; const state = this.state(); if (state.status !== 'playing') return; const normalized = root.biasCore.normalize(text); if (state.guesses.some(guess => root.biasCore.normalize(guess.text) === normalized)) { root.biasApp.showToast('Diesen Tipp hast du schon abgegeben.'); return; } let correct = false; if (this.mode === 'release') correct = root.biasCore.correctGuess(text, this.targetSong); else if (this.mode === 'artist') correct = this.candidates().find(candidate => candidate.name === this.targetArtist.name)?.aliases.map(root.biasCore.normalize).includes(normalized); else correct = this.targetSong.credits.producers.some(producer => root.biasCore.normalize(producer) === normalized); const guesses = [...state.guesses, {text, isCorrect: Boolean(correct)}]; this.save({...state, guesses, status: correct ? 'won' : guesses.length >= 6 ? 'lost' : 'playing'}); if (correct) root.biasStore.addLocalNotification({id: `riddle-${this.mode}-${this.currentRiddle.date}`, kind: 'product', title: `${labels[this.mode]} gelöst`, body: `Daily #${this.currentRiddle.dayNumber} abgeschlossen.`, read: false}); this.render(document.getElementById('main-content')); };
  }

  function patchArtistModals() {
    const modals = root.biasModals; if (!modals || modals._v2Patched) return; modals._v2Patched = true;
    const original = modals.openArtistModal.bind(modals);
    modals.openMemberModal = function (memberId) { const member = catalogMember(memberId), group = catalogArtist(member?.memberOf); if (!member) return; const favorite = favoriteIds(root.biasStore.profile).includes(member.id); const modal = this.createModalContainer(`<div class="modal-header"><span class="pill pill-artist">Gruppenmitglied</span><h2 class="modal-title">${esc(member.name)} <span class="modal-hangul">${esc(member.hangul)}</span></h2><p class="modal-subtitle">Mitglied von ${esc(group?.name || '')} · ${esc(member.role || 'Performer')}</p></div><div class="modal-section"><p>Mitglieder sind eigenständige Personen im Katalog und können als Bias oder Favourite Artist gewählt werden.</p><div class="import-actions"><button class="btn btn-accent" id="member-bias-action">Als Bias wählen</button><button class="btn btn-ghost" id="member-favorite-action">${favorite ? '✓ Favorit' : '+ Favorit'}</button></div></div>`); modal.querySelector('#member-bias-action').onclick = () => { root.biasStore.updateV2Profile({ultBiasArtist: group?.id || '', ultBiasMember: member.name, biasMemberId: member.id}); root.biasApp.showToast(`${member.name} als Bias gespeichert.`); this.closeCurrentModal(); }; modal.querySelector('#member-favorite-action').onclick = () => { const next = favorite ? favoriteIds(root.biasStore.profile).filter(id => id !== member.id) : [...new Set([...favoriteIds(root.biasStore.profile), member.id])].slice(0, 10); root.biasStore.updateV2Profile({favoriteArtists: next, biasLine: next}); root.biasApp.showToast(favorite ? 'Favorit entfernt.' : 'Zu Favourite Artists hinzugefügt.'); this.closeCurrentModal(); }; };
    modals.openArtistModal = function (artistId) { original(artistId); const artist = catalogArtist(artistId), modal = this.activeModal; if (!artist || !modal) return; const header = modal.querySelector('.modal-header'); const footer = modal.querySelector('.modal-footer'); const followed = root.biasStore.isArtistFollowed(artist.id); const actions = document.createElement('div'); actions.className = 'artist-v2-actions'; actions.innerHTML = `<button type="button" class="btn btn-ghost" data-follow-artist="${esc(artist.id)}">${followed ? '✓ Folge ich' : 'Artist folgen'}</button><button type="button" class="btn btn-ghost" data-links-artist="${esc(artist.id)}">Links ↗</button><label class="follow-preference"><input type="checkbox" data-follow-release checked> Releases</label><label class="follow-preference"><input type="checkbox" data-follow-announcement> Ankündigungen</label>`; header?.appendChild(actions); footer?.querySelector('.btn-accent')?.insertAdjacentElement('beforebegin', actions.cloneNode(true)); const attach = node => { const follow = node.querySelector('[data-follow-artist]'); follow?.addEventListener('click', () => { const next = root.biasStore.toggleArtistFollow(artist.id); root.biasAccount?.followArtist(artist.id, next); follow.textContent = next ? '✓ Folge ich' : 'Artist folgen'; }); node.querySelector('[data-links-artist]')?.addEventListener('click', () => { const existing = modal.querySelector('.artist-links-sheet'); if (existing) { existing.remove(); return; } const sheet = document.createElement('div'); sheet.className = 'artist-links-sheet'; sheet.innerHTML = `<strong>Externe Referenzen</strong>${artistLinks(artist).map(link => `<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)} ↗</a>`).join('')}<small>Links öffnen die Originalseite. bias.fm bettet keine Wikis ein.</small>`; header?.appendChild(sheet); }); }; attach(actions); if (footer) attach(footer.querySelector('.artist-v2-actions') || actions); modal.querySelectorAll('.member-chip').forEach((chip, index) => { const member = artist.members?.[index]; if (!member) return; chip.setAttribute('role', 'button'); chip.setAttribute('tabindex', '0'); chip.addEventListener('click', () => this.openMemberModal(member.id)); chip.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.openMemberModal(member.id); } }); }); };
  }

  function patchSearch() {
    const search = root.biasSearch; if (!search || search._v2Patched) return; search._v2Patched = true;
    const originalSearch = search.search.bind(search);
    search.search = function (query, options) { const results = originalSearch(query, options); const q = root.biasCore.normalize(query); const memberResults = (root.BIAS_DATA.people || []).filter(person => [person.name, person.hangul, entitySubtitle(person)].some(value => root.biasCore.normalize(value).includes(q))).map(person => ({type: 'member', id: person.id, title: person.name, subtitle: entitySubtitle(person), item: person, score: 58})); return [...results, ...memberResults].sort((a, b) => b.score - a.score).slice(0, 12); };
    const originalSelect = search.selectCurrentResult.bind(search);
    search.selectCurrentResult = function () { const selected = this.currentResults[this.selectedIndex]; if (selected?.type === 'member') { this.closeOmnisearch(); root.biasModals.openMemberModal(selected.item.id); return; } originalSelect(); };
  }

  ensureCatalog();
  setupLocalV2Store();
  patchProfileView();
  patchCatalogView();
  patchChartsView();
  patchCalendarView();
  patchGameView();
  patchArtistModals();
  patchSearch();
  root.biasHomeView.render = renderHome;

  const originalInit = root.biasApp.init.bind(root.biasApp);
  root.biasApp.init = function () { setupHeader(); originalInit(); renderHeader(); if (root.biasAccount) root.biasAccount.refresh(); };
  root.biasApp.updateHeaderProfileBadge = renderHeader;
})(window);
