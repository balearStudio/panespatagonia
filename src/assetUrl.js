/**
 * Prefija la base de despliegue a una ruta de /public.
 *
 * El sitio se sirve desde un subdirectorio en GitHub Pages
 * (/panespatagonia/), y Vite no reescribe las rutas absolutas que viven
 * dentro de cadenas de JavaScript: solo toca los imports, el CSS y los
 * atributos de index.html. Sin esto, "/uploads/x.png" apuntaría a la raíz
 * del dominio y daría 404.
 */
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
