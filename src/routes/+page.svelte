<script lang="ts">
  import { onMount } from 'svelte';
  import { calculateLegacyExcel, calculateMission, DEFAULT_MISSION_INPUT, type LegacyInput, type LegacyResult, type MissionInput, type MissionResult } from '$core';
  import { initializeAircraftCatalog, initializeComponentCatalog } from '$data';
  import LegacyResults from '$ui/LegacyResults.svelte';
  import ComponentGallery from '$ui/ComponentGallery.svelte';
  import MissionForm from '$ui/MissionForm.svelte';
  import ModeTabs from '$ui/ModeTabs.svelte';
  import Preloader from '$ui/Preloader.svelte';
  import ResultPanel from '$ui/ResultPanel.svelte';
  import SimpleCalculator from '$ui/SimpleCalculator.svelte';
  import StepTabs from '$ui/StepTabs.svelte';
  import ThemeToggle from '$ui/ThemeToggle.svelte';

  const empty = '' as unknown as number;
  const blankMission = (): MissionInput => {
    const input = structuredClone(DEFAULT_MISSION_INPUT);
    input.airframe.emptyMassKg = empty; input.airframe.payloadMassKg = empty; input.airframe.rotorCount = empty; input.airframe.frameSizeM = empty;
    input.environment.altitudeM = empty; input.environment.temperatureC = empty; input.environment.pressurePa = empty; input.cruiseSpeedMps = empty;
    input.battery.capacityAh = empty; input.battery.series = empty; input.battery.parallel = empty; input.battery.nominalCellVoltageV = empty; input.battery.internalResistanceOhm = empty; input.battery.continuousC = empty; input.battery.usableFraction = empty;
    input.motor.kv = empty; input.motor.maxCurrentA = empty; input.motor.maxPowerW = empty; input.esc.continuousCurrentA = empty; input.propeller.diameterM = empty; input.propeller.pitchM = empty;
    return input;
  };
  const blankLegacy = (): LegacyInput => ({ emptyMassG: empty, payloadMassG: empty, batteryMassG: empty, batteryParallel: empty, cellCapacityAh: empty, rotorCount: empty, speedMps: empty, currentPerMotorA: [empty] });

  let mode: 'simple' | 'advanced' = 'simple';
  let view: 'calculator' | 'components' = 'calculator';
  let step = 0;
  let theme: 'light' | 'dark' = 'light';
  let ready = false;
  let missionInput = blankMission();
  let legacyInput = blankLegacy();
  let missionResult: MissionResult | null = null;
  let legacyResult: LegacyResult | null = null;

  onMount(async () => {
    const storedTheme = localStorage.getItem('open-ecalc.theme');
    theme = storedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    await Promise.all([initializeComponentCatalog(), initializeAircraftCatalog(), document.fonts?.ready]);
    ready = true;
  });

  function setTheme(next: 'light' | 'dark') {
    theme = next; localStorage.setItem('open-ecalc.theme', next); document.documentElement.dataset.theme = next;
  }

  function setMode(next: 'simple' | 'advanced') {
    mode = next; missionResult = null; legacyResult = null; step = 0;
  }

  function valuesReady(values: number[]): boolean { return values.every((value) => Number.isFinite(value) && value > 0); }
  function calculateSimple() {
    const values = [legacyInput.emptyMassG, legacyInput.payloadMassG, legacyInput.batteryMassG, legacyInput.batteryParallel, legacyInput.cellCapacityAh, legacyInput.rotorCount, legacyInput.speedMps, ...legacyInput.currentPerMotorA];
    if (!valuesReady(values)) { legacyResult = null; return; }
    legacyResult = calculateLegacyExcel(legacyInput);
  }
  function calculateAdvanced() {
    const values = [missionInput.airframe.emptyMassKg, missionInput.airframe.payloadMassKg, missionInput.airframe.rotorCount, missionInput.airframe.frameSizeM, missionInput.environment.altitudeM, missionInput.environment.temperatureC, missionInput.battery.capacityAh, missionInput.battery.series, missionInput.battery.parallel, missionInput.battery.nominalCellVoltageV, missionInput.battery.internalResistanceOhm, missionInput.battery.continuousC, missionInput.battery.usableFraction, missionInput.motor.kv, missionInput.motor.maxCurrentA, missionInput.motor.maxPowerW, missionInput.esc.continuousCurrentA, missionInput.propeller.diameterM, missionInput.propeller.pitchM, missionInput.cruiseSpeedMps];
    if (!valuesReady(values)) { missionResult = null; return; }
    missionResult = calculateMission(missionInput);
  }
