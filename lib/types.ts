/**
 * AI が会議の文字起こしから抽出する構造化データ。
 * Route Handler の Structured Outputs スキーマと 1:1 で対応する。
 */
export interface ActionItem {
  /** 次のアクション（やるべきこと） */
  task: string;
  /** 担当者。不明な場合は "未定" */
  assignee: string;
  /** 期限。不明な場合は "未定" */
  due: string;
}

export interface AnalysisResult {
  /** 会議の要約（3行） */
  summary: string[];
  /** 決定事項（箇条書き） */
  decisions: string[];
  /** 次のアクション一覧 */
  actions: ActionItem[];
}

/** /api/generate へ送るリクエストボディ */
export interface GenerateRequest {
  transcript: string;
}

/** /api/generate のエラーレスポンス */
export interface ApiError {
  error: string;
}
