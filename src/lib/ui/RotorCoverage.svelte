<script lang="ts">
  import { locale } from '$lib/i18n';
  export let rotorCount = 4;
  export let frameSizeM = 0.82;
  export let propellerDiameterM = 0.4572;
  export let layout: 'flat' | 'coaxial' = 'flat';
  $: en = $locale === 'en';
  $: centerSpacingM = frameSizeM / (rotorCount === 4 ? Math.SQRT2 : 1);
  $: tipClearanceM = centerSpacingM - propellerDiameterM;
  $: discAreaM2 = rotorCount * Math.PI * (propellerDiameterM / 2) ** 2 * (layout === 'coaxial' ? 0.5 : 1);
  $: frameAreaM2 = Math.max(frameSizeM * frameSizeM, 0.0001);
  $: occupancyPct = (discAreaM2 / frameAreaM2) * 100;
  $: rotorPositions = rotorCount === 4 ? [{ x: 50, y: 19 }, { x: 81, y: 50 }, { x: 50, y: 81 }, { x: 19, y: 50 }] : Array.from({ length: Math.max(1, Math.min(rotorCount, 12)) }, (_, index) => { const angle = (Math.PI * 2 * index) / rotorCount - Math.PI / 2; return { x: 50 + Math.cos(angle) * 31, y: 50 + Math.sin(angle) * 31 }; });
  const n = (value: number, digits = 0) => Number.isFinite(value) ? value.toFixed(digits) : '—';
</script>

<div class="coverage" aria-label={en ? 'Rotor layout engineering view' : 'نمای مهندسی چیدمان روتورها'}>
  <div class="coverage-metrics">
    <div><span>{en ? 'Tip clearance' : 'فاصلهٔ نوک ملخ'}</span><strong class:danger={tipClearanceM < 0} class="data">{tipClearanceM < 0 ? (en ? 'Interference' : 'تداخل') : `${n(tipClearanceM * 1000)} mm`}</strong></div>
    <div><span>{en ? 'Centre spacing' : 'فاصلهٔ مرکزها'}</span><strong class="data">{n(centerSpacingM * 1000)} mm</strong></div>
    <div><span>{en ? 'Disc area' : 'مساحت دیسک‌ها'}</span><strong class="data">{n(discAreaM2, 2)} m²</strong></div>
    <div><span>{en ? 'Frame occupancy' : 'پوشش سطح فریم'}</span><strong class="data">{n(occupancyPct)}%</strong></div>
  </div>
  <div class="diagram" aria-hidden="true">
    <div class="frame"></div><div class="diagonal diagonal--a"></div><div class="diagonal diagonal--b"></div>
    {#each rotorPositions as position, index}<div class="rotor" class:danger={tipClearanceM < 0} class:coaxial={layout === 'coaxial'} style={`left:${position.x}%;top:${position.y}%;`}><span class="rotor__cap">R{index + 1}</span><i></i></div>{/each}
    <div class="dimension dimension--x"><span>{n(frameSizeM * 1000)} mm</span></div><div class="body"></div>
  </div>
  <div class="coverage-legend"><span><i class="legend-dot"></i>{en ? 'Propeller disc' : 'دیسک ملخ'}</span><span><i class="legend-line"></i>{en ? 'Frame span' : 'ابعاد فریم'}</span><span>{layout === 'coaxial' ? (en ? 'Coaxial layout' : 'آرایش کواکسیال') : (en ? 'Flat layout' : 'آرایش تخت')}</span></div>
</div>

<style>
  .coverage { display:grid; gap:12px; }.coverage-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }.coverage-metrics div { display:grid; gap:4px; min-width:0; border:1px solid var(--line); border-radius:10px; background:var(--paper); padding:9px; }.coverage-metrics span { color:var(--muted); font-size:10px; }.coverage-metrics strong { color:var(--ink); font-size:14px; }.coverage-metrics strong.danger { color:var(--danger); }
  .diagram { position:relative; width:min(100%,380px); aspect-ratio:1; margin-inline:auto; }.frame { position:absolute; inset:20%; border:2px solid var(--line-strong); border-radius:18px; background:var(--paper-deep); transform:rotate(45deg) scale(.86); }.diagonal { position:absolute; inset:49% 10%; height:2px; background:var(--line-strong); transform:rotate(45deg); }.diagonal--b { transform:rotate(-45deg); }.body { position:absolute; left:50%; top:50%; width:25%; height:25%; border:4px solid var(--ink); border-radius:16px; background:var(--surface-strong); transform:translate(-50%,-50%) rotate(45deg); box-shadow:var(--shadow-soft); }.body::after { content:''; position:absolute; inset:35%; border-radius:4px; background:var(--blue); transform:rotate(-45deg); }.rotor { position:absolute; display:grid; width:27%; aspect-ratio:1; place-items:center; border:3px solid var(--blue); border-radius:50%; background:color-mix(in oklch,var(--blue) 18%,transparent); transform:translate(-50%,-50%); transition:transform var(--normal) var(--ease),background-color var(--normal) var(--ease); }.rotor i,.rotor i::before { position:absolute; display:block; width:6px; height:48%; border-radius:99px; background:var(--blue); content:''; transform:rotate(45deg); }.rotor i::before { transform:rotate(90deg); }.rotor__cap { position:relative; z-index:1; color:var(--blue-ink); font-family:var(--font-data); font-size:11px; }.rotor.coaxial { border-style:dashed; }.rotor.danger { border-color:var(--danger); background:color-mix(in oklch,var(--danger) 18%,transparent); }.rotor.danger i,.rotor.danger i::before { background:var(--danger); }.dimension { position:absolute; color:var(--muted); font:11px var(--font-data); }.dimension--x { left:20%; right:20%; bottom:5%; border-top:1px solid var(--line-strong); text-align:center; }.dimension--x span { position:relative; top:5px; background:var(--surface); padding:0 5px; }.coverage-legend { display:flex; justify-content:center; flex-wrap:wrap; gap:8px 16px; color:var(--muted); font-size:11px; }.coverage-legend span { display:inline-flex; align-items:center; gap:6px; }.legend-dot { width:10px; height:10px; border:2px solid var(--blue); border-radius:50%; }.legend-line { width:16px; height:2px; background:var(--line-strong); }
  @media (max-width:560px) { .coverage-metrics { grid-template-columns:repeat(2,minmax(0,1fr)); }.diagram { width:min(100%,330px); } }
</style>
