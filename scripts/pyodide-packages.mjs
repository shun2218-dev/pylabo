/**
 * ブラウザ内の Python に同梱する追加パッケージ。
 *
 * ここに書いたものと、その依存関係の wheel が public/pyodide/ に置かれる。
 * コースのレッスンが指定できる packages は、この一覧に含まれるものだけ。
 * （src/__tests__/registry.test.ts が両者の一致を検査している）
 */
export const WANTED = ["numpy", "pandas", "matplotlib"];
