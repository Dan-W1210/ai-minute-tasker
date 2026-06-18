import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { API_KEY_HEADER, MODEL } from "@/lib/constants";
import type { AnalysisResult } from "@/lib/types";

// Anthropic SDK は Node ランタイムが必要（Edge では動かない）
export const runtime = "nodejs";

/**
 * AI に返させる JSON の形（Structured Outputs）。
 * このスキーマに一致した JSON が必ず返るため、フロントで安全にパースできる。
 * 注: json_schema では minItems/maxItems などの制約は使えないため、
 *     「要約は3行」といった要件はプロンプト側で指示する。
 */
const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "array",
      description: "会議全体の要約。3行以内（最大3要素）で簡潔にまとめる。",
      items: { type: "string" },
    },
    decisions: {
      type: "array",
      description:
        "会議で確定した決定事項。1項目15文字以内の短い箇条書きで、「〜を決定」「〜に統一」など動詞で終わる形にする。",
      items: { type: "string" },
    },
    actions: {
      type: "array",
      description: "次に取るべきアクション一覧。",
      items: {
        type: "object",
        properties: {
          task: { type: "string", description: "やるべきこと" },
          assignee: { type: "string", description: "担当者。不明なら「未定」" },
          due: { type: "string", description: "期限。不明なら「未定」" },
        },
        required: ["task", "assignee", "due"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "decisions", "actions"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `あなたは優秀なビジネスアシスタントです。提供された会議の文字起こしデータから、議事録を構造化して抽出してください。

【出力ルール】
1. 「要約」(summary) は3行以内で簡潔にまとめてください。
2. 「決定事項」(decisions) は、文章ではなく【1項目15文字以内の短い箇条書き】にしてください。必ず「〜を決定」「〜に統一」など、具体的なアクション（動詞）で終わる形にしてください。議論中の案は含めないでください。
3. 「タスク」(actions) は「担当者」(assignee)「内容」(task)「期限」(due) を明確に分けて抽出してください。担当者や期限が不明な場合は「未定」と記載してください。
4. すべて日本語で出力してください。`;

export async function POST(req: NextRequest) {
  // 1. ユーザーが画面で入力し localStorage から渡されたキーを取得
  //    （無ければ開発用フォールバックとしてサーバーの環境変数を使う）
  const userKey = req.headers.get(API_KEY_HEADER)?.trim();
  const apiKey = userKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "APIキーが設定されていません。右上の設定からAPIキーを入力してください。" },
      { status: 401 },
    );
  }

  // 2. リクエストボディの検証
  let transcript: string;
  try {
    const body = (await req.json()) as { transcript?: unknown };
    if (typeof body.transcript !== "string" || body.transcript.trim() === "") {
      return NextResponse.json(
        { error: "文字起こしテキストが空です。分析するテキストを貼り付けてください。" },
        { status: 400 },
      );
    }
    transcript = body.transcript;
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  // 3. ユーザーのキーで Anthropic クライアントを初期化して呼び出し
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: ANALYSIS_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `次の会議の文字起こしを分析してください。\n\n---\n${transcript}\n---`,
        },
      ],
    });

    // output_config.format により、最初の text ブロックは必ずスキーマ準拠の JSON
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "AIから有効な応答が得られませんでした。" },
        { status: 502 },
      );
    }

    const result = JSON.parse(textBlock.text) as AnalysisResult;
    return NextResponse.json(result);
  } catch (err) {
    // SDK の型付き例外でユーザー向けメッセージに変換
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "APIキーが無効です。設定から正しいキーを入力してください。" },
        { status: 401 },
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "レート制限に達しました。しばらく待って再試行してください。" },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI APIエラー: ${err.message}` },
        { status: err.status ?? 500 },
      );
    }
    return NextResponse.json(
      { error: "予期しないエラーが発生しました。" },
      { status: 500 },
    );
  }
}
