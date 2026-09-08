<script lang="ts">
  import { queryAircraft, queryComponents } from '$data';
  import type { ComponentKind } from '$data';
  import Icon from './Icon.svelte';

  type FilterKind = 'all' | ComponentKind | 'airframe';
  type CatalogRow = { id: string; kind: FilterKind; manufacturer: string; model: string; quality: string; source: string; detail: string };
  const qualityLabel: Record<string, string> = { estimated: 'برآوردی', community: 'جامعه', manufacturer: 'سازنده', verified: 'تأییدشده' };
  const kindLabel: Record<FilterKind, string> = { all: 'همه', battery: 'باتری', motor: 'موتور', propeller: 'ملخ', esc: 'ESC', airframe: 'بدنه' };
  const kindIcon: Record<FilterKind, 'battery' | 'motor' | 'propeller' | 'sliders' | 'drone'> = { all: 'sliders', battery: 'battery', motor: 'motor', propeller: 'propeller', esc: 'sliders', airframe: 'drone' };
  const components = queryComponents();
  const aircraft = queryAircraft();
  const rows: CatalogRow[] = [
    ...components.map((item) => ({ id: item.id, kind: item.kind, manufacturer: item.manufacturer, model: item.model, quality: item.quality, source: item.licenseSpdx, detail: item.kind === 'battery' ? 'سلول و پک' : item.kind === 'motor' ? 'موتور براشلس' : item.kind === 'propeller' ? 'پروفایل ملخ' : 'کنترل‌کننده' })),
    ...aircraft.map((item) => ({ id: item.id, kind: 'airframe' as const, manufacturer: item.manufacturer, model: item.model, quality: item.quality, source: item.licenseSpdx, detail: item.classLabel || 'بدنهٔ پرنده' }))
  ];
  let query = '';
  let filter: FilterKind = 'all';
  let page = 1;
  const pageSize = 10;
  $: needle = query.trim().toLocaleLowerCase('fa');
  $: filtered = rows.filter((row) => (filter === 'all' || row.kind === filter) && (!needle || `${row.manufacturer} ${row.model} ${row.detail}`.toLocaleLowerCase('fa').includes(needle)));
  $: pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  $: if (page > pageCount) page = pageCount;
  $: pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  $: firstResult = filtered.length ? (page - 1) * pageSize + 1 : 0;
  $: lastResult = Math.min(page * pageSize, filtered.length);
  function setQuery(value: string) { query = value; page = 1; }
  function setFilter(value: FilterKind) { filter = value; page = 1; }
  function previousPage() { page = Math.max(1, page - 1); }
  function nextPage() { page = Math.min(pageCount, page + 1); }
</script>

