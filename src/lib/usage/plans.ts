// プランごとの制限定義（requirements.md 第7章・第3.4章）
//
// ■ 制限方式
//   - 無料プラン: 回数制限（300字/回 × 3回/月）
//   - 有料プラン: 月間文字数制限（1回あたり上限 + 月間合計文字数上限）
//
// ■ リセット: 全プラン共通、毎月1日 JST 0:00

export type PlanKey = "free" | "light" | "heavy_monthly" | "heavy_yearly";

// 制限の種類
export type LimitType = "count" | "chars";

export type PlanRule = {
  // 1回あたりの最大入力文字数
  maxChars: number;
  // 制限方式: count=回数ベース、chars=文字数ベース
  limitType: LimitType;
  // 月間上限（回数 or 文字数、limitType に対応）
  monthlyLimit: number;
  // 表示用ラベル
  label: string;
};

// プラン別ルール
export const PLAN_RULES: Record<PlanKey, PlanRule> = {
  free: {
    maxChars: 300,
    limitType: "count",
    monthlyLimit: 3,
    label: "無料",
  },
  light: {
    maxChars: 2000,
    limitType: "chars",
    monthlyLimit: 70_000,
    label: "ライト（週）",
  },
  heavy_monthly: {
    maxChars: 3000,
    limitType: "chars",
    monthlyLimit: 150_000,
    label: "ヘビー（月）",
  },
  heavy_yearly: {
    maxChars: 3000,
    limitType: "chars",
    monthlyLimit: 150_000,
    label: "ヘビー（年）",
  },
};

// 指定プランのルールを取得。未知のプランは free 扱い
export function getPlanRule(plan: string | null | undefined): PlanRule {
  if (plan && plan in PLAN_RULES) {
    return PLAN_RULES[plan as PlanKey];
  }
  return PLAN_RULES.free;
}

// JST は UTC+9 固定
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 今月1日 JST 0:00 を UTC Date として返す（全プラン共通のリセット起点）
export function getMonthStart(): Date {
  const now = new Date();
  // JST の現在時刻を表す「見かけ上の UTC」
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  // 当月1日 0:00 に設定
  jstNow.setUTCDate(1);
  jstNow.setUTCHours(0, 0, 0, 0);
  // UTC Date に戻す
  return new Date(jstNow.getTime() - JST_OFFSET_MS);
}
