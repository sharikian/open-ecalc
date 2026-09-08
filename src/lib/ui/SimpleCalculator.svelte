<script lang="ts">
  import type { LegacyInput } from '$core/types';
  import Field from './Field.svelte';

  export let input: LegacyInput;
  export let onCalculate: () => void;
  export let showErrors = false;

  function addPoint() {
    input.currentPerMotorA = [...input.currentPerMotorA, '' as unknown as number];
    input = { ...input };
  }

  function removePoint(index: number) {
    if (input.currentPerMotorA.length <= 1) return;
    input.currentPerMotorA = input.currentPerMotorA.filter((_, pointIndex) => pointIndex !== index);
    input = { ...input };
  }
</script>

<section class="simple" aria-labelledby="simple-title">
  <div class="section-title"><div><h2 id="simple-title">ورودی‌ها</h2><p>پارامترهای محاسبه را وارد کنید</p></div><button class="ghost" type="button" on:click={addPoint}>+ نقطهٔ کاری</button></div>
  <div class="field-grid">
    <Field label="وزن خالی" suffix="g" invalid={showErrors && !(Number.isFinite(input.emptyMassG) && input.emptyMassG > 0)} bind:value={input.emptyMassG} min={0} />
    <Field label="محموله" suffix="g" invalid={showErrors && !(Number.isFinite(input.payloadMassG) && input.payloadMassG >= 0)} bind:value={input.payloadMassG} min={0} />
    <Field label="وزن باتری" suffix="g" invalid={showErrors && !(Number.isFinite(input.batteryMassG) && input.batteryMassG > 0)} bind:value={input.batteryMassG} min={0} />
    <Field label="تعداد پک موازی" suffix="P" invalid={showErrors && !(Number.isFinite(input.batteryParallel) && input.batteryParallel > 0)} bind:value={input.batteryParallel} min={1} step="1" />
    <Field label="ظرفیت هر پک" suffix="Ah" invalid={showErrors && !(Number.isFinite(input.cellCapacityAh) && input.cellCapacityAh > 0)} bind:value={input.cellCapacityAh} min={0.1} />
    <Field label="تعداد روتور" invalid={showErrors && !(Number.isFinite(input.rotorCount) && input.rotorCount > 0)} bind:value={input.rotorCount} min={1} step="1" />
    <Field label="سرعت پرواز" suffix="m/s" invalid={showErrors && !(Number.isFinite(input.speedMps) && input.speedMps > 0)} bind:value={input.speedMps} min={0} />
  </div>

  <div class="points">
    <div class="points__head"><h3>نقاط کاری موتور</h3><span>جریان هر موتور</span></div>
    {#each input.currentPerMotorA as current, index}
      <div class="point-row">
        <span class="point-row__index data">{String(index + 1).padStart(2, '0')}</span>
        <label class:invalid={showErrors && !(Number.isFinite(input.currentPerMotorA[index]) && input.currentPerMotorA[index] > 0)}><span>جریان</span><input type="number" min="0" step="0.1" placeholder={showErrors ? 'مقدار لازم' : ''} aria-invalid={showErrors && !(Number.isFinite(input.currentPerMotorA[index]) && input.currentPerMotorA[index] > 0)} bind:value={input.currentPerMotorA[index]} /><b>A</b></label>
        <button type="button" aria-label="حذف نقطه" disabled={input.currentPerMotorA.length <= 1} on:click={() => removePoint(index)}>×</button>
      </div>
    {/each}
  </div>

  <button class="calculate" type="button" on:click={onCalculate}>محاسبه</button>
</section>

<style>
  .simple { display: grid; gap: 24px; }
  .section-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  h2, h3, p { margin: 0; } h2 { font-size: 24px; letter-spacing: -0.03em; } h3 { font-size: 16px; } p { margin-top: 4px; color: var(--muted); font-size: 14px; }
  .ghost { min-height: 44px; border: 1px solid var(--line); border-radius: var(--radius-small); background: var(--surface); color: var(--blue); padding-inline: 14px; font-weight: 600; white-space: nowrap; }
  .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .points { display: grid; gap: 10px; border-top: 1px solid var(--line); padding-top: 20px; }
  .points__head { display: flex; align-items: baseline; justify-content: space-between; color: var(--muted); font-size: 13px; }
  .points__head h3 { color: var(--ink); }
  .point-row { display: grid; grid-template-columns: 36px minmax(0, 1fr) 44px; align-items: center; gap: 10px; }
  .point-row__index { color: var(--muted); font-size: 12px; }
  .point-row label { position: relative; display: flex; align-items: center; }
  .point-row label > span { position: absolute; inset-inline-start: 14px; color: var(--muted); font-size: 13px; pointer-events: none; }
  .point-row input { width: 100%; height: 48px; border: 1px solid var(--line); border-radius: var(--radius-small); background: var(--paper); color: var(--ink); padding-inline: 74px 42px; font-family: var(--font-data); text-align: end; }.point-row label.invalid input { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 5%, var(--paper)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 10%, transparent); }
  .point-row label b { position: absolute; inset-inline-end: 14px; color: var(--muted); font-family: var(--font-data); font-size: 12px; font-weight: 500; }
  .point-row > button { width: 44px; height: 44px; border: 0; border-radius: var(--radius-small); background: transparent; color: var(--muted); font-size: 22px; }
  .point-row > button:disabled { cursor: not-allowed; opacity: 0.35; }
  .calculate { min-height: 52px; border: 0; border-radius: 13px; background: var(--ink); color: var(--surface-strong); font-weight: 700; box-shadow: 0 4px 0 var(--line-strong); transition: transform var(--fast) var(--ease), box-shadow var(--fast) var(--ease); }
  .calculate:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--line-strong); }
  @media (max-width: 560px) { .field-grid { grid-template-columns: minmax(0, 1fr); } .section-title { align-items: flex-start; } }
</style>
