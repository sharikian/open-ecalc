<script lang="ts">
  import { tick } from 'svelte';
  import type { MissionInput } from '$core/types';
  import { getComponent, getLocation, queryAircraft, queryComponents, queryLocations } from '$data';
  import { locale } from '$lib/i18n';
  import type { ComponentKind } from '$data';
  import Field from './Field.svelte';
  import Icon from './Icon.svelte';
  import PackVoltage from './PackVoltage.svelte';
  import { nominalCellVoltage, pressureMode, resolvePressure, takeoffMass } from '$core/linked-inputs';
  import { batteryCurrentLimitA, packCapacityAh } from '$core/physics';
  import { applyComponent } from './component-selection';
  export let input: MissionInput;
  export let step = 0;
  export let invalidStep = -1;
  let pickerTrigger: HTMLElement | null = null;
  type PickerKind = 'airframe' | 'environment' | ComponentKind;
  let pickerOpen = false;
  let pickerKind: PickerKind = 'airframe';
  let pickerQuery = '';
  let selectedMotorId = '';
  $: motorVariants = (getComponent(selectedMotorId) as unknown as { kvOptions?: number[] } | undefined)?.kvOptions ?? [];
  $: environmentMode = pressureMode(input.environment);
  $: derivedPressure = (() => { try { return resolvePressure(input.environment); } catch { return undefined; } })();
  $: displayedPressure = derivedPressure === undefined ? undefined : Math.round(derivedPressure / 10) * 10;
  $: totalCapacity = packCapacityAh(input.battery);
  $: currentLimit = batteryCurrentLimitA(input.battery);
  $: totalMass = takeoffMass(input);
  function setPressureMode(mode: 'auto' | 'manual') {
    input = { ...input, environment: { ...input.environment, pressureMode: mode,
      pressurePa: mode === 'manual' ? derivedPressure : undefined } };
  }
  function setChemistry() {
    input = { ...input, battery: { ...input.battery, nominalCellVoltageV: Number.isFinite(input.battery.series) ? nominalCellVoltage(input.battery.chemistry) : NaN } };
  }
  function addCurrent() { input = { ...input, currentScenariosA: [...(input.currentScenariosA ?? []), NaN] }; }
  function removeCurrent(index: number) { input = { ...input, currentScenariosA: input.currentScenariosA?.filter((_, i) => i !== index) }; }

  function copy(fa: string, en: string): string { return $locale === 'en' ? en : fa; }
  function componentLabel(component: { manufacturer: string; model: string }): string {
    const maker = component.manufacturer === 'Open Reference' ? '' : component.manufacturer.trim();
    const model = component.model.replace(/^Open\s+(?=ESC\b)/i, '');
    return maker ? `${maker} ${model}` : model;
  }

  $: pickerComponents = pickerKind === 'airframe' || pickerKind === 'environment' ? [] : queryComponents({ kind: pickerKind, text: pickerQuery }).slice(0, 30);
  $: pickerAircraft = pickerKind === 'airframe' ? queryAircraft(pickerQuery).slice(0, 30) : [];
  $: pickerLocations = pickerKind === 'environment' ? queryLocations(pickerQuery).slice(0, 30) : [];

  function aircraftImage(url: string | undefined, model = ''): string {
    if (url && !url.includes('aircraft-catalog-grid') && !url.includes('airframe-starter')) return url;
    const name = model.toLocaleLowerCase('en');
    if (/(hex|octo|heavy|agri|x8|x6)/.test(name)) return '/data/images/aircraft-hexacopter.png';
    if (/(cine|fpv|racing|tiny|whoop)/.test(name)) return '/data/images/aircraft-cinewhoop.png';
    const hash = [...model].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return ['/data/images/aircraft-product.png', '/data/images/aircraft-cinewhoop.png', '/data/images/aircraft-hexacopter.png'][hash % 3];
  }

  async function openPicker(kind: PickerKind) {
    pickerTrigger = document.activeElement as HTMLElement;
    pickerKind = kind; pickerQuery = ''; pickerOpen = true;
    await tick(); document.querySelector<HTMLInputElement>('.picker-search input')?.focus();
  }
  function closePicker() { pickerOpen = false; pickerTrigger?.focus(); }
  function pickerKey(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); closePicker(); }
    if (event.key !== 'Tab') return;
    const nodes = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]')];
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  function selectAircraft(id: string) {
    const aircraft = queryAircraft().find((record) => record.id === id);
    if (!aircraft) return;
    // Catalog mass is whole-aircraft mass, not empty airframe mass. Do not
    // reinterpret it or infer frame geometry from a product name.
    input = { ...input, airframe: { ...input.airframe, emptyMassKg: NaN,
      rotorCount: NaN, frameSizeM: aircraft.wheelbaseM ?? NaN,
      takeoffMassKg: undefined } };
    closePicker();
  }
  function selectLocation(id: string) {
    const location = getLocation(id);
    if (!location) return;
    input = { ...input, environment: { ...input.environment, altitudeM: location.altitudeM, temperatureC: location.temperatureC, pressureMode: 'auto', pressurePa: undefined } };
    closePicker();
  }
  function selectComponent(id: string) {
    const component = getComponent(id);
    if (!component) return;
    input = applyComponent(input, component);
    if (component.kind === 'motor') selectedMotorId = id;
    closePicker();
  }

