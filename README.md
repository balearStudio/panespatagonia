# Panes Patagonia

Web de muestra para Panes Patagonia — obrador artesanal de pan de hamburguesa
para hostelería.

Publicada en
**<https://balearstudio.github.io/panespatagonia>** (todavía no en el dominio
definitivo).

Sitio estático construido con [Astro](https://astro.build). Una sola página, sin
backend, con una animación en `<canvas>` que cuece un pan a medida que se
hace scroll.

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genera /dist
npm run preview  # sirve /dist en local
```

Requiere Node 20 o superior.

## Estructura

```
src/
  assets/            fotos y logo (Astro las optimiza a WebP en el build)
  components/
    BreadRail.astro  el pan animado que hace de barra de scroll
    Header, Hero, Product, Pillars, Obrador, Contacto, Footer
  layouts/Base.astro  <head>, SEO, datos estructurados
  scripts/bread.js    la animación del pan, dibujada por código
  styles/global.css   tokens de color, tipografía y utilidades
public/              favicon, logo, og.jpg, robots.txt, CNAME
```

## La animación del pan

`src/scripts/bread.js` dibuja el pan entero por código: no hay imágenes ni
vídeo. Un progreso de 0 a 1 controla volumen, color de corteza, brillo del
huevo, sésamo, vapor y calor del horno.

`BreadRail.astro` lo usa como barra de scroll: un bollo pequeño fijo sobre la
web que baja por un raíl a la derecha mientras se hornea. El progreso va desde
el final del hero hasta el inicio de contacto, así que el pan queda listo justo
al llegar al formulario.

- **Ritmo de las fases**: los `smoothstep(inicio, fin, p)` de `render()`.
- **Tramo de horneado**: `start` y `end` en el script de `BreadRail.astro`.
- **Tamaño del pan**: `width`/`height` de `.rail__thumb`. Si lo agrandas, sube
  también el margen reservado en `global.css` (ver abajo).

A partir de 1200px el raíl vive en el margen derecho, y `global.css` reserva
ese espacio con un `padding-right` sobre `main .wrap` para que nunca se solape
con el contenido. Por debajo, el pan pasa a ser una insignia en la esquina
inferior derecha. Con `prefers-reduced-motion` se oculta: es decorativo.

## Formulario de contacto

Al ser un sitio estático, el formulario abre el gestor de correo del visitante
con los campos ya rellenados. Para recibir los mensajes en un buzón sin que el
usuario salga de la web, da de alta un endpoint (por ejemplo
[Formspree](https://formspree.io)) y añádelo como `action` del `<form>` en
`src/components/Contacto.astro`; el script detecta el `action` y se aparta.

## Despliegue

`.github/workflows/deploy.yml` compila y publica en GitHub Pages con cada push
a `main`. Hay que activarlo una vez en **Settings → Pages → Source: GitHub
Actions**.

Como se sirve desde un subdirectorio, `astro.config.mjs` lleva
`base: '/panespatagonia'`. Para pasarlo al dominio definitivo:

1. En `astro.config.mjs`: `site: 'https://panespatagonia.com'` y quita `base`.
2. Crea `public/CNAME` con una línea: `panespatagonia.com`.
3. Actualiza la URL del sitemap en `public/robots.txt`.
4. Apunta el DNS del dominio a GitHub Pages y configúralo en
   **Settings → Pages → Custom domain**.
