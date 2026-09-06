// js/app.js — Core Orchestrator, Router, Persistent Now-Playing Dock & UI Controller

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasApp = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  class BiasApp {
    constructor() {
      this.currentRoute = 'home';
      this.views = {};
      this.currentTrack = null;
      this.isPlaying = false;
      this.likedSongs = new Set();
      this.playbackTimer = null;
      this.playbackSeconds = 38;
      this.soundEnabled = false;

      // Load liked songs
      try {
        const savedLikes = localStorage.getItem('biasfm_liked_tracks');
        if (savedLikes) {
          this.likedSongs = new Set(JSON.parse(savedLikes));
        }
      } catch (e) {}
    }

    init() {
      // Register views
      this.views = {
        home: window.biasHomeView,
        charts: window.biasChartsView,
        kalender: window.biasCalendarView,
        catalog: window.biasCatalogView,
        game: window.biasGameView,
        stats: window.biasStatsView,
        profile: window.biasProfileView,
        curation: window.biasCurationView,
        konzept: window.biasKonzeptView,
        legal: window.biasLegalView
      };

      document.addEventListener('keydown', e => {
        const target=e.target.closest('[role="button"][tabindex="0"]');
        if (target && e.target === target && (e.key === 'Enter' || e.key === ' ')) {e.preventDefault();target.click();}
        if (e.key === 'Escape') this.closeMobileNav();
      });
      this.initRouting();
      this.initThemeToggle();
      this.initMobileNav();
      this.initDockPlayer();

      if (window.biasSearch) {
        window.biasSearch.initOmnisearchUI();
      }

      // Reactive update when profile changes
      biasStore.subscribe('profileChange', (profile) => {
        this.updateHeaderProfileBadge(profile);
      });

      this.updateHeaderProfileBadge(biasStore.profile);

      // Default track in bottom dock
      if (BIAS_DATA.songs && BIAS_DATA.songs.length > 0) {
        this.loadTrackToDock(BIAS_DATA.songs[0].id, false);
      }

      window.addEventListener('error', event => {
        if (/speicher|storage|quota/i.test(event.message || '')) this.showToast('Speichern fehlgeschlagen. Bitte prüfe den lokalen Browserspeicher.');
      });
    }

    initRouting() {
      const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '').trim();
        const route = hash ? hash.split(/[/?]/)[0] : 'home';
        this.navigateTo(route, false);
      };

      window.addEventListener('hashchange', handleHashChange);

      // Intercept clicks on links with data-route or # to prevent anchor jump
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-route], a[href^="#"]');
        if (link && !link.closest('.toc-list')) {
          const href = link.getAttribute('href');
          const dataRoute = link.getAttribute('data-route');
          const route = dataRoute || (href ? href.replace('#', '') : '');
          if (route && this.views[route]) {
            e.preventDefault();
            this.navigateTo(route);
          }
        }
      });

      handleHashChange();
    }

    navigateTo(route, updateHash = true) {
      if (!this.views[route]) {
        route = 'home';
      }

      this.currentRoute = route;
      if (updateHash) {
        history.pushState(null, '', route === 'home' ? location.pathname + location.search : `#${route}`);
      }

      // Update Nav active links
      document.querySelectorAll('.nav-link, .drawer-link').forEach(link => {
        const target = link.getAttribute('data-route') || (link.getAttribute('href') || '').replace('#', '');
        link.classList.toggle('is-active', target === route);
        if(target === route) link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
      });

      // Render view
      const mainContainer = document.getElementById('main-content');
      if (mainContainer && this.views[route]) {
        mainContainer.innerHTML = '';
        document.title = `${({home:'Entdecken',charts:'Charts',kalender:'Comeback Radar',catalog:'Katalog',stats:'Hörstatistik',profile:'Mein Profil',game:'Tagesrätsel',curation:'Meine Sammlung',legal:'Informationen'})[route] || 'bias.fm'} · bias.fm`;
        this.views[route].render(mainContainer);
        // Instant top reset without smooth animation lag
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }

      // Close mobile drawer if open
      const drawer = document.getElementById('mobile-drawer');
      if (drawer) {
        if (drawer.contains(document.activeElement)) mainContainer?.focus({preventScroll:true});
        drawer.classList.remove('is-open');drawer.inert=true;
      }
      document.getElementById('mobile-menu-toggle')?.setAttribute('aria-expanded', 'false');
    }

    initThemeToggle() {
      const toggleBtn = document.getElementById('theme-toggle-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const next = biasStore.toggleTheme();
          toggleBtn.innerHTML = next === 'dark' ? '◐' : '☼';
          this.showToast(`Farbschema: ${next === 'dark' ? 'Dunkel' : 'Hell'}`);
        });
      }
    }

    initMobileNav() {
      const toggle = document.getElementById('mobile-menu-toggle');
      const drawer = document.getElementById('mobile-drawer');
      if (toggle && drawer) {
        toggle.addEventListener('click', () => {
          drawer.classList.toggle('is-open');
          const open=drawer.classList.contains('is-open');drawer.inert=!open;
          toggle.setAttribute('aria-expanded', String(open));
          if(open)drawer.querySelector('button').focus();
        });
      }
    }

    closeMobileNav() {
      const drawer=document.getElementById('mobile-drawer');
      const wasOpen=drawer?.classList.contains('is-open');
      if(drawer){drawer.classList.remove('is-open');drawer.inert=true;}
      const button=document.getElementById('mobile-menu-toggle');button?.setAttribute('aria-expanded','false');
      if(wasOpen)button?.focus();
    }

    // ================= DOCK PLAYER CONTROLLER =================
    initDockPlayer() {
      const dock = document.getElementById('bottom-dock');
      if (!dock) return;

      const playBtn = document.getElementById('dock-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          this.togglePlayback();
        });
      }

      document.getElementById('dock-prev-btn')?.addEventListener('click', () => this.moveTrack(-1));
      document.getElementById('dock-next-btn')?.addEventListener('click', () => this.moveTrack(1));
      const likeBtn = document.getElementById('dock-like-btn');
      if (likeBtn) {
        likeBtn.addEventListener('click', () => {
          if (!this.currentTrack) return;
          this.toggleLike(this.currentTrack.id);
        });
      }
    }

    loadTrackToDock(songId, autoPlay = true) {
      const song = (BIAS_DATA.songs || []).find(s => s.id === songId);
      if (!song) return;

      this.currentTrack = song;

      const dock = document.getElementById('bottom-dock');
      const thumb = document.getElementById('dock-thumb');
      const title = document.getElementById('dock-title');
      const artist = document.getElementById('dock-artist');
      const likeBtn = document.getElementById('dock-like-btn');
      const spotifyBtn = document.getElementById('dock-spotify-btn');
      const appleBtn = document.getElementById('dock-apple-btn');
      const creditsBtn = document.getElementById('dock-credits-btn');

      if (thumb) {
        thumb.style.background = song.coverGradient || 'linear-gradient(135deg, #1e3a8a, #38bdf8)';
      }
      if (title) {
        title.innerHTML = `${esc(song.title)} <span style="font-weight:400;color:var(--fg-dim)">(${esc(song.hangulTitle)})</span>`;
      }
      if (artist) {
        artist.textContent = `${song.artistName} · ${song.album}`;
      }
      if (likeBtn) {
        const isLiked = this.likedSongs.has(song.id);
        likeBtn.innerHTML = isLiked ? '♥' : '♡';
        likeBtn.classList.toggle('is-liked', isLiked);
      }
      if (spotifyBtn && song.links.spotify) {
        spotifyBtn.href = song.links.spotify;
        spotifyBtn.style.display = 'inline-flex';
      }
      if (appleBtn) {
        if (song.links.apple) {
          appleBtn.href = song.links.apple;
          appleBtn.style.display = 'inline-flex';
        } else {
          appleBtn.style.display = 'none';
        }
      }
      if (creditsBtn) {
        creditsBtn.onclick = () => {
          biasModals.openSongModal(song.id);
        };
      }

      if (dock) {
        dock.style.transform = 'translateY(0)';
      }

      if (autoPlay) {
        this.showToast(`${song.title} ausgewählt – öffne deinen Streamingdienst.`);
      }

      // Highlight in charts view if currently active
      const chartRows = document.querySelectorAll('.chart-row-item');
      chartRows.forEach(row => {
        row.classList.toggle('is-active-track', row.dataset.songId === song.id);
      });
    }

    togglePlayback() {
      if (this.currentTrack?.links.spotify) window.open(this.currentTrack.links.spotify, '_blank', 'noopener,noreferrer');
    }

    moveTrack(direction) {
      const songs = BIAS_DATA.songs;
      const index = songs.findIndex(s => s.id === this.currentTrack?.id);
      this.loadTrackToDock(songs[(index + direction + songs.length) % songs.length].id, false);
    }

    toggleLike(songId) {
      const likeBtn = document.getElementById('dock-like-btn');
      if (this.likedSongs.has(songId)) {
        this.likedSongs.delete(songId);
        if (likeBtn) {
          likeBtn.innerHTML = '♡';
          likeBtn.classList.remove('is-liked');
        }
        this.showToast('Aus Favoriten entfernt');
      } else {
        this.likedSongs.add(songId);
        if (likeBtn) {
          likeBtn.innerHTML = '♥';
          likeBtn.classList.add('is-liked');
        }
        this.showToast('Zu deinen Favoriten hinzugefügt! ♥');
        this.playUiTone(587.33, 'sine', 0.12);
      }
      try {
        localStorage.setItem('biasfm_liked_tracks', JSON.stringify(Array.from(this.likedSongs)));
        if(this.currentTrack) this.loadTrackToDock(this.currentTrack.id, false);
      } catch (e) {}
    }

    playUiTone(freq, type = 'sine', duration = 0.1) {
      if (!this.soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!this.audioCtx) this.audioCtx = new AudioCtx();
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
      } catch (e) {}
    }

    changeAccentColor(colorHex, fandomName) {
      biasStore.setAccentColor(colorHex, fandomName);
      this.showToast(`Akzentfarbe auf ${fandomName} gesetzt!`);
      this.playUiTone(523.25, 'sine', 0.1);
    }

    updateHeaderProfileBadge(profile) {
      const badge = document.getElementById('header-ult-badge');
      if (badge && BIAS_DATA) {
        const art = (BIAS_DATA.artists || []).find(a => a.id === profile.ultBiasArtist);
        if (art) {
          badge.textContent = `★ ${art.name}${profile.ultBiasMember ? ' · ' + profile.ultBiasMember : ''}`;
        }
      }
    }

    setAsBiasPrompt(artistId) {
      const art = (BIAS_DATA.artists || []).find(a => a.id === artistId);
      if (!art) return;

      biasStore.updateProfile({
        ultBiasArtist: art.id,
        biasLine: biasStore.profile.biasLine.filter(id => id !== art.id),
        ultBiasMember: '',
        accentColor: art.fandomColor,
        fandomName: art.fandomName || art.name
      });

      this.showToast(`${art.name} ist jetzt dein Ult Bias! ★`);
      this.playUiTone(659.25, 'triangle', 0.15);
      if (window.biasModals) {
        window.biasModals.closeCurrentModal();
      }
      if (this.currentRoute === 'profile') {
        this.navigateTo('profile', false);
      }
    }

    showToast(message) {
      let toast = document.getElementById('global-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.className = 'global-toast';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.setAttribute('role', 'status');
      toast.classList.add('is-visible');
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.classList.remove('is-visible');
      }, 2600);
    }
  }

  return new BiasApp();
});
