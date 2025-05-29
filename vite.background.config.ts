import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  build: {
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: resolve(process.cwd(), "src/background/background.ts"),
      output: {
        entryFileNames: "background.js",
        dir: "dist",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
    target: "es2020",
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
})
