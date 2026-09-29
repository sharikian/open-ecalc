<script lang="ts">
  import type { MissionInput } from '$core/types';
  import { getComponent, getLocation, queryAircraft, queryComponents, queryLocations } from '$data';
  import { locale } from '$lib/i18n';
  import type { ComponentKind } from '$data';
  import Field from './Field.svelte';
  import Icon from './Icon.svelte';
  export let input: MissionInput;
  export let step = 0;
  export let invalidStep = -1;
  export let onApplyProfile: (profile: 'mavic2' | 'mavic3') => void = () => {};
  type PickerKind = 'airframe' | 'environment' | ComponentKind;
  let pickerOpen = false;
  let pickerKind: PickerKind = 'airframe';
  let pickerQuery = '';

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

  function openPicker(kind: PickerKind) { pickerKind = kind; pickerQuery = ''; pickerOpen = true; }
  function closePicker() { pickerOpen = false; }
  function inferredRotorCount(model: string, classLabel: string): number {
    const name = `${model} ${classLabel}`.toLocaleLowerCase('en');
    if (/(octo|x8)/.test(name)) return 8;
    if (/(hexa|x6)/.test(name)) return 6;
    if (/tri/.test(name)) return 3;
    return 4;
  }
  function selectAircraft(id: string) {
    const aircraft = queryAircraft().find((record) => record.id === id);
    if (!aircraft) return;
    if (aircraft.model === 'Mavic 2 Pro' || aircraft.model === 'Mavic 3') onApplyProfile(aircraft.model === 'Mavic 3' ? 'mavic3' : 'mavic2');
    else {
      const mass = aircraft.massKg ?? 0;
      const rotorCount = inferredRotorCount(aircraft.model, aircraft.classLabel);
      const frameSizeM = Math.max(0.25, Math.min(1.8, 0.22 + Math.sqrt(Math.max(mass, 0.25)) * 0.22));
      input = { ...input, airframe: { ...input.airframe, emptyMassKg: mass, payloadMassKg: 0, rotorCount, frameSizeM, layout: 'flat' } };
    }
    input = { ...input };
    closePicker();
  }
  function selectLocation(id: string) {
    const location = getLocation(id);
    if (!location) return;
    input = { ...input, environment: { ...input.environment, altitudeM: location.altitudeM, temperatureC: location.temperatureC, pressurePa: location.pressurePa } };
    closePicker();
  }
  function selectComponent(id: string) {
    const component = getComponent(id);
    if (!component) return;
    if (component.kind === 'battery') Object.assign(input.battery, { capacityAh: component.capacityAh, series: Math.max(1, Math.round(component.nominalVoltageV / 3.7)), parallel: 1, nominalCellVoltageV: component.nominalVoltageV / Math.max(1, Math.round(component.nominalVoltageV / 3.7)), internalResistanceOhm: component.internalResistanceOhm, continuousC: component.continuousC, massKg: component.massKg });
    if (component.kind === 'motor') Object.assign(input.motor, { kv: component.kv, noLoadCurrentA: component.noLoadCurrentA, resistanceOhm: component.resistanceOhm, maxCurrentA: component.maxCurrentA, maxPowerW: component.maxPowerW, massKg: component.massKg, poles: component.poles });
    if (component.kind === 'propeller') Object.assign(input.propeller, { diameterM: component.diameterM, pitchM: component.pitchM, bladeCount: component.bladeCount, thrustCoefficient: component.thrustCoefficient, powerCoefficient: component.powerCoefficient });
    if (component.kind === 'esc') Object.assign(input.esc, { continuousCurrentA: component.continuousCurrentA, burstCurrentA: component.burstCurrentA, resistanceOhm: component.resistanceOhm, efficiency: component.efficiency, massKg: component.massKg });
    input = { ...input };
    closePicker();
  }

  function usablePercent(): string {
    return Number.isFinite(input.battery.usableFraction) ? String(Math.round(input.battery.usableFraction * 100)) : '';
  }

  function setUsablePercent(event: Event) {
    const raw = (event.currentTarget as HTMLInputElement).value;
    input.battery.usableFraction = raw === '' ? ('' as unknown as number) : Number(raw) / 100;
    input = { ...input };
  }
