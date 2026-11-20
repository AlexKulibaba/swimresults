import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { samplesPlugin } from "./dev/samplesPlugin";

export default defineConfig({
  plugins: [react(), samplesPlugin(fileURLToPath(new URL("./samples", import.meta.url)))],
});
