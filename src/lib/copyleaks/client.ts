/**
 * Copyleaks AI検出 APIクライアント
 *
 * ダブルチェックモードで使用。
 * 1段階目の変換結果をCopyleaksに送信し、
 * AIと判定された箇所を特定する。
 *
 * 認証フロー:
 *   POST https://id.copyleaks.com/v3/account/login/api → Bearer Token（48時間有効）
 *
 * スキャンフロー:
 *   POST https://api.copyleaks.com/v2/writer-detector/{scanId}/check → 同期で結果返却
 */

// --- 型定義 ---

/** Copyleaks認証レスポンス */
interface CopyleaksAuthResponse {
  access_token: string;
  ".issued": string;
  ".expires": string;
}

/** スキャン結果の各セクション */
interface CopyleaksResultSection {
  /** 1=Human, 2=AI */
  classification: 1 | 2;
  probability: number;
  matches?: Array<{
    text: {
      chars: { starts: number[]; lengths: number[] };
      words: { starts: number[]; lengths: number[] };
    };
  }>;
}

/** Copyleaksスキャンレスポンス */
interface CopyleaksScanResponse {
  modelVersion: string;
  summary: {
    human: number;
    ai: number;
  };
  results: CopyleaksResultSection[];
  scannedDocument: {
    scanId: string;
    totalWords: number;
    credits: number;
    creationTime: string;
  };
}

/** Naoshi内部で使うAI検出結果 */
export interface AiDetectionResult {
  /** AI確率（0.0〜1.0） */
  aiScore: number;
  /** 人間確率（0.0〜1.0） */
  humanScore: number;
  /** AIと判定されたセクションのインデックス */
  aiSections: number[];
  /** 全セクション数 */
  totalSections: number;
  /** repair-promptに渡すためのフィードバックテキスト */
  feedbackText: string;
}

// --- トークンキャッシュ（48時間有効なのでメモリにキャッシュ） ---
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Copyleaks APIのBearerトークンを取得（キャッシュあり）
 */
async function getAccessToken(): Promise<string> {
  // キャッシュが有効ならそのまま返す（期限の5分前にリフレッシュ）
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const email = process.env.COPYLEAKS_EMAIL;
  const apiKey = process.env.COPYLEAKS_API_KEY;

  if (!email || !apiKey) {
    throw new Error("COPYLEAKS_EMAIL または COPYLEAKS_API_KEY が設定されていません");
  }

  const response = await fetch("https://id.copyleaks.com/v3/account/login/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, key: apiKey }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(`Copyleaks認証失敗 (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as CopyleaksAuthResponse;
  cachedToken = data.access_token;

  // 期限をパースしてキャッシュ
  const expiresDate = new Date(data[".expires"]);
  tokenExpiresAt = expiresDate.getTime();

  return cachedToken;
}

/**
 * テキストをCopyleaks AI検出APIでスキャンする
 *
 * @param text スキャン対象テキスト（255〜25,000文字）
 * @returns AI検出結果
 */
export async function scanForAiContent(text: string): Promise<AiDetectionResult> {
  // テキスト長のバリデーション
  if (text.length < 255) {
    // 短すぎる場合はスキャンをスキップし、デフォルト結果を返す
    return {
      aiScore: 0,
      humanScore: 1,
      aiSections: [],
      totalSections: 0,
      feedbackText: "",
    };
  }

  const token = await getAccessToken();

  // ユニークなscanIdを生成
  const scanId = `naoshi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const response = await fetch(
    `https://api.copyleaks.com/v2/writer-detector/${scanId}/check`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text,
        language: "ja",
        // sandboxモードは使わない（実際のクレジットを消費）
        sandbox: false,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(`Copyleaksスキャン失敗 (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as CopyleaksScanResponse;

  // AIと判定されたセクションを特定
  const aiSections: number[] = [];
  data.results.forEach((section, index) => {
    if (section.classification === 2) {
      aiSections.push(index);
    }
  });

  // repair-promptに渡すフィードバックテキストを生成
  const feedbackText = buildFeedbackText(data, text);

  return {
    aiScore: data.summary.ai,
    humanScore: data.summary.human,
    aiSections,
    totalSections: data.results.length,
    feedbackText,
  };
}

/**
 * Copyleaksの検出結果から、repair-promptに渡すフィードバックテキストを生成
 */
function buildFeedbackText(data: CopyleaksScanResponse, originalText: string): string {
  const aiPercentage = Math.round(data.summary.ai * 100);
  const humanPercentage = Math.round(data.summary.human * 100);

  const lines: string[] = [];
  lines.push(`## AI検出スキャン結果`);
  lines.push(`- AI確率: ${aiPercentage}%`);
  lines.push(`- 人間確率: ${humanPercentage}%`);
  lines.push(`- 全${data.results.length}セクション中、${data.results.filter(r => r.classification === 2).length}セクションがAI判定`);
  lines.push("");

  // AIと判定されたセクションの詳細
  const aiResults = data.results
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.classification === 2);

  if (aiResults.length > 0) {
    lines.push("## AIと判定された箇所");
    lines.push("以下のセクションがAI生成と判定されました。これらを中心に、より人間らしい表現に修正してください。");
    lines.push("");

    // テキストをセクション数で均等に分割して、AIセクションの該当箇所を特定
    const sectionLength = Math.ceil(originalText.length / data.results.length);
    for (const { section, index } of aiResults) {
      const start = index * sectionLength;
      const end = Math.min(start + sectionLength, originalText.length);
      const sectionText = originalText.slice(start, end);
      lines.push(`【セクション${index + 1}（AI確率: ${Math.round(section.probability * 100)}%）】`);
      lines.push(sectionText);
      lines.push("");
    }
  }

  return lines.join("\n");
}
