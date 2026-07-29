/** scripts/ の .mjs をテストから型付きで import するための宣言。 */

declare module "*/scripts/pyodide-packages.mjs" {
  export const WANTED: string[];
}

declare module "*/scripts/site-url.mjs" {
  type Env = Record<string, string | undefined>;
  export function resolveSiteUrl(env?: Env): string | null;
  export function resolveSiteUrlOrFail(env?: Env): string | null;
}
