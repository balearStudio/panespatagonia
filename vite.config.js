import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Publicado en la URL por defecto de GitHub Pages:
// https://balearstudio.github.io/panespatagonia/
//
// Para pasarlo al dominio propio: pon base en "/", crea public/CNAME con
// "panespatagonia.com" y configura el dominio en Settings -> Pages.
export default defineConfig({
  base: "/panespatagonia/",
  plugins: [react()],
});
