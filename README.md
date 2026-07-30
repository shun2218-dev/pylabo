# Pylabo（パイラボ）

**ブラウザだけで動く Python 学習アプリ**です。解説を読み、その場でコードを書いて実行し、自動採点で理解を確かめながら進められます。

名前は *Python Laboratory* から。読み・書き・実行を一か所で試せる「実験室」を目指しています。

Python は [Pyodide](https://pyodide.org/)（CPython を WebAssembly に移植したもの）をアプリに同梱して動かしています。**学習者側に Python のインストールは不要**で、実行時に外部 CDN へ取りに行くこともありません。

## できること

- **目的別のコース制** — 現在 5 コース / 全 52 レッスン。追加予定のコースも一覧に表示されます
- **その場で実行** — 解説中のコードはすべて編集して実行できる
- **自動採点** — 演習を書いて「採点する」を押すと、チェック項目ごとに合否が出る
- **pandas / matplotlib が動く** — グラフはそのままページ内に表示される
- **進捗と書きかけコードの自動保存** — localStorage に保存され、次に開いたとき続きから戻れる
- **ダーク / ライトテーマ**

## コース一覧

### 公開中

| コース | レベル | 内容 |
|---|---|---|
| Python の基本文法 | 入門 | 変数・条件分岐・リスト・辞書・関数・短く書く記法・内包表記・例外・クラス（17 レッスン） |
| データ分析・集計 | 中級 | 素の Python での集計 → pandas → groupby と可視化 → 売上レポート（10 レッスン） |
| Web/API・自動化 | 中級 | pathlib・CSV/JSON・正規表現・日時・HTTP → ログ集計ツール（7 レッスン） |
| アプリ開発（FastAPI） | 実践 | ルーティングと検証を自作 → FastAPI で書き直す → TODO API（6 レッスン） |
| テストと品質 | 実践 | assert → pytest → parametrize / fixture → モックとカバレッジ → TDD と回帰テスト（12 レッスン） |

コースは互いに独立しています。どこから始めても構いません。

### 追加予定

型ヒントと静的解析（mypy・ruff）／データベースと SQL／非同期処理と並行実行／環境とパッケージング／CLI ツール開発

追加予定のコースはホーム画面に非活性の状態で並び、収録予定の内容が確認できます。公開時は `src/courses/registry.ts` の 1 エントリを差し替えるだけで選択可能になります。

優先順位と未採用の候補は [docs/コースロードマップ.md](docs/コースロードマップ.md) にまとめています。

## 動かす

```bash
npm install
```

```bash
npm run dev
```

`http://localhost:5173` を開いてください。

> `npm install` の後処理で、Pyodide 本体（約 12MB）を `node_modules` から `public/pyodide/` へコピーし、pandas / matplotlib / pytest などの wheel（約 19MB）を Pyodide 公式配布物から取得します。**初回のみネットワークが必要で、以降はすべてローカルから配信されます。** 取得したファイルは sha256 で検証しています。

### そのほかのコマンド

```bash
npm run build
```

```bash
npm run preview
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run verify:exercises
```

`test` は Vitest によるユニットテストです（ルーティング、進捗の保存、出力の解析、コースデータの整合性など）。

`verify:exercises` は、**すべての演習について「解答例をそのまま実行したら採点を通るか」**を手元の python3 で確かめます。期待値の書き間違いや、解答例だけでは動かない（前提の変数が抜けている）不備を検出できます。pandas などが手元に無い場合、その演習は読み飛ばされます。

wheel の取得だけをやり直したいときは `npm run fetch:packages`、Pyodide 本体のコピーだけなら `npm run sync:pyodide` です。

## 技術構成

| 領域 | 使っているもの |
|---|---|
| ビルド | Vite 7 |
| UI | React 19 + TypeScript（strict） |
| スタイル | SCSS（`src/styles/`） |
| エディタ | CodeMirror 6（`@uiw/react-codemirror` + `@codemirror/lang-python`） |
| アイコン | lucide-react（すべて SVG。絵文字は使っていません） |
| Markdown | markdown-it + highlight.js |
| Python 実行 | Pyodide（Web Worker 上で実行） |

依存はすべて npm 管理で、実行時に外部 CDN を参照しません。

### 読み込みの分割

初期表示に必要ないものは分けてあります。

| チャンク | 内容 | 読み込まれるタイミング |
|---|---|---|
| `index` + `vendor-react` | ホーム画面 | 最初 |
| `vendor-editor` / `vendor-markdown` | CodeMirror / markdown-it | コースを開いたとき |
| `basics` / `data-analysis` / … | 各コースの本文 | そのコースを開いたとき |

コースカードにポインタが乗った時点で本文の先読みを始めるため、実際にはクリック後の待ちはほとんどありません。Pyodide（約 12MB）もホーム画面では読み込まず、コースを開いた時点で起動を始めます。

#### エディタのチャンクをこれ以上削らない理由

`vendor-editor`（CodeMirror）は圧縮後 159KB あり、チャンクの中では最大です。ただしこれはコース画面でのみ読み込まれ、**同じ画面が同時に取得する Pyodide ランタイム（約 12MB）の約 1.3%** にすぎません。実測でも、コースを開いてからエディタが出るまで 0.34 秒、Python が使えるようになるまで 1.66 秒（localhost）で、体感を決めているのは後者です。

軽量なエディタに置き換えれば 150KB ほど減りますが、行番号・Python の構文ハイライト・自動インデントを失います。学習アプリの中心がコードを書く体験である以上、割に合わないと判断しています。

## ディレクトリ構成

```
src/
├── main.tsx / App.tsx        アプリの入口とルーティング
├── types.ts                  コースデータの型定義
├── icons.tsx                 使用アイコンの集約
├── components/               画面（ホーム・サイドバー・レッスン・コードブロック…）
├── lib/
│   ├── pyodide.worker.ts     Python を実行する Web Worker
│   ├── python-helpers.ts     Python 側へ足すヘルパー（run_pytest など）
│   ├── runner.ts             ワーカーとのやりとりを Promise にまとめる
│   ├── protocol.ts           ワーカーとのメッセージ定義
│   ├── markdown.ts           本文のレンダリング
│   ├── storage.ts            進捗・下書き・テーマの保存
│   ├── route.ts              ハッシュルーター
│   └── course-utils.ts       コースデータのヘルパー
├── courses/
│   ├── registry.ts           ★ コース一覧（公開済み／追加予定）
│   └── basics.ts など        ★ 各コースの本文
└── styles/                   SCSS
scripts/
├── sync-pyodide.mjs            Pyodide 本体を public/ へコピー
├── fetch-pyodide-packages.mjs  wheel を取得（sha256 検証つき）
├── pyodide-packages.mjs        同梱する追加パッケージの一覧
├── pyodide-versions.mjs        Pyodide 側の Python / パッケージ版を出力（CI 用）
├── site-url.mjs                公開 URL の決定ロジック
├── generate-seo.mjs            robots.txt と sitemap.xml を生成
└── verify-exercises.mjs        全演習の解答例が採点を通るか検証
```

## 設計上のポイント

**コンテンツはデータ、UI はその表示に徹する。** レッスンは `src/courses/*.ts` に型付きのオブジェクトとして書かれており、コンポーネント側はこの型しか知りません。コースを増やすときにコンポーネントを触る必要はありません。

**一覧の情報と本文を分ける。** ホーム画面に必要なタイトル・説明・レッスン数は `registry.ts` に、本文は各コースファイルにあります。この分離がそのまま遅延読み込みと「追加予定」表示の土台になっています。

**Python はワーカーで動かす。** 学習者が無限ループを書いても UI は固まりません。「停止」ボタンでワーカーを作り直して復帰できます。

**採点は Python 側で行う。** 各演習の `tests` は、学習者のコードと同じ名前空間で実行される Python コードです。`check(条件, "説明")` を並べて書くと、そのままチェック項目の一覧として表示されます。

**pytest も本物を動かす。** 「テストと品質」コースでは、ブラウザ内の Python で実際に pytest を走らせています。エディタがファイル 1 枚なので、`run_pytest()` ヘルパーが**いま書かれているコードをそのままテストファイルとして書き出して** pytest に渡します（`src/lib/python-helpers.ts`）。失敗レポートの行番号はエディタの行と一致します。

このおかげで、テストの演習は「テストが書けたか」ではなく「**そのテストが本当にバグを捕まえられるか**」で採点できます。採点側は、わざと壊した実装に学習者のテストを当てて、落ちることを確かめています。

## 変更履歴

[CHANGELOG.md](CHANGELOG.md) を参照してください。

## コースを追加する

[docs/コースの追加方法.md](docs/コースの追加方法.md) を参照してください。追加予定として告知してから公開に切り替える手順もここにあります。

## デプロイ

完全な静的サイトなので、`npm run build` が出力する `dist/` を配信するだけで動きます。Vercel 向けの設定（`vercel.json`）は同梱済みで、リポジトリをインポートすれば追加設定なしでデプロイできます。

ハッシュルーティングを使っているため **リライト設定は不要** です。ただし Pyodide のランタイムを自前配信している都合上、学習者 1 人あたりの転送量が 15〜30MB になります。帯域の見積もり、ホスティング先ごとの制限の違い、サブパス配信の設定は [docs/デプロイ.md](docs/デプロイ.md) を参照してください。

## ブランチ運用

Git Flow に沿っています。

| ブランチ | 役割 |
|---|---|
| `main` | リリース済みの状態。タグを打つ |
| `develop` | 次のリリースに向けた統合先 |
| `feature/*` | 機能追加。`develop` から切って `develop` へマージ |
| `release/*` | リリース準備。`main` と `develop` へマージ |
| `hotfix/*` | 緊急修正。`main` から切って `main` と `develop` へ |

`feature` / `release` のマージは履歴を残すため `--no-ff` で行います。

既定ブランチは `main` です（公開時に見えるブランチであり、Vercel の本番デプロイもここから行われるため）。**feature ブランチの PR は `develop` を宛先にする**ので、`gh pr create` では宛先を明示してください。

```bash
gh pr create --base develop
```

**`main` と `develop` への直接コミットは行いません。** すべて Pull Request 経由でマージし、レビュー観点は [docs/コードレビュー観点.md](docs/コードレビュー観点.md) に定義しています。PR では GitHub Actions（[.github/workflows/ci.yml](.github/workflows/ci.yml)）が型チェック・テスト・ビルド・演習の検証を実行します。

## ブラウザで動かない Python について

ブラウザ内の Python にはいくつか制約があります（ソケット通信ができない、サーバーを起動できないなど）。該当するコード（`requests` での通信、`fastapi dev` での起動など）は **「読むだけ」のブロック**として載せ、手元で動かす手順を添えています。仕組みの理解にあたる部分は、素の Python で自作して実際に動かす構成にしています。
