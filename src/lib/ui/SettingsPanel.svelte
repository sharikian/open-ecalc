<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  export let theme: 'light' | 'dark' = 'light';
  export let onThemeChange: (theme: 'light' | 'dark') => void;
  let units: 'metric' | 'imperial' = 'metric';
  let language: 'fa' | 'en' = 'fa';
  onMount(() => {
    const storedUnits = localStorage.getItem('open-ecalc.units');
    const storedLanguage = localStorage.getItem('open-ecalc.language');
    if (storedUnits === 'metric' || storedUnits === 'imperial') units = storedUnits;
    if (storedLanguage === 'fa' || storedLanguage === 'en') language = storedLanguage;
  });
  function persist() { localStorage.setItem('open-ecalc.units', units); localStorage.setItem('open-ecalc.language', language); }
</script>

<section class="settings-page" aria-labelledby="settings-title">
  <header class="settings-head"><div><span class="eyebrow">تنظیمات</span><h1 id="settings-title">تنظیمات برنامه</h1><p>واحدها و رفتار نمایش را تنظیم کنید.</p></div></header>
  <div class="settings-grid">
    <section class="settings-card"><div class="settings-card__title"><Icon name="sliders" size={23} /><div><h2>نمایش محاسبات</h2><p>واحدهایی که در فرم و نتیجه دیده می‌شوند.</p></div></div><label><span>سیستم واحد</span><select bind:value={units} on:change={persist}><option value="metric">متریک (SI)</option><option value="imperial">امپریال</option></select></label><label><span>زبان</span><select bind:value={language} on:change={persist}><option value="fa">فارسی</option><option value="en">English</option></select></label></section>
    <section class="settings-card"><div class="settings-card__title"><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={23} /><div><h2>ظاهر برنامه</h2><p>رنگ و کنتراست محیط کار.</p></div></div><button class="theme-choice" type="button" on:click={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}><span class="theme-swatch" class:dark={theme === 'dark'}></span><span>{theme === 'light' ? 'روشن' : 'تیره'}</span><b>تغییر</b></button><p class="settings-note">تنظیمات در همین دستگاه ذخیره می‌شود.</p></section>
    <section class="settings-card settings-card--wide"><div class="settings-card__title"><Icon name="components" size={23} /><div><h2>منابع داده</h2><p>فهرست قطعات و مدل‌های پرنده به‌صورت آفلاین همراه برنامه نگه‌داری می‌شود.</p></div></div><div class="data-row"><span>قطعات پایه</span><strong class="data">۸</strong></div><div class="data-row"><span>پروفایل پرنده</span><strong class="data">۱۵۹</strong></div><div class="data-row"><span>منابع خام</span><strong class="data">۵ منبع</strong></div></section>
  </div>
</section>

<style>
  .settings-page { display: grid; gap: 24px; }.settings-head { display: flex; align-items: end; justify-content: space-between; gap: 20px; }.eyebrow { color: var(--blue); font-size: 13px; }.settings-head h1 { margin: 5px 0 0; font-size: clamp(28px, 3vw, 42px); letter-spacing: -0.05em; }.settings-head p { margin: 6px 0 0; color: var(--muted); font-size: 13px; }.settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.settings-card { display: grid; align-content: start; gap: 18px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 22px; box-shadow: var(--shadow-soft); }.settings-card--wide { grid-column: 1 / -1; }.settings-card__title { display: flex; align-items: flex-start; gap: 12px; }.settings-card__title :global(svg) { color: var(--blue); }.settings-card h2 { margin: 0; font-size: 18px; }.settings-card p { margin: 3px 0 0; color: var(--muted); font-size: 12px; }.settings-card label { display: grid; gap: 7px; color: var(--ink-soft); font-size: 13px; }.settings-card select { min-height: 48px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: var(--ink); padding-inline: 12px; }.theme-choice { display: flex; align-items: center; gap: 10px; min-height: 52px; border: 1px solid var(--line); border-radius: 11px; background: var(--paper); color: var(--ink); padding-inline: 12px; text-align: start; }.theme-choice b { margin-inline-start: auto; color: var(--blue); font-size: 12px; }.theme-swatch { width: 28px; height: 28px; border-radius: 9px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--line); }.theme-swatch.dark { background: #101a35; box-shadow: inset 0 0 0 1px #263967; }.settings-note { font-size: 12px; }.data-row { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 11px; color: var(--ink-soft); }.data-row strong { color: var(--blue); }
  @media (max-width: 640px) { .settings-head { align-items: start; }.settings-grid { grid-template-columns: minmax(0, 1fr); }.settings-card--wide { grid-column: auto; } }
</style>