</script>

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
      <Field label={copy('ارتفاع محل', 'Altitude')} suffix="m" invalid={invalidStep === 1 && !Number.isFinite(input.environment.altitudeM)} bind:value={input.environment.altitudeM} min={-500} />
      <Field label={copy('دما', 'Temperature')} suffix="°C" invalid={invalidStep === 1 && !Number.isFinite(input.environment.temperatureC)} bind:value={input.environment.temperatureC} />
      <Field label={copy('فشار هوا', 'Air pressure')} suffix="Pa" required={false} bind:value={input.environment.pressurePa} min={1} />
      <Field label={copy('سرعت پرواز', 'Cruise speed')} suffix="m/s" invalid={invalidStep === 1 && !(Number.isFinite(input.cruiseSpeedMps) && input.cruiseSpeedMps >= 0)} bind:value={input.cruiseSpeedMps} min={0} />
    </div>
  </article>

  <article class="setup-card" class:active={step === 2}>
    <header class="card-header" role="button" tabindex="0" on:click={() => openPicker('battery')} on:keydown={(event) => event.key === 'Enter' && openPicker('battery')}><span class="card-icon"><Icon name="battery" size={23} /></span><div><h2>{copy('باتری', 'Battery')}</h2><p>{copy('انتخاب از فهرست', 'Choose from catalog')}</p></div><b class="data">03</b></header>
    <div class="fields">
      <Field label={copy('ظرفیت هر پک', 'Pack capacity')} suffix="mAh" displayScale={1000} invalid={invalidStep === 2 && !(Number.isFinite(input.battery.capacityAh) && input.battery.capacityAh > 0)} bind:value={input.battery.capacityAh} min={1} />
      <Field label={copy('سلول سری', 'Series cells')} suffix="S" invalid={invalidStep === 2 && !(Number.isFinite(input.battery.series) && input.battery.series > 0)} bind:value={input.battery.series} min={1} step="1" />
      <Field label={copy('پک موازی', 'Parallel packs')} suffix="P" invalid={invalidStep === 2 && !(Number.isFinite(input.battery.parallel) && input.battery.parallel > 0)} bind:value={input.battery.parallel} min={1} step="1" />
      <Field label={copy('ولتاژ هر سلول', 'Cell voltage')} suffix="V" invalid={invalidStep === 2 && !(Number.isFinite(input.battery.nominalCellVoltageV) && input.battery.nominalCellVoltageV > 0)} bind:value={input.battery.nominalCellVoltageV} min={1} />
      <Field label={copy('مقاومت داخلی', 'Internal resistance')} suffix="Ω" invalid={invalidStep === 2 && !(Number.isFinite(input.battery.internalResistanceOhm) && input.battery.internalResistanceOhm >= 0)} bind:value={input.battery.internalResistanceOhm} min={0} />
      <Field label={copy('C-rate پیوسته', 'Continuous C-rate')} suffix="C" invalid={invalidStep === 2 && !(Number.isFinite(input.battery.continuousC) && input.battery.continuousC > 0)} bind:value={input.battery.continuousC} min={1} />
    </div>
    <label class="percent-field"><span>{copy('ظرفیت قابل استفاده', 'Usable capacity')}</span><span class:invalid={invalidStep === 2 && !(Number.isFinite(input.battery.usableFraction) && input.battery.usableFraction > 0)} class="percent-control"><input type="number" min="50" max="95" step="5" placeholder={invalidStep === 2 ? 'Required' : ''} aria-invalid={invalidStep === 2 && !(Number.isFinite(input.battery.usableFraction) && input.battery.usableFraction > 0)} value={usablePercent()} on:input={setUsablePercent} /><b class="data">%</b></span></label>
  </article>

  <article class="setup-card" class:active={step === 3}>
    <header class="card-header" role="button" tabindex="0" on:click={() => openPicker('motor')} on:keydown={(event) => event.key === 'Enter' && openPicker('motor')}><span class="card-icon"><Icon name="motor" size={23} /></span><div><h2>{copy('پیشران', 'Propulsion')}</h2><p>{copy('انتخاب موتور', 'Choose motor')}</p></div><b class="data">04</b></header>
    <div class="component-links"><button type="button" on:click={() => openPicker('esc')}>ESC</button><button type="button" on:click={() => openPicker('propeller')}>{copy('ملخ', 'Propeller')}</button></div>
    <div class="fields">
      <Field label={copy('KV موتور', 'Motor KV')} suffix="rpm/V" invalid={invalidStep === 3 && !(Number.isFinite(input.motor.kv) && input.motor.kv > 0)} bind:value={input.motor.kv} min={1} />
      <Field label={copy('حد جریان موتور', 'Motor current limit')} suffix="A" invalid={invalidStep === 3 && !(Number.isFinite(input.motor.maxCurrentA) && input.motor.maxCurrentA > 0)} bind:value={input.motor.maxCurrentA} min={1} />
      <Field label={copy('حد توان موتور', 'Motor power limit')} suffix="W" invalid={invalidStep === 3 && !(Number.isFinite(input.motor.maxPowerW) && input.motor.maxPowerW > 0)} bind:value={input.motor.maxPowerW} min={1} />
      <Field label={copy('حد جریان ESC', 'ESC current limit')} suffix="A" invalid={invalidStep === 3 && !(Number.isFinite(input.esc.continuousCurrentA) && input.esc.continuousCurrentA > 0)} bind:value={input.esc.continuousCurrentA} min={1} />
      <Field label={copy('قطر ملخ', 'Propeller diameter')} suffix="m" invalid={invalidStep === 3 && !(Number.isFinite(input.propeller.diameterM) && input.propeller.diameterM > 0)} bind:value={input.propeller.diameterM} min={0.05} />
      <Field label={copy('گام ملخ', 'Propeller pitch')} suffix="m" invalid={invalidStep === 3 && !(Number.isFinite(input.propeller.pitchM) && input.propeller.pitchM > 0)} bind:value={input.propeller.pitchM} min={0.01} />
    </div>
  </article>
