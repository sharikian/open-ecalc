<script lang="ts">
  export let value: 'simple' | 'advanced' = 'simple';
  export let onChange: (mode: 'simple' | 'advanced') => void;
  import { locale } from '$lib/i18n';
</script>

<div class="modes" role="tablist" aria-label={$locale === 'en' ? 'Calculation mode' : 'نوع محاسبه'} data-mode={value}>
  <span class="modes__indicator" aria-hidden="true"></span>
  <button type="button" role="tab" aria-selected={value === 'simple'} on:click={() => onChange('simple')}>{$locale === 'en' ? 'Simple' : 'ساده'}</button>
  <button type="button" role="tab" aria-selected={value === 'advanced'} on:click={() => onChange('advanced')}>{$locale === 'en' ? 'Advanced' : 'پیشرفته'}</button>
</div>

<style>
  .modes { position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: min(100%, 390px); height: 52px; border: 1px solid var(--line); border-radius: 13px; background: var(--paper-deep); padding: 4px; isolation: isolate; }
  .modes__indicator { position: absolute; inset-block: 4px; inset-inline-start: 4px; z-index: -1; width: calc(50% - 4px); border: 1px solid var(--line); border-radius: 9px; background: var(--surface-strong); box-shadow: var(--shadow-soft); transition: transform var(--normal) var(--ease); }
  .modes[data-mode='advanced'] .modes__indicator { transform: translateX(-100%); }
  :global(html[dir='ltr']) .modes[data-mode='advanced'] .modes__indicator { transform: translateX(100%); }
  button { min-height: 44px; border: 0; background: transparent; color: var(--muted); font-weight: 600; white-space: nowrap; transition: color var(--fast) var(--ease), transform var(--fast) var(--ease); }
  button[aria-selected='true'] { color: var(--ink); }
  button:active { transform: scale(0.98); }
</style>
