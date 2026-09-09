import {failure, json, options, redirect} from '../../_lib/http.js';
import {verification} from '../../_lib/verification.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  try {
    const result = await verification(context.request, context.env);
    // Token confirmations are safe to follow in a browser. Keep the API
    // response useful for fetch clients while sending interactive users back
    // to the settings screen.
    if (context.request.method === 'GET' && result.location) return redirect(result.location);
    return json(context.request, result, context.request.method === 'POST' ? 201 : 200);
  } catch (error) { return failure(context.request, error); }
}
