// js/views/game.js — Daily Song Riddle (Rätsel des Tages)
// Ohne Audio, ohne Lizenz/GEMA-Kosten: Cover-Blur, Jahr, Producer-Hint, Zeilen-Snippet, 5 Versuche.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasGameView = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  class GameView {
    constructor() {
      this.currentRiddle = biasCore.daily();
      this.targetSong = (BIAS_DATA.songs || []).find(s => s.id === this.currentRiddle.songId) || BIAS_DATA.songs[0];
    }

    render(container) {
      this.currentRiddle = biasCore.daily();
      this.targetSong = BIAS_DATA.songs.find(s => s.id === this.currentRiddle.songId);
      if (biasStore.riddleState.date !== this.currentRiddle.date) biasStore.updateRiddleState({date:this.currentRiddle.date,dayNumber:this.currentRiddle.dayNumber,guesses:[],status:'playing',blurLevel:24});
      const state = biasStore.riddleState;
      const blurVal = state.blurLevel !== undefined ? state.blurLevel : this.currentRiddle.initialBlur;
      const isFinished = state.status === 'won' || state.status === 'lost';

      container.innerHTML = `
        <div class="view-game">
          <div class="view-header">
            <div>
              <div class="pill-row">
                <span class="pill pill-accent">Rätsel des Tages #${this.currentRiddle.dayNumber}</span>
                <span class="pill pill-muted">Jeden Tag neu · Mitternacht in Korea</span>
              </div>
              <h1 class="view-title">Welcher Song wird gesucht?</h1>
              <p class="view-subtitle">Nutze die Hinweise, errate den Titel in maximal 5 Versuchen und teile deinen Score.</p>
            </div>
          </div>

          <div class="game-layout">
            <!-- Left Clue & Input Column -->
            <div class="game-main-col">
              <!-- Clues Box -->
              <div class="game-clues-box">
                <h3 class="clues-title">Deine Hinweise</h3>
                <div class="clues-list">
                  <div class="clue-row">
                    <span class="clue-label">Veröffentlichungsjahr</span>
                    <span class="clue-val mono"><b>${this.currentRiddle.hintYear}</b></span>
                  </div>
                  <div class="clue-row">
                    <span class="clue-label">Genre &amp; Stil</span>
                    <span class="clue-val"><span class="tag accent">${esc(this.currentRiddle.hintGenre)}</span></span>
                  </div>
                  <div class="clue-row">
                    <span class="clue-label">Produzenten-Credit</span>
                    <span class="clue-val">${esc(this.currentRiddle.hintProducer)}</span>
                  </div>
                  <div class="clue-row lyric-clue">
                    <span class="clue-label">Titellänge</span>
                    <span class="clue-val lyric-hangul">${esc(this.currentRiddle.hintLyricHangul)}</span>
                  </div>
                  <div class="clue-row">
                    <span class="clue-label">Künstlername</span>
                    <span class="clue-val italic">„${esc(this.currentRiddle.hintLyricTranslation)}“</span>
                  </div>
                </div>
              </div>

              <!-- Guess Form / Finished State -->
              <div class="game-interaction-box">
                ${!isFinished ? `
                  <form id="riddle-form" class="riddle-input-group" autocomplete="off">
                    <div class="autocomplete-wrap">
                      <input type="text" id="riddle-input" placeholder="Gesuchten Songtitel eingeben..." aria-label="Songtitel" maxlength="200" required>
                      <div id="riddle-suggestions" class="autocomplete-dropdown"></div>
                    </div>
                    <button type="submit" class="btn btn-accent">Raten</button>
                  </form>
                  <div class="game-sub-bar">
                    <span id="guesses-remaining-text">${5 - state.guesses.length} von 5 Versuchen übrig</span>
                  </div>
                ` : this.renderFinishedBox(state)}
              </div>

              <!-- Guesses History -->
              <div class="guesses-history" id="guesses-history">
                ${this.renderGuessesHistory(state.guesses)}
              </div>
            </div>

            <!-- Right Visualizer Column -->
            <div class="game-visual-col">
              <div class="mystery-cover-wrap">
                <div class="mystery-cover-card" id="riddle-cover-card" style="background:${this.currentRiddle.coverPlaceholderGradient}">
                  <div class="riddle-hint-reveal"><span>${isFinished ? esc(this.targetSong.title) : state.guesses.length >= 3 ? esc(this.targetSong.artistName) : state.guesses.length >= 1 ? esc(this.targetSong.title[0]) + ' …' : '?'}</span><p>${isFinished ? esc(this.targetSong.artistName) : state.guesses.length >= 3 ? 'Gesuchter Künstler' : state.guesses.length >= 1 ? 'Erster Buchstabe des Titels' : 'Ein weiterer Hinweis nach deinem ersten Versuch'}</p></div>
                </div>
                <div class="cover-overlay-badge">
                  <span>${isFinished ? 'Song aufgedeckt' : `Versuch ${state.guesses.length + 1} von 5`}</span>
                </div>
              </div>

              <div class="riddle-rules-card">
                <h4>Spielregeln</h4>
                <ul>
                  <li>Du hast 5 Versuche für den koreanischen Song des Tages.</li>
                  <li>Nach dem ersten Versuch siehst du den Anfangsbuchstaben, nach dem dritten den Künstler.</li>
                  <li>Nutze einen im Katalog hinterlegten Titel auf Hangul oder Englisch.</li>
                  <li>Um Mitternacht KST gibt es ein neues Rätsel!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;

      this.attachEvents(container);
    }

    renderFinishedBox(state) {
      const isWon = state.status === 'won';
      return `
        <div class="riddle-result-card ${isWon ? 'is-won' : 'is-lost'}">
          <div class="result-header">
            <span class="result-icon">${isWon ? '🎉' : '⏳'}</span>
            <div>
              <h3>${isWon ? 'Richtig gelöst!' : 'Runde beendet!'}</h3>
              <p>Gesuchter Titel: <b>${esc(this.targetSong.title)}</b> von <b>${esc(this.targetSong.artistName)}</b></p>
            </div>
          </div>

          <div class="result-actions">
            <button class="btn btn-accent" onclick="biasGameView.shareScore()">
              Score kopieren 📋
            </button>
            <button class="btn btn-ghost" onclick="biasModals.openSongModal('${this.targetSong.id}')">
              Song Inspector &amp; Credits
            </button>
            ${this.targetSong.links.spotify ? `
              <a href="${this.targetSong.links.spotify}" target="_blank" rel="noopener" class="btn btn-ghost">
                ● Auf Spotify hören
              </a>` : ''}
          </div>
        </div>
      `;
    }

    renderGuessesHistory(guesses) {
      if (!guesses || guesses.length === 0) {
        return `<div class="empty-guesses">Noch keine Versuche abgegeben.</div>`;
      }

      return guesses.map((g, idx) => {
        const isMatch = g.isCorrect;
        return `
          <div class="guess-history-row ${isMatch ? 'is-correct' : 'is-wrong'}">
            <span class="guess-idx">${idx + 1}</span>
            <div class="guess-content">
              <span class="guess-text">${esc(g.text)}</span>
              <span class="guess-feedback">${esc(g.feedback)}</span>
            </div>
            <span class="guess-badge">${isMatch ? '✓ Richtig' : '✗ Falsch'}</span>
          </div>
        `;
      }).join('');
    }

    attachEvents(container) {
      const form = container.querySelector('#riddle-form');
      const input = container.querySelector('#riddle-input');
      const suggestions = container.querySelector('#riddle-suggestions');

      if (!form || !input) return;

      // Autocomplete search suggestions
      input.addEventListener('input', () => {
        const val = input.value.toLowerCase().trim();
        if (!val) {
          suggestions.innerHTML = '';
          suggestions.style.display = 'none';
          return;
        }

        const matches = (BIAS_DATA.songs || []).filter(s =>
          s.title.toLowerCase().includes(val) ||
          (s.hangulTitle || '').toLowerCase().includes(val) ||
          s.artistName.toLowerCase().includes(val)
        ).slice(0, 5);

        if (matches.length > 0) {
          suggestions.innerHTML = matches.map(m => `
            <div class="suggestion-item" data-title="${esc(m.title)} - ${esc(m.artistName)}">
              <b>${esc(m.title)}</b> (${esc(m.hangulTitle)}) — ${esc(m.artistName)}
            </div>
          `).join('');
          suggestions.style.display = 'block';
        } else {
          suggestions.style.display = 'none';
        }
      });

      suggestions.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (item) {
          input.value = item.dataset.title;
          suggestions.style.display = 'none';
          input.focus();
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const guess = input.value.trim();
        if (!guess) return;
        this.submitGuess(guess);
      });
    }

    submitGuess(guessText) {
      const state = biasStore.riddleState;
      if (state.status !== 'playing') return;

      const targetTitle = this.targetSong.title.toLowerCase();
      const targetHangul = (this.targetSong.hangulTitle || '').toLowerCase();
      const targetArtist = this.targetSong.artistName.toLowerCase();
      const g = guessText.toLowerCase();

      if (state.date !== biasCore.koreaDate()) {this.render(document.getElementById('main-content'));biasApp.showToast('Ein neuer Tag in Korea: Das nächste Rätsel ist da.');return;}
      if (state.guesses.some(guess => biasCore.normalize(guess.text) === biasCore.normalize(guessText))) {biasApp.showToast('Diesen Tipp hast du schon abgegeben.');return;}
      const isArtistMatch = g.includes(targetArtist);
      const isCorrect = biasCore.correctGuess(guessText, this.targetSong);

      let feedback = '';
      if (isCorrect) {
        feedback = 'Volltreffer! Exakt der gesuchte Song.';
      } else if (isArtistMatch) {
        feedback = `Artist stimmt (${this.targetSong.artistName}), aber anderer Song!`;
      } else {
        feedback = 'Weder Titel noch Artist stimmen überein.';
      }

      const nextBlur = Math.max(0, (state.blurLevel !== undefined ? state.blurLevel : 24) - 5);
      const updatedGuesses = [...state.guesses, { text: guessText, isCorrect, feedback }];
      
      let nextStatus = 'playing';
      if (isCorrect) {
        nextStatus = 'won';
      } else if (updatedGuesses.length >= 5) {
        nextStatus = 'lost';
      }

      biasStore.updateRiddleState({
        guesses: updatedGuesses,
        blurLevel: isCorrect ? 0 : nextBlur,
        status: nextStatus
      });

      // Re-render
      const appContainer = document.getElementById('main-content');
      if (appContainer) {
        this.render(appContainer);
      }
    }

    shareScore() {
      const state = biasStore.riddleState;
      const count = state.guesses.length;
      const isWon = state.status === 'won';
      
      let boxes = '';
      state.guesses.forEach(g => {
        boxes += g.isCorrect ? '🟩 ' : '⬛ ';
      });
      for (let i = state.guesses.length; i < 5; i++) {
        boxes += '⬜ ';
      }

      const text = `bias.fm Rätsel #${this.currentRiddle.dayNumber} ${isWon ? count : 'X'}/5\n${boxes}\n${location.origin}${location.pathname}#game`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          biasApp.showToast('Ergebnis in die Zwischenablage kopiert! 📋');
        }).catch(() => {
          prompt('Dein Ergebnis:', text);
        });
      } else {
        prompt('Dein Ergebnis:', text);
      }
    }
  }

  return new GameView();
});
