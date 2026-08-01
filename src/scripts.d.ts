/** scripts/ の .mjs をテストから型付きで import するための宣言。 */

declare module "*/scripts/pyodide-packages.mjs" {
  export const WANTED: string[];
}

/** index.html を文字列として読むための宣言（?raw は Vite の機能）。 */
declare module "*.html?raw" {
  const content: string;
  export default content;
}

declare module "*/scripts/site-url.mjs" {
  type Env = Record<string, string | undefined>;
  export function resolveSiteUrl(env?: Env): string | null;
  export function resolveSiteUrlOrFail(env?: Env): string | null;
}
