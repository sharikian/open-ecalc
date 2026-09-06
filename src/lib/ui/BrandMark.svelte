<script lang="ts">
  export let size = 40;
  export let decorative = false;
</script>

<img
  src="/icons/open-ecalc-logo.png"
  width={size}
  height={size}
  alt={decorative ? '' : 'Open eCalc'}
  aria-hidden={decorative ? 'true' : undefined}
  style={`--brand-size: ${size}px`}
  class="brand-mark"
/>

<style>
  .brand-mark {
    display: block;
    width: var(--brand-size, 40px);
    height: var(--brand-size, 40px);
    object-fit: contain;
  }
</style>
