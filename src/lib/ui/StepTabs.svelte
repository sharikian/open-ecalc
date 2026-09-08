<script lang="ts">
  export let value = 0;
  export let onChange: (step: number) => void;
  export let canOpen: (step: number) => boolean = () => true;
  const labels = ['بدنه', 'محیط', 'باتری', 'پیشران'];
</script>

<div class="steps" role="tablist" aria-label="مراحل محاسبه" style={`--step: ${value}`}>
  <div class="steps__track" aria-hidden="true"><i></i></div>
  {#each labels as label, index}
    <button type="button" role="tab" aria-selected={value === index} aria-disabled={!canOpen(index)} disabled={!canOpen(index)} class:done={index < value} class:locked={!canOpen(index)} on:click={() => canOpen(index) && onChange(index)}>
      <span>{index < value ? '✓' : index + 1}</span><b>{label}</b>
    </button>
  {/each}
</div>

<style>
  .steps { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; width: 100%; }
  .steps__track { position: absolute; inset: 20px 12.5% auto; height: 2px; overflow: hidden; background: var(--line); }
  .steps__track i { display: block; width: calc(var(--step) * 33.333%); height: 100%; background: var(--blue); transition: width var(--normal) var(--ease); }
  button { position: relative; z-index: 1; display: grid; min-width: 0; min-height: 64px; justify-items: center; align-content: start; gap: 6px; border: 0; background: transparent; color: var(--muted); white-space: nowrap; }
  button span { display: grid; width: 40px; height: 40px; place-items: center; border: 2px solid var(--line); border-radius: 50%; background: var(--surface); color: var(--muted); font-family: var(--font-data); font-size: 12px; font-weight: 700; transition: transform var(--normal) var(--ease), border-color var(--normal) var(--ease), background-color var(--normal) var(--ease), color var(--normal) var(--ease); }
  button b { font-size: 13px; font-weight: 500; }
  button.locked { cursor: not-allowed; opacity: .45; }
  button[aria-selected='true'] { color: var(--ink); } button[aria-selected='true'] span { border-color: var(--blue); background: var(--blue); color: var(--surface-strong); transform: scale(1.08); }
  button.done span { border-color: var(--blue); color: var(--blue); }
  @media (max-width: 360px) { button b { font-size: 12px; } }
</style>
