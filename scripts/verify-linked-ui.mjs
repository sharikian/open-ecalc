import { execFileSync } from 'node:child_process';

// Requires agent-browser and a built preview. Does not change production data.
const session = 'linked-matrix';
const url = process.env.UI_TEST_URL ?? 'http://127.0.0.1:4180';
function browser(...args) {
  return execFileSync('rtk', ['proxy', 'agent-browser', '--session', session, ...args], { encoding: 'utf8' }).trim();
}
function evaluate(code) {
  const output = browser('eval', code);
  const value = JSON.parse(output);
  return typeof value === 'string' ? JSON.parse(value) : value;
}
const pause = 'await new Promise(r=>setTimeout(r,80));';
const fields = [
  [3.4, 1.2, 4, .82],
  [500, 25, 10],
  [12000, 6, 1, 22.2, .018, 20, 1.65, 80],
  [380, 65, 1450, 60, .4572, .1651, 1.1, .065, .205, 80, .0025, 96, .072, 1, 2, .105, .052]
];
let checked = 0;
const failures = [];
browser('open', url);
for (const width of (process.env.UI_TEST_WIDTHS ?? '320,375,414,768,1440').split(',').map(Number)) {
  browser('set', 'viewport', String(width), '900');
  for (const language of ['fa', 'en']) for (const theme of ['light', 'dark']) {
    browser('eval', `localStorage.setItem('open-ecalc.locale','${language}');localStorage.setItem('open-ecalc.language','${language}');localStorage.setItem('open-ecalc.theme','${theme}')`);
    browser('open', url);
    browser('wait', '.modes');
    browser('eval', `(async()=>{const tabs=[...document.querySelectorAll('[role=tab]')];tabs.find(e=>/Advanced|پیشرفته/.test(e.textContent))?.click();${pause}})()`);
    for (let step = 0; step < 4; step++) {
      const result = evaluate(`(async()=>{${pause}
        const card=document.querySelector('.setup-card.active');
        const inputs=[...card.querySelectorAll('input:not([readonly])')];
        const values=${JSON.stringify(fields[step])};
        for(let i=0;i<inputs.length;i++){inputs[i].value=values[i];inputs[i].dispatchEvent(new Event('input',{bubbles:true}));${pause}}
        document.querySelector('#pack-voltage')?.blur();${pause}
        const bounds=[...card.querySelectorAll('input,select')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());
        return JSON.stringify({step:${step},active:document.querySelectorAll('.setup-card.active').length,overflow:document.documentElement.scrollWidth>innerWidth+1,controls:bounds.every(r=>r.left>=-1&&r.right<=innerWidth+1),lang:document.documentElement.lang,dir:document.documentElement.dir});
      })()`);
      checked++;
      if (result.active !== 1 || result.overflow || !result.controls || result.lang !== language || result.dir !== (language === 'fa' ? 'rtl' : 'ltr')) failures.push({ width, language, theme, ...result });
      if (width === 375 && theme === 'light') browser('screenshot', `/tmp/linked-${language}-step-${step}.png`, '--full');
      if (step === 3) {
        browser('eval', `(async()=>{document.querySelector('.current-head button').click();${pause}const e=document.querySelector('.current-row input');e.value=10;e.dispatchEvent(new Event('input',{bubbles:true}));${pause}})()`);
      }
      browser('scrollintoview', '.next');
      browser('click', '.next');
    }
    const result = evaluate(`(async()=>{${pause}return JSON.stringify({comparison:!!document.querySelector('.scenario-section'),overflow:document.documentElement.scrollWidth>innerWidth+1});})()`);
    // Result selectors are checked below by semantic text too, so CSS renames
    // do not accidentally turn a calculation failure into a passing test.
    const text = browser('get', 'text', 'body');
    if (!/Current comparison|مقایسهٔ جریان/.test(text) || result.overflow) failures.push({ width, language, theme, result });
    if (width === 375 && theme === 'light') browser('screenshot', `/tmp/linked-${language}-results.png`, '--full');
  }
}
console.log(JSON.stringify({ checkedStages: checked, failures }, null, 2));
if (failures.length) process.exitCode = 1;
