// js/store.js — Reactive State & LocalStorage Manager for bias.fm

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasStore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const STORAGE_KEYS = {
    PROFILE: 'biasfm_profile',
    THEME: 'biasfm_theme',
    COLOR: 'biasfm_color',
    TRACKED_CBS: 'biasfm_tracked_comebacks',
    CUSTOM_CBS: 'biasfm_custom_comebacks',
    RIDDLE_STATE: 'biasfm_riddle_state',
    ACTIVE_PERSONA: 'biasfm_active_persona',
    CURATION_ALIASES: 'biasfm_curation_aliases',
    MERGED_DUPLICATES: 'biasfm_merged_duplicates'
  };

  const DEFAULT_PROFILE = {
    username: 'Musikfan',
    ultBiasArtist: 'newjeans',
    ultBiasMember: 'Hanni',
    biasLine: ['sumin', 'black-skirts', 'gidle'],
    biasWrecker: 'bibi',
    accentColor: '#38bdf8', // Default Tokki Blue
    fandomName: 'Tokki Sky Blue'
  };

  const listeners = new Map();

  function getItem(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      const parsed = JSON.parse(data);
      if (fallback === null) return parsed;
      if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback;
      if (typeof fallback === 'object') return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? {...fallback, ...parsed} : fallback;
      return typeof parsed === typeof fallback ? parsed : fallback;
    } catch (e) {
      console.warn('LocalStorage read error:', e);
      return fallback;
    }
  }

  function setItem(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      throw new Error('Deine Änderungen konnten nicht gespeichert werden. Bitte erlaube lokalen Speicher und versuche es erneut.');
    }
  }

  class BiasStore {
    constructor() {
      this.profile = getItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
      if (typeof this.profile.username !== 'string') this.profile.username = DEFAULT_PROFILE.username;
      if (!Array.isArray(this.profile.biasLine)) this.profile.biasLine = [];
      this.theme = getItem(STORAGE_KEYS.THEME, 'dark');
      this.accentColor = getItem(STORAGE_KEYS.COLOR, this.profile.accentColor || '#38bdf8');
      this.trackedComebacks = new Set(getItem(STORAGE_KEYS.TRACKED_CBS, []));
      this.customComebacks = getItem(STORAGE_KEYS.CUSTOM_CBS, []);
      this.activePersonaId = getItem(STORAGE_KEYS.ACTIVE_PERSONA, 'persona-indie');
      this.curationAliases = getItem(STORAGE_KEYS.CURATION_ALIASES, []);
      this.mergedDuplicates = getItem(STORAGE_KEYS.MERGED_DUPLICATES, []);

      // Load today's riddle state
      const todayState = getItem(STORAGE_KEYS.RIDDLE_STATE, null);
      const today = biasCore.koreaDate();
      if (todayState && todayState.date === today && Array.isArray(todayState.guesses) && ['playing','won','lost'].includes(todayState.status)) {
        this.riddleState = todayState;
      } else {
        this.riddleState = {
          date: today,
          dayNumber: biasCore.daily().dayNumber,
          guesses: [],
          status: 'playing', // 'playing', 'won', 'lost'
          blurLevel: 24
        };
      }

      this.applyThemeAndColor();
    }

    applyThemeAndColor() {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;
      root.setAttribute('data-theme', this.theme);
      root.style.setProperty('--bias', this.accentColor);
      if (/^#[0-9a-f]{6}$/i.test(this.accentColor)) {
        const rgb = this.accentColor.slice(1).match(/.{2}/g).map(n => parseInt(n,16)).join(', ');
        root.style.setProperty('--bias-rgb',rgb);
        root.style.setProperty('--bias-glow',`rgba(${rgb}, 0.28)`);
        root.style.setProperty('--bias-glow-soft',`rgba(${rgb}, 0.08)`);
      }
    }

    setTheme(theme) {
      this.theme = theme;
      setItem(STORAGE_KEYS.THEME, theme);
      this.applyThemeAndColor();
      this.emit('themeChange', theme);
    }

    toggleTheme() {
      const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
      this.setTheme(nextTheme);
      return nextTheme;
    }

    setAccentColor(colorHex, fandomName) {
      this.accentColor = colorHex;
      this.profile.accentColor = colorHex;
      if (fandomName) this.profile.fandomName = fandomName;
      setItem(STORAGE_KEYS.COLOR, colorHex);
      setItem(STORAGE_KEYS.PROFILE, this.profile);
      this.applyThemeAndColor();
      this.emit('colorChange', { colorHex, fandomName });
      this.emit('profileChange', this.profile);
    }

    updateProfile(updates) {
      const nextProfile = { ...this.profile, ...updates };
      setItem(STORAGE_KEYS.PROFILE, nextProfile);
      this.profile = nextProfile;
      if (updates.accentColor) {
        this.setAccentColor(updates.accentColor, updates.fandomName);
      }
      this.emit('profileChange', this.profile);
    }

    toggleTrackComeback(comebackId) {
      if (this.trackedComebacks.has(comebackId)) {
        this.trackedComebacks.delete(comebackId);
      } else {
        this.trackedComebacks.add(comebackId);
      }
      setItem(STORAGE_KEYS.TRACKED_CBS, Array.from(this.trackedComebacks));
      this.emit('comebacksChange', this.trackedComebacks);
      return this.trackedComebacks.has(comebackId);
    }

    isTracked(comebackId) {
      return this.trackedComebacks.has(comebackId);
    }

    addCustomComeback(comeback) {
      const nextComebacks = [comeback, ...this.customComebacks];
      setItem(STORAGE_KEYS.CUSTOM_CBS, nextComebacks);
      this.customComebacks = nextComebacks;
      this.emit('customComebacksChange', this.customComebacks);
    }

    addCurationAlias(alias) {
      const nextAliases = [alias, ...this.curationAliases];
      setItem(STORAGE_KEYS.CURATION_ALIASES, nextAliases);
      this.curationAliases = nextAliases;
      this.emit('aliasesChange', this.curationAliases);
    }

    addMergedDuplicate(duplicate) {
      this.mergedDuplicates.unshift(duplicate);
      setItem(STORAGE_KEYS.MERGED_DUPLICATES, this.mergedDuplicates);
      this.emit('duplicatesChange', this.mergedDuplicates);
    }

    setActivePersona(personaId) {
      this.activePersonaId = personaId;
      setItem(STORAGE_KEYS.ACTIVE_PERSONA, personaId);
      this.emit('personaChange', personaId);
    }

    updateRiddleState(updates) {
      const nextState = { ...this.riddleState, ...updates };
      setItem(STORAGE_KEYS.RIDDLE_STATE, nextState);
      this.riddleState = nextState;
      this.emit('riddleChange', this.riddleState);
    }

    subscribe(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(callback);
      return () => listeners.get(event).delete(callback);
    }

    emit(event, data) {
      if (listeners.has(event)) {
        listeners.get(event).forEach(cb => {
          try {
            cb(data);
          } catch (err) {
            console.error(`Error in event listener for ${event}:`, err);
          }
        });
      }
    }
  }

  return new BiasStore();
});
