import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: '200.html'
    }),
    alias: {
      $core: 'src/lib/core',
      $data: 'src/lib/data',
      $ui: 'src/lib/ui'
    }
  }
};

export default config;

