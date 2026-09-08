<script lang="ts">
  export let label: string;
  export let value: number | string | undefined;
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
  .field { display: grid; gap: 7px; min-width: 0; color: var(--ink-soft); font-size: 14px; }
  .field__control { position: relative; display: flex; align-items: center; }
  input { width: 100%; min-height: 50px; border: 1px solid var(--line); border-radius: var(--radius-small); outline: 2px solid transparent; outline-offset: 1px; background: var(--paper); color: var(--ink); padding: 10px 46px 10px 14px; font-family: var(--font-data); font-variant-numeric: tabular-nums; transition: background-color var(--fast) var(--ease), border-color var(--fast) var(--ease); }
  input:focus-visible { border-color: var(--blue); outline-color: var(--blue); }
  input:hover { background: var(--paper-deep); }
  .field__control b { position: absolute; inset-inline-end: 14px; color: var(--muted); font-family: var(--font-data); font-size: 12px; font-weight: 500; pointer-events: none; }
</style>
