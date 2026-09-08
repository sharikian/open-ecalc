<script lang="ts">
  import { onMount } from 'svelte';
  import { getComponent, hideComponent, hiddenComponents, queryAircraft, queryComponents, saveComponentOverride, saveCustomComponent } from '$data';
  import type { ComponentKind, ComponentRecord } from '$data';
  import Icon from './Icon.svelte';

  type FilterKind = 'all' | ComponentKind | 'airframe';
  type Row = { id: string; kind: FilterKind; manufacturer: string; model: string; quality: string; source: string; detail: string; imageUrl?: string };
  type EditorField = { key: string; label: string; unit: string };
  const qualityLabel: Record<string, string> = { estimated: 'برآوردی', community: 'جامعه', manufacturer: 'سازنده', verified: 'تأییدشده' };
  const kindLabel: Record<FilterKind, string> = { all: 'همه', battery: 'باتری', motor: 'موتور', propeller: 'ملخ', esc: 'ESC', airframe: 'بدنه' };
  const kindIcon: Record<FilterKind, 'battery' | 'motor' | 'propeller' | 'sliders' | 'drone' | 'filter'> = { all: 'filter', battery: 'battery', motor: 'motor', propeller: 'propeller', esc: 'sliders', airframe: 'drone' };
  const components = queryComponents();
  const aircraft = queryAircraft();
  const baseRows: Row[] = [
    ...components.map((item) => ({ id: item.id, kind: item.kind, manufacturer: item.manufacturer, model: item.model, quality: item.quality, source: item.licenseSpdx, detail: item.kind === 'battery' ? 'سلول و پک' : item.kind === 'motor' ? 'موتور براشلس' : item.kind === 'propeller' ? 'پروفایل ملخ' : 'کنترل‌کننده', imageUrl: item.imageUrl })),
    ...aircraft.map((item) => ({ id: item.id, kind: 'airframe' as const, manufacturer: item.manufacturer, model: item.model, quality: item.quality, source: item.licenseSpdx, detail: item.classLabel || 'بدنهٔ پرنده', imageUrl: item.imageUrl }))
  ];
  const fields: Record<ComponentKind, EditorField[]> = {
    battery: [{ key: 'capacityAh', label: 'ظرفیت', unit: 'Ah' }, { key: 'nominalVoltageV', label: 'ولتاژ', unit: 'V' }, { key: 'continuousC', label: 'C-rate', unit: 'C' }, { key: 'massKg', label: 'جرم', unit: 'kg' }],
    motor: [{ key: 'kv', label: 'KV', unit: 'rpm/V' }, { key: 'maxCurrentA', label: 'جریان بیشینه', unit: 'A' }, { key: 'maxPowerW', label: 'توان بیشینه', unit: 'W' }, { key: 'massKg', label: 'جرم', unit: 'kg' }],
    propeller: [{ key: 'diameterM', label: 'قطر', unit: 'm' }, { key: 'pitchM', label: 'گام', unit: 'm' }, { key: 'bladeCount', label: 'تعداد پره', unit: '' }],
    esc: [{ key: 'continuousCurrentA', label: 'جریان دائم', unit: 'A' }, { key: 'burstCurrentA', label: 'جریان لحظه‌ای', unit: 'A' }, { key: 'efficiency', label: 'بازده', unit: '' }, { key: 'massKg', label: 'جرم', unit: 'kg' }]
  };
  const defaults: Record<ComponentKind, Record<string, number>> = {
    battery: { capacityAh: 5, nominalVoltageV: 14.8, continuousC: 20, massKg: 0.55 },
    motor: { kv: 700, maxCurrentA: 35, maxPowerW: 600, massKg: 0.1 },
    propeller: { diameterM: 0.254, pitchM: 0.114, bladeCount: 2 },
    esc: { continuousCurrentA: 40, burstCurrentA: 55, efficiency: 0.95, massKg: 0.06 }
  };
  let customRows: Row[] = [];
  let hiddenIds = hiddenComponents();
  let query = '';
  let filter: FilterKind = 'all';
  let filterOpen = false;
  let isMobile = false;
  let page = 1;
  let editorOpen = false;
  let editorMode: 'edit' | 'add' = 'edit';
  let editorKind: ComponentKind = 'battery';
  let editorId = '';
  let editorManufacturer = '';
  let editorModel = '';
  let editorImage = '';
  let editorValues: Record<string, string> = {};
  let deleteTarget: Row | null = null;
  $: rows = [...baseRows, ...customRows].filter((row) => !hiddenIds.includes(row.id));
  $: pageSize = isMobile ? 5 : 10;
  $: needle = query.trim().toLocaleLowerCase('fa');
  $: filtered = rows.filter((row) => (filter === 'all' || row.kind === filter) && (!needle || `${row.manufacturer} ${row.model} ${row.detail}`.toLocaleLowerCase('fa').includes(needle)));
  $: pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  $: if (page > pageCount) page = pageCount;
  $: pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  $: editorFields = fields[editorKind];

  onMount(() => {
    const update = () => { isMobile = window.innerWidth <= 560; };
    update(); window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  });
  function imageFor(row: Row): string {
    const imageHash = [...row.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    if (row.kind === 'battery') return imageHash % 2 ? '/data/images/battery-lipo-pack.png' : '/data/images/battery-liion-pack.png';
    if (row.kind === 'esc') return imageHash % 2 ? '/data/images/esc-high-current.png' : '/data/images/esc-compact-board.png';
    if (row.imageUrl && !row.imageUrl.includes('aircraft-catalog-grid') && !row.imageUrl.includes('airframe-starter')) return row.imageUrl;
    if (row.kind === 'motor') return '/data/images/motor-brushless.png';
    if (row.kind === 'propeller') return '/data/images/propeller-cyclone-t5045c-74v.png';
    return '/data/images/aircraft-product.png';
  }
  function setQuery(value: string) { query = value; page = 1; }
  function setFilter(value: FilterKind) { filter = value; filterOpen = false; page = 1; }
  function openEditor(row: Row) {
    if (row.kind === 'airframe') return;
    const record = getComponent(row.id); if (!record) return;
    editorMode = 'edit'; editorKind = record.kind; editorId = record.id; editorManufacturer = record.manufacturer; editorModel = record.model; editorImage = record.imageUrl ?? '';
    editorValues = Object.fromEntries(fields[record.kind].map((field) => [field.key, String((record as unknown as Record<string, unknown>)[field.key] ?? '')])); editorOpen = true;
  }
  function openAdd() { editorMode = 'add'; editorKind = 'battery'; editorId = `custom-${Date.now()}`; editorManufacturer = ''; editorModel = ''; editorImage = ''; editorValues = Object.fromEntries(fields.battery.map((field) => [field.key, String(defaults.battery[field.key] ?? '')])); editorOpen = true; }
  function setEditorKind(next: ComponentKind) { editorKind = next; editorValues = Object.fromEntries(fields[next].map((field) => [field.key, String(defaults[next][field.key] ?? '')])); }
  function setEditorValue(key: string, value: string) { editorValues = { ...editorValues, [key]: value }; }
  function handleImage(event: Event) { const file = (event.currentTarget as HTMLInputElement).files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { editorImage = String(reader.result); }; reader.readAsDataURL(file); }
  function buildRecord(): ComponentRecord {
    const values = Object.fromEntries(editorFields.map((field) => [field.key, Number(editorValues[field.key])])) as Record<string, number>;
    const common = { id: editorId, kind: editorKind, manufacturer: editorManufacturer.trim() || 'مرجع شخصی', model: editorModel.trim() || 'قطعهٔ جدید', tags: ['custom'], sourceUrl: 'local://user-component', licenseSpdx: 'NOASSERTION', retrievedAt: new Date().toISOString(), sourceHash: `local-${editorId}`, quality: 'community' as const, imageUrl: editorImage || undefined };
    if (editorKind === 'battery') return { ...common, ...values, chemistry: 'LiPo', burstC: values.continuousC * 1.3, internalResistanceOhm: 0.02 } as ComponentRecord;
    if (editorKind === 'motor') return { ...common, ...values, noLoadCurrentA: 0.8, resistanceOhm: 0.05, poles: 14 } as ComponentRecord;
    if (editorKind === 'propeller') return { ...common, ...values, thrustCoefficient: 0.1, powerCoefficient: 0.05 } as ComponentRecord;
    return { ...common, ...values, resistanceOhm: 0.003 } as ComponentRecord;
  }
  function saveEditor() {
    if (editorMode === 'edit') saveComponentOverride(editorId, Object.fromEntries(editorFields.map((field) => [field.key, Number(editorValues[field.key])] )));
    else { const record = buildRecord(); saveCustomComponent(record); customRows = [...customRows, { id: record.id, kind: record.kind, manufacturer: record.manufacturer, model: record.model, quality: record.quality, source: record.licenseSpdx, detail: kindLabel[record.kind], imageUrl: record.imageUrl }]; }
    editorOpen = false;
  }
  function requestDelete(row: Row) { deleteTarget = row; }
  function confirmDelete() {
    if (!deleteTarget) return;
    hideComponent(deleteTarget.id);
    hiddenIds = [...hiddenIds, deleteTarget.id];
    customRows = customRows.filter((row) => row.id !== deleteTarget?.id);
    deleteTarget = null;
  }
  function previousPage() { page = Math.max(1, page - 1); }
  function nextPage() { page = Math.min(pageCount, page + 1); }
</script>

<section class="catalog" aria-labelledby="catalog-title">
  <header class="catalog-head"><div><h1 id="catalog-title">قطعات</h1><p>جست‌وجو در {rows.length} رکورد</p></div><div class="catalog-actions"><strong class="data">{filtered.length} نتیجه</strong><button class="add-button" type="button" on:click={openAdd}><Icon name="plus" size={18} /><span>افزودن قطعه</span></button></div></header>
  <div class="catalog-toolbar"><div class="search-line"><label class="search-field"><Icon name="search" size={19} /><span class="sr-only">جست‌وجوی قطعات</span><input value={query} on:input={(event) => setQuery((event.currentTarget as HTMLInputElement).value)} placeholder="نام، سازنده یا نوع قطعه" /></label><button class="filter-trigger" type="button" aria-label="فیلتر نوع قطعه" aria-expanded={filterOpen} on:click={() => (filterOpen = !filterOpen)}><Icon name={kindIcon[filter]} size={19} /></button></div><div class:open={filterOpen} class="filter-group">{#each (['all', 'battery', 'motor', 'propeller', 'esc', 'airframe'] as FilterKind[]) as option}<button type="button" class:active={filter === option} on:click={() => setFilter(option)}><Icon name={kindIcon[option]} size={17} />{kindLabel[option]}</button>{/each}</div></div>
  <div class="catalog-list" aria-live="polite">{#each pageRows as row}<article class="catalog-row"><img class="row-image" src={imageFor(row)} alt="" /><div class="row-main"><strong>{row.manufacturer} · {row.model}</strong><small>{kindLabel[row.kind]} · {row.detail}</small></div><code>{row.source}</code>{#if row.kind !== 'airframe'}<div class="row-actions"><button class="edit-button" type="button" aria-label={`ویرایش ${row.model}`} on:click={() => openEditor(row)}><Icon name="edit" size={17} /></button><button class="delete-button" type="button" aria-label={`حذف ${row.model}`} on:click={() => requestDelete(row)}><Icon name="trash" size={17} /></button></div>{:else}<span class="row-spacer"></span>{/if}</article>{:else}<div class="empty-state">رکوردی با این جست‌وجو پیدا نشد.</div>{/each}</div>
  <nav class="pagination" aria-label="صفحه‌های قطعات"><button type="button" on:click={previousPage} disabled={page === 1} aria-label="صفحهٔ قبل">‹</button><span class="data">{page} / {pageCount}</span><button type="button" on:click={nextPage} disabled={page === pageCount} aria-label="صفحهٔ بعد">›</button></nav>
</section>

{#if editorOpen}<div class="editor-backdrop" role="presentation" on:click={() => (editorOpen = false)}><div class="editor-sheet" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="editor-title" on:click|stopPropagation on:keydown|stopPropagation><header><div><span class="eyebrow">{editorMode === 'edit' ? 'ویرایش قطعه' : 'قطعهٔ جدید'}</span><h2 id="editor-title">{editorMode === 'edit' ? editorModel : 'قطعهٔ جدید'}</h2></div><button class="editor-close" type="button" aria-label="بستن" on:click={() => (editorOpen = false)}>×</button></header>{#if editorMode === 'add'}<div class="editor-grid"><label>دسته<select value={editorKind} on:change={(event) => setEditorKind((event.currentTarget as HTMLSelectElement).value as ComponentKind)}><option value="battery">باتری</option><option value="motor">موتور</option><option value="propeller">ملخ</option><option value="esc">ESC</option></select></label><label>سازنده<input bind:value={editorManufacturer} /></label><label>مدل<input bind:value={editorModel} /></label></div>{/if}<div class="editor-fields">{#each editorFields as field}<label>{field.label}<div><input type="number" value={editorValues[field.key] ?? ''} on:input={(event) => setEditorValue(field.key, (event.currentTarget as HTMLInputElement).value)} /><b>{field.unit}</b></div></label>{/each}</div>{#if editorMode === 'add'}<label class="file-field">تصویر اختیاری<input type="file" accept="image/*" on:change={handleImage} /></label>{/if}<button class="editor-save" type="button" on:click={saveEditor}>ثبت تغییرات</button></div></div>{/if}

{#if deleteTarget}<div class="delete-backdrop" role="presentation" on:click={() => (deleteTarget = null)}><div class="delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title" tabindex="-1" on:click|stopPropagation on:keydown|stopPropagation><span class="delete-icon"><Icon name="trash" size={22} /></span><h2 id="delete-title">حذف قطعه؟</h2><p>{deleteTarget.manufacturer} · {deleteTarget.model}</p><div class="delete-actions"><button type="button" class="delete-cancel" on:click={() => (deleteTarget = null)}>لغو</button><button type="button" class="delete-confirm" on:click={confirmDelete}><Icon name="trash" size={16} /> حذف</button></div></div></div>{/if}

<style>
  .catalog { display: grid; gap: 18px; max-width: 980px; margin-inline: auto; }.catalog-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; }.catalog h1 { margin: 0; font-size: clamp(28px, 3vw, 40px); letter-spacing: -0.05em; }.catalog-head p { margin: 5px 0 0; color: var(--muted); font-size: 13px; }.catalog-actions { display: flex; align-items: center; gap: 12px; }.catalog-actions > strong { color: var(--blue); font-size: 14px; }.add-button { display: inline-flex; min-height: 40px; align-items: center; gap: 6px; border: 1px solid var(--blue); border-radius: 10px; background: var(--blue); color: white; padding-inline: 12px; font-size: 12px; }.catalog-toolbar { position: relative; display: grid; gap: 10px; }.search-line { display: flex; align-items: stretch; gap: 8px; }.search-field { display: flex; flex: 1; align-items: center; gap: 8px; min-height: 52px; border: 1px solid var(--input-line); border-radius: 13px; background: var(--surface); color: var(--muted); padding-inline: 14px; box-shadow: var(--shadow-soft); }.search-field:focus-within { border-color: var(--blue); }.search-field input { width: 100%; min-width: 0; min-height: 46px; border: 0; outline: 0; background: transparent; color: var(--ink); font-family: var(--font-ui); }.filter-trigger { display: none; width: 52px; min-height: 52px; place-items: center; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); color: var(--blue); }.filter-group { display: flex; flex-wrap: wrap; gap: 7px; }.filter-group button { display: inline-flex; min-height: 38px; align-items: center; gap: 6px; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); color: var(--ink-soft); padding-inline: 12px; font-size: 12px; }.filter-group button:hover, .filter-group button.active { border-color: var(--blue); background: var(--blue-soft); color: var(--blue); }.catalog-list { display: grid; overflow: hidden; border: 1px solid var(--line); border-radius: 15px; background: var(--surface); box-shadow: var(--shadow-soft); }.catalog-row { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto 78px; align-items: center; gap: 11px; min-height: 70px; border-bottom: 1px solid var(--line); padding: 9px 14px; }.catalog-row:last-child { border-bottom: 0; }.row-image { width: 38px; height: 38px; border-radius: 10px; object-fit: cover; background: var(--blue-soft); }.row-main { min-width: 0; }.row-main strong, .row-main small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.row-main strong { color: var(--ink); font-size: 13px; }.row-main small { margin-top: 4px; color: var(--muted); font-size: 11px; }.catalog-row code { min-width: 58px; color: var(--muted); font-family: var(--font-data); font-size: 10px; text-align: end; }.row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 5px; }.edit-button, .delete-button { display: grid; width: 32px; height: 32px; place-items: center; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); }.edit-button { color: var(--blue); }.edit-button:hover { border-color: var(--blue); background: var(--blue-soft); }.delete-button { color: var(--danger); }.delete-button:hover { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, var(--surface)); }.row-spacer { width: 32px; }.empty-state { display: grid; min-height: 180px; place-items: center; color: var(--muted); font-size: 13px; }.pagination { display: flex; align-items: center; justify-content: center; gap: 14px; }.pagination button { display: grid; width: 40px; height: 40px; place-items: center; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font-size: 25px; line-height: 1; }.pagination button:not(:disabled):hover { border-color: var(--blue); color: var(--blue); }.pagination button:disabled { opacity: .35; cursor: not-allowed; }.pagination span { min-width: 60px; color: var(--ink); font-size: 12px; text-align: center; }.editor-backdrop, .delete-backdrop { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: rgba(7, 23, 68, .42); padding: 24px; }.editor-sheet { width: min(560px, 100%); max-height: min(86dvh, 760px); overflow: auto; border: 1px solid var(--line); border-radius: 20px; background: var(--surface); padding: 20px; box-shadow: 0 24px 70px rgba(7, 23, 68, .28); }.editor-sheet > header { display: flex; align-items: start; justify-content: space-between; gap: 12px; }.editor-sheet h2 { margin: 3px 0 0; font-size: 22px; }.editor-close { width: 38px; height: 38px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font-size: 24px; }.editor-grid, .editor-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }.editor-sheet label { display: grid; gap: 6px; color: var(--ink-soft); font-size: 12px; }.editor-sheet label input, .editor-sheet select { min-height: 44px; border: 1px solid var(--input-line); border-radius: 9px; background: var(--paper); color: var(--ink); padding-inline: 10px; }.editor-fields > label > div { position: relative; display: flex; align-items: center; }.editor-fields input { width: 100%; padding-inline-end: 45px !important; font-family: var(--font-data); }.editor-fields b { position: absolute; inset-inline-end: 10px; color: var(--muted); font: 11px var(--font-data); }.file-field { margin-top: 14px; }.editor-save { width: 100%; min-height: 48px; margin-top: 18px; border: 0; border-radius: 10px; background: var(--blue); color: white; font-weight: 700; }.delete-dialog { width: min(360px, 100%); border: 1px solid var(--line); border-radius: 18px; background: var(--surface); padding: 22px; text-align: center; box-shadow: 0 24px 70px rgba(7, 23, 68, .28); animation: sheet-in 180ms var(--ease) both; }.delete-icon { display: grid; width: 44px; height: 44px; place-items: center; margin: 0 auto 11px; border-radius: 12px; background: color-mix(in srgb, var(--danger) 12%, var(--surface)); color: var(--danger); }.delete-dialog h2 { margin: 0; font-size: 20px; }.delete-dialog p { margin: 7px 0 0; color: var(--muted); font-size: 12px; }.delete-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 20px; }.delete-actions button { min-height: 44px; border-radius: 10px; font-weight: 700; }.delete-cancel { border: 1px solid var(--line); background: var(--surface); color: var(--ink); }.delete-confirm { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 0; background: var(--danger); color: white; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
  @media (max-width: 620px) { .catalog { padding-bottom: 98px; }.catalog-head { align-items: center; }.catalog-actions { gap: 7px; }.catalog-actions > strong { font-size: 12px; }.add-button { width: 42px; justify-content: center; padding: 0; }.add-button span { display: none; }.filter-trigger { display: grid; }.filter-group { position: absolute; inset-inline-end: 0; top: 60px; z-index: 4; display: none; width: min(220px, calc(100vw - 36px)); padding: 8px; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); box-shadow: var(--shadow); }.filter-group.open { display: grid; animation: filter-pop 160ms var(--ease) both; }.filter-group button { justify-content: flex-start; }.catalog-row { grid-template-columns: 38px minmax(0, 1fr) 69px; min-height: 64px; padding-inline: 9px; }.catalog-row code { display: none; }.row-main strong { font-size: 12px; }.row-main small { font-size: 10px; }.editor-backdrop { align-items: end; padding: 0; }.editor-sheet { max-height: calc(100dvh - 74px); border-radius: 20px 20px 0 0; padding: 17px 14px 24px; }.editor-grid, .editor-fields { gap: 9px; }.delete-backdrop { align-items: end; padding: 0 0 86px; }.delete-dialog { width: 100%; border-radius: 20px 20px 0 0; padding: 20px 16px 24px; } }
  @keyframes filter-pop { from { opacity: 0; transform: translateY(-5px) scale(.98); } to { opacity: 1; transform: none; } }
</style>
