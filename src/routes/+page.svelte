<script lang="ts">
  import { onMount } from 'svelte';
  import { calculateMission, DEFAULT_MISSION_INPUT, type MissionInput, type MissionResult } from '$core';
  import { initializeComponentCatalog } from '$data';
  import { locale, t } from '$lib/i18n';
  import MissionForm from '$ui/MissionForm.svelte';
  import NavRail from '$ui/NavRail.svelte';
  import Preloader from '$ui/Preloader.svelte';
  import ResultPanel from '$ui/ResultPanel.svelte';
  import TopBar from '$ui/TopBar.svelte';

  let input: MissionInput = structuredClone(DEFAULT_MISSION_INPUT);
  let result: MissionResult = calculateMission(input);
  let step = 0;
  let ready = false;
  let catalogReady = false;

  onMount(async () => {
    await Promise.all([initializeComponentCatalog(), document.fonts?.ready]);
    catalogReady = true;
    ready = true;
  });

  function recalculate() {
    result = calculateMission(input);
  }

  function toggleLocale(next: 'fa' | 'en') {
    locale.set(next);
  }
</script>

<svelte:head><title>{$t('appName')} — Open eCalc</title></svelte:head>

{#if !ready}
  <Preloader />
{:else}
  <NavRail active="calculator" labels={{ calculator: $t('calculator'), components: $t('components'), settings: $t('settings') }} />
  <div class="app-frame">
    <TopBar title={$t('calculator')} projectName="Mission 01" locale={$locale} onLocaleChange={toggleLocale} />
    <main class="workbench">
      <section class="workbench__intro"><div><span class="eyebrow">مأموریت / 01</span><h1>بررسی مأموریت</h1><p>پارامترها را وارد کنید؛ نتیجه با مدل Legacy و افت ولتاژ محاسبه می‌شود.</p></div><div class="catalog-state"><span class:ready={catalogReady}></span>{catalogReady ? 'بانک محلی آماده' : 'بانک محلی'}</div></section>
      <div class="stepper" role="tablist" aria-label="Mission steps">
        {#each ['airframe', 'environment', 'battery', 'propulsion'] as section, index}<button type="button" role="tab" aria-selected={step === index} class:active={step === index} on:click={() => (step = index)}><span class="mono">0{index + 1}</span><span>{$t(section as 'airframe' | 'environment' | 'battery' | 'propulsion')}</span></button>{/each}
      </div>
      <div class="workbench__grid">
        <section class="input-column"><MissionForm bind:input {step} /><div class="form-actions"><button class="secondary" type="button" on:click={() => (step = Math.max(0, step - 1))} disabled={step === 0}>{$t('back')}</button>{#if step < 3}<button class="primary" type="button" on:click={() => (step += 1)}>{$t('next')} <span aria-hidden="true">←</span></button>{:else}<button class="primary" type="button" on:click={recalculate}>{$t('calculate')} <span aria-hidden="true">↗</span></button>{/if}</div></section>
        <aside class="result-column"><ResultPanel {result} {input} /></aside>
      </div>
    </main>
  </div>
{/if}

<style>
  .app-frame { min-height: 100dvh; padding-inline-start: 76px; }
  .workbench { width: min(1500px, 100%); margin: 0 auto; padding: var(--space-xl) clamp(1rem, 4vw, 3.5rem) var(--space-3xl); }
  .workbench__intro { display: flex; align-items: end; justify-content: space-between; gap: var(--space-lg); padding-block-end: var(--space-lg); }
  .eyebrow { color: var(--color-muted); font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: 0.09em; }
  h1 { margin: var(--space-xs) 0; font-family: var(--font-display); font-size: clamp(2rem, 3vw, 3.2rem); letter-spacing: -0.04em; line-height: 1.05; overflow-wrap: anywhere; }
  .workbench__intro p { max-width: 52ch; margin: 0; color: var(--color-muted); }
  .catalog-state { display: flex; align-items: center; gap: var(--space-xs); color: var(--color-muted); font-size: var(--text-sm); white-space: nowrap; }
  .catalog-state span { width: 8px; height: 8px; border-radius: 50%; background: var(--color-warning); }.catalog-state span.ready { background: var(--color-success); }
  .stepper { display: flex; gap: var(--space-2xs); overflow-x: auto; border-block: 1px solid var(--color-rule); padding-block: var(--space-xs); }
  .stepper button { display: inline-flex; min-height: 44px; align-items: center; gap: var(--space-xs); border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--color-muted); padding: var(--space-xs) var(--space-sm); white-space: nowrap; }
  .stepper button.active { background: var(--color-paper-2); color: var(--color-accent); }.stepper button span:first-child { font-size: var(--text-xs); }
  .workbench__grid { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); align-items: start; gap: clamp(var(--space-xl), 5vw, var(--space-3xl)); }
  .input-column { min-width: 0; }.result-column { position: sticky; top: var(--space-lg); min-width: 0; padding-block-start: var(--space-lg); }
  .form-actions { display: flex; justify-content: space-between; gap: var(--space-sm); padding-block-start: var(--space-lg); }
  .form-actions button { min-height: 48px; border-radius: var(--radius-sm); padding-inline: var(--space-lg); white-space: nowrap; }.primary { border: 1px solid var(--color-accent); background: var(--color-accent); color: var(--color-accent-ink); }.secondary { border: 1px solid var(--color-rule-2); background: var(--color-surface); color: var(--color-ink-2); }.form-actions button:disabled { cursor: not-allowed; opacity: 0.45; }
  @media (hover: hover) and (pointer: fine) { .form-actions button:not(:disabled):hover { transform: translateY(-1px); } }
  @media (max-width: 60rem) { .workbench__grid { grid-template-columns: minmax(0, 1fr); }.result-column { position: static; padding-block-start: var(--space-xl); } }
  @media (max-width: 40rem) { .app-frame { padding-inline-start: 0; padding-block-end: 70px; }.workbench { padding-block-start: var(--space-lg); }.workbench__intro { align-items: start; flex-direction: column; }.catalog-state { order: -1; }.stepper { margin-inline: calc(var(--space-md) * -1); padding-inline: var(--space-md); }.form-actions { position: sticky; inset-block-end: 68px; z-index: var(--z-sticky); margin-inline: calc(var(--space-md) * -1); background: var(--color-paper); padding: var(--space-sm) var(--space-md); }.form-actions button { flex: 1; } }
</style>
