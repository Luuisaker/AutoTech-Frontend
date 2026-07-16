import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
      prerender: { enabled: false },
    }),
    nitro({
      preset: "vercel",
      vercel: {
        entryFormat: "node",
      },
    }),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
});
