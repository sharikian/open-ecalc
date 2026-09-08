<script lang="ts">
  import { onMount } from 'svelte';
  import { getAircraft, getComponent, getLocation, hideComponent, hiddenComponents, hideLocation, queryAircraft, queryComponents, queryLocations, saveAircraftOverride, saveComponentOverride, saveCustomAircraft, saveCustomComponent, saveCustomLocation, saveLocationOverride } from '$data';
  import type { AircraftProfile, ComponentKind, ComponentRecord, FlightLocation } from '$data';
  import { locale } from '$lib/i18n';
  import Icon from './Icon.svelte';

  type FilterKind = 'all' | ComponentKind | 'airframe' | 'environment';
  type Row = { id: string; kind: FilterKind; manufacturer: string; model: string; quality: string; source: string; detail: string; imageUrl?: string };
  type EditorField = { key: string; label: string; unit: string; optional?: boolean };
  const kindLabelFa: Record<FilterKind, string> = { all: 'همه', battery: 'باتری', motor: 'موتور', propeller: 'ملخ', esc: 'ESC', airframe: 'بدنه', environment: 'محیط' };
  const kindLabelEn: Record<FilterKind, string> = { all: 'All', battery: 'Battery', motor: 'Motor', propeller: 'Propeller', esc: 'ESC', airframe: 'Airframe', environment: 'Environment' };
  $: kindLabel = $locale === 'en' ? kindLabelEn : kindLabelFa;
  $: ui = $locale === 'en' ? {
    title: 'Components', count: 'records', result: 'results', add: 'Add record', search: 'Search by name, maker or type', filters: 'Component filter', previous: 'Previous page', next: 'Next page', empty: 'No records match this search.', close: 'Close', save: 'Save changes', addComponent: 'Add component', addAirframe: 'Add airframe', addEnvironment: 'Add environment', editComponent: 'Edit component', editAirframe: 'Edit airframe', editEnvironment: 'Edit environment', editName: 'Edit name', manufacturer: 'Maker', model: 'Model', province: 'Province', place: 'Location', description: 'Description', category: 'Category', gallery: 'Choose from gallery', imageCurrent: 'Current image · choose to replace', imageHint: 'PNG, JPG or WebP', addImage: 'Add image', imageOptional: 'Optional · PNG, JPG or WebP', required: 'Required', imageReplace: 'Select another image', imageNone: 'No image', delete: 'Delete', cancel: 'Cancel', deleteQuestion: 'Delete'
  } : {
    title: 'قطعات', count: 'رکورد', result: 'نتیجه', add: 'افزودن رکورد', search: 'نام، سازنده یا نوع قطعه', filters: 'فیلتر نوع قطعه', previous: 'صفحهٔ قبل', next: 'صفحهٔ بعد', empty: 'رکوردی با این جست‌وجو پیدا نشد.', close: 'بستن', save: 'ثبت تغییرات', addComponent: 'افزودن قطعه', addAirframe: 'افزودن بدنه', addEnvironment: 'افزودن محیط', editComponent: 'ویرایش قطعه', editAirframe: 'ویرایش بدنه', editEnvironment: 'ویرایش محیط', editName: 'ویرایش نام', manufacturer: 'سازنده', model: 'مدل', province: 'استان', place: 'نام مکان', description: 'توضیحات', category: 'دسته', gallery: 'انتخاب از گالری', imageCurrent: 'تصویر فعلی · برای جایگزینی انتخاب کنید', imageHint: 'فایل PNG، JPG یا WebP را انتخاب کنید', addImage: 'افزودن تصویر', imageOptional: 'اختیاری · PNG، JPG یا WebP', required: 'مقدار لازم', imageReplace: 'انتخاب تصویر دیگر', imageNone: 'بدون تصویر', delete: 'حذف', cancel: 'لغو', deleteQuestion: 'حذف'
  };
  const kindIcon: Record<FilterKind, 'battery' | 'motor' | 'propeller' | 'sliders' | 'drone' | 'filter' | 'map'> = { all: 'filter', battery: 'battery', motor: 'motor', propeller: 'propeller', esc: 'sliders', airframe: 'drone', environment: 'map' };
  $: baseRows = (() => {
    catalogRevision;
    return [
      ...queryComponents().map((item) => ({ id: item.id, kind: item.kind, manufacturer: item.manufacturer, model: item.model, quality: item.quality, source: item.licenseSpdx, detail: $locale === 'en' ? (item.kind === 'battery' ? 'Cell and pack' : item.kind === 'motor' ? 'Brushless motor' : item.kind === 'propeller' ? 'Propeller profile' : 'Controller') : (item.kind === 'battery' ? 'سلول و پک' : item.kind === 'motor' ? 'موتور براشلس' : item.kind === 'propeller' ? 'پروفایل ملخ' : 'کنترل‌کننده'), imageUrl: item.imageUrl })),
      ...queryAircraft().map((item) => ({ id: item.id, kind: 'airframe' as const, manufacturer: item.manufacturer, model: item.model, quality: item.quality, source: item.licenseSpdx, detail: item.classLabel || ($locale === 'en' ? 'Aircraft frame' : 'بدنهٔ پرنده'), imageUrl: item.imageUrl })),
      ...queryLocations().map((item) => ({ id: item.id, kind: 'environment' as const, manufacturer: ($locale === 'en' ? item.provinceEn : item.provinceFa) ?? '', model: $locale === 'en' ? item.nameEn : item.nameFa, quality: item.quality, source: item.licenseSpdx, detail: $locale === 'en' ? (item.descriptionEn || `${item.altitudeM} m altitude`) : (item.descriptionFa || `ارتفاع ${item.altitudeM} m`), imageUrl: item.imageUrl }))
    ] as Row[];
  })();
  const fields: Record<ComponentKind, EditorField[]> = {
    battery: [{ key: 'capacityAh', label: 'ظرفیت', unit: 'Ah' }, { key: 'nominalVoltageV', label: 'ولتاژ', unit: 'V' }, { key: 'continuousC', label: 'C-rate', unit: 'C' }, { key: 'massKg', label: 'جرم', unit: 'kg' }],
    motor: [{ key: 'kv', label: 'KV', unit: 'rpm/V' }, { key: 'maxCurrentA', label: 'جریان بیشینه', unit: 'A' }, { key: 'maxPowerW', label: 'توان بیشینه', unit: 'W' }, { key: 'massKg', label: 'جرم', unit: 'kg' }],
    propeller: [{ key: 'diameterM', label: 'قطر', unit: 'm' }, { key: 'pitchM', label: 'گام', unit: 'm' }, { key: 'bladeCount', label: 'تعداد پره', unit: '' }],
    esc: [{ key: 'continuousCurrentA', label: 'جریان دائم', unit: 'A' }, { key: 'burstCurrentA', label: 'جریان لحظه‌ای', unit: 'A' }, { key: 'efficiency', label: 'بازده', unit: '' }, { key: 'massKg', label: 'جرم', unit: 'kg' }]
  };
  const airframeFields: EditorField[] = [
    { key: 'massKg', label: 'جرم', unit: 'kg' },
    { key: 'maxTakeoffMassKg', label: 'جرم برخاست', unit: 'kg' },
    { key: 'maxServiceCeilingM', label: 'سقف پرواز', unit: 'm', optional: true },
    { key: 'maxFlightDistanceKm', label: 'برد پرواز', unit: 'km', optional: true }
  ];
  const locationFields: EditorField[] = [
    { key: 'altitudeM', label: 'ارتفاع', unit: 'm' },
    { key: 'temperatureC', label: 'دما', unit: '°C' },
    { key: 'pressurePa', label: 'فشار', unit: 'Pa' }
  ];
  let customRows: Row[] = [];
  let hiddenIds = hiddenComponents();
  let query = '';
  let filter: FilterKind = 'all';
  let filterOpen = false;
  let isMobile = false;
  let page = 1;
  let editorOpen = false;
  let editorMode: 'edit' | 'add' = 'edit';
  let editorAirframe = false;
  let editorLocation = false;
  let editorEntity: 'component' | 'airframe' | 'environment' = 'component';
  let editorKind: ComponentKind = 'battery';
  let editorId = '';
  let editorManufacturer = '';
  let editorModel = '';
  let editorDescription = '';
  let nameEditing = false;
  let editorImage = '';
  let editorValues: Record<string, string> = {};
  let editorAirframeValues: Record<string, string> = {};
  let editorLocationValues: Record<string, string> = {};
  let editorInvalidFields: string[] = [];
  let galleryOpen = false;
  let catalogRevision = 0;
  const galleryImages = [
    { kind: 'battery', src: '/data/images/battery-lipo-pack.png', label: 'LiPo' },
    { kind: 'battery', src: '/data/images/battery-liion-pack.png', label: 'Li-ion' },
    { kind: 'motor', src: '/data/images/motor-brushless.png', label: 'Brushless' },
    { kind: 'propeller', src: '/data/images/propeller-cyclone-t5045c-74v.png', label: 'Propeller' },
    { kind: 'esc', src: '/data/images/esc-high-current.png', label: 'High current ESC' },
    { kind: 'esc', src: '/data/images/esc-compact-board.png', label: 'Compact ESC' },
    { kind: 'airframe', src: '/data/images/aircraft-product.png', label: 'Aircraft' },
    { kind: 'airframe', src: '/data/images/aircraft-cinewhoop.png', label: 'Cinewhoop' },
    { kind: 'airframe', src: '/data/images/aircraft-hexacopter.png', label: 'Hexacopter' },
    { kind: 'environment', src: '/data/images/locations/lut-desert.png', label: 'Desert' },
    { kind: 'environment', src: '/data/images/locations/damavand.png', label: 'Mountain' },
    { kind: 'environment', src: '/data/images/locations/hyrcanian-forest.png', label: 'Forest' },
    { kind: 'environment', src: '/data/images/locations/chabahar-coast.png', label: 'Coast' }
  ];
  $: galleryOptions = galleryImages.filter((item) => item.kind === (editorLocation ? 'environment' : editorAirframe ? 'airframe' : editorKind));
  const fieldLabelsEn: Record<string, string> = { capacityAh: 'Capacity', nominalVoltageV: 'Voltage', continuousC: 'C-rate', massKg: 'Mass', kv: 'Motor KV', maxCurrentA: 'Maximum current', maxPowerW: 'Maximum power', diameterM: 'Diameter', pitchM: 'Pitch', bladeCount: 'Blade count', continuousCurrentA: 'Continuous current', burstCurrentA: 'Burst current', efficiency: 'Efficiency', maxTakeoffMassKg: 'Takeoff mass', maxServiceCeilingM: 'Service ceiling', maxFlightDistanceKm: 'Flight range', altitudeM: 'Altitude', temperatureC: 'Temperature', pressurePa: 'Air pressure' };
  function localizedField(field: EditorField): string { return $locale === 'en' ? (fieldLabelsEn[field.key] ?? field.label) : field.label; }
  let deleteTarget: Row | null = null;
  $: rows = [...baseRows, ...customRows].filter((row) => !hiddenIds.includes(row.id));
  $: pageSize = isMobile ? 5 : 10;
  $: needle = query.trim().toLocaleLowerCase('fa');
  $: filtered = rows.filter((row) => (filter === 'all' || row.kind === filter) && (!needle || `${row.manufacturer} ${row.model} ${row.detail}`.toLocaleLowerCase('fa').includes(needle)));
  $: pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  $: if (page > pageCount) page = pageCount;
  $: pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  $: editorFields = editorAirframe ? airframeFields : editorLocation ? locationFields : fields[editorKind];

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
    if (row.kind === 'environment') return '/data/images/flight-validation.png';
    if (row.kind === 'motor') return '/data/images/motor-brushless.png';
    if (row.kind === 'propeller') return '/data/images/propeller-cyclone-t5045c-74v.png';
    return '/data/images/aircraft-product.png';
  }
  function displayModel(row: Row): string {
    if (row.kind === 'battery') return row.model.replace(/^(?:LiPo\s+)+/i, 'LiPo ');
    if (row.kind === 'esc') return row.model.replace(/^Open\s+/i, '');
    if (row.kind === 'motor') return row.model.replace(/^(?:Brushless motor\s+)+/i, 'Brushless motor ');
    if (row.kind === 'propeller') return row.model.replace(/^(?:Propeller\s+)+/i, 'Propeller ');
    return row.model;
  }
  function cleanEditorModel(kind: ComponentKind, model: string): string {
    if (kind === 'battery') return model.replace(/^(?:LiPo\s+)+/i, 'LiPo ');
    if (kind === 'esc') return model.replace(/^Open\s+/i, '');
    if (kind === 'motor') return model.replace(/^(?:Brushless motor\s+)+/i, 'Brushless motor ');
    if (kind === 'propeller') return model.replace(/^(?:Propeller\s+)+/i, 'Propeller ');
    return model;
  }
  function displayManufacturer(row: Row): string { return row.manufacturer === 'Open Reference' ? '' : row.manufacturer; }
  function rowTitle(row: Row): string { const manufacturer = displayManufacturer(row); return manufacturer ? `${manufacturer} · ${displayModel(row)}` : displayModel(row); }
  function setQuery(value: string) { query = value; page = 1; }
  function setFilter(value: FilterKind) { filter = value; filterOpen = false; page = 1; }
  function openEditor(row: Row) {
    if (row.kind === 'environment') {
      const record = getLocation(row.id); if (!record) return;
      editorMode = 'edit'; editorEntity = 'environment'; editorAirframe = false; editorLocation = true; editorId = record.id; editorManufacturer = ($locale === 'en' ? record.provinceEn : record.provinceFa) ?? ''; editorModel = $locale === 'en' ? record.nameEn : record.nameFa; editorDescription = ($locale === 'en' ? record.descriptionEn : record.descriptionFa) ?? ''; editorImage = record.imageUrl ?? ''; nameEditing = false;
      editorLocationValues = Object.fromEntries(locationFields.map((field) => [field.key, String(record[field.key as keyof FlightLocation] ?? '')])); editorInvalidFields = []; editorOpen = true; return;
    }
    if (row.kind === 'airframe') {
      const record = getAircraft(row.id); if (!record) return;
      editorMode = 'edit'; editorEntity = 'airframe'; editorAirframe = true; editorLocation = false; editorId = record.id; editorManufacturer = record.manufacturer; editorModel = record.model; editorDescription = ''; editorImage = record.imageUrl ?? ''; nameEditing = false;
      editorAirframeValues = Object.fromEntries(airframeFields.map((field) => [field.key, String((record as unknown as Record<string, unknown>)[field.key] ?? '')]));
      editorInvalidFields = []; editorOpen = true; return;
    }
    const record = getComponent(row.id); if (!record) return;
    editorMode = 'edit'; editorEntity = 'component'; editorAirframe = false; editorLocation = false; editorKind = record.kind; editorId = record.id; editorManufacturer = record.manufacturer === 'Open Reference' ? '' : record.manufacturer; editorModel = cleanEditorModel(record.kind, record.model); editorDescription = ''; editorImage = record.imageUrl ?? ''; nameEditing = false;
    editorValues = Object.fromEntries(fields[record.kind].map((field) => [field.key, String((record as unknown as Record<string, unknown>)[field.key] ?? '')])); editorInvalidFields = []; editorOpen = true;
  }
  function blankValues(kind: ComponentKind): Record<string, string> { return Object.fromEntries(fields[kind].map((field) => [field.key, ''])); }
  function blankLocationValues(): Record<string, string> { return Object.fromEntries(locationFields.map((field) => [field.key, ''])); }
  function blankAirframeValues(): Record<string, string> { return Object.fromEntries(airframeFields.map((field) => [field.key, ''])); }
  function openAdd() { editorMode = 'add'; editorEntity = 'component'; editorAirframe = false; editorLocation = false; editorKind = 'battery'; editorId = `custom-${Date.now()}`; editorManufacturer = ''; editorModel = ''; editorDescription = ''; editorImage = ''; nameEditing = false; editorValues = blankValues('battery'); editorInvalidFields = []; editorOpen = true; }
  function setEditorCategory(next: string) {
    editorEntity = next as typeof editorEntity; editorAirframe = editorEntity === 'airframe'; editorLocation = editorEntity === 'environment'; editorDescription = ''; editorInvalidFields = [];
    if (editorAirframe) { editorAirframeValues = blankAirframeValues(); editorImage = ''; }
    else if (editorLocation) { editorLocationValues = blankLocationValues(); editorImage = ''; }
    else { editorKind = next as ComponentKind; editorValues = blankValues(editorKind); editorImage = ''; }
  }
  function setEditorValue(key: string, value: string) { if (editorAirframe) editorAirframeValues = { ...editorAirframeValues, [key]: value }; else if (editorLocation) editorLocationValues = { ...editorLocationValues, [key]: value }; else editorValues = { ...editorValues, [key]: value }; editorInvalidFields = editorInvalidFields.filter((field) => field !== key); }
  function setTextField(field: 'manufacturer' | 'model' | 'description', value: string) { if (field === 'manufacturer') editorManufacturer = value; else if (field === 'model') editorModel = value; else editorDescription = value; editorInvalidFields = editorInvalidFields.filter((item) => item !== field); }
  function handleImage(event: Event) { const file = (event.currentTarget as HTMLInputElement).files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { editorImage = String(reader.result); }; reader.readAsDataURL(file); }
  function chooseGalleryImage(src: string) { editorImage = src; galleryOpen = false; }
  function buildRecord(): ComponentRecord {
    const values = Object.fromEntries(editorFields.map((field) => [field.key, Number(editorValues[field.key])])) as Record<string, number>;
    const common = { id: editorId, kind: editorKind, manufacturer: editorManufacturer.trim() || 'مرجع شخصی', model: editorModel.trim() || 'قطعهٔ جدید', tags: ['custom'], sourceUrl: 'local://user-component', licenseSpdx: 'NOASSERTION', retrievedAt: new Date().toISOString(), sourceHash: `local-${editorId}`, quality: 'community' as const, imageUrl: editorImage || undefined };
    if (editorKind === 'battery') return { ...common, ...values, chemistry: 'LiPo', burstC: values.continuousC * 1.3, internalResistanceOhm: 0.02 } as ComponentRecord;
    if (editorKind === 'motor') return { ...common, ...values, noLoadCurrentA: 0.8, resistanceOhm: 0.05, poles: 14 } as ComponentRecord;
    if (editorKind === 'propeller') return { ...common, ...values, thrustCoefficient: 0.1, powerCoefficient: 0.05 } as ComponentRecord;
    return { ...common, ...values, resistanceOhm: 0.003 } as ComponentRecord;
  }
  function buildAircraft(): AircraftProfile {
    const values = Object.fromEntries(editorFields.map((field) => [field.key, Number(editorAirframeValues[field.key])])) as Record<string, number>;
    return { id: editorId, manufacturer: editorManufacturer.trim(), model: editorModel.trim(), classLabel: 'Custom airframe', massKg: values.massKg, maxTakeoffMassKg: values.maxTakeoffMassKg, enduranceMin: null, hasCamera: null, isToy: false, sourceUrl: 'local://user-airframe', licenseSpdx: 'NOASSERTION', retrievedAt: new Date().toISOString(), sourceHash: `local-${editorId}`, quality: 'community', imageUrl: editorImage, maxFlightDistanceKm: values.maxFlightDistanceKm || null, maxServiceCeilingM: values.maxServiceCeilingM || null, battery: null };
  }
  function buildLocation(): FlightLocation {
    const values = Object.fromEntries(editorFields.map((field) => [field.key, Number(editorLocationValues[field.key])])) as Record<string, number>;
    const existing = editorMode === 'edit' ? getLocation(editorId) : undefined;
    const name = editorModel.trim();
    const description = editorDescription.trim();
    const province = editorManufacturer.trim();
    return { id: editorId, nameFa: $locale === 'en' ? existing?.nameFa ?? name : name, nameEn: $locale === 'en' ? name : existing?.nameEn ?? name, provinceFa: $locale === 'en' ? existing?.provinceFa : province || undefined, provinceEn: $locale === 'en' ? province || undefined : existing?.provinceEn, descriptionFa: $locale === 'en' ? existing?.descriptionFa : description || undefined, descriptionEn: $locale === 'en' ? description || undefined : existing?.descriptionEn, altitudeM: values.altitudeM, temperatureC: values.temperatureC, pressurePa: values.pressurePa, imageUrl: editorImage || undefined, sourceUrl: 'local://user-location', licenseSpdx: 'NOASSERTION', retrievedAt: new Date().toISOString(), sourceHash: `local-${editorId}`, quality: 'community' };
  }
  function validateEditor(): boolean {
    const invalid: string[] = [];
    if (editorMode === 'add' && !editorLocation && !editorManufacturer.trim()) invalid.push('manufacturer');
    if (editorMode === 'add' && !editorModel.trim()) invalid.push('model');
    const values = editorAirframe ? editorAirframeValues : editorLocation ? editorLocationValues : editorValues;
    for (const field of editorFields) {
      if (field.optional && String(values[field.key] ?? '').trim() === '') continue;
      const value = Number(values[field.key]);
      const validLocationValue = editorLocation && (field.key === 'altitudeM' || field.key === 'temperatureC') ? Number.isFinite(value) : Number.isFinite(value) && value > 0;
      if (!validLocationValue) invalid.push(field.key);
    }
    if (!editorAirframe && !editorLocation && editorKind === 'propeller' && (!Number.isInteger(Number(editorValues.bladeCount)) || Number(editorValues.bladeCount) < 2)) {
      if (!invalid.includes('bladeCount')) invalid.push('bladeCount');
    }
    if (!editorAirframe && !editorLocation && editorKind === 'esc' && (Number(editorValues.efficiency) <= 0 || Number(editorValues.efficiency) > 1)) {
      if (!invalid.includes('efficiency')) invalid.push('efficiency');
    }
    editorInvalidFields = invalid;
    return invalid.length === 0;
  }
  function saveEditor() {
    if (!validateEditor()) return;
    if (editorLocation) {
      if (editorMode === 'edit') saveLocationOverride(editorId, buildLocation());
      else { const record = buildLocation(); saveCustomLocation(record); customRows = [...customRows, { id: record.id, kind: 'environment', manufacturer: record.provinceFa ?? '', model: record.nameFa, quality: record.quality, source: record.licenseSpdx, detail: record.descriptionFa || `ارتفاع ${record.altitudeM} m`, imageUrl: record.imageUrl }]; }
    } else if (editorAirframe) {
      if (editorMode === 'add') { const record = buildAircraft(); saveCustomAircraft(record); customRows = [...customRows, { id: record.id, kind: 'airframe', manufacturer: record.manufacturer, model: record.model, quality: record.quality, source: record.licenseSpdx, detail: record.classLabel, imageUrl: record.imageUrl }]; }
      saveAircraftOverride(editorId, { manufacturer: editorManufacturer.trim(), model: editorModel.trim(), imageUrl: editorImage || undefined, ...Object.fromEntries(airframeFields.filter((field) => String(editorAirframeValues[field.key] ?? '').trim() !== '').map((field) => [field.key, Number(editorAirframeValues[field.key])] )) } as Partial<AircraftProfile>);
    } else if (editorMode === 'edit') saveComponentOverride(editorId, { manufacturer: editorManufacturer.trim(), model: editorModel.trim(), imageUrl: editorImage || undefined, ...Object.fromEntries(editorFields.map((field) => [field.key, Number(editorValues[field.key])] )) });
    else { const record = buildRecord(); saveCustomComponent(record); customRows = [...customRows, { id: record.id, kind: record.kind, manufacturer: record.manufacturer, model: record.model, quality: record.quality, source: record.licenseSpdx, detail: kindLabel[record.kind], imageUrl: record.imageUrl }]; }
    editorOpen = false;
    catalogRevision += 1;
  }
  function requestDelete(row: Row) { deleteTarget = row; }
  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'environment') hideLocation(deleteTarget.id); else hideComponent(deleteTarget.id);
    hiddenIds = [...hiddenIds, deleteTarget.id];
    customRows = customRows.filter((row) => row.id !== deleteTarget?.id);
    catalogRevision += 1;
    deleteTarget = null;
  }
  function previousPage() { page = Math.max(1, page - 1); }
  function nextPage() { page = Math.min(pageCount, page + 1); }
