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
    username: 'musikfan',
    bio: '',
    ultBiasArtist: '',
    ultBiasMember: '',
    biasLine: [],
    biasWrecker: '',
    accentColor: '#38bdf8', // Default Tokki Blue
    fandomName: 'Tokki Sky Blue'
  };

  const listeners = new Map();

  const PRODUCT_PALETTES = {
    // Product themes control the interface. They are deliberately independent
    // from the personal profile accent below.
    dark: {bias: '#2fd3a4', rgb: '47, 211, 164', label: 'Ocean Ink'},
    night: {bias: '#ff7b72', rgb: '255, 123, 114', label: 'Seoul Night Market'},
    holographic: {bias: '#a78bfa', rgb: '167, 139, 250', label: 'Holographic Pop'},
    light: {bias: '#167d78', rgb: '22, 125, 120', label: 'Warm Paper'},
    jewel: {bias: '#d86b8a', rgb: '216, 107, 138', label: 'Deep Jewel'}
  };

  const THEME_ORDER = Object.keys(PRODUCT_PALETTES);

  function hexToRgb(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
    return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  }

  function luminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    return rgb.reduce((sum, channel, index) => {
      const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
  }

  function contrastRatio(first, second) {
    const one = luminance(first), two = luminance(second);
    return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
  }

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
      this.accentColor = this.profile.accentColor || getItem(STORAGE_KEYS.COLOR,'#38bdf8');
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
      const palette = PRODUCT_PALETTES[this.theme] || PRODUCT_PALETTES.dark;
      root.setAttribute('data-theme', PRODUCT_PALETTES[this.theme] ? this.theme : 'dark');
      root.style.setProperty('--profile-accent', /^#[0-9a-f]{6}$/i.test(this.accentColor)?this.accentColor:'#38bdf8');
      root.style.setProperty('--bias', palette.bias);
      root.style.setProperty('--bias-rgb', palette.rgb);
      root.style.setProperty('--bias-glow', `rgba(${palette.rgb}, .2)`);
      root.style.setProperty('--bias-glow-soft', `rgba(${palette.rgb}, .08)`);
    }

    setTheme(theme) {
      if (!THEME_ORDER.includes(theme)) return false;
      setItem(STORAGE_KEYS.THEME, theme);
      this.theme = theme;
      this.applyThemeAndColor();
      this.emit('themeChange', theme);
      return true;
    }

    toggleTheme() {
      const index = Math.max(0, THEME_ORDER.indexOf(this.theme));
      const nextTheme = THEME_ORDER[(index + 1) % THEME_ORDER.length];
      this.setTheme(nextTheme);
      return nextTheme;
    }

    isContrastSafe(colorHex, theme = this.theme) {
      if (!/^#[0-9a-f]{6}$/i.test(colorHex)) return false;
      const card = ['light'].includes(theme) ? '#fffcf7' : '#15181c';
      return contrastRatio(colorHex, card) >= 3;
    }

    setAccentColor(colorHex, fandomName) {
      if (!this.isContrastSafe(colorHex)) return false;
      this.updateProfile({accentColor:colorHex,...(fandomName?{fandomName}:{})});
      return true;
    }

    updateProfile(updates) {
      if (updates.username && updates.username !== this.profile.username) {
        const lastChange=Number(this.profile.usernameChangedAt || 0);
        const cooldown=180*86400000;
        if (lastChange && Date.now()-lastChange < cooldown) {
          const days=Math.ceil((cooldown-(Date.now()-lastChange))/86400000);
          throw new Error(`Dein Nutzername kann erst in ${days} Tagen wieder geändert werden.`);
        }
        updates={...updates,usernameChangedAt:Date.now()};
      }
      const nextProfile={...this.profile,...updates};
      if (nextProfile.accentColor && !this.isContrastSafe(nextProfile.accentColor)) {
        throw new Error('Diese Profilfarbe hat zu wenig Kontrast. Bitte eine hellere oder dunklere Farbe wählen.');
      }
      setItem(STORAGE_KEYS.PROFILE,nextProfile);
      this.profile=nextProfile;
      if(updates.accentColor){this.accentColor=updates.accentColor;this.applyThemeAndColor();this.emit('colorChange',{colorHex:this.accentColor,fandomName:this.profile.fandomName});}
      this.emit('profileChange',this.profile);
    }

    toggleTrackComeback(comebackId) {
      const next=new Set(this.trackedComebacks);
      if(next.has(comebackId))next.delete(comebackId);else next.add(comebackId);
      setItem(STORAGE_KEYS.TRACKED_CBS,[...next]);
      this.trackedComebacks=next;
      this.emit('comebacksChange',next);
      return next.has(comebackId);
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