</script>

<svelte:window on:keydown={(event) => { if (event.key === 'Escape') closePicker(); }} />

<section class="setup" aria-label={copy('پارامترهای پرواز', 'Flight parameters')}>
  <article class="setup-card" class:active={step === 0}>
    <header class="card-header" role="button" tabindex="0" on:click={() => openPicker('airframe')} on:keydown={(event) => event.key === 'Enter' && openPicker('airframe')}><span class="card-icon"><Icon name="drone" size={23} /></span><div><h2>{copy('بدنهٔ پرنده', 'Airframe')}</h2><p>{copy('انتخاب از فهرست', 'Choose from catalog')}</p></div><b class="data">01</b></header>
    <div class="fields">
      <Field label={copy('وزن خالی', 'Empty mass')} suffix="kg" invalid={invalidStep === 0 && !(Number.isFinite(input.airframe.emptyMassKg) && input.airframe.emptyMassKg > 0)} bind:value={input.airframe.emptyMassKg} min={0} />
      <Field label={copy('محموله', 'Payload')} suffix="kg" invalid={invalidStep === 0 && !(Number.isFinite(input.airframe.payloadMassKg) && input.airframe.payloadMassKg >= 0)} bind:value={input.airframe.payloadMassKg} min={0} />
      <Field label={copy('تعداد روتور', 'Rotor count')} invalid={invalidStep === 0 && !(Number.isFinite(input.airframe.rotorCount) && input.airframe.rotorCount > 0)} bind:value={input.airframe.rotorCount} min={1} step="1" />
      <Field label={copy('اندازهٔ فریم', 'Frame size')} suffix="m" invalid={invalidStep === 0 && !(Number.isFinite(input.airframe.frameSizeM) && input.airframe.frameSizeM > 0)} bind:value={input.airframe.frameSizeM} min={0.05} />
    </div>
    <label class="select-field"><span>{copy('چیدمان روتورها', 'Rotor layout')}</span><select bind:value={input.airframe.layout}><option value="flat">{copy('هم‌صفحه', 'Flat')}</option><option value="coaxial">{copy('هم‌محور', 'Coaxial')}</option></select></label>
  </article>

    <article class="setup-card" class:active={step === 1}>
    <header class="card-header" role="button" tabindex="0" on:click={() => openPicker('environment')} on:keydown={(event) => event.key === 'Enter' && openPicker('environment')}><span class="card-icon"><Icon name="cloud" size={23} /></span><div><h2>{$locale === 'en' ? 'Flight environment' : 'محیط پرواز'}</h2><p>{$locale === 'en' ? 'Choose a location' : 'انتخاب محل'}</p></div><b class="data">02</b></header>
    <div class="fields">
      <Field label={copy('ارتفاع محل', 'Altitude')} suffix="m" invalid={invalidStep === 1 && !(Number.isFinite(input.environment.altitudeM) && input.environment.altitudeM >= -500 && input.environment.altitudeM <= 11000)} bind:value={input.environment.altitudeM} min={-500} max={11000} />
      <Field label={copy('دما', 'Temperature')} suffix="°C" invalid={invalidStep === 1 && !Number.isFinite(input.environment.temperatureC)} bind:value={input.environment.temperatureC} />
      {#if environmentMode === 'auto'}<Field label={copy('فشار هوا', 'Air pressure')} suffix="hPa" readonly value={displayedPressure} displayScale={0.01} required={false} />{:else}<Field label={copy('فشار هوا', 'Air pressure')} suffix="hPa" bind:value={input.environment.pressurePa} displayScale={0.01} min={1} invalid={invalidStep === 1 && !(Number.isFinite(input.environment.pressurePa) && input.environment.pressurePa! > 0)} />{/if}
      <Field label={copy('سرعت پرواز', 'Cruise speed')} suffix="m/s" invalid={invalidStep === 1 && !(Number.isFinite(input.cruiseSpeedMps) && input.cruiseSpeedMps >= 0)} bind:value={input.cruiseSpeedMps} min={0} />
    </div>
    <div class="pressure-mode" role="group" aria-label={copy('روش فشار هوا', 'Pressure mode')}><button type="button" aria-pressed={environmentMode === 'auto'} on:click={() => setPressureMode('auto')}>{copy('خودکار', 'Automatic')}</button><button type="button" aria-pressed={environmentMode === 'manual'} on:click={() => setPressureMode('manual')}>{copy('دستی', 'Manual')}</button></div>
  </article>

  <article class="setup-card" class:active={step === 2}>
    <header class="card-header" role="button" tabindex="0" on:click={() => openPicker('battery')} on:keydown={(event) => event.key === 'Enter' && openPicker('battery')}><span class="card-icon"><Icon name="battery" size={23} /></span><div><h2>{copy('باتری', 'Battery')}</h2><p>{copy('انتخاب از فهرست', 'Choose from catalog')}</p></div><b class="data">03</b></header>
    <label class="select-field"><span>{copy('نوع باتری', 'Battery chemistry')}</span><select bind:value={input.battery.chemistry} on:change={setChemistry}><option value="" disabled>—</option><option value="LiPo">LiPo</option><option value="Li-ion">Li-ion</option><option value="LiFePO4">LiFePO4</option></select></label>
    <div class="fields">
      <Field label={copy('ظرفیت هر پک', 'Pack capacity')} suffix="mAh" displayScale={1000} invalid={invalidStep === 2 && !(Number.isFinite(input.battery.capacityAh) && input.battery.capacityAh > 0)} bind:value={input.battery.capacityAh} min={1} />
      <Field label={copy('سلول سری', 'Series cells')} suffix="S" invalid={invalidStep === 2 && !(Number.isFinite(input.battery.series) && input.battery.series > 0)} bind:value={input.battery.series} min={1} step="1" />
      <Field label={copy('پک موازی', 'Parallel packs')} suffix="P" invalid={invalidStep === 2 && !(Number.isFinite(input.battery.parallel) && input.battery.parallel > 0)} bind:value={input.battery.parallel} min={1} step="1" />
      <PackVoltage bind:battery={input.battery} invalid={invalidStep === 2 && !(Number.isFinite(input.battery.nominalCellVoltageV) && input.battery.nominalCellVoltageV > 0)} />
      <Field label={copy('مقاومت داخلی', 'Internal resistance')} suffix="Ω" invalid={invalidStep === 2 && !(Number.isFinite(input.battery.internalResistanceOhm) && input.battery.internalResistanceOhm >= 0)} bind:value={input.battery.internalResistanceOhm} min={0} />
      <Field label={copy('C-rate پیوسته', 'Continuous C-rate')} suffix="C" invalid={invalidStep === 2 && !(Number.isFinite(input.battery.continuousC) && input.battery.continuousC > 0)} bind:value={input.battery.continuousC} min={1} />
      <Field label={copy('وزن هر پک', 'Pack mass')} suffix="kg" bind:value={input.battery.massKg} min={0} invalid={invalidStep === 2 && !(input.battery.massKg > 0)} />
      <Field label={copy('ظرفیت قابل استفاده', 'Usable capacity')} suffix="%" bind:value={input.battery.usableFraction} displayScale={100} min={1} max={100} invalid={invalidStep === 2 && !(input.battery.usableFraction > 0 && input.battery.usableFraction <= 1)} />
    </div>
    {#if Number.isFinite(totalCapacity) && totalCapacity > 0}<div class="derived"><span>{copy('ظرفیت کل', 'Total capacity')}</span><b dir="ltr">{(totalCapacity * 1000).toFixed(0)} mAh</b></div>{/if}
    {#if Number.isFinite(currentLimit) && currentLimit > 0}<div class="derived"><span>{copy('جریان مجاز باتری', 'Battery current limit')}</span><b dir="ltr">{currentLimit.toFixed(1)} A</b></div>{/if}
  </article>

  <article class="setup-card" class:active={step === 3}>
    <header class="card-header" role="button" tabindex="0" on:click={() => openPicker('motor')} on:keydown={(event) => event.key === 'Enter' && openPicker('motor')}><span class="card-icon"><Icon name="motor" size={23} /></span><div><h2>{copy('پیشران', 'Propulsion')}</h2><p>{copy('انتخاب موتور', 'Choose motor')}</p></div><b class="data">04</b></header>
    <div class="component-links"><button type="button" on:click={() => openPicker('esc')}>ESC</button><button type="button" on:click={() => openPicker('propeller')}>{copy('ملخ', 'Propeller')}</button></div>
    {#if motorVariants.length > 1}<label class="select-field"><span>KV</span><select bind:value={input.motor.kv}><option value={NaN}>{copy('انتخاب KV', 'Select KV')}</option>{#each motorVariants as kv}<option value={kv}>{kv} KV</option>{/each}</select></label>{/if}
    <div class="fields">
      <Field label={copy('KV موتور', 'Motor KV')} suffix="rpm/V" invalid={invalidStep === 3 && !(Number.isFinite(input.motor.kv) && input.motor.kv > 0)} bind:value={input.motor.kv} min={1} />
      <Field label={copy('حد جریان موتور', 'Motor current limit')} suffix="A" invalid={invalidStep === 3 && !(Number.isFinite(input.motor.maxCurrentA) && input.motor.maxCurrentA > 0)} bind:value={input.motor.maxCurrentA} min={1} />
      <Field label={copy('حد توان موتور', 'Motor power limit')} suffix="W" invalid={invalidStep === 3 && !(Number.isFinite(input.motor.maxPowerW) && input.motor.maxPowerW > 0)} bind:value={input.motor.maxPowerW} min={1} />
      <Field label={copy('حد جریان ESC', 'ESC current limit')} suffix="A" invalid={invalidStep === 3 && !(Number.isFinite(input.esc.continuousCurrentA) && input.esc.continuousCurrentA > 0)} bind:value={input.esc.continuousCurrentA} min={1} />
      <Field label={copy('قطر ملخ', 'Propeller diameter')} suffix="m" invalid={invalidStep === 3 && !(Number.isFinite(input.propeller.diameterM) && input.propeller.diameterM > 0)} bind:value={input.propeller.diameterM} min={0.05} />
      <Field label={copy('گام ملخ', 'Propeller pitch')} suffix="m" invalid={invalidStep === 3 && !(Number.isFinite(input.propeller.pitchM) && input.propeller.pitchM > 0)} bind:value={input.propeller.pitchM} min={0.01} />
      <Field label={copy('جریان بی‌باری موتور', 'Motor no-load current')} suffix="A" bind:value={input.motor.noLoadCurrentA} min={0} invalid={invalidStep === 3 && !(Number.isFinite(input.motor.noLoadCurrentA) && input.motor.noLoadCurrentA >= 0)} />
      <Field label={copy('مقاومت موتور', 'Motor resistance')} suffix="Ω" bind:value={input.motor.resistanceOhm} min={0} invalid={invalidStep === 3 && !(Number.isFinite(input.motor.resistanceOhm) && input.motor.resistanceOhm >= 0)} />
      <Field label={copy('وزن هر موتور', 'Motor mass')} suffix="kg" bind:value={input.motor.massKg} min={0} invalid={invalidStep === 3 && !(input.motor.massKg > 0)} />
      <Field label={copy('جریان لحظه‌ای ESC', 'ESC burst current')} suffix="A" bind:value={input.esc.burstCurrentA} min={0} invalid={invalidStep === 3 && !(input.esc.burstCurrentA >= input.esc.continuousCurrentA)} />
      <Field label={copy('مقاومت ESC', 'ESC resistance')} suffix="Ω" bind:value={input.esc.resistanceOhm} min={0} invalid={invalidStep === 3 && !(Number.isFinite(input.esc.resistanceOhm) && input.esc.resistanceOhm >= 0)} />
      <Field label={copy('بازده ESC', 'ESC efficiency')} suffix="%" bind:value={input.esc.efficiency} displayScale={100} min={1} max={100} invalid={invalidStep === 3 && !(input.esc.efficiency > 0 && input.esc.efficiency <= 1)} />
      <Field label={copy('وزن هر ESC', 'ESC mass')} suffix="kg" bind:value={input.esc.massKg} min={0} invalid={invalidStep === 3 && !(input.esc.massKg > 0)} />
      <Field label={copy('جریان تجهیزات', 'Auxiliary current')} suffix="A" bind:value={input.auxiliaryCurrentA} min={0} invalid={invalidStep === 3 && !(Number.isFinite(input.auxiliaryCurrentA) && input.auxiliaryCurrentA >= 0)} />
    </div>
    <section class="current-inputs"><div class="current-head"><h3>{copy('جریان‌های موتور', 'Motor currents')}</h3><button type="button" on:click={addCurrent}>{copy('+ جریان', '+ Current')}</button></div>{#each input.currentScenariosA ?? [] as current, index}<div class="current-row"><Field label={`${copy('جریان هر موتور', 'Current per motor')} ${index + 1}`} suffix="A" bind:value={input.currentScenariosA![index]} min={0} invalid={invalidStep === 3 && !(current > 0)} /><button type="button" aria-label={copy('حذف جریان', 'Remove current')} on:click={() => removeCurrent(index)}>×</button></div>{/each}</section>
    {#if Number.isFinite(totalMass) && totalMass > 0}<div class="derived"><span>{copy('وزن برخاست', 'Takeoff mass')}</span><b dir="ltr">{totalMass.toFixed(3)} kg</b></div>{/if}
  </article>
</section>

{#if pickerOpen}
  <div class="picker-backdrop" role="presentation" on:click={closePicker}><div class="picker-sheet" role="dialog" aria-modal="true" aria-labelledby="picker-title" tabindex="-1" on:click|stopPropagation on:keydown|stopPropagation={pickerKey}><header><div><span class="eyebrow">{$locale === 'en' ? 'Select' : 'انتخاب'}</span><h2 id="picker-title">{pickerKind === 'airframe' ? ($locale === 'en' ? 'Airframes' : 'بدنه‌های موجود') : pickerKind === 'environment' ? ($locale === 'en' ? 'Flight locations' : 'مکان‌های پرواز') : pickerKind === 'battery' ? ($locale === 'en' ? 'Batteries' : 'باتری‌های موجود') : pickerKind === 'motor' ? ($locale === 'en' ? 'Motors' : 'موتورهای موجود') : pickerKind === 'propeller' ? ($locale === 'en' ? 'Propellers' : 'ملخ‌های موجود') : 'ESC'}</h2></div><button type="button" class="picker-close" aria-label={$locale === 'en' ? 'Close' : 'بستن'} on:click={closePicker}>×</button></header><label class="picker-search"><Icon name="search" size={19} /><input bind:value={pickerQuery} placeholder={$locale === 'en' ? 'Search by name or region' : 'جست‌وجوی نام یا استان'} /></label><div class="picker-list">{#if pickerKind === 'airframe'}{#each pickerAircraft as aircraft}<button type="button" on:click={() => selectAircraft(aircraft.id)}>{#if !aircraft.id.startsWith('fpvdb-')}<img src={aircraftImage(aircraft.imageUrl, aircraft.model)} alt="" aria-label={copy('تصویر عمومی', 'Generic illustration')} />{:else}<span class="picker-thumb"><Icon name="drone" size={22} /></span>{/if}<span><strong>{componentLabel(aircraft)}</strong><small>{aircraft.classLabel}</small></span>{#if aircraft.massKg != null}<b class="data">{(aircraft.massKg * 1000).toFixed(0)} g</b>{/if}</button>{/each}{:else if pickerKind === 'environment'}{#each pickerLocations as location}<button type="button" on:click={() => selectLocation(location.id)}>{#if location.imageUrl}<img src={location.imageUrl} alt="" />{:else}<span class="picker-thumb location-thumb"><Icon name="map" size={22} /></span>{/if}<span><strong>{$locale === 'en' ? location.nameEn : location.nameFa}</strong><small>{($locale === 'en' ? location.provinceEn : location.provinceFa) || ''} · {location.altitudeM} m</small></span><b class="data">{location.temperatureC}°</b></button>{/each}{:else}{#each pickerComponents as component}<button type="button" on:click={() => selectComponent(component.id)}>{#if component.imageUrl}<img src={component.imageUrl} alt="" />{:else}<span class="picker-thumb"><Icon name={component.kind === 'battery' ? 'battery' : component.kind === 'motor' ? 'motor' : component.kind === 'propeller' ? 'propeller' : 'sliders'} size={22} /></span>{/if}<span><strong>{componentLabel(component)}</strong><small>{component.productType === 'fc-esc-stack' ? 'FC / ESC' : component.quality}</small></span></button>{/each}{/if}</div></div></div>
{/if}

<style>
  .setup { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .setup-card { display: grid; gap: 18px; min-width: 0; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 20px; box-shadow: var(--shadow-soft); }
  .setup-card header { display: flex; align-items: center; gap: 11px; }.setup-card header > div { min-width: 0; flex: 1; }.setup-card header b { color: var(--blue); font-size: 12px; }.setup-card h2 { margin: 0; font-size: 18px; letter-spacing: -0.025em; }.setup-card p { margin: 2px 0 0; color: var(--muted); font-size: 12px; }.card-icon { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 12px; background: var(--blue-soft); color: var(--blue); }
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }.select-field { display: grid; gap: 8px; color: var(--ink-soft); font-size: 14px; }.select-field select { min-height: 48px; border: 1px solid var(--input-line); border-radius: var(--radius-small); background: var(--surface); color: var(--ink); padding-inline: 12px; }
  @media (max-width: 900px) { .setup { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 560px) { .setup { display: block; }.setup-card { display: none; }.setup-card.active { display: grid; min-height: calc(100dvh - 330px); max-height: none; overflow: visible; gap: 13px; padding: 16px; animation: card-in var(--normal) var(--ease) both; }.fields { grid-template-columns: minmax(0, 1fr); gap: 10px; }.select-field, .percent-field { gap: 6px; } @keyframes card-in { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } } }
  .card-header { width: 100%; border: 0; background: transparent; color: inherit; padding: 0; text-align: inherit; }.card-header:focus-visible { outline: 3px solid var(--blue); outline-offset: 5px; border-radius: 9px; }.picker-backdrop { position: fixed; inset: 0; z-index: 50; display: grid; align-items: end; background: rgba(6, 18, 45, .38); padding: 18px; }.picker-sheet { width: min(100%, 560px); max-height: min(78dvh, 680px); margin: 0 auto; overflow: hidden; border: 1px solid var(--line); border-radius: 20px 20px 12px 12px; background: var(--surface); box-shadow: 0 -18px 54px rgba(6, 18, 45, .22); padding: 18px; animation: sheet-in 220ms var(--ease) both; }.picker-sheet > header { display: flex; align-items: start; justify-content: space-between; gap: 10px; }.picker-sheet h2 { margin: 3px 0 0; font-size: 22px; }.picker-close { width: 38px; height: 38px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font-size: 24px; line-height: 1; }.picker-search { display: flex; align-items: center; gap: 8px; margin-top: 14px; border: 1px solid var(--input-line); border-radius: 10px; background: var(--paper); color: var(--muted); padding-inline: 11px; }.picker-search input { width: 100%; min-height: 44px; border: 0; outline: 0; background: transparent; color: var(--ink); font-family: var(--font-ui); }.picker-list { display: grid; gap: 7px; max-height: 52dvh; margin-top: 12px; overflow-y: auto; padding-inline-end: 3px; }.picker-list > button { display: flex; align-items: center; gap: 10px; min-height: 58px; border: 1px solid var(--line); border-radius: 11px; background: var(--surface); color: var(--ink); padding: 7px 9px; text-align: start; }.picker-list > button:hover { border-color: var(--blue); background: var(--blue-soft); }.picker-list img, .picker-thumb { display: grid; flex: 0 0 44px; width: 44px; height: 44px; place-items: center; border-radius: 9px; background: var(--blue-soft); color: var(--blue); object-fit: cover; }.picker-list button > span:not(.picker-thumb) { display: grid; min-width: 0; flex: 1; gap: 2px; }.picker-list strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }.picker-list small { color: var(--muted); font-size: 10px; }.picker-list .data { color: var(--blue); font-size: 11px; } @keyframes sheet-in { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
  .component-links { display: flex; gap: 7px; margin-top: -8px; }.component-links button { min-height: 30px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--ink-soft); padding-inline: 10px; font-family: var(--font-data); font-size: 10px; }.component-links button:hover { border-color: var(--blue); color: var(--blue); }
  @media (max-width: 560px) { .picker-backdrop { padding: 0; }.picker-sheet { border-radius: 20px 20px 0 0; padding: 16px 14px calc(16px + env(safe-area-inset-bottom)); } }
  .picker-backdrop { overflow: hidden; overscroll-behavior: none; }
  .picker-backdrop { z-index: 1000; }
  .picker-sheet { overscroll-behavior: contain; touch-action: pan-y; min-height: 0; align-self: end; transform-origin: bottom center; }
  .picker-sheet > header { flex: 0 0 auto; }
  .picker-list { min-height: 0; scrollbar-gutter: stable; }
  .setup-card.active { animation: card-in var(--normal) var(--ease) both; }
  @keyframes card-in { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } }
  .picker-list { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y; }
  @media (max-width: 560px) { .picker-sheet { width: 100%; margin: 0; } }
  .setup { display: block; max-width: 760px; margin-inline: auto; }
  .setup-card { display: none; }
  .setup-card.active { display: grid; }
  .pressure-mode, .current-head { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
  .pressure-mode { justify-content: start; }
  .pressure-mode button, .current-head button, .current-row > button { min-height: 44px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: var(--ink); padding-inline: 14px; }
  .pressure-mode button[aria-pressed='true'] { border-color: var(--blue); color: var(--blue); background: var(--blue-soft); }
  .derived { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid var(--line); padding-top: 12px; font-size: 14px; }
  .derived b { font-family: var(--font-data); }
  .current-inputs { display: grid; gap: 12px; border-top: 1px solid var(--line); padding-top: 16px; }
  .current-head h3 { margin: 0; font-size: 16px; }
  .current-row { display: grid; grid-template-columns: minmax(0, 1fr) 44px; align-items: end; gap: 8px; }
  .current-row > button { padding: 0; min-height: 48px; font-size: 22px; }
  @media (max-width: 560px) { .setup-card.active { min-height: 0; }.current-row > button { min-height: 52px; } }
</style>
