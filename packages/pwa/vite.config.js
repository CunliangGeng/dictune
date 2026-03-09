import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/dictune/",
  optimizeDeps: { exclude: ["@mlc-ai/web-llm"] },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "web-llm": ["@mlc-ai/web-llm"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "logo.svg", "wordmark.svg"],
      manifest: {
        name: "Dictune — Find Your Best Dictation Tool",
        short_name: "Dictune",
        description:
          "Generate texts, use different dictation tools, and compare results to find which transcriber works best for you",
        theme_color: "#2E3440",
        background_color: "#ECEFF4",
        start_url: "/dictune/",
        scope: "/dictune/",
        display: "standalone",
        orientation: "any",
        categories: ["education", "productivity"],
        icons: [
          {
            src: "logo.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
          {
            src: "logo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Cache Google Fonts webfont files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
