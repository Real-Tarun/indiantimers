// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://indiantimers.com',
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/dashboard'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
