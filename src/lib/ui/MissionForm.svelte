<script lang="ts">
  import type { MissionInput } from '$core/types';
  import Field from './Field.svelte';
  import Icon from './Icon.svelte';
  export let input: MissionInput;
  export let step = 0;
  export let onApplyProfile: (profile: 'mavic2' | 'mavic3') => void = () => {};

  $: rotorCount = Number(input.airframe.rotorCount);
  $: frameHint = rotorCount === 4 ? '۰٫۳۵' : rotorCount === 6 ? '۰٫۵۵' : rotorCount === 8 ? '۰٫۷۰' : '۰٫۴۵';
  $: batteryHint = Number.isFinite(Number(input.airframe.emptyMassKg)) ? Math.max(1.5, Number(input.airframe.emptyMassKg) * 2.8).toFixed(1) : '۲٫۵';
  $: mavicCandidate = Number.isFinite(Number(input.airframe.emptyMassKg)) && Number(input.airframe.emptyMassKg) >= 0.7 && Number(input.airframe.emptyMassKg) <= 1.2 && rotorCount === 4;

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
    <header><span class="card-icon"><Icon name="drone" size={23} /></span><div><h2>بدنهٔ پرنده</h2><p>مشخصات سازه</p></div><b class="data">01</b></header>
    <div class="fields">
      <Field label="وزن خالی" suffix="kg" placeholder="مثلاً ۰٫۹" bind:value={input.airframe.emptyMassKg} min={0} />
      <Field label="محموله" suffix="kg" bind:value={input.airframe.payloadMassKg} min={0} />
      <Field label="تعداد روتور" placeholder="۴" bind:value={input.airframe.rotorCount} min={1} step="1" />
      <Field label="اندازهٔ فریم" suffix="m" placeholder={frameHint} hint="برآورد بر اساس تعداد روتور" bind:value={input.airframe.frameSizeM} min={0.05} />
    </div>
    <label class="select-field"><span>چیدمان روتورها</span><select bind:value={input.airframe.layout}><option value="flat">هم‌صفحه</option><option value="coaxial">هم‌محور</option></select></label>
  </article>

  <article class="setup-card" class:active={step === 1}>
    <header><span class="card-icon"><Icon name="cloud" size={23} /></span><div><h2>محیط پرواز</h2><p>شرایط هوای محل</p></div><b class="data">02</b></header>
    <div class="fields">
      <Field label="ارتفاع محل" suffix="m" placeholder="۰" bind:value={input.environment.altitudeM} min={-500} />
      <Field label="دما" suffix="°C" placeholder="۲۵" bind:value={input.environment.temperatureC} />
      <Field label="فشار هوا" suffix="Pa" placeholder="۱۰۱۳۲۵" hint="از ارتفاع و دما برآورد می‌شود" bind:value={input.environment.pressurePa} min={1} />
      <Field label="سرعت پرواز" suffix="m/s" placeholder="۸" bind:value={input.cruiseSpeedMps} min={0} />
    </div>
  </article>

  <article class="setup-card" class:active={step === 2}>
    <header><span class="card-icon"><Icon name="battery" size={23} /></span><div><h2>باتری</h2><p>ظرفیت و افت ولتاژ</p></div><b class="data">03</b></header>
    <div class="fields">
      <Field label="ظرفیت هر پک" suffix="Ah" placeholder={batteryHint} bind:value={input.battery.capacityAh} min={0.1} />
      <Field label="سلول سری" suffix="S" placeholder="۴" bind:value={input.battery.series} min={1} step="1" />
      <Field label="پک موازی" suffix="P" placeholder="۱" bind:value={input.battery.parallel} min={1} step="1" />
      <Field label="ولتاژ هر سلول" suffix="V" placeholder="۳٫۷" bind:value={input.battery.nominalCellVoltageV} min={1} />
      <Field label="مقاومت داخلی" suffix="Ω" placeholder="۰٫۰۶" bind:value={input.battery.internalResistanceOhm} min={0} />
      <Field label="C-rate پیوسته" suffix="C" placeholder="۲۰" bind:value={input.battery.continuousC} min={1} />
    </div>
    <label class="percent-field"><span>ظرفیت قابل استفاده</span><span class="percent-control"><input type="number" min="50" max="95" step="5" value={usablePercent()} on:input={setUsablePercent} /><b class="data">%</b></span></label>
  </article>

  <article class="setup-card" class:active={step === 3}>
    <header><span class="card-icon"><Icon name="motor" size={23} /></span><div><h2>پیشران</h2><p>موتور، ESC و ملخ</p></div><b class="data">04</b></header>
    <div class="fields">
      <Field label="KV موتور" suffix="rpm/V" placeholder="۳۸۰" bind:value={input.motor.kv} min={1} />
      <Field label="حد جریان موتور" suffix="A" placeholder="۶۵" bind:value={input.motor.maxCurrentA} min={1} />
      <Field label="حد توان موتور" suffix="W" placeholder="۱۴۵۰" bind:value={input.motor.maxPowerW} min={1} />
      <Field label="حد جریان ESC" suffix="A" placeholder="۶۰" bind:value={input.esc.continuousCurrentA} min={1} />
      <Field label="قطر ملخ" suffix="m" placeholder="۰٫۴۶" bind:value={input.propeller.diameterM} min={0.05} />
      <Field label="گام ملخ" suffix="m" placeholder="۰٫۱۷" bind:value={input.propeller.pitchM} min={0.01} />
    </div>
  </article>
  {#if mavicCandidate}
    <aside class="suggestion" aria-live="polite"><Icon name="spark" size={22} /><div><strong>پروفایل نزدیک پیدا شد</strong><p>این مشخصات به یک کوادکوپتر دوربین‌دار شبیه است.</p></div><div class="suggestion-actions"><button type="button" on:click={() => onApplyProfile('mavic2')}>Mavic 2 Pro</button><button type="button" on:click={() => onApplyProfile('mavic3')}>Mavic 3</button></div></aside>
  {/if}
</section>

<style>
  .setup { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .setup-card { display: grid; gap: 18px; min-width: 0; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 20px; box-shadow: var(--shadow-soft); }
  .setup-card header { display: flex; align-items: center; gap: 11px; }.setup-card header > div { min-width: 0; flex: 1; }.setup-card header b { color: var(--blue); font-size: 12px; }.setup-card h2 { margin: 0; font-size: 18px; letter-spacing: -0.025em; }.setup-card p { margin: 2px 0 0; color: var(--muted); font-size: 12px; }.card-icon { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 12px; background: var(--blue-soft); color: var(--blue); }
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }.select-field, .percent-field { display: grid; gap: 8px; color: var(--ink-soft); font-size: 13px; }.select-field select { min-height: 48px; border: 1px solid var(--input-line); border-radius: var(--radius-small); background: var(--surface); color: var(--ink); padding-inline: 12px; }.percent-control { position: relative; display: flex; align-items: center; }.percent-control input { width: 100%; min-height: 48px; border: 1px solid var(--input-line); border-radius: var(--radius-small); background: var(--surface); color: var(--ink); padding-inline: 14px 42px; font-family: var(--font-data); }.percent-control b { position: absolute; inset-inline-end: 14px; color: var(--muted); font-size: 12px; }.suggestion { display: flex; align-items: center; gap: 10px; grid-column: 1 / -1; border: 1px solid #b8d3ff; border-radius: 12px; background: var(--blue-soft); color: var(--ink); padding: 12px 14px; }.suggestion :global(svg) { flex: 0 0 auto; color: var(--blue); }.suggestion p { margin: 2px 0 0; color: var(--muted); font-size: 11px; }.suggestion-actions { display: flex; gap: 6px; margin-inline-start: auto; }.suggestion-actions button { min-height: 36px; border: 1px solid var(--blue); border-radius: 8px; background: var(--surface); color: var(--blue); padding-inline: 10px; font-family: var(--font-data); font-size: 11px; font-weight: 700; }
  @media (max-width: 900px) { .setup { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 560px) { .setup { display: block; }.setup-card { display: none; }.setup-card.active { display: grid; animation: card-in var(--normal) var(--ease) both; }.fields { grid-template-columns: minmax(0, 1fr); } @keyframes card-in { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } } }
</style>
