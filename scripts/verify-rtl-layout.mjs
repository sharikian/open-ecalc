import { execFileSync } from 'node:child_process';

// Uses an isolated browser profile; never changes production application data.
const session = 'rtl-layout-regression';
const url = process.env.UI_TEST_URL ?? 'http://127.0.0.1:5188';
const widths = (process.env.UI_TEST_WIDTHS ?? '320,375,414,768,1440').split(',').map(Number);
const failures = [];
let checked = 0;
function browser(...args) {
  return execFileSync('rtk', ['proxy', 'agent-browser', '--session', session, ...args], { encoding: 'utf8' }).trim();
}
function evaluate(code) {
  const value = JSON.parse(browser('eval', code));
  return typeof value === 'string' ? JSON.parse(value) : value;
}
try {
  browser('open', url);
  for (const width of widths) {
    browser('set', 'viewport', String(width), '900');
    for (const language of ['fa', 'en']) for (const theme of ['light', 'dark']) {
      browser('eval', `localStorage.setItem('open-ecalc.language','${language}');localStorage.setItem('open-ecalc.locale','${language}');localStorage.setItem('open-ecalc.theme','${theme}')`);
      browser('open', url);
      browser('wait', '.modes');
      for (const mode of ['simple', 'advanced']) {
        const result = evaluate(`(async()=>{
          document.querySelectorAll('.modes button')[${mode === 'simple' ? 0 : 1}].click();
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          const form=document.querySelector('${mode === 'simple' ? '.simple-layout' : '.input-area'}');
          const workspace=document.querySelector('.workspace').getBoundingClientRect();
          const bounds=form.getBoundingClientRect();
          const nav=document.querySelector('.side-nav').getBoundingClientRect();
          const fields=[...form.querySelectorAll('input')];
          return JSON.stringify({
            dir:document.documentElement.dir,
            formDir:getComputedStyle(form).direction,
            headerDir:getComputedStyle(document.querySelector('.topbar')).direction,
            centered:Math.abs((bounds.left+bounds.right-workspace.left-workspace.right)/2)<1,
            overflow:document.documentElement.scrollWidth>innerWidth+1,
            navMirrored:innerWidth<=900||(${language === 'fa'}?nav.left>=workspace.right:nav.right<=workspace.left),
            controlsFit:fields.every(field=>{const r=field.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1}),
            numericLtr:[...form.querySelectorAll('.field__control input')].every(field=>getComputedStyle(field).direction==='ltr'),
            empty:fields.filter(field=>field.type==='number').every(field=>field.value===''),
            noResults:!document.querySelector('.legacy-results,.result-backdrop')
          });
        })()`);
        checked++;
        const direction = language === 'fa' ? 'rtl' : 'ltr';
        if (result.dir !== direction || result.formDir !== direction || result.headerDir !== direction || !result.centered || result.overflow || !result.navMirrored || !result.controlsFit || !result.numericLtr || !result.empty || !result.noResults) failures.push({ width, language, theme, mode, ...result });
        if ([375, 1440].includes(width) && theme === 'light') browser('screenshot', `/tmp/rtl-layout-${language}-${mode}-${width}.png`, '--full');
      }
    }
  }
} finally {
  browser('close');
}
console.log(JSON.stringify({ checked, failures }, null, 2));
if (failures.length) process.exitCode = 1;
