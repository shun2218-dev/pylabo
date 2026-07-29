/** scripts/ の .mjs をテストから型付きで import するための宣言。 */
declare module "*/scripts/pyodide-packages.mjs" {
  export const WANTED: string[];
}
