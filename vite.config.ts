import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

import { resolveSiteUrlOrFail } from "./scripts/site-url.mjs";

/**
 * index.html の __SITE_URL__ を実際の公開 URL に差し替える。
 *
 * 公開 URL が決められないときは、canonical や og:url など「絶対 URL が要る」
 * タグを丸ごと落とす。間違った URL を出すくらいなら、出さないほうが安全なため
 * （canonical が他人のサイトを指すと検索結果から落ちる）。
 *
 * プレースホルダに %VITE_% 形式を使わないのは、Vite 標準の env 置換が
 * 先に走って警告を出し、.env の値との食い違いも生むため。
 */
function siteUrlPlugin(): Plugin {
  const siteUrl = resolveSiteUrlOrFail();

  return {
    name: "pylabo-site-url",
    transformIndexHtml(html) {
      if (!siteUrl) {
        return html.replace(/[ \t]*<!--SITE_URL_ONLY-->[\s\S]*?<!--\/SITE_URL_ONLY-->\n?/g, "");
      }
      return html
        .replaceAll("__SITE_URL__", siteUrl)
        .replaceAll("<!--SITE_URL_ONLY-->\n", "")
        .replaceAll("<!--/SITE_URL_ONLY-->\n", "");
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
