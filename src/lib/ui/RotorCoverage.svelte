<script lang="ts">
  export let rotorCount = 4;
  export let frameSizeM = 0.82;
  export let propellerDiameterM = 0.4572;
  export let layout: 'flat' | 'coaxial' = 'flat';
  $: clearance = frameSizeM / (rotorCount === 4 ? Math.SQRT2 : 1) - propellerDiameterM;
  $: rotorPositions = rotorCount === 4 ? [{ x: 50, y: 19 }, { x: 81, y: 50 }, { x: 50, y: 81 }, { x: 19, y: 50 }] : Array.from({ length: rotorCount }, (_, index) => { const angle = (Math.PI * 2 * index) / rotorCount - Math.PI / 2; return { x: 50 + Math.cos(angle) * 31, y: 50 + Math.sin(angle) * 31 }; });
</script>

<div class="coverage">
  <div class="coverage__summary"><span>فاصلهٔ آزاد ملخ</span><strong class="data" class:danger={clearance < 0}>{clearance >= 0 ? `${(clearance * 1000).toFixed(0)} mm` : 'تداخل'}</strong></div>
  <div class="diagram" aria-label="نمایش چیدمان روتورها">
    <div class="frame"></div><div class="diagonal diagonal--a"></div><div class="diagonal diagonal--b"></div>
    {#each rotorPositions as position, index}<div class="rotor" class:danger={clearance < 0} class:coaxial={layout === 'coaxial'} style={`left:${position.x}%;top:${position.y}%;`}><span class="rotor__cap">{index + 1}</span><i></i></div>{/each}
    <div class="body"></div>
  </div>
  <div class="coverage__legend"><span><i class="legend-dot"></i>قطر ملخ</span><span><i class="legend-line"></i>فاصلهٔ مرکز</span><span>{(frameSizeM * 1000).toFixed(0)} mm فریم</span></div>
</div>

<style>
  .coverage { display: grid; gap: 12px; }.coverage__summary, .coverage__legend { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: var(--muted); font-size: 13px; }.coverage__summary strong { color: var(--blue); font-size: 18px; }.coverage__summary strong.danger { color: var(--danger); }
  .diagram { position: relative; width: min(100%, 360px); aspect-ratio: 1; margin-inline: auto; }.frame { position: absolute; inset: 20%; border: 2px solid var(--line-strong); border-radius: 18px; background: var(--paper-deep); transform: rotate(45deg) scale(0.86); }.diagonal { position: absolute; inset: 49% 10%; height: 2px; background: var(--line-strong); transform: rotate(45deg); }.diagonal--b { transform: rotate(-45deg); }.body { position: absolute; left: 50%; top: 50%; width: 25%; height: 25%; border: 4px solid var(--ink); border-radius: 16px; background: var(--surface-strong); transform: translate(-50%, -50%) rotate(45deg); box-shadow: var(--shadow-soft); }.body::after { content: ''; position: absolute; inset: 35%; border-radius: 4px; background: var(--blue); transform: rotate(-45deg); }
  .rotor { position: absolute; display: grid; width: 27%; aspect-ratio: 1; place-items: center; border: 3px solid var(--blue); border-radius: 50%; background: color-mix(in oklch, var(--blue) 18%, transparent); transform: translate(-50%, -50%); transition: transform var(--normal) var(--ease), background-color var(--normal) var(--ease); }.rotor i, .rotor i::before { position: absolute; display: block; width: 6px; height: 48%; border-radius: 99px; background: var(--blue); content: ''; transform: rotate(45deg); }.rotor i::before { transform: rotate(90deg); }.rotor__cap { position: relative; z-index: 1; color: var(--blue-ink); font-family: var(--font-data); font-size: 12px; }.rotor.coaxial { border-style: dashed; }.rotor.danger { border-color: var(--danger); background: color-mix(in oklch, var(--danger) 18%, transparent); }.rotor.danger i, .rotor.danger i::before { background: var(--danger); }
  .coverage__legend { justify-content: center; flex-wrap: wrap; }.coverage__legend span { display: inline-flex; align-items: center; gap: 6px; }.legend-dot { width: 10px; height: 10px; border: 2px solid var(--blue); border-radius: 50%; }.legend-line { width: 16px; height: 2px; background: var(--line-strong); }
</style>
