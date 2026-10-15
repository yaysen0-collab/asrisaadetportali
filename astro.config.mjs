import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';

// Single place for the public site address. Change site.config.json (or set the
// SITE_URL environment variable in Vercel) when the custom domain goes live.
const siteConfig = JSON.parse(readFileSync(new URL('./site.config.json', import.meta.url), 'utf8'));
const site = (process.env.SITE_URL || siteConfig.siteUrl).replace(/\/+$/, '');

export default defineConfig({
  site,
  output: 'static',
  build: {
    // Keep the existing .html URLs so old links and Google canonicals stay valid.
    format: 'file',
  },
  trailingSlash: 'never',
});
