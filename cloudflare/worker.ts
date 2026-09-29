import { calculateMission } from '../src/lib/core/mission';
import { calculateLegacyExcel } from '../src/lib/core/legacy';
import type { LegacyInput, MissionInput } from '../src/lib/core/types';

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
    const calculation = payload.calculation as { mode?: string; input?: MissionInput | LegacyInput; result?: unknown } | undefined;
    if (!calculation?.input || !['simple', 'advanced'].includes(calculation.mode ?? '')) {
      return Response.json({ error: 'Calculation input required' }, { status: 400 });
    }
    let verifiedResult: unknown;
    try {
      verifiedResult = calculation.mode === 'simple'
        ? calculateLegacyExcel(calculation.input as LegacyInput)
        : calculateMission(calculation.input as MissionInput);
    } catch { return Response.json({ error: 'Invalid calculation' }, { status: 400 }); }
    // Send the complete report, not a truncated message. The Worker recomputes it.
    const report = JSON.stringify({ comment: payload.comment.trim(), mode: calculation.mode,
      input: calculation.input, submittedResult: calculation.result, verifiedResult,
      verifiedAt: new Date().toISOString() }, null, 2);
    const form = new FormData();
    form.set('chat_id', env.ADMIN_USERID);
    form.set('caption', `Open eCalc feedback\n${payload.comment.trim()}`.slice(0, 1000));
    form.set('document', new Blob([report], { type: 'application/json' }), 'calculation-feedback.json');
    try {
      const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT}/sendDocument`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(8000)
      });
      const telegram = await response.json() as { ok?: boolean };
      if (!response.ok || !telegram.ok) return Response.json({ error: 'Delivery failed' }, { status: 502 });
      return Response.json({ ok: true });
    } catch { return Response.json({ error: 'Delivery failed' }, { status: 502 }); }
  }
};
