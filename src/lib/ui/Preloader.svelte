<script lang="ts">
  import BrandMark from './BrandMark.svelte';
</script>

<div class="preloader" aria-live="polite" aria-label="در حال آماده‌سازی">
  <div class="preloader__mark"><BrandMark size={52} decorative /></div>
  <div class="rotors" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <span>در حال آماده‌سازی مدل‌ها…</span>
</div>

<style>
  .preloader { display: grid; min-height: 100dvh; place-content: center; justify-items: center; gap: var(--space-lg); background: var(--color-paper); color: var(--color-muted); }
  .preloader__mark { animation: mark-in var(--dur-long) var(--ease-out) both; }
  .rotors { display: flex; gap: var(--space-sm); }
  .rotors i { display: block; width: 18px; height: 18px; border: 2px solid var(--color-rule-2); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 900ms var(--ease-in-out) infinite; }
  .rotors i:nth-child(2) { animation-delay: 80ms; }.rotors i:nth-child(3) { animation-delay: 160ms; }.rotors i:nth-child(4) { animation-delay: 240ms; }
  @keyframes spin { to { transform: rotate(360deg); } } @keyframes mark-in { from { opacity: 0; transform: translateY(12px) scale(0.92); } to { opacity: 1; transform: none; } }
</style>
