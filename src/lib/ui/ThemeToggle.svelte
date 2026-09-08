<script lang="ts">
  export let theme: 'light' | 'dark' = 'light';
  export let onChange: (theme: 'light' | 'dark') => void;
</script>

<button class="theme-toggle" type="button" aria-label={theme === 'light' ? 'حالت تاریک' : 'حالت روشن'} on:click={() => onChange(theme === 'light' ? 'dark' : 'light')}>
  <span class:dark={theme === 'dark'} aria-hidden="true"><i></i></span>
</button>

<style>
  .theme-toggle { display: grid; width: 46px; height: 46px; place-items: center; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); color: var(--ink); box-shadow: var(--shadow-soft); transition: transform var(--fast) var(--ease), background-color var(--normal) var(--ease); }
  .theme-toggle:active { transform: scale(0.94); }
  span { position: relative; display: block; width: 20px; height: 20px; border: 2px solid currentColor; border-radius: 50%; transition: transform var(--normal) var(--ease); }
  span::before, span::after, i::before, i::after { content: ''; position: absolute; inset: 50% auto auto 50%; width: 3px; height: 3px; border-radius: 50%; background: currentColor; transform-origin: 0 0; }
  span::before { transform: translate(-1px, -13px); } span::after { transform: translate(-1px, 10px); } i::before { transform: translate(-13px, -1px); } i::after { transform: translate(10px, -1px); }
  span.dark { transform: rotate(-35deg); background: currentColor; box-shadow: inset -6px 0 var(--surface); }
  span.dark::before, span.dark::after, span.dark i::before, span.dark i::after { opacity: 0; }
</style>
