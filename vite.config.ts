import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    // Older Android browsers (e.g. EMUI/Huawei Browser) can ship Chromium well below Vite's
    // default target, so transpile modern syntax and CSS down to Chrome 79.
    target: ["es2019", "chrome79"],
    cssTarget: "chrome79",
  },
});
