// js/spotify-import.js — legacy parser kept for migration tests only.
// It is intentionally not loaded by index.html: Spotify-derived listening
// metrics are not a supported production flow. Nothing from this fixture is
// uploaded to bias.fm.
(function (root) {
  const decoder = new TextDecoder();

  function rowFromRecord(record) {
    if (!record || typeof record !== 'object') return null;
    const name = record.master_metadata_album_artist_name || record.artistName || record.artist_name || record.artist;
    const rawMilliseconds = record.ms_played ?? record.msPlayed ?? record.milliseconds_played;
    if (rawMilliseconds === undefined || rawMilliseconds === null || rawMilliseconds === '') return null;
    const milliseconds = Number(rawMilliseconds);
    if (!String(name || '').trim() || !Number.isFinite(milliseconds) || milliseconds <= 0) return null;
    return {name: String(name).trim(), plays: 1, msPlayed: milliseconds, timestamp: record.ts || record.endTime || ''};
  }

  function rowKey(row) {
    return row.timestamp ? `${row.name}\u0000${row.timestamp}\u0000${row.msPlayed}` : '';
  }

  function parseJSON(text) {
    let value;
    try { value = JSON.parse(text); } catch { throw new Error('Die Spotify-Datei enthält kein gültiges JSON.'); }
    const records = Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
    if (!records.length) throw new Error('In der Datei wurden keine Spotify-Hörverläufe gefunden.');
    const rows = [];
    const seen = new Set();
    for (const record of records) {
      const row=rowFromRecord(record);if(!row)continue;
      const key=rowKey(row);
      if(key && seen.has(key))continue;
      if(key)seen.add(key);rows.push(row);
    }
    if (!rows.length) throw new Error('Die Spotify-Datei enthält keine abgespielten Titel mit Künstlernamen.');
    return {rows, skipped: records.length - rows.length, files: 1};
  }

  function u16(view, offset) { return view.getUint16(offset, true); }
  function u32(view, offset) { return view.getUint32(offset, true); }

  async function inflate(bytes) {
    if (typeof root.DecompressionStream !== 'function') throw new Error('ZIP-Import wird von diesem Browser nicht unterstützt. Bitte die JSON-Dateien aus dem Export auswählen.');
    const stream = new Blob([bytes]).stream().pipeThrough(new root.DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function parseZIP(buffer) {
    const view = new DataView(buffer);
    let end = -1;
    for (let offset = Math.max(0, view.byteLength - 65558); offset <= view.byteLength - 22; offset++) {
      if (u32(view, offset) === 0x06054b50) end = offset;
    }
    if (end < 0) throw new Error('Die Datei ist kein gültiges ZIP-Archiv.');
    const entries = u16(view, end + 10), centralOffset = u32(view, end + 16);
    let cursor = centralOffset, files = 0, rows = [], skipped = 0;
    const seen = new Set();
    for (let i = 0; i < entries && cursor + 46 <= view.byteLength; i++) {
      if (u32(view, cursor) !== 0x02014b50) break;
      const method = u16(view, cursor + 10), compressedSize = u32(view, cursor + 20);
      const nameLength = u16(view, cursor + 28), extraLength = u16(view, cursor + 30), commentLength = u16(view, cursor + 32);
      const localOffset = u32(view, cursor + 42);
      const name = decoder.decode(new Uint8Array(buffer, cursor + 46, nameLength));
      cursor += 46 + nameLength + extraLength + commentLength;
      if (!/streaming.?history|endsong/i.test(name) || !/\.json$/i.test(name)) continue;
      if (localOffset + 30 > view.byteLength || u32(view, localOffset) !== 0x04034b50) continue;
      const localNameLength = u16(view, localOffset + 26), localExtraLength = u16(view, localOffset + 28);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = new Uint8Array(buffer, start, compressedSize);
      let bytes;
      if (method === 0) bytes = compressed;
      else if (method === 8) bytes = await inflate(compressed);
      else throw new Error(`ZIP-Komprimierung ${method} wird nicht unterstützt.`);
      const parsed = parseJSON(decoder.decode(bytes));
      let duplicateRows = 0;
      for (const row of parsed.rows) {
        const key = rowKey(row);
        if (key && seen.has(key)) { duplicateRows++; continue; }
        if (key) seen.add(key);
        rows.push(row);
      }
      skipped += parsed.skipped + duplicateRows; files++;
    }
    if (!rows.length) throw new Error('Im ZIP-Archiv wurden keine Spotify-Hörverlaufsdateien gefunden.');
    return {rows, skipped, files};
  }

  async function read(file) {
    if (!file) throw new Error('Bitte zuerst eine Spotify-Datei auswählen.');
    const name = String(file.name || '').toLowerCase();
    if (name.endsWith('.zip') || file.type === 'application/zip') return parseZIP(await file.arrayBuffer());
    return parseJSON(await file.text());
  }

  root.biasSpotifyImport = {parseJSON, parseZIP, read};
})(window);
