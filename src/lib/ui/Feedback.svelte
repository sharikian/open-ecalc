<script lang="ts">
  import { locale } from '$lib/i18n';
  export let calculation: unknown;
  let comment = '';
  let sending = false;
  let status = '';
  const copy = (fa: string, en: string) => $locale === 'fa' ? fa : en;
  async function send() {
    if (comment.trim().length < 3 || sending) return;
    sending = true;
    status = '';
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ comment, calculation })
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error('Delivery failed');
      comment = '';
      status = copy('بازخورد ارسال شد.', 'Feedback sent.');
    } catch { status = copy('ارسال انجام نشد؛ دوباره امتحان کنید.', 'Could not send. Please try again.'); }
    finally { sending = false; }
  }
</script>

<details class="feedback">
  <summary>{copy('بازخورد محاسبه', 'Calculation feedback')}</summary>
  <form on:submit|preventDefault={send}>
    <label for="feedback-comment">{copy('نقد یا نتیجهٔ تست شما', 'Your comments or test results')}</label>
    <textarea id="feedback-comment" bind:value={comment} required minlength="3" maxlength="2000" rows="4" />
    <p>{copy('با ارسال، ورودی‌ها و نتیجهٔ این محاسبه همراه متن شما برای مدیر فرستاده می‌شود.', 'Sending shares this calculation’s inputs and result with the administrator, along with your comments.')}</p>
    <button disabled={sending || comment.trim().length < 3}>{sending ? copy('در حال ارسال…', 'Sending…') : copy('ارسال بازخورد', 'Send feedback')}</button>
    <span role="status">{status}</span>
  </form>
</details>

<style>
  .feedback { margin-block: 20px; border: 1px solid var(--line); border-radius: 14px; padding: 16px; background: var(--surface); }
  summary { cursor: pointer; min-height: 44px; font-weight: 700; }
  form { display: grid; gap: 12px; }
  textarea { width: 100%; padding: 12px; border: 1px solid var(--input-line); border-radius: 10px; font: inherit; font-size: 16px; background: var(--paper); color: var(--ink); resize: vertical; }
  p { font-size: 14px; color: var(--muted); margin: 0; }
  button { min-height: 48px; background: var(--blue); color: white; border: 0; border-radius: 10px; }
  button:disabled { opacity: .5; }
</style>