</script>

<svelte:head><title>محاسب پهپاد</title><meta name="description" content="محاسبهٔ مأموریت و پیشران پهپاد" /></svelte:head>

{#if !ready}
  <Preloader />
{:else}
  <div class="app-shell">
    <div class="toolbar"><div class="brand"><span class="brand-mark"><i></i><i></i><i></i><i></i></span><strong>محاسب پهپاد</strong></div><ThemeToggle {theme} onChange={setTheme} /></div>
    <div class="app-body">
      <nav class="side-nav" aria-label="بخش‌ها">
        <button class:active={view === 'calculator'} class="nav-item" type="button" aria-current={view === 'calculator' ? 'page' : undefined} on:click={() => (view = 'calculator')}><span aria-hidden="true">⌁</span><small>محاسبه</small></button>
        <button class:active={view === 'components'} class="nav-item" type="button" aria-current={view === 'components' ? 'page' : undefined} on:click={() => (view = 'components')}><span aria-hidden="true">◫</span><small>قطعات</small></button>
        <button class="nav-item" type="button"><span aria-hidden="true">▱</span><small>پروژه‌ها</small></button>
        <button class="nav-item" type="button"><span aria-hidden="true">⚙</span><small>تنظیمات</small></button>
      </nav>
      <main class="workspace">
      {#if view === 'components'}
        <ComponentGallery />
      {:else}
      <div class="workspace__head"><div><h1>محاسبهٔ پرواز</h1><p>ورودی‌ها را وارد کنید.</p></div><ModeTabs value={mode} onChange={setMode} /></div>
      {#if mode === 'simple'}
        <div class="simple-layout"><SimpleCalculator bind:input={legacyInput} onCalculate={calculateSimple} /><LegacyResults result={legacyResult} /></div>
      {:else}
        <StepTabs value={step} onChange={(next) => (step = next)} />
        <div class="advanced-layout"><section class="input-area"><MissionForm bind:input={missionInput} {step} /><div class="actions"><button type="button" class="back" disabled={step === 0} on:click={() => (step -= 1)}>بازگشت</button>{#if step < 3}<button type="button" class="next" on:click={() => (step += 1)}>مرحلهٔ بعد <span>←</span></button>{:else}<button type="button" class="next" on:click={calculateAdvanced}>محاسبه <span>↗</span></button>{/if}</div></section><section class="result-area"><ResultPanel result={missionResult} input={missionInput} /></section></div>
      {/if}
      {/if}
      </main>
    </div>
    <nav class="bottom-nav" aria-label="بخش‌ها">
      <button class:active={view === 'calculator'} class="nav-item" type="button" aria-current={view === 'calculator' ? 'page' : undefined} on:click={() => (view = 'calculator')}><span aria-hidden="true">⌁</span><small>محاسبه</small></button>
      <button class:active={view === 'components'} class="nav-item" type="button" aria-current={view === 'components' ? 'page' : undefined} on:click={() => (view = 'components')}><span aria-hidden="true">◫</span><small>قطعات</small></button>
      <button class="nav-item" type="button"><span aria-hidden="true">▱</span><small>پروژه‌ها</small></button>
      <button class="nav-item" type="button"><span aria-hidden="true">⚙</span><small>تنظیمات</small></button>
    </nav>
  </div>
{/if}

<style>
  .app-shell { min-height: 100dvh; padding: 18px clamp(16px, 3vw, 48px) 40px; }
  .toolbar { display: flex; max-width: 1420px; margin: 0 auto 22px; align-items: center; justify-content: space-between; }.brand { display: flex; align-items: center; gap: 11px; }.brand strong { display: block; font-size: 20px; line-height: 1.1; }
  .brand-mark { position: relative; display: grid; width: 42px; height: 42px; place-items: center; border-radius: 13px; background: var(--ink); transform: rotate(45deg); }.brand-mark::after { position: absolute; width: 8px; height: 8px; border-radius: 3px; background: var(--blue); content: ''; }.brand-mark i { position: absolute; width: 7px; height: 15px; border-radius: 5px; background: var(--blue); }.brand-mark i:nth-child(1) { inset-block-start: 4px; }.brand-mark i:nth-child(2) { inset-inline-end: 4px; transform: rotate(90deg); }.brand-mark i:nth-child(3) { inset-block-end: 4px; }.brand-mark i:nth-child(4) { inset-inline-start: 4px; transform: rotate(90deg); }
  .app-body { display: grid; grid-template-columns: 72px minmax(0, 1fr); align-items: start; gap: 18px; max-width: 1500px; margin: 0 auto; direction: ltr; }.workspace { min-width: 0; border: 1px solid var(--line); border-radius: 22px; background: color-mix(in oklch, var(--surface) 86%, transparent); box-shadow: var(--shadow); padding: clamp(18px, 3vw, 34px); direction: rtl; }.workspace__head { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }.workspace__head h1 { margin: 0; font-size: clamp(28px, 3vw, 42px); letter-spacing: -0.055em; }.workspace__head p { margin: 7px 0 0; color: var(--muted); font-size: 14px; }
  .side-nav { display: grid; gap: 8px; padding-top: 12px; direction: rtl; }.nav-item { display: grid; min-height: 68px; place-items: center; gap: 3px; border: 1px solid transparent; border-radius: 14px; background: transparent; color: var(--muted); }.nav-item span { font-size: 22px; line-height: 1; }.nav-item small { font-size: 11px; }.nav-item.active { border-color: var(--line); background: var(--surface); color: var(--blue); box-shadow: var(--shadow-soft); }.bottom-nav { display: none; }
  .simple-layout, .advanced-layout { display: grid; grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr); gap: clamp(22px, 4vw, 56px); align-items: start; direction: ltr; }.advanced-layout { grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); margin-top: 28px; }.input-area, .result-area { min-width: 0; direction: rtl; }.result-area { position: sticky; top: 18px; }.actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 24px; }.actions button { min-height: 52px; border-radius: 13px; padding-inline: 22px; white-space: nowrap; }.back { border: 1px solid var(--line); background: var(--surface); color: var(--ink-soft); }.next { border: 0; background: var(--blue); color: white; box-shadow: 0 4px 0 var(--blue-ink); font-weight: 700; transition: transform var(--fast) var(--ease), box-shadow var(--fast) var(--ease); }.next:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--blue-ink); }.actions button:disabled { cursor: not-allowed; opacity: .4; }
  @media (max-width: 900px) { .simple-layout, .advanced-layout { grid-template-columns: minmax(0, 1fr); }.result-area { position: static; }.simple-layout > :global(.legacy-results) { order: 2; } }
  @media (max-width: 560px) { .app-shell { padding: 12px 12px 88px; }.toolbar { margin-bottom: 14px; }.app-body { display: block; }.side-nav { display: none; }.bottom-nav { position: fixed; inset-inline: 10px; bottom: 10px; z-index: 20; display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; padding: 5px; border: 1px solid var(--line); border-radius: 17px; background: color-mix(in oklch, var(--surface) 92%, transparent); box-shadow: var(--shadow); backdrop-filter: blur(12px); direction: rtl; }.bottom-nav .nav-item { min-height: 54px; border-radius: 12px; }.bottom-nav .nav-item span { font-size: 18px; }.workspace { border-radius: 18px; padding: 16px; }.workspace__head { display: grid; gap: 18px; margin-bottom: 22px; }.workspace__head h1 { font-size: 30px; }.workspace__head p { font-size: 13px; }.workspace__head :global(.modes) { width: 100%; max-width: none; }.simple-layout, .advanced-layout { gap: 30px; }.advanced-layout { margin-top: 22px; }.result-area { order: 2; }.actions { position: sticky; bottom: 72px; z-index: 3; margin-inline: -4px; padding: 8px 4px; background: color-mix(in oklch, var(--paper) 92%, transparent); backdrop-filter: blur(8px); }.actions button { flex: 1; padding-inline: 10px; } }
</style>
