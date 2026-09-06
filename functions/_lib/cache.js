export async function readCache(namespace, key) {
  if (!namespace) return null;
  try { return await namespace.get(key, 'json'); } catch { return null; }
}

export async function writeCache(namespace, key, value, expirationTtl) {
  if (!namespace) return;
  try { await namespace.put(key, JSON.stringify(value), {expirationTtl}); } catch {}
}
