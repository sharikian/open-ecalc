<script lang="ts">
  import Icon from './Icon.svelte';
  export let theme: 'light' | 'dark' = 'light';
  export let onChange: (theme: 'light' | 'dark') => void;
</script>

<button class="theme-toggle" type="button" aria-label={theme === 'light' ? 'حالت تاریک' : 'حالت روشن'} on:click={() => onChange(theme === 'light' ? 'dark' : 'light')}>
  <span class:dark={theme === 'dark'} aria-hidden="true"><Icon name={theme === 'light' ? 'sun' : 'moon'} size={21} /></span>
</button>

<style>
  .theme-toggle { display: grid; width: 46px; height: 46px; place-items: center; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); color: var(--ink); box-shadow: var(--shadow-soft); transition: transform var(--fast) var(--ease), background-color var(--normal) var(--ease); }
  .theme-toggle:active { transform: scale(0.94); }
  span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; color: var(--blue); transition: transform var(--normal) var(--ease), background-color var(--normal) var(--ease); }
  span:not(.dark) { background: #fff3cf; color: #d88916; }
  span.dark { transform: rotate(-18deg); background: #1d2b50; color: #c7d7ff; }
</style>