</script>

<section class="catalog" aria-labelledby="catalog-title">
  <header class="catalog-head"><div><h1 id="catalog-title">{ui.title}</h1><p>{ui.count} {rows.length}</p></div><div class="catalog-actions"><strong class="data">{filtered.length} {ui.result}</strong><button class="add-button" type="button" aria-label={ui.add} on:click={openAdd}><Icon name="plus" size={18} /><span>{ui.add}</span></button></div></header>
  <div class="catalog-toolbar"><div class="search-line"><label class="search-field"><Icon name="search" size={19} /><span class="sr-only">{ui.search}</span><input value={query} on:input={(event) => setQuery((event.currentTarget as HTMLInputElement).value)} placeholder={ui.search} /></label><button class="filter-trigger" type="button" aria-label={ui.filters} aria-expanded={filterOpen} on:click={() => (filterOpen = !filterOpen)}><Icon name={kindIcon[filter]} size={19} /></button></div><div class:open={filterOpen} class="filter-group">{#each (['all', 'battery', 'motor', 'propeller', 'esc', 'airframe', 'environment'] as FilterKind[]) as option}<button type="button" class:active={filter === option} on:click={() => setFilter(option)}><Icon name={kindIcon[option]} size={17} />{kindLabel[option]}</button>{/each}</div></div>
  <div class="catalog-list" aria-live="polite">{#each pageRows as row}<article class="catalog-row"><img class="row-image" src={imageFor(row)} alt="" /><div class="row-main"><strong>{rowTitle(row)}</strong><small>{kindLabel[row.kind]} · {row.detail}</small></div><code>{row.source}</code><div class="row-actions"><button class="edit-button" type="button" aria-label={`${ui.editComponent} ${displayModel(row)}`} on:click={() => openEditor(row)}><Icon name="edit" size={17} /></button><button class="delete-button" type="button" aria-label={`${ui.delete} ${displayModel(row)}`} on:click={() => requestDelete(row)}><Icon name="trash" size={17} /></button></div></article>{:else}<div class="empty-state">{ui.empty}</div>{/each}</div>
  <nav class="pagination" aria-label={ui.title}><button type="button" on:click={previousPage} disabled={page === 1} aria-label={ui.previous}>‹</button><span class="data">{page} / {pageCount}</span><button type="button" on:click={nextPage} disabled={page === pageCount} aria-label={ui.next}>›</button></nav>
</section>

{#if editorOpen}
  <div class="editor-backdrop" role="presentation" on:click={() => (editorOpen = false)}>
    <div class="editor-sheet" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="editor-title" on:click|stopPropagation on:keydown|stopPropagation>
      <header><div>{#if editorMode === 'edit'}<span class="eyebrow">{editorLocation ? ui.editEnvironment : editorAirframe ? ui.editAirframe : ui.editComponent}</span>{/if}<div class="editor-title-line"><h2 id="editor-title">{editorMode === 'edit' ? editorModel : editorEntity === 'airframe' ? ui.addAirframe : editorEntity === 'environment' ? ui.addEnvironment : ui.addComponent}</h2>{#if editorMode === 'edit'}<button class="name-edit" type="button" aria-label={ui.editName} on:click={() => (nameEditing = !nameEditing)}><Icon name="edit" size={15} /></button>{/if}</div>{#if nameEditing}<input class="name-editor" class:invalid={editorInvalidFields.includes('model')} bind:value={editorModel} placeholder={ui.model} />{/if}</div><button class="editor-close" type="button" aria-label={ui.close} on:click={() => (editorOpen = false)}>×</button></header>
      {#if editorMode === 'add' || editorLocation || editorAirframe}
        <div class="editor-grid"><label>{editorLocation ? ui.description : ui.manufacturer}<input class:invalid={editorInvalidFields.includes('manufacturer')} value={editorLocation ? editorDescription : editorManufacturer} on:input={(event) => setTextField(editorLocation ? 'description' : 'manufacturer', (event.currentTarget as HTMLInputElement).value)} placeholder={editorLocation ? ui.description : (editorInvalidFields.includes('manufacturer') ? ui.required : ui.manufacturer)} /></label><label>{editorLocation ? ui.place : ui.model}<input class:invalid={editorInvalidFields.includes('model')} value={editorModel} on:input={(event) => setTextField('model', (event.currentTarget as HTMLInputElement).value)} placeholder={editorInvalidFields.includes('model') ? ui.required : (editorLocation ? ui.place : ui.model)} /></label>{#if editorMode === 'add'}<label>{ui.category}<select value={editorEntity === 'component' ? editorKind : editorEntity} on:change={(event) => setEditorCategory((event.currentTarget as HTMLSelectElement).value)}><option value="battery">{kindLabel.battery}</option><option value="motor">{kindLabel.motor}</option><option value="propeller">{kindLabel.propeller}</option><option value="esc">ESC</option><option value="airframe">{kindLabel.airframe}</option><option value="environment">{kindLabel.environment}</option></select></label>{/if}</div>
      {/if}
      <label class="image-preview" class:has-image={Boolean(editorImage)}>{#if editorImage}<img src={editorImage} alt={ui.imageCurrent} />{:else}<span><Icon name={editorAirframe ? 'drone' : editorLocation ? 'map' : 'components'} size={25} /></span>{/if}<div><strong>{editorImage ? ui.imageCurrent : ui.addImage}</strong><small>{editorImage ? ui.imageReplace : ui.imageOptional}</small><button class="gallery-trigger" type="button" on:click|stopPropagation={() => (galleryOpen = true)}>{ui.gallery}</button></div><input class="image-input" type="file" accept="image/png,image/jpeg,image/webp" on:change={handleImage} /></label>
      <div class="editor-fields">{#each editorFields as field}<label class:invalid={editorInvalidFields.includes(field.key)}>{localizedField(field)}{#if field.optional}<small class="optional">{ui.imageOptional.split('·')[0]}</small>{/if}<div><input class:invalid={editorInvalidFields.includes(field.key)} type="number" value={(editorAirframe ? editorAirframeValues[field.key] : editorLocation ? editorLocationValues[field.key] : editorValues[field.key]) ?? ''} on:input={(event) => setEditorValue(field.key, (event.currentTarget as HTMLInputElement).value)} placeholder={editorInvalidFields.includes(field.key) ? ui.required : ''} /><b>{field.unit}</b></div></label>{/each}</div>
      <button class="editor-save" type="button" on:click={saveEditor}>{ui.save}</button>
      {#if galleryOpen}<div class="gallery-popover" role="dialog" tabindex="-1" aria-label={ui.gallery} on:click|stopPropagation on:keydown|stopPropagation><header><strong>{ui.gallery}</strong><button type="button" aria-label={ui.close} on:click={() => (galleryOpen = false)}>×</button></header><div class="gallery-grid">{#each galleryOptions as image}<button type="button" on:click={() => chooseGalleryImage(image.src)}><img src={image.src} alt={image.label} /><small>{image.label}</small></button>{/each}</div></div>{/if}
    </div>
  </div>
{/if}

{#if deleteTarget}<div class="delete-backdrop" role="presentation" on:click={() => (deleteTarget = null)}><div class="delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title" tabindex="-1" on:click|stopPropagation on:keydown|stopPropagation><span class="delete-icon"><Icon name="trash" size={22} /></span><h2 id="delete-title">{ui.deleteQuestion} {deleteTarget.kind === 'airframe' ? kindLabel.airframe.toLocaleLowerCase() : deleteTarget.kind === 'environment' ? kindLabel.environment.toLocaleLowerCase() : kindLabel.battery.toLocaleLowerCase()}؟</h2><p>{rowTitle(deleteTarget)}</p><div class="delete-actions"><button type="button" class="delete-cancel" on:click={() => (deleteTarget = null)}>{ui.cancel}</button><button type="button" class="delete-confirm" on:click={confirmDelete}><Icon name="trash" size={16} /> {ui.delete}</button></div></div></div>{/if}

<style>
  .catalog { display: grid; gap: 18px; max-width: 1080px; margin-inline: auto; }.catalog-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; }.catalog h1 { margin: 0; font-size: clamp(28px, 3vw, 40px); letter-spacing: -0.05em; }.catalog-head p { margin: 5px 0 0; color: var(--muted); font-size: 13px; }.catalog-actions { display: flex; align-items: center; gap: 12px; }.catalog-actions > strong { color: var(--blue); font-size: 14px; }.add-button { display: inline-flex; min-height: 40px; align-items: center; gap: 6px; border: 1px solid var(--blue); border-radius: 10px; background: var(--blue); color: white; padding-inline: 12px; font-size: 12px; }.catalog-toolbar { position: relative; display: grid; gap: 10px; }.search-line { display: flex; align-items: stretch; gap: 8px; }.search-field { display: flex; flex: 1; align-items: center; gap: 8px; min-height: 52px; border: 1px solid var(--input-line); border-radius: 13px; background: var(--surface); color: var(--muted); padding-inline: 14px; box-shadow: var(--shadow-soft); }.search-field:focus-within { border-color: var(--blue); }.search-field input { width: 100%; min-width: 0; min-height: 46px; border: 0; outline: 0; background: transparent; color: var(--ink); font-family: var(--font-ui); }.filter-trigger { display: none; width: 52px; min-height: 52px; place-items: center; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); color: var(--blue); }.filter-group { display: flex; flex-wrap: wrap; gap: 7px; }.filter-group button { display: inline-flex; min-height: 38px; align-items: center; gap: 6px; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); color: var(--ink-soft); padding-inline: 12px; font-size: 12px; }.filter-group button:hover, .filter-group button.active { border-color: var(--blue); background: var(--blue-soft); color: var(--blue); }.catalog-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; overflow: visible; background: transparent; }.catalog-row { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto 72px; align-items: center; gap: 10px; min-height: 76px; border: 1px solid var(--line); border-radius: 15px; background: var(--surface); padding: 10px 12px; box-shadow: var(--shadow-soft); }.row-image { width: 42px; height: 42px; border-radius: 11px; object-fit: cover; background: var(--blue-soft); }.row-main { min-width: 0; }.row-main strong, .row-main small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.row-main strong { color: var(--ink); font-size: 13px; }.row-main small { margin-top: 4px; color: var(--muted); font-size: 11px; }.catalog-row code { min-width: 50px; color: var(--muted); font-family: var(--font-data); font-size: 10px; text-align: end; }.row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 5px; }.edit-button, .delete-button { display: grid; width: 32px; height: 32px; place-items: center; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); }.edit-button { color: var(--blue); }.edit-button:hover { border-color: var(--blue); background: var(--blue-soft); }.delete-button { color: var(--danger); }.delete-button:hover { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, var(--surface)); }.empty-state { grid-column: 1 / -1; display: grid; min-height: 180px; place-items: center; color: var(--muted); font-size: 13px; }.pagination { display: flex; align-items: center; justify-content: center; gap: 14px; }.pagination button { display: grid; width: 40px; height: 40px; place-items: center; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font-size: 25px; line-height: 1; }.pagination button:not(:disabled):hover { border-color: var(--blue); color: var(--blue); }.pagination button:disabled { opacity: .35; cursor: not-allowed; }.pagination span { min-width: 60px; color: var(--ink); font-size: 12px; text-align: center; }.editor-backdrop, .delete-backdrop { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: rgba(7, 23, 68, .42); padding: 24px; }.editor-sheet { width: min(560px, 100%); max-height: min(86dvh, 760px); overflow: auto; border: 1px solid var(--line); border-radius: 20px; background: var(--surface); padding: 20px; box-shadow: 0 24px 70px rgba(7, 23, 68, .28); }.editor-sheet > header { display: flex; align-items: start; justify-content: space-between; gap: 12px; }.editor-sheet h2 { margin: 3px 0 0; font-size: 22px; }.editor-close { width: 38px; height: 38px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font-size: 24px; }.editor-grid, .editor-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }.editor-sheet label { display: grid; gap: 6px; color: var(--ink-soft); font-size: 12px; }.editor-sheet label.invalid { color: var(--danger); }.editor-sheet label input, .editor-sheet select { min-height: 44px; border: 1px solid var(--input-line); border-radius: 9px; background: var(--paper); color: var(--ink); padding-inline: 10px; }.editor-sheet label input.invalid { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 6%, var(--paper)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 12%, transparent); }.editor-fields > label > div { position: relative; display: flex; align-items: center; }.editor-fields input { width: 100%; padding-inline-end: 45px !important; font-family: var(--font-data); }.editor-fields b { position: absolute; inset-inline-end: 10px; color: var(--muted); font: 11px var(--font-data); }.image-upload { position: relative; display: grid !important; grid-template-columns: 42px minmax(0, 1fr) auto; align-items: center; gap: 10px !important; min-height: 72px; margin-top: 14px; border: 1px dashed color-mix(in srgb, var(--blue) 50%, var(--line)); border-radius: 14px; background: color-mix(in srgb, var(--blue-soft) 45%, var(--surface)); padding: 10px 12px; cursor: pointer; transition: border-color var(--fast) var(--ease), transform var(--fast) var(--ease); }.image-upload:hover, .image-upload:focus-within { border-color: var(--blue); transform: translateY(-1px); }.image-input { position: absolute; width: 1px !important; height: 1px; overflow: hidden; opacity: 0; }.upload-icon { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 11px; background: var(--surface); color: var(--blue); box-shadow: var(--shadow-soft); }.upload-copy { display: grid; gap: 3px; }.upload-copy strong { color: var(--ink); font-size: 12px; }.upload-copy small { color: var(--muted); font-size: 10px; }.editor-save { width: 100%; min-height: 48px; margin-top: 18px; border: 0; border-radius: 10px; background: var(--blue); color: white; font-weight: 700; }.delete-dialog { width: min(360px, 100%); border: 1px solid var(--line); border-radius: 18px; background: var(--surface); padding: 22px; text-align: center; box-shadow: 0 24px 70px rgba(7, 23, 68, .28); animation: sheet-in 180ms var(--ease) both; }.delete-icon { display: grid; width: 44px; height: 44px; place-items: center; margin: 0 auto 11px; border-radius: 12px; background: color-mix(in srgb, var(--danger) 12%, var(--surface)); color: var(--danger); }.delete-dialog h2 { margin: 0; font-size: 20px; }.delete-dialog p { margin: 7px 0 0; color: var(--muted); font-size: 12px; }.delete-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 20px; }.delete-actions button { min-height: 44px; border-radius: 10px; font-weight: 700; }.delete-cancel { border: 1px solid var(--line); background: var(--surface); color: var(--ink); }.delete-confirm { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 0; background: var(--danger); color: white; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
  @media (max-width: 620px) { .catalog { padding-bottom: 98px; }.catalog-head { align-items: center; }.catalog-actions { gap: 7px; }.catalog-actions > strong { font-size: 12px; }.add-button { width: 42px; justify-content: center; padding: 0; }.add-button span { display: none; }.filter-trigger { display: grid; }.filter-group { position: absolute; inset-inline-end: 0; top: 60px; z-index: 4; display: none; width: min(220px, calc(100vw - 36px)); padding: 8px; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); box-shadow: var(--shadow); }.filter-group.open { display: grid; animation: filter-pop 160ms var(--ease) both; }.filter-group button { justify-content: flex-start; }.catalog-list { grid-template-columns: minmax(0, 1fr); gap: 0; overflow: hidden; border: 1px solid var(--line); border-radius: 15px; background: var(--surface); box-shadow: var(--shadow-soft); }.catalog-row { grid-template-columns: 38px minmax(0, 1fr) 69px; min-height: 64px; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; padding-inline: 9px; box-shadow: none; }.catalog-row:last-child { border-bottom: 0; }.catalog-row code { display: none; }.row-main strong { font-size: 12px; }.row-main small { font-size: 10px; }.editor-backdrop { align-items: end; padding: 0; }.editor-sheet { max-height: calc(100dvh - 74px); border-radius: 20px 20px 0 0; padding: 17px 14px 24px; }.editor-grid, .editor-fields { gap: 9px; }.delete-backdrop { align-items: end; padding: 0 0 86px; }.delete-dialog { width: 100%; border-radius: 20px 20px 0 0; padding: 20px 16px 24px; } }
  @keyframes filter-pop { from { opacity: 0; transform: translateY(-5px) scale(.98); } to { opacity: 1; transform: none; } }
  .image-preview { position: relative; display: flex; align-items: center; gap: 11px; min-height: 76px; margin-top: 14px; border: 1px dashed color-mix(in srgb, var(--blue) 48%, var(--line)); border-radius: 14px; background: color-mix(in srgb, var(--blue-soft) 34%, var(--paper)); padding: 10px 12px; cursor: pointer; transition: border-color var(--fast) var(--ease), background-color var(--fast) var(--ease), transform var(--fast) var(--ease); }.image-preview:hover, .image-preview:focus-within { border-color: var(--blue); background: color-mix(in srgb, var(--blue-soft) 58%, var(--paper)); transform: translateY(-1px); }.image-preview > img, .image-preview > span { display: grid; width: 54px; height: 54px; place-items: center; flex: 0 0 54px; border-radius: 12px; background: var(--blue-soft); color: var(--blue); object-fit: cover; }.image-preview > div { display: grid; gap: 3px; min-width: 0; }.image-preview strong { color: var(--ink); font-size: 12px; }.image-preview small { color: var(--muted); font-size: 10px; }.image-preview .image-input { position: absolute; inset: 0; width: 100% !important; height: 100% !important; opacity: 0; cursor: pointer; }.optional { display: inline; margin-inline-start: 5px; color: var(--muted); font-size: 10px; font-weight: 400; }
  .gallery-trigger { position: relative; z-index: 2; width: fit-content; min-height: 28px; margin-top: 4px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--blue); padding-inline: 9px; font-size: 10px; cursor: pointer; }.gallery-trigger:hover { border-color: var(--blue); background: var(--blue-soft); }.gallery-popover { position: absolute; inset: 92px 18px auto; z-index: 5; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); padding: 12px; box-shadow: var(--shadow); animation: sheet-in 180ms var(--ease) both; }.gallery-popover header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }.gallery-popover header button { width: 28px; height: 28px; border: 1px solid var(--line); border-radius: 7px; background: var(--surface); color: var(--ink); }.gallery-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; max-height: 230px; overflow-y: auto; }.gallery-grid button { display: grid; gap: 4px; border: 1px solid var(--line); border-radius: 9px; background: var(--paper); padding: 5px; color: var(--ink); text-align: start; }.gallery-grid button:hover { border-color: var(--blue); }.gallery-grid img { width: 100%; aspect-ratio: 1.4; border-radius: 6px; object-fit: cover; }.gallery-grid small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; }
  .editor-fields > label { min-width: 0; }.editor-fields input { min-width: 0; }
  .editor-title-line { display: flex; align-items: center; gap: 7px; }.editor-title-line h2 { min-width: 0; }.name-edit { display: grid; width: 30px; height: 30px; place-items: center; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--blue); }.name-edit:hover { border-color: var(--blue); background: var(--blue-soft); }.name-editor { width: min(100%, 320px); min-height: 38px; margin-top: 8px; border: 1px solid var(--input-line); border-radius: 8px; background: var(--paper); color: var(--ink); padding-inline: 9px; }.name-editor.invalid { border-color: var(--danger); }
  @media (max-width: 620px) { .gallery-popover { position: fixed; inset: auto 12px 86px; max-height: 52dvh; }.gallery-grid { max-height: 34dvh; }.editor-grid, .editor-fields { grid-template-columns: minmax(0, 1fr); } }
  .editor-backdrop, .delete-backdrop { overflow: hidden; overscroll-behavior: none; }
  .editor-backdrop, .delete-backdrop { z-index: 1000; }
  .editor-sheet { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y; min-height: 0; align-self: end; transform-origin: bottom center; scrollbar-gutter: stable; }
  .editor-sheet > header { position: sticky; top: 0; z-index: 2; margin: -2px -2px 0; padding: 2px 2px 10px; background: var(--surface); }
  @media (max-width: 620px) { .editor-sheet { width: 100%; margin: 0; border-radius: 20px 20px 0 0; } }
</style>
