import {fail} from './http.js';
import {ensureSchema, requireAccount} from './auth.js';

function value(input, max = 500) { return String(input ?? '').trim().slice(0, max); }

function tokenValue() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function tokenHash(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function isEmailVerified(db, userId) {
  if (!db || !userId) return false;
  const row = await db.prepare('SELECT verified_at FROM account_email_verifications WHERE user_id = ? AND verified_at IS NOT NULL ORDER BY verified_at DESC LIMIT 1').bind(userId).first();
  return Boolean(row?.verified_at);
}

async function sendVerificationEmail(env, email, username, link) {
  const apiKey = value(env.RESEND_API_KEY, 300);
  const from = value(env.RESEND_FROM_EMAIL, 254);
  if (!apiKey || !from) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Deine bias.fm E-Mail bestätigen',
      text: `Hallo ${username},\n\nbestätige deine E-Mail-Adresse für bias.fm:\n${link}\n\nDer Link ist 30 Minuten gültig.`,
      html: `<p>Hallo ${username},</p><p>bestätige deine E-Mail-Adresse für bias.fm:</p><p><a href="${link}">E-Mail-Adresse bestätigen</a></p><p>Der Link ist 30 Minuten gültig.</p>`
    })
  });
  if (!response.ok) throw fail(502, 'Die Bestätigungs-E-Mail konnte nicht versendet werden.');
  return true;
}

export async function verification(request, env) {
  if (!env.DB) throw fail(503, 'Die Cloudflare-Datenbank ist noch nicht verbunden.');
  await ensureSchema(env.DB);
  const url = new URL(request.url);
  const token = value(url.searchParams.get('token'), 128);

  if (request.method === 'GET' && token) {
    const hash = await tokenHash(token);
    const row = await env.DB.prepare('SELECT id, expires_at, verified_at FROM account_email_verifications WHERE token_hash = ?').bind(hash).first();
    if (!row || row.verified_at || Date.parse(row.expires_at) <= Date.now()) throw fail(400, 'Dieser Bestätigungslink ist ungültig oder abgelaufen.');
    await env.DB.prepare('UPDATE account_email_verifications SET verified_at = ? WHERE id = ?').bind(new Date().toISOString(), row.id).run();
    return {confirmed: true, location: `${url.origin}/#settings?verified=1`};
  }

  const {row} = await requireAccount(request, env);
  if (request.method === 'GET') return {verified: await isEmailVerified(env.DB, row.id), configured: Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL)};
  if (request.method !== 'POST') throw fail(405, 'Methode nicht erlaubt.');
  if (await isEmailVerified(env.DB, row.id)) return {verified: true, sent: false, configured: true};
  const tokenValuePlain = tokenValue();
  const now = new Date(); const expires = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  await env.DB.prepare('DELETE FROM account_email_verifications WHERE user_id = ? AND verified_at IS NULL').bind(row.id).run();
  await env.DB.prepare('INSERT INTO account_email_verifications (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').bind(`verify_${crypto.randomUUID?.() || Date.now()}`, row.id, await tokenHash(tokenValuePlain), expires, now.toISOString()).run();
  const configured = Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);
  const sent = configured ? await sendVerificationEmail(env, row.email, row.username, `${url.origin}/api/auth/verification?token=${encodeURIComponent(tokenValuePlain)}`) : false;
  return {verified: false, sent, configured, message: sent ? 'Bestätigungs-E-Mail versendet.' : 'Der E-Mail-Versand ist auf diesem Server noch nicht konfiguriert.'};
}
