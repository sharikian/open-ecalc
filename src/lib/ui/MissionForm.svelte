<script lang="ts">
  import type { MissionInput } from '$core/types';
  import { getComponent, queryAircraft, queryComponents } from '$data';
  import type { ComponentKind } from '$data';
  import Field from './Field.svelte';
  import Icon from './Icon.svelte';
  export let input: MissionInput;
  export let step = 0;
  export let onApplyProfile: (profile: 'mavic2' | 'mavic3') => void = () => {};
  type PickerKind = 'airframe' | ComponentKind;
  let pickerOpen = false;
  let pickerKind: PickerKind = 'airframe';
  let pickerQuery = '';

  $: rotorCount = Number(input.airframe.rotorCount);
  $: hasRotorCount = Number.isFinite(rotorCount) && rotorCount > 0;
  $: frameHint = hasRotorCount ? (rotorCount === 4 ? '۰٫۳۵' : rotorCount === 6 ? '۰٫۵۵' : rotorCount === 8 ? '۰٫۷۰' : '۰٫۴۵') : '';
  $: hasEmptyMass = Number.isFinite(Number(input.airframe.emptyMassKg)) && Number(input.airframe.emptyMassKg) > 0;
  $: batteryHint = hasEmptyMass ? Math.max(1.5, Number(input.airframe.emptyMassKg) * 2.8).toFixed(1) : '';
  $: mavicCandidate = Number.isFinite(Number(input.airframe.emptyMassKg)) && Number(input.airframe.emptyMassKg) >= 0.7 && Number(input.airframe.emptyMassKg) <= 1.2 && rotorCount === 4;
  $: nearAircraft = Number.isFinite(Number(input.airframe.emptyMassKg)) && Number(input.airframe.emptyMassKg) > 0
    ? queryAircraft().filter((record) => record.massKg != null && Math.abs(record.massKg - Number(input.airframe.emptyMassKg)) <= 0.25).slice(0, 3)
    : [];
  $: pickerComponents = pickerKind === 'airframe' ? [] : queryComponents({ kind: pickerKind, text: pickerQuery }).slice(0, 30);
  $: pickerAircraft = pickerKind === 'airframe' ? queryAircraft(pickerQuery).slice(0, 30) : [];

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
  function selectAircraft(id: string) {
    const aircraft = queryAircraft().find((record) => record.id === id);
    if (!aircraft) return;
    if (aircraft.model === 'Mavic 2 Pro' || aircraft.model === 'Mavic 3') onApplyProfile(aircraft.model === 'Mavic 3' ? 'mavic3' : 'mavic2');
    else if (aircraft.massKg != null) input.airframe.emptyMassKg = aircraft.massKg;
    input = { ...input };
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

<section class="setup" aria-label="پارامترهای پرواز">
  <article class="setup-card" class:active={step === 0}>
    <header class="card-header" role="button" tabindex="0" on:click={() => openPicker('airframe')} on:keydown={(event) => event.key === 'Enter' && openPicker('airframe')}><span class="card-icon"><Icon name="drone" size={23} /></span><div><h2>بدنهٔ پرنده</h2><p>انتخاب از فهرست</p></div><b class="data">01</b></header>
    {#if nearAircraft.length}<div class="quick-list" aria-label="پیشنهادهای نزدیک"><small>نزدیک به این جرم</small>{#each nearAircraft as aircraft}<button type="button" on:click={() => selectAircraft(aircraft.id)}><img src={aircraftImage(aircraft.imageUrl, aircraft.model)} alt="" /><span>{aircraft.manufacturer} {aircraft.model}</span><b class="data">{(aircraft.massKg! * 1000).toFixed(0)} g</b></button>{/each}</div>{/if}
    <div class="fields">
      <Field label="وزن خالی" suffix="kg" bind:value={input.airframe.emptyMassKg} min={0} />
      <Field label="محموله" suffix="kg" bind:value={input.airframe.payloadMassKg} min={0} />
      <Field label="تعداد روتور" bind:value={input.airframe.rotorCount} min={1} step="1" />
      <Field label="اندازهٔ فریم" suffix="m" hint={frameHint ? `برآورد: ${frameHint} m` : ''} bind:value={input.airframe.frameSizeM} min={0.05} />
    </div>
    <label class="select-field"><span>چیدمان روتورها</span><select bind:value={input.airframe.layout}><option value="flat">هم‌صفحه</option><option value="coaxial">هم‌محور</option></select></label>
  </article>

  <article class="setup-card" class:active={step === 1}>
    <header class="card-header"><span class="card-icon"><Icon name="cloud" size={23} /></span><div><h2>محیط پرواز</h2><p>شرایط هوای محل</p></div><b class="data">02</b></header>
    <div class="fields">
      <Field label="ارتفاع محل" suffix="m" bind:value={input.environment.altitudeM} min={-500} />
      <Field label="دما" suffix="°C" bind:value={input.environment.temperatureC} />
      <Field label="فشار هوا" suffix="Pa" hint="از ارتفاع و دما برآورد می‌شود" bind:value={input.environment.pressurePa} min={1} />
      <Field label="سرعت پرواز" suffix="m/s" bind:value={input.cruiseSpeedMps} min={0} />
    </div>
  </article>

  <article class="setup-card" class:active={step === 2}>
    <header class="card-header" role="button" tabindex="0" on:click={() => openPicker('battery')} on:keydown={(event) => event.key === 'Enter' && openPicker('battery')}><span class="card-icon"><Icon name="battery" size={23} /></span><div><h2>باتری</h2><p>انتخاب از فهرست</p></div><b class="data">03</b></header>
    <div class="fields">
      <Field label="ظرفیت هر پک" suffix="Ah" hint={batteryHint ? `برآورد: ${batteryHint} Ah` : ''} bind:value={input.battery.capacityAh} min={0.1} />
      <Field label="سلول سری" suffix="S" bind:value={input.battery.series} min={1} step="1" />
      <Field label="پک موازی" suffix="P" bind:value={input.battery.parallel} min={1} step="1" />
      <Field label="ولتاژ هر سلول" suffix="V" bind:value={input.battery.nominalCellVoltageV} min={1} />
      <Field label="مقاومت داخلی" suffix="Ω" bind:value={input.battery.internalResistanceOhm} min={0} />
      <Field label="C-rate پیوسته" suffix="C" bind:value={input.battery.continuousC} min={1} />
    </div>
    <label class="percent-field"><span>ظرفیت قابل استفاده</span><span class="percent-control"><input type="number" min="50" max="95" step="5" value={usablePercent()} on:input={setUsablePercent} /><b class="data">%</b></span></label>
  </article>

  <article class="setup-card" class:active={step === 3}>
    <header class="card-header" role="button" tabindex="0" on:click={() => openPicker('motor')} on:keydown={(event) => event.key === 'Enter' && openPicker('motor')}><span class="card-icon"><Icon name="motor" size={23} /></span><div><h2>پیشران</h2><p>انتخاب موتور</p></div><b class="data">04</b></header>
    <div class="component-links"><button type="button" on:click={() => openPicker('esc')}>ESC</button><button type="button" on:click={() => openPicker('propeller')}>ملخ</button></div>
    <div class="fields">
      <Field label="KV موتور" suffix="rpm/V" bind:value={input.motor.kv} min={1} />
      <Field label="حد جریان موتور" suffix="A" bind:value={input.motor.maxCurrentA} min={1} />
      <Field label="حد توان موتور" suffix="W" bind:value={input.motor.maxPowerW} min={1} />
      <Field label="حد جریان ESC" suffix="A" bind:value={input.esc.continuousCurrentA} min={1} />
      <Field label="قطر ملخ" suffix="m" bind:value={input.propeller.diameterM} min={0.05} />
      <Field label="گام ملخ" suffix="m" bind:value={input.propeller.pitchM} min={0.01} />
    </div>
  </article>
  {#if mavicCandidate}
    <aside class="suggestion" aria-live="polite"><Icon name="spark" size={22} /><div><strong>پروفایل نزدیک پیدا شد</strong><p>این مشخصات به یک کوادکوپتر دوربین‌دار شبیه است.</p></div><div class="suggestion-actions"><button type="button" on:click={() => onApplyProfile('mavic2')}>Mavic 2 Pro</button><button type="button" on:click={() => onApplyProfile('mavic3')}>Mavic 3</button></div></aside>
  {/if}
</section>

{#if pickerOpen}
  <div class="picker-backdrop" role="presentation" on:click={closePicker}><div class="picker-sheet" role="dialog" aria-modal="true" aria-labelledby="picker-title" tabindex="-1" on:click|stopPropagation on:keydown|stopPropagation><header><div><span class="eyebrow">انتخاب قطعه</span><h2 id="picker-title">{pickerKind === 'airframe' ? 'بدنه‌های موجود' : pickerKind === 'battery' ? 'باتری‌های موجود' : pickerKind === 'motor' ? 'موتورهای موجود' : pickerKind === 'propeller' ? 'ملخ‌های موجود' : 'ESCهای موجود'}</h2></div><button type="button" class="picker-close" aria-label="بستن" on:click={closePicker}>×</button></header><label class="picker-search"><Icon name="search" size={19} /><input bind:value={pickerQuery} placeholder="جست‌وجوی نام یا سازنده" /></label><div class="picker-list">{#if pickerKind === 'airframe'}{#each pickerAircraft as aircraft}<button type="button" on:click={() => selectAircraft(aircraft.id)}><img src={aircraftImage(aircraft.imageUrl, aircraft.model)} alt="" /><span><strong>{aircraft.manufacturer} {aircraft.model}</strong><small>{aircraft.classLabel}</small></span>{#if aircraft.massKg != null}<b class="data">{(aircraft.massKg * 1000).toFixed(0)} g</b>{/if}</button>{/each}{:else}{#each pickerComponents as component}<button type="button" on:click={() => selectComponent(component.id)}>{#if component.imageUrl}<img src={component.imageUrl} alt="" />{:else}<span class="picker-thumb"><Icon name={component.kind === 'battery' ? 'battery' : component.kind === 'motor' ? 'motor' : component.kind === 'propeller' ? 'propeller' : 'sliders'} size={22} /></span>{/if}<span><strong>{component.manufacturer} {component.model}</strong><small>{component.quality}</small></span></button>{/each}{/if}</div></div></div>
{/if}

<style>
  .setup { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .setup-card { display: grid; gap: 18px; min-width: 0; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 20px; box-shadow: var(--shadow-soft); }
  .setup-card header { display: flex; align-items: center; gap: 11px; }.setup-card header > div { min-width: 0; flex: 1; }.setup-card header b { color: var(--blue); font-size: 12px; }.setup-card h2 { margin: 0; font-size: 18px; letter-spacing: -0.025em; }.setup-card p { margin: 2px 0 0; color: var(--muted); font-size: 12px; }.card-icon { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 12px; background: var(--blue-soft); color: var(--blue); }
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }.select-field, .percent-field { display: grid; gap: 8px; color: var(--ink-soft); font-size: 13px; }.select-field select { min-height: 48px; border: 1px solid var(--input-line); border-radius: var(--radius-small); background: var(--surface); color: var(--ink); padding-inline: 12px; }.percent-control { position: relative; display: flex; align-items: center; }.percent-control input { width: 100%; min-height: 48px; border: 1px solid var(--input-line); border-radius: var(--radius-small); background: var(--surface); color: var(--ink); padding-inline: 14px 42px; font-family: var(--font-data); }.percent-control b { position: absolute; inset-inline-end: 14px; color: var(--muted); font-size: 12px; }.suggestion { display: flex; align-items: center; gap: 10px; grid-column: 1 / -1; border: 1px solid #b8d3ff; border-radius: 12px; background: var(--blue-soft); color: var(--ink); padding: 12px 14px; }.suggestion :global(svg) { flex: 0 0 auto; color: var(--blue); }.suggestion p { margin: 2px 0 0; color: var(--muted); font-size: 11px; }.suggestion-actions { display: flex; gap: 6px; margin-inline-start: auto; }.suggestion-actions button { min-height: 36px; border: 1px solid var(--blue); border-radius: 8px; background: var(--surface); color: var(--blue); padding-inline: 10px; font-family: var(--font-data); font-size: 11px; font-weight: 700; }
  @media (max-width: 900px) { .setup { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 560px) { .setup { display: block; }.setup-card { display: none; }.setup-card.active { display: grid; max-height: max(260px, calc(100dvh - 500px)); overflow-y: auto; gap: 13px; padding: 16px; animation: card-in var(--normal) var(--ease) both; scrollbar-width: thin; }.fields { grid-template-columns: minmax(0, 1fr); gap: 10px; }.select-field, .percent-field { gap: 6px; } @keyframes card-in { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } } }
  .card-header { width: 100%; border: 0; background: transparent; color: inherit; padding: 0; text-align: inherit; }.card-header:focus-visible { outline: 3px solid var(--blue); outline-offset: 5px; border-radius: 9px; }.quick-list { display: grid; gap: 6px; border-top: 1px solid var(--line); padding-top: 10px; }.quick-list > small { color: var(--muted); font-size: 11px; }.quick-list button { display: flex; align-items: center; gap: 8px; min-height: 42px; border: 1px solid var(--line); border-radius: 9px; background: var(--paper); color: var(--ink); padding: 4px 8px; text-align: start; }.quick-list img { width: 32px; height: 32px; border-radius: 7px; object-fit: cover; }.quick-list button span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }.quick-list button b { color: var(--blue); font-size: 11px; }.picker-backdrop { position: fixed; inset: 0; z-index: 50; display: grid; align-items: end; background: rgba(6, 18, 45, .38); padding: 18px; }.picker-sheet { width: min(100%, 560px); max-height: min(78dvh, 680px); margin: 0 auto; overflow: hidden; border: 1px solid var(--line); border-radius: 20px 20px 12px 12px; background: var(--surface); box-shadow: 0 -18px 54px rgba(6, 18, 45, .22); padding: 18px; animation: sheet-in 220ms var(--ease) both; }.picker-sheet > header { display: flex; align-items: start; justify-content: space-between; gap: 10px; }.picker-sheet h2 { margin: 3px 0 0; font-size: 22px; }.picker-close { width: 38px; height: 38px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font-size: 24px; line-height: 1; }.picker-search { display: flex; align-items: center; gap: 8px; margin-top: 14px; border: 1px solid var(--input-line); border-radius: 10px; background: var(--paper); color: var(--muted); padding-inline: 11px; }.picker-search input { width: 100%; min-height: 44px; border: 0; outline: 0; background: transparent; color: var(--ink); font-family: var(--font-ui); }.picker-list { display: grid; gap: 7px; max-height: 52dvh; margin-top: 12px; overflow-y: auto; padding-inline-end: 3px; }.picker-list > button { display: flex; align-items: center; gap: 10px; min-height: 58px; border: 1px solid var(--line); border-radius: 11px; background: var(--surface); color: var(--ink); padding: 7px 9px; text-align: start; }.picker-list > button:hover { border-color: var(--blue); background: var(--blue-soft); }.picker-list img, .picker-thumb { display: grid; flex: 0 0 44px; width: 44px; height: 44px; place-items: center; border-radius: 9px; background: var(--blue-soft); color: var(--blue); object-fit: cover; }.picker-list button > span:not(.picker-thumb) { display: grid; min-width: 0; flex: 1; gap: 2px; }.picker-list strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }.picker-list small { color: var(--muted); font-size: 10px; }.picker-list .data { color: var(--blue); font-size: 11px; } @keyframes sheet-in { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
  .component-links { display: flex; gap: 7px; margin-top: -8px; }.component-links button { min-height: 30px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--ink-soft); padding-inline: 10px; font-family: var(--font-data); font-size: 10px; }.component-links button:hover { border-color: var(--blue); color: var(--blue); }
  @media (max-width: 560px) { .picker-backdrop { padding: 0; }.picker-sheet { border-radius: 20px 20px 0 0; padding: 16px 14px calc(16px + env(safe-area-inset-bottom)); } }
</style>
