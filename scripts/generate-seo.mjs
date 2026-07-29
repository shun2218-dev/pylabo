/**
 * robots.txt と sitemap.xml を dist/ に生成する。
 *
 *   node scripts/generate-seo.mjs
 *
 * サイトの URL の決め方は scripts/site-url.mjs を参照。
 * 決められないときは sitemap.xml を作らない。絶対 URL が必須の形式なので、
 * 当てずっぽうの URL を書くくらいなら出さないほうが安全。
 *
 * このアプリはハッシュルーティング（/#/c/...）なので、検索エンジンから見える
 * ページは「/」ひとつだけ。sitemap もそれに合わせて 1 件だけにしている。
 */

import { execFile } from "node:child_process";
import { readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { resolveSiteUrl } from "./site-url.mjs";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const siteUrl = resolveSiteUrl();

try {
  await readdir(dist);
} catch {
  console.error("[generate-seo] dist/ がありません。先に vite build を実行してください。");
  process.exit(1);
}

/* lastmod は「コンテンツを最後に変更したコミットの日付」を使う。
   ビルド日時にすると、中身が変わっていなくても毎回更新を伝えることになる。 */
async function lastModified() {
  try {
    const { stdout } = await run(
      "git",
      ["log", "-1", "--format=%cs", "--", "src", "index.html"],
      { cwd: root }
    );
    const date = stdout.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch {
    // 浅いクローンや git の無い環境では諦める（lastmod は任意項目）
    return null;
  }
}

const sitemapPath = path.join(dist, "sitemap.xml");

if (!siteUrl) {
  console.warn(
    "[generate-seo] 公開 URL が決められないため sitemap.xml は作りません。\n" +
      "               必要なら SITE_URL を設定してください（例: SITE_URL=https://example.com npm run build）。"
  );

  await rm(sitemapPath, { force: true });
  await writeFile(path.join(dist, "robots.txt"), "User-agent: *\nAllow: /\n", "utf8");
  process.exit(0);
}

const lastmod = await lastModified();

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

await writeFile(path.join(dist, "robots.txt"), robots, "utf8");
await writeFile(sitemapPath, sitemap, "utf8");

console.log(`[generate-seo] robots.txt と sitemap.xml を生成しました（${siteUrl}）`);
