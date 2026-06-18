# AI議事録・タスク自動抽出

会議の文字起こしテキストを貼り付けると、AI（Claude）が **要約（3行）・決定事項・次のアクション** を構造化して抽出し、ダッシュボード風のUIで表示するアプリです。

Next.js (App Router) + TypeScript + Tailwind CSS で構築しています。

## 主な機能

- 文字起こしテキストの貼り付けエリアと「AIで分析」ボタン
- 「要約」タブ（要約 + 決定事項）と「タスク一覧」タブ（担当者・期限つきテーブル）
- 右上の「設定」からユーザー自身の Anthropic API キーを入力 → `localStorage` に保存（リロードしても保持）
- APIキー未入力時のバリデーション（トースト表示）

## APIキーの通信設計

セキュリティとコスト最適化のため、APIキーは次のように扱います。

1. ユーザーがUIで入力したキーをブラウザの `localStorage` に保存。
2. 分析時はフロントから直接 Anthropic を叩かず、Next.js の Route Handler (`/api/generate`) を経由。
3. フロント → Route Handler へは、リクエストヘッダー (`x-user-api-key`) にキーを乗せて渡す。
4. サーバー側（Route Handler 内）で `new Anthropic({ apiKey: ユーザーのキー })` を初期化して通信。

これにより、フロントエンドでのAPIキー露出と CORS エラーを回避します。

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開き、右上の「設定」から Anthropic API キーを入力してください。

## スクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint 実行 |
