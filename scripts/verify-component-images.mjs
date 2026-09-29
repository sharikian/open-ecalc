import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const session = 'component-image-regression';
const url = process.env.UI_TEST_URL ?? 'http://127.0.0.1:5188';
const id = 'fpvdb-propeller-gemfan-hurricane-51433-durable-tri-blade-5-prop-choose-your';
const source = JSON.parse(fs.readFileSync(new URL('../static/data/components.v1.json', import.meta.url))).records.find(record => record.id === id);
let checked = 0;
const failures = [];
function browser(...args) { return execFileSync('rtk', ['proxy', 'agent-browser', '--session', session, ...args], { encoding: 'utf8' }).trim(); }
function evaluate(code) { const result = JSON.parse(browser('eval', code)); return typeof result === 'string' ? JSON.parse(result) : result; }
try {
  browser('open', url);
  for (const width of [375, 1440]) for (const language of ['fa', 'en']) for (const theme of ['light', 'dark']) {
    browser('set', 'viewport', String(width), '900');
    browser('eval', `localStorage.setItem('open-ecalc.language','${language}');localStorage.setItem('open-ecalc.locale','${language}');localStorage.setItem('open-ecalc.theme','${theme}');localStorage.removeItem('open-ecalc.component-overrides')`);
    browser('open', url);
    browser('wait', '.modes');
    browser('eval', `document.querySelector('${width <= 560 ? '.bottom-nav' : '.side-nav'} button:nth-child(3)').click()`);
    browser('wait', '.catalog-row img');
    browser('wait', '--fn', '[...document.querySelectorAll(".catalog-row img")].every(image=>image.complete&&image.naturalWidth>0)');
    const catalog = evaluate(`JSON.stringify({rows:document.querySelectorAll('.catalog-row').length,images:document.querySelectorAll('.catalog-row img').length,overflow:document.documentElement.scrollWidth>innerWidth+1})`);
    const expectedRows = width <= 560 ? 5 : 10;
    if (catalog.rows !== expectedRows || catalog.images !== expectedRows || catalog.overflow) failures.push({ width, language, theme, catalog });
    if (theme === 'light') browser('screenshot', `/tmp/catalog-images-${language}-${width}.png`);
    browser('fill', '.search-field input', '51433');
    browser('wait', '.edit-button');
    browser('click', '.edit-button');
    browser('wait', '.editor-fields input');
    const decimals = evaluate(`JSON.stringify([...document.querySelectorAll('.editor-fields input')].map(input=>input.value))`);
    if (decimals.some(value => (value.split('.')[1]?.length ?? 0) > 3)) failures.push({ width, language, theme, decimals });
    browser('click', '.editor-save');
    const saved = evaluate(`JSON.stringify(JSON.parse(localStorage.getItem('open-ecalc.component-overrides')||'{}')[${JSON.stringify(id)}]||null)`);
    if (!saved || saved.diameterM !== source.diameterM || saved.pitchM !== source.pitchM) failures.push({ width, language, theme, precisionPreserved: false });
    checked++;
  }
} finally { browser('close'); }
console.log(JSON.stringify({ checked, failures }, null, 2));
if (failures.length) process.exitCode = 1;
