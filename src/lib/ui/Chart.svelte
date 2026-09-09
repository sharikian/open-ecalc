<script lang="ts">
  import * as echarts from 'echarts';
  import { onMount } from 'svelte';
  export let option: echarts.EChartsOption;
  export let ariaLabel = 'Engineering chart';
  let host: HTMLDivElement;
  let chart: echarts.ECharts;
  $: if (chart && option) chart.setOption(option, true);
  onMount(() => {
    chart = echarts.init(host, undefined, { renderer: 'svg' });
    chart.setOption(option);
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); chart.dispose(); };
  });
</script>

<div class="chart" bind:this={host} role="img" aria-label={ariaLabel}></div>

<style>
  .chart { width: 100%; min-height: 230px; }
</style>
