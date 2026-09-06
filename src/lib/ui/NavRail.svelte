<script lang="ts">
  import BrandMark from './BrandMark.svelte';
  export let active: 'calculator' | 'components' | 'settings' = 'calculator';
  export let labels: { calculator: string; components: string; settings: string };
</script>

<aside class="rail" aria-label="Primary navigation">
  <div class="rail__brand"><BrandMark size={34} /></div>
  <nav>
    <a class:active={active === 'calculator'} href="/" aria-current={active === 'calculator' ? 'page' : undefined}>
      <span aria-hidden="true">⌁</span><span>{labels.calculator}</span>
    </a>
    <a class:active={active === 'components'} href="/?view=components" aria-current={active === 'components' ? 'page' : undefined}>
      <span aria-hidden="true">◫</span><span>{labels.components}</span>
    </a>
    <a class:active={active === 'settings'} href="/?view=settings" aria-current={active === 'settings' ? 'page' : undefined}>
      <span aria-hidden="true">⚙</span><span>{labels.settings}</span>
    </a>
  </nav>
</aside>

<style>
  .rail { position: fixed; inset-block: 0; inset-inline-start: 0; z-index: var(--z-sticky); display: flex; width: 76px; flex-direction: column; align-items: center; gap: var(--space-xl); border-inline-end: 1px solid var(--color-rule); background: var(--color-surface); padding: var(--space-lg) var(--space-xs); }
  .rail__brand { display: grid; min-height: 44px; place-items: center; }
  nav { display: grid; gap: var(--space-xs); width: 100%; }
  nav a { display: grid; min-height: 64px; place-items: center; gap: 2px; border-radius: var(--radius-sm); color: var(--color-muted); font-size: var(--text-xs); text-decoration: none; transition: transform var(--dur-short) var(--ease-out), color var(--dur-short) var(--ease-out), background-color var(--dur-short) var(--ease-out); }
  nav a span:first-child { font-family: var(--font-mono); font-size: 1.25rem; line-height: 1; }
  nav a.active { background: var(--color-paper-2); color: var(--color-accent); }
  @media (hover: hover) and (pointer: fine) { nav a:hover { transform: translateY(-1px); color: var(--color-accent); } }
  @media (max-width: 40rem) { .rail { inset-block: auto 0; width: 100%; height: 68px; flex-direction: row; justify-content: space-around; border-block-start: 1px solid var(--color-rule); border-inline-end: 0; padding: var(--space-2xs) var(--space-md); } .rail__brand { display: none; } nav { display: flex; justify-content: space-around; } nav a { min-width: 64px; min-height: 56px; } }
</style>

