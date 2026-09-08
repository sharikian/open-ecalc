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
  let view: 'calculator' | 'components' | 'settings' | 'projects' | 'results' = 'calculator';
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

  function applyAircraftProfile(profile: 'mavic2' | 'mavic3') {
    const isMavic3 = profile === 'mavic3';
    missionInput = { ...missionInput, airframe: { ...missionInput.airframe, emptyMassKg: isMavic3 ? 0.895 : 0.907, payloadMassKg: 0, rotorCount: 4, frameSizeM: isMavic3 ? 0.38 : 0.354 }, battery: { ...missionInput.battery, capacityAh: 5, series: 4, parallel: 1, nominalCellVoltageV: 3.85, internalResistanceOhm: 0.06, continuousC: 10, usableFraction: 0.8 }, environment: { ...missionInput.environment, altitudeM: 0, temperatureC: 25, pressurePa: 101325 }, cruiseSpeedMps: isMavic3 ? 9 : 7. }; 
  }

  function valuesReady(values: number[], allowZero = false): boolean { return values.every((value) => Number.isFinite(value) && (allowZero ? value >= 0 : value > 0)); }
  function calculateSimple() {
    const values = [legacyInput.emptyMassG, legacyInput.payloadMassG, legacyInput.batteryMassG, legacyInput.batteryParallel, legacyInput.cellCapacityAh, legacyInput.rotorCount, legacyInput.speedMps, ...legacyInput.currentPerMotorA];
    if (!valuesReady(values)) { legacyResult = null; return; }
    legacyResult = calculateLegacyExcel(legacyInput);
  }
  function calculateAdvanced() {
    const values = [missionInput.airframe.emptyMassKg, missionInput.airframe.payloadMassKg, missionInput.airframe.rotorCount, missionInput.airframe.frameSizeM, missionInput.environment.altitudeM, missionInput.environment.temperatureC, missionInput.battery.capacityAh, missionInput.battery.series, missionInput.battery.parallel, missionInput.battery.nominalCellVoltageV, missionInput.battery.internalResistanceOhm, missionInput.battery.continuousC, missionInput.battery.usableFraction, missionInput.motor.kv, missionInput.motor.maxCurrentA, missionInput.motor.maxPowerW, missionInput.esc.continuousCurrentA, missionInput.propeller.diameterM, missionInput.propeller.pitchM, missionInput.cruiseSpeedMps];
    const [emptyMass, payloadMass, rotorCount, frameSize, altitude, temperature, capacity, series, parallel, cellVoltage, resistance, continuousC, usableFraction, kv, motorCurrent, motorPower, escCurrent, propDiameter, pitch, cruiseSpeed] = values;
    const valid = [emptyMass, rotorCount, frameSize, capacity, series, parallel, cellVoltage, continuousC, usableFraction, kv, motorCurrent, motorPower, escCurrent, propDiameter, pitch].every((value) => Number.isFinite(value) && value > 0)
      && [payloadMass, altitude, resistance, cruiseSpeed].every((value) => Number.isFinite(value) && value >= 0)
      && Number.isFinite(temperature);
    if (!valid) { missionResult = null; return; }
    try { missionResult = calculateMission(missionInput); } catch (error) { console.error('mission calculation failed', error); missionResult = null; }
  }
</script>

<svelte:head><title>محاسب پهپاد</title><meta name="description" content="محاسبهٔ مأموریت و پیشران پهپاد" /></svelte:head>

