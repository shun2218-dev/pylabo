/**
 * 公開先の URL を決める。ビルド（vite.config.ts）と
 * sitemap 生成（generate-seo.mjs）で同じ値を使うため、ここに集約している。
 *
 *   1. VITE_SITE_URL … 自分で設定した値（最優先）
 *   2. VERCEL_PROJECT_PRODUCTION_URL … Vercel のビルド時に自動で入る
 *   3. 既定値
 */

export const DEFAULT_SITE_URL = "https://pylabo.vercel.app";

export function resolveSiteUrl(env = process.env) {
  const explicit = env.VITE_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return DEFAULT_SITE_URL;
}
