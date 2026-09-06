import {connect} from '../../_lib/spotify.js';
import {failure, options, redirect} from '../../_lib/http.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return new Response('Methode nicht erlaubt.', {status: 405});
  try {
    const result = await connect(context.request, context.env);
    return redirectWithCookie(result.location, result.headers);
  } catch (error) {
    return failure(context.request, error);
  }
}

function redirectWithCookie(location, headers) {
  return new Response(null, {status: 303, headers: {'Location': location, 'Cache-Control': 'no-store', ...headers}});
}