{#if !ready}
  <Preloader />
{:else}
  <div class="app-shell">
    <header class="topbar"><div class="brand"><img src="/icons/open-ecalc-logo.png" alt="" /><div><strong>محاسب پهپاد</strong><small>میزکار مهندسی پرواز</small></div></div><div class="topbar__project"><Icon name="folder" size={21} /><strong>پروژهٔ جدید</strong><span>⌄</span></div><div class="topbar__status"><span></span>ذخیره شد</div><div class="topbar__actions"><button type="button"><Icon name="download" size={19} />خروجی</button><button type="button"><Icon name="share" size={19} />اشتراک‌گذاری</button><button type="button"><Icon name="help" size={19} />راهنما</button><ThemeToggle {theme} onChange={setTheme} /><button class="lang" type="button">FA <span>EN</span></button><span class="avatar">JD</span></div></header>
    <div class="app-body">
      <nav class="side-nav" aria-label="بخش‌ها">
        <button class:active={view === 'projects'} class="nav-item" type="button" on:click={() => (view = 'projects')}><Icon name="projects" size={30} /><small>پروژه‌ها</small><em>Projects</em></button>
        <button class:active={view === 'calculator'} class="nav-item" type="button" aria-current={view === 'calculator' ? 'page' : undefined} on:click={() => (view = 'calculator')}><Icon name="calculator" size={30} /><small>محاسبه</small><em>Calculator</em></button>
        <button class:active={view === 'components'} class="nav-item" type="button" aria-current={view === 'components' ? 'page' : undefined} on:click={() => (view = 'components')}><Icon name="components" size={30} /><small>قطعات</small><em>Components</em></button>
        <button class:active={view === 'results'} class="nav-item" type="button" on:click={() => (view = 'results')}><Icon name="results" size={30} /><small>نتایج</small><em>Results</em></button>
        <button class:active={view === 'settings'} class="nav-item" type="button" on:click={() => (view = 'settings')}><Icon name="settings" size={30} /><small>تنظیمات</small><em>Settings</em></button>
      </nav>
      <main class="workspace">
      {#if view === 'components'}
        <ComponentGallery />
      {:else if view === 'settings'}
        <SettingsPanel {theme} onThemeChange={setTheme} />
      {:else if view === 'projects'}
        <section class="stub-page"><Icon name="projects" size={34} /><h1>پروژه‌ها</h1><p>ذخیرهٔ پروژه‌ها به‌زودی در همین میزکار در دسترس است.</p></section>
      {:else if view === 'results'}
        <section class="results-page"><div class="workspace__head"><div><h1>نتایج</h1><p>آخرین خروجی محاسبه در اینجا دیده می‌شود.</p></div></div><ResultPanel result={missionResult} input={missionInput} /></section>
      {:else}
      <div class="workspace__head"><div><h1>محاسبهٔ پرواز</h1><p>ورودی‌ها را وارد کنید.</p></div><ModeTabs value={mode} onChange={setMode} /></div>
      {#if mode === 'simple'}
        <div class="simple-layout"><SimpleCalculator bind:input={legacyInput} onCalculate={calculateSimple} /><LegacyResults result={legacyResult} /></div>
      {:else}
        <StepTabs value={step} onChange={(next) => (step = next)} />
        <div class="advanced-layout"><section class="input-area"><MissionForm bind:input={missionInput} {step} onApplyProfile={applyAircraftProfile} /><div class="actions"><button type="button" class="back" disabled={step === 0} on:click={() => (step -= 1)}>بازگشت</button>{#if step < 3}<button type="button" class="next" on:click={() => (step += 1)}>مرحلهٔ بعد <span>←</span></button>{:else}<button type="button" class="next" on:click={calculateAdvanced}>محاسبه <span>↗</span></button>{/if}</div></section><section class="result-area"><ResultPanel result={missionResult} input={missionInput} /></section></div>
      {/if}
      {/if}
      </main>
    </div>
    <nav class="bottom-nav" aria-label="بخش‌ها">
      <button class:active={view === 'calculator'} class="nav-item" type="button" aria-current={view === 'calculator' ? 'page' : undefined} on:click={() => (view = 'calculator')}><Icon name="calculator" size={20} /><small>محاسبه</small></button>
      <button class:active={view === 'components'} class="nav-item" type="button" aria-current={view === 'components' ? 'page' : undefined} on:click={() => (view = 'components')}><Icon name="components" size={20} /><small>قطعات</small></button>
      <button class:active={view === 'projects'} class="nav-item" type="button" on:click={() => (view = 'projects')}><Icon name="projects" size={20} /><small>پروژه‌ها</small></button>
      <button class:active={view === 'settings'} class="nav-item" type="button" on:click={() => (view = 'settings')}><Icon name="settings" size={20} /><small>تنظیمات</small></button>
    </nav>
  </div>
{/if}

<style>
  .app-shell { min-height: 100dvh; padding: 18px clamp(16px, 3vw, 48px) 40px; }
  .toolbar { display: flex; max-width: 1420px; margin: 0 auto 22px; align-items: center; justify-content: space-between; }.brand { display: flex; align-items: center; gap: 11px; }.brand strong { display: block; font-size: 20px; line-height: 1.1; }
  .brand-mark { position: relative; display: grid; width: 42px; height: 42px; place-items: center; border-radius: 13px; background: var(--ink); transform: rotate(45deg); }.brand-mark::after { position: absolute; width: 8px; height: 8px; border-radius: 3px; background: var(--blue); content: ''; }.brand-mark i { position: absolute; width: 7px; height: 15px; border-radius: 5px; background: var(--blue); }.brand-mark i:nth-child(1) { inset-block-start: 4px; }.brand-mark i:nth-child(2) { inset-inline-end: 4px; transform: rotate(90deg); }.brand-mark i:nth-child(3) { inset-block-end: 4px; }.brand-mark i:nth-child(4) { inset-inline-start: 4px; transform: rotate(90deg); }
  .app-body { display: grid; grid-template-columns: 72px minmax(0, 1fr); align-items: start; gap: 18px; max-width: 1500px; margin: 0 auto; direction: ltr; }.workspace { min-width: 0; border: 1px solid var(--line); border-radius: 22px; background: color-mix(in oklch, var(--surface) 86%, transparent); box-shadow: var(--shadow); padding: clamp(18px, 3vw, 34px); direction: rtl; }.workspace__head { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }.workspace__head h1 { margin: 0; font-size: clamp(28px, 3vw, 42px); letter-spacing: -0.055em; }.workspace__head p { margin: 7px 0 0; color: var(--muted); font-size: 14px; }
  .stub-page { display: grid; min-height: 420px; place-content: center; justify-items: center; gap: 10px; color: var(--muted); text-align: center; }.stub-page svg { color: var(--blue); }.stub-page h1 { margin: 0; color: var(--ink); font-size: 28px; }.stub-page p { margin: 0; }.results-page { display: grid; gap: 18px; }
  .side-nav { display: grid; gap: 8px; padding-top: 12px; direction: rtl; }.nav-item { display: grid; min-height: 68px; place-items: center; gap: 3px; border: 1px solid transparent; border-radius: 14px; background: transparent; color: var(--muted); }.nav-item span { font-size: 22px; line-height: 1; }.nav-item small { font-size: 11px; }.nav-item.active { border-color: var(--line); background: var(--surface); color: var(--blue); box-shadow: var(--shadow-soft); }.bottom-nav { display: none; }
  .simple-layout, .advanced-layout { display: grid; grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr); gap: clamp(22px, 4vw, 56px); align-items: start; direction: ltr; }.advanced-layout { grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); margin-top: 28px; }.input-area, .result-area { min-width: 0; direction: rtl; }.result-area { position: sticky; top: 18px; }.actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 24px; }.actions button { min-height: 52px; border-radius: 13px; padding-inline: 22px; white-space: nowrap; }.back { border: 1px solid var(--line); background: var(--surface); color: var(--ink-soft); }.next { border: 0; background: var(--blue); color: white; box-shadow: 0 4px 0 var(--blue-ink); font-weight: 700; transition: transform var(--fast) var(--ease), box-shadow var(--fast) var(--ease); }.next:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--blue-ink); }.actions button:disabled { cursor: not-allowed; opacity: .4; }
  @media (max-width: 900px) { .simple-layout, .advanced-layout { grid-template-columns: minmax(0, 1fr); }.result-area { position: static; }.simple-layout > :global(.legacy-results) { order: 2; } }
  @media (max-width: 560px) { .app-shell { padding: 12px 12px 88px; }.toolbar { margin-bottom: 14px; }.app-body { display: block; }.side-nav { display: none; }.bottom-nav { position: fixed; inset-inline: 10px; bottom: 10px; z-index: 20; display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; padding: 5px; border: 1px solid var(--line); border-radius: 17px; background: color-mix(in oklch, var(--surface) 92%, transparent); box-shadow: var(--shadow); backdrop-filter: blur(12px); direction: rtl; }.bottom-nav .nav-item { min-height: 54px; border-radius: 12px; }.bottom-nav .nav-item span { font-size: 18px; }.workspace { border-radius: 18px; padding: 16px; }.workspace__head { display: grid; gap: 18px; margin-bottom: 22px; }.workspace__head h1 { font-size: 30px; }.workspace__head p { font-size: 13px; }.workspace__head :global(.modes) { width: 100%; max-width: none; }.simple-layout, .advanced-layout { gap: 30px; }.advanced-layout { margin-top: 22px; }.result-area { order: 2; }.actions { position: sticky; bottom: 72px; z-index: 3; margin-inline: -4px; padding: 8px 4px; background: color-mix(in oklch, var(--paper) 92%, transparent); backdrop-filter: blur(8px); }.actions button { flex: 1; padding-inline: 10px; } }

  .app-shell { min-height: 100dvh; padding: 0; background: var(--paper); }
  .topbar { display: flex; min-height: 82px; align-items: center; gap: 20px; border-bottom: 1px solid var(--line); background: var(--surface); padding: 13px clamp(18px, 3vw, 38px); direction: ltr; }
  .topbar .brand { min-width: 270px; gap: 12px; }.topbar .brand img { width: 46px; height: 46px; object-fit: contain; }.topbar .brand strong { color: var(--ink); font-size: 20px; }.topbar .brand small { display: block; color: var(--muted); font-size: 10px; direction: rtl; }.topbar__project { display: flex; align-items: center; gap: 10px; min-height: 46px; border-inline: 1px solid var(--line); padding-inline: 22px; color: var(--ink); direction: rtl; }.topbar__project :global(svg) { color: var(--blue); }.topbar__project span { color: var(--blue); font-size: 20px; }.topbar__status { display: inline-flex; align-items: center; gap: 7px; color: var(--muted); font-size: 12px; direction: rtl; }.topbar__status span { width: 8px; height: 8px; border-radius: 50%; background: var(--green); }.topbar__actions { display: flex; align-items: center; gap: 8px; margin-inline-start: auto; direction: rtl; }.topbar__actions button { display: inline-flex; align-items: center; gap: 7px; min-height: 44px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink-soft); padding-inline: 13px; font-size: 12px; }.topbar__actions button:hover { border-color: var(--blue); color: var(--blue); }.topbar__actions .lang { gap: 12px; border-radius: 13px; color: var(--blue); font-family: var(--font-data); font-weight: 700; }.topbar__actions .lang span { color: var(--ink-soft); font-weight: 500; }.avatar { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 50%; background: var(--blue-soft); color: var(--blue); font-family: var(--font-data); font-size: 12px; font-weight: 700; }
  .app-body { grid-template-columns: 196px minmax(0, 1fr); gap: 14px; max-width: none; padding: 14px; }.side-nav { align-self: stretch; gap: 4px; min-height: calc(100dvh - 110px); border: 1px solid var(--line); border-radius: 16px; background: var(--surface); padding: 16px 10px; }.nav-item { display: grid; grid-template-columns: 42px 1fr; grid-template-rows: auto auto; min-height: 76px; place-items: center start; gap: 0 10px; border-inline-start: 4px solid transparent; border-radius: 12px; padding-inline: 13px; text-align: start; }.nav-item :global(svg) { grid-row: 1 / span 2; color: var(--ink); }.nav-item small { align-self: end; color: var(--ink); font-size: 15px; font-weight: 800; }.nav-item em { align-self: start; color: var(--muted); font-size: 12px; font-style: normal; direction: ltr; }.nav-item.active { border-color: var(--blue); background: var(--blue-soft); color: var(--blue); box-shadow: none; }.nav-item.active :global(svg), .nav-item.active small { color: var(--blue); }.workspace { border: 0; border-radius: 16px; background: transparent; box-shadow: none; padding: clamp(18px, 2vw, 32px); }.workspace__head h1 { color: var(--ink); font-size: clamp(30px, 3vw, 42px); font-weight: 800; }.workspace__head p { color: var(--ink-soft); }
  @media (max-width: 900px) { .topbar__project, .topbar__status, .topbar__actions button:not(.lang) { display: none; }.topbar .brand { min-width: 0; }.app-body { padding: 10px; }.side-nav { display: none; }.workspace { padding: 14px; } }
  @media (max-width: 560px) { .topbar { min-height: 68px; justify-content: space-between; padding: 9px 14px; }.topbar .brand img { width: 38px; height: 38px; }.topbar .brand strong { font-size: 17px; }.topbar .brand small, .topbar__actions .lang, .topbar__actions .avatar { display: none; }.topbar__actions { margin-inline-start: 0; }.app-shell { padding-bottom: 80px; }.workspace { border-radius: 14px; padding: 14px 12px; }.workspace__head h1 { font-size: 29px; }.bottom-nav { inset-inline: 10px; bottom: 10px; background: var(--surface); }.bottom-nav .nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; grid-template-columns: none; min-width: 0; color: var(--muted); padding: 5px 2px; }.bottom-nav .nav-item :global(svg) { grid-row: auto; }.bottom-nav .nav-item.active { color: var(--blue); background: var(--blue-soft); }.bottom-nav .nav-item small { font-weight: 700; } }
</style>
