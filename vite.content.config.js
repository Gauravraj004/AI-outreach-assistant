import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/content/content.js"),
      name: "AIOutreachContent",
      formats: ["iife"],
      fileName: () => "content.js",
    },
    rollupOptions: {
      output: { extend: true },
    },
  },
});
