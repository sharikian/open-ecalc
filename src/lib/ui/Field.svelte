<script lang="ts">
  export let label: string;
  export let value: number | string | undefined;
  export let type: 'number' | 'text' = 'number';
  export let step = 'any';
  export let min: number | undefined = undefined;
  export let suffix = '';
  export let placeholder = '';
  export let hint = '';
  export let required = true;
  export let invalid = false;
  export let invalidPlaceholder = 'مقدار لازم';
</script>

<label class:optional={!required} class="field">
  <span>{label}</span>
  <div class="field__control">
    <input {type} {step} {min} placeholder={invalid ? invalidPlaceholder : placeholder} aria-invalid={invalid} aria-describedby={hint ? `${label}-hint` : undefined} class:invalid bind:value />
    {#if suffix}<b>{suffix}</b>{/if}
  </div>
  {#if hint}<small id={`${label}-hint`}>{hint}</small>{/if}
</label>

<style>
  .field { display: grid; gap: 7px; min-width: 0; color: var(--ink-soft); font-size: 14px; }.field > span { font-weight: 700; }.field.optional > span { color: var(--muted); font-weight: 500; }
  .field__control { position: relative; display: flex; align-items: center; }
  input { width: 100%; min-height: 48px; border: 1px solid var(--input-line); border-radius: var(--radius-small); outline: 2px solid transparent; outline-offset: 1px; background: var(--surface); color: var(--ink); padding: 10px 52px 10px 14px; font-family: var(--font-data); font-variant-numeric: tabular-nums; transition: background-color var(--fast) var(--ease), border-color var(--fast) var(--ease), box-shadow var(--fast) var(--ease); }
  input.invalid { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 5%, var(--surface)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 10%, transparent); }
  input::placeholder { color: #8ea5c6; opacity: 1; }.field:focus-within > span { color: var(--blue); font-weight: 700; }.field__control:focus-within input { border-color: var(--blue); outline-color: color-mix(in srgb, var(--blue) 26%, transparent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--blue) 12%, transparent); }.field__control input:hover { border-color: #91afe0; background: var(--surface); }.field__control b { position: absolute; inset-inline-end: 0; display: grid; min-width: 42px; min-height: 46px; place-items: center; border-inline-start: 1px solid var(--line); color: var(--muted); font-family: var(--font-data); font-size: 12px; font-weight: 700; pointer-events: none; }.field small { color: var(--muted); font-size: 10px; }
</style>
