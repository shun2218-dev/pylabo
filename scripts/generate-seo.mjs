/**
 * robots.txt と sitemap.xml を dist/ に生成する。
 *
 *   node scripts/generate-seo.mjs
 *
 * サイトの URL の決め方は scripts/site-url.mjs を参照。
 *
 * このアプリはハッシュルーティング（/#/c/...）なので、検索エンジンから見える
 * ページは「/」ひとつだけ。sitemap もそれに合わせて 1 件だけにしている。
 */

import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveSiteUrl } from "./site-url.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const siteUrl = resolveSiteUrl();

try {
  await readdir(dist);
} catch {
  console.error("[generate-seo] dist/ がありません。先に vite build を実行してください。");
  process.exit(1);
}

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

/* 更新日は「ビルドした日」ではなく、内容の更新に合わせて手で上げる。
   ビルドのたびに変わると、検索エンジンに無意味な更新を伝えることになるため。 */
const LAST_MODIFIED = "2026-07-30";

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${LAST_MODIFIED}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

await writeFile(path.join(dist, "robots.txt"), robots, "utf8");
await writeFile(path.join(dist, "sitemap.xml"), sitemap, "utf8");

console.log(`[generate-seo] robots.txt と sitemap.xml を生成しました（${siteUrl}）`);
