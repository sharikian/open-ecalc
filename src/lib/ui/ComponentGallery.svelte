<script lang="ts">
  import { queryAircraft, queryComponents } from '$data';
  const all = queryComponents();
  const aircraft = queryAircraft();
  let query = '';
  $: filtered = all.filter((record) => `${record.manufacturer} ${record.model} ${record.kind}`.toLocaleLowerCase('fa').includes(query.trim().toLocaleLowerCase('fa')));
  $: aircraftFiltered = aircraft
    .filter((record) => `${record.manufacturer} ${record.model} ${record.classLabel}`.toLocaleLowerCase('fa').includes(query.trim().toLocaleLowerCase('fa')))
    .sort((a, b) => Number(b.model === 'Mavic 3' || b.model === 'Mavic 2 Pro') - Number(a.model === 'Mavic 3' || a.model === 'Mavic 2 Pro'));
  const kinds = [
    { key: 'motor', label: 'موتورها', icon: '✦' },
    { key: 'propeller', label: 'ملخ‌ها', icon: '◉' },
    { key: 'esc', label: 'ESCها', icon: '▤' },
    { key: 'battery', label: 'باتری‌ها', icon: '▣' }
  ] as const;
  const qualityLabel: Record<string, string> = { estimated: 'برآوردی', community: 'جامعه', manufacturer: 'سازنده', verified: 'تأییدشده' };
  function aircraftImage(url: string | undefined, model = ''): string {
    if (url && !url.includes('aircraft-catalog-grid') && !url.includes('airframe-starter')) return url;
    const name = model.toLocaleLowerCase('en');
    if (/(hex|octo|heavy|agri|x8|x6)/.test(name)) return '/data/images/aircraft-hexacopter.png';
    if (/(cine|fpv|racing|tiny|whoop)/.test(name)) return '/data/images/aircraft-cinewhoop.png';
    const hash = [...model].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return ['/data/images/aircraft-product.png', '/data/images/aircraft-cinewhoop.png', '/data/images/aircraft-hexacopter.png'][hash % 3];
  }
</script>

