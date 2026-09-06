<script lang="ts">
  export let rotorCount = 4;
  export let frameSizeM = 0.82;
  export let propellerDiameterM = 0.4572;
  export let layout: 'flat' | 'coaxial' = 'flat';
  $: positions = rotorCount === 4
    ? [[50, 19], [81, 50], [50, 81], [19, 50]]
    : Array.from({ length: rotorCount }, (_, index) => {
        const angle = (Math.PI * 2 * index) / rotorCount - Math.PI / 2;
        return [50 + Math.cos(angle) * 31, 50 + Math.sin(angle) * 31];
      });
  $: clearance = frameSizeM / (rotorCount === 4 ? Math.SQRT2 : 1) - propellerDiameterM;
</script>

<div class="coverage">
  <div class="coverage__head"><span>پوشش روتورها</span><strong class="mono">{clearance >= 0 ? `${(clearance * 1000).toFixed(0)} mm` : 'تداخل'}</strong></div>
  <svg viewBox="0 0 100 100" aria-label="Rotor spacing diagram">
    <rect x="10" y="10" width="80" height="80" rx="3" class="frame" />
    {#each positions as position, index}
      <circle cx={position[0]} cy={position[1]} r="17" class:coaxial={layout === 'coaxial'} class:danger={clearance < 0} />
      <text x={position[0]} y={position[1] + 1} text-anchor="middle">R{index + 1}</text>
    {/each}
    <line x1="10" y1="95" x2="90" y2="95" class="dimension" />
  </svg>
  <div class="coverage__meta"><span>{(frameSizeM * 1000).toFixed(0)} mm frame</span><span>{rotorCount} rotors · {layout}</span></div>
</div>

<style>
  .coverage { display: grid; gap: var(--space-sm); }
  .coverage__head, .coverage__meta { display: flex; justify-content: space-between; color: var(--color-muted); font-size: var(--text-sm); }
  .coverage__head strong { color: var(--color-ink); }
  svg { width: min(100%, 300px); justify-self: center; overflow: visible; }
  .frame { fill: var(--color-paper-2); stroke: var(--color-rule-2); stroke-width: 0.7; }
  circle { fill: oklch(82% 0.1 258); stroke: var(--color-accent); stroke-width: 1; opacity: 0.86; }
  circle.coaxial { stroke-dasharray: 2 1; }
  circle.danger { fill: oklch(88% 0.1 42); stroke: var(--color-warning); }
  text { fill: var(--color-ink); font-family: var(--font-mono); font-size: 4px; }
  .dimension { stroke: var(--color-muted); stroke-width: 0.5; }
</style>