<section class="catalog" aria-labelledby="catalog-title">
  <header class="catalog-head"><div><span class="eyebrow">کتابخانهٔ محلی</span><h1 id="catalog-title">قطعات</h1><p>جست‌وجو در {rows.length} رکورد قابل‌ردیابی</p></div><strong class="data catalog-count">{filtered.length} نتیجه</strong></header>
  <div class="catalog-toolbar">
    <label class="search-field"><Icon name="search" size={19} /><span class="sr-only">جست‌وجوی قطعات</span><input value={query} on:input={(event) => setQuery((event.currentTarget as HTMLInputElement).value)} placeholder="نام، سازنده یا نوع قطعه" /></label>
    <div class="filter-group" aria-label="فیلتر نوع قطعه">{#each (['all', 'battery', 'motor', 'propeller', 'esc', 'airframe'] as FilterKind[]) as option}<button type="button" class:active={filter === option} on:click={() => setFilter(option)}><Icon name={kindIcon[option]} size={17} />{kindLabel[option]}</button>{/each}</div>
  </div>
  <div class="list-meta"><span>{firstResult}–{lastResult} از {filtered.length}</span><span>هر صفحه ۱۰ رکورد</span></div>
  <div class="catalog-list" aria-live="polite">
    {#each pageRows as row}
      <article class="catalog-row"><span class="row-icon"><Icon name={kindIcon[row.kind]} size={21} /></span><div class="row-main"><strong>{row.manufacturer} · {row.model}</strong><small>{kindLabel[row.kind]} · {row.detail}</small></div><span class="quality">{qualityLabel[row.quality] ?? row.quality}</span><code>{row.source}</code></article>
    {:else}<div class="empty-state">رکوردی با این جست‌وجو پیدا نشد.</div>{/each}
  </div>
  <nav class="pagination" aria-label="صفحه‌های قطعات"><button type="button" on:click={previousPage} disabled={page === 1} aria-label="صفحهٔ قبل">‹</button><span class="data">{page} / {pageCount}</span><button type="button" on:click={nextPage} disabled={page === pageCount} aria-label="صفحهٔ بعد">›</button></nav>
</section>

<style>
  .catalog { display: grid; gap: 18px; max-width: 980px; margin-inline: auto; }.catalog-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; }.eyebrow { color: var(--blue); font-size: 12px; }.catalog h1 { margin: 4px 0 0; font-size: clamp(28px, 3vw, 40px); letter-spacing: -0.05em; }.catalog-head p { margin: 5px 0 0; color: var(--muted); font-size: 13px; }.catalog-count { color: var(--blue); font-size: 14px; }.catalog-toolbar { display: grid; gap: 10px; }.search-field { display: flex; align-items: center; gap: 8px; min-height: 52px; border: 1px solid var(--input-line); border-radius: 13px; background: var(--surface); color: var(--muted); padding-inline: 14px; box-shadow: var(--shadow-soft); }.search-field:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px color-mix(in srgb, var(--blue) 12%, transparent); }.search-field input { width: 100%; min-width: 0; min-height: 46px; border: 0; outline: 0; background: transparent; color: var(--ink); font-family: var(--font-ui); }.filter-group { display: flex; flex-wrap: wrap; gap: 7px; }.filter-group button { display: inline-flex; min-height: 38px; align-items: center; gap: 6px; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); color: var(--ink-soft); padding-inline: 12px; font-size: 12px; }.filter-group button:hover, .filter-group button.active { border-color: var(--blue); background: var(--blue-soft); color: var(--blue); }.list-meta { display: flex; justify-content: space-between; color: var(--muted); font-size: 11px; }.catalog-list { display: grid; overflow: hidden; border: 1px solid var(--line); border-radius: 15px; background: var(--surface); box-shadow: var(--shadow-soft); }.catalog-row { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto auto; align-items: center; gap: 11px; min-height: 70px; border-bottom: 1px solid var(--line); padding: 9px 14px; }.catalog-row:last-child { border-bottom: 0; }.row-icon { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 11px; background: var(--blue-soft); color: var(--blue); }.row-main { min-width: 0; }.row-main strong, .row-main small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.row-main strong { color: var(--ink); font-size: 13px; }.row-main small { margin-top: 4px; color: var(--muted); font-size: 11px; }.quality { color: var(--muted); font-size: 11px; white-space: nowrap; }.catalog-row code { min-width: 58px; color: var(--muted); font-family: var(--font-data); font-size: 10px; text-align: end; }.empty-state { display: grid; min-height: 180px; place-items: center; color: var(--muted); font-size: 13px; }.pagination { display: flex; align-items: center; justify-content: center; gap: 14px; }.pagination button { display: grid; width: 40px; height: 40px; place-items: center; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font-size: 25px; line-height: 1; }.pagination button:not(:disabled):hover { border-color: var(--blue); color: var(--blue); }.pagination button:disabled { opacity: .35; cursor: not-allowed; }.pagination span { min-width: 60px; color: var(--ink); font-size: 12px; text-align: center; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
  @media (max-width: 620px) { .catalog-head { align-items: start; }.catalog-count { font-size: 12px; }.catalog-row { grid-template-columns: 38px minmax(0, 1fr) auto; min-height: 64px; padding-inline: 10px; }.catalog-row code { display: none; }.quality { font-size: 10px; }.filter-group { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 3px; scrollbar-width: thin; }.filter-group button { flex: 0 0 auto; } }
</style>
