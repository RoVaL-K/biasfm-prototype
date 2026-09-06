(function(root){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function spotifyUrl(value,type) {
    if(!value.trim())return '';
    let u;try{u=new URL(value);}catch{throw Error('Bitte einen vollständigen Spotify-Link eingeben.');}
    if(u.protocol!=='https:' || u.hostname!=='open.spotify.com' || u.username || u.password)throw Error('Bitte einen Link von https://open.spotify.com verwenden.');
    const match=u.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(user|playlist)\/([^/]+)\/?$/);
    if(!match || match[1]!==type || (type==='playlist'&&!/^[a-zA-Z0-9]{22}$/.test(match[2])))throw Error(type==='user'?'Bitte einen Spotify-Profil-Link verwenden.':'Bitte einen Spotify-Playlist-Link verwenden.');
    return `https://open.spotify.com/${type}/${match[2]}`;
  }
  async function api(url,options={}) {
    const response=await fetch(url,{...options,signal:options.signal || AbortSignal.timeout(20000)});
    if(!(response.headers.get('content-type')||'').includes('application/json')) throw Error('Die Verbindung benötigt den bias.fm-Server.');
    const data=await response.json();if(!response.ok)throw Error(data.error || 'Anfrage fehlgeschlagen.');return data;
  }
  const connections={status:null,playlists:[],nextOffset:null,error:'',loading:false,
    mount(container){
      const section=document.createElement('section');section.id='music-connections';section.className='settings-card connections-section';container.querySelector('.view-profile').appendChild(section);this.render();
      if(typeof fetch==='function')this.loadStatus();
    },
    render(){
      const box=document.getElementById('music-connections');if(!box)return;
      const profile=biasStore.profile,status=this.status;
      this.error = this.error || '';
      const saved=Array.isArray(profile.spotifyPlaylists)?profile.spotifyPlaylists:[];
      const state=new URLSearchParams(location.hash.split('?')[1] || '').get('spotify');
      box.innerHTML=`<div class="connection-heading"><div><span class="pill pill-accent">Deine Musik, verbunden</span><h2>Spotify &amp; deine Playlists</h2><p class="section-note">Deine Sammlung bleibt bei Spotify. Hier findest du den direkten Weg dorthin.</p></div><span class="provider-mark">Spotify ↗</span></div>
        ${state==='cancelled'?'<p role="status">Die Anmeldung wurde abgebrochen. Du kannst es jederzeit erneut versuchen.</p>':state==='failed'?'<p role="alert" class="inline-error">Spotify konnte die Verbindung nicht abschließen. Bitte prüfe die App-Freigabe und versuche es erneut.</p>':''}
        <div class="connection-account">${status?.connected?`<div><span class="connection-dot"></span> Verbunden als <a href="${esc(status.profile.url)}" target="_blank" rel="noopener">${esc(status.profile.name)}</a></div><button class="btn btn-ghost" id="spotify-disconnect">Verbindung trennen</button>`:status?.configured?'<p>Melde dich bei Spotify an, um deine zugänglichen Playlists zu laden.</p><a class="btn btn-accent" href="api/spotify/connect">Mit Spotify verbinden</a>':`<p class="section-note">${status?'Die automatische Anmeldung ist noch nicht freigeschaltet. Profil- und Playlist-Links kannst du bereits speichern.':'Spotify-Verfügbarkeit wird geprüft …'}</p>`}</div>
        <form id="spotify-link-form" class="studio-form"><label class="form-label" for="spotify-profile-url">Dein Spotify-Profil-Link</label><div class="inline-form"><input type="url" id="spotify-profile-url" class="text-input" placeholder="https://open.spotify.com/user/…" value="${esc(profile.spotifyProfileUrl || '')}"><button class="btn btn-ghost" type="submit">Speichern</button>${profile.spotifyProfileUrl?`<a class="btn btn-ghost" href="${esc(profile.spotifyProfileUrl)}" target="_blank" rel="noopener">Profil öffnen ↗</a>`:''}</div><p class="section-note">Ein hinterlegter Link ist keine bestätigte Kontoverknüpfung.</p></form>
        <h3 class="settings-section-title">Deine Playlist-Links</h3><form id="playlist-link-form" class="inline-form"><input id="playlist-name" aria-label="Playlist-Name" class="text-input" placeholder="Name deiner Playlist" maxlength="100" required><input id="playlist-url" aria-label="Spotify-Playlist-Link" type="url" class="text-input" placeholder="https://open.spotify.com/playlist/…" required><button type="submit" class="btn btn-accent">Hinzufügen</button></form>
        <div class="playlist-grid">${saved.map((p,i)=>`<article class="playlist-card"><span class="playlist-symbol">♫</span><a href="${esc(p.url)}" target="_blank" rel="noopener"><b>${esc(p.name)}</b><span>Auf Spotify öffnen ↗</span></a><button class="btn btn-ghost btn-sm" data-remove-playlist="${i}" aria-label="${esc(p.name)} entfernen">✕</button></article>`).join('') || '<p class="section-note">Speichere Playlists, zu denen du immer wieder zurückkommst.</p>'}</div>
        ${status?.connected?`<div class="connection-heading"><h3>Playlists aus deinem Spotify-Konto</h3><button class="btn btn-ghost" id="spotify-refresh" ${this.loading?'disabled':''}>Aktualisieren</button></div><div class="playlist-grid">${this.playlists.map(p=>`<a class="playlist-card imported-playlist" href="${esc(p.url)}" target="_blank" rel="noopener">${p.image?`<img src="${esc(p.image)}" alt="" width="64" height="64" loading="lazy">`:'<span class="playlist-symbol">♫</span>'}<span><b>${esc(p.name)}</b><small>${esc(p.owner)}${p.total!==null?' · '+p.total+' Titel':''}</small></span></a>`).join('') || `<p class="section-note">${this.loading?'Playlists werden geladen …':'Keine zugänglichen Playlists vorhanden.'}</p>`}</div>${this.nextOffset!==null?'<button class="btn btn-ghost" id="spotify-more">Weitere Playlists laden</button>':''}`:''}
        ${this.loading?'<p role="status">Verbindung wird geladen …</p>':''}${this.error?`<p class="inline-error" role="alert">${esc(this.error)}</p><button class="btn btn-ghost" id="spotify-retry">Erneut versuchen</button>`:''}`;
      box.querySelector('#spotify-link-form').onsubmit=e=>{e.preventDefault();try{biasStore.updateProfile({spotifyProfileUrl:spotifyUrl(box.querySelector('#spotify-profile-url').value,'user')});biasApp.showToast('Spotify-Link gespeichert.');this.render();}catch(err){this.showError(err);}};
      box.querySelector('#playlist-link-form').onsubmit=e=>{e.preventDefault();try{const url=spotifyUrl(box.querySelector('#playlist-url').value,'playlist'),name=box.querySelector('#playlist-name').value.trim();if(!name)throw Error('Bitte einen Namen eingeben.');if(saved.length>=50)throw Error('Du kannst bis zu 50 Playlist-Links speichern.');if(saved.some(p=>p.url===url))throw Error('Diese Playlist ist bereits gespeichert.');biasStore.updateProfile({spotifyPlaylists:[...saved,{name,url}]});biasApp.showToast('Playlist gespeichert.');this.render();}catch(err){this.showError(err);}};
      box.querySelectorAll('[data-remove-playlist]').forEach(button=>button.onclick=()=>{try{biasStore.updateProfile({spotifyPlaylists:saved.filter((_,i)=>i!==Number(button.dataset.removePlaylist))});this.render();}catch(err){this.showError(err);}});
      box.querySelector('#spotify-disconnect')?.addEventListener('click',async()=>{try{await api('api/spotify/disconnect',{method:'POST'});this.status={...this.status,connected:false,profile:null};this.playlists=[];this.nextOffset=null;this.error='';this.render();}catch(e){this.showError(e);}});
      box.querySelector('#spotify-refresh')?.addEventListener('click',()=>this.loadPlaylists());
      box.querySelector('#spotify-more')?.addEventListener('click',()=>this.loadPlaylists(this.nextOffset));
      box.querySelector('#spotify-retry')?.addEventListener('click',()=>this.loadStatus());
    },
    showError(e){this.error=e.message;const box=document.getElementById('music-connections');if(box){let error=box.querySelector('[role="alert"]');if(!error){error=document.createElement('p');error.className='inline-error';error.setAttribute('role','alert');box.appendChild(error);}error.textContent=e.message;}},
    async loadStatus(){try{this.status=await api('api/spotify/status');this.error='';if(this.status.connected)await this.loadPlaylists();else this.render();}catch(e){this.status={configured:false,connected:false};this.error=e.message;this.render();}},
    async loadPlaylists(offset=0){if(this.loading)return;this.loading=true;this.error='';this.render();try{const result=await api(`api/spotify/playlists?offset=${offset}`);this.playlists=offset?[...this.playlists,...result.items]:result.items;this.nextOffset=result.nextOffset;}catch(e){this.error=e.message;}finally{this.loading=false;this.render();}}
  };
  root.biasConnections=connections;root.biasApi={request:api,spotifyUrl,esc};
})(window);
