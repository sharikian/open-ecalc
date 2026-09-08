<script lang="ts">
  import BrandMark from './BrandMark.svelte';
  export let title: string;
  export let locale: 'fa' | 'en';
  export let onLocaleChange: (next: 'fa' | 'en') => void;
</script>

<header class="topbar">
  <div class="topbar__title"><BrandMark size={30} decorative /><div><strong>{title}</strong></div></div>
  <div class="topbar__actions">
    <button class="lang" type="button" aria-label={locale === 'fa' ? 'تغییر زبان' : 'Change language'} on:click={() => onLocaleChange(locale === 'fa' ? 'en' : 'fa')}>{locale === 'fa' ? 'EN' : 'فا'}</button>
    <span class="status"><i aria-hidden="true"></i>{locale === 'fa' ? 'آفلاین' : 'Offline'}</span>
  </div>
</header>

<style>
  .topbar { display: flex; min-height: 72px; align-items: center; justify-content: space-between; border-block-end: 1px solid var(--color-rule); padding: var(--space-sm) clamp(1rem, 3vw, 2.5rem); }
  .topbar__title, .topbar__actions { display: flex; align-items: center; gap: var(--space-sm); }
  .topbar__title strong { display: block; font-family: var(--font-display); font-size: var(--text-md); line-height: 1.1; }
  .lang { min-width: 44px; min-height: 44px; border: 1px solid var(--color-rule-2); border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-ink-2); font-family: var(--font-mono); font-size: var(--text-xs); }
  .status { display: inline-flex; align-items: center; gap: var(--space-xs); color: var(--color-muted); font-size: var(--text-sm); }
  .status i { width: 7px; height: 7px; border-radius: 50%; background: var(--color-success); }
</style>
