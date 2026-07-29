# 変更履歴

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/)、
バージョンは [セマンティック バージョニング](https://semver.org/lang/ja/) に従います。

## [1.0.0] - 2026-07-30

初回リリース。

### 学習コンテンツ

- **Python の基本文法**（入門・17 レッスン） — 変数から条件分岐・コレクション・関数・短く書く記法・内包表記・例外・クラスまで
- **データ分析・集計**（中級・10 レッスン） — 素の Python での集計から pandas、groupby、matplotlib による可視化、売上レポートの作成まで
- **Web/API・自動化**（中級・7 レッスン） — pathlib・CSV/JSON・正規表現・日時・HTTP を扱い、ログ集計ツールを仕上げる
- **アプリ開発（FastAPI）**（実践・6 レッスン） — ルーティングと入力検証を自作して仕組みを理解し、FastAPI で書き直す

追加予定として、テストと品質・型ヒントと静的解析・データベースと SQL・非同期処理・環境とパッケージング・CLI ツール開発の 6 コースを一覧に掲載しています。

### アプリ

- Pyodide を同梱し、インストールなしでブラウザ内の Python を実行
- 解説中のコードはその場で編集・実行できる
- 演習は Python 側の `check()` による自動採点。チェック項目ごとに合否を表示
- pandas / matplotlib のグラフをページ内に表示
- 進捗と書きかけコードを localStorage に保存
- Python は Web Worker で実行し、無限ループも「停止」で復帰できる
- ダーク / ライトテーマ

### 基盤

- 依存はすべて npm 管理。実行時に外部 CDN を参照しない
- ホーム画面の初期読み込みを分割（コース本文・エディタ・Markdown は開いたときに読み込む）
- Vitest によるユニットテスト、および全演習の解答例が採点を通るかの検証スクリプト
- GitHub Actions で型チェック・テスト・ビルド・演習検証を実行
- canonical / OGP / sitemap を出力。公開 URL は Vercel の環境変数から自動判定

[1.0.0]: https://github.com/shun2218-dev/pylabo/releases/tag/v1.0.0
