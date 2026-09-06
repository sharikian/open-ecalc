<script lang="ts">
  import { t } from '$lib/i18n';
  import type { MissionInput } from '$core/types';
  import Field from './Field.svelte';

  export let input: MissionInput;
  export let step = 0;
  const sectionNames = ['airframe', 'environment', 'battery', 'propulsion'] as const;
  $: activeSection = sectionNames[step] ?? 'airframe';
</script>

<div class="form-stack">
  {#if activeSection === 'airframe'}
    <section class="form-section" aria-labelledby="airframe-heading">
      <div class="section-heading"><span class="step-index">01</span><div><h2 id="airframe-heading">{$t('airframe')}</h2><p>جرم، آرایش و هندسهٔ پایه</p></div></div>
      <div class="fields fields--two">
        <Field label={$t('emptyMass')} suffix="kg" bind:value={input.airframe.emptyMassKg} min={0} />
        <Field label={$t('payloadMass')} suffix="kg" bind:value={input.airframe.payloadMassKg} min={0} />
        <Field label={$t('rotorCount')} bind:value={input.airframe.rotorCount} min={1} step="1" />
        <Field label={$t('frameSize')} suffix="m" bind:value={input.airframe.frameSizeM} min={0.05} />
      </div>
      <label class="select-field"><span>آرایش روتورها</span><select bind:value={input.airframe.layout}><option value="flat">Flat / هم‌صفحه</option><option value="coaxial">Coaxial / هم‌محور</option></select></label>
    </section>
  {:else if activeSection === 'environment'}
    <section class="form-section" aria-labelledby="environment-heading">
      <div class="section-heading"><span class="step-index">02</span><div><h2 id="environment-heading">{$t('environment')}</h2><p>چگالی هوا روی رانش اثر می‌گذارد</p></div></div>
      <div class="fields fields--two"><Field label={$t('altitude')} suffix="m" bind:value={input.environment.altitudeM} min={-500} /><Field label={$t('temperature')} suffix="°C" bind:value={input.environment.temperatureC} /><Field label={$t('pressure')} suffix="Pa" bind:value={input.environment.pressurePa} min={1} /></div>
    </section>
  {:else if activeSection === 'battery'}
    <section class="form-section" aria-labelledby="battery-heading">
      <div class="section-heading"><span class="step-index">03</span><div><h2 id="battery-heading">{$t('battery')}</h2><p>افت ولتاژ و ظرفیت قابل استفاده</p></div></div>
      <div class="fields fields--two"><Field label={$t('capacity')} suffix="Ah" bind:value={input.battery.capacityAh} min={0.1} /><Field label={$t('cellCount')} suffix="S" bind:value={input.battery.series} min={1} step="1" /><Field label={$t('parallelCount')} suffix="P" bind:value={input.battery.parallel} min={1} step="1" /><Field label={$t('usableCapacity')} suffix="%" bind:value={input.battery.usableFraction} min={0.1} /></div>
    </section>
  {:else}
    <section class="form-section" aria-labelledby="propulsion-heading">
      <div class="section-heading"><span class="step-index">04</span><div><h2 id="propulsion-heading">{$t('propulsion')}</h2><p>مدل موتور و ملخ در نقطهٔ کاری</p></div></div>
      <div class="fields fields--two"><Field label={$t('kv')} suffix="rpm/V" bind:value={input.motor.kv} min={1} /><Field label={$t('diameter')} suffix="m" bind:value={input.propeller.diameterM} min={0.05} /><Field label={$t('pitch')} suffix="m" bind:value={input.propeller.pitchM} min={0.01} /><Field label="سرعت کروز" suffix="m/s" bind:value={input.cruiseSpeedMps} min={0} /></div>
    </section>
  {/if}
</div>

<style>
  .form-stack { min-width: 0; }
  .form-section { display: grid; gap: var(--space-lg); border-block-end: 1px solid var(--color-rule); padding-block: var(--space-lg); }
  .section-heading { display: flex; align-items: flex-start; gap: var(--space-sm); }
  .section-heading h2 { margin: 0; font-size: var(--text-lg); letter-spacing: -0.02em; line-height: 1.15; }
  .section-heading p { margin: var(--space-2xs) 0 0; color: var(--color-muted); font-size: var(--text-sm); }
  .step-index { color: var(--color-accent); font-family: var(--font-mono); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
  .fields { display: grid; gap: var(--space-md); }
  .fields--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .select-field { display: grid; gap: var(--space-xs); color: var(--color-ink-2); font-size: var(--text-sm); }
  select { min-height: 44px; border: 1px solid var(--color-rule-2); border-radius: var(--radius-sm); background: var(--color-paper); color: var(--color-ink); padding: var(--space-xs) var(--space-sm); }
  @media (max-width: 40rem) { .fields--two { grid-template-columns: minmax(0, 1fr); } }
</style>
