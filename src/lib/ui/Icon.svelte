<script lang="ts">
  export let name: 'calculator' | 'components' | 'projects' | 'results' | 'settings' | 'folder' | 'drone' | 'cloud' | 'battery' | 'map' | 'motor' | 'propeller' | 'help' | 'sun' | 'moon' | 'download' | 'share' | 'clock' | 'pin' | 'rocket' | 'bolt' | 'ceiling' | 'sliders' | 'plane' | 'search' | 'check' | 'spark' | 'edit' | 'trash' | 'plus' | 'filter' = 'calculator';
  export let size = 24;
  export let stroke = 'currentColor';
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke={stroke} stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#if name === 'calculator'}<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6h8M8 10h2M14 10h2M8 14h2M14 14h2M8 18h2M14 18h2"/>
  {:else if name === 'components'}<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12.1V21"/>
  {:else if name === 'projects'}<path d="M3.5 7.5h6l1.8 2h9.2v9.5H3.5v-11.5Z"/><path d="M3.5 7.5V5h6l1.5 2.5"/>
  {:else if name === 'results'}<path d="M4 20V10h4v10H4ZM10 20V4h4v16h-4ZM16 20v-7h4v7h-4Z"/>
  {:else if name === 'settings'}<circle cx="12" cy="12" r="3.5"/><path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 0 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A2 2 0 0 0 1.7 12a2 2 0 0 0 1.4-3.4L3 8.5a2 2 0 0 1 2.8-2.8l.1.1A2 2 0 0 0 9.3 4.4v-.2a2 2 0 0 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1A2 2 0 0 0 20.9 12a2 2 0 0 0-1.5 3Z"/>
  {:else if name === 'folder'}<path d="M3.5 6.5h6l1.8 2h9.2v9.5h-17V6.5Z"/>
  {:else if name === 'drone'}<path d="M12 9.2v5.6M9.2 12h5.6M7.3 7.3 4.8 4.8M16.7 7.3l2.5-2.5M7.3 16.7l-2.5 2.5M16.7 16.7l2.5 2.5"/><circle cx="12" cy="12" r="2.6"/><circle cx="4" cy="4" r="2.1"/><circle cx="20" cy="4" r="2.1"/><circle cx="4" cy="20" r="2.1"/><circle cx="20" cy="20" r="2.1"/>
  {:else if name === 'cloud'}<path d="M7.5 18.5h9.2a4.3 4.3 0 0 0 .4-8.6A5.6 5.6 0 0 0 6.4 8.7a4.9 4.9 0 0 0 1.1 9.8Z"/>
  {:else if name === 'battery'}<rect x="3.5" y="6" width="16" height="12" rx="2"/><path d="M20 10h1.5v4H20M7 9.5v5M10 9.5v5"/>
  {:else if name === 'map'}<path d="m3.5 5.5 5-2 7 2 5-2v15l-5 2-7-2-5 2v-15ZM8.5 3.5v15M15.5 5.5v15"/>
  {:else if name === 'motor'}<circle cx="12" cy="12" r="7.5"/><path d="m12 4.5 1.9 5.6 5.6 1.9-5.6 1.9-1.9 5.6-1.9-5.6-5.6-1.9 5.6-1.9L12 4.5Z"/>
  {:else if name === 'propeller'}<circle cx="12" cy="12" r="2.1"/><path d="M10.8 9.9C7 8.4 4 5.8 5.4 4.5c1.5-1.5 4.3 1.2 5.1 5M14.1 10.8c.8-4 2.6-7.4 4.3-6.8 1.8.7.1 4.6-3.7 6.2M14.1 13.4c3.8-1.3 7.6-.9 7.7.9.1 2-4.3 2.1-7.5.1M10.8 14.1c-.7 4-3.1 6.5-4.6 5.5-1.6-1.1.5-4.7 4.1-5.9"/>
  {:else if name === 'help'}<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-.9.9-1.9 1.2-1.9 2.7M12 16.8h.01"/>
  {:else if name === 'sun'}<circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none"/><path d="M12 2.3v2.2M12 19.5v2.2M2.3 12h2.2M19.5 12h2.2M5.15 5.15l1.55 1.55M17.3 17.3l1.55 1.55M18.85 5.15 17.3 6.7M6.7 17.3l-1.55 1.55" stroke-width="2.1"/>
  {:else if name === 'moon'}<path d="M19.2 15.6A7.5 7.5 0 0 1 8.4 4.8 7.5 7.5 0 1 0 19.2 15.6Z"/>
  {:else if name === 'download'}<path d="M12 3v11M8 10l4 4 4-4M4 19.5h16"/>
  {:else if name === 'share'}<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.5-4.3M8.2 13.2l7.5 4.3"/>
  {:else if name === 'clock'}<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>
  {:else if name === 'pin'}<path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>
  {:else if name === 'rocket'}<path d="M14.5 4.5c2.8-2 5.1-1.8 5.1-1.8s.2 2.3-1.8 5.1l-4.1 4.1-3.5-3.5 4.3-3.9Z"/><path d="m10.2 8.4-4.5 1.1-1.8-1.8 5.1-1.3M13.8 12l-1.1 4.5 1.8 1.8 1.3-5.1M8.9 14.7l-2.6 2.6M6.1 20.1l-.2-2.6-2.6-.2"/>
  {:else if name === 'bolt'}<path d="m13.5 2.5-8 11h6l-1 8 8-11h-6l1-8Z"/>
  {:else if name === 'ceiling'}<path d="M5 18.5h14M7 15l5-6 5 6M12 9V4M9 6l3-3 3 3"/>
  {:else if name === 'sliders'}<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="18" r="2"/>
  {:else if name === 'plane'}<path d="m3 13 18-7-7 18-2-8-9-3Z"/><path d="m12 16 3-3"/>
  {:else if name === 'search'}<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>
  {:else if name === 'check'}<path d="m5 12 4.5 4.5L19 7"/>
  {:else if name === 'edit'}<path d="m4 16.8-.8 3.9 3.9-.8L18.5 7.5a2.3 2.3 0 0 0-3.2-3.2L4 16.8Z"/><path d="m13.8 5.8 4.4 4.4"/>
  {:else if name === 'trash'}<path d="M4.5 7h15M9 7V4.5h6V7M7 7l.8 13h8.4L17 7M10 10.5v6M14 10.5v6"/>
  {:else if name === 'plus'}<path d="M12 5v14M5 12h14"/>
  {:else if name === 'filter'}<path d="M4 6h16M7 12h10M10 18h4"/>
  {:else}<path d="M12 3v18M3 12h18"/>
  {/if}
</svg>
