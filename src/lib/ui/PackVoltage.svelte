<script lang="ts">
  import type { Battery } from '$core/types';
  import { nominalCellVoltage, setPackVoltage } from '$core/linked-inputs';
  import { locale } from '$lib/i18n';
  import { numericDisplay } from './numeric-display';
  export let battery: Battery;
  export let invalid = false;
  let open = false;
  let active = 0;
  let pendingVoltage: number | undefined;
  $: voltage = Number.isFinite(battery.series) && Number.isFinite(battery.nominalCellVoltageV)
    ? numericDisplay(battery.series * battery.nominalCellVoltageV) : numericDisplay(pendingVoltage);
  $: options = (['LiPo', 'Li-ion', 'LiFePO4'].includes(battery.chemistry) ? [1, 2, 3, 4, 6, 8, 10, 12] : []).map(series => ({ series, voltage: Number((series * nominalCellVoltage(battery.chemistry)).toFixed(2)) }));
  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    battery = { ...battery, series: option.series, nominalCellVoltageV: nominalCellVoltage(battery.chemistry) };
    pendingVoltage = undefined; open = false;
  }
  function change(event: Event) {
    const node = event.currentTarget as HTMLInputElement;
    pendingVoltage = node.value === '' ? undefined : node.valueAsNumber;
    battery = setPackVoltage(battery, pendingVoltage ?? NaN);
  }
  function key(event: KeyboardEvent) {
    if (event.key === 'Escape') open = false;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); open = true;
      if (options.length) active = (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    }
    if (event.key === 'Enter' && open) { event.preventDefault(); choose(active); }
  }
  $: if (pendingVoltage != null && Number.isInteger(battery.series) && battery.series > 0) {
    battery = setPackVoltage(battery, pendingVoltage); pendingVoltage = undefined;
  }
</script>

<div class="voltage" on:focusout={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) open = false; }}>
  <label for="pack-voltage">{$locale === 'fa' ? 'ولتاژ اسمی پک' : 'Nominal pack voltage'}</label>
  <div class="control" class:invalid>
    <input id="pack-voltage" type="number" min="0" step="any" dir="ltr" role="combobox" aria-expanded={open} aria-controls="voltage-options" aria-autocomplete="list" aria-activedescendant={open ? `voltage-${active}` : undefined} aria-invalid={invalid} placeholder={invalid ? ($locale === 'fa' ? 'مقدار لازم' : 'Required') : ''} value={voltage ?? ''} on:input={change} on:focus={() => { open = true; }} on:click={() => { open = true; }} on:keydown={key} />
    <b>V</b>
  </div>
  {#if open}<div id="voltage-options" role="listbox" aria-label={$locale === 'fa' ? 'ولتاژهای رایج' : 'Common voltages'}>{#each options as option, index}<button id={`voltage-${index}`} type="button" role="option" aria-selected={index === active} class:active={index === active} on:click={() => choose(index)}><span dir="ltr">{option.voltage} V</span><small dir="ltr">{option.series}S</small></button>{/each}</div>{/if}
</div>

<style>
  .voltage { display: grid; gap: 7px; min-width: 0; align-self: start; }
  label { color: var(--ink-soft); font-size: 14px; font-weight: 700; }
  .control { display: grid; grid-template-columns: minmax(0, 1fr) 48px; direction: ltr; border: 1px solid var(--input-line); border-radius: var(--radius-small); background: var(--surface); }
  .control:focus-within { outline: 2px solid var(--blue); outline-offset: 2px; }
  input { width: 100%; min-width: 0; min-height: 48px; border: 0; border-radius: inherit; background: transparent; padding: 10px 14px; color: var(--ink); font: 16px var(--font-data); outline: 0; }
  b { display: grid; place-items: center; border-inline-start: 1px solid var(--line); color: var(--muted); font: 14px var(--font-data); }
  .invalid { border-color: var(--danger); }
  [role='listbox'] { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; padding: 8px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); }
  button { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); padding: 7px 10px; font-family: var(--font-data); }
  button.active { border-color: var(--blue); } small { color: var(--muted); }
  @media (max-width: 560px) { label { font-size: 16px; } input { min-height: 52px; } }
</style>
