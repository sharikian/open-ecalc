<script lang="ts">
  export let label: string;
  export let value: number | string;
  export let type: 'number' | 'text' = 'number';
  export let step = 'any';
  export let min: number | undefined = undefined;
  export let suffix = '';
</script>

<label class="field">
  <span>{label}</span>
  <div class="field__control">
    <input {type} {step} {min} bind:value />
    {#if suffix}<b>{suffix}</b>{/if}
  </div>
</label>

<style>
  .field { display: grid; gap: var(--space-xs); min-width: 0; color: var(--color-ink-2); font-size: var(--text-sm); }
  .field__control { position: relative; display: flex; align-items: center; }
  input { width: 100%; min-height: 44px; border: 1px solid var(--color-rule-2); border-radius: var(--radius-sm); outline: 2px solid transparent; outline-offset: 1px; background: var(--color-paper); color: var(--color-ink); padding: var(--space-xs) 2.75rem var(--space-xs) var(--space-sm); font-family: var(--font-mono); font-variant-numeric: tabular-nums; transition: background-color var(--dur-short) var(--ease-out); }
  input:focus-visible { outline-color: var(--color-focus); }
  input:hover { background: var(--color-paper-2); }
  .field__control b { position: absolute; inset-inline-end: var(--space-sm); color: var(--color-muted); font-family: var(--font-mono); font-size: var(--text-xs); font-weight: 400; pointer-events: none; }
</style>

