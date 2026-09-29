import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './worker';
import { DEFAULT_MISSION_INPUT } from '../src/lib/core/presets';

const env = { TELEGRAM_BOT: 'test-token', ADMIN_USERID: '123', ASSETS: { fetch: vi.fn() } };
const input = { emptyMassG: 850, payloadMassG: 0, batteryMassG: 300,
  batteryParallel: 1, cellCapacityAh: 5, rotorCount: 4, speedMps: 10, currentPerMotorA: [10] };
const request = (origin = 'https://example.test', calculation: unknown = { mode: 'simple', input, result: { forged: true } }) =>
  new Request('https://example.test/api/feedback', { method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ comment: 'Actual flight test feedback', calculation }) });

afterEach(() => vi.unstubAllGlobals());

describe('Cloudflare feedback relay', () => {
  it('recomputes advanced current comparisons and preserves linked input modes', async () => {
    const advanced = structuredClone(DEFAULT_MISSION_INPUT);
    advanced.environment.pressureMode = 'auto'; advanced.environment.pressurePa = 1;
    advanced.currentScenariosA = [10, 20];
    const send = vi.fn(async (_url: string, options: RequestInit) => {
      const document = (options.body as FormData).get('document') as File;
      const report = JSON.parse(await document.text());
      expect(report.input.environment.pressureMode).toBe('auto');
      expect(report.input.currentScenariosA).toEqual([10, 20]);
      expect(report.verifiedResult.currentScenarios).toHaveLength(2);
      expect(report.verifiedResult.currentScenarios[0].totalCurrentA).toBe(10 * advanced.airframe.rotorCount + advanced.auxiliaryCurrentA);
      return Response.json({ ok: true });
    });
    vi.stubGlobal('fetch', send);
    expect((await worker.fetch(request('https://example.test', { mode: 'advanced', input: advanced }), env)).status).toBe(200);
  });
  it('recomputes the result and sends complete inputs in a document from the server', async () => {
    const send = vi.fn(async (_url: string, options: RequestInit) => {
      const form = options.body as FormData;
      const document = form.get('document') as File;
      const report = JSON.parse(await document.text());
      expect(report.input).toEqual(input);
      expect(report.submittedResult).toEqual({ forged: true });
      expect(report.verifiedResult.points[0].usableTimeMin).toBeCloseTo(5.8536585366);
      expect(form.get('chat_id')).toBe('123');
      return Response.json({ ok: true });
    });
    vi.stubGlobal('fetch', send);
    const response = await worker.fetch(request(), env);
    expect(response.status).toBe(200);
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toBe('https://api.telegram.org/bottest-token/sendDocument');
  });

  it('rejects cross-origin requests without contacting Telegram', async () => {
    const send = vi.fn();
    vi.stubGlobal('fetch', send);
    expect((await worker.fetch(request('https://other.test'), env)).status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects invalid calculations and reports upstream failure accurately', async () => {
    const send = vi.fn().mockResolvedValue(Response.json({ ok: false }));
    vi.stubGlobal('fetch', send);
    expect((await worker.fetch(request('https://example.test', { mode: 'simple', input: {} }), env)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
    expect((await worker.fetch(request(), env)).status).toBe(502);
  });
});
