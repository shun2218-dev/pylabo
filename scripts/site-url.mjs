/**
 * 公開先の URL を決める。ビルド（vite.config.ts）と
 * sitemap 生成（generate-seo.mjs）で同じ値を使うため、ここに集約している。
 *
 *   1. SITE_URL / VITE_SITE_URL … 自分で設定した値（最優先）
 *   2. VERCEL_PROJECT_PRODUCTION_URL … Vercel のビルド時に自動で入る
 *   3. 決められない → null
 *
 * **既定値は置かない。** 適当なドメインを埋めると、canonical や og:url に
 * 「自分のものではない URL」が黙って焼き込まれる。canonical が他人のサイトを
 * 指すと、検索結果から自分のページが落ちる。決められないときは null を返し、
 * URL に依存する出力そのものを省く。
 *
 * サブパス（例: https://user.github.io/pylabo）へ置く場合は、SITE_URL に
 * そのサブパスまで含めること。vite の base とそろえる。
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * .env ファイルを最低限だけ読む。
 * Vite の env 読み込みはクライアント向けで Node のスクリプトからは見えないため、
 * 両方で同じ値になるよう自前で読んでいる。
 */
function readEnvFiles() {
  const values = {};

  for (const name of [".env", ".env.local", ".env.production"]) {
    const file = path.join(root, name);
    if (!existsSync(file)) continue;

    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match) continue;
      values[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  }
  return values;
}

/**
 * Vercel の本番ビルドかどうか。
 * VERCEL_ENV はシステム環境変数が有効なときだけ入る。
 */
const isVercelProduction = (env) => env.VERCEL === "1" && env.VERCEL_ENV === "production";

/**
 * 公開 URL を返す。本番ビルドで決められないときは例外にする。
 *
 * Vercel の本番デプロイで URL が取れないのは、プロジェクト設定の
 * 「Enable access to System Environment Variables」が外れている場合がほとんど。
 * そのまま通すと canonical も OGP も無いサイトが黙って公開されてしまうため、
 * ここで止めて気づけるようにする。ローカルやプレビューでは警告のみ。
 */
export function resolveSiteUrlOrFail(env = process.env) {
  const url = resolveSiteUrl(env);
  if (url) return url;

  if (isVercelProduction(env)) {
    throw new Error(
      [
        "公開 URL を決められませんでした。canonical と OGP が出力されません。",
        "",
        "Vercel のプロジェクト設定 → Environment Variables で",
        "「Enable access to System Environment Variables」を有効にしてください。",
        "（それだけで VERCEL_PROJECT_PRODUCTION_URL から自動で決まります）",
        "",
        "任意のドメインを使う場合は、環境変数 SITE_URL を設定してください。",
      ].join("\n")
    );
  }

  return null;
}

/**
 * @returns 末尾のスラッシュを除いた URL。決められなければ null。
 */
export function resolveSiteUrl(env = process.env) {
  const merged = { ...readEnvFiles(), ...env };

  const explicit = merged.SITE_URL?.trim() || merged.VITE_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = merged.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return null;
}