<section class="catalog" aria-labelledby="catalog-title">
  <header class="catalog-head"><div><span class="eyebrow">بانک قطعات</span><h1 id="catalog-title">قطعات و منحنی‌ها</h1><p>منابع دریافت‌شده با نشانی و مجوز هر رکورد</p></div><div class="catalog-count"><strong class="data">۸۴۸</strong><span>فایل محلی</span></div></header>
  <div class="catalog-toolbar"><label><span class="sr-only">جست‌وجوی قطعات</span><input bind:value={query} placeholder="جست‌وجوی نام یا سازنده" /></label></div>
  <div class="kind-grid">
    {#each kinds as kind}
      {@const items = filtered.filter((record) => record.kind === kind.key)}
      <article class="kind-card"><header><span class="kind-icon">{kind.icon}</span><div><h2>{kind.label}</h2><p>{items.length} رکورد پایه</p></div><span class="data">{String(items.length).padStart(2, '0')}</span></header>
        {#if items.length === 0}<div class="kind-empty">در انتظار واردکردن منبع</div>{:else}<ul>{#each items.slice(0, 3) as item}<li>{#if item.imageUrl}<img src={item.imageUrl} alt="" />{:else}<span class="thumb">{kind.icon}</span>{/if}<div><strong>{item.model}</strong><small>{item.manufacturer === 'Open Reference' ? 'مرجع پروژه' : item.manufacturer}</small></div><b class="quality">{qualityLabel[item.quality] ?? item.quality}</b></li>{/each}</ul>{/if}
      </article>
    {/each}
  </div>
  <section class="aircraft-section" aria-labelledby="aircraft-title">
    <header class="section-head"><div><span class="eyebrow">بدنه‌ها</span><h2 id="aircraft-title">فهرست بدنه‌ها</h2><p>جست‌وجو و انتخاب از رکوردهای محلی</p></div><strong class="data">{aircraft.length} مدل</strong></header>
    <div class="aircraft-grid">
      {#each aircraftFiltered.slice(0, 9) as item}
        <article class="aircraft-card">
          <img src={aircraftImage(item.imageUrl, item.model)} alt="" />
          <div class="aircraft-card__body"><div class="aircraft-card__title"><strong>{item.manufacturer} {item.model}</strong><span class="quality">{item.quality === 'manufacturer' ? 'سازنده' : 'جامعه'}</span></div><div class="aircraft-specs"><span><b>{item.massKg ? `${(item.massKg * 1000).toFixed(0)} g` : '—'}</b><small>وزن</small></span><span><b>{item.enduranceMin ? `${item.enduranceMin} min` : '—'}</b><small>زمان پرواز</small></span><span><b>{item.maxFlightDistanceKm ? `${item.maxFlightDistanceKm} km` : '—'}</b><small>برد</small></span></div></div>
        </article>
      {:else}<div class="kind-empty">مدلی با این جست‌وجو پیدا نشد</div>{/each}
    </div>
  </section>
  <footer class="catalog-foot"><span>دادهٔ خام در <code>data/raw</code> نگه‌داری می‌شود</span><span>مجوز هر منبع در manifest ثبت شده است</span></footer>
</section>

<style>
  .catalog { display: grid; gap: 22px; }.catalog-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; }.eyebrow { color: var(--blue); font-size: 13px; }.catalog h1 { margin: 5px 0 0; font-size: clamp(28px, 3vw, 40px); letter-spacing: -0.05em; }.catalog-head p { margin: 6px 0 0; color: var(--muted); font-size: 13px; }.catalog-count { display: grid; justify-items: end; gap: 1px; color: var(--muted); font-size: 12px; }.catalog-count strong { color: var(--ink); font-size: 27px; }.catalog-toolbar label { display: block; }.catalog-toolbar input { width: 100%; min-height: 48px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); color: var(--ink); padding-inline: 15px; }.kind-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }.kind-card, .aircraft-card { display: grid; gap: 14px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 18px; box-shadow: var(--shadow-soft); }.kind-card header { display: flex; align-items: center; gap: 10px; }.kind-card header > div { flex: 1; }.kind-icon, .thumb { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 11px; background: var(--blue-soft); color: var(--blue); font-size: 20px; }.kind-card h2 { margin: 0; font-size: 17px; }.kind-card p { margin: 2px 0 0; color: var(--muted); font-size: 12px; }.kind-card header > .data { color: var(--blue); font-size: 12px; }.kind-card ul { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }.kind-card li { display: flex; align-items: center; gap: 9px; min-width: 0; border-top: 1px solid var(--line); padding-top: 9px; }.kind-card li > div { min-width: 0; flex: 1; }.kind-card li strong, .kind-card li small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.kind-card li strong { font-size: 13px; }.kind-card li small { margin-top: 2px; color: var(--muted); font-size: 11px; }.kind-card li img { width: 38px; height: 38px; border-radius: 9px; object-fit: cover; }.quality { color: var(--muted); font-family: var(--font-data); font-size: 10px; font-weight: 500; }.kind-empty { min-height: 82px; display: grid; place-items: center; border: 1px dashed var(--line-strong); border-radius: 10px; color: var(--muted); font-size: 12px; }.aircraft-section { display: grid; gap: 14px; }.section-head { display: flex; align-items: end; justify-content: space-between; gap: 14px; }.section-head h2 { margin: 4px 0 0; font-size: 22px; }.section-head p { margin: 5px 0 0; color: var(--muted); font-size: 12px; }.section-head > .data { color: var(--blue); font-size: 12px; }.aircraft-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }.aircraft-card { overflow: hidden; padding: 0; gap: 0; }.aircraft-card > img { width: 100%; aspect-ratio: 1.65; object-fit: cover; border-bottom: 1px solid var(--line); }.aircraft-card__body { display: grid; gap: 13px; padding: 14px; }.aircraft-card__title { display: flex; align-items: start; justify-content: space-between; gap: 8px; }.aircraft-card__title strong { font-size: 14px; line-height: 1.35; }.aircraft-specs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }.aircraft-specs span { display: grid; gap: 2px; }.aircraft-specs b { font-family: var(--font-data); font-size: 12px; direction: ltr; text-align: right; }.aircraft-specs small { color: var(--muted); font-size: 10px; }.catalog-foot { display: flex; justify-content: space-between; gap: 10px; color: var(--muted); font-size: 11px; }.catalog-foot code { color: var(--ink-soft); font-family: var(--font-data); }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
  @media (max-width: 900px) { .aircraft-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .catalog-head { align-items: start; }.catalog-count { display: none; }.catalog-toolbar { display: grid; }.kind-grid, .aircraft-grid { grid-template-columns: minmax(0, 1fr); }.catalog-foot { display: grid; gap: 4px; } }
</style>