</section>

{#if pickerOpen}
  <div class="picker-backdrop" role="presentation" on:click={closePicker}><div class="picker-sheet" role="dialog" aria-modal="true" aria-labelledby="picker-title" tabindex="-1" on:click|stopPropagation on:keydown|stopPropagation><header><div><span class="eyebrow">{$locale === 'en' ? 'Select' : 'انتخاب'}</span><h2 id="picker-title">{pickerKind === 'airframe' ? ($locale === 'en' ? 'Airframes' : 'بدنه‌های موجود') : pickerKind === 'environment' ? ($locale === 'en' ? 'Flight locations' : 'مکان‌های پرواز') : pickerKind === 'battery' ? ($locale === 'en' ? 'Batteries' : 'باتری‌های موجود') : pickerKind === 'motor' ? ($locale === 'en' ? 'Motors' : 'موتورهای موجود') : pickerKind === 'propeller' ? ($locale === 'en' ? 'Propellers' : 'ملخ‌های موجود') : 'ESC'}</h2></div><button type="button" class="picker-close" aria-label={$locale === 'en' ? 'Close' : 'بستن'} on:click={closePicker}>×</button></header><label class="picker-search"><Icon name="search" size={19} /><input bind:value={pickerQuery} placeholder={$locale === 'en' ? 'Search by name or region' : 'جست‌وجوی نام یا استان'} /></label><div class="picker-list">{#if pickerKind === 'airframe'}{#each pickerAircraft as aircraft}<button type="button" on:click={() => selectAircraft(aircraft.id)}><img src={aircraftImage(aircraft.imageUrl, aircraft.model)} alt="" /><span><strong>{componentLabel(aircraft)}</strong><small>{aircraft.classLabel}</small></span>{#if aircraft.massKg != null}<b class="data">{(aircraft.massKg * 1000).toFixed(0)} g</b>{/if}</button>{/each}{:else if pickerKind === 'environment'}{#each pickerLocations as location}<button type="button" on:click={() => selectLocation(location.id)}>{#if location.imageUrl}<img src={location.imageUrl} alt="" />{:else}<span class="picker-thumb location-thumb"><Icon name="map" size={22} /></span>{/if}<span><strong>{$locale === 'en' ? location.nameEn : location.nameFa}</strong><small>{($locale === 'en' ? location.provinceEn : location.provinceFa) || ''} · {location.altitudeM} m</small></span><b class="data">{location.temperatureC}°</b></button>{/each}{:else}{#each pickerComponents as component}<button type="button" on:click={() => selectComponent(component.id)}>{#if component.imageUrl}<img src={component.imageUrl} alt="" />{:else}<span class="picker-thumb"><Icon name={component.kind === 'battery' ? 'battery' : component.kind === 'motor' ? 'motor' : component.kind === 'propeller' ? 'propeller' : 'sliders'} size={22} /></span>{/if}<span><strong>{componentLabel(component)}</strong><small>{component.quality}</small></span></button>{/each}{/if}</div></div></div>
{/if}

<style>
  .setup { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .setup-card { display: grid; gap: 18px; min-width: 0; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 20px; box-shadow: var(--shadow-soft); }
  .setup-card header { display: flex; align-items: center; gap: 11px; }.setup-card header > div { min-width: 0; flex: 1; }.setup-card header b { color: var(--blue); font-size: 12px; }.setup-card h2 { margin: 0; font-size: 18px; letter-spacing: -0.025em; }.setup-card p { margin: 2px 0 0; color: var(--muted); font-size: 12px; }.card-icon { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 12px; background: var(--blue-soft); color: var(--blue); }
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }.select-field, .percent-field { display: grid; gap: 8px; color: var(--ink-soft); font-size: 13px; }.select-field select { min-height: 48px; border: 1px solid var(--input-line); border-radius: var(--radius-small); background: var(--surface); color: var(--ink); padding-inline: 12px; }.percent-control { position: relative; display: flex; align-items: center; }.percent-control input { width: 100%; min-height: 48px; border: 1px solid var(--input-line); border-radius: var(--radius-small); background: var(--surface); color: var(--ink); padding-inline: 14px 42px; font-family: var(--font-data); }.percent-control.invalid input { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 5%, var(--surface)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 10%, transparent); }.percent-control b { position: absolute; inset-inline-end: 14px; color: var(--muted); font-size: 12px; }
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
</style>
