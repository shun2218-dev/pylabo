/**
 * ブラウザ内の Python に同梱する追加パッケージ。
 *
 * ここに書いたものと、その依存関係の wheel が public/pyodide/ に置かれる。
 * コースのレッスンが指定できる packages は、この一覧に含まれるものだけ。
 * （src/__tests__/registry.test.ts が両者の一致を検査している）
 */
export const WANTED = ["numpy", "pandas", "matplotlib", "pytest", "coverage", "mypy"];

/**
 * Pyodide の配布物に無いが、上の WANTED を動かすのに要る wheel。
 *
 * mypy は Pyodide が wheel を配っているものの、pyodide-lock.json の depends が
 * librt しか書いておらず、実際には mypy_extensions と pathspec を import する
 * （typing-extensions は配布物にあるので WANTED 側の解決で足りる）。
 * この 2 つは配布物に無いため、PyPI から取ってくるしかない。
 *
 * 取得元が違うだけで、扱いは配布物の wheel と同じ。sha256 を確かめてから
 * public/pyodide/ に置き、配信は自前の静的ファイルで行う（実行時に外部へ
 * 取りに行かない）。版を上げるときは sha256 も PyPI の値に更新すること。
 */
export const EXTRA_WHEELS = [
  {
    // 名前は lock の流儀（PEP 503 の正規化）に合わせる。wheel のファイル名は _ のまま
    name: "mypy-extensions",
    version: "1.1.0",
    file_name: "mypy_extensions-1.1.0-py3-none-any.whl",
    url: "https://files.pythonhosted.org/packages/79/7b/2c79738432f5c924bef5071f933bcc9efd0473bac3b4aa584a6f7c1c8df8/mypy_extensions-1.1.0-py3-none-any.whl",
    sha256: "1be4cccdb0f2482337c4743e60421de3a356cd97508abadd57d47403e94f5505",
    imports: ["mypy_extensions"],
  },
  {
    name: "pathspec",
    version: "1.1.1",
    file_name: "pathspec-1.1.1-py3-none-any.whl",
    url: "https://files.pythonhosted.org/packages/f1/d9/7fb5aa316bc299258e68c73ba3bddbc499654a07f151cba08f6153988714/pathspec-1.1.1-py3-none-any.whl",
    sha256: "a00ce642f577bf7f473932318056212bc4f8bfdf53128c78bbd5af0b9b20b189",
    imports: ["pathspec"],
  },
];

/**
 * pyodide-lock.json の depends に足りないぶんを補う。
 *
 * loadPackage("mypy") だけで動くようにするためのもの。ここに書いた名前が
 * public/pyodide/pyodide-lock.json の depends に足される（fetch:packages）。
 */
export const EXTRA_DEPENDS = {
  mypy: ["typing-extensions", "mypy-extensions", "pathspec"],
};
