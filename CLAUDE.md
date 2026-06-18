# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

会議の文字起こしテキストから、AI（Claude）が「要約・決定事項・次のアクション」を構造化抽出し、ダッシュボード風UIで表示する Next.js アプリ。Next.js (App Router) + TypeScript + Tailwind CSS。

## コマンド

```bash
npm install        # 依存関係のインストール
npm run dev        # 開発サーバー (http://localhost:3000)
npm run build      # 本番ビルド（型チェックも走る）
npm run start      # 本番サーバー
npm run lint       # ESLint
```

テストフレームワークは未導入。

## アーキテクチャ

データの流れは一方向で、APIキーの受け渡し方法が設計の核心。

1. **APIキー管理（フロント）** — ユーザーが [components/SettingsModal.tsx](components/SettingsModal.tsx) でキーを入力。[lib/useApiKey.ts](lib/useApiKey.ts) が `localStorage` に保存・読込（SSR では空文字、マウント後に読込）。キーはサーバーの `.env` ではなく **ユーザー入力キーが主**。

2. **分析リクエスト** — [app/page.tsx](app/page.tsx) が `/api/generate` に POST。キーは **リクエストヘッダー** (`x-user-api-key`) で渡す。フロントから Anthropic を直接叩かず、必ず Route Handler を経由する（キー露出・CORS 回避）。

3. **AI呼び出し（サーバー）** — [app/api/generate/route.ts](app/api/generate/route.ts) がヘッダーからキーを取り出し `new Anthropic({ apiKey })` を初期化。`output_config.format`（Structured Outputs / JSON Schema）で型安全な JSON を返させ、最初の text ブロックを `JSON.parse` する。ヘッダーにキーが無い場合のみ `process.env.ANTHROPIC_API_KEY` にフォールバック。

4. **結果表示** — [components/ResultTabs.tsx](components/ResultTabs.tsx) が「要約」「タスク一覧」タブで描画。

### 重要な制約・規約

- **APIキーの通信経路を変えないこと。** フロント → ヘッダー → Route Handler → `new Anthropic({ apiKey })` の流れが要件。フロントから直接 SDK を呼ぶ実装にしてはいけない。
- **AIの出力契約は2か所で同期する。** [lib/types.ts](lib/types.ts) の `AnalysisResult` と、[app/api/generate/route.ts](app/api/generate/route.ts) の `ANALYSIS_SCHEMA` は 1:1 で対応。片方を変えたら両方変える。
- **JSON Schema の制約に注意。** Structured Outputs では `minItems`/`maxItems` 等が使えない。「要約は3行」のような要件はスキーマではなく `SYSTEM_PROMPT` で指示する。
- **モデルIDは [lib/constants.ts](lib/constants.ts) の `MODEL` に集約**（現在 `claude-opus-4-8`）。Anthropic SDK 利用時は `claude-api` スキルの規約に従う（adaptive thinking 等／`budget_tokens` は使わない）。
- **Route Handler は `runtime = "nodejs"`** が必須（Anthropic SDK は Edge 非対応）。
- 共有定数（`localStorage` キー名、ヘッダー名、モデル名）は [lib/constants.ts](lib/constants.ts) に置く。

### Anthropic API を扱う際

このリポジトリは Anthropic SDK (`@anthropic-ai/sdk`) を使用する。モデルID・JSON Mode・SDK の使い方を変更・追加する際は、推測せず `claude-api` スキルのドキュメントを参照すること。
