import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

import { resolveSiteUrl } from "./scripts/site-url.mjs";

/**
 * index.html の %VITE_SITE_URL% を実際の公開 URL に差し替える。
 * Vite 標準の env 置換は .env ファイルの有無に左右されるため、
 * 未設定でもプレースホルダのまま出さないよう自前で処理している。
 */
function siteUrlPlugin(): Plugin {
  const siteUrl = resolveSiteUrl();
  return {
    name: "pylabo-site-url",
    transformIndexHtml(html) {
      return html.replaceAll("%VITE_SITE_URL%", siteUrl);
    },
  };
}

export default defineConfig({
  plugins: [react(), siteUrlPlugin()],
  // Pyodide 本体は public/pyodide/ から配信する（バンドル対象にしない）
  optimizeDeps: { exclude: ["pyodide"] },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        /* 初期表示に要らないものを分ける。
           ・コース本文はコースを開いたときに読み込む（registry.ts の動的 import）
           ・エディタと Markdown はホーム画面では使わない */
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return "vendor-react";
          }
          if (id.includes("codemirror") || id.includes("@lezer")) {
            return "vendor-editor";
          }
          if (id.includes("markdown-it") || id.includes("highlight.js")) {
            return "vendor-markdown";
          }
        },
      },
    },
  },
  worker: {
    format: "es",
  },
});
