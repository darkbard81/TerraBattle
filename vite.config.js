import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const buildInput = {
  main: resolve(__dirname, "index.html"),
};

const editorEntryPath = resolve(__dirname, "editor/index.html");

if (existsSync(editorEntryPath)) {
  buildInput.editor = editorEntryPath;
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  build: {
    rollupOptions: {
      input: buildInput,
    },
  },
});
