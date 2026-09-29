interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  TELEGRAM_BOT?: string;
  ADMIN_USERID?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api/feedback') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    if (request.headers.get('origin') !== url.origin) return Response.json({ error: 'Invalid origin' }, { status: 403 });
    if (!env.TELEGRAM_BOT || !env.ADMIN_USERID) return Response.json({ error: 'Feedback unavailable' }, { status: 503 });
    if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'Expected JSON' }, { status: 415 });
    const body = await request.text();
    if (body.length > 20_000) return Response.json({ error: 'Feedback too large' }, { status: 413 });
    let payload: { comment?: unknown; calculation?: unknown };
    try { payload = JSON.parse(body); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    if (typeof payload.comment !== 'string' || payload.comment.trim().length < 3 || payload.comment.length > 2000) {
      return Response.json({ error: 'Write between 3 and 2000 characters' }, { status: 400 });
    }
    // All Telegram traffic originates in this Worker. Secrets never enter assets.
    const text = `Open eCalc feedback\n${payload.comment.trim()}\n\nCalculation supplied by the user:\n${JSON.stringify(payload.calculation ?? null)}`;
    try {
      const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: env.ADMIN_USERID, text: text.slice(0, 4000) }),
        signal: AbortSignal.timeout(8000)
      });
      const telegram = await response.json() as { ok?: boolean };
      if (!response.ok || !telegram.ok) return Response.json({ error: 'Delivery failed' }, { status: 502 });
      return Response.json({ ok: true });
    } catch { return Response.json({ error: 'Delivery failed' }, { status: 502 }); }
  }
};
