<script lang="ts">
  import type { CalculationReport } from '$data';
  import { locale } from '$lib/i18n';
  import Icon from './Icon.svelte';
  export let reports: CalculationReport[] = [];
  export let onRedo: (report: CalculationReport) => void;
  let selected: CalculationReport | null = null;
  $: en = $locale === 'en';
  function relative(iso: string): string {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 60) return en ? `${minutes || 1} min ago` : `${minutes || 1} دقیقه پیش`;
    const hours = Math.floor(minutes / 60); if (hours < 24) return en ? `${hours} h ${minutes % 60} min ago` : `${hours} ساعت و ${minutes % 60} دقیقه پیش`;
    const days = Math.floor(hours / 24); if (days < 30) return en ? `${days} d ${hours % 24} h ago` : `${days} روز و ${hours % 24} ساعت پیش`;
    const months = Math.floor(days / 30); if (months < 12) return en ? `${months} mo ${days % 30} d ago` : `${months} ماه و ${days % 30} روز پیش`;
    const years = Math.floor(months / 12); return en ? `${years} y ${months % 12} mo ago` : `${years} سال و ${months % 12} ماه پیش`;
  }
  function title(report: CalculationReport): string { return report.mode === 'advanced' ? (en ? 'Advanced mission' : 'مأموریت پیشرفته') : (en ? 'Simple estimate' : 'برآورد ساده'); }
  function summary(report: CalculationReport): string { const result = report.result as any; return report.mode === 'advanced' ? `${Number(result.flightTimeMin ?? 0).toFixed(1)} min · ${Number(result.rangeKm ?? 0).toFixed(1)} km` : `${Number(result.points?.[0]?.usableTimeMin ?? 0).toFixed(1)} min`; }
  function flightTime(report: CalculationReport): string { const result = report.result as any; return `${Number(report.mode === 'advanced' ? result.flightTimeMin : result.points?.[0]?.usableTimeMin ?? 0).toFixed(1)} min`; }
  function range(report: CalculationReport): string { const result = report.result as any; return `${Number(report.mode === 'advanced' ? result.rangeKm : result.points?.[0]?.rangeKm ?? 0).toFixed(1)} km`; }
</script>

<section class="reports" aria-labelledby="reports-title">
  <header class="reports-head"><div><h1 id="reports-title">{en ? 'Reports' : 'گزارش‌ها'}</h1><p>{en ? 'Saved calculations on this device' : 'محاسبات ذخیره‌شده روی همین دستگاه'}</p></div></header>
  {#if reports.length === 0}<div class="reports-empty"><Icon name="clock" size={28} /><p>{en ? 'No calculations saved yet.' : 'هنوز محاسبه‌ای ذخیره نشده است.'}</p></div>{:else}<div class="reports-list">{#each reports as report}<button class="report-row" type="button" on:click={() => (selected = report)}><span class="report-icon"><Icon name={report.mode === 'advanced' ? 'rocket' : 'calculator'} size={20} /></span><span class="report-copy"><strong>{title(report)}</strong><small>{relative(report.createdAt)} · {summary(report)}</small></span><span class="report-arrow">›</span></button>{/each}</div>{/if}
</section>

{#if selected}<div class="report-backdrop" role="presentation" on:click={() => (selected = null)}><div class="report-sheet" role="dialog" aria-modal="true" aria-labelledby="report-detail-title" tabindex="-1" on:click|stopPropagation on:keydown|stopPropagation><header><div><span class="eyebrow">{relative(selected!.createdAt)}</span><h2 id="report-detail-title">{title(selected!)}</h2></div><button class="report-close" type="button" on:click={() => (selected = null)} aria-label={en ? 'Close' : 'بستن'}>×</button></header><div class="report-detail"><div><span>{en ? 'Flight time' : 'زمان پرواز'}</span><strong>{flightTime(selected!)}</strong></div><div><span>{en ? 'Range' : 'برد'}</span><strong>{range(selected!)}</strong></div></div><button class="redo" type="button" on:click={() => onRedo(selected!)}>{en ? 'Do again' : 'اجرای دوباره'} <span>↗</span></button></div></div>{/if}

<style>
  .reports { display:grid; gap:20px; max-width:760px; margin-inline:auto; }.reports-head h1 { margin:0; font-size:clamp(28px,3vw,40px); letter-spacing:-.05em; }.reports-head p { margin:6px 0 0; color:var(--muted); font-size:13px; }.reports-list { display:grid; gap:8px; }.report-row { display:flex; align-items:center; gap:12px; width:100%; min-height:76px; border:1px solid var(--line); border-radius:14px; background:var(--surface); color:var(--ink); padding:10px 13px; text-align:start; box-shadow:var(--shadow-soft); transition:transform var(--fast) var(--ease), border-color var(--fast) var(--ease); }.report-row:hover { transform:translateY(-2px); border-color:var(--blue); }.report-icon { display:grid; width:42px; height:42px; place-items:center; border-radius:11px; background:var(--blue-soft); color:var(--blue); }.report-copy { display:grid; min-width:0; flex:1; gap:3px; }.report-copy strong { font-size:13px; }.report-copy small { color:var(--muted); font-size:11px; }.report-arrow { color:var(--muted); font-size:24px; }.reports-empty { display:grid; min-height:220px; place-items:center; align-content:center; gap:8px; border:1px dashed var(--line); border-radius:16px; color:var(--muted); }.reports-empty p { margin:0; font-size:13px; }.report-backdrop { position:fixed; inset:0; z-index:55; display:grid; place-items:center; overflow:hidden; background:rgba(7,23,68,.42); padding:22px; }.report-sheet { width:min(440px,100%); border:1px solid var(--line); border-radius:20px; background:var(--surface); padding:20px; box-shadow:0 24px 70px rgba(7,23,68,.28); animation:report-in 200ms var(--ease) both; }.report-sheet header { display:flex; align-items:start; justify-content:space-between; gap:12px; }.report-sheet h2 { margin:3px 0 0; font-size:21px; }.report-close { width:36px; height:36px; border:1px solid var(--line); border-radius:9px; background:var(--surface); color:var(--ink); font-size:23px; }.report-detail { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:18px; }.report-detail div { display:grid; gap:5px; border:1px solid var(--line); border-radius:10px; background:var(--paper); padding:12px; }.report-detail span { color:var(--muted); font-size:11px; }.report-detail strong { font:700 17px var(--font-data); }.redo { width:100%; min-height:46px; margin-top:16px; border:0; border-radius:10px; background:var(--blue); color:#fff; font-weight:700; }.redo span { margin-inline-start:5px; } @keyframes report-in { from{opacity:0; transform:translateY(18px) scale(.98)} to{opacity:1; transform:none} }
  .report-backdrop { z-index: 1000; }
  @media (max-width:560px) { .report-backdrop { align-items:end; padding:0; }.report-sheet { width:100%; max-height:calc(100dvh - 58px); overflow:auto; border-radius:20px 20px 0 0; padding:18px 14px calc(92px + env(safe-area-inset-bottom)); overscroll-behavior:contain; -webkit-overflow-scrolling:touch; } }
</style>
