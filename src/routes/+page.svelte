<script lang="ts">
  import { onMount } from 'svelte';
  import { calculateLegacyExcel, calculateMission, DEFAULT_MISSION_INPUT, type LegacyInput, type LegacyResult, type MissionInput, type MissionResult } from '$core';
  import { initializeAircraftCatalog, initializeComponentCatalog } from '$data';
  import Icon from '$ui/Icon.svelte';
  import LegacyResults from '$ui/LegacyResults.svelte';
  import ComponentGallery from '$ui/ComponentGallery.svelte';
  import MissionForm from '$ui/MissionForm.svelte';
  import ModeTabs from '$ui/ModeTabs.svelte';
  import Preloader from '$ui/Preloader.svelte';
  import ResultPanel from '$ui/ResultPanel.svelte';
  import SettingsPanel from '$ui/SettingsPanel.svelte';
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

  let mode: 'simple' | 'advanced' = 'advanced';
  let view: 'calculator' | 'components' | 'settings' = 'calculator';
  let step = 0;
  let theme: 'light' | 'dark' = 'light';
  let ready = false;
  let missionInput = blankMission();
  let legacyInput = blankLegacy();
  let missionResult: MissionResult | null = null;
  let legacyResult: LegacyResult | null = null;
  let showErrors = false;
  let simpleShowErrors = false;

  onMount(async () => {
    const storedLanguage = localStorage.getItem('open-ecalc.language') ?? localStorage.getItem('open-ecalc.locale');
    const language = storedLanguage === 'fa' || storedLanguage === 'en' ? storedLanguage : (navigator.languages?.some((item) => item.toLowerCase().startsWith('fa')) ? 'fa' : 'en');
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
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
    mode = next; missionResult = null; legacyResult = null; step = 0; showErrors = false; simpleShowErrors = false;
  }
  function setView(next: 'calculator' | 'components' | 'settings') {
    view = next;
    showErrors = false;
    simpleShowErrors = false;
  }

  function applyAircraftProfile(profile: 'mavic2' | 'mavic3') {
    const isMavic3 = profile === 'mavic3';
    missionInput = { ...missionInput, airframe: { ...missionInput.airframe, emptyMassKg: isMavic3 ? 0.895 : 0.907, payloadMassKg: 0, rotorCount: 4, frameSizeM: isMavic3 ? 0.38 : 0.354 }, battery: { ...missionInput.battery, capacityAh: 5, series: 4, parallel: 1, nominalCellVoltageV: 3.85, internalResistanceOhm: 0.06, continuousC: 10, usableFraction: 0.8 }, environment: { ...missionInput.environment, altitudeM: 0, temperatureC: 25, pressurePa: 101325 }, cruiseSpeedMps: isMavic3 ? 9 : 7. }; 
  }

  function valuesReady(values: number[], allowZero = false): boolean { return values.every((value) => Number.isFinite(value) && (allowZero ? value >= 0 : value > 0)); }
  function stepReady(index: number): boolean {
    if (index === 0) return valuesReady([missionInput.airframe.emptyMassKg, missionInput.airframe.rotorCount, missionInput.airframe.frameSizeM]) && Number.isFinite(missionInput.airframe.payloadMassKg) && missionInput.airframe.payloadMassKg >= 0;
    if (index === 1) return Number.isFinite(missionInput.environment.altitudeM) && Number.isFinite(missionInput.environment.temperatureC) && Number.isFinite(missionInput.cruiseSpeedMps) && missionInput.cruiseSpeedMps >= 0;
    if (index === 2) return valuesReady([missionInput.battery.capacityAh, missionInput.battery.series, missionInput.battery.parallel, missionInput.battery.nominalCellVoltageV, missionInput.battery.continuousC, missionInput.battery.usableFraction]) && Number.isFinite(missionInput.battery.internalResistanceOhm) && missionInput.battery.internalResistanceOhm >= 0;
    return valuesReady([missionInput.motor.kv, missionInput.motor.maxCurrentA, missionInput.motor.maxPowerW, missionInput.esc.continuousCurrentA, missionInput.propeller.diameterM, missionInput.propeller.pitchM]);
  }
  function firstIncompleteStep(): number { for (let index = 0; index < 4; index += 1) if (!stepReady(index)) return index; return 3; }
  function goToStep(next: number) { const blocked = firstIncompleteStep(); if (next > blocked) { showErrors = true; step = blocked; return; } showErrors = false; step = next; }
  function advanceStep() { if (!stepReady(step)) { showErrors = true; return; } showErrors = false; step = Math.min(3, step + 1); }
  function calculateSimple() {
    const values = [legacyInput.emptyMassG, legacyInput.payloadMassG, legacyInput.batteryMassG, legacyInput.batteryParallel, legacyInput.cellCapacityAh, legacyInput.rotorCount, legacyInput.speedMps, ...legacyInput.currentPerMotorA];
    if (!valuesReady(values)) { legacyResult = null; simpleShowErrors = true; return; }
    simpleShowErrors = false;
    legacyResult = calculateLegacyExcel(legacyInput);
  }
  function calculateAdvanced() {
    const values = [missionInput.airframe.emptyMassKg, missionInput.airframe.payloadMassKg, missionInput.airframe.rotorCount, missionInput.airframe.frameSizeM, missionInput.environment.altitudeM, missionInput.environment.temperatureC, missionInput.battery.capacityAh, missionInput.battery.series, missionInput.battery.parallel, missionInput.battery.nominalCellVoltageV, missionInput.battery.internalResistanceOhm, missionInput.battery.continuousC, missionInput.battery.usableFraction, missionInput.motor.kv, missionInput.motor.maxCurrentA, missionInput.motor.maxPowerW, missionInput.esc.continuousCurrentA, missionInput.propeller.diameterM, missionInput.propeller.pitchM, missionInput.cruiseSpeedMps];
    const [emptyMass, payloadMass, rotorCount, frameSize, altitude, temperature, capacity, series, parallel, cellVoltage, resistance, continuousC, usableFraction, kv, motorCurrent, motorPower, escCurrent, propDiameter, pitch, cruiseSpeed] = values;
    const valid = [emptyMass, rotorCount, frameSize, capacity, series, parallel, cellVoltage, continuousC, usableFraction, kv, motorCurrent, motorPower, escCurrent, propDiameter, pitch].every((value) => Number.isFinite(value) && value > 0)
      && [payloadMass, altitude, resistance, cruiseSpeed].every((value) => Number.isFinite(value) && value >= 0)
      && Number.isFinite(temperature);
    if (!valid) { missionResult = null; showErrors = true; step = firstIncompleteStep(); return; }
    try { missionResult = calculateMission(missionInput); } catch (error) { console.error('mission calculation failed', error); missionResult = null; }
  }
</script>

<svelte:head><title>محاسب پهپاد</title><meta name="description" content="محاسبهٔ مأموریت و پیشران پهپاد" /></svelte:head>

{#if !ready}
  <Preloader />
{:else}
  <div class:has-result={Boolean(missionResult || legacyResult)} class:scroll-view={view !== 'calculator'} class="app-shell">
    <header class="topbar"><div class="brand"><img src="/icons/open-ecalc-logo.png" alt="" /><strong>محاسب پهپاد</strong></div><div class="topbar__actions"><ThemeToggle {theme} onChange={setTheme} /></div></header>
    <div class="app-body">
      <nav class="side-nav" aria-label="بخش‌ها">
        <button class:active={view === 'calculator'} class="nav-item" type="button" aria-current={view === 'calculator' ? 'page' : undefined} on:click={() => setView('calculator')}><Icon name="calculator" size={30} /><small>محاسبه</small></button>
        <button class:active={view === 'components'} class="nav-item" type="button" aria-current={view === 'components' ? 'page' : undefined} on:click={() => setView('components')}><Icon name="components" size={30} /><small>قطعات</small></button>
        <button class:active={view === 'settings'} class="nav-item" type="button" on:click={() => setView('settings')}><Icon name="settings" size={30} /><small>تنظیمات</small></button>
      </nav>
      <main class="workspace">
      {#if view === 'components'}
        <ComponentGallery />
      {:else if view === 'settings'}
        <SettingsPanel {theme} onThemeChange={setTheme} />
      {:else}
      <div class="workspace__head"><ModeTabs value={mode} onChange={setMode} /></div>
      {#if mode === 'simple'}
        <div class="simple-layout"><SimpleCalculator bind:input={legacyInput} showErrors={simpleShowErrors} onCalculate={calculateSimple} /><LegacyResults result={legacyResult} /></div>
      {:else}
        <StepTabs value={step} canOpen={(next) => next <= firstIncompleteStep()} onChange={goToStep} />
        <div class="advanced-layout"><section class="input-area"><MissionForm bind:input={missionInput} {step} invalidStep={showErrors ? step : -1} onApplyProfile={applyAircraftProfile} /><div class="actions"><button type="button" class="back" disabled={step === 0} on:click={() => goToStep(step - 1)}>بازگشت</button>{#if step < 3}<button type="button" class="next" on:click={advanceStep}>مرحلهٔ بعد <span>←</span></button>{:else}<button type="button" class="next" on:click={calculateAdvanced}>محاسبه <span>↗</span></button>{/if}</div></section></div>
      {/if}
      {/if}
      </main>
    </div>
    <nav class="bottom-nav" aria-label="بخش‌ها">
      <button class:active={view === 'components'} class="nav-item" type="button" on:click={() => setView('components')}><Icon name="components" size={20} /><small>قطعات</small></button>
      <button class:active={view === 'calculator'} class="nav-item" type="button" aria-current={view === 'calculator' ? 'page' : undefined} on:click={() => setView('calculator')}><Icon name="calculator" size={20} /><small>محاسبه</small></button>
      <button class:active={view === 'settings'} class="nav-item" type="button" on:click={() => setView('settings')}><Icon name="settings" size={20} /><small>تنظیمات</small></button>
    </nav>
  </div>
  {#if missionResult}
    <div class="result-backdrop" role="presentation" on:click={() => (missionResult = null)}><div class="result-dialog" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="result-dialog-title" on:click|stopPropagation on:keydown|stopPropagation><header class="result-dialog__head"><h2 id="result-dialog-title">نتیجهٔ محاسبه</h2><button type="button" class="result-close" aria-label="بستن" on:click={() => (missionResult = null)}>×</button></header><ResultPanel result={missionResult} input={missionInput} /></div></div>
  {/if}
{/if}

<style>
  .app-shell { min-height: 100dvh; background: var(--paper); }
  :global(html[dir='ltr']) .workspace { direction: ltr; }
  :global(html[dir='ltr']) .input-area { direction: ltr; }
  :global(html[dir='ltr']) .side-nav { direction: ltr; }
  .brand { display: flex; align-items: center; gap: 11px; }.brand strong { display: block; font-size: 20px; line-height: 1.1; }
  .app-body { display: grid; grid-template-columns: 176px minmax(0, 1fr); align-items: start; gap: 12px; padding: 12px 14px; direction: ltr; }.workspace { min-width: 0; padding: clamp(18px, 2vw, 32px); direction: rtl; }.workspace__head { display: flex; align-items: center; justify-content: flex-start; gap: 24px; margin-bottom: 14px; }
  .side-nav { display: grid; align-self: start; gap: 3px; direction: rtl; border: 1px solid var(--line); border-radius: 15px; background: var(--surface); padding: 9px 8px; }.nav-item { display: grid; grid-template-columns: 38px 1fr; min-height: 58px; place-items: center start; gap: 0 7px; border: 1px solid transparent; border-inline-start: 3px solid transparent; border-radius: 11px; background: transparent; color: var(--muted); padding-inline: 9px; text-align: start; }.nav-item :global(svg) { grid-row: 1 / span 2; color: var(--ink); }.nav-item small { color: var(--ink); font-size: 13px; font-weight: 800; }.nav-item.active { border-color: var(--blue); background: var(--blue-soft); }.nav-item.active :global(svg), .nav-item.active small { color: var(--blue); }.bottom-nav { display: none; }
  .simple-layout, .advanced-layout { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); gap: 28px; align-items: start; direction: ltr; }.advanced-layout { margin-top: 28px; }.input-area { min-width: 0; direction: rtl; }.actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 24px; }.actions button { min-height: 52px; border-radius: 13px; padding-inline: 22px; white-space: nowrap; }.back { border: 1px solid var(--line); background: var(--surface); color: var(--ink-soft); }.next { border: 0; background: var(--blue); color: white; box-shadow: 0 4px 0 var(--blue-ink); font-weight: 700; transition: transform var(--fast) var(--ease), box-shadow var(--fast) var(--ease); }.next:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--blue-ink); }.actions button:disabled { cursor: not-allowed; opacity: .4; }
  .result-backdrop { position: fixed; inset: 0; z-index: 35; display: grid; place-items: center; background: rgba(7, 23, 68, .42); padding: 28px; animation: fade-in 180ms ease both; }.result-dialog { width: min(1040px, 100%); max-height: calc(100dvh - 56px); overflow: auto; border: 1px solid var(--line); border-radius: 22px; background: var(--paper); box-shadow: 0 24px 70px rgba(7, 23, 68, .28); padding: 22px; animation: dialog-in 220ms var(--ease) both; }.result-dialog__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }.result-dialog__head h2 { margin: 0; font-size: 20px; }.result-close { width: 40px; height: 40px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font-size: 25px; line-height: 1; }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } @keyframes dialog-in { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
  @media (max-width: 900px) { .simple-layout, .advanced-layout { grid-template-columns: minmax(0, 1fr); }.simple-layout > :global(.legacy-results) { order: 2; } }

  .topbar { display: flex; min-height: 62px; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); background: var(--surface); padding: 8px 18px; direction: ltr; }.topbar .brand { min-width: 0; gap: 10px; }.topbar .brand img { width: 36px; height: 36px; object-fit: contain; }.topbar .brand strong { color: var(--ink); font-size: 18px; }.topbar__actions { display: flex; align-items: center; }
  @media (max-width: 900px) { .app-body { padding: 10px; }.side-nav { display: none; }.workspace { padding: 14px; } }
  @media (max-width: 560px) { .app-body { padding: 70px 0 104px; display: block; }.topbar { position: fixed; inset: 0 0 auto; z-index: 55; min-height: 58px; padding: 8px 14px; border-radius: 0 0 18px 18px; overflow: hidden; }.topbar .brand img { width: 34px; height: 34px; }.topbar .brand strong { font-size: 17px; }.workspace { border-radius: 0; padding: 14px 12px; }.bottom-nav { position: fixed; inset: auto 0 0; z-index: 50; display: grid; grid-template-columns: repeat(3, 1fr); min-height: 74px; align-items: stretch; border-top: 1px solid var(--line); border-radius: 18px 18px 0 0; background: color-mix(in srgb, var(--surface) 94%, transparent); padding: 7px 12px calc(7px + env(safe-area-inset-bottom)); box-shadow: 0 -10px 26px rgba(7, 23, 68, .08); backdrop-filter: blur(14px); }.bottom-nav .nav-item { display: grid; grid-template-columns: 1fr; min-height: 58px; place-items: center; gap: 3px; border: 1px solid transparent; border-radius: 11px; padding: 5px; text-align: center; }.bottom-nav .nav-item :global(svg) { grid-row: auto; }.bottom-nav .nav-item small { font-size: 11px; }.bottom-nav .nav-item.active { border-color: transparent; background: var(--blue-soft); } .actions { position: sticky; bottom: 82px; z-index: 4; padding: 9px 0; background: linear-gradient(to bottom, color-mix(in srgb, var(--paper) 0%, transparent), var(--paper) 38%); }.result-backdrop { place-items: end; padding: 0 0 86px; }.result-dialog { width: 100%; max-height: calc(100dvh - 120px); border-radius: 22px 22px 0 0; padding: 16px 12px 24px; } }
</style>
