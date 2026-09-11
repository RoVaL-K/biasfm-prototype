(function(root){
 const {esc}=biasUI;
 const labels={release:'Release',artist:'Artist',credits:'Credits'};
 const soundCloudEmbed = value => {
  const raw=String(value||'').trim(); if(!raw)return '';
  try {
   const url=new URL(raw);
   if(url.hostname==='w.soundcloud.com' && url.pathname==='/player/') {
    const source=url.searchParams.get('url')||''; if(!/^https?:\/\/(?:www\.)?soundcloud\.com\//i.test(source))return '';
    return url.href;
   }
   if(!/(?:^|\.)soundcloud\.com$/i.test(url.hostname) || !url.pathname || url.pathname==='/')return '';
   return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&color=%2300d6a3&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`;
  } catch{return '';}
 };
 class GameView {
  constructor(){this.mode='release';this.currentRiddle=biasCore.daily();this.targetSong=BIAS_DATA.songs.find(s=>s.id===this.currentRiddle.songId);}
  state(){
   const date=biasCore.koreaDate();
   if(this.mode==='release'){
    if(biasStore.riddleState.date!==date)biasStore.updateRiddleState({date,guesses:[],status:'playing'});
    return biasStore.riddleState;
   }
   try{const s=JSON.parse(localStorage.getItem('biasfm_daily_'+this.mode));if(s?.date===date&&Array.isArray(s.guesses)&&s.guesses.length<=6&&['playing','won','lost'].includes(s.status))return s;}catch{}
   return {date,guesses:[],status:'playing'};
  }
  save(state){if(this.mode==='release')biasStore.updateRiddleState(state);else localStorage.setItem('biasfm_daily_'+this.mode,JSON.stringify(state));}
  choose(mode){if(!labels[mode])return;this.mode=mode;this.render(document.getElementById('main-content'));}
  setup(){this.currentRiddle=biasCore.daily();const day=this.currentRiddle.dayNumber;this.targetSong=BIAS_DATA.songs[(day+(this.mode==='credits'?5:0))%BIAS_DATA.songs.length];this.targetArtist=BIAS_DATA.artists[(day+3)%BIAS_DATA.artists.length];}
  answer(){return this.mode==='artist'?this.targetArtist.name:this.mode==='credits'?this.targetSong.credits.producers.join(' / '):this.targetSong.title;}
  clues(){
   const s=this.targetSong,a=this.targetArtist;
   if(this.mode==='artist')return [['Debüt',String(a.debutYear)],['Act-Typ',({group:'Gruppe',solo:'Solo',band:'Band'})[a.type]||a.type],['Klangräume',a.genres.join(' · ')],['Diskografie im Katalog',BIAS_DATA.songs.filter(s=>s.artistId===a.id).length+' ausgewählte Songs'],['Label im Katalog',a.agency||'Independent'],['Anfangsbuchstabe',a.name[0]+' …']];
   if(this.mode==='credits')return [['Gesucht','Ein Produktions-Credit zu „'+s.title+'“'],['Veröffentlicht',String(s.releaseYear)],['Artist',s.artistName],['Klangräume',s.genres.join(' · ')],['Veröffentlichung',s.album],['Anfangsbuchstabe',s.credits.producers[0][0]+' …']];
   return [['Veröffentlicht',String(s.releaseYear)],['Klangräume',s.genres.join(' · ')],['Titellänge',s.title.length+' Zeichen'],['Produktion',s.credits.producers.join(' · ')],['Artist',s.artistName],['Anfangsbuchstabe',s.title[0]+' …']];
  }
  render(container){
   this.setup();const state=this.state(),done=state.status!=='playing',clues=this.clues(),visible=Math.min(6,state.guesses.length+1);
   const visualName=this.mode==='artist'?this.targetArtist.name:this.targetSong.title;
   const visualArtist=this.mode==='artist'?'Artist Grid':this.targetSong.artistName;
   const curatedEmbed = done && state.status==='won' ? soundCloudEmbed(this.targetSong.soundcloudEmbedUrl) : '';
   const audioMarkup = curatedEmbed ? `<section class="riddle-audio-card"><div><p class="hero-eyebrow">NACH DER LÖSUNG · SOUNDCLOUD</p><h3>Song anhören</h3><p class="section-note">Eingebettete Quelle, redaktionell hinterlegt. bias.fm lädt keine Audiodatei herunter.</p></div><iframe title="SoundCloud-Player" loading="lazy" allow="autoplay" src="${esc(curatedEmbed)}"></iframe></section>` : '';
   container.innerHTML=`<div class="view-game"><div class="view-header"><div><p class="hero-eyebrow">Daily #${this.currentRiddle.dayNumber} · täglich um 00:00 KST</p><h1 class="view-title">Ein Tag. Drei Musikrätsel.</h1><p class="view-subtitle">Sechs Versuche pro Modus. Ein neuer Hinweis nach jedem Fehlversuch.</p></div><button class="btn btn-ghost" id="game-help">Wie spielt man?</button></div><div class="source-tabs">${Object.entries(labels).map(([id,label])=>`<button class="source-tab ${this.mode===id?'is-active':''}" aria-pressed="${this.mode===id}" onclick="biasGameView.choose('${id}')">${label}</button>`).join('')}</div><div class="daily-layout"><section class="game-clues-box"><div class="game-visual ${done?'is-revealed':''}" aria-label="${done?'Aufgedecktes Cover':'Verdecktes Rätselmotiv'}">${biasUI.cover(visualName,visualArtist,true)}</div><p class="hero-eyebrow">${labels[this.mode]} · ${done?'Aufgelöst':visible+' / 6 Hinweise'}</p><h2>${this.mode==='release'?'Welcher Song ist gesucht?':this.mode==='artist'?'Welcher Act ist gesucht?':'Wer hat diesen Song produziert?'}</h2><div class="clues-list">${clues.slice(0,done?6:visible).map(([label,value])=>`<div class="clue-row"><span class="clue-label">${esc(label)}</span><strong class="clue-val">${esc(value)}</strong></div>`).join('')}</div><p class="section-note">Hinweise aus dem bias.fm-Katalog. Audio erscheint nach einer Lösung nur, wenn eine geprüfte SoundCloud-Quelle hinterlegt ist.</p></section><section class="game-interaction-box">${done?`<div class="riddle-result-card ${state.status==='won'?'is-won':'is-lost'}"><h2>${state.status==='won'?'Richtig gelöst!':'Heute aufgedeckt.'}</h2><p class="daily-answer">${esc(this.answer())}</p>${audioMarkup}<button class="btn btn-accent" onclick="biasGameView.shareScore()">Ergebnis ohne Spoiler teilen</button><button class="btn btn-ghost" id="daily-detail">${this.mode==='artist'?'Artist ansehen':'Song & Credits ansehen'} →</button></div>`:`<form id="riddle-form"><label for="riddle-input">${this.mode==='release'?'Songtitel':this.mode==='artist'?'Artist, Hangul oder Alias':'Name eines Producers'}</label><input id="riddle-input" class="text-input" required maxlength="200" autocomplete="off" aria-controls="riddle-suggestions"><div id="riddle-suggestions" class="daily-suggestions"></div><button class="btn btn-accent" type="submit">Raten</button><p class="section-note">${6-state.guesses.length} von 6 Versuchen übrig</p></form>`}<div class="guesses-history" aria-live="polite">${state.guesses.map((g,i)=>`<div class="guess-history-row"><span>${i+1}</span><span>${esc(g.text)}</span><strong>${g.isCorrect?'✓ Richtig':'✗ Weiter raten'}</strong></div>`).join('') || '<p class="section-note">Noch kein Tipp abgegeben.</p>'}</div></section></div></div>`;
   container.querySelector('#game-help').onclick=()=>biasModals.createModalContainer('<div class="modal-header"><h2>So spielst du</h2></div><div class="modal-section"><p>Errate im Release-Modus einen Song, im Artist-Modus einen Act und im Credits-Modus einen der genannten Produktions-Credits. Jeder Modus hat sechs eigene Versuche.</p><p>Nach jedem Fehlversuch erscheint ein weiterer Hinweis. Die Suche hilft dir mit Titeln, Hangul und bekannten Aliasen. Doppelte Tipps kosten keinen Versuch.</p><p>Dein Fortschritt bleibt auf diesem Gerät gespeichert. Alle drei Rätsel wechseln gemeinsam um 00:00 Uhr in Korea (KST, UTC+9). Dein geteilter Score verrät keine Lösung.</p></div>');
   container.querySelector('#daily-detail')?.addEventListener('click',()=>this.mode==='artist'?biasModals.openArtistModal(this.targetArtist.id):biasModals.openSongModal(this.targetSong.id));
   const input=container.querySelector('#riddle-input'),suggestions=container.querySelector('#riddle-suggestions');
   if(input){input.oninput=()=>{const q=biasCore.normalize(input.value);const candidates=this.candidates().filter(c=>c.aliases.some(a=>biasCore.normalize(a).includes(q))).slice(0,6);suggestions.innerHTML=q?candidates.map(c=>`<button type="button" class="suggestion-item" data-title="${esc(c.name)}">${esc(c.name)}</button>`).join(''):'';};suggestions.onclick=e=>{const button=e.target.closest('[data-title]');if(button){input.value=button.dataset.title;suggestions.innerHTML='';input.focus();}};container.querySelector('#riddle-form').onsubmit=e=>{e.preventDefault();this.submitGuess(input.value);};}
  }
  candidates(){
   if(this.mode==='release')return BIAS_DATA.songs.map(s=>({name:s.title+' - '+s.artistName,aliases:[s.title,s.hangulTitle,s.artistName]}));
   if(this.mode==='artist')return BIAS_DATA.artists.map(a=>({name:a.name,aliases:[a.name,a.hangul,a.romanized,...(a.aliases||[]),...biasStore.curationAliases.filter(x=>x.artistId===a.id).map(x=>x.alias)]}));
   return [...new Set(BIAS_DATA.songs.flatMap(s=>s.credits.producers))].map(name=>{const p=BIAS_DATA.producers.find(p=>p.name===name);return {name,aliases:[name,p?.hangul,p?.realName].filter(Boolean)};});
  }
  submitGuess(text){
   text=String(text).trim();if(!text)return;
   if(this.currentRiddle.date!==biasCore.koreaDate()){this.render(document.getElementById('main-content'));biasApp.showToast('Ein neuer Tag in Korea – die Rätsel wurden erneuert.');return;}
   const state=this.state();if(state.status!=='playing')return;
   const normalized=biasCore.normalize(text);if(state.guesses.some(g=>biasCore.normalize(g.text)===normalized)){biasApp.showToast('Diesen Tipp hast du schon abgegeben.');return;}
   let correct;
   if(this.mode==='release')correct=biasCore.correctGuess(text,this.targetSong);
   else if(this.mode==='artist')correct=this.candidates().find(c=>c.name===this.targetArtist.name).aliases.map(biasCore.normalize).includes(normalized);
   else correct=this.candidates().filter(c=>this.targetSong.credits.producers.includes(c.name)).some(c=>c.aliases.map(biasCore.normalize).includes(normalized));
   const guesses=[...state.guesses,{text,isCorrect:correct,feedback:correct?'Richtig!':'Ein neuer Hinweis ist da.'}];
   try{this.save({...state,guesses,status:correct?'won':guesses.length>=6?'lost':'playing'});}catch{biasApp.showToast('Der Versuch konnte nicht gespeichert werden. Bitte prüfe den Browserspeicher.');return;}
   this.render(document.getElementById('main-content'));
  }
  shareScore(){const state=this.state();if(state.status==='playing')return;const text=`bias.fm Daily #${this.currentRiddle.dayNumber} · ${labels[this.mode]} · ${state.status==='won'?state.guesses.length:'X'}/6\n${state.guesses.map(g=>g.isCorrect?'🟩':'⬛').join('')}\n${location.origin}${location.pathname}#game`;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>biasApp.showToast('Score ohne Spoiler kopiert.')).catch(()=>prompt('Dein Ergebnis:',text));else prompt('Dein Ergebnis:',text);}
 }
 root.biasGameView=new GameView();
})(window);
