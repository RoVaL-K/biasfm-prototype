(function(root){
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function cover(title,artist,large=false){
    const hue=[...String(title+artist)].reduce((n,c)=>n+c.charCodeAt(0),0)%360;
    return `<span class="artwork ${large?'artwork-large':''}" role="img" title="Eigenes Ersatzmotiv, kein Originalcover" aria-label="Gestaltetes Ersatzmotiv: ${esc(title)} von ${esc(artist)}" style="--art-hue:${hue}"><span class="artwork-disc"></span><span class="artwork-type">${esc(String(title).slice(0,2).toUpperCase())}</span></span>`;
  }
  function chartEmpty(kind){return kind==='community'?`<span class="pill pill-muted">Noch keine Rangliste</span><p>Hier entsteht die Community Top 10 aus freigegebenen, bereinigten Hörverläufen. Dafür liegen noch keine gemeinsamen Hördaten vor.</p><p class="section-note">Lokale Favoriten werden nicht als Community-Plays gezählt.</p>`:`<span class="pill pill-muted">Externe Referenzen</span><p>Was in Korea gehört wird: Die Original-Charts findest du direkt bei ihren Anbietern.</p><p class="section-note">Eine eingebundene Top 10 erscheint erst mit einer freigegebenen Datenquelle.</p><a class="text-action" href="https://circlechart.kr/" target="_blank" rel="noopener">Circle Chart öffnen ↗</a>`;}
  root.biasUI={esc,cover,chartEmpty};
})(window);
