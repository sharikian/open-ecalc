<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import '../app.css';

  onMount(() => {
    if (browser && 'serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js');
  });
</script>

<slot />

