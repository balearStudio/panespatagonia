// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Publicado por ahora en la URL por defecto de GitHub Pages:
// https://balearstudio.github.io/panespatagonia
//
// Para pasarlo al dominio propio: site: 'https://panespatagonia.com',
// borra `base`, y añade un fichero public/CNAME con "panespatagonia.com".
export default defineConfig({
  site: 'https://balearstudio.github.io',
  base: '/panespatagonia',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    // Las fotos se optimizan en build; no hace falta servicio externo.
    responsiveStyles: true,
  },
});
