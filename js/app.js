// js/app.js — Core Orchestrator, Router & UI Controller

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
      this.likedSongs = new Set();
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
        settings: {render:c=>biasProfileView.renderEdit(c)},
        saved: {render:c=>biasProfileView.renderSaved(c)},
        notifications: window.biasNotificationsView,
        admin: {render:c=>{c.innerHTML='<h1 class="view-title">Redaktion</h1><div id="admin-content"></div>';biasEditorial.render(c.querySelector('#admin-content'));}},
        legal: window.biasLegalView
      };

      document.addEventListener('keydown', e => {
        const target=e.target.closest('[role="button"][tabindex="0"]');
        if (target && e.target === target && (e.key === 'Enter' || e.key === ' ')) {e.preventDefault();target.click();}
        if (e.key === 'Escape') {this.closeMobileNav();document.querySelectorAll('.account-menu[open]').forEach(menu=>{menu.open=false;menu.querySelector('summary').focus();});}
      });
      this.initRouting();
      this.initThemeToggle();
      this.initMobileNav();

      if (window.biasSearch) {
        window.biasSearch.initOmnisearchUI();
      }

      // Reactive update when profile changes
      biasStore.subscribe('profileChange', (profile) => {
        this.updateHeaderProfileBadge(profile);
      });

      this.updateHeaderProfileBadge(biasStore.profile);



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
        if(!e.target.closest('.account-menu'))document.querySelectorAll('.account-menu[open]').forEach(menu=>menu.open=false);
        const link = e.target.closest('a[data-route], a[href^="#"]');
        if (link && !link.closest('.toc-list')) {
          const href = link.getAttribute('href');
          const dataRoute = link.getAttribute('data-route');
          const destination=dataRoute || (href ? href.replace('#','') : '');
          const route = destination.split(/[/?]/)[0];
          if (route && this.views[route]) {
            e.preventDefault();
            if(destination.includes('/') || destination.includes('?')) {history.pushState(null,'',`#${destination}`);this.navigateTo(route,false);} else this.navigateTo(route);
          }
        }
      });

      handleHashChange();
    }

    navigateTo(route, updateHash = true) {
      if (!this.views[route]) {
        route = 'home';
      }

      document.querySelectorAll('.account-menu[open]').forEach(menu=>menu.open=false);
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
        document.title = `${({home:'Entdecken',charts:'Charts',kalender:'Comeback Radar',catalog:'Entdecken',entdecken:'Entdecken',settings:'Einstellungen',saved:'Gemerkt',notifications:'Benachrichtigungen',admin:'Redaktion',stats:'Hörstatistik',profile:'Mein Profil',game:'Tagesrätsel',curation:'Meine Sammlung',legal:'Informationen',community:'Community',artist:'Artist',release:'Release',song:'Song',lists:'Meine Listen',support:'Support bias.fm'})[route] || 'bias.fm'} · bias.fm`;
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
          const labels={dark:'Mono Mint',night:'Seoul Night Market',holographic:'Holographic Pop',light:'Warm Paper',jewel:'Deep Jewel'};
          toggleBtn.innerHTML = '◐';
          this.showToast(`Farbschema: ${labels[next] || next}`);
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

    // Songs open their detail sheet and external provider links. bias.fm never
    // pretends to play audio inside the product.
    openSong(songId) {
      const song = (BIAS_DATA.songs || []).find(s => s.id === songId);
      if (!song) return;
      biasModals.openSongModal(songId);
    }

    // Backward-compatible name for saved deep links from the prototype.
    loadTrackToDock(songId) {
      this.openSong(songId);
    }

    toggleLike(songId) {
      if(!BIAS_DATA.songs.some(s=>s.id===songId))return;
      const next=new Set(this.likedSongs);if(next.has(songId))next.delete(songId);else next.add(songId);
      try{localStorage.setItem('biasfm_liked_tracks',JSON.stringify([...next]));}catch{this.showToast('Deine Favoriten konnten nicht gespeichert werden.');return;}
      this.likedSongs=next;this.showToast(next.has(songId)?'Zu deinen Favoriten hinzugefügt.':'Aus Favoriten entfernt.');
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
      if (!biasStore.setAccentColor(colorHex, fandomName)) {
        this.showToast('Bitte eine Profilfarbe mit ausreichendem Kontrast wählen.');
        return false;
      }
      this.showToast(`Akzentfarbe auf ${fandomName} gesetzt!`);
      this.playUiTone(523.25, 'sine', 0.1);
      return true;
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
